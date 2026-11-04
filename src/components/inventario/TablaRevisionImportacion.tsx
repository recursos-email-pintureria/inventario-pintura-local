import { useState, useMemo } from "react";
import type {
  FilaValidadaStock,
  EstadoFilaImportacion,
  ResolucionConflicto,
} from "@/lib/validador-stock";
import { generarInformeValidacionExcel } from "@/lib/validador-stock";
import { descargarArchivoExcel } from "@/lib/excel-stock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  XCircle,
  MinusCircle,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";

interface TablaRevisionImportacionProps {
  filas: FilaValidadaStock[];
  onCambiarResolucionConflicto: (numeroFila: number, resolucion: ResolucionConflicto) => void;
}

export function TablaRevisionImportacion({
  filas,
  onCambiarResolucionConflicto,
}: TablaRevisionImportacionProps) {
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState<string>("");
  const [pagina, setPagina] = useState<number>(1);
  const elementosPorPagina = 15;

  // Filtrado de filas
  const filasFiltradas = useMemo(() => {
    return filas.filter((f) => {
      // Filtro por tab de estado
      if (filtroEstado === "modificables") {
        if (f.estado !== "correcta" && f.estado !== "aviso" && f.estado !== "conflicto") {
          return false;
        }
      } else if (filtroEstado !== "todos" && f.estado !== filtroEstado) {
        return false;
      }

      // Filtro por término de búsqueda
      if (busqueda.trim()) {
        const term = busqueda.toLowerCase().trim();
        const coincideProd = (f.nombreProductoResuelto || f.nombre_producto)
          .toLowerCase()
          .includes(term);
        const coincideSku = f.codigo_producto.toLowerCase().includes(term);
        const coincideUbi = (f.nombreUbicacionResuelta || f.ubicacion).toLowerCase().includes(term);
        const coincideMensaje = f.mensajes.some((m) => m.toLowerCase().includes(term));
        if (!coincideProd && !coincideSku && !coincideUbi && !coincideMensaje) {
          return false;
        }
      }

      return true;
    });
  }, [filas, filtroEstado, busqueda]);

  const totalPaginas = Math.ceil(filasFiltradas.length / elementosPorPagina) || 1;
  const filasPaginadas = useMemo(() => {
    const inicio = (pagina - 1) * elementosPorPagina;
    return filasFiltradas.slice(inicio, inicio + elementosPorPagina);
  }, [filasFiltradas, pagina]);

  // Contadores por categoría
  const contadores = useMemo(() => {
    return {
      todos: filas.length,
      modificables: filas.filter(
        (f) => f.estado === "correcta" || f.estado === "aviso" || f.estado === "conflicto",
      ).length,
      correcta: filas.filter((f) => f.estado === "correcta").length,
      aviso: filas.filter((f) => f.estado === "aviso").length,
      conflicto: filas.filter((f) => f.estado === "conflicto").length,
      error: filas.filter((f) => f.estado === "error").length,
      sin_cambios: filas.filter((f) => f.estado === "sin_cambios").length,
    };
  }, [filas]);

  const descargarInforme = () => {
    const buffer = generarInformeValidacionExcel(filas);
    descargarArchivoExcel(
      buffer,
      `INFORME_VALIDACION_STOCK_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  const getBadgeEstado = (estado: EstadoFilaImportacion) => {
    switch (estado) {
      case "correcta":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            <CheckCircle2 className="w-3 h-3" />
            Válida
          </span>
        );
      case "aviso":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Aviso
          </span>
        );
      case "conflicto":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-800 bg-orange-50 border border-orange-300 px-2 py-0.5 rounded">
            <AlertCircle className="w-3 h-3 text-orange-600" />
            Conflicto
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
            <XCircle className="w-3 h-3" />
            Error
          </span>
        );
      case "sin_cambios":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
            <MinusCircle className="w-3 h-3" />
            Sin cambios
          </span>
        );
    }
  };

  return (
    <div className="space-y-3 bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
      {/* Barra superior de pestañas de filtrado */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setFiltroEstado("todos");
              setPagina(1);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filtroEstado === "todos"
                ? "bg-slate-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Todas ({contadores.todos})
          </button>

          <button
            type="button"
            onClick={() => {
              setFiltroEstado("modificables");
              setPagina(1);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filtroEstado === "modificables"
                ? "bg-amber-600 text-white"
                : "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200"
            }`}
          >
            A modificar ({contadores.modificables})
          </button>

          {contadores.conflicto > 0 && (
            <button
              type="button"
              onClick={() => {
                setFiltroEstado("conflicto");
                setPagina(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filtroEstado === "conflicto"
                  ? "bg-orange-600 text-white"
                  : "bg-orange-50 text-orange-900 hover:bg-orange-100 border border-orange-200"
              }`}
            >
              Conflictos ({contadores.conflicto})
            </button>
          )}

          {contadores.aviso > 0 && (
            <button
              type="button"
              onClick={() => {
                setFiltroEstado("aviso");
                setPagina(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filtroEstado === "aviso"
                  ? "bg-amber-500 text-white"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              Avisos ({contadores.aviso})
            </button>
          )}

          {contadores.error > 0 && (
            <button
              type="button"
              onClick={() => {
                setFiltroEstado("error");
                setPagina(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filtroEstado === "error"
                  ? "bg-rose-600 text-white"
                  : "bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200"
              }`}
            >
              Errores ({contadores.error})
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setFiltroEstado("sin_cambios");
              setPagina(1);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filtroEstado === "sin_cambios"
                ? "bg-gray-700 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Sin cambios ({contadores.sin_cambios})
          </button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={descargarInforme}
          className="text-xs h-8 gap-1.5 border-gray-300 text-gray-700 hover:bg-gray-50"
          title="Descargar informe completo en Excel con todas las discrepancias"
        >
          <Download className="w-3.5 h-3.5 text-gray-500" />
          <span>Descargar Informe Excel</span>
        </Button>
      </div>

      {/* Buscador interno */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          placeholder="Filtrar por producto, SKU, ubicación o mensaje de error..."
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setPagina(1);
          }}
          className="pl-9 text-xs h-8 bg-gray-50/70 border-gray-200"
        />
      </div>

      {/* Tabla de filas */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/90 border-b border-gray-200 text-gray-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">Fila</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3">Producto / SKU</th>
                <th className="py-2.5 px-3">Ubicación</th>
                <th className="py-2.5 px-3 text-right">Stock en BD</th>
                <th className="py-2.5 px-3 text-right">Stock Archivo</th>
                <th className="py-2.5 px-3 text-right">Nuevo Stock</th>
                <th className="py-2.5 px-3 text-right">Diferencia</th>
                <th className="py-2.5 px-3">Observaciones / Incidencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filasPaginadas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500 text-xs">
                    No hay filas que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filasPaginadas.map((f) => {
                  const difClass =
                    f.diferencia > 0
                      ? "text-emerald-700 font-bold"
                      : f.diferencia < 0
                        ? "text-rose-700 font-bold"
                        : "text-gray-400";

                  return (
                    <tr
                      key={f.numeroFila}
                      className={`hover:bg-amber-50/40 transition-colors ${
                        f.estado === "error"
                          ? "bg-rose-50/20"
                          : f.estado === "conflicto"
                            ? "bg-orange-50/20"
                            : f.estado === "aviso"
                              ? "bg-amber-50/20"
                              : ""
                      }`}
                    >
                      <td className="py-2 px-3 text-center text-gray-400 font-mono text-[11px]">
                        {f.numeroFila}
                      </td>
                      <td className="py-2 px-3">{getBadgeEstado(f.estado)}</td>
                      <td className="py-2 px-3">
                        <div
                          className="font-semibold text-gray-900 truncate max-w-[220px]"
                          title={f.nombreProductoResuelto}
                        >
                          {f.nombreProductoResuelto}
                        </div>
                        <div className="font-mono text-[10px] text-gray-500">
                          {f.codigo_producto || "Sin SKU"}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-bold text-gray-800 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-[11px]">
                          {f.nombreUbicacionResuelta}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-medium text-gray-700">
                        {f.stockActualEnBD} ud
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-gray-500">
                        {f.cantidad_actual} ud
                      </td>
                      <td className="py-2 px-3 text-right">
                        {f.cantidad_nueva !== null && !isNaN(f.cantidad_nueva) ? (
                          <span className="font-mono font-bold text-gray-900 bg-white border border-gray-300 px-2 py-0.5 rounded shadow-2xs">
                            {f.cantidad_nueva} ud
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Sin cambio</span>
                        )}
                      </td>
                      <td className={`py-2 px-3 text-right font-mono text-xs ${difClass}`}>
                        {f.cantidad_nueva !== null && !isNaN(f.cantidad_nueva) && f.diferencia !== 0
                          ? f.diferencia > 0
                            ? `+${f.diferencia}`
                            : f.diferencia
                          : "—"}
                      </td>
                      <td className="py-2 px-3">
                        {f.estado === "conflicto" ? (
                          <div className="space-y-1.5">
                            <p className="text-[11px] text-orange-800 font-medium">
                              {f.mensajes[0]}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <label className="text-[10px] font-bold text-gray-600">
                                Resolución:
                              </label>
                              <select
                                value={f.resolucionConflicto || "aplicar_archivo"}
                                onChange={(e) =>
                                  onCambiarResolucionConflicto(
                                    f.numeroFila,
                                    e.target.value as ResolucionConflicto,
                                  )
                                }
                                className="text-[11px] bg-white border border-orange-300 rounded px-1.5 py-0.5 font-medium text-orange-950 focus:outline-none focus:ring-1 focus:ring-orange-400"
                              >
                                <option value="aplicar_archivo">
                                  Aplicar Excel ({f.cantidad_nueva} ud)
                                </option>
                                <option value="mantener_bd">
                                  Mantener BD ({f.stockActualEnBD} ud)
                                </option>
                              </select>
                            </div>
                          </div>
                        ) : f.mensajes.length > 0 ? (
                          <div className="text-[11px] text-gray-600 max-w-[280px]">
                            {f.mensajes.map((m, i) => (
                              <p
                                key={i}
                                className={
                                  f.estado === "error"
                                    ? "text-rose-700 font-medium"
                                    : f.estado === "aviso"
                                      ? "text-amber-800 font-medium"
                                      : "text-gray-500"
                                }
                              >
                                {m}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[11px] italic">
                            {f.observaciones || "Ajuste ordinario"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginador */}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
          <span>
            Mostrando {filasFiltradas.length > 0 ? (pagina - 1) * elementosPorPagina + 1 : 0} a{" "}
            {Math.min(pagina * elementosPorPagina, filasFiltradas.length)} de{" "}
            {filasFiltradas.length} filas
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={pagina <= 1}
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="px-2 text-xs font-medium">
              {pagina} / {totalPaginas}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagina >= totalPaginas}
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
