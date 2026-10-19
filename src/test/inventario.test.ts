import { describe, expect, it, vi } from 'vitest';
import { filtrarMovimientos, filasExportacion, movimientosHoy, actividadReciente, productosStockBajo, productosEnUbicacion, validarCantidad, permisoExplicito, type Producto, type Movimiento, type Inventario } from '@/lib/inventario';
import { filtrarUbicaciones, puedeGestionarUbicaciones, type Ubicacion } from '@/lib/ubicaciones';
import type { PermisosUsuario } from '@/hooks/usePermissions';
vi.mock('@/lib/supabase', () => ({ supabase: {} }));
const producto = (id: string, activo = true): Producto => ({ id, activo, codigo_barras: id, sku: id, nombre: id, descripcion: null, id_categoria: null, precio_unitario: 2 });
const movimiento = (id: string, fecha: string, extra: Partial<Movimiento> = {}): Movimiento => ({ id, fecha_movimiento: fecha, id_producto: 'p1', id_ubicacion: 'u1', tipo: 'entrada', cantidad: 3, precio_unitario: 2, precio_total: 6, notas: '', realizado_por: 'user1', ...extra });
const permisos = (extra: Partial<PermisosUsuario> = {}): PermisosUsuario => ({ id_usuario: 'u', puede_crear_productos: false, puede_editar_productos: false, puede_eliminar_productos: false, puede_crear_ubicaciones: false, puede_editar_ubicaciones: false, puede_ver_movimientos: false, puede_exportar_movimientos: false, puede_gestionar_usuarios: false, ...extra });
describe('Reglas del inventario', () => {
  it('creación de ubicaciones requiere su permiso explícito', () => { expect(puedeGestionarUbicaciones(permisos({ puede_crear_ubicaciones: true }))).toBe(true); expect(puedeGestionarUbicaciones(permisos({ puede_editar_ubicaciones: true }))).toBe(false); expect(puedeGestionarUbicaciones(null)).toBe(false); });
  it.each(['puede_crear_productos', 'puede_editar_productos', 'puede_editar_ubicaciones', 'puede_ver_movimientos', 'puede_exportar_movimientos'] as const)('respeta el permiso %s sin sustituciones', key => { expect(permisoExplicito(permisos({ [key]: true }), key)).toBe(true); expect(permisoExplicito(permisos(), key)).toBe(false); });
  it('agrupa pasillos por separado de altos y armarios y excluye desactivadas', () => {
    const items = [{ id: '1', tipo: 'pasillo', activo: true }, { id: '2', tipo: 'alto', activo: true }, { id: '3', tipo: 'armario', activo: true }, { id: '4', tipo: 'pasillo', activo: false }] as Ubicacion[];
    expect(filtrarUbicaciones(items, 'pasillos').map(u => u.id)).toEqual(['1']); expect(filtrarUbicaciones(items, 'altos').map(u => u.id)).toEqual(['2', '3']);
  });
  it('stock bajo significa total menor que 10, excluye inactivos e incluye productos sin stock', () => {
    expect(productosStockBajo([producto('9'), producto('10'), producto('sin-stock'), producto('inactivo', false)], [{ id_producto: '9', id_ubicacion: 'u', cantidad: 9 }, { id_producto: '10', id_ubicacion: 'u', cantidad: 6 }, { id_producto: '10', id_ubicacion: 'v', cantidad: 4 }])).toBe(2);
  });
  it('contador de ubicación cuenta productos distintos con stock positivo', () => { expect(productosEnUbicacion([{ id_producto: 'p', id_ubicacion: 'u', cantidad: 3 }, { id_producto: 'q', id_ubicacion: 'u', cantidad: 0 }, { id_producto: 'q', id_ubicacion: 'v', cantidad: 5 }], 'u')).toBe(1); });
  it('cantidades deben ser enteros positivos', () => { expect(() => validarCantidad(1)).not.toThrow(); for (const n of [0, -1, 1.5, NaN]) expect(() => validarCantidad(n)).toThrow(); });
  it('filtros combinan fechas inclusivas, producto, ubicación y tipo', () => {
    const items = [movimiento('incluido', '2026-10-18T23:59:59', { tipo: 'salida' }), movimiento('otro-dia', '2026-10-19T00:00:00', { tipo: 'salida' }), movimiento('otro-tipo', '2026-10-18T10:00:00'), movimiento('otro-producto', '2026-10-18T10:00:00', { tipo: 'salida', id_producto: 'p2' }), movimiento('otra-ubicacion', '2026-10-18T10:00:00', { tipo: 'salida', id_ubicacion: 'u2' })];
    expect(filtrarMovimientos(items, { desde: '2026-10-18', hasta: '2026-10-18', tipo: 'salida', producto: 'p1', ubicacion: 'u1' }).map(m => m.id)).toEqual(['incluido']);
  });
  it('la exportación incluye solo las filas filtradas con precios y notas reales', () => {
    const items = [movimiento('uno', '2026-10-18T12:00:00', { notas: 'Nota real' }), movimiento('dos', '2026-10-18T12:00:00', { tipo: 'salida' })];
    const data: Inventario = { categorias: [], productos: [producto('p1')], ubicaciones: [], stock: [], movimientos: items, perfiles: [], puedeVerMovimientos: true };
    const filtrados = filtrarMovimientos(items, { desde: '', hasta: '', tipo: 'entrada', producto: '', ubicacion: '' });
    expect(filasExportacion(filtrados, data)).toHaveLength(1); expect(filasExportacion(filtrados, data)[0]).toMatchObject({ Cantidad: 3, Precio: 2, Total: 6, Notas: 'Nota real' });
  });
});

describe('Dashboard real', () => {
 it('cuenta solo movimientos del día local actual', () => { expect(movimientosHoy([movimiento('hoy','2026-10-19T23:59:59'),movimiento('ayer','2026-10-18T23:59:59'),movimiento('mañana','2026-10-20T00:00:00')],new Date('2026-10-19T12:00:00'))).toBe(1); });
 it('actividad reciente son los últimos 10 ordenados por fecha', () => { const items=Array.from({length:12},(_,i)=>movimiento(String(i),`2026-10-${String(i+1).padStart(2,'0')}T12:00:00`)); expect(actividadReciente(items).map(m=>m.id)).toEqual(['11','10','9','8','7','6','5','4','3','2']); });
});
