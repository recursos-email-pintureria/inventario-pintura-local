import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { r as cn, t as Button } from "./button-B4mHfPXK.mjs";
import { B as Eye, C as Paintbrush, G as CircleX, H as Download, K as CircleCheck, L as FlaskConical, Q as Camera, S as Pencil, T as Package, V as EllipsisVertical, W as Circle, Y as ChevronRight, Z as Check, c as Trash2, d as SlidersHorizontal, h as Scale, m as Search, n as Warehouse, nt as Box, o as TriangleAlert, q as CircleAlert, t as X, x as Plus } from "../_libs/lucide-react.mjs";
import { a as DialogFooter, i as DialogDescription, n as Dialog, o as DialogHeader, r as DialogContent, s as DialogTitle } from "./dialog-CkqkUyDr.mjs";
import { t as Input } from "./input-CiJ2rg3V.mjs";
import { t as Label } from "./label-CfMjnYjw.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./alert-dialog-Dgw77DMg.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-DNuh2ePS.mjs";
import { f as getCategorias, h as getProductos, n as actualizarProducto, o as crearProducto, u as desactivarProducto } from "./inventario-Dm5VVMa5.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as DropdownMenuItemIndicator, c as DropdownMenuRadioItem$1, d as DropdownMenuSubTrigger$1, f as DropdownMenuTrigger$1, i as DropdownMenuItem$1, l as DropdownMenuSeparator$1, n as DropdownMenuCheckboxItem$1, o as DropdownMenuLabel$1, r as DropdownMenuContent$1, s as DropdownMenuPortal, t as DropdownMenu$1, u as DropdownMenuSubContent$1 } from "../_libs/@radix-ui/react-dropdown-menu+[...].mjs";
import { t as Checkbox } from "./checkbox-Co648b8n.mjs";
import { t as KPICard } from "./kpi-card-DV-n4aJl.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BIGqsRzk.mjs";
import { n as Html5Qrcode } from "../_libs/html5-qrcode.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/productos-vzunxN2I.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DropdownMenu = DropdownMenu$1;
var DropdownMenuTrigger = DropdownMenuTrigger$1;
var DropdownMenuSubTrigger = import_react.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuSubTrigger$1, {
	ref,
	className: cn("flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", inset && "pl-8", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "ml-auto" })]
}));
DropdownMenuSubTrigger.displayName = DropdownMenuSubTrigger$1.displayName;
var DropdownMenuSubContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSubContent$1, {
	ref,
	className: cn("z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)", className),
	...props
}));
DropdownMenuSubContent.displayName = DropdownMenuSubContent$1.displayName;
var DropdownMenuContent = import_react.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuContent$1, {
	ref,
	sideOffset,
	className: cn("z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md", "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)", className),
	...props
}) }));
DropdownMenuContent.displayName = DropdownMenuContent$1.displayName;
var DropdownMenuItem = import_react.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem$1, {
	ref,
	className: cn("relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0", inset && "pl-8", className),
	...props
}));
DropdownMenuItem.displayName = DropdownMenuItem$1.displayName;
var DropdownMenuCheckboxItem = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuCheckboxItem$1, {
	ref,
	className: cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }) })
	}), children]
}));
DropdownMenuCheckboxItem.displayName = DropdownMenuCheckboxItem$1.displayName;
var DropdownMenuRadioItem = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuRadioItem$1, {
	ref,
	className: cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { className: "h-2 w-2 fill-current" }) })
	}), children]
}));
DropdownMenuRadioItem.displayName = DropdownMenuRadioItem$1.displayName;
var DropdownMenuLabel = import_react.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuLabel$1, {
	ref,
	className: cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className),
	...props
}));
DropdownMenuLabel.displayName = DropdownMenuLabel$1.displayName;
var DropdownMenuSeparator = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator$1, {
	ref,
	className: cn("-mx-1 my-1 h-px bg-muted", className),
	...props
}));
DropdownMenuSeparator.displayName = DropdownMenuSeparator$1.displayName;
var DropdownMenuShortcut = ({ className, ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("ml-auto text-xs tracking-widest opacity-60", className),
		...props
	});
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";
function BarcodeScanner({ open, onOpenChange, onScan }) {
	const scannerRef = (0, import_react.useRef)(null);
	const containerRef = (0, import_react.useRef)(null);
	const [isScanning, setIsScanning] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [lastScanned, setLastScanned] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (!open) {
			stopScanning();
			return;
		}
		const startScanner = async () => {
			setError(null);
			setLastScanned(null);
			try {
				const scanner = new Html5Qrcode("barcode-reader");
				scannerRef.current = scanner;
				await scanner.start({ facingMode: "environment" }, {
					fps: 10,
					qrbox: {
						width: 250,
						height: 150
					}
				}, (decodedText) => {
					setLastScanned(decodedText);
					onScan(decodedText);
					stopScanning();
				}, (errorMessage) => {
					if (!errorMessage.includes("No MultiFormat Readers")) console.warn("Scanner error:", errorMessage);
				});
				setIsScanning(true);
			} catch (err) {
				setError(err?.message?.includes("Permission") ? "Permiso de cámara denegado. Actívalo en la configuración del navegador." : "No se pudo acceder a la cámara. Verifica que tengas una cámara disponible.");
				setIsScanning(false);
			}
		};
		const timeout = setTimeout(startScanner, 300);
		return () => {
			clearTimeout(timeout);
			stopScanning();
		};
	}, [open]);
	const stopScanning = async () => {
		if (scannerRef.current && isScanning) {
			try {
				await scannerRef.current.stop();
				scannerRef.current.clear();
			} catch (err) {
				console.warn("Error al detener scanner:", err);
			}
			scannerRef.current = null;
			setIsScanning(false);
		}
	};
	const handleClose = () => {
		stopScanning();
		onOpenChange(false);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: handleClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "h-5 w-5 text-amber-700" }), "Escanear Código de Barras"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Apunta la cámara al código de barras del producto. El código se detectará automáticamente." })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							ref: containerRef,
							className: "relative overflow-hidden rounded-lg border border-gray-200 bg-gray-900",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									id: "barcode-reader",
									className: "w-full",
									style: { minHeight: isScanning ? "300px" : "200px" }
								}),
								!isScanning && !error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "absolute inset-0 flex items-center justify-center bg-gray-900/80",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-center text-white",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "mx-auto h-12 w-12 mb-2 opacity-50" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm",
											children: "Iniciando cámara..."
										})]
									})
								}),
								error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "absolute inset-0 flex items-center justify-center bg-gray-900/80 p-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-center",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "mx-auto h-12 w-12 mb-2 text-rose-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm text-white",
											children: error
										})]
									})
								})
							]
						}),
						lastScanned && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-5 w-5 text-emerald-600" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-medium text-emerald-700",
									children: "Código detectado:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-mono text-sm font-bold text-emerald-900",
									children: lastScanned
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold mb-1",
								children: "💡 Consejos:"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
								className: "list-disc list-inside space-y-0.5 text-amber-700",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Asegúrate de tener buena iluminación" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Mantén el código a 10-20 cm de la cámara" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "El código se detectará automáticamente" })
								]
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					onClick: handleClose,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "mr-2 h-4 w-4" }), "Cerrar"]
				}) })
			]
		})
	});
}
function adaptarProducto(p) {
	let iconoTipo = "color";
	const catLower = (p.categoria || "").toLowerCase();
	if (catLower.includes("brocha") || catLower.includes("rodillo") || catLower.includes("herramienta")) iconoTipo = "herramienta";
	else if (catLower.includes("solvente") || catLower.includes("thinner") || catLower.includes("aguarrás")) iconoTipo = "solvente";
	return {
		...p,
		stock_actual: p.stock_actual ?? 0,
		stock_minimo: p.stock_minimo ?? 0,
		precio: p.precio ?? 0,
		unidad: p.unidad ?? "unid",
		categoria: p.categoria || "Sin categoría",
		swatchColor: "#ffffff",
		iconoTipo,
		dimensiones: {
			largo: p.largo ?? 0,
			ancho: p.ancho ?? 0,
			alto: p.alto ?? 0,
			peso: p.peso ?? 0
		}
	};
}
function ProductosPage() {
	const queryClient = useQueryClient();
	const { data: productosRaw = [], isLoading: cargandoProductos } = useQuery({
		queryKey: ["productos"],
		queryFn: getProductos
	});
	const { data: categoriasRaw = [] } = useQuery({
		queryKey: ["categorias"],
		queryFn: getCategorias
	});
	const productos = (0, import_react.useMemo)(() => productosRaw.map(adaptarProducto), [productosRaw]);
	const mutationCrear = useMutation({
		mutationFn: (nuevo) => crearProducto(nuevo),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["productos"] });
			toast.success("Producto creado correctamente");
		},
		onError: (error) => {
			toast.error(error.message || "Error al crear el producto");
		}
	});
	const mutationActualizar = useMutation({
		mutationFn: ({ id, updates }) => actualizarProducto(id, updates),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["productos"] });
			toast.success("Producto actualizado correctamente");
		},
		onError: (error) => {
			toast.error(error.message || "Error al actualizar el producto");
		}
	});
	const mutationDesactivar = useMutation({
		mutationFn: ({ id, activo }) => desactivarProducto(id, activo),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["productos"] });
			toast.success(`Producto ${variables.activo ? "reactivado" : "desactivado"} correctamente`);
		},
		onError: (error) => {
			toast.error(error.message || "Error al cambiar el estado");
		}
	});
	const [busqueda, setBusqueda] = (0, import_react.useState)("");
	const [categoriaSeleccionada, setCategoriaSeleccionada] = (0, import_react.useState)("todas");
	const [estadoSeleccionado, setEstadoSeleccionado] = (0, import_react.useState)("todos");
	const [paginaActual, setPaginaActual] = (0, import_react.useState)(1);
	const elementosPorPagina = 6;
	const [seleccionados, setSeleccionados] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const [scannerOpen, setScannerOpen] = (0, import_react.useState)(false);
	const [modalNuevoAbierto, setModalNuevoAbierto] = (0, import_react.useState)(false);
	const [productoVer, setProductoVer] = (0, import_react.useState)(null);
	const [productoEditar, setProductoEditar] = (0, import_react.useState)(null);
	const [productoADesactivar, setProductoADesactivar] = (0, import_react.useState)(null);
	const [formNombre, setFormNombre] = (0, import_react.useState)("");
	const [formSku, setFormSku] = (0, import_react.useState)("");
	const [formCategoria, setFormCategoria] = (0, import_react.useState)("");
	const [formStock, setFormStock] = (0, import_react.useState)(10);
	const [formStockMinimo, setFormStockMinimo] = (0, import_react.useState)(5);
	const [formPrecio, setFormPrecio] = (0, import_react.useState)(25e3);
	const [formUbicacion, setFormUbicacion] = (0, import_react.useState)("");
	const [formUnidad, setFormUnidad] = (0, import_react.useState)("gal");
	const [formLargo, setFormLargo] = (0, import_react.useState)(0);
	const [formAncho, setFormAncho] = (0, import_react.useState)(0);
	const [formAlto, setFormAlto] = (0, import_react.useState)(0);
	const [formPeso, setFormPeso] = (0, import_react.useState)(0);
	const productosFiltrados = (0, import_react.useMemo)(() => {
		return productos.filter((p) => {
			const q = busqueda.toLowerCase().trim();
			const coincideTexto = !q || p.nombre.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q);
			const coincideCategoria = categoriaSeleccionada === "todas" || p.categoria === categoriaSeleccionada;
			let coincideEstado = true;
			if (estadoSeleccionado === "normal") coincideEstado = p.stock_actual > p.stock_minimo;
			else if (estadoSeleccionado === "bajo") coincideEstado = p.stock_actual > 0 && p.stock_actual <= p.stock_minimo;
			else if (estadoSeleccionado === "agotado") coincideEstado = p.stock_actual === 0;
			return coincideTexto && coincideCategoria && coincideEstado;
		});
	}, [
		productos,
		busqueda,
		categoriaSeleccionada,
		estadoSeleccionado
	]);
	const totalPaginas = Math.ceil(productosFiltrados.length / elementosPorPagina) || 1;
	const productosPaginados = (0, import_react.useMemo)(() => {
		const inicio = (paginaActual - 1) * elementosPorPagina;
		return productosFiltrados.slice(inicio, inicio + elementosPorPagina);
	}, [
		productosFiltrados,
		paginaActual,
		elementosPorPagina
	]);
	const kpisData = (0, import_react.useMemo)(() => {
		const total = productos.length;
		const activos = productos.filter((p) => p.activo).length;
		const stockBajo = productos.filter((p) => p.stock_actual > 0 && p.stock_actual <= p.stock_minimo).length;
		const sinStock = productos.filter((p) => p.stock_actual === 0).length;
		return [
			{
				label: "Total Referencias",
				value: total,
				sublabel: "SKUs activos en catálogo",
				trend: `${total > 0 ? (activos / total * 100).toFixed(1) : "100"}% activos`,
				trendUp: true,
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "h-5 w-5" }),
				color: "amber"
			},
			{
				label: "Stock Bajo",
				value: stockBajo,
				sublabel: stockBajo > 0 ? "Requiere reposición" : "Sin alertas activas",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-5 w-5" }),
				color: "rose"
			},
			{
				label: "Sin Stock",
				value: sinStock,
				sublabel: "artículos agotados",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "h-5 w-5" }),
				color: "slate"
			}
		];
	}, [productos]);
	const toggleSeleccionarTodos = () => {
		if (seleccionados.size === productosPaginados.length) setSeleccionados(/* @__PURE__ */ new Set());
		else setSeleccionados(new Set(productosPaginados.map((p) => p.id)));
	};
	const toggleSeleccionarFila = (id) => {
		setSeleccionados((prev) => {
			const nuevo = new Set(prev);
			if (nuevo.has(id)) nuevo.delete(id);
			else nuevo.add(id);
			return nuevo;
		});
	};
	const handleScan = (code) => {
		const productoEncontrado = productos.find((p) => (p.sku || "").toLowerCase() === code.toLowerCase() || p.id === code);
		if (productoEncontrado) {
			setBusqueda(productoEncontrado.sku);
			setPaginaActual(1);
			toast.success(`✅ Producto encontrado: ${productoEncontrado.nombre}`);
		} else {
			setFormSku(code.toUpperCase());
			setFormNombre("");
			setFormCategoria(categoriasRaw[0]?.nombre || "");
			setFormStock(0);
			setFormStockMinimo(0);
			setFormPrecio(0);
			setFormUbicacion("");
			setFormUnidad("unid");
			setFormLargo(0);
			setFormAncho(0);
			setFormAlto(0);
			setFormPeso(0);
			setModalNuevoAbierto(true);
			toast.info(`🆕 Código ${code} no encontrado. Complete los datos para crearlo.`);
		}
	};
	const abrirModalCrear = () => {
		setFormNombre("");
		setFormSku(`LAT-${Math.floor(1e3 + Math.random() * 9e3)}-${Math.floor(10 + Math.random() * 90)}`);
		setFormCategoria(categoriasRaw[0]?.nombre || "");
		setFormStock(15);
		setFormStockMinimo(5);
		setFormPrecio(32e3);
		setFormUbicacion("Pasillo A - A02");
		setFormUnidad("gal");
		setFormLargo(0);
		setFormAncho(0);
		setFormAlto(0);
		setFormPeso(0);
		setModalNuevoAbierto(true);
	};
	const abrirModalEditar = (p) => {
		setProductoEditar(p);
		setFormNombre(p.nombre);
		setFormSku(p.sku || "");
		setFormCategoria(p.categoria || "");
		setFormStock(p.stock_actual);
		setFormStockMinimo(p.stock_minimo);
		setFormPrecio(p.precio || 0);
		setFormUbicacion(p.ubicacion || "");
		setFormUnidad(p.unidad || "gal");
		setFormLargo(p.dimensiones?.largo || 0);
		setFormAncho(p.dimensiones?.ancho || 0);
		setFormAlto(p.dimensiones?.alto || 0);
		setFormPeso(p.dimensiones?.peso || 0);
	};
	const handleGuardarNuevo = (e) => {
		e.preventDefault();
		if (!formNombre.trim() || !formSku.trim()) {
			toast.error("Por favor completa el nombre y el SKU.");
			return;
		}
		mutationCrear.mutate({
			sku: formSku.trim().toUpperCase(),
			nombre: formNombre.trim(),
			categoria: formCategoria || null,
			stock_actual: Number(formStock) || 0,
			stock_minimo: Number(formStockMinimo) || 0,
			unidad: formUnidad,
			ubicacion: formUbicacion || null,
			precio: Number(formPrecio) || 0,
			largo: Number(formLargo) || null,
			ancho: Number(formAncho) || null,
			alto: Number(formAlto) || null,
			peso: Number(formPeso) || null
		});
		setModalNuevoAbierto(false);
	};
	const handleGuardarEdicion = (e) => {
		e.preventDefault();
		if (!productoEditar) return;
		mutationActualizar.mutate({
			id: productoEditar.id,
			updates: {
				nombre: formNombre.trim(),
				sku: formSku.trim().toUpperCase(),
				categoria: formCategoria || null,
				stock_actual: Number(formStock) || 0,
				stock_minimo: Number(formStockMinimo) || 0,
				precio: Number(formPrecio) || 0,
				ubicacion: formUbicacion || null,
				unidad: formUnidad,
				largo: Number(formLargo) || null,
				ancho: Number(formAncho) || null,
				alto: Number(formAlto) || null,
				peso: Number(formPeso) || null
			}
		});
		setProductoEditar(null);
	};
	const confirmarDesactivar = () => {
		if (!productoADesactivar) return;
		mutationDesactivar.mutate({
			id: productoADesactivar.id,
			activo: !productoADesactivar.activo
		});
		setProductoADesactivar(null);
	};
	const exportarCSV = () => {
		const encabezados = "SKU,Nombre,Categoría,Ubicación,Stock,Mínimo,Precio\n";
		const filas = productosFiltrados.map((p) => `"${p.sku || ""}","${p.nombre}","${p.categoria || ""}","${p.ubicacion || "-"}","${p.stock_actual} ${p.unidad || ""}","${p.stock_minimo}","${p.precio || 0}"`).join("\n");
		const blob = new Blob([encabezados + filas], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute("download", `productos_inventario_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		toast.success("Listado de productos exportado a CSV.");
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
							children: "EXISTENCIAS"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight",
					children: "Catálogo de Productos"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/90 text-blue-700 border border-blue-200/80 text-xs font-medium shadow-2xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-2 h-2 rounded-full bg-blue-600 animate-pulse" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: cargandoProductos ? "Conectando a Supabase..." : `Supabase • ${productos.length} productos` })]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative flex-1 min-w-[220px]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: busqueda,
								onChange: (e) => {
									setBusqueda(e.target.value);
									setPaginaActual(1);
								},
								placeholder: "Buscar por nombre, SKU o código...",
								className: "pl-9 h-10 bg-white border-gray-300 rounded-lg text-sm focus:border-amber-600 focus:ring-amber-600"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-[190px]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: categoriaSeleccionada,
								onValueChange: (val) => {
									setCategoriaSeleccionada(val);
									setPaginaActual(1);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									className: "h-10 border-gray-300 bg-white text-gray-700 rounded-lg text-sm",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Todas las categorías" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "todas",
									children: "Todas las categorías"
								}), categoriasRaw.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: cat.nombre,
									children: cat.nombre
								}, cat.id))] })]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-[170px]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: estadoSeleccionado,
								onValueChange: (val) => {
									setEstadoSeleccionado(val);
									setPaginaActual(1);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									className: "h-10 border-gray-300 bg-white text-gray-700 rounded-lg text-sm",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Todos los estados" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "todos",
										children: "Todos los estados"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "normal",
										children: "Normal (Stock OK)"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "bajo",
										children: "Stock Bajo"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "agotado",
										children: "Sin Stock"
									})
								] })]
							})
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							onClick: exportarCSV,
							className: "h-10 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold gap-1.5 shadow-2xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "w-3.5 h-3.5 text-gray-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Exportar CSV" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							onClick: () => setScannerOpen(true),
							className: "h-10 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold gap-1.5 shadow-2xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "w-3.5 h-3.5 text-gray-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Escanear" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: abrirModalCrear,
							className: "h-10 bg-[#8c4314] hover:bg-[#78370e] text-white rounded-lg text-xs font-semibold px-4 gap-1.5 shadow-xs transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-4 h-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Nuevo Producto" })]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
				children: kpisData.map((kpi) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KPICard, { data: kpi }, kpi.label))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between text-xs text-gray-500 px-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [seleccionados.size, " seleccionados"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1.5 font-medium",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, { className: "w-3.5 h-3.5 text-gray-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: cargandoProductos ? "Cargando..." : `Columnas activas: 6/6 • ${productos.length} productos` })]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, {
						className: "bg-gray-50/80 border-b border-gray-200",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
							className: "hover:bg-transparent",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "w-[48px] px-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
										checked: productosPaginados.length > 0 && seleccionados.size === productosPaginados.length,
										onCheckedChange: toggleSeleccionarTodos,
										"aria-label": "Seleccionar todos"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "text-xs font-bold uppercase tracking-wider text-gray-600",
									children: "PRODUCTO & SKU"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "text-xs font-bold uppercase tracking-wider text-gray-600",
									children: "CATEGORÍA"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "text-xs font-bold uppercase tracking-wider text-gray-600",
									children: "UBICACIÓN"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "text-xs font-bold uppercase tracking-wider text-gray-600",
									children: "STOCK & ESTADO"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "text-xs font-bold uppercase tracking-wider text-gray-600 text-right",
									children: "PRECIO UNITARIO"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "text-xs font-bold uppercase tracking-wider text-gray-600 text-right w-[100px]",
									children: "ACCIONES"
								})
							]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, {
						className: "divide-y divide-gray-100",
						children: cargandoProductos ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
							colSpan: 7,
							className: "h-32 text-center text-gray-500",
							children: "Cargando productos desde Supabase..."
						}) }) : productosPaginados.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
							colSpan: 7,
							className: "h-32 text-center text-gray-500",
							children: "No se encontraron productos con los filtros seleccionados."
						}) }) : productosPaginados.map((p) => {
							const estaSeleccionado = seleccionados.has(p.id);
							const esAgotado = p.stock_actual === 0;
							const esBajo = p.stock_actual > 0 && p.stock_actual <= p.stock_minimo;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
								className: `transition-colors ${estaSeleccionado ? "bg-amber-50/40" : "hover:bg-gray-50/80"}`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "px-4",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
											checked: estaSeleccionado,
											onCheckedChange: () => toggleSeleccionarFila(p.id),
											"aria-label": `Seleccionar ${p.nombre}`
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "py-3",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "w-8 h-8 rounded-full border border-gray-200 shrink-0 flex items-center justify-center shadow-2xs",
												style: { backgroundColor: p.swatchColor || "#f1f5f9" },
												children: p.iconoTipo === "herramienta" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Paintbrush, { className: "w-4 h-4 text-gray-600" }) : p.iconoTipo === "solvente" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlaskConical, { className: "w-4 h-4 text-blue-600" }) : null
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-col min-w-0",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-semibold text-sm text-gray-900 truncate",
													children: p.nombre
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-xs font-mono text-gray-500 tracking-tight",
													children: ["SKU: ", p.sku || "—"]
												})]
											})]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-100",
										children: p.categoria || "Sin categoría"
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "inline-flex items-center gap-1.5 text-xs text-gray-700 font-medium",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Warehouse, { className: "w-3.5 h-3.5 text-gray-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: p.ubicacion || "Sin asignar" })]
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: `font-bold text-xs ${esAgotado ? "text-rose-600" : esBajo ? "text-amber-800" : "text-gray-900"}`,
											children: [
												p.stock_actual,
												" ",
												p.unidad || "unid"
											]
										}), esAgotado ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-1.5 h-1.5 rounded-full bg-rose-600" }), "Agotado"]
										}) : esBajo ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-1.5 h-1.5 rounded-full bg-amber-600" }), "Bajo"]
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-600" }), "Normal"]
										})]
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
										className: "text-right font-medium text-xs text-gray-800",
										children: ["$", (p.precio || 0).toLocaleString("es-CL")]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "text-right",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-end gap-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "ghost",
												size: "sm",
												onClick: () => setProductoVer(p),
												className: "h-8 w-8 p-0 text-gray-500 hover:text-gray-800 hover:bg-gray-100",
												title: "Ver detalles",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "w-4 h-4" })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
												asChild: true,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "ghost",
													size: "sm",
													className: "h-8 w-8 p-0 text-gray-500 hover:text-gray-800 hover:bg-gray-100",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EllipsisVertical, { className: "w-4 h-4" })
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
												align: "end",
												className: "w-44",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
														onClick: () => abrirModalEditar(p),
														className: "gap-2 text-xs font-medium cursor-pointer",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "w-3.5 h-3.5 text-blue-600" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Editar producto" })]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, {}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
														onClick: () => setProductoADesactivar(p),
														className: "gap-2 text-xs font-medium text-rose-600 cursor-pointer",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "w-3.5 h-3.5 text-rose-600" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: p.activo ? "Desactivar" : "Activar" })]
													})
												]
											})] })]
										})
									})
								]
							}, p.id);
						})
					})] })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 pt-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					"Mostrando",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
						className: "text-gray-800",
						children: productosFiltrados.length === 0 ? 0 : (paginaActual - 1) * elementosPorPagina + 1
					}),
					" ",
					"a",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
						className: "text-gray-800",
						children: Math.min(paginaActual * elementosPorPagina, productosFiltrados.length)
					}),
					" ",
					"de ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
						className: "text-gray-800",
						children: productosFiltrados.length
					}),
					" productos"
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							size: "sm",
							onClick: () => setPaginaActual((p) => Math.max(1, p - 1)),
							disabled: paginaActual === 1,
							className: "h-8 text-xs font-medium border-gray-300",
							children: "Anterior"
						}),
						Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: paginaActual === num ? "default" : "outline",
							size: "sm",
							onClick: () => setPaginaActual(num),
							className: `h-8 w-8 p-0 text-xs font-semibold ${paginaActual === num ? "bg-[#8c4314] hover:bg-[#78370e] text-white border-transparent" : "border-gray-300 text-gray-700"}`,
							children: num
						}, num)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							size: "sm",
							onClick: () => setPaginaActual((p) => Math.min(totalPaginas, p + 1)),
							disabled: paginaActual === totalPaginas,
							className: "h-8 text-xs font-medium border-gray-300 text-amber-900 border-amber-300 hover:bg-amber-50",
							children: "Siguiente"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BarcodeScanner, {
				open: scannerOpen,
				onOpenChange: setScannerOpen,
				onScan: handleScan
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: modalNuevoAbierto,
				onOpenChange: setModalNuevoAbierto,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-2xl max-h-[90vh] overflow-y-auto",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
						className: "text-lg font-bold text-gray-900",
						children: "Registrar Nuevo Producto"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
						className: "text-xs text-gray-500",
						children: "Introduce la información del nuevo producto para darlo de alta en el catálogo."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleGuardarNuevo,
						className: "space-y-4 py-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "nuevo-sku",
										children: "SKU *"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "nuevo-sku",
											value: formSku,
											onChange: (e) => setFormSku(e.target.value),
											placeholder: "Ej: LAT-4001-WHT",
											className: "font-mono text-sm uppercase flex-1",
											required: true
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											variant: "outline",
											size: "icon",
											onClick: () => setScannerOpen(true),
											title: "Escanear código",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "h-4 w-4" })
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "nuevo-cat",
										children: "Categoría *"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: formCategoria,
										onValueChange: setFormCategoria,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											id: "nuevo-cat",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Selecciona una categoría" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: categoriasRaw.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: cat.nombre,
											children: cat.nombre
										}, cat.id)) })]
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "nuevo-nombre",
									children: "Nombre del Producto *"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "nuevo-nombre",
									value: formNombre,
									onChange: (e) => setFormNombre(e.target.value),
									placeholder: "Ej: Látex Supercubriente Blanco 20L",
									required: true
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 sm:grid-cols-4 gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "nuevo-stock",
											children: "Stock Inicial"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "nuevo-stock",
											type: "number",
											min: 0,
											value: formStock,
											onChange: (e) => setFormStock(e.target.value === "" ? "" : Number(e.target.value))
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "nuevo-minimo",
											children: "Stock Mínimo"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "nuevo-minimo",
											type: "number",
											min: 0,
											value: formStockMinimo,
											onChange: (e) => setFormStockMinimo(e.target.value === "" ? "" : Number(e.target.value))
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "nuevo-unidad",
											children: "Unidad"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: formUnidad,
											onValueChange: setFormUnidad,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
												id: "nuevo-unidad",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "gal",
													children: "gal (Galones)"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "unid",
													children: "unid (Unidades)"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "Kg",
													children: "Kg (Kilos)"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "L",
													children: "L (Litros)"
												})
											] })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "nuevo-precio",
											children: "Precio Unitario ($)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "nuevo-precio",
											type: "number",
											min: 0,
											value: formPrecio,
											onChange: (e) => setFormPrecio(e.target.value === "" ? "" : Number(e.target.value))
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "nuevo-ubicacion",
									children: "Ubicación física"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "nuevo-ubicacion",
									value: formUbicacion,
									onChange: (e) => setFormUbicacion(e.target.value),
									placeholder: "Ej: Pasillo A - A01"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "pt-2 border-t border-gray-200",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 mb-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Box, { className: "h-4 w-4 text-amber-700" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-sm font-semibold text-gray-800",
										children: "Dimensiones y Peso (Opcional)"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 sm:grid-cols-4 gap-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "nuevo-largo",
												className: "text-xs",
												children: "Largo (cm)"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "nuevo-largo",
												type: "number",
												min: 0,
												value: formLargo,
												onChange: (e) => setFormLargo(e.target.value === "" ? "" : Number(e.target.value))
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "nuevo-ancho",
												className: "text-xs",
												children: "Ancho (cm)"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "nuevo-ancho",
												type: "number",
												min: 0,
												value: formAncho,
												onChange: (e) => setFormAncho(e.target.value === "" ? "" : Number(e.target.value))
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "nuevo-alto",
												className: "text-xs",
												children: "Alto (cm)"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "nuevo-alto",
												type: "number",
												min: 0,
												value: formAlto,
												onChange: (e) => setFormAlto(e.target.value === "" ? "" : Number(e.target.value))
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
												htmlFor: "nuevo-peso",
												className: "text-xs flex items-center gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scale, { className: "h-3 w-3" }), " Peso (kg)"]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "nuevo-peso",
												type: "number",
												min: 0,
												step: "0.1",
												value: formPeso,
												onChange: (e) => setFormPeso(e.target.value === "" ? "" : Number(e.target.value))
											})]
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
								className: "pt-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "outline",
									onClick: () => setModalNuevoAbierto(false),
									disabled: mutationCrear.isPending,
									children: "Cancelar"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "submit",
									className: "bg-[#8c4314] hover:bg-[#78370e] text-white",
									disabled: mutationCrear.isPending,
									children: mutationCrear.isPending ? "Guardando..." : "Guardar Producto"
								})]
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: Boolean(productoEditar),
				onOpenChange: (open) => !open && setProductoEditar(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-2xl max-h-[90vh] overflow-y-auto",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
						className: "text-lg font-bold text-gray-900",
						children: "Editar Producto"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
						className: "text-xs text-gray-500",
						children: "Modifica los detalles del producto seleccionado."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleGuardarEdicion,
						className: "space-y-4 py-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "edit-sku",
										children: "SKU"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "edit-sku",
										value: formSku,
										onChange: (e) => setFormSku(e.target.value),
										className: "font-mono text-sm uppercase",
										required: true
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "edit-cat",
										children: "Categoría"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: formCategoria,
										onValueChange: setFormCategoria,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											id: "edit-cat",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: categoriasRaw.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: cat.nombre,
											children: cat.nombre
										}, cat.id)) })]
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "edit-nombre",
									children: "Nombre"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "edit-nombre",
									value: formNombre,
									onChange: (e) => setFormNombre(e.target.value),
									required: true
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 sm:grid-cols-4 gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "edit-stock",
											children: "Stock Actual"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "edit-stock",
											type: "number",
											min: 0,
											value: formStock,
											onChange: (e) => setFormStock(e.target.value === "" ? "" : Number(e.target.value))
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "edit-minimo",
											children: "Stock Mínimo"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "edit-minimo",
											type: "number",
											min: 0,
											value: formStockMinimo,
											onChange: (e) => setFormStockMinimo(e.target.value === "" ? "" : Number(e.target.value))
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "edit-unidad",
											children: "Unidad"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "edit-unidad",
											value: formUnidad,
											onChange: (e) => setFormUnidad(e.target.value)
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "edit-precio",
											children: "Precio Unitario ($)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "edit-precio",
											type: "number",
											min: 0,
											value: formPrecio,
											onChange: (e) => setFormPrecio(e.target.value === "" ? "" : Number(e.target.value))
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "edit-ubicacion",
									children: "Ubicación"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "edit-ubicacion",
									value: formUbicacion,
									onChange: (e) => setFormUbicacion(e.target.value)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "pt-2 border-t border-gray-200",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 mb-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Box, { className: "h-4 w-4 text-amber-700" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-sm font-semibold text-gray-800",
										children: "Dimensiones y Peso (Opcional)"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 sm:grid-cols-4 gap-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "edit-largo",
												className: "text-xs",
												children: "Largo (cm)"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "edit-largo",
												type: "number",
												min: 0,
												value: formLargo,
												onChange: (e) => setFormLargo(e.target.value === "" ? "" : Number(e.target.value))
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "edit-ancho",
												className: "text-xs",
												children: "Ancho (cm)"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "edit-ancho",
												type: "number",
												min: 0,
												value: formAncho,
												onChange: (e) => setFormAncho(e.target.value === "" ? "" : Number(e.target.value))
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "edit-alto",
												className: "text-xs",
												children: "Alto (cm)"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "edit-alto",
												type: "number",
												min: 0,
												value: formAlto,
												onChange: (e) => setFormAlto(e.target.value === "" ? "" : Number(e.target.value))
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
												htmlFor: "edit-peso",
												className: "text-xs flex items-center gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scale, { className: "h-3 w-3" }), " Peso (kg)"]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "edit-peso",
												type: "number",
												min: 0,
												step: "0.1",
												value: formPeso,
												onChange: (e) => setFormPeso(e.target.value === "" ? "" : Number(e.target.value))
											})]
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
								className: "pt-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "outline",
									onClick: () => setProductoEditar(null),
									disabled: mutationActualizar.isPending,
									children: "Cancelar"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "submit",
									className: "bg-[#8c4314] hover:bg-[#78370e] text-white",
									disabled: mutationActualizar.isPending,
									children: mutationActualizar.isPending ? "Guardando..." : "Guardar Cambios"
								})]
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: Boolean(productoVer),
				onOpenChange: (open) => !open && setProductoVer(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-md",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 mb-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold",
								children: productoVer?.sku
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 font-medium border border-blue-100",
								children: productoVer?.categoria
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
							className: "text-base font-bold text-gray-900",
							children: productoVer?.nombre
						})] }),
						productoVer && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3 py-2 text-xs",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-gray-500 block",
											children: "Stock Actual:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-bold text-sm text-gray-900",
											children: [
												productoVer.stock_actual,
												" ",
												productoVer.unidad
											]
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-gray-500 block",
											children: "Stock Mínimo:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-bold text-sm text-gray-900",
											children: [
												productoVer.stock_minimo,
												" ",
												productoVer.unidad
											]
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-gray-500 block",
											children: "Ubicación Física:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold text-gray-800",
											children: productoVer.ubicacion || "-"
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-gray-500 block",
											children: "Precio Unitario:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-semibold text-gray-800",
											children: ["$", (productoVer.precio || 0).toLocaleString("es-CL")]
										})] })
									]
								}),
								productoVer.dimensiones && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "bg-amber-50/50 p-3 rounded-lg border border-amber-200",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5 mb-2 text-amber-800 font-semibold",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Box, { className: "h-3.5 w-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Dimensiones y Peso" })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-4 gap-2 text-center",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] text-gray-500 block",
												children: "Largo"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "font-bold text-gray-900",
												children: [productoVer.dimensiones.largo, " cm"]
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] text-gray-500 block",
												children: "Ancho"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "font-bold text-gray-900",
												children: [productoVer.dimensiones.ancho, " cm"]
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] text-gray-500 block",
												children: "Alto"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "font-bold text-gray-900",
												children: [productoVer.dimensiones.alto, " cm"]
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] text-gray-500 block",
												children: "Peso"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "font-bold text-gray-900",
												children: [productoVer.dimensiones.peso, " kg"]
											})] })
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between p-2 rounded border bg-white",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-gray-600",
										children: "Estado del producto:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `px-2 py-0.5 rounded-full font-semibold ${productoVer.activo ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`,
										children: productoVer.activo ? "Activo" : "Inactivo"
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							size: "sm",
							onClick: () => setProductoVer(null),
							children: "Cerrar"
						}) })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
				open: Boolean(productoADesactivar),
				onOpenChange: (open) => !open && setProductoADesactivar(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogTitle, { children: [
					"¿",
					productoADesactivar?.activo ? "Desactivar" : "Reactivar",
					" producto?"
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogDescription, { children: [
					"¿Estás seguro de que deseas ",
					productoADesactivar?.activo ? "desactivar" : "activar",
					" ",
					"el producto «",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: productoADesactivar?.nombre }),
					"» (SKU:",
					" ",
					productoADesactivar?.sku,
					")?",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
					"Los movimientos e histórico de existencias se conservarán en la base de datos."
				] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, {
					onClick: () => setProductoADesactivar(null),
					children: "Cancelar"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
					onClick: confirmarDesactivar,
					className: productoADesactivar?.activo ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white",
					children: "Confirmar"
				})] })] })
			})
		]
	});
}
//#endregion
export { ProductosPage as component };
