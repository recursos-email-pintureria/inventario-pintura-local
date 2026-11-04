import { jsPDF } from "jspdf";
import type { Palet } from "@/lib/palets";

export interface ItemProductoImpresion {
  nombre?: string;
  sku?: string;
  cantidad: number;
}

export interface DatosEtiquetaPalet {
  numeroPalet: number;
  codigoBarras: string;
  nombreReserva: string;
  generadoPor: string;
  generadoEn?: string | undefined;
  productos?: ItemProductoImpresion[] | undefined;
}

/**
 * Normaliza cualquier entrada (objeto Palet o DatosEtiquetaPalet) a una estructura unificada
 */
function normalizarDatosPalet(
  palet: Palet | DatosEtiquetaPalet,
  productosFallback?: ItemProductoImpresion[],
): DatosEtiquetaPalet {
  if ("numeroPalet" in palet) {
    return {
      numeroPalet: palet.numeroPalet,
      codigoBarras: palet.codigoBarras,
      nombreReserva: palet.nombreReserva || "Reserva General",
      generadoPor: palet.generadoPor || "Operador",
      generadoEn: palet.generadoEn,
      productos: palet.productos || productosFallback || [],
    };
  }

  return {
    numeroPalet: palet.numero_palet,
    codigoBarras: palet.codigo_barras,
    nombreReserva: palet.reserva_nombre || "Reserva General",
    generadoPor: palet.generado_por || "Operador",
    generadoEn: palet.generado_en,
    productos: (palet as any).productos || productosFallback || [],
  };
}

/**
 * 🖨️ Imprime la etiqueta oficial de un palet.
 * Compatible tanto con window.print() como con generación y descarga automática de PDF
 * para garantizar que NUNCA falle, incluso dentro de iframes con sandbox.
 */
export async function imprimirEtiquetaPalet(
  palet: Palet | DatosEtiquetaPalet,
  productos?: ItemProductoImpresion[],
): Promise<void> {
  const datos = normalizarDatosPalet(palet, productos);
  const padNum = String(datos.numeroPalet).padStart(3, "0");

  // 1. Siempre generar y descargar el PDF físico para garantizar la disponibilidad inmediata
  descargarEtiquetaPDF(datos);

  // 2. Activar clase de impresión en el body para aislar visualmente la etiqueta
  document.body.classList.add("printing-label");

  // 3. Ejecutar el cuadro de diálogo de impresión del navegador
  try {
    window.print();
  } catch (e) {
    console.warn("window.print() bloqueado por entorno iframe, PDF descargado:", e);
  } finally {
    setTimeout(() => {
      document.body.classList.remove("printing-label");
    }, 1200);
  }
}

/**
 * 📥 Descarga la etiqueta física en PDF vectorizado mediante jsPDF (Formato 100x140mm).
 */
