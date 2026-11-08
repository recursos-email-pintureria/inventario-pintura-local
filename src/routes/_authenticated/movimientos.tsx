import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Eye,
  FileDown,
  Plus,
  Repeat,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { KPICard, KpiData } from "@/components/ui/kpi-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { crearMovimiento, getMovimientos, getProductos, getUbicaciones } from "@/lib/inventario";
import type { MovimientoDetallado } from "@/lib/tipos";
import { useMyProfile } from "@/hooks/usePermissions";

export const Route = createFileRoute("/_authenticated/movimientos")({
  component: MovimientosPage,
});

// ============================================================================
// HELPERS DE PRESENTACIÓN
// ============================================================================

const TIPO_INFO: Record<
  MovimientoDetallado["tipo"],
  { label: string; signo: string; badge: string; texto: string }
> = {
  entrada: {
    label: "Entrada",
    signo: "+",
    badge: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30",
    texto: "text-emerald-600 dark:text-emerald-400",
  },
  salida: {
    label: "Salida",
    signo: "-",
    badge: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30",
    texto: "text-rose-600 dark:text-rose-400",
  },
  ajuste: {
    label: "Ajuste",
    signo: "=",
    badge: "bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-500/30",
    texto: "text-amber-700 dark:text-amber-300",
  },
  reposicion: {
    label: "Reposición (fija stock)",
    signo: "=",
    badge: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30",
    texto: "text-blue-600 dark:text-blue-400",
  },
};

function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

