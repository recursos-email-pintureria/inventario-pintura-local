import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/AppLayout";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/_authenticated/movimientos")({
  head: () => pageHead("Movimientos", "Entradas, salidas y traslados de stock."),
  component: Movimientos,
});

function Movimientos() {
  return (
    <>
      <PageHeader title="Movimientos" />
      <Card className="p-4">
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Select>
            <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="entrada">Entrada</SelectItem>
              <SelectItem value="salida">Salida</SelectItem>
              <SelectItem value="traslado">Traslado</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" />
          <Input placeholder="Producto…" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead><TableHead>Tipo</TableHead><TableHead>Producto</TableHead>
              <TableHead className="text-right">Cantidad</TableHead><TableHead>Usuario</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Sin movimientos todavía.</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