export function descargarEtiquetaPDF(
  palet: Palet | DatosEtiquetaPalet,
  productos?: ItemProductoImpresion[],
): void {
  const datos = normalizarDatosPalet(palet, productos);
  const padNum = String(datos.numeroPalet).padStart(3, "0");
  const fechaStr = datos.generadoEn
    ? new Date(datos.generadoEn).toLocaleString("es-ES")
    : new Date().toLocaleString("es-ES");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [100, 140], // Tamaño estándar de etiqueta logística 10x14 cm
  });

  // Marco exterior negro
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1);
  doc.roundedRect(4, 4, 92, 132, 2, 2);

  // Encabezado
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.text("INVENTARIO PINTURA LM", 8, 12);

  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text(`PALET #${padNum}`, 8, 20);

  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.text("DÓNDE (RESERVA):", 55, 12);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(datos.nombreReserva, 55, 19, { maxWidth: 38 });

  doc.setLineWidth(0.6);
  doc.line(4, 24, 96, 24);

  // Cuadro de Código de Barras
  doc.setFillColor(248, 248, 248);
  doc.rect(7, 27, 86, 25, "F");
  doc.setDrawColor(200, 200, 200);
  doc.rect(7, 27, 86, 25, "S");

  doc.setFont("courier", "bold");
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(datos.codigoBarras, 50, 34, { align: "center" });

  // Barras simuladas de alta legibilidad
  doc.setDrawColor(0, 0, 0);
  for (let x = 14; x < 86; x += 1.8) {
    const grosor = Math.sin(x * 1.5) > 0.1 ? 0.8 : 0.3;
    doc.setLineWidth(grosor);
    doc.line(x, 37, x, 49);
  }

  // Bloque: Quién y Cuándo
  doc.setLineWidth(0.4);
  doc.setDrawColor(200, 200, 200);
  doc.line(4, 55, 96, 55);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(90, 90, 90);
  doc.text("QUIÉN (OPERADOR):", 8, 60);
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(datos.generadoPor || "Operador", 8, 65);

  doc.setFontSize(7);
  doc.setTextColor(90, 90, 90);
  doc.text("CUÁNDO (FECHA Y HORA):", 55, 60);
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(fechaStr, 55, 65);

  doc.line(4, 69, 96, 69);

  // Lista de Artículos Registrados
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.text("CONTENIDO REGISTRADO:", 8, 75);

  let posY = 81;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);

  if (datos.productos && datos.productos.length > 0) {
    datos.productos.slice(0, 7).forEach((prod) => {
      const nombreCorto = (prod.nombre || prod.sku || "Producto").substring(0, 32);
      doc.text(nombreCorto, 8, posY);
      doc.setFont("helvetica", "bold");
      doc.text(`${prod.cantidad} ud`, 92, posY, { align: "right" });
      doc.setFont("helvetica", "normal");
      posY += 5;
    });

    if (datos.productos.length > 7) {
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(`... y ${datos.productos.length - 7} artículos más`, 8, posY);
    }
  } else {
    doc.setFont("helvetica", "italic");
    doc.text("Palet vacío (sin mercancía asignada)", 8, posY);
  }

  // Pie informativo
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.6);
  doc.line(4, 126, 96, 126);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(140, 67, 20); // Tono ámbar
  doc.text("REGLA OPERATIVA: AL TRASPASAR A TIENDA Y QUEDAR VACÍO SE AUTODESTRUYE", 50, 131, {
    align: "center",
  });

  doc.save(`ETIQUETA_PALET_${padNum}_${datos.codigoBarras}.pdf`);
}

/**
 * 📋 Imprime el listado completo de palets activos en una reserva.
 */
export async function imprimirListadoPalets(
  palets: Palet[],
  nombreReserva: string = "Reserva",
): Promise<void> {
  // Descarga el PDF del listado
  descargarListadoPaletsPDF(palets, nombreReserva);

  // Activa la vista de impresión en navegador
  document.body.classList.add("printing-label");
  try {
    window.print();
  } catch (e) {
    console.warn("window.print bloqueado, usando PDF:", e);
  } finally {
    setTimeout(() => {
      document.body.classList.remove("printing-label");
    }, 1200);
  }
}

/**
 * 📥 Descarga en PDF formato A4 el listado de palets de una reserva.
 */
