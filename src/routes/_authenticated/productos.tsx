import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  Plus,
  Download,
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
  Package,
  AlertTriangle,
  XCircle,
  SlidersHorizontal,
  Warehouse,
  Paintbrush,
  FlaskConical,
} from "lucide-react";
import { toast } from "sonner";

// Componentes UI de shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// 🌟 COMPONENTE UNIFICADO DE KPIs
import { KPICard, KpiData } from "@/components/ui/kpi-card";

// ============================================================================
// DEFINICIÓN DE TIPOS
// ============================================================================

export interface ProductoItem {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  stock_actual: number;
  stock_minimo: number;
  activo: boolean;
  unidad?: string;
  ubicacion?: string;
  precio?: number;
  swatchColor?: string;
  iconoTipo?: "color" | "herramienta" | "solvente";
}

// ============================================================================
// DATOS MOCK REALISTAS
// ============================================================================

const productosMockIniciales: ProductoItem[] = [
  {
    id: "prod-1",
    sku: "LAT-4001-WHT",
    nombre: "Látex Extracubriente Blanco Mate 15L",
    categoria: "Pinturas de Interior",
    stock_actual: 48,
    stock_minimo: 15,
    activo: true,
    unidad: "gal",
    ubicacion: "Pasillo A - A01",
    precio: 42500,
    swatchColor: "#ffffff",
    iconoTipo: "color",
  },
  {
    id: "prod-2",
    sku: "ESM-1020-BLK",
    nombre: "Esmalte Sintético Negro Satinado 4L",
    categoria: "Esmaltes & Sintéticos",
    stock_actual: 7,
    stock_minimo: 10,
    activo: true,
    unidad: "gal",
    ubicacion: "Pasillo B - B03",
    precio: 28990,
    swatchColor: "#171717",
    iconoTipo: "color",
  },
  {
    id: "prod-3",
    sku: "HER-8820-ROD",
    nombre: "Rodillo Antigota Microfibra Pro 25cm",
    categoria: "Herramientas",
    stock_actual: 65,
    stock_minimo: 20,
    activo: true,
    unidad: "unid",
    ubicacion: "Estante D - D04",
    precio: 8450,
    iconoTipo: "herramienta",
  },
  {
    id: "prod-4",
    sku: "MAS-5040-CAO",
    nombre: "Masilla para Madera Tono Caoba 1Kg",
    categoria: "Masillas & Selladores",
    stock_actual: 4,
    stock_minimo: 8,
    activo: true,
    unidad: "unid",
    ubicacion: "Rack C - C02",
    precio: 6800,
    swatchColor: "#6c3b21",
    iconoTipo: "color",
  },
  {
    id: "prod-5",
    sku: "SOL-9902-STD",
    nombre: "Thinner Universal Extra Calidad 10L",
    categoria: "Solventes & Químicos",
    stock_actual: 0,
    stock_minimo: 5,
    activo: true,
    unidad: "unid",
    ubicacion: "Bodega 2 - Z01",
    precio: 31200,
    iconoTipo: "solvente",
  },
  {
    id: "prod-6",
    sku: "SEL-3108-ACR",
    nombre: "Primer Acrílico Sellador Antihumedad 5L",
    categoria: "Pinturas & Selladores",
    stock_actual: 22,
    stock_minimo: 10,
    activo: true,
    unidad: "unid",
    ubicacion: "Rack C - C01",
    precio: 24750,
    swatchColor: "#fcfaf2",
    iconoTipo: "color",
  },
  {
    id: "prod-7",
    sku: "IMP-7721-IMP",
    nombre: "Membrana Poliuretánica Techos 20Kg",
    categoria: "Impermeabilizantes",
    stock_actual: 18,
    stock_minimo: 12,
    activo: true,
    unidad: "gal",
    ubicacion: "Pasillo C - C04",
    precio: 64900,
    swatchColor: "#b94e32",
    iconoTipo: "color",
  },
  {
    id: "prod-8",
    sku: "BRO-1205-CER",
    nombre: "Brocha Profesional Cerda Mixta 3 pulg",
    categoria: "Herramientas",
    stock_actual: 42,
    stock_minimo: 15,
    activo: true,
    unidad: "unid",
    ubicacion: "Estante D - D02",
    precio: 5200,
    iconoTipo: "herramienta",
  },
  {
    id: "prod-9",
    sku: "ESM-2030-BLU",
    nombre: "Esmalte Sintético Azul Náutico Brillante 4L",
    categoria: "Esmaltes & Sintéticos",
    stock_actual: 3,
    stock_minimo: 8,
    activo: true,
    unidad: "gal",
    ubicacion: "Pasillo B - B01",
    precio: 29900,
    swatchColor: "#1e3a8a",
    iconoTipo: "color",
  },
  {
    id: "prod-10",
    sku: "SOL-1100-AGU",
    nombre: "Aguarrás Mineral Purificado 5L",
    categoria: "Solventes & Químicos",
    stock_actual: 30,
    stock_minimo: 12,
    activo: true,
    unidad: "unid",
    ubicacion: "Bodega 2 - Z02",
    precio: 14500,
    iconoTipo: "solvente",
  },
];

