import { createFileRoute } from "@tanstack/react-router";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useState, useMemo } from "react";
import {
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownLeft,
  SlidersHorizontal,
  Download,
  Plus,
  Search,
  RotateCcw,
  Eye,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { KPICard } from "@/components/ui/kpi-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/movimientos")({
  component: MovimientosPage,
});

export type TipoMovimiento = "entrada" | "salida" | "reposicion" | "ajuste";

// Interfaz alineada con tu esquema real de Supabase + datos unidos para UI
export interface Movimiento {
  id: string;
  fecha: string;
  hora: string;
  tipo: TipoMovimiento;
  cantidad: number; // Siempre positivo en BD, el UI muestra el signo
  unidad: string;
  id_producto: string;
  producto_nombre: string;
  producto_sku: string;
  producto_categoria: string;
  id_ubicacion: string;
  ubicacion_nombre: string;
  usuario_id: string;
  usuario_nombre: string;
  motivo: string;
  swatch_color?: string;
}

const MOVIMIENTOS_MOCK: Movimiento[] = [
  {
    id: "mov-001",
    fecha: "24/10/2026",
    hora: "10:45",
    tipo: "entrada",
    cantidad: 24,
    unidad: "gal",
    id_producto: "p-lat-4001",
    producto_nombre: "Látex Extracubriente Blanco 20L",
    producto_sku: "LAT-4001-WHT",
    producto_categoria: "Pinturas de Exterior",
    id_ubicacion: "pas-a-01",
    ubicacion_nombre: "Pasillo A - A01",
    usuario_id: "u-javier",
    usuario_nombre: "Javier M.",
    motivo: "Recepción proveedor fábrica Titan según pedido programado",
    swatch_color: "#FFFFFF",
  },
  {
    id: "mov-002",
    fecha: "24/10/2026",
    hora: "10:15",
    tipo: "salida",
    cantidad: 10,
    unidad: "gal",
    id_producto: "p-esm-1020",
    producto_nombre: "Esmalte Sintético Negro Satinado 4L",
    producto_sku: "ESM-1020-BLK",
    producto_categoria: "Esmaltes & Sintéticos",
    id_ubicacion: "pas-b-03",
    ubicacion_nombre: "Pasillo B - B03",
    usuario_id: "u-elena",
    usuario_nombre: "Elena R.",
    motivo: "Venta directa en mostrador a profesional",
    swatch_color: "#1E293B",
  },
  {
    id: "mov-003",
    fecha: "24/10/2026",
    hora: "09:40",
    tipo: "ajuste",
    cantidad: 2.5,
    unidad: "gal",
    id_producto: "p-bas-9010",
    producto_nombre: "Fórmula Base Pastel Deep 10L",
    producto_sku: "BAS-9010-PST",
    producto_categoria: "Pinturas Especiales",
    id_ubicacion: "maq-tint",
    ubicacion_nombre: "Máq. Tintométrica B",
    usuario_id: "u-carlos",
    usuario_nombre: "Carlos D.",
    motivo: "Regularización tras calibración de máquina",
    swatch_color: "#CBD5E1",
  },
  {
    id: "mov-004",
    fecha: "24/10/2026",
    hora: "09:12",
    tipo: "reposicion",
    cantidad: 50,
    unidad: "unid",
    id_producto: "p-sel-3108",
    producto_nombre: "Primer Acrílico Sellador Antihumedad 5L",
    producto_sku: "SEL-3108-ACR",
    producto_categoria: "Pinturas & Selladores",
    id_ubicacion: "rack-c-02",
    ubicacion_nombre: "Rack C - C02",
    usuario_id: "u-roberto",
    usuario_nombre: "Roberto S.",
    motivo: "Reposición de estantería por stock mínimo alcanzado",
    swatch_color: "#E2E8F0",
  },
  {
    id: "mov-005",
    fecha: "23/10/2026",
    hora: "18:20",
    tipo: "salida",
    cantidad: 6,
    unidad: "gal",
    id_producto: "p-ant-9011",
    producto_nombre: "Antióxido Industrial Gris Forja 4L",
    producto_sku: "ANT-9011-GRY",
    producto_categoria: "Esmaltes & Sintéticos",
    id_ubicacion: "pas-b-02",
    ubicacion_nombre: "Pasillo B - B02",
    usuario_id: "u-roberto",
    usuario_nombre: "Roberto S.",
    motivo: "Despacho obra edificación residencial calle Mayor",
    swatch_color: "#475569",
  },
  {
    id: "mov-006",
    fecha: "23/10/2026",
    hora: "16:55",
    tipo: "salida",
    cantidad: 1,
    unidad: "unid",
    id_producto: "p-mas-5040",
    producto_nombre: "Masilla para Madera Tono Caoba 1kg",
    producto_sku: "MAS-5040-CAO",
    producto_categoria: "Masillas & Selladores",
    id_ubicacion: "descarga-muelle",
    ubicacion_nombre: "Descarga Muelle",
    usuario_id: "u-elena",
    usuario_nombre: "Elena R.",
    motivo: "Merma: Envase quebrado durante descarga",
    swatch_color: "#78350F",
  },
  {
    id: "mov-007",
    fecha: "23/10/2026",
    hora: "15:10",
    tipo: "ajuste",
    cantidad: 5,
    unidad: "unid",
    id_producto: "p-her-8820",
    producto_nombre: "Rodillo Antigota Microfibra Pro 25cm",
    producto_sku: "HER-8820-ROD",
    producto_categoria: "Herramientas",
    id_ubicacion: "est-d-04",
    ubicacion_nombre: "Estante D - D04",
    usuario_id: "u-carlos",
    usuario_nombre: "Carlos D.",
    motivo: "Ajuste tras conteo físico quincenal",
    swatch_color: "#F97316",
  },
  {
    id: "mov-008",
    fecha: "22/10/2026",
    hora: "17:45",
    tipo: "reposicion",
    cantidad: 15,
    unidad: "gal",
    id_producto: "p-esm-1020",
    producto_nombre: "Esmalte Sintético Negro Satinado 4L",
    producto_sku: "ESM-1020-BLK",
    producto_categoria: "Esmaltes & Sintéticos",
    id_ubicacion: "pas-b-03",
    ubicacion_nombre: "Pasillo B - B03",
    usuario_id: "u-roberto",
    usuario_nombre: "Roberto S.",
    motivo: "Reabastecimiento de lineal antes del fin de semana",
    swatch_color: "#1E293B",
  },
];

