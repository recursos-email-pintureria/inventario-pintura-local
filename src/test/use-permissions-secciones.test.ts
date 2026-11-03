import { describe, expect, it } from "vitest";
import { puedeGestionarSecciones } from "@/hooks/usePermissions";

describe("puedeGestionarSecciones", () => {
  it("allows an active admin without a separate permission", () => {
    expect(puedeGestionarSecciones({ rol: "admin", activo: true }, null)).toBe(true);
  });

  it("allows an active user with the section-management permission", () => {
    expect(
      puedeGestionarSecciones(
        { rol: "vendedor", activo: true },
        { puede_gestionar_secciones: true },
      ),
    ).toBe(true);
  });

  it("denies active users without the permission", () => {
    expect(
      puedeGestionarSecciones(
        { rol: "vendedor", activo: true },
        { puede_gestionar_secciones: false },
      ),
    ).toBe(false);
  });

  it("denies inactive admins and missing profiles", () => {
    expect(puedeGestionarSecciones({ rol: "admin", activo: false }, null)).toBe(false);
    expect(puedeGestionarSecciones(null, { puede_gestionar_secciones: true })).toBe(false);
  });
});
