import { supabase } from "./supabase";
import type { Producto } from "./tipos";

// ============================================================================
// TIPOS
// ============================================================================

export interface Seccion {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  creado_en: string | null;
}

export interface Ubicacion {
  id: string;
  nombre: string;
  tipo: "seccion" | "pasillo" | "reserva" | "armario" | "alto" | "caja" | "cross";
  descripcion: string | null;
  activo: boolean;
  creado_por: string | null;
  creado_en: string | null;
  id_ubicacion_padre: string | null;
  seccion: string | null;
  seccion_origen: string | null;
  posicion_lateral: string | null;
  posicion_longitudinal: string | null;
  numero: number | null;
}

export interface UbicacionConSeccion extends Ubicacion {
  seccion_nombre: string | null;
}

export interface ProductoEnUbicacion {
  id: string;
  id_producto: string;
  id_ubicacion: string;
  tipo: string;
  seccion_origen: string | null;
  creado_por: string | null;
  creado_en: string | null;
  producto: Producto | null;
}

// ============================================================================
// SECCIONES
// ============================================================================

export async function getSecciones(): Promise<Seccion[]> {
  const { data, error } = await supabase
    .from("secciones")
    .select("*")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function crearSeccion(
  nombre: string,
  descripcion: string | null = null
): Promise<Seccion> {
  const { data, error } = await supabase
    .from("secciones")
    .insert({ nombre, descripcion, activo: true })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function actualizarSeccion(
  id: string,
  updates: { nombre?: string; descripcion?: string | null; activo?: boolean }
): Promise<Seccion> {
  const { data, error } = await supabase
    .from("secciones")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function desactivarSeccion(id: string): Promise<void> {
  const { error } = await supabase
    .from("secciones")
    .update({ activo: false })
    .eq("id", id);

  if (error) throw error;
}

// ============================================================================
// UBICACIONES
// ============================================================================

export async function getUbicaciones(): Promise<UbicacionConSeccion[]> {
  const { data, error } = await supabase
    .from("ubicaciones")
    .select("*, secciones!seccion(nombre)")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) throw error;

  return (data || []).map((u: any) => ({
    ...u,
    seccion_nombre: u.secciones?.nombre || null,
  }));
}

export async function getUbicacionesPorSeccion(
  seccionId: string
): Promise<UbicacionConSeccion[]> {
  const { data, error } = await supabase
    .from("ubicaciones")
    .select("*, secciones!seccion(nombre)")
    .eq("seccion", seccionId)
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) throw error;

  return (data || []).map((u: any) => ({
    ...u,
    seccion_nombre: u.secciones?.nombre || null,
  }));
}

export async function getUbicacionesPorPadre(
  padreId: string
): Promise<UbicacionConSeccion[]> {
  const { data, error } = await supabase
    .from("ubicaciones")
    .select("*, secciones!seccion(nombre)")
    .eq("id_ubicacion_padre", padreId)
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) throw error;

  return (data || []).map((u: any) => ({
    ...u,
    seccion_nombre: u.secciones?.nombre || null,
  }));
}

/**
 * Crear ubicación con validación de reglas según el README
 */
export async function crearUbicacion(input: {
  nombre: string;
  tipo: Ubicacion["tipo"];
  descripcion?: string | null;
  id_ubicacion_padre?: string | null;
  seccion?: string | null;
  seccion_origen?: string | null;
  posicion_lateral?: string | null;
  posicion_longitudinal?: string | null;
  numero?: number | null;
}): Promise<Ubicacion> {
  // Validación de reglas según tipo
  const requierePadre = ["armario", "alto", "caja", "cross"].includes(input.tipo);
  if (requierePadre && !input.id_ubicacion_padre) {
    throw new Error(
      `El tipo "${input.tipo}" requiere una ubicación padre (pasillo o reserva).`
    );
  }

  const requierePosicionLateral = ["armario", "alto", "caja", "cross"].includes(input.tipo);
  if (requierePosicionLateral && !input.posicion_lateral) {
    throw new Error(
      `El tipo "${input.tipo}" requiere posición lateral (izquierda, centro, derecha).`
    );
  }

  const requierePosicionLongitudinal = input.tipo === "cross";
  if (requierePosicionLongitudinal && !input.posicion_longitudinal) {
    throw new Error(
      `El tipo "cross" requiere posición longitudinal (frente, medio, fondo).`
    );
  }

  const requiereSeccionOrigen = input.tipo === "cross";
  if (requiereSeccionOrigen && !input.seccion_origen) {
    throw new Error(`El tipo "cross" requiere sección de origen.`);
  }

  const { data, error } = await supabase
    .from("ubicaciones")
    .insert({
      nombre: input.nombre,
      tipo: input.tipo,
      descripcion: input.descripcion ?? null,
      id_ubicacion_padre: input.id_ubicacion_padre ?? null,
      seccion: input.seccion ?? null,
      seccion_origen: input.seccion_origen ?? null,
      posicion_lateral: input.posicion_lateral ?? null,
      posicion_longitudinal: input.posicion_longitudinal ?? null,
      numero: input.numero ?? null,
      activo: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function actualizarUbicacion(
  id: string,
  updates: Partial<Ubicacion>
): Promise<Ubicacion> {
  const { data, error } = await supabase
    .from("ubicaciones")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function desactivarUbicacion(id: string): Promise<void> {
  const { error } = await supabase
    .from("ubicaciones")
    .update({ activo: false })
    .eq("id", id);

  if (error) throw error;
}

// ============================================================================
// PRODUCTOS EN UBICACIONES
// ============================================================================

export async function getProductosEnUbicacion(
  ubicacionId: string
): Promise<ProductoEnUbicacion[]> {
  const { data, error } = await supabase
    .from("producto_ubicaciones")
    .select("*, productos(*)")
    .eq("id_ubicacion", ubicacionId);

  if (error) throw error;

  return (data || []).map((pu: any) => ({
    ...pu,
    producto: pu.productos || null,
  }));
}

export async function asignarProductoAUbicacion(input: {
  id_producto: string;
  id_ubicacion: string;
  tipo: string;
  seccion_origen?: string | null;
}): Promise<ProductoEnUbicacion> {
  const { data, error } = await supabase
    .from("producto_ubicaciones")
    .insert({
      id_producto: input.id_producto,
      id_ubicacion: input.id_ubicacion,
      tipo: input.tipo,
      seccion_origen: input.seccion_origen ?? null,
    })
    .select("*, productos(*)")
    .single();

  if (error) throw error;

  return {
    ...data,
    producto: data.productos || null,
  };
}

export async function desasignarProductoDeUbicacion(
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("producto_ubicaciones")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ============================================================================
// STOCK (solo lectura, nunca escritura directa)
// ============================================================================

export async function getStockPorUbicacion(
  ubicacionId: string
): Promise<{ producto_id: string; cantidad: number }[]> {
  const { data, error } = await supabase
    .from("stock")
    .select("producto_id, cantidad")
    .eq("ubicacion_id", ubicacionId);

  if (error) throw error;
  return data || [];
}