import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthLayout, FormMessage, Spinner } from "@/components/auth/AuthLayout";
import { useAuth } from "@/contexts/AuthContext";
import { authErrorMessage } from "@/lib/supabase";

const schema = z.object({
  email: z.string().trim().min(1, "El email es obligatorio").email("Formato de email no válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
  remember: z.boolean(),
});
type Values = z.infer<typeof schema>;

export default function Login() {
  const { signIn, session } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: true },
  });

  // Already signed in → go to dashboard.
  useEffect(() => {
    if (session) navigate({ to: "/dashboard", replace: true });
  }, [session, navigate]);

  const onSubmit = async (v: Values) => {
    setError(null);
    try {
      await signIn(v.email, v.password, v.remember);
      navigate({ to: "/dashboard", replace: true });
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === "email_not_confirmed" || /not confirmed/i.test((e as Error).message)) {
        navigate({ to: "/verify-email", search: { email: v.email } });
        return;
      }
      setError(authErrorMessage(e));
    }
  };

  return (
    <AuthLayout title="Iniciar sesión" description="Accede con tu email corporativo">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormMessage type="error" text={error} />
        <div className="space-y-2">
          <Label htmlFor="email">Email corporativo</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="nombre@empresa.com" {...register("email")} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={watch("remember")}
            onCheckedChange={(c) => setValue("remember", c === true)}
          />
          <Label htmlFor="remember" className="font-normal">Recordar sesión</Label>
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Spinner />} {isSubmitting ? "Entrando..." : "Entrar"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">Regístrate</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
