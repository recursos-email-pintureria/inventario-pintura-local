import Papa from "papaparse";

export interface FilaListaArmarioRaw {
  numeroFilaOriginal: number;
  nombre: string;
  referencia: string;
  ean: string;
  cantidadRaw: string;
  cantidad: number | null;
  eanValido: boolean;
  esFilaTotal: boolean;
  esOmitida: boolean;
  avisoEan?: string | undefined;
  motivoOmitida?: string | undefined;
}

export interface ResultadoParseoListaArmario {
  exito: boolean;
  erroresArchivo: string[];
  codificacion: string;
  filas: FilaListaArmarioRaw[];
  totalFilasLeidas: number;
  totalFilasValidas: number;
  totalFilasOmitidas: number;
  totalFilasTotalesIgnoradas: number;
}

export interface FilaCSV {
  numeroFila: number;
  nombre: string | null;
  referencia: string | null;
  ean: string | null;
  cantidadTexto: string | null;
  raw: Record<string, string>;
}

export interface ResultadoParser {
  filas: FilaCSV[];
  erroresParseo: string[];
  totalFilasLeidas: number;
  totalFilasDescartadas: number;
}

export function normalizarSaltosDeLinea(texto: string): string {
  return texto
    .replace(/\r\r\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}

export function parsearCantidadArmario(texto: string | null | undefined): number | null {
  if (texto === null || texto === undefined) return null;
  const limpio = String(texto).trim();
  if (limpio === "") return null;

  const normalizado = limpio.replace(",", ".");
  const num = Number(normalizado);
  if (isNaN(num)) return null;

  return Math.round(num);
}

export function validarDigitoControlEan13(ean: string): { valido: boolean; motivo?: string } {
  const limpio = ean.trim();
  if (!/^\d{13}$/.test(limpio)) {
    return {
      valido: false,
      motivo: `El EAN "${limpio}" no tiene 13 dígitos numéricos`,
    };
  }

  const digitos = limpio.split("").map(Number);
  let suma = 0;
  for (let i = 0; i < 12; i++) {
    suma += digitos[i]! * (i % 2 === 0 ? 1 : 3);
  }
  const digitoEsperado = (10 - (suma % 10)) % 10;
  const digitoReal = digitos[12];

  if (digitoEsperado !== digitoReal) {
    return {
      valido: false,
      motivo: `Dígito de control no coincide (esperado ${digitoEsperado}, recibido ${digitoReal})`,
    };
  }

  return { valido: true };
}

export function decodificarTextoConCodificacion(bytes: ArrayBuffer | Uint8Array): {
  texto: string;
  codificacion: string;
} {
  const uint8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);

  try {
    const decoderUtf8 = new TextDecoder("utf-8", { fatal: true });
    return { texto: decoderUtf8.decode(uint8), codificacion: "UTF-8" };
  } catch {
    const decoder1252 = new TextDecoder("windows-1252");
    return { texto: decoder1252.decode(uint8), codificacion: "Windows-1252" };
  }
}

