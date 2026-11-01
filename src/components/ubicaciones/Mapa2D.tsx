import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent, WheelEvent } from "react";
import {
  Archive,
  ArrowLeftRight,
  Box,
  Building2,
  Layers,
  MapPin,
  Shuffle,
  Warehouse,
} from "lucide-react";
import type { MapaVista } from "@/hooks/useMapa2D";
import type { StockVisualSummary } from "@/hooks/useStockVisual";
import type {
  MapaGrupoLayout,
  MapaPasilloLayout,
  MapaSeccionLayout,
  MapaTipoUbicacion,
  MapaUbicacion,
} from "./mapa2d-layout";
import { getMapa2DLayout } from "./mapa2d-layout";
export type { MapaProducto, MapaTipoUbicacion, MapaUbicacion } from "./mapa2d-layout";

interface Mapa2DProps {
  locations: MapaUbicacion[];
  summaries: Map<string, StockVisualSummary>;
  selectedLocationId: string | null;
  centeredLocationId: string | null;
  highlightedLocationId: string | null;
  hasSearchQuery: boolean;
  zoom: number;
  pan: { x: number; y: number };
  view: MapaVista;
  sectionId: string | null;
  onZoom: (direction: 1 | -1) => void;
  onPanChange: (pan: { x: number; y: number }) => void;
  onSelect: (location: MapaUbicacion) => void;
  onManage: (location: MapaUbicacion) => void;
}

const TYPE_LABELS: Record<MapaTipoUbicacion, string> = {
  seccion: "Sección",
  pasillo: "Pasillo",
  reserva: "Reserva",
  armario: "Armario",
  alto: "Alto",
  caja: "Caja",
  cross: "Cross / tránsito",
};

const GROUP_HEADER_HEIGHT = 42;

const STOCK_CLASSES: Record<StockVisualSummary["nivel"], string> = {
  normal: "fill-emerald-100 stroke-emerald-500 dark:fill-emerald-950 dark:stroke-emerald-700",
  medio: "fill-amber-100 stroke-amber-500 dark:fill-amber-950 dark:stroke-amber-700",
  critico: "fill-rose-100 stroke-rose-500 dark:fill-rose-950 dark:stroke-rose-700",
  vacio: "fill-slate-100 stroke-slate-400 dark:fill-slate-800 dark:stroke-slate-600",
  inactivo: "fill-slate-200 stroke-slate-500 dark:fill-slate-700 dark:stroke-slate-500",
};

const TYPE_CLASSES: Partial<Record<MapaTipoUbicacion, string>> = {
  reserva: "fill-amber-100 stroke-amber-500 dark:fill-amber-950 dark:stroke-amber-700",
  cross: "fill-purple-100 stroke-purple-500 dark:fill-purple-950 dark:stroke-purple-700",
  caja: "fill-rose-100 stroke-rose-500 dark:fill-rose-950 dark:stroke-rose-700",
};

export function LocationIcon({ type }: { type: MapaTipoUbicacion }) {
  const className = "h-3.5 w-3.5";
  if (type === "seccion") return <Building2 className={className} />;
  if (type === "pasillo") return <ArrowLeftRight className={className} />;
  if (type === "armario") return <Archive className={className} />;
  if (type === "alto") return <Layers className={className} />;
  if (type === "cross") return <Shuffle className={className} />;
  if (type === "reserva") return <Warehouse className={className} />;
  if (type === "caja") return <Box className={className} />;
  return <MapPin className={className} />;
}

function truncateText(text: string, width: number, fontSize: number): string {
  const maxCharacters = Math.max(4, Math.floor(width / (fontSize * 0.58)));
  if (text.length <= maxCharacters) return text;
  return `${text.slice(0, maxCharacters - 1).trimEnd()}…`;
}

