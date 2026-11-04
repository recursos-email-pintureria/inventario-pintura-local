import { cn } from "@/lib/utils";

export function EtiquetaLote({ codigo, className }: { codigo: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-ink/20 bg-paper px-2 py-1 font-mono text-[11px] font-semibold text-ink tracking-tight",
        className,
      )}
    >
      {codigo}
    </span>
  );
}
