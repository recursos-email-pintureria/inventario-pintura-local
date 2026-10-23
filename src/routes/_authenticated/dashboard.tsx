import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ArrowLeftRight, DollarSign, MapPin, Package } from 'lucide-react';
import { PageHeader } from '@/components/layout/AppLayout';
import { pageHead } from '@/lib/meta';
import { inventarioQueryOptions, usuarioActual } from '@/lib/inventario';
import { useMyProfile } from '@/hooks/usePermissions';
import { CargandoInventario, ErrorInventario } from '@/components/inventario/EstadoInventario';

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

/* ---------------- utilidades ---------------- */

const ACCION_TIPO: Record<string, string> = {
  entrada: 'dio entrada de stock',
  salida: 'registró una salida',
  reposicion: 'repuso stock',
  ajuste: 'ajustó el stock',
  traslado: 'trasladó stock',
};

const COLOR_PUNTO: Record<string, string> = {
  entrada: 'bg-emerald-500',
  salida: 'bg-red-500',
  ajuste: 'bg-blue-500',
  traslado: 'bg-amber-500',
  reposicion: 'bg-emerald-500',
};

const COLOR_CIRCULO: Record<string, string> = {
  entrada: 'bg-emerald-100 text-emerald-700',
  salida: 'bg-red-100 text-red-700',
  ajuste: 'bg-blue-100 text-blue-700',
  traslado: 'bg-amber-100 text-amber-700',
  reposicion: 'bg-emerald-100 text-emerald-700',
};

function timestampRelativo(fechaIso: string): string {
  const fecha = new Date(fechaIso);
  const ahora = new Date();
  const min = Math.floor((ahora.getTime() - fecha.getTime()) / 60000);
  if (min < 1) return 'Ahora mismo';
  if (min < 60) return `Hace ${min} min`;
  const horas = Math.floor(min / 60);
  if (horas < 24 && fecha.getDate() === ahora.getDate()) return `Hace ${horas}h`;
  const ayer = new Date(ahora);
  ayer.setDate(ahora.getDate() - 1);
  if (
    fecha.getDate() === ayer.getDate() &&
    fecha.getMonth() === ayer.getMonth() &&
    fecha.getFullYear() === ayer.getFullYear()
  )
    return `Ayer ${fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function iniciales(nombre: string | null | undefined): string {
  if (!nombre) return '?';
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase() || '?';
}

const formatoMoneda = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

/* ---------------- ZONA 1: tarjetas KPI ---------------- */

interface TarjetaKpiProps {
  label: string;
  value: string | number;
  indicador?: string;
  icono: React.ComponentType<{ className?: string }>;
  gradiente: string;
  onClick: () => void;
}

function TarjetaKpi({ label, value, indicador, icono: Icono, gradiente, onClick }: TarjetaKpiProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`animate-in fade-in slide-in-from-bottom-2 duration-500 w-full cursor-pointer rounded-xl bg-gradient-to-br ${gradiente} p-5 text-left shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
    >
      <div className="flex items-center gap-4">
        <Icono className="h-12 w-12 shrink-0 text-white opacity-80" />
        <div className="min-w-0">
          <p className="truncate text-3xl font-bold leading-tight text-white">{value}</p>
          <p className="text-sm text-white/80">{label}</p>
          {indicador ? <p className="mt-0.5 text-xs text-white/60">{indicador}</p> : null}
        </div>
      </div>
    </button>
  );
}

/* ---------------- ZONA 2: timeline actividad ---------------- */

interface Evento {
  id: string;
  usuario: string;
  accion: string;
  ubicacion: string;
  detalle: string;
  timestamp: string;
  colorPunto: string;
  colorCirculo: string;
  inicial: string;
}

