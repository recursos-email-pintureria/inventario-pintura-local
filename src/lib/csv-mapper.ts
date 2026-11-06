// src/lib/csv-mapper.ts

export type CampoRequerido = 'sku' | 'nombre' | 'ean' | 'cantidad';

export interface MapeoSugerido {
  sku: string | null;
  nombre: string | null;
  ean: string | null;
  cantidad: string | null;
}

export interface ValidacionMapeo {
  esValido: boolean;
  camposFaltantes: CampoRequerido[];
  columnasRepetidas: string[];
  camposConColumnaInexistente: CampoRequerido[];
}

/**
 * Sinónimos normalizados.
 * 'articulo' solo en 'sku' según convención de ERPs españoles.
 */
const SINONIMOS: Record<CampoRequerido, string[]> = {
  sku: ['referencia', 'ref', 'codigo', 'id', 'articulo', 'cod', 'sku', 'id_producto'],
  nombre: ['descripcion', 'producto', 'denominacion', 'detalle', 'desc', 'nombre'],
  ean: ['ean', 'ean13', 'codigo_barras', 'barcode', 'gtin', 'upc', 'barras'],
  cantidad: ['cantidad', 'unidades', 'qty', 'stock', 'units', 'uds', 'piezas', 'pzs', 'stock_actual'],
};

/** Palabras que anulan coincidencias no exactas. */
const EXCLUSIONES = ['minimo', 'maximo', 'pedido', 'descuento', 'precio', 'coste', 'costo'];

/** Prioridad de desempate (menor número = mayor prioridad). */
const PRIORIDAD_CAMPO: Record<CampoRequerido, number> = {
  ean: 1,
  sku: 2,
  cantidad: 3,
  nombre: 4,
};

/**
 * Distancia de Levenshtein optimizada con 2 filas (O(n) memoria).
 * Usa aserciones no nulas (!) porque matemáticamente los índices siempre existen.
 */
function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let filaAnterior: number[] = Array.from({ length: a.length + 1 }, (_, j) => j);
  let filaActual: number[] = new Array(a.length + 1);

  for (let i = 1; i <= b.length; i++) {
    filaActual[0] = i;
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        filaActual[j] = filaAnterior[j - 1]!;
      } else {
        const costo = filaAnterior[j - 1]! + 1;
        const insercion = filaActual[j - 1]! + 1;
        const borrado = filaAnterior[j]! + 1;
        filaActual[j] = Math.min(costo, insercion, borrado);
      }
    }
    const temp = filaAnterior;
    filaAnterior = filaActual;
    filaActual = temp;
  }
  return filaAnterior[a.length]!;
}

/**
 * Normaliza un texto para hacerlo comparable.
 */
export function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Calcula la mejor puntuación de una cabecera contra una lista de sinónimos.
 */
function obtenerMejorPuntuacion(headerNorm: string, sinonimos: string[]): number {
  const hWords = headerNorm.split('_').filter((w) => w.length > 0);
  const hasExclusion = hWords.some((w) => EXCLUSIONES.includes(w));
  let maxScore = 0;

  for (const sin of sinonimos) {
    const sWords = sin.split('_').filter((w) => w.length > 0);

    if (hasExclusion && headerNorm !== sin) {
      continue;
    }

    for (const hWord of hWords) {
      for (const sWord of sWords) {
        if (hWord === sWord) {
          return 100;
        }

        if (sWord.length >= 3) {
          const dist = levenshtein(hWord, sWord);
          const maxDistAllowed = sWord.length > 6 ? 2 : 1;

          if (dist <= maxDistAllowed) {
            const score = 100 - dist * 15;
            if (score > maxScore) {
              maxScore = score;
            }
          }
        }
      }
    }
  }
  return maxScore;
}

/**
 * Analiza las cabeceras y sugiere un mapeo 1 a 1 basado en puntuación global.
 */
export function sugerirMapeo(cabeceras: string[]): MapeoSugerido {
  const mapeo: MapeoSugerido = { sku: null, nombre: null, ean: null, cantidad: null };
  const cabecerasNorm = cabeceras.map((c) => normalizarTexto(c));

  type Asignacion = { campo: CampoRequerido; colIndex: number; score: number; header: string };
  const asignaciones: Asignacion[] = [];

  for (let colIndex = 0; colIndex < cabeceras.length; colIndex++) {
    const hNorm = cabecerasNorm[colIndex] ?? '';
    const hOrig = cabeceras[colIndex] ?? '';

    for (const campo of Object.keys(SINONIMOS) as CampoRequerido[]) {
      const score = obtenerMejorPuntuacion(hNorm, SINONIMOS[campo]);
      if (score > 0) {
        asignaciones.push({ campo, colIndex, score, header: hOrig });
      }
    }
  }

  asignaciones.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return PRIORIDAD_CAMPO[a.campo] - PRIORIDAD_CAMPO[b.campo];
  });

  const columnasUsadas = new Set<number>();
  const camposAsignados = new Set<CampoRequerido>();

  for (const asig of asignaciones) {
    if (!columnasUsadas.has(asig.colIndex) && !camposAsignados.has(asig.campo)) {
      mapeo[asig.campo] = asig.header;
      columnasUsadas.add(asig.colIndex);
      camposAsignados.add(asig.campo);
    }
  }

  return mapeo;
}

/**
 * Valida que el mapeo sea coherente y completo.
 */
export function validarMapeo(mapeo: MapeoSugerido, cabeceras?: string[]): ValidacionMapeo {
  const obligatorios: CampoRequerido[] = ['sku', 'ean', 'cantidad'];
  const camposFaltantes = obligatorios.filter((campo) => !mapeo[campo]);

  const valores = Object.values(mapeo).filter((v): v is string => v !== null);
  const conteo = new Map<string, number>();
  valores.forEach((v) => conteo.set(v, (conteo.get(v) || 0) + 1));
  const columnasRepetidas = Array.from(conteo.entries())
    .filter(([, count]) => count > 1)
    .map(([col]) => col);

  const camposConColumnaInexistente: CampoRequerido[] = [];
  if (cabeceras) {
    const cabecerasSet = new Set(cabeceras);
    for (const campo of Object.keys(mapeo) as CampoRequerido[]) {
      const col = mapeo[campo];
      if (col && !cabecerasSet.has(col)) {
        camposConColumnaInexistente.push(campo);
      }
    }
  }

  return {
    esValido: camposFaltantes.length === 0 && columnasRepetidas.length === 0 && camposConColumnaInexistente.length === 0,
    camposFaltantes,
    columnasRepetidas,
    camposConColumnaInexistente,
  };
}