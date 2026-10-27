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
import { n as objectType, r as stringType, t as booleanType } from "../_libs/zod.mjs";
import { n as useAuth } from "./AuthContext-0DPd6JEP.mjs";
import { t as Checkbox } from "./checkbox-Co648b8n.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-BjAWbMfI.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var schema = objectType({
	email: stringType().trim().min(1, "El email es obligatorio").email("Formato de email no válido"),
	password: stringType().min(1, "La contraseña es obligatoria"),
	remember: booleanType()
});
function Login() {
	const { signIn, session } = useAuth();
	const navigate = useNavigate();
	const [error, setError] = (0, import_react.useState)(null);
	const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
		resolver: u(schema),
		defaultValues: {
			email: "",
			password: "",
			remember: true
		}
	});
	(0, import_react.useEffect)(() => {
		if (session) navigate({
			to: "/dashboard",
			replace: true
		});
	}, [session, navigate]);
	const onSubmit = async (v) => {
		setError(null);
		try {
			await signIn(v.email, v.password, v.remember);
			navigate({
				to: "/dashboard",
				replace: true
			});
		} catch (e) {
			if (e.code === "email_not_confirmed" || /not confirmed/i.test(e.message)) {
				navigate({
					to: "/verify-email",
					search: { email: v.email }
				});
				return;
			}
			setError(authErrorMessage(e));
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthLayout, {
		title: "Iniciar sesión",
		description: "Accede con tu email corporativo",
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
							placeholder: "nombre@empresa.com",
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
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "password",
								children: "Contraseña"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/forgot-password",
								className: "text-sm font-medium text-primary hover:underline",
								children: "¿Olvidaste tu contraseña?"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "password",
							type: "password",
							autoComplete: "current-password",
							...register("password")
						}),
						errors.password && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-destructive",
							children: errors.password.message
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
						id: "remember",
						checked: watch("remember"),
						onCheckedChange: (c) => setValue("remember", c === true)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "remember",
						className: "font-normal",
						children: "Recordar sesión"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					type: "submit",
					className: "w-full",
					disabled: isSubmitting,
					children: [
						isSubmitting && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spinner, {}),
						" ",
						isSubmitting ? "Entrando..." : "Entrar"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-center text-sm text-muted-foreground",
					children: [
						"¿No tienes cuenta?",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/register",
							className: "font-medium text-primary hover:underline",
							children: "Regístrate"
						})
					]
				})
			]
		})
	});
}
var SplitComponent = Login;
//#endregion
export { SplitComponent as component };
