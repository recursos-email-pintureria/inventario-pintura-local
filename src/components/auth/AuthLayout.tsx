import type { ReactNode } from "react";
import { PaintRoller, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

/** Centered card shell shared by all auth pages. */
export function AuthLayout({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <main className="auth-bg flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <PaintRoller className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Inventario Pintura <span className="text-primary">- LM</span>
          </span>
        </div>
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </main>
  );
}

export function FormMessage({ type, text }: { type: "error" | "success"; text: string | null }) {
  if (!text) return null;
  const Icon = type === "error" ? AlertCircle : CheckCircle2;
  return (
    <Alert
      variant={type === "error" ? "destructive" : "success"}
      className="animate-in fade-in slide-in-from-top-1"
    >
      <Icon className="h-4 w-4" />
      <AlertDescription>{text}</AlertDescription>
    </Alert>
  );
}

export function Spinner() {
  return <Loader2 className="h-4 w-4 animate-spin" />;
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
