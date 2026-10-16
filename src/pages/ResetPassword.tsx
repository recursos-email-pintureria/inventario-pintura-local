import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout, FormMessage, Spinner } from "@/components/auth/AuthLayout";
import { supabase, authErrorMessage } from "@/lib/supabase";

const schema = z
  .object({ password: z.string().min(8, "Mínimo 8 caracteres"), confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "Las contraseñas no coinciden", path: ["confirm"] });
type Values = z.infer<typeof schema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
  });

  // The recovery link signs the user in temporarily (token in URL hash/code).
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else if (!window.location.hash.includes("type=recovery") && !window.location.search.includes("code="))
        setError("El enlace no es válido o ha caducado. Solicita uno nuevo.");
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const onSubmit = async ({ password }: Values) => {
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return setError(authErrorMessage(error));
    setSuccess("Contraseña actualizada. Redirigiendo...");
    setTimeout(() => navigate({ to: "/dashboard", replace: true }), 1500);
  };

  return (
    <AuthLayout title="Nueva contraseña" description="Elige una contraseña segura">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormMessage type="error" text={error} />
        <FormMessage type="success" text={success} />
        <div className="space-y-2">
          <Label htmlFor="password">Nueva contraseña</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Repite la contraseña</Label>
          <Input id="confirm" type="password" autoComplete="new-password" {...register("confirm")} />
          {errors.confirm && <p className="text-sm text-destructive">{errors.confirm.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting || !ready || !!success}>
          {isSubmitting && <Spinner />} {isSubmitting ? "Guardando..." : "Guardar contraseña"}
        </Button>
        <p className="text-center text-sm">
          <Link to="/forgot-password" className="font-medium text-primary hover:underline">Solicitar nuevo enlace</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
