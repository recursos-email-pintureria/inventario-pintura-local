import { createFileRoute } from "@tanstack/react-router";
import ForgotPassword from "@/pages/ForgotPassword";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Recuperar contraseña · Inventario Pintura - LM" },
      { name: "description", content: "Recibe un enlace para restablecer tu contraseña." },
      { property: "og:title", content: "Recuperar contraseña · Inventario Pintura - LM" },
      { property: "og:description", content: "Recibe un enlace para restablecer tu contraseña." },
    ],
  }),
  ssr: false,
  component: ForgotPassword,
});
