import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, History, LoaderCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useMyProfile } from "@/hooks/usePermissions";
import { supabase } from "@/lib/supabase";

interface MovimientoImportacion {
  id: string;
  id_producto: string;
  id_ubicacion: string;
  tipo: string;
  cantidad: number;
  notas: string | null;
  realizado_por: string | null;
  fecha_movimiento: string;
}

interface AuditoriaImportacion {
  origen?: string;
  modo?: "sumar" | "establecer";
  fila?: number;
  sku?: string;
  ean?: string;
  cantidad_csv?: number;
  cantidad_anterior?: number;
  cantidad_nueva?: number;
  tipo_movimiento?: string;
}

interface LoteImportacion {
  id: string;
  fecha: string;
  usuarioId: string | null;
  ubicacionId: string;
  modo: "sumar" | "establecer" | null;
  cantidadMovimientos: number;
}

interface FilaLote {
  movimiento: MovimientoImportacion;
  auditoria: AuditoriaImportacion | null;
  conflictoPosterior: boolean;
}

interface DatosLote {
  filas: FilaLote[];
  armario: string;
  usuario: string;
  modo: "sumar" | "establecer" | null;
  yaRevertido: boolean;
}

interface ModalRevertirListaArmarioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function extraerIdLote(notas: string | null): string | null {
  const coincidencia = notas?.match(
    /^Importación CSV Lote:\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\s*\|/i,
  );
  return coincidencia?.[1] ?? null;
}

function extraerAuditoria(notas: string | null): AuditoriaImportacion | null {
  if (!notas) return null;
  const separador = notas.indexOf(" | ");
  if (separador < 0) return null;

  try {
    const auditoria: unknown = JSON.parse(notas.slice(separador + 3));
    if (typeof auditoria !== "object" || auditoria === null) return null;
    return auditoria as AuditoriaImportacion;
  } catch {
    return null;
  }
}

function esModoImportacion(valor: unknown): valor is "sumar" | "establecer" {
  return valor === "sumar" || valor === "establecer";
}

function errorMensaje(error: unknown): string {
  return error instanceof Error ? error.message : "Error inesperado al procesar la solicitud.";
}

async function cargarLotesRecientes(): Promise<LoteImportacion[]> {
  const lotes = new Map<string, LoteImportacion>();
  const tamanoPagina = 500;
  const maximoFilas = 10_000;

  for (let desde = 0; desde < maximoFilas && lotes.size < 20; desde += tamanoPagina) {
    const { data, error } = await supabase
      .from("movimientos")
      .select("notas,realizado_por,id_ubicacion,fecha_movimiento")
      .ilike("notas", "Importación CSV Lote: %")
      .order("fecha_movimiento", { ascending: false })
      .range(desde, desde + tamanoPagina - 1);
    if (error) throw error;

    const movimientos = (data ?? []) as Pick<
      MovimientoImportacion,
      "notas" | "realizado_por" | "id_ubicacion" | "fecha_movimiento"
    >[];
    for (const movimiento of movimientos) {
      const id = extraerIdLote(movimiento.notas);
      if (!id) continue;

      const lote = lotes.get(id);
      if (lote) {
        lote.cantidadMovimientos += 1;
        continue;
      }

      const auditoria = extraerAuditoria(movimiento.notas);
      lotes.set(id, {
        id,
        fecha: movimiento.fecha_movimiento,
        usuarioId: movimiento.realizado_por,
        ubicacionId: movimiento.id_ubicacion,
        modo: esModoImportacion(auditoria?.modo) ? auditoria.modo : null,
        cantidadMovimientos: 1,
      });
    }

    if (movimientos.length < tamanoPagina) break;
  }

  return [...lotes.values()].slice(0, 20);
}

