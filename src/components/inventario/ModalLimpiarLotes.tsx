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
import { Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyProfile } from "@/hooks/usePermissions";

interface ModalLimpiarLotesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModalLimpiarLotes({ open, onOpenChange }: ModalLimpiarLotesProps) {
  const { user } = useAuth();
  const { isAdmin, permisos } = useMyProfile();
  const queryClient = useQueryClient();
  const [dias, setDias] = useState("90");

  const mutacionLimpiar = useMutation({
    mutationFn: async () => {
      if (!isAdmin || !user?.id) {
        throw new Error("Solo administradores pueden limpiar lotes");
      }
      if (permisos?.puede_crear_productos !== true) {
        throw new Error("Necesitas permiso para realizar esta acción");
      }

      const { data, error } = await supabase.rpc("limpiar_lotes_antiguos", {
        p_dias: parseInt(dias),
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(
        `Limpieza completada: ${data?.lotes_borrados} lotes y ${data?.movimientos_borrados} movimientos eliminados`,
      );
      queryClient.invalidateQueries({ queryKey: ["movimientos"] });
      queryClient.invalidateQueries({ queryKey: ["productos"] });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Limpiar lotes antiguos
          </DialogTitle>
          <DialogDescription>
            Elimina movimientos y lotes de importación antiguos para liberar espacio en la base de
            datos. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-semibold mb-1">Advertencia:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Se eliminarán todos los movimientos de lotes antiguos</li>
                <li>Los productos sin otros movimientos también se eliminarán</li>
                <li>El historial de movimientos se perderá permanentemente</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dias">Eliminar lotes anteriores a:</Label>
            <Select value={dias} onValueChange={setDias}>
              <SelectTrigger id="dias">
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
              Se eliminarán los lotes importados antes de esta fecha
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutacionLimpiar.mutate()}
            disabled={mutacionLimpiar.isPending}
          >
            {mutacionLimpiar.isPending ? (
              "Limpiando..."
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar lotes antiguos
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
