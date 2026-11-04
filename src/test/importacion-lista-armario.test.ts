import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";
import {
  parsearArchivoListaArmario,
  validarDigitoControlEan13,
  normalizarSaltosDeLinea,
  parsearCantidadArmario,
  decodificarTextoConCodificacion,
  type FilaListaArmarioRaw,
} from "@/lib/parser-lista-armario";
import {
  validarListaParaArmario,
  generarInformeErroresListaArmarioExcel,
  type FilaValidadaListaArmario,
} from "@/lib/validador-lista-armario";
import type { Producto, Stock } from "@/lib/tipos";

describe("Parser de listas para armario (parser-lista-armario)", () => {
  const rutaFixture = path.join(__dirname, "fixtures/BARNICES_LUX_INTER.csv");
  const contenidoFixture = fs.readFileSync(rutaFixture);

  it("lee el archivo fixture real y procesa las 13 filas de productos ignorando la fila final de totales", async () => {
    const fileMock = {
      name: "BARNICES_LUX_INTER.csv",
      size: contenidoFixture.length,
      arrayBuffer: async () =>
        contenidoFixture.buffer.slice(
          contenidoFixture.byteOffset,
          contenidoFixture.byteOffset + contenidoFixture.byteLength,
        ),
    };

    const resultado = await parsearArchivoListaArmario(fileMock);
    expect(resultado.exito).toBe(true);
    expect(resultado.erroresArchivo).toEqual([]);

    // 13 filas válidas en el archivo (la fila 15 de totales debe ser ignorada)
    expect(resultado.filas.length).toBe(13);
    expect(resultado.filas.some((f) => f.nombre.includes("BZ INT BRILL"))).toBe(true);
  });

  it("normaliza saltos de línea irregulares (\\r\\r\\n, \\r\\n)", () => {
    const textoConSaltosDobles =
      "NOMBRE;REFERENCIA;EAN;CANTIDAD\r\r\nProd 1;1001;8424019648237;5\r\r\nProd 2;1002;8424019648367;10";
    const normalizado = normalizarSaltosDeLinea(textoConSaltosDobles);
    expect(normalizado).not.toContain("\r\r\n");
    expect(normalizado).toBe(
      "NOMBRE;REFERENCIA;EAN;CANTIDAD\nProd 1;1001;8424019648237;5\nProd 2;1002;8424019648367;10",
    );
  });

  it("parsea decimales con coma y ceros redundantes (ej. 12,0 -> 12, 0,0 -> 0)", () => {
    expect(parsearCantidadArmario("12")).toBe(12);
    expect(parsearCantidadArmario("12,0")).toBe(12);
    expect(parsearCantidadArmario("0,0")).toBe(0);
    expect(parsearCantidadArmario("10,99")).toBe(11);
    expect(parsearCantidadArmario("")).toBeNull();
    expect(parsearCantidadArmario(null)).toBeNull();
  });

  it("conserva EAN y REFERENCIA como texto sin notación científica ni pérdida de ceros", async () => {
    const csvConCeros =
      "NOMBRE;REFERENCIA;EAN;CANTIDAD\n" + "Barniz Roble;0012345;0008424019648;10\n";

    const buffer = Buffer.from(csvConCeros);
    const fileMock = {
      name: "ceros.csv",
      size: buffer.length,
      arrayBuffer: async () =>
        buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
    };

    const resultado = await parsearArchivoListaArmario(fileMock);
    expect(resultado.filas[0]?.referencia).toBe("0012345");
    expect(resultado.filas[0]?.ean).toBe("0008424019648");
  });

  it("ignora todas las columnas extras aunque estén presentes en la cabecera", async () => {
    const csvCompleto =
      "EXTRA1;NOMBRE;EXTRA2;REFERENCIA;EXTRA3;EAN;PROVEEDOR;CANTIDAD;TOTAL\n" +
      "dummy1;Barniz Luxens;dummy2;REF-99;dummy3;8424019648237;V33;15;999,99\n";

    const buffer = Buffer.from(csvCompleto);
    const fileMock = {
      name: "extras.csv",
      size: buffer.length,
      arrayBuffer: async () =>
        buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
    };

    const resultado = await parsearArchivoListaArmario(fileMock);
    expect(resultado.filas.length).toBe(1);
    expect(resultado.filas[0]?.nombre).toBe("Barniz Luxens");
    expect(resultado.filas[0]?.referencia).toBe("REF-99");
    expect(resultado.filas[0]?.cantidad).toBe(15);
  });

  it("valida el dígito de control EAN-13 (emite aviso pero no invalida)", () => {
    // 8424019648237 es un EAN-13 válido (del archivo real)
    const eanValido = validarDigitoControlEan13("8424019648237");
    expect(eanValido.valido).toBe(true);

    // EAN con dígito de control alterado
    const eanInvalido = validarDigitoControlEan13("8424019648239");
    expect(eanInvalido.valido).toBe(false);
    expect(eanInvalido.motivo).toMatch(/Dígito de control/);
  });

  it("marca como omitidas las filas con cantidad 0 o vacía", async () => {
    const csvConCero =
      "NOMBRE;REFERENCIA;EAN;CANTIDAD\n" +
      "Barniz Incoloro;REF-01;8424019648237;0,0\n" +
      "Barniz Roble;REF-02;8424019648367;\n" +
      "Barniz Nogal;REF-03;8424019647940;8\n";

    const buffer = Buffer.from(csvConCero);
    const fileMock = {
      name: "omisiones.csv",
      size: buffer.length,
      arrayBuffer: async () =>
        buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
    };

    const resultado = await parsearArchivoListaArmario(fileMock);
    expect(resultado.totalFilasOmitidas).toBe(2);
    expect(resultado.filas[0]?.esOmitida).toBe(true);
    expect(resultado.filas[1]?.esOmitida).toBe(true);
    expect(resultado.filas[2]?.esOmitida).toBe(false);
  });
});