function locationTooltip(
  location: MapaUbicacion,
  locationsById: Map<string, MapaUbicacion>,
  summary: StockVisualSummary | undefined,
) {
  if (location.padreId && location.lateral) {
    const parent = locationsById.get(location.padreId);
    if (parent?.tipo === "pasillo") {
      const side = location.lateral.toLocaleLowerCase() === "izquierda" ? "Izquierdo" : "Derecho";
      const aisleName = parent.codigo || parent.nombre;
      const aisleLabel = /^pasillo\b/i.test(aisleName) ? aisleName : `Pasillo ${aisleName}`;
      return `${location.codigo || location.nombre} - Lado ${side} del ${aisleLabel}`;
    }
  }

  const products = location.productos
    .slice(0, 3)
    .map((product) => `${product.nombre}: ${product.cantidad}`)
    .join(", ");
  return `${location.nombre} (${TYPE_LABELS[location.tipo]}) · ${summary?.total ?? 0} uds · ${summary?.productosCount ?? 0} productos${products ? ` · ${products}` : ""}`;
}

function groupHeading(group: MapaGrupoLayout): string {
  return `${group.nombre.toLocaleUpperCase()} (${group.ubicaciones.length} ${group.ubicaciones.length === 1 ? "ubicación" : "ubicaciones"}, ${group.cantidadProductos} productos)`;
}

