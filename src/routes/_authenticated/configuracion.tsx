import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/AppLayout";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/_authenticated/configuracion")({
  head: () => pageHead("Configuración", "Perfil, preferencias y notificaciones."),
  component: Configuracion,
});

const SECTIONS = [
  { t: "Perfil", d: "Nombre, email y contraseña." },
  { t: "Preferencias", d: "Idioma, formato y vista por defecto." },
  { t: "Notificaciones", d: "Avisos de stock bajo y movimientos." },
];

function Configuracion() {
  return (
    <>
      <PageHeader title="Configuración" />
      <div className="space-y-4">
        {SECTIONS.map((s) => (
          <Card key={s.t}>
            <CardHeader><CardTitle className="text-lg">{s.t}</CardTitle><CardDescription>{s.d}</CardDescription></CardHeader>
            <CardContent className="text-sm text-muted-foreground">Próximamente.</CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
