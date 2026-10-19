import { createFileRoute, redirect } from "@tanstack/react-router";

// Login is the default page.
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Inventario Pintura - LM" },
      { name: "description", content: "Control de existencias y ubicaciones de la sección de pintura." },
      { property: "og:title", content: "Inventario Pintura - LM" },
      { property: "og:description", content: "Control de existencias y ubicaciones de la sección de pintura." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
});
