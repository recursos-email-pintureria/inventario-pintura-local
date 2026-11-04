import type { FilaCSV } from "./parser-lista-armario";

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

function valorNormalizado(valor: string | null): string | null {
  const normalizado = valor?.trim() ?? "";
  return normalizado === "" ? null : normalizado;
}

function crearError(
  fila: FilaCSV,
  estado: EstadoError,
  motivo: string,
): FilaConError {
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

function agregarIndice(
  indice: Map<string, Set<string>>,
  clave: string,
  valor: string,
): void {
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
      filasConError.push(
        crearError(fila, "error", "Falta REFERENCIA o EAN"),
      );
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
      filasConError.push(
        crearError(fila, "omitida", "Cantidad vacía o cero"),
      );
      return;
    }

    const aviso = ean13Valido(codigoBarras)
      ? undefined
      : "EAN-13 con dígito de control incorrecto";
    candidatas.push({
      indice,
      numeroFila: fila.numeroFila,
      sku,
      codigoBarras,
      nombre,
      cantidad: resultadoCantidad.cantidad,
      estado: aviso ? "aviso" : "valida",
      ...(aviso ? { aviso } : {}),
    });
  });

  const eansPorSku = new Map<string, Set<string>>();
  const skusPorEan = new Map<string, Set<string>>();
  for (const candidata of candidatas) {
    agregarIndice(eansPorSku, candidata.sku, candidata.codigoBarras);
    agregarIndice(skusPorEan, candidata.codigoBarras, candidata.sku);
  }

  const candidatasSinCruces: CandidataValida[] = [];
  for (const candidata of candidatas) {
    if (
      (eansPorSku.get(candidata.sku)?.size ?? 0) > 1 ||
      (skusPorEan.get(candidata.codigoBarras)?.size ?? 0) > 1
    ) {
      const filaOrigen = filas[candidata.indice];
      if (filaOrigen) {
        filasConError.push(
          crearError(
            filaOrigen,
            "conflicto",
            "SKU/EAN cruzado con otra fila del CSV",
          ),
        );
      }
      continue;
    }
    candidatasSinCruces.push(candidata);
  }

  const grupos = new Map<string, CandidataValida[]>();
  for (const candidata of candidatasSinCruces) {
    const clave = claveProducto(candidata.sku, candidata.codigoBarras);
    const grupo = grupos.get(clave) ?? [];
    grupo.push(candidata);
    grupos.set(clave, grupo);
  }

  const filasValidas: FilaValida[] = [];
  for (const grupo of grupos.values()) {
    if (grupo.length > 1 && opciones.duplicados === "rechazar") {
      for (const candidata of grupo) {
        const filaOrigen = filas[candidata.indice];
        if (filaOrigen) {
          filasConError.push(
            crearError(filaOrigen, "conflicto", "SKU+EAN duplicado en el CSV"),
          );
        }
      }
      continue;
    }

    const primera = grupo[0];
    if (!primera) {
      continue;
    }

    const cantidadTotal =
      opciones.duplicados === "sumar" && grupo.length > 1
        ? grupo.reduce((total, candidata) => total + BigInt(candidata.cantidad), 0n)
        : BigInt(primera.cantidad);

    if (cantidadTotal > BigInt(Number.MAX_SAFE_INTEGER)) {
      const filaOrigen = filas[primera.indice];
      if (filaOrigen) {
        filasConError.push(crearError(filaOrigen, "error", "Cantidad no válida"));
      }
      for (const duplicada of grupo.slice(1)) {
        const filaOrigen = filas[duplicada.indice];
        if (filaOrigen) {
          filasConError.push(crearError(filaOrigen, "error", "Cantidad no válida"));
        }
      }
      continue;
    }

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
          crearError(
            filaOrigen,
            "omitida",
            `Cantidad sumada a la fila ${primera.numeroFila}`,
          ),
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
