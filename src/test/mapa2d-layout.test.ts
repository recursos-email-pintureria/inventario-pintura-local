import { describe, expect, it } from "vitest";
import { getMapa2DLayout, type MapaUbicacion } from "@/components/ubicaciones/mapa2d-layout";

const location = (
  fields: Pick<MapaUbicacion, "id" | "nombre" | "tipo"> & Partial<MapaUbicacion>,
): MapaUbicacion => ({
  codigo: fields.id,
  padreId: null,
  seccionId: null,
  lateral: null,
  numero: null,
  activo: true,
  capacidadMax: 100,
  productos: [],
  ...fields,
});

describe("getMapa2DLayout", () => {
  it("agrupa pasillos, reservas y cruces en sus zonas correspondientes", () => {
    const locations = [
      location({ id: "sec-1", nombre: "Pintura", tipo: "seccion" }),
      location({
        id: "pas-1",
        nombre: "Pasillo A1",
        tipo: "pasillo",
        padreId: "sec-1",
        seccionId: "sec-1",
      }),
      location({
        id: "arm-1",
        nombre: "Armario A1-01",
        tipo: "armario",
        padreId: "pas-1",
        lateral: "izquierda",
      }),
      location({
        id: "cross-1",
        nombre: "Cross A1",
        tipo: "cross",
        padreId: "pas-1",
      }),
      location({
        id: "res-1",
        nombre: "Reserva",
        tipo: "reserva",
        padreId: "sec-1",
        seccionId: "sec-1",
      }),
    ];

    const layout = getMapa2DLayout(locations);

    expect(layout.sections).toHaveLength(1);
    expect(layout.sections[0]?.aisles[0]?.location.id).toBe("pas-1");
    expect(layout.sections[0]?.aisles[0]?.leftChildren.map((item) => item.id)).toEqual(["arm-1"]);
    expect(layout.sections[0]?.aisles[0]?.rightChildren).toEqual([]);
    expect(layout.reserves.ubicaciones.map((item) => item.id)).toEqual(["res-1"]);
    expect(layout.perimeter.ubicaciones.map((item) => item.id)).toEqual(["cross-1"]);
    expect([...layout.positions.keys()]).toEqual(
      expect.arrayContaining(locations.map((item) => item.id)),
    );
  });

  it("mantiene ubicaciones sin sección en un grupo accesible", () => {
    const standalone = location({ id: "caja-1", nombre: "Caja 1", tipo: "caja" });

    const layout = getMapa2DLayout([standalone]);

    expect(layout.boxes.ubicaciones.map((item) => item.id)).toContain(standalone.id);
    expect(layout.positions.has(standalone.id)).toBe(true);
  });

  it("coloca primero la sección con más ubicaciones para que el mapa abra sobre el área ocupada", () => {
    const emptySection = location({ id: "sec-empty", nombre: "Vacía", tipo: "seccion" });
    const populatedSection = location({ id: "sec-stock", nombre: "Pintura", tipo: "seccion" });
    const aisle = location({
      id: "pasillo-stock",
      nombre: "Pasillo A1",
      tipo: "pasillo",
      padreId: populatedSection.id,
    });
    const child = location({
      id: "armario-stock",
      nombre: "Armario E651",
      tipo: "armario",
      padreId: aisle.id,
    });

    const layout = getMapa2DLayout([emptySection, populatedSection, aisle, child]);

    expect(layout.sections[0]?.id).toBe(populatedSection.id);
    expect(layout.positions.has(child.id)).toBe(true);
  });

  it("mantiene cada lado del pasillo en una sola columna vertical ordenada por código", () => {
    const section = location({ id: "sec-1", nombre: "Pintura", tipo: "seccion" });
    const aisle = location({
      id: "pas-1",
      codigo: "12",
      nombre: "Pasillo 12",
      tipo: "pasillo",
      padreId: section.id,
    });
    const rightChildren = Array.from({ length: 10 }, (_, index) =>
      location({
        id: `right-${index}`,
        codigo: `E${651 + index}`,
        nombre: `Armario E${651 + index}`,
        tipo: "armario",
        padreId: aisle.id,
        lateral: "derecha",
      }),
    );
    const leftChildren = Array.from({ length: 10 }, (_, index) =>
      location({
        id: `left-${index}`,
        codigo: `E${661 + index}`,
        nombre: `Armario E${661 + index}`,
        tipo: "armario",
        padreId: aisle.id,
        lateral: "izquierda",
      }),
    );

    const layout = getMapa2DLayout([section, aisle, ...rightChildren, ...leftChildren]);
    const positionedAisle = layout.sections[0]?.aisles[0];

    expect(positionedAisle?.leftChildren.map((child) => child.codigo)).toEqual(
      leftChildren.map((child) => child.codigo),
    );
    expect(positionedAisle?.rightChildren.map((child) => child.codigo)).toEqual(
      rightChildren.map((child) => child.codigo),
    );
    expect(positionedAisle?.childHeight).toBeGreaterThanOrEqual(25);
    expect(positionedAisle?.childGap).toBe(2);
    expect(rightChildren.every((child) => layout.positions.has(child.id))).toBe(true);
    expect(leftChildren.every((child) => layout.positions.has(child.id))).toBe(true);
    expect(layout.positions.get(rightChildren[0]!.id)?.y).toBeLessThan(
      layout.positions.get(rightChildren[9]!.id)!.y,
    );
    expect(layout.positions.get(leftChildren[0]!.id)?.y).toBeLessThan(
      layout.positions.get(leftChildren[9]!.id)!.y,
    );
    expect(positionedAisle?.leftX).toBeLessThan(positionedAisle!.x);
    expect(positionedAisle?.rightX).toBeGreaterThan(positionedAisle!.x);
  });

  it("ordena pasillos físicamente del número mayor a la izquierda al menor a la derecha", () => {
    const firstAisle = location({
      id: "pasillo-12",
      codigo: "12",
      nombre: "Pasillo 12",
      tipo: "pasillo",
    });
    const secondAisle = location({
      id: "pasillo-20",
      codigo: "20",
      nombre: "Pasillo 20",
      tipo: "pasillo",
    });
    const firstChild = location({
      id: "armario-a",
      nombre: "Armario A",
      tipo: "armario",
      padreId: firstAisle.id,
      productos: [
        {
          id: "prod-a",
          sku: "A",
          nombre: "Producto A",
          categoria: "",
          cantidad: 1,
          stock_minimo: 0,
        },
      ],
    });
    const secondChild = location({
      id: "armario-b",
      nombre: "Armario B",
      tipo: "armario",
      padreId: secondAisle.id,
      productos: [
        {
          id: "prod-b",
          sku: "B",
          nombre: "Producto B",
          categoria: "",
          cantidad: 1,
          stock_minimo: 0,
        },
        {
          id: "prod-c",
          sku: "C",
          nombre: "Producto C",
          categoria: "",
          cantidad: 1,
          stock_minimo: 0,
        },
      ],
    });

    const layout = getMapa2DLayout([firstAisle, secondAisle, firstChild, secondChild]);

    expect(layout.sections[0]?.nombre).toBe("Otras ubicaciones");
    expect(layout.sections[0]?.aisles[0]?.location.id).toBe(secondAisle.id);
    expect(layout.sections[0]?.aisles[1]?.location.id).toBe(firstAisle.id);
    expect(layout.positions.get(secondAisle.id)?.x).toBeLessThan(
      layout.positions.get(firstAisle.id)!.x,
    );
  });

  it("coloca los pasillos 20, 18, 16, 14 y 12 de izquierda a derecha", () => {
    const section = location({ id: "sec-pintura", nombre: "Pintura", tipo: "seccion" });
    const aisles = [12, 14, 16, 18, 20].map((number) =>
      location({
        id: `pasillo-${number}`,
        codigo: String(number),
        nombre: `Pasillo ${number}`,
        tipo: "pasillo",
        padreId: section.id,
        seccionId: section.id,
      }),
    );
    const layout = getMapa2DLayout([section, ...aisles]);
    const sortedAisles = layout.sections[0]?.aisles ?? [];

    expect(sortedAisles.map((item) => item.location.codigo)).toEqual([
      "20",
      "18",
      "16",
      "14",
      "12",
    ]);
    expect(sortedAisles.map((item) => item.x)).toEqual(
      [...sortedAisles.map((item) => item.x)].sort((first, second) => first - second),
    );
  });

  it("coloca las ubicaciones perimetrales en una fila horizontal ordenada", () => {
    const crossings = ["E744", "E741", "E743", "E742"].map((codigo) =>
      location({
        id: codigo,
        codigo,
        nombre: `Cross ${codigo}`,
        tipo: "cross",
      }),
    );
    const layout = getMapa2DLayout(crossings);

    expect(layout.perimeter.ubicaciones.map((item) => item.codigo)).toEqual([
      "E741",
      "E742",
      "E743",
      "E744",
    ]);
    const positions = crossings
      .sort((first, second) => first.codigo.localeCompare(second.codigo, "es", { numeric: true }))
      .map((item) => layout.positions.get(item.id)!);
    expect(new Set(positions.map((position) => position.y)).size).toBe(1);
    expect(positions.map((position) => position.x)).toEqual(
      [...positions.map((position) => position.x)].sort((first, second) => first - second),
    );
  });
});
