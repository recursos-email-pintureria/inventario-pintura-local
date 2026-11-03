import { edgeFunctionErrorMessage, supabase } from "@/lib/supabase";
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

export async function resetearPasswordUsuario(
  usuario: Pick<UsuarioConPermisos, "id" | "correo">,
): Promise<{ password_temporal: string }> {
  const { data, error } = await supabase.functions.invoke<{
    success: boolean;
    password_temporal: string;
  }>("reset-password-admin", {
    body: {
      id_usuario: usuario.id,
      email: usuario.correo,
    },
  });

  if (error) throw new Error(await edgeFunctionErrorMessage(error));
  if (data?.success !== true || typeof data.password_temporal !== "string") {
    throw new Error("El servidor no confirmó el restablecimiento de la contraseña.");
  }
  return { password_temporal: data.password_temporal };
}
