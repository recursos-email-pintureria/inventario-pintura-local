import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { edgeFunctionErrorMessage, supabase } from "@/lib/supabase";

export function CambioPasswordObligatorio() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");

  const guardar = useMutation({
    mutationFn: async () => {
      if (password.length < 8) {
        throw new Error("La contraseña debe tener al menos 8 caracteres.");
      }
      if (password !== confirmacion) {
        throw new Error("Las contraseñas no coinciden.");
      }

      const { data, error } = await supabase.functions.invoke<{ success: boolean }>(
        "completar-cambio-password",
        { body: { nueva_password: password } },
      );
      if (error) throw new Error(await edgeFunctionErrorMessage(error));
      if (data?.success !== true) {
        throw new Error("El servidor no confirmó el cambio de contraseña.");
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["mi-perfil", user?.id] });
    },
  });

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md space-y-5 p-6">
        <div className="space-y-2">
          <KeyRound className="h-6 w-6 text-amber-600" aria-hidden="true" />
          <h1 className="text-xl font-semibold">Cambia tu contraseña</h1>
          <p className="text-sm text-muted-foreground">
            El administrador ha restablecido tu contraseña. Elige una nueva para continuar.
          </p>
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            guardar.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="nueva-password">Nueva contraseña</Label>
            <Input
              id="nueva-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmar-password">Repite la contraseña</Label>
            <Input
              id="confirmar-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={confirmacion}
              onChange={(event) => setConfirmacion(event.target.value)}
              required
            />
          </div>
          {guardar.error && (
            <p className="text-sm text-destructive" role="alert">
              {guardar.error.message}
            </p>
          )}
          <Button className="w-full" type="submit" disabled={guardar.isPending}>
            {guardar.isPending ? "Guardando…" : "Guardar y continuar"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
