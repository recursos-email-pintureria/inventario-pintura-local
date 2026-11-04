import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import {
  generarPlantillaStockExcel,
  neutralizarFormula,
  VERSION_PLANTILLA_EXCEL,
} from "@/lib/excel-stock";
import {
  parsearCantidad,
  normalizarCabecera,
  parsearArchivoStock,
  type FilaLeidaStock,
} from "@/lib/parser-stock";
import {
  validarFilasStock,
  generarInformeValidacionExcel,
  type FilaValidadaStock,
} from "@/lib/validador-stock";
import type { Producto, Ubicacion, Stock } from "@/lib/tipos";

describe("Seguridad e inyección de fórmulas (neutralizarFormula)", () => {
  it("antepone apóstrofo a fórmulas peligrosas que empiezan por =, +, -, @, \\t", () => {
    expect(neutralizarFormula("=cmd|' /C calc'!A0")).toBe("'=cmd|' /C calc'!A0");
    expect(neutralizarFormula("+1234")).toBe("'+1234");
    expect(neutralizarFormula("-10.5")).toBe("'-10.5");
    expect(neutralizarFormula("@SUM(A1:A10)")).toBe("'@SUM(A1:A10)");
    expect(neutralizarFormula("\tTAB")).toBe("'\tTAB");
  });

  it("mantiene intactos textos normales y números seguros", () => {
    expect(neutralizarFormula("Látex Blanco 15L")).toBe("Látex Blanco 15L");
    expect(neutralizarFormula("A1-01")).toBe("A1-01");
    expect(neutralizarFormula(120)).toBe(120);
    expect(neutralizarFormula("")).toBe("");
  });
});

function mockProducto(p: Partial<Producto> & Pick<Producto, "id" | "sku" | "nombre">): Producto {
  return {
    categoria: "Pinturas",
    stock_actual: 10,
    stock_minimo: 2,
    activo: true,
    unidad: "unid",
    ubicacion: null,
    precio: 15,
    ...p,
  };
}

