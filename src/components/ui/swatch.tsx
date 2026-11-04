import { cn } from "@/lib/utils";

export function Swatch({
  color,
  label,
  className,
}: {
  color: string;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span
        className="w-6 h-6 rounded-sm border border-ink/10 shadow-none shrink-0"
        style={{ backgroundColor: color }}
        aria-label={label || "muestra de color"}
      />
      {label && <span className="font-mono text-xs text-ink">{label}</span>}
    </div>
  );
}
