import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { r as cn } from "./button-B4mHfPXK.mjs";
import { A as LoaderCircle, K as CircleCheck, q as CircleAlert, w as PaintRoller } from "../_libs/lucide-react.mjs";
import { a as CardTitle, i as CardHeader, n as CardContent, r as CardDescription, t as Card } from "./card-DTXKoxUD.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/AuthLayout-CsjsNpTa.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var alertVariants = cva("relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7", {
	variants: { variant: {
		default: "bg-background text-foreground",
		destructive: "border-destructive/40 bg-destructive/10 text-destructive [&>svg]:text-destructive",
		success: "border-success/40 bg-success/10 text-success [&>svg]:text-success"
	} },
	defaultVariants: { variant: "default" }
});
var Alert = import_react.forwardRef(({ className, variant, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	role: "alert",
	className: cn(alertVariants({ variant }), className),
	...props
}));
Alert.displayName = "Alert";
var AlertTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h5", {
	ref,
	className: cn("mb-1 font-medium leading-none tracking-tight", className),
	...props
}));
AlertTitle.displayName = "AlertTitle";
var AlertDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("text-sm [&_p]:leading-relaxed", className),
	...props
}));
AlertDescription.displayName = "AlertDescription";
/** Centered card shell shared by all auth pages. */
function AuthLayout({ title, description, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "auth-bg flex min-h-screen items-center justify-center px-4 py-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-6 flex items-center justify-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaintRoller, { className: "h-6 w-6" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-xl font-bold tracking-tight text-foreground",
					children: ["Inventario Pintura ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-primary",
						children: "- LM"
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "rounded-2xl border-border/60 shadow-soft",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
					className: "space-y-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
						className: "text-2xl",
						children: title
					}), description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: description })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children })]
			})]
		})
	});
}
function FormMessage({ type, text }) {
	if (!text) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Alert, {
		variant: type === "error" ? "destructive" : "success",
		className: "animate-in fade-in slide-in-from-top-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(type === "error" ? CircleAlert : CircleCheck, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDescription, { children: text })]
	});
}
function Spinner() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" });
}
//#endregion
export { FormMessage as n, Spinner as r, AuthLayout as t };
