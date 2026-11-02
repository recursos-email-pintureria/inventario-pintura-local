import { beforeEach, describe, expect, it, vi } from "vitest";
import { cerrarSesionLocal } from "@/lib/auth";

const { signOut } = vi.hoisted(() => ({ signOut: vi.fn() }));
vi.mock("@/lib/supabase", () => ({
  supabase: { auth: { signOut } },
}));

describe("cerrarSesionLocal", () => {
  beforeEach(() => {
    signOut.mockReset().mockResolvedValue({ error: null });
  });

  it("cierra solo la sesión actual", async () => {
    await cerrarSesionLocal();

    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("mantiene el cierre local si Auth devuelve un error", async () => {
    const error = new Error("JWT no válido");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    signOut.mockResolvedValue({ error });

    await expect(cerrarSesionLocal()).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith(
      "No se pudo cerrar la sesión en el servidor; se conserva el cierre local.",
      error,
    );
    consoleError.mockRestore();
  });
});
