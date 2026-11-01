export type MapaTipoUbicacion =
  "seccion" | "pasillo" | "reserva" | "armario" | "alto" | "caja" | "cross";

export interface MapaProducto {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  stock_minimo: number;
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
}

export interface MapaGrupoLayout {
  id: string;
  nombre: string;
  y: number;
  height: number;
  ubicaciones: MapaUbicacion[];
  cantidadProductos: number;
  totalUnidades: number;
}

export interface MapaPasilloLayout {
  location: MapaUbicacion;
  x: number;
  y: number;
  width: number;
  height: number;
  sideWidth: number;
  childHeight: number;
  childGap: number;
  leftX: number;
  rightX: number;
  leftChildren: MapaUbicacion[];
  rightChildren: MapaUbicacion[];
  cantidadProductos: number;
  totalUnidades: number;
}

export interface MapaSeccionLayout {
  id: string;
  nombre: string;
  x: number;
  y: number;
  width: number;
  height: number;
  sectionLocation: MapaUbicacion | null;
  aisles: MapaPasilloLayout[];
  cantidadProductos: number;
  totalUnidades: number;
}

export interface Mapa2DLayout {
  width: number;
  height: number;
  reserves: MapaGrupoLayout;
  crossings: MapaGrupoLayout;
  sections: MapaSeccionLayout[];
  perimeter: MapaGrupoLayout;
  boxes: MapaGrupoLayout;
  other: MapaGrupoLayout;
  unassigned: MapaGrupoLayout;
  aislesHeadingY: number | null;
  positions: Map<string, { x: number; y: number }>;
}

const CANVAS_WIDTH = 1200;
const CONTENT_X = 20;
const CONTENT_WIDTH = CANVAS_WIDTH - CONTENT_X * 2;
const GROUP_HEADER_HEIGHT = 42;
const NODE_WIDTH = 112;
const NODE_HEIGHT = 48;
const NODE_GAP_X = 12;
const NODE_GAP_Y = 12;
const AISLE_WIDTH = 48;
const AISLE_GAP = 6;
const MIN_ARMORY_HEIGHT = 25;
const ARMORY_GAP = 2;
const DEFAULT_AISLE_HEIGHT = 300;

function productsCount(location: MapaUbicacion): number {
  return new Set(location.productos.map((product) => product.id)).size;
}

function totalUnits(location: MapaUbicacion): number {
  return location.productos.reduce((sum, product) => sum + product.cantidad, 0);
}

function aggregateLocations(locations: MapaUbicacion[]) {
  return {
    cantidadProductos: locations.reduce((sum, location) => sum + productsCount(location), 0),
    totalUnidades: locations.reduce((sum, location) => sum + totalUnits(location), 0),
  };
}

function byPopulation(first: MapaUbicacion, second: MapaUbicacion): number {
  return (
    productsCount(second) - productsCount(first) ||
    totalUnits(second) - totalUnits(first) ||
    first.nombre.localeCompare(second.nombre, "es")
  );
}

function compareLocationCode(first: MapaUbicacion, second: MapaUbicacion): number {
  return (first.codigo || first.nombre).localeCompare(second.codigo || second.nombre, "es", {
    numeric: true,
    sensitivity: "base",
  });
}

function compareAislesSpatially(first: MapaUbicacion, second: MapaUbicacion): number {
  return compareLocationCode(second, first);
}

function aislePopulation(aisle: MapaUbicacion, children: MapaUbicacion[]) {
  return aggregateLocations([aisle, ...children]);
}

function createGroup(
  id: string,
  nombre: string,
  y: number,
  ubicaciones: MapaUbicacion[],
  rowHeight = NODE_HEIGHT + NODE_GAP_Y,
) {
  const rows = Math.max(1, Math.ceil(ubicaciones.length / 8));
  const height = GROUP_HEADER_HEIGHT + rows * rowHeight + 12;
  const aggregate = aggregateLocations(ubicaciones);
  return { id, nombre, y, height, ubicaciones, ...aggregate };
}

function positionGroup(
  group: MapaGrupoLayout,
  positions: Map<string, { x: number; y: number }>,
  rowOffset = 0,
) {
  const columns = Math.max(1, Math.min(8, group.ubicaciones.length));
  const rowWidth = columns * NODE_WIDTH + Math.max(0, columns - 1) * NODE_GAP_X;
  const startX = (CANVAS_WIDTH - rowWidth) / 2;

  group.ubicaciones.forEach((location, index) => {
    const column = index % 8;
    const row = Math.floor(index / 8);
    positions.set(location.id, {
      x: startX + column * (NODE_WIDTH + NODE_GAP_X) + NODE_WIDTH / 2,
      y:
        group.y +
        GROUP_HEADER_HEIGHT +
        rowOffset +
        row * (NODE_HEIGHT + NODE_GAP_Y) +
        NODE_HEIGHT / 2,
    });
  });
}

