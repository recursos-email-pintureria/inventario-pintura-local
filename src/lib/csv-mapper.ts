// src/lib/csv-mapper.ts

export type CampoRequerido = 'sku' | 'nombre' | 'ean' | 'cantidad';

export interface MapeoSugerido {
  sku: string | null;
  nombre: string | null;
  ean: string | null;
  cantidad: string | null;
}

/** Sinónimos ya normalizados (ver normalizarTexto). */
const SINONIMOS: Record<CampoRequerido, string[]> = {
  sku: ['sku', 'referencia', 'ref', 'codigo', 'codigo_producto', 'id', 'id_producto', 'cod', 'articulo'],
  nombre: ['nombre', 'descripcion', 'producto', 'denominacion', 'articulo', 'detalle', 'desc'],
  ean: ['ean', 'ean13', 'codigo_barras', 'barcode', 'gtin', 'upc', 'barras'],
  cantidad: ['cantidad', 'unidades', 'qty', 'stock', 'units', 'uds', 'piezas', 'pzs', 'stock_actual'],
};

/**
 * Palabras que delatan otra columna ("stock_minimo" no es la cantidad).
 * Solo se aplican a coincidencias NO exactas.
 */
const EXCLUSIONES: Record<CampoRequerido, string[]> = {
  sku: ['precio', 'coste', 'barras', 'barcode'],
  nombre: ['descuento', 'dto', 'precio', 'coste', 'codigo', 'id', 'ref', 'referencia'],
  ean: ['precio', 'coste'],
  cantidad: ['minimo', 'min', 'maximo', 'max', 'pedido', 'caja', 'pack', 'precio', 'coste', 'descuento'],
};

/** Orden de prioridad ante empates y para repartir columnas ("codigo_barras" es EAN antes que SKU). */
const PRIORIDAD: CampoRequerido[] = ['ean', 'sku', 'cantidad', 'nombre'];

const UMBRAL_MINIMO = 50;

export function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/** Distancia de edición (para erratas tipo "referenica"). */
function levenshtein(a: string, b: string): number {
  const fila = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let anterior = fila[0] ?? 0;
    fila[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temporal = fila[j] ?? 0;
      fila[j] = Math.min(
        (fila[j] ?? 0) + 1,
        (fila[j - 1] ?? 0) + 1,
        anterior + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1),
      );
      anterior = temporal;
    }
  }
  return fila[b.length] ?? 0;
}

/** 0-100: cuánto se parece la cabecera normalizada a un sinónimo. */
function puntuar(campo: CampoRequerido, cabecera: string, sinonimo: string): number {
  if (!cabecera) return 0;
  if (cabecera === sinonimo) return 100;
  if (sinonimo.length < 3) return 0; // sinónimos tan cortos ("id") solo valen exactos

  const tokensCab = cabecera.split('_');
  if (tokensCab.some((t) => EXCLUSIONES[campo].includes(t))) return 0;

  // Todas las palabras del sinónimo aparecen como palabras completas ("ref_proveedor" ~ "ref").
  const tokensSin = sinonimo.split('_');
  if (tokensSin.every((t) => tokensCab.includes(t))) {
    const sobrantes = tokensCab.length - tokensSin.length;
    return Math.max(UMBRAL_MINIMO, 85 - 8 * sobrantes);
  }

  // Erratas: 1 letra de diferencia (sinónimos de 5+ letras) o 2 (de 8+, p. ej. letras intercambiadas).
  if (sinonimo.length >= 5 && cabecera.length >= 5) {
    const maxErratas = sinonimo.length >= 8 ? 2 : 1;
    if (levenshtein(cabecera, sinonimo) <= maxErratas) return 70;
  }

  return 0;
}

/**
 * Sugiere un mapeo. Cada columna se asigna como máximo a UN campo.
 * Devuelve el nombre ORIGINAL de la cabecera (el mismo que usa parsearCSV como clave).
 */
export function sugerirMapeo(cabeceras: string[]): MapeoSugerido {
  const normalizadas = cabeceras.map(normalizarTexto);
  const candidatos: { campo: CampoRequerido; indice: number; puntos: number }[] = [];

  for (const campo of PRIORIDAD) {
    normalizadas.forEach((cabecera, indice) => {
      const puntos = Math.max(...SINONIMOS[campo].map((s) => puntuar(campo, cabecera, s)));
      if (puntos >= UMBRAL_MINIMO) candidatos.push({ campo, indice, puntos });
    });
  }

  candidatos.sort(
    (a, b) =>
      b.puntos - a.puntos ||
      PRIORIDAD.indexOf(a.campo) - PRIORIDAD.indexOf(b.campo) ||
      a.indice - b.indice,
  );

  const mapeo: MapeoSugerido = { sku: null, nombre: null, ean: null, cantidad: null };
  const usadas = new Set<number>();
  for (const { campo, indice } of candidatos) {
    if (mapeo[campo] !== null || usadas.has(indice)) continue;
    mapeo[campo] = cabeceras[indice] ?? null;
    usadas.add(indice);
  }
  return mapeo;
}

export interface ResultadoValidacion {
  esValido: boolean;
  camposFaltantes: CampoRequerido[];
  /** Columnas asignadas a más de un campo. */
  columnasRepetidas: string[];
  /** Campos cuya columna ya no existe en el archivo (p. ej. un mapeo guardado de otro CSV). */
  camposConColumnaInexistente: CampoRequerido[];
}

/** Alias por compatibilidad con componentes que ya importan este nombre. */
export type ValidacionMapeo = ResultadoValidacion;

/**
 * sku, ean y cantidad son obligatorios; nombre es opcional.
 * Pasa `cabeceras` para comprobar también que las columnas existen.
 */
export function validarMapeo(mapeo: MapeoSugerido, cabeceras?: string[]): ResultadoValidacion {
  const obligatorios: CampoRequerido[] = ['sku', 'ean', 'cantidad'];
  const camposFaltantes = obligatorios.filter((campo) => !mapeo[campo]);

  const asignadas = (Object.keys(mapeo) as CampoRequerido[])
    .map((campo) => mapeo[campo])
    .filter((c): c is string => Boolean(c));
  const columnasRepetidas = [...new Set(asignadas.filter((c, i) => asignadas.indexOf(c) !== i))];

  const camposConColumnaInexistente = cabeceras
    ? (Object.keys(mapeo) as CampoRequerido[]).filter((campo) => {
        const columna = mapeo[campo];
        return Boolean(columna) && !cabeceras.includes(columna as string);
      })
    : [];

  return {
    esValido:
      camposFaltantes.length === 0 &&
      columnasRepetidas.length === 0 &&
      camposConColumnaInexistente.length === 0,
    camposFaltantes,
    columnasRepetidas,
    camposConColumnaInexistente,
  };
}


/**
 * Genera una firma única y consistente a partir de las cabeceras.
 * Se normalizan, se ordenan alfabéticamente y se unen con '|'.
 */
export function generarFirmaCabeceras(cabeceras: string[]): string {
  return cabeceras
    .map(normalizarTexto)
    .sort()
    .join('|');
}