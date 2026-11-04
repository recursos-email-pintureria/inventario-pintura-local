import * as XLSX from "xlsx";
import type { FilaCSV, FilaListaArmarioRaw } from "./parser-lista-armario";
import type { Producto, Stock } from "./tipos";
import { neutralizarFormula } from "./excel-stock";

export interface OpcionesValidacion {
  modo: "sumar" | "establecer";
  duplicados: "sumar" | "rechazar";
}

export interface FilaValida {
  numeroFila: number;
  sku: string;
  codigoBarras: string;
  nombre: string;
  cantidad: number;
  estado: "valida" | "aviso";
  aviso?: string;
}

export interface FilaConError {
  numeroFila: number;
  sku: string | null;
  codigoBarras: string | null;
  nombre: string | null;
  cantidadTexto: string | null;
  estado: "error" | "omitida" | "conflicto";
  motivo: string;
}

export interface ResultadoValidacion {
  filasValidas: FilaValida[];
  filasConError: FilaConError[];
  resumen: {
    validas: number;
    errores: number;
    omitidas: number;
    conflictos: number;
    avisos: number;
  };
}

interface CandidataValida extends FilaValida {
  indice: number;
}

type EstadoError = FilaConError["estado"];

function valorNormalizado(valor: string | null | undefined): string | null {
  const normalizado = valor?.trim() ?? "";
  return normalizado === "" ? null : normalizado;
}

function crearError(fila: FilaCSV, estado: EstadoError, motivo: string): FilaConError {
  return {
    numeroFila: fila.numeroFila,
    sku: valorNormalizado(fila.referencia),
    codigoBarras: valorNormalizado(fila.ean),
    nombre: valorNormalizado(fila.nombre),
    cantidadTexto: valorNormalizado(fila.cantidadTexto),
    estado,
    motivo,
  };
}

function cantidadEntera(
  texto: string | null,
): { cantidad: number; omitida: boolean } | { error: string } {
  const valor = texto?.trim() ?? "";
  if (valor === "") {
    return { cantidad: 0, omitida: true };
  }

  // Comprobar formato numérico con punto o coma
  if (!/^\d+(?:[.,]\d+)?$/.test(valor)) {
    return { error: "Cantidad no válida" };
  }

  const cantidad = Number(valor.replace(",", "."));
  if (!Number.isFinite(cantidad)) {
    return { error: "Cantidad no válida" };
  }
  if (!Number.isInteger(cantidad)) {
    return { error: "La cantidad debe ser un número entero" };
  }
  if (!Number.isSafeInteger(cantidad)) {
    return { error: "Cantidad no válida" };
  }
  if (cantidad === 0) {
    return { cantidad: 0, omitida: true };
  }

  return { cantidad, omitida: false };
}

function ean13Valido(ean: string): boolean {
  if (!/^\d{13}$/.test(ean)) {
    return true;
  }

  const digitos = [...ean].map(Number);
  const suma = digitos
    .slice(0, 12)
    .reduce((total, digito, indice) => total + digito * (indice % 2 === 0 ? 1 : 3), 0);

  return (10 - (suma % 10)) % 10 === digitos[12];
}

function claveProducto(sku: string, ean: string): string {
  return JSON.stringify([sku, ean]);
}

function agregarIndice(indice: Map<string, Set<string>>, clave: string, valor: string): void {
  const valores = indice.get(clave) ?? new Set<string>();
  valores.add(valor);
  indice.set(clave, valores);
}

