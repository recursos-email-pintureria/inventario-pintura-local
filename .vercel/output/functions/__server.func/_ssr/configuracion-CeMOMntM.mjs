import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { r as cn, t as Button } from "./button-B4mHfPXK.mjs";
import { H as Download, K as CircleCheck, P as Globe, S as Pencil, T as Package, U as Database, _ as RotateCcw, a as Upload, c as Trash2, g as Save, l as Store, o as TriangleAlert, r as Users, x as Plus } from "../_libs/lucide-react.mjs";
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
import { t as Switch } from "./switch-D8bsHdRc.mjs";
import { i as TabsTrigger$1, n as TabsContent$1, r as TabsList$1, t as Tabs$1 } from "../_libs/radix-ui__react-tabs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/configuracion-CeMOMntM.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Tabs = Tabs$1;
var TabsList = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsList$1, {
	ref,
	className: cn("inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500", className),
	...props
}));
TabsList.displayName = TabsList$1.displayName;
var TabsTrigger = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger$1, {
	ref,
	className: cn("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-[#D24D09] data-[state=active]:shadow-xs", className),
	...props
}));
TabsTrigger.displayName = TabsTrigger$1.displayName;
var TabsContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent$1, {
	ref,
	className: cn("mt-4 ring-offset-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2", className),
	...props
}));
TabsContent.displayName = TabsContent$1.displayName;
var USUARIOS_INICIALES = [
	{
		id: "u-1",
		nombre: "Javier Martínez",
		email: "javier@inventariolm.com",
		rol: "Administrador",
		activo: true
	},
	{
		id: "u-2",
		nombre: "Elena Rodríguez",
		email: "elena@inventariolm.com",
		rol: "Operadora de Almacén",
		activo: true
	},
	{
		id: "u-3",
		nombre: "Carlos Domínguez",
		email: "carlos@inventariolm.com",
		rol: "Vendedor",
		activo: true
	},
	{
		id: "u-4",
		nombre: "Roberto Sánchez",
		email: "roberto@inventariolm.com",
		rol: "Mozo de Almacén",
		activo: true
	},
	{
		id: "u-5",
		nombre: "Ana López",
		email: "ana@inventariolm.com",
		rol: "Vendedor",
		activo: true
	},
	{
		id: "u-6",
		nombre: "Miguel Torres",
		email: "miguel@inventariolm.com",
		rol: "Operador de Almacén",
		activo: false
	}
];
function ConfiguracionPage() {
	const queryClient = useQueryClient();
	const [nombreTienda, setNombreTienda] = (0, import_react.useState)("Pinturas LM - Sucursal Norte");
	const [direccion, setDireccion] = (0, import_react.useState)("Polígono Industrial Las Palmeras, Nave 14B");
	const [telefono, setTelefono] = (0, import_react.useState)("+34 912 345 678");
	const [email, setEmail] = (0, import_react.useState)("admin@inventariolm.com");
	const [zonaHoraria, setZonaHoraria] = (0, import_react.useState)("Europe/Madrid");
	const [moneda, setMoneda] = (0, import_react.useState)("EUR");
	const [idioma, setIdioma] = (0, import_react.useState)("es");
	const [alertaStockBajo, setAlertaStockBajo] = (0, import_react.useState)(true);
	const [umbralStockBajo, setUmbralStockBajo] = (0, import_react.useState)(20);
	const [umbralStockCritico, setUmbralStockCritico] = (0, import_react.useState)(10);
	const [emailAdmin, setEmailAdmin] = (0, import_react.useState)(true);
	const [emailOperador, setEmailOperador] = (0, import_react.useState)(false);
	const [stockMinimoDefecto, setStockMinimoDefecto] = (0, import_react.useState)(10);
	const [unidadMedida, setUnidadMedida] = (0, import_react.useState)("gal");
	const [permitirStockNegativo, setPermitirStockNegativo] = (0, import_react.useState)(false);
	const [bloquearVentasStockBajo, setBloquearVentasStockBajo] = (0, import_react.useState)(false);
	const [iva, setIva] = (0, import_react.useState)(21);
	const { data: categorias = [], isLoading: cargandoCategorias } = useQuery({
		queryKey: ["categorias"],
		queryFn: getCategorias
	});
	const [modalCategoriaAbierto, setModalCategoriaAbierto] = (0, import_react.useState)(false);
	const [categoriaEditando, setCategoriaEditando] = (0, import_react.useState)(null);
	const [formCatNombre, setFormCatNombre] = (0, import_react.useState)("");
	const [formCatDescripcion, setFormCatDescripcion] = (0, import_react.useState)("");
	const [usuarios] = (0, import_react.useState)(USUARIOS_INICIALES);
	const [ultimoBackup] = (0, import_react.useState)("26/10/2026, 03:00");
	const [categoriaAEliminar, setCategoriaAEliminar] = (0, import_react.useState)(null);
	const [dialogEliminarAbierto, setDialogEliminarAbierto] = (0, import_react.useState)(false);
	const mutationCrear = useMutation({
		mutationFn: ({ nombre, descripcion }) => crearCategoria(nombre, descripcion),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["categorias"] });
			toast.success("Categoría creada correctamente");
		},
		onError: (error) => {
			toast.error(error.message || "Error al crear la categoría");
		}
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
		onError: (error) => {
			toast.error(error.message || "Error al actualizar la categoría");
		}
	});
	const mutationEliminar = useMutation({
		mutationFn: (id) => desactivarCategoria(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["categorias"] });
			toast.success("Categoría eliminada correctamente");
		},
		onError: (error) => {
			toast.error(error.message || "Error al eliminar la categoría");
		}
	});
	const handleGuardarCambios = () => {
		toast.success("Configuración guardada correctamente (simulado)");
	};
	const handleRestaurarValores = () => {
		setNombreTienda("Pinturas LM - Sucursal Norte");
		setDireccion("Polígono Industrial Las Palmeras, Nave 14B");
		setTelefono("+34 912 345 678");
		setEmail("admin@inventariolm.com");
		setUmbralStockBajo(20);
		setUmbralStockCritico(10);
		setStockMinimoDefecto(10);
		setIva(21);
		toast.info("Valores restaurados a los predeterminados");
	};
	const handleCrearCategoria = (e) => {
		e.preventDefault();
		if (!formCatNombre.trim()) {
			toast.error("El nombre es obligatorio");
			return;
		}
		if (categoriaEditando) mutationActualizar.mutate({
			id: categoriaEditando.id,
			nombre: formCatNombre,
			descripcion: formCatDescripcion
		});
		else mutationCrear.mutate({
			nombre: formCatNombre,
			descripcion: formCatDescripcion
		});
		setModalCategoriaAbierto(false);
		setCategoriaEditando(null);
		setFormCatNombre("");
		setFormCatDescripcion("");
	};
	const handleEliminarCategoria = () => {
		if (!categoriaAEliminar) return;
		mutationEliminar.mutate(categoriaAEliminar.id);
		setDialogEliminarAbierto(false);
		setCategoriaAEliminar(null);
	};
	const handleExportarBackup = () => {
		const datos = {
			tienda: {
				nombre: nombreTienda,
				direccion,
				telefono,
				email
			},
			categorias,
			usuarios,
			exportado: (/* @__PURE__ */ new Date()).toISOString()
		};
		const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `backup_inventario_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
		link.click();
		toast.success("Backup exportado correctamente");
	};
	const abrirModalEditarCategoria = (cat) => {
		setCategoriaEditando(cat);
		setFormCatNombre(cat.nombre);
		setFormCatDescripcion(cat.descripcion || "");
		setModalCategoriaAbierto(true);
	};
	const abrirModalNuevaCategoria = () => {
		setCategoriaEditando(null);
		setFormCatNombre("");
		setFormCatDescripcion("");
		setModalCategoriaAbierto(true);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-slate-50/60 pb-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-b bg-white",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "max-w-7xl mx-auto px-4 sm:px-6 py-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col md:flex-row md:items-center md:justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider mb-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "INVENTARIO LM" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "/" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "ADMINISTRACIÓN" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "/" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[#D24D09] font-semibold",
										children: "CONFIGURACIÓN"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "text-2xl sm:text-3xl font-bold tracking-tight text-slate-900",
									children: "Configuración del Sistema"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
									variant: "outline",
									className: "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-2 h-2 rounded-full bg-emerald-600 animate-pulse" }), "Sincronizado"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-slate-500 mt-1",
								children: "Ajustes globales de la sucursal, políticas de stock y copias de seguridad."
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2.5 self-start md:self-auto",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								size: "sm",
								onClick: handleRestaurarValores,
								className: "text-xs h-9 px-3.5 border-slate-200 text-slate-700 hover:bg-slate-100 gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "w-4 h-4 text-slate-500" }), "Restaurar Valores"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								onClick: handleGuardarCambios,
								className: "bg-[#D24D09] hover:bg-[#b83f05] text-white text-xs font-semibold h-9 px-4 gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "w-4 h-4" }), "Guardar Cambios"]
							})]
						})]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "max-w-7xl mx-auto px-4 sm:px-6 pt-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
					defaultValue: "general",
					className: "space-y-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
							className: "w-full justify-start h-auto bg-white border border-slate-200 p-1 rounded-lg overflow-x-auto flex-wrap gap-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
									value: "general",
									className: "gap-1.5 text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Store, { className: "w-3.5 h-3.5" }), " General"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
									value: "categorias",
									className: "gap-1.5 text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "w-3.5 h-3.5" }), " Categorías"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
									value: "stock",
									className: "gap-1.5 text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "w-3.5 h-3.5" }), " Stock y Alertas"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
									value: "usuarios",
									className: "gap-1.5 text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "w-3.5 h-3.5" }), " Usuarios"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
									value: "backup",
									className: "gap-1.5 text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Database, { className: "w-3.5 h-3.5" }), " Backup"]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
							value: "general",
							className: "space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
								className: "text-base flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Store, { className: "w-4 h-4 text-[#D24D09]" }), "Información de la Tienda"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, {
								className: "text-xs",
								children: "Datos fiscales y de contacto para reportes y albaranes."
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
								className: "space-y-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-1 md:grid-cols-2 gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-xs font-semibold text-slate-700",
												children: "Nombre Comercial"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												value: nombreTienda,
												onChange: (e) => setNombreTienda(e.target.value),
												className: "h-9 text-xs"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-xs font-semibold text-slate-700",
												children: "Teléfono"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												value: telefono,
												onChange: (e) => setTelefono(e.target.value),
												className: "h-9 text-xs"
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-xs font-semibold text-slate-700",
											children: "Dirección Física"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: direccion,
											onChange: (e) => setDireccion(e.target.value),
											className: "h-9 text-xs"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-1 md:grid-cols-3 gap-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													className: "text-xs font-semibold text-slate-700",
													children: "Email"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													value: email,
													onChange: (e) => setEmail(e.target.value),
													type: "email",
													className: "h-9 text-xs"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													className: "text-xs font-semibold text-slate-700",
													children: "Zona Horaria"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
													value: zonaHoraria,
													onChange: (e) => setZonaHoraria(e.target.value),
													className: "w-full h-9 text-xs rounded-md border border-slate-200 bg-white px-2.5",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
															value: "Europe/Madrid",
															children: "Europe/Madrid (UTC+1)"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
															value: "Europe/London",
															children: "Europe/London (UTC+0)"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
															value: "America/Mexico_City",
															children: "America/Mexico City (UTC-6)"
														})
													]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													className: "text-xs font-semibold text-slate-700",
													children: "Moneda"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
													value: moneda,
													onChange: (e) => setMoneda(e.target.value),
													className: "w-full h-9 text-xs rounded-md border border-slate-200 bg-white px-2.5",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
															value: "EUR",
															children: "EUR (€) - Euro"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
															value: "USD",
															children: "USD ($) - Dólar"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
															value: "MXN",
															children: "MXN ($) - Peso Mexicano"
														})
													]
												})]
											})
										]
									})
								]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
								className: "text-base flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "w-4 h-4 text-[#D24D09]" }), "Preferencias de Visualización"]
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
								className: "space-y-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-1 md:grid-cols-2 gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-semibold text-slate-800",
											children: "Idioma"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] text-slate-500",
											children: "Idioma de la interfaz"
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											value: idioma,
											onChange: (e) => setIdioma(e.target.value),
											className: "h-8 text-xs rounded-md border border-slate-200 bg-white px-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "es",
												children: "Español"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "en",
												children: "English"
											})]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-semibold text-slate-800",
											children: "Formato de fecha"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] text-slate-500",
											children: "Cómo se muestran las fechas"
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											className: "bg-slate-100 text-slate-700 border-slate-200",
											children: "DD/MM/YYYY"
										})]
									})]
								})
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "categorias",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
								className: "flex flex-row items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
									className: "text-base flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "w-4 h-4 text-[#D24D09]" }), "Categorías de Productos"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, {
									className: "text-xs",
									children: "Gestiona las categorías que aparecen en el catálogo."
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									onClick: abrirModalNuevaCategoria,
									className: "bg-[#D24D09] hover:bg-[#b83f05] text-white text-xs gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-3.5 h-3.5" }), " Nueva Categoría"]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
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
							] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: cargandoCategorias ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								colSpan: 4,
								className: "text-center py-8 text-slate-500",
								children: "Cargando categorías desde la base de datos..."
							}) }) : categorias.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								colSpan: 4,
								className: "text-center py-8 text-slate-500",
								children: "No hay categorías registradas. Crea una nueva."
							}) }) : categorias.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									className: "bg-indigo-50 text-indigo-800 border-indigo-200 text-xs font-medium",
									children: cat.nombre
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "text-xs text-slate-600 max-w-[300px] truncate",
									children: cat.descripcion || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "outline",
										className: cat.activo ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs" : "bg-slate-100 text-slate-600 border-slate-200 text-xs",
										children: cat.activo ? "Activa" : "Inactiva"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-end gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "ghost",
											size: "sm",
											onClick: () => abrirModalEditarCategoria(cat),
											className: "h-7 w-7 p-0 text-slate-500 hover:text-blue-600",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "w-3.5 h-3.5" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "ghost",
											size: "sm",
											onClick: () => {
												setCategoriaAEliminar(cat);
												setDialogEliminarAbierto(true);
											},
											className: "h-7 w-7 p-0 text-slate-500 hover:text-rose-600",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "w-3.5 h-3.5" })
										})]
									})
								})
							] }, cat.id)) })] }) })] })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
							value: "stock",
							className: "space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
								className: "text-base flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "w-4 h-4 text-[#D24D09]" }), "Límites de Stock y Alertas"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, {
								className: "text-xs",
								children: "Reglas automáticas de bloqueo y reposición preventiva."
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
								className: "space-y-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-semibold text-slate-800",
											children: "Alerta de Stock Bajo"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] text-slate-500",
											children: "Notificar cuando un producto esté por debajo del mínimo"
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
											checked: alertaStockBajo,
											onCheckedChange: setAlertaStockBajo
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-1 md:grid-cols-2 gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-xs font-semibold text-slate-700",
												children: "Umbral Stock Bajo (%)"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "number",
												value: umbralStockBajo,
												onChange: (e) => setUmbralStockBajo(Number(e.target.value)),
												className: "h-9 text-xs"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-xs font-semibold text-slate-700",
												children: "Umbral Stock Crítico (%)"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "number",
												value: umbralStockCritico,
												onChange: (e) => setUmbralStockCritico(Number(e.target.value)),
												className: "h-9 text-xs"
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-semibold text-slate-800",
											children: "Email al Administrador"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] text-slate-500",
											children: "Enviar alertas críticas por email"
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
											checked: emailAdmin,
											onCheckedChange: setEmailAdmin
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-semibold text-slate-800",
											children: "Email al Operador"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] text-slate-500",
											children: "Notificar al operador de almacén"
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
											checked: emailOperador,
											onCheckedChange: setEmailOperador
										})]
									})
								]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
								className: "text-base flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "w-4 h-4 text-[#D24D09]" }), "Parámetros de Stock"]
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
								className: "space-y-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-1 md:grid-cols-3 gap-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													className: "text-xs font-semibold text-slate-700",
													children: "Stock Mínimo por Defecto"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "number",
													value: stockMinimoDefecto,
													onChange: (e) => setStockMinimoDefecto(Number(e.target.value)),
													className: "h-9 text-xs"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													className: "text-xs font-semibold text-slate-700",
													children: "Unidad de Medida"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
													value: unidadMedida,
													onChange: (e) => setUnidadMedida(e.target.value),
													className: "w-full h-9 text-xs rounded-md border border-slate-200 bg-white px-2.5",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
															value: "gal",
															children: "Galones (gal)"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
															value: "L",
															children: "Litros (L)"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
															value: "unid",
															children: "Unidades (unid)"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
															value: "Kg",
															children: "Kilogramos (Kg)"
														})
													]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													className: "text-xs font-semibold text-slate-700",
													children: "IVA por Defecto (%)"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "number",
													value: iva,
													onChange: (e) => setIva(Number(e.target.value)),
													className: "h-9 text-xs"
												})]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-semibold text-slate-800",
											children: "Permitir Stock Negativo"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] text-slate-500",
											children: "Permitir ventas cuando el stock sea 0"
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
											checked: permitirStockNegativo,
											onCheckedChange: setPermitirStockNegativo
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-semibold text-slate-800",
											children: "Bloquear Ventas con Stock Bajo"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] text-slate-500",
											children: "Impedir ventas si está por debajo del mínimo"
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
											checked: bloquearVentasStockBajo,
											onCheckedChange: setBloquearVentasStockBajo
										})]
									})
								]
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "usuarios",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
								className: "text-base flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "w-4 h-4 text-[#D24D09]" }), "Usuarios del Sistema"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, {
								className: "text-xs",
								children: "Lista de usuarios registrados y sus roles."
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "text-xs",
									children: "USUARIO"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "text-xs",
									children: "EMAIL"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "text-xs",
									children: "ROL"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "text-xs text-center",
									children: "ESTADO"
								})
							] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: usuarios.map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-7 h-7 rounded-full bg-[#D24D09]/10 text-[#D24D09] flex items-center justify-center text-xs font-bold",
										children: u.nombre.split(" ").map((n) => n[0]).join("").slice(0, 2)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs font-semibold text-slate-800",
										children: u.nombre
									})]
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "text-xs text-slate-600",
									children: u.email
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									className: "bg-blue-50 text-blue-800 border-blue-200 text-xs",
									children: u.rol
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "text-center",
									children: u.activo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "outline",
										className: "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs",
										children: "Activo"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "outline",
										className: "bg-slate-100 text-slate-600 border-slate-200 text-xs",
										children: "Inactivo"
									})
								})
							] }, u.id)) })] }) })] })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "backup",
							className: "space-y-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
								className: "text-base flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Database, { className: "w-4 h-4 text-[#D24D09]" }), "Copia de Seguridad"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, {
								className: "text-xs",
								children: "Exporta e importa los datos del sistema."
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
								className: "space-y-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-4 rounded-lg border border-emerald-200 bg-emerald-50/50 flex items-start gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "w-5 h-5 text-emerald-600 shrink-0 mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-semibold text-emerald-900",
											children: "Último backup local completo"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-[11px] text-emerald-700 mt-0.5",
											children: [ultimoBackup, " • Exportado correctamente"]
										})] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-1 md:grid-cols-2 gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "outline",
											onClick: handleExportarBackup,
											className: "h-10 text-xs gap-1.5 border-slate-200",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "w-4 h-4" }), "Exportar Backup (JSON)"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "outline",
											className: "h-10 text-xs gap-1.5 border-slate-200",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "w-4 h-4" }), "Importar desde Archivo"]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-4 rounded-lg border border-amber-200 bg-amber-50/50 flex items-start gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "w-5 h-5 text-amber-600 shrink-0 mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs font-semibold text-amber-900",
												children: "Zona de peligro"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[11px] text-amber-700 mt-0.5",
												children: "Las acciones irreversibles requieren confirmación adicional."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												variant: "outline",
												size: "sm",
												className: "mt-2 h-7 text-xs border-rose-200 text-rose-700 hover:bg-rose-50",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "w-3 h-3 mr-1" }), "Purgar datos de prueba"]
											})
										] })]
									})
								]
							})] })
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: modalCategoriaAbierto,
				onOpenChange: (open) => {
					if (!open) {
						setModalCategoriaAbierto(false);
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
						children: categoriaEditando ? "Modifica los datos de la categoría." : "Crea una nueva categoría para el catálogo."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleCrearCategoria,
						className: "space-y-3.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-xs font-semibold text-slate-700",
									children: "Nombre *"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: formCatNombre,
									onChange: (e) => setFormCatNombre(e.target.value),
									placeholder: "Ej: Pinturas de Exterior",
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
									value: formCatDescripcion,
									onChange: (e) => setFormCatDescripcion(e.target.value),
									placeholder: "Descripción breve de la categoría",
									className: "text-xs",
									rows: 3
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								size: "sm",
								onClick: () => setModalCategoriaAbierto(false),
								children: "Cancelar"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								size: "sm",
								className: "bg-[#D24D09] hover:bg-[#b83f05] text-white text-xs",
								children: categoriaEditando ? "Guardar Cambios" : "Crear Categoría"
							})] })
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
				open: dialogEliminarAbierto,
				onOpenChange: setDialogEliminarAbierto,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, {
					className: "text-base",
					children: "¿Eliminar categoría?"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogDescription, {
					className: "text-xs",
					children: [
						"¿Estás seguro de eliminar la categoría «",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: categoriaAEliminar?.nombre }),
						"»? Los productos asociados quedarán sin categoría asignada."
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, {
					className: "text-xs",
					children: "Cancelar"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
					onClick: handleEliminarCategoria,
					className: "bg-rose-600 hover:bg-rose-700 text-white text-xs",
					children: "Eliminar"
				})] })] })
			})
		]
	});
}
//#endregion
export { ConfiguracionPage as component };
