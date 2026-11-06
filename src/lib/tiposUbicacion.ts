import {
  Building2,
  ArrowLeftRight,
  Archive,
  Shuffle,
  Package,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

export type TipoUbicacion = "seccion" | "pasillo" | "armario" | "cross" | "caja" | "reserva";

export interface ConfigTipoUbicacion {
  tipo: TipoUbicacion;
  nivel: 0 | 1 | 2;
  requierePadre: boolean;
  tienePosicionLateral: boolean;
  label: string;
  icon: LucideIcon;
  textColor: string;
  bgColor: string;
  borderColor: string;
  badgeClass: string;
  iconBgClass: string;
  descripcion: string;
}

export const CONFIG_TIPOS: Record<TipoUbicacion, ConfigTipoUbicacion> = {
  seccion: {
    tipo: "seccion",
    nivel: 0,
    requierePadre: false,
    tienePosicionLateral: false,
    label: "Sección",
    icon: Building2,
    textColor: "text-seccion-strong",
    bgColor: "bg-seccion-subtle",
    borderColor: "border-seccion-line",
    badgeClass: "bg-seccion-subtle text-seccion-strong border-seccion-line",
    iconBgClass: "bg-seccion-soft text-seccion-strong border-seccion-line",
    descripcion: "Área general o departamento de la tienda",
  },
  pasillo: {
    tipo: "pasillo",
    nivel: 1,
    requierePadre: true,
    tienePosicionLateral: false,
    label: "Pasillo",
    icon: ArrowLeftRight,
    textColor: "text-info-strong",
    bgColor: "bg-info-subtle",
    borderColor: "border-info-line",
    badgeClass: "bg-info-subtle text-info-strong border-info-line",
    iconBgClass: "bg-info-soft text-info-strong border-info-line",
    descripcion: "Corredor principal con estanterías a ambos lados",
  },
  armario: {
    tipo: "armario",
    nivel: 2,
    requierePadre: true,
    tienePosicionLateral: true,
    label: "Armario",
    icon: Archive,
    textColor: "text-success-strong",
    bgColor: "bg-success-subtle",
    borderColor: "border-success-line",
    badgeClass: "bg-success-subtle text-success-strong border-success-line",
    iconBgClass: "bg-success-soft text-success-strong border-success-line",
    descripcion: "Módulo o gavetero a media altura",
  },
  cross: {
    tipo: "cross",
    nivel: 2,
    requierePadre: true,
    tienePosicionLateral: true,
    label: "Cross",
    icon: Shuffle,
    textColor: "text-cross-strong",
    bgColor: "bg-cross-subtle",
    borderColor: "border-cross-line",
    badgeClass: "bg-cross-subtle text-cross-strong border-cross-line",
    iconBgClass: "bg-cross-soft text-cross-strong border-cross-line",
    descripcion: "Ubicación cruzada o de paso entre pasillos",
  },
  caja: {
    tipo: "caja",
    nivel: 1,
    requierePadre: true,
    tienePosicionLateral: false,
    label: "Caja",
    icon: Package,
    textColor: "text-danger-strong",
    bgColor: "bg-danger-subtle",
    borderColor: "border-danger-line",
    badgeClass: "bg-danger-subtle text-danger-strong border-danger-line",
    iconBgClass: "bg-danger-soft text-danger-strong border-danger-line",
    descripcion: "Contenedor, cajón o cubeta específica",
  },
  reserva: {
    tipo: "reserva",
    nivel: 1,
    requierePadre: true,
    tienePosicionLateral: false,
    label: "Reserva",
    icon: Warehouse,
    textColor: "text-foreground",
    bgColor: "bg-muted",
    borderColor: "border-border",
    badgeClass: "bg-muted text-foreground border-border",
    iconBgClass: "bg-muted text-foreground border-border",
    descripcion: "Zona de almacenamiento en trastienda o almacén",
  },
};

export function getConfigTipo(tipo?: string | null): ConfigTipoUbicacion {
  if (!tipo) return CONFIG_TIPOS.pasillo;
  const key = tipo.toLowerCase().trim() as TipoUbicacion;
  return CONFIG_TIPOS[key] || CONFIG_TIPOS.pasillo;
}

export function getColorLateral(lado?: string | null): {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: string;
} {
  if (lado === "derecha") {
    return {
      label: "DERECHA",
      color: "text-success-strong",
      bg: "bg-success-subtle",
      border: "border-success-line",
      icon: "🟢",
    };
  }
  if (lado === "izquierda") {
    return {
      label: "IZQUIERDA",
      color: "text-info-strong",
      bg: "bg-info-subtle",
      border: "border-info-line",
      icon: "🔵",
    };
  }
  return {
    label: "SIN LATERALIDAD",
    color: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border",
    icon: "⚪",
  };
}
