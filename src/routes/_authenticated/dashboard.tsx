import { KPICard, KpiData } from "@/components/ui/kpi-card";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Package,
  AlertTriangle,
  Activity,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Edit3,
  Clock,
  ChevronRight,
  Filter,
  Plus,
  Loader2,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

// Imports de nuestras queries de Supabase
import { useDashboardKPIs, useMovimientosRecientes, type MovimientoReciente } from "@/lib/queries/dashboard";

// ============================================================
// TIPOS
// ============================================================
type TipoMovimiento = "entrada" | "salida" | "reposicion" | "ajuste";

// ============================================================
// DATOS MOCK (Solo para gráficos hasta la Fase 6)
// ============================================================
const actividad7Dias = [
  { dia: "Lun", entradas: 40, salidas: 25 },
  { dia: "Mar", entradas: 55, salidas: 35 },
  { dia: "Mié", entradas: 42, salidas: 40 },
  { dia: "Jue", entradas: 65, salidas: 48 },
  { dia: "Vie", entradas: 58, salidas: 50 },
  { dia: "Sáb", entradas: 28, salidas: 20 },
  { dia: "Dom", entradas: 15, salidas: 12 },
];

const topUbicaciones = [
  { nombre: "Pasillo A - Esmaltes", valor: 840, unidad: "gal", porcentaje: 92 },
  { nombre: "Pasillo B - Látex", valor: 715, unidad: "gal", porcentaje: 78 },
  { nombre: "Rack C - Solventes", valor: 520, unidad: "unid", porcentaje: 65 },
  { nombre: "Bodega 2 - Impermeab.", valor: 430, unidad: "gal", porcentaje: 54 },
  { nombre: "Estante D - Tintes", valor: 310, unidad: "unid", porcentaje: 42 },
];

const tipoMovimientoConfig = {
  entrada: {
    label: "Entrada",
    icon: <ArrowDownRight className="h-3 w-3" />,
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    cantidad: "text-emerald-700",
    prefijo: "+",
  },
  salida: {
    label: "Salida",
    icon: <ArrowUpRight className="h-3 w-3" />,
    badge: "bg-rose-100 text-rose-800 border-rose-200",
    cantidad: "text-rose-700",
    prefijo: "-",
  },
  reposicion: {
    label: "Reposición",
    icon: <RefreshCw className="h-3 w-3" />,
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    cantidad: "text-blue-700",
    prefijo: "+",
  },
  ajuste: {
    label: "Ajuste",
    icon: <Edit3 className="h-3 w-3" />,
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    cantidad: "text-amber-700",
    prefijo: "",
  },
};

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================
function MovementBadge({ tipo }: { tipo: TipoMovimiento }) {
  const config = tipoMovimientoConfig[tipo];
  return (
    <Badge variant="outline" className={`flex items-center gap-1.5 border ${config.badge} font-medium`}>
      {config.icon}
      {config.label}
    </Badge>
  );
}

function getFechaFormateada(): string {
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const hoy = new Date();
  return `${dias[hoy.getDay()]}, ${hoy.getDate()} de ${meses[hoy.getMonth()]}`;
}

