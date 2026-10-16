import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/AppLayout";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/_authenticated/ubicaciones")({
  head: () => pageHead("Ubicaciones", "Pasillos, altos y armarios de la sección."),
  component: Ubicaciones,
});

function List({ items }: { items: string[] }) {
  return (
    <Card className="divide-y">
      {items.map((i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="font-medium">{i}</span>
          <span className="ml-auto text-sm text-muted-foreground">0 productos</span>
        </div>
      ))}
    </Card>
  );
}

function Ubicaciones() {
  return (
    <>
      <PageHeader title="Ubicaciones" action={<Button><Plus className="h-4 w-4" /> Nueva ubicación</Button>} />
      <Tabs defaultValue="pasillos">
        <TabsList>
          <TabsTrigger value="pasillos">Pasillos</TabsTrigger>
          <TabsTrigger value="altos">Altos/Armarios</TabsTrigger>
        </TabsList>
        <TabsContent value="pasillos" className="mt-4"><List items={["Pasillo 1", "Pasillo 2", "Pasillo 3"]} /></TabsContent>
        <TabsContent value="altos" className="mt-4"><List items={["Alto A", "Alto B", "Armario 1"]} /></TabsContent>
      </Tabs>
    </>
  );
}
