/**
 * Supabase client for the user's own Supabase project.
 * Values come strictly from VITE_* env vars.
 *
 * "Recordar sesión": the session is stored in localStorage (survives browser
 * restarts) when remember=true, otherwise in sessionStorage (cleared on close).
 */
import { createClient } from "@supabase/supabase-js";

// Usamos notación de corchetes para cumplir con TypeScript
const SUPABASE_URL = import.meta.env["VITE_SUPABASE_URL"];
const SUPABASE_ANON_KEY = import.meta.env["VITE_SUPABASE_ANON_KEY"];

// Validación temprana
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Faltan las variables de entorno de Supabase. Por favor, verifica tu archivo .env"
  );
}

const REMEMBER_KEY = "inv-remember-session";
const isBrowser = typeof window !== "undefined";

export function setRememberSession(remember: boolean) {
  if (!isBrowser) return;
  localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
}

function activeStore(): Storage | null {
  if (!isBrowser) return null;
  return localStorage.getItem(REMEMBER_KEY) === "0" ? sessionStorage : localStorage;
}

const hybridStorage = {
  getItem: (key: string) => activeStore()?.getItem(key) ?? null,
  setItem: (key: string, value: string) => {
    if (!isBrowser) return;
    const store = activeStore()!;
    const other = store === localStorage ? sessionStorage : localStorage;
    other.removeItem(key);
    store.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (!isBrowser) return;
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: hybridStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export function authErrorMessage(err: unknown): string {
  const msg = (err as { message?: string; code?: string })?.message ?? "";
  const code = (err as { code?: string })?.code ?? "";
  
  if (code === "email_not_confirmed" || /not confirmed/i.test(msg))
    return "Por favor verifica tu email antes de continuar.";
  if (code === "invalid_credentials" || /invalid login credentials/i.test(msg))
    return "Email o contraseña incorrectos. Revisa tus datos e inténtalo de nuevo.";
  if (code === "user_already_exists" || /already registered/i.test(msg))
    return "Ya existe una cuenta con este email.";
  if (code === "weak_password" || /password should/i.test(msg))
    return "La contraseña es demasiado débil (mínimo 8 caracteres).";
  if (code === "same_password") return "La nueva contraseña debe ser distinta de la anterior.";
  if (/rate limit|429/i.test(msg) || code === "over_email_send_rate_limit")
    return "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.";
  if (/fetch/i.test(msg)) return "No se pudo conectar con el servidor. Revisa tu conexión.";
  
  return msg || "Ha ocurrido un error inesperado.";
}