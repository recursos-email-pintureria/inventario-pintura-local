// src/lib/mapeo-storage.ts
import { supabase } from "@/lib/supabase";
import { type MapeoSugerido } from "./csv-mapper";

export async function obtenerMapeoGuardado(firma: string): Promise<MapeoSugerido | null> {
  const { data, error } = await supabase
    .from("mapeos_importacion_csv")
    .select("mapeo")
    .eq("firma_cabeceras", firma)
    .maybeSingle();

  if (error || !data) return null;
  return data.mapeo as MapeoSugerido;
}

export async function guardarMapeo(
  firma: string,
  mapeo: MapeoSugerido,
  separador?: string,
  codificacion?: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from("mapeos_importacion_csv")
    .upsert({
      firma_cabeceras: firma,
      mapeo,
      separador,
      codificacion,
      creado_por: user?.id || null,
      ultimo_uso: new Date().toISOString(),
    }, { onConflict: "firma_cabeceras" });

  if (error) {
    console.error("Error al guardar mapeo:", error);
  }
}