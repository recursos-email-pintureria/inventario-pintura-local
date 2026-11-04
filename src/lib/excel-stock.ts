import * as XLSX from "xlsx";
import type { Producto, Ubicacion, Stock } from "@/lib/tipos";

export const VERSION_PLANTILLA_EXCEL = "INVENTARIO_LM_STOCK_V1";

/**
 * Neutraliza fórmulas maliciosas en hojas de cálculo (CSV/Excel Formula Injection).
 * Si el valor empieza por =, +, -, @, o tabuladores/retornos, antepone un apóstrofe '.
 */
export function neutralizarFormula(valor: any): any {
  if (typeof valor === "string") {
    if (
      valor.startsWith("=") ||
      valor.startsWith("+") ||
      valor.startsWith("-") ||
      valor.startsWith("@") ||
      valor.startsWith("\t") ||
      valor.startsWith("\r")
    ) {
      return `'${valor}`;
    }
    const trimmed = valor.trim();
    if (
      trimmed.startsWith("=") ||
      trimmed.startsWith("+") ||
      trimmed.startsWith("-") ||
      trimmed.startsWith("@")
    ) {
      return `'${valor}`;
    }
    return valor;
  }
  return valor;
}

export interface FilaInventarioExport {
  id_producto: string;
  codigo_producto: string;
  nombre_producto: string;
  categoria: string;
  id_ubicacion: string;
  ubicacion: string;
  cantidad_actual: number;
  cantidad_nueva?: number | "";
  observaciones?: string;
}

export interface OpcionesGenerarPlantilla {
  productos: Producto[];
  ubicaciones: Ubicacion[];
  stock: Stock[];
  usuarioNombre: string;
  filtros?:
    | {
        idUbicacion?: string | undefined;
        idCategoria?: string | undefined;
        soloConStock?: boolean | undefined;
      }
    | undefined;
}

/**
 * Genera el libro Excel (.xlsx) con la plantilla precargada de actualización de stock.
 */
