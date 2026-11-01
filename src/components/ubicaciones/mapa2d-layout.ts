export type MapaTipoUbicacion =
  "seccion" | "pasillo" | "reserva" | "armario" | "alto" | "caja" | "cross" | "perimetral";

export interface MapaProducto {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  stock_minimo: number;
}

export interface MapaPalet {
  id: string;
  idReserva: string;
  numero: number;
  codigo: string;
  stockTotal: number;
  capacidadMax?: number;
  productos: MapaProducto[];
}

export interface MapaUbicacion {
  id: string;
  codigo: string;
  nombre: string;
  tipo: MapaTipoUbicacion;
  padreId: string | null;
  seccionId: string | null;
  lateral: string | null;
  numero: number | null;
  activo: boolean;
  capacidadMax: number;
  productos: MapaProducto[];
  palets?: MapaPalet[];
}

export interface MapaPasilloLayout {
  location: MapaUbicacion;
  x: number;
  y: number;
  width: number;
  height: number;
  columnWidth: number;
  leftX: number;
  rightX: number;
  sideWidth: number;
  armoryHeight: number;
  armoryGap: number;
  leftChildren: MapaUbicacion[];
  rightChildren: MapaUbicacion[];
  startCrosses: MapaUbicacion[];
  endCrosses: MapaUbicacion[];
  cantidadProductos: number;
  totalUnidades: number;
}

