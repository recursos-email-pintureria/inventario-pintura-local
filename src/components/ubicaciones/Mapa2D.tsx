import { useMemo, useRef, useState } from "react";
import type { PointerEvent, WheelEvent } from "react";
import { Archive, Box, MapPin, Shuffle, Warehouse } from "lucide-react";
import type { MapaVista } from "@/hooks/useMapa2D";
import type { StockVisualSummary } from "@/hooks/useStockVisual";
import type { MapaSeccionLayout, MapaTipoUbicacion, MapaUbicacion } from "./mapa2d-layout";
import { getMapa2DLayout } from "./mapa2d-layout";
export type { MapaProducto, MapaTipoUbicacion, MapaUbicacion } from "./mapa2d-layout";

interface Mapa2DProps {
  locations: MapaUbicacion[];
  summaries: Map<string, StockVisualSummary>;
  selectedLocationId: string | null;
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
  caja: "Caja",
  cross: "Cross",
};

export function LocationIcon({ type }: { type: MapaTipoUbicacion }) {
  const className = "h-3.5 w-3.5";
  if (type === "seccion") return <MapPin className={className} />;
  if (type === "pasillo") return <Warehouse className={className} />;
  if (type === "armario") return <Archive className={className} />;
  if (type === "cross") return <Shuffle className={className} />;
  if (type === "reserva") return <Warehouse className={className} />;
  return <Box className={className} />;
}

export function Mapa2D({
  locations,
  summaries,
  selectedLocationId,
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
  const visibleSections = layout.sections.filter(
    (section) => !sectionId || view !== "seccion" || section.id === sectionId,
  );
  const viewportHeight = Math.max(800, layout.height);

  const startDrag = (event: PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0 || (event.target as Element).closest("[data-mapa-ubicacion]")) return;
    dragStart.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const drag = (event: PointerEvent<SVGSVGElement>) => {
    if (!dragStart.current || !svgRef.current) return;
    const bounds = svgRef.current.getBoundingClientRect();
    const scaleX = 1200 / Math.max(bounds.width, 1);
    const scaleY = viewportHeight / Math.max(bounds.height, 1);
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
  ) => {
    const summary = summaries.get(location.id);
    const isSection = location.tipo === "seccion";
    const selected = selectedLocationId === location.id;
    const fill = summary?.color ?? "#e5e7eb";
    const textColor = summary?.colorTexto ?? "#4b5563";
    const products = location.productos
      .slice(0, 3)
      .map((product) => `${product.nombre}: ${product.cantidad}`)
      .join(", ");
    const title = `${location.nombre} (${TYPE_LABELS[location.tipo]}) · ${summary?.total ?? 0} uds · ${summary?.productosCount ?? 0} productos${products ? ` · ${products}` : ""}`;

    return (
      <g
        key={location.id}
        data-mapa-ubicacion
        role="button"
        tabIndex={0}
        style={{ pointerEvents: "all" }}
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
          rx={isSection ? 10 : 6}
          fill={isSection ? "#eef2ff" : fill}
          stroke={selected ? "#f59e0b" : isSection ? "#6366f1" : textColor}
          strokeWidth={selected ? 3 : isSection ? 1.6 : 1}
          strokeDasharray={selected ? "7 4" : undefined}
          className={selected ? "animate-pulse" : undefined}
        />
        <text
          x={x + 8}
          y={y + (height > 56 ? 19 : 17)}
          fontSize={isSection ? 13 : 11}
          fontWeight="600"
          fill={isSection ? "#3730a3" : textColor}
          pointerEvents="none"
        >
          {(location.nombre || location.codigo).slice(0, Math.max(4, Math.floor((width - 30) / 6)))}
        </text>
        <foreignObject x={x + width - 21} y={y + 3} width="16" height="16" pointerEvents="none">
          <div className="flex h-4 w-4 items-center justify-center" style={{ color: textColor }}>
            <LocationIcon type={location.tipo} />
          </div>
        </foreignObject>
        {!isSection && height > 44 && (
          <text x={x + 8} y={y + 34} fontSize="9" fill={textColor} pointerEvents="none">
            {summary?.total ?? 0} uds · {summary?.productosCount ?? 0} prod.
          </text>
        )}
      </g>
    );
  };

  const renderChildRows = (
    children: MapaUbicacion[],
    rowCount: number,
    section: MapaSeccionLayout,
    aisleY: number,
    above: boolean,
  ) => {
    return Array.from({ length: rowCount }, (_, row) => {
      const rowChildren = children.slice(row * 5, (row + 1) * 5);
      const cellWidth = 96;
      const gap = 6;
      const rowWidth = rowChildren.length * cellWidth + (rowChildren.length - 1) * gap;
      const startX = section.x + (section.width - rowWidth) / 2;
      const y = above ? aisleY - rowCount * 38 + row * 38 : aisleY + 38 + row * 38;

      return rowChildren.map((location, index) =>
        renderNode(location, startX + index * (cellWidth + gap), y, cellWidth, 34),
      );
    });
  };

  return (
    <div className="h-full min-h-[220px] flex-1 overflow-auto rounded-lg border bg-slate-50">
      <svg
        ref={svgRef}
        viewBox={`0 0 1200 ${viewportHeight}`}
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
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#e2e8f0" strokeWidth="0.7" />
          </pattern>
        </defs>
        <rect width="1200" height={viewportHeight} fill="url(#mapa-grid)" />
        <g
          transform={`translate(${pan.x + 600 * (1 - zoom)} ${pan.y + (viewportHeight / 2) * (1 - zoom)}) scale(${zoom})`}
        >
          {visibleSections.map((section) => (
            <g key={section.id}>
              <rect
                x={section.x}
                y={section.y}
                width={section.width}
                height={section.height}
                rx="12"
                fill="#ffffff"
                stroke="#cbd5e1"
                strokeWidth="1.5"
              />
              {section.sectionLocation ? (
                renderNode(
                  section.sectionLocation,
                  section.x + 12,
                  section.y + 10,
                  section.width - 24,
                  36,
                )
              ) : (
                <text
                  x={section.x + 16}
                  y={section.y + 30}
                  fontSize="13"
                  fontWeight="600"
                  fill="#334155"
                >
                  {section.nombre}
                </text>
              )}
              {section.aisles.map((aisle) => (
                <g key={aisle.location.id}>
                  {view !== "pasillos" &&
                    renderChildRows(aisle.leftChildren, aisle.leftRows, section, aisle.y, true)}
                  {renderNode(
                    aisle.location,
                    section.x + (section.width - 320) / 2,
                    aisle.y,
                    320,
                    32,
                  )}
                  {view !== "pasillos" &&
                    renderChildRows(aisle.rightChildren, aisle.rightRows, section, aisle.y, false)}
                </g>
              ))}
              {view !== "pasillos" &&
                section.directLocations.map((location, index) =>
                  renderNode(
                    location,
                    section.x + 16 + (index % 5) * 106,
                    section.aisles.reduce((nextY, aisle) => nextY + aisle.height, section.y + 72) +
                      Math.floor(index / 5) * 72,
                    96,
                    48,
                  ),
                )}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
