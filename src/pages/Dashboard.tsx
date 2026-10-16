/** Temporary empty dashboard, only to verify post-login redirect. */
import { useNavigate } from "@tanstack/react-router";
import { LogOut, PaintRoller } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login", replace: true });
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b bg-card px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 font-bold">
          <PaintRoller className="h-5 w-5 text-primary" /> Inventario Pintura - LM
        </div>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </Button>
      </header>
      <section className="mx-auto max-w-3xl px-4 py-16 text-center animate-in fade-in">
        <h1 className="text-2xl font-bold">Bienvenido</h1>
        <p className="mt-2 text-muted-foreground">Sesión iniciada como {user?.email}</p>
      </section>
    </main>
  );
}
