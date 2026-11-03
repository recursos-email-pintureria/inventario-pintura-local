/** Perfil, rol y permisos del usuario actual, leídos de la base de datos. */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { cerrarSesionLocal } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";

export interface PerfilUsuario {
  id: string;
  nombre_completo: string;
  correo: string;
  rol: "admin" | "vendedor" | "visualizador";
  activo: boolean;
  debe_cambiar_password: boolean;
  intentos_fallidos: number;
  bloqueado_hasta: string | null;
}

export interface PermisosUsuario {
  id_usuario: string;
  puede_crear_productos: boolean;
  puede_editar_productos: boolean;
  puede_eliminar_productos: boolean;
  puede_crear_ubicaciones: boolean;
  puede_editar_ubicaciones: boolean;
  puede_ver_movimientos: boolean;
  puede_exportar_movimientos: boolean;
  puede_gestionar_usuarios: boolean;
  puede_gestionar_secciones: boolean;
}

export type Permiso = keyof Omit<PermisosUsuario, "id_usuario">;

/** Cierra solo la sesión actual, incluso si su JWT ya no es válido. */
export async function cerrarSesion() {
  await cerrarSesionLocal();
}

export function puedeGestionarConfiguracion(
  perfil: Pick<PerfilUsuario, "rol" | "activo"> | null,
  _permisos: Pick<PermisosUsuario, "puede_gestionar_usuarios"> | null,
): boolean {
  return perfil?.activo === true;
}

export function puedeGestionarSecciones(
  perfil: Pick<PerfilUsuario, "rol" | "activo"> | null,
  permisos: Pick<PermisosUsuario, "puede_gestionar_secciones"> | null,
): boolean {
  return (
    perfil?.activo === true &&
    (perfil.rol === "admin" || permisos?.puede_gestionar_secciones === true)
  );
}

/** Admin y vendedor pueden imprimir/exportar inventario; visualizador no. */
export function puedeExportarInventario(
  perfil: Pick<PerfilUsuario, "rol" | "activo"> | null,
): boolean {
  return perfil?.activo === true && (perfil.rol === "admin" || perfil.rol === "vendedor");
}

export function useMyProfile() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["mi-perfil", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: perfil, error: e1 }, { data: permisos, error: e2 }] = await Promise.all([
        supabase.from("perfiles_usuario").select("*").eq("id", user!.id).single(),
        supabase.from("permisos_usuario").select("*").eq("id_usuario", user!.id).maybeSingle(),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return {
        perfil: perfil as PerfilUsuario,
        permisos: (permisos as PermisosUsuario | null) ?? null,
      };
    },
  });

  const perfil = query.data?.perfil ?? null;
  const permisos = query.data?.permisos ?? null;
  const isAdmin = perfil?.rol === "admin" && perfil.activo;

  return {
    ...query,
    perfil,
    permisos,
    isAdmin,
    /** Admin puede todo; el resto según sus permisos individuales. */
    can: (p: Permiso) => isAdmin || permisos?.[p] === true,
  };
}
