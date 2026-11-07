// src/lib/csv-transformer.ts
import { type MapeoSugerido } from "./csv-mapper";

/**
 * Transforma las filas mapeadas a un Uint8Array con formato CSV canónico
 * (REFERENCIA;NOMBRE;EAN;CANTIDAD) para el parser legacy.
 * 
 * IMPORTANTE: Usa punto y coma (;) como separador porque el parser legacy
 * (parser-lista-armario.ts) lo tiene hardcodeado así.
 */
export function transformarACanonico(
  filas: Record<string, string>[],
  mapeo: MapeoSugerido
): Uint8Array {
  // Separador: punto y coma (compatible con el parser legacy)
  const headers = ["REFERENCIA", "NOMBRE", "EAN", "CANTIDAD"];
  const lines: string[] = [headers.join(";")];

  // Función para escapar valores CSV correctamente
  const escape = (val: string | null | undefined): string => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    // Escapamos comillas dobles y envolvemos en comillas si tiene punto y coma, saltos de línea o comillas
    if (str.includes('"') || str.includes(';') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  for (const fila of filas) {
    const ref = escape(fila[mapeo.sku ?? ""]);
    const nom = escape(fila[mapeo.nombre ?? ""]);
    const ean = escape(fila[mapeo.ean ?? ""]);
    const cant = escape(fila[mapeo.cantidad ?? ""]);
    lines.push([ref, nom, ean, cant].join(";"));
  }

  // \r\n para compatibilidad con Windows/Excel
  const csvString = lines.join("\r\n");
  const encoder = new TextEncoder();
  
  // SIN BOM: el parser legacy no lo maneja explícitamente y puede causar
  // que la primera columna se lea como "\uFEFFREFERENCIA"
  return encoder.encode(csvString);
}
