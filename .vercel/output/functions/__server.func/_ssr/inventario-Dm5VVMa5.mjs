import { r as supabase } from "./supabase-BJUFiUL8.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/inventario-Dm5VVMa5.js
async function getSecciones() {
	try {
		const { data, error } = await supabase.from("secciones").select("*").eq("activo", true).order("nombre", { ascending: true });
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
async function getUbicacionesCompletas() {
	try {
		const { data, error } = await supabase.from("ubicaciones").select("*").eq("activo", true).order("nombre", { ascending: true });
		if (error) {
			console.warn("Aviso al consultar ubicaciones en Supabase:", error.message);
			return [];
		}
		return (data ?? []).map((u) => ({
			id: u.id,
			nombre: u.nombre,
			codigo: u.codigo ?? (u.nombre ? u.nombre.replace(/\s+/g, "-").toUpperCase().slice(0, 10) : `UBI-${String(u.id).slice(0, 6)}`),
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
			numero: u.numero ?? null
		}));
	} catch (err) {
		console.warn("Excepción al consultar ubicaciones:", err);
		return [];
	}
}
async function crearUbicacionBD(ubi) {
	const { data: userData } = await supabase.auth.getUser();
	const payload = {
		nombre: ubi.nombre,
		tipo: ubi.tipo,
		descripcion: ubi.descripcion ?? null,
		id_ubicacion_padre: ubi.id_ubicacion_padre ?? null,
		seccion: ubi.seccion ?? null,
		posicion_lateral: ubi.posicion_lateral ?? null,
		posicion_longitudinal: ubi.posicion_longitudinal ?? null,
		numero: ubi.numero ?? null,
		activo: true
	};
	if (userData?.user?.id) payload["creado_por"] = userData.user.id;
	let res = await supabase.from("ubicaciones").insert(payload).select().single();
	if (res.error) {
		console.warn("Reintentando inserción básica de ubicación:", res.error.message);
		const payloadMinimo = {
			nombre: ubi.nombre,
			tipo: ubi.tipo,
			descripcion: ubi.descripcion ?? null,
			activo: true
		};
		if (ubi.id_ubicacion_padre) payloadMinimo["id_ubicacion_padre"] = ubi.id_ubicacion_padre;
		if (ubi.seccion) payloadMinimo["seccion"] = ubi.seccion;
		res = await supabase.from("ubicaciones").insert(payloadMinimo).select().single();
	}
	if (res.error) throw res.error;
	return res.data;
}
async function desactivarUbicacionBD(id) {
	const { error } = await supabase.from("ubicaciones").update({ activo: false }).eq("id", id);
	if (error) throw error;
}
async function getPalets() {
	try {
		const { data, error } = await supabase.from("palets").select("*").eq("activo", true).order("numero_palet", { ascending: true });
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
async function crearPaletBD(input) {
	const { data, error } = await supabase.from("palets").insert({
		id_reserva: input.id_reserva,
		numero_palet: input.numero_palet,
		codigo_barras: input.codigo_barras,
		generado_por: input.generado_por ?? "Javier Vendedor",
		activo: true
	}).select().single();
	if (error) throw error;
	return data;
}
async function darDeBajaPaletBD(id) {
	const { error } = await supabase.from("palets").update({
		activo: false,
		fecha_baja: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", id);
	if (error) throw error;
}
async function getStockPorUbicaciones() {
	try {
		const { data, error } = await supabase.from("stock").select("*");
		if (error) {
			console.warn("Aviso al consultar stock en Supabase:", error.message);
			return [];
		}
		return (data ?? []).map((s) => ({
			id_producto: s.id_producto ?? s.producto_id,
			id_ubicacion: s.id_ubicacion ?? s.ubicacion_id,
			cantidad: Number(s.cantidad || 0),
			actualizado_en: s.actualizado_en ?? s.updated_at ?? null,
			id_palet: s.id_palet ?? null
		}));
	} catch (err) {
		console.warn("Excepción al consultar stock:", err);
		return [];
	}
}
async function sincronizarEstructuraInicialSupabase(seccionesIniciales, ubicacionesIniciales) {
	let seccionesCreadas = 0;
	let ubicacionesCreadas = 0;
	const { data: secExistentes } = await supabase.from("secciones").select("id, nombre");
	const mapaSecciones = /* @__PURE__ */ new Map();
	(secExistentes ?? []).forEach((s) => mapaSecciones.set(s.nombre.toLowerCase(), s.id));
	for (const sec of seccionesIniciales) if (!mapaSecciones.has(sec.nombre.toLowerCase())) {
		const { data, error } = await supabase.from("secciones").insert({
			nombre: sec.nombre,
			descripcion: sec.descripcion ?? null,
			activo: true
		}).select().single();
		if (!error && data) {
			mapaSecciones.set(sec.nombre.toLowerCase(), data.id);
			seccionesCreadas++;
		}
	}
	const { data: ubiExistentes } = await supabase.from("ubicaciones").select("id, nombre");
	const mapaUbicaciones = /* @__PURE__ */ new Map();
	(ubiExistentes ?? []).forEach((u) => mapaUbicaciones.set(u.nombre.toLowerCase(), u.id));
	for (const u of ubicacionesIniciales.filter((x) => [
		"pasillo",
		"caja",
		"reserva"
	].includes(x.tipo))) if (!mapaUbicaciones.has(u.nombre.toLowerCase())) {
		const secId = u.seccion_nombre ? mapaSecciones.get(u.seccion_nombre.toLowerCase()) : null;
		const { data, error } = await supabase.from("ubicaciones").insert({
			nombre: u.nombre,
			tipo: u.tipo,
			seccion: secId ?? null,
			descripcion: u.descripcion ?? null,
			activo: true
		}).select().single();
		if (!error && data) {
			mapaUbicaciones.set(u.nombre.toLowerCase(), data.id);
			ubicacionesCreadas++;
		}
	}
	for (const u of ubicacionesIniciales.filter((x) => [
		"armario",
		"alto",
		"cross"
	].includes(x.tipo))) if (!mapaUbicaciones.has(u.nombre.toLowerCase())) {
		const secId = u.seccion_nombre ? mapaSecciones.get(u.seccion_nombre.toLowerCase()) : null;
		const padreId = u.padre_nombre ? mapaUbicaciones.get(u.padre_nombre.toLowerCase()) : null;
		const { data, error } = await supabase.from("ubicaciones").insert({
			nombre: u.nombre,
			tipo: u.tipo,
			seccion: secId ?? null,
			id_ubicacion_padre: padreId ?? null,
			posicion_lateral: u.lateral ?? "R",
			numero: u.piso ?? 1,
			descripcion: u.descripcion ?? null,
			activo: true
		}).select().single();
		if (!error && data) {
			mapaUbicaciones.set(u.nombre.toLowerCase(), data.id);
			ubicacionesCreadas++;
		}
	}
	return {
		seccionesCreadas,
		ubicacionesCreadas
	};
}
/** Obtener todas las categorías activas */
async function getCategorias() {
	const { data, error } = await supabase.from("categorias").select("*").eq("activo", true).order("nombre", { ascending: true });
	if (error) throw error;
	return data || [];
}
/** Crear una nueva categoría */
async function crearCategoria(nombre, descripcion = null) {
	const { data, error } = await supabase.from("categorias").insert({
		nombre,
		descripcion,
		activo: true
	}).select().single();
	if (error) throw error;
	return data;
}
/** Actualizar una categoría */
async function actualizarCategoria(id, updates) {
	const { data, error } = await supabase.from("categorias").update(updates).eq("id", id).select().single();
	if (error) throw error;
	return data;
}
/** Eliminar (desactivar) una categoría */
async function desactivarCategoria(id) {
	const { error } = await supabase.from("categorias").update({ activo: false }).eq("id", id);
	if (error) throw error;
}
/** Obtener todos los productos activos */
async function getProductos() {
	const { data, error } = await supabase.from("productos").select("*").eq("activo", true).order("nombre", { ascending: true });
	if (error) throw error;
	return data || [];
}
/** Crear un nuevo producto */
async function crearProducto(producto) {
	const { data, error } = await supabase.from("productos").insert({
		sku: producto.sku,
		nombre: producto.nombre,
		categoria: producto.categoria,
		stock_actual: producto.stock_actual ?? 0,
		stock_minimo: producto.stock_minimo ?? 0,
		unidad: producto.unidad ?? "unid",
		ubicacion: producto.ubicacion ?? null,
		precio: producto.precio ?? 0,
		activo: true,
		largo: producto.largo ?? null,
		ancho: producto.ancho ?? null,
		alto: producto.alto ?? null,
		peso: producto.peso ?? null
	}).select().single();
	if (error) throw error;
	return data;
}
/** Actualizar un producto */
async function actualizarProducto(id, updates) {
	const { data, error } = await supabase.from("productos").update(updates).eq("id", id).select().single();
	if (error) throw error;
	return data;
}
/** Desactivar un producto (soft delete) */
async function desactivarProducto(id, activo) {
	const { error } = await supabase.from("productos").update({ activo }).eq("id", id);
	if (error) throw error;
}
async function getUbicaciones() {
	const { data, error } = await supabase.from("ubicaciones").select("*");
	if (error) throw error;
	return (data ?? []).map((u) => ({
		id: u.id,
		codigo: u.codigo ?? u.nombre ?? String(u.id).slice(0, 8),
		tipo: u.tipo ?? null
	}));
}
/**
* Lee el historial de movimientos y resuelve producto/ubicación/usuario
* con consultas paralelas (evita depender de nombres de relaciones embed).
*/
async function getMovimientos() {
	let movRes = await supabase.from("movimientos").select("*").order("created_at", { ascending: false }).limit(500);
	if (movRes.error && /created_at/.test(movRes.error.message)) movRes = await supabase.from("movimientos").select("*").limit(500);
	if (movRes.error) throw movRes.error;
	const [prodRes, ubiRes, perRes] = await Promise.all([
		supabase.from("productos").select("id, nombre, sku"),
		supabase.from("ubicaciones").select("*"),
		supabase.from("perfiles_usuario").select("*")
	]);
	const prodMap = new Map((prodRes.data ?? []).map((p) => [p.id, p]));
	const ubiMap = new Map((ubiRes.data ?? []).map((u) => [u.id, u]));
	const perMap = new Map((perRes.data ?? []).map((u) => [u.id, u]));
	return (movRes.data ?? []).map((m) => {
		const p = prodMap.get(m.producto_id);
		const u = ubiMap.get(m.ubicacion_id);
		const per = m.usuario_id ? perMap.get(m.usuario_id) : void 0;
		return {
			id: m.id,
			tipo: m.tipo,
			cantidad: Number(m.cantidad),
			fecha: m.created_at ?? m.fecha ?? (/* @__PURE__ */ new Date()).toISOString(),
			motivo: m.motivo ?? null,
			producto: p ? {
				id: p.id,
				nombre: p.nombre,
				sku: p.sku ?? null
			} : null,
			ubicacion: u ? {
				id: u.id,
				codigo: u.codigo ?? u.nombre ?? String(u.id).slice(0, 8)
			} : null,
			usuario: per ? {
				id: per.id,
				nombre: per.nombre ?? per.nombre_completo ?? per.email ?? "Usuario"
			} : null
		};
	}).sort((a, b) => a.fecha < b.fecha ? 1 : -1);
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
async function crearMovimiento(input) {
	let tipoFinal = input.tipo;
	let cantidadFinal = Number(input.cantidad);
	if (input.tipo === "ajuste") {
		const { data: stockRow } = await supabase.from("stock").select("cantidad").eq("producto_id", input.producto_id).eq("ubicacion_id", input.ubicacion_id).maybeSingle();
		const actual = Number(stockRow?.cantidad ?? 0);
		const objetivo = Number(input.cantidad);
		if (objetivo === actual) throw new Error("El stock ya tiene ese valor: no se registra movimiento.");
		if (objetivo === 0) {
			tipoFinal = "salida";
			cantidadFinal = actual;
		} else cantidadFinal = objetivo;
	}
	if (!(cantidadFinal > 0)) throw new Error("La cantidad debe ser mayor que 0.");
	const { data: userData } = await supabase.auth.getUser();
	const payload = {
		producto_id: input.producto_id,
		ubicacion_id: input.ubicacion_id,
		tipo: tipoFinal,
		cantidad: cantidadFinal,
		motivo: input.motivo?.trim() ? input.motivo.trim() : null,
		usuario_id: userData.user?.id ?? null
	};
	let res = await supabase.from("movimientos").insert(payload);
	if (res.error && /usuario_id/.test(res.error.message)) {
		const { usuario_id, ...resto } = payload;
		res = await supabase.from("movimientos").insert(resto);
	}
	if (res.error && /motivo/.test(res.error.message)) {
		const { motivo, ...resto } = payload;
		res = await supabase.from("movimientos").insert(resto);
	}
	if (res.error) throw res.error;
}
//#endregion
export { getStockPorUbicaciones as _, crearPaletBD as a, sincronizarEstructuraInicialSupabase as b, darDeBajaPaletBD as c, desactivarUbicacionBD as d, getCategorias as f, getSecciones as g, getProductos as h, crearMovimiento as i, desactivarCategoria as l, getPalets as m, actualizarProducto as n, crearProducto as o, getMovimientos as p, crearCategoria as r, crearUbicacionBD as s, actualizarCategoria as t, desactivarProducto as u, getUbicaciones as v, getUbicacionesCompletas as y };
