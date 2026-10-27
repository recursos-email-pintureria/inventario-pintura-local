import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { r as supabase } from "./supabase-BJUFiUL8.mjs";
import { r as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { K as redirect, S as useRouter, _ as lazyRouteComponent, b as Link, d as Scripts, f as HeadContent, g as Outlet, h as createRouter, v as createFileRoute, y as createRootRouteWithContext } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as AuthProvider } from "./AuthContext-0DPd6JEP.mjs";
import { t as Route$12 } from "./verify-email-BSejn3A1.mjs";
import { n as Route$13 } from "./ubicaciones-jP8x7QJc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router--G5QUq1K.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-CRPhjsQG.css";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
	const stack = error instanceof Error ? error.stack : void 0;
	window.__lovableReportRuntimeError?.({
		message: describeThrown(error),
		...stack !== void 0 && { stack },
		filename: window.location.pathname
	});
}
var MAX_SERIALIZED_LENGTH = 2e3;
function describeThrown(error) {
	if (error instanceof Response) return `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`;
	if (error instanceof Error) return error.message;
	if (typeof error === "string") return error;
	const { message } = error ?? {};
	if (typeof message === "string" && message.length > 0) return message;
	try {
		return JSON.stringify(error)?.slice(0, MAX_SERIALIZED_LENGTH) ?? String(error);
	} catch {
		return String(error);
	}
}
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$11 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Inventario Pintura - LM" },
			{
				name: "description",
				content: "Control de existencias y ubicaciones de la sección de pintura."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
			},
			{
				rel: "icon",
				href: "/favicon.ico",
				type: "image/x-icon"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "es",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$11.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AuthProvider, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {})] })
	});
}
var Route$10 = createFileRoute("/")({
	head: () => ({ meta: [
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		},
		{ title: "Inventario Pintura - LM" },
		{
			name: "description",
			content: "Control de existencias y ubicaciones de la sección de pintura."
		},
		{
			property: "og:title",
			content: "Inventario Pintura - LM"
		},
		{
			property: "og:description",
			content: "Control de existencias y ubicaciones de la sección de pintura."
		}
	] }),
	beforeLoad: () => {
		throw redirect({ to: "/login" });
	}
});
/** Protected layout: everything below requires a valid session. */
var $$splitComponentImporter$9 = () => import("./route-DY9Wwqo7.mjs");
var Route$9 = createFileRoute("/_authenticated")({
	ssr: false,
	beforeLoad: async () => {
		const { data } = await supabase.auth.getUser();
		if (!data.user) throw redirect({
			to: "/login",
			replace: true
		});
	},
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("./forgot-password-CiutGQBA.mjs");
var Route$8 = createFileRoute("/forgot-password")({
	head: () => ({ meta: [
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		},
		{ title: "Recuperar contraseña · Inventario Pintura - LM" },
		{
			name: "description",
			content: "Recibe un enlace para restablecer tu contraseña."
		},
		{
			property: "og:title",
			content: "Recuperar contraseña · Inventario Pintura - LM"
		},
		{
			property: "og:description",
			content: "Recibe un enlace para restablecer tu contraseña."
		}
	] }),
	ssr: false,
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("./login-BjAWbMfI.mjs");
var Route$7 = createFileRoute("/login")({
	head: () => ({ meta: [
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		},
		{ title: "Iniciar sesión · Inventario Pintura - LM" },
		{
			name: "description",
			content: "Accede al inventario de la sección de pintura."
		},
		{
			property: "og:title",
			content: "Iniciar sesión · Inventario Pintura - LM"
		},
		{
			property: "og:description",
			content: "Accede al inventario de la sección de pintura."
		}
	] }),
	ssr: false,
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./register-lvKiE_D2.mjs");
var Route$6 = createFileRoute("/register")({
	head: () => ({ meta: [
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		},
		{ title: "Crear cuenta · Inventario Pintura - LM" },
		{
			name: "description",
			content: "Regístrate en el inventario de pintura."
		},
		{
			property: "og:title",
			content: "Crear cuenta · Inventario Pintura - LM"
		},
		{
			property: "og:description",
			content: "Regístrate en el inventario de pintura."
		}
	] }),
	ssr: false,
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./reset-password-0oWaTYbG.mjs");
var Route$5 = createFileRoute("/reset-password")({
	head: () => ({ meta: [
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		},
		{ title: "Nueva contraseña · Inventario Pintura - LM" },
		{
			name: "description",
			content: "Establece una nueva contraseña."
		},
		{
			property: "og:title",
			content: "Nueva contraseña · Inventario Pintura - LM"
		},
		{
			property: "og:description",
			content: "Establece una nueva contraseña."
		}
	] }),
	ssr: false,
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./categorias-BaovqNYO.mjs");
var Route$4 = createFileRoute("/_authenticated/categorias")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./configuracion-CeMOMntM.mjs");
var Route$3 = createFileRoute("/_authenticated/configuracion")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./movimientos-DJxrqgl4.mjs");
var Route$2 = createFileRoute("/_authenticated/movimientos")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./productos-vzunxN2I.mjs");
var Route$1 = createFileRoute("/_authenticated/productos")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
function pageHead(title, description) {
	const t = `${title} · Inventario Pintura - LM`;
	return { meta: [
		{ title: t },
		{
			name: "description",
			content: description
		},
		{
			property: "og:title",
			content: t
		},
		{
			property: "og:description",
			content: description
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] };
}
var $$splitComponentImporter = () => import("./usuarios-DHeMH3XU.mjs");
var Route = createFileRoute("/_authenticated/usuarios")({
	head: () => pageHead("Usuarios", "Gestión de usuarios y roles."),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var IndexRoute = Route$10.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$11
});
var AuthenticatedRouteRoute = Route$9.update({
	id: "/_authenticated",
	getParentRoute: () => Route$11
});
var ForgotPasswordRoute = Route$8.update({
	id: "/forgot-password",
	path: "/forgot-password",
	getParentRoute: () => Route$11
});
var LoginRoute = Route$7.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$11
});
var RegisterRoute = Route$6.update({
	id: "/register",
	path: "/register",
	getParentRoute: () => Route$11
});
var ResetPasswordRoute = Route$5.update({
	id: "/reset-password",
	path: "/reset-password",
	getParentRoute: () => Route$11
});
var VerifyEmailRoute = Route$12.update({
	id: "/verify-email",
	path: "/verify-email",
	getParentRoute: () => Route$11
});
var AuthenticatedRouteRouteChildren = {
	AuthenticatedCategoriasRoute: Route$4.update({
		id: "/categorias",
		path: "/categorias",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedConfiguracionRoute: Route$3.update({
		id: "/configuracion",
		path: "/configuracion",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedMovimientosRoute: Route$2.update({
		id: "/movimientos",
		path: "/movimientos",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedProductosRoute: Route$1.update({
		id: "/productos",
		path: "/productos",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedUbicacionesRoute: Route$13.update({
		id: "/ubicaciones",
		path: "/ubicaciones",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedUsuariosRoute: Route.update({
		id: "/usuarios",
		path: "/usuarios",
		getParentRoute: () => AuthenticatedRouteRoute
	})
};
var rootRouteChildren = {
	IndexRoute,
	AuthenticatedRouteRoute: AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren),
	ForgotPasswordRoute,
	LoginRoute,
	RegisterRoute,
	ResetPasswordRoute,
	VerifyEmailRoute
};
var routeTree = Route$11._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	const queryClient = new QueryClient();
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
