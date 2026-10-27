import { N as Layers, T as Package, ct as Archive, et as Building2, f as Shuffle, n as Warehouse, ot as ArrowLeftRight } from "../_libs/lucide-react.mjs";
import { _ as lazyRouteComponent, v as createFileRoute } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ubicaciones-jP8x7QJc.js
var $$splitComponentImporter = () => import("./ubicaciones-tDQx8cvr.mjs");
var Route = createFileRoute("/_authenticated/ubicaciones")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var CONFIG_JERARQUIA = {
	seccion: {
		label: "Sección",
		nivel: 0,
		icon: Building2,
		badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-200",
		borderClass: "border-indigo-300",
		bgHoverClass: "hover:bg-indigo-50/60",
		descripcion: "Nivel 0: Área principal (No requiere padre)"
	},
	pasillo: {
		label: "Pasillo",
		nivel: 1,
		icon: ArrowLeftRight,
		badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
		borderClass: "border-blue-300",
		bgHoverClass: "hover:bg-blue-50/60",
		descripcion: "Nivel 1: Corredor principal (Pertenece a Sección)"
	},
	caja: {
		label: "Caja",
		nivel: 1,
		icon: Package,
		badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
		borderClass: "border-rose-300",
		bgHoverClass: "hover:bg-rose-50/60",
		descripcion: "Nivel 1: Caja independiente (Sin niveles inferiores)"
	},
	reserva: {
		label: "Reserva",
		nivel: 1,
		icon: Warehouse,
		badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
		borderClass: "border-amber-300",
		bgHoverClass: "hover:bg-amber-50/60",
		descripcion: "Nivel 1: Almacén de tienda / Palets (Sin niveles inferiores)"
	},
	armario: {
		label: "Armario",
		nivel: 2,
		icon: Archive,
		badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
		borderClass: "border-emerald-300",
		bgHoverClass: "hover:bg-emerald-50/60",
		descripcion: "Nivel 2: Estantería media (Requiere Pasillo)"
	},
	alto: {
		label: "Alto",
		nivel: 2,
		icon: Layers,
		badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
		borderClass: "border-emerald-300",
		bgHoverClass: "hover:bg-emerald-50/60",
		descripcion: "Nivel 2: Nivel superior / altillo (Requiere Pasillo)"
	},
	cross: {
		label: "Cross",
		nivel: 2,
		icon: Shuffle,
		badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
		borderClass: "border-purple-300",
		bgHoverClass: "hover:bg-purple-50/60",
		descripcion: "Nivel 2: Cruce de alta rotación (Requiere Pasillo)"
	}
};
//#endregion
export { Route as n, CONFIG_JERARQUIA as t };
