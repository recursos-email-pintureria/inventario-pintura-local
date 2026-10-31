import type {
  Categoria,
  Producto,
  MovimientoDetallado,
  UbicacionSimple,
  Ubicacion,
  Seccion,
  Palet,
  Stock,
} from "./tipos";
import { supabase } from "./supabase";
import { queryOptions } from "@tanstack/react-query";
export type { Categoria, Ubicacion, Seccion, Palet, Stock } from "./tipos";

// ============================================================================
// SECCIONES (Nivel 0)
// ============================================================================

export async function getSecciones(): Promise<Seccion[]> {
  try {
    const { data, error } = await supabase
      .from("secciones")
      .select("*")
      .eq("activo", true)
      .order("nombre", { ascending: true });

    if (error) {
      console.warn("Aviso al consultar secciones en Supabase:", error.message);
      return [];
    }
    return data ?? [];
  } catch (err) {
    console.warn("Excepción al consultar secciones:", err);
    return [];
  }
}

export async function crearSeccion(nombre: string, descripcion?: string | null): Promise<Seccion> {
  const { data, error } = await supabase
    .from("secciones")
    .insert({
      nombre,
      descripcion: descripcion ?? null,
      activo: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// UBICACIONES COMPLETAS (Jerarquía Nivel 1 y 2)
// ============================================================================

export async function getUbicacionesCompletas(): Promise<Ubicacion[]> {
  try {
    const { data, error } = await supabase
      .from("ubicaciones")
      .select("*")
      .eq("activo", true)
      .order("nombre", { ascending: true });

    if (error) {
      console.warn("Aviso al consultar ubicaciones en Supabase:", error.message);
      return [];
    }
    return (data ?? []).map((u: any) => ({
      id: u.id,
      nombre: u.nombre,
      codigo:
        u.codigo ??
        (u.nombre
          ? u.nombre.replace(/\s+/g, "-").toUpperCase().slice(0, 10)
          : `UBI-${String(u.id).slice(0, 6)}`),
      tipo: u.tipo,
      descripcion: u.descripcion ?? null,
      activo: u.activo ?? true,
      creado_por: u.creado_por ?? null,
      creado_en: u.creado_en ?? null,
      id_ubicacion_padre: u.id_ubicacion_padre ?? null,
      seccion: u.seccion ?? u.seccion_id ?? null,
      seccion_id: u.seccion ?? u.seccion_id ?? null,
      seccion_origen: u.seccion_origen ?? null,
      posicion_lateral: u.posicion_lateral ?? null,
      posicion_longitudinal: u.posicion_longitudinal ?? null,
      numero: u.numero ?? null,
    }));
  } catch (err) {
    console.warn("Excepción al consultar ubicaciones:", err);
    return [];
  }
}

export async function crearUbicacionBD(ubi: {
  nombre: string;
  tipo: string;
  descripcion?: string | null;
  id_ubicacion_padre?: string | null;
  seccion?: string | null;
  posicion_lateral?: string | null;
  posicion_longitudinal?: string | null;
  numero?: number | null;
}): Promise<Ubicacion> {
  const { data: userData } = await supabase.auth.getUser();

  const payload: any = {
    nombre: ubi.nombre,
    tipo: ubi.tipo,
    descripcion: ubi.descripcion ?? null,
    id_ubicacion_padre: ubi.id_ubicacion_padre ?? null,
    seccion: ubi.seccion ?? null,
    posicion_lateral: ubi.posicion_lateral ?? null,
    posicion_longitudinal: ubi.posicion_longitudinal ?? null,
    numero: ubi.numero ?? null,
    activo: true,
  };

  if (userData?.user?.id) {
    payload["creado_por"] = userData.user.id;
  }

  let res = await supabase.from("ubicaciones").insert(payload).select().single();

  // Si hay error por columnas adicionales de esquema, reintentar con las esenciales
  if (res.error) {
    console.warn("Reintentando inserción básica de ubicación:", res.error.message);
    const payloadMinimo: Record<string, any> = {
      nombre: ubi.nombre,
      tipo: ubi.tipo,
      descripcion: ubi.descripcion ?? null,
      activo: true,
    };
    if (ubi.id_ubicacion_padre) payloadMinimo["id_ubicacion_padre"] = ubi.id_ubicacion_padre;
    if (ubi.seccion) payloadMinimo["seccion"] = ubi.seccion;
    res = await supabase.from("ubicaciones").insert(payloadMinimo).select().single();
  }

  if (res.error) throw res.error;
  return res.data;
}

export async function desactivarUbicacionBD(id: string): Promise<void> {
  const { error } = await supabase.from("ubicaciones").update({ activo: false }).eq("id", id);
  if (error) throw error;
}

// ============================================================================
// PALETS (Reserva General)
// ============================================================================

export async function getPalets(): Promise<Palet[]> {
  try {
    const { data, error } = await supabase
      .from("palets")
      .select("*")
      .eq("activo", true)
      .order("numero_palet", { ascending: true });

    if (error) {
      console.warn("Aviso al consultar palets en Supabase:", error.message);
      return [];
    }
    return data ?? [];
  } catch (err) {
    console.warn("Excepción al consultar palets:", err);
    return [];
  }
}

export async function crearPaletBD(input: {
  id_reserva: string;
  numero_palet: number;
  codigo_barras: string;
  generado_por?: string;
}): Promise<Palet> {
  const { data, error } = await supabase
    .from("palets")
    .insert({
      id_reserva: input.id_reserva,
      numero_palet: input.numero_palet,
      codigo_barras: input.codigo_barras,
      generado_por: input.generado_por ?? "Javier Vendedor",
      activo: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function darDeBajaPaletBD(id: string): Promise<void> {
  const { data, error } = await supabase
    .from("palets")
    .update({ activo: false, fecha_baja: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error?.code === "42501") {
    throw new Error(`Permiso denegado (42501): ${error.message}`);
  }
  if (error) throw error;
  if (!data) {
    throw new Error("No se pudo dar de baja el palet: no existe o no tienes permisos.");
  }
}

// ============================================================================
// STOCK POR UBICACIÓN (Lectura según Regla de Oro nº 1 y nº 3)
// ============================================================================

export async function getStockPorUbicaciones(): Promise<Stock[]> {
  try {
    const { data, error } = await supabase.from("stock").select("*");
    if (error) {
      console.warn("Aviso al consultar stock en Supabase:", error.message);
      return [];
    }
    return (data ?? []).map((s: any) => ({
      id_producto: s.id_producto ?? s.id_producto,
      id_ubicacion: s.id_ubicacion ?? s.id_ubicacion,
      cantidad: Number(s.cantidad || 0),
      actualizado_en: s.actualizado_en ?? s.updated_at ?? null,
      id_palet: s.id_palet ?? null,
    }));
  } catch (err) {
    console.warn("Excepción al consultar stock:", err);
    return [];
  }
}

// ============================================================================
// SINCRONIZACIÓN / SEMILLADO INICIAL EN SUPABASE
// ============================================================================

export async function sincronizarEstructuraInicialSupabase(
  seccionesIniciales: Array<{ id: string; nombre: string; descripcion?: string }>,
  ubicacionesIniciales: Array<{
    nombre: string;
    tipo: string;
    seccion_nombre?: string;
    padre_nombre?: string;
    lateral?: string;
    piso?: number;
    descripcion?: string;
  }>,
): Promise<{ seccionesCreadas: number; ubicacionesCreadas: number }> {
  let seccionesCreadas = 0;
  let ubicacionesCreadas = 0;

  // 1. Obtener o crear secciones
  const { data: secExistentes } = await supabase.from("secciones").select("id, nombre");
  const mapaSecciones = new Map<string, string>();
  (secExistentes ?? []).forEach((s: any) => mapaSecciones.set(s.nombre.toLowerCase(), s.id));

  for (const sec of seccionesIniciales) {
    if (!mapaSecciones.has(sec.nombre.toLowerCase())) {
      const { data, error } = await supabase
        .from("secciones")
        .insert({ nombre: sec.nombre, descripcion: sec.descripcion ?? null, activo: true })
        .select()
        .single();
      if (!error && data) {
        mapaSecciones.set(sec.nombre.toLowerCase(), data.id);
        seccionesCreadas++;
      }
    }
  }

  // 2. Obtener o crear ubicaciones de nivel 1 (Pasillos, Cajas, Reserva)
  const { data: ubiExistentes } = await supabase.from("ubicaciones").select("id, nombre");
  const mapaUbicaciones = new Map<string, string>();
  (ubiExistentes ?? []).forEach((u: any) => mapaUbicaciones.set(u.nombre.toLowerCase(), u.id));

  // Crear primero nivel 1
  for (const u of ubicacionesIniciales.filter((x) =>
    ["pasillo", "caja", "reserva"].includes(x.tipo),
  )) {
    if (!mapaUbicaciones.has(u.nombre.toLowerCase())) {
      const secId = u.seccion_nombre ? mapaSecciones.get(u.seccion_nombre.toLowerCase()) : null;
      const { data, error } = await supabase
        .from("ubicaciones")
        .insert({
          nombre: u.nombre,
          tipo: u.tipo,
          seccion: secId ?? null,
          descripcion: u.descripcion ?? null,
          activo: true,
        })
        .select()
        .single();
      if (!error && data) {
        mapaUbicaciones.set(u.nombre.toLowerCase(), data.id);
        ubicacionesCreadas++;
      }
    }
  }

  // Crear después nivel 2 (Armarios y Cross)
  for (const u of ubicacionesIniciales.filter((x) =>
    ["armario", "cross"].includes(x.tipo),
  )) {
    if (!mapaUbicaciones.has(u.nombre.toLowerCase())) {
      const secId = u.seccion_nombre ? mapaSecciones.get(u.seccion_nombre.toLowerCase()) : null;
      const padreId = u.padre_nombre ? mapaUbicaciones.get(u.padre_nombre.toLowerCase()) : null;

      const { data, error } = await supabase
        .from("ubicaciones")
        .insert({
          nombre: u.nombre,
          tipo: u.tipo,
          seccion: secId ?? null,
          id_ubicacion_padre: padreId ?? null,
          posicion_lateral: u.lateral ?? "R",
          numero: u.piso ?? 1,
          descripcion: u.descripcion ?? null,
          activo: true,
        })
        .select()
        .single();
      if (!error && data) {
        mapaUbicaciones.set(u.nombre.toLowerCase(), data.id);
        ubicacionesCreadas++;
      }
    }
  }

  return { seccionesCreadas, ubicacionesCreadas };
}
// ============================================================================
// CATEGORÍAS
// ============================================================================

/** Obtener todas las categorías activas */
export async function getCategorias(): Promise<Categoria[]> {
  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) throw error;
  return data || [];
}

/** Crear una nueva categoría */
export async function crearCategoria(
  nombre: string,
  descripcion: string | null = null,
): Promise<Categoria> {
  const { data, error } = await supabase
    .from("categorias")
    .insert({ nombre, descripcion, activo: true })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Actualizar una categoría */
export async function actualizarCategoria(
  id: string,
  updates: { nombre?: string; descripcion?: string | null; activo?: boolean },
): Promise<Categoria> {
  const { data, error } = await supabase
    .from("categorias")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Eliminar (desactivar) una categoría */
export async function desactivarCategoria(id: string): Promise<void> {
  const { error } = await supabase.from("categorias").update({ activo: false }).eq("id", id);

  if (error) throw error;
}

// ============================================================================
// PRODUCTOS
// ============================================================================

/** Obtener todos los productos activos */
export async function getProductos(): Promise<Producto[]> {
  try {
    const { data, error } = await supabase
      .from("productos")
      .select("*, categoria_rel:categorias(id, nombre)")
      .eq("activo", true)
      .order("nombre", { ascending: true });

    if (error) {
      console.warn("Aviso al consultar productos en Supabase:", error.message);
      return [];
    }

    return (data || []).map((p: any) => ({
      ...p,
      precio: p.precio_unitario ?? 0,
      precio_unitario: p.precio_unitario ?? 0,
      categoria: p.categoria || p.categoria_rel?.nombre || "Sin categoría",
    }));
  } catch (err: any) {
    console.warn("Excepción al consultar productos:", err.message);
    return [];
  }
}

/** Crear un nuevo producto */
export async function crearProducto(producto: any): Promise<Producto> {
  const payload: any = {
    sku: producto.sku,
    nombre: producto.nombre,
    codigo_barras: producto.codigo_barras || producto.sku || `BAR-{Date.now()}`,
    activo: producto.activo ?? true,
    precio_unitario: producto.precio_unitario ?? producto.precio ?? 0,
    descripcion: producto.descripcion ?? null,
  };

  if (producto.id_categoria) {
    payload.id_categoria = producto.id_categoria;
  } else if (producto.categoria && producto.categoria !== 'Sin categoría') {
    const { data: cat } = await supabase
      .from('categorias')
      .select('id')
      .eq('nombre', producto.categoria)
      .maybeSingle();
    if (cat?.id) {
      payload.id_categoria = cat.id;
    }
  }

  const { data, error } = await supabase.from('productos').insert(payload).select().single();

  if (error) throw error;
  return data;
}

/** Actualizar un producto (solo columnas válidas de la tabla productos) */
export async function actualizarProducto(id: string, updates: any): Promise<Producto> {
  const payload: any = {};

  if (updates.nombre !== undefined) payload.nombre = updates.nombre;
  if (updates.sku !== undefined) payload.sku = updates.sku;
  if (updates.codigo_barras !== undefined) payload.codigo_barras = updates.codigo_barras;
  if (updates.descripcion !== undefined) payload.descripcion = updates.descripcion;
  if (updates.activo !== undefined) payload.activo = updates.activo;

  if (updates.precio_unitario !== undefined) {
    payload.precio_unitario = updates.precio_unitario;
  } else if (updates.precio !== undefined) {
    payload.precio_unitario = updates.precio;
  }

  if (updates.id_categoria !== undefined) {
    payload.id_categoria = updates.id_categoria;
  } else if (updates.categoria !== undefined) {
    if (updates.categoria === 'Sin categoría' || !updates.categoria) {
      payload.id_categoria = null;
    } else {
      const { data: cat } = await supabase
        .from('categorias')
        .select('id')
        .eq('nombre', updates.categoria)
        .maybeSingle();
      if (cat?.id) {
        payload.id_categoria = cat.id;
      }
    }
  }

  const { data, error } = await supabase
    .from('productos')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Desactivar un producto (soft delete) */
export async function desactivarProducto(id: string, activo: boolean): Promise<void> {
  const { error } = await supabase.from("productos").update({ activo }).eq("id", id);

  if (error) throw error;
}

// ============================================================================
// TANSTACK QUERY OPTIONS
// ============================================================================

export const inventarioQueryOptions = {
  categorias: () =>
    queryOptions({
      queryKey: ["categorias"],
      queryFn: getCategorias,
    }),
  productos: () =>
    queryOptions({
      queryKey: ["productos"],
      queryFn: getProductos,
    }),
  secciones: () =>
    queryOptions({
      queryKey: ["secciones"],
      queryFn: getSecciones,
    }),
  ubicacionesCompletas: () =>
    queryOptions({
      queryKey: ["ubicacionesCompletas"],
      queryFn: getUbicacionesCompletas,
    }),
  palets: () =>
    queryOptions({
      queryKey: ["palets"],
      queryFn: getPalets,
    }),
  stock: () =>
    queryOptions({
      queryKey: ["stock"],
      queryFn: getStockPorUbicaciones,
    }),
};

// ============================================================================
// MANEJO DE ERRORES
// ============================================================================

/** Función para manejar errores de inventario */
export function errorInventario(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Error desconocido en el inventario";
}
// ============================================================================
// UBICACIONES (lectura simple para selects)
// ============================================================================

export async function getUbicaciones(): Promise<UbicacionSimple[]> {
  const { data, error } = await supabase.from("ubicaciones").select("*");
  if (error) throw error;
  return (data ?? []).map((u: any) => ({
    id: u.id,
    codigo: u.codigo ?? u.nombre ?? String(u.id).slice(0, 8),
    tipo: u.tipo ?? null,
  }));
}

// ============================================================================
// MOVIMIENTOS (Regla de Oro: NUNCA escribir en `stock`)
// ============================================================================

/**
 * Lee el historial de movimientos y resuelve producto/ubicación/usuario
 * con consultas paralelas (evita depender de nombres de relaciones embed).
 */
export async function getMovimientos(): Promise<MovimientoDetallado[]> {
  // 1. Obtener movimientos usando los nombres REALES de las columnas
  let movRes = await supabase
    .from("movimientos")
    .select("*")
    .order("fecha_movimiento", { ascending: false })
    .limit(500);

  if (movRes.error && /fecha_movimiento/.test(movRes.error.message)) {
    movRes = await supabase.from("movimientos").select("*").limit(500);
  }
  if (movRes.error) throw movRes.error;

  // 2. Obtener productos, ubicaciones y perfiles en paralelo
  const [prodRes, ubiRes, perRes] = await Promise.all([
    supabase.from("productos").select("id, nombre, sku, codigo_barras"),
    supabase.from("ubicaciones").select("id, nombre, tipo, descripcion"),
    supabase.from("perfiles_usuario").select("*"),
  ]);

  const prodMap = new Map((prodRes.data ?? []).map((p: any) => [p.id, p]));
  const ubiMap = new Map((ubiRes.data ?? []).map((u: any) => [u.id, u]));
  const perMap = new Map((perRes.data ?? []).map((u: any) => [u.id, u]));

  // 3. Mapear usando los nombres REALES: id_producto, id_ubicacion, realizado_por, fecha_movimiento
  const filas: MovimientoDetallado[] = (movRes.data ?? []).map((m: any) => {
    const p = prodMap.get(m.id_producto); // ✅ id_producto (no id_producto)
    const u = ubiMap.get(m.id_ubicacion); // ✅ id_ubicacion (no id_ubicacion)
    const per = m.realizado_por ? perMap.get(m.realizado_por) : undefined; // ✅ realizado_por (no realizado_por)

    return {
      id: m.id,
      tipo: m.tipo,
      cantidad: Number(m.cantidad),
      fecha: m.fecha_movimiento ?? new Date().toISOString(), // ✅ fecha_movimiento (no created_at)
      motivo: m.notas ?? null, // ✅ notas (no motivo)
      producto: p
        ? {
            id: p.id,
            nombre: p.nombre,
            sku: p.codigo_barras ?? p.sku ?? "S/N", // ✅ codigo_barras primero
          }
        : null,
      ubicacion: u
        ? {
            id: u.id,
            codigo: u.nombre ?? String(u.id).slice(0, 8), // ✅ nombre real de la ubicación
          }
        : null,
      usuario: per
        ? {
            id: per.id,
            nombre: per.nombre ?? per.nombre_completo ?? per.email ?? "Usuario",
          }
        : null,
    };
  });

  return filas.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

/**
 * REGISTRO DE MOVIMIENTO — REGLA DE ORO
 * 1. Nunca toca `stock`.
 * 2. Para `ajuste`, la cantidad es el STOCK OBJETIVO (valor absoluto):
 *    - Si objetivo === stock actual → no se registra nada.
 *    - Si objetivo === 0 → se convierte en `salida` por el stock total
 *      (el trigger rechaza cantidad <= 0).
 * 3. INSERT en `movimientos` → el trigger `actualizar_stock` actualiza el stock.
 */
export async function crearMovimiento(input: {
  id_producto: string;
  id_ubicacion: string;
  tipo: "entrada" | "salida" | "reposicion" | "ajuste";
  cantidad: number; // en `ajuste`: stock objetivo absoluto
  motivo?: string;
  id_palet?: string;
}): Promise<void> {
  let tipoFinal: typeof input.tipo = input.tipo;
  let cantidadFinal = Number(input.cantidad);

  if (input.tipo === "ajuste") {
    const { data: stockRow, error: stockError } = await supabase
      .from("stock")
      .select("cantidad")
      .eq("id_producto", input.id_producto)
      .eq("id_ubicacion", input.id_ubicacion)
      .maybeSingle();

    if (stockError) throw stockError;
    const actual = Number(stockRow?.cantidad ?? 0);
    const objetivo = Number(input.cantidad);

    if (objetivo === actual) {
      throw new Error("El stock ya tiene ese valor: no se registra movimiento.");
    }
    if (objetivo === 0) {
      tipoFinal = "salida";
      cantidadFinal = actual; // vaciado total vía salida
    } else {
      cantidadFinal = objetivo; // el trigger fijará stock = cantidad
    }
  }

  if (!(cantidadFinal > 0)) {
    throw new Error("La cantidad debe ser mayor que 0.");
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Debes iniciar sesión para registrar el movimiento.");

  const payload: Record<string, unknown> = {
    id_producto: input.id_producto,
    id_ubicacion: input.id_ubicacion,
    tipo: tipoFinal,
    cantidad: cantidadFinal,
    notas: input.motivo?.trim() ? input.motivo.trim() : null,
    realizado_por: userData.user.id,
    ...(input.id_palet ? { id_palet: input.id_palet } : {}),
  };

  const { error } = await supabase.from("movimientos").insert(payload);
  if (error) {
    if (error.code === "42501") {
      throw new Error(`Permiso denegado (42501): ${error.message}`);
    }
    throw error;
  }
}

export async function getTopUbicaciones(
  limit: number = 5,
): Promise<{ nombre: string; stock_total: number; unidad: string; porcentaje: number }[]> {
  try {
    const [stockRes, ubiRes] = await Promise.all([
      supabase.from("stock").select("cantidad, id_ubicacion"),
      supabase.from("ubicaciones").select("id, nombre, tipo").eq("activo", true),
    ]);

    if (stockRes.error) {
      console.warn("Aviso en getTopUbicaciones (stock):", stockRes.error.message);
      return [];
    }

    const ubiMap = new Map<string, { nombre: string; tipo: string }>(
      (ubiRes.data ?? []).map((u: any) => [u.id, u]),
    );

    const ubicacionesMap = new Map<string, { nombre: string; tipo: string; total: number }>();

    for (const item of stockRes.data ?? []) {
      const ubiId = item.id_ubicacion;
      if (!ubiId) continue;
      const ubi = ubiMap.get(ubiId);
      if (!ubicacionesMap.has(ubiId)) {
        ubicacionesMap.set(ubiId, {
          nombre: ubi?.nombre || `Ubicación ${String(ubiId).slice(0, 8)}`,
          tipo: ubi?.tipo || "armario",
          total: 0,
        });
      }
      ubicacionesMap.get(ubiId)!.total += Number(item.cantidad) || 0;
    }

    const ubicacionesArray = Array.from(ubicacionesMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);

    const maxStock = ubicacionesArray[0]?.total || 1;

    return ubicacionesArray.map((u) => ({
      nombre: u.nombre,
      stock_total: u.total,
      unidad: u.tipo === "armario" ? "unid" : "gal",
      porcentaje: Math.round((u.total / maxStock) * 100),
    }));
  } catch (err) {
    console.warn("Excepción en getTopUbicaciones:", err);
    return [];
  }
}