export function generarPlantillaStockExcel(opciones: OpcionesGenerarPlantilla): Uint8Array {
  const { productos, ubicaciones, stock, usuarioNombre, filtros } = opciones;
  const fechaIso = new Date().toISOString();
  const fechaLegible = new Date().toLocaleString("es-ES");

  // 1. Filtrar catálogo según las opciones del usuario
  const prodsActivos = productos.filter((p) => p.activo !== false);
  const ubisActivas = ubicaciones.filter((u) => u.activo !== false);

  // Mapeos rápidos para cruzar información
  const mapProductos = new Map(prodsActivos.map((p) => [p.id, p]));
  const mapUbicaciones = new Map(ubisActivas.map((u) => [u.id, u]));

  // Mapa de stock actual indexado por "id_prod:id_ubi"
  const mapStock = new Map<string, number>();
  stock.forEach((s) => {
    // Si no está asignado a un palet independiente
    if (!s.id_palet) {
      const key = `${s.id_producto}:${s.id_ubicacion}`;
      mapStock.set(key, s.cantidad);
    }
  });

  // 2. Construir filas de la hoja principal "Inventario"
  const filasInventario: FilaInventarioExport[] = [];

  // Si hay combinaciones con stock registrado
  stock.forEach((s) => {
    if (s.id_palet) return; // Palets tienen su ciclo de vida propio
    const prod = mapProductos.get(s.id_producto);
    const ubi = mapUbicaciones.get(s.id_ubicacion);

    if (!prod || !ubi) return;

    if (filtros?.idUbicacion && ubi.id !== filtros.idUbicacion) return;
    if (
      filtros?.idCategoria &&
      prod.categoria !== filtros.idCategoria &&
      (prod as any).id_categoria !== filtros.idCategoria
    )
      return;

    filasInventario.push({
      id_producto: neutralizarFormula(prod.id),
      codigo_producto: neutralizarFormula(prod.sku || prod.codigo_barras || ""),
      nombre_producto: neutralizarFormula(prod.nombre),
      categoria: neutralizarFormula(prod.categoria || "Sin categoría"),
      id_ubicacion: neutralizarFormula(ubi.id),
      ubicacion: neutralizarFormula(ubi.nombre),
      cantidad_actual: Number(s.cantidad || 0),
      cantidad_nueva: "",
      observaciones: "",
    });
  });

  // Si no había stock o se quiere incluir catálogo base sin stock
  if (filasInventario.length === 0 && !filtros?.soloConStock) {
    ubisActivas.slice(0, 5).forEach((ubi) => {
      prodsActivos.slice(0, 10).forEach((prod) => {
        const cant = mapStock.get(`${prod.id}:${ubi.id}`) ?? 0;
        filasInventario.push({
          id_producto: neutralizarFormula(prod.id),
          codigo_producto: neutralizarFormula(prod.sku || prod.codigo_barras || ""),
          nombre_producto: neutralizarFormula(prod.nombre),
          categoria: neutralizarFormula(prod.categoria || "Sin categoría"),
          id_ubicacion: neutralizarFormula(ubi.id),
          ubicacion: neutralizarFormula(ubi.nombre),
          cantidad_actual: cant,
          cantidad_nueva: "",
          observaciones: "",
        });
      });
    });
  }

  // Ordenar alfabéticamente por ubicación y nombre de producto
  filasInventario.sort((a, b) => {
    const compUbi = String(a.ubicacion).localeCompare(String(b.ubicacion));
    if (compUbi !== 0) return compUbi;
    return String(a.nombre_producto).localeCompare(String(b.nombre_producto));
  });

  // 3. Crear Workbook con SheetJS
  const wb = XLSX.utils.book_new();

  // Hoja 1: Instrucciones
  const filasInstrucciones = [
    ["INVENTARIO PINTURA LM - ACTUALIZACIÓN MASIVA DE STOCK"],
    [""],
    ["INSTRUCCIONES DE USO:"],
    ["1. Dirígete a la pestaña 'Inventario'."],
    [
      "2. Las columnas grises (A hasta G) son de SOLO LECTURA para identificar el producto y la ubicación.",
    ],
    [
      "3. Rellena la columna H ('cantidad_nueva') únicamente con el stock físico real que deseas fijar.",
    ],
    [
      "4. Si dejas la celda vacía o con el mismo valor que 'cantidad_actual', la fila NO sufrirá cambios.",
    ],
    ["5. Para vaciar el stock a 0, escribe explícitamente el número 0."],
    [
      "6. En la columna I ('observaciones') puedes añadir el motivo (ej: 'Conteo trimestral', 'Merma').",
    ],
    [
      "7. Si deseas añadir una nueva combinación, consulta las pestañas 'Productos válidos' y 'Ubicaciones válidas'.",
    ],
    ["8. Guarda este archivo y súbelo de vuelta en la aplicación."],
    [""],
    ["METADATOS DE LA PLANTILLA:"],
    ["Versión de plantilla:", VERSION_PLANTILLA_EXCEL],
    ["Fecha y hora de exportación:", fechaLegible],
    ["Fecha ISO:", fechaIso],
    ["Usuario generador:", neutralizarFormula(usuarioNombre || "Operador")],
    ["Total combinaciones exportadas:", filasInventario.length],
  ];
  const wsInstrucciones = XLSX.utils.aoa_to_sheet(filasInstrucciones);
  wsInstrucciones["!cols"] = [{ wch: 35 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsInstrucciones, "Instrucciones");

  // Hoja 2: Inventario (Datos principales)
  const cabecerasInventario = [
    "id_producto",
    "codigo_producto",
    "nombre_producto",
    "categoria",
    "id_ubicacion",
    "ubicacion",
    "cantidad_actual",
    "cantidad_nueva",
    "observaciones",
  ];

  const filasParaHoja = [
    cabecerasInventario,
    ...filasInventario.map((f) => [
      f.id_producto,
      f.codigo_producto,
      f.nombre_producto,
      f.categoria,
      f.id_ubicacion,
      f.ubicacion,
      f.cantidad_actual,
      f.cantidad_nueva ?? "",
      f.observaciones ?? "",
    ]),
  ];

  const wsInventario = XLSX.utils.aoa_to_sheet(filasParaHoja);

  // Anchos de columna optimizados
  wsInventario["!cols"] = [
    { wch: 38 }, // id_producto (UUID)
    { wch: 18 }, // codigo_producto
    { wch: 38 }, // nombre_producto
    { wch: 20 }, // categoria
    { wch: 38 }, // id_ubicacion (UUID)
    { wch: 18 }, // ubicacion
    { wch: 16 }, // cantidad_actual
    { wch: 16 }, // cantidad_nueva
    { wch: 32 }, // observaciones
  ];

  XLSX.utils.book_append_sheet(wb, wsInventario, "Inventario");

  // Hoja 3: Productos válidos (referencia)
  const filasProdsValidos = [
    ["id_producto", "sku", "nombre", "categoria", "codigo_barras"],
    ...prodsActivos.map((p) => [
      neutralizarFormula(p.id),
      neutralizarFormula(p.sku),
      neutralizarFormula(p.nombre),
      neutralizarFormula(p.categoria || "Sin categoría"),
      neutralizarFormula(p.codigo_barras || ""),
    ]),
  ];
  const wsProds = XLSX.utils.aoa_to_sheet(filasProdsValidos);
  wsProds["!cols"] = [{ wch: 38 }, { wch: 16 }, { wch: 35 }, { wch: 20 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsProds, "Productos válidos");

  // Hoja 4: Ubicaciones válidas (referencia)
  const filasUbisValidas = [
    ["id_ubicacion", "nombre", "tipo", "descripcion"],
    ...ubisActivas.map((u) => [
      neutralizarFormula(u.id),
      neutralizarFormula(u.nombre),
      neutralizarFormula(u.tipo),
      neutralizarFormula(u.descripcion || ""),
    ]),
  ];
  const wsUbis = XLSX.utils.aoa_to_sheet(filasUbisValidas);
  wsUbis["!cols"] = [{ wch: 38 }, { wch: 20 }, { wch: 14 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsUbis, "Ubicaciones válidas");

  // Metadatos globales del libro
  wb.Props = {
    Title: "Plantilla de Actualización Masiva de Stock",
    Subject: "Inventario Pintura LM",
    Author: usuarioNombre || "Inventario LM",
    CreatedDate: new Date(),
    Comments: `VERSION=${VERSION_PLANTILLA_EXCEL};TIMESTAMP=${fechaIso}`,
  };

  // 4. Exportar a buffer binario
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Uint8Array(excelBuffer);
}

/**
 * Dispara la descarga directa de un archivo Excel en el navegador.
 */
export function descargarArchivoExcel(data: Uint8Array, nombreArchivo: string): void {
  const blob = new Blob([data as unknown as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 500);
}
