import { useState, type FormEvent } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Plus, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/layout/AppLayout';
import { pageHead } from '@/lib/meta';
import { useMyProfile } from '@/hooks/usePermissions';
import { inventarioQueryOptions, usuarioActual, permisoExplicito, crearMovimiento, filtrarMovimientos, exportarMovimientos, errorInventario, formatoFecha, formatoPrecio, type TipoMovimiento } from '@/lib/inventario';
import { CargandoInventario, ErrorInventario } from '@/components/inventario/EstadoInventario';
export const Route = createFileRoute('/_authenticated/movimientos')({
  head: () => pageHead('Movimientos', 'Entradas, salidas, reposiciones y ajustes de stock.'),
  loader: async ({ context }) => { const user = await usuarioActual(); await context.queryClient.ensureQueryData(inventarioQueryOptions(user.id)); return { userId: user.id }; },
  pendingComponent: CargandoInventario, errorComponent: ErrorInventario, component: Movimientos,
});
const tipos: Record<TipoMovimiento, string> = { entrada: 'Entrada', salida: 'Salida', reposicion: 'Reposición', ajuste: 'Ajuste' };
function Movimientos() {
  const { userId } = Route.useLoaderData(); const { data } = useSuspenseQuery(inventarioQueryOptions(userId)); const { permisos } = useMyProfile();
  const ver = permisoExplicito(permisos, 'puede_ver_movimientos') && data.puedeVerMovimientos;
  const crear = permisoExplicito(permisos, 'puede_crear_productos'); const exportar = ver && permisoExplicito(permisos, 'puede_exportar_movimientos');
  const client = useQueryClient(); const [abierto, setAbierto] = useState(false); const [error, setError] = useState('');
  const [desde, setDesde] = useState(''); const [hasta, setHasta] = useState(''); const [tipoFiltro, setTipoFiltro] = useState('todos'); const [productoFiltro, setProductoFiltro] = useState('todos'); const [ubicacionFiltro, setUbicacionFiltro] = useState('todos');
  const [producto, setProducto] = useState(''); const [ubicacion, setUbicacion] = useState(''); const [tipo, setTipo] = useState<TipoMovimiento>('entrada'); const [cantidad, setCantidad] = useState('1'); const [precio, setPrecio] = useState(''); const [notas, setNotas] = useState('');
  const invalido = !!desde && !!hasta && desde > hasta;
  const filtrados = invalido ? [] : filtrarMovimientos(data.movimientos, { desde, hasta, tipo: tipoFiltro === 'todos' ? '' : tipoFiltro, producto: productoFiltro === 'todos' ? '' : productoFiltro, ubicacion: ubicacionFiltro === 'todos' ? '' : ubicacionFiltro });
  const guardar = useMutation({ mutationFn: async () => {
    if (!crear) throw new Error('No tienes permiso para crear movimientos.');
    await crearMovimiento({ id_producto: producto, id_ubicacion: ubicacion, tipo, cantidad: Number(cantidad), precio_unitario: precio === '' ? null : Number(precio), notas });
  }, onSuccess: async () => { await client.invalidateQueries({ queryKey: ['inventario', userId] }); setAbierto(false); toast.success('Movimiento registrado y stock actualizado'); }, onError: e => setError(errorInventario(e)) });
  const descargar = useMutation({ mutationFn: async (formato: 'excel' | 'pdf') => { if (!exportar) throw new Error('No tienes permiso para exportar movimientos.'); await exportarMovimientos(formato, filtrados, data); }, onError: e => toast.error(errorInventario(e)) });
  const abrir = () => { setProducto(''); setUbicacion(''); setTipo('entrada'); setCantidad('1'); setPrecio(''); setNotas(''); setError(''); setAbierto(true); };
  const enviar = (e: FormEvent) => { e.preventDefault(); setError(''); guardar.mutate(); };
  const stockActual = data.stock.find(s => s.id_producto === producto && s.id_ubicacion === ubicacion)?.cantidad ?? 0;
  return <><PageHeader title="Movimientos" action={crear ? <Button onClick={abrir}><Plus className="h-4 w-4" />Nuevo movimiento</Button> : undefined} />
    {!ver ? <p className="text-sm text-muted-foreground">No tienes permiso para ver movimientos.</p> : <Card className="p-4"><div className="mb-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <div className="space-y-1"><Label htmlFor="mov-desde">Desde</Label><Input id="mov-desde" type="date" value={desde} onChange={e => setDesde(e.target.value)} /></div><div className="space-y-1"><Label htmlFor="mov-hasta">Hasta</Label><Input id="mov-hasta" type="date" value={hasta} onChange={e => setHasta(e.target.value)} /></div>
      <div className="space-y-1"><Label htmlFor="mov-filtro-tipo">Tipo</Label><Select value={tipoFiltro} onValueChange={setTipoFiltro}><SelectTrigger id="mov-filtro-tipo"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos los tipos</SelectItem>{(Object.keys(tipos) as TipoMovimiento[]).map(t => <SelectItem key={t} value={t}>{tipos[t]}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1"><Label htmlFor="mov-filtro-producto">Producto</Label><Select value={productoFiltro} onValueChange={setProductoFiltro}><SelectTrigger id="mov-filtro-producto"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos los productos</SelectItem>{data.productos.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1"><Label htmlFor="mov-filtro-ubicacion">Ubicación</Label><Select value={ubicacionFiltro} onValueChange={setUbicacionFiltro}><SelectTrigger id="mov-filtro-ubicacion"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todas las ubicaciones</SelectItem>{data.ubicaciones.map(u => <SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>)}{Array.from(new Set(data.movimientos.map(m => m.id_ubicacion))).filter(id => !data.ubicaciones.some(u => u.id === id)).map(id => <SelectItem key={id} value={id}>Ubicación inactiva · {id.slice(0, 8)}</SelectItem>)}</SelectContent></Select></div>
    </div>{invalido && <p role="alert" className="mb-3 text-sm text-destructive">La fecha inicial debe ser anterior o igual a la final.</p>}
    {exportar && <div className="mb-4 flex flex-wrap justify-end gap-2"><Button variant="outline" disabled={descargar.isPending || !filtrados.length || invalido} onClick={() => descargar.mutate('excel')}><FileSpreadsheet className="h-4 w-4" />Exportar Excel</Button><Button variant="outline" disabled={descargar.isPending || !filtrados.length || invalido} onClick={() => descargar.mutate('pdf')}><FileText className="h-4 w-4" />Exportar PDF</Button></div>}
    <Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Producto</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Cantidad</TableHead><TableHead className="text-right">Precio</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Ubicación</TableHead><TableHead>Usuario</TableHead><TableHead>Notas</TableHead></TableRow></TableHeader><TableBody>{filtrados.map(m => <TableRow key={m.id}><TableCell className="whitespace-nowrap">{formatoFecha(m.fecha_movimiento)}</TableCell><TableCell>{data.productos.find(p => p.id === m.id_producto)?.nombre ?? 'Producto no disponible'}</TableCell><TableCell>{tipos[m.tipo]}</TableCell><TableCell className="text-right">{m.cantidad}</TableCell><TableCell className="text-right">{formatoPrecio(m.precio_unitario)}</TableCell><TableCell className="text-right">{formatoPrecio(m.precio_total)}</TableCell><TableCell>{data.ubicaciones.find(u => u.id === m.id_ubicacion)?.nombre ?? `Ubicación inactiva · ${m.id_ubicacion.slice(0, 8)}`}</TableCell><TableCell>{data.perfiles.find(p => p.id === m.realizado_por)?.nombre_completo ?? 'Usuario no disponible'}</TableCell><TableCell className="max-w-64 break-words">{m.notas ?? '—'}</TableCell></TableRow>)}{!filtrados.length && <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">Sin movimientos para estos filtros.</TableCell></TableRow>}</TableBody></Table><p className="mt-4 text-sm text-muted-foreground">{filtrados.length} movimientos</p></Card>}
    <Dialog open={abierto} onOpenChange={o => { if (!guardar.isPending) setAbierto(o); }}><DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto"><DialogHeader><DialogTitle>Nuevo movimiento</DialogTitle><DialogDescription>Movimiento de inventario</DialogDescription></DialogHeader><form onSubmit={enviar} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="nuevo-mov-producto">Producto</Label><Select value={producto} disabled={guardar.isPending} onValueChange={v => { setProducto(v); const p = data.productos.find(p => p.id === v); setPrecio(p?.precio_unitario == null ? '' : String(p.precio_unitario)); }}><SelectTrigger id="nuevo-mov-producto"><SelectValue placeholder="Selecciona un producto" /></SelectTrigger><SelectContent>{data.productos.filter(p => p.activo).map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label htmlFor="nuevo-mov-ubicacion">Ubicación</Label><Select value={ubicacion} disabled={guardar.isPending} onValueChange={setUbicacion}><SelectTrigger id="nuevo-mov-ubicacion"><SelectValue placeholder="Selecciona una ubicación" /></SelectTrigger><SelectContent>{data.ubicaciones.map(u => <SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label htmlFor="nuevo-mov-tipo">Tipo</Label><Select value={tipo} disabled={guardar.isPending} onValueChange={v => { if (v === 'entrada' || v === 'salida' || v === 'reposicion' || v === 'ajuste') setTipo(v); }}><SelectTrigger id="nuevo-mov-tipo"><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(tipos) as TipoMovimiento[]).map(t => <SelectItem key={t} value={t}>{tipos[t]}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label htmlFor="nuevo-mov-cantidad">{tipo === 'reposicion' || tipo === 'ajuste' ? 'Cantidad final en stock' : 'Cantidad'}</Label><Input id="nuevo-mov-cantidad" type="number" min="1" step="1" required value={cantidad} onChange={e => setCantidad(e.target.value)} disabled={guardar.isPending} />{producto && ubicacion && <p className="text-xs text-muted-foreground">Stock actual: {stockActual}</p>}</div>
      <div className="space-y-2"><Label htmlFor="nuevo-mov-precio">Precio unitario</Label><Input id="nuevo-mov-precio" type="number" min="0" step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} disabled={guardar.isPending} /></div>
      <div className="space-y-2"><Label htmlFor="nuevo-mov-notas">Notas (opcional)</Label><Textarea id="nuevo-mov-notas" value={notas} onChange={e => setNotas(e.target.value)} disabled={guardar.isPending} /></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={guardar.isPending} onClick={() => setAbierto(false)}>Cancelar</Button><Button type="submit" disabled={guardar.isPending || !crear || !producto || !ubicacion || !Number.isInteger(Number(cantidad)) || Number(cantidad) <= 0}>{guardar.isPending ? 'Guardando…' : 'Guardar'}</Button></div></form></DialogContent></Dialog>
  </>;
}
