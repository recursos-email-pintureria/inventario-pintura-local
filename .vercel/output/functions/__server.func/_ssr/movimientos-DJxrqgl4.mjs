import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-B4mHfPXK.mjs";
import { B as Eye, H as Download, _ as RotateCcw, d as SlidersHorizontal, it as ArrowUpRight, m as Search, st as ArrowDownLeft, v as Repeat, x as Plus, z as FileDown } from "../_libs/lucide-react.mjs";
import { a as DialogFooter, i as DialogDescription, n as Dialog, o as DialogHeader, r as DialogContent, s as DialogTitle, t as Badge } from "./dialog-CkqkUyDr.mjs";
import { t as Input } from "./input-CiJ2rg3V.mjs";
import { t as Label } from "./label-CfMjnYjw.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-DNuh2ePS.mjs";
import { h as getProductos, i as crearMovimiento, p as getMovimientos, v as getUbicaciones } from "./inventario-Dm5VVMa5.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as KPICard } from "./kpi-card-DV-n4aJl.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BIGqsRzk.mjs";
import { t as require_jspdf_node_min } from "../_libs/jspdf.mjs";
import { t as autoTable } from "../_libs/jspdf-autotable.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/movimientos-DJxrqgl4.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_jspdf_node_min = /* @__PURE__ */ __toESM(require_jspdf_node_min());
var TIPO_INFO = {
	entrada: {
		label: "Entrada",
		signo: "+",
		badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
		texto: "text-emerald-600"
	},
	salida: {
		label: "Salida",
		signo: "-",
		badge: "bg-rose-50 text-rose-700 border-rose-200",
		texto: "text-rose-600"
	},
	ajuste: {
		label: "Ajuste",
		signo: "=",
		badge: "bg-amber-50 text-amber-800 border-amber-200",
		texto: "text-amber-700"
	},
	reposicion: {
		label: "Reposición",
		signo: "+",
		badge: "bg-blue-50 text-blue-700 border-blue-200",
		texto: "text-blue-600"
	}
};
function fmtHora(iso) {
	return new Date(iso).toLocaleTimeString("es-ES", {
		hour: "2-digit",
		minute: "2-digit"
	});
}
function fmtFecha(iso) {
	return new Date(iso).toLocaleDateString("es-ES", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric"
	});
}
function MovimientosPage() {
	const queryClient = useQueryClient();
	const { data: movimientos = [], isLoading } = useQuery({
		queryKey: ["movimientos"],
		queryFn: getMovimientos,
		refetchInterval: 3e4
	});
	const { data: productos = [] } = useQuery({
		queryKey: ["productos"],
		queryFn: getProductos
	});
	const { data: ubicaciones = [] } = useQuery({
		queryKey: ["ubicaciones"],
		queryFn: getUbicaciones
	});
	const mutationCrear = useMutation({
		mutationFn: crearMovimiento,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["movimientos"] });
			queryClient.invalidateQueries({ queryKey: ["productos"] });
			toast.success("Movimiento registrado: stock actualizado por el trigger");
		},
		onError: (e) => toast.error(e.message || "Error al registrar el movimiento")
	});
	const [busqueda, setBusqueda] = (0, import_react.useState)("");
	const [filtroTipo, setFiltroTipo] = (0, import_react.useState)("todos");
	const [filtroPeriodo, setFiltroPeriodo] = (0, import_react.useState)("todos");
	const [pagina, setPagina] = (0, import_react.useState)(1);
	const [porPagina, setPorPagina] = (0, import_react.useState)(8);
	const [modalNuevo, setModalNuevo] = (0, import_react.useState)(false);
	const [detalle, setDetalle] = (0, import_react.useState)(null);
	const [formTipo, setFormTipo] = (0, import_react.useState)("entrada");
	const [formProducto, setFormProducto] = (0, import_react.useState)("");
	const [formUbicacion, setFormUbicacion] = (0, import_react.useState)("");
	const [formCantidad, setFormCantidad] = (0, import_react.useState)("");
	const [formMotivo, setFormMotivo] = (0, import_react.useState)("");
	const movimientosFiltrados = (0, import_react.useMemo)(() => {
		const q = busqueda.toLowerCase().trim();
		const ahora = Date.now();
		const dias = filtroPeriodo === "hoy" ? 0 : filtroPeriodo === "7d" ? 7 : filtroPeriodo === "30d" ? 30 : null;
		return movimientos.filter((m) => {
			const coincideTexto = !q || (m.producto?.nombre ?? "").toLowerCase().includes(q) || (m.producto?.sku ?? "").toLowerCase().includes(q) || (m.usuario?.nombre ?? "").toLowerCase().includes(q) || (m.ubicacion?.codigo ?? "").toLowerCase().includes(q) || (m.motivo ?? "").toLowerCase().includes(q);
			const coincideTipo = filtroTipo === "todos" || m.tipo === filtroTipo;
			let coincidePeriodo = true;
			if (dias !== null) {
				const f = new Date(m.fecha).getTime();
				if (dias === 0) coincidePeriodo = new Date(m.fecha).toDateString() === (/* @__PURE__ */ new Date()).toDateString();
				else coincidePeriodo = ahora - f <= dias * 24 * 60 * 60 * 1e3;
			}
			return coincideTexto && coincideTipo && coincidePeriodo;
		});
	}, [
		movimientos,
		busqueda,
		filtroTipo,
		filtroPeriodo
	]);
	const totalPaginas = Math.ceil(movimientosFiltrados.length / porPagina) || 1;
	const paginados = (0, import_react.useMemo)(() => {
		const inicio = (pagina - 1) * porPagina;
		return movimientosFiltrados.slice(inicio, inicio + porPagina);
	}, [
		movimientosFiltrados,
		pagina,
		porPagina
	]);
	const kpisData = (0, import_react.useMemo)(() => {
		const entradas = movimientos.filter((m) => m.tipo === "entrada").length;
		const salidas = movimientos.filter((m) => m.tipo === "salida").length;
		const ajustesRepos = movimientos.filter((m) => m.tipo === "ajuste" || m.tipo === "reposicion").length;
		const ultimos7 = movimientos.filter((m) => Date.now() - new Date(m.fecha).getTime() <= 6048e5).length;
		return [
			{
				label: "Total Operaciones",
				value: movimientos.length,
				sublabel: `últimos 7 días: ${ultimos7}`,
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Repeat, { className: "h-5 w-5" }),
				color: "amber"
			},
			{
				label: "Entradas",
				value: entradas,
				sublabel: "Recepción de proveedores",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDownLeft, { className: "h-5 w-5" }),
				color: "emerald"
			},
			{
				label: "Salidas",
				value: salidas,
				sublabel: "Ventas y despachos",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "h-5 w-5" }),
				color: "rose"
			},
			{
				label: "Ajustes y Reposiciones",
				value: ajustesRepos,
				sublabel: "Regularizaciones",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, { className: "h-5 w-5" }),
				color: "blue"
			}
		];
	}, [movimientos]);
	const limpiarFiltros = () => {
		setBusqueda("");
		setFiltroTipo("todos");
		setFiltroPeriodo("todos");
		setPagina(1);
	};
	const abrirModalNuevo = () => {
		setFormTipo("entrada");
		setFormProducto("");
		setFormUbicacion("");
		setFormCantidad("");
		setFormMotivo("");
		setModalNuevo(true);
	};
	const handleCrear = (e) => {
		e.preventDefault();
		if (!formProducto || !formUbicacion) {
			toast.error("Selecciona producto y ubicación");
			return;
		}
		const cant = Number(formCantidad);
		if (formCantidad === "" || isNaN(cant) || cant < 0) {
			toast.error("Introduce una cantidad válida");
			return;
		}
		if (formTipo !== "ajuste" && cant <= 0) {
			toast.error("La cantidad debe ser mayor que 0");
			return;
		}
		mutationCrear.mutate({
			producto_id: formProducto,
			ubicacion_id: formUbicacion,
			tipo: formTipo,
			cantidad: cant,
			motivo: formMotivo
		});
		setModalNuevo(false);
	};
	const exportarCSV = () => {
		const head = "Fecha,Tipo,Producto,SKU,Cantidad,Ubicación,Usuario,Motivo\n";
		const rows = movimientosFiltrados.map((m) => [
			`${fmtFecha(m.fecha)} ${fmtHora(m.fecha)}`,
			TIPO_INFO[m.tipo].label,
			m.producto?.nombre ?? "-",
			m.producto?.sku ?? "-",
			`${TIPO_INFO[m.tipo].signo}${m.cantidad}`,
			m.ubicacion?.codigo ?? "-",
			m.usuario?.nombre ?? "-",
			m.motivo ?? "-"
		].map((c) => `"${String(c).replace(/"/g, "\"\"")}"`).join(",")).join("\n");
		const blob = new Blob([head + rows], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `movimientos_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success("CSV exportado con datos reales");
	};
	const exportarPDF = () => {
		const doc = new import_jspdf_node_min.default();
		doc.setFontSize(14);
		doc.text("Historial de Movimientos - Inventario LM", 14, 16);
		doc.setFontSize(9);
		doc.text(`Generado: ${(/* @__PURE__ */ new Date()).toLocaleString("es-ES")}`, 14, 22);
		doc.text(`Registros: ${movimientosFiltrados.length}`, 14, 27);
		autoTable(doc, {
			startY: 32,
			head: [[
				"Fecha",
				"Tipo",
				"Producto",
				"SKU",
				"Cant.",
				"Ubicación",
				"Usuario",
				"Motivo"
			]],
			body: movimientosFiltrados.map((m) => [
				`${fmtFecha(m.fecha)} ${fmtHora(m.fecha)}`,
				TIPO_INFO[m.tipo].label,
				m.producto?.nombre ?? "-",
				m.producto?.sku ?? "-",
				`${TIPO_INFO[m.tipo].signo}${m.cantidad}`,
				m.ubicacion?.codigo ?? "-",
				m.usuario?.nombre ?? "-",
				m.motivo ?? "-"
			]),
			styles: { fontSize: 7.5 },
			headStyles: { fillColor: [
				210,
				77,
				9
			] }
		});
		doc.save(`movimientos_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.pdf`);
		toast.success("PDF exportado con datos reales");
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
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider mb-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "INVENTARIO LM" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "/" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "OPERACIONES" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "/" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[#D24D09] font-semibold",
									children: "MOVIMIENTOS"
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-2xl sm:text-3xl font-bold tracking-tight text-slate-900",
								children: "Historial de Movimientos"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
								variant: "outline",
								className: "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-2 h-2 rounded-full bg-emerald-600 animate-pulse" }), "Tiempo Real"]
							})]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2.5 self-start md:self-auto",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									size: "sm",
									onClick: exportarPDF,
									className: "text-xs h-9 px-3.5 border-slate-200 text-slate-700 hover:bg-slate-100 gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileDown, { className: "w-4 h-4 text-slate-500" }), "Exportar PDF"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									size: "sm",
									onClick: exportarCSV,
									className: "text-xs h-9 px-3.5 border-slate-200 text-slate-700 hover:bg-slate-100 gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "w-4 h-4 text-slate-500" }), "Exportar CSV"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									onClick: abrirModalNuevo,
									className: "bg-[#D24D09] hover:bg-[#b83f05] text-white text-xs font-semibold h-9 px-4 gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-4 h-4" }), "Nuevo Movimiento"]
								})
							]
						})]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
						children: kpisData.map((kpi) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KPICard, { data: kpi }, kpi.label))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center gap-2.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative flex-1 min-w-[220px]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: busqueda,
									onChange: (e) => {
										setBusqueda(e.target.value);
										setPagina(1);
									},
									placeholder: "Buscar SKU, producto o responsable...",
									className: "pl-9 h-10 bg-white border-slate-200 text-sm"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: filtroTipo,
								onValueChange: (v) => {
									setFiltroTipo(v);
									setPagina(1);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									className: "w-[150px] h-10 bg-white border-slate-200 text-sm",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "todos",
										children: "Tipo: Todos"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "entrada",
										children: "Entradas"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "salida",
										children: "Salidas"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "reposicion",
										children: "Reposiciones"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "ajuste",
										children: "Ajustes"
									})
								] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: filtroPeriodo,
								onValueChange: (v) => {
									setFiltroPeriodo(v);
									setPagina(1);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									className: "w-[160px] h-10 bg-white border-slate-200 text-sm",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "todos",
										children: "Período: Todos"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "hoy",
										children: "Hoy"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "7d",
										children: "Últimos 7 días"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "30d",
										children: "Últimos 30 días"
									})
								] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "ghost",
								size: "sm",
								onClick: limpiarFiltros,
								className: "text-xs text-slate-600 gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "w-3.5 h-3.5" }), "Limpiar"]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "bg-white rounded-xl border border-slate-200 overflow-hidden",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, {
							className: "bg-slate-50/80 border-b border-slate-200",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
								className: "hover:bg-transparent",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
										className: "text-xs font-bold uppercase tracking-wider text-slate-600",
										children: "Fecha / Hora"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
										className: "text-xs font-bold uppercase tracking-wider text-slate-600",
										children: "Tipo"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
										className: "text-xs font-bold uppercase tracking-wider text-slate-600",
										children: "Producto & SKU"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
										className: "text-xs font-bold uppercase tracking-wider text-slate-600",
										children: "Cantidad"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
										className: "text-xs font-bold uppercase tracking-wider text-slate-600",
										children: "Ubicación"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
										className: "text-xs font-bold uppercase tracking-wider text-slate-600",
										children: "Usuario"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
										className: "text-xs font-bold uppercase tracking-wider text-slate-600",
										children: "Motivo"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
										className: "text-xs font-bold uppercase tracking-wider text-slate-600 text-right",
										children: "Acciones"
									})
								]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, {
							className: "divide-y divide-slate-100",
							children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								colSpan: 8,
								className: "h-32 text-center text-slate-500",
								children: "Cargando movimientos desde Supabase..."
							}) }) : paginados.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								colSpan: 8,
								className: "h-32 text-center text-slate-500",
								children: "No hay movimientos con los filtros seleccionados."
							}) }) : paginados.map((m) => {
								const info = TIPO_INFO[m.tipo];
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
									className: "hover:bg-slate-50/80 transition-colors",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-col",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs font-bold text-slate-800",
												children: fmtHora(m.fecha)
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[11px] text-slate-500",
												children: fmtFecha(m.fecha)
											})]
										}) }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											className: `${info.badge} text-xs font-medium`,
											children: info.label
										}) }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-col min-w-0",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs font-semibold text-slate-800 truncate max-w-[220px]",
												children: m.producto?.nombre ?? "Producto eliminado"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[11px] font-mono text-slate-500",
												children: m.producto?.sku ?? "—"
											})]
										}) }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: `text-xs font-bold ${info.texto}`,
											children: [info.signo, m.cantidad]
										}) }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
											className: "text-xs text-slate-700",
											children: m.ubicacion?.codigo ?? "—"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
											className: "text-xs text-slate-700",
											children: m.usuario?.nombre ?? "—"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
											className: "text-xs text-slate-600 max-w-[180px] truncate",
											children: m.motivo ?? "—"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
											className: "text-right",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "ghost",
												size: "sm",
												onClick: () => setDetalle(m),
												className: "h-8 w-8 p-0 text-slate-500 hover:text-slate-800 hover:bg-slate-100",
												title: "Ver detalle",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "w-4 h-4" })
											})
										})
									]
								}, m.id);
							})
						})] })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							"Mostrando",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: "text-slate-800",
								children: movimientosFiltrados.length === 0 ? 0 : (pagina - 1) * porPagina + 1
							}),
							" ",
							"a",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: "text-slate-800",
								children: Math.min(pagina * porPagina, movimientosFiltrados.length)
							}),
							" ",
							"de ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: "text-slate-800",
								children: movimientosFiltrados.length
							}),
							" movimientos"
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: String(porPagina),
									onValueChange: (v) => {
										setPorPagina(Number(v));
										setPagina(1);
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										className: "w-[70px] h-8 bg-white border-slate-200 text-xs",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "8",
											children: "8"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "16",
											children: "16"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "32",
											children: "32"
										})
									] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									size: "sm",
									onClick: () => setPagina((p) => Math.max(1, p - 1)),
									disabled: pagina === 1,
									className: "h-8 text-xs border-slate-200",
									children: "Anterior"
								}),
								Array.from({ length: totalPaginas }, (_, i) => i + 1).slice(0, 7).map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: pagina === n ? "default" : "outline",
									size: "sm",
									onClick: () => setPagina(n),
									className: `h-8 w-8 p-0 text-xs font-semibold ${pagina === n ? "bg-[#D24D09] hover:bg-[#b83f05] text-white border-transparent" : "border-slate-200 text-slate-700"}`,
									children: n
								}, n)),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									size: "sm",
									onClick: () => setPagina((p) => Math.min(totalPaginas, p + 1)),
									disabled: pagina === totalPaginas,
									className: "h-8 text-xs border-slate-200",
									children: "Siguiente"
								})
							]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: modalNuevo,
				onOpenChange: setModalNuevo,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-lg",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
						className: "text-base font-bold text-slate-900",
						children: "Registrar Movimiento"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, {
						className: "text-xs text-slate-500",
						children: [
							"El stock se actualizará automáticamente mediante el trigger",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
								className: "bg-slate-100 px-1 rounded",
								children: "actualizar_stock"
							}),
							". Nunca se escribe directamente en la tabla stock."
						]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleCrear,
						className: "space-y-3.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-xs font-semibold text-slate-700",
										children: "Tipo *"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: formTipo,
										onValueChange: (v) => setFormTipo(v),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "h-9 text-xs",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "entrada",
												children: "Entrada (+ stock)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "salida",
												children: "Salida (− stock)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "reposicion",
												children: "Reposición (+ stock)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "ajuste",
												children: "Ajuste (= stock absoluto)"
											})
										] })]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-xs font-semibold text-slate-700",
										children: formTipo === "ajuste" ? "Stock objetivo *" : "Cantidad *"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "number",
										min: 0,
										value: formCantidad,
										onChange: (e) => setFormCantidad(e.target.value === "" ? "" : Number(e.target.value)),
										placeholder: formTipo === "ajuste" ? "Nuevo stock total" : "Ej: 10",
										className: "h-9 text-xs",
										required: true
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-xs font-semibold text-slate-700",
									children: "Producto *"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: formProducto,
									onValueChange: setFormProducto,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										className: "h-9 text-xs",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Selecciona producto" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, {
										className: "max-h-[220px]",
										children: productos.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
											value: p.id,
											children: [
												p.nombre,
												" · ",
												p.sku
											]
										}, p.id))
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-xs font-semibold text-slate-700",
									children: "Ubicación *"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: formUbicacion,
									onValueChange: setFormUbicacion,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										className: "h-9 text-xs",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Selecciona ubicación" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, {
										className: "max-h-[220px]",
										children: ubicaciones.map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: u.id,
											children: u.codigo
										}, u.id))
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-xs font-semibold text-slate-700",
									children: "Motivo"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: formMotivo,
									onChange: (e) => setFormMotivo(e.target.value),
									placeholder: "Ej: Recepción proveedor, venta mostrador...",
									className: "h-9 text-xs"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								size: "sm",
								onClick: () => setModalNuevo(false),
								children: "Cancelar"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								size: "sm",
								className: "bg-[#D24D09] hover:bg-[#b83f05] text-white text-xs",
								disabled: mutationCrear.isPending,
								children: mutationCrear.isPending ? "Registrando..." : "Registrar Movimiento"
							})] })
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: Boolean(detalle),
				onOpenChange: (open) => !open && setDetalle(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-md",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
							className: "text-base font-bold text-slate-900",
							children: "Detalle del Movimiento"
						}) }),
						detalle && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2.5 text-xs",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/50",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-slate-500",
										children: "Tipo"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "outline",
										className: `${TIPO_INFO[detalle.tipo].badge} text-xs`,
										children: TIPO_INFO[detalle.tipo].label
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/50",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-slate-500",
										children: "Cantidad"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: `font-bold ${TIPO_INFO[detalle.tipo].texto}`,
										children: [TIPO_INFO[detalle.tipo].signo, detalle.cantidad]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/50",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-slate-500",
										children: "Fecha"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-semibold text-slate-800",
										children: [
											fmtFecha(detalle.fecha),
											" · ",
											fmtHora(detalle.fecha)
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/50",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-slate-500",
										children: "Producto"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-semibold text-slate-800 text-right",
										children: [detalle.producto?.nombre ?? "—", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block font-mono text-[10px] text-slate-500",
											children: detalle.producto?.sku ?? ""
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/50",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-slate-500",
										children: "Ubicación"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold text-slate-800",
										children: detalle.ubicacion?.codigo ?? "—"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/50",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-slate-500",
										children: "Usuario"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold text-slate-800",
										children: detalle.usuario?.nombre ?? "—"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-2.5 rounded-lg border border-slate-200 bg-slate-50/50",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-slate-500 block mb-1",
										children: "Motivo"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold text-slate-800",
										children: detalle.motivo ?? "—"
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							size: "sm",
							onClick: () => setDetalle(null),
							children: "Cerrar"
						}) })
					]
				})
			})
		]
	});
}
//#endregion
export { MovimientosPage as component };
