import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-B4mHfPXK.mjs";
import { O as MailCheck } from "../_libs/lucide-react.mjs";
import { t as Input } from "./input-CiJ2rg3V.mjs";
import { t as Label } from "./label-CfMjnYjw.mjs";
import { t as authErrorMessage } from "./supabase-BJUFiUL8.mjs";
import { n as FormMessage, r as Spinner, t as AuthLayout } from "./AuthLayout-CsjsNpTa.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as useAuth } from "./AuthContext-0DPd6JEP.mjs";
import { t as Route } from "./verify-email-BSejn3A1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/verify-email-DD6zoDLN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function VerifyEmail({ initialEmail }) {
	const { resendVerification } = useAuth();
	const [email, setEmail] = (0, import_react.useState)(initialEmail ?? "");
	const [sending, setSending] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [success, setSuccess] = (0, import_react.useState)(null);
	const resend = async () => {
		setError(null);
		setSuccess(null);
		if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Introduce un email válido.");
		setSending(true);
		try {
			await resendVerification(email);
			setSuccess("Email de verificación reenviado. Revisa tu bandeja de entrada.");
		} catch (e) {
			setError(authErrorMessage(e));
		} finally {
			setSending(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthLayout, {
		title: "Verifica tu email",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-center gap-3 rounded-xl bg-accent p-5 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MailCheck, { className: "h-10 w-10 text-primary" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium text-accent-foreground",
							children: "Por favor verifica tu email antes de continuar"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "Te hemos enviado un enlace de verificación. Ábrelo y después inicia sesión."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormMessage, {
					type: "error",
					text: error
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormMessage, {
					type: "success",
					text: success
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "email",
						children: "Email"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "email",
						type: "email",
						value: email,
						onChange: (e) => setEmail(e.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: resend,
					variant: "outline",
					className: "w-full",
					disabled: sending,
					children: [sending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spinner, {}), " Reenviar email de verificación"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					className: "w-full",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/login",
						children: "Ir al login"
					})
				})
			]
		})
	});
}
function Page() {
	const { email } = Route.useSearch();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VerifyEmail, { initialEmail: email });
}
//#endregion
export { Page as component };
