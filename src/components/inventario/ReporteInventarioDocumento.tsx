import { AlertTriangle, PackageSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GrupoInforme, InformeInventario, TipoGrupoInforme } from "@/lib/reportes";

const ESTILO_GRUPO: Record<TipoGrupoInforme, { label: string; badge: string; border: string }> = {
  armario: {
    label: "Armario",
    badge: "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
    border: "border-emerald-200 dark:border-emerald-500/30",
  },
  caja: {
    label: "Caja",
    badge: "border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-200",
    border: "border-rose-200 dark:border-rose-500/30",
  },
  cross: {
    label: "Cross",
    badge: "border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/10 text-purple-800 dark:text-purple-200",
    border: "border-purple-200 dark:border-purple-500/30",
  },
  palet: {
    label: "Palet",
    badge: "border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200",
    border: "border-amber-200 dark:border-amber-500/30",
  },
  reserva: {
    label: "Reserva",
    badge: "border-border bg-muted text-foreground",
    border: "border-border",
  },
};

function etiquetaEstado(estado: string) {
  if (estado === "AGOTADO") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 dark:border-rose-500/40 bg-rose-100 dark:bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:text-rose-200">
        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
        Agotado
      </span>
    );
  }
  if (estado === "BAJO") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300">
        Bajo
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
      OK
    </span>
  );
}

function TarjetaResumen({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-3", tone ?? "border-border")}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-black text-foreground">{value}</div>
    </div>
  );
}

function TablaGrupo({ grupo }: { grupo: GrupoInforme }) {
  const estilo = ESTILO_GRUPO[grupo.tipo] ?? ESTILO_GRUPO.armario;

  return (
    <section className={cn("overflow-hidden rounded-xl border bg-card", estilo.border)}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-inherit bg-muted/70 px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                estilo.badge,
              )}
            >
              {estilo.label}
            </span>
            <h3 className="truncate text-sm font-bold text-foreground">{grupo.titulo}</h3>
            {grupo.codigo && (
              <span className="font-mono text-[10px] text-muted-foreground">[{grupo.codigo}]</span>
            )}
          </div>
          {grupo.subtitulo && <p className="mt-1 text-[11px] text-muted-foreground">{grupo.subtitulo}</p>}
        </div>
        <span className="text-[11px] font-semibold text-muted-foreground">
          {grupo.filas.length} referencia{grupo.filas.length === 1 ? "" : "s"}
        </span>
      </header>

      {grupo.filas.length === 0 ? (
        <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm italic text-muted-foreground">
          <PackageSearch className="h-4 w-4" aria-hidden="true" />
          Sin productos registrados.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-muted/80 text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2 font-bold">Ubicación</th>
                <th className="px-3 py-2 font-bold">SKU</th>
                <th className="px-3 py-2 font-bold">Producto</th>
                <th className="px-3 py-2 font-bold">Categoría</th>
                <th className="px-3 py-2 text-right font-bold">Cant.</th>
                <th className="px-3 py-2 text-right font-bold">Mín.</th>
                <th className="px-3 py-2 text-center font-bold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {grupo.filas.map((fila, index) => (
                <tr
                  key={`${fila.sku}-${fila.nombre}-${index}`}
                  className={fila.estado === "AGOTADO" ? "bg-rose-50/50 dark:bg-rose-500/10" : undefined}
                >
                  <td className="px-3 py-2 text-muted-foreground">{fila.ubicacion}</td>
                  <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{fila.sku}</td>
                  <td className="px-3 py-2 font-medium text-foreground">{fila.nombre}</td>
                  <td className="px-3 py-2 text-muted-foreground">{fila.categoria}</td>
                  <td className="px-3 py-2 text-right font-bold text-foreground">{fila.cantidad}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{fila.stockMinimo}</td>
                  <td className="px-3 py-2 text-center">{etiquetaEstado(fila.estado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function ReporteInventarioDocumento({ informe }: { informe: InformeInventario }) {
  return (
    <article className="space-y-5 rounded-xl border border-border bg-card p-5 text-foreground shadow-xs sm:p-6">
      <header className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
            Inventario LM
          </div>
          <h2 className="mt-1 text-xl font-black tracking-tight text-foreground">
            {informe.titulo}
          </h2>
          <p className="mt-1 text-xs font-medium text-muted-foreground">{informe.subtitulo}</p>
        </div>
        <div className="text-left text-[11px] text-muted-foreground sm:text-right">
          <div className="font-semibold text-foreground">
            {new Date(informe.fecha).toLocaleString("es-ES")}
          </div>
          <div>Generado por: {informe.generadoPor}</div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <TarjetaResumen label="Referencias" value={informe.resumen.referencias} />
        <TarjetaResumen label="Unidades" value={informe.resumen.unidades} />
        <TarjetaResumen
          label="Bajo stock"
          value={informe.resumen.lineasBajo}
          tone="border-rose-200 dark:border-rose-500/30"
        />
        <TarjetaResumen
          label="Agotadas"
          value={informe.resumen.lineasAgotadas}
          tone="border-rose-300 dark:border-rose-500/40"
        />
      </div>

      <div className="space-y-3">
        {informe.grupos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted px-4 py-10 text-center text-sm italic text-muted-foreground">
            No hay información para este informe.
          </div>
        ) : (
          informe.grupos.map((grupo) => <TablaGrupo key={grupo.id} grupo={grupo} />)
        )}
      </div>

      <footer className="border-t border-border pt-3 text-[10px] text-muted-foreground">
        Documento generado desde Inventario LM. Las existencias se leen del stock actualizado por
        movimientos.
      </footer>
    </article>
  );
}
