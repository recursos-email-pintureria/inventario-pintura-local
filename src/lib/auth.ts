import { supabase } from "@/lib/supabase";

export async function cerrarSesionLocal(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) {
    console.error(
      "No se pudo cerrar la sesión en el servidor; se conserva el cierre local.",
      error,
    );
  }
}
