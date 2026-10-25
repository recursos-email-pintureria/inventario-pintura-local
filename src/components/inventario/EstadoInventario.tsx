import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { errorInventario } from "@/lib/inventario";
export function ErrorInventario({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  const boundary = useQueryErrorResetBoundary();
  return (
    <div role="alert" className="space-y-3">
      <p className="text-destructive">{errorInventario(error)}</p>
      <Button
        variant="outline"
        onClick={async () => {
          boundary.reset();
          await router.invalidate();
          reset();
        }}
      >
        Reintentar
      </Button>
    </div>
  );
}
export function CargandoInventario() {
  return (
    <p role="status" className="text-sm text-muted-foreground">
      Cargando datos…
    </p>
  );
}
