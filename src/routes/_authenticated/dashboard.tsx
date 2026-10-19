import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { isSameDay } from 'date-fns';
import { AlertTriangle, ArrowLeftRight, MapPin, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/layout/AppLayout';
import { pageHead } from '@/lib/meta';
import { inventarioQueryOptions, usuarioActual, productosStockBajo, formatoFecha } from '@/lib/inventario';
import { useMyProfile } from '@/hooks/usePermissions';
import { CargandoInventario, ErrorInventario } from '@/components/inventario/EstadoInventario';
export const Route = createFileRoute('/_authenticated/dashboard')({
  head: () => pageHead('Dashboard', 'Resumen del inventario de pintura.'),
  loader: async ({ context }) => { const user = await usuarioActual(); await context.queryClient.ensureQueryData(inventarioQueryOptions(user.id)); return { userId: user.id }; },
  pendingComponent: CargandoInventario, errorComponent: ErrorInventario, component: Dashboard,
});
function Dashboard() {
  const { userId } = Route.useLoaderData(); const { data } = useSuspenseQuery(inventarioQueryOptions(userId)); const { permisos } = useMyProfile();
  const ver = data.puedeVerMovimientos && permisos?.puede_ver_movimientos === true;
  const hoy = new Date();
  const stats = [
    { label: 'Total de productos', value: data.productos.filter(p => p.activo).length, icon: Package },
    { label: 'Stock bajo', value: productosStockBajo(data.productos, data.stock), icon: AlertTriangle },
    { label: 'Movimientos hoy', value: ver ? data.movimientos.filter(m => isSameDay(new Date(m.fecha_movimiento), hoy)).length : '—', icon: ArrowLeftRight },
    { label: 'Ubicaciones activas', value: data.ubicaciones.filter(u => u.activo).length, icon: MapPin },
  ];
  return <><PageHeader title="Dashboard" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(s => <Card key={s.label}><CardContent className="flex items-center gap-4 p-5"><div className="rounded-lg bg-accent p-3 text-primary"><s.icon className="h-5 w-5" /></div><div><p className="text-sm text-muted-foreground">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div></CardContent></Card>)}</div>
    <Card className="mt-6"><CardHeader><CardTitle className="text-lg">Actividad reciente</CardTitle></CardHeader><CardContent>{!ver ? <p className="py-6 text-center text-sm text-muted-foreground">No tienes permiso para ver movimientos.</p> : !data.movimientos.length ? <p className="py-6 text-center text-sm text-muted-foreground">Aún no hay actividad.</p> : <Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Producto</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Cantidad</TableHead><TableHead>Ubicación</TableHead></TableRow></TableHeader><TableBody>{data.movimientos.slice(0, 10).map(m => <TableRow key={m.id}><TableCell className="whitespace-nowrap">{formatoFecha(m.fecha_movimiento)}</TableCell><TableCell>{data.productos.find(p => p.id === m.id_producto)?.nombre ?? 'Producto no disponible'}</TableCell><TableCell className="capitalize">{m.tipo === 'reposicion' ? 'Reposición' : m.tipo}</TableCell><TableCell className="text-right">{m.cantidad}</TableCell><TableCell>{data.ubicaciones.find(u => u.id === m.id_ubicacion)?.nombre ?? 'Ubicación inactiva'}</TableCell></TableRow>)}</TableBody></Table>}</CardContent></Card>
  </>;
}
