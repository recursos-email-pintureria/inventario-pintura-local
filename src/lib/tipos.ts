// Tipos basados en el esquema real de Supabase

export interface Categoria {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  created_at?: string;
}

export interface Producto {
  id: string;
  sku: string;
  nombre: string;
  categoria: string | null;
  stock_actual: number;
  stock_minimo: number;
  activo: boolean;
  unidad: string;
  ubicacion: string | null;
  precio: number;
  largo?: number | null;
  ancho?: number | null;
  alto?: number | null;
  peso?: number | null;
  created_at?: string;
}

export interface Ubicacion {
  id: string;
  codigo: string;
  nombre?: string;
  tipo?: string;
  seccion_id?: string;
  activo?: boolean;
}

export interface Movimiento {
  id: string;
  fecha: string;
  tipo: "entrada" | "salida" | "reposicion" | "ajuste";
  cantidad: number;
  producto_id: string;
  ubicacion_id: string;
  usuario_id?: string;
  motivo?: string;
  created_at?: string;
}

export interface Stock {
  id: string;
  producto_id: string;
  ubicacion_id: string;
  cantidad: number;
}

export interface Seccion {
  id: string;
  nombre: string;
  codigo?: string;
  activo?: boolean;
}