// ============================================================
// COMPONENTE PRINCIPAL DE LA RUTA
// ============================================================
function DashboardComponent() {
  const [filtroTipo, setFiltroTipo] = useState<TipoMovimiento | "todos">("todos");
  const queryClient = useQueryClient();

  // 1. Obtener datos reales de Supabase
  const { data: kpis, isLoading: isKpisLoading } = useDashboardKPIs();
  const { data: movimientos, isLoading: isMovLoading } = useMovimientosRecientes();

  // 2. Transformar KPIs al formato que espera tu KPICard visual
  const kpisData: KpiData[] = [
    {
      label: "Total Productos",
      value: isKpisLoading ? "..." : (kpis?.totalProductos ?? 0).toLocaleString(),
      sublabel: "productos activos",
      trend: "100% cat.",
      trendUp: true,
      icon: <Package className="h-5 w-5" />,
      color: "amber",
    },
    {
      label: "Stock Bajo",
      value: isKpisLoading ? "..." : (kpis?.stockBajo ?? 0),
      sublabel: "Requiere atención",
      alert: (kpis && kpis.stockBajo > 0) ? `${kpis.stockBajo} críticos` : "0 críticos",
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "rose",
    },
    {
      label: "Movimientos Hoy",
      value: isKpisLoading ? "..." : (kpis?.movimientosHoy ?? 0),
      sublabel: "Prom. 72/d",
      trend: "En tiempo real",
      trendUp: true,
      icon: <Activity className="h-5 w-5" />,
      color: "emerald",
    },
    {
      label: "Ubicaciones Activas",
      value: isKpisLoading ? "..." : (kpis?.ubicacionesActivas ?? 0),
      sublabel: "Con stock > 0",
      trend: "Óptimo",
      icon: <MapPin className="h-5 w-5" />,
      color: "blue",
    },
  ];

  // 3. Filtrar movimientos (si aún están cargando, usamos array vacío)
  const movimientosFiltrados = (movimientos || []).filter(
    (m) => filtroTipo === "todos" || m.tipo === filtroTipo
  );

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">{getFechaFormateada()}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isKpisLoading || isMovLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isKpisLoading || isMovLoading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button size="sm" className="bg-amber-700 hover:bg-amber-800">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Movimiento
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpisData.map((kpi) => (
          <KPICard key={kpi.label} data={kpi} />
        ))}
      </div>

      {/* GRÁFICOS (Mantienen mock hasta Fase 6, pero no rompen la app) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">Actividad Últimos 7 Días</CardTitle>
                <p className="mt-1 text-sm text-slate-500">Flujo de entradas y salidas de almacén</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-emerald-600" /> Entradas</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-rose-600" /> Salidas</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={actividad7Dias} barGap={4} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="dia" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
                <Bar dataKey="entradas" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="salidas" fill="#e11d48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">Top 5 Ubicaciones</CardTitle>
                <p className="mt-1 text-sm text-slate-500">Zonas con mayor volumen de stock</p>
              </div>
              <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">Capacidad</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {topUbicaciones.map((ubicacion) => (
              <div key={ubicacion.nombre} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{ubicacion.nombre}</span>
                  <span className="text-xs text-slate-500">{ubicacion.valor} {ubicacion.unidad} ({ubicacion.porcentaje}%)</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-500 transition-all" style={{ width: `${ubicacion.porcentaje}%` }} />
                </div>
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Promedio Ocupación General</span>
              <span className="font-semibold text-amber-700">66.2% Óptimo</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLA DE MOVIMIENTOS (CONECTADA A SUPABASE) */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-700" />
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">Movimientos Recientes</CardTitle>
                <p className="mt-0.5 text-sm text-slate-500">Auditoría continua de despacho y recepción</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {(["todos", "entrada", "salida", "reposicion", "ajuste"] as const).map((tipo) => (
                <Button
                  key={tipo}
                  variant={filtroTipo === tipo ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFiltroTipo(tipo)}
                  className={filtroTipo === tipo ? "bg-amber-700 hover:bg-amber-800" : "border-slate-200"}
                >
                  {tipo === "todos" ? "Todos" : tipoMovimientoConfig[tipo].label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isMovLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-amber-700 mb-2" />
              <p className="text-sm">Cargando movimientos desde Supabase...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-200 bg-slate-50/50">
                      <TableHead className="text-xs font-semibold uppercase text-slate-500">Fecha</TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-slate-500">Producto & SKU</TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-slate-500">Tipo</TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-slate-500 text-right">Cantidad</TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-slate-500">Ubicación</TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-slate-500">Usuario</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimientosFiltrados.length > 0 ? (
                      movimientosFiltrados.map((mov) => {
                        const config = tipoMovimientoConfig[mov.tipo];
                        return (
                          <TableRow key={mov.id} className="border-b border-slate-100 transition-colors hover:bg-amber-50/50">
                            <TableCell className="font-mono text-xs text-slate-500">{mov.fecha}, {mov.hora.slice(0, 5)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                  {mov.usuarioInicial}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">{mov.producto}</p>
                                  <p className="font-mono text-xs text-slate-500">SKU: {mov.sku}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell><MovementBadge tipo={mov.tipo} /></TableCell>
                            <TableCell className={`text-right font-bold ${config.cantidad}`}>
                              {config.prefijo}{mov.cantidad} {mov.unidad}
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-slate-400" />
                                {mov.ubicacion}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-slate-700">{mov.usuario}</span>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                          No se encontraron movimientos {filtroTipo !== "todos" ? `de tipo "${filtroTipo}"` : "registrados"}.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                <span className="text-slate-600">
                  Mostrando <span className="font-semibold text-slate-900">{movimientosFiltrados.length}</span> movimientos
                </span>
                <Button variant="ghost" size="sm" className="text-amber-700 hover:bg-amber-50 hover:text-amber-800">
                  Ver todos los movimientos <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// EXPORTACIÓN OBLIGATORIA PARA TANSTACK ROUTER
// ============================================================
export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardComponent,
});