import type { Producto, Ubicacion, Stock } from "@/lib/tipos";
import type { FilaLeidaStock } from "./parser-stock";
import * as XLSX from "xlsx";
import { neutralizarFormula } from "./excel-stock";

export type EstadoFilaImportacion = "correcta" | "aviso" | "conflicto" | "error" | "sin_cambios";
export type ResolucionConflicto = "aplicar_archivo" | "mantener_bd";

export interface FilaValidadaStock extends FilaLeidaStock {
  estado: EstadoFilaImportacion;
  mensajes: string[];
  productoIdResuelto?: string | undefined;
  ubicacionIdResuelta?: string | undefined;
  nombreProductoResuelto?: string | undefined;
  nombreUbicacionResuelta?: string | undefined;
  stockActualEnBD: number;
  diferencia: number;
  resolucionConflicto?: ResolucionConflicto | undefined;
}

export interface ResumenValidacionStock {
  total: number;
  modificables: number;
  sinCambios: number;
  correctas: number;
  avisos: number;
  conflictos: number;
  errores: number;
}

export interface OpcionesValidacionStock {
  filas: FilaLeidaStock[];
  productos: Producto[];
  ubicaciones: Ubicacion[];
  stock: Stock[];
}

/**
 * Valida de forma pura el conjunto de filas leídas frente al catálogo y stock real de la base de datos.
 */
export function validarFilasStock(opciones: OpcionesValidacionStock): {
  filasValidadas: FilaValidadaStock[];
  resumen: ResumenValidacionStock;
} {
  const { filas, productos, ubicaciones, stock } = opciones;

  // Índices para búsqueda rápida
  const mapProdById = new Map<string, Producto>();
  const mapProdBySku = new Map<string, Producto>();
  const mapProdByBarcode = new Map<string, Producto>();

  productos.forEach((p) => {
    if (p.id) mapProdById.set(p.id.toLowerCase(), p);
    if (p.sku) mapProdBySku.set(p.sku.toLowerCase().trim(), p);
    if (p.codigo_barras) mapProdByBarcode.set(p.codigo_barras.toLowerCase().trim(), p);
  });

  const mapUbiById = new Map<string, Ubicacion>();
  const mapUbiByNombre = new Map<string, Ubicacion>();

  ubicaciones.forEach((u) => {
    if (u.id) mapUbiById.set(u.id.toLowerCase(), u);
    if (u.nombre) mapUbiByNombre.set(u.nombre.toLowerCase().trim(), u);
  });

  // Mapa de stock actual en BD por "id_producto:id_ubicacion"
  const mapStockBD = new Map<string, number>();
  stock.forEach((s) => {
    if (!s.id_palet) {
      mapStockBD.set(
        `${s.id_producto.toLowerCase()}:${s.id_ubicacion.toLowerCase()}`,
        s.cantidad || 0,
      );
    }
  });

  // Detección de duplicados dentro del mismo archivo
  const aparicionesCombinacion = new Map<string, number>();
  filas.forEach((f) => {
    const key =
      `${f.id_producto || f.codigo_producto}:${f.id_ubicacion || f.ubicacion}`.toLowerCase();
    aparicionesCombinacion.set(key, (aparicionesCombinacion.get(key) || 0) + 1);
  });

  const filasValidadas: FilaValidadaStock[] = [];

  filas.forEach((f) => {
    const mensajes: string[] = [];
    let estado: EstadoFilaImportacion = "correcta";

    // 1. Resolver producto
    let prodResuelto: Producto | undefined = undefined;
    if (f.id_producto && mapProdById.has(f.id_producto.toLowerCase())) {
      prodResuelto = mapProdById.get(f.id_producto.toLowerCase());
    } else if (f.codigo_producto && mapProdBySku.has(f.codigo_producto.toLowerCase())) {
      prodResuelto = mapProdBySku.get(f.codigo_producto.toLowerCase());
      mensajes.push("Producto asociado por SKU.");
    } else if (f.codigo_producto && mapProdByBarcode.has(f.codigo_producto.toLowerCase())) {
      prodResuelto = mapProdByBarcode.get(f.codigo_producto.toLowerCase());
      mensajes.push("Producto asociado por Código de Barras.");
    }

    if (!prodResuelto) {
      estado = "error";
      mensajes.push(
        `Producto no encontrado en el catálogo (${f.codigo_producto || f.id_producto || "desconocido"}).`,
      );
    } else if (prodResuelto.activo === false) {
      estado = "error";
      mensajes.push(`El producto '${prodResuelto.nombre}' está desactivado en el catálogo.`);
    }

    // 2. Resolver ubicación
    let ubiResuelta: Ubicacion | undefined = undefined;
    if (f.id_ubicacion && mapUbiById.has(f.id_ubicacion.toLowerCase())) {
      ubiResuelta = mapUbiById.get(f.id_ubicacion.toLowerCase());
    } else if (f.ubicacion && mapUbiByNombre.has(f.ubicacion.toLowerCase())) {
      ubiResuelta = mapUbiByNombre.get(f.ubicacion.toLowerCase());
      mensajes.push("Ubicación asociada por nombre.");
    }

    if (!ubiResuelta) {
      estado = "error";
      mensajes.push(
        `Ubicación no encontrada en el sistema (${f.ubicacion || f.id_ubicacion || "desconocida"}).`,
      );
    } else if (ubiResuelta.activo === false) {
      estado = "error";
      mensajes.push(`La ubicación '${ubiResuelta.nombre}' está desactivada.`);
    }

    // 3. Comprobar duplicidad en archivo
    const combKey =
      `${f.id_producto || f.codigo_producto}:${f.id_ubicacion || f.ubicacion}`.toLowerCase();
    if ((aparicionesCombinacion.get(combKey) || 0) > 1) {
      estado = "error";
      mensajes.push(
        "Combinación producto-ubicación duplicada en el archivo. Solo debe aparecer una vez.",
      );
    }

    // 4. Evaluar cantidad nueva
    if (
      f.cantidad_nueva === null ||
      f.cantidad_nueva_raw === "" ||
      f.cantidad_nueva_raw === undefined
    ) {
      // Sin valor especificado = no se modifica
      if (estado !== "error") {
        estado = "sin_cambios";
        mensajes.push("Sin cambios solicitados (celda vacía).");
      }
    } else if (isNaN(f.cantidad_nueva)) {
      estado = "error";
      mensajes.push(`La cantidad '${f.cantidad_nueva_raw}' no es un número válido.`);
    } else if (f.cantidad_nueva < 0) {
      estado = "error";
      mensajes.push(`La cantidad no puede ser negativa (${f.cantidad_nueva}).`);
    }

    // 5. Comparar con stock actual en base de datos
    let stockBD = 0;
    if (prodResuelto && ubiResuelta) {
      const stockKey = `${prodResuelto.id.toLowerCase()}:${ubiResuelta.id.toLowerCase()}`;
      stockBD = mapStockBD.get(stockKey) ?? 0;
    } else {
      stockBD = f.cantidad_actual;
    }

    const dif =
      f.cantidad_nueva !== null && !isNaN(f.cantidad_nueva) ? f.cantidad_nueva - stockBD : 0;

    // Si la cantidad nueva es exactamente la que hay en BD
    if (estado !== "error" && f.cantidad_nueva !== null && f.cantidad_nueva === stockBD) {
      estado = "sin_cambios";
      mensajes.push("La cantidad nueva coincide exactamente con el stock actual en base de datos.");
    }

    // 6. Detección de CONFLICTO de concurrencia:
    // El stock en el archivo exportado difiere del stock real en BD al momento de importar
    if (estado !== "error" && estado !== "sin_cambios") {
      if (f.cantidad_actual !== stockBD) {
        estado = "conflicto";
        mensajes.push(
          `Conflicto de concurrencia: En el archivo figuraban ${f.cantidad_actual} uds, pero el stock actual en BD es ${stockBD} uds.`,
        );
      } else {
        // 7. Detección de AVISO por gran variación
        if (Math.abs(dif) >= 50 || (stockBD > 0 && Math.abs(dif) / stockBD > 2)) {
          if (estado === "correcta") {
            estado = "aviso";
            mensajes.push(
              `Gran variación de inventario (${dif > 0 ? `+${dif}` : dif} uds). Verifica el conteo.`,
            );
          }
        }
      }
    }

    filasValidadas.push({
      ...f,
      estado,
      mensajes,
      productoIdResuelto: prodResuelto?.id,
      ubicacionIdResuelta: ubiResuelta?.id,
      nombreProductoResuelto: prodResuelto?.nombre || f.nombre_producto,
      nombreUbicacionResuelta: ubiResuelta?.nombre || f.ubicacion,
      stockActualEnBD: stockBD,
      diferencia: dif,
      resolucionConflicto: estado === "conflicto" ? "aplicar_archivo" : undefined,
    });
  });

  // Calcular métricas del resumen
  const resumen: ResumenValidacionStock = {
    total: filasValidadas.length,
    modificables: filasValidadas.filter(
      (f) => f.estado === "correcta" || f.estado === "aviso" || f.estado === "conflicto",
    ).length,
    sinCambios: filasValidadas.filter((f) => f.estado === "sin_cambios").length,
    correctas: filasValidadas.filter((f) => f.estado === "correcta").length,
    avisos: filasValidadas.filter((f) => f.estado === "aviso").length,
    conflictos: filasValidadas.filter((f) => f.estado === "conflicto").length,
    errores: filasValidadas.filter((f) => f.estado === "error").length,
  };

  return { filasValidadas, resumen };
}

