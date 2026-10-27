import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  ArrowLeftRight,
  Warehouse,
  Archive,
  Layers,
  Package,
  Shuffle,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  Search,
  Camera,
  RotateCcw,
  LayoutGrid,
  List,
  FileText,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  Edit3,
  Eye,
  Scale,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { KPICard, KpiData } from "@/components/ui/kpi-card";
import { BarcodeScanner } from "@/components/ui/barcode-scanner";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  getSecciones,
  getUbicaciones,
  crearUbicacion,
  actualizarUbicacion,
  desactivarUbicacion,
} from "@/lib/ubicaciones";
import type { Ubicacion } from "@/lib/ubicaciones";
import { getProductos } from "@/lib/inventario";
import type { Producto } from "@/lib/tipos";

export const Route = createFileRoute("/_authenticated/ubicaciones")({
  component: UbicacionesPage,
});

// ============================================================================
// TIPOS DE UBICACIÓN
// ============================================================================

const TIPO_INFO: Record<
  Ubicacion["tipo"],
  { label: string; icon: React.ReactNode; badge: string; color: string }
> = {
  seccion: {
    label: "Sección",
    icon: <Building2 className="w-4 h-4" />,
    badge: "bg-indigo-50 text-indigo-800 border-indigo-200",
    color: "indigo",
  },
  pasillo: {
    label: "Pasillo",
    icon: <ArrowLeftRight className="w-4 h-4" />,
    badge: "bg-blue-50 text-blue-800 border-blue-200",
    color: "blue",
  },
  reserva: {
    label: "Reserva",
    icon: <Warehouse className="w-4 h-4" />,
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    color: "slate",
  },
  armario: {
    label: "Armario",
    icon: <Archive className="w-4 h-4" />,
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    color: "emerald",
  },
  alto: {
    label: "Alto",
    icon: <Layers className="w-4 h-4" />,
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    color: "amber",
  },
  caja: {
    label: "Caja",
    icon: <Package className="w-4 h-4" />,
    badge: "bg-rose-50 text-rose-800 border-rose-200",
    color: "rose",
  },
  cross: {
    label: "Cross",
    icon: <Shuffle className="w-4 h-4" />,
    badge: "bg-purple-50 text-purple-800 border-purple-200",
    color: "purple",
  },
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

function UbicacionesPage() {
  const queryClient = useQueryClient();

  // 🔌 Consultas reales
  const { data: secciones = [], isLoading: cargandoSecciones } = useQuery({
    queryKey: ["secciones"],
    queryFn: getSecciones,
  });

  const { data: ubicaciones = [], isLoading: cargandoUbicaciones } = useQuery({
    queryKey: ["ubicaciones"],
    queryFn: getUbicaciones,
  });

  const { data: productos = [] } = useQuery({
    queryKey: ["productos"],
    queryFn: getProductos,
  });

  // Vista: árbol o lista
  const [vista, setVista] = useState<"arbol" | "lista">("arbol");
  const [colapsado, setColapsado] = useState(false);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<Ubicacion["tipo"] | "todos">("todos");

  // Modal dinámico
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalModo, setModalModo] = useState<"crear" | "editar" | "ver">("crear");
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<Ubicacion | null>(null);

  // Expandir niveles
  const [expandirNivel, setExpandirNivel] = useState<Set<string>>(new Set());

  // Scanner
  const [scannerOpen, setScannerOpen] = useState(false);

  // Formulario
  const [formTipo, setFormTipo] = useState<Ubicacion["tipo"]>("pasillo");
  const [formNombre, setFormNombre] = useState("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [formPadre, setFormPadre] = useState("");
  const [formPosicionLateral, setFormPosicionLateral] = useState("");
  const [formPosicionLongitudinal, setFormPosicionLongitudinal] = useState("");
  const [formNumero, setFormNumero] = useState<number | "">("");

  // Desactivar
  const [ubicacionADesactivar, setUbicacionADesactivar] = useState<Ubicacion | null>(null);

  // ============================================================================
  // MUTACIONES
  // ============================================================================
  const mutationCrear = useMutation({
    mutationFn: crearUbicacion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ubicaciones"] });
      toast.success("Ubicación creada correctamente");
    },
    onError: (e: Error) => toast.error(e.message || "Error al crear"),
  });

  const mutationActualizar = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Ubicacion> }) =>
      actualizarUbicacion(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ubicaciones"] });
      toast.success("Ubicación actualizada correctamente");
    },
    onError: (e: Error) => toast.error(e.message || "Error al actualizar"),
  });

  const mutationDesactivar = useMutation({
    mutationFn: desactivarUbicacion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ubicaciones"] });
      toast.success("Ubicación desactivada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const abrirModalCrear = () => {
    setModalModo("crear");
    setUbicacionSeleccionada(null);
    setFormTipo("pasillo");
    setFormNombre("");
    setFormDescripcion("");
    setFormPadre("");
    setFormPosicionLateral("");
    setFormPosicionLongitudinal("");
    setFormNumero("");
    setModalAbierto(true);
  };

  const abrirModalEditar = (ubicacion: Ubicacion) => {
    setModalModo("editar");
    setUbicacionSeleccionada(ubicacion);
    setFormTipo(ubicacion.tipo);
    setFormNombre(ubicacion.nombre);
    setFormDescripcion(ubicacion.descripcion || "");
    setFormPadre(ubicacion.id_ubicacion_padre || "");
    setFormPosicionLateral(ubicacion.posicion_lateral || "");
    setFormPosicionLongitudinal(ubicacion.posicion_longitudinal || "");
    setFormNumero(ubicacion.numero || "");
    setModalAbierto(true);
  };

  const abrirModalVer = (ubicacion: Ubicacion) => {
    setModalModo("ver");
    setUbicacionSeleccionada(ubicacion);
    setModalAbierto(true);
  };

  const handleCrear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    mutationCrear.mutate({
      nombre: formNombre.trim(),
      tipo: formTipo,
      descripcion: formDescripcion.trim() || null,
      id_ubicacion_padre: formPadre || null,
      posicion_lateral: formPosicionLateral || null,
      posicion_longitudinal: formPosicionLongitudinal || null,
      numero: formNumero === "" ? null : Number(formNumero),
    });
    setModalAbierto(false);
  };

  const handleEditar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ubicacionSeleccionada) return;
    mutationActualizar.mutate({
      id: ubicacionSeleccionada.id,
      updates: {
        nombre: formNombre.trim(),
        tipo: formTipo,
        descripcion: formDescripcion.trim() || null,
        posicion_lateral: formPosicionLateral || null,
        posicion_longitudinal: formPosicionLongitudinal || null,
        numero: formNumero === "" ? null : Number(formNumero),
      },
    });
    setModalAbierto(false);
  };

  const confirmarDesactivar = () => {
    if (!ubicacionADesactivar) return;
    mutationDesactivar.mutate(ubicacionADesactivar.id);
    setUbicacionADesactivar(null);
  };

  const toggleExpandir = (id: string) => {
    setExpandirNivel((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  };

  const colapsarTodo = () => {
    setExpandirNivel(new Set());
    setColapsado(true);
    setTimeout(() => setColapsado(false), 100);
  };

  // ============================================================================
  // FILTRADO
  // ============================================================================
  const ubicacionesFiltradas = useMemo(() => {
    return ubicaciones.filter((u) => {
      const q = busqueda.toLowerCase().trim();
      const coincideTexto =
        !q ||
        u.nombre.toLowerCase().includes(q) ||
        (u.descripcion || "").toLowerCase().includes(q);
      const coincideTipo = filtroTipo === "todos" || u.tipo === filtroTipo;
      return coincideTexto && coincideTipo;
    });
  }, [ubicaciones, busqueda, filtroTipo]);

  // ============================================================================
  // KPIs
  // ============================================================================
  const kpisData: KpiData[] = useMemo(() => {
    const total = ubicaciones.length;
    const seccionesCount = secciones.length;
    const pasillosCount = ubicaciones.filter((u) => u.tipo === "pasillo").length;
    const posicionesCount = ubicaciones.filter((u) =>
      ["armario", "alto", "caja", "cross"].includes(u.tipo)
    ).length;

    return [
      {
        label: "Topología de Nave",
        value: total,
        sublabel: `${seccionesCount} Secciones • ${pasillosCount} Pasillos • ${posicionesCount} Posiciones`,
        icon: <Building2 className="h-5 w-5" />,
        color: "blue",
      },
      {
        label: "Capacidad Ocupada",
        value: 92,
        sublabel: "Capacidad crítica",
        alert: "Alerta: Pasillo B",
        icon: <AlertTriangle className="h-5 w-5" />,
        color: "rose",
      },
      {
        label: "Espacios Disponibles",
        value: 8,
        sublabel: "huecos libres",
        icon: <CheckCircle2 className="h-5 w-5" />,
        color: "emerald",
      },
    ];
  }, [secciones, ubicaciones]);

  // ============================================================================
  // EXPORT PDF
  // ============================================================================
  const exportarPDF = (ubicacion: Ubicacion) => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Ubicación: ${ubicacion.nombre}`, 14, 16);
    doc.setFontSize(10);
    doc.text(`Tipo: ${TIPO_INFO[ubicacion.tipo].label}`, 14, 22);
    doc.text(`Generado: ${new Date().toLocaleString("es-ES")}`, 14, 27);

    const productosEnUbicacion = productos.filter((p) => {
      // Simulación: en producción vendría de getStockPorUbicacion
      return true;
    });

    autoTable(doc, {
      startY: 32,
      head: [["SKU", "Producto", "Stock", "Unidad"]],
      body: productosEnUbicacion.map((p) => [
        p.sku || "-",
        p.nombre,
        String(p.stock_actual),
        p.unidad || "unid",
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [210, 77, 9] },
    });

    doc.save(`ubicacion_${ubicacion.nombre.replace(/\s+/g, "_")}.pdf`);
    toast.success("PDF exportado");
  };

  const exportarExcel = (ubicacion: Ubicacion) => {
    const head = "SKU,Producto,Stock,Unidad\n";
    const rows = productos
      .map((p) => `"${p.sku || ""}","${p.nombre}","${p.stock_actual}","${p.unidad || "unid"}"`)
      .join("\n");
    const blob = new Blob([head + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ubicacion_${ubicacion.nombre.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel exportado");
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* HEADER */}
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                <span>INVENTARIO LM</span>
                <span>/</span>
                <span>ALMACÉN</span>
                <span>/</span>
                <span className="text-[#D24D09] font-semibold">JERARQUÍA DE UBICACIONES</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Ubicaciones del Almacén
                </h1>
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium px-2.5 py-0.5 rounded-full text-xs"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse mr-1.5" />
                  {ubicaciones.length} Zonas Activas • 94% Ocupación
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                <Button
                  variant={vista === "arbol" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setVista("arbol")}
                  className={`text-xs h-8 gap-1.5 ${vista === "arbol" ? "bg-[#D24D09] text-white" : ""}`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Vista Árbol
                </Button>
                <Button
                  variant={vista === "lista" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setVista("lista")}
                  className={`text-xs h-8 gap-1.5 ${vista === "lista" ? "bg-[#D24D09] text-white" : ""}`}
                >
                  <List className="w-3.5 h-3.5" />
                  Vista Lista
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={colapsarTodo}
                className="text-xs h-9 px-3.5 border-slate-200 gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Colapsar todo
              </Button>
              <Button
                size="sm"
                onClick={abrirModalCrear}
                className="bg-[#D24D09] hover:bg-[#b83f05] text-white text-xs font-semibold h-9 px-4 gap-1.5"
              >
                <Plus className="w-4 h-4" />
                NUEVA UBICACIÓN
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpisData.map((kpi) => (
            <KPICard key={kpi.label} data={kpi} />
          ))}
        </div>

        {/* FILTROS */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar ubicación por nombre o código (ej. A1-01)..."
              className="pl-9 h-10 bg-white border-slate-200 text-sm"
            />
          </div>

          <Select
            value={filtroTipo}
            onValueChange={(v) => setFiltroTipo(v as Ubicacion["tipo"] | "todos")}
          >
            <SelectTrigger className="w-[200px] h-10 bg-white border-slate-200 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Tipo de ubicación (Todos)</SelectItem>
              <SelectItem value="seccion">Secciones</SelectItem>
              <SelectItem value="pasillo">Pasillos</SelectItem>
              <SelectItem value="reserva">Reservas</SelectItem>
              <SelectItem value="armario">Armarios</SelectItem>
              <SelectItem value="alto">Altos</SelectItem>
              <SelectItem value="caja">Cajas</SelectItem>
              <SelectItem value="cross">Cross</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ÁRBOL DE UBICACIONES */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-[#D24D09]" />
                Estructura Física del Almacén
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Terminal Nave Central • 3 Niveles
              </p>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
              EDITOR
            </Badge>
          </div>

          <div className="p-4 space-y-3">
            {cargandoSecciones || cargandoUbicaciones ? (
              <div className="p-8 text-center text-slate-500">
                Cargando ubicaciones desde Supabase...
              </div>
            ) : ubicacionesFiltradas.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No hay ubicaciones con los filtros seleccionados.
              </div>
            ) : (
              ubicacionesFiltradas
                .filter((u) => u.tipo === "pasillo" || u.tipo === "reserva")
                .map((nivel1) => {
                  const hijos = ubicacionesFiltradas.filter(
                    (u) => u.id_ubicacion_padre === nivel1.id
                  );
                  const estaExpandido = expandirNivel.has(nivel1.id);

                  return (
                    <div key={nivel1.id} className="border border-slate-200 rounded-lg overflow-hidden">
                      {/* NIVEL 1: Pasillo/Reserva */}
                      <div className="bg-slate-50 p-3 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpandir(nivel1.id)}
                          className="h-6 w-6 p-0 text-slate-500"
                        >
                          {estaExpandido ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                        <Badge variant="outline" className={`${TIPO_INFO[nivel1.tipo].badge} text-xs`}>
                          {TIPO_INFO[nivel1.tipo].icon}
                          <span className="ml-1">{nivel1.nombre}</span>
                        </Badge>
                        <span className="text-xs text-slate-500 ml-2">
                          {hijos.length} posiciones
                        </span>
                        <div className="ml-auto flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => abrirModalEditar(nivel1)}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setUbicacionADesactivar(nivel1)}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* NIVEL 2: Hijos */}
                      {estaExpandido && hijos.length > 0 && (
                        <div className="divide-y divide-slate-100">
                          {hijos.map((hijo) => (
                            <div
                              key={hijo.id}
                              className="p-3 hover:bg-slate-50/50 transition-colors flex items-center gap-3"
                            >
                              <div className="w-8" />
                              <Badge variant="outline" className={`${TIPO_INFO[hijo.tipo].badge} text-xs`}>
                                {TIPO_INFO[hijo.tipo].icon}
                                <span className="ml-1">{hijo.nombre}</span>
                              </Badge>
                              {hijo.posicion_lateral && (
                                <span className="text-[10px] text-slate-500">
                                  ({hijo.posicion_lateral})
                                </span>
                              )}
                              <div className="ml-auto flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => abrirModalVer(hijo)}
                                  className="h-7 text-xs gap-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  Ver Productos
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => exportarPDF(hijo)}
                                  className="h-7 text-xs gap-1"
                                >
                                  <FileText className="w-3 h-3" />
                                  PDF
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => exportarExcel(hijo)}
                                  className="h-7 text-xs gap-1"
                                >
                                  <FileSpreadsheet className="w-3 h-3" />
                                  Excel
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => abrirModalEditar(hijo)}
                                  className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setUbicacionADesactivar(hijo)}
                                  className="h-7 w-7 p-0 text-slate-500 hover:text-rose-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* MODAL DINÁMICO */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-[#D24D09]" />
              {modalModo === "crear" && "Nueva Ubicación en Almacén"}
              {modalModo === "editar" && `Editar: ${ubicacionSeleccionada?.nombre}`}
              {modalModo === "ver" && `Productos en: ${ubicacionSeleccionada?.nombre}`}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {modalModo === "crear" && "Crea una ubicación siguiendo la jerarquía"}
              {modalModo === "editar" && "Modifica los datos de la ubicación"}
              {modalModo === "ver" && "Productos almacenados en esta ubicación"}
            </DialogDescription>
          </DialogHeader>

          {modalModo === "ver" && ubicacionSeleccionada && (
            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700">
                    Productos en {ubicacionSeleccionada.nombre}
                  </span>
                  <Badge variant="outline" className={`${TIPO_INFO[ubicacionSeleccionada.tipo].badge} text-xs`}>
                    {TIPO_INFO[ubicacionSeleccionada.tipo].label}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  En producción aquí se mostrarán los productos reales desde Supabase
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportarPDF(ubicacionSeleccionada)}
                  className="flex-1 gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Exportar PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportarExcel(ubicacionSeleccionada)}
                  className="flex-1 gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Exportar Excel
                </Button>
              </div>
            </div>
          )}

          {(modalModo === "crear" || modalModo === "editar") && (
            <form
              onSubmit={modalModo === "crear" ? handleCrear : handleEditar}
              className="space-y-3.5"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Tipo *</Label>
                  <Select
                    value={formTipo}
                    onValueChange={(v) => setFormTipo(v as Ubicacion["tipo"])}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pasillo">Pasillo</SelectItem>
                      <SelectItem value="reserva">Reserva</SelectItem>
                      <SelectItem value="armario">Armario</SelectItem>
                      <SelectItem value="alto">Alto</SelectItem>
                      <SelectItem value="caja">Caja</SelectItem>
                      <SelectItem value="cross">Cross</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Número</Label>
                  <Input
                    type="number"
                    value={formNumero}
                    onChange={(e) =>
                      setFormNumero(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Nombre *</Label>
                <Input
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Descripción</Label>
                <Input
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {["armario", "alto", "caja", "cross"].includes(formTipo) && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Ubicación Padre *
                    </Label>
                    <Select value={formPadre} onValueChange={setFormPadre}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Selecciona pasillo o reserva" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {ubicaciones
                          .filter((u) => u.tipo === "pasillo" || u.tipo === "reserva")
                          .map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.nombre}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">
                        Lateral *
                      </Label>
                      <Select
                        value={formPosicionLateral}
                        onValueChange={setFormPosicionLateral}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="izquierda">Izquierda</SelectItem>
                          <SelectItem value="centro">Centro</SelectItem>
                          <SelectItem value="derecha">Derecha</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formTipo === "cross" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700">
                          Longitudinal *
                        </Label>
                        <Select
                          value={formPosicionLongitudinal}
                          onValueChange={setFormPosicionLongitudinal}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="frente">Frente</SelectItem>
                            <SelectItem value="medio">Medio</SelectItem>
                            <SelectItem value="fondo">Fondo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalAbierto(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-[#D24D09] hover:bg-[#b83f05] text-white text-xs"
                  disabled={
                    modalModo === "crear"
                      ? mutationCrear.isPending
                      : mutationActualizar.isPending
                  }
                >
                  {modalModo === "crear" ? "Guardar Ubicación" : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ALERT DIALOG: DESACTIVAR */}
      <AlertDialog
        open={Boolean(ubicacionADesactivar)}
        onOpenChange={(open) => !open && setUbicacionADesactivar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar ubicación?</AlertDialogTitle>
            <AlertDialogDescription>
              La ubicación «<strong>{ubicacionADesactivar?.nombre}</strong>» dejará de estar disponible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarDesactivar}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ESCÁNER */}
      <BarcodeScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={(code) => {
          toast.info(`Código escaneado: ${code}`);
          setBusqueda(code);
        }}
      />
    </div>
  );
}