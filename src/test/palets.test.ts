import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  generarCodigoBarrasPalet,
  crearPalet,
  desactivarPalet,
  cargarPaletsPorReserva,
  getSiguienteNumeroPalet,
} from "@/lib/palets";

const { from, rpc } = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: { from, rpc },
}));

describe("Sistema de Palets - Funciones de Biblioteca (Fase 5.2)", () => {
  beforeEach(() => {
    from.mockReset();
    rpc.mockReset();
  });

  describe("generarCodigoBarrasPalet", () => {
    it("genera el formato estándar PAL-{numero_pad_3digitos}-{usuario}-{fecha_ddmmaaaa}", () => {
      const fecha = new Date(2026, 9, 25); // 25 de Octubre 2026
      const codigo = generarCodigoBarrasPalet(1, "Javier", fecha);
      expect(codigo).toBe("PAL-001-Javier-25102026");
    });

    it("rellena con ceros a la izquierda para números mayores", () => {
      const fecha = new Date(2026, 0, 5); // 05 de Enero 2026
      const codigo = generarCodigoBarrasPalet(24, "Carlos Alberto", fecha);
      expect(codigo).toBe("PAL-024-Carlos-05012026");
    });

    it("maneja nombres con tildes y caracteres limpios", () => {
      const fecha = new Date(2026, 4, 15); // 15 de Mayo 2026
      const codigo = generarCodigoBarrasPalet(105, "Álvaro", fecha);
      expect(codigo).toBe("PAL-105-Álvaro-15052026");
    });
  });

  describe("getSiguienteNumeroPalet", () => {
    it("utiliza la función RPC get_siguiente_numero_palet si está disponible", async () => {
      rpc.mockResolvedValue({ data: 3, error: null });

      const siguiente = await getSiguienteNumeroPalet("reserva-uuid-1");
      expect(siguiente).toBe(3);
      expect(rpc).toHaveBeenCalledWith("get_siguiente_numero_palet", {
        p_id_reserva: "reserva-uuid-1",
      });
    });

    it("utiliza fallback a consulta si RPC falla o devuelve null", async () => {
      rpc.mockResolvedValue({ data: null, error: new Error("RPC error") });
      const selectMock = vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue({
              data: [{ numero_palet: 4 }],
              error: null,
            }),
          })),
        })),
      }));
      from.mockReturnValue({ select: selectMock });

      const siguiente = await getSiguienteNumeroPalet("reserva-uuid-1");
      expect(siguiente).toBe(5);
    });
  });

  describe("crearPalet", () => {
    it("calcula el consecutivo, genera el código e inserta el palet activo", async () => {
      rpc.mockResolvedValue({ data: 1, error: null });

      const insertMock = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "palet-1",
              id_reserva: "reserva-1",
              numero_palet: 1,
              codigo_barras: "PAL-001-Javier-25102026",
              generado_por: "Javier",
              activo: true,
            },
            error: null,
          }),
        })),
      }));
      from.mockReturnValue({ insert: insertMock });

      const nuevoPalet = await crearPalet({
        id_reserva: "reserva-1",
        usuario_nombre: "Javier",
      });

      expect(nuevoPalet.numero_palet).toBe(1);
      expect(nuevoPalet.activo).toBe(true);
      expect(insertMock).toHaveBeenCalled();
    });

    it("lanza error si falta id_reserva o usuario_nombre", async () => {
      await expect(crearPalet({ id_reserva: "", usuario_nombre: "Javier" })).rejects.toThrow(
        "Se requiere la ubicación de reserva.",
      );
      await expect(crearPalet({ id_reserva: "res-1", usuario_nombre: "" })).rejects.toThrow(
        "Se requiere el nombre del usuario generador.",
      );
    });
  });

  describe("desactivarPalet", () => {
    it("aplica soft delete mediante UPDATE activo = FALSE", async () => {
      const eqMock = vi.fn().mockResolvedValue({ error: null });
      const updateMock = vi.fn(() => ({ eq: eqMock }));
      from.mockReturnValue({ update: updateMock });

      await desactivarPalet("palet-uuid-123");

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          activo: false,
        }),
      );
      expect(eqMock).toHaveBeenCalledWith("id", "palet-uuid-123");
    });
  });

  describe("cargarPaletsPorReserva", () => {
    it("filtra por id_reserva y por activo", async () => {
      const orderMock = vi.fn();
      const eqActivoMock = vi.fn().mockResolvedValue({
        data: [{ id: "p1", numero_palet: 1, activo: true }],
        error: null,
      });
      orderMock.mockReturnValue({ eq: eqActivoMock });

      const eqReservaMock = vi.fn(() => ({
        order: orderMock,
      }));

      from.mockReturnValue({
        select: vi.fn(() => ({
          eq: eqReservaMock,
        })),
      });

      const palets = await cargarPaletsPorReserva("reserva-1", true);
      expect(palets).toHaveLength(1);
      expect(eqReservaMock).toHaveBeenCalledWith("id_reserva", "reserva-1");
      expect(eqActivoMock).toHaveBeenCalledWith("activo", true);
    });
  });

  describe("Funciones de stock en palets (Fase 5.4B)", () => {
    it("cargarProductosPalet consulta stock filtrando por id_palet y cantidad > 0", async () => {
      const gtMock = vi.fn().mockResolvedValue({
        data: [
          {
            id_producto: "prod-1",
            cantidad: 15,
            producto: {
              id: "prod-1",
              codigo_barras: "123456",
              sku: "SKU-01",
              nombre: "Pintura Mate",
            },
          },
        ],
        error: null,
      });
      const eqPaletMock = vi.fn(() => ({ gt: gtMock }));
      from.mockReturnValue({
        select: vi.fn(() => ({
          eq: eqPaletMock,
        })),
      });

      const { cargarProductosPalet } = await import("@/lib/palets");
      const items = await cargarProductosPalet("palet-123");

      expect(items).toHaveLength(1);
      expect(items[0].nombre).toBe("Pintura Mate");
      expect(items[0].cantidad).toBe(15);
      expect(eqPaletMock).toHaveBeenCalledWith("id_palet", "palet-123");
      expect(gtMock).toHaveBeenCalledWith("cantidad", 0);
    });

    it("guardarProductoEnPalet inserta nuevo registro si no existía", async () => {
      const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null });
      const eqProdMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
      const eqPaletMock = vi.fn(() => ({ eq: eqProdMock }));
      const insertMock = vi.fn().mockResolvedValue({ error: null });

      from.mockReturnValue({
        select: vi.fn(() => ({ eq: eqPaletMock })),
        insert: insertMock,
      });

      const { guardarProductoEnPalet } = await import("@/lib/palets");
      await guardarProductoEnPalet({
        id_palet: "palet-123",
        id_reserva: "reserva-1",
        id_producto: "prod-1",
        cantidad: 5,
      });

      expect(insertMock).toHaveBeenCalledWith({
        id_palet: "palet-123",
        id_ubicacion: "reserva-1",
        id_producto: "prod-1",
        cantidad: 5,
      });
    });

    it("guardarProductoEnPalet incrementa cantidad si el producto ya existía", async () => {
      const maybeSingleMock = vi.fn().mockResolvedValue({
        data: { id_producto: "prod-1", cantidad: 10 },
        error: null,
      });
      const eqProdSelectMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
      const eqPaletSelectMock = vi.fn(() => ({ eq: eqProdSelectMock }));

      const eqProdUpdateMock = vi.fn().mockResolvedValue({ error: null });
      const eqPaletUpdateMock = vi.fn(() => ({ eq: eqProdUpdateMock }));
      const updateMock = vi.fn(() => ({ eq: eqPaletUpdateMock }));

      from.mockReturnValue({
        select: vi.fn(() => ({ eq: eqPaletSelectMock })),
        update: updateMock,
      });

      const { guardarProductoEnPalet } = await import("@/lib/palets");
      await guardarProductoEnPalet({
        id_palet: "palet-123",
        id_reserva: "reserva-1",
        id_producto: "prod-1",
        cantidad: 5,
      });

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          cantidad: 15,
        }),
      );
    });

    it("eliminarProductoDePalet borra el registro de stock", async () => {
      const eqProdMock = vi.fn().mockResolvedValue({ error: null });
      const eqPaletMock = vi.fn(() => ({ eq: eqProdMock }));
      const deleteMock = vi.fn(() => ({ eq: eqPaletMock }));

      from.mockReturnValue({ delete: deleteMock });

      const { eliminarProductoDePalet } = await import("@/lib/palets");
      await eliminarProductoDePalet("palet-123", "prod-1");

      expect(deleteMock).toHaveBeenCalled();
      expect(eqPaletMock).toHaveBeenCalledWith("id_palet", "palet-123");
      expect(eqProdMock).toHaveBeenCalledWith("id_producto", "prod-1");
    });
  });
});
