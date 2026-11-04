import { cn } from "@/lib/utils";

type Estado = "en-stock" | "reservado" | "bajo-minimo" | "agotado";

const config = {
  "en-stock": { label: "EN STOCK", className: "border-red-oxide text-red-oxide bg-paper" },
  reservado: { label: "RESERVADO", className: "border-ink/40 text-ink bg-paper" },
  "bajo-minimo": { label: "BAJO MÍNIMO", className: "border-red-oxide text-red-oxide bg-paper/60" },
  agotado: { label: "AGOTADO", className: "border-ink/20 text-ink bg-paper/40" },
};

export function SelloEstado({ estado, className }: { estado: Estado; className?: string }) {
  const c = config[estado];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest font-sans",
        c.className,
        className,
      )}
    >
      {c.label}
    </span>
  );
}
