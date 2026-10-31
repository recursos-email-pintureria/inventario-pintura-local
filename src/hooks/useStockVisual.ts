import { useMemo } from "react";

export interface StockVisualProduct {
  id: string;
  nombre: string;
  sku: string;
  cantidad: number;
  stock_minimo: number;
}

export interface StockVisualLocation {
  id: string;
  activo: boolean;
  capacidad_max?: number;
  productos: StockVisualProduct[];
}

export type StockVisualLevel = "normal" | "medio" | "critico" | "vacio" | "inactivo";

export interface StockVisualSummary {
  total: number;
  productosCount: number;
  productosCriticos: StockVisualProduct[];
  nivel: StockVisualLevel;
  color: string;
  colorTexto: string;
}

const COLORES: Record<StockVisualLevel, { fondo: string; texto: string }> = {
  normal: { fondo: "#dcfce7", texto: "#166534" },
  medio: { fondo: "#fef3c7", texto: "#92400e" },
  critico: { fondo: "#fee2e2", texto: "#991b1b" },
  vacio: { fondo: "#e5e7eb", texto: "#4b5563" },
  inactivo: { fondo: "#d1d5db", texto: "#4b5563" },
};

export function useStockVisual(locations: StockVisualLocation[]) {
  return useMemo(() => {
    const summaries = new Map<string, StockVisualSummary>();

    for (const location of locations) {
      const byProduct = new Map<string, StockVisualProduct>();
      for (const product of location.productos) {
        const current = byProduct.get(product.id);
        byProduct.set(product.id, {
          ...product,
          cantidad: (current?.cantidad ?? 0) + product.cantidad,
        });
      }

      const products = [...byProduct.values()];
      const total = products.reduce((sum, product) => sum + product.cantidad, 0);
      const productosCriticos = products.filter(
        (product) => product.cantidad <= product.stock_minimo,
      );
      let nivel: StockVisualLevel;

      if (!location.activo) {
        nivel = "inactivo";
      } else if (total <= 0) {
        nivel = "vacio";
      } else if (location.capacidad_max && location.capacidad_max > 0) {
        const porcentaje = (total / location.capacidad_max) * 100;
        nivel = porcentaje < 10 ? "critico" : porcentaje <= 20 ? "medio" : "normal";
      } else {
        nivel = productosCriticos.length > 0 ? "critico" : "normal";
      }

      const colores = COLORES[nivel];
      summaries.set(location.id, {
        total,
        productosCount: products.length,
        productosCriticos,
        nivel,
        color: colores.fondo,
        colorTexto: colores.texto,
      });
    }

    return summaries;
  }, [locations]);
}
