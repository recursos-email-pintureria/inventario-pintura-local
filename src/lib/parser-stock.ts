import * as XLSX from "xlsx";
import Papa from "papaparse";
import { VERSION_PLANTILLA_EXCEL } from "./excel-stock";

export interface FilaLeidaStock {
  numeroFila: number;
  id_producto: string;
  codigo_producto: string;
  nombre_producto: string;
  id_ubicacion: string;
  ubicacion: string;
  cantidad_actual: number;
  cantidad_nueva_raw: any;
  cantidad_nueva: number | null; // null si no se informó o está vacía
  observaciones: string;
}

export interface ResultadoParserStock {
  exito: boolean;
  versionDetectada?: string | undefined;
  filas: FilaLeidaStock[];
  erroresArchivo: string[];
  totalFilas: number;
}

export const MAX_TAMANIO_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_FILAS_PERMITIDAS = 10000;

/**
 * Normaliza una cadena de cabecera eliminando tildes, espacios y caracteres especiales.
 */
export function normalizarCabecera(cabecera: string): string {
  if (!cabecera) return "";
  return String(cabecera)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar tildes
    .replace(/[^a-z0-9]/g, ""); // solo alfanumérico
}

/**
 * Convierte un valor de celda a texto preservando ceros iniciales y quitando apóstrofes de escape.
 */
export function limpiarTextoCelda(valor: any): string {
  if (valor === null || valor === undefined) return "";
  let str = String(valor).trim();
  if (str.startsWith("'")) {
    str = str.substring(1).trim();
  }
  return str;
}

/**
 * Parsea una cantidad numérica soportando comas decimales, espacios y formato string.
 */
export function parsearCantidad(valor: any): number | null {
  if (valor === null || valor === undefined) return null;
  const texto = limpiarTextoCelda(valor);
  if (texto === "") return null;

  // Si ya es número nativo de Excel
  if (typeof valor === "number" && !isNaN(valor)) {
    return Math.round(valor);
  }

  // Normalizar separador decimal y miles
  let normalizado = texto.replace(/\s+/g, "");
  // Formato miles español sin decimales (ej. 1.250 o 10.000)
  if (/^\d{1,3}(\.\d{3})+$/.test(normalizado)) {
    normalizado = normalizado.replace(/\./g, "");
  } else if (normalizado.includes(",") && normalizado.includes(".")) {
    // Formato español: 1.500,00 -> 1500.00
    normalizado = normalizado.replace(/\./g, "").replace(",", ".");
  } else if (normalizado.includes(",")) {
    normalizado = normalizado.replace(",", ".");
  }

  const num = Number(normalizado);
  if (isNaN(num)) return NaN; // Inválido
  return Math.round(num); // El stock en nuestro sistema se gestiona en unidades enteras
}

/**
 * Detecta si una fila está completamente vacía.
 */
export function esFilaVacia(fila: Record<string, any>): boolean {
  return Object.values(fila).every((v) => v === null || v === undefined || String(v).trim() === "");
}

/**
 * Mapea los nombres de cabecera normalizados a las claves canónicas del sistema.
 */
function identificarColumna(cabeceraNormalizada: string): string | null {
  const c = cabeceraNormalizada;

  if (c === "idproducto" || c === "idprod" || c === "productoid") return "id_producto";
  if (
    c === "codigoproducto" ||
    c === "codigo" ||
    c === "sku" ||
    c === "codigobarras" ||
    c === "codproducto"
  )
    return "codigo_producto";
  if (c === "nombreproducto" || c === "nombre" || c === "producto" || c === "articulo")
    return "nombre_producto";
  if (c === "idubicacion" || c === "idubi" || c === "ubicacionid") return "id_ubicacion";
  if (c === "ubicacion" || c === "nombreubicacion" || c === "zona" || c === "estanteria")
    return "ubicacion";
  if (
    c === "cantidadactual" ||
    c === "stockactual" ||
    c === "actual" ||
    c === "stock" ||
    c === "cantactual"
  )
    return "cantidad_actual";
  if (
    c === "cantidadnueva" ||
    c === "nuevostock" ||
    c === "nuevacantidad" ||
    c === "conteo" ||
    c === "stocknuevo" ||
    c === "nueva"
  )
    return "cantidad_nueva";
  if (c === "observaciones" || c === "observacion" || c === "motivo" || c === "notas")
    return "observaciones";

  return null;
}

async function obtenerArrayBuffer(archivo: any): Promise<ArrayBuffer> {
  if (typeof FileReader !== "undefined") {
    try {
      const buf = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(archivo);
      });
      if (buf && buf.byteLength > 0) return buf;
    } catch {}
  }
  if (typeof archivo.arrayBuffer === "function") {
    try {
      return await archivo.arrayBuffer();
    } catch {}
  }
  if (typeof Response !== "undefined") {
    try {
      return await new Response(archivo).arrayBuffer();
    } catch {}
  }
  return new ArrayBuffer(0);
}