export function descargarListadoPaletsPDF(
  palets: Palet[],
  nombreReserva: string = "Reserva",
): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const fechaHoy = new Date().toLocaleString("es-ES");

  // Cabecera A4
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("INVENTARIO PINTURA LM", 14, 16);
  doc.setFontSize(12);
  doc.setTextColor(140, 67, 20);
  doc.text(`Listado Oficial de Palets en ${nombreReserva}`, 14, 23);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Fecha de emisión: ${fechaHoy}`, 14, 29);
  doc.text(`Total palets activos: ${palets.length}`, 196, 29, { align: "right" });

  doc.setDrawColor(200, 200, 200);
  doc.line(14, 32, 196, 32);

  // Cabecera de la tabla
  let posY = 40;
  doc.setFillColor(245, 245, 245);
  doc.rect(14, posY - 5, 182, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text("Nº", 16, posY);
  doc.text("CÓDIGO DE BARRAS", 30, posY);
  doc.text("RESPONSABLE", 95, posY);
  doc.text("FECHA DE ALTA", 145, posY);
  doc.text("ESTADO", 182, posY);

  posY += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  palets.forEach((p, index) => {
    if (posY > 275) {
      doc.addPage();
      posY = 20;
    }

    const padNum = String(p.numero_palet).padStart(3, "0");
    const fecha = p.generado_en ? new Date(p.generado_en).toLocaleDateString("es-ES") : "Hoy";

    doc.text(`#${padNum}`, 16, posY);
    doc.setFont("courier", "bold");
    doc.text(p.codigo_barras, 30, posY);
    doc.setFont("helvetica", "normal");
    doc.text(p.generado_por || "Operador", 95, posY);
    doc.text(fecha, 145, posY);
    doc.setTextColor(22, 101, 52); // Verde esmeralda
    doc.text(p.activo ? "Activo" : "Baja", 182, posY);
    doc.setTextColor(0, 0, 0);

    doc.setDrawColor(235, 235, 235);
    doc.line(14, posY + 2, 196, posY + 2);
    posY += 7;
  });

  doc.save(`LISTADO_PALETS_${nombreReserva.replace(/\s+/g, "_")}.pdf`);
}

/**
 * 📥 Descarga en PDF A4 el Desglose de Mercancía en un Palet específico.
 */
export function descargarDesglosePaletPDF(palet: Palet, productos: ItemProductoImpresion[]): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const padNum = String(palet.numero_palet).padStart(3, "0");
  const fechaStr = palet.generado_en
    ? new Date(palet.generado_en).toLocaleString("es-ES")
    : new Date().toLocaleString("es-ES");

  // Encabezado
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("INVENTARIO PINTURA LM", 14, 16);

  doc.setFontSize(13);
  doc.setTextColor(140, 67, 20);
  doc.text(`Desglose de Mercancía en Palet #${padNum}`, 14, 24);

  doc.setFont("courier", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(palet.codigo_barras, 14, 31);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Reserva: ${palet.reserva_nombre || "Zona de Reserva"}`, 130, 24);
  doc.text(`Responsable: ${palet.generado_por}`, 130, 29);
  doc.text(`Fecha: ${fechaStr}`, 130, 34);

  doc.setDrawColor(200, 200, 200);
  doc.line(14, 38, 196, 38);

  // Tabla de mercancía
  let posY = 48;
  doc.setFillColor(245, 245, 245);
  doc.rect(14, posY - 5, 182, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text("SKU", 16, posY);
  doc.text("DESCRIPCIÓN DEL ARTÍCULO", 45, posY);
  doc.text("CANTIDAD", 175, posY, { align: "right" });

  posY += 8;
  doc.setFont("helvetica", "normal");

  let totalUds = 0;
  productos.forEach((p) => {
    if (posY > 270) {
      doc.addPage();
      posY = 20;
    }
    totalUds += p.cantidad;

    doc.setFont("courier", "normal");
    doc.text(p.sku || "N/A", 16, posY);
    doc.setFont("helvetica", "normal");
    doc.text((p.nombre || "Artículo").substring(0, 55), 45, posY);
    doc.setFont("helvetica", "bold");
    doc.text(`${p.cantidad} ud`, 175, posY, { align: "right" });
    doc.setFont("helvetica", "normal");

    doc.setDrawColor(240, 240, 240);
    doc.line(14, posY + 2, 196, posY + 2);
    posY += 7;
  });

  // Fila de Total
  posY += 4;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(14, posY, 196, posY);
  posY += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("TOTAL UNIDADES EN PALET:", 45, posY);
  doc.text(`${totalUds} unidades`, 175, posY, { align: "right" });

  doc.save(`DESGLOSE_PALET_${padNum}_${palet.codigo_barras}.pdf`);
}
