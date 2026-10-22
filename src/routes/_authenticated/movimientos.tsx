import { useState, useEffect, type FormEvent } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Plus, Search, Filter, Download, ScanBarcode, Package, ArrowDownToLine, ArrowUpFromLine, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/AppLayout';
import { pageHead } from '@/lib/meta';
import { useMyProfile } from '@/hooks/usePermissions';
import { 
  inventarioQueryOptions, usuarioActual, permisoExplicito, 
  crearMovimientoConStock, obtenerStockActual,
  errorInventario, formatoPrecio, formatoFecha, 
  filtrarMovimientos, exportarMovimientos,
  type Movimiento, type FiltrosMovimiento 
} from '@/lib/inventario';
import { CargandoInventario, ErrorInventario } from '@/components/inventario/EstadoInventario';

export const Route = createFileRoute('/_authenticated/movimientos')({
  head: () => pageHead('Movimientos', 'Registro de entradas y salidas de stock.'),
  loader: async ({ context }) => { 
    const user = await usuarioActual(); 
    await context.queryClient.ensureQueryData(inventarioQueryOptions(user.id)); 
    return { userId: user.id }; 
  },
  pendingComponent: CargandoInventario, 
  errorComponent: ErrorInventario, 
  component: MovimientosPage,
});

// Configuración visual de tipos de movimiento
const CONFIG_TIPOS = {
  entrada: { 
    label: 'Entrada', 
    icon: ArrowDownToLine, 
    color: 'bg-green-100 text-green-800 border-green-200',
    colorBtn: 'bg-green-600 hover:bg-green-700',
    descripcion: 'Mercancía recibida'
  },
  salida: { 
    label: 'Salida', 
    icon: ArrowUpFromLine, 
    color: 'bg-red-100 text-red-800 border-red-200',
    colorBtn: 'bg-red-600 hover:bg-red-700',
    descripcion: 'Venta o consumo'
  },
  reposicion: { 
    label: 'Reposición', 
    icon: RotateCcw, 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    colorBtn: 'bg-yellow-600 hover:bg-yellow-700',
    descripcion: 'Reponer desde reserva'
  },
  ajuste: { 
    label: 'Ajuste', 
    icon: SlidersHorizontal, 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    colorBtn: 'bg-blue-600 hover:bg-blue-700',
    descripcion: 'Corrección de inventario'
  },
} as const;

