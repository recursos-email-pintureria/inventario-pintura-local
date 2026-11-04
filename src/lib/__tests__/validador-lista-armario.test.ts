import { describe, expect, it } from "vitest";
import type { FilaCSV } from "../parser-lista-armario";
import { validarFilasCSV } from "../validador-lista-armario";

const opcionesSumar = { modo: "sumar", duplicados: "sumar" } as const;
const opcionesRechazar = { modo: "establecer", duplicados: "rechazar" } as const;

function fila(overrides: Partial<FilaCSV> = {}): FilaCSV {
  return {
    numeroFila: 2,
    nombre: "Barniz",
    referencia: "REF-01",
    ean: "EAN-01",
    cantidadTexto: "12",
    raw: {},
    ...overrides,
  };
}

describe("validarFilasCSV", () => {
  it("rechaza una fila sin SKU", () => {
    const resultado = validarFilasCSV([fila({ referencia: null })], opcionesSumar);

    expect(resultado.filasConError[0]).toMatchObject({
      estado: "error",
      motivo: "Falta REFERENCIA o EAN",
    });
  });

  it("rechaza una fila sin EAN", () => {
    const resultado = validarFilasCSV([fila({ ean: null })], opcionesSumar);

    expect(resultado.filasConError[0]).toMatchObject({
      estado: "error",
      motivo: "Falta REFERENCIA o EAN",
    });
  });

  it("rechaza una fila sin nombre", () => {
    const resultado = validarFilasCSV([fila({ nombre: null })], opcionesSumar);

    expect(resultado.filasConError[0]).toMatchObject({
      estado: "error",
      motivo: "Falta NOMBRE",
    });
  });

  it.each([null, "", "0", "0,0"])("omite una cantidad vacía o cero (%s)", (cantidadTexto) => {
    const resultado = validarFilasCSV([fila({ cantidadTexto })], opcionesSumar);

    expect(resultado.filasConError[0]).toMatchObject({
      estado: "omitida",
      motivo: "Cantidad vacía o cero",
    });
  });

  it.each([
    ["12", 12],
    ["12,0", 12],
  ])("acepta cantidad entera %s", (cantidadTexto, cantidad) => {
    const resultado = validarFilasCSV([fila({ cantidadTexto })], opcionesSumar);

    expect(resultado.filasValidas[0]).toMatchObject({
      cantidad,
      estado: "valida",
    });
  });

  it("rechaza cantidades fraccionarias", () => {
    const resultado = validarFilasCSV([fila({ cantidadTexto: "12,5" })], opcionesSumar);

    expect(resultado.filasConError[0]).toMatchObject({
      estado: "error",
      motivo: "La cantidad debe ser un número entero",
    });
  });

  it("rechaza cantidades no numéricas", () => {
    const resultado = validarFilasCSV([fila({ cantidadTexto: "abc" })], opcionesSumar);

    expect(resultado.filasConError[0]).toMatchObject({
      estado: "error",
      motivo: "Cantidad no válida",
    });
  });

  it("acepta un EAN-13 válido sin aviso", () => {
    const resultado = validarFilasCSV([fila({ ean: "4006381333931" })], opcionesSumar);

    expect(resultado.filasValidas[0]).toMatchObject({ estado: "valida" });
    expect(resultado.resumen.avisos).toBe(0);
  });

  it("marca un EAN-13 con dígito incorrecto como aviso", () => {
    const resultado = validarFilasCSV([fila({ ean: "4006381333932" })], opcionesSumar);

    expect(resultado.filasValidas[0]).toMatchObject({
      estado: "aviso",
      aviso: "EAN-13 con dígito de control incorrecto",
    });
    expect(resultado.resumen.avisos).toBe(1);
  });

  it("acepta EAN de 8 dígitos sin validar dígito de control", () => {
    const resultado = validarFilasCSV([fila({ ean: "12345678" })], opcionesSumar);

    expect(resultado.filasValidas[0]).toMatchObject({ estado: "valida" });
  });

  it("marca los duplicados como conflicto cuando la opción es rechazar", () => {
    const resultado = validarFilasCSV(
      [fila({ numeroFila: 2 }), fila({ numeroFila: 3, cantidadTexto: "4" })],
      opcionesRechazar,
    );

    expect(resultado.filasValidas).toEqual([]);
    expect(resultado.filasConError).toHaveLength(2);
    expect(resultado.filasConError[0]).toMatchObject({
      estado: "conflicto",
      motivo: "SKU+EAN duplicado en el CSV",
    });
    expect(resultado.resumen.conflictos).toBe(2);
  });

  it("suma duplicados a la primera fila y omite las siguientes", () => {
    const resultado = validarFilasCSV(
      [fila({ numeroFila: 2, cantidadTexto: "12" }), fila({ numeroFila: 3, cantidadTexto: "4" })],
      opcionesSumar,
    );

    expect(resultado.filasValidas).toHaveLength(1);
    expect(resultado.filasValidas[0]).toMatchObject({
      numeroFila: 2,
      cantidad: 16,
    });
    expect(resultado.filasConError[0]).toMatchObject({
      numeroFila: 3,
      estado: "omitida",
      motivo: "Cantidad sumada a la fila 2",
    });
  });

  it("detecta el mismo SKU asociado a EAN distintos", () => {
    const resultado = validarFilasCSV(
      [fila({ numeroFila: 2, ean: "EAN-01" }), fila({ numeroFila: 3, ean: "EAN-02" })],
      opcionesSumar,
    );

    expect(resultado.filasConError).toHaveLength(2);
    expect(resultado.filasConError[0]).toMatchObject({
      estado: "conflicto",
      motivo: "SKU/EAN cruzado con otra fila del CSV",
    });
  });

  it("detecta el mismo EAN asociado a SKU distintos", () => {
    const resultado = validarFilasCSV(
      [
        fila({ numeroFila: 2, referencia: "REF-01", ean: "EAN-01" }),
        fila({ numeroFila: 3, referencia: "REF-02", ean: "EAN-01" }),
      ],
      opcionesSumar,
    );

    expect(resultado.filasConError).toHaveLength(2);
    expect(resultado.filasConError[0]).toMatchObject({
      estado: "conflicto",
      motivo: "SKU/EAN cruzado con otra fila del CSV",
    });
  });
});