async function cargarDatosLote(loteId: string): Promise<DatosLote> {
  const prefijo = `Importación CSV Lote: ${loteId} | `;
  const { data, error } = await supabase
    .from("movimientos")
    .select("id,id_producto,id_ubicacion,tipo,cantidad,notas,realizado_por,fecha_movimiento")
    .ilike("notas", `${prefijo}%`)
    .order("fecha_movimiento", { ascending: true });
  if (error) throw error;

  const movimientos = (data ?? []) as MovimientoImportacion[];
  if (movimientos.length === 0) {
    throw new Error("No se encontraron movimientos para este lote.");
  }

  const ubicacionIds = [...new Set(movimientos.map((movimiento) => movimiento.id_ubicacion))];
  const usuarioIds = [
    ...new Set(
      movimientos.flatMap((movimiento) =>
        movimiento.realizado_por ? [movimiento.realizado_por] : [],
      ),
    ),
  ];
  const productoIds = [...new Set(movimientos.map((movimiento) => movimiento.id_producto))];
  const fechaMasAntigua = movimientos.reduce(
    (fecha, movimiento) =>
      new Date(movimiento.fecha_movimiento).getTime() < new Date(fecha).getTime()
        ? movimiento.fecha_movimiento
        : fecha,
    movimientos[0]!.fecha_movimiento,
  );

  const [ubicacionesResult, perfilesResult, stockResult, posterioresResult, reversionResult] =
    await Promise.all([
      supabase.from("ubicaciones").select("id,nombre").in("id", ubicacionIds),
      usuarioIds.length > 0
        ? supabase.from("perfiles_usuario").select("id,nombre_completo").in("id", usuarioIds)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("stock")
        .select("id_producto,cantidad")
        .eq("id_ubicacion", ubicacionIds[0]!)
        .is("id_palet", null)
        .in("id_producto", productoIds),
      supabase
        .from("movimientos")
        .select("id_producto,id_ubicacion,notas,fecha_movimiento")
        .in("id_ubicacion", ubicacionIds)
        .in("id_producto", productoIds)
        .gte("fecha_movimiento", fechaMasAntigua)
        .order("fecha_movimiento", { ascending: true })
        .limit(5000),
      supabase
        .from("movimientos")
        .select("id")
        .ilike("notas", `Reversión CSV Lote: ${loteId} | %`)
        .limit(1),
    ]);

  for (const resultado of [
    ubicacionesResult,
    perfilesResult,
    stockResult,
    posterioresResult,
    reversionResult,
  ]) {
    if (resultado.error) throw resultado.error;
  }

  const ubicaciones = (ubicacionesResult.data ?? []) as { id: string; nombre: string }[];
  const perfiles = (perfilesResult.data ?? []) as {
    id: string;
    nombre_completo: string;
  }[];
  const stocks = (stockResult.data ?? []) as { id_producto: string; cantidad: number }[];
  const movimientosDesdeLote = (posterioresResult.data ?? []) as Pick<
    MovimientoImportacion,
    "id_producto" | "id_ubicacion" | "notas" | "fecha_movimiento"
  >[];
  const notasPrefijo = `Importación CSV Lote: ${loteId} | `;
  const ubicacionPorId = new Map(ubicaciones.map((ubicacion) => [ubicacion.id, ubicacion.nombre]));
  const perfilPorId = new Map(perfiles.map((perfil) => [perfil.id, perfil.nombre_completo]));
  const stockPorProducto = new Map(stocks.map((stock) => [stock.id_producto, stock.cantidad]));
  const filas = movimientos.map((movimiento) => {
    const auditoria = extraerAuditoria(movimiento.notas);
    const fechaOriginal = new Date(movimiento.fecha_movimiento).getTime();
    const conflictoPosterior = movimientosDesdeLote.some(
      (posterior) =>
        posterior.id_producto === movimiento.id_producto &&
        posterior.id_ubicacion === movimiento.id_ubicacion &&
        new Date(posterior.fecha_movimiento).getTime() >= fechaOriginal &&
        !posterior.notas?.startsWith(notasPrefijo),
    );

    return { movimiento, auditoria, conflictoPosterior };
  });
  const usuarioId = movimientos[0]?.realizado_por ?? null;
  const ubicacionId = movimientos[0]!.id_ubicacion;
  const perfil = usuarioId ? perfilPorId.get(usuarioId) : undefined;

  return {
    filas,
    armario: ubicacionPorId.get(ubicacionId) ?? "Armario desconocido",
    usuario: perfil ?? "Usuario desconocido",
    modo: esModoImportacion(filas[0]?.auditoria?.modo) ? filas[0].auditoria.modo : null,
    yaRevertido: (reversionResult.data ?? []).length > 0,
  };
}

