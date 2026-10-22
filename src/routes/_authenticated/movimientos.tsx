import { useState, useEffect, type FormEvent } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Plus, Filter, Download, ScanBarcode, Package, ArrowDownToLine, ArrowRightLeft, SlidersHorizontal, AlertCircle, MapPin, LayoutGrid, History, Trash2, Info } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PageHeader } from '@/components/layout/AppLayout';
import { pageHead } from '@/lib/meta';
import { useMyProfile } from '@/hooks/usePermissions';
import { 
  inventarioQueryOptions, usuarioActual, permisoExplicito, 
  crearMovimientoConStock, crearTraslado, obtenerStockActual, obtenerUbicacionesConStock,
  limpiarStockLineales,
  errorInventario, formatoPrecio, formatoFecha, 
  filtrarMovimientos, exportarMovimientos,
  type Movimiento, type FiltrosMovimiento 
} from '@/lib/inventario';
import { CargandoInventario, ErrorInventario } from '@/components/inventario/EstadoInventario';

export const Route = createFileRoute('/_authenticated/movimientos')({
  head: () => pageHead('Movimientos', 'Gestión de stock en armarios y ubicaciones.'),
  loader: async ({ context }) => { 
    const user = await usuarioActual(); 
    await context.queryClient.ensureQueryData(inventarioQueryOptions(user.id)); 
    return { userId: user.id }; 
  },
  pendingComponent: CargandoInventario, 
  errorComponent: ErrorInventario, 
  component: MovimientosPage,
});

const CONFIG_TIPOS = {
  entrada: { 
    label: 'Entrada', 
    icon: ArrowDownToLine, 
    color: 'bg-green-100 text-green-800 border-green-200',
    colorBtn: 'bg-green-600 hover:bg-green-700',
    descripcion: 'Mercancía nueva del proveedor',
    emoji: '📥'
  },
  traslado: { 
    label: 'Traslado', 
    icon: ArrowRightLeft, 
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    colorBtn: 'bg-purple-600 hover:bg-purple-700',
    descripcion: 'Mover entre ubicaciones',
    emoji: '🔄'
  },
  ajuste: { 
    label: 'Ajuste', 
    icon: SlidersHorizontal, 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    colorBtn: 'bg-blue-600 hover:bg-blue-700',
    descripcion: 'Corrección de inventario',
    emoji: '🔧'
  },
} as const;

type TipoMovimientoForm = 'entrada' | 'traslado' | 'ajuste';
type VistaActual = 'stock' | 'historial';

