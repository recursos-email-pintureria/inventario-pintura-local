import { describe, expect, it } from "vitest";
import { puedeExportarInventario } from "@/hooks/usePermissions";

describe("puedeExportarInventario", () => {
  it("permite a un admin activo", () => {
    expect(puedeExportarInventario({ rol: "admin", activo: true })).toBe(true);
  });

  it("permite a un vendedor activo", () => {
    expect(puedeExportarInventario({ rol: "vendedor", activo: true })).toBe(true);
  });

  it("deniega al visualizador y a usuarios inactivos", () => {
    expect(puedeExportarInventario({ rol: "visualizador", activo: true })).toBe(false);
    expect(puedeExportarInventario({ rol: "admin", activo: false })).toBe(false);
    expect(puedeExportarInventario({ rol: "vendedor", activo: false })).toBe(false);
    expect(puedeExportarInventario(null)).toBe(false);
  });
});
