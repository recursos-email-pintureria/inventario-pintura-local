import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/AppLayout";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => pageHead("Usuarios", "Gestión de usuarios y roles."),
  component: Usuarios,
});

const USERS = [
  { name: "Ana López", email: "ana@ejemplo.com", role: "Admin", active: true },
  { name: "Carlos Ruiz", email: "carlos@ejemplo.com", role: "Empleado", active: true },
  { name: "Marta Gil", email: "marta@ejemplo.com", role: "Empleado", active: false },
];

function Usuarios() {
  return (
    <>
      <PageHeader title="Usuarios" action={<Button><Plus className="h-4 w-4" /> Nuevo usuario</Button>} />
      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead><TableHead>Email</TableHead><TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {USERS.map((u) => (
              <TableRow key={u.email}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell><Badge variant={u.active ? "default" : "secondary"}>{u.active ? "Activo" : "Inactivo"}</Badge></TableCell>
                <TableCell className="text-right"><Button variant="ghost" size="icon" aria-label="Editar"><Pencil className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
