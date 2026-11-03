import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Package,
  MapPin,
  ArrowRightLeft,
  LogOut,
  Boxes,
  Settings,
  Users,
  Sun,
  Moon,
  Monitor,
  Tags,
  Menu,
  ScanLine,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyProfile, cerrarSesion, puedeGestionarConfiguracion } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { type ThemePreference, useTheme } from "@/components/theme/theme-context";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BarcodeScanner } from "@/components/ui/barcode-scanner";
import { CambioPasswordObligatorio } from "@/components/auth/CambioPasswordObligatorio";
import { toast } from "sonner";

const menuItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/productos", label: "Productos", icon: Package },
  { to: "/ubicaciones", label: "Ubicaciones", icon: MapPin },
  { to: "/movimientos", label: "Movimientos", icon: ArrowRightLeft },
  { to: "/categorias", label: "Categorías", icon: Tags },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: cargandoSesion } = useAuth();
  const {
    perfil,
    permisos,
    isPending,
    isError: errorPerfil,
    refetch: recargarPerfil,
    isAdmin,
    can,
  } = useMyProfile();
  const { theme, setTheme } = useTheme();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const [escanerAbierto, setEscanerAbierto] = useState(false);

  useEffect(() => {
    if (cargandoSesion || user) return;

    queryClient.clear();
    void navigate({ to: "/login", replace: true });
  }, [cargandoSesion, navigate, queryClient, user]);

  if (!cargandoSesion && !user) return null;

  if (isPending && !perfil) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (errorPerfil && !perfil) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-4">
        <p className="text-sm text-destructive" role="alert">
          No se pudo comprobar tu perfil. No se puede abrir la aplicación.
        </p>
        <Button variant="outline" onClick={() => recargarPerfil()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (perfil?.debe_cambiar_password) {
    return <CambioPasswordObligatorio />;
  }

  const items = [
    ...menuItems,
    ...(isAdmin || can("puede_gestionar_usuarios")
      ? [{ to: "/usuarios", label: "Usuarios", icon: Users }]
      : []),
    ...(puedeGestionarConfiguracion(perfil, permisos)
      ? [{ to: "/configuracion", label: "Configuración", icon: Settings }]
      : []),
  ];
  const nextTheme: ThemePreference =
    theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const themeLabel = theme === "light" ? "claro" : theme === "dark" ? "oscuro" : "del sistema";
  const bottomItems = [
    { to: "/", label: "Inicio", icon: LayoutDashboard },
    { to: "/ubicaciones", label: "Ubicaciones", icon: MapPin },
    { to: "/movimientos", label: "Movimientos", icon: ArrowRightLeft },
  ];
  const handleScan = (code: string) => {
    try {
      window.sessionStorage.setItem("inventario:codigo-busqueda", code);
    } catch {
      toast.error("No se pudo conservar el código escaneado para la búsqueda");
      return;
    }
    void navigate({ to: "/productos" });
    toast.success(`Buscando código ${code} en productos`);
  };
  const toggleTheme = () => setTheme(nextTheme);

  return (
    <div className="flex h-dvh flex-col bg-background md:flex-row">
      {/* ========================================== */}
      {/* BARRA LATERAL (SIDEBAR)                    */}
      {/* ========================================== */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-card md:flex">
        {/* 🎯 LOGO Y VERSIÓN DE LA APP */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-border">
          <div className="bg-primary text-primary-foreground p-2.5 rounded-xl shadow-sm">
            <Boxes className="h-6 w-6" /> {/* Icono chulo de inventario */}
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-lg leading-tight text-foreground">Inventario LM</h1>
            <span className="text-[10px] font-mono font-semibold bg-muted text-muted-foreground px-1.5 py-0.5 rounded border w-fit mt-1">
              v1.9.0-secciones
            </span>
          </div>
        </div>

        {/* MENÚ DE NAVEGACIÓN */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map((item) => {
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
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            aria-label={`Tema ${themeLabel}. Cambiar al tema ${nextTheme === "light" ? "claro" : nextTheme === "dark" ? "oscuro" : "del sistema"}`}
            onClick={() => setTheme(nextTheme)}
          >
            <ThemeIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            Tema: {themeLabel}
          </Button>
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
              {perfil?.nombre_completo?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium">
                {perfil?.nombre_completo || "Usuario"}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {perfil?.correo || "Sin email"}
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
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b bg-card px-3 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Abrir menú de navegación"
          onClick={() => setMenuAbierto(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 font-semibold">
          <Boxes className="h-5 w-5 text-primary" />
          <span>Inventario LM</span>
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-label="En línea" />
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Abrir perfil de usuario"
          onClick={() => setPerfilAbierto(true)}
        >
          <UserRound className="h-5 w-5" />
        </Button>
      </header>

      <main className="min-h-0 flex-1 overflow-auto bg-muted/30 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>

      <nav
        aria-label="Navegación principal móvil"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 items-end border-t bg-card/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur md:hidden"
      >
        {bottomItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
        <Button
          type="button"
          aria-label="Abrir escáner de códigos"
          onClick={() => setEscanerAbierto(true)}
          className="mx-auto -mt-4 flex h-14 w-14 flex-col rounded-full border-4 border-background bg-primary p-0 text-[9px] text-primary-foreground shadow-lg"
        >
          <ScanLine className="h-5 w-5" aria-hidden="true" />
          Escanear
        </Button>
        {bottomItems.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
        <Button
          type="button"
          variant="ghost"
          aria-label="Ver más opciones"
          onClick={() => setMenuAbierto(true)}
          className="flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] text-muted-foreground"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
          Menú
        </Button>
      </nav>

      <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
        <SheetContent side="left" className="flex w-[min(20rem,85vw)] flex-col p-0">
          <SheetHeader className="border-b px-5 py-5 text-left">
            <SheetTitle className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-primary" />
              Inventario LM
            </SheetTitle>
            <SheetDescription>Navegación de la aplicación</SheetDescription>
          </SheetHeader>
          <nav aria-label="Todas las secciones" className="flex-1 space-y-1 overflow-y-auto p-3">
            {items.map((item) => {
              const isActive = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuAbierto(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="space-y-2 border-t p-4">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full justify-start"
              onClick={toggleTheme}
              aria-label={`Tema ${themeLabel}. Cambiar al tema ${nextTheme}`}
            >
              <ThemeIcon className="mr-2 h-4 w-4" aria-hidden="true" />
              Tema: {themeLabel}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 w-full justify-start text-destructive"
              onClick={() => void cerrarSesion()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={perfilAbierto} onOpenChange={setPerfilAbierto}>
        <SheetContent side="right" className="w-[min(20rem,85vw)]">
          <SheetHeader className="text-left">
            <SheetTitle>Mi cuenta</SheetTitle>
            <SheetDescription>Perfil y preferencias de la sesión</SheetDescription>
          </SheetHeader>
          <div className="mt-6 flex items-center gap-3 rounded-lg border p-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
              {perfil?.nombre_completo?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{perfil?.nombre_completo || "Usuario"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {perfil?.correo || "Sin email"}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full justify-start"
              onClick={toggleTheme}
            >
              <ThemeIcon className="mr-2 h-4 w-4" aria-hidden="true" />
              Tema: {themeLabel}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 w-full justify-start text-destructive"
              onClick={() => void cerrarSesion()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <BarcodeScanner open={escanerAbierto} onOpenChange={setEscanerAbierto} onScan={handleScan} />
    </div>
  );
}

// Componente PageHeader para usar en las páginas internas
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
