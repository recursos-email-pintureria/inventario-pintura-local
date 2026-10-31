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

  // ➕ PROPIEDADES AÑADIDAS PARA COMPATIBILIDAD CON GEMINI
  codigo_barras?: string | null;
  descripcion?: string | null;
  precio_unitario?: number | null;
  // -------------------------------------------------------

  largo?: number | null;
  ancho?: number | null;
  alto?: number | null;
  peso?: number | null;
  created_at?: string;
}

export interface Ubicacion {
  id: string;
  codigo?: string;
  nombre: string;
  tipo: string;
  descripcion?: string | null;
  activo?: boolean;
  creado_por?: string | null;
  creado_en?: string;
  id_ubicacion_padre?: string | null;
  seccion?: string | null;
  seccion_id?: string | null;
  seccion_origen?: string | null;
  posicion_lateral?: string | null;
  posicion_longitudinal?: string | null;
  numero?: number | null;
}

export interface Palet {
  id: string;
  id_reserva: string;
  numero_palet: number;
  codigo_barras: string;
  generado_por?: string | null;
  generado_en?: string;
  activo: boolean;
  creado_en?: string;
  actualizado_en?: string;
  fecha_baja?: string | null;
}

export interface Movimiento {
  id: string;
  fecha: string;
  tipo: "entrada" | "salida" | "reposicion" | "ajuste";
  cantidad: number;
  id_producto: string;
  id_ubicacion: string;
  realizado_por?: string;
  motivo?: string;
  created_at?: string;
}

export interface Stock {
  id?: string;
  id_producto: string;
  id_ubicacion: string;
  cantidad: number;
  actualizado_en?: string;
  id_palet?: string | null;
}

export interface Seccion {
  id: string;
  nombre: string;
  descripcion?: string | null;
  codigo?: string;
  activo?: boolean;
  creado_en?: string;
}

// Movimiento ya resuelto con sus relaciones (para UI)
export interface MovimientoDetallado {
  id: string;
  tipo: "entrada" | "salida" | "reposicion" | "ajuste";
  cantidad: number;
  fecha: string; // ISO
  motivo: string | null;
  producto: { id: string; nombre: string; sku: string | null } | null;
  ubicacion: { id: string; codigo: string } | null;
  usuario: { id: string; nombre: string } | null;
}

export interface UbicacionSimple {
  id: string;
  codigo: string;
  tipo: string | null;
}
