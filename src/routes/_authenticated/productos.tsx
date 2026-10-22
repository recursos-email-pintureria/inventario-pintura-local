import { useState, useEffect, useCallback, lazy, Suspense, type FormEvent } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Pencil, Plus, Search, Power, ScanBarcode, MapPin, Sparkles, AlertTriangle } from 'lucide-react';
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
import { inventarioQueryOptions, usuarioActual, permisoExplicito, guardarProducto, comprobarUnicidad, desactivarRegistro, errorInventario, formatoPrecio, type Producto, cargarUbicacionesProducto, guardarUbicacionesProducto, buscarProductoPorCodigo } from '@/lib/inventario';
import { CargandoInventario, ErrorInventario } from '@/components/inventario/EstadoInventario';
const Escaner = lazy(() => import('@/components/inventario/Escaner'));

export const Route = createFileRoute('/_authenticated/productos')({
  head: () => pageHead('Productos', 'Listado de productos de pintura.'),
  loader: async ({ context }) => { const user = await usuarioActual(); await context.queryClient.ensureQueryData(inventarioQueryOptions(user.id)); return { userId: user.id }; },
  pendingComponent: CargandoInventario, errorComponent: ErrorInventario, component: Productos,
});

function useUnicidad(campo: 'sku' | 'codigo_barras', valor: string, abierto: boolean, id?: string) {
  const [estado, setEstado] = useState<'vacio' | 'comprobando' | 'libre' | 'duplicado' | 'error'>('vacio');
  useEffect(() => {
    let cancelado = false;
    if (!abierto || !valor.trim()) { setEstado('vacio'); return; }
    setEstado('comprobando');
    const timer = setTimeout(() => { comprobarUnicidad(campo, valor, id).then(libre => { if (!cancelado) setEstado(libre ? 'libre' : 'duplicado'); }).catch(() => { if (!cancelado) setEstado('error'); }); }, 350);
    return () => { cancelado = true; clearTimeout(timer); };
  }, [campo, valor, abierto, id]);
  return estado;
}

