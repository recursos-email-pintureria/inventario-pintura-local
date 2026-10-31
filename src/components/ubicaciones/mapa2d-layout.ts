export type MapaTipoUbicacion = "seccion" | "pasillo" | "reserva" | "armario" | "caja" | "cross";

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

export interface MapaSeccionLayout {
  id: string;
  nombre: string;
  x: number;
  y: number;
  width: number;
  height: number;
  sectionLocation: MapaUbicacion | null;
  aisles: Array<{
    location: MapaUbicacion;
    y: number;
    height: number;
    leftRows: number;
    rightRows: number;
    leftChildren: MapaUbicacion[];
    rightChildren: MapaUbicacion[];
  }>;
  directLocations: MapaUbicacion[];
}

export function getMapa2DLayout(locations: MapaUbicacion[]) {
  const sections = locations.filter((location) => location.tipo === "seccion");
  const roots: Array<{
    id: string;
    nombre: string;
    sectionLocation: MapaUbicacion | null;
  }> = sections.length
    ? sections.map((location) => ({
        id: location.id,
        nombre: location.nombre,
        sectionLocation: location,
      }))
    : [{ id: "__almacen__", nombre: "Almacén", sectionLocation: null }];
  const layouts: MapaSeccionLayout[] = [];
  const positions = new Map<string, { x: number; y: number }>();
  const width = 560;
  const gapX = 24;
  const gapY = 24;
  const rowHeights: number[] = [];

  const sectionsData = roots
    .map((section) => {
      const sectionId = section.id;
      const aisles = locations.filter(
        (location) =>
          location.tipo === "pasillo" &&
          (location.padreId === sectionId || location.seccionId === sectionId),
      );
      const aisleLayouts = aisles.map((aisle) => {
        const children = locations.filter(
          (location) => location.padreId === aisle.id && location.tipo !== "seccion",
        );
        return {
          location: aisle,
          leftChildren: children.filter((child) => child.lateral === "izquierda"),
          rightChildren: children.filter((child) => child.lateral !== "izquierda"),
        };
      });
      const directLocations = locations.filter(
        (location) =>
          location.tipo !== "seccion" &&
          location.tipo !== "pasillo" &&
          (location.padreId === sectionId ||
            (location.seccionId === sectionId && !location.padreId)),
      );
      const directRows = Math.ceil(directLocations.length / 5);
      return {
        ...section,
        aisles: aisleLayouts.map((aisle) => {
          const leftRows = Math.ceil(aisle.leftChildren.length / 5);
          const rightRows = Math.ceil(aisle.rightChildren.length / 5);
          return {
            ...aisle,
            y: 0,
            leftRows,
            rightRows,
            height: leftRows * 38 + 38 + rightRows * 38 + 12,
          };
        }),
        directLocations,
        height: Math.max(
          130,
          80 +
            aisleLayouts.reduce(
              (total, aisle) =>
                total +
                Math.ceil(aisle.leftChildren.length / 5) * 38 +
                38 +
                Math.ceil(aisle.rightChildren.length / 5) * 38 +
                12,
              0,
            ) +
            directRows * 72 +
            (directRows > 0 ? 28 : 0),
        ),
      };
    })
    .sort(
      (first, second) =>
        second.aisles.reduce(
          (count, aisle) => count + 1 + aisle.leftChildren.length + aisle.rightChildren.length,
          second.directLocations.length,
        ) -
        first.aisles.reduce(
          (count, aisle) => count + 1 + aisle.leftChildren.length + aisle.rightChildren.length,
          first.directLocations.length,
        ),
    );

  for (let index = 0; index < sectionsData.length; index += 2) {
    const first = sectionsData[index];
    if (first) {
      rowHeights.push(Math.max(first.height, sectionsData[index + 1]?.height ?? 0));
    }
  }

  let rowY = 16;
  for (let row = 0; row < rowHeights.length; row += 1) {
    for (let column = 0; column < 2; column += 1) {
      const data = sectionsData[row * 2 + column];
      if (!data) continue;

      const x = 16 + column * (width + gapX);
      const y = rowY;
      let aisleCursorY = y + 64;
      const aisleLayouts = data.aisles.map((aisle) => {
        const aisleY = aisleCursorY + aisle.leftRows * 38 + 6;
        const placeChildren = (children: MapaUbicacion[], rowCount: number, above: boolean) => {
          for (let row = 0; row < rowCount; row += 1) {
            const rowChildren = children.slice(row * 5, (row + 1) * 5);
            const cellWidth = 96;
            const gap = 6;
            const rowWidth = rowChildren.length * cellWidth + (rowChildren.length - 1) * gap;
            const startX = x + (width - rowWidth) / 2;
            const childY = above ? aisleY - rowCount * 38 + row * 38 : aisleY + 38 + row * 38;

            rowChildren.forEach((child, childIndex) => {
              const childX = startX + childIndex * (cellWidth + gap);
              positions.set(child.id, { x: childX + cellWidth / 2, y: childY + 17 });
            });
          }
        };

        positions.set(aisle.location.id, { x: x + width / 2, y: aisleY + 18 });
        placeChildren(aisle.leftChildren, aisle.leftRows, true);
        placeChildren(aisle.rightChildren, aisle.rightRows, false);
        aisleCursorY += aisle.height;
        return { ...aisle, y: aisleY };
      });

      data.directLocations.forEach((location, index) => {
        const cellX = x + 16 + (index % 5) * 106;
        const cellY = aisleCursorY + 8 + Math.floor(index / 5) * 72;
        positions.set(location.id, { x: cellX + 48, y: cellY + 22 });
      });
      if (data.sectionLocation) {
        positions.set(data.sectionLocation.id, { x: x + width / 2, y: y + 28 });
      }

      layouts.push({
        id: data.id,
        nombre: data.nombre,
        x,
        y,
        width,
        height: data.height,
        sectionLocation: data.sectionLocation,
        aisles: aisleLayouts,
        directLocations: data.directLocations,
      });
    }
    rowY += (rowHeights[row] ?? 0) + gapY;
  }

  const knownIds = new Set(positions.keys());
  const unplaced = locations.filter((location) => !knownIds.has(location.id));
  if (unplaced.length > 0) {
    const x = 16;
    const y = rowY;
    const height = 80 + Math.ceil(unplaced.length / 5) * 72;
    unplaced.forEach((location, index) => {
      positions.set(location.id, {
        x: x + 16 + (index % 5) * 106 + 48,
        y: y + 32 + Math.floor(index / 5) * 72,
      });
    });
    layouts.push({
      id: "__sin_seccion__",
      nombre: "Otras ubicaciones",
      x,
      y,
      width,
      height,
      sectionLocation: null,
      aisles: [],
      directLocations: unplaced,
    });
    rowY += height + gapY;
  }

  return { sections: layouts, positions, height: Math.max(800, rowY) };
}
