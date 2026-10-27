import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-B4mHfPXK.mjs";
import { t as Input } from "./input-CiJ2rg3V.mjs";
import { t as Label } from "./label-CfMjnYjw.mjs";
import { r as supabase, t as authErrorMessage } from "./supabase-BJUFiUL8.mjs";
import { n as FormMessage, r as Spinner, t as AuthLayout } from "./AuthLayout-CsjsNpTa.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as useForm, t as u } from "../_libs/@hookform/resolvers+[...].mjs";
import { n as objectType, r as stringType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/forgot-password-CiutGQBA.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var schema = objectType({ email: stringType().trim().min(1, "El email es obligatorio").email("Formato de email no válido") });
function ForgotPassword() {
	const [error, setError] = (0, import_react.useState)(null);
	const [success, setSuccess] = (0, import_react.useState)(null);
	const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: u(schema) });
	const onSubmit = async ({ email }) => {
		setError(null);
		setSuccess(null);
		const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
		if (error) setError(authErrorMessage(error));
		else setSuccess("Si el email existe, recibirás un enlace para restablecer tu contraseña.");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthLayout, {
		title: "¿Olvidaste tu contraseña?",
		description: "Te enviaremos un enlace de recuperación",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: handleSubmit(onSubmit),
			className: "space-y-4",
			noValidate: true,
			children: [
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
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "email",
							children: "Email corporativo"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "email",
							type: "email",
							autoComplete: "email",
							...register("email")
						}),
						errors.email && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-destructive",
							children: errors.email.message
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					type: "submit",
					className: "w-full",
					disabled: isSubmitting,
					children: [
						isSubmitting && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spinner, {}),
						" ",
						isSubmitting ? "Enviando..." : "Enviar enlace"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-center text-sm",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/login",
						className: "font-medium text-primary hover:underline",
						children: "Volver al login"
					})
				})
			]
		})
	});
}
var SplitComponent = ForgotPassword;
//#endregion
export { SplitComponent as component };
