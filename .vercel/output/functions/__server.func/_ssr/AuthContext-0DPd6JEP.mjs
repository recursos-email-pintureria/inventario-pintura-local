import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as setRememberSession, r as supabase } from "./supabase-BJUFiUL8.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/AuthContext-0DPd6JEP.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Auth context: exposes the current session/user and auth actions. */
var AuthContext = (0, import_react.createContext)(null);
function AuthProvider({ children }) {
	const [session, setSession] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
		supabase.auth.getSession().then(({ data }) => {
			setSession(data.session);
			setLoading(false);
		});
		return () => data.subscription.unsubscribe();
	}, []);
	const value = {
		session,
		user: session?.user ?? null,
		loading,
		async signIn(email, password, remember) {
			setRememberSession(remember);
			const { error } = await supabase.auth.signInWithPassword({
				email,
				password
			});
			if (error) throw error;
		},
		async signUp(email, password) {
			const { error } = await supabase.auth.signUp({
				email,
				password,
				options: { emailRedirectTo: `${window.location.origin}/login` }
			});
			if (error) throw error;
		},
		async signOut() {
			await supabase.auth.signOut();
		},
		async resendVerification(email) {
			const { error } = await supabase.auth.resend({
				type: "signup",
				email,
				options: { emailRedirectTo: `${window.location.origin}/login` }
			});
			if (error) throw error;
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthContext.Provider, {
		value,
		children
	});
}
function useAuth() {
	const ctx = (0, import_react.useContext)(AuthContext);
	if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
	return ctx;
}
//#endregion
export { useAuth as n, AuthProvider as t };
