import { beforeEach, describe, expect, it, vi } from "vitest";
import { registrarMovimiento } from "@/lib/inventario";
import { supabase } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => {
  const insertMock = vi.fn();
  const fromMock = vi.fn(() => ({
    insert: insertMock,
  }));
  const getSessionMock = vi.fn();

  return {
    supabase: {
      from: fromMock,
      auth: {
        getSession: getSessionMock,
      },
    },
  };
});

describe("registrarMovimiento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rechaza movimientos con cantidad menor o igual a 0", async () => {
    await expect(
      registrarMovimiento({
        id_producto: "prod-1",
        id_ubicacion: "ubi-1",
        tipo: "entrada",
        cantidad: 0,
      }),
    ).rejects.toThrow("La cantidad debe ser mayor a 0.");

    await expect(
      registrarMovimiento({
        id_producto: "prod-1",
        id_ubicacion: "ubi-1",
        tipo: "entrada",
        cantidad: -5,
      }),
    ).rejects.toThrow("La cantidad debe ser mayor a 0.");
  });

  it("rechaza movimientos si no hay sesión activa", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    } as any);

    await expect(
      registrarMovimiento({
        id_producto: "prod-1",
        id_ubicacion: "ubi-1",
        tipo: "entrada",
        cantidad: 10,
      }),
    ).rejects.toThrow("Sesión no válida. Inicie sesión para realizar movimientos.");
  });

  it("inserta limpiamente sin fecha_movimiento ni .select() y devuelve success: true", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: {
        session: {
          user: { id: "user-123" },
        },
      },
      error: null,
    } as any);

    const insertMock = vi.fn().mockResolvedValueOnce({ error: null });
    vi.mocked(supabase.from).mockReturnValueOnce({
      insert: insertMock,
    } as any);

    const result = await registrarMovimiento({
      id_producto: "prod-1",
      id_ubicacion: "ubi-1",
      tipo: "salida",
      cantidad: 5,
      notas: "Despacho a mostrador",
      id_palet: "palet-99",
    });

    expect(result).toEqual({ success: true });
    expect(supabase.from).toHaveBeenCalledWith("movimientos");
    expect(insertMock).toHaveBeenCalledWith({
      id_producto: "prod-1",
      id_ubicacion: "ubi-1",
      tipo: "salida",
      cantidad: 5,
      notas: "Despacho a mostrador",
      realizado_por: "user-123",
      id_palet: "palet-99",
    });
  });

  it("mapea el error RLS 42501 a mensaje comprensible de permisos", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: {
        session: {
          user: { id: "user-sin-permiso" },
        },
      },
      error: null,
    } as any);

    const insertMock = vi.fn().mockResolvedValueOnce({
      error: { code: "42501", message: "permission denied for table movimientos" },
    });
    vi.mocked(supabase.from).mockReturnValueOnce({
      insert: insertMock,
    } as any);

    await expect(
      registrarMovimiento({
        id_producto: "prod-1",
        id_ubicacion: "ubi-1",
        tipo: "entrada",
        cantidad: 3,
      }),
    ).rejects.toThrow("No tiene permisos para realizar este movimiento.");
  });
});
