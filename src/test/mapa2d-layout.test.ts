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
  it("agrupa pasillos y sus ubicaciones hijas y coloca reservas junto a la sección", () => {
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
    expect(layout.sections[0]?.aisles[0]?.rightChildren.map((item) => item.id)).toEqual([
      "cross-1",
    ]);
    expect(layout.sections[0]?.directLocations.map((item) => item.id)).toEqual(["res-1"]);
    expect([...layout.positions.keys()]).toEqual(
      expect.arrayContaining(locations.map((item) => item.id)),
    );
  });

  it("mantiene ubicaciones sin sección en un grupo accesible", () => {
    const standalone = location({ id: "caja-1", nombre: "Caja 1", tipo: "caja" });

    const layout = getMapa2DLayout([standalone]);

    expect(layout.sections.at(-1)?.nombre).toBe("Otras ubicaciones");
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
});
