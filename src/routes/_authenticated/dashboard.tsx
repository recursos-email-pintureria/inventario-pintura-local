import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeftRight, MapPin, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/AppLayout";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => pageHead("Dashboard", "Resumen del inventario de pintura."),
  component: Dashboard,
});

const STATS = [
  { label: "Total de productos", value: "—", icon: Package },
  { label: "Stock bajo", value: "—", icon: AlertTriangle },
  { label: "Movimientos hoy", value: "—", icon: ArrowLeftRight },
  { label: "Ubicaciones activas", value: "—", icon: MapPin },
];

function Dashboard() {
  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-lg bg-accent p-3 text-primary"><s.icon className="h-5 w-5" /></div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle className="text-lg">Actividad reciente</CardTitle></CardHeader>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">Aún no hay actividad.</CardContent>
      </Card>
    </>
  );
}
