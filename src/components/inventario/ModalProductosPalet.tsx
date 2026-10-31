import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ajustarCantidadProductoEnPalet,
  cargarProductosPalet,
  desactivarPalet,
  eliminarProductoDePalet,
  guardarProductoEnPalet,
  paletsPorReservaQueryOptions,
  type Palet,
} from "@/lib/palets";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Boxes,
  Barcode,
  Package,
  Calendar,
  User,
  Printer,
  Trash2,
  Plus,
  Loader2,
  AlertTriangle,
  Search,
  CheckCircle2,
  ArrowLeft,
  X,
  MapPin,
  Pencil,
} from "lucide-react";

export interface ProductoPaletItem {
  id: string;
  id_producto: string;
  codigo_barras: string;
  sku: string;
  nombre: string;
  cantidad: number;
}

interface ProductoCatalogo {
  id: string;
  codigo_barras: string | null;
  sku: string;
  nombre: string;
}

type ProductoPaletOperacion =
  | {
      tipo: "anadir";
      id_palet: string;
      id_reserva: string;
      id_producto: string;
      cantidad: number;
    }
  | {
      tipo: "ajustar";
      id_palet: string;
      id_reserva: string;
      id_producto: string;
      cantidad_actual: number;
      cantidad: number;
    }
  | { tipo: "eliminar"; id_palet: string; id_reserva: string; id_producto: string };

interface ModalProductosPaletProps {
  palet: Palet | null;
  abierto: boolean;
  onOpenChange: (open: boolean) => void;
  onPaletDesactivado?: (paletId: string) => void;
}