function EstadoUnicidad({ estado }: { estado: ReturnType<typeof useUnicidad> }) {
  if (estado === 'vacio') return null;
  return <p role="status" className={estado === 'duplicado' || estado === 'error' ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>{estado === 'comprobando' ? 'Comprobando…' : estado === 'libre' ? 'Disponible' : estado === 'duplicado' ? 'Ya existe en otro producto' : 'No se pudo comprobar la disponibilidad'}</p>;
}

function Productos() {
  const { userId } = Route.useLoaderData(); 
  const { data } = useSuspenseQuery(inventarioQueryOptions(userId)); 
  const { permisos } = useMyProfile();
  const crear = permisoExplicito(permisos, 'puede_crear_productos');
  const editar = crear && permisoExplicito(permisos, 'puede_editar_productos');
  const client = useQueryClient();
  
  const [busqueda, setBusqueda] = useState(''); 
  const [categoriaFiltro, setCategoriaFiltro] = useState('todos'); 
  const [pagina, setPagina] = useState(0);
  const [abierto, setAbierto] = useState(false); 
  const [escaneando, setEscaneando] = useState(false); 
  const [editando, setEditando] = useState<Producto | null>(null); 
  const [desactivando, setDesactivando] = useState<Producto | null>(null);
  
  const [codigo, setCodigo] = useState(''); 
  const [sku, setSku] = useState(''); 
  const [nombre, setNombre] = useState(''); 
  const [descripcion, setDescripcion] = useState(''); 
  const [categoria, setCategoria] = useState('ninguna'); 
  const [precio, setPrecio] = useState(''); 
  const [error, setError] = useState('');
  
  // Estados para autocompletado desde base de datos
  const [productoExistente, setProductoExistente] = useState<Producto | null>(null);
  const [buscandoCodigo, setBuscandoCodigo] = useState(false);
  
  const [ubicacionesProducto, setUbicacionesProducto] = useState<any[]>([]);
  const [nuevaUbicacionPadreId, setNuevaUbicacionPadreId] = useState('');
  const [nuevaUbicacionId, setNuevaUbicacionId] = useState('');
  const [nuevoTipoUbicacion, setNuevoTipoUbicacion] = useState<'principal' | 'cross' | 'caja' | 'temporal'>('principal');
  const [nuevaSeccionOrigen, setNuevaSeccionOrigen] = useState('');
  const [cargandoUbicaciones, setCargandoUbicaciones] = useState(false);

  const codigoEstado = useUnicidad('codigo_barras', codigo, abierto, editando?.id); 
  const skuEstado = useUnicidad('sku', sku, abierto, editando?.id);
  const recibirCodigo = useCallback((valor: string) => { setCodigo(valor); setEscaneando(false); }, []);
  
  const guardar = useMutation({ 
    mutationFn: async () => {
      if (!(editando ? editar : crear)) throw new Error('No tienes permiso para guardar productos.');
      const [codigoLibre, skuLibre] = await Promise.all([comprobarUnicidad('codigo_barras', codigo, editando?.id), comprobarUnicidad('sku', sku, editando?.id)]);
      if (!codigoLibre || !skuLibre) throw new Error('El código de barras o SKU ya pertenece a otro producto.');
      
      await guardarProducto({ codigo_barras: codigo, sku, nombre, descripcion, id_categoria: categoria === 'ninguna' ? null : categoria, precio_unitario: precio === '' ? null : Number(precio) }, editando?.id);
      
      if (editando) {
        await guardarUbicacionesProducto(editando.id, ubicacionesProducto);
      }
    }, 
    onSuccess: async () => { 
      await client.invalidateQueries({ queryKey: ['inventario', userId] }); 
      setAbierto(false); 
      toast.success('Producto guardado'); 
    }, 
    onError: e => setError(errorInventario(e)) 
  });

  const desactivar = useMutation({ 
    mutationFn: async () => { 
      if (!editar || !desactivando) throw new Error('No tienes permiso para desactivar productos.'); 
      await desactivarRegistro('productos', desactivando.id); 
    }, 
    onSuccess: async () => { 
      await client.invalidateQueries({ queryKey: ['inventario', userId] }); 
      setDesactivando(null); 
      toast.success('Producto desactivado'); 
    }, 
    onError: e => setError(errorInventario(e)) 
  });

  // ✅ NUEVA FUNCIÓN: Buscar producto existente por código y autocompletar
  async function buscarYAutocompletar(codigoBuscado: string) {
    if (!codigoBuscado.trim()) {
      setProductoExistente(null);
      return;
    }
    
    setBuscandoCodigo(true);
    try {
      const productoEncontrado = await buscarProductoPorCodigo(codigoBuscado);
      
      if (productoEncontrado) {
        setProductoExistente(productoEncontrado);
        // Autocompletar campos
        setNombre(productoEncontrado.nombre);
        setDescripcion(productoEncontrado.descripcion || '');
        setCategoria(productoEncontrado.id_categoria || 'ninguna');
        setPrecio(productoEncontrado.precio_unitario != null ? String(productoEncontrado.precio_unitario) : '');
        
        toast.success(`✨ Producto encontrado: "${productoEncontrado.nombre}". Datos autocompletados.`);
      } else {
        setProductoExistente(null);
      }
    } catch (e) {
      setProductoExistente(null);
    } finally {
      setBuscandoCodigo(false);
    }
  }

  // Buscar automáticamente cuando cambia el código (con debounce)
  useEffect(() => {
    if (!abierto || !codigo.trim() || editando) return;
    
    const timer = setTimeout(() => {
      buscarYAutocompletar(codigo);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [codigo, abierto, editando]);

  const abrir = async (p: Producto | null) => { 
    setEditando(p); 
    setCodigo(p?.codigo_barras ?? ''); 
    setSku(p?.sku ?? ''); 
    setNombre(p?.nombre ?? ''); 
    setDescripcion(p?.descripcion ?? ''); 
    setCategoria(p?.id_categoria ?? 'ninguna'); 
    setPrecio(p?.precio_unitario == null ? '' : String(p.precio_unitario)); 
    setError('');
    setProductoExistente(null);
    
    if (p) {
      setCargandoUbicaciones(true);
      try {
        const ubis = await cargarUbicacionesProducto(p.id);
        setUbicacionesProducto(ubis);
      } catch (e) {
        console.error(e);
        setUbicacionesProducto([]);
      } finally {
        setCargandoUbicaciones(false);
      }
    } else {
      setUbicacionesProducto([]);
    }
    setAbierto(true); 
  };

  const enviar = (e: FormEvent) => { e.preventDefault(); setError(''); guardar.mutate(); };
  
  const query = busqueda.trim().toLocaleLowerCase('es');
  const filtrados = data.productos.filter(p => p.activo && (categoriaFiltro === 'todos' || p.id_categoria === categoriaFiltro) && [p.codigo_barras, p.sku, p.nombre].some(v => v.toLocaleLowerCase('es').includes(query)));
  const paginaActual = Math.min(pagina, Math.max(0, Math.ceil(filtrados.length / 20) - 1)); 
  const rows = filtrados.slice(paginaActual * 20, (paginaActual + 1) * 20);

  function obtenerNombreUbicacion(id_ubicacion: string) {
    const ubi = data.ubicaciones.find((u: any) => u.id === id_ubicacion);
    if (!ubi) return 'Desconocida';
    if (ubi.id_ubicacion_padre) {
      const padre = data.ubicaciones.find((p: any) => p.id === ubi.id_ubicacion_padre);
      return padre ? `${padre.nombre} > ${ubi.nombre}` : ubi.nombre;
    }
    return ubi.nombre;
  }

  return (
    <>
      <PageHeader title="Productos" action={crear ? <Button onClick={() => abrir(null)}><Plus className="h-4 w-4" />Nuevo producto</Button> : undefined} />
      <Card className="p-4">
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Buscar productos" placeholder="Buscar por código, SKU o nombre…" className="pl-9" value={busqueda} onChange={e => { setBusqueda(e.target.value); setPagina(0); }} />
          </div>
          <Select value={categoriaFiltro} onValueChange={v => { setCategoriaFiltro(v); setPagina(0); }}>
            <SelectTrigger className="w-full sm:w-56" aria-label="Filtrar categoría"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las categorías</SelectItem>
              {data.categorias.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nombre}{!c.activo ? ' (inactiva)' : ''}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código de barras</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.codigo_barras}</TableCell>
                <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                <TableCell className="max-w-64 break-words align-middle min-h-[60px]">{p.nombre}</TableCell>
                <TableCell>{data.categorias.find((c: any) => c.id === p.id_categoria)?.nombre ?? '—'}</TableCell>
                <TableCell className="text-right">{formatoPrecio(p.precio_unitario)}</TableCell>
                <TableCell className="text-right">
                  {editar && (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label={`Editar ${p.nombre}`} title="Editar" onClick={() => abrir(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Desactivar ${p.nombre}`} title="Desactivar" onClick={() => { setError(''); setDesactivando(p); }}>
                        <Power className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!rows.length && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No hay productos que coincidan.</TableCell></TableRow>}
          </TableBody>
        </Table>
        
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>{filtrados.length ? `Mostrando ${paginaActual * 20 + 1}–${Math.min((paginaActual + 1) * 20, filtrados.length)} de ${filtrados.length}` : '0 productos'}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={paginaActual === 0} onClick={() => setPagina(paginaActual - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={(paginaActual + 1) * 20 >= filtrados.length} onClick={() => setPagina(paginaActual + 1)}>Siguiente</Button>
          </div>
        </div>
      </Card>

      <Dialog open={abierto} onOpenChange={o => { if (!guardar.isPending) { setAbierto(o); if (!o) setEscaneando(false); } }}>
        <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
            <DialogDescription>Datos del producto</DialogDescription>
          </DialogHeader>
          <form onSubmit={enviar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="producto-codigo">Código de barras</Label>
              <div className="flex gap-2">
                <Input id="producto-codigo" value={codigo} onChange={e => setCodigo(e.target.value)} required disabled={guardar.isPending || buscandoCodigo} placeholder="Escanea o escribe el código..." />
                <Button type="button" variant="outline" onClick={() => setEscaneando(true)} disabled={guardar.isPending}>
                  <ScanBarcode className="h-4 w-4" />
                </Button>
              </div>
              {buscandoCodigo && (
                <p className="text-xs text-muted-foreground">🔍 Buscando en base de datos...</p>
              )}
              {/* ✅ AVISO DE PRODUCTO EXISTENTE */}
              {productoExistente && !editando && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-green-700 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-800">✨ Producto ya registrado en tu base de datos</p>
                    <p className="text-xs text-green-700 mt-1">
                      Hemos autocompletado los datos del producto "<strong>{productoExistente.nombre}</strong>" que registraste anteriormente.
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Puedes modificar cualquier campo si es necesario antes de guardar.
                    </p>
                  </div>
                </div>
              )}
              <EstadoUnicidad estado={codigoEstado} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="producto-sku">SKU</Label>
              <Input id="producto-sku" value={sku} onChange={e => setSku(e.target.value)} required disabled={guardar.isPending} />
              <EstadoUnicidad estado={skuEstado} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="producto-nombre">Nombre</Label>
              <Input id="producto-nombre" value={nombre} onChange={e => setNombre(e.target.value)} required disabled={guardar.isPending} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="producto-descripcion">Descripción (opcional)</Label>
              <Textarea id="producto-descripcion" value={descripcion} onChange={e => setDescripcion(e.target.value)} disabled={guardar.isPending} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="producto-categoria">Categoría</Label>
              <Select value={categoria} disabled={guardar.isPending} onValueChange={setCategoria}>
                <SelectTrigger id="producto-categoria"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ninguna">Sin categoría</SelectItem>
                  {data.categorias.filter((c: any) => c.activo || c.id === categoria).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nombre}{!c.activo ? ' (inactiva)' : ''}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="producto-precio">Precio unitario</Label>
              <Input id="producto-precio" type="number" min="0" step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} disabled={guardar.isPending} />
            </div>

            {/* UBICACIONES DEL PRODUCTO */}
            {editando && (
              <div className="space-y-3 pt-4 border-t mt-4">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Ubicaciones del producto
                </Label>
                <p className="text-xs text-muted-foreground">Añade ubicaciones cruzadas, cajas o armarios donde se pueda encontrar este producto.</p>
                
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {cargandoUbicaciones ? (
                    <p className="text-sm text-muted-foreground">Cargando ubicaciones...</p>
                  ) : ubicacionesProducto.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No hay ubicaciones asignadas. Añade una abajo.</p>
                  ) : (
                    ubicacionesProducto.map((u: any, index: number) => {
                      const nombreMostrar = obtenerNombreUbicacion(u.id_ubicacion);
                      return (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md text-sm border">
                          <Badge variant={u.tipo === 'principal' ? 'default' : 'secondary'} className="capitalize text-xs">{u.tipo}</Badge>
                          <span className="flex-1 truncate font-medium" title={nombreMostrar}>{nombreMostrar}</span>
                          {u.tipo === 'cross' && u.seccion_origen && (
                            <span className="text-xs text-muted-foreground italic">de {u.seccion_origen}</span>
                          )}
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => setUbicacionesProducto(prev => prev.filter((_: any, i: number) => i !== index))} title="Quitar">
                            <Power className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="select-pasillo" className="text-sm font-medium">1. Selecciona zona principal</Label>
                    <Select 
                      value={nuevaUbicacionPadreId} 
                      onValueChange={(value) => {
                        setNuevaUbicacionPadreId(value);
                        setNuevaUbicacionId(value);
                      }}
                    >
                      <SelectTrigger id="select-pasillo">
                        <SelectValue placeholder="Elige pasillo o reserva..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel className="text-xs font-bold text-blue-700">🛣️ PASILLOS</SelectLabel>
                          {data.ubicaciones
                            .filter((u: any) => u.tipo === 'pasillo')
                            .map((pasillo: any) => (
                              <SelectItem key={pasillo.id} value={pasillo.id}>
                                🛣️ {pasillo.nombre} {pasillo.descripcion ? `- ${pasillo.descripcion}` : ''}
                              </SelectItem>
                            ))}
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel className="text-xs font-bold text-gray-700">🏭 RESERVA</SelectLabel>
                          {data.ubicaciones
                            .filter((u: any) => u.tipo === 'reserva')
                            .map((reserva: any) => (
                              <SelectItem key={reserva.id} value={reserva.id}>
                                🏭 {reserva.nombre}
                              </SelectItem>
                            ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  {nuevaUbicacionPadreId && (
                    <div>
                      <Label htmlFor="select-hijo" className="text-sm font-medium">2. Ubicación específica</Label>
                      <Select 
                        value={nuevaUbicacionId} 
                        onValueChange={setNuevaUbicacionId}
                      >
                        <SelectTrigger id="select-hijo">
                          <SelectValue placeholder="Elige ubicación específica..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={nuevaUbicacionPadreId}>
                            {data.ubicaciones.find((u: any) => u.id === nuevaUbicacionPadreId)?.tipo === 'pasillo' ? '🛣️' : '🏭'} 
                            {' '}{data.ubicaciones.find((u: any) => u.id === nuevaUbicacionPadreId)?.nombre} (General)
                          </SelectItem>
                          
                          {data.ubicaciones.filter((h: any) => h.id_ubicacion_padre === nuevaUbicacionPadreId).length > 0 && (
                            <div className="h-px bg-gray-200 my-1" />
                          )}
                          
                          {data.ubicaciones
                            .filter((h: any) => h.id_ubicacion_padre === nuevaUbicacionPadreId && !ubicacionesProducto.some((up: any) => up.id_ubicacion === h.id))
                            .map((hijo: any) => (
                              <SelectItem key={hijo.id} value={hijo.id}>
                                <span className="pl-2">
                                  {hijo.tipo === 'armario' ? '🗄️' : 
                                   hijo.tipo === 'alto' ? '📦' : 
                                   hijo.tipo === 'cross' ? '🔄' : 
                                   hijo.tipo === 'caja' ? '💳' : '📍'} 
                                  {' '}{hijo.nombre} ({hijo.tipo})
                                  {hijo.posicion_lateral && ` [${hijo.posicion_lateral}]`}
                                  {hijo.numero && ` Nº${hijo.numero}`}
                                </span>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {nuevaUbicacionId && (
                  <div className="flex flex-col sm:flex-row gap-2 p-3 bg-background border rounded-md">
                    <Select value={nuevoTipoUbicacion} onValueChange={(v: any) => setNuevoTipoUbicacion(v)}>
                      <SelectTrigger className="w-full sm:w-32"><SelectValue placeholder="Tipo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="principal">Principal</SelectItem>
                        <SelectItem value="cross">Cross</SelectItem>
                        <SelectItem value="caja">Caja</SelectItem>
                        <SelectItem value="temporal">Temporal</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {nuevoTipoUbicacion === 'cross' && (
                      <Input placeholder="Sección origen" value={nuevaSeccionOrigen} onChange={e => setNuevaSeccionOrigen(e.target.value)} className="flex-1" />
                    )}
                    
                    <Button type="button" variant="secondary" onClick={() => {
                      if (!nuevaUbicacionId) return;
                      setUbicacionesProducto(prev => [...prev, { 
                        id_ubicacion: nuevaUbicacionId, 
                        tipo: nuevoTipoUbicacion, 
                        seccion_origen: nuevoTipoUbicacion === 'cross' ? nuevaSeccionOrigen : null 
                      }]);
                      setNuevaUbicacionPadreId(''); 
                      setNuevaUbicacionId(''); 
                      setNuevoTipoUbicacion('principal'); 
                      setNuevaSeccionOrigen('');
                    }}>Añadir</Button>
                  </div>
                )}
              </div>
            )}

            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={guardar.isPending} onClick={() => setAbierto(false)}>Cancelar</Button>
              <Button type="submit" disabled={guardar.isPending || !(editando ? editar : crear) || !nombre.trim() || !sku.trim() || !codigo.trim() || codigoEstado !== 'libre' || skuEstado !== 'libre'}>
                {guardar.isPending ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={escaneando && abierto} onOpenChange={setEscaneando}>
        <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto">
          <DialogHeader><DialogTitle>Escanear código</DialogTitle><DialogDescription>Código de barras del producto</DialogDescription></DialogHeader>
          <Suspense fallback={<CargandoInventario />}><Escaner onCodigo={recibirCodigo} onCerrar={() => setEscaneando(false)} /></Suspense>
        </DialogContent>
      </Dialog>

      <Dialog open={!!desactivando} onOpenChange={o => { if (!o && !desactivar.isPending) setDesactivando(null); }}>
        <DialogContent className="w-[calc(100%-2rem)]">
          <DialogHeader><DialogTitle>Desactivar producto</DialogTitle><DialogDescription>¿Desactivar «{desactivando?.nombre}»? Se conservarán su stock y movimientos.</DialogDescription></DialogHeader>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={desactivar.isPending} onClick={() => setDesactivando(null)}>Cancelar</Button>
            <Button variant="destructive" disabled={desactivar.isPending || !editar} onClick={() => desactivar.mutate()}>
              {desactivar.isPending ? 'Desactivando…' : 'Desactivar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}