async function obtenerTexto(archivo: any): Promise<string> {
  if (typeof FileReader !== "undefined") {
    try {
      const txt = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(archivo);
      });
      if (txt && txt.length > 0) return txt;
    } catch {}
  }
  if (typeof archivo.text === "function") {
    try {
      const res = await archivo.text();
      if (res) return res;
    } catch {}
  }
  if (typeof Response !== "undefined") {
    try {
      return await new Response(archivo).text();
    } catch {}
  }
  return "";
}

/**
 * Lee y parsea un archivo de actualización de stock (.xlsx, .xls o .csv).
 */
export async function parsearArchivoStock(
  archivo:
    | File
    | {
        name: string;
        size: number;
        arrayBuffer?: () => Promise<ArrayBuffer>;
        text?: () => Promise<string>;
      },
): Promise<ResultadoParserStock> {
  const erroresArchivo: string[] = [];

  // 1. Control de tamaño
  if (archivo.size > MAX_TAMANIO_BYTES) {
    erroresArchivo.push(
      `El archivo excede el tamaño máximo permitido de 10 MB (tamaño: ${(archivo.size / (1024 * 1024)).toFixed(1)} MB).`,
    );
    return { exito: false, filas: [], erroresArchivo, totalFilas: 0 };
  }

  const nombreMinus = archivo.name.toLowerCase();
  const esCsv = nombreMinus.endsWith(".csv");
  const esExcel = nombreMinus.endsWith(".xlsx") || nombreMinus.endsWith(".xls");

  if (!esCsv && !esExcel) {
    erroresArchivo.push(
      "Formato de archivo no compatible. Por favor sube un archivo .xlsx, .xls o .csv.",
    );
    return { exito: false, filas: [], erroresArchivo, totalFilas: 0 };
  }

  let filasObj: Record<string, any>[] = [];
  let versionDetectada: string | undefined = undefined;

  try {
    if (esCsv) {
      const textoCsv = await obtenerTexto(archivo);

      // Parsing con Papa Parse para CSV
      const resultadoPapa = Papa.parse<Record<string, any>>(textoCsv, {
        header: true,
        skipEmptyLines: "greedy",
        dynamicTyping: false, // Tratamos como texto para no perder ceros
      });

      if (resultadoPapa.errors && resultadoPapa.errors.length > 0) {
        const erroresReales = resultadoPapa.errors.filter(
          (err) => err.code !== "UndetectableDelimiter" && !err.message.includes("delimiter"),
        );
        if (erroresReales.length > 0 && (!resultadoPapa.data || resultadoPapa.data.length === 0)) {
          erroresReales.slice(0, 3).forEach((err) => {
            erroresArchivo.push(`Error en CSV (línea ${err.row}): ${err.message}`);
          });
        }
      }

      filasObj = (resultadoPapa.data || []) as Record<string, any>[];
    } else {
      const buffer = await obtenerArrayBuffer(archivo);
      // Parsing con SheetJS para Excel
      const wb = XLSX.read(buffer, { type: "array", cellDates: false });

      // Verificar si contiene la hoja de instrucciones o la de inventario
      let nombreHojaDatos = wb.SheetNames.find(
        (n) => n.toLowerCase() === "inventario" || n.toLowerCase() === "stock",
      );

      // Si no existe, usamos la primera hoja que no sea 'instrucciones'
      if (!nombreHojaDatos) {
        nombreHojaDatos =
          wb.SheetNames.find((n) => !n.toLowerCase().includes("instruccion")) || wb.SheetNames[0];
      }

      // Buscar versión en hoja Instrucciones si existe
      const hojaInstrucciones = wb.Sheets["Instrucciones"];
      if (hojaInstrucciones) {
        const datosInstrucciones = XLSX.utils.sheet_to_json<string[]>(hojaInstrucciones, {
          header: 1,
        });
        datosInstrucciones.forEach((fila) => {
          if (
            Array.isArray(fila) &&
            fila.some((c) => String(c).includes(VERSION_PLANTILLA_EXCEL))
          ) {
            versionDetectada = VERSION_PLANTILLA_EXCEL;
          }
        });
      }

      const ws = nombreHojaDatos ? wb.Sheets[nombreHojaDatos] : undefined;
      if (!ws) {
        erroresArchivo.push("No se encontró ninguna hoja de inventario válida en el libro Excel.");
        return { exito: false, filas: [], erroresArchivo, totalFilas: 0 };
      }

      filasObj = XLSX.utils.sheet_to_json<Record<string, any>>(ws, {
        raw: false, // fuerza lectura en string para respetar formato
        defval: "",
      });
    }
  } catch (err: any) {
    erroresArchivo.push(`No se pudo leer el archivo: ${err.message || "Estructura no válida"}`);
    return { exito: false, filas: [], erroresArchivo, totalFilas: 0 };
  }

  // 2. Control de filas
  if (filasObj.length === 0) {
    erroresArchivo.push("El archivo no contiene ninguna fila de datos.");
    return { exito: false, filas: [], erroresArchivo, totalFilas: 0 };
  }

  if (filasObj.length > MAX_FILAS_PERMITIDAS) {
    erroresArchivo.push(
      `El archivo contiene ${filasObj.length} filas, superando el límite de ${MAX_FILAS_PERMITIDAS} filas por importación.`,
    );
    return { exito: false, filas: [], erroresArchivo, totalFilas: filasObj.length };
  }

  // 3. Normalización y Mapeo de Cabeceras
  const primeraFila = filasObj[0] || {};
  const mapaColumnas: Record<string, string> = {}; // { claveCanonica: nombreOriginalColumna }

  Object.keys(primeraFila).forEach((colOriginal) => {
    const normalizada = normalizarCabecera(colOriginal);
    const canonica = identificarColumna(normalizada);
    if (canonica && !mapaColumnas[canonica]) {
      mapaColumnas[canonica] = colOriginal;
    }
  });

  // Validar columnas obligatorias mínimas
  const tieneIdentificadorProd = Boolean(
    mapaColumnas["id_producto"] || mapaColumnas["codigo_producto"],
  );
  const tieneIdentificadorUbi = Boolean(mapaColumnas["id_ubicacion"] || mapaColumnas["ubicacion"]);
  const tieneColumnaNueva = Boolean(mapaColumnas["cantidad_nueva"]);

  if (!tieneIdentificadorProd || !tieneIdentificadorUbi || !tieneColumnaNueva) {
    erroresArchivo.push(
      "El archivo no coincide con la plantilla requerida. Debe contener al menos las columnas para identificar el producto (id_producto o codigo/sku), la ubicación (id_ubicacion o ubicacion) y 'cantidad_nueva'.",
    );
    return { exito: false, filas: [], erroresArchivo, totalFilas: filasObj.length };
  }

  // 4. Procesar y estructurar cada fila
  const filasProcesadas: FilaLeidaStock[] = [];

  filasObj.forEach((raw, index) => {
    // Si la fila está totalmente vacía la omitimos limpiamente
    if (esFilaVacia(raw)) return;

    const colIdProd = mapaColumnas["id_producto"] ? raw[mapaColumnas["id_producto"]] : "";
    const colCodProd = mapaColumnas["codigo_producto"] ? raw[mapaColumnas["codigo_producto"]] : "";
    const colNomProd = mapaColumnas["nombre_producto"] ? raw[mapaColumnas["nombre_producto"]] : "";
    const colIdUbi = mapaColumnas["id_ubicacion"] ? raw[mapaColumnas["id_ubicacion"]] : "";
    const colUbi = mapaColumnas["ubicacion"] ? raw[mapaColumnas["ubicacion"]] : "";
    const colCantActual = mapaColumnas["cantidad_actual"]
      ? raw[mapaColumnas["cantidad_actual"]]
      : 0;
    const colCantNueva = mapaColumnas["cantidad_nueva"] ? raw[mapaColumnas["cantidad_nueva"]] : "";
    const colObs = mapaColumnas["observaciones"] ? raw[mapaColumnas["observaciones"]] : "";

    const cantActualNum = parsearCantidad(colCantActual) ?? 0;
    const cantNuevaNum = parsearCantidad(colCantNueva);

    filasProcesadas.push({
      numeroFila: index + 2, // 1-indexado considerando cabecera en fila 1
      id_producto: limpiarTextoCelda(colIdProd),
      codigo_producto: limpiarTextoCelda(colCodProd),
      nombre_producto: limpiarTextoCelda(colNomProd),
      id_ubicacion: limpiarTextoCelda(colIdUbi),
      ubicacion: limpiarTextoCelda(colUbi),
      cantidad_actual: isNaN(cantActualNum) ? 0 : cantActualNum,
      cantidad_nueva_raw: colCantNueva,
      cantidad_nueva: cantNuevaNum,
      observaciones: limpiarTextoCelda(colObs),
    });
  });

  return {
    exito: erroresArchivo.length === 0,
    versionDetectada,
    filas: filasProcesadas,
    erroresArchivo,
    totalFilas: filasProcesadas.length,
  };
}
