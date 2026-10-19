import { createFileRoute } from "@tanstack/react-router";
import Register from "@/pages/Register";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Crear cuenta · Inventario Pintura - LM" },
      { name: "description", content: "Regístrate en el inventario de pintura." },
      { property: "og:title", content: "Crear cuenta · Inventario Pintura - LM" },
      { property: "og:description", content: "Regístrate en el inventario de pintura." },
    ],
  }),
  ssr: false,
  component: Register,
});