export function ModalProductosPalet({
  palet,
  abierto,
  onOpenChange,
  onPaletDesactivado,
}: ModalProductosPaletProps) {
  const queryClient = useQueryClient();

  // Estados de vista y gestión
  const [modo, setModo] = useState<"lista" | "anadir" | "etiqueta" | "listado_impresion">("lista");
  const [busqueda, setBusqueda] = useState("");

  // Estados para añadir/editar producto
  const [inputBusquedaCatalogo, setInputBusquedaCatalogo] = useState("");
  const [catalogoSugerencias, setCatalogoSugerencias] = useState<ProductoCatalogo[]>([]);
  const [buscandoCatalogo, setBuscandoCatalogo] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoCatalogo | null>(null);
  const [cantidadNueva, setCantidadNueva] = useState<number | "">(1);

  // Edición directa de cantidad
  const [editandoItem, setEditandoItem] = useState<ProductoPaletItem | null>(null);
  const [cantidadEdicion, setCantidadEdicion] = useState<number | "">("");

  // Modales de confirmación
  const [confirmarBajaManual, setConfirmarBajaManual] = useState(false);
  const [confirmarAutodestruccion, setConfirmarAutodestruccion] = useState(false);
  const [ejecutandoBaja, setEjecutandoBaja] = useState(false);

  // 🖨️ INYECTAR ESTILOS DE IMPRESIÓN AL MONTAR EL COMPONENTE
  useEffect(() => {
    const styleId = "print-styles-palet";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @media print {
          /* 1. Ocultar el overlay oscuro del modal (Radix UI) */
          [data-radix-dialog-overlay],
          div[style*="background-color: rgba(0, 0, 0, 0.8)"] {
            display: none !important;
          }

          /* 2. Resetear el contenedor del modal para que no tenga posición fija */
          [data-radix-dialog-content] {
            position: static !important;
            transform: none !important;
            max-height: none !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
            overflow: visible !important;
          }

          /* 3. Ocultar elementos de la UI que no deben imprimirse */
          .no-print {
            display: none !important;
          }

          /* 4. Asegurar que el área de impresión sea visible y tenga fondo blanco */
          .print-area {
            display: block !important;
            background: white !important;
            padding: 20px !important;
            width: 100% !important;
            max-width: 100% !important;
            border: 1px solid #e5e7eb !important;
          }

          /* 5. Forzar impresión de colores de fondo */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* 6. Configuración de la página */
          @page {
            margin: 1cm;
            size: auto;
          }
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);

  // Consulta reactiva de productos dentro del palet
  const {
    data: productosDatos = [],
    isLoading: cargandoProductos,
    error: errorProductos,
    refetch: refetchProductos,
  } = useQuery({
    queryKey: ["palet-productos", palet?.id],
    queryFn: () => {
      if (!palet?.id) return [];
      return cargarProductosPalet(palet.id);
    },
    enabled: Boolean(abierto && palet?.id),
  });
  const productos: ProductoPaletItem[] = productosDatos.map((item) => ({
    id: item.id_producto,
    id_producto: item.id_producto,
    codigo_barras: item.codigo_barras ?? "",
    sku: item.sku ?? "",
    nombre: item.nombre ?? "Producto sin nombre",
    cantidad: item.cantidad,
  }));

  const productoMutation = useMutation({
    mutationFn: async (operacion: ProductoPaletOperacion) => {
      if (operacion.tipo === "anadir") return guardarProductoEnPalet(operacion);
      if (operacion.tipo === "ajustar") return ajustarCantidadProductoEnPalet(operacion);
      return eliminarProductoDePalet(
        operacion.id_palet,
        operacion.id_producto,
        operacion.id_reserva,
      );
    },
    onSuccess: async (_data, operacion) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inventario"] }),
        queryClient.invalidateQueries({ queryKey: ["movimientos"] }),
        queryClient.invalidateQueries({ queryKey: ["palet-productos", operacion.id_palet] }),
        queryClient.invalidateQueries({ queryKey: ["stock"] }),
        queryClient.invalidateQueries({
          queryKey: palet ? paletsPorReservaQueryOptions(palet.id_reserva).queryKey : ["palets"],
        }),
        queryClient.invalidateQueries({ queryKey: ["palets"] }),
      ]);
    },
  });
  const guardando = productoMutation.isPending || ejecutandoBaja;

  // Reset al abrir o cambiar de palet
  useEffect(() => {
    if (abierto) {
      setModo("lista");
      setBusqueda("");
      setInputBusquedaCatalogo("");
      setCatalogoSugerencias([]);
      setProductoSeleccionado(null);
      setCantidadNueva(1);
      setEditandoItem(null);
      setConfirmarBajaManual(false);
      setConfirmarAutodestruccion(false);
    }
  }, [abierto, palet?.id]);

  // Búsqueda de productos en el catálogo
  useEffect(() => {
    const texto = inputBusquedaCatalogo.trim();
    if (!texto || texto.length < 2) {
      setCatalogoSugerencias([]);
      return;
    }

    let cancelado = false;
    const temporizador = setTimeout(async () => {
      setBuscandoCatalogo(true);
      try {
        const { data, error } = await supabase
          .from("productos")
          .select("id, codigo_barras, sku, nombre")
          .eq("activo", true)
          .or(`nombre.ilike.%${texto}%,sku.ilike.%${texto}%,codigo_barras.ilike.%${texto}%`)
          .limit(8);

        if (!cancelado && !error && data) {
          setCatalogoSugerencias(data);
        }
      } catch (err) {
        console.error("Error buscando en catálogo:", err);
      } finally {
        if (!cancelado) setBuscandoCatalogo(false);
      }
    }, 200);

    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, [inputBusquedaCatalogo]);

  const totalUnidades = productos.reduce((sum, p) => sum + p.cantidad, 0);
  const totalLineas = productos.length;

  const productosFiltrados = busqueda.trim()
    ? productos.filter(
        (p) =>
          p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          p.sku.toLowerCase().includes(busqueda.toLowerCase()) ||
          p.codigo_barras.toLowerCase().includes(busqueda.toLowerCase()),
      )
    : productos;

  async function ejecutarDesactivacionPalet() {
    if (!palet) return;
    try {
      setEjecutandoBaja(true);
      await desactivarPalet(palet.id);

      toast.success(`Palet ${palet.codigo_barras} dado de baja correctamente.`);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inventario"] }),
        queryClient.invalidateQueries({ queryKey: ["movimientos"] }),
        queryClient.invalidateQueries({ queryKey: ["stock"] }),
        queryClient.invalidateQueries({ queryKey: ["palets", palet.id_reserva] }),
        queryClient.invalidateQueries({ queryKey: ["palet-productos", palet.id] }),
      ]);

      onPaletDesactivado?.(palet.id);
      setConfirmarBajaManual(false);
      setConfirmarAutodestruccion(false);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(`Error al dar de baja el palet: ${err.message || err}`);
    } finally {
      setEjecutandoBaja(false);
    }
  }

  async function handleGuardarProductoEnPalet() {
    if (!palet || !productoSeleccionado) {
      toast.error("Selecciona un producto del catálogo");
      return;
    }
    const cant =
      typeof cantidadNueva === "number" ? cantidadNueva : parseInt(String(cantidadNueva));
    if (isNaN(cant) || cant <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    try {
      await productoMutation.mutateAsync({
        tipo: "anadir",
        id_palet: palet.id,
        id_reserva: palet.id_reserva,
        id_producto: productoSeleccionado.id,
        cantidad: cant,
      });

      toast.success(`${cant} uds de "${productoSeleccionado.nombre}" añadidas al palet`);
      await refetchProductos();
      setModo("lista");
      setProductoSeleccionado(null);
      setInputBusquedaCatalogo("");
      setCantidadNueva(1);
    } catch (err: any) {
      toast.error(`Error al registrar producto en palet: ${err.message || err}`);
    }
  }

  async function handleGuardarEdicionCantidad() {
    if (!palet || !editandoItem) return;
    const nuevaCant =
      typeof cantidadEdicion === "number" ? cantidadEdicion : parseInt(String(cantidadEdicion));

    if (isNaN(nuevaCant) || nuevaCant < 0) {
      toast.error("Introduce una cantidad válida (0 o superior)");
      return;
    }

    try {
      await productoMutation.mutateAsync({
        tipo: "ajustar",
        id_palet: palet.id,
        id_reserva: palet.id_reserva,
        id_producto: editandoItem.id_producto,
        cantidad_actual: editandoItem.cantidad,
        cantidad: nuevaCant,
      });

      if (nuevaCant === 0) {
        toast.info(`"${editandoItem.nombre}" retirado del palet`);
      } else {
        toast.success(`Cantidad actualizada a ${nuevaCant} uds`);
      }

      const resultado = await refetchProductos();
      if (resultado.isError) {
        toast.error(
          `No se pudo verificar el stock restante del palet: ${
            resultado.error instanceof Error ? resultado.error.message : "Error desconocido"
          }`,
        );
        return;
      }
      const restantes = resultado.data;
      const nuevoTotal = (restantes ?? []).reduce((acc, it) => acc + it.cantidad, 0);

      setEditandoItem(null);

      if (nuevoTotal === 0) {
        setConfirmarAutodestruccion(true);
      }
    } catch (err: any) {
      toast.error(`Error al actualizar cantidad: ${err.message || err}`);
    }
  }

  async function handleEliminarProductoDirecto(item: ProductoPaletItem) {
    if (!palet) return;
    try {
      await productoMutation.mutateAsync({
        tipo: "eliminar",
        id_palet: palet.id,
        id_reserva: palet.id_reserva,
        id_producto: item.id_producto,
      });

      toast.info(`"${item.nombre}" retirado del palet`);
      const resultado = await refetchProductos();
      if (resultado.isError) {
        toast.error(
          `No se pudo verificar el stock restante del palet: ${
            resultado.error instanceof Error ? resultado.error.message : "Error desconocido"
          }`,
        );
        return;
      }
      const restantes = resultado.data;
      const nuevoTotal = (restantes ?? []).reduce((acc, it) => acc + it.cantidad, 0);

      if (nuevoTotal === 0) {
        setConfirmarAutodestruccion(true);
      }
    } catch (err: any) {
      toast.error(`Error al eliminar producto: ${err.message || err}`);
    }
  }

  function lanzarImpresion() {
    window.print();
  }

  if (!palet) return null;

  const fechaFormateada = new Date(palet.generado_en).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <>
      <Dialog open={abierto} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          {/* CABECERA PRINCIPAL DEL PALET (Se oculta al imprimir) */}
          <div className="bg-amber-600 text-white p-5 rounded-t-lg no-print">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/80 rounded-lg shadow-inner">
                  <Boxes className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs uppercase tracking-wider bg-amber-700/80 px-2 py-0.5 rounded text-amber-100 font-semibold">
                      Palet #{String(palet.numero_palet).padStart(3, "0")}
                    </span>
                    {totalUnidades === 0 && (
                      <Badge className="bg-amber-100 text-amber-900 border-none text-[10px] font-bold">
                        Stock 0
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-xl font-extrabold tracking-tight mt-0.5">
                    {palet.codigo_barras}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setModo("etiqueta")}
                  className="bg-white text-amber-900 hover:bg-amber-50 h-8 text-xs font-semibold gap-1 shadow-2xs"
                  title="Generar e imprimir etiqueta"
                >
                  <Barcode className="w-3.5 h-3.5 text-amber-700" />
                  <span>Imprimir etiqueta</span>
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setModo("listado_impresion")}
                  className="bg-white text-amber-900 hover:bg-amber-50 h-8 text-xs font-semibold gap-1 shadow-2xs"
                  title="Imprimir albarán / desglose"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-700" />
                  <span>Imprimir listado</span>
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setConfirmarBajaManual(true)}
                  disabled={cargandoProductos || Boolean(errorProductos) || totalUnidades > 0}
                  className="h-8 text-xs font-semibold gap-1 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 disabled:bg-rose-900/60"
                  title={
                    cargandoProductos || errorProductos
                      ? "No se puede dar de baja hasta verificar el stock del palet"
                      : totalUnidades > 0
                        ? "Solo se puede dar de baja cuando el stock total sea 0"
                        : "Dar de baja palet vacío"
                  }
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Dar de baja</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-amber-500/60 text-xs text-amber-100">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                <span className="truncate">
                  Creado por: <strong>{palet.generado_por}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                <span>
                  Fecha: <strong>{fechaFormateada}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                <span className="truncate">
                  Ubicación: <strong>{palet.reserva_nombre || "Reserva"}</strong>
                </span>
              </div>
              <div className="flex items-center justify-end gap-1.5 font-semibold text-white">
                <Package className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                <span>
                  {totalLineas} prod. ({totalUnidades} uds)
                </span>
              </div>
            </div>
          </div>

          {/* CUERPO DEL MODAL */}
          <div className="p-5 space-y-4">
            {/* VISTA 1: LISTADO DE PRODUCTOS */}
            {modo === "lista" && (
              <>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 no-print">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      placeholder="Filtrar por nombre, SKU o código..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="pl-9 text-xs h-9"
                    />
                    {busqueda && (
                      <button
                        onClick={() => setBusqueda("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setModo("anadir");
                      setInputBusquedaCatalogo("");
                      setProductoSeleccionado(null);
                      setCantidadNueva(1);
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 h-9 text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Añadir más productos</span>
                  </Button>
                </div>

                {editandoItem && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2 animate-in fade-in no-print">
                    <div className="flex justify-between items-center text-xs font-semibold text-amber-950">
                      <span>Editar cantidad: {editandoItem.nombre}</span>
                      <span className="font-mono text-gray-600">SKU: {editandoItem.sku}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        autoFocus
                        value={cantidadEdicion}
                        onChange={(e) =>
                          setCantidadEdicion(e.target.value === "" ? "" : parseInt(e.target.value))
                        }
                        className="w-32 bg-white text-xs h-8"
                      />
                      <Button
                        size="sm"
                        onClick={handleGuardarEdicionCantidad}
                        disabled={guardando}
                        className="bg-amber-600 hover:bg-amber-700 text-white h-8 text-xs"
                      >
                        {guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Guardar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditandoItem(null)}
                        className="h-8 text-xs text-gray-600"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {cargandoProductos ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                    <span>Consultando existencias...</span>
                  </div>
                ) : errorProductos ? (
                  <p className="rounded border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                    No se pudieron consultar los productos del palet:{" "}
                    {errorProductos instanceof Error ? errorProductos.message : "Error desconocido"}
                  </p>
                ) : productosFiltrados.length === 0 ? (
                  <div className="py-10 border-2 border-dashed border-gray-200 rounded-lg text-center p-6 space-y-2 bg-gray-50/50">
                    <Package className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-sm font-semibold text-gray-700">
                      {busqueda ? "Sin resultados" : "Palet vacío"}
                    </p>
                    {!busqueda && (
                      <Button
                        size="sm"
                        onClick={() => setModo("anadir")}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs mt-2"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        <span>Añadir primer producto</span>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs divide-y divide-gray-200">
                      <thead className="bg-gray-100/90 text-gray-600 uppercase text-[10px] font-semibold tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Código</th>
                          <th className="py-2.5 px-3">SKU</th>
                          <th className="py-2.5 px-3">Producto</th>
                          <th className="py-2.5 px-3 text-right">Cantidad</th>
                          <th className="py-2.5 px-3 text-right no-print">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {productosFiltrados.map((item) => (
                          <tr
                            key={item.id_producto}
                            className="hover:bg-amber-50/40 transition-colors"
                          >
                            <td className="py-2.5 px-3 font-mono text-gray-600">
                              {item.codigo_barras || "-"}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-semibold text-gray-800">
                              {item.sku || "-"}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-gray-900">{item.nombre}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-amber-900">
                              {item.cantidad} uds
                            </td>
                            <td className="py-2.5 px-3 text-right no-print">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditandoItem(item);
                                    setCantidadEdicion(item.cantidad);
                                  }}
                                  className="h-7 w-7 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleEliminarProductoDirecto(item)}
                                  className="h-7 w-7 text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* VISTA 2: AÑADIR PRODUCTO */}
            {modo === "anadir" && (
              <div className="space-y-4 border border-amber-200 bg-amber-50/40 rounded-lg p-4 no-print">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setModo("lista")}
                      className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                      <span>Volver</span>
                    </Button>
                    <span className="text-xs font-bold text-gray-800">Añadir mercancía</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <Label
                      htmlFor="buscar-catalogo"
                      className="text-xs font-semibold text-gray-700"
                    >
                      Buscar en catálogo:
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="buscar-catalogo"
                        autoFocus
                        placeholder="Escribe al menos 2 letras..."
                        value={inputBusquedaCatalogo}
                        onChange={(e) => setInputBusquedaCatalogo(e.target.value)}
                        className="text-xs bg-white"
                      />
                      {buscandoCatalogo && (
                        <Loader2 className="w-4 h-4 animate-spin text-amber-600 absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>

                    {catalogoSugerencias.length > 0 && !productoSeleccionado && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto divide-y divide-gray-100">
                        {catalogoSugerencias.map((prod) => (
                          <div
                            key={prod.id}
                            onClick={() => {
                              setProductoSeleccionado(prod);
                              setInputBusquedaCatalogo(prod.nombre);
                              setCatalogoSugerencias([]);
                            }}
                            className="p-2.5 hover:bg-amber-50 cursor-pointer flex items-center justify-between text-xs"
                          >
                            <div className="truncate">
                              <div className="font-semibold text-gray-900 truncate">
                                {prod.nombre}
                              </div>
                              <div className="text-[10px] text-gray-500 font-mono">
                                SKU: {prod.sku} · {prod.codigo_barras || "-"}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-[10px] shrink-0"
                            >
                              Seleccionar
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {productoSeleccionado && (
                    <div className="p-3 bg-white border border-emerald-300 rounded-md space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Seleccionado:</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setProductoSeleccionado(null);
                            setInputBusquedaCatalogo("");
                          }}
                          className="h-6 text-[10px] text-gray-500"
                        >
                          Cambiar
                        </Button>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {productoSeleccionado.nombre}
                      </div>
                      <div className="text-xs text-gray-600 font-mono">
                        SKU: {productoSeleccionado.sku} · Código:{" "}
                        {productoSeleccionado.codigo_barras || "-"}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <Label htmlFor="cant-nueva" className="text-xs font-semibold text-gray-700">
                        Cantidad:
                      </Label>
                      <Input
                        id="cant-nueva"
                        type="number"
                        min={1}
                        value={cantidadNueva}
                        onChange={(e) =>
                          setCantidadNueva(e.target.value === "" ? "" : parseInt(e.target.value))
                        }
                        className="mt-1 bg-white text-xs"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleGuardarProductoEnPalet}
                        disabled={guardando || !productoSeleccionado}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs h-9"
                      >
                        {guardando ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        ) : (
                          <Plus className="w-4 h-4 mr-1" />
                        )}
                        <span>Añadir al palet</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VISTA 3: ETIQUETA IMPRIMIBLE */}
            {modo === "etiqueta" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center no-print">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setModo("lista")}
                    className="h-7 px-2 text-xs text-gray-600"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                    <span>Volver</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={lanzarImpresion}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir etiqueta</span>
                  </Button>
                </div>

                {/* Área de impresión de etiqueta */}
                <div className="print-area p-6 border-2 border-dashed border-gray-400 bg-white rounded-lg text-center space-y-4 max-w-md mx-auto shadow-sm">
                  <div className="border-b-2 border-gray-800 pb-2 flex justify-between items-center text-left">
                    <div>
                      <div className="font-extrabold text-sm uppercase tracking-wider text-gray-900">
                        ETIQUETA DE PALET
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        SISTEMA DE INVENTARIO
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="font-mono text-xs font-bold border-gray-400"
                    >
                      #{String(palet.numero_palet).padStart(3, "0")}
                    </Badge>
                  </div>

                  <div className="py-4 space-y-2">
                    <div className="flex justify-center text-gray-900">
                      <Barcode className="w-48 h-16" />
                    </div>
                    <div className="font-mono text-xl sm:text-2xl font-black tracking-widest text-gray-900">
                      {palet.codigo_barras}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-left bg-gray-50 p-3 rounded border border-gray-200 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase font-semibold">
                        Reserva:
                      </span>
                      <span className="font-bold text-gray-900">
                        {palet.reserva_nombre || "Zona Reserva"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase font-semibold">
                        Generado por:
                      </span>
                      <span className="font-bold text-gray-900">{palet.generado_por}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase font-semibold">
                        Fecha:
                      </span>
                      <span className="font-medium text-gray-700">{fechaFormateada}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase font-semibold">
                        Contenido:
                      </span>
                      <span className="font-bold text-gray-900">
                        {totalLineas} ref. / {totalUnidades} uds
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VISTA 4: LISTADO IMPRIMIBLE */}
            {modo === "listado_impresion" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center no-print">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setModo("lista")}
                    className="h-7 px-2 text-xs text-gray-600"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                    <span>Volver</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={lanzarImpresion}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir desglose A4</span>
                  </Button>
                </div>

                {/* Área de impresión de listado */}
                <div className="print-area p-6 border border-gray-300 bg-white rounded-lg space-y-4 max-w-2xl mx-auto shadow-sm">
                  <div className="border-b-2 border-gray-800 pb-3 flex justify-between items-start">
                    <div>
                      <div className="text-xs uppercase font-bold text-gray-500">INVENTARIO</div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Desglose de Mercancía en Palet
                      </h3>
                      <div className="font-mono text-sm font-semibold text-amber-900">
                        {palet.codigo_barras}
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-600">
                      <div>Fecha: {fechaFormateada}</div>
                      <div>Reserva: {palet.reserva_nombre || "Reserva"}</div>
                      <div>Generado por: {palet.generado_por}</div>
                    </div>
                  </div>

                  <table className="w-full text-left text-xs border border-gray-200 border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200 text-[10px] uppercase">
                        <th className="py-1.5 px-2">Código</th>
                        <th className="py-1.5 px-2">SKU</th>
                        <th className="py-1.5 px-2">Producto</th>
                        <th className="py-1.5 px-2 text-right">Cantidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {productos.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-gray-400 italic">
                            Sin mercancía registrada
                          </td>
                        </tr>
                      ) : (
                        productos.map((prod) => (
                          <tr key={prod.id_producto}>
                            <td className="py-1.5 px-2 font-mono text-gray-600">
                              {prod.codigo_barras || "-"}
                            </td>
                            <td className="py-1.5 px-2 font-mono font-medium text-gray-800">
                              {prod.sku || "-"}
                            </td>
                            <td className="py-1.5 px-2 text-gray-900">{prod.nombre}</td>
                            <td className="py-1.5 px-2 text-right font-bold text-gray-900">
                              {prod.cantidad} uds
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold border-t border-gray-300">
                      <tr>
                        <td colSpan={3} className="py-2 px-2 text-right">
                          Total Unidades Físicas:
                        </td>
                        <td className="py-2 px-2 text-right text-amber-900">{totalUnidades} uds</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="bg-gray-50 p-3 rounded-b-lg border-t border-gray-200 no-print">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO 1: CONFIRMACIÓN DE BAJA MANUAL */}
      <AlertDialog open={confirmarBajaManual} onOpenChange={setConfirmarBajaManual}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>¿Dar de baja el palet {palet.codigo_barras}?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs space-y-2 text-gray-600">
              <p>
                Esta acción desactivará el palet de la reserva. Esta operación es segura y conserva
                el historial (baja lógica).
              </p>
              <p className="font-semibold text-gray-800">
                Confirmación requerida: El palet actualmente no tiene stock pendiente.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={ejecutandoBaja} className="text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={ejecutarDesactivacionPalet}
              disabled={ejecutandoBaja}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5"
            >
              {ejecutandoBaja ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Dando de baja...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirmar baja</span>
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DIÁLOGO 2: ALERTA DE AUTODESTRUCCIÓN */}
      <AlertDialog open={confirmarAutodestruccion} onOpenChange={setConfirmarAutodestruccion}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-700">
              <Boxes className="w-5 h-5 text-amber-600" />
              <span>Palet sin existencias (Stock = 0)</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs space-y-2 text-gray-600">
              <p>
                Se han retirado todos los productos de <strong>{palet.codigo_barras}</strong>.
              </p>
              <p>Según la regla de negocio, un palet vacío puede darse de baja automáticamente.</p>
              <p className="font-semibold text-gray-800">
                ¿Deseas dar de baja este palet ahora o conservarlo vacío?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel
              disabled={ejecutandoBaja}
              onClick={() => setConfirmarAutodestruccion(false)}
              className="text-xs"
            >
              Mantener palet vacío
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={ejecutarDesactivacionPalet}
              disabled={ejecutandoBaja}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
            >
              {ejecutandoBaja ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Dando de baja...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Dar de baja palet vacío</span>
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