function MovimientosPage() {
  const queryClient = useQueryClient();
  const { can } = useMyProfile();
  const puedeExportar = can("puede_exportar_movimientos");

  // 🔌 Consultas reales (refresco automático cada 30s = "Tiempo Real")
  const { data: movimientos = [], isLoading } = useQuery({
    queryKey: ["movimientos"],
    queryFn: getMovimientos,
    refetchInterval: 30_000,
  });
  const { data: productos = [] } = useQuery({
    queryKey: ["productos"],
    queryFn: getProductos,
  });
  const { data: ubicaciones = [] } = useQuery({
    queryKey: ["ubicaciones"],
    queryFn: getUbicaciones,
  });

  // 🔌 Mutación: Regla de Oro (INSERT en movimientos → trigger actualiza stock)
  const mutationCrear = useMutation({
    mutationFn: crearMovimiento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movimientos"] });
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      toast.success("Movimiento registrado: stock actualizado por el trigger");
    },
    onError: (e: Error) => toast.error(e.message || "Error al registrar el movimiento"),
  });

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(8);

  // Modales
  const [modalNuevo, setModalNuevo] = useState(false);
  const [detalle, setDetalle] = useState<MovimientoDetallado | null>(null);

  // Formulario nuevo movimiento
  const [formTipo, setFormTipo] = useState<MovimientoDetallado["tipo"]>("entrada");
  const [formProducto, setFormProducto] = useState("");
  const [formUbicacion, setFormUbicacion] = useState("");
  const [formCantidad, setFormCantidad] = useState<number | "">("");
  const [formMotivo, setFormMotivo] = useState("");

  // ============================================================================
  // FILTRADO
  // ============================================================================
  const movimientosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    const ahora = Date.now();
    const dias =
      filtroPeriodo === "hoy"
        ? 0
        : filtroPeriodo === "7d"
          ? 7
          : filtroPeriodo === "30d"
            ? 30
            : null;

    return movimientos.filter((m) => {
      const coincideTexto =
        !q ||
        (m.producto?.nombre ?? "").toLowerCase().includes(q) ||
        (m.producto?.sku ?? "").toLowerCase().includes(q) ||
        (m.usuario?.nombre ?? "").toLowerCase().includes(q) ||
        (m.ubicacion?.codigo ?? "").toLowerCase().includes(q) ||
        (m.motivo ?? "").toLowerCase().includes(q);

      const coincideTipo = filtroTipo === "todos" || m.tipo === filtroTipo;

      let coincidePeriodo = true;
      if (dias !== null) {
        const f = new Date(m.fecha).getTime();
        if (dias === 0) {
          coincidePeriodo = new Date(m.fecha).toDateString() === new Date().toDateString();
        } else {
          coincidePeriodo = ahora - f <= dias * 24 * 60 * 60 * 1000;
        }
      }

      return coincideTexto && coincideTipo && coincidePeriodo;
    });
  }, [movimientos, busqueda, filtroTipo, filtroPeriodo]);

  // Paginación
  const totalPaginas = Math.ceil(movimientosFiltrados.length / porPagina) || 1;
  const paginados = useMemo(() => {
    const inicio = (pagina - 1) * porPagina;
    return movimientosFiltrados.slice(inicio, inicio + porPagina);
  }, [movimientosFiltrados, pagina, porPagina]);

  // ============================================================================
  // KPIs REALES
  // ============================================================================
  const kpisData: KpiData[] = useMemo(() => {
    const entradas = movimientos.filter((m) => m.tipo === "entrada").length;
    const salidas = movimientos.filter((m) => m.tipo === "salida").length;
    const ajustesRepos = movimientos.filter(
      (m) => m.tipo === "ajuste" || m.tipo === "reposicion",
    ).length;
    const ultimos7 = movimientos.filter(
      (m) => Date.now() - new Date(m.fecha).getTime() <= 7 * 24 * 60 * 60 * 1000,
    ).length;

    return [
      {
        label: "Total Operaciones",
        value: movimientos.length,
        sublabel: `últimos 7 días: ${ultimos7}`,
        icon: <Repeat className="h-5 w-5" />,
        color: "amber",
      },
      {
        label: "Entradas",
        value: entradas,
        sublabel: "Recepción de proveedores",
        icon: <ArrowDownLeft className="h-5 w-5" />,
        color: "emerald",
      },
      {
        label: "Salidas",
        value: salidas,
        sublabel: "Ventas y despachos",
        icon: <ArrowUpRight className="h-5 w-5" />,
        color: "rose",
      },
      {
        label: "Ajustes y Reposiciones",
        value: ajustesRepos,
        sublabel: "Regularizaciones",
        icon: <SlidersHorizontal className="h-5 w-5" />,
        color: "blue",
      },
    ];
  }, [movimientos]);

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroTipo("todos");
    setFiltroPeriodo("todos");
    setPagina(1);
  };

  const abrirModalNuevo = () => {
    setFormTipo("entrada");
    setFormProducto("");
    setFormUbicacion("");
    setFormCantidad("");
    setFormMotivo("");
    setModalNuevo(true);
  };

  const handleCrear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProducto || !formUbicacion) {
      toast.error("Selecciona producto y ubicación");
      return;
    }
    const cant = Number(formCantidad);
    if (formCantidad === "" || isNaN(cant) || cant < 0) {
      toast.error("Introduce una cantidad válida");
      return;
    }
    if (formTipo !== "ajuste" && cant <= 0) {
      toast.error("La cantidad debe ser mayor que 0");
      return;
    }

    mutationCrear.mutate({
      id_producto: formProducto,
      id_ubicacion: formUbicacion,
      tipo: formTipo,
      cantidad: cant,
      motivo: formMotivo,
    });
    setModalNuevo(false);
  };

  // Export CSV real
  const exportarCSV = () => {
    const head = "Fecha,Tipo,Producto,SKU,Cantidad,Ubicación,Usuario,Motivo\n";
    const rows = movimientosFiltrados
      .map((m) =>
        [
          `${fmtFecha(m.fecha)} ${fmtHora(m.fecha)}`,
          TIPO_INFO[m.tipo].label,
          m.producto?.nombre ?? "-",
          m.producto?.sku ?? "-",
          `${TIPO_INFO[m.tipo].signo}${m.cantidad}`,
          m.ubicacion?.codigo ?? "-",
          m.usuario?.nombre ?? "-",
          m.motivo ?? "-",
        ]
          .map((c) => `"${String(c).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([head + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `movimientos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado con datos reales");
  };

  // Export PDF real
  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Historial de Movimientos - Inventario LM", 14, 16);
    doc.setFontSize(9);
    doc.text(`Generado: ${new Date().toLocaleString("es-ES")}`, 14, 22);
    doc.text(`Registros: ${movimientosFiltrados.length}`, 14, 27);
    autoTable(doc, {
      startY: 32,
      head: [["Fecha", "Tipo", "Producto", "SKU", "Cant.", "Ubicación", "Usuario", "Motivo"]],
      body: movimientosFiltrados.map((m) => [
        `${fmtFecha(m.fecha)} ${fmtHora(m.fecha)}`,
        TIPO_INFO[m.tipo].label,
        m.producto?.nombre ?? "-",
        m.producto?.sku ?? "-",
        `${TIPO_INFO[m.tipo].signo}${m.cantidad}`,
        m.ubicacion?.codigo ?? "-",
        m.usuario?.nombre ?? "-",
        m.motivo ?? "-",
      ]),
      styles: { fontSize: 7.5 },
      headStyles: { fillColor: [210, 77, 9] },
    });
    doc.save(`movimientos_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("PDF exportado con datos reales");
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="min-h-screen bg-background pb-16">
      {/* HEADER */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                <span>INVENTARIO LM</span>
                <span>/</span>
                <span>OPERACIONES</span>
                <span>/</span>
                <span className="text-[#D24D09] font-semibold">MOVIMIENTOS</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Historial de Movimientos
                </h1>
                <Badge
                  variant="outline"
                  className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 font-medium px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  Tiempo Real
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-start md:self-auto">
              {puedeExportar && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportarPDF}
                    className="text-xs h-9 px-3.5 border-border text-foreground hover:bg-muted gap-1.5"
                  >
                    <FileDown className="w-4 h-4 text-muted-foreground" />
                    Exportar PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportarCSV}
                    className="text-xs h-9 px-3.5 border-border text-foreground hover:bg-muted gap-1.5"
                  >
                    <Download className="w-4 h-4 text-muted-foreground" />
                    Exportar CSV
                  </Button>
                </>
              )}
              <Button
                size="sm"
                onClick={abrirModalNuevo}
                className="bg-[#D24D09] hover:bg-[#b83f05] text-white text-xs font-semibold h-9 px-4 gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Nuevo Movimiento
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpisData.map((kpi) => (
            <KPICard key={kpi.label} data={kpi} />
          ))}
        </div>

        {/* FILTROS */}
        <div className="bg-card p-3 rounded-xl border border-border flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagina(1);
              }}
              placeholder="Buscar SKU, producto o responsable..."
              className="pl-9 h-10 bg-card border-border text-sm"
            />
          </div>

          <Select
            value={filtroTipo}
            onValueChange={(v) => {
              setFiltroTipo(v);
              setPagina(1);
            }}
          >
            <SelectTrigger className="w-[150px] h-10 bg-card border-border text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Tipo: Todos</SelectItem>
              <SelectItem value="entrada">Entradas</SelectItem>
              <SelectItem value="salida">Salidas</SelectItem>
              <SelectItem value="reposicion">Reposiciones</SelectItem>
              <SelectItem value="ajuste">Ajustes</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filtroPeriodo}
            onValueChange={(v) => {
              setFiltroPeriodo(v);
              setPagina(1);
            }}
          >
            <SelectTrigger className="w-[160px] h-10 bg-card border-border text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Período: Todos</SelectItem>
              <SelectItem value="hoy">Hoy</SelectItem>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={limpiarFiltros}
            className="text-xs text-muted-foreground gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpiar
          </Button>
        </div>

        {/* TABLA */}
        <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
          <Table>
            <TableHeader className="bg-muted/80 border-b border-border">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Fecha / Hora
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Tipo
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Producto & SKU
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Cantidad
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Ubicación
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Usuario
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Motivo
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    Cargando movimientos desde Supabase...
                  </TableCell>
                </TableRow>
              ) : paginados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    No hay movimientos con los filtros seleccionados.
                  </TableCell>
                </TableRow>
              ) : (
                paginados.map((m) => {
                  const info = TIPO_INFO[m.tipo];
                  return (
                    <TableRow key={m.id} className="hover:bg-muted/80 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground">
                            {fmtHora(m.fecha)}
                          </span>
                          <span className="text-[11px] text-muted-foreground">{fmtFecha(m.fecha)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${info.badge} text-xs font-medium`}>
                          {info.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-foreground truncate max-w-[220px]">
                            {m.producto?.nombre ?? "Producto eliminado"}
                          </span>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {m.producto?.sku ?? "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-bold ${info.texto}`}>
                          {info.signo}
                          {m.cantidad}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-foreground">
                        {m.ubicacion?.codigo ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-foreground">
                        {m.usuario?.nombre ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                        {m.motivo ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetalle(m)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <div className="space-y-3 md:hidden">
          {isLoading ? (
            <div className="rounded-xl border bg-card p-5 text-center text-sm text-muted-foreground">
              Cargando movimientos...
            </div>
          ) : paginados.length === 0 ? (
            <div className="rounded-xl border bg-card p-5 text-center text-sm text-muted-foreground">
              No hay movimientos con los filtros seleccionados.
            </div>
          ) : (
            paginados.map((movement) => {
              const info = TIPO_INFO[movement.tipo];
              return (
                <article
                  key={movement.id}
                  className="space-y-3 rounded-xl border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        {movement.producto?.nombre ?? "Producto eliminado"}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {movement.producto?.sku ?? "—"}
                      </p>
                    </div>
                    <Badge variant="outline" className={`${info.badge} shrink-0 text-xs`}>
                      {info.label}
                    </Badge>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Fecha</dt>
                      <dd className="mt-0.5 font-medium text-foreground">
                        {fmtFecha(movement.fecha)} · {fmtHora(movement.fecha)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Cantidad</dt>
                      <dd className={`mt-0.5 font-semibold ${info.texto}`}>
                        {info.signo}
                        {movement.cantidad}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Ubicación</dt>
                      <dd className="mt-0.5 font-medium text-foreground">
                        {movement.ubicacion?.codigo ?? "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Usuario</dt>
                      <dd className="mt-0.5 truncate font-medium text-foreground">
                        {movement.usuario?.nombre ?? "—"}
                      </dd>
                    </div>
                    {movement.motivo && (
                      <div className="col-span-2">
                        <dt className="text-xs text-muted-foreground">Motivo</dt>
                        <dd className="mt-0.5 text-foreground">{movement.motivo}</dd>
                      </div>
                    )}
                  </dl>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setDetalle(movement)}
                  >
                    <Eye className="h-4 w-4" />
                    Ver detalle
                  </Button>
                </article>
              );
            })
          )}
        </div>

        {/* PAGINACIÓN */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            Mostrando{" "}
            <strong className="text-foreground">
              {movimientosFiltrados.length === 0 ? 0 : (pagina - 1) * porPagina + 1}
            </strong>{" "}
            a{" "}
            <strong className="text-foreground">
              {Math.min(pagina * porPagina, movimientosFiltrados.length)}
            </strong>{" "}
            de <strong className="text-foreground">{movimientosFiltrados.length}</strong> movimientos
          </span>

          <div className="flex items-center gap-1.5">
            <Select
              value={String(porPagina)}
              onValueChange={(v) => {
                setPorPagina(Number(v));
                setPagina(1);
              }}
            >
              <SelectTrigger className="w-[70px] h-8 bg-card border-border text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8">8</SelectItem>
                <SelectItem value="16">16</SelectItem>
                <SelectItem value="32">32</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="h-8 text-xs border-border"
            >
              Anterior
            </Button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
              .slice(0, 7)
              .map((n) => (
                <Button
                  key={n}
                  variant={pagina === n ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPagina(n)}
                  className={`h-8 w-8 p-0 text-xs font-semibold ${
                    pagina === n
                      ? "bg-[#D24D09] hover:bg-[#b83f05] text-white border-transparent"
                      : "border-border text-foreground"
                  }`}
                >
                  {n}
                </Button>
              ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas}
              className="h-8 text-xs border-border"
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>

      {/* MODAL: NUEVO MOVIMIENTO */}
      <Dialog open={modalNuevo} onOpenChange={setModalNuevo}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Registrar Movimiento
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              El stock se actualizará automáticamente mediante el trigger{" "}
              <code className="bg-muted px-1 rounded">actualizar_stock</code>. Nunca se escribe
              directamente en la tabla stock.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCrear} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Tipo *</Label>
                <Select
                  value={formTipo}
                  onValueChange={(v) => setFormTipo(v as MovimientoDetallado["tipo"])}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada (+ stock)</SelectItem>
                    <SelectItem value="salida">Salida (− stock)</SelectItem>
                    <SelectItem value="reposicion">Reposición (fija el stock)</SelectItem>
                    <SelectItem value="ajuste">Ajuste (= stock absoluto)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  {formTipo === "ajuste" || formTipo === "reposicion"
                    ? "Stock objetivo *"
                    : "Cantidad *"}
                </Label>
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={formCantidad}
                  onChange={(e) =>
                    setFormCantidad(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder={
                    formTipo === "ajuste" || formTipo === "reposicion"
                      ? "Nuevo stock total"
                      : "Ej: 10"
                  }
                  className="h-9 text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Producto *</Label>
              <Select value={formProducto} onValueChange={setFormProducto}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Selecciona producto" />
                </SelectTrigger>
                <SelectContent className="max-h-[220px]">
                  {productos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} · {p.sku}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Ubicación *</Label>
              <Select value={formUbicacion} onValueChange={setFormUbicacion}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Selecciona ubicación" />
                </SelectTrigger>
                <SelectContent className="max-h-[220px]">
                  {ubicaciones.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.codigo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Motivo</Label>
              <Input
                value={formMotivo}
                onChange={(e) => setFormMotivo(e.target.value)}
                placeholder="Ej: Recepción proveedor, venta mostrador..."
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalNuevo(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#D24D09] hover:bg-[#b83f05] text-white text-xs"
                disabled={mutationCrear.isPending}
              >
                {mutationCrear.isPending ? "Registrando..." : "Registrar Movimiento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: DETALLE */}
      <Dialog open={Boolean(detalle)} onOpenChange={(open) => !open && setDetalle(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Detalle del Movimiento
            </DialogTitle>
          </DialogHeader>
          {detalle && (
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/50">
                <span className="text-muted-foreground">Tipo</span>
                <Badge variant="outline" className={`${TIPO_INFO[detalle.tipo].badge} text-xs`}>
                  {TIPO_INFO[detalle.tipo].label}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/50">
                <span className="text-muted-foreground">Cantidad</span>
                <span className={`font-bold ${TIPO_INFO[detalle.tipo].texto}`}>
                  {TIPO_INFO[detalle.tipo].signo}
                  {detalle.cantidad}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/50">
                <span className="text-muted-foreground">Fecha</span>
                <span className="font-semibold text-foreground">
                  {fmtFecha(detalle.fecha)} · {fmtHora(detalle.fecha)}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/50">
                <span className="text-muted-foreground">Producto</span>
                <span className="font-semibold text-foreground text-right">
                  {detalle.producto?.nombre ?? "—"}
                  <span className="block font-mono text-[10px] text-muted-foreground">
                    {detalle.producto?.sku ?? ""}
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/50">
                <span className="text-muted-foreground">Ubicación</span>
                <span className="font-semibold text-foreground">
                  {detalle.ubicacion?.codigo ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/50">
                <span className="text-muted-foreground">Usuario</span>
                <span className="font-semibold text-foreground">
                  {detalle.usuario?.nombre ?? "—"}
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-border bg-muted/50">
                <span className="text-muted-foreground block mb-1">Motivo</span>
                <span className="font-semibold text-foreground">{detalle.motivo ?? "—"}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDetalle(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
