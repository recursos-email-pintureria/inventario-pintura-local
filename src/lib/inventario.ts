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
  if (error) {
    if (error.code === "42501" || error.code === "PGRST116")
      throw new Error(
        id
          ? "No tienes permiso para editar este producto o ya no está disponible. Contacta con el administrador."
          : "No tienes permiso para crear productos. Contacta con el administrador.",
      );
    throw error;
  }
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
  if (e?.code === "42501" && e.message?.includes("Sin permiso para registrar movimientos"))
    return "No tienes permiso para registrar movimientos. Pide al administrador el permiso «Crear productos».";
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
// MOVIMIENTOS CON ACTUALIZACIÓN AUTOMÁTICA DE STOCK (CORREGIDO)
// ============================================

// Lectura estricta: si falla, lanza (obtenerStockActual devuelve 0 ante errores,
// lo que aquí generaría movimientos erróneos).
async function leerStockExacto(id_producto: string, id_ubicacion: string): Promise<number> {
  const { data, error } = await supabase
    .from("stock")
    .select("cantidad")
    .eq("id_producto", id_producto)
    .eq("id_ubicacion", id_ubicacion)
    .maybeSingle();
  if (error) throw error;
  return data?.cantidad ?? 0;
}

export async function crearMovimientoConStock(datos: {
  id_producto: string;
  id_ubicacion: string;
  tipo: TipoMovimiento;
  cantidad: number;
  notas: string;
}) {
  if (!datos.id_producto || !datos.id_ubicacion)
    throw new Error("Selecciona producto y ubicación.");
  if (!Number.isInteger(datos.cantidad) || datos.cantidad < 0)
    throw new Error("La cantidad debe ser un entero mayor o igual a cero.");
  
  // Solo el ajuste admite 0 (se traduce a una salida); movimientos.cantidad exige > 0.
  if (datos.cantidad === 0 && datos.tipo !== "ajuste")
    throw new Error("La cantidad debe ser un entero mayor que cero.");

  const user = await usuarioActual();
  let tipo: TipoMovimiento = datos.tipo;
  let cantidad = datos.cantidad;
  let notas = datos.notas.trim() || null;

  if (tipo === "ajuste" && cantidad === 0) {
    const actual = await leerStockExacto(datos.id_producto, datos.id_ubicacion);
    if (actual === 0) return { nuevaCantidad: 0 };
    tipo = "salida";
    cantidad = actual;
    notas = `AJUSTE A 0 (salida de ${actual} uds)${notas ? ` · ${notas}` : ""}`;
  }

  // El trigger actualizar_stock (con bloqueo de fila) es el único que modifica stock.
  const { error } = await supabase.from("movimientos").insert({
    id_producto: datos.id_producto,
    id_ubicacion: datos.id_ubicacion,
    tipo,
    cantidad,
    precio_unitario: null,
    notas,
    realizado_por: user.id,
  });
  if (error) throw error;

  return { nuevaCantidad: await leerStockExacto(datos.id_producto, datos.id_ubicacion) };
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
  const cantidadEnOrigen = await leerStockExacto(datos.id_producto, datos.id_ubicacion_origen);
  if (cantidadEnOrigen < datos.cantidad)
    throw new Error(`No hay stock suficiente en origen. Stock actual: ${cantidadEnOrigen}`);
  const cantidadEnDestino = await leerStockExacto(datos.id_producto, datos.id_ubicacion_destino);

  const fecha = new Date().toISOString();
  const notas = datos.notas.trim() || "Sin notas";
  const base = {
    id_producto: datos.id_producto,
    cantidad: datos.cantidad,
    precio_unitario: null,
    realizado_por: user.id,
    fecha_movimiento: fecha,
  };
  
  // Un solo INSERT = una transacción atómica. El trigger valida el stock de la salida.
  const { error } = await supabase.from("movimientos").insert([
    {
      ...base,
      id_ubicacion: datos.id_ubicacion_origen,
      tipo: "salida" as TipoMovimiento,
      notas: `TRASLADO → ${notas}`,
    },
    {
      ...base,
      id_ubicacion: datos.id_ubicacion_destino,
      tipo: "entrada" as TipoMovimiento,
      notas: `TRASLADO desde origen → ${notas}`,
    },
  ]);
  if (error) throw error;

  return {
    nuevaCantidadOrigen: cantidadEnOrigen - datos.cantidad,
    nuevaCantidadDestino: cantidadEnDestino + datos.cantidad,
  };
}

// ============================================
// PRODUCTOS EN UNA UBICACIÓN CONCRETA (MODAL DE GESTIÓN)
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

