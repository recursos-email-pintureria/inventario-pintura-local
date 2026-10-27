import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-B4mHfPXK.mjs";
import { t as Input } from "./input-CiJ2rg3V.mjs";
import { t as Label } from "./label-CfMjnYjw.mjs";
import { r as supabase, t as authErrorMessage } from "./supabase-BJUFiUL8.mjs";
import { n as FormMessage, r as Spinner, t as AuthLayout } from "./AuthLayout-CsjsNpTa.mjs";
import { b as Link, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as useForm, t as u } from "../_libs/@hookform/resolvers+[...].mjs";
import { n as objectType, r as stringType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/reset-password-0oWaTYbG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var schema = objectType({
	password: stringType().min(8, "Mínimo 8 caracteres"),
	confirm: stringType()
}).refine((v) => v.password === v.confirm, {
	message: "Las contraseñas no coinciden",
	path: ["confirm"]
});
function ResetPassword() {
	const navigate = useNavigate();
	const [ready, setReady] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [success, setSuccess] = (0, import_react.useState)(null);
	const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: u(schema) });
	(0, import_react.useEffect)(() => {
		const { data } = supabase.auth.onAuthStateChange((event, session) => {
			if (event === "PASSWORD_RECOVERY" || session) setReady(true);
		});
		supabase.auth.getSession().then(({ data }) => {
			if (data.session) setReady(true);
			else if (!window.location.hash.includes("type=recovery") && !window.location.search.includes("code=")) setError("El enlace no es válido o ha caducado. Solicita uno nuevo.");
		});
		return () => data.subscription.unsubscribe();
	}, []);
	const onSubmit = async ({ password }) => {
		setError(null);
		const { error } = await supabase.auth.updateUser({ password });
		if (error) return setError(authErrorMessage(error));
		setSuccess("Contraseña actualizada. Redirigiendo...");
		setTimeout(() => navigate({
			to: "/dashboard",
			replace: true
		}), 1500);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthLayout, {
		title: "Nueva contraseña",
		description: "Elige una contraseña segura",
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
							htmlFor: "password",
							children: "Nueva contraseña"
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
					disabled: isSubmitting || !ready || !!success,
					children: [
						isSubmitting && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spinner, {}),
						" ",
						isSubmitting ? "Guardando..." : "Guardar contraseña"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-center text-sm",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/forgot-password",
						className: "font-medium text-primary hover:underline",
						children: "Solicitar nuevo enlace"
					})
				})
			]
		})
	});
}
var SplitComponent = ResetPassword;
//#endregion
export { SplitComponent as component };
