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
    textColor: "text-indigo-700 dark:text-indigo-300",
    bgColor: "bg-indigo-50 dark:bg-indigo-500/10",
    borderColor: "border-indigo-200 dark:border-indigo-500/30",
    badgeClass: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30",
    iconBgClass: "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30",
    descripcion: "Área general o departamento de la tienda",
  },
  pasillo: {
    tipo: "pasillo",
    nivel: 1,
    requierePadre: true,
    tienePosicionLateral: false,
    label: "Pasillo",
    icon: ArrowLeftRight,
    textColor: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-50 dark:bg-blue-500/10",
    borderColor: "border-blue-200 dark:border-blue-500/30",
    badgeClass: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30",
    iconBgClass: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30",
    descripcion: "Corredor principal con estanterías a ambos lados",
  },
  armario: {
    tipo: "armario",
    nivel: 2,
    requierePadre: true,
    tienePosicionLateral: true,
    label: "Armario",
    icon: Archive,
    textColor: "text-emerald-700 dark:text-emerald-300",
    bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
    borderColor: "border-emerald-200 dark:border-emerald-500/30",
    badgeClass: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30",
    iconBgClass: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30",
    descripcion: "Módulo o gavetero a media altura",
  },
  cross: {
    tipo: "cross",
    nivel: 2,
    requierePadre: true,
    tienePosicionLateral: true,
    label: "Cross",
    icon: Shuffle,
    textColor: "text-purple-700 dark:text-purple-300",
    bgColor: "bg-purple-50 dark:bg-purple-500/10",
    borderColor: "border-purple-200 dark:border-purple-500/30",
    badgeClass: "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30",
    iconBgClass: "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30",
    descripcion: "Ubicación cruzada o de paso entre pasillos",
  },
  caja: {
    tipo: "caja",
    nivel: 1,
    requierePadre: true,
    tienePosicionLateral: false,
    label: "Caja",
    icon: Package,
    textColor: "text-rose-700 dark:text-rose-300",
    bgColor: "bg-rose-50 dark:bg-rose-500/10",
    borderColor: "border-rose-200 dark:border-rose-500/30",
    badgeClass: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30",
    iconBgClass: "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30",
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
      color: "text-green-800 dark:text-green-200",
      bg: "bg-green-50 dark:bg-green-500/10",
      border: "border-green-200 dark:border-green-500/30",
      icon: "🟢",
    };
  }
  if (lado === "izquierda") {
    return {
      label: "IZQUIERDA",
      color: "text-blue-800 dark:text-blue-200",
      bg: "bg-blue-50 dark:bg-blue-500/10",
      border: "border-blue-200 dark:border-blue-500/30",
      icon: "🔵",
    };
  }
  return {
    label: "SIN LATERALIDAD",
    color: "text-foreground",
    bg: "bg-muted",
    border: "border-border",
    icon: "⚪",
  };
}
