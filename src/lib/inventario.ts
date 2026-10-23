import { queryOptions } from "@tanstack/react-query";
import { isSameDay } from "date-fns";
import { supabase } from "@/lib/supabase";
import type { PermisosUsuario, PerfilUsuario } from "@/hooks/usePermissions";
import type { Ubicacion } from "@/lib/ubicaciones";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface Categoria {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}
export interface Producto {
  id: string;
  codigo_barras: string;
  sku: string;
  nombre: string;
  descripcion: string | null;
  id_categoria: string | null;
  precio_unitario: number | null;
  activo: boolean;
}
export interface Stock {
  id_producto: string;
  id_ubicacion: string;
  cantidad: number;
}
export type TipoMovimiento = "entrada" | "salida" | "reposicion" | "ajuste";
export interface Movimiento {
  id: string;
  id_producto: string;
  id_ubicacion: string;
  tipo: TipoMovimiento;
  cantidad: number;
  precio_unitario: number | null;
  precio_total: number | null;
  notas: string | null;
  realizado_por: string;
  fecha_movimiento: string;
}
export interface Inventario {
  categorias: Categoria[];
  productos: Producto[];
  ubicaciones: Ubicacion[];
  stock: Stock[];
  movimientos: Movimiento[];
  perfiles: Pick<PerfilUsuario, "id" | "nombre_completo">[];
  puedeVerMovimientos: boolean;
}

export interface ProductoUbicacion {
  id: string;
  id_producto: string;
  id_ubicacion: string;
  tipo: "principal" | "cross" | "caja" | "temporal";
  seccion_origen: string | null;
}

async function cargarInventario(userId: string): Promise<Inventario> {
  const permiso = await supabase
    .from("permisos_usuario")
    .select("*")
    .eq("id_usuario", userId)
    .maybeSingle();
  if (permiso.error) throw permiso.error;
  const puedeVerMovimientos =
    (permiso.data as PermisosUsuario | null)?.puede_ver_movimientos === true;
  const [categorias, productos, ubicaciones, stock, movimientos, perfiles] = await Promise.all([
    supabase.from("categorias").select("*").order("nombre"),
    supabase.from("productos").select("*").order("nombre"),
    supabase.from("ubicaciones").select("*").eq("activo", true).order("nombre"),
    supabase.from("stock").select("*"),
    puedeVerMovimientos
      ? supabase.from("movimientos").select("*").order("fecha_movimiento", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    puedeVerMovimientos
      ? supabase.from("perfiles_usuario").select("id,nombre_completo")
      : Promise.resolve({ data: [], error: null }),
  ]);
  for (const result of [categorias, productos, ubicaciones, stock, movimientos, perfiles])
    if (result.error) throw result.error;
  return {
    categorias: categorias.data as Categoria[],
    productos: productos.data as Producto[],
    ubicaciones: ubicaciones.data as Ubicacion[],
    stock: stock.data as Stock[],
    movimientos: movimientos.data as Movimiento[],
    perfiles: perfiles.data as Inventario["perfiles"],
    puedeVerMovimientos,
  };
}

export const inventarioQueryOptions = (userId: string) =>
  queryOptions({ queryKey: ["inventario", userId], queryFn: () => cargarInventario(userId) });

export async function usuarioActual() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Inicia sesión para continuar.");
  return data.user;
}

export function permisoExplicito(
  permisos: PermisosUsuario | null | undefined,
  key: keyof Omit<PermisosUsuario, "id_usuario">,
) {
  return permisos?.[key] === true;
}
export function stockProducto(stock: Stock[], id: string) {
  return stock.filter((s) => s.id_producto === id).reduce((n, s) => n + s.cantidad, 0);
}
export function productosEnUbicacion(stock: Stock[], id: string) {
  return new Set(
    stock.filter((s) => s.id_ubicacion === id && s.cantidad > 0).map((s) => s.id_producto),
  ).size;
}
export function productosStockBajo(productos: Producto[], stock: Stock[]) {
  return productos.filter((p) => p.activo && stockProducto(stock, p.id) < 10).length;
}
export function movimientosHoy(items: Movimiento[], hoy = new Date()) {
  return items.filter((m) => isSameDay(new Date(m.fecha_movimiento), hoy)).length;
}
export function actividadReciente(items: Movimiento[]) {
  return [...items]
    .sort((a, b) => new Date(b.fecha_movimiento).getTime() - new Date(a.fecha_movimiento).getTime())
    .slice(0, 10);
}

