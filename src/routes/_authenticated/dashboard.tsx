import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeftRight, MapPin, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/layout/AppLayout';
import { pageHead } from '@/lib/meta';
import { inventarioQueryOptions, usuarioActual, productosStockBajo, movimientosHoy, actividadReciente, formatoFecha } from '@/lib/inventario';
import { useMyProfile } from '@/hooks/usePermissions';
import { CargandoInventario, ErrorInventario } from '@/components/inventario/EstadoInventario';

type ColorKpi = { bg: string; border: string; text: string; iconBg: string; alerta?: boolean };

const KPI_COLORS: Record<string, ColorKpi> = {
  'Total de productos': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', iconBg: 'bg-blue-100' },
  'Stock bajo': { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', iconBg: 'bg-red-100', alerta: true },
  'Movimientos hoy': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', iconBg: 'bg-emerald-100' },
  'Ubicaciones activas': { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', iconBg: 'bg-indigo-100' },
};

const BADGE_TIPO: Record<string, string> = {
  entrada: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  salida: 'bg-red-100 text-red-800 border-red-200',
  ajuste: 'bg-amber-100 text-amber-800 border-amber-200',
  reposicion: 'bg-sky-100 text-sky-800 border-sky-200',
};

export const Route = createFileRoute('/_authenticated/dashboard')({
  head: () => pageHead('Dashboard', 'Resumen del inventario de pintura.'),
  loader: async ({ context }) => { 
    const user = await usuarioActual(); 
    await context.queryClient.ensureQueryData(inventarioQueryOptions(user.id)); 
    return { userId: user.id }; 
  },
  pendingComponent: CargandoInventario, 
  errorComponent: ErrorInventario, 
  component: Dashboard,
});

function Dashboard() {
  const { userId } = Route.useLoaderData(); 
  const { data } = useSuspenseQuery(inventarioQueryOptions(userId)); 
  const { permisos } = useMyProfile();
  const ver = data.puedeVerMovimientos && permisos?.puede_ver_movimientos === true;
  const hoy = new Date();
  
  const stats = [
    { label: 'Total de productos', value: data.productos.filter(p => p.activo).length, icon: Package },
    { label: 'Stock bajo', value: productosStockBajo(data.productos, data.stock), icon: AlertTriangle },
    { label: 'Movimientos hoy', value: ver ? movimientosHoy(data.movimientos, hoy) : '—', icon: ArrowLeftRight },
    { label: 'Ubicaciones activas', value: data.ubicaciones.filter(u => u.activo).length, icon: MapPin },
  ];

  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(s => {
          const colors: ColorKpi = KPI_COLORS[s.label] ?? { bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-700', iconBg: 'bg-gray-100' };
          const esAlerta = colors.alerta && Number(s.value) > 0;
          return (
            <Card key={s.label} className={`${esAlerta ? 'border-red-300 ring-2 ring-red-200' : colors.border} ${colors.bg}`}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`rounded-lg p-3 ${esAlerta ? 'bg-red-200' : colors.iconBg}`}>
                  <s.icon className={`h-5 w-5 ${esAlerta ? 'text-red-700' : colors.text}`} />
                </div>
                <div>
                  <p className={`text-sm ${esAlerta ? 'text-red-700 font-semibold' : 'text-muted-foreground'}`}>{s.label}</p>
                  <p className={`text-2xl font-bold ${esAlerta ? 'text-red-600' : ''}`}>{s.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Actividad reciente</CardTitle>
        </CardHeader>
        <CardContent>
          {!ver ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No tienes permiso para ver movimientos.</p>
          ) : !data.movimientos.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Aún no hay actividad.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead>Ubicación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actividadReciente(data.movimientos).map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap">{formatoFecha(m.fecha_movimiento)}</TableCell>
                    <TableCell>{data.productos.find(p => p.id === m.id_producto)?.nombre ?? 'Producto no disponible'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${BADGE_TIPO[m.tipo] ?? 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                        {m.tipo === 'reposicion' ? 'Reposición' : m.tipo.charAt(0).toUpperCase() + m.tipo.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{m.cantidad}</TableCell>
                    <TableCell>{data.ubicaciones.find(u => u.id === m.id_ubicacion)?.nombre ?? 'Ubicación inactiva'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}