function normalizarClaveCabecera(cabecera: string): string {
  return cabecera
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

function neutralizarCelda(valor: string | undefined | null): string {
  if (valor == null) return "";
  const v = String(valor).trim();
  if (/^[=+\-@\t\r]/.test(v)) {
    return `'${v}`;
  }
  return v;
}

export function parsearCSVArmario(contenido: string): ResultadoParser {
  if (!contenido || contenido.trim() === "") {
    return {
      filas: [],
      erroresParseo: ["El archivo CSV está vacío"],
      totalFilasLeidas: 0,
      totalFilasDescartadas: 0,
    };
  }

  const textoNormalizado = normalizarSaltosDeLinea(contenido);

  const parsed = Papa.parse<Record<string, string>>(textoNormalizado, {
    delimiter: ";",
    header: true,
    skipEmptyLines: "greedy",
    dynamicTyping: false,
    transformHeader: (h) => h.trim(),
  });

  const fields = parsed.meta.fields ?? [];
  const map = new Map<string, string>();
  for (const f of fields) {
    const norm = normalizarClaveCabecera(f);
    map.set(norm, f);
    if (norm === "CODIGO_DE_BARRAS" || norm === "CODIGO_BARRAS") {
      map.set("EAN", f);
    }
  }

  const colNombre = map.get("NOMBRE");
  const colRef = map.get("REFERENCIA");
  const colEan = map.get("EAN");
  const colCant = map.get("CANTIDAD");

  const faltantes: string[] = [];
  if (!colNombre) faltantes.push("NOMBRE");
  if (!colRef) faltantes.push("REFERENCIA");
  if (!colCant) faltantes.push("CANTIDAD");

  if (faltantes.length > 0) {
    return {
      filas: [],
      erroresParseo: [`No se encontraron las cabeceras esperadas: ${faltantes.join(", ")}`],
      totalFilasLeidas: parsed.data.length,
      totalFilasDescartadas: 0,
    };
  }

  const filas: FilaCSV[] = [];
  let totalDescartadas = 0;
  const filasCrudas = parsed.data;

  filasCrudas.forEach((row, idx) => {
    const esUltima = idx === filasCrudas.length - 1;

    // Neutralizar fórmulas en raw
    const rawNeutralizado: Record<string, string> = {};
    for (const k of Object.keys(row)) {
      rawNeutralizado[k] = neutralizarCelda(row[k]);
    }

    const nombreRaw = rawNeutralizado[colNombre!] ?? "";
    const refRaw = rawNeutralizado[colRef!] ?? "";
    const eanRaw = colEan ? (rawNeutralizado[colEan] ?? "") : "";
    const cantRaw = colCant ? (rawNeutralizado[colCant] ?? "") : "";

    // Si es la última fila y tiene palabra TOTAL o casi todo vacío, ignorarla
    const tieneTotal =
      nombreRaw.toUpperCase().includes("TOTAL") ||
      refRaw.toUpperCase().includes("TOTAL") ||
      Object.values(row).some((v) => String(v).toUpperCase().includes("TOTAL"));

    if (esUltima && tieneTotal) {
      totalDescartadas++;
      return;
    }

    // Si no tiene ni nombre ni referencia
    if (!nombreRaw && !refRaw) {
      totalDescartadas++;
      return;
    }

    filas.push({
      numeroFila: idx + 2,
      nombre: nombreRaw || null,
      referencia: refRaw || null,
      ean: eanRaw || null,
      cantidadTexto: cantRaw || null,
      raw: rawNeutralizado,
    });
  });

  return {
    filas,
    erroresParseo: (parsed.errors || []).map((e) => e.message),
    totalFilasLeidas: filasCrudas.length,
    totalFilasDescartadas: totalDescartadas,
  };
}

export function parsearCSVArmarioDesdeBytes(contenido: ArrayBuffer | Uint8Array): ResultadoParser {
  const bytes = contenido instanceof Uint8Array ? contenido : new Uint8Array(contenido);
  const { texto } = decodificarTextoConCodificacion(bytes);
  return parsearCSVArmario(texto);
}

export async function parsearArchivoListaArmario(
  archivo: { name: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> } | File,
): Promise<ResultadoParseoListaArmario> {
  const erroresArchivo: string[] = [];

  if (archivo.size === 0) {
    return {
      exito: false,
      erroresArchivo: ["El archivo CSV está vacío."],
      codificacion: "UTF-8",
      filas: [],
      totalFilasLeidas: 0,
      totalFilasValidas: 0,
      totalFilasOmitidas: 0,
      totalFilasTotalesIgnoradas: 0,
    };
  }

  const bytes = await archivo.arrayBuffer();
  const { texto: contenidoTexto, codificacion } = decodificarTextoConCodificacion(bytes);
  const textoNormalizado = normalizarSaltosDeLinea(contenidoTexto);

  const resultadoPapa = Papa.parse<Record<string, string>>(textoNormalizado, {
    delimiter: ";",
    header: true,
    skipEmptyLines: "greedy",
    dynamicTyping: false,
    transformHeader: (h) => h.trim(),
  });

  if (resultadoPapa.errors && resultadoPapa.errors.length > 0) {
    for (const err of resultadoPapa.errors) {
      if (err.type !== "Delimiter") {
        erroresArchivo.push(`Línea ${err.row ?? "?"}: ${err.message}`);
      }
    }
  }

  const cabecerasReales = resultadoPapa.meta.fields ?? [];
  const mapaCabeceras = new Map<string, string>();
  for (const c of cabecerasReales) {
    const norm = normalizarClaveCabecera(c);
    mapaCabeceras.set(norm, c);
    if (norm === "CODIGO_DE_BARRAS" || norm === "CODIGO_BARRAS") {
      mapaCabeceras.set("EAN", c);
    }
  }

  const colNombre = mapaCabeceras.get("NOMBRE");
  const colRef = mapaCabeceras.get("REFERENCIA");
  const colEan = mapaCabeceras.get("EAN");
  const colCantidad = mapaCabeceras.get("CANTIDAD");

  if (!colNombre || !colRef) {
    return {
      exito: false,
      erroresArchivo: [
        `No se encontraron las columnas requeridas (NOMBRE, REFERENCIA). Cabeceras detectadas: ${cabecerasReales.join(", ")}`,
      ],
      codificacion,
      filas: [],
      totalFilasLeidas: 0,
      totalFilasValidas: 0,
      totalFilasOmitidas: 0,
      totalFilasTotalesIgnoradas: 0,
    };
  }

  const filasCrudas = resultadoPapa.data;
  const filasResultado: FilaListaArmarioRaw[] = [];
  let totalTotalesIgnoradas = 0;
  let totalOmitidas = 0;
  let totalValidas = 0;

  for (let i = 0; i < filasCrudas.length; i++) {
    const raw = filasCrudas[i];
    if (!raw) continue;

    const esUltima = i === filasCrudas.length - 1;
    const nombre = (raw[colNombre] ?? "").trim();
    const referencia = (raw[colRef] ?? "").trim();
    const ean = colEan ? (raw[colEan] ?? "").trim() : "";
    const cantidadRaw = colCantidad ? (raw[colCantidad] ?? "").trim() : "";

    const tieneTotal =
      nombre.toUpperCase().includes("TOTAL") ||
      referencia.toUpperCase().includes("TOTAL") ||
      Object.values(raw).some((v) => String(v).toUpperCase().includes("TOTAL"));

    if (esUltima && tieneTotal) {
      totalTotalesIgnoradas++;
      continue;
    }

    if (!nombre && !referencia) {
      totalOmitidas++;
      continue;
    }

    const cantidadParseada = parsearCantidadArmario(cantidadRaw);
    let esOmitida = false;
    let motivoOmitida: string | undefined = undefined;

    if (cantidadParseada === null || cantidadParseada === 0) {
      esOmitida = true;
      motivoOmitida =
        cantidadParseada === 0 ? "Cantidad es 0 uds" : "Cantidad no especificada o vacía";
      totalOmitidas++;
    } else {
      totalValidas++;
    }

    let eanValido = true;
    let avisoEan: string | undefined = undefined;
    if (ean) {
      const resEan = validarDigitoControlEan13(ean);
      eanValido = resEan.valido;
      if (!resEan.valido) {
        avisoEan = resEan.motivo;
      }
    }

    filasResultado.push({
      numeroFilaOriginal: i + 2,
      nombre,
      referencia,
      ean,
      cantidadRaw,
      cantidad: cantidadParseada,
      eanValido,
      esFilaTotal: false,
      esOmitida,
      avisoEan,
      motivoOmitida,
    });
  }

  return {
    exito: erroresArchivo.length === 0,
    erroresArchivo,
    codificacion,
    filas: filasResultado,
    totalFilasLeidas: filasCrudas.length,
    totalFilasValidas: totalValidas,
    totalFilasOmitidas: totalOmitidas,
    totalFilasTotalesIgnoradas: totalTotalesIgnoradas,
  };
}
