import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as require_jsx_runtime, d as DialogContent, f as DialogDescription, h as DialogTitle, l as Dialog, m as DialogPortal, p as DialogOverlay, u as DialogClose } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { r as cn, t as Button } from "./button-B4mHfPXK.mjs";
import { $ as Calendar, D as MapPin, E as Minus, F as Funnel, I as FolderTree, Q as Camera, R as FileSpreadsheet, T as Package, U as Database, X as ChevronDown, Y as ChevronRight, b as Printer, c as Trash2, d as SlidersHorizontal, et as Building2, i as User, j as List, m as Search, n as Warehouse, o as TriangleAlert, ot as ArrowLeftRight, p as ShieldAlert, rt as Barcode, t as X, tt as Boxes, u as Sparkles, x as Plus, y as RefreshCw } from "../_libs/lucide-react.mjs";
import { a as DialogFooter, i as DialogDescription$1, n as Dialog$1, o as DialogHeader, r as DialogContent$1, s as DialogTitle$1, t as Badge } from "./dialog-CkqkUyDr.mjs";
import { t as Input } from "./input-CiJ2rg3V.mjs";
import { t as Label } from "./label-CfMjnYjw.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./alert-dialog-Dgw77DMg.mjs";
import { r as supabase } from "./supabase-BJUFiUL8.mjs";
import { _ as getStockPorUbicaciones, a as crearPaletBD, b as sincronizarEstructuraInicialSupabase, c as darDeBajaPaletBD, d as desactivarUbicacionBD, g as getSecciones, h as getProductos, m as getPalets, s as crearUbicacionBD, y as getUbicacionesCompletas } from "./inventario-Dm5VVMa5.mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as CONFIG_JERARQUIA } from "./ubicaciones-jP8x7QJc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ubicaciones-tDQx8cvr.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Sheet = Dialog;
var SheetPortal = DialogPortal;
var SheetOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props,
	ref
}));
SheetOverlay.displayName = DialogOverlay.displayName;
var sheetVariants = cva("fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out", {
	variants: { side: {
		top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
		bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
		left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
		right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
	} },
	defaultVariants: { side: "right" }
});
var SheetContent = import_react.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
	ref,
	className: cn(sheetVariants({ side }), className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	}), children]
})] }));
SheetContent.displayName = DialogContent.displayName;
var SheetHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-2 text-center sm:text-left", className),
	...props
});
SheetHeader.displayName = "SheetHeader";
var SheetFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
SheetFooter.displayName = "SheetFooter";
var SheetTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
	ref,
	className: cn("text-lg font-semibold text-foreground", className),
	...props
}));
SheetTitle.displayName = DialogTitle.displayName;
var SheetDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
SheetDescription.displayName = DialogDescription.displayName;
function Escaner({ onCodigo, onCerrar }) {
	const id = `scanner-${(0, import_react.useId)().replace(/:/g, "")}`;
	const [error, setError] = (0, import_react.useState)("");
	const [manual, setManual] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		let cancelado = false;
		let iniciado = false;
		let scanner;
		let ocupado = false;
		const iniciar = async () => {
			try {
				const { Html5Qrcode } = await import("../_libs/html5-qrcode.mjs").then((n) => n.t);
				if (cancelado) return;
				scanner = new Html5Qrcode(id);
				await scanner.start({ facingMode: "environment" }, {
					fps: 10,
					qrbox: {
						width: 250,
						height: 150
					}
				}, (codigo) => {
					if (!cancelado && !ocupado) {
						ocupado = true;
						onCodigo(codigo);
					}
				}, () => {});
				iniciado = true;
				if (cancelado) {
					await scanner.stop();
					scanner.clear();
				}
			} catch {
				if (!cancelado) setError("No se pudo abrir la cámara. Revisa el permiso o introduce el código manualmente.");
			}
		};
		iniciar();
		return () => {
			cancelado = true;
			if (scanner && iniciado) scanner.stop().then(() => scanner?.clear()).catch(() => {});
		};
	}, [id, onCodigo]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				id,
				className: "min-h-48 w-full overflow-hidden"
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				role: "alert",
				className: "text-sm text-destructive",
				children: error
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: `${id}-manual`,
					children: "Código de barras"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id: `${id}-manual`,
					value: manual,
					onChange: (e) => setManual(e.target.value)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex justify-end gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: onCerrar,
					children: "Cancelar"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					disabled: !manual.trim(),
					onClick: () => onCodigo(manual.trim()),
					children: "Usar código"
				})]
			})
		]
	});
}
var CATALOGO_PRODUCTOS_MOCK = [
	{
		id: "p1",
		sku: "LAT-4001-WHT",
		nombre: "Látex Extracubriente Blanco Mate 15L",
		categoria: "Pinturas de Exterior",
		cantidad: 48,
		stock_minimo: 20
	},
	{
		id: "p2",
		sku: "ESM-1020-BLK",
		nombre: "Esmalte Sintético Negro Satinado 4L",
		categoria: "Esmaltes & Sintéticos",
		cantidad: 24,
		stock_minimo: 10
	},
	{
		id: "p3",
		sku: "LAT-4002-GRY",
		nombre: "Revestimiento Elastomérico Gris Cemento 10L",
		categoria: "Pinturas de Exterior",
		cantidad: 20,
		stock_minimo: 15
	},
	{
		id: "p4",
		sku: "SEL-3108-ACR",
		nombre: "Primer Acrílico Sellador Antihumedad 5L",
		categoria: "Pinturas & Selladores",
		cantidad: 37,
		stock_minimo: 15
	},
	{
		id: "p5",
		sku: "HID-9010-TRN",
		nombre: "Hidrorepelente Siliconado Fachadas 4L",
		categoria: "Pinturas de Exterior",
		cantidad: 30,
		stock_minimo: 10
	},
	{
		id: "p6",
		sku: "HER-8820-ROD",
		nombre: "Rodillo Antigota Microfibra Pro 25cm",
		categoria: "Herramientas",
		cantidad: 14,
		stock_minimo: 20
	},
	{
		id: "p7",
		sku: "HER-1102-BRO",
		nombre: "Brocha Cerda Natural Pintor 3 pulgadas",
		categoria: "Herramientas",
		cantidad: 10,
		stock_minimo: 15
	},
	{
		id: "p8",
		sku: "ESM-2040-BLU",
		nombre: "Esmalte Marino Azul Cobalto 4L",
		categoria: "Esmaltes & Sintéticos",
		cantidad: 65,
		stock_minimo: 20
	},
	{
		id: "p9",
		sku: "ESM-3011-RED",
		nombre: "Antióxido Minio Alquídico 4L",
		categoria: "Esmaltes & Sintéticos",
		cantidad: 80,
		stock_minimo: 25
	},
	{
		id: "p10",
		sku: "SOL-9902-STD",
		nombre: "Thinner Universal Extra Calidad 10L",
		categoria: "Solventes & Químicos",
		cantidad: 42,
		stock_minimo: 20
	},
	{
		id: "p11",
		sku: "SOL-1120-AGU",
		nombre: "Aguarrás Mineral Desodorizado 5L",
		categoria: "Solventes & Químicos",
		cantidad: 36,
		stock_minimo: 15
	},
	{
		id: "p12",
		sku: "SAN-1001-VAL",
		nombre: "Válvula de Descarga Inodoro Doble Pulsador",
		categoria: "Sanitario",
		cantidad: 15,
		stock_minimo: 8
	},
	{
		id: "p13",
		sku: "FER-5500-TOR",
		nombre: "Tornillo Rosca Madera 4x40mm (Caja 500u)",
		categoria: "Ferretería",
		cantidad: 60,
		stock_minimo: 30
	}
];
var UBICACIONES_INICIALES = [
	{
		id: "sec-pintura",
		codigo: "SEC-PIN",
		nombre: "Pintura",
		tipo: "seccion",
		nivel: 0,
		activo: true,
		subtitulo: "Área central de pinturas, solventes y herramientas",
		productos: []
	},
	{
		id: "pas-a1",
		codigo: "A1",
		nombre: "Pasillo A1 (Látex & Fachadas)",
		tipo: "pasillo",
		nivel: 1,
		seccion_id: "sec-pintura",
		id_padre: "sec-pintura",
		activo: true,
		subtitulo: "Estanterías de alta resistencia",
		productos: []
	},
	{
		id: "pos-a1-01",
		codigo: "A1-01",
		nombre: "Armario A1-01",
		tipo: "armario",
		nivel: 2,
		id_padre: "pas-a1",
		seccion_id: "sec-pintura",
		lateral: "R",
		piso: 1,
		capacidad_max: 100,
		peso_max_kg: 400,
		porcentaje_ocupacion: 92,
		activo: true,
		subtitulo: "3 productos · 92 uds (Látex Exterior 15L, Esmalte...)",
		productos: [
			{
				id: "p1",
				sku: "LAT-4001-WHT",
				nombre: "Látex Extracubriente Blanco Mate 15L",
				categoria: "Pinturas de Exterior",
				cantidad: 48,
				stock_minimo: 20
			},
			{
				id: "p2",
				sku: "ESM-1020-BLK",
				nombre: "Esmalte Sintético Negro Satinado 4L",
				categoria: "Esmaltes & Sintéticos",
				cantidad: 24,
				stock_minimo: 10
			},
			{
				id: "p3",
				sku: "LAT-4002-GRY",
				nombre: "Revestimiento Elastomérico Gris Cemento 10L",
				categoria: "Pinturas de Exterior",
				cantidad: 20,
				stock_minimo: 15
			}
		]
	},
	{
		id: "pos-a1-02",
		codigo: "A1-02",
		nombre: "Alto A1-02",
		tipo: "alto",
		nivel: 2,
		id_padre: "pas-a1",
		seccion_id: "sec-pintura",
		lateral: "R",
		piso: 2,
		capacidad_max: 80,
		peso_max_kg: 350,
		porcentaje_ocupacion: 80,
		activo: true,
		subtitulo: "2 productos · 67 uds (Selladores, Hidrorepelentes)",
		productos: [{
			id: "p4",
			sku: "SEL-3108-ACR",
			nombre: "Primer Acrílico Sellador Antihumedad 5L",
			categoria: "Pinturas & Selladores",
			cantidad: 37,
			stock_minimo: 15
		}, {
			id: "p5",
			sku: "HID-9010-TRN",
			nombre: "Hidrorepelente Siliconado Fachadas 4L",
			categoria: "Pinturas de Exterior",
			cantidad: 30,
			stock_minimo: 10
		}]
	},
	{
		id: "pos-a1-03",
		codigo: "A1-03",
		nombre: "Cross A1-03",
		tipo: "cross",
		nivel: 2,
		id_padre: "pas-a1",
		seccion_id: "sec-pintura",
		lateral: "C",
		piso: 1,
		capacidad_max: 90,
		peso_max_kg: 500,
		porcentaje_ocupacion: 65,
		activo: true,
		subtitulo: "Cruce de rotación inmediata",
		productos: [{
			id: "p10",
			sku: "SOL-9902-STD",
			nombre: "Thinner Universal Extra Calidad 10L",
			categoria: "Solventes & Químicos",
			cantidad: 42,
			stock_minimo: 20
		}]
	},
	{
		id: "pas-a2",
		codigo: "A2",
		nombre: "Pasillo A2 (Esmaltes & Barnices)",
		tipo: "pasillo",
		nivel: 1,
		seccion_id: "sec-pintura",
		id_padre: "sec-pintura",
		activo: true,
		subtitulo: "Líneas de madera y metales",
		productos: []
	},
	{
		id: "pos-a2-01",
		codigo: "A2-01",
		nombre: "Armario A2-01",
		tipo: "armario",
		nivel: 2,
		id_padre: "pas-a2",
		seccion_id: "sec-pintura",
		lateral: "R",
		piso: 1,
		capacidad_max: 160,
		peso_max_kg: 500,
		porcentaje_ocupacion: 88,
		activo: true,
		subtitulo: "2 productos · 145 uds (Acabado Brillo, Mate)",
		productos: [{
			id: "p8",
			sku: "ESM-2040-BLU",
			nombre: "Esmalte Marino Azul Cobalto 4L",
			categoria: "Esmaltes & Sintéticos",
			cantidad: 65,
			stock_minimo: 20
		}, {
			id: "p9",
			sku: "ESM-3011-RED",
			nombre: "Antióxido Minio Alquídico 4L",
			categoria: "Esmaltes & Sintéticos",
			cantidad: 80,
			stock_minimo: 25
		}]
	},
	{
		id: "caj-01",
		codigo: "CAJA-01",
		nombre: "Caja 01 - Brochas y Accesorios",
		tipo: "caja",
		nivel: 1,
		seccion_id: "sec-pintura",
		activo: true,
		capacidad_max: 60,
		peso_max_kg: 150,
		porcentaje_ocupacion: 40,
		subtitulo: "2 productos · 24 uds (Brochas Pro, Rodillos)",
		productos: [{
			id: "p6",
			sku: "HER-8820-ROD",
			nombre: "Rodillo Antigota Microfibra Pro 25cm",
			categoria: "Herramientas",
			cantidad: 14,
			stock_minimo: 20
		}, {
			id: "p7",
			sku: "HER-1102-BRO",
			nombre: "Brocha Cerda Natural Pintor 3 pulgadas",
			categoria: "Herramientas",
			cantidad: 10,
			stock_minimo: 15
		}]
	},
	{
		id: "res-gen",
		codigo: "RES-TIENDA",
		nombre: "Reserva General (Almacén de Tienda)",
		tipo: "reserva",
		nivel: 1,
		seccion_id: "sec-pintura",
		activo: true,
		porcentaje_ocupacion: 45,
		subtitulo: "Gestión oficial de Palets con asignación automática y etiqueta",
		productos: []
	},
	{
		id: "sec-sanitario",
		codigo: "SEC-SAN",
		nombre: "Sanitario",
		tipo: "seccion",
		nivel: 0,
		activo: true,
		subtitulo: "Fontanería, grifería y porcelana sanitaria",
		productos: []
	},
	{
		id: "pas-s1",
		codigo: "S1",
		nombre: "Pasillo S1 (Fontanería & Válvulas)",
		tipo: "pasillo",
		nivel: 1,
		seccion_id: "sec-sanitario",
		id_padre: "sec-sanitario",
		activo: true,
		subtitulo: "Repuestos y llaves de corte",
		productos: []
	},
	{
		id: "pos-s1-01",
		codigo: "S1-01",
		nombre: "Armario S1-01",
		tipo: "armario",
		nivel: 2,
		id_padre: "pas-s1",
		seccion_id: "sec-sanitario",
		lateral: "L",
		piso: 1,
		capacidad_max: 100,
		peso_max_kg: 300,
		porcentaje_ocupacion: 30,
		activo: true,
		subtitulo: "1 producto · 15 uds",
		productos: [{
			id: "p12",
			sku: "SAN-1001-VAL",
			nombre: "Válvula de Descarga Inodoro Doble Pulsador",
			categoria: "Sanitario",
			cantidad: 15,
			stock_minimo: 8
		}]
	},
	{
		id: "sec-cocinas",
		codigo: "SEC-COC",
		nombre: "Armarios y Cocinas",
		tipo: "seccion",
		nivel: 0,
		activo: true,
		subtitulo: "Módulos, herrajes de ensamble y tiradores",
		productos: []
	},
	{
		id: "pas-k1",
		codigo: "K1",
		nombre: "Pasillo K1 (Módulos & Frentes)",
		tipo: "pasillo",
		nivel: 1,
		seccion_id: "sec-cocinas",
		id_padre: "sec-cocinas",
		activo: true,
		subtitulo: "Estructuras modulares en kit",
		productos: []
	},
	{
		id: "sec-ferreteria",
		codigo: "SEC-FER",
		nombre: "Ferretería",
		tipo: "seccion",
		nivel: 0,
		activo: true,
		subtitulo: "Tornillería, anclajes y fijaciones de seguridad",
		productos: []
	},
	{
		id: "pas-f1",
		codigo: "F1",
		nombre: "Pasillo F1 (Tornillería Industrial)",
		tipo: "pasillo",
		nivel: 1,
		seccion_id: "sec-ferreteria",
		id_padre: "sec-ferreteria",
		activo: true,
		subtitulo: "Cajones de anclajes métricos y fijación pesada",
		productos: []
	},
	{
		id: "pos-f1-01",
		codigo: "F1-01",
		nombre: "Armario F1-01",
		tipo: "armario",
		nivel: 2,
		id_padre: "pas-f1",
		seccion_id: "sec-ferreteria",
		lateral: "R",
		piso: 1,
		capacidad_max: 200,
		peso_max_kg: 800,
		porcentaje_ocupacion: 30,
		activo: true,
		subtitulo: "1 producto · 60 uds",
		productos: [{
			id: "p13",
			sku: "FER-5500-TOR",
			nombre: "Tornillo Rosca Madera 4x40mm (Caja 500u)",
			categoria: "Ferretería",
			cantidad: 60,
			stock_minimo: 30
		}]
	}
];
var PALETS_INICIALES = [{
	id: "pal-001",
	id_reserva: "res-gen",
	numero_palet: 1,
	codigo_barras: "PAL-001-Javier-27102026",
	generado_por: "Javier Vendedor",
	generado_en: "2026-10-27T08:30:00.000Z",
	activo: true,
	productos: [{
		id: "p1",
		sku: "LAT-4001-WHT",
		nombre: "Látex Extracubriente Blanco Mate 15L",
		categoria: "Pinturas de Exterior",
		cantidad: 32,
		stock_minimo: 10
	}, {
		id: "p4",
		sku: "SEL-3108-ACR",
		nombre: "Primer Acrílico Sellador Antihumedad 5L",
		categoria: "Pinturas & Selladores",
		cantidad: 20,
		stock_minimo: 10
	}]
}, {
	id: "pal-002",
	id_reserva: "res-gen",
	numero_palet: 2,
	codigo_barras: "PAL-002-Javier-27102026",
	generado_por: "Javier Vendedor",
	generado_en: "2026-10-27T09:15:00.000Z",
	activo: true,
	productos: [{
		id: "p8",
		sku: "ESM-2040-BLU",
		nombre: "Esmalte Marino Azul Cobalto 4L",
		categoria: "Esmaltes & Sintéticos",
		cantidad: 18,
		stock_minimo: 10
	}]
}];
function UbicacionesPage() {
	const queryClient = useQueryClient();
	const { data: seccionesBD = [] } = useQuery({
		queryKey: ["secciones"],
		queryFn: getSecciones
	});
	const { data: ubicacionesBD = [] } = useQuery({
		queryKey: ["ubicacionesCompletas"],
		queryFn: getUbicacionesCompletas
	});
	const { data: paletsBD = [] } = useQuery({
		queryKey: ["palets"],
		queryFn: getPalets
	});
	const { data: stockBD = [] } = useQuery({
		queryKey: ["stock"],
		queryFn: getStockPorUbicaciones
	});
	const { data: productosBD = [] } = useQuery({
		queryKey: ["productos"],
		queryFn: getProductos
	});
	const catalogoDisponible = (0, import_react.useMemo)(() => {
		if (productosBD.length > 0) return productosBD.map((p) => ({
			id: p.id,
			sku: p.sku || `PROD-${p.id.slice(0, 6)}`,
			nombre: p.nombre,
			categoria: p.categoria || "Pinturas",
			cantidad: Number(p.stock_actual || 0),
			stock_minimo: Number(p.stock_minimo || 5)
		}));
		return CATALOGO_PRODUCTOS_MOCK;
	}, [productosBD]);
	const ubicacionesCombinadas = (0, import_react.useMemo)(() => {
		if (ubicacionesBD.length > 0 || seccionesBD.length > 0) {
			const items = [];
			seccionesBD.forEach((sec) => {
				items.push({
					id: sec.id,
					codigo: sec.codigo || (sec.nombre.toLowerCase().includes("pintura") ? "SEC-PIN" : `SEC-${sec.nombre.slice(0, 3).toUpperCase()}`),
					nombre: sec.nombre,
					tipo: "seccion",
					nivel: 0,
					activo: sec.activo ?? true,
					subtitulo: sec.descripcion || "Área principal de almacén",
					productos: []
				});
			});
			ubicacionesBD.forEach((u) => {
				const tipo = u.tipo || "armario";
				const config = CONFIG_JERARQUIA[tipo] || CONFIG_JERARQUIA.armario;
				const prodsEnUbi = stockBD.filter((s) => s.id_ubicacion === u.id).map((stk) => {
					const prod = productosBD.find((p) => p.id === stk.id_producto);
					return {
						id: stk.id_producto,
						sku: prod?.sku || "SKU-GEN",
						nombre: prod?.nombre || "Producto",
						categoria: prod?.categoria || "Pintura",
						cantidad: stk.cantidad,
						stock_minimo: prod?.stock_minimo || 5
					};
				});
				const totalUds = prodsEnUbi.reduce((acc, p) => acc + p.cantidad, 0);
				const cap = 100;
				const pct = Math.min(100, Math.round(totalUds / cap * 100));
				items.push({
					id: u.id,
					codigo: u.codigo || u.nombre.toUpperCase().replace(/\s+/g, "-").slice(0, 10),
					nombre: u.nombre,
					tipo,
					nivel: config.nivel,
					id_padre: u.id_ubicacion_padre || u.seccion || null,
					seccion_id: u.seccion || u.seccion_id || null,
					lateral: u.posicion_lateral || "R",
					piso: u.numero || 1,
					capacidad_max: cap,
					peso_max_kg: 400,
					porcentaje_ocupacion: pct,
					activo: u.activo ?? true,
					subtitulo: prodsEnUbi.length > 0 ? `${prodsEnUbi.length} productos · ${totalUds} uds` : u.descripcion || config.descripcion,
					productos: prodsEnUbi
				});
			});
			return items;
		}
		return UBICACIONES_INICIALES;
	}, [
		seccionesBD,
		ubicacionesBD,
		stockBD,
		productosBD
	]);
	const paletsCombinados = (0, import_react.useMemo)(() => {
		if (paletsBD.length > 0) return paletsBD.map((p) => {
			const prods = stockBD.filter((s) => s.id_palet === p.id).map((s) => {
				const prod = productosBD.find((pr) => pr.id === s.id_producto);
				return {
					id: s.id_producto,
					sku: prod?.sku || "SKU-GEN",
					nombre: prod?.nombre || "Producto",
					categoria: prod?.categoria || "Pintura",
					cantidad: s.cantidad,
					stock_minimo: prod?.stock_minimo || 5
				};
			});
			return {
				id: p.id,
				id_reserva: p.id_reserva,
				numero_palet: p.numero_palet,
				codigo_barras: p.codigo_barras,
				generado_por: p.generado_por || "Personal Tienda",
				generado_en: p.generado_en || p.creado_en || (/* @__PURE__ */ new Date()).toISOString(),
				activo: p.activo,
				productos: prods.length > 0 ? prods : [{
					id: "p1",
					sku: "LAT-4001-WHT",
					nombre: "Látex Extracubriente Blanco Mate 15L",
					categoria: "Pinturas de Exterior",
					cantidad: 24,
					stock_minimo: 10
				}]
			};
		});
		return PALETS_INICIALES;
	}, [
		paletsBD,
		stockBD,
		productosBD
	]);
	const [ubicaciones, setUbicaciones] = (0, import_react.useState)(UBICACIONES_INICIALES);
	const [palets, setPalets] = (0, import_react.useState)(PALETS_INICIALES);
	(0, import_react.useEffect)(() => {
		if (ubicacionesCombinadas.length > 0) setUbicaciones(ubicacionesCombinadas);
	}, [ubicacionesCombinadas]);
	(0, import_react.useEffect)(() => {
		if (paletsCombinados.length > 0) setPalets(paletsCombinados);
	}, [paletsCombinados]);
	const [vista, setVista] = (0, import_react.useState)("arbol");
	const [busqueda, setBusqueda] = (0, import_react.useState)("");
	const [filtroTipo, setFiltroTipo] = (0, import_react.useState)("todos");
	const [sincronizando, setSincronizando] = (0, import_react.useState)(false);
	const [expandidos, setExpandidos] = (0, import_react.useState)({
		"sec-pintura": true,
		"pas-a1": true,
		"pas-a2": true,
		"res-gen": true,
		"sec-sanitario": true,
		"pas-s1": true,
		"sec-cocinas": false,
		"sec-ferreteria": true,
		"pas-f1": true
	});
	const [sheetVendedorAbierto, setSheetVendedorAbierto] = (0, import_react.useState)(false);
	const [ubicacionSeleccionada, setUbicacionSeleccionada] = (0, import_react.useState)(null);
	const [mostrarEscaner, setMostrarEscaner] = (0, import_react.useState)(false);
	const [busquedaProducto, setBusquedaProducto] = (0, import_react.useState)("");
	const [dropdownAbierto, setDropdownAbierto] = (0, import_react.useState)(false);
	const [indiceSugerencia, setIndiceSugerencia] = (0, import_react.useState)(0);
	const [productoParaIncluir, setProductoParaIncluir] = (0, import_react.useState)(null);
	const [cantidadParaIncluir, setCantidadParaIncluir] = (0, import_react.useState)(5);
	const [alertOperacionAbierta, setAlertOperacionAbierta] = (0, import_react.useState)(false);
	const [tipoOperacion, setTipoOperacion] = (0, import_react.useState)("anadir");
	const [productoEnOperacion, setProductoEnOperacion] = (0, import_react.useState)(null);
	const [cantidadOperacion, setCantidadOperacion] = (0, import_react.useState)(1);
	const [motivoOperacion, setMotivoOperacion] = (0, import_react.useState)("Gestión en tienda");
	const [modalEtiquetaPaletAbierto, setModalEtiquetaPaletAbierto] = (0, import_react.useState)(false);
	const [paletParaImprimir, setPaletParaImprimir] = (0, import_react.useState)(null);
	const [paletSeleccionadoParaGestion, setPaletSeleccionadoParaGestion] = (0, import_react.useState)(null);
	const [modalGestionPaletAbierto, setModalGestionPaletAbierto] = (0, import_react.useState)(false);
	const [formNombre, setFormNombre] = (0, import_react.useState)("Armario A1-04");
	const [formTipo, setFormTipo] = (0, import_react.useState)("armario");
	const [formPadre, setFormPadre] = (0, import_react.useState)("pas-a1");
	const [formLateral, setFormLateral] = (0, import_react.useState)("R");
	const [formPiso, setFormPiso] = (0, import_react.useState)(1);
	const [formCapMax, setFormCapMax] = (0, import_react.useState)(120);
	const [formPesoMax, setFormPesoMax] = (0, import_react.useState)(450);
	const [ubicacionParaEliminar, setUbicacionParaEliminar] = (0, import_react.useState)(null);
	const [dialogEliminarAbierto, setDialogEliminarAbierto] = (0, import_react.useState)(false);
	const toggleExpandir = (id) => {
		setExpandidos((prev) => ({
			...prev,
			[id]: !prev[id]
		}));
	};
	const todosExpandidos = (0, import_react.useMemo)(() => {
		return Object.values(expandidos).every(Boolean);
	}, [expandidos]);
	const toggleExpandirColapsarTodo = () => {
		const nuevoEstado = !todosExpandidos;
		const nuevoMapa = {};
		ubicaciones.forEach((u) => {
			nuevoMapa[u.id] = nuevoEstado;
		});
		setExpandidos(nuevoMapa);
		toast.info(nuevoEstado ? "Todas las ubicaciones expandidas" : "Todas las ubicaciones colapsadas");
	};
	const secciones = (0, import_react.useMemo)(() => ubicaciones.filter((u) => u.tipo === "seccion"), [ubicaciones]);
	const pasillosDeSeccion = (0, import_react.useCallback)((idSeccion) => ubicaciones.filter((u) => u.tipo === "pasillo" && (u.seccion_id === idSeccion || u.id_padre === idSeccion)), [ubicaciones]);
	const posicionesDePasillo = (0, import_react.useCallback)((idPasillo) => ubicaciones.filter((u) => u.id_padre === idPasillo && [
		"armario",
		"alto",
		"cross"
	].includes(u.tipo)), [ubicaciones]);
	const cajasDeSeccion = (0, import_react.useCallback)((idSeccion) => ubicaciones.filter((u) => u.tipo === "caja" && (u.seccion_id === idSeccion || u.id_padre === idSeccion)), [ubicaciones]);
	const reservasDeSeccion = (0, import_react.useCallback)((idSeccion) => ubicaciones.filter((u) => u.tipo === "reserva" && (u.seccion_id === idSeccion || u.id_padre === idSeccion)), [ubicaciones]);
	const itemCoincideBusqueda = (0, import_react.useCallback)((item, q) => {
		if (!q.trim()) return true;
		const term = q.toLowerCase().trim();
		if (item.nombre.toLowerCase().includes(term)) return true;
		if (item.codigo.toLowerCase().includes(term)) return true;
		if (item.subtitulo && item.subtitulo.toLowerCase().includes(term)) return true;
		return (item.productos || []).some((p) => p.nombre.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term) || p.categoria.toLowerCase().includes(term));
	}, []);
	const matchPosicion = (0, import_react.useCallback)((pos) => {
		const coincideTipo = filtroTipo === "todos" || pos.tipo === filtroTipo;
		const coincideBusqueda = itemCoincideBusqueda(pos, busqueda);
		return coincideTipo && coincideBusqueda;
	}, [
		filtroTipo,
		busqueda,
		itemCoincideBusqueda
	]);
	const posicionesVisiblesDePasillo = (0, import_react.useCallback)((idPasillo) => {
		const todasPos = posicionesDePasillo(idPasillo);
		if (filtroTipo === "pasillo") return todasPos.filter((p) => itemCoincideBusqueda(p, busqueda));
		return todasPos.filter(matchPosicion);
	}, [
		filtroTipo,
		busqueda,
		itemCoincideBusqueda,
		matchPosicion,
		posicionesDePasillo
	]);
	const pasilloVisible = (0, import_react.useCallback)((pas) => {
		const coincideBusquedaPropia = itemCoincideBusqueda(pas, busqueda);
		const posVisibles = posicionesVisiblesDePasillo(pas.id);
		if (filtroTipo === "todos") return coincideBusquedaPropia || posVisibles.length > 0;
		if (filtroTipo === "pasillo") return coincideBusquedaPropia;
		if ([
			"armario",
			"alto",
			"cross"
		].includes(filtroTipo)) return posVisibles.length > 0;
		return false;
	}, [
		filtroTipo,
		busqueda,
		itemCoincideBusqueda,
		posicionesVisiblesDePasillo
	]);
	const cajaVisible = (0, import_react.useCallback)((caja) => {
		return (filtroTipo === "todos" || filtroTipo === "caja") && itemCoincideBusqueda(caja, busqueda);
	}, [
		filtroTipo,
		busqueda,
		itemCoincideBusqueda
	]);
	const reservaVisible = (0, import_react.useCallback)((res) => {
		return (filtroTipo === "todos" || filtroTipo === "reserva") && itemCoincideBusqueda(res, busqueda);
	}, [
		filtroTipo,
		busqueda,
		itemCoincideBusqueda
	]);
	const seccionVisible = (0, import_react.useCallback)((sec) => {
		const coincideBusquedaPropia = itemCoincideBusqueda(sec, busqueda);
		const pasillos = pasillosDeSeccion(sec.id).filter(pasilloVisible);
		const cajas = cajasDeSeccion(sec.id).filter(cajaVisible);
		const reservas = reservasDeSeccion(sec.id).filter(reservaVisible);
		if (filtroTipo === "todos") return coincideBusquedaPropia || pasillos.length > 0 || cajas.length > 0 || reservas.length > 0;
		if (filtroTipo === "seccion") return coincideBusquedaPropia;
		return pasillos.length > 0 || cajas.length > 0 || reservas.length > 0;
	}, [
		itemCoincideBusqueda,
		busqueda,
		pasilloVisible,
		cajaVisible,
		reservaVisible,
		pasillosDeSeccion,
		cajasDeSeccion,
		reservasDeSeccion,
		filtroTipo
	]);
	const seccionesFiltradas = (0, import_react.useMemo)(() => {
		return secciones.filter(seccionVisible);
	}, [secciones, seccionVisible]);
	const filtroActivo = filtroTipo !== "todos" || busqueda.trim() !== "";
	const ubicacionesFiltradas = (0, import_react.useMemo)(() => {
		return ubicaciones.filter((item) => {
			const coincideBusqueda = itemCoincideBusqueda(item, busqueda);
			const coincideTipo = filtroTipo === "todos" || item.tipo === filtroTipo;
			return coincideBusqueda && coincideTipo;
		});
	}, [
		ubicaciones,
		busqueda,
		filtroTipo,
		itemCoincideBusqueda
	]);
	const pasillosDisponibles = (0, import_react.useMemo)(() => ubicaciones.filter((u) => u.tipo === "pasillo"), [ubicaciones]);
	const sugerenciasCatalogo = (0, import_react.useMemo)(() => {
		if (!busquedaProducto.trim()) return [];
		const q = busquedaProducto.toLowerCase();
		return catalogoDisponible.filter((p) => p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 5);
	}, [busquedaProducto, catalogoDisponible]);
	const handleKeyDownBuscador = (e) => {
		if (!dropdownAbierto || sugerenciasCatalogo.length === 0) return;
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setIndiceSugerencia((prev) => (prev + 1) % sugerenciasCatalogo.length);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setIndiceSugerencia((prev) => (prev - 1 + sugerenciasCatalogo.length) % sugerenciasCatalogo.length);
		} else if (e.key === "Enter") {
			e.preventDefault();
			const seleccionado = sugerenciasCatalogo[indiceSugerencia];
			if (seleccionado) {
				setProductoParaIncluir(seleccionado);
				setBusquedaProducto(`${seleccionado.nombre} (${seleccionado.sku})`);
				setDropdownAbierto(false);
			}
		} else if (e.key === "Escape") setDropdownAbierto(false);
	};
	const abrirPanelVendedor = (ubi) => {
		setUbicacionSeleccionada(ubi);
		setMostrarEscaner(false);
		setBusquedaProducto("");
		setProductoParaIncluir(null);
		setDropdownAbierto(false);
		setSheetVendedorAbierto(true);
	};
	const infoJerarquia = (0, import_react.useMemo)(() => {
		if (!ubicacionSeleccionada) return {
			seccion: "General",
			pasillo: "Sin Pasillo"
		};
		let seccionNombre = "General";
		let pasilloNombre = "Independiente";
		if (ubicacionSeleccionada.seccion_id) {
			const sec = ubicaciones.find((u) => u.id === ubicacionSeleccionada.seccion_id);
			if (sec) seccionNombre = sec.nombre;
		}
		if (ubicacionSeleccionada.id_padre) {
			const padre = ubicaciones.find((u) => u.id === ubicacionSeleccionada.id_padre);
			if (padre) {
				if (padre.tipo === "pasillo") pasilloNombre = padre.nombre;
				else if (padre.tipo === "seccion") seccionNombre = padre.nombre;
			}
		}
		return {
			seccion: seccionNombre,
			pasillo: pasilloNombre
		};
	}, [ubicacionSeleccionada, ubicaciones]);
	const handleIncluirProductoEnUbicacion = async () => {
		if (!ubicacionSeleccionada) return;
		if (!productoParaIncluir) {
			toast.error("Selecciona un artículo del catálogo usando el buscador o el escáner");
			return;
		}
		if (cantidadParaIncluir <= 0) {
			toast.error("La cantidad debe ser mayor que cero");
			return;
		}
		try {
			const { data: authData } = await supabase.auth.getUser();
			const userId = authData?.user?.id ?? null;
			if (userId) await supabase.from("movimientos").insert({
				id_producto: productoParaIncluir.id,
				id_ubicacion: ubicacionSeleccionada.id,
				tipo: "entrada",
				cantidad: cantidadParaIncluir,
				realizado_por: userId,
				notas: `Inclusión desde panel del vendedor en ${ubicacionSeleccionada.nombre}`
			});
		} catch {}
		setUbicaciones((prev) => prev.map((u) => {
			if (u.id === ubicacionSeleccionada.id) {
				const prods = [...u.productos];
				const idx = prods.findIndex((p) => p.id === productoParaIncluir.id || p.sku === productoParaIncluir.sku);
				if (idx !== -1) {
					const actual = prods[idx];
					prods[idx] = {
						...actual,
						cantidad: actual.cantidad + cantidadParaIncluir
					};
				} else prods.push({
					...productoParaIncluir,
					cantidad: cantidadParaIncluir
				});
				const totalUds = prods.reduce((acc, p) => acc + p.cantidad, 0);
				const cap = u.capacidad_max || 100;
				const pct = Math.min(100, Math.round(totalUds / cap * 100));
				const uActualizada = {
					...u,
					productos: prods,
					porcentaje_ocupacion: pct,
					subtitulo: `${prods.length} productos · ${totalUds} uds`
				};
				setUbicacionSeleccionada(uActualizada);
				return uActualizada;
			}
			return u;
		}));
		toast.success(`Se añadieron ${cantidadParaIncluir} uds de "${productoParaIncluir.nombre}" a ${ubicacionSeleccionada.nombre}`);
		setProductoParaIncluir(null);
		setBusquedaProducto("");
	};
	const ejecutarOperacionStock = async () => {
		if (!ubicacionSeleccionada || !productoEnOperacion) return;
		const tipoMov = tipoOperacion === "quitar" ? "salida" : tipoOperacion === "anadir" ? "reposicion" : "ajuste";
		try {
			const { data: authData } = await supabase.auth.getUser();
			const userId = authData?.user?.id ?? null;
			if (userId) await supabase.from("movimientos").insert({
				id_producto: productoEnOperacion.id,
				id_ubicacion: ubicacionSeleccionada.id,
				tipo: tipoMov,
				cantidad: cantidadOperacion,
				realizado_por: userId,
				notas: `${motivoOperacion} (${tipoOperacion})`
			});
		} catch {}
		setUbicaciones((prev) => prev.map((u) => {
			if (u.id === ubicacionSeleccionada.id) {
				const prods = [...u.productos];
				const idx = prods.findIndex((p) => p.id === productoEnOperacion.id);
				if (idx !== -1) {
					const actual = prods[idx];
					let nuevaCant = actual.cantidad;
					if (tipoOperacion === "quitar") nuevaCant = Math.max(0, actual.cantidad - cantidadOperacion);
					else if (tipoOperacion === "anadir") nuevaCant = actual.cantidad + cantidadOperacion;
					else if (tipoOperacion === "ajuste") nuevaCant = cantidadOperacion;
					if (nuevaCant === 0 && tipoOperacion === "quitar") toast.warning(`El producto "${actual.nombre}" se ha quedado sin existencias (0 uds) en ${u.nombre}`);
					prods[idx] = {
						...actual,
						cantidad: nuevaCant
					};
				}
				const totalUds = prods.reduce((acc, p) => acc + p.cantidad, 0);
				const cap = u.capacidad_max || 100;
				const pct = Math.min(100, Math.round(totalUds / cap * 100));
				const uActualizada = {
					...u,
					productos: prods,
					porcentaje_ocupacion: pct,
					subtitulo: `${prods.length} productos · ${totalUds} uds`
				};
				setUbicacionSeleccionada(uActualizada);
				return uActualizada;
			}
			return u;
		}));
		toast.success(`Operación de ${tipoOperacion} (${cantidadOperacion} uds) aplicada y registrada en movimientos`);
		setAlertOperacionAbierta(false);
	};
	const exportarExcelUbicacion = () => {
		if (!ubicacionSeleccionada) return;
		const encabezados = [
			"SKU",
			"Nombre",
			"Categoría",
			"Cantidad (Uds)",
			"Stock Mínimo",
			"Estado"
		];
		const filas = (ubicacionSeleccionada.productos || []).map((p) => [
			`"${p.sku}"`,
			`"${p.nombre.replace(/"/g, "\"\"")}"`,
			`"${p.categoria}"`,
			p.cantidad,
			p.stock_minimo,
			p.cantidad <= p.stock_minimo ? "BAJO STOCK" : "OK"
		]);
		const contenidoCsv = [
			`"Ubicación: ${ubicacionSeleccionada.nombre} [${ubicacionSeleccionada.codigo}]"`,
			`"Jerarquía: ${infoJerarquia.seccion} > ${infoJerarquia.pasillo}"`,
			`"Fecha de Extracción: ${(/* @__PURE__ */ new Date()).toLocaleString()}"`,
			"",
			encabezados.join(";"),
			...filas.map((f) => f.join(";"))
		].join("\r\n");
		const blob = new Blob(["﻿" + contenidoCsv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute("download", `Inventario_${ubicacionSeleccionada.codigo}_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		toast.success(`Excel / CSV de ${ubicacionSeleccionada.nombre} descargado correctamente`);
	};
	const imprimirPdfUbicacion = () => {
		window.print();
	};
	const handleCrearNuevoPalet = async (idReservaEspecifica) => {
		const idReserva = idReservaEspecifica || (ubicacionSeleccionada?.tipo === "reserva" ? ubicacionSeleccionada.id : null) || ubicaciones.find((u) => u.tipo === "reserva")?.id || "res-gen";
		const nombreReserva = ubicaciones.find((u) => u.id === idReserva)?.nombre || "Reserva (Almacén de Tienda)";
		const siguienteNum = (palets.length > 0 ? Math.max(...palets.map((p) => p.numero_palet)) : 0) + 1;
		const padNum = String(siguienteNum).padStart(3, "0");
		const hoy = /* @__PURE__ */ new Date();
		const diaMesAnio = `${String(hoy.getDate()).padStart(2, "0")}${String(hoy.getMonth() + 1).padStart(2, "0")}${hoy.getFullYear()}`;
		const usuarioNombre = "Carlos Ruiz (Vendedor Pintura)";
		const codBarras = `PAL-${padNum}-Vendedor-${diaMesAnio}`;
		const nuevoPalet = {
			id: `pal-${Date.now()}`,
			id_reserva: idReserva,
			numero_palet: siguienteNum,
			codigo_barras: codBarras,
			generado_por: usuarioNombre,
			generado_en: (/* @__PURE__ */ new Date()).toISOString(),
			activo: true,
			productos: [{
				id: `p-${Date.now()}`,
				sku: "LAT-4001-WHT",
				nombre: "Látex Extracubriente Blanco Mate 15L",
				categoria: "Pinturas de Exterior",
				cantidad: 24,
				stock_minimo: 10
			}]
		};
		try {
			await crearPaletBD({
				id_reserva: idReserva,
				numero_palet: siguienteNum,
				codigo_barras: codBarras,
				generado_por: usuarioNombre
			});
			queryClient.invalidateQueries({ queryKey: ["palets"] });
		} catch (err) {
			console.warn("Aviso al crear palet en Supabase:", err.message);
		}
		setPalets((prev) => [nuevoPalet, ...prev]);
		toast.success(`Palet #${padNum} creado en ${nombreReserva} (${codBarras})`, { description: "Ubicación fijada en Reserva. Etiqueta oficial lista para imprimir con Quién, Cuándo y Dónde." });
		setPaletParaImprimir(nuevoPalet);
		setModalEtiquetaPaletAbierto(true);
	};
	const handleReponerEnTienda = async (palet, prodId, cantAReponer) => {
		const prodsActualizados = palet.productos.map((p) => {
			if (p.id === prodId) {
				const rem = Math.max(0, p.cantidad - cantAReponer);
				return {
					...p,
					cantidad: rem
				};
			}
			return p;
		}).filter((p) => p.cantidad > 0);
		const totalRestante = prodsActualizados.reduce((acc, p) => acc + p.cantidad, 0);
		if (totalRestante === 0) {
			setPalets((prev) => prev.filter((p) => p.id !== palet.id));
			setModalGestionPaletAbierto(false);
			try {
				await darDeBajaPaletBD(palet.id);
				queryClient.invalidateQueries({ queryKey: ["palets"] });
			} catch (err) {
				console.warn("Aviso al dar de baja palet en Supabase:", err.message);
			}
			toast.error(`🚨 ¡PALET #${String(palet.numero_palet).padStart(3, "0")} AUTODESTRUIDO!`, {
				description: `Todos los artículos del palet [${palet.codigo_barras}] han sido traspasados a tienda. El palet se ha dado de baja automáticamente en Supabase.`,
				duration: 6e3
			});
		} else {
			setPalets((prev) => prev.map((p) => p.id === palet.id ? {
				...p,
				productos: prodsActualizados
			} : p));
			toast.success(`Mercancía repuesta en tienda. Quedan ${totalRestante} uds en el Palet #${palet.numero_palet}`);
		}
	};
	const handleGuardarUbicacion = async (e) => {
		e.preventDefault();
		if (!formNombre.trim()) {
			toast.error("El nombre de la ubicación es obligatorio");
			return;
		}
		const config = CONFIG_JERARQUIA[formTipo];
		if (config.nivel === 2 && !formPadre) {
			toast.error("Las ubicaciones de Nivel 2 requieren un Pasillo padre");
			return;
		}
		const nuevaUbi = {
			id: `loc-${Date.now()}`,
			codigo: formNombre.toUpperCase().replace(/\s+/g, "-").slice(0, 8),
			nombre: formNombre,
			tipo: formTipo,
			nivel: config.nivel,
			id_padre: config.nivel === 2 ? formPadre : null,
			lateral: formLateral,
			piso: formPiso,
			capacidad_max: formCapMax,
			peso_max_kg: formPesoMax,
			porcentaje_ocupacion: 0,
			activo: true,
			subtitulo: "0 productos · 0 uds (Posición recién creada)",
			productos: []
		};
		setUbicaciones((prev) => [...prev, nuevaUbi]);
		if (formPadre) setExpandidos((prev) => ({
			...prev,
			[formPadre]: true
		}));
		try {
			await crearUbicacionBD({
				nombre: formNombre,
				tipo: formTipo,
				id_ubicacion_padre: config.nivel === 2 ? formPadre : null,
				seccion: formPadre,
				posicion_lateral: formLateral,
				numero: formPiso
			});
			queryClient.invalidateQueries({ queryKey: ["ubicacionesCompletas"] });
			toast.success(`Ubicación "${formNombre}" guardada en Supabase exitosamente`);
		} catch (err) {
			console.warn("Guardado localmente. Supabase:", err.message);
			toast.success(`Ubicación "${formNombre}" creada exitosamente`);
		}
		setFormNombre("");
	};
	const confirmarEliminarUbicacion = async () => {
		if (!ubicacionParaEliminar) return;
		if (ubicacionParaEliminar.productos && ubicacionParaEliminar.productos.length > 0) {
			toast.error("No se puede eliminar una ubicación con stock activo. Ajusta el stock a 0 primero.");
			setDialogEliminarAbierto(false);
			return;
		}
		const idEliminar = ubicacionParaEliminar.id;
		const nombreEliminar = ubicacionParaEliminar.nombre;
		setUbicaciones((prev) => prev.filter((u) => u.id !== idEliminar));
		try {
			await desactivarUbicacionBD(idEliminar);
			queryClient.invalidateQueries({ queryKey: ["ubicacionesCompletas"] });
		} catch (err) {
			console.warn("Eliminado localmente. Supabase:", err.message);
		}
		toast.success(`Ubicación "${nombreEliminar}" eliminada`);
		setDialogEliminarAbierto(false);
		setUbicacionParaEliminar(null);
	};
	const handleSincronizarSupabase = async () => {
		setSincronizando(true);
		try {
			const secList = [
				{
					id: "sec-pintura",
					nombre: "Pintura",
					descripcion: "Área central de pinturas, solventes y herramientas"
				},
				{
					id: "sec-sanitario",
					nombre: "Sanitario",
					descripcion: "Fontanería, grifería y porcelana sanitaria"
				},
				{
					id: "sec-cocinas",
					nombre: "Armarios y Cocinas",
					descripcion: "Módulos, herrajes de ensamble y tiradores"
				},
				{
					id: "sec-ferreteria",
					nombre: "Ferretería",
					descripcion: "Tornillería, anclajes y fijaciones de seguridad"
				}
			];
			const ubiList = UBICACIONES_INICIALES.filter((u) => u.tipo !== "seccion").map((u) => {
				const secPadre = UBICACIONES_INICIALES.find((s) => s.id === u.seccion_id);
				const ubiPadre = UBICACIONES_INICIALES.find((p) => p.id === u.id_padre);
				const ubiData = {
					nombre: u.nombre,
					tipo: u.tipo
				};
				if (secPadre?.nombre) ubiData.seccion_nombre = secPadre.nombre;
				if (ubiPadre?.nombre) ubiData.padre_nombre = ubiPadre.nombre;
				if (u.lateral) ubiData.lateral = u.lateral;
				if (u.piso) ubiData.piso = u.piso;
				if (u.subtitulo) ubiData.descripcion = u.subtitulo;
				return ubiData;
			});
			const res = await sincronizarEstructuraInicialSupabase(secList, ubiList);
			await Promise.all([queryClient.invalidateQueries({ queryKey: ["secciones"] }), queryClient.invalidateQueries({ queryKey: ["ubicacionesCompletas"] })]);
			toast.success(`Estructura sincronizada con Supabase: ${res.seccionesCreadas} secciones y ${res.ubicacionesCreadas} ubicaciones guardadas en tu base de datos`);
		} catch (err) {
			toast.error(err.message || "Error al sincronizar con Supabase");
		} finally {
			setSincronizando(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-slate-50/60 pb-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-b bg-white no-print",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-7xl mx-auto px-4 sm:px-6 py-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col md:flex-row md:items-center md:justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider mb-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "INVENTARIO LM" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "/" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "ALMACÉN" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "/" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-blue-600 font-semibold",
									children: "JERARQUÍA DE UBICACIONES"
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-2xl sm:text-3xl font-bold tracking-tight text-slate-900",
								children: "Ubicaciones del Almacén"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
								variant: "outline",
								className: "bg-blue-50 text-blue-700 border-blue-200 font-medium px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-2 h-2 rounded-full bg-blue-600 animate-pulse" }), "18 Zonas Activas • 94% Ocupación"]
							})]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 self-start md:self-auto bg-slate-100 p-1 rounded-lg border border-slate-200",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: vista === "arbol" ? "default" : "ghost",
								size: "sm",
								onClick: () => setVista("arbol"),
								className: `text-xs gap-1.5 h-8 ${vista === "arbol" ? "bg-white text-blue-700 shadow-xs hover:bg-white" : "text-slate-600 hover:text-slate-900"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderTree, { className: "w-3.5 h-3.5" }), "Vista Árbol"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: vista === "lista" ? "default" : "ghost",
								size: "sm",
								onClick: () => setVista("lista"),
								className: `text-xs gap-1.5 h-8 ${vista === "lista" ? "bg-white text-blue-700 shadow-xs hover:bg-white" : "text-slate-600 hover:text-slate-900"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, { className: "w-3.5 h-3.5" }), "Vista Lista"]
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-1 items-center gap-2 max-w-xl",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative flex-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												value: busqueda,
												onChange: (e) => setBusqueda(e.target.value),
												placeholder: "Buscar ubicación por nombre o código (ej. A1-01, Látex)...",
												className: "pl-9 bg-slate-50/70 border-slate-200 text-sm h-9 focus-visible:ring-blue-500"
											}),
											busqueda && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => setBusqueda(""),
												className: "absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-3.5 h-3.5" })
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: filtroTipo,
										onChange: (e) => setFiltroTipo(e.target.value),
										className: "h-9 text-xs rounded-md border border-slate-200 bg-white px-2.5 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "todos",
												children: "Tipo de ubicación (Todos)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "seccion",
												children: "Sección (Nivel 0)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "pasillo",
												children: "Pasillo (Nivel 1)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "caja",
												children: "Caja (Nivel 1)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "reserva",
												children: "Reserva (Nivel 1)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "armario",
												children: "Armario (Nivel 2)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "alto",
												children: "Alto (Nivel 2)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "cross",
												children: "Cross (Nivel 2)"
											})
										]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "outline",
										size: "sm",
										onClick: toggleExpandirColapsarTodo,
										className: "text-xs h-9 text-slate-700 border-slate-200 gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, { className: "w-3.5 h-3.5" }), todosExpandidos ? "Colapsar todo" : "Expandir todo"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										onClick: () => {
											setFormNombre("Nueva Posición");
											setFormTipo("armario");
											toast.info("Configura la nueva ubicación en el panel lateral");
										},
										className: "bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-9 px-3.5 gap-1.5 shadow-xs",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-4 h-4" }), "NUEVA UBICACIÓN"]
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1.5 flex-wrap pt-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Funnel, { className: "w-3 h-3" }), " Filtro:"]
									}),
									[
										{
											id: "todos",
											label: "Todos",
											count: ubicaciones.length
										},
										{
											id: "seccion",
											label: "Secciones",
											count: secciones.length
										},
										{
											id: "pasillo",
											label: "Pasillos",
											count: ubicaciones.filter((u) => u.tipo === "pasillo").length
										},
										{
											id: "armario",
											label: "Armarios",
											count: ubicaciones.filter((u) => u.tipo === "armario").length
										},
										{
											id: "alto",
											label: "Altos",
											count: ubicaciones.filter((u) => u.tipo === "alto").length
										},
										{
											id: "caja",
											label: "Cajas",
											count: ubicaciones.filter((u) => u.tipo === "caja").length
										},
										{
											id: "reserva",
											label: "Reserva",
											count: ubicaciones.filter((u) => u.tipo === "reserva").length
										},
										{
											id: "cross",
											label: "Cross",
											count: ubicaciones.filter((u) => u.tipo === "cross").length
										}
									].map((chip) => {
										const activo = filtroTipo === chip.id;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => setFiltroTipo(chip.id),
											className: `px-2.5 py-1 text-xs rounded-full transition-all border flex items-center gap-1.5 cursor-pointer ${activo ? "bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 font-medium"}`,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: chip.label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: `text-[10px] px-1 py-0.2 rounded-full ${activo ? "bg-blue-700/80 text-white" : "bg-slate-100 text-slate-500"}`,
												children: chip.count
											})]
										}, chip.id);
									}),
									filtroActivo && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "ghost",
										size: "sm",
										onClick: () => {
											setFiltroTipo("todos");
											setBusqueda("");
										},
										className: "h-6 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 ml-auto gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-3 h-3" }), " Limpiar filtros"]
									})
								]
							}),
							filtroActivo && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between bg-blue-50/70 border border-blue-200/90 rounded-lg px-3 py-1.5 text-xs text-blue-900 animate-in fade-in-50",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 flex-wrap",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Funnel, { className: "w-3.5 h-3.5 text-blue-600 shrink-0" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
											"Filtrando por:",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: filtroTipo === "todos" ? "Cualquier tipo" : CONFIG_JERARQUIA[filtroTipo]?.label || filtroTipo }),
											busqueda && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
												" ",
												"y término \"",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: busqueda }),
												"\""
											] })
										] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
											className: "bg-blue-100 text-blue-800 border-blue-300 text-[10px] font-semibold",
											children: [
												ubicacionesFiltradas.length,
												" coincidencia",
												ubicacionesFiltradas.length === 1 ? "" : "s"
											]
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => {
										setFiltroTipo("todos");
										setBusqueda("");
									},
									className: "text-xs text-blue-700 hover:text-blue-950 font-semibold underline shrink-0 cursor-pointer",
									children: "Ver todo"
								})]
							})
						]
					})]
				})
			}),
			ubicacionesBD.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "max-w-7xl mx-auto px-4 sm:px-6 pt-5 no-print",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-gradient-to-r from-blue-50 via-indigo-50/50 to-slate-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "p-2 rounded-lg bg-blue-600 text-white shadow-xs shrink-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Database, { className: "w-4 h-4" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
							className: "text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Base de datos Supabase conectada" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-800 border border-amber-300",
								children: "Tablas listas (0 ubicaciones en BD)"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-slate-600 mt-0.5",
							children: [
								"Las tablas ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "secciones" }),
								", ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "ubicaciones" }),
								", ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "stock" }),
								" y",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "palets" }),
								" ya están creadas en tu Supabase. Puedes sincronizar la topología física maestra de Leroy Merlin con un solo clic para guardar todas las secciones y pasillos reales."
							]
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						onClick: handleSincronizarSupabase,
						disabled: sincronizando,
						className: "bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-8 px-3.5 gap-1.5 shrink-0 shadow-xs cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "w-3.5 h-3.5" }), sincronizando ? "Sincronizando..." : "Sincronizar a Supabase"]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-w-7xl mx-auto px-4 sm:px-6 pt-6 no-print",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative overflow-hidden",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs font-bold text-slate-400 uppercase tracking-wider",
										children: "TOPOLOGÍA DE NAVE"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-baseline gap-2 mt-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-2xl font-bold text-slate-900",
											children: ubicaciones.length
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs font-medium text-slate-500",
											children: "ubicaciones"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5 text-xs text-slate-600 mt-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-1.5 h-1.5 rounded-full bg-indigo-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "4 Secciones (Nivel 0) • Pasillos • Cajas • Reserva" })]
									})
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "p-2.5 rounded-lg bg-indigo-50 text-indigo-600",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "w-5 h-5" })
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "bg-indigo-600 h-full rounded-full",
									style: { width: "78%" }
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative overflow-hidden",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs font-bold text-slate-400 uppercase tracking-wider",
											children: "CAPACIDAD OCUPADA"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700",
											children: "Alerta: Pasillo B"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-baseline gap-2 mt-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-2xl font-bold text-slate-900",
											children: "92%"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs font-medium text-rose-600",
											children: "Capacidad crítica"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-slate-600 mt-2",
										children: "1,420 de 1,540 m³ volumen ocupado"
									})
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "p-2.5 rounded-lg bg-purple-50 text-purple-600",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "w-5 h-5" })
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "bg-purple-600 h-full rounded-full",
									style: { width: "92%" }
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative overflow-hidden",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs font-bold text-slate-400 uppercase tracking-wider",
										children: "PALETS EN RESERVA"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-baseline gap-2 mt-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-2xl font-bold text-amber-700",
											children: palets.length
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs font-medium text-amber-600",
											children: "activos con etiqueta"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-slate-600 mt-2",
										children: "Autodestrucción al vaciar por reposición"
									})
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "p-2.5 rounded-lg bg-amber-50 text-amber-600",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Warehouse, { className: "w-5 h-5" })
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "bg-amber-600 h-full rounded-full",
									style: { width: "45%" }
								})
							})]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "lg:col-span-8 space-y-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderTree, { className: "w-4 h-4 text-blue-600" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "text-sm font-bold text-slate-900 tracking-tight",
											children: "Estructura Física del Almacén"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-slate-500 font-medium",
										children: "Terminal Nave Central • 3 Niveles"
									})]
								}),
								vista === "arbol" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "p-4 sm:p-5 space-y-4",
									children: seccionesFiltradas.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "py-12 px-4 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Funnel, { className: "w-5 h-5" })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "text-sm font-bold text-slate-800",
												children: "No se encontraron ubicaciones"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-xs text-slate-500 mt-1 max-w-sm mx-auto",
												children: [
													"No hay ninguna ubicación de tipo \"",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: filtroTipo === "todos" ? "Cualquiera" : CONFIG_JERARQUIA[filtroTipo]?.label || filtroTipo }),
													"\"",
													busqueda && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
														" ",
														"que coincida con \"",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: busqueda }),
														"\""
													] }),
													"."
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "outline",
												size: "sm",
												onClick: () => {
													setFiltroTipo("todos");
													setBusqueda("");
												},
												className: "mt-4 text-xs border-slate-300 text-blue-700 hover:bg-blue-50",
												children: "Restablecer filtros"
											})
										]
									}) : seccionesFiltradas.map((sec) => {
										const secAbierta = filtroActivo ? true : expandidos[sec.id] ?? true;
										const pasillos = pasillosDeSeccion(sec.id).filter(pasilloVisible);
										const cajas = cajasDeSeccion(sec.id).filter(cajaVisible);
										const reservas = reservasDeSeccion(sec.id).filter(reservaVisible);
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-xs",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "p-3.5 bg-indigo-50/40 hover:bg-indigo-50/70 transition-colors flex items-center justify-between gap-3 border-b border-indigo-100/70",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2.5 flex-1 min-w-0",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															onClick: () => toggleExpandir(sec.id),
															className: "p-1 rounded-md text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100/70 transition-colors",
															children: secAbierta ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "w-4 h-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "w-4 h-4" })
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "p-2 rounded-lg bg-indigo-600 text-white shadow-xs",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "w-4 h-4" })
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "min-w-0",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex items-center gap-2 flex-wrap",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "font-bold text-sm text-slate-900",
																	children: sec.nombre
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "px-2 py-0.5 text-[11px] font-bold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200",
																	children: "Nivel 0 · Sección"
																})]
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "text-xs text-slate-500 truncate mt-0.5",
																children: sec.subtitulo
															})]
														})
													]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "flex items-center gap-1.5",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
														variant: "outline",
														size: "sm",
														onClick: () => {
															setFormNombre(`Pasillo nuevo`);
															setFormTipo("pasillo");
															toast.info(`Añadiendo Pasillo bajo sección ${sec.nombre}`);
														},
														className: "h-7 text-xs px-2.5 rounded-full border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50 gap-1 font-semibold",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-3 h-3" }), " Pasillo"]
													})
												})]
											}), secAbierta && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "p-3 sm:p-4 space-y-3 bg-slate-50/20",
												children: [
													pasillos.map((pas) => {
														const pasAbierto = filtroActivo ? true : expandidos[pas.id] ?? true;
														const posiciones = posicionesVisiblesDePasillo(pas.id);
														return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "p-3 bg-blue-50/30 hover:bg-blue-50/50 transition-colors flex items-center justify-between gap-3 border-b border-slate-100",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "flex items-center gap-2 flex-1 min-w-0",
																	children: [
																		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
																			onClick: () => toggleExpandir(pas.id),
																			className: "p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200/50",
																			children: pasAbierto ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "w-3.5 h-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "w-3.5 h-3.5" })
																		}),
																		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																			className: "p-1.5 rounded-md bg-blue-100 text-blue-700",
																			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeftRight, { className: "w-3.5 h-3.5" })
																		}),
																		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																			className: "min-w-0",
																			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																				className: "flex items-center gap-2 flex-wrap",
																				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																					className: "font-semibold text-sm text-slate-800",
																					children: pas.nombre
																				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																					className: "px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200",
																					children: "Nivel 1 · Pasillo"
																				})]
																			})
																		})
																	]
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
																	variant: "outline",
																	size: "sm",
																	onClick: () => {
																		setFormNombre(`${pas.codigo}-0${posiciones.length + 1}`);
																		setFormTipo("armario");
																		setFormPadre(pas.id);
																		toast.info(`Añadiendo Posición bajo ${pas.nombre}`);
																	},
																	className: "h-6 text-[11px] px-2 rounded-full border-slate-200 text-slate-700 hover:bg-slate-100 gap-1",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-3 h-3" }), " Posición"]
																})]
															}), pasAbierto && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "p-2 sm:p-3 space-y-2 bg-white",
																children: posiciones.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																	className: "p-3 text-center text-xs text-slate-400",
																	children: "Sin posiciones asignadas en este pasillo."
																}) : posiciones.map((pos) => {
																	const config = CONFIG_JERARQUIA[pos.tipo];
																	const IconoPos = config.icon;
																	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		onClick: () => abrirPanelVendedor(pos),
																		className: "p-2.5 rounded-lg border border-slate-200/90 bg-slate-50/30 hover:bg-blue-50/50 hover:border-blue-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group shadow-2xs",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																			className: "flex items-center gap-2.5 min-w-0",
																			children: [
																				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																					className: "w-4 h-4 flex items-center justify-center text-slate-400",
																					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-blue-500" })
																				}),
																				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																					className: `p-1.5 rounded-md ${config.badgeClass}`,
																					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconoPos, { className: "w-3.5 h-3.5" })
																				}),
																				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																					className: "min-w-0",
																					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																						className: "flex items-center gap-2 flex-wrap",
																						children: [
																							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																								className: "font-semibold text-xs text-slate-900 group-hover:text-blue-700",
																								children: pos.nombre
																							}),
																							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																								className: `px-1.5 py-0.2 text-[10px] font-medium rounded-full border ${config.badgeClass}`,
																								children: config.label
																							}),
																							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																								className: "text-[10px] font-mono text-slate-400",
																								children: [
																									"[",
																									pos.codigo,
																									"]"
																								]
																							})
																						]
																					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																						className: "text-[11px] text-slate-500 truncate mt-0.5",
																						children: pos.subtitulo
																					})]
																				})
																			]
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																			className: "flex items-center gap-1.5 self-end sm:self-auto",
																			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																				variant: "outline",
																				size: "sm",
																				onClick: (e) => {
																					e.stopPropagation();
																					abrirPanelVendedor(pos);
																				},
																				className: "h-7 text-xs px-2.5 rounded-md border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 font-semibold",
																				children: "Ver Productos & Stock"
																			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																				variant: "ghost",
																				size: "sm",
																				onClick: (e) => {
																					e.stopPropagation();
																					setUbicacionParaEliminar(pos);
																					setDialogEliminarAbierto(true);
																				},
																				className: "h-7 w-7 p-0 text-slate-400 hover:text-rose-600",
																				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "w-3.5 h-3.5" })
																			})]
																		})]
																	}, pos.id);
																})
															})]
														}, pas.id);
													}),
													cajas.map((caja) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														onClick: () => abrirPanelVendedor(caja),
														className: "rounded-lg border border-rose-200/90 bg-rose-50/20 hover:bg-rose-50/50 p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center gap-2.5 min-w-0",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "p-1.5 rounded-md bg-rose-100 text-rose-700",
																children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "w-4 h-4" })
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "min-w-0",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "flex items-center gap-2 flex-wrap",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "font-semibold text-xs text-slate-900",
																		children: caja.nombre
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "px-1.5 py-0.2 text-[10px] font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-200",
																		children: "Nivel 1 · Caja Independiente"
																	})]
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																	className: "text-[11px] text-slate-500 truncate mt-0.5",
																	children: caja.subtitulo
																})]
															})]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "flex items-center gap-1.5 self-end sm:self-auto",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																variant: "outline",
																size: "sm",
																onClick: (e) => {
																	e.stopPropagation();
																	abrirPanelVendedor(caja);
																},
																className: "h-7 text-xs px-2.5 rounded-md border-rose-200 text-rose-700 bg-white hover:bg-rose-50 font-semibold",
																children: "Ver Contenido"
															})
														})]
													}, caja.id)),
													reservas.map((res) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "rounded-xl border border-amber-300 bg-amber-50/30 p-3.5 shadow-xs space-y-3",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																onClick: () => abrirPanelVendedor(res),
																className: "flex items-center gap-3 min-w-0 cursor-pointer group",
																title: "Abrir panel de gestión de palets en esta reserva",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																	className: "p-2 rounded-lg bg-amber-600 text-white shadow-xs group-hover:bg-amber-700 transition-colors",
																	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Warehouse, { className: "w-4 h-4" })
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "min-w-0",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		className: "flex items-center gap-2 flex-wrap",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "font-bold text-sm text-slate-900 group-hover:text-amber-800 transition-colors",
																			children: res.nombre
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-200 text-amber-900 border border-amber-300",
																			children: "Nivel 1 · Reserva (Almacén de Tienda)"
																		})]
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																		className: "text-xs text-slate-600 truncate mt-0.5",
																		children: [palets.length, " Palets activos con correlativo automático y etiqueta"]
																	})]
																})]
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex items-center gap-2 self-start sm:self-auto",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
																	size: "sm",
																	variant: "outline",
																	onClick: () => abrirPanelVendedor(res),
																	className: "border-amber-300 text-amber-900 bg-amber-100 hover:bg-amber-200 text-xs font-semibold h-8 px-3 gap-1.5 shadow-xs",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Warehouse, { className: "w-3.5 h-3.5" }), "Abrir Reserva"]
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
																	size: "sm",
																	onClick: (e) => {
																		e.stopPropagation();
																		handleCrearNuevoPalet(res.id);
																	},
																	className: "bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold h-8 px-3 gap-1.5 shadow-xs",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-3.5 h-3.5" }), "Crear Palet"]
																})]
															})]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1",
															children: palets.map((palet) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "p-3 rounded-lg border border-amber-200 bg-white shadow-2xs hover:border-amber-400 transition-all space-y-2",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		className: "flex items-center justify-between",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																			className: "flex items-center gap-1.5",
																			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
																				className: "bg-amber-100 text-amber-900 border-amber-300 font-bold text-xs",
																				children: ["Palet #", String(palet.numero_palet).padStart(3, "0")]
																			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																				className: "text-[10px] font-mono text-slate-500",
																				children: [
																					"[",
																					palet.codigo_barras,
																					"]"
																				]
																			})]
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																			className: "text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold",
																			children: [
																				palet.productos.reduce((acc, p) => acc + p.cantidad, 0),
																				" ",
																				"uds"
																			]
																		})]
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		className: "text-[11px] text-slate-600 space-y-0.5",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																			className: "flex items-center gap-1",
																			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "w-3 h-3 text-slate-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
																				"Generado por:",
																				" ",
																				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
																					className: "text-slate-800",
																					children: palet.generado_por
																				})
																			] })]
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																			className: "flex items-center gap-1",
																			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "w-3 h-3 text-slate-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
																				"Fecha:",
																				" ",
																				new Date(palet.generado_en).toLocaleDateString()
																			] })]
																		})]
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		className: "flex items-center gap-2 pt-1 border-t border-slate-100",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
																			variant: "outline",
																			size: "sm",
																			onClick: () => {
																				setPaletParaImprimir(palet);
																				setModalEtiquetaPaletAbierto(true);
																			},
																			className: "flex-1 h-7 text-xs border-amber-200 text-amber-800 hover:bg-amber-50 gap-1 font-medium",
																			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "w-3 h-3" }), " Imprimir Etiqueta"]
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
																			size: "sm",
																			onClick: () => {
																				setPaletSeleccionadoParaGestion(palet);
																				setModalGestionPaletAbierto(true);
																			},
																			className: "flex-1 h-7 text-xs bg-slate-800 hover:bg-slate-900 text-white gap-1 font-medium",
																			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "w-3 h-3" }), " Reponer en Tienda"]
																		})]
																	})
																]
															}, palet.id))
														})]
													}, res.id))
												]
											})]
										}, sec.id);
									})
								}),
								vista === "lista" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "divide-y divide-slate-100",
									children: ubicacionesFiltradas.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "py-12 text-center text-slate-500 text-sm",
										children: "No se encontraron ubicaciones con los filtros actuales"
									}) : ubicacionesFiltradas.map((item) => {
										const config = CONFIG_JERARQUIA[item.tipo];
										const Icono = config.icon;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "p-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3 min-w-0",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: `p-2 rounded-lg ${config.badgeClass}`,
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icono, { className: "w-4 h-4" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "min-w-0",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-2",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-semibold text-sm text-slate-900",
																children: item.nombre
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: `px-2 py-0.5 text-[10px] font-semibold rounded-full border ${config.badgeClass}`,
																children: config.label
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "text-xs text-slate-400 font-mono",
																children: [
																	"[",
																	item.codigo,
																	"]"
																]
															})
														]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-xs text-slate-500 mt-0.5",
														children: item.subtitulo || config.descripcion
													})]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "flex items-center gap-2",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "outline",
													size: "sm",
													onClick: () => abrirPanelVendedor(item),
													className: "h-7 text-xs border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 font-semibold",
													children: "Gestionar Productos"
												})
											})]
										}, item.id);
									})
								})
							]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "lg:col-span-4 space-y-5 no-print",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white rounded-xl border border-slate-200 p-5 shadow-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between pb-3 mb-4 border-b border-slate-100",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "p-1 rounded-md bg-blue-100 text-blue-700",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "w-3.5 h-3.5" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-sm font-bold text-slate-900",
										children: "Modal: Nueva Ubicación en Almacén"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200",
									children: "EDITOR"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								onSubmit: handleGuardarUbicacion,
								className: "space-y-3.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-xs font-semibold text-slate-700 mb-1 block",
										children: "Nombre de Ubicación"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: formNombre,
										onChange: (e) => setFormNombre(e.target.value),
										placeholder: "Ej. Armario A1-04",
										className: "h-8 text-xs bg-slate-50/60 border-slate-200"
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-xs font-semibold text-slate-700 mb-1 block",
										children: "Tipo de Ubicación"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: formTipo,
										onChange: (e) => setFormTipo(e.target.value),
										className: "w-full h-8 text-xs rounded-md border border-slate-200 bg-slate-50/60 px-2.5 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "armario",
												children: "Armario (Estantería media - Nivel 2)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "alto",
												children: "Alto (Altillo superior - Nivel 2)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "cross",
												children: "Cross-docking (Tránsito - Nivel 2)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "caja",
												children: "Caja (Independiente - Nivel 1)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "pasillo",
												children: "Pasillo (Corredor - Nivel 1)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "reserva",
												children: "Reserva (Palets - Nivel 1)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "seccion",
												children: "Sección (Zona General - Nivel 0)"
											})
										]
									})] }),
									CONFIG_JERARQUIA[formTipo].nivel === 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-xs font-semibold text-slate-700 mb-1 block",
										children: "Ubicación Padre"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										value: formPadre,
										onChange: (e) => setFormPadre(e.target.value),
										className: "w-full h-8 text-xs rounded-md border border-slate-200 bg-slate-50/60 px-2.5 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500",
										children: pasillosDisponibles.map((pas) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: pas.id,
											children: pas.nombre
										}, pas.id))
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-2.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-xs font-semibold text-slate-700 mb-1 block",
											children: "Lateral"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											value: formLateral,
											onChange: (e) => setFormLateral(e.target.value),
											className: "w-full h-8 text-xs rounded-md border border-slate-200 bg-slate-50/60 px-2 text-slate-800",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "R",
													children: "Derecha (R)"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "L",
													children: "Izquierda (L)"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "C",
													children: "Central (C)"
												})
											]
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-xs font-semibold text-slate-700 mb-1 block",
											children: "Altura / Piso"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											value: formPiso,
											onChange: (e) => setFormPiso(Number(e.target.value)),
											className: "w-full h-8 text-xs rounded-md border border-slate-200 bg-slate-50/60 px-2 text-slate-800",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: 1,
													children: "Nivel 1 (Suelo)"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: 2,
													children: "Nivel 2 (Medio)"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: 3,
													children: "Nivel 3 (Alto)"
												})
											]
										})] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-2.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-xs font-semibold text-slate-700 mb-1 block",
											children: "Cap. Máx (uds)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "number",
											value: formCapMax,
											onChange: (e) => setFormCapMax(Number(e.target.value)),
											className: "h-8 text-xs bg-slate-50/60 border-slate-200"
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-xs font-semibold text-slate-700 mb-1 block",
											children: "Peso Máx (kg)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "number",
											value: formPesoMax,
											onChange: (e) => setFormPesoMax(Number(e.target.value)),
											className: "h-8 text-xs bg-slate-50/60 border-slate-200"
										})] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-end gap-2 pt-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											variant: "ghost",
											size: "sm",
											onClick: () => {
												setFormNombre("");
												toast.info("Formulario limpiado");
											},
											className: "h-8 text-xs text-slate-600",
											children: "Cancelar"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "submit",
											size: "sm",
											className: "h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 shadow-xs",
											children: "Guardar Ubicación"
										})]
									})
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white rounded-xl border border-slate-200 p-5 shadow-xs",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between pb-3 mb-3 border-b border-slate-100",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs font-bold text-slate-900 tracking-wider",
										children: "MAPA NAVE A-NORTE"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-blue-600 font-semibold cursor-pointer hover:underline",
										children: "Plano 2D"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-4 gap-2 py-2",
									children: [[
										"A1-01",
										"A1-02",
										"A1-03",
										"A1-04",
										"A2-01",
										"S1-01"
									].map((slot) => {
										const match = ubicaciones.find((u) => u.codigo === slot);
										const isLibre = !match || match.productos.length === 0;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											onClick: () => match && abrirPanelVendedor(match),
											className: `p-2.5 rounded-lg border text-center transition-all cursor-pointer ${match ? "bg-blue-50/70 border-blue-300 hover:bg-blue-100" : "border-slate-300 bg-slate-50/40"}`,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-[11px] font-bold text-slate-800",
												children: slot
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: `text-[10px] font-medium ${isLibre ? "text-slate-400" : "text-blue-700 font-semibold"}`,
												children: isLibre ? "LIBRE" : `${match?.porcentaje_ocupacion ?? 80}%`
											})]
										}, slot);
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										onClick: () => {
											const res = ubicaciones.find((u) => u.tipo === "reserva");
											if (res) abrirPanelVendedor(res);
										},
										className: "col-span-2 p-2.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-center transition-all cursor-pointer",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[11px] font-bold text-amber-900",
											children: "RES-TIENDA"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-[10px] font-medium text-amber-700",
											children: [palets.length, " PALETS"]
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Último inventario físico:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold text-slate-700",
										children: "Hoy, 10:15"
									})]
								})
							]
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: sheetVendedorAbierto,
				onOpenChange: setSheetVendedorAbierto,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetContent, {
					side: "right",
					className: "w-full sm:max-w-xl md:max-w-2xl overflow-y-auto p-0 flex flex-col bg-white",
					children: ubicacionSeleccionada && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 flex flex-col",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-5 border-b border-slate-200 bg-slate-50/80 sticky top-0 z-10",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1.5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-indigo-600 font-semibold",
											children: infoJerarquia.seccion
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "/" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-blue-600 font-semibold",
											children: infoJerarquia.pasillo
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "/" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-slate-900 font-bold",
											children: ubicacionSeleccionada.nombre
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
										className: "text-xl font-bold text-slate-900 flex items-center gap-2",
										children: [ubicacionSeleccionada.nombre, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											className: CONFIG_JERARQUIA[ubicacionSeleccionada.tipo].badgeClass,
											children: CONFIG_JERARQUIA[ubicacionSeleccionada.tipo].label
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-slate-500 font-mono mt-0.5",
										children: ubicacionSeleccionada.tipo === "reserva" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-amber-800 font-medium font-sans",
											children: "Zona de Almacén · Ubicación Exclusiva para Palets Móviles"
										}) : `Código: [${ubicacionSeleccionada.codigo}] • Lateral: ${ubicacionSeleccionada.lateral || "Central"} • Nivel/Piso: ${ubicacionSeleccionada.piso || 1}`
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-right",
										children: ubicacionSeleccionada.tipo === "reserva" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-sm font-bold text-amber-900",
											children: [
												palets.length,
												" ",
												palets.length === 1 ? "Palet activo" : "Palets activos"
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-[10px] text-amber-700 font-medium",
											children: [
												palets.reduce((acc, p) => acc + p.productos.reduce((a, b) => a + b.cantidad, 0), 0),
												" ",
												"uds en reserva"
											]
										})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-sm font-bold text-slate-900",
											children: [
												ubicacionSeleccionada.productos?.reduce((a, b) => a + b.cantidad, 0) || 0,
												" ",
												"/ ",
												ubicacionSeleccionada.capacidad_max || 100,
												" uds"
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-[10px] text-slate-500 font-medium",
											children: [
												"Ocupación: ",
												ubicacionSeleccionada.porcentaje_ocupacion || 0,
												"%"
											]
										})] })
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex items-center gap-2 mt-4 pt-3 border-t border-slate-200/80",
									children: ubicacionSeleccionada.tipo === "reserva" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										onClick: () => handleCrearNuevoPalet(ubicacionSeleccionada.id),
										className: "h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5 shadow-xs",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-3.5 h-3.5" }), "Crear Palet en Reserva"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "outline",
										size: "sm",
										onClick: () => window.print(),
										className: "h-8 text-xs border-amber-300 text-amber-900 hover:bg-amber-100 gap-1.5 font-medium",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "w-3.5 h-3.5 text-amber-700" }), "Imprimir Listado"]
									})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "outline",
											size: "sm",
											onClick: imprimirPdfUbicacion,
											className: "h-8 text-xs border-slate-200 text-slate-700 hover:bg-slate-100 gap-1.5",
											title: "Imprimir PDF del contenido del armario",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "w-3.5 h-3.5 text-blue-600" }), "Imprimir PDF"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "outline",
											size: "sm",
											onClick: exportarExcelUbicacion,
											className: "h-8 text-xs border-slate-200 text-slate-700 hover:bg-slate-100 gap-1.5",
											title: "Descargar hoja Excel (.csv) del armario",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileSpreadsheet, { className: "w-3.5 h-3.5 text-emerald-600" }), "Exportar Excel"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: mostrarEscaner ? "default" : "outline",
											size: "sm",
											onClick: () => setMostrarEscaner(!mostrarEscaner),
											className: `h-8 text-xs gap-1.5 ${mostrarEscaner ? "bg-blue-600 text-white" : "border-slate-200 text-slate-700"}`,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "w-3.5 h-3.5" }), mostrarEscaner ? "Ocultar Cámara" : "Escanear Código"]
										})
									] })
								})
							]
						}), ubicacionSeleccionada.tipo === "reserva" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-5 flex-1 space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-4 rounded-xl bg-amber-500/10 border-2 border-amber-300 text-amber-950 space-y-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 font-bold text-xs uppercase tracking-wide text-amber-900",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Warehouse, { className: "w-4 h-4 text-amber-700" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Ubicación Restringida: Solo en Reserva" })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-xs text-amber-800 leading-relaxed",
											children: [
												"Por seguridad operativa y para evitar que el vendedor cree palets por error en estanterías o pasillos, la creación y alojamiento de palets está",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "estrictamente blindada solo para zonas de Reserva" }),
												"."
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-[11px] text-amber-800 bg-white/80 p-2.5 rounded-md border border-amber-200 flex items-center gap-2 font-medium",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "w-4 h-4 text-rose-600 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Regla de Autodestrucción:" }), " Cuando el palet salga a tienda para reponer y quede vacío (0 uds), se autodestruirá automáticamente en el sistema."] })]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "bg-white border border-amber-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
										className: "text-sm font-bold text-slate-900 flex items-center gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Boxes, { className: "w-4 h-4 text-amber-600" }),
											"Crear Palet en ",
											ubicacionSeleccionada.nombre
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-slate-500 mt-0.5",
										children: "Asigna correlativo oficial, código PAL-XXX y genera la etiqueta oficial homologada con Quién, Cuándo y Dónde."
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										onClick: () => handleCrearNuevoPalet(ubicacionSeleccionada.id),
										className: "bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-9 px-4 gap-2 shadow-xs shrink-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-4 h-4" }), "Crear Palet en Reserva"]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-xs font-bold text-slate-800 uppercase tracking-wider",
											children: [
												"Palets en esta Reserva (",
												palets.length,
												" activos)"
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs text-amber-700 font-semibold",
											children: "Etiquetas: Quién • Cuándo • Dónde"
										})]
									}), palets.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-8 text-center border-2 border-dashed border-amber-200 rounded-xl bg-amber-50/20 text-slate-500 text-xs space-y-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Boxes, { className: "w-8 h-8 text-amber-400 mx-auto" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-semibold text-slate-700",
												children: "No hay palets en esta reserva actualmente."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[11px] text-slate-500 max-w-sm mx-auto",
												children: "Haz clic en \"Crear Palet en Reserva\" para generar el primer palet con su correlativo y etiqueta física."
											})
										]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "space-y-3",
										children: palets.map((palet) => {
											const totalUds = palet.productos.reduce((a, b) => a + b.cantidad, 0);
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "p-4 rounded-xl border border-amber-200 bg-white shadow-2xs hover:border-amber-400 transition-all space-y-3",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center justify-between flex-wrap gap-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center gap-2",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
																className: "bg-amber-100 text-amber-900 border-amber-300 font-bold text-xs px-2.5 py-0.5",
																children: ["Palet #", String(palet.numero_palet).padStart(3, "0")]
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border",
																children: palet.codigo_barras
															})]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold",
															children: [totalUds, " unidades"]
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-200/80",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-[10px] text-slate-400 font-bold uppercase block",
																children: "DÓNDE (Ubicación)"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
																className: "text-amber-800 truncate block",
																children: ubicacionSeleccionada.nombre
															})] }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-[10px] text-slate-400 font-bold uppercase block",
																children: "QUIÉN (Generado Por)"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
																className: "text-slate-800 truncate block",
																children: palet.generado_por
															})] }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-[10px] text-slate-400 font-bold uppercase block",
																children: "CUÁNDO (Fecha y Hora)"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-slate-700 text-[11px] block",
																children: new Date(palet.generado_en).toLocaleString("es-ES")
															})] })
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "border rounded-md overflow-hidden bg-white text-xs divide-y divide-slate-100",
														children: palet.productos.map((prod) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "p-2 flex items-center justify-between",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "min-w-0 pr-2",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																	className: "font-semibold text-slate-900 truncate",
																	children: prod.nombre
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "text-[10px] text-slate-500 font-mono",
																	children: ["SKU: ", prod.sku]
																})]
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "font-bold text-slate-800 shrink-0",
																children: [prod.cantidad, " uds"]
															})]
														}, prod.id))
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-2 pt-1 border-t border-slate-100",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
															variant: "outline",
															size: "sm",
															onClick: () => {
																setPaletParaImprimir(palet);
																setModalEtiquetaPaletAbierto(true);
															},
															className: "flex-1 h-8 text-xs border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 gap-1.5 font-bold shadow-2xs",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "w-3.5 h-3.5 text-amber-700" }), "Imprimir Etiqueta"]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
															size: "sm",
															onClick: () => {
																setPaletSeleccionadoParaGestion(palet);
																setModalGestionPaletAbierto(true);
															},
															className: "flex-1 h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white gap-1.5 font-bold shadow-2xs",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "w-3.5 h-3.5 text-emerald-400" }), "Reponer en Tienda"]
														})]
													})
												]
											}, palet.id);
										})
									})]
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							mostrarEscaner && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-4 bg-slate-900 text-white border-b border-slate-800",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between mb-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-xs font-semibold flex items-center gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Barcode, { className: "w-4 h-4 text-emerald-400" }), "Lector de Códigos con Cámara"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "sm",
										onClick: () => setMostrarEscaner(false),
										className: "h-6 text-xs text-slate-400 hover:text-white",
										children: "Cerrar"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Escaner, {
									onCodigo: (cod) => {
										toast.info(`Código detectado: ${cod}`);
										const prodEncontrado = CATALOGO_PRODUCTOS_MOCK.find((p) => p.sku.toLowerCase() === cod.toLowerCase() || cod.includes(p.sku));
										if (prodEncontrado) {
											setProductoParaIncluir(prodEncontrado);
											setBusquedaProducto(`${prodEncontrado.nombre} (${prodEncontrado.sku})`);
											toast.success(`Producto identificado: ${prodEncontrado.nombre}`);
											setMostrarEscaner(false);
										} else toast.warning(`No se encontró ningún artículo para el código ${cod}`);
									},
									onCerrar: () => setMostrarEscaner(false)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-5 border-b border-slate-200 bg-white space-y-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
											className: "text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-3.5 h-3.5 text-blue-600" }), "Incluir Artículo en este Armario"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] text-slate-400",
											children: "Navega con flechas ↑ / ↓ y pulsa Enter"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex gap-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "relative flex-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														value: busquedaProducto,
														onChange: (e) => {
															setBusquedaProducto(e.target.value);
															setDropdownAbierto(true);
															setIndiceSugerencia(0);
														},
														onFocus: () => setDropdownAbierto(true),
														onKeyDown: handleKeyDownBuscador,
														placeholder: "Buscar por nombre o SKU (ej. Látex, LAT-4001)...",
														className: "pl-8 text-xs h-9 bg-slate-50 border-slate-200"
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "w-24",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "number",
														min: 1,
														value: cantidadParaIncluir,
														onChange: (e) => setCantidadParaIncluir(Math.max(1, Number(e.target.value))),
														className: "text-xs h-9 text-center bg-slate-50 border-slate-200",
														title: "Cantidad a añadir"
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													size: "sm",
													onClick: handleIncluirProductoEnUbicacion,
													disabled: !productoParaIncluir,
													className: "h-9 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs",
													children: "Añadir"
												})
											]
										}), dropdownAbierto && sugerenciasCatalogo.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "absolute top-full left-0 right-28 mt-1 bg-white rounded-lg border border-slate-200 shadow-lg z-30 max-h-56 overflow-y-auto",
											children: sugerenciasCatalogo.map((prod, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												onClick: () => {
													setProductoParaIncluir(prod);
													setBusquedaProducto(`${prod.nombre} (${prod.sku})`);
													setDropdownAbierto(false);
												},
												className: `p-2.5 text-xs cursor-pointer border-b border-slate-100 last:border-0 flex items-center justify-between ${idx === indiceSugerencia ? "bg-blue-50 text-blue-900 font-semibold" : "hover:bg-slate-50 text-slate-800"}`,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "font-medium",
													children: prod.nombre
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "text-[10px] text-slate-400 font-mono",
													children: [
														"SKU: ",
														prod.sku,
														" • ",
														prod.categoria
													]
												})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600",
													children: "Catálogo"
												})]
											}, prod.id))
										})]
									}),
									productoParaIncluir && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-2.5 rounded-md bg-blue-50/70 border border-blue-200 text-xs flex items-center justify-between text-blue-900",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Seleccionado: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: productoParaIncluir.nombre })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "block text-[10px] text-blue-700 font-mono",
											children: ["SKU: ", productoParaIncluir.sku]
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "ghost",
											size: "sm",
											onClick: () => {
												setProductoParaIncluir(null);
												setBusquedaProducto("");
											},
											className: "h-6 w-6 p-0 text-blue-700 hover:text-blue-900",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-3.5 h-3.5" })
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-5 flex-1 space-y-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-xs font-bold text-slate-800 uppercase tracking-wider",
										children: [
											"Contenido del Armario (",
											ubicacionSeleccionada.productos?.length || 0,
											" ",
											"artículos)"
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-slate-500",
										children: "Regla de Oro: Registro auditado en tabla movimientos"
									})]
								}), !ubicacionSeleccionada.productos || ubicacionSeleccionada.productos.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "p-8 text-center border border-dashed rounded-lg text-slate-400 text-xs",
									children: "Esta ubicación no contiene artículos en este momento. Utiliza el buscador o escáner superior para incluir productos."
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "divide-y divide-slate-150 border rounded-lg bg-white overflow-hidden shadow-2xs",
									children: ubicacionSeleccionada.productos.map((prod) => {
										const bajoStock = prod.cantidad <= prod.stock_minimo;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "min-w-0 flex-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-semibold text-xs text-slate-900",
														children: prod.nombre
													}), bajoStock && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
														className: "bg-rose-100 text-rose-800 border-rose-200 text-[10px] font-bold",
														children: "Bajo Stock"
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "text-[11px] text-slate-500 font-mono mt-0.5",
													children: [
														"SKU: ",
														prod.sku,
														" • ",
														prod.categoria,
														" • Mínimo: ",
														prod.stock_minimo,
														" ",
														"uds"
													]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "text-right",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-base font-bold text-slate-900",
														children: prod.cantidad
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-xs text-slate-400 ml-1",
														children: "uds"
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-1",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															variant: "outline",
															size: "sm",
															onClick: () => {
																setProductoEnOperacion(prod);
																setTipoOperacion("quitar");
																setCantidadOperacion(1);
																setMotivoOperacion("Venta o reposición en tienda");
																setAlertOperacionAbierta(true);
															},
															className: "h-7 w-7 p-0 text-rose-600 border-rose-200 hover:bg-rose-50",
															title: "Quitar unidades (Salida)",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "w-3.5 h-3.5" })
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															variant: "outline",
															size: "sm",
															onClick: () => {
																setProductoEnOperacion(prod);
																setTipoOperacion("anadir");
																setCantidadOperacion(5);
																setMotivoOperacion("Reposición de existencias");
																setAlertOperacionAbierta(true);
															},
															className: "h-7 w-7 p-0 text-emerald-600 border-emerald-200 hover:bg-emerald-50",
															title: "Añadir unidades (Entrada)",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-3.5 h-3.5" })
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															variant: "ghost",
															size: "sm",
															onClick: () => {
																setProductoEnOperacion(prod);
																setTipoOperacion("ajuste");
																setCantidadOperacion(prod.cantidad);
																setMotivoOperacion("Ajuste por recuento físico");
																setAlertOperacionAbierta(true);
															},
															className: "h-7 text-xs px-2 text-slate-600 hover:text-blue-600 font-medium",
															children: "Ajuste"
														})
													]
												})]
											})]
										}, prod.id);
									})
								})]
							})
						] })]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
				open: alertOperacionAbierta,
				onOpenChange: setAlertOperacionAbierta,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, {
						className: "text-base font-bold text-slate-900 flex items-center gap-2",
						children: tipoOperacion === "quitar" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "w-5 h-5 text-rose-600" }), "Confirmar Salida de Stock"] }) : tipoOperacion === "anadir" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-5 h-5 text-emerald-600" }), "Confirmar Reposición de Stock"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, { className: "w-5 h-5 text-amber-600" }), "Ajuste Directo de Conteo Físico"] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogDescription, {
						className: "text-xs text-slate-600",
						children: [
							"Esta operación registrará una mutación en la tabla ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "movimientos" }),
							" y actualizará el stock de ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: productoEnOperacion?.nombre }),
							" en",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: ubicacionSeleccionada?.nombre }),
							"."
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3 py-2 text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							className: "text-xs font-semibold text-slate-700 mb-1 block",
							children: tipoOperacion === "ajuste" ? "Nueva Cantidad Exacta (uds)" : "Cantidad a Procesar (uds)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "number",
							min: tipoOperacion === "ajuste" ? 0 : 1,
							value: cantidadOperacion,
							onChange: (e) => setCantidadOperacion(Number(e.target.value)),
							className: "h-8 text-xs font-semibold"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							className: "text-xs font-semibold text-slate-700 mb-1 block",
							children: "Motivo / Justificación"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: motivoOperacion,
							onChange: (e) => setMotivoOperacion(e.target.value),
							className: "h-8 text-xs"
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, {
						className: "text-xs h-8",
						children: "Cancelar"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
						onClick: ejecutarOperacionStock,
						className: `text-xs h-8 text-white ${tipoOperacion === "quitar" ? "bg-rose-600 hover:bg-rose-700" : tipoOperacion === "anadir" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"}`,
						children: "Confirmar y Registrar"
					})] })
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog$1, {
				open: modalEtiquetaPaletAbierto,
				onOpenChange: setModalEtiquetaPaletAbierto,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
					className: "max-w-md p-6 bg-white",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle$1, {
							className: "text-base font-bold text-slate-900 flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Barcode, { className: "w-5 h-5 text-amber-600" }), "Etiqueta Oficial de Palet"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
							className: "text-xs text-slate-500",
							children: "Formato homologado para imprimir y colocar sobre el palet físico en Reserva."
						})] }),
						paletParaImprimir && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-4 border-2 border-dashed border-amber-300 rounded-xl bg-amber-50/30 space-y-3 font-sans print-area",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between border-b border-amber-200 pb-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-black text-sm tracking-widest text-slate-900 uppercase",
										children: "LEROY MERLIN"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-300",
										children: ["PALET #", String(paletParaImprimir.numero_palet).padStart(3, "0")]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-center py-2 space-y-1 bg-white p-3 rounded-lg border border-amber-100 shadow-2xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-mono text-2xl font-black tracking-widest text-slate-900",
										children: "|||||| || ||||| |||||||"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-mono text-xs font-bold text-slate-800",
										children: paletParaImprimir.codigo_barras
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-2 text-xs border-t border-amber-200 pt-2 text-slate-700",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "p-2 bg-white rounded border border-amber-200/80",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] text-amber-800 block uppercase font-bold",
												children: "DÓNDE (Ubicación)"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
												className: "text-slate-900 text-xs block truncate",
												children: ubicaciones.find((u) => u.id === paletParaImprimir.id_reserva)?.nombre || ubicacionSeleccionada?.nombre || "Reserva (Almacén de Tienda)"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "p-2 bg-white rounded border border-amber-200/80",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] text-amber-800 block uppercase font-bold",
												children: "QUIÉN (Generado Por)"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
												className: "text-slate-900 text-xs block truncate",
												children: paletParaImprimir.generado_por
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "p-2 bg-white rounded border border-amber-200/80",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] text-amber-800 block uppercase font-bold",
												children: "CUÁNDO (Fecha y Hora)"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-slate-800 font-semibold text-xs block",
												children: new Date(paletParaImprimir.generado_en).toLocaleString("es-ES")
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "p-2 bg-white rounded border border-amber-200/80",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] text-amber-800 block uppercase font-bold",
												children: "CANTIDAD TOTAL"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-emerald-700 font-bold text-xs block",
												children: [paletParaImprimir.productos.reduce((a, b) => a + b.cantidad, 0), " unidades"]
											})]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-[11px] bg-white p-2.5 rounded border border-amber-200/80 space-y-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-bold text-[10px] text-slate-500 uppercase tracking-wider",
										children: "Artículos Asignados:"
									}), paletParaImprimir.productos.map((prod) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between items-center text-slate-800",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "truncate max-w-[220px]",
											children: [
												prod.nombre,
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "font-mono text-[10px] text-slate-400",
													children: [
														"(",
														prod.sku,
														")"
													]
												})
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
											className: "shrink-0",
											children: [prod.cantidad, " uds"]
										})]
									}, prod.id))]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[10px] text-amber-900 bg-amber-100/60 p-2 rounded text-center border border-amber-200 font-medium",
									children: "🔒 Ubicación fijada: Solo en Reserva. Al reponer en tienda y quedar vacío, se autodestruye."
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
							className: "mt-4 gap-2 no-print",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "sm",
								onClick: () => setModalEtiquetaPaletAbierto(false),
								children: "Cerrar"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								onClick: () => window.print(),
								className: "bg-amber-600 hover:bg-amber-700 text-white gap-1.5 font-bold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "w-3.5 h-3.5" }), "Imprimir Etiqueta"]
							})]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog$1, {
				open: modalGestionPaletAbierto,
				onOpenChange: setModalGestionPaletAbierto,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
					className: "max-w-lg p-6 bg-white",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle$1, {
							className: "text-base font-bold text-slate-900 flex items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Warehouse, { className: "w-5 h-5 text-amber-600" }),
								"Reponer Mercancía a Tienda desde Palet #",
								paletSeleccionadoParaGestion?.numero_palet
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
							className: "text-xs text-slate-500",
							children: "Traspasa la mercancía de este palet a las estanterías de tienda. Cuando el stock del palet llegue a 0, se autodestruirá automáticamente."
						})] }),
						paletSeleccionadoParaGestion && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-3 my-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "divide-y border rounded-lg overflow-hidden bg-slate-50/50",
								children: paletSeleccionadoParaGestion.productos.map((prod) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-3 flex items-center justify-between gap-3 text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-semibold text-slate-900",
										children: prod.nombre
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-[10px] text-slate-500 font-mono",
										children: [
											"SKU: ",
											prod.sku,
											" • Cantidad en Palet: ",
											prod.cantidad,
											" uds"
										]
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										onClick: () => handleReponerEnTienda(paletSeleccionadoParaGestion, prod.id, prod.cantidad),
										className: "h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5",
										children: [
											"Reponer Todo (",
											prod.cantidad,
											" uds)"
										]
									})]
								}, prod.id))
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, {
							className: "mt-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "sm",
								onClick: () => setModalGestionPaletAbierto(false),
								children: "Cerrar"
							})
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
				open: dialogEliminarAbierto,
				onOpenChange: setDialogEliminarAbierto,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogTitle, {
					className: "text-base text-slate-900 font-bold",
					children: [
						"¿Eliminar ubicación \"",
						ubicacionParaEliminar?.nombre,
						"\"?"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, {
					className: "text-xs text-slate-500",
					children: "Esta acción eliminará la ubicación del mapa del almacén. Solo se puede realizar si la ubicación no tiene productos con stock físico activo."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, {
					className: "text-xs h-8",
					children: "Cancelar"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
					onClick: confirmarEliminarUbicacion,
					className: "text-xs h-8 bg-rose-600 hover:bg-rose-700 text-white",
					children: "Eliminar Definitivamente"
				})] })] })
			})
		]
	});
}
//#endregion
export { UbicacionesPage as component };
