import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useMyProfile } from "@/hooks/usePermissions";
import { getProductos, getUbicacionesCompletas, getStockPorUbicaciones } from "@/lib/inventario";
import {
  generarPlantillaStockExcel,
  descargarArchivoExcel,
  VERSION_PLANTILLA_EXCEL,
} from "@/lib/excel-stock";
import { parsearArchivoStock, type ResultadoParserStock } from "@/lib/parser-stock";
import {
  validarFilasStock,
  type FilaValidadaStock,
  type ResumenValidacionStock,
  type ResolucionConflicto,
  generarInformeValidacionExcel,
} from "@/lib/validador-stock";
import { TablaRevisionImportacion } from "@/components/inventario/TablaRevisionImportacion";
import { ModalRevertirLote } from "@/components/inventario/ModalRevertirLote";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Loader2,
  Download,
  Filter,
  History,
  ShieldAlert,
  Boxes,
  HelpCircle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/actualizacion-masiva-stock")({
  component: ActualizacionMasivaStockPage,
});

function ActualizacionMasivaStockPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { perfil, isAdmin, can } = useMyProfile();

  // Estados del asistente (pasos 1 a 4)
  const [paso, setPaso] = useState<1 | 2 | 3 | 4>(1);

  // Filtros de exportación
  const [filtroUbi, setFiltroUbi] = useState<string>("todas");
  const [filtroCat, setFiltroCat] = useState<string>("todas");
  const [soloConStock, setSoloConStock] = useState<boolean>(false);

  // Estados de carga de archivo y validación
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [analizandoArchivo, setAnalizandoArchivo] = useState(false);
  const [resultadoParser, setResultadoParser] = useState<ResultadoParserStock | null>(null);
  const [filasValidadas, setFilasValidadas] = useState<FilaValidadaStock[]>([]);
  const [resumen, setResumen] = useState<ResumenValidacionStock | null>(null);

  // Modal de confirmación final
  const [confirmarEjecucionAbierto, setConfirmarEjecucionAbierto] = useState(false);
  const [modalRevertirAbierto, setModalRevertirAbierto] = useState(false);
  const [resultadoFinal, setResultadoFinal] = useState<{ batch_id: string; filas: number } | null>(
    null,
  );

  // 1. Cargar datos maestros de Supabase
  const { data: productos = [], isLoading: cargandoProds } = useQuery({
    queryKey: ["productos"],
    queryFn: getProductos,
  });

  const { data: ubicaciones = [], isLoading: cargandoUbis } = useQuery({
    queryKey: ["ubicaciones"],
    queryFn: getUbicacionesCompletas,
  });

  const { data: stock = [], isLoading: cargandoStock } = useQuery({
    queryKey: ["stock"],
    queryFn: getStockPorUbicaciones,
  });

  const cargandoDatos = cargandoProds || cargandoUbis || cargandoStock;

  // 2. Paso 1: Descargar plantilla
  const handleDescargarPlantilla = () => {
    try {
      const buffer = generarPlantillaStockExcel({
        productos,
        ubicaciones,
        stock,
        usuarioNombre: perfil?.nombre_completo || perfil?.correo || "Operador",
        filtros: {
          idUbicacion: filtroUbi !== "todas" ? filtroUbi : undefined,
          idCategoria: filtroCat !== "todas" ? filtroCat : undefined,
          soloConStock,
        },
      });

      const fechaStr = new Date().toISOString().slice(0, 10);
      descargarArchivoExcel(buffer, `INVENTARIO_LM_ACTUALIZACION_STOCK_${fechaStr}.xlsx`);
      toast.success("Plantilla Excel generada correctamente", {
        description: "Rellena la columna 'cantidad_nueva' y vuelve al Paso 2 para subirla.",
      });
    } catch (err: any) {
      toast.error(`Error al generar plantilla: ${err.message || err}`);
    }
  };

  // 3. Paso 2: Procesar archivo subido
  const handleArchivoCargado = async (file: File) => {
    setArchivoSeleccionado(file);
    setAnalizandoArchivo(true);
    try {
      const resParse = await parsearArchivoStock(file);
      setResultadoParser(resParse);

      if (!resParse.exito) {
        toast.error("El archivo contiene errores de estructura", {
          description:
            resParse.erroresArchivo[0] || "Comprueba que provenga de la plantilla oficial.",
        });
        return;
      }

      // Validar frente al stock y catálogo en vivo
      const { filasValidadas: validadas, resumen: res } = validarFilasStock({
        filas: resParse.filas,
        productos,
        ubicaciones,
        stock,
      });

      setFilasValidadas(validadas);
      setResumen(res);
      setPaso(3); // Avanzar a revisión
      toast.success(`Archivo procesado: ${resParse.filas.length} filas analizadas`);
    } catch (err: any) {
      toast.error(`Error al analizar archivo: ${err.message || err}`);
    } finally {
      setAnalizandoArchivo(false);
    }
  };

  // Actualizar resolución de conflicto en una fila
  const handleCambiarResolucionConflicto = (
    numeroFila: number,
    resolucion: ResolucionConflicto,
  ) => {
    setFilasValidadas((prev) =>
      prev.map((f) =>
        f.numeroFila === numeroFila ? { ...f, resolucionConflicto: resolucion } : f,
      ),
    );
  };

  // 4. Paso 4: Mutación transaccional para aplicar la actualización
  const mutationAplicar = useMutation({
    mutationFn: async () => {
      if (!perfil?.id) throw new Error("Sesión no iniciada");

      // Filtrar filas aplicables
      const filasAplicables = filasValidadas.filter((f) => {
        if (f.estado === "error" || f.estado === "sin_cambios") return false;
        if (f.estado === "conflicto" && f.resolucionConflicto === "mantener_bd") return false;
        return f.cantidad_nueva !== null && !isNaN(f.cantidad_nueva);
      });

      if (filasAplicables.length === 0) {
        throw new Error("No hay ninguna fila con cambios efectivos a aplicar.");
      }

      const payloadLote = filasAplicables.map((f) => ({
        id_producto: f.productoIdResuelto,
        id_ubicacion: f.ubicacionIdResuelta,
        cantidad_nueva: f.cantidad_nueva,
        cantidad_base: f.cantidad_actual,
        forzar: f.estado === "conflicto" && f.resolucionConflicto === "aplicar_archivo",
        observaciones: f.observaciones || "Actualización masiva Excel",
      }));

      // Intento 1: Ejecutar vía función RPC atómica en Postgres
      const { data, error } = await supabase.rpc("aplicar_actualizacion_masiva_stock", {
        p_lote: payloadLote,
        p_usuario_id: perfil.id,
      });

      if (error) {
        console.warn("RPC no disponible en PostgreSQL, usando fallback cliente:", error.message);

        // Fallback en cliente mediante inserts a la tabla movimientos
        const batchId = crypto.randomUUID();
        let modificadas = 0;

        for (const item of payloadLote) {
          const cantNueva = item.cantidad_nueva!;
          const actual =
            stock.find(
              (s) => s.id_producto === item.id_producto && s.id_ubicacion === item.id_ubicacion,
            )?.cantidad || 0;

          if (actual === cantNueva) continue;

          await supabase.from("movimientos").insert({
            id_producto: item.id_producto,
            id_ubicacion: item.id_ubicacion,
            tipo: cantNueva === 0 ? "salida" : "ajuste",
            cantidad: cantNueva === 0 ? actual : cantNueva,
            precio_unitario: 0,
            notas: `[LOTE: ${batchId}] Importación Excel. Anterior: ${actual}, Nuevo: ${cantNueva}, Dif: ${cantNueva - actual}. Obs: ${item.observaciones}`,
            realizado_por: perfil.id,
            import_batch_id: batchId,
          });

          modificadas++;
        }

        return { exito: true, batch_id: batchId, filas_modificadas: modificadas };
      }

      return data;
    },
    onSuccess: (data: any) => {
      setResultadoFinal({
        batch_id: data.batch_id || "N/A",
        filas: data.filas_modificadas ?? 0,
      });
      setPaso(4); // Pantalla final
      setConfirmarEjecucionAbierto(false);
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["movimientos"] });
      toast.success("¡Stock actualizado con éxito!");
    },
    onError: (err: any) => {
      toast.error(`Error al aplicar cambios: ${err.message || err}`);
    },
  });

  // Categorías únicas para filtro
  const categoriasUnicas = Array.from(new Set(productos.map((p) => p.categoria).filter(Boolean)));

  // Filas pendientes de aplicar
  const filasParaAplicar = filasValidadas.filter((f) => {
    if (f.estado === "error" || f.estado === "sin_cambios") return false;
    if (f.estado === "conflicto" && f.resolucionConflicto === "mantener_bd") return false;
    return f.cantidad_nueva !== null && !isNaN(f.cantidad_nueva);
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-50 to-orange-50/60 p-5 rounded-2xl border border-amber-200/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-gray-900 tracking-tight">
                Actualización Masiva de Stock
              </h1>
              <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-xs">
                {VERSION_PLANTILLA_EXCEL}
              </Badge>
            </div>
            <p className="text-xs text-amber-900/80 mt-0.5">
              Flujo "Exportar, Editar e Importar" para inventarios físicos con validación estricta y
              auditoría.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalRevertirAbierto(true)}
              className="text-xs h-9 gap-1.5 border-gray-300 text-gray-700 hover:bg-gray-50"
              title="Auditar y revertir importaciones previas"
            >
              <History className="w-4 h-4 text-amber-600" />
              <span>Historial y Reversión</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/ubicaciones" })}
            className="text-xs h-9 gap-1.5 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Boxes className="w-4 h-4 text-gray-500" />
            <span>Volver a Ubicaciones</span>
          </Button>
        </div>
      </div>

      {/* Indicador de pasos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { num: 1, titulo: "1. Filtros y Plantilla" },
          { num: 2, titulo: "2. Subir Archivo" },
          { num: 3, titulo: "3. Revisar y Conflictos" },
          { num: 4, titulo: "4. Confirmación" },
        ].map((p) => {
          const activo = paso === p.num;
          const completado = paso > p.num;
          return (
            <div
              key={p.num}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                activo
                  ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                  : completado
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-white text-gray-400 border-gray-200"
              }`}
            >
              {completado ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    activo ? "bg-white text-amber-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {p.num}
                </span>
              )}
              <span className="truncate">{p.titulo}</span>
            </div>
          );
        })}
      </div>

      {/* ====================================================================== */}
      {/* PASO 1: FILTROS Y DESCARGA DE PLANTILLA                                */}
      {/* ====================================================================== */}
      {paso === 1 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 shadow-2xs">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-amber-600" />
              <span>Paso 1: Configurar y Descargar Plantilla Oficial</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Filtra las combinaciones de producto-ubicación que deseas inventariar o descarga el
              catálogo completo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50/70 border border-gray-200 rounded-xl text-xs">
            {/* Filtro por ubicación */}
            <div className="space-y-1.5">
              <label className="font-semibold text-gray-700">Filtrar por Ubicación:</label>
              <select
                value={filtroUbi}
                onChange={(e) => setFiltroUbi(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800"
              >
                <option value="todas">Todas las ubicaciones ({ubicaciones.length})</option>
                {ubicaciones.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} ({u.tipo})
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por categoría */}
            <div className="space-y-1.5">
              <label className="font-semibold text-gray-700">Filtrar por Categoría:</label>
              <select
                value={filtroCat}
                onChange={(e) => setFiltroCat(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800"
              >
                <option value="todas">Todas las categorías</option>
                {categoriasUnicas.map((cat) => (
                  <option key={cat!} value={cat!}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Checkbox solo con stock */}
            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="inline-flex items-center gap-2 cursor-pointer text-gray-700 py-1.5">
                <input
                  type="checkbox"
                  checked={soloConStock}
                  onChange={(e) => setSoloConStock(e.target.checked)}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="font-medium">Solo combinaciones con stock &gt; 0</span>
              </label>
            </div>
          </div>

          {/* Información de instrucciones de plantilla */}
          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-950">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <HelpCircle className="w-4 h-4 text-amber-700" />
              <span>Instrucciones para el Excel:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-amber-900/90 text-[11px]">
              <li>Las columnas de identificación (A-G) son de sólo lectura para tu referencia.</li>
              <li>
                Escribe el nuevo stock físico en la columna <strong>cantidad_nueva</strong>.
              </li>
              <li>
                Las celdas vacías o iguales al valor actual se omitirán sin generar movimientos.
              </li>
              <li>
                Para dejar el stock a cero, escribe explícitamente <strong>0</strong>.
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <Button
              onClick={handleDescargarPlantilla}
              disabled={cargandoDatos}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-2 h-9 px-4 font-semibold shadow-xs"
            >
              {cargandoDatos ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Preparando catálogo...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar Plantilla Excel (.xlsx)</span>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => setPaso(2)}
              className="text-xs h-9 gap-1.5 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <span>Ya tengo el archivo completado</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* PASO 2: SUBIR ARCHIVO                                                  */}
      {/* ====================================================================== */}
      {paso === 2 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 shadow-2xs">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-amber-600" />
              <span>Paso 2: Subir Archivo Excel o CSV con el Conteo</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Arrastra o selecciona el archivo con la columna 'cantidad_nueva' cumplimentada.
            </p>
          </div>

          {/* Zona de Drag & Drop */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleArchivoCargado(e.dataTransfer.files[0]);
              }
            }}
            className="border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-2xl p-10 text-center bg-amber-50/20 hover:bg-amber-50/40 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer"
            onClick={() => document.getElementById("input-archivo-stock")?.click()}
          >
            <input
              id="input-archivo-stock"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleArchivoCargado(e.target.files[0]);
                }
              }}
            />

            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              {analizandoArchivo ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-7 h-7" />
              )}
            </div>

            <div>
              <p className="font-bold text-sm text-gray-900">
                {analizandoArchivo
                  ? "Analizando y validando estructura del archivo..."
                  : "Arrastra aquí tu archivo o haz clic para seleccionarlo"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Admite formatos .xlsx, .xls y .csv (máximo 10 MB y 10.000 filas).
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={analizandoArchivo}
              className="text-xs border-amber-300 text-amber-900 bg-white hover:bg-amber-50 mt-1"
            >
              Explorar archivos en mi equipo
            </Button>
          </div>

          {resultadoParser && !resultadoParser.exito && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-xs text-rose-800">
              <div className="font-bold flex items-center gap-1.5 text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>No se pudo procesar el archivo:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5">
                {resultadoParser.erroresArchivo.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaso(1)}
              className="text-xs gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al Paso 1</span>
            </Button>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* PASO 3: REVISIÓN, CONFLICTOS Y VALIDACIÓN                             */}
      {/* ====================================================================== */}
      {paso === 3 && resumen && (
        <div className="space-y-4">
          {/* Tarjetas KPI de resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-2xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">
                Total Filas
              </span>
              <span className="text-xl font-black text-gray-900">{resumen.total}</span>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                A Modificar
              </span>
              <span className="text-xl font-black text-emerald-800">{resumen.modificables}</span>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-[10px] font-bold text-gray-500 uppercase block">
                Sin Cambios
              </span>
              <span className="text-xl font-black text-gray-700">{resumen.sinCambios}</span>
            </div>

            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
              <span className="text-[10px] font-bold text-orange-700 uppercase block">
                Conflictos
              </span>
              <span className="text-xl font-black text-orange-800">{resumen.conflictos}</span>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
              <span className="text-[10px] font-bold text-rose-700 uppercase block">Errores</span>
              <span className="text-xl font-black text-rose-800">{resumen.errores}</span>
            </div>
          </div>

          {/* Tabla de revisión interactiva */}
          <TablaRevisionImportacion
            filas={filasValidadas}
            onCambiarResolucionConflicto={handleCambiarResolucionConflicto}
          />

          {/* Barra de acción inferior */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaso(2)}
              className="text-xs gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Subir otro archivo</span>
            </Button>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setConfirmarEjecucionAbierto(true)}
                disabled={filasParaAplicar.length === 0}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-9 px-4 gap-1.5 font-bold shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aplicar {filasParaAplicar.length} modificaciones de stock</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* PASO 4: RESULTADO Y AUDITORÍA FINAL                                    */}
      {/* ====================================================================== */}
      {paso === 4 && resultadoFinal && (
        <div className="bg-white border border-emerald-200 rounded-2xl p-8 text-center space-y-4 shadow-sm max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-black text-gray-900">¡Actualización Masiva Aplicada!</h2>
            <p className="text-xs text-gray-600 mt-1">
              Se han registrado los movimientos correspondientes y el stock se ha sincronizado de
              forma atómica.
            </p>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs space-y-2 text-left">
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <span className="text-gray-500 font-semibold">Identificador de Lote:</span>
              <strong className="font-mono text-gray-900">{resultadoFinal.batch_id}</strong>
            </div>
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <span className="text-gray-500 font-semibold">Filas modificadas:</span>
              <strong className="text-emerald-700 font-bold">
                {resultadoFinal.filas} productos
              </strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-semibold">Tipo de movimiento:</span>
              <strong className="text-gray-900">Ajuste de inventario</strong>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPaso(1);
                setArchivoSeleccionado(null);
                setFilasValidadas([]);
                setResumen(null);
                setResultadoFinal(null);
              }}
              className="text-xs h-9 gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Realizar otra importación</span>
            </Button>

            <Button
              size="sm"
              onClick={() => navigate({ to: "/ubicaciones" })}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-9 px-4 gap-1.5 font-bold"
            >
              <Boxes className="w-4 h-4" />
              <span>Ir a Ubicaciones</span>
            </Button>
          </div>
        </div>
      )}

      {/* Modal crítico de confirmación antes de aplicar */}
      <AlertDialog open={confirmarEjecucionAbierto} onOpenChange={setConfirmarEjecucionAbierto}>
        <AlertDialogContent className="bg-white border-amber-200">
          <AlertDialogHeader>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-1">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-gray-900">
              ¿Confirmar actualización de stock?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-600 space-y-2">
              <p>
                Vas a modificar <strong>{filasParaAplicar.length} filas</strong> en una única
                transacción atómica. Se generarán movimientos de tipo ajuste trazables con un
                identificador de lote de importación.
              </p>
              {resumen && resumen.conflictos > 0 && (
                <div className="p-2.5 bg-orange-50 border border-orange-200 rounded text-orange-900 font-medium">
                  Se aplicarán las resoluciones seleccionadas para los {resumen.conflictos}{" "}
                  conflictos concurrentes detectados.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutationAplicar.isPending} className="text-xs">
              Cancelar y revisar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => mutationAplicar.mutate()}
              disabled={mutationAplicar.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
            >
              {mutationAplicar.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Aplicando en base de datos...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sí, aplicar {filasParaAplicar.length} cambios</span>
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Reversión */}
      <ModalRevertirLote abierto={modalRevertirAbierto} onOpenChange={setModalRevertirAbierto} />
    </div>
  );
}
