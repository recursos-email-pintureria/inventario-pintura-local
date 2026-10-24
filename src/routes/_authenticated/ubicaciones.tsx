import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  obtenerSecciones,
  obtenerUbicaciones,
  crearUbicacion,
  actualizarUbicacion,
  desactivarUbicacion,
  borrarUbicacionDefinitivamente,
  errorInventario,
  obtenerProductosPorUbicacion,
  actualizarStock,
  crearMovimientoConStock,
  buscarProductoPorCodigo,
  buscarProductosPorCodigo,
  descargarCatalogoCompleto,
  guardarProducto,
} from "../../lib/inventario";
import type { Producto, ProductoConCantidad } from "../../lib/inventario";
import { supabase } from "../../lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Escaner from "@/components/inventario/Escaner";
import { Pencil, Pause, Trash2, Package, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { BadgeTipoUbicacion } from "@/components/inventario/BadgeTipoUbicacion";
import { getConfigTipo, CONFIG_TIPOS } from "@/lib/tiposUbicacion";

export const Route = createFileRoute("/_authenticated/ubicaciones")({
  component: UbicacionesPage,
});

// ✅ CONFIGURACIÓN Y COMPATIBILIDAD POR TIPO
function getColorBadge(tipo: string): string {
  return getConfigTipo(tipo).badgeClass;
}

function getTipoLabel(tipo: string): string {
  return getConfigTipo(tipo).label;
}

function getIconoTipo(tipo: string): string {
  return "";
}

type ModalMode = "ver" | "anadir" | "editar";

function UbicacionesPage() {
  const [secciones, setSecciones] = useState<any[]>([]);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [productosPorUbicacion, setProductosPorUbicacion] = useState<Map<string, number>>(
    new Map(),
  );

  // Estado del modal de gestión de productos de una ubicación
  const [ubicacionStockAbierta, setUbicacionStockAbierta] = useState<any>(null);
  const [productosUbicacion, setProductosUbicacion] = useState<ProductoConCantidad[]>([]);
  const [cargandoStock, setCargandoStock] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("ver");
  const [busqueda, setBusqueda] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [productoEditando, setProductoEditando] = useState<ProductoConCantidad | null>(null);
  const [cantidadEdicion, setCantidadEdicion] = useState<number | "">("");

  // Ajuste rápido (mini-modal)
  const [ajusteRapido, setAjusteRapido] = useState<ProductoConCantidad | null>(null);
  const [nuevaCantidadAjuste, setNuevaCantidadAjuste] = useState<number | "">("");

  // Estados para diálogos de confirmación crítica
  const [productoAEliminar, setProductoAEliminar] = useState<ProductoConCantidad | null>(null);
  const [confirmacionStockCero, setConfirmacionStockCero] = useState<{
    producto: ProductoConCantidad;
    tipo: "ajusteRapido" | "edicion";
  } | null>(null);
  const [ubicacionADesactivar, setUbicacionADesactivar] = useState<any | null>(null);
  const [ubicacionABorrar, setUbicacionABorrar] = useState<any | null>(null);

  // Formulario "añadir producto" (inline en el modal)
  const [nuevoCodigoBarras, setNuevoCodigoBarras] = useState("");
  const [scanError, setScanError] = useState("");
  const [escanerAbierto, setEscanerAbierto] = useState(false);
  const [productoEscaneado, setProductoEscaneado] = useState<{
    id: string;
    sku: string;
    nombre: string;
  } | null>(null);
  const [nuevoSku, setNuevoSku] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaCantidad, setNuevaCantidad] = useState<number | "">(1);

  // ESTADOS PARA AUTOCOMPLETADO
  const [catalogoProductos, setCatalogoProductos] = useState<Producto[]>([]);
  const [resultadosBusqueda, setResultadosBusqueda] = useState<Producto[]>([]);
  const [buscandoProductos, setBuscandoProductos] = useState(false);
  const [sinResultados, setSinResultados] = useState(false);
  const [totalRealesTabla, setTotalRealesTabla] = useState<number | null>(null);
  const [visiblesLista, setVisiblesLista] = useState(25);
  const debounceBusquedaRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const TAM_PAGINA_PRODUCTOS = 1000;

  const [tipo, setTipo] = useState<string>("pasillo");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [seccionId, setSeccionId] = useState("");
  const [ubicacionPadreId, setUbicacionPadreId] = useState("");
  const [seccionOrigenId, setSeccionOrigenId] = useState("");
  const [posicionLateral, setPosicionLateral] = useState("");
  const [posicionLongitudinal, setPosicionLongitudinal] = useState("");
  const [numero, setNumero] = useState<number | "">("");

  useEffect(() => {
    cargarDatos();
  }, []);

  // FIX 8: Cargar catálogo al abrir el formulario de añadir (recarga cada vez para evitar datos obsoletos)
  useEffect(() => {
    if (modalMode !== "anadir") return;
    let cancelado = false;
    (async () => {
      try {
        setBuscandoProductos(true);
        const productos = await descargarCatalogoCompleto(TAM_PAGINA_PRODUCTOS);
        if (!cancelado) {
          setCatalogoProductos(productos);
          setResultadosBusqueda(productos);
        }
      } catch (err: any) {
        if (!cancelado) toast.error(errorInventario(err));
      } finally {
        if (!cancelado) setBuscandoProductos(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [modalMode]);

  // Contar total de productos reales en la tabla
  useEffect(() => {
    if (totalRealesTabla !== null) return;
    (async () => {
      const { count, error } = await supabase
        .from("productos")
        .select("id", { count: "exact", head: true });
      if (!error) setTotalRealesTabla(count ?? 0);
    })();
  }, []);

  async function cargarDatos() {
    try {
      setCargando(true);
      const [seccionesData, ubicacionesData] = await Promise.all([
        obtenerSecciones(),
        obtenerUbicaciones(),
      ]);
      setSecciones(seccionesData);
      setUbicaciones(ubicacionesData);

      const padres = new Set(
        ubicacionesData
          .filter((u: any) => u.tipo === "pasillo" || u.tipo === "reserva")
          .map((u: any) => u.id),
      );
      setExpandidos(padres);

      const { data: stockData, error: stockError } = await supabase
        .from("stock")
        .select("id_ubicacion, cantidad")
        .gt("cantidad", 0);

      if (stockError) console.error("Error cargando stock:", stockError);
      else {
        const productosMap = new Map<string, number>();
        stockData?.forEach((item: any) => {
          const count = productosMap.get(item.id_ubicacion) || 0;
          productosMap.set(item.id_ubicacion, count + 1);
        });
        setProductosPorUbicacion(productosMap);
      }
    } catch (err: any) {
      setError(errorInventario(err));
    } finally {
      setCargando(false);
    }
  }

  // ---------- MODAL DE GESTIÓN DE PRODUCTOS ----------

  async function recargarProductosUbicacion(id_ubicacion: string) {
    try {
      const productos = await obtenerProductosPorUbicacion(id_ubicacion);
      setProductosUbicacion(productos);
      setProductosPorUbicacion((prev) => {
        const nuevo = new Map(prev);
        if (productos.length > 0) nuevo.set(id_ubicacion, productos.length);
        else nuevo.delete(id_ubicacion);
        return nuevo;
      });
    } catch (err) {
      console.error("Error recargando productos:", err);
    }
  }

  function resetearModalForms() {
    if (debounceBusquedaRef.current) clearTimeout(debounceBusquedaRef.current);
    setModalMode("ver");
    setBusqueda("");
    setProductoEditando(null);
    setCantidadEdicion("");
    setNuevoCodigoBarras("");
    setScanError("");
    setProductoEscaneado(null);
    setNuevoSku("");
    setNuevoNombre("");
    setNuevaCantidad(1);
    setAjusteRapido(null);
    setNuevaCantidadAjuste("");
    setResultadosBusqueda([]);
    setSinResultados(false);
    setVisiblesLista(25);
  }

  async function abrirStockUbicacion(ubicacion: any) {
    setUbicacionStockAbierta(ubicacion);
    resetearModalForms();
    setCargandoStock(true);
    setProductosUbicacion([]);
    try {
      await recargarProductosUbicacion(ubicacion.id);
    } catch (err: any) {
      toast.error(errorInventario(err));
    } finally {
      setCargandoStock(false);
    }
  }

  function cerrarModal() {
    const anterior = ubicacionStockAbierta;
    setUbicacionStockAbierta(null);
    setEscanerAbierto(false);
    resetearModalForms();
    if (anterior) recargarProductosUbicacion(anterior.id);
  }

  function iniciarEdicion(producto: ProductoConCantidad) {
    setProductoEditando(producto);
    setCantidadEdicion(producto.cantidad);
    setModalMode("editar");
  }

  async function ejecutarGuardarCantidad() {
    if (!ubicacionStockAbierta || !productoEditando) return;
    try {
      setGuardando(true);
      await crearMovimientoConStock({
        id_producto: productoEditando.id,
        id_ubicacion: ubicacionStockAbierta.id,
        tipo: "ajuste",
        cantidad: cantidadEdicion,
        notas: "Edición de cantidad desde armario (ajuste)",
      });
      await recargarProductosUbicacion(ubicacionStockAbierta.id);
      toast.success(`Cantidad actualizada: ${productoEditando.nombre} → ${cantidadEdicion} uds`);
      resetearModalForms();
      setUbicacionStockAbierta(ubicacionStockAbierta);
    } catch (err: any) {
      toast.error(errorInventario(err));
    } finally {
      setGuardando(false);
    }
  }

  async function guardarCantidad() {
    if (!ubicacionStockAbierta || !productoEditando) return;
    if (cantidadEdicion === "" || !Number.isInteger(cantidadEdicion) || cantidadEdicion < 0) {
      toast.error("Introduce una cantidad entera ≥ 0.");
      return;
    }
    if (cantidadEdicion === 0) {
      setConfirmacionStockCero({
        producto: productoEditando,
        tipo: "edicion",
      });
      return;
    }
    await ejecutarGuardarCantidad();
  }

  async function confirmarEliminarProducto() {
    if (!ubicacionStockAbierta || !productoAEliminar) return;
    try {
      setGuardando(true);
      await actualizarStock(productoAEliminar.id, ubicacionStockAbierta.id, 0);
      await recargarProductosUbicacion(ubicacionStockAbierta.id);
      toast.success(`"${productoAEliminar.nombre}" eliminado de esta ubicación`);
      setProductoAEliminar(null);
    } catch (err: any) {
      toast.error(errorInventario(err));
    } finally {
      setGuardando(false);
    }
  }

  function abrirAjusteRapido(producto: ProductoConCantidad) {
    setAjusteRapido(producto);
    setNuevaCantidadAjuste(producto.cantidad);
  }

  async function ejecutarAjusteRapido(prod: ProductoConCantidad, cant: number) {
    if (!ubicacionStockAbierta) return;
    try {
      setGuardando(true);
      await actualizarStock(prod.id, ubicacionStockAbierta.id, cant);
      await recargarProductosUbicacion(ubicacionStockAbierta.id);
      toast.success(`Ajuste rápido: ${prod.nombre} → ${cant} uds`);
      setAjusteRapido(null);
      setNuevaCantidadAjuste("");
    } catch (err: any) {
      toast.error(errorInventario(err));
    } finally {
      setGuardando(false);
    }
  }

  async function guardarAjusteRapido() {
    if (!ubicacionStockAbierta || !ajusteRapido) return;
    if (
      nuevaCantidadAjuste === "" ||
      !Number.isInteger(nuevaCantidadAjuste) ||
      nuevaCantidadAjuste < 0
    ) {
      toast.error("Introduce una cantidad entera ≥ 0.");
      return;
    }
    if (nuevaCantidadAjuste === 0) {
      setConfirmacionStockCero({
        producto: ajusteRapido,
        tipo: "ajusteRapido",
      });
      return;
    }
    await ejecutarAjusteRapido(ajusteRapido, nuevaCantidadAjuste);
  }

  async function confirmarAjusteCero() {
    if (!confirmacionStockCero) return;
    if (confirmacionStockCero.tipo === "ajusteRapido") {
      await ejecutarAjusteRapido(confirmacionStockCero.producto, 0);
    } else {
      await ejecutarGuardarCantidad();
    }
    setConfirmacionStockCero(null);
  }

  async function escanearCodigo(codigoManual?: string) {
    if (debounceBusquedaRef.current) clearTimeout(debounceBusquedaRef.current);
    const codigo = (codigoManual ?? nuevoCodigoBarras).trim();
    setScanError("");
    setProductoEscaneado(null);
    setSinResultados(false);

    if (!codigo) {
      setResultadosBusqueda([]);
      setScanError("Introduce o escanea un código de barras.");
      return;
    }
    try {
      setBuscandoProductos(true);
      const coincidencias = await buscarProductosPorCodigo(codigo);
      if (coincidencias.length === 1) {
        seleccionarProductoBusqueda(coincidencias[0]);
        toast.success(`Producto encontrado: ${coincidencias[0].nombre}`);
      } else if (coincidencias.length > 1) {
        setResultadosBusqueda(coincidencias);
        toast.info(`${coincidencias.length} productos coinciden. Selecciona uno.`);
      } else {
        setResultadosBusqueda([]);
        setSinResultados(true);
        setNuevoSku("");
        setNuevoNombre("");
        toast.info("No existe ningún producto con ese código. Complétalo para crearlo.");
      }
    } catch (err: any) {
      setScanError(errorInventario(err));
      toast.error(errorInventario(err));
    } finally {
      setBuscandoProductos(false);
    }
  }

  function seleccionarProductoBusqueda(p: Producto) {
    setProductoEscaneado({ id: p.id, sku: p.sku, nombre: p.nombre });
    setNuevoCodigoBarras(p.codigo_barras);
    setResultadosBusqueda([]);
    setSinResultados(false);
    setScanError("");
  }

  function autocompletarProductos(texto: string) {
    if (debounceBusquedaRef.current) clearTimeout(debounceBusquedaRef.current);
    const q = texto.trim().toLowerCase();
    setSinResultados(false);

    const locales = catalogoProductos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q) ||
        (p.codigo_barras || "").toLowerCase().includes(q),
    );

    setResultadosBusqueda(locales);
    setVisiblesLista(25);

    if (!q) return;

    if (locales.length === 0 && catalogoProductos.length > 0) {
      debounceBusquedaRef.current = setTimeout(async () => {
        try {
          setBuscandoProductos(true);
          const coincidencias = await buscarProductosPorCodigo(texto);
          setResultadosBusqueda(coincidencias);
          setSinResultados(coincidencias.length === 0);
        } catch (err: any) {
          toast.error(errorInventario(err));
        } finally {
          setBuscandoProductos(false);
        }
      }, 250);
    }
  }

  async function anadirProducto() {
    if (!ubicacionStockAbierta) return;
    if (!nuevoCodigoBarras.trim()) {
      setScanError("El código de barras es obligatorio.");
      return;
    }
    if (nuevaCantidad === "" || !Number.isInteger(nuevaCantidad) || nuevaCantidad <= 0) {
      setScanError("La cantidad debe ser un entero mayor que cero.");
      return;
    }
    try {
      setGuardando(true);
      setScanError("");
      let idProducto = productoEscaneado?.id;
      if (!idProducto) {
        if (!nuevoNombre.trim() || !nuevoSku.trim()) {
          setScanError("Completa SKU y nombre para crear el producto nuevo.");
          return;
        }
        idProducto = await guardarProducto({
          codigo_barras: nuevoCodigoBarras.trim(),
          sku: nuevoSku.trim(),
          nombre: nuevoNombre.trim(),
          descripcion: null,
          id_categoria: null,
          precio_unitario: null,
        });
        // Invalidar caché al crear producto nuevo
        setCatalogoProductos([]);
        setTotalRealesTabla(null);
      }
      const yaExiste = productosUbicacion.some((p) => p.id === idProducto);
      const sumaBase = productosUbicacion.find((p) => p.id === idProducto)?.cantidad || 0;
      await actualizarStock(
        idProducto,
        ubicacionStockAbierta.id,
        sumaBase + (nuevaCantidad as number),
      );
      await recargarProductosUbicacion(ubicacionStockAbierta.id);
      toast.success(
        yaExiste
          ? `Stock sumado: +${nuevaCantidad} uds de "${productoEscaneado?.nombre || nuevoNombre}"`
          : `"${productoEscaneado?.nombre || nuevoNombre}" añadido a ${ubicacionStockAbierta.nombre} (${nuevaCantidad} uds)`,
      );
      resetearModalForms();
      setUbicacionStockAbierta(ubicacionStockAbierta);
    } catch (err: any) {
      setScanError(errorInventario(err));
    } finally {
      setGuardando(false);
    }
  }

  // ---------- FIN MODAL ----------

  function toggleExpandir(id: string) {
    setExpandidos((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  }

  function expandirTodos() {
    const padres = new Set(
      ubicaciones
        .filter((u: any) => u.tipo === "pasillo" || u.tipo === "reserva")
        .map((u: any) => u.id),
    );
    setExpandidos(padres);
  }

  function colapsarTodos() {
    setExpandidos(new Set());
  }

  function resetearFormulario() {
    setTipo("pasillo");
    setNombre("");
    setDescripcion("");
    setSeccionId("");
    setUbicacionPadreId("");
    setSeccionOrigenId("");
    setPosicionLateral("");
    setPosicionLongitudinal("");
    setNumero("");
    setEditandoId(null);
    setMostrarFormulario(false);
    setError("");
  }

  function editarUbicacion(ubicacion: any) {
    setEditandoId(ubicacion.id);
    setTipo(ubicacion.tipo);
    setNombre(ubicacion.nombre);
    setDescripcion(ubicacion.descripcion || "");
    const seccionActual =
      typeof ubicacion.seccion === "string" ? ubicacion.seccion : ubicacion.seccion?.id || "";
    setSeccionId(seccionActual);
    setUbicacionPadreId(ubicacion.id_ubicacion_padre || "");
    const seccionOrigenActual =
      typeof ubicacion.seccion_origen === "string"
        ? ubicacion.seccion_origen
        : ubicacion.seccion_origen?.id || "";
    setSeccionOrigenId(seccionOrigenActual);
    setPosicionLateral(ubicacion.posicion_lateral || "");
    setPosicionLongitudinal(ubicacion.posicion_longitudinal || "");
    setNumero(ubicacion.numero || "");
    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function guardarUbicacion() {
    try {
      setError("");
      if (!nombre.trim()) {
        setError("El nombre es obligatorio");
        return;
      }
      if (tipo === "pasillo" && !seccionId) {
        setError("Debes seleccionar una sección");
        return;
      }
      if ((tipo === "armario" || tipo === "alto" || tipo === "cross") && !ubicacionPadreId) {
        setError("Debes seleccionar un pasillo padre");
        return;
      }
      if (tipo === "cross" && !seccionOrigenId) {
        setError("Debes seleccionar la sección de origen");
        return;
      }
      if ((tipo === "armario" || tipo === "alto" || tipo === "cross") && !posicionLateral) {
        setError("Debes seleccionar la posición lateral");
        return;
      }
      if (tipo === "cross" && !posicionLongitudinal) {
        setError("Debes seleccionar la posición longitudinal");
        return;
      }

      const datosUbicacion: any = {
        nombre: nombre.trim(),
        tipo,
        descripcion: descripcion.trim() || null,
        id_ubicacion_padre: ubicacionPadreId || null,
        posicion_lateral: posicionLateral || null,
        posicion_longitudinal: posicionLongitudinal || null,
        numero: numero !== "" ? numero : null,
      };

      if (tipo === "pasillo") {
        datosUbicacion.seccion = seccionId || null;
        datosUbicacion.seccion_origen = null;
      } else if (tipo === "cross") {
        const padre = ubicaciones.find((u: any) => u.id === ubicacionPadreId);
        datosUbicacion.seccion = padre?.seccion?.id || padre?.seccion || null;
        datosUbicacion.seccion_origen = seccionOrigenId || null;
      } else if (tipo === "reserva") {
        datosUbicacion.seccion = null;
        datosUbicacion.seccion_origen = null;
      } else {
        if (seccionId && seccionId !== "") {
          datosUbicacion.seccion = seccionId;
        } else {
          const padre = ubicaciones.find((u: any) => u.id === ubicacionPadreId);
          datosUbicacion.seccion = padre?.seccion?.id || padre?.seccion || null;
        }
        datosUbicacion.seccion_origen = null;
      }

      if (editandoId) {
        await actualizarUbicacion(editandoId, datosUbicacion);
      } else {
        await crearUbicacion(datosUbicacion);
      }

      await cargarDatos();
      resetearFormulario();
    } catch (err: any) {
      setError(errorInventario(err));
    }
  }

  function desactivarUbicacionHandler(ubicacion: any) {
    setUbicacionADesactivar(ubicacion);
  }

  function borrarDefinitivamente(ubicacion: any) {
    setUbicacionABorrar(ubicacion);
  }

  async function confirmarDesactivarUbicacion() {
    if (!ubicacionADesactivar) return;
    try {
      await desactivarUbicacion(ubicacionADesactivar.id);
      await cargarDatos();
      toast.success(`Ubicación "${ubicacionADesactivar.nombre}" desactivada`);
      setUbicacionADesactivar(null);
    } catch (err: any) {
      setError(errorInventario(err));
      toast.error(errorInventario(err));
    }
  }

  async function confirmarBorrarUbicacion() {
    if (!ubicacionABorrar) return;
    const numProductos = productosPorUbicacion.get(ubicacionABorrar.id) || 0;
    if (numProductos > 0) {
      setUbicacionABorrar(null);
      return;
    }
    try {
      await borrarUbicacionDefinitivamente(ubicacionABorrar.id);
      await cargarDatos();
      toast.success(`Ubicación "${ubicacionABorrar.nombre}" eliminada definitivamente`);
      setUbicacionABorrar(null);
    } catch (err: any) {
      setError(errorInventario(err));
      toast.error(errorInventario(err));
    }
  }

  function getPasillosAgrupados() {
    return secciones
      .map((seccion: any) => {
        const pasillos = ubicaciones.filter(
          (u: any) =>
            u.tipo === "pasillo" && (u.seccion?.id === seccion.id || u.seccion === seccion.id),
        );
        return { seccion, pasillos };
      })
      .filter((grupo: any) => grupo.pasillos.length > 0);
  }

  function getUbicacionesAgrupadas() {
    const padres = ubicaciones.filter((u: any) => u.tipo === "pasillo" || u.tipo === "reserva");
    const hijos = ubicaciones.filter((u: any) => u.tipo !== "pasillo" && u.tipo !== "reserva");
    return padres.map((padre: any) => ({
      padre,
      hijos: hijos.filter((h: any) => h.id_ubicacion_padre === padre.id),
    }));
  }

  function getSeccionReal(ubicacion: any): string {
    try {
      if (ubicacion.tipo === "cross") {
        if (ubicacion.seccion_origen_nombre) return ubicacion.seccion_origen_nombre;
        if (typeof ubicacion.seccion_origen === "string") return ubicacion.seccion_origen;
        if (ubicacion.seccion_origen?.nombre) return ubicacion.seccion_origen.nombre;
        return "-";
      } else {
        if (ubicacion.seccion_nombre) return ubicacion.seccion_nombre;
        if (typeof ubicacion.seccion === "string") return ubicacion.seccion;
        if (ubicacion.seccion?.nombre) return ubicacion.seccion.nombre;
        if (ubicacion.seccion?.id) return ubicacion.seccion.id;
        return "-";
      }
    } catch (e) {
      console.error("Error obteniendo sección:", e, ubicacion);
      return "-";
    }
  }

  function getDetalles(ubicacion: any): string {
    if (ubicacion.tipo === "pasillo") {
      const partes: string[] = [];
      if (ubicacion.descripcion) partes.push(ubicacion.descripcion);
      const seccionesAsociadas = ubicaciones
        .filter(
          (h: any) =>
            h.id_ubicacion_padre === ubicacion.id &&
            (h.seccion_nombre ||
              (h.seccion && typeof h.seccion === "object" ? h.seccion.nombre : null)),
        )
        .map(
          (h: any) =>
            h.seccion_nombre || (typeof h.seccion === "object" ? h.seccion?.nombre : null),
        );
      const unicas = [...new Set(seccionesAsociadas.filter(Boolean))];
      if (unicas.length > 0) partes.push(`Secciones: ${unicas.join(", ")}`);
      return partes.join(" · ") || "-";
    }
    const partes: string[] = [];
    if (ubicacion.posicion_lateral) partes.push(ubicacion.posicion_lateral);
    if (ubicacion.posicion_longitudinal) partes.push(ubicacion.posicion_longitudinal);
    if (ubicacion.numero) partes.push(`Nº${ubicacion.numero}`);
    if (partes.length === 0 && ubicacion.descripcion) partes.push(ubicacion.descripcion);
    return partes.join(" · ") || "-";
  }

  function renderizarFormulario() {
    const pasillosAgrupados = getPasillosAgrupados();
    return (
      <div className="bg-white p-6 rounded-lg shadow-md space-y-4 mb-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">
          {editandoId ? "Editar ubicación" : "Nueva ubicación"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Tipo *</label>
            <select
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value);
                setUbicacionPadreId("");
                setPosicionLateral("");
                setPosicionLongitudinal("");
                setSeccionOrigenId("");
              }}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
            >
              <option value="pasillo">Pasillo (Estantería estándar)</option>
              <option value="armario">Armario (Módulo de estantes / gavetero)</option>
              <option value="alto">Alto (Nivel superior / altillo)</option>
              <option value="cross">Cross (Paso / ubicación cruzada)</option>
              <option value="caja">Caja (Contenedor / cubeta)</option>
              <option value="reserva">Reserva (Almacén / trastienda)</option>
            </select>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Estilo:</span>
              <BadgeTipoUbicacion tipo={tipo} size="sm" />
              <span className="text-xs text-gray-400 hidden sm:inline">
                · {getConfigTipo(tipo).descripcion}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Nombre *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Descripción</label>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        {tipo === "pasillo" && (
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Sección *</label>
            <select
              value={seccionId}
              onChange={(e) => setSeccionId(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Selecciona una sección</option>
              {secciones.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
        {(tipo === "armario" || tipo === "alto" || tipo === "cross") && (
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Pasillo padre *</label>
            <select
              value={ubicacionPadreId}
              onChange={(e) => setUbicacionPadreId(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Selecciona un pasillo</option>
              {pasillosAgrupados.map(({ seccion, pasillos }: any) => (
                <optgroup key={seccion.id} label={seccion.nombre}>
                  {pasillos.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        )}
        {(tipo === "armario" || tipo === "alto" || tipo === "caja") && (
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Sección (opcional)
            </label>
            <select
              value={seccionId}
              onChange={(e) => setSeccionId(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">— Heredar del pasillo padre —</option>
              {secciones.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
        {tipo === "cross" && (
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Sección de origen *
            </label>
            <select
              value={seccionOrigenId}
              onChange={(e) => setSeccionOrigenId(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">¿De qué sección son los productos?</option>
              {secciones.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
        {(tipo === "armario" || tipo === "alto" || tipo === "caja") && (
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Número</label>
            <input
              type="number"
              value={numero}
              onChange={(e) => setNumero(e.target.value === "" ? "" : parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
        )}
        {(tipo === "armario" || tipo === "alto" || tipo === "cross") && (
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Posición lateral *
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="posicionLateral"
                  value="izquierda"
                  checked={posicionLateral === "izquierda"}
                  onChange={(e) => setPosicionLateral(e.target.value)}
                />
                <span>Izquierda</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="posicionLateral"
                  value="derecha"
                  checked={posicionLateral === "derecha"}
                  onChange={(e) => setPosicionLateral(e.target.value)}
                />
                <span>Derecha</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="posicionLateral"
                  value="centro"
                  checked={posicionLateral === "centro"}
                  onChange={(e) => setPosicionLateral(e.target.value)}
                />
                <span>Centro</span>
              </label>
            </div>
          </div>
        )}
        {tipo === "cross" && (
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Posición longitudinal *
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="posicionLongitudinal"
                  value="principio"
                  checked={posicionLongitudinal === "principio"}
                  onChange={(e) => setPosicionLongitudinal(e.target.value)}
                />
                <span>Principio</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="posicionLongitudinal"
                  value="final"
                  checked={posicionLongitudinal === "final"}
                  onChange={(e) => setPosicionLongitudinal(e.target.value)}
                />
                <span>Final</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="posicionLongitudinal"
                  value="paso"
                  checked={posicionLongitudinal === "paso"}
                  onChange={(e) => setPosicionLongitudinal(e.target.value)}
                />
                <span>Paso</span>
              </label>
            </div>
          </div>
        )}
        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={guardarUbicacion}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            {editandoId ? "Actualizar" : "Crear"}
          </button>
          <button
            onClick={resetearFormulario}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
        </div>
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded border border-red-200 text-sm">
            {error}
          </div>
        )}
      </div>
    );
  }

  function FilaUbicacion({ ubicacion, esHijo = false }: { ubicacion: any; esHijo?: boolean }) {
    const numProductos = productosPorUbicacion.get(ubicacion.id) || 0;
    const tieneHijos = ubicaciones.some((h: any) => h.id_ubicacion_padre === ubicacion.id);
    const estaExpandido = expandidos.has(ubicacion.id);
    const config = getConfigTipo(ubicacion.tipo);
    const IconoUbicacion = config.icon;

    return (
      <div
        className={`grid grid-cols-12 gap-2 px-4 py-2.5 items-center transition-colors ${
          esHijo
            ? "pl-10 bg-slate-50/70 border-l-2 border-slate-300 ml-4 hover:bg-slate-100/80"
            : "hover:bg-blue-50/60 bg-white"
        }`}
      >
        <div className="col-span-4 flex items-center gap-2.5 min-w-0">
          {!esHijo && tieneHijos ? (
            <span className="text-gray-400 p-0.5">
              {estaExpandido ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </span>
          ) : !esHijo ? (
            <span className="w-4 shrink-0" />
          ) : (
            <span className="text-slate-400 text-xs font-mono shrink-0">└</span>
          )}

          <div
            className={`p-1.5 rounded-md border shrink-0 ${config.iconBgClass}`}
            title={config.label}
          >
            <IconoUbicacion className={esHijo ? "w-3.5 h-3.5" : "w-4 h-4"} />
          </div>

          <div className="flex flex-col min-w-0">
            <span
              className={`text-sm truncate ${
                esHijo ? "font-medium text-gray-800" : "font-semibold text-gray-900"
              }`}
            >
              {ubicacion.nombre}
            </span>
            {ubicacion.descripcion && (
              <span className="text-xs text-gray-500 truncate">{ubicacion.descripcion}</span>
            )}
          </div>
        </div>

        <div className="col-span-2">
          <BadgeTipoUbicacion tipo={ubicacion.tipo} size="sm" />
        </div>

        <div className="col-span-2 text-sm text-gray-600 truncate">{getDetalles(ubicacion)}</div>
        <div className="col-span-2 text-sm text-gray-600 truncate">{getSeccionReal(ubicacion)}</div>

        <div className="col-span-2 flex justify-end items-center gap-1.5">
          <button
            onClick={() => abrirStockUbicacion(ubicacion)}
            className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-medium transition-colors border ${
              numProductos > 0
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
            }`}
            title="Gestionar productos de esta ubicación"
          >
            <Package className="w-3.5 h-3.5" />
            <span>{numProductos > 0 ? `${numProductos} prod.` : "+ prod."}</span>
          </button>
          <button
            onClick={() => editarUbicacion(ubicacion)}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded-md transition-colors"
            title="Editar ubicación"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          {numProductos > 0 || tieneHijos ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                desactivarUbicacionHandler(ubicacion);
              }}
              className="text-amber-600 hover:text-amber-800 hover:bg-amber-50 p-1.5 rounded-md transition-colors"
              title="Desactivar ubicación"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                borrarDefinitivamente(ubicacion);
              }}
              className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1.5 rounded-md transition-colors"
              title="Borrar ubicación"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderizarTabla() {
    if (cargando) return <div className="text-center py-12 text-gray-500">Cargando...</div>;
    if (ubicaciones.length === 0) {
      return (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500">No hay ubicaciones.</p>
        </div>
      );
    }

    const agrupadas = getUbicacionesAgrupadas();

    return (
      <div className="bg-white rounded-lg shadow-xs border overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b flex flex-wrap justify-between items-center gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm text-gray-700">
              <strong>{ubicaciones.length}</strong> ubicaciones
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 border-l pl-3">
              {Object.values(CONFIG_TIPOS).map((cfg) => {
                const count = ubicaciones.filter((u: any) => u.tipo === cfg.tipo).length;
                if (count === 0 && cfg.tipo !== "pasillo" && cfg.tipo !== "armario") return null;
                const Icon = cfg.icon;
                return (
                  <span
                    key={cfg.tipo}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600 shadow-2xs"
                  >
                    <Icon className={`w-3 h-3 ${cfg.textColor}`} />
                    <span>
                      {cfg.label}: {count}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={expandirTodos}
              className="text-xs bg-white border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-md font-medium text-gray-700 shadow-2xs transition-colors"
            >
              ▼ Expandir todos
            </button>
            <button
              onClick={colapsarTodos}
              className="text-xs bg-white border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-md font-medium text-gray-700 shadow-2xs transition-colors"
            >
              ▶ Colapsar todos
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-gray-100/80 border-b text-xs font-semibold text-gray-600 uppercase tracking-wider">
          <div className="col-span-4">Ubicación</div>
          <div className="col-span-2">Tipo</div>
          <div className="col-span-2">Detalles</div>
          <div className="col-span-2">Sección</div>
          <div className="col-span-2 text-right">Acciones</div>
        </div>

        <div className="divide-y divide-gray-100">
          {agrupadas.map(({ padre, hijos }: any) => {
            const estaExpandido = expandidos.has(padre.id);
            const tieneHijos = hijos.length > 0;
            return (
              <div key={padre.id}>
                <div
                  className={tieneHijos ? "cursor-pointer" : ""}
                  onClick={() => tieneHijos && toggleExpandir(padre.id)}
                >
                  <FilaUbicacion ubicacion={padre} esHijo={false} />
                </div>
                {estaExpandido &&
                  hijos.map((hijo: any) => (
                    <FilaUbicacion key={hijo.id} ubicacion={hijo} esHijo={true} />
                  ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ---------- RENDER DEL MODAL ----------

  function renderizarModal() {
    const textoBusqueda = busqueda.trim().toLowerCase();
    const productosFiltrados = textoBusqueda
      ? productosUbicacion.filter(
          (p) =>
            p.nombre.toLowerCase().includes(textoBusqueda) ||
            (p.sku || "").toLowerCase().includes(textoBusqueda) ||
            (p.codigo_barras || "").toLowerCase().includes(textoBusqueda),
        )
      : productosUbicacion;

    return (
      <>
        <Dialog
          open={!!ubicacionStockAbierta}
          onOpenChange={(open) => {
            if (!open) cerrarModal();
          }}
        >
          <DialogContent
            className="max-w-3xl max-h-[85vh] overflow-y-auto"
            onInteractOutside={(e) => {
              if (escanerAbierto || ajusteRapido || productoAEliminar || confirmacionStockCero)
                e.preventDefault();
            }}
          >
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                {ubicacionStockAbierta && (
                  <BadgeTipoUbicacion tipo={ubicacionStockAbierta.tipo} size="md" />
                )}
                <span>Productos en: {ubicacionStockAbierta?.nombre}</span>
                {ubicacionStockAbierta?.ubicacion_padre_nombre && (
                  <span className="text-xs font-normal text-gray-500">
                    ({ubicacionStockAbierta.ubicacion_padre_nombre})
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
              <Input
                placeholder="Buscar por nombre, SKU o código de barras..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="max-w-xs"
                disabled={modalMode !== "ver"}
              />
              {modalMode === "ver" && (
                <Button
                  size="sm"
                  onClick={() => {
                    setModalMode("anadir");
                    setResultadosBusqueda(catalogoProductos);
                    setSinResultados(false);
                    setScanError("");
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  + Añadir producto
                </Button>
              )}
              {modalMode !== "ver" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    resetearModalForms();
                    setUbicacionStockAbierta(ubicacionStockAbierta);
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>

            {modalMode === "anadir" && (
              <div className="border border-blue-200 bg-blue-50/50 rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold text-gray-800">
                  Añadir producto a {ubicacionStockAbierta?.nombre}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                  <div className="space-y-1 relative">
                    <Label htmlFor="scan-codigo">Código de barras (escáner o manual)</Label>
                    <Input
                      id="scan-codigo"
                      autoFocus
                      placeholder="Busca por nombre, SKU o código (o selecciona de la lista)"
                      value={nuevoCodigoBarras}
                      onFocus={() => {
                        if (!nuevoCodigoBarras.trim() && !productoEscaneado) {
                          setResultadosBusqueda(catalogoProductos);
                          setSinResultados(false);
                        }
                      }}
                      onChange={(e) => {
                        setNuevoCodigoBarras(e.target.value);
                        setProductoEscaneado(null);
                        setScanError("");
                        autocompletarProductos(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          escanearCodigo();
                        }
                      }}
                    />

                    {/* LISTA DESPLEGABLE DE AUTOCOMPLETADO */}
                    {(buscandoProductos || sinResultados || resultadosBusqueda.length > 0) && (
                      <div className="absolute top-full left-0 z-50 mt-1 w-full border border-gray-200 rounded-lg bg-white shadow-lg max-h-80 overflow-y-auto divide-y divide-gray-100 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_#f1f5f9]">
                        {buscandoProductos ? (
                          <p className="px-3 py-2 text-sm text-gray-500 animate-pulse">
                            Buscando en todos los productos…
                          </p>
                        ) : resultadosBusqueda.length > 0 ? (
                          <>
                            <p className="px-3 py-1.5 text-xs text-gray-400 bg-gray-50 sticky top-0 z-10">
                              Mostrando {Math.min(visiblesLista, resultadosBusqueda.length)} de{" "}
                              {resultadosBusqueda.length} productos
                              {/* FIX 8: Aviso de inactivos */}
                              {totalRealesTabla !== null &&
                                totalRealesTabla > catalogoProductos.length && (
                                  <span className="text-amber-600">
                                    {" "}
                                    · {totalRealesTabla - catalogoProductos.length} inactivos no se
                                    muestran
                                  </span>
                                )}
                            </p>
                            {resultadosBusqueda.slice(0, visiblesLista).map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => seleccionarProductoBusqueda(p)}
                                className="w-full text-left px-3 py-3 text-sm hover:bg-gray-50 flex items-center justify-between gap-2"
                              >
                                <span className="font-semibold truncate">{p.nombre}</span>
                                <span className="text-xs text-gray-500 font-mono shrink-0">
                                  {p.sku} · {p.codigo_barras}
                                </span>
                              </button>
                            ))}
                            {visiblesLista < resultadosBusqueda.length && (
                              <div className="sticky bottom-0 bg-white p-2 z-10">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => setVisiblesLista((v) => v + 25)}
                                >
                                  Ver más ({resultadosBusqueda.length - visiblesLista} restantes)
                                </Button>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="px-3 py-2 text-sm text-gray-500">
                            No se encontraron productos
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEscanerAbierto(true)}
                      disabled={guardando}
                    >
                      {"\u{1F4F7} Escanear"}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => escanearCodigo()}
                      disabled={guardando}
                    >
                      🔍 Buscar
                    </Button>
                  </div>
                </div>

                {productoEscaneado && (
                  <div className="rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
                    <span className="font-semibold">{productoEscaneado.nombre}</span>
                    <span className="text-green-600"> · SKU: {productoEscaneado.sku}</span>
                    <span className="text-green-600">
                      {" "}
                      · ya existe en el catálogo, solo se ajustará su stock aquí
                    </span>
                  </div>
                )}

                {!productoEscaneado &&
                  nuevoCodigoBarras.trim() !== "" &&
                  scanError === "" &&
                  (nuevoSku !== "" || nuevoNombre !== "") && (
                    <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      No se encontró el código en el catálogo. Completa SKU y nombre para crear un
                      producto nuevo.
                    </div>
                  )}

                {!productoEscaneado &&
                  (nuevoSku !== "" ||
                    nuevoNombre !== "" ||
                    (nuevoCodigoBarras.trim() !== "" && scanError !== "")) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="nuevo-sku">SKU *</Label>
                        <Input
                          id="nuevo-sku"
                          value={nuevoSku}
                          onChange={(e) => setNuevoSku(e.target.value)}
                          placeholder="Ej: PINT-001"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="nuevo-nombre">Nombre *</Label>
                        <Input
                          id="nuevo-nombre"
                          value={nuevoNombre}
                          onChange={(e) => setNuevoNombre(e.target.value)}
                          placeholder="Ej: Esmalte blanco 750ml"
                        />
                      </div>
                    </div>
                  )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="nueva-cantidad">Cantidad *</Label>
                    <Input
                      id="nueva-cantidad"
                      type="number"
                      min={1}
                      value={nuevaCantidad}
                      onChange={(e) =>
                        setNuevaCantidad(e.target.value === "" ? "" : parseInt(e.target.value))
                      }
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button
                      size="default"
                      onClick={anadirProducto}
                      disabled={guardando}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {guardando ? "Guardando..." : "Guardar en ubicación"}
                    </Button>
                  </div>
                </div>

                {scanError && (
                  <div className="bg-red-50 text-red-700 p-2 rounded border border-red-200 text-sm">
                    {scanError}
                  </div>
                )}
              </div>
            )}

            {modalMode === "editar" && productoEditando && (
              <div className="border border-amber-200 bg-amber-50/60 rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold text-gray-800">
                  Editar cantidad: {productoEditando.nombre}
                  <span className="text-xs font-normal text-gray-500">
                    {" "}
                    (SKU {productoEditando.sku}) · actual: {productoEditando.cantidad} uds
                  </span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-[150px_auto] gap-2 items-end">
                  <div className="space-y-1">
                    <Label htmlFor="cantidad-edicion">Nueva cantidad</Label>
                    <Input
                      id="cantidad-edicion"
                      type="number"
                      min={0}
                      autoFocus
                      value={cantidadEdicion}
                      onChange={(e) =>
                        setCantidadEdicion(e.target.value === "" ? "" : parseInt(e.target.value))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          guardarCantidad();
                        }
                      }}
                    />
                    <p className="text-xs text-gray-500">
                      Pon 0 para quitar el producto de esta ubicación.
                    </p>
                  </div>
                  <Button
                    size="default"
                    onClick={guardarCantidad}
                    disabled={guardando}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {guardando ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </div>
              </div>
            )}

            {cargandoStock ? (
              <div className="py-8 text-center text-gray-500">Cargando...</div>
            ) : productosUbicacion.length === 0 ? (
              <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                No hay productos en esta ubicación todavía. Usa «+ Añadir producto» para empezar.
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[110px]">SKU</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead className="hidden sm:table-cell w-[140px]">Cód. barras</TableHead>
                      <TableHead className="text-right w-[90px]">Cantidad</TableHead>
                      <TableHead className="text-right w-[110px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-6">
                          Ningún resultado para «{busqueda}».
                        </TableCell>
                      </TableRow>
                    ) : (
                      productosFiltrados.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-xs">{p.sku || "—"}</TableCell>
                          <TableCell className="font-medium">{p.nombre}</TableCell>
                          <TableCell className="hidden sm:table-cell font-mono text-xs text-gray-500">
                            {p.codigo_barras || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary" className="text-base px-3 py-1">
                              {p.cantidad}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-blue-600 hover:text-blue-800 h-8 px-2"
                                onClick={() => iniciarEdicion(p)}
                                disabled={modalMode !== "ver"}
                                title="Modificar cantidad"
                              >
                                ✏️
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-amber-600 hover:text-amber-800 h-8 px-2"
                                onClick={() => abrirAjusteRapido(p)}
                                disabled={modalMode !== "ver" || !!ajusteRapido}
                                title="Ajuste rápido"
                              >
                                ⚡
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-800 h-8 px-2"
                                onClick={() => setProductoAEliminar(p)}
                                disabled={modalMode !== "ver" || !!ajusteRapido || guardando}
                                title="Quitar de esta ubicación"
                              >
                                🗑️
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="text-xs text-gray-500 flex justify-between">
              <span>{productosUbicacion.length} producto(s) en esta ubicación</span>
              <span>Total unidades: {productosUbicacion.reduce((n, p) => n + p.cantidad, 0)}</span>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!ajusteRapido}
          onOpenChange={(open) => {
            if (!open && !guardando) {
              setAjusteRapido(null);
              setNuevaCantidadAjuste("");
            }
          }}
        >
          <DialogContent className="w-[calc(100%-2rem)] max-w-sm">
            <DialogHeader>
              <DialogTitle>⚡ Ajuste rápido</DialogTitle>
              <DialogDescription>
                {ajusteRapido?.nombre} (SKU {ajusteRapido?.sku}) · actual: {ajusteRapido?.cantidad}{" "}
                uds
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="cantidad-ajuste-rapido">Nueva cantidad</Label>
                <Input
                  id="cantidad-ajuste-rapido"
                  type="number"
                  min={0}
                  autoFocus
                  value={nuevaCantidadAjuste}
                  onChange={(e) =>
                    setNuevaCantidadAjuste(e.target.value === "" ? "" : parseInt(e.target.value))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      guardarAjusteRapido();
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAjusteRapido(null);
                    setNuevaCantidadAjuste("");
                  }}
                  disabled={guardando}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={guardarAjusteRapido}
                  disabled={guardando}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {guardando ? "Guardando..." : "Guardar ajuste"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* FIX 6: MODAL SECUNDARIO: ESCÁNER DE CÁMARA (Ahora usa Dialog oficial) */}
        <Dialog open={escanerAbierto} onOpenChange={setEscanerAbierto}>
          <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-md overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{"\u{1F4F7} Escanear código de barras"}</DialogTitle>
              <DialogDescription>Apunta al código o escríbelo manualmente.</DialogDescription>
            </DialogHeader>
            <Escaner
              onCodigo={(codigo) => {
                setNuevoCodigoBarras(codigo);
                setProductoEscaneado(null);
                setScanError("");
                setEscanerAbierto(false);
                escanearCodigo(codigo);
              }}
              onCerrar={() => setEscanerAbierto(false)}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ubicaciones</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona la estructura jerárquica de tu tienda.
          </p>
        </div>
        <button
          onClick={() => {
            resetearFormulario();
            setMostrarFormulario(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium inline-flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva ubicación</span>
        </button>
      </div>

      {mostrarFormulario && renderizarFormulario()}
      {renderizarTabla()}

      {renderizarModal()}

      {/* MODAL 1: Confirmación de quitar producto de la ubicación */}
      <AlertDialog
        open={!!productoAEliminar}
        onOpenChange={(open) => !open && !guardando && setProductoAEliminar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quitar producto de esta ubicación?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas quitar «<strong>{productoAEliminar?.nombre}</strong>» de
              la ubicación <strong>{ubicacionStockAbierta?.nombre}</strong>?
              <br />
              <br />
              El producto seguirá existiendo en el catálogo general, pero su stock en esta ubicación
              pasará a 0.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={guardando} onClick={() => setProductoAEliminar(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={guardando}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmarEliminarProducto}
            >
              {guardando ? "Quitando..." : "Quitar producto"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL 2: Confirmación de ajuste de stock a 0 */}
      <AlertDialog
        open={!!confirmacionStockCero}
        onOpenChange={(open) => !open && !guardando && setConfirmacionStockCero(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ ¿Ajustar stock a 0?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Confirmar que el stock de <strong>{confirmacionStockCero?.producto.nombre}</strong>{" "}
              pasará a 0 en <strong>{ubicacionStockAbierta?.nombre}</strong>?
              <br />
              <br />
              El producto quedará registrado sin existencias en esta ubicación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={guardando} onClick={() => setConfirmacionStockCero(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={guardando}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmarAjusteCero}
            >
              {guardando ? "Ajustando…" : "Confirmar stock a 0"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL 3: Confirmación de desactivar ubicación */}
      <AlertDialog
        open={!!ubicacionADesactivar}
        onOpenChange={(open) => !open && setUbicacionADesactivar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar esta ubicación?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Deseas desactivar la ubicación «<strong>{ubicacionADesactivar?.nombre}</strong>»?
              <br />
              <br />
              La ubicación dejará de estar activa para nuevas operaciones, pero se conservarán todos
              sus datos y movimientos históricos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUbicacionADesactivar(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={confirmarDesactivarUbicacion}
            >
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL 4: Confirmación de borrar ubicación definitivamente */}
      <AlertDialog
        open={!!ubicacionABorrar}
        onOpenChange={(open) => !open && setUbicacionABorrar(null)}
      >
        <AlertDialogContent>
          {ubicacionABorrar && (productosPorUbicacion.get(ubicacionABorrar.id) || 0) > 0 ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>No se puede borrar la ubicación</AlertDialogTitle>
                <AlertDialogDescription>
                  No se puede borrar «<strong>{ubicacionABorrar.nombre}</strong>» porque contiene{" "}
                  <strong>{productosPorUbicacion.get(ubicacionABorrar.id)}</strong> producto(s) en
                  stock.
                  <br />
                  <br />
                  Para conservar la trazabilidad, desactiva la ubicación en su lugar usando el botón
                  ⏸️.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction onClick={() => setUbicacionABorrar(null)}>
                  Entendido
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>⚠️ ¿Borrar ubicación definitivamente?</AlertDialogTitle>
                <AlertDialogDescription>
                  ¿Estás seguro de que deseas eliminar permanentemente la ubicación «
                  <strong>{ubicacionABorrar?.nombre}</strong>»?
                  <br />
                  <br />
                  Esta acción no se puede deshacer y borrará la ubicación del sistema por completo.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setUbicacionABorrar(null)}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={confirmarBorrarUbicacion}
                >
                  Borrar definitivamente
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