/**
 * Genera un informe Excel con las incidencias, advertencias y conflictos detectados.
 */
export function generarInformeValidacionExcel(filas: FilaValidadaStock[]): Uint8Array {
  const wb = XLSX.utils.book_new();

  const cabeceras = [
    "Fila",
    "Estado",
    "Producto",
    "SKU / Código",
    "Ubicación",
    "Stock en Archivo",
    "Stock actual en BD",
    "Stock Nuevo",
    "Diferencia",
    "Detalle de Incidencias",
    "Observaciones",
  ];

  const filasExport = [
    cabeceras,
    ...filas.map((f) => [
      f.numeroFila,
      neutralizarFormula(f.estado.toUpperCase()),
      neutralizarFormula(f.nombreProductoResuelto || f.nombre_producto),
      neutralizarFormula(f.codigo_producto),
      neutralizarFormula(f.nombreUbicacionResuelta || f.ubicacion),
      f.cantidad_actual,
      f.stockActualEnBD,
      f.cantidad_nueva ?? "",
      f.diferencia ?? "",
      neutralizarFormula(f.mensajes.join(" | ")),
      neutralizarFormula(f.observaciones || ""),
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(filasExport);
  ws["!cols"] = [
    { wch: 8 },
    { wch: 14 },
    { wch: 35 },
    { wch: 18 },
    { wch: 20 },
    { wch: 16 },
    { wch: 18 },
    { wch: 14 },
    { wch: 12 },
    { wch: 55 },
    { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Informe de Validación");

  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Uint8Array(buffer);
}
