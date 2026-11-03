import { Barcode, LockKeyhole } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EtiquetaPaletProducto {
  id?: string;
  nombre: string;
  sku?: string;
  cantidad: number;
}

export interface EtiquetaPaletData {
  numero_palet: number;
  codigo_barras: string;
  reserva_nombre?: string | null;
  generado_por?: string | null;
  generado_en?: string | null;
  productos?: EtiquetaPaletProducto[];
}

interface EtiquetaPaletProps {
  palet: EtiquetaPaletData;
  variante?: "oficial" | "compacta";
  mostrarProductos?: boolean;
  className?: string;
}

function formatearFecha(value?: string | null): string {
  if (!value) return new Date().toLocaleString("es-ES");
  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) return value;
  return fecha.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
}

export function EtiquetaPalet({
  palet,
  variante = "oficial",
  mostrarProductos = true,
  className,
}: EtiquetaPaletProps) {
  const productos = palet.productos ?? [];
  const totalUnidades = productos.reduce((total, producto) => total + producto.cantidad, 0);
  const numero = `PALET #${String(palet.numero_palet).padStart(3, "0")}`;

  if (variante === "compacta") {
    return (
      <div
        className={cn(
          "print-area rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/40 p-4 text-slate-900",
          className,
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-amber-200 pb-2">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-900">
            Leroy Merlin
          </span>
          <span className="rounded border border-amber-300 bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
            {numero}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Barcode className="h-10 w-16 shrink-0 text-slate-800" aria-hidden="true" />
          <div className="min-w-0">
            <div className="truncate font-mono text-sm font-black tracking-wider">
              {palet.codigo_barras}
            </div>
            <div className="truncate text-[11px] text-slate-600">
              {palet.reserva_nombre || "Reserva"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "print-area mx-auto max-w-md space-y-3 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/40 p-4 font-sans text-slate-900",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-amber-200 pb-2">
        <div>
          <div className="text-sm font-black uppercase tracking-[0.18em] text-slate-900">
            Leroy Merlin
          </div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-amber-800">
            Etiqueta oficial de palet
          </div>
        </div>
        <span className="rounded border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-900">
          {numero}
        </span>
      </div>

      <div className="space-y-1 rounded-lg border border-amber-100 bg-white p-3 text-center shadow-2xs">
        <div className="flex justify-center">
          <Barcode className="h-14 w-48 text-slate-900" aria-hidden="true" />
        </div>
        <div className="font-mono text-lg font-black tracking-widest text-slate-900">
          {palet.codigo_barras}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded border border-amber-200/80 bg-white p-2">
          <span className="block text-[10px] font-bold uppercase text-amber-800">Dónde</span>
          <strong className="block truncate text-xs text-slate-900">
            {palet.reserva_nombre || "Reserva"}
          </strong>
        </div>
        <div className="rounded border border-amber-200/80 bg-white p-2">
          <span className="block text-[10px] font-bold uppercase text-amber-800">Quién</span>
          <strong className="block truncate text-xs text-slate-900">
            {palet.generado_por || "-"}
          </strong>
        </div>
        <div className="rounded border border-amber-200/80 bg-white p-2">
          <span className="block text-[10px] font-bold uppercase text-amber-800">Cuándo</span>
          <span className="block text-xs font-semibold text-slate-800">
            {formatearFecha(palet.generado_en)}
          </span>
        </div>
        <div className="rounded border border-amber-200/80 bg-white p-2">
          <span className="block text-[10px] font-bold uppercase text-amber-800">Cantidad</span>
          <span className="block text-xs font-bold text-emerald-700">{totalUnidades} unidades</span>
        </div>
      </div>

      {mostrarProductos && (
        <div className="space-y-1 rounded border border-amber-200/80 bg-white p-2.5 text-[11px]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Artículos asignados
          </div>
          {productos.length === 0 ? (
            <p className="italic text-slate-400">Sin mercancía registrada.</p>
          ) : (
            productos.map((producto, index) => (
              <div
                key={producto.id ?? `${producto.sku ?? producto.nombre}-${index}`}
                className="flex items-center justify-between gap-3 text-slate-800"
              >
                <span className="truncate">
                  {producto.nombre}{" "}
                  {producto.sku && (
                    <span className="font-mono text-[10px] text-slate-400">({producto.sku})</span>
                  )}
                </span>
                <strong className="shrink-0">{producto.cantidad} uds</strong>
              </div>
            ))
          )}
        </div>
      )}

      <div className="flex items-center justify-center gap-1.5 rounded border border-amber-200 bg-amber-100/60 p-2 text-center text-[10px] font-medium text-amber-900">
        <LockKeyhole className="h-3 w-3 shrink-0" aria-hidden="true" />
        Ubicación fijada: solo en Reserva. Al vaciarse puede autodestruirse.
      </div>
    </div>
  );
}
