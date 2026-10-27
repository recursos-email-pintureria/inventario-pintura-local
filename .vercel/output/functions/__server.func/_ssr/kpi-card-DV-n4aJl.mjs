import { I as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { s as TrendingUp } from "../_libs/lucide-react.mjs";
import { t as Badge } from "./dialog-CkqkUyDr.mjs";
import { n as CardContent, t as Card } from "./card-DTXKoxUD.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/kpi-card-DV-n4aJl.js
var import_jsx_runtime = require_jsx_runtime();
var colorConfig = {
	amber: {
		text: "text-amber-700",
		border: "border-l-amber-600",
		iconBg: "bg-amber-100",
		iconText: "text-amber-700"
	},
	rose: {
		text: "text-rose-700",
		border: "border-l-rose-600",
		iconBg: "bg-rose-100",
		iconText: "text-rose-700"
	},
	emerald: {
		text: "text-emerald-700",
		border: "border-l-emerald-600",
		iconBg: "bg-emerald-100",
		iconText: "text-emerald-700"
	},
	blue: {
		text: "text-blue-700",
		border: "border-l-blue-600",
		iconBg: "bg-blue-100",
		iconText: "text-blue-700"
	},
	indigo: {
		text: "text-indigo-700",
		border: "border-l-indigo-600",
		iconBg: "bg-indigo-100",
		iconText: "text-indigo-700"
	},
	slate: {
		text: "text-slate-700",
		border: "border-l-slate-600",
		iconBg: "bg-slate-100",
		iconText: "text-slate-700"
	}
};
function KPICard({ data }) {
	const colors = colorConfig[data.color] || colorConfig.slate;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
		className: `border-l-4 ${colors.border} border-slate-200 shadow-md transition-shadow hover:shadow-lg`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
			className: "p-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium text-slate-600",
							children: data.label
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: `text-3xl font-bold tracking-tight ${colors.text}`,
							children: data.value
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [data.trend && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1 text-xs text-slate-500",
								children: [data.trendUp && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "h-3 w-3 text-emerald-600" }), data.trend]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-slate-400",
								children: data.sublabel
							})]
						}),
						data.alert && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							className: "mt-1 border-rose-300 bg-rose-50 text-rose-700",
							children: data.alert
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: `rounded-lg p-2.5 ${colors.iconBg}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: colors.iconText,
						children: data.icon
					})
				})]
			})
		})
	});
}
//#endregion
export { KPICard as t };
