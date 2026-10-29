import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Camera,
  Box,
  Scale,
  FolderOpen,
  FileText,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

// Componentes UI de shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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

// 🌟 Componente unificado de KPIs
import { KPICard, KpiData } from "@/components/ui/kpi-card";

// 📷 Escáner de código de barras
import { BarcodeScanner } from "@/components/ui/barcode-scanner";

//  Supabase + TanStack Query
import {
  getProductos,
  getCategorias,
  crearProducto,
  actualizarProducto,
  desactivarProducto,
} from "@/lib/inventario";
import type { Producto, Categoria } from "@/lib/tipos";

// ============================================================================
// DEFINICIÓN DE TIPOS
// ============================================================================

export interface Dimensiones {
  largo: number;
  ancho: number;
  alto: number;
  peso: number;
}

// Tipo local extendido para UI (incluye propiedades visuales)
export interface ProductoItem extends Producto {
  swatchColor?: string;
  iconoTipo?: "color" | "herramienta" | "solvente";
  dimensiones?: Dimensiones;
}

// Función para adaptar Producto de BD al ProductoItem de UI
function adaptarProducto(p: Producto): ProductoItem {
  // Determinar icono según categoría
  let iconoTipo: "color" | "herramienta" | "solvente" = "color";
  const catLower = (p.categoria || "").toLowerCase();
  if (
    catLower.includes("brocha") ||
    catLower.includes("rodillo") ||
    catLower.includes("herramienta")
  ) {
    iconoTipo = "herramienta";
  } else if (
    catLower.includes("solvente") ||
    catLower.includes("thinner") ||
    catLower.includes("aguarrás")
  ) {
    iconoTipo = "solvente";
  }

  return {
    ...p,
    stock_actual: p.stock_actual ?? 0,
    stock_minimo: p.stock_minimo ?? 0,
    precio: p.precio ?? 0,
    unidad: p.unidad ?? "unid",
    categoria: p.categoria || "Sin categoría",
    swatchColor: "#ffffff",
    iconoTipo,
    dimensiones: {
      largo: p.largo ?? 0,
      ancho: p.ancho ?? 0,
      alto: p.alto ?? 0,
      peso: p.peso ?? 0,
    },
  };
}

// ============================================================================
// COMPONENTE PRINCIPAL DE LA PÁGINA
// ============================================================================

