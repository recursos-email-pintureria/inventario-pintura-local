/** Main app shell: fixed sidebar (sheet on mobile), sticky header, scrollable content. */
import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeftRight, DoorOpen, FolderTree, LayoutDashboard, LogOut, MapPin, Menu, Package,
  PaintRoller, Settings, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useMyProfile } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/productos", label: "Productos", icon: Package },
  { to: "/categorias", label: "Categorías", icon: FolderTree },
  { to: "/ubicaciones", label: "Ubicaciones", icon: MapPin },
  { to: "/movimientos", label: "Movimientos", icon: ArrowLeftRight },
  { to: "/usuarios", label: "Usuarios", icon: Users, adminOnly: true },
  { to: "/configuracion", label: "Configuración", icon: Settings },
] as const;

function SidebarBody({ isAdmin, onNavigate, onSignOut }: { isAdmin: boolean; onNavigate?: () => void; onSignOut: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5 font-bold">
        <PaintRoller className="h-5 w-5 text-sidebar-primary" />
        <span className="truncate">Inventario Pintura - LM</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.filter((i) => !("adminOnly" in i) || isAdmin).map((item) => {
          const active = path === item.to || path.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  // Rol y nombre desde la base de datos (perfiles_usuario), no de metadatos.
  const { perfil, isAdmin } = useMyProfile();
  const name = perfil?.nombre_completo || (user?.email?.split("@")[0] ?? "Usuario");

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-app-content">
      <aside className="hidden w-[250px] shrink-0 md:block">
        <SidebarBody isAdmin={isAdmin} onSignOut={handleSignOut} />
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[250px] border-none p-0">
          <SheetTitle className="sr-only">Menú</SheetTitle>
          <SidebarBody isAdmin={isAdmin} onNavigate={() => setOpen(false)} onSignOut={handleSignOut} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 bg-card px-4 shadow-soft sm:px-6">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label="Abrir menú">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold">{name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Cerrar sesión">
              <DoorOpen className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main key={path} className="flex-1 p-6 animate-in fade-in duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold">{title}</h1>
      {action}
    </div>
  );
}
