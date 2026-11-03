import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export type TipoGrupoInforme = "armario" | "caja" | "cross" | "palet" | "reserva";

export type EstadoFilaInforme = "OK" | "BAJO" | "AGOTADO";

export interface ProductoInforme {
  sku: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  stock_minimo: number;
}

export interface UbicacionInformeInput {
  id: string;
  codigo?: string | null;
  nombre: string;
  tipo: string;
  productos: ProductoInforme[];
}

export interface PaletInformeInput {
  id: string;
  numero_palet: number;
  codigo_barras: string;
  generado_por?: string | null;
  generado_en?: string | null;
  productos: ProductoInforme[];
}

export interface FilaInforme {
  grupo: string;
  ubicacion: string;
  sku: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  stockMinimo: number;
  estado: EstadoFilaInforme;
}

export interface GrupoInforme {
  id: string;
  titulo: string;
  subtitulo?: string;
  tipo: TipoGrupoInforme;
  codigo?: string;
  filas: FilaInforme[];
}

export interface ResumenInforme {
  referencias: number;
  unidades: number;
  lineasBajo: number;
  lineasAgotadas: number;
}

export interface InformeInventario {
  titulo: string;
  subtitulo: string;
  generadoPor: string;
  fecha: Date;
  grupos: GrupoInforme[];
  resumen: ResumenInforme;
}

export interface MetaInforme {
  generadoPor: string;
  fecha?: Date;
  seccion?: string;
  pasillo?: string;
}

const TIPO_GRUPO_LABEL: Record<TipoGrupoInforme, string> = {
  armario: "Armario",
  caja: "Caja",
  cross: "Cross",
  palet: "Palet",
  reserva: "Reserva",
};

