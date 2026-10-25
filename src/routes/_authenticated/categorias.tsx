import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { FolderTree, Plus, Pencil, Power } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/AppLayout";
import { pageHead } from "@/lib/meta";
import { useMyProfile } from "@/hooks/usePermissions";
import {
  inventarioQueryOptions,
  usuarioActual,
  guardarCategoria,
  desactivarRegistro,
  permisoExplicito,
  errorInventario,
  type Categoria,
} from "@/lib/inventario";
import { CargandoInventario, ErrorInventario } from "@/components/inventario/EstadoInventario";
export const Route = createFileRoute("/_authenticated/categorias")({
  head: () => pageHead("Categorías", "Categorías de productos de pintura."),
  loader: async ({ context }) => {
    const user = await usuarioActual();
    await context.queryClient.ensureQueryData(inventarioQueryOptions(user.id));
    return { userId: user.id };
  },
  pendingComponent: CargandoInventario,
  errorComponent: ErrorInventario,
  component: Categorias,
});
function Categorias() {
  const { userId } = Route.useLoaderData();
  const { data } = useSuspenseQuery(inventarioQueryOptions(userId));
  const { permisos } = useMyProfile();
  const gestionar = permisoExplicito(permisos, "puede_crear_productos");
  const client = useQueryClient();
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [desactivando, setDesactivando] = useState<Categoria | null>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState("");
  const guardar = useMutation({
    mutationFn: async () => {
      if (!gestionar) throw new Error("No tienes permiso para gestionar categorías.");
      await guardarCategoria(nombre, descripcion, editando?.id);
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["inventario", userId] });
      setAbierto(false);
      toast.success("Categoría guardada");
    },
    onError: (e) => setError(errorInventario(e)),
  });
  const desactivar = useMutation({
    mutationFn: async () => {
      if (!gestionar || !desactivando)
        throw new Error("No tienes permiso para desactivar categorías.");
      await desactivarRegistro("categorias", desactivando.id);
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["inventario", userId] });
      setDesactivando(null);
      toast.success("Categoría desactivada");
    },
    onError: (e) => setError(errorInventario(e)),
  });
  const abrir = (c: Categoria | null) => {
    setEditando(c);
    setNombre(c?.nombre ?? "");
    setDescripcion(c?.descripcion ?? "");
    setError("");
    setAbierto(true);
  };
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    guardar.mutate();
  };
  const categorias = data.categorias.filter((c) => c.activo);
  return (
    <>
      <PageHeader
        title="Categorías"
        action={
          gestionar ? (
            <Button onClick={() => abrir(null)}>
              <Plus className="h-4 w-4" />
              Nueva categoría
            </Button>
          ) : undefined
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categorias.map((c) => (
          <Card key={c.id} className="transition-shadow hover:shadow-soft">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-accent p-3 text-primary">
                  <FolderTree className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="break-words font-semibold">{c.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    {data.productos.filter((p) => p.activo && p.id_categoria === c.id).length}{" "}
                    productos
                  </p>
                </div>
              </div>
              {c.descripcion && (
                <p className="mt-3 break-words text-sm text-muted-foreground">{c.descripcion}</p>
              )}
              {gestionar && (
                <div className="mt-3 flex flex-wrap justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => abrir(c)}>
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setError("");
                      setDesactivando(c);
                    }}
                  >
                    <Power className="h-4 w-4" />
                    Desactivar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {!categorias.length && (
        <p className="text-sm text-muted-foreground">No hay categorías activas.</p>
      )}
      <Dialog
        open={abierto}
        onOpenChange={(o) => {
          if (!guardar.isPending) setAbierto(o);
        }}
      >
        <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
            <DialogDescription>Datos de la categoría</DialogDescription>
          </DialogHeader>
          <form onSubmit={enviar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoria-nombre">Nombre</Label>
              <Input
                id="categoria-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                disabled={guardar.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria-descripcion">Descripción (opcional)</Label>
              <Textarea
                id="categoria-descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                disabled={guardar.isPending}
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={guardar.isPending}
                onClick={() => setAbierto(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={guardar.isPending || !gestionar || !nombre.trim()}>
                {guardar.isPending ? "Guardando…" : "Guardar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!desactivando}
        onOpenChange={(o) => {
          if (!o && !desactivar.isPending) setDesactivando(null);
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle>Desactivar categoría</DialogTitle>
            <DialogDescription>¿Desactivar «{desactivando?.nombre}»?</DialogDescription>
          </DialogHeader>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={desactivar.isPending}
              onClick={() => setDesactivando(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={desactivar.isPending || !gestionar}
              onClick={() => desactivar.mutate()}
            >
              {desactivar.isPending ? "Desactivando…" : "Desactivar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