describe("Generación de plantilla Excel (generarPlantillaStockExcel)", () => {
  const productosMock: Producto[] = [
    mockProducto({
      id: "prod-1",
      sku: "LAT-001",
      nombre: "Látex Blanco 15L",
      activo: true,
      codigo_barras: "LAT-001",
    }),
    mockProducto({
      id: "prod-2",
      sku: "ESM-002",
      nombre: "=MALICIOUS()",
      activo: true,
      codigo_barras: "00123",
    }),
  ];

  const ubicacionesMock: Ubicacion[] = [
    { id: "loc-1", nombre: "Armario A1-01", tipo: "armario", activo: true },
    { id: "loc-2", nombre: "Armario B2-04", tipo: "armario", activo: true },
  ];

  const stockMock: Stock[] = [
    { id: "s1", id_producto: "prod-1", id_ubicacion: "loc-1", cantidad: 45 },
    { id: "s2", id_producto: "prod-2", id_ubicacion: "loc-2", cantidad: 10 },
  ];

  it("genera un archivo XLSX binario con las 4 hojas requeridas y neutralización", () => {
    const bytes = generarPlantillaStockExcel({
      productos: productosMock,
      ubicaciones: ubicacionesMock,
      stock: stockMock,
      usuarioNombre: "Administrador Test",
    });

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(500);

    const workbook = XLSX.read(bytes, { type: "array" });
    expect(workbook.SheetNames).toContain("Instrucciones");
    expect(workbook.SheetNames).toContain("Inventario");
    expect(workbook.SheetNames).toContain("Productos válidos");
    expect(workbook.SheetNames).toContain("Ubicaciones válidas");

    const hojaInventario = workbook.Sheets["Inventario"]!;
    const filas = XLSX.utils.sheet_to_json<any>(hojaInventario);
    expect(filas.length).toBe(2);
    expect(filas[0]["id_producto"]).toBe("prod-1");
    expect(Number(filas[0]["cantidad_actual"])).toBe(45);

    // Verificar neutralización de fórmula en la fila 2
    expect(String(filas[1]["nombre_producto"])).toMatch(/^'=/);
  });
});

describe("Parser de cabeceras y cantidades (parser-stock)", () => {
  it("normaliza nombres de cabeceras eliminando diacríticos, mayúsculas y caracteres no alfanuméricos", () => {
    expect(normalizarCabecera("Cantidad Nueva")).toBe("cantidadnueva");
    expect(normalizarCabecera("CANTIDAD_NUEVA")).toBe("cantidadnueva");
    expect(normalizarCabecera("Código de Barras")).toBe("codigodebarras");
    expect(normalizarCabecera("ID Ubicación")).toBe("idubicacion");
    expect(normalizarCabecera("observación")).toBe("observacion");
  });

  it("parsea cantidades numéricas y redondea a enteros de stock", () => {
    expect(parsearCantidad("15")).toBe(15);
    expect(parsearCantidad(42)).toBe(42);
    expect(parsearCantidad("12,5")).toBe(13); // Redondeo entero para stock
    expect(parsearCantidad("1.250")).toBe(1250);
    expect(parsearCantidad("  100  ")).toBe(100);
    expect(parsearCantidad("")).toBeNull();
    expect(parsearCantidad(null)).toBeNull();
    expect(parsearCantidad(undefined)).toBeNull();
  });

  it("detecta valores numéricos inválidos", () => {
    expect(Number.isNaN(parsearCantidad("texto no numérico"))).toBe(true);
    expect(Number.isNaN(parsearCantidad("abc"))).toBe(true);
  });
});

describe("Parser de archivos XLSX y CSV (parsearArchivoStock)", () => {
  it("parsea correctamente un archivo CSV con cabeceras estándar", async () => {
    const csvContent =
      "id_producto,codigo_producto,nombre_producto,id_ubicacion,ubicacion,cantidad_actual,cantidad_nueva,observaciones\n" +
      "prod-1,00123,Látex Blanco,loc-1,A1-01,10,25,Recepción de proveedor\n" +
      "prod-2,45678,Esmalte Sintético,loc-2,B2-02,5,,Sin cambios previstos\n";

    const file = new File([csvContent], "inventario_test.csv", { type: "text/csv" });
    const resultado = await parsearArchivoStock(file);

    expect(resultado.erroresArchivo).toEqual([]);
    expect(resultado.exito).toBe(true);
    expect(resultado.filas.length).toBe(2);
    expect(resultado.filas[0]?.id_producto).toBe("prod-1");
    // Conserva ceros a la izquierda
    expect(resultado.filas[0]?.codigo_producto).toBe("00123");
    expect(resultado.filas[0]?.cantidad_nueva).toBe(25);
    expect(resultado.filas[0]?.observaciones).toBe("Recepción de proveedor");

    expect(resultado.filas[1]?.id_producto).toBe("prod-2");
    expect(resultado.filas[1]?.cantidad_nueva).toBeNull();
  });

  it("rechaza archivos con tamaño excesivo (> 10MB)", async () => {
    const dummyBlob = new Blob([new Uint8Array(11 * 1024 * 1024)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const hugeFile = new File([dummyBlob], "archivo_gigante.xlsx");

    const resultado = await parsearArchivoStock(hugeFile);
    expect(resultado.exito).toBe(false);
    expect(resultado.erroresArchivo.length).toBeGreaterThan(0);
    expect(resultado.erroresArchivo[0]).toMatch(/excede el tamaño máximo/);
  });
});

describe("Validador de reglas de negocio y detección de conflictos (validarFilasStock)", () => {
  const productosMock: Producto[] = [
    mockProducto({
      id: "prod-1",
      sku: "LAT-001",
      nombre: "Látex Blanco 15L",
      activo: true,
      codigo_barras: "LAT-001",
    }),
    mockProducto({
      id: "prod-2",
      sku: "ESM-002",
      nombre: "Esmalte Gris",
      activo: true,
      codigo_barras: "ESM-002",
    }),
    mockProducto({
      id: "prod-inactivo",
      sku: "DISC-01",
      nombre: "Producto Descatalogado",
      activo: false,
      codigo_barras: "DISC-01",
    }),
  ];

  const ubicacionesMock: Ubicacion[] = [
    { id: "loc-1", nombre: "Armario A1-01", tipo: "armario", activo: true },
    { id: "loc-2", nombre: "Armario B2-02", tipo: "armario", activo: true },
    { id: "loc-inactiva", nombre: "Zona Clausurada", tipo: "armario", activo: false },
  ];

  const stockMock: Stock[] = [
    { id: "s1", id_producto: "prod-1", id_ubicacion: "loc-1", cantidad: 20 },
    { id: "s2", id_producto: "prod-2", id_ubicacion: "loc-2", cantidad: 50 },
  ];

  const crearFilaLeida = (overrides: Partial<FilaLeidaStock>): FilaLeidaStock => ({
    numeroFila: 2,
    id_producto: "prod-1",
    codigo_producto: "LAT-001",
    nombre_producto: "Látex Blanco 15L",
    id_ubicacion: "loc-1",
    ubicacion: "Armario A1-01",
    cantidad_actual: 20,
    cantidad_nueva_raw: 25,
    cantidad_nueva: 25,
    observaciones: "Ajuste menor",
    ...overrides,
  });

  it("clasifica fila con cambio normal como 'correcta'", () => {
    const filas: FilaLeidaStock[] = [crearFilaLeida({ cantidad_actual: 20, cantidad_nueva: 25 })];

    const { filasValidadas, resumen } = validarFilasStock({
      filas,
      productos: productosMock,
      ubicaciones: ubicacionesMock,
      stock: stockMock,
    });

    expect(resumen.correctas).toBe(1);
    expect(filasValidadas[0]?.estado).toBe("correcta");
    expect(filasValidadas[0]?.diferencia).toBe(5);
  });

  it("clasifica fila sin valor nuevo como 'sin_cambios'", () => {
    const filas: FilaLeidaStock[] = [
      crearFilaLeida({ cantidad_nueva: null, cantidad_nueva_raw: "" }),
    ];

    const { filasValidadas, resumen } = validarFilasStock({
      filas,
      productos: productosMock,
      ubicaciones: ubicacionesMock,
      stock: stockMock,
    });

    expect(resumen.sinCambios).toBe(1);
    expect(filasValidadas[0]?.estado).toBe("sin_cambios");
  });

  it("detecta conflicto de concurrencia cuando el stock en DB difiere del archivo", () => {
    const filas: FilaLeidaStock[] = [
      crearFilaLeida({
        cantidad_actual: 15, // En Excel ponía 15 pero en BD hay 20
        cantidad_nueva: 30,
      }),
    ];

    const { filasValidadas, resumen } = validarFilasStock({
      filas,
      productos: productosMock,
      ubicaciones: ubicacionesMock,
      stock: stockMock,
    });

    expect(resumen.conflictos).toBe(1);
    expect(filasValidadas[0]?.estado).toBe("conflicto");
    expect(filasValidadas[0]?.stockActualEnBD).toBe(20);
  });

  it("detecta aviso por gran variación (> 50 uds o > 200%)", () => {
    const filas: FilaLeidaStock[] = [
      crearFilaLeida({
        cantidad_actual: 20,
        cantidad_nueva: 100, // Variación de +80 unidades
      }),
    ];

    const { filasValidadas, resumen } = validarFilasStock({
      filas,
      productos: productosMock,
      ubicaciones: ubicacionesMock,
      stock: stockMock,
    });

    expect(resumen.avisos).toBe(1);
    expect(filasValidadas[0]?.estado).toBe("aviso");
    expect(filasValidadas[0]?.mensajes.length).toBeGreaterThan(0);
  });

  it("detecta errores por cantidades negativas o productos/ubicaciones inexistentes o inactivos", () => {
    const filas: FilaLeidaStock[] = [
      crearFilaLeida({
        numeroFila: 2,
        cantidad_nueva: -5,
      }),
      crearFilaLeida({
        numeroFila: 3,
        id_producto: "prod-inactivo",
        cantidad_nueva: 10,
      }),
      crearFilaLeida({
        numeroFila: 4,
        id_producto: "prod-fantasma",
        codigo_producto: "FANTASMA",
        cantidad_nueva: 10,
      }),
    ];

    const { filasValidadas, resumen } = validarFilasStock({
      filas,
      productos: productosMock,
      ubicaciones: ubicacionesMock,
      stock: stockMock,
    });

    expect(resumen.errores).toBe(3);
    expect(filasValidadas[0]?.mensajes.some((m) => m.includes("negativa"))).toBe(true);
    expect(filasValidadas[1]?.mensajes.some((m) => m.includes("desactivado"))).toBe(true);
    expect(filasValidadas[2]?.mensajes.some((m) => m.includes("no encontrado"))).toBe(true);
  });

  it("detecta combinaciones duplicadas producto-ubicación en el mismo archivo", () => {
    const filas: FilaLeidaStock[] = [
      crearFilaLeida({
        numeroFila: 2,
        id_producto: "prod-1",
        id_ubicacion: "loc-1",
        cantidad_nueva: 25,
      }),
      crearFilaLeida({
        numeroFila: 3,
        id_producto: "prod-1",
        id_ubicacion: "loc-1",
        cantidad_nueva: 30,
      }),
    ];

    const { filasValidadas, resumen } = validarFilasStock({
      filas,
      productos: productosMock,
      ubicaciones: ubicacionesMock,
      stock: stockMock,
    });

    expect(resumen.errores).toBe(2);
    expect(filasValidadas[0]?.mensajes.some((m) => m.includes("duplicada"))).toBe(true);
    expect(filasValidadas[1]?.mensajes.some((m) => m.includes("duplicada"))).toBe(true);
  });
});

describe("Generación del informe de validación Excel (generarInformeValidacionExcel)", () => {
  it("produce un libro Excel descargable con los problemas y el detalle", () => {
    const filas: FilaValidadaStock[] = [
      {
        numeroFila: 2,
        id_producto: "prod-1",
        codigo_producto: "LAT-001",
        nombre_producto: "Látex Blanco",
        id_ubicacion: "loc-1",
        ubicacion: "Armario A1-01",
        cantidad_actual: 20,
        cantidad_nueva_raw: 30,
        cantidad_nueva: 30,
        observaciones: "Ajuste",
        estado: "correcta",
        mensajes: [],
        stockActualEnBD: 20,
        diferencia: 10,
        resolucionConflicto: "aplicar_archivo",
      },
    ];

    const bytes = generarInformeValidacionExcel(filas);
    expect(bytes).toBeInstanceOf(Uint8Array);

    const wb = XLSX.read(bytes, { type: "array" });
    expect(wb.SheetNames).toContain("Informe de Validación");
  });
});