export interface FiltrosMovimiento {
  desde: string;
  hasta: string;
  tipo: string;
  producto: string;
  ubicacion: string;
}
export function filtrarMovimientos(items: Movimiento[], f: FiltrosMovimiento) {
  const desde = f.desde ? new Date(`${f.desde}T00:00:00`).getTime() : -Infinity;
  const hasta = f.hasta ? new Date(`${f.hasta}T23:59:59.999`).getTime() : Infinity;
  return items.filter((m) => {
    const fecha = new Date(m.fecha_movimiento).getTime();
    return (
      fecha >= desde &&
      fecha <= hasta &&
      (!f.tipo || m.tipo === f.tipo) &&
      (!f.producto || m.id_producto === f.producto) &&
      (!f.ubicacion || m.id_ubicacion === f.ubicacion)
    );
  });
}

export function validarCantidad(cantidad: number) {
  if (!Number.isInteger(cantidad) || cantidad <= 0)
    throw new Error("La cantidad debe ser un entero mayor que cero.");
}

export async function guardarCategoria(nombre: string, descripcion: string, id?: string) {
  if (!nombre.trim()) throw new Error("Introduce un nombre.");
  const valores = { nombre: nombre.trim(), descripcion: descripcion.trim() || null };
  const query = id
    ? supabase.from("categorias").update(valores).eq("id", id)
    : supabase.from("categorias").insert(valores);
  const { error } = await query.select("id").single();
  if (error) throw error;
}

export async function comprobarUnicidad(
  campo: "sku" | "codigo_barras",
  valor: string,
  id?: string,
) {
  if (!valor.trim()) return true;
  let query = supabase.from("productos").select("id").eq(campo, valor.trim());
  if (id) query = query.neq("id", id);
  const { data, error } = await query.limit(1);
  if (error) throw error;
  return !data?.length;
}

export async function guardarProducto(
  datos: Omit<Producto, "id" | "activo">,
  id?: string,
): Promise<string> {
  const user = await usuarioActual();
  if (!datos.nombre.trim() || !datos.sku.trim() || !datos.codigo_barras.trim())
    throw new Error("Completa nombre, SKU y código de barras.");
  if (
    datos.precio_unitario !== null &&
    (!Number.isFinite(datos.precio_unitario) || datos.precio_unitario < 0)
  )
    throw new Error("Introduce un precio válido.");
  const valores = {
    ...datos,
    nombre: datos.nombre.trim(),
    sku: datos.sku.trim(),
    codigo_barras: datos.codigo_barras.trim(),
    descripcion: datos.descripcion?.trim() || null,
  };
  const query = id
    ? supabase.from("productos").update(valores).eq("id", id)
    : supabase.from("productos").insert({ ...valores, creado_por: user.id });
  const { data, error } = await query.select("id").single();
  if (error) throw error;
  return data.id;
}

export async function desactivarRegistro(tabla: "categorias" | "productos", id: string) {
  const { error } = await supabase
    .from(tabla)
    .update({ activo: false })
    .eq("id", id)
    .select("id")
    .single();
  if (error) throw error;
}

export async function crearMovimiento(datos: {
  id_producto: string;
  id_ubicacion: string;
  tipo: TipoMovimiento;
  cantidad: number;
  precio_unitario: number | null;
  notas: string;
}) {
  validarCantidad(datos.cantidad);
  if (!datos.id_producto || !datos.id_ubicacion)
    throw new Error("Selecciona producto y ubicación.");
  const user = await usuarioActual();
  const { error } = await supabase
    .from("movimientos")
    .insert({ ...datos, notas: datos.notas.trim() || null, realizado_por: user.id });
  if (error) throw error;
}

export async function cargarUbicacionesProducto(id_producto: string): Promise<ProductoUbicacion[]> {
  const { data, error } = await supabase
    .from("producto_ubicaciones")
    .select("id, id_producto, id_ubicacion, tipo, seccion_origen")
    .eq("id_producto", id_producto);
  if (error) throw error;
  return data || [];
}

