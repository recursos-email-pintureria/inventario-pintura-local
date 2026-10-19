import { createFileRoute } from "@tanstack/react-router";
import Login from "@/pages/Login";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Iniciar sesión · Inventario Pintura - LM" },
      { name: "description", content: "Accede al inventario de la sección de pintura." },
      { property: "og:title", content: "Iniciar sesión · Inventario Pintura - LM" },
      { property: "og:description", content: "Accede al inventario de la sección de pintura." },
    ],
  }),
  ssr: false,
  component: Login,
});
