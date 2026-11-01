import { useMemo, useRef, useState } from "react";
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
import {
  getMapaStockLevel,
  getMapaTipoVisual,
  type Mapa2DLayout,
  type MapaPalet,
  type MapaTipoUbicacion,
  type MapaUbicacion,
} from "./mapa2d-layout";
import { getMapa2DLayout } from "./mapa2d-layout";
export type { MapaPalet, MapaProducto, MapaTipoUbicacion, MapaUbicacion } from "./mapa2d-layout";

interface Mapa2DProps {
  locations: MapaUbicacion[];
  summaries: Map<string, StockVisualSummary>;
  selectedLocationId: string | null;
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
  onManagePallet: (palletId: string) => void;
}

const TYPE_LABELS: Record<MapaTipoUbicacion, string> = {
  seccion: "Sección",
  pasillo: "Pasillo",
  reserva: "Reserva",
  armario: "Armario",
  alto: "Alto",
  caja: "Caja",
  cross: "Cross / tránsito",
  perimetral: "Perimetral",
};

const CONTENT_X = 32;
const TITLE_Y = 26;

const STOCK_CLASSES: Record<StockVisualSummary["nivel"], string> = {
  normal: "fill-emerald-100 stroke-emerald-500 dark:fill-emerald-950 dark:stroke-emerald-700",
  medio: "fill-amber-100 stroke-amber-500 dark:fill-amber-950 dark:stroke-amber-700",
  critico: "fill-rose-100 stroke-rose-500 dark:fill-rose-950 dark:stroke-rose-700",
  vacio: "fill-gray-100 stroke-gray-400 dark:fill-gray-800 dark:stroke-gray-600",
  inactivo: "fill-gray-200 stroke-gray-500 dark:fill-gray-700 dark:stroke-gray-500",
};

const FIXED_TYPE_CLASSES: Partial<Record<MapaTipoUbicacion, string>> = {
  pasillo: "fill-blue-50 stroke-blue-300 dark:fill-blue-950 dark:stroke-blue-700",
  reserva: "fill-orange-50 stroke-orange-300 dark:fill-orange-950 dark:stroke-orange-700",
  cross: "fill-purple-50 stroke-purple-300 dark:fill-purple-950 dark:stroke-purple-700",
  perimetral: "fill-gray-50 stroke-gray-300 dark:fill-gray-800 dark:stroke-gray-600",
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
  const maxCharacters = Math.max(3, Math.floor(width / (fontSize * 0.58)));
  if (text.length <= maxCharacters) return text;
  return `${text.slice(0, maxCharacters - 1).trimEnd()}…`;
}

function displayCode(location: MapaUbicacion): string {
  return location.codigo || location.nombre;
}

function groupBySection(
  location: MapaUbicacion,
  sectionId: string,
  locationsById: Map<string, MapaUbicacion>,
): boolean {
  let current: MapaUbicacion | undefined = location;
  const visited = new Set<string>();
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    if (current.tipo === "seccion") return current.id === sectionId;
    if (current.seccionId) return current.seccionId === sectionId;
    current = current.padreId ? locationsById.get(current.padreId) : undefined;
  }
  return true;
}

function getPalletColorClass(pallet: MapaPalet): string {
  const level = getMapaStockLevel(pallet.productos, pallet.stockTotal);
  if (level === "normal") return STOCK_CLASSES.normal;
  if (level === "medio") return STOCK_CLASSES.medio;
  if (level === "critico") return STOCK_CLASSES.critico;
  return STOCK_CLASSES.vacio;
}

function palletTileSize(
  layout: Mapa2DLayout,
  location: MapaUbicacion,
  reservation: (typeof layout.reserves)[number],
): number {
  const count = location.palets?.length ?? 0;
  if (count === 0) return 0;
  const columns = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / columns);
  const gap = 2;
  const reservationWidth = reservation.width - 40;
  const reservationHeight = reservation.height - 52;
  return Math.min(
    Math.min(reservationWidth, reservationHeight) / Math.sqrt(count),
    (reservationWidth - gap * (columns - 1)) / columns,
    (reservationHeight - gap * (rows - 1)) / rows,
  );
}

