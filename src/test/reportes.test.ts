import { describe, expect, it } from "vitest";
import {
  calcularResumen,
  crearInformePalet,
  crearInformePasillo,
  crearInformeUbicacion,
  type GrupoInforme,
  type ProductoInforme,
} from "@/lib/reportes";

const producto = (overrides: Partial<ProductoInforme>) => ({
  sku: "SKU-1",
  nombre: "Producto",
  categoria: "Categoría",
  cantidad: 10,
  stock_minimo: 5,
  ...overrides,
});

describe("crearInformeUbicacion", () => {
  it("crea el informe de un armario", () => {
    const informe = crearInformeUbicacion(
      {
        id: "arm-1",
        nombre: "Armario A1-01",
        codigo: "A1-01",
        tipo: "armario",
        productos: [producto({ sku: "LAT-1", nombre: "Látex blanco", cantidad: 20 })],
      },
      { generadoPor: "Ana", seccion: "Pintura", pasillo: "Pasillo A1" },
    );

    expect(informe.titulo).toContain("armario");
    expect(informe.subtitulo).toBe("Pintura > Pasillo A1");
    expect(informe.grupos).toHaveLength(1);
    expect(informe.grupos[0]?.tipo).toBe("armario");
    expect(informe.grupos[0]?.filas[0]?.estado).toBe("OK");
  });

  it("crea el informe de una caja independiente", () => {
    const informe = crearInformeUbicacion(
      {
        id: "caja-1",
        nombre: "Caja de tornillería",
        tipo: "caja",
        productos: [producto({ sku: "TOR-1", nombre: "Tornillo", cantidad: 0 })],
      },
      { generadoPor: "Ana", seccion: "Ferretería" },
    );

    expect(informe.titulo).toContain("caja");
    expect(informe.grupos[0]?.tipo).toBe("caja");
    expect(informe.grupos[0]?.filas[0]?.estado).toBe("AGOTADO");
  });

  it("normaliza cantidades no finitas antes de calcular el estado", () => {
    const informe = crearInformeUbicacion(
      {
        id: "arm-2",
        nombre: "Armario A1-02",
        tipo: "armario",
        productos: [producto({ sku: "NAN-1", cantidad: Number.NaN, stock_minimo: Number.NaN })],
      },
      { generadoPor: "Ana", seccion: "Pintura" },
    );

    expect(informe.grupos[0]?.filas[0]).toMatchObject({
      cantidad: 0,
      stockMinimo: 0,
      estado: "AGOTADO",
    });
  });

  it("crea el informe de un cross", () => {
    const informe = crearInformeUbicacion(
      {
        id: "cross-1",
        nombre: "Cross A1-03",
        tipo: "cross",
        productos: [producto({ sku: "ESM-1", nombre: "Esmalte", cantidad: 3, stock_minimo: 5 })],
      },
      { generadoPor: "Ana", seccion: "Pintura", pasillo: "Pasillo A1" },
    );

    expect(informe.titulo).toContain("cross");
    expect(informe.grupos[0]?.tipo).toBe("cross");
    expect(informe.grupos[0]?.filas[0]?.estado).toBe("BAJO");
  });
});

describe("crearInformePasillo", () => {
  it("agrupa todos los armarios y cross, incluyendo los vacíos", () => {
    const informe = crearInformePasillo(
      { id: "pas-1", nombre: "Pasillo A1" },
      [
        {
          id: "arm-1",
          nombre: "Armario A1-01",
          tipo: "armario",
          productos: [producto({ cantidad: 10 })],
        },
        {
          id: "cross-1",
          nombre: "Cross A1-03",
          tipo: "cross",
          productos: [],
        },
        {
          id: "caja-1",
          nombre: "Caja fuera del pasillo",
          tipo: "caja",
          productos: [producto({ cantidad: 4 })],
        },
      ],
      { generadoPor: "Ana", seccion: "Pintura" },
    );

    expect(informe.grupos).toHaveLength(2);
    expect(informe.grupos.map((grupo) => grupo.tipo)).toEqual(["armario", "cross"]);
    expect(informe.grupos[1]?.filas).toHaveLength(0);
    expect(informe.resumen.unidades).toBe(10);
  });
});

describe("resumen y palet", () => {
  it("calcula referencias, unidades y estados", () => {
    const grupos: GrupoInforme[] = [
      {
        id: "g1",
        titulo: "Grupo",
        tipo: "armario",
        filas: [
          {
            grupo: "Grupo",
            ubicacion: "A",
            sku: "1",
            nombre: "Uno",
            categoria: "-",
            cantidad: 0,
            stockMinimo: 0,
            estado: "AGOTADO",
          },
          {
            grupo: "Grupo",
            ubicacion: "A",
            sku: "2",
            nombre: "Dos",
            categoria: "-",
            cantidad: 2,
            stockMinimo: 5,
            estado: "BAJO",
          },
        ],
      },
    ];

    expect(calcularResumen(grupos)).toMatchObject({
      referencias: 2,
      unidades: 2,
      lineasBajo: 1,
      lineasAgotadas: 1,
    });
  });

  it("crea el desglose de un palet", () => {
    const informe = crearInformePalet(
      {
        id: "palet-1",
        numero_palet: 3,
        codigo_barras: "PAL-003-Ana-03112026",
        generado_por: "Ana",
        generado_en: "2026-11-03T10:00:00.000Z",
        productos: [producto({ cantidad: 7 })],
      },
      { generadoPor: "Ana", seccion: "Reserva" },
    );

    expect(informe.titulo).toContain("PAL-003-Ana-03112026");
    expect(informe.grupos[0]?.titulo).toBe("Palet #003");
    expect(informe.resumen.unidades).toBe(7);
  });
});
