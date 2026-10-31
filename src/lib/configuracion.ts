import { supabase } from "@/lib/supabase";

export type SystemSettings = {
  store_name: string;
  store_address: string;
  contact_email: string;
  time_zone: string;
  currency: string;
  critical_stock_alert: boolean;
  critical_stock_threshold: number;
  block_dispatch_at_zero: boolean;
  allow_negative_stock: boolean;
  default_minimum_stock: number;
  scanner_enabled: boolean;
  scanner_format: string;
  updated_at: string | null;
};

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  store_name: "Inventario LM",
  store_address: "",
  contact_email: "",
  time_zone: "Europe/Madrid",
  currency: "EUR",
  critical_stock_alert: true,
  critical_stock_threshold: 20,
  block_dispatch_at_zero: true,
  allow_negative_stock: false,
  default_minimum_stock: 0,
  scanner_enabled: true,
  scanner_format: "CODE_128",
  updated_at: null,
};

type StoredSetting = {
  clave: string;
  valor: unknown;
  actualizado_en: string;
};

function mapStoredSettings(rows: StoredSetting[]): SystemSettings {
  const settings = { ...DEFAULT_SYSTEM_SETTINGS };

  for (const row of rows) {
    switch (row.clave) {
      case "store_name":
        if (typeof row.valor === "string") settings.store_name = row.valor;
        break;
      case "store_address":
        if (typeof row.valor === "string") settings.store_address = row.valor;
        break;
      case "contact_email":
        if (typeof row.valor === "string") settings.contact_email = row.valor;
        break;
      case "time_zone":
        if (typeof row.valor === "string") settings.time_zone = row.valor;
        break;
      case "currency":
        if (typeof row.valor === "string") settings.currency = row.valor;
        break;
      case "critical_stock_alert":
        if (typeof row.valor === "boolean") settings.critical_stock_alert = row.valor;
        break;
      case "critical_stock_threshold":
        if (typeof row.valor === "number") settings.critical_stock_threshold = row.valor;
        break;
      case "block_dispatch_at_zero":
        if (typeof row.valor === "boolean") settings.block_dispatch_at_zero = row.valor;
        break;
      case "allow_negative_stock":
        if (typeof row.valor === "boolean") settings.allow_negative_stock = row.valor;
        break;
      case "default_minimum_stock":
        if (typeof row.valor === "number") settings.default_minimum_stock = row.valor;
        break;
      case "scanner_enabled":
        if (typeof row.valor === "boolean") settings.scanner_enabled = row.valor;
        break;
      case "scanner_format":
        if (typeof row.valor === "string") settings.scanner_format = row.valor;
        break;
    }

    if (!settings.updated_at || row.actualizado_en > settings.updated_at) {
      settings.updated_at = row.actualizado_en;
    }
  }

  return settings;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const { data, error } = await supabase
    .from("configuracion_sistema")
    .select("clave, valor, actualizado_en");

  if (error) throw error;
  return data ? mapStoredSettings(data) : DEFAULT_SYSTEM_SETTINGS;
}

export async function saveSystemSettings(settings: SystemSettings): Promise<SystemSettings> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("La sesión ha caducado. Inicia sesión de nuevo.");

  const updatedAt = new Date().toISOString();
  const categories: Record<Exclude<keyof SystemSettings, "updated_at">, string> = {
    store_name: "general",
    store_address: "general",
    contact_email: "general",
    time_zone: "general",
    currency: "general",
    critical_stock_alert: "stock",
    critical_stock_threshold: "stock",
    block_dispatch_at_zero: "stock",
    allow_negative_stock: "stock",
    default_minimum_stock: "stock",
    scanner_enabled: "dispositivos",
    scanner_format: "dispositivos",
  };
  const rows = Object.entries(categories).map(([clave, categoria]) => ({
    clave,
    categoria,
    valor: settings[clave as keyof typeof categories],
    actualizado_por: userData.user.id,
    actualizado_en: updatedAt,
  }));

  const { data, error } = await supabase
    .from("configuracion_sistema")
    .upsert(rows, { onConflict: "clave" })
    .select("clave, valor, actualizado_en");

  if (error) throw error;
  return data ? mapStoredSettings(data) : { ...settings, updated_at: updatedAt };
}

export function validateSystemSettings(settings: SystemSettings): string | null {
  if (!settings.store_name.trim()) return "El nombre comercial es obligatorio.";
  if (settings.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.contact_email)) {
    return "Introduce un email de contacto válido.";
  }
  if (
    !Number.isInteger(settings.critical_stock_threshold) ||
    settings.critical_stock_threshold < 1 ||
    settings.critical_stock_threshold > 100
  ) {
    return "El umbral de stock crítico debe ser un porcentaje entero entre 1 y 100.";
  }
  if (!Number.isInteger(settings.default_minimum_stock) || settings.default_minimum_stock < 0) {
    return "El stock mínimo debe ser un entero igual o superior a cero.";
  }
  return null;
}
