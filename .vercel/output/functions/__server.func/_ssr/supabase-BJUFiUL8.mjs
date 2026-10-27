import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/supabase-BJUFiUL8.js
/**
* Supabase client for the user's own Supabase project.
* Values come strictly from VITE_* env vars.
*
* "Recordar sesión": the session is stored in localStorage (survives browser
* restarts) when remember=true, otherwise in sessionStorage (cleared on close).
*/
var SUPABASE_URL = {
	"BASE_URL": "/",
	"DEV": false,
	"MODE": "production",
	"PROD": true,
	"SSR": true,
	"TSS_DEV_SERVER": "false",
	"TSS_DEV_SSR_STYLES_BASEPATH": "/",
	"TSS_DEV_SSR_STYLES_ENABLED": "true",
	"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
	"TSS_INLINE_CSS_ENABLED": "false",
	"TSS_ROUTER_BASEPATH": "",
	"TSS_SERVER_FN_BASE": "/_serverFn/",
	"VITE_SUPABASE_ANON_KEY": "sb_publishable_LGLyVxKmyVjF2j4WtVmyIQ_fMu3DDb4",
	"VITE_SUPABASE_URL": "https://ajrmsviqjmiskbdzlemt.supabase.co"
}["VITE_SUPABASE_URL"];
var SUPABASE_ANON_KEY = {
	"BASE_URL": "/",
	"DEV": false,
	"MODE": "production",
	"PROD": true,
	"SSR": true,
	"TSS_DEV_SERVER": "false",
	"TSS_DEV_SSR_STYLES_BASEPATH": "/",
	"TSS_DEV_SSR_STYLES_ENABLED": "true",
	"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
	"TSS_INLINE_CSS_ENABLED": "false",
	"TSS_ROUTER_BASEPATH": "",
	"TSS_SERVER_FN_BASE": "/_serverFn/",
	"VITE_SUPABASE_ANON_KEY": "sb_publishable_LGLyVxKmyVjF2j4WtVmyIQ_fMu3DDb4",
	"VITE_SUPABASE_URL": "https://ajrmsviqjmiskbdzlemt.supabase.co"
}["VITE_SUPABASE_ANON_KEY"];
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("Faltan las variables de entorno de Supabase. Por favor, verifica tu archivo .env");
var REMEMBER_KEY = "inv-remember-session";
var isBrowser = typeof window !== "undefined";
function setRememberSession(remember) {
	if (!isBrowser) return;
	localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
}
function activeStore() {
	if (!isBrowser) return null;
	return localStorage.getItem(REMEMBER_KEY) === "0" ? sessionStorage : localStorage;
}
var supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: {
	storage: {
		getItem: (key) => activeStore()?.getItem(key) ?? null,
		setItem: (key, value) => {
			if (!isBrowser) return;
			const store = activeStore();
			(store === localStorage ? sessionStorage : localStorage).removeItem(key);
			store.setItem(key, value);
		},
		removeItem: (key) => {
			if (!isBrowser) return;
			localStorage.removeItem(key);
			sessionStorage.removeItem(key);
		}
	},
	persistSession: true,
	autoRefreshToken: true,
	detectSessionInUrl: true
} });
function authErrorMessage(err) {
	const msg = err?.message ?? "";
	const code = err?.code ?? "";
	if (code === "email_not_confirmed" || /not confirmed/i.test(msg)) return "Por favor verifica tu email antes de continuar.";
	if (code === "invalid_credentials" || /invalid login credentials/i.test(msg)) return "Email o contraseña incorrectos. Revisa tus datos e inténtalo de nuevo.";
	if (code === "user_already_exists" || /already registered/i.test(msg)) return "Ya existe una cuenta con este email.";
	if (code === "weak_password" || /password should/i.test(msg)) return "La contraseña es demasiado débil (mínimo 8 caracteres).";
	if (code === "same_password") return "La nueva contraseña debe ser distinta de la anterior.";
	if (/rate limit|429/i.test(msg) || code === "over_email_send_rate_limit") return "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.";
	if (/fetch/i.test(msg)) return "No se pudo conectar con el servidor. Revisa tu conexión.";
	return msg || "Ha ocurrido un error inesperado.";
}
//#endregion
export { setRememberSession as n, supabase as r, authErrorMessage as t };