export function MovimientosPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>(MOVIMIENTOS_MOCK);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("todos");

  const [paginaActual, setPaginaActual] = useState(1);
  const [filasPorPagina, setFilasPorPagina] = useState(8);

  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState<Movimiento | null>(null);
  const [drawerAbierto, setDrawerAbierto] = useState(false);

  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false);
  const [nuevoTipo, setNuevoTipo] = useState<TipoMovimiento>("entrada");
  const [nuevoProductoId, setNuevoProductoId] = useState("p-lat-4001");
  const [nuevaCantidad, setNuevaCantidad] = useState(10);
  const [nuevaUbicacion, setNuevaUbicacion] = useState("pas-a-01");
  const [nuevoMotivo, setNuevoMotivo] = useState("Recepción de mercancía");

  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((m) => {
      const q = busqueda.toLowerCase().trim();
      const coincideBusqueda =
        q === "" ||
        m.producto_nombre.toLowerCase().includes(q) ||
        m.producto_sku.toLowerCase().includes(q) ||
        m.usuario_nombre.toLowerCase().includes(q) ||
        m.motivo.toLowerCase().includes(q);

      const coincideTipo = filtroTipo === "todos" || m.tipo === filtroTipo;
      const coincidePeriodo =
        filtroPeriodo === "todos" ||
        (filtroPeriodo === "hoy" && m.fecha === "24/10/2026") ||
        (filtroPeriodo === "ayer" && m.fecha === "23/10/2026");

      return coincideBusqueda && coincideTipo && coincidePeriodo;
    });
  }, [movimientos, busqueda, filtroTipo, filtroPeriodo]);

  const totalPaginas = Math.ceil(movimientosFiltrados.length / filasPorPagina) || 1;
  const movimientosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * filasPorPagina;
    return movimientosFiltrados.slice(inicio, inicio + filasPorPagina);
  }, [movimientosFiltrados, paginaActual, filasPorPagina]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroTipo("todos");
    setFiltroPeriodo("todos");
    setPaginaActual(1);
    toast.info("Filtros restablecidos");
  };

  const handleExportarCSV = () => {
    if (movimientosFiltrados.length === 0) {
      toast.error("No hay registros para exportar");
      return;
    }
    const headers = ["Fecha", "Hora", "Tipo", "SKU", "Producto", "Cantidad", "Unidad", "Ubicación", "Usuario", "Motivo"];
    const rows = movimientosFiltrados.map((m) => [
      m.fecha, m.hora, m.tipo, m.producto_sku, `"${m.producto_nombre}"`, m.cantidad, m.unidad, `"${m.ubicacion_nombre}"`, m.usuario_nombre, `"${m.motivo}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `movimientos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exportados ${movimientosFiltrados.length} registros a CSV`);
  };
  const handleExportarPDF = () => {
    if (movimientosFiltrados.length === 0) {
      toast.error("No hay registros para exportar con los filtros actuales");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Encabezado
    doc.setFontSize(20);
    doc.setTextColor(210, 77, 9); // Color ámbar #D24D09
    doc.text("Inventario LM", 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text("Historial de Movimientos", 14, 28);

    // Fecha de generación
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const fechaGeneracion = new Date().toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    doc.text(`Generado: ${fechaGeneracion}`, pageWidth - 14, 20, { align: "right" });
    doc.text(`Total registros: ${movimientosFiltrados.length}`, pageWidth - 14, 26, { align: "right" });

    // Línea separadora
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 32, pageWidth - 14, 32);

    // Totales por tipo
    const totalEntradas = movimientosFiltrados.filter(m => m.tipo === "entrada").length;
    const totalSalidas = movimientosFiltrados.filter(m => m.tipo === "salida").length;
    const totalReposiciones = movimientosFiltrados.filter(m => m.tipo === "reposicion").length;
    const totalAjustes = movimientosFiltrados.filter(m => m.tipo === "ajuste").length;

    doc.setFontSize(9);
    doc.setTextColor(16, 185, 129);
    doc.text(`Entradas: ${totalEntradas}`, 14, 38);
    doc.setTextColor(244, 63, 94);
    doc.text(`Salidas: ${totalSalidas}`, 50, 38);
    doc.setTextColor(59, 130, 246);
    doc.text(`Reposiciones: ${totalReposiciones}`, 85, 38);
    doc.setTextColor(245, 158, 11);
    doc.text(`Ajustes: ${totalAjustes}`, 130, 38);

    // Tabla de movimientos
    const tableData = movimientosFiltrados.map(m => {
      const signo = m.tipo === "ajuste" ? "=" : m.tipo === "salida" ? "-" : "+";
      return [
        `${m.fecha} ${m.hora}`,
        m.tipo.charAt(0).toUpperCase() + m.tipo.slice(1),
        m.producto_sku,
        m.producto_nombre,
        `${signo}${m.cantidad} ${m.unidad}`,
        m.ubicacion_nombre,
        m.usuario_nombre,
        m.motivo.length > 30 ? m.motivo.substring(0, 30) + "..." : m.motivo,
      ];
    });

    autoTable(doc, {
      startY: 44,
      head: [["Fecha/Hora", "Tipo", "SKU", "Producto", "Cantidad", "Ubicación", "Usuario", "Motivo"]],
      body: tableData,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [210, 77, 9], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 18 },
        2: { cellWidth: 22 },
        3: { cellWidth: 40 },
        4: { cellWidth: 20, halign: "right" },
        5: { cellWidth: 25 },
        6: { cellWidth: 22 },
        7: { cellWidth: "auto" },
      },
            didParseCell: (data) => {
        // Colorear la columna "Tipo" según el tipo de movimiento
        if (data.column.index === 1 && data.section === "body") {
          const tipo = (data.row.raw as any[])[1] as string;
          if (tipo === "Entrada") data.cell.styles.textColor = [16, 185, 129];
          else if (tipo === "Salida") data.cell.styles.textColor = [244, 63, 94];
          else if (tipo === "Reposicion") data.cell.styles.textColor = [59, 130, 246];
          else if (tipo === "Ajuste") data.cell.styles.textColor = [245, 158, 11];
        }
        // Colorear la columna "Cantidad" según el tipo
        if (data.column.index === 4 && data.section === "body") {
          const tipo = (data.row.raw as any[])[1] as string;
          if (tipo === "Entrada" || tipo === "Reposicion") data.cell.styles.textColor = [16, 185, 129];
          else if (tipo === "Salida") data.cell.styles.textColor = [244, 63, 94];
          else if (tipo === "Ajuste") data.cell.styles.textColor = [245, 158, 11];
        }
      },
    });

    // Pie de página
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Página ${i} de ${pageCount} • Inventario LM © ${new Date().getFullYear()}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    // Descargar
    const nombreArchivo = `movimientos_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(nombreArchivo);
    toast.success(`PDF exportado: ${movimientosFiltrados.length} registros`);
  };
  const handleRegistrarMovimiento = (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevaCantidad <= 0) {
      toast.error("La cantidad debe ser mayor que cero");
      return;
    }

    const productosCatalogo: Record<string, { nombre: string; sku: string; categoria: string; swatch: string }> = {
      "p-lat-4001": { nombre: "Látex Extracubriente Blanco 20L", sku: "LAT-4001-WHT", categoria: "Pinturas de Exterior", swatch: "#FFFFFF" },
      "p-esm-1020": { nombre: "Esmalte Sintético Negro Satinado 4L", sku: "ESM-1020-BLK", categoria: "Esmaltes & Sintéticos", swatch: "#1E293B" },
      "p-sol-9902": { nombre: "Thinner Universal Extra Calidad 10L", sku: "SOL-9902-STD", categoria: "Solventes & Químicos", swatch: "#FEF08A" },
      "p-her-8820": { nombre: "Rodillo Antigota Microfibra Pro 25cm", sku: "HER-8820-ROD", categoria: "Herramientas", swatch: "#F97316" },
      "p-mas-5040": { nombre: "Masilla para Madera Tono Caoba 1kg", sku: "MAS-5040-CAO", categoria: "Masillas & Selladores", swatch: "#78350F" },
    };

    const prod = productosCatalogo[nuevoProductoId] || productosCatalogo["p-lat-4001"]!;
    const hoy = new Date();
    const fechaStr = hoy.toLocaleDateString("es-ES");
    const horaStr = hoy.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

    const ubicacionesMap: Record<string, string> = {
      "pas-a-01": "Pasillo A - A01",
      "pas-b-02": "Pasillo B - B02",
      "rack-c-02": "Rack C - C02",
      "bod-2-z01": "Bodega 2 - Z01",
      "est-d-04": "Estante D - D04",
    };

    const nuevoMov: Movimiento = {
      id: `mov-${Date.now()}`,
      fecha: fechaStr,
      hora: horaStr,
      tipo: nuevoTipo,
      cantidad: Math.abs(nuevaCantidad), // Siempre positivo en BD
      unidad: "gal",
      id_producto: nuevoProductoId,
      producto_nombre: prod.nombre,
      producto_sku: prod.sku,
      producto_categoria: prod.categoria,
      id_ubicacion: nuevaUbicacion,
      ubicacion_nombre: ubicacionesMap[nuevaUbicacion] || nuevaUbicacion,
      usuario_id: "u-actual",
      usuario_nombre: "Javier M.",
      motivo: nuevoMotivo,
      swatch_color: prod.swatch,
    };

    setMovimientos((prev) => [nuevoMov, ...prev]);
    setModalRegistroAbierto(false);
    toast.success(`Movimiento registrado. El trigger actualizará el stock automáticamente.`);
  };

  const renderTipoBadge = (tipo: TipoMovimiento) => {
    switch (tipo) {
      case "entrada":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">Entrada</Badge>;
      case "salida":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-100">Salida</Badge>;
      case "reposicion":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">Reposición</Badge>;
      case "ajuste":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">Ajuste</Badge>;
    }
  };

  const renderVariacion = (m: Movimiento) => {
    let colorClass = "text-slate-900";
    if (m.tipo === "entrada" || m.tipo === "reposicion") colorClass = "text-emerald-700";
    else if (m.tipo === "salida") colorClass = "text-rose-700";
    else if (m.tipo === "ajuste") colorClass = "text-amber-800";

    const signo = m.tipo === "ajuste" ? "=" : m.tipo === "salida" ? "-" : "+";
    return <span className={`font-bold font-mono text-sm ${colorClass}`}>{signo}{m.cantidad} {m.unidad}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                <span>INVENTARIO LM</span><span>/</span><span>OPERACIONES</span><span>/</span>
                <span className="text-[#D24D09] font-semibold">MOVIMIENTOS</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Historial de Movimientos</h1>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  Tiempo Real
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2.5 self-start md:self-auto">
              <Button variant="outline" size="sm" onClick={handleExportarPDF} className="text-xs h-9 px-3.5 border-slate-200 text-slate-700 hover:bg-slate-100 gap-1.5">
  <Download className="w-4 h-4 text-slate-500" /> Exportar PDF
</Button>
<Button variant="outline" size="sm" onClick={handleExportarCSV} className="text-xs h-9 px-3.5 border-slate-200 text-slate-700 hover:bg-slate-100 gap-1.5">
  <Download className="w-4 h-4 text-slate-500" /> Exportar CSV
</Button>
              <Button size="sm" onClick={() => setModalRegistroAbierto(true)} className="bg-[#D24D09] hover:bg-[#b83f05] text-white text-xs font-semibold h-9 px-4 gap-1.5">
                <Plus className="w-4 h-4" /> Nuevo Movimiento
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard data={{ label: "Total Operaciones", value: movimientos.length, sublabel: "últimos 7 días", trend: "↗ +14% vs. día anterior", trendUp: true, icon: <ArrowLeftRight className="h-5 w-5" />, color: "amber" }} />
          <KPICard data={{ label: "Entradas", value: movimientos.filter(m => m.tipo === "entrada").length, sublabel: "registros", trend: "Recepción de proveedores", icon: <ArrowDownLeft className="h-5 w-5" />, color: "emerald" }} />
          <KPICard data={{ label: "Salidas", value: movimientos.filter(m => m.tipo === "salida").length, sublabel: "registros", trend: "Ventas y despachos", icon: <ArrowUpRight className="h-5 w-5" />, color: "rose" }} />
          <KPICard data={{ label: "Ajustes y Reposiciones", value: movimientos.filter(m => m.tipo === "ajuste" || m.tipo === "reposicion").length, sublabel: "registros", trend: "Regularizaciones", icon: <SlidersHorizontal className="h-5 w-5" />, color: "blue" }} />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs mb-4">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2.5">
              <div className="relative min-w-[260px] flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }} placeholder="Buscar SKU, producto o responsable..." className="pl-9 bg-slate-50/70 border-slate-200 text-xs h-9 focus-visible:ring-[#D24D09]" />
                {busqueda && <button onClick={() => setBusqueda("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>}
              </div>
              <select value={filtroTipo} onChange={(e) => { setFiltroTipo(e.target.value); setPaginaActual(1); }} className="h-9 text-xs rounded-md border border-slate-200 bg-white px-2.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-[#D24D09]">
                <option value="todos">Tipo: Todos</option>
                <option value="entrada">Entradas (+)</option>
                <option value="salida">Salidas (-)</option>
                <option value="reposicion">Reposiciones (+)</option>
                <option value="ajuste">Ajustes (=)</option>
              </select>
              <select value={filtroPeriodo} onChange={(e) => { setFiltroPeriodo(e.target.value); setPaginaActual(1); }} className="h-9 text-xs rounded-md border border-slate-200 bg-white px-2.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-[#D24D09]">
                <option value="todos">Período: Todos</option>
                <option value="hoy">Hoy</option>
                <option value="ayer">Ayer</option>
              </select>
            </div>
            <Button variant="ghost" size="sm" onClick={limpiarFiltros} className="text-xs h-9 text-slate-500 hover:text-slate-800 gap-1.5 self-end lg:self-auto">
              <RotateCcw className="w-3.5 h-3.5" /> Limpiar
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">FECHA / HORA</th>
                  <th className="py-3 px-4">TIPO</th>
                  <th className="py-3 px-4">PRODUCTO & SKU</th>
                  <th className="py-3 px-4 text-right">CANTIDAD</th>
                  <th className="py-3 px-4">UBICACIÓN</th>
                  <th className="py-3 px-4">USUARIO</th>
                  <th className="py-3 px-4">MOTIVO</th>
                  <th className="py-3 px-4 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {movimientosPaginados.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-slate-400">No se encontraron movimientos.</td></tr>
                ) : (
                  movimientosPaginados.map((m) => (
                    <tr key={m.id} onClick={() => { setMovimientoSeleccionado(m); setDrawerAbierto(true); }} className="hover:bg-slate-50/70 transition-colors cursor-pointer group">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 font-mono text-[11px]">{m.hora}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{m.fecha}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">{renderTipoBadge(m.tipo)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-5 h-5 rounded-full border border-slate-300 shadow-2xs shrink-0" style={{ backgroundColor: m.swatch_color || "#f1f5f9" }} />
                          <div className="min-w-0 max-w-[200px]">
                            <div className="font-semibold text-slate-900 truncate">{m.producto_nombre}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{m.producto_sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">{renderVariacion(m)}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700">{m.ubicacion_nombre}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700">{m.usuario_nombre}</td>
                      <td className="py-3 px-4 max-w-[150px] truncate text-slate-500" title={m.motivo}>{m.motivo}</td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setMovimientoSeleccionado(m); setDrawerAbierto(true); }} className="h-7 w-7 p-0 text-slate-400 hover:text-slate-800 hover:bg-slate-200/50">
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white text-xs text-slate-600">
            <div>Mostrando {movimientosFiltrados.length === 0 ? 0 : (paginaActual - 1) * filasPorPagina + 1}-{Math.min(paginaActual * filasPorPagina, movimientosFiltrados.length)} de {movimientosFiltrados.length} movimientos</div>
            <div className="flex items-center gap-3">
              <select value={filasPorPagina} onChange={(e) => { setFilasPorPagina(Number(e.target.value)); setPaginaActual(1); }} className="h-7 text-xs rounded border border-slate-200 bg-white px-2 text-slate-700">
                <option value={8}>8</option><option value={10}>10</option><option value={20}>20</option>
              </select>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={paginaActual === 1} onClick={() => setPaginaActual((p) => Math.max(1, p - 1))} className="h-7 px-2.5 text-xs border-slate-200">Anterior</Button>
                {Array.from({ length: Math.min(totalPaginas, 5) }, (_, i) => i + 1).map((num) => (
                  <Button key={num} variant={paginaActual === num ? "default" : "outline"} size="sm" onClick={() => setPaginaActual(num)} className={`h-7 w-7 p-0 text-xs ${paginaActual === num ? "bg-[#D24D09] hover:bg-[#b83f05] text-white" : "border-slate-200 text-slate-700"}`}>{num}</Button>
                ))}
                <Button variant="outline" size="sm" disabled={paginaActual === totalPaginas || totalPaginas === 0} onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))} className="h-7 px-2.5 text-xs border-slate-200">Siguiente</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Sheet open={drawerAbierto} onOpenChange={setDrawerAbierto}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-y-auto">
          {movimientoSeleccionado && (
            <div className="flex flex-col h-full bg-white">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono font-bold text-xs text-[#D24D09]">{movimientoSeleccionado.id}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 font-medium">Detalle de Movimiento</span>
                  </div>
                  {renderTipoBadge(movimientoSeleccionado.tipo)}
                </div>
              </div>
              <div className="p-5 space-y-6 flex-1">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">{movimientoSeleccionado.producto_nombre}</h3>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 font-mono">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold">{movimientoSeleccionado.producto_sku}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CANTIDAD</span>
                    <span className={`text-xl font-bold font-mono mt-0.5 block ${movimientoSeleccionado.tipo === "salida" ? "text-rose-600" : "text-emerald-700"}`}>
                      {movimientoSeleccionado.tipo === "salida" ? "-" : movimientoSeleccionado.tipo === "ajuste" ? "=" : "+"}{movimientoSeleccionado.cantidad} {movimientoSeleccionado.unidad}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">FECHA Y HORA</span>
                    <span className="text-xs font-bold text-slate-800 font-mono mt-1.5 block">{movimientoSeleccionado.fecha} {movimientoSeleccionado.hora}</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">Ubicación</h4>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/80">{movimientoSeleccionado.ubicacion_nombre}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">Operador</h4>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/80">{movimientoSeleccionado.usuario_nombre}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">Motivo / Justificación</h4>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/80 leading-relaxed">{movimientoSeleccionado.motivo}</p>
                </div>
              </div>
              <div className="p-4 border-t border-slate-200 bg-slate-50/60 flex items-center justify-end gap-3">
                <Button size="sm" onClick={() => setDrawerAbierto(false)} className="bg-[#D24D09] hover:bg-[#b83f05] text-white text-xs h-9 px-5">Cerrar</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={modalRegistroAbierto} onOpenChange={setModalRegistroAbierto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#D24D09]" />
              <DialogTitle className="text-base font-bold text-slate-900">Registrar Movimiento</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Se insertará un registro en la tabla <code className="text-[#D24D09] font-mono">movimientos</code> y el trigger de PostgreSQL actualizará el stock automáticamente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegistrarMovimiento} className="space-y-3.5 my-2 text-xs">
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1 block">Tipo de Operación</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={nuevoTipo === "entrada" ? "default" : "outline"} size="sm" onClick={() => setNuevoTipo("entrada")} className={`text-xs h-8 ${nuevoTipo === "entrada" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-slate-200 text-slate-700"}`}>Entrada (+)</Button>
                <Button type="button" variant={nuevoTipo === "salida" ? "default" : "outline"} size="sm" onClick={() => setNuevoTipo("salida")} className={`text-xs h-8 ${nuevoTipo === "salida" ? "bg-rose-600 hover:bg-rose-700 text-white" : "border-slate-200 text-slate-700"}`}>Salida (-)</Button>
                <Button type="button" variant={nuevoTipo === "reposicion" ? "default" : "outline"} size="sm" onClick={() => setNuevoTipo("reposicion")} className={`text-xs h-8 ${nuevoTipo === "reposicion" ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-slate-200 text-slate-700"}`}>Reposición (+)</Button>
                <Button type="button" variant={nuevoTipo === "ajuste" ? "default" : "outline"} size="sm" onClick={() => setNuevoTipo("ajuste")} className={`text-xs h-8 ${nuevoTipo === "ajuste" ? "bg-amber-600 hover:bg-amber-700 text-white" : "border-slate-200 text-slate-700"}`}>Ajuste (=)</Button>
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1 block">Producto</Label>
              <select value={nuevoProductoId} onChange={(e) => setNuevoProductoId(e.target.value)} className="w-full h-8 text-xs rounded-md border border-slate-200 bg-white px-2.5 text-slate-800">
                <option value="p-lat-4001">Látex Extracubriente Blanco 20L (LAT-4001-WHT)</option>
                <option value="p-esm-1020">Esmalte Sintético Negro Satinado 4L (ESM-1020-BLK)</option>
                <option value="p-sol-9902">Thinner Universal Extra Calidad 10L (SOL-9902-STD)</option>
                <option value="p-her-8820">Rodillo Antigota Microfibra Pro 25cm (HER-8820-ROD)</option>
                <option value="p-mas-5040">Masilla para Madera Tono Caoba 1kg (MAS-5040-CAO)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <Label className="text-xs font-semibold text-slate-700 mb-1 block">Cantidad</Label>
                <Input type="number" min={1} value={nuevaCantidad} onChange={(e) => setNuevaCantidad(Number(e.target.value))} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-700 mb-1 block">Ubicación</Label>
                <select value={nuevaUbicacion} onChange={(e) => setNuevaUbicacion(e.target.value)} className="w-full h-8 text-xs rounded-md border border-slate-200 bg-white px-2.5 text-slate-800">
                  <option value="pas-a-01">Pasillo A - A01</option>
                  <option value="pas-b-02">Pasillo B - B02</option>
                  <option value="rack-c-02">Rack C - C02</option>
                  <option value="bod-2-z01">Bodega 2 - Z01</option>
                  <option value="est-d-04">Estante D - D04</option>
                </select>
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1 block">Motivo / Justificación</Label>
              <Input value={nuevoMotivo} onChange={(e) => setNuevoMotivo(e.target.value)} placeholder="Ej. Recepción albarán o ajuste de auditoría" className="h-8 text-xs" />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="ghost" size="sm" onClick={() => setModalRegistroAbierto(false)} className="text-xs">Cancelar</Button>
              <Button type="submit" size="sm" className="bg-[#D24D09] hover:bg-[#b83f05] text-white text-xs font-medium">Registrar Movimiento</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}