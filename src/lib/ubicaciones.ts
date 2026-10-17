import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { PermisosUsuario } from "@/hooks/usePermissions";

export type TipoUbicacion = "pasillo" | "alto" | "armario";
export interface Ubicacion {
  id: string;
  nombre: string;
  tipo: TipoUbicacion;
  descripcion: string | null;
  activo: boolean;
  creado_por: string | null;
  creado_en: string;
}
export interface DatosUbicacion {
  nombre: string;
  tipo: TipoUbicacion;
  descripcion: string;
}

export const tiposUbicacion: Record<TipoUbicacion, string> = {
  pasillo: "Pasillo", alto: "Alto", armario: "Armario",
};

export function puedeGestionarUbicaciones(permisos: PermisosUsuario | null | undefined) {
  return permisos?.puede_crear_ubicaciones === true;
}

export function filtrarUbicaciones(items: Ubicacion[], seccion: "pasillos" | "altos") {
  return items.filter((u) => u.activo && (seccion === "pasillos" ? u.tipo === "pasillo" : u.tipo === "alto" || u.tipo === "armario"));
}

export async function cargarUbicaciones(): Promise<Ubicacion[]> {
  const { data, error } = await supabase.from("ubicaciones").select("*").eq("activo", true).order("nombre");
  if (error) throw error;
  return (data ?? []) as Ubicacion[];
}

export const ubicacionesQueryOptions = (userId: string) => queryOptions({
  queryKey: ["ubicaciones", userId], queryFn: cargarUbicaciones,
});

export async function guardarUbicacion(datos: DatosUbicacion, id?: string) {
  const nombre = datos.nombre.trim();
  if (!nombre) throw new Error("Introduce el nombre de la ubicación.");
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error("Inicia sesión para guardar la ubicación.");
  const valores = { nombre, tipo: datos.tipo, descripcion: datos.descripcion.trim() || null };
  const query = id
    ? supabase.from("ubicaciones").update(valores).eq("id", id)
    : supabase.from("ubicaciones").insert({ ...valores, creado_por: auth.user.id });
  const { data, error } = await query.select("*").single();
  if (error) throw error;
  return data as Ubicacion;
}

export async function desactivarUbicacion(id: string) {
  const { data, error } = await supabase.from("ubicaciones").update({ activo: false }).eq("id", id).select("id").single();
  if (error) throw error;
  return data;
}

export function errorUbicaciones(error: unknown): string {
  const e = error as { code?: string; message?: string };
  if (e?.code === "23505") return "Ya existe una ubicación con ese nombre, aunque esté desactivada.";
  if (e?.code === "42P01" || e?.code === "PGRST205") return "Falta crear la tabla de ubicaciones. Ejecuta primero el SQL de la Fase 2B.";
  if (e?.code === "42501" || e?.code === "PGRST116") return "No tienes permiso para realizar esta operación o la ubicación ya no está disponible.";
  return e?.message || "No se pudo completar la operación. Inténtalo de nuevo.";
}