describe("Validador de reglas de negocio para armarios (validador-lista-armario)", () => {
  const catalogoMock: Producto[] = [
    {
      id: "prod-existente-1",
      sku: "16699585",
      codigo_barras: "8424019648237",
      nombre: "BZ INT BRILL LUXENS 750ML INCOLORO",
      activo: true,
      stock_actual: 10,
      stock_minimo: 5,
      categoria: "Barnices",
      precio: 10.99,
      unidad: "unid",
      ubicacion: "Armario A1-01",
    },
    {
      id: "prod-otro-ean",
      sku: "OTRO-SKU",
      codigo_barras: "8424019648367",
      nombre: "Producto Ocupa EAN",
      activo: true,
      stock_actual: 0,
      stock_minimo: 0,
      categoria: "Pinturas",
      precio: 5,
      unidad: "unid",
      ubicacion: null,
    },
  ];

  const stockMock: Stock[] = [
    {
      id: "s1",
      id_producto: "prod-existente-1",
      id_ubicacion: "armario-1",
      cantidad: 5, // Hay 5 unidades en el armario
    },
  ];

  const crearFilaRaw = (overrides: Partial<FilaListaArmarioRaw>): FilaListaArmarioRaw => ({
    numeroFilaOriginal: 2,
    nombre: "BZ INT BRILL LUXENS 750ML INCOLORO",
    referencia: "16699585",
    ean: "8424019648237",
    cantidadRaw: "12",
    cantidad: 12,
    eanValido: true,
    esFilaTotal: false,
    esOmitida: false,
    ...overrides,
  });

  it("detecta producto existente vs producto nuevo a crear", () => {
    const filasRaw: FilaListaArmarioRaw[] = [
      crearFilaRaw({ referencia: "16699585" }), // Existente
      crearFilaRaw({
        numeroFilaOriginal: 3,
        referencia: "NUEVA-REF-100",
        ean: "1111111111111",
        nombre: "Barniz Nuevo",
      }), // Nuevo
    ];

    const { filasValidadas, resumen } = validarListaParaArmario({
      filasRaw,
      catalogoProductos: catalogoMock,
      stockUbicacion: stockMock,
      idUbicacion: "armario-1",
      nombreUbicacion: "Armario A1-01",
      modo: "sumar",
      accionDuplicados: "sumar",
    });

    expect(filasValidadas[0]?.seCrearaProducto).toBe(false);
    expect(filasValidadas[0]?.productoExistenteId).toBe("prod-existente-1");

    expect(filasValidadas[1]?.seCrearaProducto).toBe(true);
    expect(resumen.productosNuevosACrear).toBe(1);
  });

  it("calcula stock resultante en modo 'sumar' (disponible + N)", () => {
    const filasRaw = [crearFilaRaw({ referencia: "16699585", cantidad: 12 })];

    const { filasValidadas } = validarListaParaArmario({
      filasRaw,
      catalogoProductos: catalogoMock,
      stockUbicacion: stockMock,
      idUbicacion: "armario-1",
      nombreUbicacion: "Armario A1-01",
      modo: "sumar",
      accionDuplicados: "sumar",
    });

    // Había 5 en armario, sumamos 12 -> 17
    expect(filasValidadas[0]?.stockActual).toBe(5);
    expect(filasValidadas[0]?.stockResultante).toBe(17);
    expect(filasValidadas[0]?.diferencia).toBe(12);
  });

  it("calcula stock resultante en modo 'establecer' (recuento absoluto)", () => {
    const filasRaw = [crearFilaRaw({ referencia: "16699585", cantidad: 12 })];

    const { filasValidadas } = validarListaParaArmario({
      filasRaw,
      catalogoProductos: catalogoMock,
      stockUbicacion: stockMock,
      idUbicacion: "armario-1",
      nombreUbicacion: "Armario A1-01",
      modo: "establecer",
      accionDuplicados: "sumar",
    });

    // Había 5, establecemos 12 -> 12 (diferencia +7)
    expect(filasValidadas[0]?.stockActual).toBe(5);
    expect(filasValidadas[0]?.stockResultante).toBe(12);
    expect(filasValidadas[0]?.diferencia).toBe(7);
  });

  it("detecta conflicto de identidad entre REFERENCIA y EAN", () => {
    // La referencia es de un producto nuevo, pero el EAN ya pertenece a 'prod-otro-ean'
    const filasRaw = [
      crearFilaRaw({
        referencia: "REF-CONFLICTO-99",
        ean: "8424019648367", // Pertenece a OTRO-SKU
        nombre: "Producto Conflicto",
      }),
    ];

    const { filasValidadas, resumen } = validarListaParaArmario({
      filasRaw,
      catalogoProductos: catalogoMock,
      stockUbicacion: stockMock,
      idUbicacion: "armario-1",
      nombreUbicacion: "Armario A1-01",
      modo: "sumar",
      accionDuplicados: "sumar",
    });

    expect(resumen.conflictos).toBe(1);
    expect(filasValidadas[0]?.estado).toBe("conflicto");
    expect(filasValidadas[0]?.mensajesConflicto.length).toBeGreaterThan(0);
  });

  it("detecta y gestiona duplicados dentro del archivo (sumar vs rechazar)", () => {
    const filasRaw = [
      crearFilaRaw({ numeroFilaOriginal: 2, referencia: "16699585", cantidad: 5 }),
      crearFilaRaw({ numeroFilaOriginal: 3, referencia: "16699585", cantidad: 7 }),
    ];

    // 1. Con acción 'sumar': genera aviso
    const resSumar = validarListaParaArmario({
      filasRaw,
      catalogoProductos: catalogoMock,
      stockUbicacion: stockMock,
      idUbicacion: "armario-1",
      nombreUbicacion: "Armario A1-01",
      modo: "sumar",
      accionDuplicados: "sumar",
    });
    expect(resSumar.resumen.avisos).toBe(2);
    expect(resSumar.filasValidadas[0]?.estado).toBe("aviso");

    // 2. Con acción 'rechazar': genera error
    const resRechazar = validarListaParaArmario({
      filasRaw,
      catalogoProductos: catalogoMock,
      stockUbicacion: stockMock,
      idUbicacion: "armario-1",
      nombreUbicacion: "Armario A1-01",
      modo: "sumar",
      accionDuplicados: "rechazar",
    });
    expect(resRechazar.resumen.errores).toBe(2);
    expect(resRechazar.filasValidadas[0]?.estado).toBe("error");
  });

  it("genera un libro Excel descargable con los errores e incidencias", () => {
    const filasValidadas: FilaValidadaListaArmario[] = [
      {
        idFila: "f1",
        numeroFilaOriginal: 2,
        nombre: "=CMD|' /C calc'!A0",
        referencia: "REF-01",
        ean: "8424019648237",
        cantidad: 10,
        modo: "sumar",
        estado: "aviso",
        mensajesAviso: ["Aviso de prueba"],
        mensajesError: [],
        mensajesConflicto: [],
        seCrearaProducto: true,
        stockActual: 0,
        stockResultante: 10,
        diferencia: 10,
        esDuplicadaEnArchivo: false,
      },
    ];

    const bytes = generarInformeErroresListaArmarioExcel(filasValidadas, "Armario A1-01");
    expect(bytes).toBeInstanceOf(Uint8Array);

    const wb = XLSX.read(bytes, { type: "array" });
    expect(wb.SheetNames).toContain("Informe Carga Armario");

    const sheet = wb.Sheets["Informe Carga Armario"]!;
    const json = XLSX.utils.sheet_to_json<any>(sheet);
    // Verificar que la fórmula maliciosa fue neutralizada
    expect(String(json[0]["Nombre"])).toMatch(/^'=/);
  });
});