export function validarFilasCSV(
  filas: FilaCSV[],
  opciones: OpcionesValidacion,
): ResultadoValidacion {
  const candidatas: CandidataValida[] = [];
  const filasConError: FilaConError[] = [];

  filas.forEach((fila, indice) => {
    const sku = valorNormalizado(fila.referencia);
    const codigoBarras = valorNormalizado(fila.ean);
    const nombre = valorNormalizado(fila.nombre);

    if (sku === null || codigoBarras === null) {
      filasConError.push(crearError(fila, "error", "Falta REFERENCIA o EAN"));
      return;
    }

    if (nombre === null) {
      filasConError.push(crearError(fila, "error", "Falta NOMBRE"));
      return;
    }

    const resultadoCantidad = cantidadEntera(fila.cantidadTexto);
    if ("error" in resultadoCantidad) {
      filasConError.push(crearError(fila, "error", resultadoCantidad.error));
      return;
    }

    if (resultadoCantidad.omitida) {
      filasConError.push(crearError(fila, "omitida", "Cantidad vacía o cero"));
      return;
    }

    const estadoEan = ean13Valido(codigoBarras);
    candidatas.push({
      indice,
      numeroFila: fila.numeroFila,
      sku,
      codigoBarras,
      nombre,
      cantidad: resultadoCantidad.cantidad,
      estado: estadoEan ? "valida" : "aviso",
      ...(estadoEan ? {} : { aviso: "EAN-13 con dígito de control incorrecto" }),
    });
  });

  const skusPorEan = new Map<string, Set<string>>();
  const eansPorSku = new Map<string, Set<string>>();

  for (const candidata of candidatas) {
    agregarIndice(skusPorEan, candidata.codigoBarras, candidata.sku);
    agregarIndice(eansPorSku, candidata.sku, candidata.codigoBarras);
  }

  const indicesCruzados = new Set<number>();
  for (const candidata of candidatas) {
    const eans = eansPorSku.get(candidata.sku);
    const skus = skusPorEan.get(candidata.codigoBarras);
    if ((eans && eans.size > 1) || (skus && skus.size > 1)) {
      indicesCruzados.add(candidata.indice);
    }
  }

  const candidatasFiltradas = candidatas.filter((candidata) => {
    if (!indicesCruzados.has(candidata.indice)) {
      return true;
    }

    const filaOrigen = filas[candidata.indice];
    if (filaOrigen) {
      filasConError.push(
        crearError(filaOrigen, "conflicto", "SKU/EAN cruzado con otra fila del CSV"),
      );
    }
    return false;
  });

  const gruposDuplicados = new Map<string, CandidataValida[]>();
  for (const candidata of candidatasFiltradas) {
    const clave = claveProducto(candidata.sku, candidata.codigoBarras);
    const grupo = gruposDuplicados.get(clave) ?? [];
    grupo.push(candidata);
    gruposDuplicados.set(clave, grupo);
  }

  const filasValidas: FilaValida[] = [];

  for (const grupo of gruposDuplicados.values()) {
    const primera = grupo[0];
    if (!primera) continue;

    if (grupo.length > 1 && opciones.duplicados === "rechazar") {
      for (const duplicada of grupo) {
        const filaOrigen = filas[duplicada.indice];
        if (filaOrigen) {
          filasConError.push(crearError(filaOrigen, "conflicto", "SKU+EAN duplicado en el CSV"));
        }
      }
      continue;
    }

    const cantidadTotal = grupo.reduce((total, candidata) => total + candidata.cantidad, 0);

    filasValidas.push({
      numeroFila: primera.numeroFila,
      sku: primera.sku,
      codigoBarras: primera.codigoBarras,
      nombre: primera.nombre,
      cantidad: Number(cantidadTotal),
      estado: primera.estado,
      ...(primera.aviso ? { aviso: primera.aviso } : {}),
    });

    for (const duplicada of grupo.slice(1)) {
      const filaOrigen = filas[duplicada.indice];
      if (filaOrigen) {
        filasConError.push(
          crearError(filaOrigen, "omitida", `Cantidad sumada a la fila ${primera.numeroFila}`),
        );
      }
    }
  }

  filasValidas.sort((a, b) => a.numeroFila - b.numeroFila);
  filasConError.sort((a, b) => a.numeroFila - b.numeroFila);

  return {
    filasValidas,
    filasConError,
    resumen: {
      validas: filasValidas.length,
      errores: filasConError.filter((fila) => fila.estado === "error").length,
      omitidas: filasConError.filter((fila) => fila.estado === "omitida").length,
      conflictos: filasConError.filter((fila) => fila.estado === "conflicto").length,
      avisos: filasValidas.filter((fila) => fila.estado === "aviso").length,
    },
  };
}

// ============================================================================
// SOPORTE PARA validarListaParaArmario
// ============================================================================

export type EstadoFilaValidada = "correcta" | "aviso" | "error" | "conflicto" | "omitida";

