import Papa from "papaparse";
import { AlertTriangle, Download, FileCheck2, FileWarning } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FilaConError, ResultadoValidacion } from "@/lib/validador-lista-armario";

export type EstadoFilaVistaPrevia = "correcta" | "aviso" | "error" | "omitida" | "conflicto";

export interface FilaVistaPreviaArmario {
  numeroFila: number;
  sku: string | null;
  codigoBarras: string | null;
  nombre: string | null;
  cantidad: number | null;
  estado: EstadoFilaVistaPrevia;
  motivo?: string;
  stockActual: number | null;
  stockResultante: number | null;
}

interface TablaVistaPreviaArmarioProps {
  filas: FilaVistaPreviaArmario[];
  validacion: ResultadoValidacion;
  filasProblematicas: FilaConError[];
  hayErroresParseo: boolean;
  errorCargaDatos: boolean;
  bloqueadoPorPermisos: boolean;
  cargandoStock: boolean;
  cargando: boolean;
  onConfirmar: () => void;
}

const ESTILOS_ESTADO: Record<EstadoFilaVistaPrevia, { etiqueta: string; clase: string }> = {
  correcta: {
    etiqueta: "Correcta",
    clase: "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  },
  aviso: {
    etiqueta: "Aviso",
    clase: "border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200",
  },
  error: {
    etiqueta: "Error",
    clase: "border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-200",
  },
  omitida: {
    etiqueta: "Omitida",
    clase: "border-border bg-muted text-foreground",
  },
  conflicto: {
    etiqueta: "Conflicto",
    clase: "border-rose-300 dark:border-rose-500/40 bg-rose-100 dark:bg-rose-500/20 text-rose-900 dark:text-rose-100",
  },
};

function descargarInforme(filas: FilaConError[]) {
  const csv = Papa.unparse({
    fields: ["FILA", "REFERENCIA", "EAN", "NOMBRE", "CANTIDAD", "ESTADO", "MOTIVO"],
    data: filas.map((fila) => [
      fila.numeroFila,
      fila.sku ?? "",
      fila.codigoBarras ?? "",
      fila.nombre ?? "",
      fila.cantidadTexto ?? "",
      fila.estado,
      fila.motivo,
    ]),
  });
  const archivo = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const enlace = document.createElement("a");
  const url = URL.createObjectURL(archivo);

  enlace.href = url;
  enlace.download = "informe-importacion-armario.csv";
  enlace.click();
  URL.revokeObjectURL(url);
}

export function TablaVistaPreviaArmario({
  filas,
  validacion,
  filasProblematicas,
  hayErroresParseo,
  errorCargaDatos,
  bloqueadoPorPermisos,
  cargandoStock,
  cargando,
  onConfirmar,
}: TablaVistaPreviaArmarioProps) {
  const errores = validacion.resumen.errores;
  const omitidas = validacion.resumen.omitidas;
  const conflictos =
    validacion.resumen.conflictos + filas.filter((fila) => fila.estado === "conflicto").length;
  const avisos = filas.filter((fila) => fila.estado === "aviso").length;
  const validas = filas.filter(
    (fila) => fila.estado === "correcta" || fila.estado === "aviso",
  ).length;
  const bloqueado =
    hayErroresParseo ||
    errorCargaDatos ||
    bloqueadoPorPermisos ||
    errores > 0 ||
    conflictos > 0 ||
    cargandoStock ||
    validas === 0;

  return (
    <section className="space-y-4" aria-labelledby="titulo-vista-previa">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Contador titulo="Válidas" valor={validas} tono="emerald" />
        <Contador titulo="Errores" valor={errores} tono="rose" />
        <Contador titulo="Omitidas" valor={omitidas} tono="slate" />
        <Contador titulo="Conflictos" valor={conflictos} tono="rose" />
        <Contador titulo="Avisos" valor={avisos} tono="amber" />
      </div>

      {bloqueado && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-3 text-sm text-rose-900 dark:text-rose-100"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            {hayErroresParseo
              ? "Corrige los problemas de lectura del CSV antes de continuar."
              : errorCargaDatos
                ? "No se pudo consultar el stock; reintenta antes de confirmar."
                : bloqueadoPorPermisos
                  ? "Tu cuenta necesita el permiso puede_crear_productos para registrar movimientos."
                  : errores > 0 || conflictos > 0
                    ? "Resuelve los errores y conflictos bloqueantes antes de confirmar."
                    : cargandoStock
                      ? "Estamos consultando el stock actual del armario."
                      : "No hay filas válidas para importar."}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="titulo-vista-previa" className="text-lg font-semibold">
            Revisa los productos
          </h2>
          <p className="text-sm text-muted-foreground">
            El stock proyectado se calcula para el armario seleccionado.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filasProblematicas.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => descargarInforme(filasProblematicas)}
              className="min-h-11"
            >
              <Download className="mr-2 h-4 w-4" aria-hidden="true" />
              Descargar informe de errores
            </Button>
          )}
          <Button
            type="button"
            onClick={onConfirmar}
            disabled={bloqueado || cargando}
            className="min-h-11 bg-amber-600 text-white hover:bg-amber-700"
          >
            {cargando ? (
              "Importando..."
            ) : (
              <>
                <FileCheck2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Confirmar importación
              </>
            )}
          </Button>
        </div>
      </div>

      {filas.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No hay filas para mostrar.
        </div>
      ) : (
        <div className="max-h-[65vh] overflow-auto rounded-lg border bg-card">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow>
                <TableHead>Fila</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>EAN</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Stock actual → resultante</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((fila) => {
                const estado = ESTILOS_ESTADO[fila.estado];
                return (
                  <TableRow key={`${fila.numeroFila}-${fila.sku ?? "sin-sku"}`}>
                    <TableCell>{fila.numeroFila}</TableCell>
                    <TableCell className="font-mono text-xs">{fila.sku ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{fila.codigoBarras ?? "—"}</TableCell>
                    <TableCell className="min-w-40">{fila.nombre ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fila.cantidad ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={estado.clase}>
                        {fila.estado === "aviso" && (
                          <FileWarning className="mr-1 h-3 w-3" aria-hidden="true" />
                        )}
                        {estado.etiqueta}
                      </Badge>
                      {fila.motivo && (
                        <p className="mt-1 max-w-56 text-xs text-muted-foreground">{fila.motivo}</p>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {fila.stockActual === null || fila.stockResultante === null
                        ? "—"
                        : `${fila.stockActual} → ${fila.stockResultante}`}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}

function Contador({
  titulo,
  valor,
  tono,
}: {
  titulo: string;
  valor: number;
  tono: "emerald" | "rose" | "slate" | "amber";
}) {
  const clases = {
    emerald: "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
    rose: "border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-200",
    slate: "border-border bg-muted text-foreground",
    amber: "border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200",
  }[tono];

  return (
    <div className={`rounded-lg border px-3 py-2 ${clases}`}>
      <p className="text-xs font-medium">{titulo}</p>
      <p className="text-xl font-bold tabular-nums">{valor}</p>
    </div>
  );
}
