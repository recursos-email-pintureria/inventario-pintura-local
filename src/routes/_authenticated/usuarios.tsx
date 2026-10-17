import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/AppLayout";
import { pageHead } from "@/lib/meta";
import { supabase } from "@/lib/supabase";
import { useMyProfile, type PerfilUsuario, type PermisosUsuario } from "@/hooks/usePermissions";

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

type UsuarioConPermisos = PerfilUsuario & { permisos_usuario: PermisosUsuario | null };

function Usuarios() {
  const { isAdmin, isLoading: cargandoPerfil, perfil: miPerfil } = useMyProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState<UsuarioConPermisos | null>(null);
  const [rol, setRol] = useState<string>("vendedor");
  const [activo, setActivo] = useState(true);
  const [permisos, setPermisos] = useState<Record<string, boolean>>({});

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ["usuarios"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("perfiles_usuario")
        .select("*, permisos_usuario(*)")
        .order("nombre_completo");
      if (error) throw error;
      return data as UsuarioConPermisos[];
    },
  });

  const guardar = useMutation({
    mutationFn: async () => {
      if (!editando) return;
      const { error: e1 } = await supabase
        .from("perfiles_usuario")
        .update({ rol, activo })
        .eq("id", editando.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from("permisos_usuario")
        .update(permisos)
        .eq("id_usuario", editando.id);
      if (e2) throw e2;
    },
    onSuccess: () => {
      toast.success("Usuario actualizado");
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      queryClient.invalidateQueries({ queryKey: ["mi-perfil"] });
      setEditando(null);
    },
    onError: (e) => toast.error("No se pudo guardar: " + (e as Error).message),
  });

  if (!cargandoPerfil && !isAdmin) {
    navigate({ to: "/dashboard", replace: true });
    return null;
  }

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
          <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead><TableHead>Email</TableHead><TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(usuarios ?? []).map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nombre_completo}</TableCell>
                  <TableCell>{u.correo}</TableCell>
                  <TableCell className="capitalize">{u.rol}</TableCell>
                  <TableCell><Badge variant={u.activo ? "default" : "secondary"}>{u.activo ? "Activo" : "Inactivo"}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => abrirEdicion(u)}>
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
          <DialogHeader><DialogTitle>Editar usuario</DialogTitle></DialogHeader>
          {editando && (
            <div className="space-y-5">
              <div>
                <p className="font-medium">{editando.nombre_completo}</p>
                <p className="text-sm text-muted-foreground">{editando.correo}</p>
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={rol} onValueChange={setRol}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
              {editando.id === miPerfil?.id && (
                <p className="text-xs text-muted-foreground">
                  Estás editando tu propia cuenta; ten cuidado de no quitarte el rol de admin.
                </p>
              )}
              <Button className="w-full" onClick={() => guardar.mutate()} disabled={guardar.isPending}>
                {guardar.isPending ? "Guardando…" : "Guardar cambios"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
