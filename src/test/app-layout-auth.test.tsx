import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppLayout } from "@/components/layout/AppLayout";
import { puedeGestionarConfiguracion } from "@/hooks/usePermissions";

const { navigate, authState, profileState } = vi.hoisted(() => ({
  navigate: vi.fn(),
  authState: { user: { id: "admin-1" } as { id: string } | null, loading: false },
  profileState: {
    perfil: {
      id: "admin-1",
      nombre_completo: "Admin",
      correo: "admin@example.com",
      rol: "admin",
      activo: true,
      debe_cambiar_password: false,
    } as {
      id: string;
      nombre_completo: string;
      correo: string;
      rol: string;
      activo: boolean;
      debe_cambiar_password: boolean;
    } | null,
    permisos: { puede_gestionar_usuarios: false } as { puede_gestionar_usuarios: boolean } | null,
    isPending: false,
    isError: false,
    isAdmin: true,
  },
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useLocation: () => ({ pathname: "/dashboard" }),
  useNavigate: () => navigate,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => authState,
}));

vi.mock("@/hooks/usePermissions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/usePermissions")>();
  return {
    ...actual,
    useMyProfile: () => ({
      ...profileState,
      can: (permission: string) =>
        profileState.isAdmin || profileState.permisos?.[permission as "puede_gestionar_usuarios"],
    }),
    cerrarSesion: vi.fn(),
  };
});

vi.mock("@/components/theme/theme-context", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

function renderLayout() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AppLayout>Contenido protegido</AppLayout>
    </QueryClientProvider>,
  );
}

describe("AppLayout tras cerrar sesión", () => {
  beforeEach(() => {
    navigate.mockReset();
    authState.user = { id: "admin-1" };
    authState.loading = false;
    profileState.perfil = {
      id: "admin-1",
      nombre_completo: "Admin",
      correo: "admin@example.com",
      rol: "admin",
      activo: true,
      debe_cambiar_password: false,
    };
    profileState.permisos = { puede_gestionar_usuarios: false };
    profileState.isPending = false;
    profileState.isError = false;
    profileState.isAdmin = true;
  });

  it("redirige al login y no queda esperando el perfil al perder la sesión", async () => {
    authState.user = null;
    profileState.perfil = null;
    profileState.isPending = true;

    renderLayout();

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({ to: "/login", replace: true });
    });
    expect(screen.queryByText("Contenido protegido")).not.toBeInTheDocument();
  });

  it("muestra Configuración a un administrador activo sin permiso individual explícito", () => {
    renderLayout();

    expect(screen.getByRole("link", { name: "Configuración" })).toHaveAttribute(
      "href",
      "/configuracion",
    );
  });

  it("permite Configuración a admins activos y a otros usuarios con permiso", () => {
    expect(
      puedeGestionarConfiguracion(
        { rol: "admin", activo: true },
        { puede_gestionar_usuarios: false },
      ),
    ).toBe(true);
    expect(
      puedeGestionarConfiguracion(
        {
          rol: "vendedor",
          activo: true,
        },
        { puede_gestionar_usuarios: true },
      ),
    ).toBe(true);
    expect(
      puedeGestionarConfiguracion(
        { rol: "admin", activo: false },
        { puede_gestionar_usuarios: true },
      ),
    ).toBe(false);
  });
});
