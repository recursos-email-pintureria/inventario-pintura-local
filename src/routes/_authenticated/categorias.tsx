import { createFileRoute } from "@tanstack/react-router";
import { FolderTree, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/AppLayout";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/_authenticated/categorias")({
  head: () => pageHead("Categorías", "Categorías de productos de pintura."),
  component: Categorias,
});

const CATS = ["Interior", "Exterior", "Esmaltes", "Imprimaciones", "Barnices", "Herramientas"];

function Categorias() {
  return (
    <>
      <PageHeader title="Categorías" action={<Button><Plus className="h-4 w-4" /> Nueva categoría</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATS.map((c) => (
          <Card key={c} className="transition-shadow hover:shadow-soft">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-lg bg-accent p-3 text-primary"><FolderTree className="h-5 w-5" /></div>
              <div>
                <p className="font-semibold">{c}</p>
                <p className="text-sm text-muted-foreground">0 productos</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
