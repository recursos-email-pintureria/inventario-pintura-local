import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  actualizarCategoria,
  crearCategoria,
  desactivarCategoria,
  getCategorias,
} from "@/lib/inventario";
import type { Categoria } from "@/lib/tipos";

export const Route = createFileRoute("/_authenticated/categorias")({
  component: CategoriasPage,
});

function CategoriasPage() {
  const queryClient = useQueryClient();

  // 🔌 Categorías reales desde Supabase
  const {
    data: categorias = [],
    isLoading,
    isError,
  } = useQuery<Categoria[]>({
    queryKey: ["categorias"],
    queryFn: getCategorias,
  });

  // Estados de UI
  const [modalAbierto, setModalAbierto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null);
  const [formNombre, setFormNombre] = useState("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [categoriaADesactivar, setCategoriaADesactivar] = useState<Categoria | null>(null);

  // 🔌 Mutaciones
  const mutationCrear = useMutation({
    mutationFn: ({ nombre, descripcion }: { nombre: string; descripcion: string | null }) =>
      crearCategoria(nombre, descripcion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoría creada correctamente");
    },
    onError: (e: Error) => toast.error(e.message || "Error al crear la categoría"),
  });

  const mutationActualizar = useMutation({
    mutationFn: ({
      id,
      nombre,
      descripcion,
    }: {
      id: string;
      nombre: string;
      descripcion: string | null;
    }) => actualizarCategoria(id, { nombre, descripcion }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoría actualizada correctamente");
    },
    onError: (e: Error) => toast.error(e.message || "Error al actualizar la categoría"),
  });

  const mutationDesactivar = useMutation({
    mutationFn: (id: string) => desactivarCategoria(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoría desactivada correctamente");
    },
    onError: (e: Error) => toast.error(e.message || "Error al desactivar la categoría"),
  });

  // Handlers
  const abrirModalNueva = () => {
    setCategoriaEditando(null);
    setFormNombre("");
    setFormDescripcion("");
    setModalAbierto(true);
  };

  const abrirModalEditar = (cat: Categoria) => {
    setCategoriaEditando(cat);
    setFormNombre(cat.nombre);
    setFormDescripcion(cat.descripcion ?? "");
    setModalAbierto(true);
  };

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (categoriaEditando) {
      mutationActualizar.mutate({
        id: categoriaEditando.id,
        nombre: formNombre.trim(),
        descripcion: formDescripcion.trim() || null,
      });
    } else {
      mutationCrear.mutate({
        nombre: formNombre.trim(),
        descripcion: formDescripcion.trim() || null,
      });
    }
    setModalAbierto(false);
    setCategoriaEditando(null);
  };

  const confirmarDesactivar = () => {
    if (!categoriaADesactivar) return;
    mutationDesactivar.mutate(categoriaADesactivar.id);
    setCategoriaADesactivar(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase text-gray-400 mb-1">
            <span>INVENTARIO LM</span>
            <span className="text-gray-300">/</span>
            <span>CATÁLOGO</span>
            <span className="text-gray-300">/</span>
            <span className="text-amber-700 font-bold">CATEGORÍAS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Categorías de Productos
          </h1>
        </div>
        <Button
          onClick={abrirModalNueva}
          className="h-10 bg-[#8c4314] hover:bg-[#78370e] text-white rounded-lg text-xs font-semibold px-4 gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Categoría</span>
        </Button>
      </div>

      {/* TABLA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-[#D24D09]" />
            Categorías registradas en Supabase
          </CardTitle>
          <CardDescription className="text-xs">
            Gestiona las categorías reales de tu base de datos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">NOMBRE</TableHead>
                <TableHead className="text-xs">DESCRIPCIÓN</TableHead>
                <TableHead className="text-xs text-right">ESTADO</TableHead>
                <TableHead className="text-xs text-right">ACCIONES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    Cargando categorías desde Supabase...
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-rose-600">
                    Error al cargar las categorías. Revisa la conexión y las políticas RLS.
                  </TableCell>
                </TableRow>
              ) : categorias.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    No hay categorías activas. Crea la primera.
                  </TableCell>
                </TableRow>
              ) : (
                categorias.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-indigo-50 text-indigo-800 border-indigo-200 text-xs font-medium"
                      >
                        {cat.nombre}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 max-w-[320px] truncate">
                      {cat.descripcion || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
                      >
                        Activa
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => abrirModalEditar(cat)}
                          className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCategoriaADesactivar(cat)}
                          className="h-7 w-7 p-0 text-slate-500 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL NUEVA / EDITAR */}
      <Dialog
        open={modalAbierto}
        onOpenChange={(open) => {
          if (!open) {
            setModalAbierto(false);
            setCategoriaEditando(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {categoriaEditando ? "Editar Categoría" : "Nueva Categoría"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {categoriaEditando
                ? "Modifica los datos de la categoría."
                : "Crea una nueva categoría en la base de datos."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGuardar} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Nombre *</Label>
              <Input
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                placeholder="Ej: Pintura blanca"
                className="h-9 text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Descripción</Label>
              <Textarea
                value={formDescripcion}
                onChange={(e) => setFormDescripcion(e.target.value)}
                placeholder="Descripción breve (opcional)"
                className="text-xs"
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalAbierto(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#8c4314] hover:bg-[#78370e] text-white text-xs"
                disabled={mutationCrear.isPending || mutationActualizar.isPending}
              >
                {categoriaEditando ? "Guardar Cambios" : "Crear Categoría"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ALERT DIALOG DESACTIVAR */}
      <AlertDialog
        open={Boolean(categoriaADesactivar)}
        onOpenChange={(open) => !open && setCategoriaADesactivar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">¿Desactivar categoría?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              La categoría «<strong>{categoriaADesactivar?.nombre}</strong>» dejará de aparecer en
              el catálogo. Los productos asociados conservarán su historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarDesactivar}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs"
            >
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
