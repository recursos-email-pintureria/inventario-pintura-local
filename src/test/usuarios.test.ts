import { beforeEach, describe, expect, it, vi } from "vitest";
import { cargarUsuarios } from "@/lib/usuarios";

const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ supabase: { from } }));

describe("Carga de usuarios sin relación directa entre tablas", () => {
  beforeEach(() => from.mockReset());

  it("conserva el correo de Javier y asocia permisos por identificador", async () => {
    const perfil = { id: "javier", correo: "aritx26@gmail.com", nombre_completo: "Javier", rol: "admin", activo: true };
    const permiso = { id_usuario: "javier", puede_gestionar_usuarios: true };
    const selectPerfiles = vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: [perfil], error: null }) }));
    const selectPermisos = vi.fn().mockResolvedValue({ data: [permiso], error: null });
    from.mockImplementation((tabla: string) => ({ select: tabla === "perfiles_usuario" ? selectPerfiles : selectPermisos }));

    expect(await cargarUsuarios()).toEqual([{ ...perfil, permisos_usuario: permiso }]);
    expect(selectPerfiles).toHaveBeenCalledWith("*");
    expect(selectPermisos).toHaveBeenCalledWith("*");
  });

  it("no oculta perfiles que no tienen una fila de permisos", async () => {
    from.mockImplementation((tabla: string) => ({ select: () => tabla === "perfiles_usuario"
      ? { order: vi.fn().mockResolvedValue({ data: [{ id: "sin-permisos" }], error: null }) }
      : Promise.resolve({ data: [], error: null }) }));
    expect(await cargarUsuarios()).toEqual([{ id: "sin-permisos", permisos_usuario: null }]);
  });

  it("propaga los errores de lectura en lugar de mostrar una lista vacía", async () => {
    const error = new Error("Acceso denegado");
    from.mockImplementation((tabla: string) => ({ select: () => tabla === "perfiles_usuario"
      ? { order: vi.fn().mockResolvedValue({ data: null, error }) }
      : Promise.resolve({ data: [], error: null }) }));
    await expect(cargarUsuarios()).rejects.toThrow("Acceso denegado");
  });
});