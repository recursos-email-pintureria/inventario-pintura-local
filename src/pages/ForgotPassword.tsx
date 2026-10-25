import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout, FormMessage, Spinner } from "@/components/auth/AuthLayout";
import { supabase, authErrorMessage } from "@/lib/supabase";

const schema = z.object({
  email: z.string().trim().min(1, "El email es obligatorio").email("Formato de email no válido"),
});
type Values = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ email }: Values) => {
    setError(null);
    setSuccess(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setError(authErrorMessage(error));
    else setSuccess("Si el email existe, recibirás un enlace para restablecer tu contraseña.");
  };

  return (
    <AuthLayout
      title="¿Olvidaste tu contraseña?"
      description="Te enviaremos un enlace de recuperación"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormMessage type="error" text={error} />
        <FormMessage type="success" text={success} />
        <div className="space-y-2">
          <Label htmlFor="email">Email corporativo</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Spinner />} {isSubmitting ? "Enviando..." : "Enviar enlace"}
        </Button>
        <p className="text-center text-sm">
          <Link to="/login" className="font-medium text-primary hover:underline">
            Volver al login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
