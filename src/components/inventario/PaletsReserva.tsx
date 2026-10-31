import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type Palet,
  paletsPorReservaQueryOptions,
  crearPalet,
  getSiguienteNumeroPalet,
  generarCodigoBarrasPalet,
} from "@/lib/palets";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  MapPin,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { ModalProductosPalet } from "@/components/inventario/ModalProductosPalet";

interface ModalCrearPaletProps {
  abierto: boolean;
  onOpenChange: (open: boolean) => void;
  reserva: { id: string; nombre: string } | null;
  usuarioNombre: string;
  onPaletCreado?: (palet: Palet) => void;
}

export function ModalCrearPalet({
  abierto,
  onOpenChange,
  reserva,
  usuarioNombre,
  onPaletCreado,
}: ModalCrearPaletProps) {
  const queryClient = useQueryClient();
  const [cargandoPreview, setCargandoPreview] = useState(false);
  const [siguienteNumero, setSiguienteNumero] = useState<number | null>(null);
  const [codigoPreview, setCodigoPreview] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!abierto || !reserva) {
      setSiguienteNumero(null);
      setCodigoPreview("");
      return;
    }

    let cancelado = false;
    setCargandoPreview(true);

    getSiguienteNumeroPalet(reserva.id)
      .then((num) => {
        if (!cancelado) {
          setSiguienteNumero(num);
          const codigo = generarCodigoBarrasPalet(num, usuarioNombre);
          setCodigoPreview(codigo);
        }
      })
      .catch((err) => {
        if (!cancelado) {
          toast.error(`Error al calcular siguiente número: ${err.message || err}`);
          const fallbackNum = 1;
          setSiguienteNumero(fallbackNum);
          setCodigoPreview(generarCodigoBarrasPalet(fallbackNum, usuarioNombre));
        }
      })
      .finally(() => {
        if (!cancelado) {
          setCargandoPreview(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [abierto, reserva?.id, usuarioNombre]);

  async function handleConfirmarCreacion() {
    if (!reserva) return;
    try {
      setGuardando(true);
      const nuevoPalet = await crearPalet({
        id_reserva: reserva.id,
        usuario_nombre: usuarioNombre,
      });

      toast.success(`Palet ${nuevoPalet.codigo_barras} dado de alta con éxito`);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inventario"] }),
        queryClient.invalidateQueries({ queryKey: ["movimientos"] }),
        queryClient.invalidateQueries({ queryKey: ["stock"] }),
        queryClient.invalidateQueries({ queryKey: ["palets", reserva.id] }),
        queryClient.invalidateQueries({ queryKey: ["palets"] }),
      ]);

      onPaletCreado?.(nuevoPalet);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(`Error al dar de alta el palet: ${err.message || err}`);
    } finally {
      setGuardando(false);
    }
  }

  const hoyFormatted = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <Boxes className="w-5 h-5 text-amber-600" />
            <span>Nuevo palet en reserva</span>
          </DialogTitle>
          <DialogDescription>
            Se generará automáticamente el número correlativo y el código de barras oficial para
            esta reserva.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Ubicación de destino */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3 text-xs text-amber-950 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-amber-900">
              <MapPin className="w-3.5 h-3.5 text-amber-700" />
              <span>Ubicación de Reserva:</span>
            </div>
            <div className="text-sm font-bold pl-5 text-gray-900">{reserva?.nombre}</div>
          </div>

          {/* Tarjeta de previsualización */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/70 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Previsualización de Etiqueta
            </div>

            {cargandoPreview ? (
              <div className="flex items-center justify-center py-6 gap-2 text-xs text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                <span>Calculando siguiente número correlativo...</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Número asignado:</span>
                  <Badge variant="outline" className="font-bold text-gray-900 bg-white">
                    Palet #{String(siguienteNumero ?? 1).padStart(3, "0")}
                  </Badge>
                </div>

                {/* Código de barras prominentemente visible */}
                <div className="p-3 bg-white border-2 border-dashed border-gray-300 rounded-md text-center space-y-1.5">
                  <div className="flex justify-center text-gray-700">
                    <Barcode className="w-12 h-6" />
                  </div>
                  <div className="font-mono text-sm sm:text-base font-bold text-gray-900 tracking-wider">
                    {codigoPreview || "PAL-001-..."}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono">
                    Formato estándar: PAL-XXX-Usuario-DDMMAAAA
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-white p-2 rounded border border-gray-200 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-500" />
                    <div className="truncate">
                      <span className="text-[10px] text-gray-500 block">Generado por:</span>
                      <span className="font-medium text-gray-800 truncate block">
                        {usuarioNombre}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded border border-gray-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    <div>
                      <span className="text-[10px] text-gray-500 block">Fecha:</span>
                      <span className="font-medium text-gray-800 block">{hoyFormatted}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 text-[11px] text-gray-500 bg-blue-50/60 border border-blue-200/70 p-2.5 rounded-md">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Los palets son unidades de reserva independientes. Una vez creado, podrás gestionar
              sus productos y existencias en cualquier momento.
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={guardando}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirmarCreacion}
            disabled={guardando || cargandoPreview || !reserva}
            className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
          >
            {guardando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creando palet...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Confirmar y crear palet</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SeccionPaletsReservaProps {
  reserva: { id: string; nombre: string };
  puedeGestionar: boolean;
  usuarioNombre: string;
  onNuevoPalet: () => void;
}

export function SeccionPaletsReserva({
  reserva,
  puedeGestionar,
  onNuevoPalet,
}: SeccionPaletsReservaProps) {
  const queryClient = useQueryClient();
  const [paletSeleccionado, setPaletSeleccionado] = useState<Palet | null>(null);

  const {
    data: palets = [],
    isLoading,
    error,
  } = useQuery(paletsPorReservaQueryOptions(reserva.id, true));

  return (
    <div className="ml-4 pl-4 sm:pl-8 pr-4 py-3 bg-amber-50/40 border-l-4 border-amber-400 rounded-r-lg space-y-2.5 my-1.5 transition-all">
      {/* Cabecera de la sección de palets (sin botón redundante "+ Nuevo palet", ya disponible en la fila principal) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-amber-100 text-amber-800">
            <Boxes className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-amber-950 uppercase tracking-wide">
            Palets en {reserva.nombre}
          </span>
          {!isLoading && (
            <Badge
              variant="outline"
              className="text-[11px] bg-white text-amber-800 border-amber-300 font-semibold"
            >
              {palets.length} {palets.length === 1 ? "palet activo" : "palets activos"}
            </Badge>
          )}
        </div>
      </div>

      {/* Contenido / Lista de Palets */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-4 px-2 text-xs text-amber-800">
          <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
          <span>Cargando palets de la reserva...</span>
        </div>
      ) : error ? (
        <div className="py-2.5 px-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
          No se pudieron cargar los palets de esta reserva.
        </div>
      ) : palets.length === 0 ? (
        <div className="py-5 px-4 bg-white/80 border border-dashed border-amber-300 rounded-md text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-2">
          <Boxes className="w-7 h-7 text-amber-400" />
          <p className="font-medium text-gray-700">Sin palets creados en esta reserva.</p>
          <p className="text-[11px] text-gray-500 max-w-sm">
            Crea palets con su código de barras normalizado para comenzar a almacenar mercancía en
            reserva.
          </p>
          {puedeGestionar && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onNuevoPalet();
              }}
              className="mt-1 h-7 text-xs border-amber-300 text-amber-800 hover:bg-amber-100 gap-1 bg-white"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear primer palet</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-amber-200/90 rounded-md overflow-hidden shadow-2xs divide-y divide-amber-100">
          {palets.map((palet) => (
            <div
              key={palet.id}
              onClick={() => setPaletSeleccionado(palet)}
              className="grid grid-cols-12 gap-2 px-3.5 py-2.5 items-center hover:bg-amber-50/70 transition-colors text-xs cursor-pointer group"
            >
              {/* Col 3: Número de palet */}
              <div className="col-span-12 sm:col-span-3 flex items-center gap-2 min-w-0">
                <Boxes className="w-4 h-4 text-amber-700 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-gray-900 group-hover:text-amber-800 transition-colors truncate">
                  Palet #{String(palet.numero_palet).padStart(3, "0")}
                </span>
              </div>

              {/* Col 4: Código de barras */}
              <div className="col-span-12 sm:col-span-4 flex items-center gap-1.5 min-w-0">
                <Barcode className="w-4 h-4 text-gray-500 shrink-0" />
                <span
                  className="font-mono text-[11px] font-semibold bg-gray-100 text-gray-800 border border-gray-200 px-2 py-0.5 rounded truncate"
                  title={palet.codigo_barras}
                >
                  {palet.codigo_barras}
                </span>
              </div>

              {/* Col 3: Usuario y fecha */}
              <div className="col-span-8 sm:col-span-3 flex flex-col text-gray-600 text-[11px] min-w-0">
                <span className="truncate flex items-center gap-1 text-gray-700">
                  <User className="w-3 h-3 text-gray-400 shrink-0" />
                  {palet.generado_por}
                </span>
                <span className="text-gray-400 flex items-center gap-1 text-[10px]">
                  <Calendar className="w-3 h-3 shrink-0" />
                  {new Date(palet.generado_en).toLocaleDateString("es-ES")}
                </span>
              </div>

              {/* Col 2: Stock (Badge clickeable para abrir gestión de productos del palet) */}
              <div className="col-span-4 sm:col-span-2 flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPaletSeleccionado(palet);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md font-medium border bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-colors cursor-pointer shadow-2xs group/btn"
                  title="Gestionar productos de este palet"
                >
                  <Package className="w-3 h-3 text-amber-600 group-hover/btn:scale-110 transition-transform" />
                  <span>Gestionar stock</span>
                </button>
                <ChevronRight className="w-4 h-4 text-amber-400 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal específico para gestión de productos, etiquetas e impresión del palet */}
      <ModalProductosPalet
        palet={paletSeleccionado}
        abierto={!!paletSeleccionado}
        onOpenChange={(open) => {
          if (!open) setPaletSeleccionado(null);
        }}
        onPaletDesactivado={() => {
          queryClient.invalidateQueries({
            queryKey: ["palets", reserva.id],
          });
        }}
      />
    </div>
  );
}
