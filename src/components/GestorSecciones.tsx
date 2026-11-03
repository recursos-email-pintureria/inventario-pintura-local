import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { actualizarEstadoSeccion, crearSeccion, getSeccionesParaGestion } from "@/lib/inventario";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

interface GestorSeccionesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManageSections: boolean;
}

export function GestorSecciones({ open, onOpenChange, canManageSections }: GestorSeccionesProps) {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nombre, setNombre] = useState("");

  const seccionesQuery = useQuery({
    queryKey: ["secciones", "gestion"],
    queryFn: getSeccionesParaGestion,
    enabled: open,
  });

  const invalidarSecciones = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["secciones"] }),
      queryClient.invalidateQueries({ queryKey: ["ubicacionesCompletas"] }),
    ]);
  };

  const actualizarEstado = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      actualizarEstadoSeccion(id, activo),
    onSuccess: async (_, variables) => {
      await invalidarSecciones();
      toast.success(variables.activo ? "Sección activada" : "Sección desactivada");
    },
    onError: (error: Error) => {
      toast.error(`No se pudo actualizar la sección: ${error.message}`);
    },
  });

  const crear = useMutation({
    mutationFn: (nombreSeccion: string) => crearSeccion(nombreSeccion),
    onSuccess: async () => {
      await invalidarSecciones();
      setNombre("");
      setMostrarFormulario(false);
      toast.success("Sección creada");
    },
    onError: (error: Error) => {
      toast.error(`No se pudo crear la sección: ${error.message}`);
    },
  });

  const guardarNuevaSeccion = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      toast.error("Escribe el nombre de la sección.");
      return;
    }
    crear.mutate(nombreLimpio);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile
            ? "h-[85dvh] w-full overflow-y-auto rounded-t-2xl"
            : "h-full w-full overflow-y-auto sm:max-w-md"
        }
      >
        <SheetHeader>
          <SheetTitle>Gestión de Secciones</SheetTitle>
          <SheetDescription>
            Activa o desactiva secciones sin borrar su estructura.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {seccionesQuery.isPending ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Cargando secciones...
            </div>
          ) : seccionesQuery.isError ? (
            <div role="alert" className="space-y-3 rounded-md border border-destructive/30 p-4">
              <p className="text-sm text-destructive">
                No se pudieron cargar las secciones: {seccionesQuery.error.message}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void seccionesQuery.refetch()}
              >
                <RefreshCw className="h-4 w-4" />
                Reintentar
              </Button>
            </div>
          ) : seccionesQuery.data.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Todavía no hay secciones.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {seccionesQuery.data.map((seccion) => (
                <li
                  key={seccion.id}
                  className="flex min-h-14 items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{seccion.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {seccion.activo ? "Activa" : "Inactiva"}
                    </p>
                  </div>
                  <Switch
                    checked={seccion.activo === true}
                    disabled={!canManageSections || actualizarEstado.isPending}
                    aria-label={`Sección ${seccion.nombre} activa`}
                    onCheckedChange={(activo) =>
                      actualizarEstado.mutate({ id: seccion.id, activo })
                    }
                  />
                </li>
              ))}
            </ul>
          )}

          {canManageSections && (
            <div className="border-t pt-4">
              {mostrarFormulario ? (
                <form onSubmit={guardarNuevaSeccion} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="nueva-seccion">Nombre de la nueva sección</Label>
                    <Input
                      id="nueva-seccion"
                      autoFocus
                      maxLength={100}
                      value={nombre}
                      onChange={(event) => setNombre(event.target.value)}
                      placeholder="Ej. Pintura"
                      disabled={crear.isPending}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={!nombre.trim() || crear.isPending}
                      className="flex-1"
                    >
                      {crear.isPending ? "Guardando..." : "Guardar"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={crear.isPending}
                      onClick={() => {
                        setMostrarFormulario(false);
                        setNombre("");
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setMostrarFormulario(true)}
                >
                  <Plus className="h-4 w-4" />
                  Nueva Sección
                </Button>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