export function Mapa2D({
  locations,
  summaries,
  selectedLocationId,
  centeredLocationId,
  highlightedLocationId,
  hasSearchQuery,
  zoom,
  pan,
  view,
  sectionId,
  onZoom,
  onPanChange,
  onSelect,
  onManage,
}: Mapa2DProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const layout = useMemo(() => getMapa2DLayout(locations), [locations]);
  const locationsById = useMemo(
    () => new Map(locations.map((location) => [location.id, location])),
    [locations],
  );
  const visibleSections = layout.sections.filter(
    (section) => view !== "seccion" || !sectionId || section.id === sectionId,
  );

  useEffect(() => {
    if (!centeredLocationId) return;
    const node = Array.from(
      svgRef.current?.querySelectorAll<SVGGElement>("[data-location-id]") ?? [],
    ).find((element) => element.dataset["locationId"] === centeredLocationId);
    node?.scrollIntoView?.({ block: "center", inline: "center", behavior: "smooth" });
  }, [centeredLocationId]);

  const startDrag = (event: PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0 || (event.target as Element).closest("[data-mapa-ubicacion]")) return;
    dragStart.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const drag = (event: PointerEvent<SVGSVGElement>) => {
    if (!dragStart.current || !svgRef.current) return;
    const bounds = svgRef.current.getBoundingClientRect();
    const scaleX = layout.width / Math.max(bounds.width, 1);
    const scaleY = layout.height / Math.max(bounds.height, 1);
    onPanChange({
      x: dragStart.current.panX + (event.clientX - dragStart.current.x) * scaleX,
      y: dragStart.current.panY + (event.clientY - dragStart.current.y) * scaleY,
    });
  };

  const stopDrag = (event: PointerEvent<SVGSVGElement>) => {
    dragStart.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleWheel = (event: WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    onZoom(event.deltaY < 0 ? 1 : -1);
  };

  const renderNode = (
    location: MapaUbicacion,
    x: number,
    y: number,
    width: number,
    height: number,
    options: {
      label?: string;
      centered?: boolean;
      aisle?: boolean;
      productCount?: number;
      totalUnits?: number;
    } = {},
  ) => {
    const summary = summaries.get(location.id);
    const selected = selectedLocationId === location.id;
    const highlighted = highlightedLocationId === location.id;
    const dimmed = hasSearchQuery && !highlighted;
    const fillClass = options.aisle
      ? "fill-slate-100 stroke-slate-300 dark:fill-slate-700 dark:stroke-slate-500"
      : (TYPE_CLASSES[location.tipo] ??
        (summary
          ? STOCK_CLASSES[summary.nivel]
          : "fill-slate-100 stroke-slate-400 dark:fill-slate-800 dark:stroke-slate-600"));
    const textClass =
      location.tipo === "reserva"
        ? "fill-amber-950 dark:fill-amber-100"
        : location.tipo === "cross"
          ? "fill-purple-950 dark:fill-purple-100"
          : location.tipo === "caja"
            ? "fill-rose-950 dark:fill-rose-100"
            : options.aisle
              ? "fill-slate-700 dark:fill-slate-100"
              : summary
                ? "fill-slate-900 dark:fill-slate-100"
                : "fill-slate-700 dark:fill-slate-100";
    const label = options.label ?? location.nombre;
    const labelFontSize = options.aisle ? 15 : height < 42 ? 10 : 11;
    const centered = options.centered || options.aisle;
    const labelX = centered ? x + width / 2 : x + 8;
    const title = locationTooltip(location, locationsById, summary);

    return (
      <g
        key={location.id}
        data-mapa-ubicacion
        data-location-id={location.id}
        role="button"
        tabIndex={0}
        style={{ pointerEvents: "all", opacity: dimmed ? 0.25 : 1 }}
        aria-label={`${location.nombre}, ${TYPE_LABELS[location.tipo]}, ${summary?.total ?? 0} unidades`}
        aria-pressed={selected}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(location);
        }}
        onDoubleClick={(event) => {
          event.stopPropagation();
          onManage(location);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(location);
          }
        }}
        className="cursor-pointer outline-none"
      >
        <title>{title}</title>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={options.aisle ? 8 : 5}
          className={`${fillClass} transition-[opacity,stroke-width] ${
            selected || highlighted ? "stroke-amber-600 dark:stroke-amber-400" : ""
          }`}
          strokeWidth={selected ? 3 : highlighted ? 2.5 : options.aisle ? 1.5 : 1}
          strokeDasharray={selected ? "7 4" : undefined}
        />
        {options.aisle && height > width ? (
          <>
            <text
              x={x + width / 2}
              y={y + 13}
              textAnchor="middle"
              fontSize="8"
              fontWeight="600"
              className={textClass}
              pointerEvents="none"
            >
              {options.productCount ?? summary?.productosCount ?? 0} prod.
            </text>
            <text
              x={x + width / 2}
              y={y + height - 7}
              textAnchor="middle"
              fontSize="8"
              fontWeight="600"
              className={textClass}
              pointerEvents="none"
            >
              {options.totalUnits ?? summary?.total ?? 0} uds
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              className={textClass}
              pointerEvents="none"
              transform={`rotate(-90 ${x + width / 2} ${y + height / 2})`}
            >
              {truncateText(label, height - 36, 11)}
            </text>
          </>
        ) : options.aisle ? (
          <>
            <text
              x={labelX}
              y={y + 29}
              textAnchor="middle"
              fontSize={labelFontSize}
              fontWeight="600"
              className={textClass}
              pointerEvents="none"
            >
              {truncateText(label, width - 190, labelFontSize)}
            </text>
            <rect
              x={x + width - 142}
              y={y + 8}
              width="126"
              height="30"
              rx="15"
              className="fill-white stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-500"
            />
            <text
              x={x + width - 79}
              y={y + 27}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              className="fill-slate-700 dark:fill-slate-100"
              pointerEvents="none"
            >
              {options.productCount ?? summary?.productosCount ?? 0} prod. ·{" "}
              {options.totalUnits ?? summary?.total ?? 0} uds
            </text>
          </>
        ) : (
          <>
            <text
              x={labelX}
              y={y + (height > 42 ? 21 : height / 2 + 4)}
              textAnchor={centered ? "middle" : "start"}
              fontSize={labelFontSize}
              fontWeight="600"
              className={textClass}
              pointerEvents="none"
            >
              {truncateText(label, width - 16, labelFontSize)}
            </text>
            {height > 42 && (
              <text
                x={centered ? x + width / 2 : x + 8}
                y={y + 37}
                textAnchor={centered ? "middle" : "start"}
                fontSize="9"
                className={textClass}
                pointerEvents="none"
              >
                {summary?.productosCount ?? 0} prod. · {summary?.total ?? 0} uds
              </text>
            )}
          </>
        )}
      </g>
    );
  };

  const renderGroup = (group: MapaGrupoLayout, visible: boolean, perimeter = false) => {
    const groupLocations =
      view === "seccion" && sectionId
        ? group.ubicaciones.filter((location) => {
            let current: MapaUbicacion | undefined = location;
            const visited = new Set<string>();
            while (current && !visited.has(current.id)) {
              visited.add(current.id);
              if (current.tipo === "seccion") return current.id === sectionId;
              if (current.seccionId) return current.seccionId === sectionId;
              current = current.padreId ? locationsById.get(current.padreId) : undefined;
            }
            return true;
          })
        : group.ubicaciones;
    if (!visible || (groupLocations.length === 0 && !perimeter)) return null;
    const visibleGroup: MapaGrupoLayout = {
      ...group,
      ubicaciones: groupLocations,
      cantidadProductos: groupLocations.reduce(
        (total, location) => total + new Set(location.productos.map((product) => product.id)).size,
        0,
      ),
      totalUnidades: groupLocations.reduce(
        (total, location) =>
          total + location.productos.reduce((sum, product) => sum + product.cantidad, 0),
        0,
      ),
    };
    const backgroundHeight = perimeter
      ? visibleGroup.height - 4
      : Math.max(78, GROUP_HEADER_HEIGHT + Math.ceil(groupLocations.length / 8) * 60 + 8);
    const cols = Math.max(1, Math.min(8, visibleGroup.ubicaciones.length));
    const rowWidth = cols * 112 + Math.max(0, cols - 1) * 12;
    const startX = (layout.width - rowWidth) / 2;
    return (
      <g key={visibleGroup.id}>
        <rect
          x="16"
          y={visibleGroup.y}
          width={layout.width - 32}
          height={backgroundHeight}
          rx="12"
          className="fill-white/80 stroke-slate-200 dark:fill-slate-900/80 dark:stroke-slate-700"
        />
        <text
          x="32"
          y={visibleGroup.y + 26}
          fontSize="14"
          fontWeight="700"
          className="fill-slate-700 dark:fill-slate-100"
        >
          {groupHeading(visibleGroup)}
        </text>
        <line
          x1="32"
          x2={layout.width - 32}
          y1={visibleGroup.y + 36}
          y2={visibleGroup.y + 36}
          className="stroke-slate-200 dark:stroke-slate-700"
        />
        {perimeter && (
          <>
            <rect
              x="32"
              y={visibleGroup.y + GROUP_HEADER_HEIGHT + 4}
              width={layout.width - 64}
              height="18"
              rx="9"
              className="fill-slate-200 stroke-slate-400 dark:fill-slate-700 dark:stroke-slate-500"
            />
            <line
              x1="44"
              x2={layout.width - 44}
              y1={visibleGroup.y + GROUP_HEADER_HEIGHT + 13}
              y2={visibleGroup.y + GROUP_HEADER_HEIGHT + 13}
              strokeDasharray="10 8"
              className="stroke-slate-400 dark:stroke-slate-500"
            />
          </>
        )}
        {visibleGroup.ubicaciones.map((location, index) => {
          if (perimeter) {
            const nodeWidth = Math.min(
              112,
              (layout.width - 40 - 2 * Math.max(visibleGroup.ubicaciones.length - 1, 0)) /
                Math.max(visibleGroup.ubicaciones.length, 1),
            );
            const rowWidth =
              visibleGroup.ubicaciones.length * nodeWidth +
              2 * Math.max(visibleGroup.ubicaciones.length - 1, 0);
            const rowStartX = (layout.width - rowWidth) / 2;
            return renderNode(
              location,
              rowStartX + index * (nodeWidth + 2),
              visibleGroup.y + GROUP_HEADER_HEIGHT + 4,
              nodeWidth,
              48,
              { centered: true },
            );
          }
          const x = startX + (index % 8) * (112 + 12);
          const y = visibleGroup.y + GROUP_HEADER_HEIGHT + Math.floor(index / 8) * 60;
          return renderNode(location, x, y, 112, 48, { centered: true });
        })}
      </g>
    );
  };

  const renderSection = (section: MapaSeccionLayout) => (
    <g key={section.id}>
      <rect
        x={section.x}
        y={section.y}
        width={section.width}
        height={section.height}
        rx="14"
        className="fill-indigo-50/60 stroke-indigo-300 dark:fill-indigo-950/30 dark:stroke-indigo-700"
        strokeDasharray="7 5"
      />
      {section.sectionLocation ? (
        renderNode(section.sectionLocation, section.x + 12, section.y + 10, 560, 38, {
          centered: false,
        })
      ) : (
        <text
          x={section.x + 18}
          y={section.y + 34}
          fontSize="15"
          fontWeight="700"
          className="fill-indigo-800 dark:fill-indigo-200"
        >
          {section.nombre}
        </text>
      )}
      <text
        x={section.x + section.width - 18}
        y={section.y + 34}
        textAnchor="end"
        fontSize="11"
        fontWeight="600"
        className="fill-indigo-800 dark:fill-indigo-200"
      >
        {section.cantidadProductos} productos · {section.totalUnidades} uds
      </text>
      {section.aisles.map((aisle: MapaPasilloLayout) => (
        <g key={aisle.location.id}>
          {view !== "pasillos" &&
            aisle.leftChildren.map((child, index) =>
              renderNode(
                child,
                aisle.leftX,
                aisle.y + index * (aisle.childHeight + aisle.childGap),
                aisle.sideWidth,
                aisle.childHeight,
                { label: child.codigo || child.nombre, centered: true },
              ),
            )}
          {renderNode(aisle.location, aisle.x, aisle.y, aisle.width, aisle.height, {
            aisle: true,
            productCount: aisle.cantidadProductos,
            totalUnits: aisle.totalUnidades,
          })}
          {view !== "pasillos" &&
            aisle.rightChildren.map((child, index) =>
              renderNode(
                child,
                aisle.rightX,
                aisle.y + index * (aisle.childHeight + aisle.childGap),
                aisle.sideWidth,
                aisle.childHeight,
                { label: child.codigo || child.nombre, centered: true },
              ),
            )}
        </g>
      ))}
    </g>
  );

  const sectionName = visibleSections.find((section) => section.id === sectionId)?.nombre;
  const mapTitle =
    view === "seccion" && sectionName
      ? `MAPA SECCIÓN ${sectionName.toLocaleUpperCase()}`
      : "MAPA GENERAL DEL ALMACÉN";
  const aisleCount = visibleSections.reduce((total, section) => total + section.aisles.length, 0);
  const aisleProductCount = visibleSections.reduce(
    (total, section) => total + section.cantidadProductos,
    0,
  );
  const showPerimeter = view !== "pasillos";
  const showBoxes = view !== "pasillos";

  return (
    <div className="h-full min-h-[220px] flex-1 overflow-auto rounded-lg border bg-slate-50 dark:bg-slate-950">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        preserveAspectRatio="xMidYMin meet"
        className={`h-auto w-full ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        role="group"
        aria-label="Mapa interactivo del almacén"
        onPointerDown={startDrag}
        onPointerMove={drag}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onWheel={handleWheel}
      >
        <defs>
          <pattern id="mapa-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeWidth="0.7"
            />
          </pattern>
        </defs>
        <rect
          width={layout.width}
          height={layout.height}
          className="fill-slate-50 dark:fill-slate-950"
        />
        <rect width={layout.width} height={layout.height} fill="url(#mapa-grid)" />
        <g
          transform={`translate(${pan.x + (layout.width / 2) * (1 - zoom)} ${pan.y + (layout.height / 2) * (1 - zoom)}) scale(${zoom})`}
        >
          <text
            x={layout.width / 2}
            y="18"
            textAnchor="middle"
            fontSize="15"
            fontWeight="700"
            letterSpacing="1"
            className="fill-slate-700 dark:fill-slate-100"
          >
            {mapTitle}
          </text>
          {renderGroup(layout.perimeter, view !== "pasillos", true)}
          {renderGroup(layout.reserves, view !== "pasillos")}
          {renderGroup(layout.crossings, view !== "pasillos")}
          {layout.aislesHeadingY !== null && visibleSections.length > 0 && (
            <g>
              <rect
                x="16"
                y={layout.aislesHeadingY}
                width={layout.width - 32}
                height="38"
                rx="8"
                className="fill-indigo-100/70 stroke-indigo-200 dark:fill-indigo-950/60 dark:stroke-indigo-800"
              />
              <text
                x="32"
                y={layout.aislesHeadingY + 25}
                fontSize="14"
                fontWeight="700"
                className="fill-indigo-800 dark:fill-indigo-200"
              >
                PASILLOS ({aisleCount} {aisleCount === 1 ? "pasillo" : "pasillos"},{" "}
                {aisleProductCount} productos)
              </text>
            </g>
          )}
          {visibleSections.map(renderSection)}
          {renderGroup(layout.boxes, showBoxes)}
          {renderGroup(layout.other, view !== "pasillos")}
          {renderGroup(layout.unassigned, view !== "pasillos")}
        </g>
      </svg>
    </div>
  );
}
