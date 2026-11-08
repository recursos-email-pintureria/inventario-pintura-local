// src/lib/mapeo-storage.ts
import { supabase } from "@/lib/supabase";
import { type MapeoSugerido } from "./csv-mapper";

const TABLA = "mapeos_importacion_csv";

/**
 * Busca el mapeo guardado para esa firma de cabeceras.
 * NUNCA lanza: el mapeo guardado es una comodidad y un fallo de red, de permisos
 * o de sesión (401) no debe bloquear la importación; en ese caso devuelve null.
 */
export async function obtenerMapeoGuardado(firma: string): Promise<MapeoSugerido | null> {
  try {
    const { data, error } = await supabase
      .from(TABLA)
      .select("mapeo")
      .eq("firma_cabeceras", firma)
      .maybeSingle();

    if (error) {
      console.warn("[mapeo-storage] No se pudo leer el mapeo guardado:", error.message);
      return null;
    }
    return data ? (data.mapeo as MapeoSugerido) : null;
  } catch (error) {
    console.warn("[mapeo-storage] Error inesperado al leer el mapeo guardado:", error);
    return null;
  }
}

/**
 * Guarda (o actualiza) el mapeo. Devuelve true si se guardó.
 * NUNCA lanza. Usa getSession() (lectura local) en lugar de getUser(), que añade
 * una petición extra al servidor de Auth justo cuando la sesión puede haber caducado.
 */
export async function guardarMapeo(
  firma: string,
  mapeo: MapeoSugerido,
  separador?: string,
  codificacion?: string,
): Promise<boolean> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { error } = await supabase.from(TABLA).upsert(
      {
        firma_cabeceras: firma,
        mapeo,
        separador: separador ?? null,
        codificacion: codificacion ?? null,
        creado_por: session?.user.id ?? null,
        ultimo_uso: new Date().toISOString(),
      },
      { onConflict: "firma_cabeceras" },
    );

    if (error) {
      console.warn("[mapeo-storage] No se pudo guardar el mapeo:", error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[mapeo-storage] Error inesperado al guardar el mapeo:", error);
    return false;
  }
}