export interface FilaValidadaListaArmario {
  idFila: string;
  numeroFilaOriginal: number;
  nombre: string;
  referencia: string;
  ean: string;
  cantidad: number;
  modo: "sumar" | "establecer";
  estado: EstadoFilaValidada;
  mensajesAviso: string[];
  mensajesError: string[];
  mensajesConflicto: string[];
  seCrearaProducto: boolean;
  productoExistenteId?: string | undefined;
  nombreEnCatalogo?: string | undefined;
  eanEnCatalogo?: string | undefined;
  stockActual: number;
  stockResultante: number;
  diferencia: number;
  esDuplicadaEnArchivo: boolean;
  cantidadOriginalDuplicada?: number | undefined;
}

export interface ResumenValidacionListaArmario {
  totalFilas: number;
  correctas: number;
  avisos: number;
  errores: number;
  conflictos: number;
  omitidas: number;
  productosNuevosACrear: number;
  productosExistentes: number;
  unidadesTotalesResultantes: number;
}

export interface ValidarListaArmarioParams {
  filasRaw: FilaListaArmarioRaw[];
  catalogoProductos: Producto[];
  stockUbicacion: Stock[];
  idUbicacion: string;
  nombreUbicacion: string;
  modo: "sumar" | "establecer";
  accionDuplicados: "sumar" | "rechazar";
}

