import { Link, useLocation } from '@tanstack/react-router';
import { 
  LayoutDashboard, 
  Package, 
  MapPin, 
  ArrowRightLeft, 
  LogOut, 
  Boxes,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMyProfile, cerrarSesion } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';

const menuItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/productos', label: 'Productos', icon: Package },
  { to: '/ubicaciones', label: 'Ubicaciones', icon: MapPin },
  { to: '/movimientos', label: 'Movimientos', icon: ArrowRightLeft },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { perfil, isPending } = useMyProfile();

  if (isPending && !perfil) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* ========================================== */}
      {/* BARRA LATERAL (SIDEBAR)                    */}
      {/* ========================================== */}
      <aside className="flex w-64 flex-col border-r bg-card">
        {/* 🎯 LOGO Y VERSIÓN DE LA APP */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-border">
          <div className="bg-primary text-primary-foreground p-2.5 rounded-xl shadow-sm">
            <Boxes className="h-6 w-6" /> {/* Icono chulo de inventario */}
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-lg leading-tight text-foreground">
              Inventario LM
            </h1>
            <span className="text-[10px] font-mono font-semibold bg-muted text-muted-foreground px-1.5 py-0.5 rounded border w-fit mt-1">
              v1.0.0-beta
            </span>
          </div>
        </div>

        {/* MENÚ DE NAVEGACIÓN */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* PIE DE PÁGINA DEL SIDEBAR (USUARIO Y SALIR) */}
        <div className="border-t border-border p-4 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
              {perfil?.nombre_completo?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium">
                {perfil?.nombre_completo || 'Usuario'}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {perfil?.correo || 'Sin email'}
              </span>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={cerrarSesion}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* ========================================== */}
      {/* CONTENIDO PRINCIPAL                        */}
      {/* ========================================== */}
      <main className="flex-1 overflow-auto bg-muted/30">
        {children}
      </main>
    </div>
  );
}

// Componente PageHeader para usar en las páginas internas
export function PageHeader({ 
  title, 
  description, 
  action 
}: { 
  title: string; 
  description?: string; 
  action?: React.ReactNode 
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}