// ============================================================================
// COMPONENTE PRINCIPAL DE LA PÁGINA
// ============================================================================

export function ProductosPage() {
  const [productos, setProductos] = useState<ProductoItem[]>(productosMockIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("todas");
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("todos");
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 6;

  // Selección de filas
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());

  // Diálogos modales
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [productoVer, setProductoVer] = useState<ProductoItem | null>(null);
  const [productoEditar, setProductoEditar] = useState<ProductoItem | null>(null);
  const [productoADesactivar, setProductoADesactivar] = useState<ProductoItem | null>(null);

  // Formulario nuevo/editar
  const [formNombre, setFormNombre] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formCategoria, setFormCategoria] = useState("Pinturas de Interior");
  const [formStock, setFormStock] = useState<number | "">(10);
  const [formStockMinimo, setFormStockMinimo] = useState<number | "">(5);
  const [formPrecio, setFormPrecio] = useState<number | "">(25000);
  const [formUbicacion, setFormUbicacion] = useState("Pasillo A - A01");
  const [formUnidad, setFormUnidad] = useState("gal");

  // Lista de categorías únicas extraídas de los datos
  const categoriasDisponibles = useMemo(() => {
    const cats = new Set(productos.map((p) => p.categoria));
    return Array.from(cats);
  }, [productos]);

  // Filtrado de productos
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const q = busqueda.toLowerCase().trim();
      const coincideTexto =
        !q || p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);

      const coincideCategoria =
        categoriaSeleccionada === "todas" || p.categoria === categoriaSeleccionada;

      let coincideEstado = true;
      if (estadoSeleccionado === "normal") {
        coincideEstado = p.stock_actual > p.stock_minimo;
      } else if (estadoSeleccionado === "bajo") {
        coincideEstado = p.stock_actual > 0 && p.stock_actual <= p.stock_minimo;
      } else if (estadoSeleccionado === "agotado") {
        coincideEstado = p.stock_actual === 0;
      }

      return coincideTexto && coincideCategoria && coincideEstado;
    });
  }, [productos, busqueda, categoriaSeleccionada, estadoSeleccionado]);

  // Paginación
  const totalPaginas = Math.ceil(productosFiltrados.length / elementosPorPagina) || 1;
  const productosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * elementosPorPagina;
    return productosFiltrados.slice(inicio, inicio + elementosPorPagina);
  }, [productosFiltrados, paginaActual, elementosPorPagina]);

  // 🌟 MÉTRICAS UNIFICADAS PARA KPICard
  const kpisData: KpiData[] = useMemo(() => {
    const total = productos.length;
    const activos = productos.filter((p) => p.activo).length;
    const stockBajo = productos.filter((p) => p.stock_actual > 0 && p.stock_actual <= p.stock_minimo).length;
    const sinStock = productos.filter((p) => p.stock_actual === 0).length;
    const porcentajeActivos = total > 0 ? ((activos / total) * 100).toFixed(1) : "100";

    return [
      {
        label: 'Total Referencias',
        value: total,
        sublabel: 'SKUs activos en catálogo',
        trend: `${porcentajeActivos}% activos`,
        trendUp: true,
        icon: <Package className="h-5 w-5" />,
        color: 'amber',
      },
      {
        label: 'Stock Bajo',
        value: stockBajo,
        sublabel: 'Crítico en línea de látex',
        alert: 'Requiere reposición',
        icon: <AlertTriangle className="h-5 w-5" />,
        color: 'rose',
      },
      {
        label: 'Sin Stock',
        value: sinStock,
        sublabel: 'artículos agotados',
        icon: <XCircle className="h-5 w-5" />,
        color: 'slate',
      },
    ];
  }, [productos]);

  // Manejadores de selección
  const toggleSeleccionarTodos = () => {
    if (seleccionados.size === productosPaginados.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(productosPaginados.map((p) => p.id)));
    }
  };

  const toggleSeleccionarFila = (id: string) => {
    setSeleccionados((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  };

  // Apertura de modal para creación
  const abrirModalCrear = () => {
    setFormNombre("");
    setFormSku(`LAT-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 90)}`);
    setFormCategoria("Pinturas de Interior");
    setFormStock(15);
    setFormStockMinimo(5);
    setFormPrecio(32000);
    setFormUbicacion("Pasillo A - A02");
    setFormUnidad("gal");
    setModalNuevoAbierto(true);
  };

  // Apertura de modal para edición
  const abrirModalEditar = (p: ProductoItem) => {
    setProductoEditar(p);
    setFormNombre(p.nombre);
    setFormSku(p.sku);
    setFormCategoria(p.categoria);
    setFormStock(p.stock_actual);
    setFormStockMinimo(p.stock_minimo);
    setFormPrecio(p.precio || 20000);
    setFormUbicacion(p.ubicacion || "Pasillo A - A01");
    setFormUnidad(p.unidad || "gal");
  };

  // Guardar nuevo producto (Mock)
  const handleGuardarNuevo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim() || !formSku.trim()) {
      toast.error("Por favor completa el nombre y el SKU.");
      return;
    }

    const nuevo: ProductoItem = {
      id: `prod-${Date.now()}`,
      sku: formSku.trim().toUpperCase(),
      nombre: formNombre.trim(),
      categoria: formCategoria,
      stock_actual: Number(formStock) || 0,
      stock_minimo: Number(formStockMinimo) || 0,
      activo: true,
      unidad: formUnidad,
      ubicacion: formUbicacion,
      precio: Number(formPrecio) || 0,
      iconoTipo: "color",
      swatchColor: "#ffffff",
    };

    setProductos([nuevo, ...productos]);
    setModalNuevoAbierto(false);
    toast.success(`Producto "${nuevo.nombre}" creado exitosamente.`);
  };

  // Guardar edición
  const handleGuardarEdicion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoEditar) return;

    setProductos((prev) =>
      prev.map((p) =>
        p.id === productoEditar.id
          ? {
              ...p,
              nombre: formNombre.trim(),
              sku: formSku.trim().toUpperCase(),
              categoria: formCategoria,
              stock_actual: Number(formStock) || 0,
              stock_minimo: Number(formStockMinimo) || 0,
              precio: Number(formPrecio) || 0,
              ubicacion: formUbicacion,
              unidad: formUnidad,
            }
          : p,
      ),
    );

    setProductoEditar(null);
    toast.success("Producto actualizado correctamente.");
  };

  // Confirmar desactivación/reactivación
  const confirmarDesactivar = () => {
    if (!productoADesactivar) return;
    setProductos((prev) =>
      prev.map((p) => (p.id === productoADesactivar.id ? { ...p, activo: !p.activo } : p)),
    );
    toast.success(`Producto "${productoADesactivar.nombre}" actualizado.`);
    setProductoADesactivar(null);
  };

  // Exportar CSV
  const exportarCSV = () => {
    const encabezados = "SKU,Nombre,Categoría,Ubicación,Stock,Mínimo,Precio\n";
    const filas = productosFiltrados
      .map(
        (p) =>
          `"${p.sku}","${p.nombre}","${p.categoria}","${p.ubicacion || "-"}","${p.stock_actual} ${p.unidad || ""}","${p.stock_minimo}","${p.precio || 0}"`,
      )
      .join("\n");
    const blob = new Blob([encabezados + filas], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `productos_inventario_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Listado de productos exportado a CSV.");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. HEADER & BREADCRUMB */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase text-gray-400 mb-1">
            <span>INVENTARIO LM</span>
            <span className="text-gray-300">/</span>
            <span>CATÁLOGO</span>
            <span className="text-gray-300">/</span>
            <span className="text-amber-700 font-bold">EXISTENCIAS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Catálogo de Productos
          </h1>
        </div>

        <div className="flex items-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/90 text-blue-700 border border-blue-200/80 text-xs font-medium shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>Base Central • Actualizado hace 4m</span>
          </span>
        </div>
      </div>

      {/* 2. BARRA DE HERRAMIENTAS / FILTROS */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaActual(1);
              }}
              placeholder="Buscar por nombre, SKU o código..."
              className="pl-9 h-10 bg-white border-gray-300 rounded-lg text-sm focus:border-amber-600 focus:ring-amber-600"
            />
          </div>

          <div className="w-[190px]">
            <Select
              value={categoriaSeleccionada}
              onValueChange={(val) => {
                setCategoriaSeleccionada(val);
                setPaginaActual(1);
              }}
            >
              <SelectTrigger className="h-10 border-gray-300 bg-white text-gray-700 rounded-lg text-sm">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                {categoriasDisponibles.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[170px]">
            <Select
              value={estadoSeleccionado}
              onValueChange={(val) => {
                setEstadoSeleccionado(val);
                setPaginaActual(1);
              }}
            >
              <SelectTrigger className="h-10 border-gray-300 bg-white text-gray-700 rounded-lg text-sm">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="normal">Normal (Stock OK)</SelectItem>
                <SelectItem value="bajo">Stock Bajo</SelectItem>
                <SelectItem value="agotado">Sin Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={exportarCSV}
            className="h-10 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Exportar CSV</span>
          </Button>

          <Button
            onClick={abrirModalCrear}
            className="h-10 bg-[#8c4314] hover:bg-[#78370e] text-white rounded-lg text-xs font-semibold px-4 gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </Button>
        </div>
      </div>

      {/* 🌟 3. TARJETAS KPI RESUMEN (UNIFICADAS CON DASHBOARD) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpisData.map((kpi) => (
          <KPICard key={kpi.label} data={kpi} />
        ))}
      </div>

      {/* 4. TABLA PRINCIPAL DE DATOS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <span>{seleccionados.size} seleccionados</span>
          <div className="flex items-center gap-1.5 font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
            <span>Columnas activas: 6/6 • Almacén Norte</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50/80 border-b border-gray-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[48px] px-4">
                  <Checkbox
                    checked={
                      productosPaginados.length > 0 &&
                      seleccionados.size === productosPaginados.length
                    }
                    onCheckedChange={toggleSeleccionarTodos}
                    aria-label="Seleccionar todos"
                  />
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  PRODUCTO & SKU
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  CATEGORÍA
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  UBICACIÓN
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  STOCK & ESTADO
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-600 text-right">
                  PRECIO UNITARIO
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-600 text-right w-[100px]">
                  ACCIONES
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100">
              {productosPaginados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                    No se encontraron productos con los filtros seleccionados.
                  </TableCell>
                </TableRow>
              ) : (
                productosPaginados.map((p) => {
                  const estaSeleccionado = seleccionados.has(p.id);
                  const esAgotado = p.stock_actual === 0;
                  const esBajo = p.stock_actual > 0 && p.stock_actual <= p.stock_minimo;

                  return (
                    <TableRow
                      key={p.id}
                      className={`transition-colors ${
                        estaSeleccionado ? "bg-amber-50/40" : "hover:bg-gray-50/80"
                      }`}
                    >
                      <TableCell className="px-4">
                        <Checkbox
                          checked={estaSeleccionado}
                          onCheckedChange={() => toggleSeleccionarFila(p.id)}
                          aria-label={`Seleccionar ${p.nombre}`}
                        />
                      </TableCell>

                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full border border-gray-200 shrink-0 flex items-center justify-center shadow-2xs"
                            style={{
                              backgroundColor: p.swatchColor || "#f1f5f9",
                            }}
                          >
                            {p.iconoTipo === "herramienta" ? (
                              <Paintbrush className="w-4 h-4 text-gray-600" />
                            ) : p.iconoTipo === "solvente" ? (
                              <FlaskConical className="w-4 h-4 text-blue-600" />
                            ) : null}
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-sm text-gray-900 truncate">
                              {p.nombre}
                            </span>
                            <span className="text-xs font-mono text-gray-500 tracking-tight">
                              SKU: {p.sku}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-100">
                          {p.categoria}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="inline-flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                          <Warehouse className="w-3.5 h-3.5 text-gray-400" />
                          <span>{p.ubicacion || "Sin asignar"}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold text-xs ${
                              esAgotado
                                ? "text-rose-600"
                                : esBajo
                                  ? "text-amber-800"
                                  : "text-gray-900"
                            }`}
                          >
                            {p.stock_actual} {p.unidad || "unid"}
                          </span>

                          {esAgotado ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                              Agotado
                            </span>
                          ) : esBajo ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                              Bajo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              Normal
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right font-medium text-xs text-gray-800">
                        ${(p.precio || 0).toLocaleString("es-CL")}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setProductoVer(p)}
                            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                onClick={() => abrirModalEditar(p)}
                                className="gap-2 text-xs font-medium cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5 text-blue-600" />
                                <span>Editar producto</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setProductoADesactivar(p)}
                                className="gap-2 text-xs font-medium text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>{p.activo ? "Desactivar" : "Activar"}</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 5. FOOTER & PAGINACIÓN */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 pt-1">
        <div>
          Mostrando{" "}
          <strong className="text-gray-800">
            {productosFiltrados.length === 0 ? 0 : (paginaActual - 1) * elementosPorPagina + 1}
          </strong>{" "}
          a{" "}
          <strong className="text-gray-800">
            {Math.min(paginaActual * elementosPorPagina, productosFiltrados.length)}
          </strong>{" "}
          de <strong className="text-gray-800">{productosFiltrados.length}</strong> productos
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
            disabled={paginaActual === 1}
            className="h-8 text-xs font-medium border-gray-300"
          >
            Anterior
          </Button>

          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
            <Button
              key={num}
              variant={paginaActual === num ? "default" : "outline"}
              size="sm"
              onClick={() => setPaginaActual(num)}
              className={`h-8 w-8 p-0 text-xs font-semibold ${
                paginaActual === num
                  ? "bg-[#8c4314] hover:bg-[#78370e] text-white border-transparent"
                  : "border-gray-300 text-gray-700"
              }`}
            >
              {num}
            </Button>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
            disabled={paginaActual === totalPaginas}
            className="h-8 text-xs font-medium border-gray-300 text-amber-900 border-amber-300 hover:bg-amber-50"
          >
            Siguiente
          </Button>
        </div>
      </div>

      {/* MODAL: NUEVO PRODUCTO */}
      <Dialog open={modalNuevoAbierto} onOpenChange={setModalNuevoAbierto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">
              Registrar Nuevo Producto
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Introduce la información del nuevo producto para darlo de alta en el catálogo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGuardarNuevo} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="nuevo-sku">SKU *</Label>
                <Input
                  id="nuevo-sku"
                  value={formSku}
                  onChange={(e) => setFormSku(e.target.value)}
                  placeholder="Ej: LAT-4001-WHT"
                  className="font-mono text-sm uppercase"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="nuevo-cat">Categoría *</Label>
                <Select value={formCategoria} onValueChange={setFormCategoria}>
                  <SelectTrigger id="nuevo-cat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pinturas de Interior">Pinturas de Interior</SelectItem>
                    <SelectItem value="Esmaltes & Sintéticos">Esmaltes & Sintéticos</SelectItem>
                    <SelectItem value="Herramientas">Herramientas</SelectItem>
                    <SelectItem value="Masillas & Selladores">Masillas & Selladores</SelectItem>
                    <SelectItem value="Solventes & Químicos">Solventes & Químicos</SelectItem>
                    <SelectItem value="Impermeabilizantes">Impermeabilizantes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="nuevo-nombre">Nombre del Producto *</Label>
              <Input
                id="nuevo-nombre"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                placeholder="Ej: Látex Supercubriente Blanco 20L"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="nuevo-stock">Stock Inicial</Label>
                <Input
                  id="nuevo-stock"
                  type="number"
                  min={0}
                  value={formStock}
                  onChange={(e) =>
                    setFormStock(e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="nuevo-minimo">Stock Mínimo</Label>
                <Input
                  id="nuevo-minimo"
                  type="number"
                  min={0}
                  value={formStockMinimo}
                  onChange={(e) =>
                    setFormStockMinimo(e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="nuevo-unidad">Unidad</Label>
                <Select value={formUnidad} onValueChange={setFormUnidad}>
                  <SelectTrigger id="nuevo-unidad">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gal">gal (Galones)</SelectItem>
                    <SelectItem value="unid">unid (Unidades)</SelectItem>
                    <SelectItem value="Kg">Kg (Kilos)</SelectItem>
                    <SelectItem value="L">L (Litros)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="nuevo-ubicacion">Ubicación física</Label>
                <Input
                  id="nuevo-ubicacion"
                  value={formUbicacion}
                  onChange={(e) => setFormUbicacion(e.target.value)}
                  placeholder="Ej: Pasillo A - A01"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="nuevo-precio">Precio Unitario ($)</Label>
                <Input
                  id="nuevo-precio"
                  type="number"
                  min={0}
                  value={formPrecio}
                  onChange={(e) =>
                    setFormPrecio(e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalNuevoAbierto(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#8c4314] hover:bg-[#78370e] text-white"
              >
                Guardar Producto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDITAR PRODUCTO */}
      <Dialog open={Boolean(productoEditar)} onOpenChange={(open) => !open && setProductoEditar(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">
              Editar Producto
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Modifica los detalles del producto seleccionado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGuardarEdicion} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="edit-sku">SKU</Label>
                <Input
                  id="edit-sku"
                  value={formSku}
                  onChange={(e) => setFormSku(e.target.value)}
                  className="font-mono text-sm uppercase"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-cat">Categoría</Label>
                <Select value={formCategoria} onValueChange={setFormCategoria}>
                  <SelectTrigger id="edit-cat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pinturas de Interior">Pinturas de Interior</SelectItem>
                    <SelectItem value="Esmaltes & Sintéticos">Esmaltes & Sintéticos</SelectItem>
                    <SelectItem value="Herramientas">Herramientas</SelectItem>
                    <SelectItem value="Masillas & Selladores">Masillas & Selladores</SelectItem>
                    <SelectItem value="Solventes & Químicos">Solventes & Químicos</SelectItem>
                    <SelectItem value="Impermeabilizantes">Impermeabilizantes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-nombre">Nombre</Label>
              <Input
                id="edit-nombre"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="edit-stock">Stock Actual</Label>
                <Input
                  id="edit-stock"
                  type="number"
                  min={0}
                  value={formStock}
                  onChange={(e) =>
                    setFormStock(e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-minimo">Stock Mínimo</Label>
                <Input
                  id="edit-minimo"
                  type="number"
                  min={0}
                  value={formStockMinimo}
                  onChange={(e) =>
                    setFormStockMinimo(e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-unidad">Unidad</Label>
                <Input
                  id="edit-unidad"
                  value={formUnidad}
                  onChange={(e) => setFormUnidad(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="edit-ubicacion">Ubicación</Label>
                <Input
                  id="edit-ubicacion"
                  value={formUbicacion}
                  onChange={(e) => setFormUbicacion(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-precio">Precio Unitario ($)</Label>
                <Input
                  id="edit-precio"
                  type="number"
                  min={0}
                  value={formPrecio}
                  onChange={(e) =>
                    setFormPrecio(e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProductoEditar(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#8c4314] hover:bg-[#78370e] text-white"
              >
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: VER DETALLE DEL PRODUCTO */}
      <Dialog open={Boolean(productoVer)} onOpenChange={(open) => !open && setProductoVer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold">
                {productoVer?.sku}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 font-medium border border-blue-100">
                {productoVer?.categoria}
              </span>
            </div>
            <DialogTitle className="text-base font-bold text-gray-900">
              {productoVer?.nombre}
            </DialogTitle>
          </DialogHeader>

          {productoVer && (
            <div className="space-y-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div>
                  <span className="text-gray-500 block">Stock Actual:</span>
                  <span className="font-bold text-sm text-gray-900">
                    {productoVer.stock_actual} {productoVer.unidad}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Stock Mínimo:</span>
                  <span className="font-bold text-sm text-gray-900">
                    {productoVer.stock_minimo} {productoVer.unidad}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Ubicación Física:</span>
                  <span className="font-semibold text-gray-800">
                    {productoVer.ubicacion || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Precio Unitario:</span>
                  <span className="font-semibold text-gray-800">
                    ${(productoVer.precio || 0).toLocaleString("es-CL")}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded border bg-white">
                <span className="text-gray-600">Estado del producto:</span>
                <span
                  className={`px-2 py-0.5 rounded-full font-semibold ${
                    productoVer.activo
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  {productoVer.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setProductoVer(null)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ALERT DIALOG: CONFIRMAR DESACTIVACIÓN / ELIMINACIÓN */}
      <AlertDialog
        open={Boolean(productoADesactivar)}
        onOpenChange={(open) => !open && setProductoADesactivar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿{productoADesactivar?.activo ? "Desactivar" : "Reactivar"} producto?
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas{" "}
              {productoADesactivar?.activo ? "desactivar" : "activar"} el producto «
              <strong>{productoADesactivar?.nombre}</strong>» (SKU: {productoADesactivar?.sku})?
              <br />
              <br />
              Los movimientos e histórico de existencias se conservarán en la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductoADesactivar(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarDesactivar}
              className={
                productoADesactivar?.activo
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================================
// EXPORTACIÓN DE RUTA TANSTACK ROUTER
// ============================================================================

export const Route = createFileRoute("/_authenticated/productos")({
  component: ProductosPage,
});