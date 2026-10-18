import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { PermisosUsuario, PerfilUsuario } from '@/hooks/usePermissions';
import type { Ubicacion } from '@/lib/ubicaciones';

export interface Categoria { id: string; nombre: string; descripcion: string | null; activo: boolean; }
export interface Producto { id: string; codigo_barras: string; sku: string; nombre: string; descripcion: string | null; id_categoria: string | null; precio_unitario: number | null; activo: boolean; }
export interface Stock { id_producto: string; id_ubicacion: string; cantidad: number; }
export type TipoMovimiento = 'entrada' | 'salida' | 'reposicion' | 'ajuste';
export interface Movimiento { id: string; id_producto: string; id_ubicacion: string; tipo: TipoMovimiento; cantidad: number; precio_unitario: number | null; precio_total: number | null; notas: string | null; realizado_por: string; fecha_movimiento: string; }
export interface Inventario { categorias: Categoria[]; productos: Producto[]; ubicaciones: Ubicacion[]; stock: Stock[]; movimientos: Movimiento[]; perfiles: Pick<PerfilUsuario, 'id' | 'nombre_completo'>[]; puedeVerMovimientos: boolean; }

// Separate reads preserve the existing RLS on each table, including profiles.
async function cargarInventario(userId: string): Promise<Inventario> {
  const permiso = await supabase.from('permisos_usuario').select('*').eq('id_usuario', userId).maybeSingle();
  if (permiso.error) throw permiso.error;
  const puedeVerMovimientos = (permiso.data as PermisosUsuario | null)?.puede_ver_movimientos === true;
  const [categorias, productos, ubicaciones, stock, movimientos, perfiles] = await Promise.all([
    supabase.from('categorias').select('*').order('nombre'),
    supabase.from('productos').select('*').order('nombre'),
    supabase.from('ubicaciones').select('*').eq('activo', true).order('nombre'),
    supabase.from('stock').select('*'),
    puedeVerMovimientos ? supabase.from('movimientos').select('*').order('fecha_movimiento', { ascending: false }) : Promise.resolve({ data: [], error: null }),
    puedeVerMovimientos ? supabase.from('perfiles_usuario').select('id,nombre_completo') : Promise.resolve({ data: [], error: null }),
  ]);
  for (const result of [categorias, productos, ubicaciones, stock, movimientos, perfiles]) if (result.error) throw result.error;
  return { categorias: categorias.data as Categoria[], productos: productos.data as Producto[], ubicaciones: ubicaciones.data as Ubicacion[], stock: stock.data as Stock[], movimientos: movimientos.data as Movimiento[], perfiles: perfiles.data as Inventario['perfiles'], puedeVerMovimientos };
}
export const inventarioQueryOptions = (userId: string) => queryOptions({ queryKey: ['inventario', userId], queryFn: () => cargarInventario(userId) });
export async function usuarioActual() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Inicia sesión para continuar.');
  return data.user;
}
export function permisoExplicito(permisos: PermisosUsuario | null | undefined, key: keyof Omit<PermisosUsuario, 'id_usuario'>) { return permisos?.[key] === true; }
export function stockProducto(stock: Stock[], id: string) { return stock.filter(s => s.id_producto === id).reduce((n, s) => n + s.cantidad, 0); }
export function productosEnUbicacion(stock: Stock[], id: string) { return new Set(stock.filter(s => s.id_ubicacion === id && s.cantidad > 0).map(s => s.id_producto)).size; }
export function productosStockBajo(productos: Producto[], stock: Stock[]) { return productos.filter(p => p.activo && stockProducto(stock, p.id) < 10).length; }
export interface FiltrosMovimiento { desde: string; hasta: string; tipo: string; producto: string; ubicacion: string; }
export function filtrarMovimientos(items: Movimiento[], f: FiltrosMovimiento) {
  const desde = f.desde ? new Date(`${f.desde}T00:00:00`).getTime() : -Infinity;
  const hasta = f.hasta ? new Date(`${f.hasta}T23:59:59.999`).getTime() : Infinity;
  return items.filter(m => {
    const fecha = new Date(m.fecha_movimiento).getTime();
    return fecha >= desde && fecha <= hasta && (!f.tipo || m.tipo === f.tipo) && (!f.producto || m.id_producto === f.producto) && (!f.ubicacion || m.id_ubicacion === f.ubicacion);
  });
}
export function validarCantidad(cantidad: number) { if (!Number.isInteger(cantidad) || cantidad <= 0) throw new Error('La cantidad debe ser un entero mayor que cero.'); }
export async function guardarCategoria(nombre: string, descripcion: string, id?: string) {
  if (!nombre.trim()) throw new Error('Introduce un nombre.');
  const valores = { nombre: nombre.trim(), descripcion: descripcion.trim() || null };
  const query = id ? supabase.from('categorias').update(valores).eq('id', id) : supabase.from('categorias').insert(valores);
  const { error } = await query.select('id').single(); if (error) throw error;
}
export async function comprobarUnicidad(campo: 'sku' | 'codigo_barras', valor: string, id?: string) {
  if (!valor.trim()) return true;
  let query = supabase.from('productos').select('id').eq(campo, valor.trim());
  if (id) query = query.neq('id', id);
  const { data, error } = await query.limit(1); if (error) throw error;
  return !data?.length;
}
export async function guardarProducto(datos: Omit<Producto, 'id' | 'activo'>, id?: string) {
  const user = await usuarioActual();
  if (!datos.nombre.trim() || !datos.sku.trim() || !datos.codigo_barras.trim()) throw new Error('Completa nombre, SKU y código de barras.');
  if (datos.precio_unitario !== null && (!Number.isFinite(datos.precio_unitario) || datos.precio_unitario < 0)) throw new Error('Introduce un precio válido.');
  const valores = { ...datos, nombre: datos.nombre.trim(), sku: datos.sku.trim(), codigo_barras: datos.codigo_barras.trim(), descripcion: datos.descripcion?.trim() || null };
  const query = id ? supabase.from('productos').update(valores).eq('id', id) : supabase.from('productos').insert({ ...valores, creado_por: user.id });
  const { error } = await query.select('id').single(); if (error) throw error;
}
export async function desactivarRegistro(tabla: 'categorias' | 'productos', id: string) { const { error } = await supabase.from(tabla).update({ activo: false }).eq('id', id).select('id').single(); if (error) throw error; }
export async function crearMovimiento(datos: { id_producto: string; id_ubicacion: string; tipo: TipoMovimiento; cantidad: number; precio_unitario: number | null; notas: string }) {
  validarCantidad(datos.cantidad);
  if (!datos.id_producto || !datos.id_ubicacion) throw new Error('Selecciona producto y ubicación.');
  const user = await usuarioActual();
  const { error } = await supabase.from('movimientos').insert({ ...datos, notas: datos.notas.trim() || null, realizado_por: user.id });
  if (error) throw error;
}
export function errorInventario(error: unknown) {
  const e = error as { code?: string; message?: string };
  if (e?.code === '23505') return 'Ya existe ese nombre, SKU o código de barras, incluso entre registros desactivados.';
  if (e?.code === '42P01' || e?.code === 'PGRST205') return 'Ejecuta primero el SQL completo de las fases 2B–2E para crear las tablas.';
  if (e?.code === '42501' || e?.code === 'PGRST116') return 'No tienes permiso para esta operación o el registro ya no está disponible.';
  return e?.message || 'No se pudo completar la operación. Inténtalo de nuevo.';
}
export const formatoPrecio = (n: number | null) => n === null ? '—' : new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
export const formatoFecha = (s: string) => new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(s));
export function filasExportacion(items: Movimiento[], data: Inventario) {
  return items.map(m => ({ Fecha: formatoFecha(m.fecha_movimiento), Producto: data.productos.find(p => p.id === m.id_producto)?.nombre ?? m.id_producto, Tipo: m.tipo, Cantidad: m.cantidad, Precio: m.precio_unitario, Total: m.precio_total, Ubicación: data.ubicaciones.find(u => u.id === m.id_ubicacion)?.nombre ?? m.id_ubicacion, Usuario: data.perfiles.find(p => p.id === m.realizado_por)?.nombre_completo ?? 'Usuario no disponible', Notas: m.notas ?? '' }));
}
export async function exportarMovimientos(formato: 'excel' | 'pdf', items: Movimiento[], data: Inventario) {
  const filas = filasExportacion(items, data);
  if (formato === 'excel') {
    const XLSX = await import('xlsx');
    const libro = XLSX.utils.book_new();
    const hoja = XLSX.utils.json_to_sheet(filas);
    // Force text cells for user-authored strings; never interpret them as formulas.
    XLSX.utils.book_append_sheet(libro, hoja, 'Movimientos'); XLSX.writeFile(libro, 'movimientos.xlsx');
  } else {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.text('Movimientos · Inventario Pintura - LM', 14, 15);
    autoTable(doc, { startY: 22, head: [['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Precio', 'Total', 'Ubicación', 'Usuario', 'Notas']], body: filas.map(f => Object.values(f).map(v => v === null ? '—' : String(v))), styles: { fontSize: 8, overflow: 'linebreak' } });
    doc.save('movimientos.pdf');
  }
}
