import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type Palet,
  type ProductoEnPalet,
  paletsPorReservaQueryOptions,
  getSiguienteNumeroPalet,
  generarCodigoBarrasPalet,
  crearPalet,
  desactivarPalet,
  cargarProductosPalet,
} from "@/lib/palets";
import { supabase } from "@/lib/supabase";
import {
  imprimirEtiquetaPalet,
  descargarEtiquetaPDF,
  imprimirListadoPalets,
} from "@/lib/impresion";
import { useAuth } from "@/contexts/AuthContext";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Boxes,
  Barcode,
  Plus,
  Loader2,
  Calendar,
  User,
  Package,
  Printer,
  Trash2,
  Search,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal,
  Download,
} from "lucide-react";
import { ModalProductosPalet } from "@/components/inventario/ModalProductosPalet";

export interface GestionPaletsProps {
  idReserva: string;
  nombreReserva?: string;
  puedeGestionar?: boolean;
  usuarioNombre?: string;
  onPaletCreado?: (palet: Palet) => void;
}

export function GestionPalets({
  idReserva,
  nombreReserva = "Reserva",
  puedeGestionar = true,
  usuarioNombre: propUsuarioNombre,
  onPaletCreado,
}: GestionPaletsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Nombre de usuario por defecto
  const fallbackUsuario =
    propUsuarioNombre ||
    (user?.user_metadata?.["full_name"] as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Operador";

  // Estados locales
  const [busqueda, setBusqueda] = useState("");
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [usuarioForm, setUsuarioForm] = useState(fallbackUsuario);
  const [siguienteNumero, setSiguienteNumero] = useState<number | null>(null);
  const [codigoPreview, setCodigoPreview] = useState("");
  const [cargandoPreview, setCargandoPreview] = useState(false);

  // Palet para gestionar productos (modal completo)
  const [paletParaGestion, setPaletParaGestion] = useState<Palet | null>(null);

  // Palet para imprimir etiqueta
  const [paletParaImprimir, setPaletParaImprimir] = useState<Palet | null>(null);
  const [productosImprimir, setProductosImprimir] = useState<ProductoEnPalet[]>([]);
  const [cargandoImpresion, setCargandoImpresion] = useState(false);

  // Palet para traspaso a tienda (reposición)
  const [paletParaReponer, setPaletParaReponer] = useState<Palet | null>(null);
  const [productosReponer, setProductosReponer] = useState<ProductoEnPalet[]>([]);
  const [cargandoReponer, setCargandoReponer] = useState(false);
  const [cantidadesReponer, setCantidadesReponer] = useState<Record<string, number>>({});

  // Palet para confirmar baja lógica (soft delete)
  const [paletADesactivar, setPaletADesactivar] = useState<Palet | null>(null);

  // 1. Cargar Palets de esta Reserva desde Supabase
  const {
    data: palets = [],
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery(paletsPorReservaQueryOptions(idReserva, true));

  // 2. Mutación: Crear nuevo palet
  const mutationCrear = useMutation({
    mutationFn: async () => {
      if (!idReserva) throw new Error("ID de reserva inválido");
      return await crearPalet({
        id_reserva: idReserva,
        usuario_nombre: usuarioForm.trim() || fallbackUsuario,
      });
    },
    onSuccess: (nuevoPalet) => {
      queryClient.invalidateQueries({ queryKey: ["palets", idReserva] });
      toast.success(
        `Palet #${String(nuevoPalet.numero_palet).padStart(3, "0")} creado en ${nombreReserva}`,
        {
          description: `Código asignado: ${nuevoPalet.codigo_barras}`,
        },
      );
      setModalCrearAbierto(false);
      onPaletCreado?.(nuevoPalet);
    },
    onError: (err: any) => {
      toast.error("Error al crear palet", {
        description:
          err.message || "Ha ocurrido un error inesperado al contactar con la base de datos.",
      });
    },
  });

  // 3. Mutación: Desactivar palet (baja lógica)
  const mutationDesactivar = useMutation({
    mutationFn: async (id: string) => {
      await desactivarPalet(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["palets", idReserva] });
      toast.success("Palet dado de baja correctamente");
      setPaletADesactivar(null);
    },
    onError: (err: any) => {
      toast.error("Error al dar de baja el palet", {
        description: err.message || "No se pudo actualizar el estado del palet.",
      });
    },
  });

  // Preparar modal de nuevo palet con número y código calculados
  const abrirModalCrear = async () => {
    setUsuarioForm(fallbackUsuario);
    setModalCrearAbierto(true);
    setCargandoPreview(true);
    try {
      const num = await getSiguienteNumeroPalet(idReserva);
      setSiguienteNumero(num);
      setCodigoPreview(generarCodigoBarrasPalet(num, fallbackUsuario));
    } catch {
      const fallbackNum =
        (palets.length > 0 ? Math.max(...palets.map((p) => p.numero_palet)) : 0) + 1;
      setSiguienteNumero(fallbackNum);
      setCodigoPreview(generarCodigoBarrasPalet(fallbackNum, fallbackUsuario));
    } finally {
      setCargandoPreview(false);
    }
  };

  const handleCambioUsuario = (nuevoNombre: string) => {
    setUsuarioForm(nuevoNombre);
    if (siguienteNumero) {
      setCodigoPreview(generarCodigoBarrasPalet(siguienteNumero, nuevoNombre));
    }
  };

  // Preparar impresión de etiqueta
  const abrirImpresion = async (palet: Palet) => {
    setPaletParaImprimir(palet);
    setCargandoImpresion(true);
    try {
      const prods = await cargarProductosPalet(palet.id);
      setProductosImprimir(prods);
    } catch (e: any) {
      console.warn("Error cargando productos para imprimir:", e);
      setProductosImprimir([]);
    } finally {
      setCargandoImpresion(false);
    }
  };

  // Imprimir usando iframe aislado o fallback nativo
  const handleImprimir = async () => {
    if (!paletParaImprimir) return;
    try {
      document.body.classList.add("printing-label");
      await imprimirEtiquetaPalet({
        numeroPalet: paletParaImprimir.numero_palet,
        codigoBarras: paletParaImprimir.codigo_barras,
        nombreReserva,
        generadoPor: paletParaImprimir.generado_por,
        generadoEn: paletParaImprimir.generado_en,
        productos: productosImprimir,
      });
      toast.success("Diálogo de impresión iniciado");
    } catch {
      window.print();
    } finally {
      setTimeout(() => {
        document.body.classList.remove("printing-label");
      }, 1000);
    }
  };

  // Descarga directa en PDF
  const handleDescargarPDF = () => {
    if (!paletParaImprimir) return;
    try {
      descargarEtiquetaPDF({
        numeroPalet: paletParaImprimir.numero_palet,
        codigoBarras: paletParaImprimir.codigo_barras,
        nombreReserva,
        generadoPor: paletParaImprimir.generado_por,
        generadoEn: paletParaImprimir.generado_en,
        productos: productosImprimir,
      });
      toast.success("Etiqueta PDF descargada");
    } catch (err: any) {
      toast.error(`Error al generar PDF: ${err.message || err}`);
    }
  };

  // Preparar traspaso a tienda (Reposición)
  const abrirReposicion = async (palet: Palet) => {
    setPaletParaReponer(palet);
    setCargandoReponer(true);
    try {
      const prods = await cargarProductosPalet(palet.id);
      setProductosReponer(prods);
      const inicial: Record<string, number> = {};
      prods.forEach((p) => {
        inicial[p.id_producto] = p.cantidad;
      });
      setCantidadesReponer(inicial);
    } catch (e: any) {
      console.warn("Error cargando productos para reposición:", e);
      setProductosReponer([]);
    } finally {
      setCargandoReponer(false);
    }
  };

  // Ejecutar reposición con regla de autodestrucción (REGLA DE ORO #1: movimientos)
  const ejecutarReposicion = async () => {
    if (!paletParaReponer) return;
    try {
      let totalTraspasado = 0;
      let totalRestante = 0;

      for (const prod of productosReponer) {
        const cantATraspasar = cantidadesReponer[prod.id_producto] || 0;
        if (cantATraspasar > 0) {
          totalTraspasado += cantATraspasar;
          // ✅ REGLA DE ORO: Modificación de stock mediante la tabla movimientos
          const { error: errorMov } = await supabase.from("movimientos").insert({
            tipo: "reposicion",
            cantidad: cantATraspasar,
            id_producto: prod.id_producto,
            id_ubicacion: idReserva,
            notas: `Reposición desde palet a lineal (Palet #${paletParaReponer.numero_palet} - ${paletParaReponer.codigo_barras})`,
            realizado_por: user?.id,
          });

          if (errorMov) {
            console.warn("Aviso al registrar movimiento:", errorMov.message);
          }
        }
        totalRestante += Math.max(0, prod.cantidad - cantATraspasar);
      }

      if (totalRestante <= 0 && productosReponer.length > 0) {
        // 🚨 REGLA DE AUTODESTRUCCIÓN OBLIGATORIA (Soft delete)
        await desactivarPalet(paletParaReponer.id);
        toast.error(
          `🚨 ¡PALET #${String(paletParaReponer.numero_palet).padStart(3, "0")} AUTODESTRUIDO!`,
          {
            description: `Todos los artículos del palet [${paletParaReponer.codigo_barras}] han salido a tienda. El palet se ha dado de baja automáticamente.`,
            duration: 6000,
          },
        );
      } else {
        toast.success(
          `Mercancía repuesta en tienda (${totalTraspasado} uds). Quedan ${totalRestante} unidades en el Palet #${paletParaReponer.numero_palet}`,
        );
      }

      queryClient.invalidateQueries({ queryKey: ["palets", idReserva] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["movimientos"] });
      setPaletParaReponer(null);
    } catch (err: any) {
      toast.error("Error al procesar la reposición", {
        description: err.message || "No se pudo actualizar el stock del palet.",
      });
    }
  };

  // Filtrado de palets
  const paletsFiltrados = useMemo(() => {
    if (!busqueda.trim()) return palets;
    const term = busqueda.toLowerCase().trim();
    return palets.filter((p) => {
      const numStr = String(p.numero_palet);
      const padNum = String(p.numero_palet).padStart(3, "0");
      return (
        p.codigo_barras.toLowerCase().includes(term) ||
        numStr.includes(term) ||
        padNum.includes(term) ||
        (p.generado_por && p.generado_por.toLowerCase().includes(term))
      );
    });
  }, [palets, busqueda]);

  return (
    <div className="space-y-4">
      {/* 📦 Barra superior: Título, Filtro y Botón Nuevo Palet */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-50 dark:from-amber-500/10 to-orange-50/60 dark:to-orange-500/10 p-4 rounded-xl border border-amber-200/80 dark:border-amber-500/30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-300 dark:border-amber-500/40 flex items-center justify-center text-amber-800 dark:text-amber-200 shadow-xs">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-foreground text-base">Palets en {nombreReserva}</h3>
              <Badge
                variant="outline"
                className="bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-500/40 text-xs font-semibold px-2 py-0.5"
              >
                {palets.length} {palets.length === 1 ? "Palet" : "Palets"}
              </Badge>
            </div>
            <p className="text-xs text-amber-900/80 dark:text-amber-100">
              Contenedores móviles de mercancía en reserva con trazabilidad y autodestrucción.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="border-amber-300 dark:border-amber-500/40 bg-card hover:bg-amber-50 dark:hover:bg-amber-500/10 text-amber-800 dark:text-amber-200 h-9"
            title="Refrescar palets desde Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            <span className="hidden md:inline ml-1.5 text-xs">Actualizar</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              imprimirListadoPalets(palets, nombreReserva);
              toast.success("Listado de palets descargado y preparado");
            }}
            disabled={palets.length === 0}
            className="border-amber-300 dark:border-amber-500/40 bg-card hover:bg-amber-50 dark:hover:bg-amber-500/10 text-amber-800 dark:text-amber-200 h-9 text-xs gap-1.5"
            title="Imprimir o descargar listado oficial de palets"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Imprimir Listado</span>
          </Button>

          {puedeGestionar && (
            <Button
              onClick={abrirModalCrear}
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-xs h-9 text-xs gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Palet en Reserva</span>
            </Button>
          )}
        </div>
      </div>

      {/* 🔍 Buscador rápido */}
      {palets.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar por código (PAL-...), número de palet o responsable..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9 bg-card border-border text-xs h-9 rounded-lg"
          />
        </div>
      )}

      {/* 📋 Estado de carga / Error / Listado */}
      {isLoading ? (
        <div className="p-10 border border-amber-200 dark:border-amber-500/30 rounded-xl bg-card flex flex-col items-center justify-center gap-3 text-center">
          <Loader2 className="w-8 h-8 text-amber-600 dark:text-amber-400 animate-spin" />
          <p className="text-sm font-medium text-foreground">Consultando palets en Supabase...</p>
          <p className="text-xs text-muted-foreground">
            Verificando correlativos y códigos normalizados de {nombreReserva}.
          </p>
        </div>
      ) : error ? (
        <div className="p-6 border border-rose-200 dark:border-rose-500/30 rounded-xl bg-rose-50/70 dark:bg-rose-500/10 text-rose-800 dark:text-rose-200 space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <span>Error al conectar con la tabla de palets</span>
          </div>
          <p className="text-xs text-rose-700 dark:text-rose-300">
            {(error as any)?.message || "No se pudieron obtener los palets desde Supabase."}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            className="border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-200 bg-card hover:bg-rose-100 dark:hover:bg-rose-500/20 text-xs mt-2"
          >
            Reintentar
          </Button>
        </div>
      ) : paletsFiltrados.length === 0 ? (
        <div className="p-10 border-2 border-dashed border-amber-200 dark:border-amber-500/30 rounded-xl bg-amber-50/20 dark:bg-amber-500/10 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
          <div className="max-w-md">
            <h4 className="font-semibold text-foreground text-sm">
              {busqueda
                ? "No se encontraron palets con ese criterio"
                : "No hay palets en esta Reserva"}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              {busqueda
                ? "Prueba a buscar con otro término o limpia el buscador."
                : `Esta reserva no contiene palets activos. Pulsa 'Crear Palet en Reserva' para generar el correlativo #${String(siguienteNumero || 1).padStart(3, "0")}.`}
            </p>
          </div>
          {puedeGestionar && !busqueda && (
            <Button
              onClick={abrirModalCrear}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 gap-1.5 mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Primer Palet</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paletsFiltrados.map((palet) => (
            <div
              key={palet.id}
              className="group bg-card border border-amber-200/90 dark:border-amber-500/30 hover:border-amber-400 dark:hover:border-amber-500/50 rounded-xl p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Cabecera del card */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-300 font-bold text-xs">
                      #{String(palet.numero_palet).padStart(3, "0")}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm group-hover:text-amber-800 dark:group-hover:text-amber-200 transition-colors">
                        Palet #{String(palet.numero_palet).padStart(3, "0")}
                      </h4>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Barcode className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span className="font-mono">{palet.codigo_barras}</span>
                      </div>
                    </div>
                  </div>

                  <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 text-[10px] font-medium">
                    Activo
                  </Badge>
                </div>

                {/* Meta: Creador y Fecha */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground bg-amber-50/40 dark:bg-amber-500/10 p-2.5 rounded-lg border border-amber-100/80 dark:border-amber-500/20 my-3">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="truncate" title={palet.generado_por}>
                      {palet.generado_por || "Operador"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Calendar className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>
                      {palet.generado_en
                        ? new Date(palet.generado_en).toLocaleDateString("es-ES")
                        : "Hoy"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Acciones principales */}
              <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => abrirImpresion(palet)}
                    className="h-7 px-2 text-[11px] border-border hover:border-amber-300 dark:hover:border-amber-500/40 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-foreground gap-1"
                    title="Imprimir etiqueta homologada con código de barras"
                  >
                    <Printer className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>Etiqueta</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => abrirReposicion(palet)}
                    className="h-7 px-2 text-[11px] border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 gap-1 font-medium"
                    title="Traspasar mercancía de este palet a las estanterías de tienda"
                  >
                    <ArrowRightLeft className="w-3 h-3 text-amber-700 dark:text-amber-300" />
                    <span>A Tienda</span>
                  </Button>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    onClick={() => setPaletParaGestion(palet)}
                    className="h-7 px-2.5 text-[11px] bg-amber-600 hover:bg-amber-700 text-white gap-1 shadow-2xs"
                  >
                    <Package className="w-3 h-3" />
                    <span>Stock</span>
                  </Button>

                  {puedeGestionar && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPaletADesactivar(palet)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                      title="Dar de baja este palet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ====================================================================== */}
      {/* 🏗️ MODAL: CREAR PALET EN RESERVA                                      */}
      {/* ====================================================================== */}
      <Dialog open={modalCrearAbierto} onOpenChange={setModalCrearAbierto}>
        <DialogContent className="max-w-md bg-card border-amber-200 dark:border-amber-500/30 shadow-xl">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 flex items-center justify-center mb-1">
              <Boxes className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Crear Palet en Reserva
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ubicación vinculada: <strong className="text-amber-800 dark:text-amber-200">{nombreReserva}</strong>. La
              creación solo se permite en zonas de reserva por seguridad operativa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Tarjeta de previsualización */}
            <div className="p-3.5 bg-amber-50/60 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-950 dark:text-amber-100 uppercase">
                  Identificador generado
                </span>
                <Badge className="bg-amber-600 text-white text-[11px]">
                  Palet #{String(siguienteNumero || 1).padStart(3, "0")}
                </Badge>
              </div>

              <div className="bg-card p-2.5 rounded-lg border border-amber-200 dark:border-amber-500/30 flex items-center justify-between">
                <div className="font-mono text-xs font-bold text-foreground truncate mr-2">
                  {cargandoPreview ? "Calculando código..." : codigoPreview}
                </div>
                <Barcode className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              </div>
            </div>

            {/* Campo: Operador / Responsable */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Operador responsable</Label>
              <Input
                value={usuarioForm}
                onChange={(e) => handleCambioUsuario(e.target.value)}
                placeholder="Nombre del operario"
                className="text-xs h-9"
              />
              <p className="text-[11px] text-muted-foreground">
                Se incluirá en el código de barras y en la etiqueta física de reserva.
              </p>
            </div>

            {/* Advertencia de norma de autodestrucción */}
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg text-xs text-blue-900 dark:text-blue-100 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <span>
                <strong>Regla de autodestrucción:</strong> Al realizar reposición a tienda, en el
                momento que este palet quede sin stock se autodestruirá en el sistema.
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalCrearAbierto(false)}
              disabled={mutationCrear.isPending}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => mutationCrear.mutate()}
              disabled={mutationCrear.isPending || cargandoPreview}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
            >
              {mutationCrear.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creando palet...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Confirmar y Crear Palet</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====================================================================== */}
      {/* 🏷️ MODAL: IMPRIMIR ETIQUETA HOMOLOGADA (@media print)                 */}
      {/* ====================================================================== */}
      <Dialog
        open={!!paletParaImprimir}
        onOpenChange={(open) => !open && setPaletParaImprimir(null)}
      >
        <DialogContent className="max-w-md bg-card border-border shadow-2xl">
          <DialogHeader className="no-print">
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Printer className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>Etiqueta Oficial de Palet</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Formato homologado para adherir sobre el palet en {nombreReserva}.
            </DialogDescription>
          </DialogHeader>

          {paletParaImprimir && (
            <div className="py-2">
              {/* Contenedor imprimible */}
              <div
                id="etiqueta-palet-imprimible"
                className="border-2 border-black p-4 rounded bg-card text-black space-y-3 font-sans print:border-black print:p-6"
              >
                <div className="flex items-center justify-between border-b-2 border-black pb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Inventario Pintura LM
                    </span>
                    <h2 className="text-xl font-black">
                      PALET #{String(paletParaImprimir.numero_palet).padStart(3, "0")}
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Ubicación</span>
                    <p className="font-bold text-sm text-black">{nombreReserva}</p>
                  </div>
                </div>

                {/* Código de barras simulado legible */}
                <div className="text-center py-2 bg-muted border border-border rounded">
                  <div className="font-mono text-base font-black tracking-widest text-black">
                    {paletParaImprimir.codigo_barras}
                  </div>
                  <div className="flex justify-center items-end h-8 gap-0.5 mt-1 px-4">
                    {Array.from({ length: 42 }).map((_, i) => (
                      <div
                        key={i}
                        className={`bg-black ${i % 3 === 0 ? "w-1" : i % 5 === 0 ? "w-0.5" : "w-1.5"} ${i % 2 === 0 ? "h-full" : "h-6"}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-border py-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Generado por:</span>
                    <strong className="text-foreground">{paletParaImprimir.generado_por}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Fecha alta:</span>
                    <strong className="text-foreground">
                      {paletParaImprimir.generado_en
                        ? new Date(paletParaImprimir.generado_en).toLocaleString("es-ES")
                        : "Hoy"}
                    </strong>
                  </div>
                </div>

                {/* Resumen de productos */}
                <div className="text-xs">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Contenido registrado:
                  </span>
                  {cargandoImpresion ? (
                    <p className="text-muted-foreground italic">Cargando unidades...</p>
                  ) : productosImprimir.length === 0 ? (
                    <p className="text-muted-foreground italic">Palet vacío (sin mercancía asignada aún)</p>
                  ) : (
                    <ul className="mt-1 divide-y divide-border text-[11px]">
                      {productosImprimir.map((p) => (
                        <li key={p.id_producto} className="py-1 flex justify-between">
                          <span className="truncate pr-2">{p.nombre || p.sku || "Producto"}</span>
                          <strong className="font-mono">{p.cantidad} ud</strong>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="no-print gap-2 sm:gap-2 flex-wrap sm:justify-between items-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPaletParaImprimir(null)}
              className="text-xs"
            >
              Cerrar
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDescargarPDF}
                className="text-xs gap-1.5 border-border text-foreground hover:bg-muted"
              >
                <Download className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Descargar PDF</span>
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleImprimir}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Etiqueta</span>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====================================================================== */}
      {/* 🚀 MODAL: TRASPASO A TIENDA (AUTODESTRUCCIÓN)                         */}
      {/* ====================================================================== */}
      <Dialog open={!!paletParaReponer} onOpenChange={(open) => !open && setPaletParaReponer(null)}>
        <DialogContent className="max-w-lg bg-card border-amber-200 dark:border-amber-500/30 shadow-xl">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-200 flex items-center justify-center mb-1">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Traspaso a Tienda desde Palet #
              {String(paletParaReponer?.numero_palet || 0).padStart(3, "0")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Indica la cantidad que vas a reponer a estanterías de tienda. Cuando el stock del
              palet llegue a cero, se dará de baja automáticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3">
            {cargandoReponer ? (
              <div className="p-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400" />
                <span>Cargando mercancía del palet...</span>
              </div>
            ) : productosReponer.length === 0 ? (
              <div className="p-4 bg-muted rounded-lg text-center text-xs text-muted-foreground">
                Este palet no tiene productos asignados actualmente.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {productosReponer.map((p) => {
                  const cantActual = cantidadesReponer[p.id_producto] ?? p.cantidad;
                  return (
                    <div
                      key={p.id_producto}
                      className="p-3 bg-amber-50/40 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/30 rounded-lg flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">
                          {p.nombre || p.sku || "Producto"}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          Stock en palet: {p.cantidad} ud
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label className="text-[11px] text-muted-foreground">Traspasar:</Label>
                        <Input
                          type="number"
                          min={0}
                          max={p.cantidad}
                          value={cantActual}
                          onChange={(e) => {
                            const val = Math.max(
                              0,
                              Math.min(p.cantidad, Number(e.target.value) || 0),
                            );
                            setCantidadesReponer((prev) => ({
                              ...prev,
                              [p.id_producto]: val,
                            }));
                          }}
                          className="w-20 h-8 text-xs font-mono text-center bg-card"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="p-3 bg-amber-100/70 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 rounded-lg text-[11px] text-amber-950 dark:text-amber-100 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5" />
              <span>
                Si repones todas las unidades restantes del palet, el sistema ejecutará la{" "}
                <strong>regla de autodestrucción</strong> retirando el palet de la reserva.
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPaletParaReponer(null)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={ejecutarReposicion}
              disabled={productosReponer.length === 0}
              className="bg-orange-600 hover:bg-orange-700 text-white text-xs gap-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Confirmar Reposición en Tienda</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====================================================================== */}
      {/* 📦 MODAL INTEGRADO: GESTIÓN DE PRODUCTOS DEL PALET                     */}
      {/* ====================================================================== */}
      <ModalProductosPalet
        palet={paletParaGestion}
        abierto={!!paletParaGestion}
        onOpenChange={(open) => {
          if (!open) setPaletParaGestion(null);
        }}
        onPaletDesactivado={() => {
          queryClient.invalidateQueries({ queryKey: ["palets", idReserva] });
          setPaletParaGestion(null);
        }}
      />

      {/* ====================================================================== */}
      {/* ⚠️ ALERT DIALOG: CONFIRMACIÓN DESTRUTIVA (NUNCA window.confirm)         */}
      {/* ====================================================================== */}
      <AlertDialog
        open={!!paletADesactivar}
        onOpenChange={(open) => !open && setPaletADesactivar(null)}
      >
        <AlertDialogContent className="bg-card border-rose-200 dark:border-rose-500/30">
          <AlertDialogHeader>
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center justify-center mb-1">
              <Trash2 className="w-5 h-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              ¿Dar de baja Palet #{String(paletADesactivar?.numero_palet || 0).padStart(3, "0")}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Esta acción realizará una baja lógica del palet{" "}
              <strong className="text-foreground font-mono">
                [{paletADesactivar?.codigo_barras}]
              </strong>{" "}
              en Supabase. El palet dejará de estar disponible en {nombreReserva}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutationDesactivar.isPending} className="text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => paletADesactivar && mutationDesactivar.mutate(paletADesactivar.id)}
              disabled={mutationDesactivar.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs"
            >
              {mutationDesactivar.isPending ? "Dando de baja..." : "Sí, dar de baja"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default GestionPalets;