export async function guardarUbicacionesProducto(
  id_producto: string,
  ubicaciones: Omit<ProductoUbicacion, "id" | "id_producto">[],
) {
  const { error: deleteError } = await supabase
    .from("producto_ubicaciones")
    .delete()
    .eq("id_producto", id_producto);
  if (deleteError) throw deleteError;

  if (ubicaciones.length > 0) {
    const user = await usuarioActual();
    const datos = ubicaciones.map((u) => ({ ...u, id_producto, creado_por: user.id }));
    const { error: insertError } = await supabase.from("producto_ubicaciones").insert(datos);
    if (insertError) throw insertError;
  }
}

export function errorInventario(error: unknown) {
  const e = error as { code?: string; message?: string };
  if (e?.code === "23505")
    return "Ya existe ese nombre, SKU o código de barras, incluso entre registros desactivados.";
  if (e?.code === "42P01" || e?.code === "PGRST205")
    return "Ejecuta primero el SQL completo de las fases 2B–2E para crear las tablas.";
  if (e?.code === "42501" || e?.code === "PGRST116")
    return "No tienes permiso para esta operación o el registro ya no está disponible.";
  return e?.message || "No se pudo completar la operación. Inténtalo de nuevo.";
}

export const formatoPrecio = (n: number | null) =>
  n === null
    ? "—"
    : new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
        n,
      );
export const formatoFecha = (s: string) =>
  new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeStyle: "short" }).format(new Date(s));

export function filasExportacion(items: Movimiento[], data: Inventario) {
  return items.map((m) => ({
    Fecha: formatoFecha(m.fecha_movimiento),
    Producto: data.productos.find((p) => p.id === m.id_producto)?.nombre ?? m.id_producto,
    Tipo: m.tipo,
    Cantidad: m.cantidad,
    Precio: m.precio_unitario,
    Total: m.precio_total,
    Ubicación: data.ubicaciones.find((u) => u.id === m.id_ubicacion)?.nombre ?? m.id_ubicacion,
    Usuario:
      data.perfiles.find((p) => p.id === m.realizado_por)?.nombre_completo ??
      "Usuario no disponible",
    Notas: m.notas ?? "",
  }));
}

export async function exportarMovimientos(
  formato: "excel" | "pdf",
  items: Movimiento[],
  data: Inventario,
) {
  const filas = filasExportacion(items, data);
  if (filas.length === 0)
    throw new Error("No hay movimientos para exportar con los filtros actuales.");
  const nombreArchivo = `movimientos_${new Date().toISOString().split("T")[0]}`;
  if (formato === "excel") {
    const libro = XLSX.utils.book_new();
    const hoja = XLSX.utils.json_to_sheet(filas);
    XLSX.utils.book_append_sheet(libro, hoja, "Movimientos");
    XLSX.writeFile(libro, `${nombreArchivo}.xlsx`);
  } else {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.text("Movimientos · Inventario Pintura - LM", 14, 15);
    const cabeceras = [
      ["Fecha", "Producto", "Tipo", "Cantidad", "Precio", "Total", "Ubicación", "Usuario", "Notas"],
    ];
    const cuerpo = filas.map((f) => [
      f.Fecha,
      f.Producto,
      f.Tipo,
      String(f.Cantidad),
      f.Precio === null ? "—" : String(f.Precio),
      f.Total === null ? "—" : String(f.Total),
      f.Ubicación,
      f.Usuario,
      f.Notas,
    ]);
    autoTable(doc, {
      startY: 22,
      head: cabeceras,
      body: cuerpo,
      styles: { fontSize: 8, overflow: "linebreak" },
      headStyles: { fillColor: [41, 128, 185] },
    });
    doc.save(`${nombreArchivo}.pdf`);
  }
}

// ============================================
// FUNCIONES PARA UBICACIONES JERÁRQUICAS (FASE 4)
// ============================================