export async function actualizarStock(
  id_producto: string,
  id_ubicacion: string,
  nuevaCantidad: number,
) {
  if (!Number.isInteger(nuevaCantidad) || nuevaCantidad < 0)
    throw new Error("La cantidad debe ser un entero ≥ 0.");
  const user = await usuarioActual();

  const cantidadSistema = await leerStockExacto(id_producto, id_ubicacion);
  if (cantidadSistema === nuevaCantidad) return { sinCambios: true };

  // nuevaCantidad = 0 produce una salida por toda la cantidad actual.
  const diferencia = Math.abs(nuevaCantidad - cantidadSistema);
  const tipo: TipoMovimiento = nuevaCantidad > cantidadSistema ? "entrada" : "salida";
  const { error } = await supabase.from("movimientos").insert({
    id_producto,
    id_ubicacion,
    tipo,
    cantidad: diferencia,
    precio_unitario: null,
    notas: `GESTIÓN DESDE UBICACIÓN - Sistema: ${cantidadSistema} → Real: ${nuevaCantidad}`,
    realizado_por: user.id,
  });
  if (error) throw error;

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

  // Un solo INSERT (transacción única): una salida por cada línea con stock.
  const filas = stockLineales.map((s) => ({
    id_producto: s.id_producto,
    id_ubicacion: s.id_ubicacion,
    tipo: "salida" as TipoMovimiento,
    cantidad: s.cantidad,
    precio_unitario: null,
    notas: `LIMPIEZA AUTOMÁTICA - Stock reseteado a 0 (tenía ${s.cantidad} uds)`,
    realizado_por: user.id,
    fecha_movimiento: fecha,
  }));
  const { error: errorMov } = await supabase.from("movimientos").insert(filas);
  if (errorMov) throw errorMov;
  return { productosAfectados: filas.length };
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
    const { data: lineales, error: errorLineales } = await supabase
      .from("ubicaciones")
      .select("id, nombre")
      .eq("tipo", "pasillo")
      .eq("activo", true);

    if (errorLineales || !lineales || lineales.length === 0) return [];

    const idsLineales = lineales.map((l) => l.id);
    const linealesMap = new Map(lineales.map((l) => [l.id, l.nombre]));

    const { data: stockLineales, error: errorStock } = await supabase
      .from("stock")
      .select("id_producto, id_ubicacion, cantidad")
      .in("id_ubicacion", idsLineales)
      .gt("cantidad", 0);

    if (errorStock || !stockLineales || stockLineales.length === 0) return [];

    const idsProductos = [...new Set(stockLineales.map((s) => s.id_producto))];
    const { data: productos } = await supabase
      .from("productos")
      .select("id, nombre")
      .in("id", idsProductos);
    const productosMap = new Map((productos || []).map((p) => [p.id, p.nombre]));

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
  if (!Number.isInteger(datos.cantidad_real) || datos.cantidad_real < 0)
    throw new Error("La cantidad real debe ser un entero ≥ 0.");
  const user = await usuarioActual();

  const cantidadSistema = await leerStockExacto(datos.id_producto, datos.id_ubicacion);
  if (cantidadSistema === datos.cantidad_real) return { ajustado: false, diferencia: 0 };

  const diferencia = datos.cantidad_real - cantidadSistema;
  
  // Bajar (incluido llegar a 0) = salida; subir = entrada. El trigger actualiza stock.
  const { error } = await supabase.from("movimientos").insert({
    id_producto: datos.id_producto,
    id_ubicacion: datos.id_ubicacion,
    tipo: (diferencia < 0 ? "salida" : "entrada") as TipoMovimiento,
    cantidad: Math.abs(diferencia),
    precio_unitario: null,
    notas: `AJUSTE RÁPIDO - Sistema: ${cantidadSistema} → Real: ${datos.cantidad_real} (dif: ${diferencia > 0 ? "+" : ""}${diferencia})`,
    realizado_por: user.id,
  });
  if (error) throw error;

  return { ajustado: true, diferencia };
}

// ============================================
// BÚSQUEDA Y CATÁLOGO DE PRODUCTOS (CORRECCIONES FINALES)
// ============================================

// 1. Búsqueda exacta por código de barras (para escáner)
export async function buscarProductoPorCodigo(codigo: string): Promise<Producto | null> {
  if (!codigo.trim()) return null;
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("codigo_barras", codigo.trim())
    .limit(1)
    .single();
  if (error) return null;
  return data as Producto;
}

// 2. Búsqueda flexible por texto (para autocompletado en el formulario)
export async function buscarProductosPorCodigo(texto: string): Promise<Producto[]> {
  if (!texto.trim()) return [];
  const q = texto.trim();
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .or(`nombre.ilike.%${q}%,sku.ilike.%${q}%,codigo_barras.ilike.%${q}%`)
    .eq("activo", true)
    .order("nombre", { ascending: true })
    .limit(50); // Limitamos a 50 para que el autocompletado sea rápido
  
  if (error) {
    console.error("Error buscando productos:", error);
    return [];
  }
  return data || [];
}

// 3. Descarga completa del catálogo con paginación robusta (evita el límite de 1000 filas de Supabase)
export async function descargarCatalogoCompleto(tamPagina = 1000): Promise<Producto[]> {
  const todos: Producto[] = [];
  let desde = 0;
  while (true) {
    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .eq("activo", true)
      .order("nombre", { ascending: true })
      .order("id", { ascending: true }) // Desempate para orden estable entre páginas
      .range(desde, desde + tamPagina - 1);
    
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    todos.push(...(data as Producto[]));
    if (data.length < tamPagina) break; // Si trae menos de lo pedido, es el final
    desde += tamPagina;
  }
  return todos;
}