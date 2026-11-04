import { describe, expect, it } from "vitest";
import { parsearCSVArmario, parsearCSVArmarioDesdeBytes } from "../parser-lista-armario";

describe("parsearCSVArmario", () => {
  it("parsea punto y coma y conserva cantidades con coma decimal", () => {
    const resultado = parsearCSVArmario(
      "NOMBRE;REFERENCIA;EAN;CANTIDAD\nBarniz;REF-01;0123456789012;12,0",
    );

    expect(resultado.erroresParseo).toEqual([]);
    expect(resultado.filas).toHaveLength(1);
    expect(resultado.filas[0]).toMatchObject({
      nombre: "Barniz",
      referencia: "REF-01",
      ean: "0123456789012",
      cantidadTexto: "12,0",
    });
  });

  it("normaliza saltos de línea dobles CRLF", () => {
    const resultado = parsearCSVArmario(
      "NOMBRE;REFERENCIA;EAN;CANTIDAD\r\r\nBarniz;REF-01;EAN-01;12\r\r\n",
    );

    expect(resultado.filas).toHaveLength(1);
    expect(resultado.filas[0]?.numeroFila).toBe(2);
  });

  it("localiza cabeceras tolerando mayúsculas, tildes y espacios", () => {
    const resultado = parsearCSVArmario(
      "  nombre  ; referencia ; código   de barras ; cantidad \nBarniz;REF-01;EAN-01;4",
    );

    expect(resultado.erroresParseo).toEqual([]);
    expect(resultado.filas[0]).toMatchObject({
      nombre: "Barniz",
      referencia: "REF-01",
      ean: "EAN-01",
      cantidadTexto: "4",
    });
  });

  it("descarta la última fila de totales", () => {
    const resultado = parsearCSVArmario(
      "NOMBRE;REFERENCIA;EAN;CANTIDAD;TOTAL\nBarniz;REF-01;EAN-01;4;\n;;;;16",
    );

    expect(resultado.filas).toHaveLength(1);
    expect(resultado.totalFilasLeidas).toBe(2);
    expect(resultado.totalFilasDescartadas).toBe(1);
  });

  it("descarta filas sin referencia y sin nombre", () => {
    const resultado = parsearCSVArmario(
      "NOMBRE;REFERENCIA;EAN;CANTIDAD\nBarniz;REF-01;EAN-01;4\n;;EAN-02;5",
    );

    expect(resultado.filas).toHaveLength(1);
    expect(resultado.totalFilasDescartadas).toBe(1);
  });

  it.each(["=2+2", "+cmd", "-2", "@SUMA(A1:A2)"])(
    "neutraliza celdas que empiezan por %s",
    (valor) => {
      const resultado = parsearCSVArmario(
        `NOMBRE;REFERENCIA;EAN;CANTIDAD\n${valor};REF-01;EAN-01;4`,
      );

      expect(resultado.filas[0]?.nombre).toBe(`'${valor}`);
      expect(resultado.filas[0]?.raw["NOMBRE"]).toBe(`'${valor}`);
    },
  );

  it("conserva EAN como texto con ceros a la izquierda", () => {
    const resultado = parsearCSVArmario(
      "NOMBRE;REFERENCIA;EAN;CANTIDAD\nBarniz;REF-01;0123456789012;4",
    );

    expect(resultado.filas[0]?.ean).toBe("0123456789012");
  });

  it("ignora columnas extra al mapear y conserva la fila completa en raw", () => {
    const resultado = parsearCSVArmario(
      "NOMBRE;REFERENCIA;EAN;CANTIDAD;COLOR\nBarniz;REF-01;EAN-01;4;Azul",
    );

    expect(resultado.filas[0]).toMatchObject({
      nombre: "Barniz",
      referencia: "REF-01",
      ean: "EAN-01",
      cantidadTexto: "4",
    });
    expect(resultado.filas[0]).not.toHaveProperty("color");
    expect(resultado.filas[0]?.raw["COLOR"]).toBe("Azul");
  });

  it("devuelve un error claro para CSV vacío", () => {
    const resultado = parsearCSVArmario("");

    expect(resultado.erroresParseo).toContain("El archivo CSV está vacío");
    expect(resultado.filas).toEqual([]);
  });

  it("devuelve un error claro si faltan las cabeceras esperadas", () => {
    const resultado = parsearCSVArmario("ARTICULO;COLOR\nBarniz;Azul");

    expect(resultado.erroresParseo.join(" ")).toContain(
      "No se encontraron las cabeceras esperadas",
    );
    expect(resultado.erroresParseo.join(" ")).toContain("REFERENCIA");
  });

  it("decodifica bytes Windows-1252 al fallar UTF-8", () => {
    const bytes = Uint8Array.from([
      0x4e, 0x4f, 0x4d, 0x42, 0x52, 0x45, 0x3b, 0x52, 0x45, 0x46, 0x45, 0x52, 0x45, 0x4e, 0x43,
      0x49, 0x41, 0x3b, 0x45, 0x41, 0x4e, 0x3b, 0x43, 0x41, 0x4e, 0x54, 0x49, 0x44, 0x41, 0x44,
      0x0a, 0x50, 0x69, 0x6e, 0x74, 0x75, 0x72, 0x61, 0x20, 0xe9, 0x63, 0x72, 0x75, 0x3b, 0x52,
      0x45, 0x46, 0x2d, 0x30, 0x31, 0x3b, 0x45, 0x41, 0x4e, 0x2d, 0x30, 0x31, 0x3b, 0x34,
    ]);

    const resultado = parsearCSVArmarioDesdeBytes(bytes);

    expect(resultado.filas[0]?.nombre).toBe("Pintura écru");
    expect(resultado.erroresParseo).toEqual([]);
  });
});
