import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-B4mHfPXK.mjs";
import { t as Input } from "./input-CiJ2rg3V.mjs";
import { t as Label } from "./label-CfMjnYjw.mjs";
import { t as authErrorMessage } from "./supabase-BJUFiUL8.mjs";
import { n as FormMessage, r as Spinner, t as AuthLayout } from "./AuthLayout-CsjsNpTa.mjs";
import { b as Link, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as useForm, t as u } from "../_libs/@hookform/resolvers+[...].mjs";
import { n as objectType, r as stringType } from "../_libs/zod.mjs";
import { n as useAuth } from "./AuthContext-0DPd6JEP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/register-lvKiE_D2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var schema = objectType({
	email: stringType().trim().min(1, "El email es obligatorio").email("Formato de email no válido"),
	password: stringType().min(8, "Mínimo 8 caracteres"),
	confirm: stringType()
}).refine((v) => v.password === v.confirm, {
	message: "Las contraseñas no coinciden",
	path: ["confirm"]
});
function Register() {
	const { signUp } = useAuth();
	const navigate = useNavigate();
	const [error, setError] = (0, import_react.useState)(null);
	const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: u(schema) });
	const onSubmit = async (v) => {
		setError(null);
		try {
			await signUp(v.email, v.password);
			navigate({
				to: "/verify-email",
				search: { email: v.email }
			});
		} catch (e) {
			setError(authErrorMessage(e));
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthLayout, {
		title: "Crear cuenta",
		description: "Regístrate con tu email corporativo",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: handleSubmit(onSubmit),
			className: "space-y-4",
			noValidate: true,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormMessage, {
					type: "error",
					text: error
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
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "password",
							children: "Contraseña"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "password",
							type: "password",
							autoComplete: "new-password",
							...register("password")
						}),
						errors.password && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-destructive",
							children: errors.password.message
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "confirm",
							children: "Repite la contraseña"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "confirm",
							type: "password",
							autoComplete: "new-password",
							...register("confirm")
						}),
						errors.confirm && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-destructive",
							children: errors.confirm.message
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
						isSubmitting ? "Creando cuenta..." : "Crear cuenta"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-center text-sm text-muted-foreground",
					children: [
						"¿Ya tienes cuenta?",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/login",
							className: "font-medium text-primary hover:underline",
							children: "Inicia sesión"
						})
					]
				})
			]
		})
	});
}
var SplitComponent = Register;
//#endregion
export { SplitComponent as component };
