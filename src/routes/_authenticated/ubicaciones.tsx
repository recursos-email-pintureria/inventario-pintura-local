import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
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
  buscarProductosPorCodigo,
  guardarProducto,
} from "../../lib/inventario";
import type { Producto, ProductoConCantidad } from "../../lib/inventario";
import { supabase } from "../../lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

export const Route = createFileRoute("/_authenticated/ubicaciones")({
  component: UbicacionesPage,
});

// ✅ BADGES DE COLORES POR TIPO
function getColorBadge(tipo: string): string {
  const colores: Record<string, string> = {
    pasillo: "bg-blue-500 text-white border-blue-600",
    armario: "bg-green-500 text-white border-green-600",
    alto: "bg-emerald-500 text-white border-emerald-600",
    cross: "bg-purple-500 text-white border-purple-600",
    caja: "bg-yellow-500 text-white border-yellow-600",
    reserva: "bg-gray-500 text-white border-gray-600",
  };
  return colores[tipo] || "bg-gray-200 text-gray-800";
}

function getTipoLabel(tipo: string): string {
  return tipo.toUpperCase();
}

// ✅ ICONOS POR TIPO: se usan códigos Unicode explícitos (\u{...})
// para evitar que los emojis se corrompan al copiar el código desde chats de IA.
function getIconoTipo(tipo: string): string {
  const iconos: Record<string, string> = {
    pasillo: "\u{1F6E3}\u{FE0F}", // señal de carretera
    armario: "\u{1F5C4}\u{FE0F}", // archivador
    alto: "\u{1F4E6}", // paquete
    cross: "\u{1F504}", // flechas cruzadas
    caja: "\u{1F4B3}", // tarjeta
    reserva: "\u{1F3ED}", // fábrica
  };
  return iconos[tipo] || "\u{1F4CD}"; // chincheta (por defecto)
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
  // Resultados de la búsqueda por código (desplegable bajo el input)
  const [resultadosBusqueda, setResultadosBusqueda] = useState<Producto[]>([]);

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
    setResultadosBusqueda([]);
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

  async function guardarCantidad() {
    if (!ubicacionStockAbierta || !productoEditando) return;
    if (cantidadEdicion === "" || !Number.isInteger(cantidadEdicion) || cantidadEdicion < 0) {
      toast.error("Introduce una cantidad entera ≥ 0.");
      return;
    }
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
      setUbicacionStockAbierta(ubicacionStockAbierta); // mantener el modal abierto
    } catch (err: any) {
      toast.error(errorInventario(err));
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarProducto(producto: ProductoConCantidad) {
    if (!ubicacionStockAbierta) return;
    if (
      !confirm(
        `¿Quitar "${producto.nombre}" de ${ubicacionStockAbierta.nombre}? El producto seguirá existiendo en el catálogo.`,
      )
    )
      return;
    try {
      setGuardando(true);
      // Movimiento tipo 'salida' con cantidad 0 vía actualizarStock (misma
      // lógica que ✏️: solo se inserta el movimiento; el trigger fija la
      // cantidad a 0 y así desaparece del armario).
      const { sinCambios } = await actualizarStock(producto.id, ubicacionStockAbierta.id, 0, {
        tipo: "salida",
        notas: `SALIDA - Producto retirado de ${ubicacionStockAbierta.nombre}`,
      });
      await recargarProductosUbicacion(ubicacionStockAbierta.id);
      if (sinCambios) {
        toast.info(`"${producto.nombre}" ya estaba a 0 en esta ubicación`);
      } else {
        toast.success(`"${producto.nombre}" eliminado de esta ubicación`);
      }
    } catch (err: any) {
      toast.error(errorInventario(err));
    } finally {
      setGuardando(false);
    }
  }

  // Escáner / búsqueda por código de barras: despliega lista de coincidencias
  // para seleccionar; si no hay ninguna, permite crear el producto nuevo.
  async function escanearCodigo() {
    setScanError("");
    setProductoEscaneado(null);
    setResultadosBusqueda([]);
    if (!nuevoCodigoBarras.trim()) {
      setScanError("Introduce o escanea un código de barras.");
      return;
    }
    try {
      setGuardando(true);
      const coincidencias = await buscarProductosPorCodigo(nuevoCodigoBarras);
      if (coincidencias.length === 1) {
        seleccionarProductoBusqueda(coincidencias[0]);
        toast.success(`Producto encontrado: ${coincidencias[0].nombre}`);
      } else if (coincidencias.length > 1) {
        setResultadosBusqueda(coincidencias);
        toast.info(`${coincidencias.length} productos coinciden. Selecciona uno.`);
      } else {
        setNuevoSku("");
        setNuevoNombre("");
        toast.info("No existe ningún producto con ese código. Complétalo para crearlo.");
      }
    } catch (err: any) {
      setScanError(errorInventario(err));
    } finally {
      setGuardando(false);
    }
  }

  function seleccionarProductoBusqueda(p: Producto) {
    setProductoEscaneado({ id: p.id, sku: p.sku, nombre: p.nombre });
    setNuevoCodigoBarras(p.codigo_barras);
    setResultadosBusqueda([]);
    setScanError("");
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
        // Crear producto nuevo reutilizando la función existente de inventario.ts
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
      setUbicacionStockAbierta(ubicacionStockAbierta); // mantener el modal abierto
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

  async function desactivarUbicacionHandler(id: string) {
    if (!confirm("¿Desactivar esta ubicación?")) return;
    try {
      await desactivarUbicacion(id);
      await cargarDatos();
    } catch (err: any) {
      setError(errorInventario(err));
    }
  }

  async function borrarDefinitivamente(id: string) {
    const numProductos = productosPorUbicacion.get(id) || 0;
    if (numProductos > 0) {
      alert("No se puede borrar: hay productos en esta ubicación. Desactívala en su lugar.");
      return;
    }
    if (!confirm("⚠️ ¿Borrar DEFINITIVAMENTE?")) return;
    try {
      await borrarUbicacionDefinitivamente(id);
      await cargarDatos();
    } catch (err: any) {
      setError(errorInventario(err));
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

  // ✅ PROBLEMA 1: los pasillos ahora muestran descripción o secciones asociadas
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
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="pasillo">PASILLO</option>
              <option value="armario">ARMARIO</option>
              <option value="alto">ALTO</option>
              <option value="cross">CROSS</option>
              <option value="caja">CAJA</option>
              <option value="reserva">RESERVA</option>
            </select>
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
    const colorBadge = getColorBadge(ubicacion.tipo);

    return (
      <div
        className={`grid grid-cols-12 gap-2 px-4 py-2 items-center ${esHijo ? "pl-12 bg-gray-50 border-l-2 border-gray-300 ml-4" : "hover:bg-blue-50"}`}
      >
        <div className="col-span-4 flex items-center gap-2">
          {esHijo && <span className="text-gray-400 text-xs">─</span>}
          <span className={`text-sm ${esHijo ? "font-medium" : "font-semibold"}`}>
            {ubicacion.nombre}
          </span>
          {ubicacion.descripcion && (
            <span className="text-xs text-gray-500 truncate">({ubicacion.descripcion})</span>
          )}
        </div>
        <div className="col-span-2">
          <span className={`px-3 py-1 rounded text-xs font-bold ${colorBadge}`}>
            {getIconoTipo(ubicacion.tipo)} {getTipoLabel(ubicacion.tipo)}
          </span>
        </div>
        <div className="col-span-2 text-sm text-gray-600">{getDetalles(ubicacion)}</div>
        <div className="col-span-2 text-sm text-gray-600">{getSeccionReal(ubicacion)}</div>
        <div className="col-span-2 flex justify-end gap-1">
          <button
            onClick={() => abrirStockUbicacion(ubicacion)}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded font-medium ${numProductos > 0 ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
            title="Gestionar productos de esta ubicación"
          >
            {numProductos > 0 ? `${numProductos} prod.` : "+ prod."}
          </button>
          <button
            onClick={() => editarUbicacion(ubicacion)}
            className="text-blue-600 hover:text-blue-800 p-1 rounded"
            title="Editar"
          >
            ✏️
          </button>
          {numProductos > 0 || tieneHijos ? (
            <button
              onClick={() => desactivarUbicacionHandler(ubicacion.id)}
              className="text-orange-600 hover:text-orange-800 p-1 rounded"
              title="Desactivar"
            >
              ⏸️
            </button>
          ) : (
            <button
              onClick={() => borrarDefinitivamente(ubicacion.id)}
              className="text-red-600 hover:text-red-800 p-1 rounded"
              title="Borrar"
            >
              🗑️
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
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <strong>{ubicaciones.length}</strong> ubicaciones
          </div>
          <div className="flex gap-2">
            <button onClick={expandirTodos} className="text-xs bg-white border px-3 py-1 rounded">
              ▼ Expandir
            </button>
            <button onClick={colapsarTodos} className="text-xs bg-white border px-3 py-1 rounded">
              ▶ Colapsar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-100 border-b text-xs font-semibold text-gray-600 uppercase">
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

  // Autocompletado del buscador: coincidencias de la ubicación por nombre/SKU/código
  const sugerenciasBusqueda = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return [];
    return productosUbicacion
      .filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          (p.sku || "").toLowerCase().includes(q) ||
          (p.codigo_barras || "").toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [busqueda, productosUbicacion]);

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
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <span
                className={`px-3 py-1 rounded text-xs font-bold ${ubicacionStockAbierta ? getColorBadge(ubicacionStockAbierta.tipo) : ""}`}
              >
                {ubicacionStockAbierta
                  ? `${getIconoTipo(ubicacionStockAbierta.tipo)} ${getTipoLabel(ubicacionStockAbierta.tipo)}`
                  : ""}
              </span>
              <span>Productos en: {ubicacionStockAbierta?.nombre}</span>
              {ubicacionStockAbierta?.ubicacion_padre_nombre && (
                <span className="text-xs font-normal text-gray-500">
                  ({ubicacionStockAbierta.ubicacion_padre_nombre})
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Barra de acciones: buscador + añadir */}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
            <div className="relative max-w-xs w-full">
              <Input
                placeholder="Buscar por nombre, SKU o código de barras..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && sugerenciasBusqueda.length > 0) {
                    e.preventDefault();
                    setBusqueda(sugerenciasBusqueda[0]?.nombre ?? "");
                  }
                  if (e.key === "Escape") setBusqueda("");
                }}
                disabled={modalMode !== "ver"}
              />
              {/* Autocompletado: coincidencias bajo el input */}
              {modalMode === "ver" && busqueda.trim() && (
                <div className="absolute top-full left-0 z-20 mt-1 w-full border border-gray-200 rounded-md bg-white shadow-sm max-h-48 overflow-y-auto divide-y divide-gray-100">
                  {sugerenciasBusqueda.length > 0 ? (
                    sugerenciasBusqueda.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setBusqueda(p.nombre)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center justify-between gap-2"
                      >
                        <span className="font-medium truncate">{p.nombre}</span>
                        <span className="text-xs text-gray-500 font-mono shrink-0">
                          {p.sku} · {p.cantidad} uds
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-2 text-sm text-gray-500">Sin coincidencias.</p>
                  )}
                </div>
              )}
            </div>
            {modalMode === "ver" && (
              <Button
                size="sm"
                onClick={() => setModalMode("anadir")}
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

          {/* FORMULARIO INLINE: AÑADIR PRODUCTO */}
          {modalMode === "anadir" && (
            <div className="border border-blue-200 bg-blue-50/50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-800">
                Añadir producto a {ubicacionStockAbierta?.nombre}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                <div className="space-y-1">
                  <Label htmlFor="scan-codigo">Código de barras (escáner o manual)</Label>
                  <Input
                    id="scan-codigo"
                    autoFocus
                    placeholder="Escanea o escribe el código y pulsa Buscar"
                    value={nuevoCodigoBarras}
                    onChange={(e) => {
                      setNuevoCodigoBarras(e.target.value);
                      setProductoEscaneado(null);
                      setScanError("");
                      setResultadosBusqueda([]);
                      // Autocompletado en vivo mientras se escribe el código
                      const q = e.target.value.trim().toLowerCase();
                      if (q.length >= 2) {
                        const coincidenciasUbicacion = productosUbicacion.filter(
                          (p) =>
                            p.codigo_barras?.toLowerCase().includes(q) ||
                            p.sku?.toLowerCase().includes(q) ||
                            p.nombre.toLowerCase().includes(q),
                        );
                        if (coincidenciasUbicacion.length > 0) {
                          setResultadosBusqueda(coincidenciasUbicacion.slice(0, 8));
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        escanearCodigo();
                      }
                    }}
                  />
                  {/* Desplegable de resultados de búsqueda por código */}
                  {resultadosBusqueda.length > 0 && (
                    <div className="border border-blue-200 rounded-md bg-white shadow-sm max-h-48 overflow-y-auto divide-y divide-gray-100">
                      {resultadosBusqueda.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => seleccionarProductoBusqueda(p)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center justify-between gap-2"
                        >
                          <span className="font-medium truncate">{p.nombre}</span>
                          <span className="text-xs text-gray-500 font-mono shrink-0">
                            {p.sku} · {p.codigo_barras}
                          </span>
                        </button>
                      ))}
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
                    onClick={escanearCodigo}
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

          {/* FILA INLINE: EDITAR CANTIDAD */}
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

          {/* TABLA DE PRODUCTOS */}
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
                              className="text-red-600 hover:text-red-800 h-8 px-2"
                              onClick={() => eliminarProducto(p)}
                              disabled={modalMode !== "ver"}
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
      {/* MODAL SECUNDARIO: ESCÁNER DE CÁMARA (html5-qrcode) */}
      {escanerAbierto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg space-y-4">
            <h2 className="text-lg font-semibold">{"\u{1F4F7} Escanear código de barras"}</h2>
            <Escaner
              onCodigo={(codigo) => {
                setNuevoCodigoBarras(codigo);
                setProductoEscaneado(null);
                setScanError("");
                setEscanerAbierto(false);
              }}
              onCerrar={() => setEscanerAbierto(false)}
            />
          </div>
        </div>
      )}
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
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
        >
          + Nueva ubicación
        </button>
      </div>

      {mostrarFormulario && renderizarFormulario()}
      {renderizarTabla()}

      {renderizarModal()}
    </div>
  );
}
