import { _ as lazyRouteComponent, v as createFileRoute } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/verify-email-BSejn3A1.js
var $$splitComponentImporter = () => import("./verify-email-DD6zoDLN.mjs");
var Route = createFileRoute("/verify-email")({
	validateSearch: (s) => ({ email: typeof s["email"] === "string" ? s["email"] : void 0 }),
	head: () => ({ meta: [
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		},
		{ title: "Verifica tu email · Inventario Pintura - LM" },
		{
			name: "description",
			content: "Confirma tu email para acceder."
		},
		{
			property: "og:title",
			content: "Verifica tu email · Inventario Pintura - LM"
		},
		{
			property: "og:description",
			content: "Confirma tu email para acceder."
		}
	] }),
	ssr: false,
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
