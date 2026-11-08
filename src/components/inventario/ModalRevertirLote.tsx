import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useMyProfile } from "@/hooks/usePermissions";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  History,
  RotateCcw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  Package,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import { neutralizarFormula, descargarArchivoExcel } from "@/lib/excel-stock";

interface LoteImportacionResumen {
  batch_id: string;
  fecha: string;
  total_movimientos: number;
  realizado_por_email?: string;
  resumen_notas: string;
  ya_revertido: boolean;
}

interface ModalRevertirLoteProps {
  abierto: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModalRevertirLote({ abierto, onOpenChange }: ModalRevertirLoteProps) {
  const queryClient = useQueryClient();
  const { perfil, isAdmin } = useMyProfile();

  const [loteSeleccionado, setLoteSeleccionado] = useState<LoteImportacionResumen | null>(null);
  const [confirmarAbierto, setConfirmarAbierto] = useState(false);
  const [comprobandoConflictos, setComprobandoConflictos] = useState(false);
  const [conflictosDetectados, setConflictosDetectados] = useState<string[]>([]);

  // 1. Cargar los últimos lotes de importación
  const { data: lotes = [], isLoading } = useQuery<LoteImportacionResumen[]>({
    queryKey: ["lotes-importacion"],
    enabled: abierto && isAdmin,
    queryFn: async () => {
      // Consultar movimientos con import_batch_id
      const { data, error } = await supabase
        .from("movimientos")
        .select(
          `
          id,
          import_batch_id,
          fecha_movimiento,
          tipo,
          cantidad,
          notas,
          realizado_por,
          usuario:realizado_por(email)
        `,
        )
        .not("import_batch_id", "is", null)
        .order("fecha_movimiento", { ascending: false })
        .limit(300);

      if (error) {
        console.warn("Aviso al consultar lotes en Supabase:", error.message);
        return [];
      }

      // Agrupar por import_batch_id
      const mapaLotes = new Map<string, LoteImportacionResumen>();

      (data || []).forEach((mov: any) => {
        const batchId = mov.import_batch_id;
        if (!batchId) return;

        const esReversion = (mov.notas || "").includes("[REVERSIÓN DE LOTE:");

        if (!mapaLotes.has(batchId)) {
          mapaLotes.set(batchId, {
            batch_id: batchId,
            fecha: mov.fecha_movimiento,
            total_movimientos: 1,
            realizado_por_email: mov.usuario?.email || "Admin",
            resumen_notas: mov.notas || "",
            ya_revertido: esReversion,
          });
        } else {
          const l = mapaLotes.get(batchId)!;
          l.total_movimientos += 1;
        }
      });

      return Array.from(mapaLotes.values());
    },
  });

  // 2. Comprobar conflictos antes de revertir
  const iniciarReversion = async (lote: LoteImportacionResumen) => {
    setLoteSeleccionado(lote);
    setComprobandoConflictos(true);
    setConflictosDetectados([]);

    try {
      // Consultar movimientos originales del lote
      const { data: movs, error: movsError } = await supabase
        .from("movimientos")
        .select("id, id_producto, id_ubicacion, cantidad, notas")
        .eq("import_batch_id", lote.batch_id);

      if (movsError) throw movsError;

      const conflictos: string[] = [];

      for (const m of movs || []) {
        // Consultar stock actual en la base de datos
        const { data: stockRow } = await supabase
          .from("stock")
          .select("cantidad, producto:productos(nombre), ubicacion:ubicaciones(nombre)")
          .eq("id_producto", m.id_producto)
          .eq("id_ubicacion", m.id_ubicacion)
          .maybeSingle();

        const stockActual = stockRow?.cantidad ?? 0;
        // El lote dejó un valor esperado en m.cantidad
        if (stockActual !== m.cantidad) {
          const prodNombre = (stockRow as any)?.producto?.nombre || m.id_producto;
          const ubiNombre = (stockRow as any)?.ubicacion?.nombre || m.id_ubicacion;
          conflictos.push(
            `'${prodNombre}' en '${ubiNombre}': Se esperaba stock ${m.cantidad} uds (fijado por el lote), pero ahora hay ${stockActual} uds.`,
          );
        }
      }

      setConflictosDetectados(conflictos);
      setConfirmarAbierto(true);
    } catch (err: any) {
      toast.error(`Error al verificar lote: ${err.message || err}`);
    } finally {
      setComprobandoConflictos(false);
    }
  };

  // 3. Mutación para ejecutar la reversión
  const mutationRevertir = useMutation({
    mutationFn: async () => {
      if (!loteSeleccionado || !perfil?.id) throw new Error("Datos de lote insuficientes");

      // Intento 1: Llamada a la función RPC transaccional de PostgreSQL
      const { data, error } = await supabase.rpc("revertir_lote_stock", {
        p_batch_id: loteSeleccionado.batch_id,
        p_usuario_id: perfil.id,
      });

      if (error) {
        // Fallback en cliente si la RPC no ha sido desplegada en PostgreSQL
        console.warn(
          "RPC revertir_lote_stock no disponible, usando fallback cliente:",
          error.message,
        );

        const { data: movsOriginales, error: movErr } = await supabase
          .from("movimientos")
          .select("*")
          .eq("import_batch_id", loteSeleccionado.batch_id);

        if (movErr) throw movErr;

        const reversionBatchId = crypto.randomUUID();

        for (const mov of movsOriginales || []) {
          // Extraer stock anterior de notas
          const match = (mov.notas || "").match(/Anterior:\s*(-?[0-9]+)/);
          const stockObjetivo = match && match[1] ? Number(match[1]) : 0;

          // Leer stock actual
          const { data: stockRow } = await supabase
            .from("stock")
            .select("cantidad")
            .eq("id_producto", mov.id_producto)
            .eq("id_ubicacion", mov.id_ubicacion)
            .maybeSingle();

          const stockActual = Number(stockRow?.cantidad ?? 0);

          await supabase.from("movimientos").insert({
            id_producto: mov.id_producto,
            id_ubicacion: mov.id_ubicacion,
            tipo: stockObjetivo === 0 ? "salida" : "ajuste",
            cantidad: stockObjetivo === 0 ? stockActual : stockObjetivo,
            precio_unitario: 0,
            notas: `[REVERSIÓN DE LOTE: ${loteSeleccionado.batch_id}] Restablecido valor anterior: ${stockObjetivo}`,
            realizado_por: perfil.id,
            import_batch_id: reversionBatchId,
          });
        }

        return { exito: true, reversion_batch_id: reversionBatchId };
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Lote revertido correctamente");
      queryClient.invalidateQueries({ queryKey: ["lotes-importacion"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["movimientos"] });
      setConfirmarAbierto(false);
      setLoteSeleccionado(null);
    },
    onError: (err: any) => {
      toast.error(`Error al revertir lote: ${err.message || err}`);
    },
  });

  // Descarga de auditoría en Excel
  const descargarAuditoriaLote = async (lote: LoteImportacionResumen) => {
    try {
      const { data: movs } = await supabase
        .from("movimientos")
        .select(
          `
          id,
          fecha_movimiento,
          tipo,
          cantidad,
          notas,
          producto:productos(nombre, sku),
          ubicacion:ubicaciones(nombre)
        `,
        )
        .eq("import_batch_id", lote.batch_id);

      const wb = XLSX.utils.book_new();
      const filas = [
        [
          "ID Movimiento",
          "Fecha",
          "Producto",
          "SKU",
          "Ubicación",
          "Tipo",
          "Cantidad Fijada",
          "Notas de Auditoría",
        ],
        ...(movs || []).map((m: any) => [
          m.id,
          m.fecha_movimiento,
          neutralizarFormula(m.producto?.nombre || ""),
          neutralizarFormula(m.producto?.sku || ""),
          neutralizarFormula(m.ubicacion?.nombre || ""),
          m.tipo,
          m.cantidad,
          neutralizarFormula(m.notas || ""),
        ]),
      ];

      const ws = XLSX.utils.aoa_to_sheet(filas);
      ws["!cols"] = [
        { wch: 36 },
        { wch: 20 },
        { wch: 35 },
        { wch: 16 },
        { wch: 20 },
        { wch: 12 },
        { wch: 16 },
        { wch: 50 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, "Auditoría de Lote");

      const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      descargarArchivoExcel(
        new Uint8Array(buffer),
        `AUDITORIA_LOTE_${lote.batch_id.slice(0, 8)}.xlsx`,
      );
      toast.success("Auditoría de lote descargada en Excel");
    } catch (e: any) {
      toast.error(`Error al generar auditoría: ${e.message || e}`);
    }
  };

  return (
    <>
      <Dialog open={abierto} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl bg-card border-border shadow-xl">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 flex items-center justify-center mb-1">
              <History className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Historial y Reversión de Lotes de Importación
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Solo administradores. Permite auditar y deshacer de forma atómica una actualización
              masiva previa devolviendo el stock a su valor anterior.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3">
            {isLoading ? (
              <div className="py-10 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-amber-600 dark:text-amber-400" />
                <span>Consultando historial de lotes en base de datos...</span>
              </div>
            ) : lotes.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground bg-muted border border-dashed border-border rounded-lg">
                No hay lotes de importación masiva registrados aún en el sistema.
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {lotes.map((lote) => (
                  <div
                    key={lote.batch_id}
                    className="p-3 bg-card border border-border hover:border-amber-300 dark:hover:border-amber-500/40 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs transition-all"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-foreground bg-muted px-1.5 py-0.5 rounded border">
                          LOTE {lote.batch_id.slice(0, 8)}...
                        </span>
                        {lote.ya_revertido ? (
                          <Badge className="bg-muted text-muted-foreground border-border text-[10px]">
                            Revertido
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 text-[10px]">
                            Activo ({lote.total_movimientos} movimientos)
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          {new Date(lote.fecha).toLocaleString("es-ES")}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          {lote.realizado_por_email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => descargarAuditoriaLote(lote)}
                        className="text-xs h-7 gap-1 border-border text-foreground hover:bg-muted"
                        title="Descargar archivo Excel con los cambios realizados por este lote"
                      >
                        <Download className="w-3 h-3 text-muted-foreground" />
                        <span>Auditoría</span>
                      </Button>

                      {!lote.ya_revertido && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => iniciarReversion(lote)}
                          disabled={comprobandoConflictos}
                          className="text-xs h-7 gap-1 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 bg-rose-50/50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20"
                          title="Deshacer todos los cambios de este lote"
                        >
                          <RotateCcw className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                          <span>Revertir Lote</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación crítica de reversión */}
      <AlertDialog open={confirmarAbierto} onOpenChange={setConfirmarAbierto}>
        <AlertDialogContent className="bg-card border-rose-200 dark:border-rose-500/30">
          <AlertDialogHeader>
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center justify-center mb-1">
              <RotateCcw className="w-5 h-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              ¿Confirmar reversión del Lote {loteSeleccionado?.batch_id.slice(0, 8)}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground space-y-2">
              <p>
                Esta acción creará movimientos compensatorios de tipo ajuste devolviendo los
                productos al stock previo a la importación. Solo se puede realizar una vez por lote.
              </p>

              {conflictosDetectados.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/40 rounded-lg text-amber-950 dark:text-amber-100 space-y-1 mt-2">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-100 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-300" />
                    <span>¡Atención! Se detectaron cambios concurrentes posteriores:</span>
                  </div>
                  <ul className="list-disc pl-4 text-[11px] space-y-0.5 text-amber-900 dark:text-amber-100 max-h-32 overflow-y-auto">
                    {conflictosDetectados.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-amber-800 dark:text-amber-200 font-medium pt-1">
                    Si confirmas, se sobreescribirá el stock actual con el valor anterior al lote.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutationRevertir.isPending} className="text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => mutationRevertir.mutate()}
              disabled={mutationRevertir.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5"
            >
              {mutationRevertir.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Revertiendo lote...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Sí, revertir lote</span>
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