function MovimientosPage() {
  const { userId } = Route.useLoaderData();
  const { data } = useSuspenseQuery(inventarioQueryOptions(userId));
  const { permisos } = useMyProfile();
  const puedeCrear = permisoExplicito(permisos, 'puede_crear_productos');
  const puedeVer = data.puedeVerMovimientos;
  const client = useQueryClient();

  const [abierto, setAbierto] = useState(false);
  const [escaneando, setEscaneando] = useState(false);
  const [productoId, setProductoId] = useState('');
  const [ubicacionPadreId, setUbicacionPadreId] = useState('');
  const [ubicacionId, setUbicacionId] = useState('');
  const [tipo, setTipo] = useState<'entrada' | 'salida' | 'reposicion' | 'ajuste'>('entrada');
  const [cantidad, setCantidad] = useState('');
  const [precio, setPrecio] = useState('');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');
  const [stockActual, setStockActual] = useState<number | null>(null);

  // Filtros
  const [filtros, setFiltros] = useState<FiltrosMovimiento>({
    desde: new Date().toISOString().split('T')[0],
    hasta: new Date().toISOString().split('T')[0],
    tipo: '',
    producto: '',
    ubicacion: '',
  });

  const movimientosFiltrados = puedeVer ? filtrarMovimientos(data.movimientos, filtros) : [];

  const crear = useMutation({
    mutationFn: async () => {
      if (!puedeCrear) throw new Error('No tienes permiso para crear movimientos.');
      if (!productoId) throw new Error('Selecciona un producto.');
      if (!ubicacionId) throw new Error('Selecciona una ubicación.');
      const cant = Number(cantidad);
      if (!cant || cant <= 0) throw new Error('Introduce una cantidad válida.');

      await crearMovimientoConStock({
        id_producto: productoId,
        id_ubicacion: ubicacionId,
        tipo,
        cantidad: cant,
        precio_unitario: precio === '' ? null : Number(precio),
        notas,
      });
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['inventario', userId] });
      setAbierto(false);
      resetearFormulario();
      toast.success('Movimiento registrado y stock actualizado');
    },
    onError: (e) => setError(errorInventario(e)),
  });

  function resetearFormulario() {
    setProductoId('');
    setUbicacionPadreId('');
    setUbicacionId('');
    setTipo('entrada');
    setCantidad('');
    setPrecio('');
    setNotas('');
    setError('');
    setStockActual(null);
  }

  async function abrirModal() {
    resetearFormulario();
    setAbierto(true);
  }

  // Cuando cambia la ubicación, cargar stock actual
  useEffect(() => {
    if (productoId && ubicacionId) {
      obtenerStockActual(productoId, ubicacionId).then(setStockActual);
    } else {
      setStockActual(null);
    }
  }, [productoId, ubicacionId]);

  function seleccionarProductoDesdeEscaneo(codigo: string) {
    const producto = data.productos.find(p => p.codigo_barras === codigo || p.sku === codigo);
    if (producto) {
      setProductoId(producto.id);
      setEscaneando(false);
      toast.success(`Producto seleccionado: ${producto.nombre}`);
    } else {
      toast.error('Producto no encontrado con ese código');
    }
  }

  const productoSeleccionado = data.productos.find(p => p.id === productoId);
  const ubicacionSeleccionada = data.ubicaciones.find(u => u.id === ubicacionId);

  return (
    <>
      <PageHeader 
        title="Movimientos" 
        action={puedeCrear ? (
          <Button onClick={abrirModal}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo movimiento
          </Button>
        ) : undefined} 
      />

      {/* FILTROS */}
      {puedeVer && (
        <Card className="p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Filtros</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <Label className="text-xs">Desde</Label>
              <Input type="date" value={filtros.desde} onChange={e => setFiltros({ ...filtros, desde: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Hasta</Label>
              <Input type="date" value={filtros.hasta} onChange={e => setFiltros({ ...filtros, hasta: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={filtros.tipo} onValueChange={v => setFiltros({ ...filtros, tipo: v })}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los tipos</SelectItem>
                  {Object.entries(CONFIG_TIPOS).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Producto</Label>
              <Select value={filtros.producto} onValueChange={v => setFiltros({ ...filtros, producto: v })}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent className="max-h-80">
                  <SelectItem value="">Todos los productos</SelectItem>
                  {data.productos.filter(p => p.activo).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Ubicación</Label>
              <Select value={filtros.ubicacion} onValueChange={v => setFiltros({ ...filtros, ubicacion: v })}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent className="max-h-80">
                  <SelectItem value="">Todas las ubicaciones</SelectItem>
                  {data.ubicaciones.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4 pt-3 border-t">
            <span className="text-sm text-muted-foreground">
              {movimientosFiltrados.length} movimiento{movimientosFiltrados.length !== 1 ? 's' : ''}
            </span>
            {movimientosFiltrados.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportarMovimientos('excel', movimientosFiltrados, data)}>
                  <Download className="h-4 w-4 mr-1" /> Excel
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportarMovimientos('pdf', movimientosFiltrados, data)}>
                  <Download className="h-4 w-4 mr-1" /> PDF
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* TABLA DE MOVIMIENTOS */}
      <Card className="p-4">
        {!puedeVer ? (
          <div className="text-center py-10 text-muted-foreground">
            No tienes permisos para ver el historial de movimientos.
          </div>
        ) : movimientosFiltrados.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No hay movimientos con los filtros actuales.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientosFiltrados.map((m: Movimiento) => {
                  const cfg = CONFIG_TIPOS[m.tipo];
                  const Icon = cfg.icon;
                  const producto = data.productos.find(p => p.id === m.id_producto);
                  const ubicacion = data.ubicaciones.find(u => u.id === m.id_ubicacion);
                  const usuario = data.perfiles.find(p => p.id === m.realizado_por);
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs whitespace-nowrap">{formatoFecha(m.fecha_movimiento)}</TableCell>
                      <TableCell>
                        <Badge className={`${cfg.color} border flex items-center gap-1`}>
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={producto?.nombre}>
                        {producto?.nombre || '—'}
                      </TableCell>
                      <TableCell className="text-xs">{ubicacion?.nombre || '—'}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        <span className={m.tipo === 'salida' ? 'text-red-600' : 'text-green-600'}>
                          {m.tipo === 'salida' ? '-' : '+'}{m.cantidad}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs">{formatoPrecio(m.precio_unitario)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={m.notas || ''}>
                        {m.notas || '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* MODAL NUEVO MOVIMIENTO */}
      <Dialog open={abierto} onOpenChange={o => { if (!o && !crear.isPending) { setAbierto(false); resetearFormulario(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Nuevo movimiento de stock
            </DialogTitle>
            <DialogDescription>
              Registra una entrada, salida, reposición o ajuste. El stock se actualizará automáticamente.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e: FormEvent) => { e.preventDefault(); crear.mutate(); }} className="space-y-4">
            
            {/* TIPO DE MOVIMIENTO - Selector visual */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">Tipo de movimiento</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(CONFIG_TIPOS).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  const activo = tipo === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTipo(key as any)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        activo 
                          ? `${cfg.color} border-current ring-2 ring-offset-1` 
                          : 'bg-background border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-5 w-5 mb-1" />
                      <div className="font-semibold text-sm">{cfg.label}</div>
                      <div className="text-xs opacity-75">{cfg.descripcion}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PRODUCTO - Con escaneo */}
            <div className="space-y-2">
              <Label htmlFor="mov-producto">Producto *</Label>
              <div className="flex gap-2">
                <Select value={productoId} onValueChange={setProductoId} disabled={crear.isPending}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Buscar producto..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {data.productos.filter(p => p.activo).map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{p.nombre}</span>
                          <span className="text-xs text-muted-foreground">SKU: {p.sku} | {p.codigo_barras}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={() => setEscaneando(true)} disabled={crear.isPending}>
                  <ScanBarcode className="h-4 w-4" />
                </Button>
              </div>
              {productoSeleccionado && (
                <p className="text-xs text-muted-foreground">
                  Seleccionado: <strong>{productoSeleccionado.nombre}</strong>
                  {productoSeleccionado.precio_unitario && ` · ${formatoPrecio(productoSeleccionado.precio_unitario)}`}
                </p>
              )}
            </div>

            {/* UBICACIÓN - Sistema de 2 selects */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="mov-zona">1. Zona *</Label>
                <Select 
                  value={ubicacionPadreId} 
                  onValueChange={(v) => { setUbicacionPadreId(v); setUbicacionId(v); }}
                  disabled={crear.isPending}
                >
                  <SelectTrigger><SelectValue placeholder="Elige pasillo o reserva..." /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel className="text-xs font-bold text-blue-700">🛣️ PASILLOS</SelectLabel>
                      {data.ubicaciones.filter((u: any) => u.tipo === 'pasillo').map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>🛣️ {p.nombre}</SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-xs font-bold text-gray-700"> RESERVA</SelectLabel>
                      {data.ubicaciones.filter((u: any) => u.tipo === 'reserva').map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>🏭 {r.nombre}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="mov-ubicacion">2. Ubicación específica *</Label>
                <Select 
                  value={ubicacionId} 
                  onValueChange={setUbicacionId}
                  disabled={!ubicacionPadreId || crear.isPending}
                >
                  <SelectTrigger><SelectValue placeholder="Elige ubicación..." /></SelectTrigger>
                  <SelectContent>
                    {ubicacionPadreId && (
                      <>
                        <SelectItem value={ubicacionPadreId}>
                          📍 {data.ubicaciones.find((u: any) => u.id === ubicacionPadreId)?.nombre} (General)
                        </SelectItem>
                        {data.ubicaciones
                          .filter((h: any) => h.id_ubicacion_padre === ubicacionPadreId)
                          .map((h: any) => (
                            <SelectItem key={h.id} value={h.id}>
                              <span className="pl-2">
                                {h.tipo === 'armario' ? '🗄️' : h.tipo === 'alto' ? '📦' : h.tipo === 'cross' ? '🔄' : h.tipo === 'caja' ? '💳' : '📍'}
                                {' '}{h.nombre} ({h.tipo})
                              </span>
                            </SelectItem>
                          ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* STOCK ACTUAL */}
            {stockActual !== null && ubicacionSeleccionada && productoSeleccionado && (
              <div className="bg-muted/50 border rounded-md p-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Stock actual de <strong>{productoSeleccionado.nombre}</strong> en <strong>{ubicacionSeleccionada.nombre}</strong>:
                </span>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {stockActual} uds
                </Badge>
              </div>
            )}

            {/* CANTIDAD Y PRECIO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="mov-cantidad">Cantidad *</Label>
                <Input 
                  id="mov-cantidad"
                  type="number" 
                  min="1" 
                  step="1"
                  value={cantidad} 
                  onChange={e => setCantidad(e.target.value)} 
                  required 
                  disabled={crear.isPending} 
                  placeholder="Ej: 10"
                />
              </div>
              <div>
                <Label htmlFor="mov-precio">Precio unitario (opcional)</Label>
                <Input 
                  id="mov-precio"
                  type="number" 
                  min="0" 
                  step="0.01"
                  value={precio} 
                  onChange={e => setPrecio(e.target.value)} 
                  disabled={crear.isPending} 
                  placeholder="Ej: 3.29"
                />
              </div>
            </div>

            {/* NOTAS */}
            <div>
              <Label htmlFor="mov-notas">Notas (opcional)</Label>
              <Textarea 
                id="mov-notas"
                value={notas} 
                onChange={e => setNotas(e.target.value)} 
                disabled={crear.isPending} 
                placeholder="Ej: Albarán #1234, proveedor XYZ..."
                rows={2}
              />
            </div>

            {error && <p role="alert" className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" disabled={crear.isPending} onClick={() => { setAbierto(false); resetearFormulario(); }}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={crear.isPending || !productoId || !ubicacionId || !cantidad}
                className={CONFIG_TIPOS[tipo].colorBtn}
              >
                {crear.isPending ? 'Registrando...' : `Registrar ${CONFIG_TIPOS[tipo].label}`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL ESCÁNER */}
      <Dialog open={escaneando} onOpenChange={setEscaneando}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escanear código de barras</DialogTitle>
            <DialogDescription>Apunta al código de barras del producto</DialogDescription>
          </DialogHeader>
          <Input 
            placeholder="Escribe o escanea el código..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                seleccionarProductoDesdeEscaneo((e.target as HTMLInputElement).value);
              }
            }}
          />
          <p className="text-xs text-muted-foreground">
            También puedes escribir el código manualmente y pulsar Enter.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}