function ProductosPage() {
  const queryClient = useQueryClient();

  // 🔌 CONSULTAS REALES A SUPABASE
  const { data: productosRaw = [], isLoading: cargandoProductos } = useQuery<Producto[]>({
    queryKey: ["productos"],
    queryFn: getProductos,
  });

  const { data: categoriasRaw = [] } = useQuery<Categoria[]>({
    queryKey: ["categorias"],
    queryFn: getCategorias,
  });

  // Adaptar productos de BD al formato UI
  const productos: ProductoItem[] = useMemo(
    () => productosRaw.map(adaptarProducto),
    [productosRaw],
  );

  // 🔌 MUTACIONES (crear, actualizar, desactivar)
  const mutationCrear = useMutation({
    mutationFn: (nuevo: Partial<Producto>) => crearProducto(nuevo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      toast.success("Producto creado correctamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al crear el producto");
    },
  });

  const mutationActualizar = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Producto> }) =>
      actualizarProducto(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      toast.success("Producto actualizado correctamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar el producto");
    },
  });

  const mutationDesactivar = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => desactivarProducto(id, activo),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      toast.success(`Producto ${variables.activo ? "reactivado" : "desactivado"} correctamente`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al cambiar el estado");
    },
  });

  // ============================================================================
  // ESTADOS LOCALES (UI, filtros, modales)
  // ============================================================================
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("todas");
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("todos");
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 6;

  // Selección de filas
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());

  // 📷 Escáner de código de barras
  const [scannerOpen, setScannerOpen] = useState(false);

  // Diálogos modales
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [productoVer, setProductoVer] = useState<ProductoItem | null>(null);
  const [productoEditar, setProductoEditar] = useState<ProductoItem | null>(null);
  const [productoADesactivar, setProductoADesactivar] = useState<ProductoItem | null>(null);

  // Formulario nuevo/editar
  const [formNombre, setFormNombre] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formCodigoBarras, setFormCodigoBarras] = useState("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [formCategoria, setFormCategoria] = useState("");
  const [formStock, setFormStock] = useState<number | "">(10);
  const [formStockMinimo, setFormStockMinimo] = useState<number | "">(5);
  const [formPrecio, setFormPrecio] = useState<number | "">(25000);
  const [formUbicacion, setFormUbicacion] = useState("");
  const [formUnidad, setFormUnidad] = useState("gal");

  // 📦 Formulario Dimensiones
  const [formLargo, setFormLargo] = useState<number | "">(0);
  const [formAncho, setFormAncho] = useState<number | "">(0);
  const [formAlto, setFormAlto] = useState<number | "">(0);
  const [formPeso, setFormPeso] = useState<number | "">(0);

  // ============================================================================
  // FILTRADO Y PAGINACIÓN
  // ============================================================================

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const q = busqueda.toLowerCase().trim();
      const coincideTexto =
        !q || p.nombre.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q);

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

  const totalPaginas = Math.ceil(productosFiltrados.length / elementosPorPagina) || 1;
  const productosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * elementosPorPagina;
    return productosFiltrados.slice(inicio, inicio + elementosPorPagina);
  }, [productosFiltrados, paginaActual, elementosPorPagina]);

  // 🌟 MÉTRICAS UNIFICADAS PARA KPICard
  const kpisData: KpiData[] = useMemo(() => {
    const total = productos.length;
    const activos = productos.filter((p) => p.activo).length;
    const stockBajo = productos.filter(
      (p) => p.stock_actual > 0 && p.stock_actual <= p.stock_minimo,
    ).length;
    const sinStock = productos.filter((p) => p.stock_actual === 0).length;
    const porcentajeActivos = total > 0 ? ((activos / total) * 100).toFixed(1) : "100";

    return [
      {
        label: "Total Referencias",
        value: total,
        sublabel: "SKUs activos en catálogo",
        trend: `${porcentajeActivos}% activos`,
        trendUp: true,
        icon: <Package className="h-5 w-5" />,
        color: "amber",
      },
      {
        label: "Stock Bajo",
        value: stockBajo,
        sublabel: stockBajo > 0 ? "Requiere reposición" : "Sin alertas activas",
        icon: <AlertTriangle className="h-5 w-5" />,
        color: "rose",
      },
      {
        label: "Sin Stock",
        value: sinStock,
        sublabel: "artículos agotados",
        icon: <XCircle className="h-5 w-5" />,
        color: "slate",
      },
    ];
  }, [productos]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

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

  //  Manejador del escaneo
  const handleScan = (code: string) => {
    const codeUpper = code.toUpperCase().trim();
    if (modalNuevoAbierto) {
      setFormCodigoBarras(codeUpper);
      if (!formSku || formSku.startsWith("LAT-")) {
        setFormSku(codeUpper);
      }
      toast.success(`✅ Código escaneado: ${codeUpper}`);
      setScannerOpen(false);
      return;
    }

    if (productoEditar) {
      setFormCodigoBarras(codeUpper);
      toast.success(`✅ Código asignado al producto: ${codeUpper}`);
      setScannerOpen(false);
      return;
    }

    const productoEncontrado = productos.find(
      (p) =>
        (p.sku || "").toLowerCase() === code.toLowerCase() ||
        ((p as any).codigo_barras || "").toLowerCase() === code.toLowerCase() ||
        p.id === code,
    );

    if (productoEncontrado) {
      setBusqueda(productoEncontrado.sku);
      setPaginaActual(1);
      toast.success(`✅ Producto encontrado: ${productoEncontrado.nombre}`);
    } else {
      setFormSku(codeUpper);
      setFormCodigoBarras(codeUpper);
      setFormNombre("");
      setFormCategoria(categoriasRaw[0]?.nombre || "Sin categoría");
      setFormDescripcion("");
      setFormPrecio(0);

      setModalNuevoAbierto(true);
      toast.info(`🆕 Código ${code} no encontrado. Complete los datos para crearlo.`);
    }
  };

  const abrirModalCrear = () => {
    const skuGenerado = `LAT-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 90)}`;
    setFormNombre("");
    setFormSku(skuGenerado);
    setFormCodigoBarras(skuGenerado);
    setFormCategoria(categoriasRaw[0]?.nombre || "Sin categoría");
    setFormDescripcion("");
    setFormPrecio(0);
    setModalNuevoAbierto(true);
  };

  const abrirModalEditar = (p: ProductoItem) => {
    setProductoEditar(p);
    setFormNombre(p.nombre || "");
    setFormSku(p.sku || "");
    setFormCodigoBarras((p as any).codigo_barras || p.sku || "");
    setFormDescripcion((p as any).descripcion || "");
    setFormCategoria(p.categoria || "Sin categoría");
    setFormPrecio(p.precio || (p as any).precio_unitario || 0);
  };

  // 🔌 Guardar nuevo producto (SUPABASE)
  const handleGuardarNuevo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim() || !formSku.trim()) {
      toast.error("Por favor completa el nombre y el SKU.");
      return;
    }

    mutationCrear.mutate({
      sku: formSku.trim().toUpperCase(),
      codigo_barras: formCodigoBarras.trim() || formSku.trim().toUpperCase(),
      nombre: formNombre.trim(),
      descripcion: formDescripcion.trim() || null,
      categoria: formCategoria === "Sin categoría" ? null : formCategoria || null,
      precio: Number(formPrecio) || 0,
      precio_unitario: Number(formPrecio) || 0,
    } as any);

    setModalNuevoAbierto(false);
  };

  // 🔌 Guardar edición (SUPABASE)
  const handleGuardarEdicion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoEditar) return;

    if (!formNombre.trim() || !formSku.trim()) {
      toast.error("Por favor completa el nombre y el SKU.");
      return;
    }

    mutationActualizar.mutate({
      id: productoEditar.id,
      updates: {
        nombre: formNombre.trim(),
        sku: formSku.trim().toUpperCase(),
        codigo_barras: formCodigoBarras.trim() || formSku.trim().toUpperCase(),
        descripcion: formDescripcion.trim() || null,
        categoria: formCategoria === "Sin categoría" ? null : formCategoria || null,
        precio: Number(formPrecio) || 0,
        precio_unitario: Number(formPrecio) || 0,
      },
    });

    setProductoEditar(null);
  };

  // 🔌 Confirmar desactivación/reactivación (SUPABASE)
  const confirmarDesactivar = () => {
    if (!productoADesactivar) return;
    mutationDesactivar.mutate({
      id: productoADesactivar.id,
      activo: !productoADesactivar.activo,
    });
    setProductoADesactivar(null);
  };

  // Exportar CSV
  const exportarCSV = () => {
    const encabezados = "SKU,Nombre,Categoría,Ubicación,Stock,Mínimo,Precio\n";
    const filas = productosFiltrados
      .map(
        (p) =>
          `"${p.sku || ""}","${p.nombre}","${p.categoria || ""}","${
            p.ubicacion || "-"
          }","${p.stock_actual} ${p.unidad || ""}","${p.stock_minimo}","${p.precio || 0}"`,
      )
      .join("\n");
    const blob = new Blob([encabezados + filas], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `productos_inventario_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Listado de productos exportado a CSV.");
  };

  // ============================================================================
  // RENDER
  // ============================================================================
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
            <span className="text-orange-700 font-bold">EXISTENCIAS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Catálogo de Productos
          </h1>
        </div>

        <div className="flex items-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50/90 text-orange-700 border border-orange-200/80 text-xs font-medium shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse" />
            <span>
              {cargandoProductos
                ? "Conectando a Supabase..."
                : `Supabase • ${productos.length} productos`}
            </span>
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
              className="pl-9 h-10 bg-white border-gray-300 rounded-lg text-sm focus:border-orange-600 focus:ring-orange-600"
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
                {categoriasRaw.map((cat) => (
                  <SelectItem key={cat.id} value={cat.nombre}>
                    {cat.nombre}
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
            variant="outline"
            onClick={() => setScannerOpen(true)}
            className="h-10 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold gap-1.5 shadow-2xs"
          >
            <Camera className="w-3.5 h-3.5 text-gray-500" />
            <span>Escanear</span>
          </Button>

          <Button
            onClick={abrirModalCrear}
            className="h-10 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold px-4 gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </Button>
        </div>
      </div>

      {/* 🌟 3. TARJETAS KPI RESUMEN */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpisData.map((kpi) => (
          <KPICard key={kpi.label} data={kpi} />
        ))}
      </div>

      {/* 4. TABLA PRINCIPAL */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <span>{seleccionados.size} seleccionados</span>
          <div className="flex items-center gap-1.5 font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
            <span>
              {cargandoProductos
                ? "Cargando..."
                : `Columnas activas: 6/6 • ${productos.length} productos`}
            </span>
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
              {cargandoProductos ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                    Cargando productos desde Supabase...
                  </TableCell>
                </TableRow>
              ) : productosPaginados.length === 0 ? (
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
                        estaSeleccionado ? "bg-white" : "hover:bg-gray-50/80"
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
                              SKU: {p.sku || "—"}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-800 border border-orange-100">
                          {p.categoria || "Sin categoría"}
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
                                  ? "text-orange-800"
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
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
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
                                <Pencil className="w-3.5 h-3.5 text-orange-600" />
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
                  ? "bg-orange-600 hover:bg-orange-700 text-white border-transparent"
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
            className="h-8 text-xs font-medium border-gray-300 text-orange-900 border-orange-200 hover:bg-orange-50"
          >
            Siguiente
          </Button>
        </div>
      </div>

      {/* 📷 COMPONENTE ESCÁNER */}
      <BarcodeScanner open={scannerOpen} onOpenChange={setScannerOpen} onScan={handleScan} />

      {/* MODAL: NUEVO PRODUCTO */}
      <Dialog open={modalNuevoAbierto} onOpenChange={setModalNuevoAbierto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-orange-900">
              Registrar Nuevo Producto
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Introduce la información del nuevo producto para darlo de alta en el catálogo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGuardarNuevo} className="space-y-4 py-2">
            {/* 1. INFORMACIÓN BÁSICA */}
            <div className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-5 w-5 text-orange-600" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Información Básica</h3>
                  <p className="text-xs text-gray-500">Datos principales del producto</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <Label htmlFor="nuevo-nombre" className="text-xs font-medium text-gray-700">
                    Nombre *
                  </Label>
                  <Input
                    id="nuevo-nombre"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    placeholder="Ej: Látex Supercubriente Blanco 20L"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="nuevo-sku" className="text-xs font-medium text-gray-700">
                    SKU *
                  </Label>
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
                  <Label
                    htmlFor="nuevo-codigo-barras"
                    className="text-xs font-medium text-gray-700"
                  >
                    Código de Barras
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="nuevo-codigo-barras"
                      value={formCodigoBarras}
                      onChange={(e) => setFormCodigoBarras(e.target.value)}
                      placeholder="Ej: 8435000000000"
                      className="font-mono text-sm flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setScannerOpen(true)}
                      title="Escanear código de barras con la cámara"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. CATEGORIZACIÓN */}
            <div className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-orange-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Categorización</h3>
                    <p className="text-xs text-gray-500">Clasificación del producto</p>
                  </div>
                </div>
                {(!formCategoria || formCategoria === "Sin categoría") && (
                  <Badge
                    variant="outline"
                    className="bg-orange-50 text-orange-700 border-orange-200 text-xs font-normal"
                  >
                    Sin categoría
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <Label htmlFor="nuevo-cat" className="text-xs font-medium text-gray-700">
                    Categoría *
                  </Label>
                  <Select value={formCategoria} onValueChange={setFormCategoria}>
                    <SelectTrigger id="nuevo-cat">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sin categoría">Sin categoría</SelectItem>
                      {categoriasRaw.map((cat) => (
                        <SelectItem key={cat.id} value={cat.nombre}>
                          {cat.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 3. DESCRIPCIÓN */}
            <div className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-orange-600" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Descripción</h3>
                  <p className="text-xs text-gray-500">Detalles adicionales del producto</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <Label htmlFor="nuevo-descripcion" className="text-xs font-medium text-gray-700">
                    Descripción
                  </Label>
                  <Textarea
                    id="nuevo-descripcion"
                    value={formDescripcion}
                    onChange={(e) => setFormDescripcion(e.target.value)}
                    placeholder="Detalles adicionales del producto, características o recomendaciones de uso..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* 4. PRECIO */}
            <div className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-5 w-5 text-orange-600" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Precio</h3>
                  <p className="text-xs text-gray-500">Valor por unidad</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="nuevo-precio" className="text-xs font-medium text-gray-700">
                    Precio Unitario ($)
                  </Label>
                  <Input
                    id="nuevo-precio"
                    type="number"
                    min={0}
                    step="0.01"
                    value={formPrecio}
                    onChange={(e) =>
                      setFormPrecio(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalNuevoAbierto(false)}
                disabled={mutationCrear.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700 text-white font-medium"
                disabled={mutationCrear.isPending}
              >
                {mutationCrear.isPending ? "Guardando..." : "Guardar Producto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDITAR PRODUCTO */}
      <Dialog
        open={Boolean(productoEditar)}
        onOpenChange={(open) => !open && setProductoEditar(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-orange-900">Editar Producto</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Modifica los detalles del producto en el catálogo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGuardarEdicion} className="space-y-4 py-2">
            {/* 1. INFORMACIÓN BÁSICA */}
            <div className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-5 w-5 text-orange-600" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Información Básica</h3>
                  <p className="text-xs text-gray-500">Datos principales del producto</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <Label htmlFor="edit-nombre" className="text-xs font-medium text-gray-700">
                    Nombre del Producto *
                  </Label>
                  <Input
                    id="edit-nombre"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    placeholder="Ej. Esmalte Sintético Brillante Blanco 4L"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-sku" className="text-xs font-medium text-gray-700">
                    SKU *
                  </Label>
                  <Input
                    id="edit-sku"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value.toUpperCase())}
                    className="font-mono text-sm uppercase"
                    placeholder="LAT-0000-00"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="edit-codigo-barras"
                      className="text-xs font-medium text-gray-700"
                    >
                      Código de Barras
                    </Label>
                    <button
                      type="button"
                      onClick={() => setScannerOpen(true)}
                      className="text-[11px] text-orange-700 hover:text-orange-800 flex items-center gap-1 font-medium"
                    >
                      <Camera className="h-3 w-3" />
                      Escanear
                    </button>
                  </div>
                  <Input
                    id="edit-codigo-barras"
                    value={formCodigoBarras}
                    onChange={(e) => setFormCodigoBarras(e.target.value)}
                    placeholder="Código de barras EAN o referencia"
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 2. CATEGORIZACIÓN */}
            <div className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-orange-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Categorización</h3>
                    <p className="text-xs text-gray-500">Clasificación del producto</p>
                  </div>
                </div>
                {(!formCategoria || formCategoria === "Sin categoría") && (
                  <Badge
                    variant="outline"
                    className="bg-orange-50 text-orange-700 border-orange-200 text-xs font-normal"
                  >
                    Sin categoría
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <Label htmlFor="edit-cat" className="text-xs font-medium text-gray-700">
                    Categoría
                  </Label>
                  <Select value={formCategoria} onValueChange={setFormCategoria}>
                    <SelectTrigger id="edit-cat">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sin categoría">Sin categoría</SelectItem>
                      {categoriasRaw.map((cat) => (
                        <SelectItem key={cat.id} value={cat.nombre}>
                          {cat.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 3. DESCRIPCIÓN */}
            <div className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-orange-600" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Descripción</h3>
                  <p className="text-xs text-gray-500">Detalles adicionales del producto</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <Label htmlFor="edit-descripcion" className="text-xs font-medium text-gray-700">
                    Descripción
                  </Label>
                  <Textarea
                    id="edit-descripcion"
                    value={formDescripcion}
                    onChange={(e) => setFormDescripcion(e.target.value)}
                    placeholder="Detalles adicionales del producto..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* 4. PRECIO */}
            <div className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-5 w-5 text-orange-600" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Precio</h3>
                  <p className="text-xs text-gray-500">Valor por unidad</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-precio" className="text-xs font-medium text-gray-700">
                    Precio Unitario ($)
                  </Label>
                  <Input
                    id="edit-precio"
                    type="number"
                    min={0}
                    step="0.01"
                    value={formPrecio}
                    onChange={(e) =>
                      setFormPrecio(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProductoEditar(null)}
                disabled={mutationActualizar.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700 text-white font-medium"
                disabled={mutationActualizar.isPending}
              >
                {mutationActualizar.isPending ? "Guardando..." : "Guardar Cambios"}
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
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-800 font-medium border border-orange-100">
                {productoVer?.categoria}
              </span>
            </div>
            <DialogTitle className="text-base font-bold text-orange-900">
              {productoVer?.nombre}
            </DialogTitle>
          </DialogHeader>

          {productoVer && (
            <div className="space-y-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-orange-50/50 p-3 rounded-lg border border-orange-200">
                <div>
                  <span className="text-gray-500 block">Código de Barras:</span>
                  <span className="font-mono text-xs font-semibold text-gray-900">
                    {(productoVer as any).codigo_barras || productoVer.sku || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Precio Unitario:</span>
                  <span className="font-semibold text-gray-800">
                    $
                    {(
                      productoVer.precio ||
                      (productoVer as any).precio_unitario ||
                      0
                    ).toLocaleString("es-CL")}
                  </span>
                </div>
              </div>

              {(productoVer as any).descripcion && (
                <div className="bg-white p-3 rounded-lg border border-orange-200">
                  <span className="text-gray-500 block text-[11px] mb-1 font-medium">
                    Descripción:
                  </span>
                  <p className="text-gray-700 text-xs">{(productoVer as any).descripcion}</p>
                </div>
              )}

              <div className="flex items-center justify-between p-2 rounded border border-orange-200 bg-orange-50">
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
            <Button variant="outline" size="sm" onClick={() => setProductoVer(null)}>
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
              ¿Estás seguro de que deseas {productoADesactivar?.activo ? "desactivar" : "activar"}{" "}
              el producto «<strong>{productoADesactivar?.nombre}</strong>» (SKU:{" "}
              {productoADesactivar?.sku})?
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
