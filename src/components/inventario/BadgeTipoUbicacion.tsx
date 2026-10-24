import React from "react";
import { getConfigTipo } from "@/lib/tiposUbicacion";

export interface BadgeTipoUbicacionProps {
  tipo: string;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export function BadgeTipoUbicacion({
  tipo,
  className = "",
  showIcon = true,
  size = "md",
}: BadgeTipoUbicacionProps) {
  const config = getConfigTipo(tipo);
  const Icon = config.icon;

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2",
  }[size];

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border shadow-xs transition-colors ${config.badgeClass} ${sizeStyles} ${className}`}
    >
      {showIcon && <Icon className={`${iconSizes} shrink-0`} aria-hidden="true" />}
      <span>{config.label}</span>
    </span>
  );
}

export default BadgeTipoUbicacion;
