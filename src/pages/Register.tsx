import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout, FormMessage, Spinner } from "@/components/auth/AuthLayout";
import { useAuth } from "@/contexts/AuthContext";
import { authErrorMessage } from "@/lib/supabase";

const schema = z
  .object({
    email: z.string().trim().min(1, "El email es obligatorio").email("Formato de email no válido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Las contraseñas no coinciden",
    path: ["confirm"],
  });
type Values = z.infer<typeof schema>;

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (v: Values) => {
    setError(null);
    try {
      await signUp(v.email, v.password);
      navigate({ to: "/verify-email", search: { email: v.email } });
    } catch (e) {
      setError(authErrorMessage(e));
    }
  };

  return (
    <AuthLayout title="Crear cuenta" description="Regístrate con tu email corporativo">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormMessage type="error" text={error} />
        <div className="space-y-2">
          <Label htmlFor="email">Email corporativo</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Repite la contraseña</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            {...register("confirm")}
          />
          {errors.confirm && <p className="text-sm text-destructive">{errors.confirm.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Spinner />} {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
