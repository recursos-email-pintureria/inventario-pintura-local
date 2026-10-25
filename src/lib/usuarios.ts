import { supabase } from "@/lib/supabase";
import type { PerfilUsuario, PermisosUsuario } from "@/hooks/usePermissions";

export type UsuarioConPermisos = PerfilUsuario & { permisos_usuario: PermisosUsuario | null };

/** Both tables reference auth.users, not each other: fetch separately under RLS. */
export async function cargarUsuarios(): Promise<UsuarioConPermisos[]> {
  const [perfiles, permisos] = await Promise.all([
    supabase.from("perfiles_usuario").select("*").order("nombre_completo"),
    supabase.from("permisos_usuario").select("*"),
  ]);
  if (perfiles.error) throw perfiles.error;
  if (permisos.error) throw permisos.error;

  const permisosPorUsuario = new Map(
    ((permisos.data ?? []) as PermisosUsuario[]).map((p) => [p.id_usuario, p]),
  );
  return ((perfiles.data ?? []) as PerfilUsuario[]).map((perfil) => ({
    ...perfil,
    permisos_usuario: permisosPorUsuario.get(perfil.id) ?? null,
  }));
}
