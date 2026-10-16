import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout, FormMessage, Spinner } from "@/components/auth/AuthLayout";
import { useAuth } from "@/contexts/AuthContext";
import { authErrorMessage } from "@/lib/supabase";

export default function VerifyEmail({ initialEmail }: { initialEmail?: string }) {
  const { resendVerification } = useAuth();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resend = async () => {
    setError(null);
    setSuccess(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Introduce un email válido.");
    setSending(true);
    try {
      await resendVerification(email);
      setSuccess("Email de verificación reenviado. Revisa tu bandeja de entrada.");
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthLayout title="Verifica tu email">
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-3 rounded-xl bg-accent p-5 text-center">
          <MailCheck className="h-10 w-10 text-primary" />
          <p className="font-medium text-accent-foreground">
            Por favor verifica tu email antes de continuar
          </p>
          <p className="text-sm text-muted-foreground">
            Te hemos enviado un enlace de verificación. Ábrelo y después inicia sesión.
          </p>
        </div>
        <FormMessage type="error" text={error} />
        <FormMessage type="success" text={success} />
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Button onClick={resend} variant="outline" className="w-full" disabled={sending}>
          {sending && <Spinner />} Reenviar email de verificación
        </Button>
        <Button asChild className="w-full">
          <Link to="/login">Ir al login</Link>
        </Button>
      </div>
    </AuthLayout>
  );
}
