import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-B4mHfPXK.mjs";
import { I as FolderTree, S as Pencil, c as Trash2, x as Plus } from "../_libs/lucide-react.mjs";
import { a as DialogFooter, i as DialogDescription, n as Dialog, o as DialogHeader, r as DialogContent, s as DialogTitle, t as Badge } from "./dialog-CkqkUyDr.mjs";
import { t as Input } from "./input-CiJ2rg3V.mjs";
import { t as Label } from "./label-CfMjnYjw.mjs";
import { t as Textarea } from "./textarea-CkXOnrnZ.mjs";
import { a as CardTitle, i as CardHeader, n as CardContent, r as CardDescription, t as Card } from "./card-DTXKoxUD.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./alert-dialog-Dgw77DMg.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-DNuh2ePS.mjs";
import { f as getCategorias, l as desactivarCategoria, r as crearCategoria, t as actualizarCategoria } from "./inventario-Dm5VVMa5.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/categorias-BaovqNYO.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CategoriasPage() {
	const queryClient = useQueryClient();
	const { data: categorias = [], isLoading, isError } = useQuery({
		queryKey: ["categorias"],
		queryFn: getCategorias
	});
	const [modalAbierto, setModalAbierto] = (0, import_react.useState)(false);
	const [categoriaEditando, setCategoriaEditando] = (0, import_react.useState)(null);
	const [formNombre, setFormNombre] = (0, import_react.useState)("");
	const [formDescripcion, setFormDescripcion] = (0, import_react.useState)("");
	const [categoriaADesactivar, setCategoriaADesactivar] = (0, import_react.useState)(null);
	const mutationCrear = useMutation({
		mutationFn: ({ nombre, descripcion }) => crearCategoria(nombre, descripcion),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["categorias"] });
			toast.success("Categoría creada correctamente");
		},
		onError: (e) => toast.error(e.message || "Error al crear la categoría")
	});
	const mutationActualizar = useMutation({
		mutationFn: ({ id, nombre, descripcion }) => actualizarCategoria(id, {
			nombre,
			descripcion
		}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["categorias"] });
			toast.success("Categoría actualizada correctamente");
		},
		onError: (e) => toast.error(e.message || "Error al actualizar la categoría")
	});
	const mutationDesactivar = useMutation({
		mutationFn: (id) => desactivarCategoria(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["categorias"] });
			toast.success("Categoría desactivada correctamente");
		},
		onError: (e) => toast.error(e.message || "Error al desactivar la categoría")
	});
	const abrirModalNueva = () => {
		setCategoriaEditando(null);
		setFormNombre("");
		setFormDescripcion("");
		setModalAbierto(true);
	};
	const abrirModalEditar = (cat) => {
		setCategoriaEditando(cat);
		setFormNombre(cat.nombre);
		setFormDescripcion(cat.descripcion ?? "");
		setModalAbierto(true);
	};
	const handleGuardar = (e) => {
		e.preventDefault();
		if (!formNombre.trim()) {
			toast.error("El nombre es obligatorio");
			return;
		}
		if (categoriaEditando) mutationActualizar.mutate({
			id: categoriaEditando.id,
			nombre: formNombre.trim(),
			descripcion: formDescripcion.trim() || null
		});
		else mutationCrear.mutate({
			nombre: formNombre.trim(),
			descripcion: formDescripcion.trim() || null
		});
		setModalAbierto(false);
		setCategoriaEditando(null);
	};
	const confirmarDesactivar = () => {
		if (!categoriaADesactivar) return;
		mutationDesactivar.mutate(categoriaADesactivar.id);
		setCategoriaADesactivar(null);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase text-gray-400 mb-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "INVENTARIO LM" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-gray-300",
							children: "/"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "CATÁLOGO" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-gray-300",
							children: "/"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-amber-700 font-bold",
							children: "CATEGORÍAS"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight",
					children: "Categorías de Productos"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: abrirModalNueva,
					className: "h-10 bg-[#8c4314] hover:bg-[#78370e] text-white rounded-lg text-xs font-semibold px-4 gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-4 h-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Nueva Categoría" })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
				className: "text-base flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderTree, { className: "w-4 h-4 text-[#D24D09]" }), "Categorías registradas en Supabase"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, {
				className: "text-xs",
				children: "Gestiona las categorías reales de tu base de datos."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-xs",
					children: "NOMBRE"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-xs",
					children: "DESCRIPCIÓN"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-xs text-right",
					children: "ESTADO"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-xs text-right",
					children: "ACCIONES"
				})
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
				colSpan: 4,
				className: "text-center py-8 text-slate-500",
				children: "Cargando categorías desde Supabase..."
			}) }) : isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
				colSpan: 4,
				className: "text-center py-8 text-rose-600",
				children: "Error al cargar las categorías. Revisa la conexión y las políticas RLS."
			}) }) : categorias.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
				colSpan: 4,
				className: "text-center py-8 text-slate-500",
				children: "No hay categorías activas. Crea la primera."
			}) }) : categorias.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					variant: "outline",
					className: "bg-indigo-50 text-indigo-800 border-indigo-200 text-xs font-medium",
					children: cat.nombre
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					className: "text-xs text-slate-600 max-w-[320px] truncate",
					children: cat.descripcion || "—"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					className: "text-right",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "outline",
						className: "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs",
						children: "Activa"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					className: "text-right",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-end gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "sm",
							onClick: () => abrirModalEditar(cat),
							className: "h-7 w-7 p-0 text-slate-500 hover:text-blue-600",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "w-3.5 h-3.5" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "sm",
							onClick: () => setCategoriaADesactivar(cat),
							className: "h-7 w-7 p-0 text-slate-500 hover:text-rose-600",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "w-3.5 h-3.5" })
						})]
					})
				})
			] }, cat.id)) })] }) })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: modalAbierto,
				onOpenChange: (open) => {
					if (!open) {
						setModalAbierto(false);
						setCategoriaEditando(null);
					}
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-md",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
						className: "text-base font-bold text-slate-900",
						children: categoriaEditando ? "Editar Categoría" : "Nueva Categoría"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
						className: "text-xs text-slate-500",
						children: categoriaEditando ? "Modifica los datos de la categoría." : "Crea una nueva categoría en la base de datos."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleGuardar,
						className: "space-y-3.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-xs font-semibold text-slate-700",
									children: "Nombre *"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: formNombre,
									onChange: (e) => setFormNombre(e.target.value),
									placeholder: "Ej: Pintura blanca",
									className: "h-9 text-xs",
									required: true
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-xs font-semibold text-slate-700",
									children: "Descripción"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									value: formDescripcion,
									onChange: (e) => setFormDescripcion(e.target.value),
									placeholder: "Descripción breve (opcional)",
									className: "text-xs",
									rows: 3
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								size: "sm",
								onClick: () => setModalAbierto(false),
								children: "Cancelar"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								size: "sm",
								className: "bg-[#8c4314] hover:bg-[#78370e] text-white text-xs",
								disabled: mutationCrear.isPending || mutationActualizar.isPending,
								children: categoriaEditando ? "Guardar Cambios" : "Crear Categoría"
							})] })
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
				open: Boolean(categoriaADesactivar),
				onOpenChange: (open) => !open && setCategoriaADesactivar(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, {
					className: "text-base",
					children: "¿Desactivar categoría?"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogDescription, {
					className: "text-xs",
					children: [
						"La categoría «",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: categoriaADesactivar?.nombre }),
						"» dejará de aparecer en el catálogo. Los productos asociados conservarán su historial."
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, {
					className: "text-xs",
					children: "Cancelar"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
					onClick: confirmarDesactivar,
					className: "bg-rose-600 hover:bg-rose-700 text-white text-xs",
					children: "Desactivar"
				})] })] })
			})
		]
	});
}
//#endregion
export { CategoriasPage as component };