export function validarListaParaArmario(params: ValidarListaArmarioParams): {
  filasValidadas: FilaValidadaListaArmario[];
  resumen: ResumenValidacionListaArmario;
} {
  const { filasRaw, catalogoProductos, stockUbicacion, idUbicacion, modo, accionDuplicados } =
    params;

  const filasValidadas: FilaValidadaListaArmario[] = [];

  const prodPorSku = new Map<string, Producto>();
  const prodPorEan = new Map<string, Producto>();
  for (const prod of catalogoProductos) {
    if (prod.sku) prodPorSku.set(prod.sku.trim().toUpperCase(), prod);
    const cb = prod.codigo_barras || (prod as any).ean;
    if (cb) prodPorEan.set(String(cb).trim(), prod);
  }

  const stockPorProdId = new Map<string, number>();
  for (const s of stockUbicacion) {
    if (s.id_ubicacion === idUbicacion) {
      stockPorProdId.set(s.id_producto, s.cantidad);
    }
  }

  const conteoReferencias = new Map<string, number[]>();
  filasRaw.forEach((f, idx) => {
    if (f.referencia) {
      const refNorm = f.referencia.trim().toUpperCase();
      const indices = conteoReferencias.get(refNorm) || [];
      indices.push(idx);
      conteoReferencias.set(refNorm, indices);
    }
  });

  for (let i = 0; i < filasRaw.length; i++) {
    const raw = filasRaw[i]!;
    const idFila = `fila-${raw.numeroFilaOriginal}-${i}`;
    const mensajesAviso: string[] = [];
    const mensajesError: string[] = [];
    const mensajesConflicto: string[] = [];

    if (raw.esOmitida) {
      filasValidadas.push({
        idFila,
        numeroFilaOriginal: raw.numeroFilaOriginal,
        nombre: raw.nombre,
        referencia: raw.referencia,
        ean: raw.ean,
        cantidad: 0,
        modo,
        estado: "omitida",
        mensajesAviso: [],
        mensajesError: [],
        mensajesConflicto: [],
        seCrearaProducto: false,
        stockActual: 0,
        stockResultante: 0,
        diferencia: 0,
        esDuplicadaEnArchivo: false,
      });
      continue;
    }

    const refNorm = raw.referencia.trim().toUpperCase();
    const eanNorm = raw.ean.trim();
    const cantidad = raw.cantidad ?? 0;

    const indicesDuplicados = conteoReferencias.get(refNorm) || [];
    const esDuplicada = indicesDuplicados.length > 1;

    if (esDuplicada) {
      if (accionDuplicados === "rechazar") {
        mensajesError.push(`La referencia "${raw.referencia}" aparece repetida en el archivo.`);
      } else {
        mensajesAviso.push(`La referencia "${raw.referencia}" está repetida en el archivo.`);
      }
    }

    if (raw.avisoEan) {
      mensajesAviso.push(raw.avisoEan);
    }

    const prodExistentePorSku = prodPorSku.get(refNorm);
    const prodExistentePorEan = eanNorm ? prodPorEan.get(eanNorm) : undefined;

    let seCrearaProducto = false;
    let productoExistenteId: string | undefined = undefined;
    let nombreEnCatalogo: string | undefined = undefined;
    let eanEnCatalogo: string | undefined = undefined;

    if (prodExistentePorSku) {
      productoExistenteId = prodExistentePorSku.id;
      nombreEnCatalogo = prodExistentePorSku.nombre;
      eanEnCatalogo = prodExistentePorSku.codigo_barras || undefined;

      if (prodExistentePorEan && prodExistentePorEan.id !== prodExistentePorSku.id) {
        mensajesConflicto.push(
          `Conflicto de identidad: El EAN "${raw.ean}" pertenece a "${prodExistentePorEan.nombre}".`,
        );
      }
    } else {
      if (prodExistentePorEan) {
        mensajesConflicto.push(
          `Conflicto de catálogo: El EAN "${raw.ean}" ya está registrado en "${prodExistentePorEan.nombre}".`,
        );
      } else {
        seCrearaProducto = true;
      }
    }

    const stockActual = productoExistenteId ? (stockPorProdId.get(productoExistenteId) ?? 0) : 0;
    let stockResultante = stockActual;
    let diferencia = 0;

    if (modo === "sumar") {
      stockResultante = stockActual + cantidad;
      diferencia = cantidad;
    } else {
      stockResultante = cantidad;
      diferencia = cantidad - stockActual;
    }

    let estado: EstadoFilaValidada = "correcta";
    if (mensajesError.length > 0) {
      estado = "error";
    } else if (mensajesConflicto.length > 0) {
      estado = "conflicto";
    } else if (mensajesAviso.length > 0) {
      estado = "aviso";
    }

    filasValidadas.push({
      idFila,
      numeroFilaOriginal: raw.numeroFilaOriginal,
      nombre: raw.nombre,
      referencia: raw.referencia,
      ean: raw.ean,
      cantidad,
      modo,
      estado,
      mensajesAviso,
      mensajesError,
      mensajesConflicto,
      seCrearaProducto,
      productoExistenteId,
      nombreEnCatalogo,
      eanEnCatalogo,
      stockActual,
      stockResultante,
      diferencia,
      esDuplicadaEnArchivo: esDuplicada,
    });
  }

  const resumen: ResumenValidacionListaArmario = {
    totalFilas: filasValidadas.length,
    correctas: filasValidadas.filter((f) => f.estado === "correcta").length,
    avisos: filasValidadas.filter((f) => f.estado === "aviso").length,
    errores: filasValidadas.filter((f) => f.estado === "error").length,
    conflictos: filasValidadas.filter((f) => f.estado === "conflicto").length,
    omitidas: filasValidadas.filter((f) => f.estado === "omitida").length,
    productosNuevosACrear: filasValidadas.filter(
      (f) => f.seCrearaProducto && f.estado !== "error" && f.estado !== "conflicto",
    ).length,
    productosExistentes: filasValidadas.filter(
      (f) => !f.seCrearaProducto && f.estado !== "error" && f.estado !== "conflicto",
    ).length,
    unidadesTotalesResultantes: filasValidadas
      .filter((f) => f.estado !== "error" && f.estado !== "conflicto")
      .reduce((acc, f) => acc + f.stockResultante, 0),
  };

  return { filasValidadas, resumen };
}

export function generarInformeErroresListaArmarioExcel(
  filasValidadas: FilaValidadaListaArmario[],
  _nombreUbicacion: string,
): Uint8Array {
  const wb = XLSX.utils.book_new();

  const datosFilas = filasValidadas.map((f) => ({
    Fila: f.numeroFilaOriginal,
    Nombre: neutralizarFormula(f.nombre),
    Referencia: neutralizarFormula(f.referencia),
    EAN: neutralizarFormula(f.ean),
    Cantidad: f.cantidad,
    Estado: f.estado.toUpperCase(),
    Incidencias:
      [...f.mensajesError, ...f.mensajesConflicto, ...f.mensajesAviso].join(" | ") || "OK",
    "Stock Actual": f.stockActual,
    "Stock Resultante": f.stockResultante,
  }));

  const ws = XLSX.utils.json_to_sheet(datosFilas);
  XLSX.utils.book_append_sheet(wb, ws, "Informe Carga Armario");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Uint8Array(wbout);
}
