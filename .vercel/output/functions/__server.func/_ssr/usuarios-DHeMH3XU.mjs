import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { r as cn, t as Button } from "./button-B4mHfPXK.mjs";
import { S as Pencil } from "../_libs/lucide-react.mjs";
import { n as Dialog, o as DialogHeader, r as DialogContent, s as DialogTitle, t as Badge } from "./dialog-CkqkUyDr.mjs";
import { t as Label } from "./label-CfMjnYjw.mjs";
import { t as Card } from "./card-DTXKoxUD.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./alert-dialog-Dgw77DMg.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-DNuh2ePS.mjs";
import { r as supabase } from "./supabase-BJUFiUL8.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Switch } from "./switch-D8bsHdRc.mjs";
import { x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BIGqsRzk.mjs";
import { n as PageHeader, r as useMyProfile } from "./AppLayout-DeDNHW_Y.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/usuarios-DHeMH3XU.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Skeleton({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("animate-pulse rounded-md bg-primary/10", className),
		...props
	});
}
/** Both tables reference auth.users, not each other: fetch separately under RLS. */
async function cargarUsuarios() {
	const [perfiles, permisos] = await Promise.all([supabase.from("perfiles_usuario").select("*").order("nombre_completo"), supabase.from("permisos_usuario").select("*")]);
	if (perfiles.error) throw perfiles.error;
	if (permisos.error) throw permisos.error;
	const permisosPorUsuario = new Map((permisos.data ?? []).map((p) => [p.id_usuario, p]));
	return (perfiles.data ?? []).map((perfil) => ({
		...perfil,
		permisos_usuario: permisosPorUsuario.get(perfil.id) ?? null
	}));
}
var PERMISOS = [
	{
		key: "puede_crear_productos",
		label: "Crear productos"
	},
	{
		key: "puede_editar_productos",
		label: "Editar productos"
	},
	{
		key: "puede_eliminar_productos",
		label: "Eliminar productos"
	},
	{
		key: "puede_crear_ubicaciones",
		label: "Crear ubicaciones"
	},
	{
		key: "puede_editar_ubicaciones",
		label: "Editar ubicaciones"
	},
	{
		key: "puede_ver_movimientos",
		label: "Ver movimientos"
	},
	{
		key: "puede_exportar_movimientos",
		label: "Exportar movimientos"
	},
	{
		key: "puede_gestionar_usuarios",
		label: "Gestionar usuarios"
	}
];
function Usuarios() {
	const { isAdmin, isLoading: cargandoPerfil, perfil: miPerfil } = useMyProfile();
	useNavigate();
	const queryClient = useQueryClient();
	const [editando, setEditando] = (0, import_react.useState)(null);
	const [rol, setRol] = (0, import_react.useState)("vendedor");
	const [activo, setActivo] = (0, import_react.useState)(true);
	const [permisos, setPermisos] = (0, import_react.useState)({});
	const [confirmacionCritica, setConfirmacionCritica] = (0, import_react.useState)(null);
	const { data: usuarios, isLoading, isError, refetch } = useQuery({
		queryKey: ["usuarios"],
		enabled: isAdmin,
		queryFn: cargarUsuarios
	});
	const guardar = useMutation({
		mutationFn: async (usuarioAEditar) => {
			if (usuarioAEditar.id === miPerfil?.id) {
				if (rol !== "admin" || !permisos["puede_gestionar_usuarios"]) {
					toast.warning("No puedes quitarte el rol de admin ni el permiso de gestionar usuarios");
					return {
						aborted: true,
						nombre: usuarioAEditar.nombre_completo
					};
				}
			}
			const { error: e1 } = await supabase.from("perfiles_usuario").update({
				rol,
				activo
			}).eq("id", usuarioAEditar.id);
			if (e1) throw e1;
			const { error: e2 } = await supabase.from("permisos_usuario").update(permisos).eq("id_usuario", usuarioAEditar.id);
			if (e2) throw e2;
			return {
				aborted: false,
				nombre: usuarioAEditar.nombre_completo
			};
		},
		onSuccess: (res) => {
			if (!res || res.aborted) return;
			toast.success(`Permisos de ${res.nombre} actualizados correctamente`);
			queryClient.invalidateQueries({ queryKey: ["usuarios"] });
			setEditando(null);
			setConfirmacionCritica(null);
		},
		onError: (error) => {
			toast.error("Error al guardar: " + error.message);
		}
	});
	const verificarYGuardar = () => {
		if (!editando) return;
		if (editando.id === miPerfil?.id) {
			if (rol !== "admin" || !permisos["puede_gestionar_usuarios"]) {
				toast.warning("No puedes quitarte el rol de admin ni el permiso de gestionar usuarios");
				return;
			}
		}
		const advertencias = [];
		if (rol !== editando.rol) advertencias.push(`Cambiar el rol de "${editando.rol}" a "${rol}"`);
		if (editando.activo && !activo) advertencias.push("Desactivar la cuenta del usuario (perderá acceso al sistema)");
		if (editando.permisos_usuario?.puede_gestionar_usuarios && !permisos["puede_gestionar_usuarios"]) advertencias.push("Quitar el permiso crítico 'Gestionar usuarios'");
		if (editando.permisos_usuario?.puede_crear_productos && !permisos["puede_crear_productos"]) advertencias.push("Quitar el permiso crítico 'Crear productos'");
		if (advertencias.length > 0) setConfirmacionCritica({
			usuario: editando,
			motivos: advertencias
		});
		else guardar.mutate(editando);
	};
	const abrirEdicion = (u) => {
		setEditando(u);
		setRol(u.rol);
		setActivo(u.activo);
		const p = {};
		for (const { key } of PERMISOS) p[key] = u.permisos_usuario?.[key] ?? false;
		setPermisos(p);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, { title: "Usuarios" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
			className: "p-4",
			children: isLoading || cargandoPerfil ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-3",
				children: [...Array(3)].map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-10 w-full" }, i))
			}) : isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				role: "alert",
				className: "space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-destructive",
					children: "No se pudieron cargar los usuarios. Inténtalo de nuevo."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: () => refetch(),
					children: "Reintentar"
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Nombre" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Email" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Rol" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Estado" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-right",
					children: "Acciones"
				})
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: (usuarios ?? []).map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					className: "font-medium",
					children: u.nombre_completo
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: u.correo }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					className: "capitalize",
					children: u.rol
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					variant: u.activo ? "default" : "secondary",
					children: u.activo ? "Activo" : "Inactivo"
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					className: "text-right",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						"aria-label": "Editar",
						onClick: () => abrirEdicion(u),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" })
					})
				})
			] }, u.id)) })] })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open: !!editando,
			onOpenChange: (o) => !o && setEditando(null),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
				className: "max-h-[90vh] overflow-y-auto",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Editar usuario" }) }), editando && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: editando.nombre_completo
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: editando.correo
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Rol" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: rol,
								onValueChange: setRol,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "admin",
										children: "Admin"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "vendedor",
										children: "Vendedor"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "visualizador",
										children: "Visualizador"
									})
								] })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Usuario activo" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
								checked: activo,
								onCheckedChange: setActivo
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Permisos" }), PERMISOS.map(({ key, label }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm",
									children: label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
									checked: permisos[key] ?? false,
									onCheckedChange: (v) => setPermisos((p) => ({
										...p,
										[key]: v
									}))
								})]
							}, key))]
						}),
						editando.id === miPerfil?.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "p-3 bg-amber-50 border border-amber-200 rounded-md",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-amber-800 font-medium",
								children: "⚠️ Estás editando tu propia cuenta. No puedes quitarte el rol de admin ni el permiso de gestionar usuarios."
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "w-full",
							onClick: verificarYGuardar,
							disabled: guardar.isPending,
							children: guardar.isPending ? "Guardando…" : "Guardar cambios"
						})
					]
				})]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
			open: !!confirmacionCritica,
			onOpenChange: (open) => !open && setConfirmacionCritica(null),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, { children: "¿Confirmar cambios críticos?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogDescription, { children: [
					"Estás a punto de aplicar cambios importantes en la cuenta de",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
						className: "text-foreground",
						children: confirmacionCritica?.usuario.nombre_completo
					}),
					":"
				] })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "my-2 list-disc list-inside space-y-1.5 text-sm text-muted-foreground",
					children: confirmacionCritica?.motivos.map((motivo, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "text-foreground/90 font-medium",
						children: motivo
					}, i))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, {
					onClick: () => setConfirmacionCritica(null),
					children: "Cancelar"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
					onClick: () => {
						if (confirmacionCritica) {
							guardar.mutate(confirmacionCritica.usuario);
							setConfirmacionCritica(null);
						}
					},
					children: "Confirmar y guardar"
				})] })
			] })
		})
	] });
}
//#endregion
export { Usuarios as component };
