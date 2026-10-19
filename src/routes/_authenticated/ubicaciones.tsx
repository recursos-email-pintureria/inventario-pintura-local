import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { MapPin, Plus, Pencil, Power } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/AppLayout";
import { pageHead } from "@/lib/meta";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useMyProfile } from "@/hooks/usePermissions";
import { ubicacionesQueryOptions, guardarUbicacion, desactivarUbicacion, errorUbicaciones, filtrarUbicaciones, puedeGestionarUbicaciones, tiposUbicacion, type Ubicacion, type TipoUbicacion } from "@/lib/ubicaciones";
import { inventarioQueryOptions, productosEnUbicacion, type Stock } from "@/lib/inventario";
import { ErrorInventario } from "@/components/inventario/EstadoInventario";

export const Route = createFileRoute("/_authenticated/ubicaciones")({
  head: () => pageHead("Ubicaciones", "Pasillos, altos y armarios de la sección."),
  loader: async ({ context }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error("Inicia sesión para ver las ubicaciones.");
    await Promise.all([context.queryClient.ensureQueryData(ubicacionesQueryOptions(data.user.id)), context.queryClient.ensureQueryData(inventarioQueryOptions(data.user.id))]);
    return { userId: data.user.id };
  },
  pendingComponent: () => <><PageHeader title="Ubicaciones" /><p role="status" className="text-muted-foreground">Cargando ubicaciones…</p></>,
  errorComponent: ErrorInventario,
  component: Ubicaciones,
});

function List({ items, stock, gestionar, editar, desactivar }: { items: Ubicacion[]; stock: Stock[]; gestionar: boolean; editar: (u: Ubicacion) => void; desactivar: (u: Ubicacion) => void }) {
  if (!items.length) return <p className="py-6 text-sm text-muted-foreground">No hay ubicaciones activas en esta sección.</p>;
  return (
    <Card className="divide-y">
      {items.map((u) => (
        <div key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1"><p className="break-words font-medium">{u.nombre}</p><p className="text-sm text-muted-foreground">{tiposUbicacion[u.tipo]}</p>{u.descripcion && <p className="break-words text-sm text-muted-foreground">{u.descripcion}</p>}</div>
          <span className="text-sm text-muted-foreground">{productosEnUbicacion(stock, u.id)} productos</span>
          {gestionar && <div className="ml-auto flex flex-wrap gap-1"><Button size="sm" variant="ghost" onClick={() => editar(u)}><Pencil className="h-4 w-4" />Editar</Button><Button size="sm" variant="ghost" onClick={() => desactivar(u)}><Power className="h-4 w-4" />Desactivar</Button></div>}
        </div>
      ))}
    </Card>
  );
}

