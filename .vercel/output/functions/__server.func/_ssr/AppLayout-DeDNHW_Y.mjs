import { I as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { r as cn, t as Button } from "./button-B4mHfPXK.mjs";
import { D as MapPin, M as LayoutDashboard, T as Package, at as ArrowRightLeft, k as LogOut, r as Users, tt as Boxes } from "../_libs/lucide-react.mjs";
import { r as supabase } from "./supabase-BJUFiUL8.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { b as Link, p as useLocation } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as useAuth } from "./AuthContext-0DPd6JEP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/AppLayout-DeDNHW_Y.js
var import_jsx_runtime = require_jsx_runtime();
/** Perfil, rol y permisos del usuario actual, leídos de la base de datos. */
/** Cierra la sesión del usuario actual en Supabase. */
async function cerrarSesion() {
	await supabase.auth.signOut();
}
function useMyProfile() {
	const { user } = useAuth();
	const query = useQuery({
		queryKey: ["mi-perfil", user?.id],
		enabled: !!user,
		queryFn: async () => {
			const [{ data: perfil, error: e1 }, { data: permisos, error: e2 }] = await Promise.all([supabase.from("perfiles_usuario").select("*").eq("id", user.id).single(), supabase.from("permisos_usuario").select("*").eq("id_usuario", user.id).maybeSingle()]);
			if (e1) throw e1;
			if (e2) throw e2;
			return {
				perfil,
				permisos: permisos ?? null
			};
		}
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
		can: (p) => isAdmin || permisos?.[p] === true
	};
}
var menuItems = [
	{
		to: "/",
		label: "Dashboard",
		icon: LayoutDashboard
	},
	{
		to: "/productos",
		label: "Productos",
		icon: Package
	},
	{
		to: "/ubicaciones",
		label: "Ubicaciones",
		icon: MapPin
	},
	{
		to: "/movimientos",
		label: "Movimientos",
		icon: ArrowRightLeft
	}
];
function AppLayout({ children }) {
	const location = useLocation();
	const { perfil, isPending, isAdmin, can } = useMyProfile();
	if (isPending && !perfil) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-screen items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" })
	});
	const items = [...menuItems, ...isAdmin || can("puede_gestionar_usuarios") ? [{
		to: "/usuarios",
		label: "Usuarios",
		icon: Users
	}] : []];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "flex w-64 flex-col border-r bg-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 px-5 py-6 border-b border-border",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-primary text-primary-foreground p-2.5 rounded-xl shadow-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Boxes, { className: "h-6 w-6" }), " "]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-bold text-lg leading-tight text-foreground",
							children: "Inventario LM"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] font-mono font-semibold bg-muted text-muted-foreground px-1.5 py-0.5 rounded border w-fit mt-1",
							children: "v1.0.0-beta"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "flex-1 space-y-1 px-3 py-4",
					children: items.map((item) => {
						const isActive = location.pathname === item.to;
						const Icon = item.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: item.to,
							className: cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all", isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-5 w-5" }), item.label]
						}, item.to);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border-t border-border p-4 space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 px-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm",
							children: perfil?.nombre_completo?.charAt(0).toUpperCase() || "U"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col overflow-hidden",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate text-sm font-medium",
								children: perfil?.nombre_completo || "Usuario"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate text-xs text-muted-foreground",
								children: perfil?.correo || "Sin email"
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "ghost",
						className: "w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10",
						onClick: cerrarSesion,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "mr-2 h-4 w-4" }), "Cerrar sesión"]
					})]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "flex-1 overflow-auto bg-muted/30",
			children
		})]
	});
}
function PageHeader({ title, description, action }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-2xl font-bold tracking-tight text-foreground",
			children: title
		}), description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted-foreground mt-1",
			children: description
		})] }), action && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: action })]
	});
}
//#endregion
export { PageHeader as n, useMyProfile as r, AppLayout as t };
