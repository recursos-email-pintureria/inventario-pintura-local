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
    textColor: "text-indigo-700",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    iconBgClass: "bg-indigo-100 text-indigo-700 border-indigo-200",
    descripcion: "Área general o departamento de la tienda",
  },
  pasillo: {
    tipo: "pasillo",
    nivel: 1,
    requierePadre: true,
    tienePosicionLateral: false,
    label: "Pasillo",
    icon: ArrowLeftRight,
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    iconBgClass: "bg-blue-100 text-blue-700 border-blue-200",
    descripcion: "Corredor principal con estanterías a ambos lados",
  },
  armario: {
    tipo: "armario",
    nivel: 2,
    requierePadre: true,
    tienePosicionLateral: true,
    label: "Armario",
    icon: Archive,
    textColor: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    iconBgClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    descripcion: "Módulo o gavetero a media altura",
  },
  cross: {
    tipo: "cross",
    nivel: 2,
    requierePadre: true,
    tienePosicionLateral: true,
    label: "Cross",
    icon: Shuffle,
    textColor: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    iconBgClass: "bg-purple-100 text-purple-700 border-purple-200",
    descripcion: "Ubicación cruzada o de paso entre pasillos",
  },
  caja: {
    tipo: "caja",
    nivel: 1,
    requierePadre: true,
    tienePosicionLateral: false,
    label: "Caja",
    icon: Package,
    textColor: "text-rose-700",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    iconBgClass: "bg-rose-100 text-rose-700 border-rose-200",
    descripcion: "Contenedor, cajón o cubeta específica",
  },
  reserva: {
    tipo: "reserva",
    nivel: 1,
    requierePadre: true,
    tienePosicionLateral: false,
    label: "Reserva",
    icon: Warehouse,
    textColor: "text-slate-700",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
    iconBgClass: "bg-slate-100 text-slate-700 border-slate-200",
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
      color: "text-green-800",
      bg: "bg-green-50",
      border: "border-green-200",
      icon: "🟢",
    };
  }
  if (lado === "izquierda") {
    return {
      label: "IZQUIERDA",
      color: "text-blue-800",
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "🔵",
    };
  }
  return {
    label: "SIN LATERALIDAD",
    color: "text-gray-800",
    bg: "bg-gray-50",
    border: "border-gray-200",
    icon: "⚪",
  };
}
