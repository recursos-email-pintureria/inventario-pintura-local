// src/lib/queries/dashboard.ts
import { useQuery } from "@tanstack/react-query";
import {
  getProductos,
  getMovimientos,
  getStockPorUbicaciones,
  getUbicacionesCompletas,
} from "@/lib/inventario";

export interface DashboardKPIs {
  totalProductos: number;
  stockBajo: number;
  movimientosHoy: number;
  ubicacionesActivas: number;
}

export interface MovimientoReciente {
  id: string;
  fecha: string;
  hora: string;
  producto: string;
  sku: string;
  tipo: "entrada" | "salida" | "reposicion" | "ajuste";
  cantidad: number;
  unidad: string;
  ubicacion: string;
  usuario: string;
  usuarioInicial: string;
}

async function fetchKPIs(): Promise<DashboardKPIs> {
  const hoy = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  
  const [productos, movimientos, stock, ubicaciones] = await Promise.all([
    getProductos(),
    getMovimientos(),
    getStockPorUbicaciones(),
    getUbicacionesCompletas(),
  ]);

  return {
    totalProductos: productos.filter((p) => p.activo !== false).length,
    stockBajo: stock.filter((s) => s.cantidad < 5).length,
    movimientosHoy: movimientos.filter((m) => {
      const fechaMov = m.fecha ? m.fecha.split("T")[0] : "";
      return fechaMov === hoy;
    }).length,
    ubicacionesActivas: ubicaciones.filter((u) => u.activo !== false).length,
  };
}

async function fetchMovimientosRecientes(): Promise<MovimientoReciente[]> {
  const movimientos = await getMovimientos();

  return movimientos
    .sort((a, b) => {
      const fechaA = a.fecha || "";
      const fechaB = b.fecha || "";
      return fechaB.localeCompare(fechaA);
    })
    .slice(0, 20)
    .map((m: any) => {
      const fechaCompleta = m.fecha || new Date().toISOString();
      const [fecha, horaRaw] = fechaCompleta.split("T");
      const hora = horaRaw ? horaRaw.slice(0, 5) : "00:00";

      // Extraer datos de las relaciones (join) que hace getMovimientos()
      const nombreProducto = m.productos?.nombre || "Producto";
      const skuProducto = m.productos?.sku || "S/N";
      const nombreUbicacion = m.ubicaciones?.nombre || "Sin ubicación";
      const nombreUsuario = m.perfiles_usuario?.nombre_completo || m.usuario || "Sistema";

      return {
        id: m.id,
        fecha: fecha || "Hoy",
        hora: hora,
        producto: nombreProducto,
        sku: skuProducto,
        tipo: m.tipo as MovimientoReciente["tipo"],
        cantidad: m.cantidad,
        unidad: m.unidad || "uds",
        ubicacion: nombreUbicacion,
        usuario: nombreUsuario,
        usuarioInicial: nombreUsuario.charAt(0).toUpperCase(),
      };
    });
}

export function useDashboardKPIs() {
  return useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: fetchKPIs,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useMovimientosRecientes() {
  return useQuery({
    queryKey: ["dashboard", "movimientos"],
    queryFn: fetchMovimientosRecientes,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}