function normalizarTexto(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function estadoFila(cantidad: number, stockMinimo: number): EstadoFilaInforme {
  if (cantidad <= 0) return "AGOTADO";
  if (cantidad <= stockMinimo) return "BAJO";
  return "OK";
}

export function calcularResumen(grupos: GrupoInforme[]): ResumenInforme {
  const filas = grupos.flatMap((grupo) => grupo.filas);
  return {
    referencias: filas.length,
    unidades: filas.reduce((total, fila) => total + fila.cantidad, 0),
    lineasBajo: filas.filter((fila) => fila.estado === "BAJO").length,
    lineasAgotadas: filas.filter((fila) => fila.estado === "AGOTADO").length,
  };
}

function crearGrupoDesdeProductos(
  id: string,
  titulo: string,
  tipo: TipoGrupoInforme,
  productos: ProductoInforme[],
  opciones?: { codigo?: string; subtitulo?: string; ubicacion?: string },
): GrupoInforme {
  const ubicacion = opciones?.ubicacion ?? titulo;
  const filas = productos
    .filter((producto) => normalizarTexto(producto.nombre) || normalizarTexto(producto.sku))
    .map<FilaInforme>((producto) => {
      const cantidad = Number.isFinite(producto.cantidad) ? producto.cantidad : 0;
      const stockMinimo = Number.isFinite(producto.stock_minimo) ? producto.stock_minimo : 0;
      return {
        grupo: titulo,
        ubicacion,
        sku: normalizarTexto(producto.sku) || "-",
        nombre: normalizarTexto(producto.nombre) || "Producto sin nombre",
        categoria: normalizarTexto(producto.categoria) || "-",
        cantidad,
        stockMinimo,
        estado: estadoFila(cantidad, stockMinimo),
      };
    });

  return {
    id,
    titulo,
    tipo,
    filas,
    ...(opciones?.codigo ? { codigo: opciones.codigo } : {}),
    ...(opciones?.subtitulo ? { subtitulo: opciones.subtitulo } : {}),
  };
}

function construirInforme(
  titulo: string,
  subtitulo: string,
  grupos: GrupoInforme[],
  meta: MetaInforme,
): InformeInventario {
  return {
    titulo,
    subtitulo,
    generadoPor: normalizarTexto(meta.generadoPor) || "Usuario",
    fecha: meta.fecha ?? new Date(),
    grupos,
    resumen: calcularResumen(grupos),
  };
}

export function crearInformeUbicacion(
  ubicacion: UbicacionInformeInput,
  meta: MetaInforme,
): InformeInventario {
  const tipoLabel = TIPO_GRUPO_LABEL[ubicacion.tipo as TipoGrupoInforme] ?? "Ubicación";
  const subtitulo = [meta.seccion, meta.pasillo].filter(Boolean).join(" > ") || tipoLabel;
  const grupo = crearGrupoDesdeProductos(
    ubicacion.id,
    `${tipoLabel} ${ubicacion.nombre}`,
    ubicacion.tipo as TipoGrupoInforme,
    ubicacion.productos,
    {
      ...(ubicacion.codigo ? { codigo: ubicacion.codigo } : {}),
      subtitulo,
      ubicacion: ubicacion.nombre,
    },
  );

  return construirInforme(
    `Informe de ${tipoLabel.toLowerCase()} · ${ubicacion.nombre}`,
    subtitulo,
    [grupo],
    meta,
  );
}

export function crearInformePasillo(
  pasillo: { id: string; nombre: string; codigo?: string | null },
  posiciones: UbicacionInformeInput[],
  meta: MetaInforme,
): InformeInventario {
  const grupos = posiciones
    .filter((posicion) => posicion.tipo === "armario" || posicion.tipo === "cross")
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
    .map((posicion) => {
      const tipoLabel = TIPO_GRUPO_LABEL[posicion.tipo as TipoGrupoInforme] ?? "Ubicación";
      return crearGrupoDesdeProductos(
        posicion.id,
        `${tipoLabel} ${posicion.nombre}`,
        posicion.tipo as TipoGrupoInforme,
        posicion.productos,
        {
          ...(posicion.codigo ? { codigo: posicion.codigo } : {}),
          subtitulo: meta.seccion ? `${meta.seccion} > ${pasillo.nombre}` : pasillo.nombre,
          ubicacion: posicion.nombre,
        },
      );
    });

  return construirInforme(
    `Informe de pasillo · ${pasillo.nombre}`,
    [meta.seccion, pasillo.nombre].filter(Boolean).join(" > ") || "Pasillo",
    grupos,
    meta,
  );
}

export function crearInformeReserva(
  reserva: { id: string; nombre: string; codigo?: string | null },
  palets: PaletInformeInput[],
  meta: MetaInforme,
): InformeInventario {
  const grupos = palets
    .slice()
    .sort((a, b) => a.numero_palet - b.numero_palet)
    .map((palet) =>
      crearGrupoDesdeProductos(
        palet.id,
        `Palet #${String(palet.numero_palet).padStart(3, "0")}`,
        "palet",
        palet.productos,
        {
          codigo: palet.codigo_barras,
          subtitulo: [
            palet.generado_por ? `Generado por ${palet.generado_por}` : null,
            palet.generado_en
              ? new Date(palet.generado_en).toLocaleString("es-ES", {
                  dateStyle: "short",
                  timeStyle: "short",
                })
              : null,
          ]
            .filter(Boolean)
            .join(" · "),
          ubicacion: `Palet #${String(palet.numero_palet).padStart(3, "0")}`,
        },
      ),
    );

  return construirInforme(
    `Informe de reserva · ${reserva.nombre}`,
    [meta.seccion, reserva.nombre].filter(Boolean).join(" > ") || "Reserva",
    grupos,
    meta,
  );
}

export function crearInformePalet(palet: PaletInformeInput, meta: MetaInforme): InformeInventario {
  const grupo = crearGrupoDesdeProductos(
    palet.id,
    `Palet #${String(palet.numero_palet).padStart(3, "0")}`,
    "palet",
    palet.productos,
    {
      codigo: palet.codigo_barras,
      subtitulo: [
        palet.generado_por ? `Generado por ${palet.generado_por}` : null,
        palet.generado_en
          ? new Date(palet.generado_en).toLocaleString("es-ES", {
              dateStyle: "short",
              timeStyle: "short",
            })
          : null,
      ]
        .filter(Boolean)
        .join(" · "),
      ubicacion: `Palet #${String(palet.numero_palet).padStart(3, "0")}`,
    },
  );

  return construirInforme(
    `Desglose de palet · ${palet.codigo_barras}`,
    meta.seccion ?? "Reserva",
    [grupo],
    meta,
  );
}

export function nombreArchivoInforme(prefijo: string): string {
  const slug = prefijo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const fecha = new Date().toISOString().slice(0, 10);
  return `${slug || "informe"}-${fecha}`;
}

export function generarPdfInforme(informe: InformeInventario): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margen = 14;

  const pintarCabecera = () => {
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, pageWidth, 26, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("INVENTARIO LM", margen, 11);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(informe.titulo, margen, 18);
    doc.text(new Date(informe.fecha).toLocaleString("es-ES"), pageWidth - margen, 18, {
      align: "right",
    });
  };

  pintarCabecera();

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.text(informe.subtitulo, margen, 34);
  doc.text(`Generado por: ${informe.generadoPor}`, margen, 39);
  doc.text(
    `Referencias: ${informe.resumen.referencias} · Unidades: ${informe.resumen.unidades} · Bajo stock: ${informe.resumen.lineasBajo} · Agotadas: ${informe.resumen.lineasAgotadas}`,
    margen,
    44,
  );

  let y = 52;

  if (informe.grupos.length === 0) {
    doc.setFontSize(10);
    doc.text("No hay información para este informe.", margen, y);
  }

  for (const grupo of informe.grupos) {
    if (y > pageHeight - 45) {
      doc.addPage();
      pintarCabecera();
      y = 34;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(grupo.titulo, margen, y);
    y += 5;

    if (grupo.subtitulo) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(grupo.subtitulo, margen, y);
      y += 4;
    }

    if (grupo.filas.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Sin productos registrados.", margen, y + 2);
      y += 12;
      continue;
    }

    autoTable(doc, {
      startY: y,
      head: [["Ubicación", "SKU", "Producto", "Categoría", "Cant.", "Mín.", "Estado"]],
      body: grupo.filas.map((fila) => [
        fila.ubicacion,
        fila.sku,
        fila.nombre,
        fila.categoria,
        String(fila.cantidad),
        String(fila.stockMinimo),
        fila.estado,
      ]),
      margin: { left: margen, right: margen },
      styles: { fontSize: 7, cellPadding: 1.4, overflow: "linebreak" },
      headStyles: { fillColor: [30, 64, 175], textColor: 255, fontSize: 7.5 },
      columnStyles: {
        4: { halign: "right", cellWidth: 13 },
        5: { halign: "right", cellWidth: 12 },
        6: { halign: "center", cellWidth: 16 },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 6) {
          const estado = String(data.cell.raw ?? "");
          if (estado === "BAJO" || estado === "AGOTADO") {
            data.cell.styles.textColor = [190, 18, 60];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });

    const tabla = doc as jsPDF & { lastAutoTable?: { finalY?: number } };
    y = (tabla.lastAutoTable?.finalY ?? y) + 8;
  }

  const totalPaginas = doc.getNumberOfPages();
  for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
    doc.setPage(pagina);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("Inventario LM", margen, pageHeight - 7);
    doc.text(`Página ${pagina} de ${totalPaginas}`, pageWidth - margen, pageHeight - 7, {
      align: "right",
    });
  }

  return doc;
}

export function generarExcelInforme(informe: InformeInventario): Blob {
  const filas = informe.grupos.flatMap((grupo) =>
    grupo.filas.map((fila) => ({
      Grupo: grupo.titulo,
      Tipo: TIPO_GRUPO_LABEL[grupo.tipo],
      Código: grupo.codigo ?? "",
      Ubicación: fila.ubicacion,
      SKU: fila.sku,
      Producto: fila.nombre,
      Categoría: fila.categoria,
      Cantidad: fila.cantidad,
      "Stock mínimo": fila.stockMinimo,
      Estado: fila.estado,
    })),
  );

  const resumen = [
    { Métrica: "Referencias", Valor: informe.resumen.referencias },
    { Métrica: "Unidades", Valor: informe.resumen.unidades },
    { Métrica: "Líneas bajo stock", Valor: informe.resumen.lineasBajo },
    { Métrica: "Líneas agotadas", Valor: informe.resumen.lineasAgotadas },
    { Métrica: "Generado por", Valor: informe.generadoPor },
    { Métrica: "Fecha", Valor: new Date(informe.fecha).toLocaleString("es-ES") },
  ];

  const workbook = XLSX.utils.book_new();
  const hojaInventario = XLSX.utils.json_to_sheet(filas);
  const hojaResumen = XLSX.utils.json_to_sheet(resumen);
  hojaInventario["!cols"] = [
    { wch: 28 },
    { wch: 10 },
    { wch: 22 },
    { wch: 24 },
    { wch: 16 },
    { wch: 40 },
    { wch: 24 },
    { wch: 10 },
    { wch: 12 },
    { wch: 11 },
  ];
  hojaResumen["!cols"] = [{ wch: 20 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(workbook, hojaResumen, "Resumen");
  XLSX.utils.book_append_sheet(workbook, hojaInventario, "Inventario");

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function pdfABase64(doc: jsPDF): string {
  const dataUri = doc.output("datauristring");
  return dataUri.slice(dataUri.indexOf(",") + 1);
}

export function descargarBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function descargarPdf(doc: jsPDF, filename: string): void {
  doc.save(`${filename}.pdf`);
}

export function imprimirPdf(doc: jsPDF, filename: string): void {
  doc.autoPrint();
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const ventana = window.open(url, "_blank");
  if (!ventana) {
    doc.save(`${filename}.pdf`);
    URL.revokeObjectURL(url);
    return;
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