export interface Seccion {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface UbicacionJerarquica {
  id: string;
  nombre: string;
  tipo: "pasillo" | "armario" | "alto" | "cross" | "caja" | "reserva";
  id_ubicacion_padre: string | null;
  seccion: string | null;
  seccion_origen: string | null;
  posicion_lateral: "izquierda" | "derecha" | "centro" | null;
  posicion_longitudinal: "principio" | "final" | "paso" | null;
  numero: number | null;
  descripcion: string | null;
  activo: boolean;
  seccion_nombre?: string;
  seccion_origen_nombre?: string;
  ubicacion_padre_nombre?: string;
}

export async function obtenerSecciones(): Promise<Seccion[]> {
  const { data, error } = await supabase
    .from("secciones")
    .select("*")
    .eq("activo", true)
    .order("nombre");
  if (error) throw error;
  return data || [];
}

export async function obtenerUbicaciones(): Promise<UbicacionJerarquica[]> {
  const { data, error } = await supabase
    .from("ubicaciones")
    .select(
      `*, seccion:seccion(id, nombre), seccion_origen:seccion_origen(id, nombre), ubicacion_padre:id_ubicacion_padre(id, nombre, tipo)`,
    )
    .eq("activo", true)
    .order("tipo")
    .order("nombre");

  if (error) throw error;
  return (data || []).map((u: any) => ({
    ...u,
    seccion_nombre: u.seccion?.nombre || null,
    seccion_origen_nombre: u.seccion_origen?.nombre || null,
    ubicacion_padre_nombre: u.ubicacion_padre?.nombre || null,
  }));
}

export async function crearUbicacion(ubicacion: {
  nombre: string;
  tipo: "pasillo" | "armario" | "alto" | "cross" | "caja" | "reserva";
  id_ubicacion_padre?: string | null;
  seccion?: string | null;
  seccion_origen?: string | null;
  posicion_lateral?: "izquierda" | "derecha" | "centro" | null;
  posicion_longitudinal?: "principio" | "final" | "paso" | null;
  numero?: number | null;
  descripcion?: string | null;
}) {
  // ✅ Validar unicidad SOLO dentro del mismo pasillo padre
  if (ubicacion.id_ubicacion_padre) {
    const { data: existe } = await supabase
      .from("ubicaciones")
      .select("id")
      .eq("nombre", ubicacion.nombre)
      .eq("id_ubicacion_padre", ubicacion.id_ubicacion_padre)
      .limit(1);

    if (existe && existe.length > 0) {
      throw new Error(`Ya existe "${ubicacion.nombre}" en este pasillo.`);
    }
  } else {
    // Para pasillos/reservas (sin padre), validar nombre único global
    const { data: existe } = await supabase
      .from("ubicaciones")
      .select("id")
      .eq("nombre", ubicacion.nombre)
      .is("id_ubicacion_padre", null)
      .limit(1);

    if (existe && existe.length > 0) {
      throw new Error(`Ya existe el pasillo "${ubicacion.nombre}".`);
    }
  }

  const { data, error } = await supabase.from("ubicaciones").insert([ubicacion]).select().single();

  if (error) throw error;
  return data;
}

export async function actualizarUbicacion(
  id: string,
  ubicacion: Partial<{
    nombre: string;
    tipo: "pasillo" | "armario" | "alto" | "cross" | "caja" | "reserva";
    id_ubicacion_padre?: string | null;
    seccion?: string | null;
    seccion_origen?: string | null;
    posicion_lateral?: "izquierda" | "derecha" | "centro" | null;
    posicion_longitudinal?: "principio" | "final" | "paso" | null;
    numero?: number | null;
    descripcion?: string | null;
    activo?: boolean;
  }>,
) {
  const { data, error } = await supabase
    .from("ubicaciones")
    .update(ubicacion)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function desactivarUbicacion(id: string) {
  const { error } = await supabase.from("ubicaciones").update({ activo: false }).eq("id", id);
  if (error) throw error;
}

export async function borrarUbicacionDefinitivamente(id: string) {
  const { data: stock, error: stockError } = await supabase
    .from("stock")
    .select("id")
    .eq("id_ubicacion", id)
    .limit(1);
  if (stockError) throw stockError;
  if (stock && stock.length > 0)
    throw new Error(
      "No se puede borrar: la ubicación tiene stock asociado. Desactívala en su lugar.",
    );

  const { data: movimientos, error: movError } = await supabase
    .from("movimientos")
    .select("id")
    .eq("id_ubicacion", id)
    .limit(1);
  if (movError) throw movError;
  if (movimientos && movimientos.length > 0)
    throw new Error(
      "No se puede borrar: la ubicación tiene movimientos históricos. Desactívala en su lugar.",
    );

  const { error } = await supabase.from("ubicaciones").delete().eq("id", id);
  if (error) throw error;
}

export async function sePuedeBorrarDefinitivamente(id: string): Promise<boolean> {
  const { data: stock } = await supabase.from("stock").select("id").eq("id_ubicacion", id).limit(1);
  if (stock && stock.length > 0) return false;
  const { data: movimientos } = await supabase
    .from("movimientos")
    .select("id")
    .eq("id_ubicacion", id)
    .limit(1);
  if (movimientos && movimientos.length > 0) return false;
  return true;
}

// ============================================
// MOVIMIENTOS CON ACTUALIZACIÓN AUTOMÁTICA DE STOCK
// ============================================

export async function crearMovimientoConStock(datos: {
  id_producto: string;
  id_ubicacion: string;
  tipo: TipoMovimiento;
  cantidad: number;
  notas: string;
}) {
  validarCantidad(datos.cantidad);
  if (!datos.id_producto || !datos.id_ubicacion)
    throw new Error("Selecciona producto y ubicación.");

  const user = await usuarioActual();
  const { error: movError } = await supabase.from("movimientos").insert({
    id_producto: datos.id_producto,
    id_ubicacion: datos.id_ubicacion,
    tipo: datos.tipo,
    cantidad: datos.cantidad,
    precio_unitario: null,
    notas: datos.notas.trim() || null,
    realizado_por: user.id,
  });
  if (movError) throw movError;

  // La tabla `stock` solo permite SELECT a authenticated (GRANT/RLS en sql/):
  // el trigger `movimientos_actualizar_stock` ya aplicó la nueva cantidad al
  // insertar el movimiento. Escribir stock directamente devolvía 403.
  const { data: stockNuevo, error: stockError } = await supabase
    .from("stock")
    .select("cantidad")
    .eq("id_producto", datos.id_producto)
    .eq("id_ubicacion", datos.id_ubicacion)
    .maybeSingle();
  if (stockError) throw stockError;
  return { nuevaCantidad: stockNuevo?.cantidad ?? 0 };
}

export async function crearTraslado(datos: {
  id_producto: string;
  id_ubicacion_origen: string;
  id_ubicacion_destino: string;
  cantidad: number;
  notas: string;
}) {
  validarCantidad(datos.cantidad);
  if (!datos.id_producto || !datos.id_ubicacion_origen || !datos.id_ubicacion_destino)
    throw new Error("Selecciona producto y ubicaciones.");
  if (datos.id_ubicacion_origen === datos.id_ubicacion_destino)
    throw new Error("Origen y destino no pueden ser iguales.");

  const user = await usuarioActual();
  const fecha = new Date().toISOString();

  const { data: stockOrigen, error: errorOrigen } = await supabase
    .from("stock")
    .select("cantidad")
    .eq("id_producto", datos.id_producto)
    .eq("id_ubicacion", datos.id_ubicacion_origen)
    .maybeSingle();
  if (errorOrigen) throw errorOrigen;

  const cantidadEnOrigen = stockOrigen?.cantidad || 0;
  if (cantidadEnOrigen < datos.cantidad)
    throw new Error(`No hay stock suficiente en origen. Stock actual: ${cantidadEnOrigen}`);

  const { error: movOrigenError } = await supabase.from("movimientos").insert({
    id_producto: datos.id_producto,
    id_ubicacion: datos.id_ubicacion_origen,
    tipo: "salida" as TipoMovimiento,
    cantidad: datos.cantidad,
    precio_unitario: null,
    notas: `TRASLADO → ${datos.notas || "Sin notas"}`,
    realizado_por: user.id,
    fecha_movimiento: fecha,
  });
  if (movOrigenError) throw movOrigenError;

  const { error: movDestinoError } = await supabase.from("movimientos").insert({
    id_producto: datos.id_producto,
    id_ubicacion: datos.id_ubicacion_destino,
    tipo: "entrada" as TipoMovimiento,
    cantidad: datos.cantidad,
    precio_unitario: null,
    notas: `TRASLADO desde origen → ${datos.notas || "Sin notas"}`,
    realizado_por: user.id,
    fecha_movimiento: fecha,
  });
  if (movDestinoError) throw movDestinoError;

  // El trigger de la BD ya actualizó ambas cantidades de stock al insertar los
  // movimientos; solo leemos el resultado (stock no admite escrituras directas).
  const { data: stockFinalOrigen } = await supabase
    .from("stock")
    .select("cantidad")
    .eq("id_producto", datos.id_producto)
    .eq("id_ubicacion", datos.id_ubicacion_origen)
    .maybeSingle();

  const { data: stockFinalDestino } = await supabase
    .from("stock")
    .select("cantidad")
    .eq("id_producto", datos.id_producto)
    .eq("id_ubicacion", datos.id_ubicacion_destino)
    .maybeSingle();

  return {
    nuevaCantidadOrigen: stockFinalOrigen?.cantidad ?? cantidadEnOrigen - datos.cantidad,
    nuevaCantidadDestino: stockFinalDestino?.cantidad ?? datos.cantidad,
  };
}

// ============================================
// PRODUCTOS EN UNA UBICACIÓN CONCRETA (MODAL DE GESTIÓN)
// Equivalente a:
//   SELECT p.*, s.cantidad
//   FROM productos p
//   JOIN stock s ON p.id = s.id_producto
//   WHERE s.id_ubicacion = 'ID_UBICACION'
// ============================================

export interface ProductoConCantidad extends Producto {
  cantidad: number;
}

export async function obtenerProductosPorUbicacion(
  id_ubicacion: string,
): Promise<ProductoConCantidad[]> {
  const { data, error } = await supabase
    .from("stock")
    .select(`cantidad, producto:productos(*)`)
    .eq("id_ubicacion", id_ubicacion)
    .gt("cantidad", 0);
  if (error) throw error;
  return (data || [])
    .filter((row: any) => row.producto)
    .map((row: any) => ({ ...(row.producto as Producto), cantidad: row.cantidad as number }));
}

// Ajusta el stock de un producto en una ubicación registrando UN ÚNICO
// movimiento (entrada si sube, salida si baja o se quita). La tabla `stock`
// solo acepta SELECT para el rol authenticated: las escrituras directas
// (update/insert/delete) fallan con 403 por RLS. El cambio de cantidades lo
// aplica el trigger `movimientos_actualizar_stock` al insertar el movimiento.
export async function actualizarStock(
  id_producto: string,
  id_ubicacion: string,
  nuevaCantidad: number,
  opciones?: { tipo?: TipoMovimiento; notas?: string },
) {
  if (!Number.isInteger(nuevaCantidad) || nuevaCantidad < 0)
    throw new Error("La cantidad debe ser un entero ≥ 0.");
  const user = await usuarioActual();
  const fecha = new Date().toISOString();

  const { data: actual, error: leerError } = await supabase
    .from("stock")
    .select("cantidad")
    .eq("id_producto", id_producto)
    .eq("id_ubicacion", id_ubicacion)
    .maybeSingle();
  if (leerError) throw leerError;

  const cantidadSistema = actual?.cantidad || 0;
  if (cantidadSistema === nuevaCantidad) return { sinCambios: true };

  // El trigger de BD interpreta el movimiento según su tipo: 'ajuste' fija la
  // cantidad absoluta (= valor insertado), entrada suma y salida resta. Por
  // eso aquí SIEMPRE se inserta la cantidad final deseada, no la diferencia:
  // con 'salida' + diferencia el stock quedaba mal cuando no existía fila en
  // stock (restar sobre 0) y nunca se fijaba el valor real contado.
  const tipo: TipoMovimiento = opciones?.tipo ?? "ajuste";
  const { error: movError } = await supabase.from("movimientos").insert({
    id_producto,
    id_ubicacion,
    tipo,
    cantidad: nuevaCantidad,
    precio_unitario: null,
    notas:
      opciones?.notas ??
      `GESTIÓN DESDE UBICACIÓN - Sistema: ${cantidadSistema} → Real: ${nuevaCantidad}`,
    realizado_por: user.id,
    fecha_movimiento: fecha,
  });
  if (movError) throw movError;

  return { sinCambios: false, nuevaCantidad };
}

export async function obtenerStockActual(
  id_producto: string,
  id_ubicacion: string,
): Promise<number> {
  const { data } = await supabase
    .from("stock")
    .select("cantidad")
    .eq("id_producto", id_producto)
    .eq("id_ubicacion", id_ubicacion)
    .maybeSingle();
  return data?.cantidad || 0;
}

export async function obtenerUbicacionesConStock(
  id_producto: string,
): Promise<{ id_ubicacion: string; cantidad: number }[]> {
  const { data, error } = await supabase
    .from("stock")
    .select("id_ubicacion, cantidad")
    .eq("id_producto", id_producto)
    .gt("cantidad", 0);
  if (error) throw error;
  return data || [];
}

// ============================================
// LIMPIAR Y AJUSTAR STOCK DE LINEALES (PASILLOS)
// ============================================

export async function limpiarStockLineales(): Promise<{ productosAfectados: number }> {
  const user = await usuarioActual();
  const fecha = new Date().toISOString();

  const { data: lineales, error: errorLineales } = await supabase
    .from("ubicaciones")
    .select("id")
    .eq("tipo", "pasillo")
    .eq("activo", true);
  if (errorLineales) throw errorLineales;
  if (!lineales || lineales.length === 0) return { productosAfectados: 0 };

  const idsLineales = lineales.map((l) => l.id);
  const { data: stockLineales, error: errorStock } = await supabase
    .from("stock")
    .select("id_producto, id_ubicacion, cantidad")
    .in("id_ubicacion", idsLineales)
    .gt("cantidad", 0);
  if (errorStock) throw errorStock;
  if (!stockLineales || stockLineales.length === 0) return { productosAfectados: 0 };

  let productosAfectados = 0;
  for (const stock of stockLineales) {
    // El trigger `movimientos_actualizar_stock` resetea la cantidad a 0 con la
    // salida; ya no se escribe en stock directamente (403 por RLS/GRANT).
    const { error: movError } = await supabase.from("movimientos").insert({
      id_producto: stock.id_producto,
      id_ubicacion: stock.id_ubicacion,
      tipo: "salida" as TipoMovimiento,
      cantidad: stock.cantidad,
      precio_unitario: null,
      notas: `LIMPIEZA AUTOMÁTICA - Stock reseteado a 0 (tenía ${stock.cantidad} uds)`,
      realizado_por: user.id,
      fecha_movimiento: fecha,
    });
    if (movError) throw movError;
    productosAfectados++;
  }
  return { productosAfectados };
}

export async function obtenerStockLineales(): Promise<
  {
    id_producto: string;
    id_ubicacion: string;
    cantidad: number;
    nombre_producto?: string;
    nombre_ubicacion?: string;
  }[]
> {
  try {
    // Paso 1: Obtener ubicaciones de tipo pasillo
    const { data: lineales, error: errorLineales } = await supabase
      .from("ubicaciones")
      .select("id, nombre")
      .eq("tipo", "pasillo")
      .eq("activo", true);

    if (errorLineales || !lineales || lineales.length === 0) return [];

    const idsLineales = lineales.map((l) => l.id);
    const linealesMap = new Map(lineales.map((l) => [l.id, l.nombre]));

    // Paso 2: Obtener stock en esos lineales
    const { data: stockLineales, error: errorStock } = await supabase
      .from("stock")
      .select("id_producto, id_ubicacion, cantidad")
      .in("id_ubicacion", idsLineales)
      .gt("cantidad", 0);

    if (errorStock || !stockLineales || stockLineales.length === 0) return [];

    // Paso 3: Obtener nombres de productos
    const idsProductos = [...new Set(stockLineales.map((s) => s.id_producto))];
    const { data: productos } = await supabase
      .from("productos")
      .select("id, nombre")
      .in("id", idsProductos);
    const productosMap = new Map((productos || []).map((p) => [p.id, p.nombre]));

    // Paso 4: Combinar todo
    return stockLineales.map((s) => ({
      id_producto: s.id_producto,
      id_ubicacion: s.id_ubicacion,
      cantidad: s.cantidad,
      nombre_producto: productosMap.get(s.id_producto) || "Desconocido",
      nombre_ubicacion: linealesMap.get(s.id_ubicacion) || "Desconocida",
    }));
  } catch (e) {
    console.error("Error en obtenerStockLineales:", e);
    return [];
  }
}

export async function ajustarStockLineal(datos: {
  id_producto: string;
  id_ubicacion: string;
  cantidad_real: number;
}) {
  const user = await usuarioActual();
  const fecha = new Date().toISOString();

  const { data: stockActual, error: stockError } = await supabase
    .from("stock")
    .select("cantidad")
    .eq("id_producto", datos.id_producto)
    .eq("id_ubicacion", datos.id_ubicacion)
    .maybeSingle();

  if (stockError) throw stockError;

  const cantidadSistema = stockActual?.cantidad || 0;
  if (cantidadSistema === datos.cantidad_real) return { ajustado: false, diferencia: 0 };

  const diferencia = datos.cantidad_real - cantidadSistema;

  // El trigger `movimientos_actualizar_stock` aplica la cantidad final al
  // insertar el movimiento; no se escribe en stock directamente (403 por RLS).
  const cantidadASacar = cantidadSistema - datos.cantidad_real;
  if (cantidadASacar > 0) {
    const { error: movError } = await supabase.from("movimientos").insert({
      id_producto: datos.id_producto,
      id_ubicacion: datos.id_ubicacion,
      tipo: "salida" as TipoMovimiento,
      cantidad: cantidadASacar,
      precio_unitario: null,
      notas: `AJUSTE RÁPIDO - Sistema: ${cantidadSistema} → Real: ${datos.cantidad_real} (dif: ${diferencia})`,
      realizado_por: user.id,
      fecha_movimiento: fecha,
    });
    if (movError) throw movError;
  } else if (datos.cantidad_real > cantidadSistema) {
    const { error: movError } = await supabase.from("movimientos").insert({
      id_producto: datos.id_producto,
      id_ubicacion: datos.id_ubicacion,
      tipo: "entrada" as TipoMovimiento,
      cantidad: datos.cantidad_real - cantidadSistema,
      precio_unitario: null,
      notas: `AJUSTE RÁPIDO - Sistema: ${cantidadSistema} → Real: ${datos.cantidad_real} (dif: +${diferencia})`,
      realizado_por: user.id,
      fecha_movimiento: fecha,
    });
    if (movError) throw movError;
  }

  return { ajustado: true, diferencia };
}

// ============================================
// BÚSQUEDA DE PRODUCTO POR CÓDIGO DE BARRAS (AUTOCOMPLETADO)
// ============================================

export async function buscarProductoPorCodigo(codigo: string): Promise<Producto | null> {
  const resultados = await buscarProductosPorCodigo(codigo);
  return resultados[0] ?? null;
}

/** Primeros N productos activos ordenados por nombre (para autocompletado inicial). */
/**
 * Catálogo paginado de productos activos.
 * pagina empieza en 1; tamPagina = nº de items por página (ej. 50).
 */
export async function obtenerTodosProductos(
  limit = 100,
  pagina = 1,
  tamPagina?: number,
): Promise<{ productos: Producto[]; total: number }> {
  const size = tamPagina ?? limit;
  const desde = (pagina - 1) * size;
  const hasta = desde + size - 1;
  const { data, error, count } = await supabase
    .from("productos")
    .select("*", { count: "exact" })
    .eq("activo", true)
    .order("nombre", { ascending: true })
    .range(desde, hasta);
  if (error) throw error;
  return { productos: (data || []) as Producto[], total: count ?? 0 };
}

/** Lista de coincidencias por código de barras exacto o parcial (nombre/SKU). */
export async function buscarProductosPorCodigo(codigo: string): Promise<Producto[]> {
  const q = codigo.trim();
  console.log("[autocompletar] texto buscado:", JSON.stringify(q));
  if (!q) return [];
  // Primero coincidencia EXACTA de código de barras (caso típico del escáner).
  const { data: exactos, error: eExacta } = await supabase
    .from("productos")
    .select("*")
    .eq("codigo_barras", q)
    .eq("activo", true)
    .limit(20);
  if (!eExacta && exactos && exactos.length > 0) return exactos as Producto[];
  // Si no hay exactos, búsqueda parcial por código, SKU o nombre.
  const filtro = `codigo_barras.ilike.%${q}%,sku.ilike.%${q}%,nombre.ilike.%${q}%`;
  const { data: parciales, error: eParcial } = await supabase
    .from("productos")
    .select("*")
    .eq("activo", true)
    .or(filtro)
    .limit(20);
  if (eParcial) console.error("[autocompletar] ERROR consulta Supabase:", eParcial);
  console.log("[autocompletar] datos crudos:", parciales?.length ?? null, "coincidencias");
  return (parciales || []) as Producto[];
}
