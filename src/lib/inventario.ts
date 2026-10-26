import type { Categoria, Producto, MovimientoDetallado, UbicacionSimple } from "./tipos";
import { supabase } from "./supabase";
import { queryOptions } from "@tanstack/react-query";
export type { Categoria } from "./tipos";
// ============================================================================
// CATEGORÍAS
// ============================================================================

/** Obtener todas las categorías activas */
export async function getCategorias(): Promise<Categoria[]> {
  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) throw error;
  return data || [];
}

/** Crear una nueva categoría */
export async function crearCategoria(
  nombre: string,
  descripcion: string | null = null
): Promise<Categoria> {
  const { data, error } = await supabase
    .from("categorias")
    .insert({ nombre, descripcion, activo: true })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Actualizar una categoría */
export async function actualizarCategoria(
  id: string,
  updates: { nombre?: string; descripcion?: string | null; activo?: boolean }
): Promise<Categoria> {
  const { data, error } = await supabase
    .from("categorias")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Eliminar (desactivar) una categoría */
export async function desactivarCategoria(id: string): Promise<void> {
  const { error } = await supabase
    .from("categorias")
    .update({ activo: false })
    .eq("id", id);

  if (error) throw error;
}

// ============================================================================
// PRODUCTOS
// ============================================================================

/** Obtener todos los productos activos */
export async function getProductos(): Promise<Producto[]> {
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) throw error;
  return data || [];
}

/** Crear un nuevo producto */
export async function crearProducto(producto: Partial<Producto>): Promise<Producto> {
  const { data, error } = await supabase
    .from("productos")
    .insert({
      sku: producto.sku,
      nombre: producto.nombre,
      categoria: producto.categoria,
      stock_actual: producto.stock_actual ?? 0,
      stock_minimo: producto.stock_minimo ?? 0,
      unidad: producto.unidad ?? "unid",
      ubicacion: producto.ubicacion ?? null,
      precio: producto.precio ?? 0,
      activo: true,
      largo: producto.largo ?? null,
      ancho: producto.ancho ?? null,
      alto: producto.alto ?? null,
      peso: producto.peso ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Actualizar un producto */
export async function actualizarProducto(
  id: string,
  updates: Partial<Producto>
): Promise<Producto> {
  const { data, error } = await supabase
    .from("productos")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Desactivar un producto (soft delete) */
export async function desactivarProducto(id: string, activo: boolean): Promise<void> {
  const { error } = await supabase
    .from("productos")
    .update({ activo })
    .eq("id", id);

  if (error) throw error;
}

// ============================================================================
// TANSTACK QUERY OPTIONS
// ============================================================================

export const inventarioQueryOptions = {
  categorias: () =>
    queryOptions({
      queryKey: ["categorias"],
      queryFn: getCategorias,
    }),
  productos: () =>
    queryOptions({
      queryKey: ["productos"],
      queryFn: getProductos,
    }),
};

// ============================================================================
// MANEJO DE ERRORES
// ============================================================================

/** Función para manejar errores de inventario */
export function errorInventario(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Error desconocido en el inventario";
}
// ============================================================================
// UBICACIONES (lectura simple para selects)
// ============================================================================

export async function getUbicaciones(): Promise<UbicacionSimple[]> {
  const { data, error } = await supabase.from("ubicaciones").select("*");
  if (error) throw error;
  return (data ?? []).map((u: any) => ({
    id: u.id,
    codigo: u.codigo ?? u.nombre ?? String(u.id).slice(0, 8),
    tipo: u.tipo ?? null,
  }));
}

// ============================================================================
// MOVIMIENTOS (Regla de Oro: NUNCA escribir en `stock`)
// ============================================================================

/**
 * Lee el historial de movimientos y resuelve producto/ubicación/usuario
 * con consultas paralelas (evita depender de nombres de relaciones embed).
 */
export async function getMovimientos(): Promise<MovimientoDetallado[]> {
  let movRes = await supabase
    .from("movimientos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  // Resiliencia: si la columna de fecha se llama distinto, reintentar sin order
  if (movRes.error && /created_at/.test(movRes.error.message)) {
    movRes = await supabase.from("movimientos").select("*").limit(500);
  }
  if (movRes.error) throw movRes.error;

  const [prodRes, ubiRes, perRes] = await Promise.all([
    supabase.from("productos").select("id, nombre, sku"),
    supabase.from("ubicaciones").select("*"),
    supabase.from("perfiles_usuario").select("*"),
  ]);

  const prodMap = new Map((prodRes.data ?? []).map((p: any) => [p.id, p]));
  const ubiMap = new Map((ubiRes.data ?? []).map((u: any) => [u.id, u]));
  const perMap = new Map((perRes.data ?? []).map((u: any) => [u.id, u]));

  const filas: MovimientoDetallado[] = (movRes.data ?? []).map((m: any) => {
    const p = prodMap.get(m.producto_id);
    const u = ubiMap.get(m.ubicacion_id);
    const per = m.usuario_id ? perMap.get(m.usuario_id) : undefined;
    return {
      id: m.id,
      tipo: m.tipo,
      cantidad: Number(m.cantidad),
      fecha: m.created_at ?? m.fecha ?? new Date().toISOString(),
      motivo: m.motivo ?? null,
      producto: p ? { id: p.id, nombre: p.nombre, sku: p.sku ?? null } : null,
      ubicacion: u
        ? { id: u.id, codigo: u.codigo ?? u.nombre ?? String(u.id).slice(0, 8) }
        : null,
      usuario: per
        ? {
            id: per.id,
            nombre:
              per.nombre ?? per.nombre_completo ?? per.email ?? "Usuario",
          }
        : null,
    };
  });

  // Orden estable por fecha descendente en cliente
  return filas.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

/**
 * REGISTRO DE MOVIMIENTO — REGLA DE ORO
 * 1. Nunca toca `stock`.
 * 2. Para `ajuste`, la cantidad es el STOCK OBJETIVO (valor absoluto):
 *    - Si objetivo === stock actual → no se registra nada.
 *    - Si objetivo === 0 → se convierte en `salida` por el stock total
 *      (el trigger rechaza cantidad <= 0).
 * 3. INSERT en `movimientos` → el trigger `actualizar_stock` actualiza el stock.
 */
export async function crearMovimiento(input: {
  producto_id: string;
  ubicacion_id: string;
  tipo: "entrada" | "salida" | "reposicion" | "ajuste";
  cantidad: number; // en `ajuste`: stock objetivo absoluto
  motivo?: string;
}): Promise<void> {
  let tipoFinal: typeof input.tipo = input.tipo;
  let cantidadFinal = Number(input.cantidad);

  if (input.tipo === "ajuste") {
    const { data: stockRow } = await supabase
      .from("stock")
      .select("cantidad")
      .eq("producto_id", input.producto_id)
      .eq("ubicacion_id", input.ubicacion_id)
      .maybeSingle();

    const actual = Number((stockRow as any)?.cantidad ?? 0);
    const objetivo = Number(input.cantidad);

    if (objetivo === actual) {
      throw new Error("El stock ya tiene ese valor: no se registra movimiento.");
    }
    if (objetivo === 0) {
      tipoFinal = "salida";
      cantidadFinal = actual; // vaciado total vía salida
    } else {
      cantidadFinal = objetivo; // el trigger fijará stock = cantidad
    }
  }

  if (!(cantidadFinal > 0)) {
    throw new Error("La cantidad debe ser mayor que 0.");
  }

  const { data: userData } = await supabase.auth.getUser();

  const payload: Record<string, unknown> = {
    producto_id: input.producto_id,
    ubicacion_id: input.ubicacion_id,
    tipo: tipoFinal,
    cantidad: cantidadFinal,
    motivo: input.motivo?.trim() ? input.motivo.trim() : null,
    usuario_id: userData.user?.id ?? null,
  };

  // Insert con fallbacks tolerantes a columnas opcionales
  let res = await supabase.from("movimientos").insert(payload);
  if (res.error && /usuario_id/.test(res.error.message)) {
    const { usuario_id, ...resto } = payload;
    res = await supabase.from("movimientos").insert(resto);
  }
  if (res.error && /motivo/.test(res.error.message)) {
    const { motivo, ...resto } = payload;
    res = await supabase.from("movimientos").insert(resto);
  }
  if (res.error) throw res.error;
}