// src/lib/queries/dashboard.ts
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

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
  const hoy = new Date().toISOString().split("T")[0];

  const [prodRes, stockBajoRes, movRes, ubiRes] = await Promise.all([
    supabase.from("productos").select("id", { count: "exact", head: true }).eq("activo", true),
    supabase.from("stock").select("id", { count: "exact", head: true }).lt("cantidad", 5),
    supabase.from("movimientos").select("id", { count: "exact", head: true }).eq("fecha", hoy),
    supabase.from("stock").select("ubicacion_id", { count: "exact", head: true }).gt("cantidad", 0),
  ]);

  return {
    totalProductos: prodRes.count ?? 0,
    stockBajo: stockBajoRes.count ?? 0,
    movimientosHoy: movRes.count ?? 0,
    ubicacionesActivas: ubiRes.count ?? 0,
  };
}

async function fetchMovimientosRecientes(): Promise<MovimientoReciente[]> {
  const { data, error } = await supabase
    .from("movimientos")
    .select(`
      id,
      fecha,
      hora,
      tipo,
      cantidad,
      unidad,
      ubicacion,
      usuario,
      productos:producto_id (nombre, sku)
    `)
    .order("fecha", { ascending: false })
    .order("hora", { ascending: false })
    .limit(20);

  if (error) throw error;

  return (data || []).map((m: any) => ({
    id: m.id,
    fecha: m.fecha,
    hora: m.hora,
    producto: m.productos?.nombre ?? "Producto desconocido",
    sku: m.productos?.sku ?? "S/N",
    tipo: m.tipo,
    cantidad: m.cantidad,
    unidad: m.unidad,
    ubicacion: m.ubicacion,
    usuario: m.usuario,
    usuarioInicial: m.usuario ? m.usuario.charAt(0).toUpperCase() : "?",
  }));
}

export function useDashboardKPIs() {
  return useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: fetchKPIs,
    refetchInterval: 60_000,
  });
}

export function useMovimientosRecientes() {
  return useQuery({
    queryKey: ["dashboard", "movimientos"],
    queryFn: fetchMovimientosRecientes,
    refetchInterval: 30_000,
  });
}