export function ModalRevertirListaArmario({ open, onOpenChange }: ModalRevertirListaArmarioProps) {
  const { isAdmin, permisos } = useMyProfile();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loteSeleccionado, setLoteSeleccionado] = useState("");
  const [confirmarConflictos, setConfirmarConflictos] = useState(false);
  const [alertaAbierta, setAlertaAbierta] = useState(false);

  const lotesQuery = useQuery({
    queryKey: ["lotes-importacion-armario"],
    queryFn: cargarLotesRecientes,
    enabled: open && isAdmin,
    staleTime: 30_000,
  });
  const datosLoteQuery = useQuery({
    queryKey: ["lote-importacion-armario", loteSeleccionado],
    queryFn: () => cargarDatosLote(loteSeleccionado),
    enabled: open && isAdmin && loteSeleccionado !== "",
  });
  const datosLote = datosLoteQuery.data;
  const filas = datosLote?.filas ?? [];
  const conflictos = filas.filter((fila) => fila.conflictoPosterior);
  const filasSinAuditoria = filas.filter(
    (fila) =>
      fila.auditoria?.origen !== "importacion" ||
      !esModoImportacion(fila.auditoria.modo) ||
      typeof fila.auditoria.cantidad_anterior !== "number" ||
      typeof fila.auditoria.cantidad_nueva !== "number" ||
      typeof fila.auditoria.cantidad_csv !== "number",
  );

  const mutacionRevertir = useMutation({
    mutationFn: async () => {
      if (!isAdmin || !user?.id) {
        throw new Error("Solo un administrador autenticado puede revertir un lote.");
      }
      if (!loteSeleccionado) {
        throw new Error("Selecciona un lote válido.");
      }

      const { data, error } = await supabase.rpc("revertir_lote_importacion", {
        p_lote_id: loteSeleccionado,
      });

      if (error) throw error;
      return data?.movimientos_compensatorios ?? 0;
    },
    onSuccess: async (cantidad) => {
      toast.success(`Lote revertido con ${cantidad} movimiento(s) compensatorio(s).`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["lotes-importacion-armario"] }),
        queryClient.invalidateQueries({ queryKey: ["movimientos"] }),
        queryClient.invalidateQueries({ queryKey: ["stock"] }),
        queryClient.invalidateQueries({ queryKey: ["productos"] }),
        queryClient.invalidateQueries({ queryKey: ["ubicaciones"] }),
      ]);
      setAlertaAbierta(false);
      setLoteSeleccionado("");
      setConfirmarConflictos(false);
      onOpenChange(false);
    },
    onError: (error) => toast.error(errorMensaje(error)),
  });

  const etiquetaLote = useMemo(
    () => (lote: LoteImportacion) =>
      `${new Date(lote.fecha).toLocaleString("es-ES")} · ${lote.id.slice(0, 8)} · ${lote.cantidadMovimientos} mov.`,
    [],
  );
  const bloqueado =
    !datosLote ||
    datosLoteQuery.isPending ||
    datosLote.yaRevertido ||
    filasSinAuditoria.length > 0 ||
    permisos?.puede_crear_productos !== true ||
    (conflictos.length > 0 && !confirmarConflictos) ||
    mutacionRevertir.isPending;
  const sinPermisoMovimientos = permisos?.puede_crear_productos !== true;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(valor) => {
          onOpenChange(valor);
          if (!valor) {
            setLoteSeleccionado("");
            setConfirmarConflictos(false);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-amber-600" aria-hidden="true" />
              Revertir lote de importación
            </DialogTitle>
            <DialogDescription>
              Se crearán movimientos compensatorios. El historial original no se elimina.
            </DialogDescription>
          </DialogHeader>

          {!isAdmin ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Solo los administradores pueden revertir lotes.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lote-importacion">Lote reciente</Label>
                <Select
                  value={loteSeleccionado}
                  onValueChange={(valor) => {
                    setLoteSeleccionado(valor);
                    setConfirmarConflictos(false);
                  }}
                  disabled={lotesQuery.isPending || (lotesQuery.data?.length ?? 0) === 0}
                >
                  <SelectTrigger id="lote-importacion" className="min-h-11">
                    <SelectValue placeholder="Selecciona un lote" />
                  </SelectTrigger>
                  <SelectContent>
                    {(lotesQuery.data ?? []).map((lote) => (
                      <SelectItem key={lote.id} value={lote.id}>
                        {etiquetaLote(lote)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {lotesQuery.isPending && (
                  <p className="text-sm text-muted-foreground">Cargando lotes recientes...</p>
                )}
                {lotesQuery.isError && (
                  <p className="text-sm text-destructive" role="alert">
                    No se pudieron cargar los lotes. {errorMensaje(lotesQuery.error)}
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 pl-1"
                      onClick={() => void lotesQuery.refetch()}
                    >
                      Reintentar
                    </Button>
                  </p>
                )}
                {lotesQuery.isSuccess && lotesQuery.data.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No hay importaciones anteriores para revertir.
                  </p>
                )}
              </div>

              {datosLoteQuery.isError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{errorMensaje(datosLoteQuery.error)}</AlertDescription>
                </Alert>
              )}
              {datosLoteQuery.isPending && loteSeleccionado && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Consultando los movimientos del lote...
                </div>
              )}
              {datosLote && (
                <div className="space-y-3">
                  {sinPermisoMovimientos && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Tu cuenta necesita el permiso puede_crear_productos para registrar los
                        movimientos compensatorios. Solicítalo al administrador del sistema.
                      </AlertDescription>
                    </Alert>
                  )}
                  <dl className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 text-sm sm:grid-cols-4">
                    <DatoLote
                      titulo="Fecha"
                      valor={new Date(filas[0]!.movimiento.fecha_movimiento).toLocaleString(
                        "es-ES",
                      )}
                    />
                    <DatoLote titulo="Usuario" valor={datosLote.usuario} />
                    <DatoLote titulo="Armario" valor={datosLote.armario} />
                    <DatoLote
                      titulo="Modo / movimientos"
                      valor={`${datosLote.modo ?? "desconocido"} / ${filas.length}`}
                    />
                  </dl>

                  {datosLote.yaRevertido && (
                    <Alert>
                      <AlertDescription>
                        Este lote ya tiene movimientos de reversión asociados.
                      </AlertDescription>
                    </Alert>
                  )}
                  {filasSinAuditoria.length > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        No se puede revertir con seguridad: faltan datos de auditoría en{" "}
                        {filasSinAuditoria.length} movimiento(s).
                      </AlertDescription>
                    </Alert>
                  )}
                  {conflictos.length > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {conflictos.length} fila(s) tienen movimientos posteriores. Confirmar
                        significa restaurar el stock previo a la importación y puede sobrescribir
                        esos cambios posteriores.
                      </AlertDescription>
                    </Alert>
                  )}

                  <ScrollArea className="h-48 rounded-lg border">
                    <ul className="divide-y">
                      {filas.map(({ movimiento, auditoria, conflictoPosterior }) => (
                        <li
                          key={movimiento.id}
                          className="flex items-center justify-between gap-3 p-3 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {auditoria?.sku ?? "SKU desconocido"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {movimiento.tipo} · {movimiento.cantidad} uds.
                            </p>
                          </div>
                          <Badge variant={conflictoPosterior ? "destructive" : "outline"}>
                            {conflictoPosterior ? "Movimiento posterior" : "Sin conflicto"}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>

                  {conflictos.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="confirmar-conflictos-reversion"
                        checked={confirmarConflictos}
                        onCheckedChange={(checked) => setConfirmarConflictos(checked === true)}
                      />
                      <Label
                        htmlFor="confirmar-conflictos-reversion"
                        className="cursor-pointer text-sm leading-5"
                      >
                        Confirmo que quiero restaurar el stock anterior aunque existan movimientos
                        posteriores.
                      </Label>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={() => onOpenChange(false)}
                >
                  Cerrar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="min-h-11"
                  disabled={bloqueado}
                  onClick={() => setAlertaAbierta(true)}
                >
                  <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                  Revertir lote
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={alertaAbierta} onOpenChange={setAlertaAbierta}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Revertir este lote?</AlertDialogTitle>
            <AlertDialogDescription>
              Se registrarán movimientos nuevos para compensar la importación. No se borrará ningún
              movimiento existente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutacionRevertir.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={mutacionRevertir.isPending || bloqueado}
              onClick={(event) => {
                event.preventDefault();
                mutacionRevertir.mutate();
              }}
            >
              {mutacionRevertir.isPending ? "Revirtiendo..." : "Confirmar reversión"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function DatoLote({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{titulo}</dt>
      <dd className="truncate font-medium" title={valor}>
        {valor}
      </dd>
    </div>
  );
}