function MovimientosPage() {
  const { userId } = Route.useLoaderData();
  const { data } = useSuspenseQuery(inventarioQueryOptions(userId));
  const { permisos } = useMyProfile();
  const puedeCrear = permisoExplicito(permisos, 'puede_crear_productos');
  const puedeVer = data.puedeVerMovimientos;
  const client = useQueryClient();

  const [vista, setVista] = useState<VistaActual>('stock');
  const [abierto, setAbierto] = useState(false);
  const [escaneando, setEscaneando] = useState(false);
  const [productoId, setProductoId] = useState('');
  const [tipo, setTipo] = useState<TipoMovimientoForm>('entrada');
  
  const [ubicacionPadreId, setUbicacionPadreId] = useState('');
  const [ubicacionId, setUbicacionId] = useState('');
  
  const [ubicacionOrigenPadreId, setUbicacionOrigenPadreId] = useState('');
  const [ubicacionOrigenId, setUbicacionOrigenId] = useState('');
  const [ubicacionDestinoPadreId, setUbicacionDestinoPadreId] = useState('');
  const [ubicacionDestinoId, setUbicacionDestinoId] = useState('');
  
  const [cantidad, setCantidad] = useState('');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');
  const [stockActual, setStockActual] = useState<number | null>(null);
  const [ubicacionesConStock, setUbicacionesConStock] = useState<{ id_ubicacion: string; cantidad: number; nombre_ubicacion?: string }[]>([]);

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
      const cant = Number(cantidad);
      if (!cant || cant <= 0) throw new Error('Introduce una cantidad válida.');

      if (tipo === 'traslado') {
        if (!ubicacionOrigenId) throw new Error('Selecciona la ubicación de origen.');
        if (!ubicacionDestinoId) throw new Error('Selecciona la ubicación de destino.');
        await crearTraslado({
          id_producto: productoId,
          id_ubicacion_origen: ubicacionOrigenId,
          id_ubicacion_destino: ubicacionDestinoId,
          cantidad: cant,
          notas,
        });
      } else {
        if (!ubicacionId) throw new Error('Selecciona una ubicación.');
        await crearMovimientoConStock({
          id_producto: productoId,
          id_ubicacion: ubicacionId,
          tipo: tipo as any,
          cantidad: cant,
          notas,
        });
      }
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['inventario', userId] });
      setAbierto(false);
      resetearFormulario();
      toast.success('Movimiento registrado y stock actualizado');
    },
    onError: (e) => setError(errorInventario(e)),
  });

  const limpiarLineales = useMutation({
    mutationFn: async () => {
      if (!puedeCrear) throw new Error('No tienes permiso para limpiar stock.');
      return await limpiarStockLineales();
    },
    onSuccess: async (resultado) => {
      await client.invalidateQueries({ queryKey: ['inventario', userId] });
      toast.success(`✅ Stock de lineales limpiado: ${resultado.productosAfectados} productos reseteados a 0`);
    },
    onError: (e) => {
      toast.error(errorInventario(e));
    },
  });

  function resetearFormulario() {
    setProductoId('');
    setUbicacionPadreId('');
    setUbicacionId('');
    setUbicacionOrigenPadreId('');
    setUbicacionOrigenId('');
    setUbicacionDestinoPadreId('');
    setUbicacionDestinoId('');
    setTipo('entrada');
    setCantidad('');
    setNotas('');
    setError('');
    setStockActual(null);
    setUbicacionesConStock([]);
  }

  async function abrirModal() {
    resetearFormulario();
    setAbierto(true);
  }

  useEffect(() => {
    if (productoId) {
      obtenerUbicacionesConStock(productoId).then((ubicaciones) => {
        const ubicacionesConNombres = ubicaciones.map(u => ({
          ...u,
          nombre_ubicacion: data.ubicaciones.find((loc: any) => loc.id === u.id_ubicacion)?.nombre || 'Desconocida'
        }));
        setUbicacionesConStock(ubicacionesConNombres);
        
        if (tipo === 'ajuste' && ubicacionesConNombres.length > 0) {
          const primeraUbicacion = ubicacionesConNombres[0];
          setUbicacionId(primeraUbicacion.id_ubicacion);
          const ubicacionCompleta = data.ubicaciones.find((u: any) => u.id === primeraUbicacion.id_ubicacion);
          if (ubicacionCompleta?.id_ubicacion_padre) {
            setUbicacionPadreId(ubicacionCompleta.id_ubicacion_padre);
          } else {
            setUbicacionPadreId(primeraUbicacion.id_ubicacion);
          }
          obtenerStockActual(productoId, primeraUbicacion.id_ubicacion).then(setStockActual);
        }
      });
    } else {
      setUbicacionesConStock([]);
    }
  }, [productoId, tipo, data.ubicaciones]);

  useEffect(() => {
    if (productoId && ubicacionId && tipo !== 'traslado') {
      obtenerStockActual(productoId, ubicacionId).then(setStockActual);
    } else if (productoId && ubicacionOrigenId && tipo === 'traslado') {
      obtenerStockActual(productoId, ubicacionOrigenId).then(setStockActual);
    } else {
      setStockActual(null);
    }
  }, [productoId, ubicacionId, ubicacionOrigenId, tipo]);

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

  function renderSelectoresUbicacion(
    labelZona: string,
    labelUbicacion: string,
    padreId: string,
    setPadreId: (v: string) => void,
    ubicacionIdVal: string,
    setUbicacionIdVal: (v: string) => void,
    disabled: boolean = false
  ) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-medium">1. {labelZona} *</Label>
          <Select 
            value={padreId} 
            onValueChange={(v) => { setPadreId(v); setUbicacionIdVal(v); }}
            disabled={disabled}
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
                <SelectLabel className="text-xs font-bold text-gray-700">🏭 RESERVA</SelectLabel>
                {data.ubicaciones.filter((u: any) => u.tipo === 'reserva').map((r: any) => (
                  <SelectItem key={r.id} value={r.id}> {r.nombre}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-medium">2. {labelUbicacion} *</Label>
          <Select 
            value={ubicacionIdVal} 
            onValueChange={setUbicacionIdVal}
            disabled={!padreId || disabled}
          >
            <SelectTrigger><SelectValue placeholder="Elige ubicación..." /></SelectTrigger>
            <SelectContent>
              {padreId && (
                <>
                  <SelectItem value={padreId}>
                    📍 {data.ubicaciones.find((u: any) => u.id === padreId)?.nombre} (General/Lineal)
                  </SelectItem>
                  {data.ubicaciones
                    .filter((h: any) => h.id_ubicacion_padre === padreId)
                    .map((h: any) => (
                      <SelectItem key={h.id} value={h.id}>
                        <span className="pl-2">
                          {h.tipo === 'armario' ? '🗄️' : h.tipo === 'alto' ? '' : h.tipo === 'cross' ? '🔄' : h.tipo === 'caja' ? '💳' : '📍'}
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
    );
  }

  function calcularStockPorUbicacion() {
    const stockMap = new Map<string, { cantidad: number; ultimoMovimiento?: Movimiento }>();
    
    data.ubicaciones.forEach(u => {
      stockMap.set(u.id, { cantidad: 0 });
    });
    
    data.movimientos.forEach(m => {
      const actual = stockMap.get(m.id_ubicacion);
      if (actual) {
        if (m.tipo === 'entrada' || m.tipo === 'reposicion') {
          actual.cantidad += m.cantidad;
        } else if (m.tipo === 'salida') {
          actual.cantidad -= m.cantidad;
        } else if (m.tipo === 'ajuste') {
          actual.cantidad = m.cantidad;
        }
        actual.ultimoMovimiento = m;
      }
    });
    
    return stockMap;
  }

  const stockPorUbicacion = calcularStockPorUbicacion();

  function getStockAgrupado() {
    const padres = data.ubicaciones.filter((u: any) => u.tipo === 'pasillo' || u.tipo === 'reserva');
    const hijos = data.ubicaciones.filter((u: any) => u.tipo !== 'pasillo' && u.tipo !== 'reserva');
    
    return padres.map((padre: any) => {
      const hijosConStock = hijos
        .filter((h: any) => h.id_ubicacion_padre === padre.id)
        .map(hijo => {
          const stock = stockPorUbicacion.get(hijo.id);
          return { ...hijo, stock: stock?.cantidad || 0, ultimoMovimiento: stock?.ultimoMovimiento };
        })
        .filter(h => h.stock > 0);
      
      const stockPadre = stockPorUbicacion.get(padre.id);
      
      return {
        padre,
        stockPadre: stockPadre?.cantidad || 0,
        ultimoMovimientoPadre: stockPadre?.ultimoMovimiento,
        hijos: hijosConStock
      };
    }).filter(g => g.stockPadre > 0 || g.hijos.length > 0);
  }

  const stockAgrupado = getStockAgrupado();

  return (
    <TooltipProvider>
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

        {/* LEYENDA DE SEMÁFOROS */}
        <Card className="p-3 mb-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">📊 Guía de fiabilidad del stock</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-600 text-white px-2 py-1">🟢 Verde</Badge>
                  <span className="text-blue-800"><strong>100% fiable</strong> - Armarios y altos (stock controlado)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-500 text-white px-2 py-1"> Amarillo</Badge>
                  <span className="text-blue-800"><strong>Estimado</strong> - Lineales (puede estar inflado por ventas no registradas)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600 text-white px-2 py-1">🔵 Azul</Badge>
                  <span className="text-blue-800"><strong>Reserva</strong> - Almacén (stock controlado)</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* TABS: Stock actual / Historial */}
        <div className="flex gap-2 mb-4 border-b">
          <button
            onClick={() => setVista('stock')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              vista === 'stock' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <LayoutGrid className="h-4 w-4 inline mr-2" />
            Stock por Ubicación
          </button>
          <button
            onClick={() => setVista('historial')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              vista === 'historial' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <History className="h-4 w-4 inline mr-2" />
            Historial de Movimientos
          </button>
        </div>

        {/* VISTA 1: STOCK POR UBICACIÓN */}
        {vista === 'stock' && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Stock actual por ubicación</h3>
                <p className="text-sm text-muted-foreground">
                  {stockAgrupado.length} ubicaciones con stock · Total: {stockAgrupado.reduce((sum, g) => sum + g.stockPadre + g.hijos.reduce((s, h) => s + h.stock, 0), 0)} unidades
                </p>
              </div>
              {puedeCrear && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        if (confirm('⚠️ ¿Seguro que quieres limpiar el stock de TODOS los lineales?\n\nEsto pondrá a 0 el stock de todos los pasillos (lineales).\nEl stock de armarios y altos NO se verá afectado.\n\nEsta acción creará un movimiento de ajuste por cada producto afectado.')) {
                          limpiarLineales.mutate();
                        }
                      }}
                      disabled={limpiarLineales.isPending}
                      className="text-yellow-700 border-yellow-300 hover:bg-yellow-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {limpiarLineales.isPending ? 'Limpiando...' : '🧹 Limpiar lineales'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="font-semibold mb-1">⚠️ Resetear stock de lineales</p>
                    <p className="text-xs">Pone a 0 el stock de todos los pasillos (lineales). Útil cuando el stock está muy inflado por ventas no registradas.</p>
                    <p className="text-xs mt-1 text-yellow-600"><strong>No afecta</strong> al stock de armarios, altos ni reservas.</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {stockAgrupado.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No hay stock en ninguna ubicación.</p>
                <p className="text-xs mt-1">Usa "Nuevo movimiento" → "Entrada" para añadir stock inicial.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stockAgrupado.map(({ padre, stockPadre, ultimoMovimientoPadre, hijos }) => {
                  const esPasillo = padre.tipo === 'pasillo';
                  const esReserva = padre.tipo === 'reserva';
                  
                  return (
                    <div key={padre.id} className="border rounded-lg overflow-hidden">
                      {/* Cabecera del pasillo/reserva */}
                      <div className={`px-4 py-3 border-b flex items-center justify-between ${
                        esPasillo ? 'bg-yellow-50' : esReserva ? 'bg-blue-50' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{esPasillo ? '️' : esReserva ? '' : '📍'}</span>
                          <div>
                            <h4 className="font-semibold text-sm">{padre.nombre}</h4>
                            {padre.descripcion && <p className="text-xs text-muted-foreground">{padre.descripcion}</p>}
                          </div>
                          {esPasillo && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-300 cursor-help">
                                  ⚠️ Stock estimado
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p className="font-semibold mb-1">🟡 Stock NO fiable</p>
                                <p className="text-xs">Este stock puede estar inflado porque no se registran las ventas de clientes. Usa el botón " Limpiar lineales" para resetearlo periódicamente.</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {esReserva && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800 border-blue-300 cursor-help">
                                  ✅ Stock controlado
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="font-semibold mb-1"> Stock 100% fiable</p>
                                <p className="text-xs">La reserva es un almacén controlado. El stock refleja la realidad.</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <div className="text-right">
                          {stockPadre > 0 && (
                            <div>
                              <Badge 
                                variant="secondary" 
                                className={`text-lg px-3 py-1 ${
                                  esPasillo ? 'bg-yellow-100 text-yellow-800' : esReserva ? 'bg-blue-100 text-blue-800' : ''
                                }`}
                              >
                                {stockPadre} uds
                              </Badge>
                              {ultimoMovimientoPadre && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Último: {formatoFecha(ultimoMovimientoPadre.fecha_movimiento)}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Hijos con stock */}
                      {hijos.length > 0 && (
                        <div className="divide-y">
                          {hijos.map(hijo => {
                            const usuario = data.perfiles.find(p => p.id === hijo.ultimoMovimiento?.realizado_por);
                            const esArmarioOAlto = hijo.tipo === 'armario' || hijo.tipo === 'alto';
                            const esCross = hijo.tipo === 'cross';
                            const esCaja = hijo.tipo === 'caja';
                            
                            return (
                              <div key={hijo.id} className="px-4 py-3 pl-12 bg-white flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground text-xs">└─</span>
                                  <span className="text-base">
                                    {hijo.tipo === 'armario' ? '🗄️' : hijo.tipo === 'alto' ? '📦' : hijo.tipo === 'cross' ? '🔄' : hijo.tipo === 'caja' ? '💳' : '📍'}
                                  </span>
                                  <div>
                                    <span className="font-medium text-sm">{hijo.nombre}</span>
                                    <Badge variant="outline" className="ml-2 text-xs">{hijo.tipo}</Badge>
                                    {hijo.posicion_lateral && (
                                      <span className="text-xs text-muted-foreground ml-2">[{hijo.posicion_lateral}]</span>
                                    )}
                                    {hijo.numero && (
                                      <span className="text-xs text-muted-foreground ml-1">Nº{hijo.numero}</span>
                                    )}
                                  </div>
                                  {esArmarioOAlto && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 border-green-300 cursor-help">
                                          ✅ 100% fiable
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">
                                        <p className="font-semibold mb-1">🟢 Stock 100% fiable</p>
                                        <p className="text-xs">Armarios y altos tienen stock controlado. Cada entrada y salida se registra.</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                  {esCross && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-300 cursor-help">
                                          ️ Stock estimado
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">
                                        <p className="font-semibold mb-1">🟡 Stock NO fiable</p>
                                        <p className="text-xs">Los cross son zonas de paso. El stock puede variar por ventas no registradas.</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                  {esCaja && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-300 cursor-help">
                                          ⚠️ Stock estimado
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">
                                        <p className="font-semibold mb-1">🟡 Stock NO fiable</p>
                                        <p className="text-xs">Las cajas están en zona de venta. El stock puede variar por compras de clientes.</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                                <div className="text-right">
                                  <Badge 
                                    variant={esArmarioOAlto ? 'default' : 'secondary'}
                                    className={`text-lg px-3 py-1 ${
                                      esArmarioOAlto ? 'bg-green-600 hover:bg-green-700' : 
                                      esCross || esCaja ? 'bg-yellow-100 text-yellow-800' : ''
                                    }`}
                                  >
                                    {hijo.stock} uds
                                  </Badge>
                                  {hijo.ultimoMovimiento && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      <p>{formatoFecha(hijo.ultimoMovimiento.fecha_movimiento)}</p>
                                      {usuario && <p>por {usuario.nombre_completo}</p>}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* VISTA 2: HISTORIAL DE MOVIMIENTOS */}
        {vista === 'historial' && puedeVer && (
          <>
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
                        <SelectItem key={key} value={key}>{cfg.emoji} {cfg.label}</SelectItem>
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

            <Card className="p-4">
              {movimientosFiltrados.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No hay movimientos con los filtros actuales.</div>
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
                        <TableHead>Usuario</TableHead>
                        <TableHead>Notas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movimientosFiltrados.map((m: Movimiento) => {
                        const cfg = CONFIG_TIPOS[m.tipo as keyof typeof CONFIG_TIPOS] || CONFIG_TIPOS.entrada;
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
                            <TableCell className="max-w-xs truncate" title={producto?.nombre}>{producto?.nombre || '—'}</TableCell>
                            <TableCell className="text-xs">{ubicacion?.nombre || '—'}</TableCell>
                            <TableCell className="text-right font-mono font-semibold">
                              <span className={m.tipo === 'salida' ? 'text-red-600' : 'text-green-600'}>
                                {m.tipo === 'salida' ? '-' : '+'}{m.cantidad}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs">{usuario?.nombre_completo || '—'}</TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={m.notas || ''}>{m.notas || '—'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </>
        )}

        {/* MODAL NUEVO MOVIMIENTO */}
        <Dialog open={abierto} onOpenChange={o => { if (!o && !crear.isPending) { setAbierto(false); resetearFormulario(); } }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Nuevo movimiento de stock
              </DialogTitle>
              <DialogDescription>
                Gestiona el stock de armarios y ubicaciones. El stock se actualizará automáticamente.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={(e: FormEvent) => { e.preventDefault(); crear.mutate(); }} className="space-y-4">
              
              <div>
                <Label className="text-sm font-semibold mb-2 block">Tipo de movimiento</Label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(CONFIG_TIPOS).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    const activo = tipo === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setTipo(key as TipoMovimientoForm)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          activo 
                            ? `${cfg.color} border-current ring-2 ring-offset-1` 
                            : 'bg-background border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{cfg.emoji}</div>
                        <div className="font-semibold text-sm">{cfg.label}</div>
                        <div className="text-xs opacity-75">{cfg.descripcion}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

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

              {productoId && ubicacionesConStock.length > 0 && (
                <div className={`rounded-lg border p-3 ${tipo === 'ajuste' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className={`h-4 w-4 ${tipo === 'ajuste' ? 'text-blue-700' : 'text-purple-700'}`} />
                    <Label className={`text-sm font-semibold ${tipo === 'ajuste' ? 'text-blue-800' : 'text-purple-800'}`}>
                      📍 Stock actual del producto:
                    </Label>
                  </div>
                  <div className="space-y-1">
                    {ubicacionesConStock.map((item) => {
                      const ubicacionCompleta = data.ubicaciones.find((u: any) => u.id === item.id_ubicacion);
                      const padre = ubicacionCompleta?.id_ubicacion_padre 
                        ? data.ubicaciones.find((u: any) => u.id === ubicacionCompleta.id_ubicacion_padre)
                        : null;
                      const esArmarioOAlto = ubicacionCompleta?.tipo === 'armario' || ubicacionCompleta?.tipo === 'alto';
                      
                      return (
                        <div 
                          key={item.id_ubicacion} 
                          className={`flex justify-between items-center p-2 rounded ${
                            ubicacionId === item.id_ubicacion 
                              ? 'bg-white border-2 border-current' 
                              : 'bg-white/50'
                          } ${esArmarioOAlto ? 'border-green-300' : 'border-gray-200'}`}
                        >
                          <div className="text-sm">
                            {padre && <span className="text-xs text-muted-foreground">{padre.nombre} → </span>}
                            <span className="font-medium">{item.nombre_ubicacion}</span>
                            {esArmarioOAlto && <Badge variant="outline" className="ml-2 text-xs bg-green-100 text-green-800">✅ Fiable</Badge>}
                          </div>
                          <Badge variant={esArmarioOAlto ? 'default' : 'secondary'} className="text-base px-3 py-1">
                            {item.cantidad} uds
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {productoId && ubicacionesConStock.length === 0 && tipo === 'ajuste' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-700 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">⚠️ Producto sin stock</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Este producto no tiene stock en ninguna ubicación. Usa "Entrada" para añadir stock inicial.
                    </p>
                  </div>
                </div>
              )}

              {tipo === 'traslado' ? (
                <div className="space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <Label className="text-sm font-semibold text-red-800 flex items-center gap-2 mb-2">
                      <ArrowDownToLine className="h-4 w-4" />
                      Ubicación de ORIGEN (de dónde se saca)
                    </Label>
                    {renderSelectoresUbicacion(
                      'Zona origen',
                      'Ubicación origen',
                      ubicacionOrigenPadreId,
                      setUbicacionOrigenPadreId,
                      ubicacionOrigenId,
                      setUbicacionOrigenId
                    )}
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <Label className="text-sm font-semibold text-green-800 flex items-center gap-2 mb-2">
                      <ArrowDownToLine className="h-4 w-4" />
                      Ubicación de DESTINO (a dónde se lleva)
                    </Label>
                    {renderSelectoresUbicacion(
                      'Zona destino',
                      'Ubicación destino',
                      ubicacionDestinoPadreId,
                      setUbicacionDestinoPadreId,
                      ubicacionDestinoId,
                      setUbicacionDestinoId
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {renderSelectoresUbicacion(
                    'Zona',
                    'Ubicación específica',
                    ubicacionPadreId,
                    setUbicacionPadreId,
                    ubicacionId,
                    setUbicacionId
                  )}
                </>
              )}

              {stockActual !== null && productoSeleccionado && (
                <div className="bg-muted/50 border rounded-md p-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {tipo === 'traslado' ? 'Stock en origen:' : 'Stock actual en esta ubicación:'}
                  </span>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {stockActual} uds
                  </Badge>
                </div>
              )}

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
                  className="max-w-xs"
                />
              </div>

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
                  disabled={crear.isPending || !productoId || !cantidad || (tipo !== 'traslado' && !ubicacionId) || (tipo === 'traslado' && (!ubicacionOrigenId || !ubicacionDestinoId))}
                  className={CONFIG_TIPOS[tipo].colorBtn}
                >
                  {crear.isPending ? 'Registrando...' : `Registrar ${CONFIG_TIPOS[tipo].label}`}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

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
    </TooltipProvider>
  );
}