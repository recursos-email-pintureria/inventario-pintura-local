import { describe, expect, it } from "vitest";
import {
  getMapa2DLayout,
  getMapaStockLevel,
  getMapaTipoVisual,
  type MapaUbicacion,
} from "@/components/ubicaciones/mapa2d-layout";

const location = (
  fields: Pick<MapaUbicacion, "id" | "codigo" | "nombre" | "tipo"> & Partial<MapaUbicacion>,
): MapaUbicacion => ({
  padreId: null,
  seccionId: null,
  lateral: null,
  numero: null,
  activo: true,
  capacidadMax: 100,
  productos: [],
  ...fields,
});

function armories(
  from: number,
  to: number,
  aisle: MapaUbicacion,
  side: "izquierda" | "derecha",
): MapaUbicacion[] {
  return Array.from({ length: to - from + 1 }, (_, index) => {
    const code = `E${from + index}`;
    return location({
      id: code,
      codigo: code,
      nombre: `Armario ${code}`,
      tipo: "armario",
      padreId: aisle.id,
      seccionId: aisle.seccionId,
      lateral: side,
    });
  });
}

describe("getMapa2DLayout", () => {
  it("coloca los pasillos 20, 18, 16, 14 y 12 de izquierda a derecha", () => {
    const section = location({
      id: "sec-pintura",
      codigo: "PINT",
      nombre: "Pintura",
      tipo: "seccion",
    });
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

    expect(layout.aisles.map((item) => item.location.codigo)).toEqual([
      "20",
      "18",
      "16",
      "14",
      "12",
    ]);
    expect(layout.aisles.map((item) => item.x)).toEqual(
      [...layout.aisles.map((item) => item.x)].sort((first, second) => first - second),
    );
  });

  it("posiciona armarios de los cinco pasillos según el plano exacto", () => {
    const aisles = [12, 14, 16, 18, 20].map((number) =>
      location({
        id: `pasillo-${number}`,
        codigo: String(number),
        nombre: `Pasillo ${number}`,
        tipo: "pasillo",
      }),
    );
    const allArmories = [
      ...armories(651, 658, aisles[0]!, "derecha"),
      ...armories(659, 670, aisles[0]!, "izquierda"),
      ...armories(671, 683, aisles[1]!, "derecha"),
      ...armories(684, 697, aisles[1]!, "izquierda"),
      ...armories(698, 710, aisles[2]!, "derecha"),
      ...armories(711, 716, aisles[2]!, "izquierda"),
      ...armories(717, 728, aisles[3]!, "derecha"),
      ...armories(729, 734, aisles[3]!, "izquierda"),
    ];
    const layout = getMapa2DLayout([...aisles, ...allArmories]);
    const layoutByAisle = new Map(
      layout.aisles.map((aisle) => [Number(aisle.location.codigo), aisle]),
    );

    const aisleLocations: Array<[number, number, number, number, number]> = [
      [12, 651, 658, 659, 670],
      [14, 671, 683, 684, 697],
      [16, 698, 710, 711, 716],
      [18, 717, 728, 729, 734],
    ];
    for (const [aisleNo, rightFrom, rightTo, leftFrom, leftTo] of aisleLocations) {
      const aisle = layoutByAisle.get(aisleNo);
      expect(aisle?.rightChildren.map((item) => item.codigo)).toEqual(
        Array.from({ length: rightTo - rightFrom + 1 }, (_, index) => `E${rightFrom + index}`),
      );
      expect(aisle?.leftChildren.map((item) => item.codigo)).toEqual(
        Array.from({ length: leftTo - leftFrom + 1 }, (_, index) => `E${leftFrom + index}`),
      );
      expect(aisle?.armoryHeight).toBeGreaterThanOrEqual(25);
      expect(aisle?.armoryGap).toBe(2);
      expect(aisle?.leftX).toBeLessThan(aisle!.x);
      expect(aisle?.rightX).toBeGreaterThan(aisle!.x);
    }

    const aisle12 = layoutByAisle.get(12)!;
    expect(layout.positions.get(aisle12.rightChildren[0]!.id)!.y).toBeGreaterThan(
      layout.positions.get(aisle12.rightChildren.at(-1)!.id)!.y,
    );
    expect(layout.positions.get(aisle12.leftChildren[0]!.id)!.y).toBeLessThan(
      layout.positions.get(aisle12.leftChildren.at(-1)!.id)!.y,
    );

    for (const aisleNo of [14, 16, 18]) {
      const aisle = layoutByAisle.get(aisleNo)!;
      expect(layout.positions.get(aisle.rightChildren[0]!.id)!.y).toBeGreaterThan(
        layout.positions.get(aisle.rightChildren.at(-1)!.id)!.y,
      );
      expect(layout.positions.get(aisle.leftChildren[0]!.id)!.y).toBeGreaterThan(
        layout.positions.get(aisle.leftChildren.at(-1)!.id)!.y,
      );
    }
  });

  it("ordena el perimetral E735-E744 de derecha a izquierda y lo separa de pasillos", () => {
    const locations = Array.from({ length: 10 }, (_, index) => {
      const code = `E${735 + index}`;
      return location({
        id: code,
        codigo: code,
        nombre: `Armario ${code}`,
        tipo: "armario",
      });
    }).reverse();
    const layout = getMapa2DLayout(locations);

    expect(layout.perimeterLocations.map((item) => item.codigo)).toEqual([
      "E735",
      "E736",
      "E737",
      "E738",
      "E739",
      "E740",
      "E741",
      "E742",
      "E743",
      "E744",
    ]);
    const xPositions = layout.perimeterLocations.map((item) => layout.positions.get(item.id)!.x);
    expect(xPositions).toEqual([...xPositions].sort((first, second) => second - first));
    expect(
      new Set(layout.perimeterLocations.map((item) => layout.positions.get(item.id)!.y)),
    ).toHaveProperty("size", 1);
    expect(layout.aisles).toHaveLength(0);
    expect(layout.reserves).toHaveLength(0);
    expect(getMapaTipoVisual(locations[0]!)).toBe("perimetral");
  });

  it("mantiene visible la zona perimetral aunque no tenga ubicaciones hijas", () => {
    const perimeter = location({
      id: "pasillo-perimetral",
      codigo: "PERIMETRAL-(HER",
      nombre: "Perimetral (Herramientas)",
      tipo: "pasillo",
    });

    const layout = getMapa2DLayout([perimeter]);

    expect(layout.perimeterAisle?.id).toBe(perimeter.id);
    expect(layout.aisles).toHaveLength(0);
    expect(layout.perimeterLocations).toHaveLength(0);
  });

  it("ubica en el perimetral sus ubicaciones hijas E735-E744", () => {
    const perimeter = location({
      id: "pasillo-perimetral",
      codigo: "PERIMETRAL",
      nombre: "Perimetral (Herramientas)",
      tipo: "pasillo",
    });
    const children = Array.from({ length: 10 }, (_, index) => {
      const code = `E${735 + index}`;
      return location({
        id: code,
        codigo: code,
        nombre: `Armario ${code}`,
        tipo: "armario",
        padreId: perimeter.id,
      });
    });

    const layout = getMapa2DLayout([perimeter, ...children]);

    expect(layout.perimeterLocations.map((item) => item.codigo)).toEqual([
      "E735",
      "E736",
      "E737",
      "E738",
      "E739",
      "E740",
      "E741",
      "E742",
      "E743",
      "E744",
    ]);
  });

  it("coloca cruces al inicio derecho y al final izquierdo de cada pasillo", () => {
    const aisle = location({
      id: "pas-12",
      codigo: "12",
      nombre: "Pasillo 12",
      tipo: "pasillo",
    });
    const crosses = ["X01", "X02"].map((code) =>
      location({
        id: code,
        codigo: code,
        nombre: `Cross ${code}`,
        tipo: "cross",
        padreId: aisle.id,
      }),
    );
    const layout = getMapa2DLayout([aisle, ...crosses]);
    const aisleLayout = layout.aisles[0]!;
    const start = layout.positions.get(aisleLayout.startCrosses[0]!.id)!;
    const end = layout.positions.get(aisleLayout.endCrosses[0]!.id)!;

    expect(aisleLayout.startCrosses.map((item) => item.codigo)).toEqual(["X01"]);
    expect(aisleLayout.endCrosses.map((item) => item.codigo)).toEqual(["X02"]);
    expect(start.x).toBeGreaterThan(end.x);
    expect(start.y).toBeLessThan(end.y);
  });

  it("cuenta productos únicos en el resumen del pasillo", () => {
    const aisle = location({
      id: "pasillo-12",
      codigo: "12",
      nombre: "Pasillo 12",
      tipo: "pasillo",
    });
    const product = {
      id: "prod-1",
      sku: "SKU-1",
      nombre: "Producto",
      categoria: "Pintura",
      cantidad: 3,
      stock_minimo: 1,
    };
    const armory = location({
      id: "E651",
      codigo: "E651",
      nombre: "Armario E651",
      tipo: "armario",
      padreId: aisle.id,
      productos: [product],
    });
    const secondArmory = location({
      id: "E652",
      codigo: "E652",
      nombre: "Armario E652",
      tipo: "armario",
      padreId: aisle.id,
      productos: [{ ...product, cantidad: 5 }],
    });

    const layout = getMapa2DLayout([aisle, armory, secondArmory]);

    expect(layout.aisles[0]?.cantidadProductos).toBe(1);
    expect(layout.aisles[0]?.totalUnidades).toBe(8);
  });

  it("coloca la reserva debajo de los pasillos y palets dentro de su zona", () => {
    const aisle = location({
      id: "pas-12",
      codigo: "12",
      nombre: "Pasillo 12",
      tipo: "pasillo",
    });
    const reserve = location({
      id: "reserva",
      codigo: "RES",
      nombre: "Reserva",
      tipo: "reserva",
      palets: Array.from({ length: 4 }, (_, index) => ({
        id: `palet-${index + 1}`,
        idReserva: "reserva",
        numero: index + 1,
        codigo: `PAL-${index + 1}`,
        stockTotal: 10,
        productos: [],
      })),
    });
    const layout = getMapa2DLayout([aisle, reserve]);

    expect(layout.reserves[0]?.y).toBeGreaterThan(layout.aisles[0]!.y + layout.aisles[0]!.height);
    for (const pallet of reserve.palets ?? []) {
      const position = layout.positions.get(pallet.id);
      expect(position?.x).toBeGreaterThan(layout.reserves[0]!.x);
      expect(position?.x).toBeLessThan(layout.reserves[0]!.x + layout.reserves[0]!.width);
      expect(position?.y).toBeGreaterThan(layout.reserves[0]!.y);
      expect(position?.y).toBeLessThan(layout.reserves[0]!.y + layout.reserves[0]!.height);
    }
  });

  it("calcula el nivel visual de stock de palets sin stock, bajo, medio y normal", () => {
    const product = {
      id: "prod-1",
      sku: "SKU-1",
      nombre: "Producto",
      categoria: "Pintura",
      cantidad: 0,
      stock_minimo: 5,
    };

    expect(getMapaStockLevel([], 0)).toBe("vacio");
    expect(getMapaStockLevel([{ ...product, cantidad: 4 }], 4)).toBe("critico");
    expect(getMapaStockLevel([{ ...product, cantidad: 8 }], 8)).toBe("medio");
    expect(getMapaStockLevel([{ ...product, cantidad: 20 }], 20)).toBe("normal");
  });
});