function EventoTimeline({ evento, esUltimo }: { evento: Evento; esUltimo: boolean }) {
  return (
    <li className={`relative pl-10 animate-in fade-in duration-500 ${esUltimo ? '' : 'pb-6'}`}>
      <span
        className={`absolute left-[5px] top-1.5 z-10 h-3 w-3 rounded-full ring-4 ring-background ${evento.colorPunto}`}
      />
      <div className="flex items-start gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${evento.colorCirculo}`}
          title={evento.usuario}
        >
          {evento.inicial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-foreground">
            <span className="font-semibold">{evento.usuario}</span>{' '}
            <span className="text-muted-foreground">{evento.accion}</span>{' '}
            <span className="font-medium">{evento.ubicacion}</span>
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{evento.detalle}</p>
        </div>
        <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
          {evento.timestamp}
        </span>
      </div>
    </li>
  );
}

/* ---------------- componente principal ---------------- */

function Dashboard() {
  const navigate = useNavigate();
  const { userId } = Route.useLoaderData();
  const { data } = useSuspenseQuery(inventarioQueryOptions(userId));
  const { permisos } = useMyProfile();
  const ver = data.puedeVerMovimientos && permisos?.puede_ver_movimientos === true;

  const productosActivos = data.productos.filter((p) => p.activo).length;
  const ubicacionesActivas = data.ubicaciones.filter((u) => u.activo).length;

  const hace30Dias = new Date();
  hace30Dias.setDate(hace30Dias.getDate() - 30);
  const movimientosMes = data.movimientos.filter(
    (m) => new Date(m.fecha_movimiento) >= hace30Dias,
  ).length;

  // Valor real del inventario: SUM(cantidad * precio_unitario) sobre stock × productos
  const valorInventario = data.stock.reduce((total, s) => {
    const precio = data.productos.find((p) => p.id === s.id_producto)?.precio_unitario;
    return precio != null ? total + s.cantidad * precio : total;
  }, 0);

  // Cantidad ANTERIOR por (producto, ubicación) reconstruida desde los movimientos.
  // data.movimientos llegan ordenados desc por fecha (cargarInventario), así que al
  // recorrerlos de más antiguo a más reciente, `actual` es el stock justo antes del
  // movimiento y `nuevo` el resultado aplicado (que será el "anterior" del siguiente).
  const previoMovimiento = new Map<string, number>();
  const aplicadoMovimiento = new Map<string, number>();
  for (let i = data.movimientos.length - 1; i >= 0; i--) {
    const m = data.movimientos[i]!;
    const clave = `${m.id_producto}|${m.id_ubicacion}`;
    const actual = aplicadoMovimiento.get(clave) ?? 0;
    let nuevo = actual;
    if (m.tipo === 'entrada' || m.tipo === 'reposicion') nuevo = actual + m.cantidad;
    else if (m.tipo === 'salida') nuevo = Math.max(actual - m.cantidad, 0);
    else if (m.tipo === 'ajuste') nuevo = m.cantidad;
    previoMovimiento.set(m.id, actual);
    aplicadoMovimiento.set(clave, nuevo);
  }

  const eventos: Evento[] = data.movimientos.slice(0, 6).map((m) => {
    const producto = data.productos.find((p) => p.id === m.id_producto);
    const ubicacion = data.ubicaciones.find((u) => u.id === m.id_ubicacion);
    const perfil = data.perfiles.find((pf) => pf.id === m.realizado_por);
    const tipo = m.notas?.toLowerCase().includes('traslado') ? 'traslado' : m.tipo;
    const anterior =
      previoMovimiento.get(m.id) ??
      (data.stock.find((s) => s.id_producto === m.id_producto && s.id_ubicacion === m.id_ubicacion)
        ?.cantidad ?? m.cantidad);
    const nueva =
      m.tipo === 'ajuste' || m.tipo === 'salida' || m.tipo === 'entrada' || m.tipo === 'reposicion'
        ? (aplicadoMovimiento.get(`${m.id_producto}|${m.id_ubicacion}`) ?? anterior + m.cantidad)
        : anterior;
    return {
      id: m.id,
      usuario: perfil?.nombre_completo ?? 'Usuario',
      accion: ACCION_TIPO[tipo] ?? tipo,
      ubicacion: ubicacion?.nombre ?? 'Ubicación inactiva',
      detalle: `${producto?.nombre ?? 'Producto no disponible'}: ${anterior} → ${nueva}`,
      timestamp: timestampRelativo(m.fecha_movimiento),
      colorPunto: COLOR_PUNTO[tipo] ?? 'bg-gray-400',
      colorCirculo: COLOR_CIRCULO[tipo] ?? 'bg-gray-100 text-gray-700',
      inicial: iniciales(perfil?.nombre_completo),
    };
  });

  return (
    <>
      <PageHeader title="Dashboard" />

      {/* ZONA 1: KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TarjetaKpi
          label="Productos"
          value={productosActivos}
          indicador={`${data.productos.length} totales registrados`}
          icono={Package}
          gradiente="from-blue-600 to-blue-800"
          onClick={() => navigate({ to: '/productos' })}
        />
        <TarjetaKpi
          label="Ubicaciones"
          value={ubicacionesActivas}
          indicador="pasillos, armarios y reservas"
          icono={MapPin}
          gradiente="from-emerald-600 to-emerald-800"
          onClick={() => navigate({ to: '/ubicaciones' })}
        />
        <TarjetaKpi
          label="Movimientos del mes"
          value={ver ? movimientosMes : '—'}
          indicador="últimos 30 días"
          icono={ArrowLeftRight}
          gradiente="from-amber-600 to-amber-800"
          onClick={() => navigate({ to: '/movimientos' })}
        />
        <TarjetaKpi
          label="Valor inventario"
          value={formatoMoneda.format(valorInventario)}
          indicador="cantidad × precio unitario"
          icono={DollarSign}
          gradiente="from-purple-600 to-purple-800"
          onClick={() => navigate({ to: '/productos' })}
        />
      </div>

      {/* ZONA 2: Timeline actividad reciente */}
      <section className="mt-6 animate-in fade-in slide-in-from-bottom-2 rounded-xl border bg-card p-5 shadow-sm duration-700">
        <h2 className="mb-4 text-lg font-semibold">Actividad reciente</h2>
        {!ver ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No tienes permiso para ver movimientos.
          </p>
        ) : eventos.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Aún no hay actividad.</p>
        ) : (
          <>
            <ol className="relative space-y-0 border-l-2 border-muted">
              {eventos.map((e, i) => (
                <EventoTimeline key={e.id} evento={e} esUltimo={i === eventos.length - 1} />
              ))}
            </ol>
            <div className="mt-4 border-t pt-3 text-right">
              <button
                type="button"
                onClick={() => navigate({ to: '/movimientos' })}
                className="cursor-pointer text-sm font-medium text-primary hover:underline"
              >
                Ver todos los movimientos \u2192
              </button>
            </div>
          </>
        )}
      </section>
    </>
  );
}