export interface MapaReservaLayout {
  location: MapaUbicacion;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Mapa2DLayout {
  width: number;
  height: number;
  perimeterAisle: MapaUbicacion | null;
  perimeterY: number;
  perimeterHeight: number;
  perimeterLocations: MapaUbicacion[];
  aislesY: number;
  aislesHeight: number;
  aisles: MapaPasilloLayout[];
  reservesY: number;
  reserves: MapaReservaLayout[];
  positions: Map<string, { x: number; y: number }>;
}

const CANVAS_WIDTH = 1480;
const CONTENT_X = 32;
const CONTENT_WIDTH = CANVAS_WIDTH - CONTENT_X * 2;
const TITLE_Y = 26;
const PERIMETER_Y = 74;
const PERIMETER_HEIGHT = 96;
const AISLES_Y = 228;
const AISLE_WIDTH = 44;
const AISLE_GAP = 8;
const MIN_ARMORY_HEIGHT = 25;
const ARMORY_GAP = 2;
const AISLE_HEADER_HEIGHT = 30;
const MIN_AISLE_HEIGHT = 300;
const RESERVATION_HEIGHT = 340;
const RESERVATION_GAP = 20;

const ARMORY_RANGES = [
  { aisle: 12, from: 651, to: 658, side: "derecha" },
  { aisle: 12, from: 659, to: 670, side: "izquierda" },
  { aisle: 14, from: 671, to: 683, side: "derecha" },
  { aisle: 14, from: 684, to: 697, side: "izquierda" },
  { aisle: 16, from: 698, to: 710, side: "derecha" },
  { aisle: 16, from: 711, to: 716, side: "izquierda" },
  { aisle: 18, from: 717, to: 728, side: "derecha" },
  { aisle: 18, from: 729, to: 734, side: "izquierda" },
] as const;

function locationCodeNumber(location: MapaUbicacion): number | null {
  const match = (location.codigo || location.nombre).match(/E?(\d+)/i);
  return match ? Number(match[1]) : null;
}

function aisleNumber(location: MapaUbicacion): number | null {
  const match =
    location.nombre.match(/pasillo\D*(\d+)/i) ??
    location.codigo.match(/(?:pasillo|p)?\D*(\d+)/i) ??
    `${location.codigo} ${location.nombre}`.match(/\b(\d+)\b/);
  return match ? Number(match[1]) : location.numero;
}

function specifiedArmoryPlacement(
  location: MapaUbicacion,
): { aisleNumber: number; side: "izquierda" | "derecha" } | null {
  const code = locationCodeNumber(location);
  if (code === null) return null;
  const range = ARMORY_RANGES.find((item) => code >= item.from && code <= item.to);
  return range ? { aisleNumber: range.aisle, side: range.side } : null;
}

function isPerimeterLocation(location: MapaUbicacion): boolean {
  const code = locationCodeNumber(location);
  return location.tipo === "perimetral" || (code !== null && code >= 735 && code <= 744);
}

function isPerimeterAisle(location: MapaUbicacion): boolean {
  if (location.tipo !== "pasillo") return false;
  const label = `${location.codigo} ${location.nombre}`.toLocaleLowerCase();
  return label.includes("perimetral") || label.includes("perímetro");
}

function compareCodes(first: MapaUbicacion, second: MapaUbicacion): number {
  return (first.codigo || first.nombre).localeCompare(second.codigo || second.nombre, "es", {
    numeric: true,
    sensitivity: "base",
  });
}

function totalUnits(location: MapaUbicacion): number {
  return location.productos.reduce((sum, product) => sum + product.cantidad, 0);
}

function aggregateLocations(locations: MapaUbicacion[]) {
  return {
    cantidadProductos: new Set(
      locations.flatMap((location) => location.productos.map((product) => product.id)),
    ).size,
    totalUnidades: locations.reduce((sum, location) => sum + totalUnits(location), 0),
  };
}

function positionRow(
  locations: MapaUbicacion[],
  y: number,
  positions: Map<string, { x: number; y: number }>,
  rightToLeft = false,
) {
  if (locations.length === 0) return;
  const gap = 2;
  const nodeWidth = Math.min(
    112,
    (CONTENT_WIDTH - gap * (locations.length - 1)) / locations.length,
  );
  const rowWidth = locations.length * nodeWidth + gap * (locations.length - 1);
  const startX = (CANVAS_WIDTH - rowWidth) / 2;
  locations.forEach((location, index) => {
    const column = rightToLeft ? locations.length - index - 1 : index;
    positions.set(location.id, {
      x: startX + column * (nodeWidth + gap) + nodeWidth / 2,
      y,
    });
  });
}

function getAisleCrosses(
  locations: MapaUbicacion[],
  aisle: MapaUbicacion,
): { start: MapaUbicacion[]; end: MapaUbicacion[] } {
  const children = locations
    .filter(
      (location) =>
        location.tipo === "cross" &&
        location.padreId === aisle.id &&
        !isPerimeterLocation(location),
    )
    .sort(compareCodes);
  if (children.length < 2) return { start: children, end: [] };
  return { start: [children[0]!], end: children.slice(1) };
}

export function getMapa2DLayout(locations: MapaUbicacion[]): Mapa2DLayout {
  const positions = new Map<string, { x: number; y: number }>();
  const byId = new Map(locations.map((location) => [location.id, location]));
  const perimeterAisleIds = new Set(
    locations.filter(isPerimeterAisle).map((location) => location.id),
  );
  const perimeterAisle = locations.find((location) => perimeterAisleIds.has(location.id)) ?? null;
  const aisles = locations
    .filter((location) => location.tipo === "pasillo" && !perimeterAisleIds.has(location.id))
    .sort((first, second) => {
      const firstNumber = aisleNumber(first) ?? 0;
      const secondNumber = aisleNumber(second) ?? 0;
      return secondNumber - firstNumber || compareCodes(first, second);
    });
  const perimeterLocations = locations
    .filter(
      (location) =>
        !perimeterAisleIds.has(location.id) &&
        (isPerimeterLocation(location) ||
          (location.padreId !== null && perimeterAisleIds.has(location.padreId))),
    )
    .sort(compareCodes);
  positionRow(perimeterLocations, PERIMETER_Y + 62, positions, true);

  const laneWidth = CONTENT_WIDTH / Math.max(aisles.length, 1);
  const aisleLayouts: MapaPasilloLayout[] = [];

  aisles.forEach((aisle, aisleIndex) => {
    const aisleNo = aisleNumber(aisle);
    const aisleChildren = locations.filter((location) => {
      if (
        (location.tipo !== "armario" && location.tipo !== "alto") ||
        isPerimeterLocation(location)
      )
        return false;
      const explicitPlacement = specifiedArmoryPlacement(location);
      if (aisleNo !== null && explicitPlacement) return explicitPlacement.aisleNumber === aisleNo;
      return location.padreId === aisle.id;
    });
    const leftChildren = aisleChildren
      .filter((child) => {
        const explicitPlacement = specifiedArmoryPlacement(child);
        return explicitPlacement
          ? explicitPlacement.side === "izquierda"
          : child.lateral?.toLocaleLowerCase() === "izquierda";
      })
      .sort(compareCodes);
    const rightChildren = aisleChildren
      .filter((child) => !leftChildren.includes(child))
      .sort(compareCodes);
    const maxArmories = Math.max(leftChildren.length, rightChildren.length);
    const armoryHeight = Math.max(
      MIN_ARMORY_HEIGHT,
      (MIN_AISLE_HEIGHT - ARMORY_GAP * Math.max(maxArmories - 1, 0)) / Math.max(maxArmories, 1),
    );
    const columnHeight = Math.max(
      MIN_AISLE_HEIGHT,
      maxArmories * MIN_ARMORY_HEIGHT + Math.max(maxArmories - 1, 0) * ARMORY_GAP,
    );
    const height = AISLE_HEADER_HEIGHT + columnHeight + 44;
    const columnX = CONTENT_X + aisleIndex * laneWidth;
    const sideWidth = Math.max(28, (laneWidth - AISLE_WIDTH - 2 * AISLE_GAP) / 2);
    const x = columnX + (laneWidth - AISLE_WIDTH) / 2;
    const y = AISLES_Y + AISLE_HEADER_HEIGHT;
    const leftX = x - AISLE_GAP - sideWidth;
    const rightX = x + AISLE_WIDTH + AISLE_GAP;
    const centerY = y + columnHeight / 2;
    const crosses = getAisleCrosses(locations, aisle);
    const routeLocations = [aisle, ...leftChildren, ...rightChildren];
    const aggregates = aggregateLocations(routeLocations);

    positions.set(aisle.id, { x: x + AISLE_WIDTH / 2, y: centerY });

    const setArmoryPositions = (
      children: MapaUbicacion[],
      childX: number,
      bottomToTop: boolean,
    ) => {
      children.forEach((child, index) => {
        const row = bottomToTop ? children.length - index - 1 : index;
        positions.set(child.id, {
          x: childX + sideWidth / 2,
          y: y + row * (armoryHeight + ARMORY_GAP) + armoryHeight / 2,
        });
      });
    };

    const leftBottomToTop = aisleNo !== 12;
    setArmoryPositions(leftChildren, leftX, leftBottomToTop);
    setArmoryPositions(rightChildren, rightX, true);

    const startY = AISLES_Y + 10;
    const endY = y + columnHeight + 34;
    crosses.start.forEach((cross, index) => {
      positions.set(cross.id, { x: columnX + laneWidth - 36, y: startY + index * 22 });
    });
    crosses.end.forEach((cross, index) => {
      positions.set(cross.id, { x: columnX + 36, y: endY + index * 22 });
    });

    aisleLayouts.push({
      location: aisle,
      x,
      y,
      width: AISLE_WIDTH,
      height: columnHeight,
      columnWidth: laneWidth,
      leftX,
      rightX,
      sideWidth,
      armoryHeight,
      armoryGap: ARMORY_GAP,
      leftChildren,
      rightChildren,
      startCrosses: crosses.start,
      endCrosses: crosses.end,
      ...aggregates,
    });
  });

  const aislesHeight = aisles.length
    ? Math.max(...aisleLayouts.map((aisle) => aisle.y + aisle.height + 70)) - AISLES_Y
    : 0;
  const reserveLocations = locations.filter((location) => location.tipo === "reserva");
  const reservationWidth =
    (CONTENT_WIDTH - RESERVATION_GAP * Math.max(reserveLocations.length - 1, 0)) /
    Math.max(reserveLocations.length, 1);
  const reserves = reserveLocations.map((location, index) => ({
    location,
    x: CONTENT_X + index * (reservationWidth + RESERVATION_GAP),
    y: AISLES_Y + aislesHeight + 16,
    width: reservationWidth,
    height: RESERVATION_HEIGHT,
  }));

  reserves.forEach(({ location, x, y, width, height }) => {
    positions.set(location.id, { x: x + width / 2, y: y + height / 2 });
    const pallets = [...(location.palets ?? [])].sort(
      (first, second) => first.numero - second.numero,
    );
    if (pallets.length === 0) return;
    const columns = Math.ceil(Math.sqrt(pallets.length));
    const rows = Math.ceil(pallets.length / columns);
    const gap = 2;
    const availableWidth = width - 40;
    const availableHeight = height - 52;
    const palletSize = Math.min(
      Math.min(availableWidth, availableHeight) / Math.sqrt(pallets.length),
      (availableWidth - gap * (columns - 1)) / columns,
      (availableHeight - gap * (rows - 1)) / rows,
    );
    const gridWidth = columns * palletSize + gap * (columns - 1);
    const gridHeight = rows * palletSize + gap * (rows - 1);
    const gridX = x + 20 + (width - 40 - gridWidth) / 2;
    const gridY = y + 42 + (availableHeight - gridHeight) / 2;
    pallets.forEach((pallet, index) => {
      positions.set(pallet.id, {
        x: gridX + (index % columns) * (palletSize + gap) + palletSize / 2,
        y: gridY + Math.floor(index / columns) * (palletSize + gap) + palletSize / 2,
      });
    });
  });

  const reservesY = reserves[0]?.y ?? AISLES_Y + aislesHeight + 16;
  const height = Math.max(
    640,
    ...reserves.map((reserve) => reserve.y + reserve.height + CONTENT_X),
    AISLES_Y + aislesHeight + 100,
  );

  return {
    width: CANVAS_WIDTH,
    height,
    perimeterAisle,
    perimeterY: PERIMETER_Y,
    perimeterHeight: PERIMETER_HEIGHT,
    perimeterLocations,
    aislesY: AISLES_Y,
    aislesHeight,
    aisles: aisleLayouts,
    reservesY,
    reserves,
    positions,
  };
}

export function getMapaTipoVisual(location: MapaUbicacion): MapaTipoUbicacion {
  if (isPerimeterLocation(location)) return "perimetral";
  return location.tipo;
}

export function getMapaStockLevel(
  products: MapaProducto[],
  total: number,
): "normal" | "medio" | "critico" | "vacio" {
  if (total <= 0) return "vacio";
  if (products.some((product) => product.cantidad <= product.stock_minimo)) return "critico";
  if (products.some((product) => product.cantidad <= product.stock_minimo * 2)) return "medio";
  return "normal";
}
