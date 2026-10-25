import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/AppLayout";
import { pageHead } from "@/lib/meta";
import { supabase } from "@/lib/supabase";
import { cargarUsuarios, type UsuarioConPermisos } from "@/lib/usuarios";
import { useMyProfile, type PermisosUsuario } from "@/hooks/usePermissions";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => pageHead("Usuarios", "Gestión de usuarios y roles."),
  component: Usuarios,
});

const PERMISOS: { key: keyof Omit<PermisosUsuario, "id_usuario">; label: string }[] = [
  { key: "puede_crear_productos", label: "Crear productos" },
  { key: "puede_editar_productos", label: "Editar productos" },
  { key: "puede_eliminar_productos", label: "Eliminar productos" },
  { key: "puede_crear_ubicaciones", label: "Crear ubicaciones" },
  { key: "puede_editar_ubicaciones", label: "Editar ubicaciones" },
  { key: "puede_ver_movimientos", label: "Ver movimientos" },
  { key: "puede_exportar_movimientos", label: "Exportar movimientos" },
  { key: "puede_gestionar_usuarios", label: "Gestionar usuarios" },
];

function Usuarios() {
  // Aquí está la clave: usamos 'miPerfil'
  const { isAdmin, isLoading: cargandoPerfil, perfil: miPerfil } = useMyProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState<UsuarioConPermisos | null>(null);
  const [rol, setRol] = useState<string>("vendedor");
  const [activo, setActivo] = useState(true);
  const [permisos, setPermisos] = useState<Record<string, boolean>>({});
  const [confirmacionCritica, setConfirmacionCritica] = useState<{
    usuario: UsuarioConPermisos;
    motivos: string[];
  } | null>(null);

  const {
    data: usuarios,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["usuarios"],
    enabled: isAdmin,
    queryFn: cargarUsuarios,
  });

  const guardar = useMutation({
    mutationFn: async (usuarioAEditar: UsuarioConPermisos) => {
      // ✅ VALIDACIÓN: no permitir que el admin se quite permisos críticos a sí mismo
      if (usuarioAEditar.id === miPerfil?.id) {
        if (rol !== "admin" || !permisos["puede_gestionar_usuarios"]) {
          toast.warning("No puedes quitarte el rol de admin ni el permiso de gestionar usuarios");
          return { aborted: true, nombre: usuarioAEditar.nombre_completo };
        }
      }

      const { error: e1 } = await supabase
        .from("perfiles_usuario")
        .update({ rol, activo })
        .eq("id", usuarioAEditar.id);
      if (e1) throw e1;

      const { error: e2 } = await supabase
        .from("permisos_usuario")
        .update(permisos)
        .eq("id_usuario", usuarioAEditar.id);
      if (e2) throw e2;

      return { aborted: false, nombre: usuarioAEditar.nombre_completo };
    },
    onSuccess: (res) => {
      if (!res || res.aborted) return;
      toast.success(`Permisos de ${res.nombre} actualizados correctamente`);
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setEditando(null);
      setConfirmacionCritica(null);
    },
    onError: (error) => {
      toast.error("Error al guardar: " + (error as Error).message);
    },
  });

  const verificarYGuardar = () => {
    if (!editando) return;

    // Validación previa de auto-desprivilegio
    if (editando.id === miPerfil?.id) {
      if (rol !== "admin" || !permisos["puede_gestionar_usuarios"]) {
        toast.warning("No puedes quitarte el rol de admin ni el permiso de gestionar usuarios");
        return;
      }
    }

    const advertencias: string[] = [];
    if (rol !== editando.rol) {
      advertencias.push(`Cambiar el rol de "${editando.rol}" a "${rol}"`);
    }
    if (editando.activo && !activo) {
      advertencias.push("Desactivar la cuenta del usuario (perderá acceso al sistema)");
    }
    if (
      editando.permisos_usuario?.puede_gestionar_usuarios &&
      !permisos["puede_gestionar_usuarios"]
    ) {
      advertencias.push("Quitar el permiso crítico 'Gestionar usuarios'");
    }
    if (editando.permisos_usuario?.puede_crear_productos && !permisos["puede_crear_productos"]) {
      advertencias.push("Quitar el permiso crítico 'Crear productos'");
    }

    if (advertencias.length > 0) {
      setConfirmacionCritica({ usuario: editando, motivos: advertencias });
    } else {
      guardar.mutate(editando);
    }
  };

  const abrirEdicion = (u: UsuarioConPermisos) => {
    setEditando(u);
    setRol(u.rol);
    setActivo(u.activo);
    const p: Record<string, boolean> = {};
    for (const { key } of PERMISOS) p[key] = u.permisos_usuario?.[key] ?? false;
    setPermisos(p);
  };

  return (
    <>
      <PageHeader title="Usuarios" />
      <Card className="p-4">
        {isLoading || cargandoPerfil ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div role="alert" className="space-y-3">
            <p className="text-sm text-destructive">
              No se pudieron cargar los usuarios. Inténtalo de nuevo.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(usuarios ?? []).map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nombre_completo}</TableCell>
                  <TableCell>{u.correo}</TableCell>
                  <TableCell className="capitalize">{u.rol}</TableCell>
                  <TableCell>
                    <Badge variant={u.activo ? "default" : "secondary"}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Editar"
                      onClick={() => abrirEdicion(u)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
          </DialogHeader>
          {editando && (
            <div className="space-y-5">
              <div>
                <p className="font-medium">{editando.nombre_completo}</p>
                <p className="text-sm text-muted-foreground">{editando.correo}</p>
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={rol} onValueChange={setRol}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="vendedor">Vendedor</SelectItem>
                    <SelectItem value="visualizador">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Usuario activo</Label>
                <Switch checked={activo} onCheckedChange={setActivo} />
              </div>
              <div className="space-y-3">
                <Label>Permisos</Label>
                {PERMISOS.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm">{label}</span>
                    <Switch
                      checked={permisos[key] ?? false}
                      onCheckedChange={(v) => setPermisos((p) => ({ ...p, [key]: v }))}
                    />
                  </div>
                ))}
              </div>

              {/* Advertencia visual para el propio usuario */}
              {editando.id === miPerfil?.id && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-xs text-amber-800 font-medium">
                    ⚠️ Estás editando tu propia cuenta. No puedes quitarte el rol de admin ni el
                    permiso de gestionar usuarios.
                  </p>
                </div>
              )}

              <Button className="w-full" onClick={verificarYGuardar} disabled={guardar.isPending}>
                {guardar.isPending ? "Guardando…" : "Guardar cambios"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!confirmacionCritica}
        onOpenChange={(open) => !open && setConfirmacionCritica(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar cambios críticos?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de aplicar cambios importantes en la cuenta de{" "}
              <strong className="text-foreground">
                {confirmacionCritica?.usuario.nombre_completo}
              </strong>
              :
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="my-2 list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
            {confirmacionCritica?.motivos.map((motivo, i) => (
              <li key={i} className="text-foreground/90 font-medium">
                {motivo}
              </li>
            ))}
          </ul>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmacionCritica(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmacionCritica) {
                  guardar.mutate(confirmacionCritica.usuario);
                  setConfirmacionCritica(null);
                }
              }}
            >
              Confirmar y guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
