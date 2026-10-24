import {
  Building2,
  ArrowLeftRight,
  Archive,
  Layers,
  Shuffle,
  Package,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

export type TipoUbicacion =
  "seccion" | "pasillo" | "armario" | "alto" | "cross" | "caja" | "reserva";

export interface ConfigTipoUbicacion {
  tipo: TipoUbicacion;
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
    label: "Armario",
    icon: Archive,
    textColor: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    iconBgClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    descripcion: "Módulo o gavetero a media altura",
  },
  alto: {
    tipo: "alto",
    label: "Alto",
    icon: Layers,
    textColor: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    iconBgClass: "bg-amber-100 text-amber-700 border-amber-200",
    descripcion: "Nivel superior de almacenaje / altillo",
  },
  cross: {
    tipo: "cross",
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