function Ubicaciones() {
  const { userId } = Route.useLoaderData();
  const { data: items } = useSuspenseQuery(ubicacionesQueryOptions(userId));
  const { data: inventario } = useSuspenseQuery(inventarioQueryOptions(userId));
  const { user } = useAuth();
  const { permisos } = useMyProfile();
  const gestionar = puedeGestionarUbicaciones(permisos);
  const editar = gestionar && permisos?.puede_editar_ubicaciones === true;
  const queryClient = useQueryClient();
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Ubicacion | null>(null);
  const [desactivando, setDesactivando] = useState<Ubicacion | null>(null);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoUbicacion>("pasillo");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const visibles = items.filter(u => u.nombre.toLocaleLowerCase("es").includes(busqueda.trim().toLocaleLowerCase("es")));
  const actualizar = () => Promise.all([queryClient.invalidateQueries({ queryKey: ["ubicaciones", userId] }), queryClient.invalidateQueries({ queryKey: ["inventario", userId] })]);
  const guardar = useMutation({
    mutationFn: async () => {
      if (!(editando ? editar : gestionar) || !user) throw new Error("No tienes permiso para guardar ubicaciones.");
      return guardarUbicacion({ nombre, tipo, descripcion }, editando?.id);
    },
    onSuccess: async () => { await actualizar(); setAbierto(false); toast.success(editando ? "Ubicación actualizada" : "Ubicación creada"); },
    onError: (e) => setError(errorUbicaciones(e)),
  });
  const desactivar = useMutation({
    mutationFn: async () => {
      if (!editar || !desactivando) throw new Error("No tienes permiso para desactivar ubicaciones.");
      return desactivarUbicacion(desactivando.id);
    },
    onSuccess: async () => { await actualizar(); setDesactivando(null); toast.success("Ubicación desactivada"); },
    onError: (e) => setError(errorUbicaciones(e)),
  });
  const abrir = (u: Ubicacion | null) => {
    setEditando(u); setNombre(u?.nombre ?? ""); setTipo(u?.tipo ?? "pasillo"); setDescripcion(u?.descripcion ?? ""); setError(""); setAbierto(true);
  };
  const enviar = (e: FormEvent) => { e.preventDefault(); setError(""); guardar.mutate(); };
  return (
    <>
      <PageHeader title="Ubicaciones" action={gestionar ? <Button onClick={() => abrir(null)}><Plus className="h-4 w-4" /> Nueva ubicación</Button> : undefined} />
      <Input aria-label="Buscar ubicaciones" placeholder="Buscar por nombre…" value={busqueda} onChange={e => setBusqueda(e.target.value)} className="mb-4 max-w-sm" />
      <Tabs defaultValue="pasillos">
        <TabsList>
          <TabsTrigger value="pasillos">Pasillos</TabsTrigger>
          <TabsTrigger value="altos">Altos/Armarios</TabsTrigger>
        </TabsList>
        {(["pasillos", "altos"] as const).map((seccion) => <TabsContent key={seccion} value={seccion} className="mt-4"><List items={filtrarUbicaciones(visibles, seccion)} stock={inventario.stock} gestionar={editar} editar={abrir} desactivar={(u) => { setError(""); setDesactivando(u); }} /></TabsContent>)}
      </Tabs>
      <Dialog open={abierto} onOpenChange={(o) => { if (!guardar.isPending) setAbierto(o); }}>
        <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto">
          <DialogHeader><DialogTitle>{editando ? "Editar ubicación" : "Nueva ubicación"}</DialogTitle><DialogDescription>{editando ? editando.nombre : "Datos de la ubicación"}</DialogDescription></DialogHeader>
          <form onSubmit={enviar} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="ubicacion-nombre">Nombre</Label><Input id="ubicacion-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required disabled={guardar.isPending} /></div>
            <div className="space-y-2"><Label htmlFor="ubicacion-tipo">Tipo</Label><Select value={tipo} disabled={guardar.isPending} onValueChange={(v) => { if (v === "pasillo" || v === "alto" || v === "armario") setTipo(v); }}><SelectTrigger id="ubicacion-tipo"><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(tiposUbicacion) as TipoUbicacion[]).map((t) => <SelectItem key={t} value={t}>{tiposUbicacion[t]}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="ubicacion-descripcion">Descripción (opcional)</Label><Textarea id="ubicacion-descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} disabled={guardar.isPending} /></div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={guardar.isPending} onClick={() => setAbierto(false)}>Cancelar</Button><Button type="submit" disabled={guardar.isPending || !nombre.trim() || !gestionar}>{guardar.isPending ? "Guardando…" : "Guardar"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!desactivando} onOpenChange={(o) => { if (!o && !desactivar.isPending) setDesactivando(null); }}>
        <DialogContent className="w-[calc(100%-2rem)]"><DialogHeader><DialogTitle>Desactivar ubicación</DialogTitle><DialogDescription>¿Desactivar «{desactivando?.nombre}»? Dejará de aparecer en las listas de ubicaciones activas.</DialogDescription></DialogHeader>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex justify-end gap-2"><Button variant="outline" disabled={desactivar.isPending} onClick={() => setDesactivando(null)}>Cancelar</Button><Button variant="destructive" disabled={desactivar.isPending || !gestionar} onClick={() => { setError(""); desactivar.mutate(); }}>{desactivar.isPending ? "Desactivando…" : "Desactivar"}</Button></div></DialogContent>
      </Dialog>
    </>
  );
}
