import { beforeEach, describe, expect, it, vi } from "vitest";
import { cargarUsuarios, resetearPasswordUsuario } from "@/lib/usuarios";

const { from, invoke, edgeFunctionErrorMessage } = vi.hoisted(() => ({
  from: vi.fn(),
  invoke: vi.fn(),
  edgeFunctionErrorMessage: vi.fn(async (error: unknown) =>
    error instanceof Error ? error.message : "Error inesperado",
  ),
}));
vi.mock("@/lib/supabase", () => ({
  edgeFunctionErrorMessage,
  supabase: { from, functions: { invoke } },
}));

describe("Carga de usuarios sin relación directa entre tablas", () => {
  beforeEach(() => {
    from.mockReset();
    invoke.mockReset();
    edgeFunctionErrorMessage.mockClear();
  });

  it("conserva el correo de Javier y asocia permisos por identificador", async () => {
    const perfil = {
      id: "javier",
      correo: "aritx26@gmail.com",
      nombre_completo: "Javier",
      rol: "admin",
      activo: true,
    };
    const permiso = { id_usuario: "javier", puede_gestionar_usuarios: true };
    const selectPerfiles = vi.fn(() => ({
      order: vi.fn().mockResolvedValue({ data: [perfil], error: null }),
    }));
    const selectPermisos = vi.fn().mockResolvedValue({ data: [permiso], error: null });
    from.mockImplementation((tabla: string) => ({
      select: tabla === "perfiles_usuario" ? selectPerfiles : selectPermisos,
    }));

    expect(await cargarUsuarios()).toEqual([{ ...perfil, permisos_usuario: permiso }]);
    expect(selectPerfiles).toHaveBeenCalledWith("*");
    expect(selectPermisos).toHaveBeenCalledWith("*");
  });

  it("no oculta perfiles que no tienen una fila de permisos", async () => {
    from.mockImplementation((tabla: string) => ({
      select: () =>
        tabla === "perfiles_usuario"
          ? { order: vi.fn().mockResolvedValue({ data: [{ id: "sin-permisos" }], error: null }) }
          : Promise.resolve({ data: [], error: null }),
    }));
    expect(await cargarUsuarios()).toEqual([{ id: "sin-permisos", permisos_usuario: null }]);
  });

  it("propaga los errores de lectura en lugar de mostrar una lista vacía", async () => {
    const error = new Error("Acceso denegado");
    from.mockImplementation((tabla: string) => ({
      select: () =>
        tabla === "perfiles_usuario"
          ? { order: vi.fn().mockResolvedValue({ data: null, error }) }
          : Promise.resolve({ data: [], error: null }),
    }));
    await expect(cargarUsuarios()).rejects.toThrow("Acceso denegado");
  });

  it("solicita el reset con identificador, email y opción de cambio obligatorio", async () => {
    invoke.mockResolvedValue({ data: { success: true }, error: null });
    const usuario = { id: "usuario-1", correo: "usuario@example.com" };

    await expect(resetearPasswordUsuario(usuario, true)).resolves.toBeUndefined();
    expect(invoke).toHaveBeenCalledWith("reset-password-admin", {
      body: {
        id_usuario: "usuario-1",
        email: "usuario@example.com",
        forzar_cambio: true,
      },
    });
  });

  it("no presenta un reset fallido como exitoso", async () => {
    invoke.mockResolvedValue({ data: null, error: new Error("Email no enviado") });

    await expect(
      resetearPasswordUsuario({ id: "usuario-1", correo: "usuario@example.com" }, false),
    ).rejects.toThrow("Email no enviado");
  });
});
