import { createFileRoute } from "@tanstack/react-router";
import VerifyEmail from "@/pages/VerifyEmail";

export const Route = createFileRoute("/verify-email")({
  validateSearch: (s: Record<string, unknown>) => ({
    email: typeof s["email"] === "string" ? s["email"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Verifica tu email · Inventario Pintura - LM" },
      { name: "description", content: "Confirma tu email para acceder." },
      { property: "og:title", content: "Verifica tu email · Inventario Pintura - LM" },
      { property: "og:description", content: "Confirma tu email para acceder." },
    ],
  }),
  ssr: false,
  component: Page,
});

function Page() {
  const { email } = Route.useSearch();
  return <VerifyEmail initialEmail={email} />;
}
