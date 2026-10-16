import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/pages/Dashboard";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Panel · Inventario Pintura - LM" },
      { name: "description", content: "Panel del inventario de pintura." },
      { property: "og:title", content: "Panel · Inventario Pintura - LM" },
      { property: "og:description", content: "Panel del inventario de pintura." },
    ],
  }),
  component: Dashboard,
});
