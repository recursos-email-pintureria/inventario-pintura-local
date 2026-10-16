import { createFileRoute } from "@tanstack/react-router";
import ResetPassword from "@/pages/ResetPassword";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nueva contraseña · Inventario Pintura - LM" },
      { name: "description", content: "Establece una nueva contraseña." },
      { property: "og:title", content: "Nueva contraseña · Inventario Pintura - LM" },
      { property: "og:description", content: "Establece una nueva contraseña." },
    ],
  }),
  ssr: false,
  component: ResetPassword,
});
