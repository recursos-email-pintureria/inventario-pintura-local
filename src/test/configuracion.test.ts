import { describe, expect, it, vi } from "vitest";
import { DEFAULT_SYSTEM_SETTINGS, validateSystemSettings } from "@/lib/configuracion";

vi.mock("@/lib/supabase", () => ({ supabase: {} }));

describe("validación de configuración del sistema", () => {
  it("acepta los valores por defecto", () => {
    expect(validateSystemSettings(DEFAULT_SYSTEM_SETTINGS)).toBeNull();
  });

  it("rechaza datos de contacto y umbrales inválidos", () => {
    expect(
      validateSystemSettings({ ...DEFAULT_SYSTEM_SETTINGS, contact_email: "correo-inválido" }),
    ).toContain("email");
    expect(
      validateSystemSettings({ ...DEFAULT_SYSTEM_SETTINGS, critical_stock_threshold: 101 }),
    ).toContain("umbral");
    expect(
      validateSystemSettings({ ...DEFAULT_SYSTEM_SETTINGS, default_minimum_stock: 1.5 }),
    ).toContain("stock mínimo");
    expect(validateSystemSettings({ ...DEFAULT_SYSTEM_SETTINGS, store_name: " " })).toContain(
      "obligatorio",
    );
  });
});
