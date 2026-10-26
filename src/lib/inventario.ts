import { supabase } from "./supabase";
import type { Categoria, Producto } from "./tipos";
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