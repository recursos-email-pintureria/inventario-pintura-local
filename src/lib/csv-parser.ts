// src/lib/csv-parser.ts

export type SeparadorCSV = ',' | ';' | '\t';
export type CodificacionCSV = 'UTF-8' | 'Windows-1252' | 'UTF-16';

export interface ParseCSVOptions {
  /** Filas de datos a devolver. Por defecto 5 (vista previa). Usa Infinity para todas. */
  maxFilas?: number;
}

export interface ParseCSVResult {
  /** Cabeceras ya saneadas y únicas (los duplicados se renombran: "Nombre", "Nombre (2)"). */
  cabeceras: string[];
  filas: Record<string, string>[];
  metadata: {
    separador: SeparadorCSV;
    codificacion: CodificacionCSV;
    tieneBOM: boolean;
    /** Filas de datos reales (sin cabecera ni filas vacías), aunque solo se devuelvan algunas. */
    totalFilas: number;
    /** Cabeceras que venían repetidas en el archivo original. */
    cabecerasDuplicadas: string[];
    /** Filas con distinto nº de columnas que la cabecera (posible CSV mal formado). */
    filasIrregulares: number;
    /** Avisos no bloqueantes para el usuario (ej: notación científica en EAN). */
    advertencias: string[];
  };
}

const CANDIDATOS: SeparadorCSV[] = [';', ',', '\t'];

/**
 * Lector CSV de una sola pasada (máquina de estados). Soporta:
 *  - campos entre comillas con separadores y saltos de línea dentro
 *  - comillas escapadas ("")
 *  - comillas sueltas dentro de un campo sin entrecomillar (p. ej. 3" de pulgada)
 *  - \n, \r\n y \r; ignora filas totalmente vacías
 * `alRegistro` puede devolver false para detener la lectura.
 */
function recorrerRegistros(
  texto: string,
  sep: string,
  alRegistro: (campos: string[]) => boolean | void,
): void {
  let campos: string[] = [];
  let actual = '';
  let entreComillas = false;

  const cerrarCampo = () => {
    campos.push(actual.trim());
    actual = '';
  };
  
  const cerrarRegistro = (): boolean => {
    cerrarCampo();
    const fila = campos;
    campos = [];
    if (fila.every((c) => c === '')) return true; // fila vacía
    return alRegistro(fila) !== false;
  };

  for (let i = 0; i < texto.length; i++) {
    const c = texto.charAt(i);
    if (entreComillas) {
      if (c === '"') {
        if (texto.charAt(i + 1) === '"') {
          actual += '"';
          i++;
        } else {
          entreComillas = false;
        }
      } else {
        actual += c;
      }
    } else if (c === '"' && actual.trim() === '') {
      entreComillas = true; // las comillas solo abren al inicio del campo (tolerante a espacios)
    } else if (c === sep) {
      cerrarCampo();
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto.charAt(i + 1) === '\n') i++;
      if (!cerrarRegistro()) return;
    } else {
      actual += c;
    }
  }
  if (actual !== '' || campos.length > 0) cerrarRegistro();
}

function decodificar(bytes: Uint8Array): {
  texto: string;
  codificacion: CodificacionCSV;
  tieneBOM: boolean;
} {
  // Protección ante archivos vacíos
  if (bytes.length === 0) {
    return { texto: '', codificacion: 'UTF-8', tieneBOM: false };
  }

  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return { texto: new TextDecoder('utf-16le').decode(bytes.subarray(2)), codificacion: 'UTF-16', tieneBOM: true };
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return { texto: new TextDecoder('utf-16be').decode(bytes.subarray(2)), codificacion: 'UTF-16', tieneBOM: true };
  }
  
  const tieneBOM = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
  const datos = tieneBOM ? bytes.subarray(3) : bytes;
  
  try {
    return { texto: new TextDecoder('utf-8', { fatal: true }).decode(datos), codificacion: 'UTF-8', tieneBOM };
  } catch {
    return { texto: new TextDecoder('windows-1252').decode(datos), codificacion: 'Windows-1252', tieneBOM };
  }
}

