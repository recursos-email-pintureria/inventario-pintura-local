import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/AppLayout";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/_authenticated/productos")({
  head: () => pageHead("Productos", "Listado de productos de pintura."),
  component: Productos,
});

const ROWS = [
  { sku: "PNT-0001", name: "Pintura plástica blanca 15L", cat: "Interior", stock: 24 },
  { sku: "PNT-0002", name: "Esmalte sintético negro 750ml", cat: "Esmaltes", stock: 8 },
  { sku: "PNT-0003", name: "Imprimación multiuso 4L", cat: "Imprimaciones", stock: 3 },
];

function Productos() {
  return (
    <>
      <PageHeader title="Productos" action={<Button><Plus className="h-4 w-4" /> Nuevo producto</Button>} />
      <Card className="p-4">
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por SKU o nombre…" className="pl-9" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead><TableHead>Nombre</TableHead><TableHead>Categoría</TableHead>
              <TableHead className="text-right">Stock</TableHead><TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROWS.map((r) => (
              <TableRow key={r.sku}>
                <TableCell className="font-mono text-xs">{r.sku}</TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.cat}</TableCell>
                <TableCell className="text-right">{r.stock}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" aria-label="Eliminar"><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Mostrando 1–3 de 3</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Anterior</Button>
            <Button variant="outline" size="sm" disabled>Siguiente</Button>
          </div>
        </div>
      </Card>
    </>
  );
}
