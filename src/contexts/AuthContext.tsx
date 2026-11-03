/** Auth context: exposes the current session/user and auth actions. */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { cerrarSesionLocal } from "@/lib/auth";
import { supabase, setRememberSession } from "@/lib/supabase";

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string, remember: boolean) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listener first, then read the existing session.
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const value: AuthState = {
    session,
    user: session?.user ?? null,
    loading,
    async signIn(email, password, remember) {
      setRememberSession(remember);

      // ── Comprobar bloqueo ANTES de intentar el login ──────────────────────
      const { data: perfil } = await supabase
        .from("perfiles_usuario")
        .select("bloqueado_hasta, intentos_fallidos, activo")
        .eq("correo", email.trim().toLowerCase())
        .maybeSingle();

      if (perfil?.bloqueado_hasta && new Date(perfil.bloqueado_hasta) > new Date()) {
        const hasta = new Date(perfil.bloqueado_hasta).toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        });
        throw Object.assign(
          new Error(
            `Tu cuenta está temporalmente bloqueada hasta las ${hasta}. Contacta al administrador.`,
          ),
          { code: "account_locked" },
        );
      }

      // ── Intentar login ─────────────────────────────────────────────────────
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // Incrementar contador de intentos fallidos (función SECURITY DEFINER)
        await supabase.rpc("registrar_intento_login", { p_email: email.trim().toLowerCase() });
        throw error;
      }

      // ── Login exitoso: resetear contador ───────────────────────────────────
      await supabase.rpc("reset_intentos_login", { p_email: email.trim().toLowerCase() });
    },
    async signUp(email, password) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/login` },
      });
      if (error) throw error;
    },
    async signOut() {
      await cerrarSesionLocal();
    },
    async resendVerification(email) {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/login` },
      });
      if (error) throw error;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