/** Elige el separador cuya anchura de columnas es más consistente en las primeras filas. */
function detectarSeparador(texto: string): SeparadorCSV {
  let mejor: SeparadorCSV = ',';
  let mejorPuntos = -1;
  let mejorColumnas = 0;

  for (const sep of CANDIDATOS) {
    const anchos: number[] = [];
    recorrerRegistros(texto, sep, (campos) => {
      anchos.push(campos.length);
      return anchos.length < 20; // Analizar primeras 20 filas
    });
    const columnas = anchos[0] ?? 0;
    if (columnas < 2) continue;
    const puntos = anchos.filter((a) => a === columnas).length;
    if (puntos > mejorPuntos || (puntos === mejorPuntos && columnas > mejorColumnas)) {
      mejor = sep;
      mejorPuntos = puntos;
      mejorColumnas = columnas;
    }
  }
  return mejor;
}

/** Cabeceras vacías -> "Columna_Sin_Nombre_n"; repetidas -> "Nombre (2)". */
function normalizarCabeceras(crudas: string[]): { cabeceras: string[]; duplicadas: string[] } {
  const usadas = new Map<string, number>();
  const duplicadas = new Set<string>();
  const cabeceras = crudas.map((h, index) => {
    const base = h === '' ? `Columna_Sin_Nombre_${index + 1}` : h;
    const veces = (usadas.get(base) ?? 0) + 1;
    usadas.set(base, veces);
    if (veces === 1) return base;
    duplicadas.add(base);
    return `${base} (${veces})`;
  });
  return { cabeceras, duplicadas: [...duplicadas] };
}

/**
 * Parsea un CSV detectando codificación, BOM y separador.
 * Pensado para archivos pequeños/medianos (< 10 MB) en el cliente.
 */
export async function parsearCSV(file: File, opciones: ParseCSVOptions = {}): Promise<ParseCSVResult> {
  const maxFilas = opciones.maxFilas ?? 5;
  const buffer = await file.arrayBuffer();
  const { texto: textoCrudo, codificacion, tieneBOM } = decodificar(new Uint8Array(buffer));

  // Excel puede añadir una primera línea "sep=;" que indica el separador
  let texto = textoCrudo;
  let separadorForzado: SeparadorCSV | null = null;
  const m = /^sep=(.)\r?\n/i.exec(texto);
  if (m && (m[1] === ',' || m[1] === ';' || m[1] === '\t')) {
    separadorForzado = m[1];
    texto = texto.slice(m[0].length);
  }
  const separador = separadorForzado ?? detectarSeparador(texto);

  let cabeceras: string[] | null = null;
  let duplicadas: string[] = [];
  const filas: Record<string, string>[] = [];
  let totalFilas = 0;
  let filasIrregulares = 0;
  const advertencias: string[] = [];

  recorrerRegistros(texto, separador, (campos) => {
    if (cabeceras === null) {
      const r = normalizarCabeceras(campos);
      cabeceras = r.cabeceras;
      duplicadas = r.duplicadas;
      return;
    }
    totalFilas++;
    if (campos.length !== cabeceras.length) filasIrregulares++;
    if (filas.length < maxFilas) {
      const fila: Record<string, string> = {};
      cabeceras.forEach((cabecera, index) => {
        fila[cabecera] = campos[index] ?? '';
      });
      filas.push(fila);
    }
  });

  if (cabeceras === null) throw new Error('El archivo CSV está vacío.');

  // Detección heurística de EAN en notación científica (ej: 8.41E+12)
  const posibleColumnaEAN = (cabeceras as string[]).find((h: string) => /ean|barcode|c.?digo.*barra/gi.test(h));
  if (posibleColumnaEAN) {
    const regexCientifico = /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)$/;
    const tieneCientifico = filas.some(fila => regexCientifico.test(fila[posibleColumnaEAN] || ''));
    if (tieneCientifico) {
      advertencias.push(`La columna "${posibleColumnaEAN}" contiene valores en notación científica. Los ceros iniciales del EAN pueden estar perdidos.`);
    }
  }

  return {
    cabeceras,
    filas,
    metadata: { 
      separador, 
      codificacion, 
      tieneBOM, 
      totalFilas, 
      cabecerasDuplicadas: duplicadas, 
      filasIrregulares,
      advertencias
    },
  };
}