export function Mapa2D({
  locations,
  summaries,
  selectedLocationId,
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
  onManagePallet,
}: Mapa2DProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const layout = useMemo(() => getMapa2DLayout(locations), [locations]);
  const locationsById = useMemo(
    () => new Map(locations.map((location) => [location.id, location])),
    [locations],
  );
  const visibleAisles = layout.aisles.filter(
    (aisle) =>
      view !== "seccion" || !sectionId || groupBySection(aisle.location, sectionId, locationsById),
  );

  const startDrag = (event: PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0 || (event.target as Element).closest("[data-mapa-node]")) return;
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

  const renderLocation = (
    location: MapaUbicacion,
    x: number,
    y: number,
    width: number,
    height: number,
    options: { label?: string; vertical?: boolean; perimeter?: boolean } = {},
  ) => {
    const visualType = getMapaTipoVisual(location);
    const summary = summaries.get(location.id);
    const selected = selectedLocationId === location.id;
    const highlighted = highlightedLocationId === location.id;
    const dimmed = hasSearchQuery && !highlighted;
    const fillClass =
      FIXED_TYPE_CLASSES[visualType] ??
      (summary ? STOCK_CLASSES[summary.nivel] : STOCK_CLASSES.vacio);
    const label = options.label ?? displayCode(location);
    const fontSize = Math.min(12, Math.max(8, height * 0.36));
    const aisle = layout.aisles.find(
      (item) =>
        item.leftChildren.some((child) => child.id === location.id) ||
        item.rightChildren.some((child) => child.id === location.id),
    );
    const side = aisle?.leftChildren.some((child) => child.id === location.id)
      ? "Izquierdo"
      : aisle?.rightChildren.some((child) => child.id === location.id)
        ? "Derecho"
        : null;
    const title =
      aisle && side
        ? `${displayCode(location)} - Lado ${side} del Pasillo ${aisle.location.codigo}`
        : `${location.nombre} · ${TYPE_LABELS[visualType]} · ${summary?.total ?? 0} uds`;
    const textColor =
      visualType === "perimetral"
        ? "fill-gray-800 dark:fill-gray-100"
        : visualType === "pasillo"
          ? "fill-blue-950 dark:fill-blue-100"
          : visualType === "reserva"
            ? "fill-orange-950 dark:fill-orange-100"
            : visualType === "cross"
              ? "fill-purple-950 dark:fill-purple-100"
              : "fill-gray-900 dark:fill-gray-100";

    return (
      <g
        key={location.id}
        data-mapa-node
        data-location-id={location.id}
        role="button"
        tabIndex={0}
        aria-label={`${location.nombre}, ${TYPE_LABELS[visualType]}, ${summary?.total ?? 0} unidades`}
        aria-pressed={selected}
        style={{ opacity: dimmed ? 0.25 : 1, pointerEvents: "all" }}
        className="cursor-pointer outline-none"
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
      >
        <title>{title}</title>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={options.perimeter ? 3 : 4}
          className={`${fillClass} ${
            selected || highlighted ? "stroke-amber-600 dark:stroke-amber-400" : ""
          }`}
          strokeWidth={selected ? 3 : highlighted ? 2 : 1}
        />
        {options.vertical ? (
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            fontSize="12"
            fontWeight="700"
            className={textColor}
            pointerEvents="none"
            transform={`rotate(-90 ${x + width / 2} ${y + height / 2})`}
          >
            {truncateText(label, height - 24, 12)}
          </text>
        ) : (
          <text
            x={x + width / 2}
            y={y + height / 2 + fontSize / 3}
            textAnchor="middle"
            fontSize={fontSize}
            fontWeight="700"
            className={textColor}
            pointerEvents="none"
          >
            {truncateText(label, width - 8, fontSize)}
          </text>
        )}
      </g>
    );
  };

  const renderCross = (cross: MapaUbicacion, x: number, y: number) => {
    const highlighted = cross.id === highlightedLocationId;
    const dimmed = hasSearchQuery && !highlighted;
    return (
      <g
        key={cross.id}
        data-mapa-node
        data-location-id={cross.id}
        role="button"
        tabIndex={0}
        aria-label={`Cross ${displayCode(cross)}`}
        aria-pressed={selectedLocationId === cross.id}
        style={{ opacity: dimmed ? 0.25 : 1, pointerEvents: "all" }}
        className="cursor-pointer outline-none"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(cross);
        }}
        onDoubleClick={(event) => {
          event.stopPropagation();
          onManage(cross);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(cross);
          }
        }}
      >
        <title>{cross.nombre} · Cross al inicio/final del pasillo</title>
        <rect
          x={x - 14}
          y={y - 14}
          width="28"
          height="28"
          rx="6"
          className={`fill-purple-50 stroke-purple-300 dark:fill-purple-950 dark:stroke-purple-700 ${
            highlighted ? "stroke-amber-600 dark:stroke-amber-400" : ""
          }`}
        />
        <foreignObject x={x - 9} y={y - 9} width="18" height="18" pointerEvents="none">
          <div className="flex h-full w-full items-center justify-center text-purple-700 dark:text-purple-300">
            <Shuffle className="h-4 w-4" aria-hidden="true" />
          </div>
        </foreignObject>
      </g>
    );
  };

  const renderPallet = (
    pallet: MapaPalet,
    x: number,
    y: number,
    size: number,
    index: number,
    total: number,
  ) => {
    const highlighted = pallet.id === highlightedLocationId;
    const dimmed = hasSearchQuery && !highlighted;
    const label = size >= 34 ? `P${pallet.numero}` : String(pallet.numero);
    return (
      <g
        key={pallet.id}
        data-mapa-node
        data-pallet-id={pallet.id}
        role="button"
        tabIndex={0}
        aria-label={`Palet ${pallet.numero} de ${total}, código ${pallet.codigo}, ${pallet.stockTotal} unidades`}
        style={{ opacity: dimmed ? 0.25 : 1, pointerEvents: "all" }}
        className="cursor-pointer outline-none"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onManagePallet(pallet.id);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onManagePallet(pallet.id);
          }
        }}
      >
        <title>
          Palet {index + 1} de {total} · {pallet.codigo} · {pallet.stockTotal} unidades
        </title>
        <rect
          x={x}
          y={y}
          width={size}
          height={size}
          rx="3"
          className={`${getPalletColorClass(pallet)} ${
            highlighted ? "stroke-amber-600 dark:stroke-amber-400" : ""
          }`}
          strokeWidth={highlighted ? 3 : 1}
        />
        {size >= 23 && (
          <>
            <text
              x={x + size / 2}
              y={y + size / 2 - 2}
              textAnchor="middle"
              fontSize={Math.min(12, size * 0.32)}
              fontWeight="700"
              className="fill-gray-900 dark:fill-gray-100"
              pointerEvents="none"
            >
              {label}
            </text>
            {size >= 54 && (
              <text
                x={x + size / 2}
                y={y + size / 2 + 13}
                textAnchor="middle"
                fontSize="9"
                className="fill-gray-700 dark:fill-gray-200"
                pointerEvents="none"
              >
                {pallet.stockTotal} uds
              </text>
            )}
          </>
        )}
      </g>
    );
  };

  const renderReservation = (reservation: (typeof layout.reserves)[number]) => {
    const { location, x, y, width, height } = reservation;
    const pallets = [...(location.palets ?? [])].sort(
      (first, second) => first.numero - second.numero,
    );
    const columns = Math.ceil(Math.sqrt(pallets.length));
    const gap = 2;
    const size = palletTileSize(layout, location, reservation);
    const gridWidth = pallets.length ? columns * size + gap * (columns - 1) : 0;
    const rows = Math.ceil(pallets.length / Math.max(columns, 1));
    const gridHeight = pallets.length ? rows * size + gap * (rows - 1) : 0;
    const gridX = x + (width - gridWidth) / 2;
    const gridY = y + 42 + (height - 52 - gridHeight) / 2;

    return (
      <g key={location.id}>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx="12"
          className="fill-orange-50 stroke-orange-300 dark:fill-orange-950/50 dark:stroke-orange-700"
          strokeWidth="2"
        />
        <text
          x={x + 20}
          y={y + 28}
          fontSize="16"
          fontWeight="700"
          className="fill-orange-900 dark:fill-orange-100"
        >
          RESERVA · {location.nombre}
        </text>
        <text
          x={x + width - 20}
          y={y + 28}
          textAnchor="end"
          fontSize="12"
          className="fill-orange-800 dark:fill-orange-200"
        >
          {pallets.length} {pallets.length === 1 ? "palet activo" : "palets activos"}
        </text>
        {pallets.length > 0 ? (
          pallets.map((pallet, index) =>
            renderPallet(
              pallet,
              gridX + (index % columns) * (size + gap),
              gridY + Math.floor(index / columns) * (size + gap),
              size,
              index,
              pallets.length,
            ),
          )
        ) : (
          <text
            x={x + width / 2}
            y={y + height / 2 + 10}
            textAnchor="middle"
            fontSize="14"
            className="fill-orange-800 dark:fill-orange-200"
          >
            Reserva sin palets activos
          </text>
        )}
      </g>
    );
  };

  const mapTitle =
    view === "seccion" && sectionId
      ? `MAPA SECCIÓN ${(locationsById.get(sectionId)?.nombre ?? "").toLocaleUpperCase()}`
      : "MAPA GENERAL DEL ALMACÉN";
  const showPerimeterAndReserve = view !== "pasillos";

  return (
    <div className="h-full min-h-[220px] flex-1 overflow-auto rounded-lg border bg-gray-50 dark:bg-gray-950">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        preserveAspectRatio="xMidYMin meet"
        className={`h-auto min-w-[1480px] w-full ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
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
              className="stroke-gray-200 dark:stroke-gray-800"
              strokeWidth="0.7"
            />
          </pattern>
        </defs>
        <rect
          width={layout.width}
          height={layout.height}
          className="fill-gray-50 dark:fill-gray-950"
        />
        <rect width={layout.width} height={layout.height} fill="url(#mapa-grid)" />
        <g
          transform={`translate(${pan.x + (layout.width / 2) * (1 - zoom)} ${pan.y + (layout.height / 2) * (1 - zoom)}) scale(${zoom})`}
        >
          <text
            x={layout.width / 2}
            y={TITLE_Y}
            textAnchor="middle"
            fontSize="18"
            fontWeight="700"
            letterSpacing="1"
            className="fill-gray-800 dark:fill-gray-100"
          >
            {mapTitle}
          </text>

          {showPerimeterAndReserve &&
            (layout.perimeterAisle || layout.perimeterLocations.length > 0) && (
              <g>
                <rect
                  x={CONTENT_X}
                  y={layout.perimeterY}
                  width={layout.width - CONTENT_X * 2}
                  height={layout.perimeterHeight}
                  rx="10"
                  className="fill-gray-50 stroke-gray-300 dark:fill-gray-900 dark:stroke-gray-700"
                  strokeWidth="1.5"
                />
                <text
                  x={CONTENT_X + 16}
                  y={layout.perimeterY + 25}
                  fontSize="14"
                  fontWeight="700"
                  className="fill-gray-800 dark:fill-gray-100"
                >
                  {layout.perimeterAisle?.nombre ?? "PERIMETRAL · ZONA TRANSVERSAL"}
                </text>
                {layout.perimeterLocations.length > 0 ? (
                  layout.perimeterLocations.map((location, index) => {
                    const gap = 2;
                    const nodeWidth = Math.min(
                      112,
                      (layout.width -
                        CONTENT_X * 2 -
                        36 -
                        gap * (layout.perimeterLocations.length - 1)) /
                        layout.perimeterLocations.length,
                    );
                    const rowWidth =
                      nodeWidth * layout.perimeterLocations.length +
                      gap * (layout.perimeterLocations.length - 1);
                    const startX = (layout.width - rowWidth) / 2;
                    const column = layout.perimeterLocations.length - index - 1;
                    return renderLocation(
                      location,
                      startX + column * (nodeWidth + gap),
                      layout.perimeterY + 42,
                      nodeWidth,
                      36,
                      { label: displayCode(location), perimeter: true },
                    );
                  })
                ) : (
                  <text
                    x={layout.width / 2}
                    y={layout.perimeterY + 64}
                    textAnchor="middle"
                    fontSize="12"
                    className="fill-gray-600 dark:fill-gray-300"
                  >
                    Sin ubicaciones asociadas
                  </text>
                )}
              </g>
            )}

          {visibleAisles.map((aisle) => {
            const aisleName = aisle.location.nombre || `Pasillo ${aisle.location.codigo}`;
            const crossYStart = layout.aislesY + 8;
            const crossYEnd = aisle.y + aisle.height + 38;
            return (
              <g key={aisle.location.id}>
                <rect
                  x={aisle.x}
                  y={aisle.y}
                  width={aisle.width}
                  height={aisle.height}
                  rx="6"
                  className="fill-blue-50 stroke-blue-300 dark:fill-blue-950 dark:stroke-blue-700"
                  strokeWidth="1.5"
                />
                <text
                  x={aisle.x + aisle.width / 2}
                  y={aisle.y + aisle.height / 2}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="700"
                  className="fill-blue-900 dark:fill-blue-100"
                  transform={`rotate(-90 ${aisle.x + aisle.width / 2} ${aisle.y + aisle.height / 2})`}
                >
                  {truncateText(aisleName, aisle.height - 18, 12)}
                </text>
                <text
                  x={aisle.x + aisle.width / 2}
                  y={aisle.y + aisle.height - 6}
                  textAnchor="middle"
                  fontSize="9"
                  className="fill-blue-900 dark:fill-blue-100"
                >
                  {aisle.cantidadProductos} prod.
                </text>

                {aisle.leftChildren.map((child) => {
                  const position = layout.positions.get(child.id)!;
                  return renderLocation(
                    child,
                    aisle.leftX,
                    position.y - aisle.armoryHeight / 2,
                    aisle.sideWidth,
                    aisle.armoryHeight,
                    { label: displayCode(child) },
                  );
                })}
                {aisle.rightChildren.map((child) => {
                  const position = layout.positions.get(child.id)!;
                  return renderLocation(
                    child,
                    aisle.rightX,
                    position.y - aisle.armoryHeight / 2,
                    aisle.sideWidth,
                    aisle.armoryHeight,
                    { label: displayCode(child) },
                  );
                })}
                {aisle.startCrosses.map((cross, index) => {
                  const position = layout.positions.get(cross.id)!;
                  return renderCross(cross, position.x, crossYStart + index * 22);
                })}
                {aisle.endCrosses.map((cross, index) => {
                  const position = layout.positions.get(cross.id)!;
                  return renderCross(cross, position.x, crossYEnd + index * 22);
                })}
              </g>
            );
          })}

          {showPerimeterAndReserve && layout.reserves.map(renderReservation)}

          {layout.aisles.length === 0 && layout.reserves.length === 0 && (
            <text
              x={layout.width / 2}
              y={layout.height / 2}
              textAnchor="middle"
              fontSize="16"
              className="fill-gray-600 dark:fill-gray-300"
            >
              No hay pasillos ni reservas para mostrar.
            </text>
          )}
        </g>
      </svg>
    </div>
  );
}