export function getMapa2DLayout(locations: MapaUbicacion[]): Mapa2DLayout {
  const positions = new Map<string, { x: number; y: number }>();
  const byId = new Map(locations.map((location) => [location.id, location]));
  const sections = locations.filter((location) => location.tipo === "seccion");
  const aisles = locations.filter((location) => location.tipo === "pasillo");
  const reserves = locations.filter((location) => location.tipo === "reserva");
  const boxes = locations.filter((location) => location.tipo === "caja");
  const crossings = locations.filter((location) => location.tipo === "cross");
  const used = new Set<string>([
    ...sections.map((location) => location.id),
    ...aisles.map((location) => location.id),
    ...reserves.map((location) => location.id),
    ...boxes.map((location) => location.id),
    ...crossings.map((location) => location.id),
  ]);
  let cursorY = 52;
  const perimeterLocations = [...crossings].sort(compareLocationCode);
  const perimeterGroup = createGroup(
    "perimetral",
    "Pasillo Perimetral · Zona de Tránsito",
    cursorY,
    perimeterLocations,
    NODE_HEIGHT + NODE_GAP_Y,
  );
  const perimeterHeight = GROUP_HEADER_HEIGHT + NODE_HEIGHT + 24;
  const perimeterLayout = { ...perimeterGroup, height: perimeterHeight };
  const perimeterGap = ARMORY_GAP;
  const perimeterNodeWidth = Math.min(
    NODE_WIDTH,
    (CONTENT_WIDTH - perimeterGap * Math.max(perimeterLocations.length - 1, 0)) /
      Math.max(perimeterLocations.length, 1),
  );
  const perimeterRowWidth =
    perimeterLocations.length * perimeterNodeWidth +
    Math.max(perimeterLocations.length - 1, 0) * perimeterGap;
  const perimeterStartX = (CANVAS_WIDTH - perimeterRowWidth) / 2;
  perimeterLocations.forEach((location, index) => {
    positions.set(location.id, {
      x: perimeterStartX + index * (perimeterNodeWidth + perimeterGap) + perimeterNodeWidth / 2,
      y: cursorY + GROUP_HEADER_HEIGHT + NODE_HEIGHT / 2 + 4,
    });
  });
  cursorY += perimeterHeight + 16;

  const reserveGroup = createGroup("reservas", "Reservas", cursorY, reserves);
  if (reserves.length > 0) {
    positionGroup(reserveGroup, positions);
    cursorY += reserveGroup.height + 16;
  }

  const crossingGroup = createGroup("cross", "Cross / Tránsito", cursorY, []);

  const sectionsById = new Map(sections.map((section) => [section.id, section]));
  const sectionAisles = new Map<string, MapaUbicacion[]>();
  const orphanAisles: MapaUbicacion[] = [];

  for (const aisle of aisles) {
    const sectionId =
      aisle.seccionId ?? (aisle.padreId && sectionsById.has(aisle.padreId) ? aisle.padreId : null);
    if (sectionId && sectionsById.has(sectionId)) {
      const current = sectionAisles.get(sectionId) ?? [];
      current.push(aisle);
      sectionAisles.set(sectionId, current);
    } else {
      orphanAisles.push(aisle);
    }
  }

  const aisleChildren = new Map<string, MapaUbicacion[]>();
  for (const aisle of aisles) {
    aisleChildren.set(
      aisle.id,
      locations.filter(
        (location) =>
          location.padreId === aisle.id &&
          (location.tipo === "armario" || location.tipo === "alto"),
      ),
    );
  }

  const sectionLayouts: MapaSeccionLayout[] = [];
  const sectionRoots: Array<{
    id: string;
    nombre: string;
    sectionLocation: MapaUbicacion | null;
    aisles: MapaUbicacion[];
  }> = sections.map((section) => ({
    id: section.id,
    nombre: section.nombre,
    sectionLocation: section,
    aisles: sectionAisles.get(section.id) ?? [],
  }));
  if (orphanAisles.length > 0) {
    sectionRoots.push({
      id: "__sin_seccion__",
      nombre: "Otras ubicaciones",
      sectionLocation: null,
      aisles: orphanAisles,
    });
  }

  const orderedSections = sectionRoots
    .map((root) => {
      const sectionAisleList = [...root.aisles].sort(compareAislesSpatially);
      const sectionLocations = sectionAisleList.flatMap((aisle) => [
        aisle,
        ...(aisleChildren.get(aisle.id) ?? []),
      ]);
      return {
        ...root,
        aisles: sectionAisleList,
        ...aggregateLocations(sectionLocations),
      };
    })
    .sort(
      (first, second) =>
        second.cantidadProductos - first.cantidadProductos ||
        second.totalUnidades - first.totalUnidades ||
        first.nombre.localeCompare(second.nombre, "es"),
    );

  const aislesHeadingY = orderedSections.length > 0 ? cursorY : null;
  if (aislesHeadingY !== null) cursorY += GROUP_HEADER_HEIGHT + 12;

  for (const {
    id,
    nombre,
    sectionLocation,
    aisles: sectionAisleList,
    cantidadProductos,
    totalUnidades: units,
  } of orderedSections) {
    const sectionY = cursorY;
    const aisleY = sectionY + 68;
    const aisleLayouts: MapaPasilloLayout[] = [];
    const columnWidth =
      sectionAisleList.length > 0
        ? Math.min(
            (CONTENT_WIDTH - AISLE_GAP * (sectionAisleList.length - 1)) / sectionAisleList.length,
            260,
          )
        : CONTENT_WIDTH;
    const sideWidth = Math.max(25, (columnWidth - AISLE_WIDTH - AISLE_GAP * 2) / 2);
    const aisleXStart =
      CONTENT_X + Math.max(0, (CONTENT_WIDTH - sectionAisleList.length * columnWidth) / 2);
    let maxAisleHeight = DEFAULT_AISLE_HEIGHT;

    sectionAisleList.forEach((aisle, index) => {
      const children = aisleChildren.get(aisle.id) ?? [];
      const leftChildren = children
        .filter((child) => child.lateral?.toLocaleLowerCase() === "izquierda")
        .sort(compareLocationCode);
      const rightChildren = children
        .filter((child) => child.lateral?.toLocaleLowerCase() !== "izquierda")
        .sort(compareLocationCode);
      const armoryCount = Math.max(leftChildren.length, rightChildren.length);
      const height = Math.max(
        DEFAULT_AISLE_HEIGHT,
        armoryCount > 0
          ? armoryCount * MIN_ARMORY_HEIGHT + (armoryCount - 1) * ARMORY_GAP
          : DEFAULT_AISLE_HEIGHT,
      );
      maxAisleHeight = Math.max(maxAisleHeight, height);
      const aisleX = aisleXStart + index * columnWidth + (columnWidth - AISLE_WIDTH) / 2;
      const leftX = aisleX - AISLE_GAP - sideWidth;
      const rightX = aisleX + AISLE_WIDTH + AISLE_GAP;
      const childHeight = (height - ARMORY_GAP * (armoryCount - 1)) / Math.max(armoryCount, 1);
      positions.set(aisle.id, { x: aisleX + AISLE_WIDTH / 2, y: aisleY + height / 2 });

      const setChildPositions = (sideChildren: MapaUbicacion[], x: number) => {
        sideChildren.forEach((child, childIndex) => {
          positions.set(child.id, {
            x: x + sideWidth / 2,
            y: aisleY + childIndex * (childHeight + ARMORY_GAP) + childHeight / 2,
          });
        });
      };
      setChildPositions(leftChildren, leftX);
      setChildPositions(rightChildren, rightX);
      const aisleLocations = [aisle, ...children];
      const aggregate = aggregateLocations(aisleLocations);
      aisleLayouts.push({
        location: aisle,
        x: aisleX,
        y: aisleY,
        width: AISLE_WIDTH,
        height,
        sideWidth,
        childHeight,
        childGap: ARMORY_GAP,
        leftX,
        rightX,
        leftChildren,
        rightChildren,
        ...aggregate,
      });
    });

    const sectionHeight = Math.max(108, 68 + maxAisleHeight + 20);
    if (sectionLocation)
      positions.set(sectionLocation.id, { x: CONTENT_X + 220, y: sectionY + 28 });
    sectionLayouts.push({
      id,
      nombre,
      x: CONTENT_X,
      y: sectionY,
      width: AISLE_WIDTH,
      height: sectionHeight,
      sectionLocation,
      aisles: aisleLayouts,
      cantidadProductos,
      totalUnidades: units,
    });
    cursorY += sectionHeight + 18;
  }

  const orphanChildren = locations.filter(
    (location) =>
      !used.has(location.id) &&
      location.tipo !== "seccion" &&
      location.tipo !== "armario" &&
      location.tipo !== "alto" &&
      !aisles.some((aisle) => aisleChildren.get(aisle.id)?.includes(location)),
  );
  const boxGroup = createGroup("cajas", "Cajas", cursorY, boxes.sort(byPopulation));
  if (boxes.length > 0) {
    positionGroup(boxGroup, positions);
    cursorY += boxGroup.height + 16;
  }

  const otherGroup = createGroup("otras", "Otras ubicaciones", cursorY, orphanChildren);
  if (orphanChildren.length > 0) {
    positionGroup(otherGroup, positions);
    cursorY += otherGroup.height + 16;
  }

  const assignedIds = new Set(positions.keys());
  const unpositioned = locations.filter((location) => !assignedIds.has(location.id));
  const unassignedGroup = createGroup(
    "sin-ubicacion",
    "Ubicaciones adicionales",
    cursorY,
    unpositioned,
  );
  if (unpositioned.length > 0) {
    positionGroup(unassignedGroup, positions);
    cursorY += unassignedGroup.height;
  }

  return {
    width: CANVAS_WIDTH,
    height: Math.max(600, cursorY + 20),
    reserves: reserveGroup,
    crossings: crossingGroup,
    sections: sectionLayouts,
    perimeter: perimeterLayout,
    boxes: boxGroup,
    other: otherGroup,
    unassigned: unassignedGroup,
    aislesHeadingY,
    positions,
  };
}
