import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { PermisosUsuario } from "@/hooks/usePermissions";

export type TipoUbicacion = "pasillo" | "armario" | "alto" | "cross" | "caja" | "reserva";

export interface Ubicacion {
  id: string;
  nombre: string;
  tipo: TipoUbicacion;
  descripcion: string | null;
  id_ubicacion_padre: string | null;
  seccion: string | null;
  seccion_origen: string | null;
  posicion_lateral: "izquierda" | "derecha" | "centro" | null;
  posicion_longitudinal: "principio" | "final" | "paso" | null;
  numero: number | null;
  activo: boolean;
  creado_por: string | null;
  creado_en: string;
  // Campos de relación (se rellenan al cargar)
  seccion_nombre?: string;
  seccion_origen_nombre?: string;
  ubicacion_padre_nombre?: string;
}

export interface DatosUbicacion {
  nombre: string;
  tipo: TipoUbicacion;
  descripcion?: string;
  id_ubicacion_padre?: string | null;
  seccion?: string | null;
  seccion_origen?: string | null;
  posicion_lateral?: "izquierda" | "derecha" | "centro" | null;
  posicion_longitudinal?: "principio" | "final" | "paso" | null;
  numero?: number | null;
}

export const tiposUbicacion: Record<TipoUbicacion, string> = {
  pasillo: "Pasillo",
  armario: "Armario",
  alto: "Alto",
  cross: "Cross",
  caja: "Caja",
  reserva: "Reserva",
};

export function puedeGestionarUbicaciones(permisos: PermisosUsuario | null | undefined) {
  return permisos?.puede_crear_ubicaciones === true;
}

export function filtrarUbicaciones(items: Ubicacion[], seccion: "pasillos" | "altos") {
  return items.filter((u) => u.activo && (seccion === "pasillos" ? u.tipo === "pasillo" : u.tipo === "alto" || u.tipo === "armario"));
}

export async function cargarUbicaciones(): Promise<Ubicacion[]> {
  const { data, error } = await supabase
    .from("ubicaciones")
    .select(`
      *,
      seccion:seccion(id, nombre),
      seccion_origen:seccion_origen(id, nombre),
      ubicacion_padre:id_ubicacion_padre(id, nombre, tipo)
    `)
    .eq("activo", true)
    .order("tipo")
    .order("nombre");
  
  if (error) throw error;
  
  return (data ?? []).map((u: any) => ({
    ...u,
    seccion_nombre: u.seccion?.nombre || null,
    seccion_origen_nombre: u.seccion_origen?.nombre || null,
    ubicacion_padre_nombre: u.ubicacion_padre?.nombre || null,
  })) as Ubicacion[];
}

export const ubicacionesQueryOptions = (userId: string) => queryOptions({
  queryKey: ["ubicaciones", userId],
  queryFn: cargarUbicaciones,
});

export async function guardarUbicacion(datos: DatosUbicacion, id?: string) {
  const nombre = datos.nombre.trim();
  if (!nombre) throw new Error("Introduce el nombre de la ubicación.");
  
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error("Inicia sesión para guardar la ubicación.");
  
  const valores = {
    nombre,
    tipo: datos.tipo,
    descripcion: datos.descripcion?.trim() || null,
    id_ubicacion_padre: datos.id_ubicacion_padre || null,
    seccion: datos.seccion || null,
    seccion_origen: datos.seccion_origen || null,
    posicion_lateral: datos.posicion_lateral || null,
    posicion_longitudinal: datos.posicion_longitudinal || null,
    numero: datos.numero || null,
  };
  
  const query = id
    ? supabase.from("ubicaciones").update(valores).eq("id", id)
    : supabase.from("ubicaciones").insert({ ...valores, creado_por: auth.user.id });
  
  const { data, error } = await query.select("*").single();
  if (error) throw error;
  return data as Ubicacion;
}

export async function desactivarUbicacion(id: string) {
  const { data, error } = await supabase
    .from("ubicaciones")
    .update({ activo: false })
    .eq("id", id)
    .select("id")
    .single();
  
  if (error) throw error;
  return data;
}

export function errorUbicaciones(error: unknown): string {
  const e = error as { code?: string; message?: string };
  if (e?.code === "23505") return "Ya existe una ubicación con ese nombre, aunque esté desactivada.";
  if (e?.code === "42P01" || e?.code === "PGRST205") return "Falta crear la tabla de ubicaciones. Ejecuta primero el SQL de la Fase 4.";
  if (e?.code === "42501" || e?.code === "PGRST116") return "No tienes permiso para realizar esta operación o la ubicación ya no está disponible.";
  return e?.message || "No se pudo completar la operación. Inténtalo de nuevo.";
}