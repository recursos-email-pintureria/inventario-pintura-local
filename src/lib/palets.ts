import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Palet {
  id: string;
  id_reserva: string;
  numero_palet: number;
  codigo_barras: string;
  generado_por: string;
  generado_en: string;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
  reserva_nombre?: string;
}

export interface CrearPaletParams {
  id_reserva: string;
  usuario_nombre: string;
}

/**
 * Genera el código de barras normalizado con el estándar definido:
 * PAL-{numero_pad_3digitos}-{usuario}-{fecha_ddmmaaaa}
 * Ejemplo: PAL-001-Javier-25102026
 */
export function generarCodigoBarrasPalet(
  numeroPalet: number,
  usuario: string,
  fecha: Date = new Date(),
): string {
  const padNumero = String(numeroPalet).padStart(3, "0");
  
  // CORRECCIÓN AQUÍ: Declaración limpia y única de usuarioLimpio
  const usuarioLimpio = (usuario ?? "").trim().split(/\s+/)[0].replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, "") || "Usuario";
  
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const anio = fecha.getFullYear();

  return `PAL-${padNumero}-${usuarioLimpio}-${dia}${mes}${anio}`;
}

/**
 * Obtiene el siguiente número secuencial de palet para una reserva dada.
 * Utiliza la función RPC `get_siguiente_numero_palet` en Supabase
 * con fallback a consulta estándar si es necesario.
 */
export async function getSiguienteNumeroPalet(idReserva: string): Promise<number> {
  const { data, error } = await supabase.rpc("get_siguiente_numero_palet", {
    p_id_reserva: idReserva,
  });

  if (!error && typeof data === "number") {
    return data;
  }

  // Fallback de consulta si RPC no estuviera disponible
  const { data: palets, error: queryError } = await supabase
    .from("palets")
    .select("numero_palet")
    .eq("id_reserva", idReserva)
    .order("numero_palet", { ascending: false })
    .limit(1);

  if (queryError) throw queryError;
  return (palets?.[0]?.numero_palet ?? 0) + 1;
}

/**
 * Carga los palets de una reserva específica.
 */
export async function cargarPaletsPorReserva(
  idReserva: string,
  soloActivos: boolean = true,
): Promise<Palet[]> {
  let query = supabase
    .from("palets")
    .select("*")
    .eq("id_reserva", idReserva)
    .order("numero_palet", { ascending: true });

  if (soloActivos) {
    query = query.eq("activo", true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Palet[];
}

/**
 * Carga todos los palets (con el nombre de su reserva asociada si existe).
 */
export async function cargarPalets(soloActivos: boolean = true): Promise<Palet[]> {
  let query = supabase
    .from("palets")
    .select(
      `
      *,
      ubicacion:id_reserva(id, nombre)
    `,
    )
    .order("creado_en", { ascending: false });

  if (soloActivos) {
    query = query.eq("activo", true);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((p: any) => ({
    ...p,
    reserva_nombre: p.ubicacion?.nombre || undefined,
  })) as Palet[];
}

/**
 * Busca un palet por su código de barras exacto.
 */
export async function cargarPaletPorCodigo(codigoBarras: string): Promise<Palet | null> {
  const { data, error } = await supabase
    .from("palets")
    .select("*")
    .eq("codigo_barras", codigoBarras.trim())
    .maybeSingle();

  if (error) throw error;
  return (data as Palet) ?? null;
}

/**
 * Da de alta un nuevo palet en una reserva.
 * Calcula automáticamente el número consecutivo y genera el código de barras oficial.
 */
export async function crearPalet(params: CrearPaletParams): Promise<Palet> {
  const { id_reserva, usuario_nombre } = params;
  if (!id_reserva) {
    throw new Error("Se requiere la ubicación de reserva.");
  }
  if (!usuario_nombre?.trim()) {
    throw new Error("Se requiere el nombre del usuario generador.");
  }

  const numeroPalet = await getSiguienteNumeroPalet(id_reserva);
  const codigoBarras = generarCodigoBarrasPalet(numeroPalet, usuario_nombre);

  const { data, error } = await supabase
    .from("palets")
    .insert({
      id_reserva,
      numero_palet: numeroPalet,
      codigo_barras: codigoBarras,
      generado_por: usuario_nombre.trim(),
      activo: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Palet;
}

/**
 * Eliminación lógica (Soft delete) de un palet.
 * NUNCA ejecuta DELETE físico en la base de datos.
 */
export async function desactivarPalet(id: string): Promise<void> {
  if (!id) throw new Error("ID de palet requerido.");

  const { error } = await supabase
    .from("palets")
    .update({ activo: false, actualizado_en: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

/**
 * React Query options para consultar palets de una reserva.
 */
export const paletsPorReservaQueryOptions = (idReserva: string, soloActivos: boolean = true) =>
  queryOptions({
    queryKey: ["palets", idReserva, soloActivos],
    queryFn: () => cargarPaletsPorReserva(idReserva, soloActivos),
    enabled: Boolean(idReserva),
  });