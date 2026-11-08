"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Trash2, AlertTriangle, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyProfile } from "@/hooks/usePermissions";

/**
 * ModalLimpiarLotes
 * 
 * Función: Eliminar movimientos de importación CSV antiguos.
 * 
 * Seguridad real (en la base de datos, no en el frontend):
 * - La RPC 'limpiar_lotes_antiguos' valida que el usuario sea admin.
 * - La RPC valida que p_dias esté entre 1 y 3650.
 * - La RPC SOLO borra de la tabla 'movimientos' (registros con notas tipo 'Importación CSV Lote: ...').
 * - La RPC NUNCA borra de la tabla 'productos'.
 * - El stock NO se ve afectado porque el trigger actualizar_stock solo se dispara en INSERT, no en DELETE.
 * 
 * Nota: Las validaciones del frontend (isAdmin, permisos) son solo UX.
 * La seguridad real está en la función SQL con SECURITY DEFINER.
 */

interface ModalLimpiarLotesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModalLimpiarLotes({ open, onOpenChange }: ModalLimpiarLotesProps) {
  const { user } = useAuth();
  const { isAdmin } = useMyProfile();
  const queryClient = useQueryClient();
  const [dias, setDias] = useState("90");

  const mutacionLimpiar = useMutation({
    mutationFn: async () => {
      // Validación UX (la seguridad real está en la RPC)
      if (!isAdmin || !user?.id) {
        throw new Error("Solo administradores pueden limpiar lotes");
      }

      const { data, error } = await supabase.rpc("limpiar_lotes_antiguos", {
        p_dias: parseInt(dias),
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(
        `Limpieza completada: ${data?.lotes_borrados ?? 0} lotes y ${data?.movimientos_borrados ?? 0} movimientos eliminados`,
      );
      queryClient.invalidateQueries({ queryKey: ["movimientos"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al limpiar la base de datos");
    },
  });

  const diasOpciones = [
    { valor: "30", etiqueta: "30 días (1 mes)" },
    { valor: "60", etiqueta: "60 días (2 meses)" },
    { valor: "90", etiqueta: "90 días (3 meses)" },
    { valor: "180", etiqueta: "180 días (6 meses)" },
    { valor: "365", etiqueta: "365 días (1 año)" },
  ];

  // Calcular fecha de corte
  const fechaCorte = new Date();
  fechaCorte.setDate(fechaCorte.getDate() - parseInt(dias));
  const fechaCorteFormateada = fechaCorte.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Limpiar lotes de importación antiguos
          </DialogTitle>
          <DialogDescription>
            Elimina el historial de movimientos de importaciones CSV antiguas para liberar espacio 
            en la base de datos. Esta acción es irreversible.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* ⚠️ Qué SÍ se elimina */}
          <div className="rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-amber-900 dark:text-amber-100 text-sm mb-2">
                  Esto se eliminará (irreversible):
                </p>
                <ul className="space-y-1.5 text-xs text-amber-800 dark:text-amber-200">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                    <span>
                      Movimientos de importación CSV anteriores a <strong>{dias} días</strong> (antes del {fechaCorteFormateada})
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                    <span>
                      Registros con notas tipo <code className="bg-amber-100 dark:bg-amber-500/20 px-1 rounded">"Importación CSV Lote: ..."</code>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                    <span>El historial de movimientos de esos lotes se perderá permanentemente</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* ✅ Qué NO se elimina (garantía de la base de datos) */}
          <div className="rounded-lg border border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-green-900 dark:text-green-100 text-sm mb-2">
                  Protegido por la base de datos (no se modifica):
                </p>
                <ul className="space-y-1.5 text-xs text-green-800 dark:text-green-200">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                    <span><strong>Productos</strong> - La función SQL nunca toca la tabla productos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                    <span><strong>Categorías</strong> - No se ven afectadas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                    <span><strong>Stock actual</strong> - El trigger actualizar_stock solo se dispara en INSERT, no en DELETE</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                    <span><strong>Movimientos no-CSV</strong> - Solo se borran movimientos de importación CSV</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 📅 Selección de período */}
          <div className="space-y-2">
            <Label htmlFor="dias" className="text-sm font-medium">
              Período a limpiar:
            </Label>
            <Select value={dias} onValueChange={setDias}>
              <SelectTrigger id="dias" className="w-full">
                <SelectValue placeholder="Selecciona período" />
              </SelectTrigger>
              <SelectContent>
                {diasOpciones.map((opcion) => (
                  <SelectItem key={opcion.valor} value={opcion.valor}>
                    {opcion.etiqueta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Se eliminarán movimientos de importación anteriores al <strong>{fechaCorteFormateada}</strong>
            </p>
          </div>

          {/* 🔒 Nota de seguridad */}
          <div className="rounded-md bg-muted border border-border p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1">🔒 Seguridad:</p>
            <p>
              Esta operación está protegida a nivel de base de datos. Solo usuarios con rol <strong>admin</strong> 
              pueden ejecutarla, y la función SQL valida el parámetro de días (1-3650) para evitar borrados accidentales.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutacionLimpiar.mutate()}
            disabled={mutacionLimpiar.isPending || !isAdmin}
            className="gap-2"
          >
            {mutacionLimpiar.isPending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Limpiando...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Eliminar lotes antiguos
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}