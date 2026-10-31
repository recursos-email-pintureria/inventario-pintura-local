import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { crearMovimiento } from "@/lib/inventario";

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
  const usuarioLimpio =
    (
      String(usuario ?? "")
        .trim()
        .split(/\s+/)[0] ?? ""
    ).replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, "") || "Usuario";

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

  if (error) {
    if (error.code === "42501") {
      throw new Error(`Permiso denegado (42501): ${error.message}`);
    }
    throw error;
  }
  return data as Palet;
}

/**
 * Eliminación lógica (Soft delete) de un palet.
 * NUNCA ejecuta DELETE físico en la base de datos.
 */
export async function desactivarPalet(id: string): Promise<void> {
  if (!id) throw new Error("ID de palet requerido.");

  const { data, error } = await supabase
    .from("palets")
    .update({ activo: false, actualizado_en: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "42501") {
      throw new Error(`Permiso denegado (42501): ${error.message}`);
    }
    throw error;
  }
  if (!data) {
    throw new Error("No se pudo dar de baja el palet: no existe o no tienes permisos.");
  }
}

/**
 * Estructura de producto dentro de un palet.
 */
export interface ProductoEnPalet {
  id_producto: string;
  cantidad: number;
  nombre?: string;
  codigo_barras?: string;
  sku?: string;
  producto?: {
    id: string;
    codigo_barras?: string;
    sku?: string;
    nombre: string;
  };
}

export interface GuardarProductoEnPaletParams {
  id_palet: string;
  id_reserva: string;
  id_producto: string;
  cantidad: number;
}

export interface AjustarCantidadProductoEnPaletParams extends GuardarProductoEnPaletParams {
  cantidad_actual: number;
}

export interface ReponerProductoDePaletParams {
  id_palet: string;
  id_producto: string;
  id_ubicacion_destino: string;
  cantidad: number;
}

/**
 * Consulta el stock de productos asignados a un palet determinado (cantidad > 0).
 */
export async function cargarProductosPalet(idPalet: string): Promise<ProductoEnPalet[]> {
  const { data, error } = await supabase
    .from("stock")
    .select("id_producto, cantidad, producto:productos(id, codigo_barras, sku, nombre)")
    .eq("id_palet", idPalet)
    .gt("cantidad", 0);

  if (error) {
    if (error.code === "42501") {
      throw new Error(`Permiso denegado (42501): ${error.message}`);
    }
    throw error;
  }
  return (data ?? []).map((item: any) => ({
    id_producto: item.id_producto,
    cantidad: item.cantidad,
    nombre: item.producto?.nombre,
    codigo_barras: item.producto?.codigo_barras,
    sku: item.producto?.sku,
    producto: item.producto,
  }));
}

/**
 * Registra una entrada de mercancía asociada a un palet mediante movimientos.
 */
export async function guardarProductoEnPalet(params: GuardarProductoEnPaletParams): Promise<void> {
  const { id_palet, id_reserva, id_producto, cantidad } = params;
  if (!id_palet || !id_reserva || !id_producto) {
    throw new Error("Se requieren palet, reserva y producto.");
  }
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    throw new Error("La cantidad debe ser un entero mayor que 0.");
  }

  await crearMovimiento({
    id_producto: id_producto,
    id_ubicacion: id_reserva,
    id_palet,
    tipo: "entrada",
    cantidad,
    motivo: "Entrada de producto en palet de reserva",
  });
}

/**
 * Ajusta la cantidad de un producto del palet registrando solo la diferencia como movimiento.
 */
export async function ajustarCantidadProductoEnPalet(
  params: AjustarCantidadProductoEnPaletParams,
): Promise<void> {
  const { id_palet, id_reserva, id_producto, cantidad_actual, cantidad } = params;
  if (!Number.isInteger(cantidad) || cantidad < 0 || !Number.isInteger(cantidad_actual)) {
    throw new Error("Las cantidades deben ser enteros iguales o mayores que 0.");
  }

  const diferencia = cantidad - cantidad_actual;
  if (diferencia === 0) return;

  await crearMovimiento({
    id_producto: id_producto,
    id_ubicacion: id_reserva,
    id_palet,
    tipo: diferencia > 0 ? "entrada" : "salida",
    cantidad: Math.abs(diferencia),
    motivo: "Ajuste de cantidad de producto en palet",
  });
}

/**
 * Retira la cantidad completa de un producto del palet mediante un movimiento de salida.
 */
export async function eliminarProductoDePalet(
  idPalet: string,
  idProducto: string,
  idReserva: string,
): Promise<void> {
  if (!idPalet || !idProducto || !idReserva) {
    throw new Error("Se requieren palet, producto y reserva.");
  }

  const { data: existente, error: errorConsulta } = await supabase
    .from("stock")
    .select("cantidad")
    .eq("id_palet", idPalet)
    .eq("id_producto", idProducto)
    .maybeSingle();

  if (errorConsulta) {
    if (errorConsulta.code === "42501") {
      throw new Error(`Permiso denegado (42501): ${errorConsulta.message}`);
    }
    throw errorConsulta;
  }
  if (!existente || existente.cantidad <= 0) return;

  await crearMovimiento({
    id_producto: idProducto,
    id_ubicacion: idReserva,
    id_palet: idPalet,
    tipo: "salida",
    cantidad: existente.cantidad,
    motivo: "Retirada de producto del palet",
  });
}

/**
 * Traslada mercancía del palet a una ubicación de tienda en una única transacción de servidor.
 */
export async function reponerProductoDePalet(params: ReponerProductoDePaletParams): Promise<void> {
  const { id_palet, id_producto, id_ubicacion_destino, cantidad } = params;
  if (!id_palet || !id_producto || !id_ubicacion_destino) {
    throw new Error("Se requieren palet, producto y ubicación de destino.");
  }
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    throw new Error("La cantidad debe ser un entero mayor que 0.");
  }

  const { error } = await supabase.rpc("reponer_producto_palet", {
    p_id_palet: id_palet,
    p_id_producto: id_producto,
    p_id_ubicacion_destino: id_ubicacion_destino,
    p_cantidad: cantidad,
  });

  if (error) {
    if (error.code === "42501") {
      throw new Error(`Permiso denegado (42501): ${error.message}`);
    }
    throw error;
  }
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
