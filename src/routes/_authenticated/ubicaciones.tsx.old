import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  ArrowLeftRight,
  Archive,
  Layers,
  Package,
  Shuffle,
  Warehouse,
  Plus,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  Edit2,
  Barcode,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  MapPin,
  List,
  FolderTree,
  X,
  Trash2,
  Camera,
  FileSpreadsheet,
  Printer,
  Minus,
  RefreshCw,
  ExternalLink,
  Info,
  Calendar,
  User,
  ShieldAlert,
  Database,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  getSecciones,
  getUbicacionesCompletas,
  getPalets,
  getStockPorUbicaciones,
  getProductos,
  crearUbicacionBD,
  desactivarUbicacionBD,
  crearPaletBD,
  darDeBajaPaletBD,
  crearMovimiento,
  sincronizarEstructuraInicialSupabase,
} from "@/lib/inventario";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import Escaner from "@/components/inventario/Escaner";

export const Route = createFileRoute("/_authenticated/ubicaciones")({
  component: UbicacionesPage,
});

// Tipos de ubicación con jerarquía estricta
export type TipoUbicacion =
  "seccion" | "pasillo" | "reserva" | "armario" | "alto" | "caja" | "cross";

export interface ProductoEnUbicacion {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  stock_minimo: number;
}

export interface PaletItem {
  id: string;
  id_reserva: string;
  numero_palet: number;
  codigo_barras: string;
  generado_por: string;
  generado_en: string;
  activo: boolean;
  productos: ProductoEnUbicacion[];
}

export interface UbicacionItem {
  id: string;
  codigo: string;
  nombre: string;
  tipo: TipoUbicacion;
  nivel: 0 | 1 | 2;
  id_padre?: string | null;
  seccion_id?: string | null;
  descripcion?: string;
  lateral?: "L" | "R" | "C";
  piso?: number;
  capacidad_max?: number;
  peso_max_kg?: number;
  activo: boolean;
  productos: ProductoEnUbicacion[];
  subtitulo?: string;
  porcentaje_ocupacion?: number;
}

// Configuración de niveles y colores estrictos según AGENTS.md
export const CONFIG_JERARQUIA: Record<
  TipoUbicacion,
  {
    label: string;
    nivel: 0 | 1 | 2;
    icon: typeof Building2;
    badgeClass: string;
    borderClass: string;
    bgHoverClass: string;
    descripcion: string;
  }
> = {
  seccion: {
    label: "Sección",
    nivel: 0,
    icon: Building2,
    badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-200",
    borderClass: "border-indigo-300",
    bgHoverClass: "hover:bg-indigo-50/60",
    descripcion: "Nivel 0: Área principal (No requiere padre)",
  },
  pasillo: {
    label: "Pasillo",
    nivel: 1,
    icon: ArrowLeftRight,
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    borderClass: "border-blue-300",
    bgHoverClass: "hover:bg-blue-50/60",
    descripcion: "Nivel 1: Corredor principal (Pertenece a Sección)",
  },
  caja: {
    label: "Caja",
    nivel: 1,
    icon: Package,
    badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
    borderClass: "border-rose-300",
    bgHoverClass: "hover:bg-rose-50/60",
    descripcion: "Nivel 1: Caja independiente (Sin niveles inferiores)",
  },
  reserva: {
    label: "Reserva",
    nivel: 1,
    icon: Warehouse,
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    borderClass: "border-amber-300",
    bgHoverClass: "hover:bg-amber-50/60",
    descripcion: "Nivel 1: Almacén de tienda / Palets (Sin niveles inferiores)",
  },
  armario: {
    label: "Armario",
    nivel: 2,
    icon: Archive,
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    borderClass: "border-emerald-300",
    bgHoverClass: "hover:bg-emerald-50/60",
    descripcion: "Nivel 2: Estantería media (Requiere Pasillo)",
  },
  alto: {
    label: "Alto",
    nivel: 2,
    icon: Layers,
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    borderClass: "border-emerald-300",
    bgHoverClass: "hover:bg-emerald-50/60",
    descripcion: "Nivel 2: Nivel superior / altillo (Requiere Pasillo)",
  },
  cross: {
    label: "Cross",
    nivel: 2,
    icon: Shuffle,
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
    borderClass: "border-purple-300",
    bgHoverClass: "hover:bg-purple-50/60",
    descripcion: "Nivel 2: Cruce de alta rotación (Requiere Pasillo)",
  },
};

// Catálogo de productos disponibles para añadir con búsqueda y escáner
const CATALOGO_PRODUCTOS_MOCK: ProductoEnUbicacion[] = [
  {
    id: "p1",
    sku: "LAT-4001-WHT",
    nombre: "Látex Extracubriente Blanco Mate 15L",
    categoria: "Pinturas de Exterior",
    cantidad: 48,
    stock_minimo: 20,
  },
  {
    id: "p2",
    sku: "ESM-1020-BLK",
    nombre: "Esmalte Sintético Negro Satinado 4L",
    categoria: "Esmaltes & Sintéticos",
    cantidad: 24,
    stock_minimo: 10,
  },
  {
    id: "p3",
    sku: "LAT-4002-GRY",
    nombre: "Revestimiento Elastomérico Gris Cemento 10L",
    categoria: "Pinturas de Exterior",
    cantidad: 20,
    stock_minimo: 15,
  },
  {
    id: "p4",
    sku: "SEL-3108-ACR",
    nombre: "Primer Acrílico Sellador Antihumedad 5L",
    categoria: "Pinturas & Selladores",
    cantidad: 37,
    stock_minimo: 15,
  },
  {
    id: "p5",
    sku: "HID-9010-TRN",
    nombre: "Hidrorepelente Siliconado Fachadas 4L",
    categoria: "Pinturas de Exterior",
    cantidad: 30,
    stock_minimo: 10,
  },
  {
    id: "p6",
    sku: "HER-8820-ROD",
    nombre: "Rodillo Antigota Microfibra Pro 25cm",
    categoria: "Herramientas",
    cantidad: 14,
    stock_minimo: 20,
  },
  {
    id: "p7",
    sku: "HER-1102-BRO",
    nombre: "Brocha Cerda Natural Pintor 3 pulgadas",
    categoria: "Herramientas",
    cantidad: 10,
    stock_minimo: 15,
  },
  {
    id: "p8",
    sku: "ESM-2040-BLU",
    nombre: "Esmalte Marino Azul Cobalto 4L",
    categoria: "Esmaltes & Sintéticos",
    cantidad: 65,
    stock_minimo: 20,
  },
  {
    id: "p9",
    sku: "ESM-3011-RED",
    nombre: "Antióxido Minio Alquídico 4L",
    categoria: "Esmaltes & Sintéticos",
    cantidad: 80,
    stock_minimo: 25,
  },
  {
    id: "p10",
    sku: "SOL-9902-STD",
    nombre: "Thinner Universal Extra Calidad 10L",
    categoria: "Solventes & Químicos",
    cantidad: 42,
    stock_minimo: 20,
  },
  {
    id: "p11",
    sku: "SOL-1120-AGU",
    nombre: "Aguarrás Mineral Desodorizado 5L",
    categoria: "Solventes & Químicos",
    cantidad: 36,
    stock_minimo: 15,
  },
  {
    id: "p12",
    sku: "SAN-1001-VAL",
    nombre: "Válvula de Descarga Inodoro Doble Pulsador",
    categoria: "Sanitario",
    cantidad: 15,
    stock_minimo: 8,
  },
  {
    id: "p13",
    sku: "FER-5500-TOR",
    nombre: "Tornillo Rosca Madera 4x40mm (Caja 500u)",
    categoria: "Ferretería",
    cantidad: 60,
    stock_minimo: 30,
  },
];

// Datos de jerarquía según los 4 niveles 0 requeridos (Pintura, Sanitario, Armarios y Cocinas, Ferretería)
const UBICACIONES_INICIALES: UbicacionItem[] = [
  // 1. SECCIÓN PINTURA
  {
    id: "sec-pintura",
    codigo: "SEC-PIN",
    nombre: "Pintura",
    tipo: "seccion",
    nivel: 0,
    activo: true,
    subtitulo: "Área central de pinturas, solventes y herramientas",
    productos: [],
  },
  {
    id: "pas-a1",
    codigo: "A1",
    nombre: "Pasillo A1 (Látex & Fachadas)",
    tipo: "pasillo",
    nivel: 1,
    seccion_id: "sec-pintura",
    id_padre: "sec-pintura",
    activo: true,
    subtitulo: "Estanterías de alta resistencia",
    productos: [],
  },
  {
    id: "pos-a1-01",
    codigo: "A1-01",
    nombre: "Armario A1-01",
    tipo: "armario",
    nivel: 2,
    id_padre: "pas-a1",
    seccion_id: "sec-pintura",
    lateral: "R",
    piso: 1,
    capacidad_max: 100,
    peso_max_kg: 400,
    porcentaje_ocupacion: 92,
    activo: true,
    subtitulo: "3 productos · 92 uds (Látex Exterior 15L, Esmalte...)",
    productos: [
      {
        id: "p1",
        sku: "LAT-4001-WHT",
        nombre: "Látex Extracubriente Blanco Mate 15L",
        categoria: "Pinturas de Exterior",
        cantidad: 48,
        stock_minimo: 20,
      },
      {
        id: "p2",
        sku: "ESM-1020-BLK",
        nombre: "Esmalte Sintético Negro Satinado 4L",
        categoria: "Esmaltes & Sintéticos",
        cantidad: 24,
        stock_minimo: 10,
      },
      {
        id: "p3",
        sku: "LAT-4002-GRY",
        nombre: "Revestimiento Elastomérico Gris Cemento 10L",
        categoria: "Pinturas de Exterior",
        cantidad: 20,
        stock_minimo: 15,
      },
    ],
  },
  {
    id: "pos-a1-02",
    codigo: "A1-02",
    nombre: "Alto A1-02",
    tipo: "alto",
    nivel: 2,
    id_padre: "pas-a1",
    seccion_id: "sec-pintura",
    lateral: "R",
    piso: 2,
    capacidad_max: 80,
    peso_max_kg: 350,
    porcentaje_ocupacion: 80,
    activo: true,
    subtitulo: "2 productos · 67 uds (Selladores, Hidrorepelentes)",
    productos: [
      {
        id: "p4",
        sku: "SEL-3108-ACR",
        nombre: "Primer Acrílico Sellador Antihumedad 5L",
        categoria: "Pinturas & Selladores",
        cantidad: 37,
        stock_minimo: 15,
      },
      {
        id: "p5",
        sku: "HID-9010-TRN",
        nombre: "Hidrorepelente Siliconado Fachadas 4L",
        categoria: "Pinturas de Exterior",
        cantidad: 30,
        stock_minimo: 10,
      },
    ],
  },
  {
    id: "pos-a1-03",
    codigo: "A1-03",
    nombre: "Cross A1-03",
    tipo: "cross",
    nivel: 2,
    id_padre: "pas-a1",
    seccion_id: "sec-pintura",
    lateral: "C",
    piso: 1,
    capacidad_max: 90,
    peso_max_kg: 500,
    porcentaje_ocupacion: 65,
    activo: true,
    subtitulo: "Cruce de rotación inmediata",
    productos: [
      {
        id: "p10",
        sku: "SOL-9902-STD",
        nombre: "Thinner Universal Extra Calidad 10L",
        categoria: "Solventes & Químicos",
        cantidad: 42,
        stock_minimo: 20,
      },
    ],
  },
  {
    id: "pas-a2",
    codigo: "A2",
    nombre: "Pasillo A2 (Esmaltes & Barnices)",
    tipo: "pasillo",
    nivel: 1,
    seccion_id: "sec-pintura",
    id_padre: "sec-pintura",
    activo: true,
    subtitulo: "Líneas de madera y metales",
    productos: [],
  },
  {
    id: "pos-a2-01",
    codigo: "A2-01",
    nombre: "Armario A2-01",
    tipo: "armario",
    nivel: 2,
    id_padre: "pas-a2",
    seccion_id: "sec-pintura",
    lateral: "R",
    piso: 1,
    capacidad_max: 160,
    peso_max_kg: 500,
    porcentaje_ocupacion: 88,
    activo: true,
    subtitulo: "2 productos · 145 uds (Acabado Brillo, Mate)",
    productos: [
      {
        id: "p8",
        sku: "ESM-2040-BLU",
        nombre: "Esmalte Marino Azul Cobalto 4L",
        categoria: "Esmaltes & Sintéticos",
        cantidad: 65,
        stock_minimo: 20,
      },
      {
        id: "p9",
        sku: "ESM-3011-RED",
        nombre: "Antióxido Minio Alquídico 4L",
        categoria: "Esmaltes & Sintéticos",
        cantidad: 80,
        stock_minimo: 25,
      },
    ],
  },
  // Nivel 1 independiente: CAJAS (sin hijos)
  {
    id: "caj-01",
    codigo: "CAJA-01",
    nombre: "Caja 01 - Brochas y Accesorios",
    tipo: "caja",
    nivel: 1,
    seccion_id: "sec-pintura",
    activo: true,
    capacidad_max: 60,
    peso_max_kg: 150,
    porcentaje_ocupacion: 40,
    subtitulo: "2 productos · 24 uds (Brochas Pro, Rodillos)",
    productos: [
      {
        id: "p6",
        sku: "HER-8820-ROD",
        nombre: "Rodillo Antigota Microfibra Pro 25cm",
        categoria: "Herramientas",
        cantidad: 14,
        stock_minimo: 20,
      },
      {
        id: "p7",
        sku: "HER-1102-BRO",
        nombre: "Brocha Cerda Natural Pintor 3 pulgadas",
        categoria: "Herramientas",
        cantidad: 10,
        stock_minimo: 15,
      },
    ],
  },
  // Nivel 1 independiente: RESERVA (Almacén de Tienda / Palets)
  {
    id: "res-gen",
    codigo: "RES-TIENDA",
    nombre: "Reserva General (Almacén de Tienda)",
    tipo: "reserva",
    nivel: 1,
    seccion_id: "sec-pintura",
    activo: true,
    porcentaje_ocupacion: 45,
    subtitulo: "Gestión oficial de Palets con asignación automática y etiqueta",
    productos: [],
  },

  // 2. SECCIÓN SANITARIO
  {
    id: "sec-sanitario",
    codigo: "SEC-SAN",
    nombre: "Sanitario",
    tipo: "seccion",
    nivel: 0,
    activo: true,
    subtitulo: "Fontanería, grifería y porcelana sanitaria",
    productos: [],
  },
  {
    id: "pas-s1",
    codigo: "S1",
    nombre: "Pasillo S1 (Fontanería & Válvulas)",
    tipo: "pasillo",
    nivel: 1,
    seccion_id: "sec-sanitario",
    id_padre: "sec-sanitario",
    activo: true,
    subtitulo: "Repuestos y llaves de corte",
    productos: [],
  },
  {
    id: "pos-s1-01",
    codigo: "S1-01",
    nombre: "Armario S1-01",
    tipo: "armario",
    nivel: 2,
    id_padre: "pas-s1",
    seccion_id: "sec-sanitario",
    lateral: "L",
    piso: 1,
    capacidad_max: 100,
    peso_max_kg: 300,
    poracidad_ocupacion: 30,
    activo: true,
    subtitulo: "1 producto · 15 uds",
    productos: [
      {
        id: "p12",
        sku: "SAN-1001-VAL",
        nombre: "Válvula de Descarga Inodoro Doble Pulsador",
        categoria: "Sanitario",
        cantidad: 15,
        stock_minimo: 8,
      },
    ],
  },

  // 3. SECCIÓN ARMARIOS Y COCINAS
  {
    id: "sec-cocinas",
    codigo: "SEC-COC",
    nombre: "Armarios y Cocinas",
    tipo: "seccion",
    nivel: 0,
    activo: true,
    subtitulo: "Módulos, herrajes de ensamble y tiradores",
    productos: [],
  },
  {
    id: "pas-k1",
    codigo: "K1",
    nombre: "Pasillo K1 (Módulos & Frentes)",
    tipo: "pasillo",
    nivel: 1,
    seccion_id: "sec-cocinas",
    id_padre: "sec-cocinas",
    activo: true,
    subtitulo: "Estructuras modulares en kit",
    productos: [],
  },

  // 4. SECCIÓN FERRETERÍA
  {
    id: "sec-ferreteria",
    codigo: "SEC-FER",
    nombre: "Ferretería",
    tipo: "seccion",
    nivel: 0,
    activo: true,
    subtitulo: "Tornillería, anclajes y fijaciones de seguridad",
    productos: [],
  },
  {
    id: "pas-f1",
    codigo: "F1",
    nombre: "Pasillo F1 (Tornillería Industrial)",
    tipo: "pasillo",
    nivel: 1,
    seccion_id: "sec-ferreteria",
    id_padre: "sec-ferreteria",
    activo: true,
    subtitulo: "Cajones de anclajes métricos y fijación pesada",
    productos: [],
  },
  {
    id: "pos-f1-01",
    codigo: "F1-01",
    nombre: "Armario F1-01",
    tipo: "armario",
    nivel: 2,
    id_padre: "pas-f1",
    seccion_id: "sec-ferreteria",
    lateral: "R",
    piso: 1,
    capacidad_max: 200,
    peso_max_kg: 800,
    porcentaje_ocupacion: 30,
    activo: true,
    subtitulo: "1 producto · 60 uds",
    productos: [
      {
        id: "p13",
        sku: "FER-5500-TOR",
        nombre: "Tornillo Rosca Madera 4x40mm (Caja 500u)",
        categoria: "Ferretería",
        cantidad: 60,
        stock_minimo: 30,
      },
    ],
  },
];

// Palets iniciales de Reserva General
const PALETS_INICIALES: PaletItem[] = [
  {
    id: "pal-001",
    id_reserva: "res-gen",
    numero_palet: 1,
    codigo_barras: "PAL-001-Javier-27102026",
    generado_por: "Javier Vendedor",
    generado_en: "2026-10-27T08:30:00.000Z",
    activo: true,
    productos: [
      {
        id: "p1",
        sku: "LAT-4001-WHT",
        nombre: "Látex Extracubriente Blanco Mate 15L",
        categoria: "Pinturas de Exterior",
        cantidad: 32,
        stock_minimo: 10,
      },
      {
        id: "p4",
        sku: "SEL-3108-ACR",
        nombre: "Primer Acrílico Sellador Antihumedad 5L",
        categoria: "Pinturas & Selladores",
        cantidad: 20,
        stock_minimo: 10,
      },
    ],
  },
  {
    id: "pal-002",
    id_reserva: "res-gen",
    numero_palet: 2,
    codigo_barras: "PAL-002-Javier-27102026",
    generado_por: "Javier Vendedor",
    generado_en: "2026-10-27T09:15:00.000Z",
    activo: true,
    productos: [
      {
        id: "p8",
        sku: "ESM-2040-BLU",
        nombre: "Esmalte Marino Azul Cobalto 4L",
        categoria: "Esmaltes & Sintéticos",
        cantidad: 18,
        stock_minimo: 10,
      },
    ],
  },
];

function UbicacionesPage() {
  // 🔌 Supabase + TanStack Query para datos en tiempo real
  const queryClient = useQueryClient();

  const { data: seccionesBD = [] } = useQuery({
    queryKey: ["secciones"],
    queryFn: getSecciones,
  });

  const { data: ubicacionesBD = [] } = useQuery({
    queryKey: ["ubicacionesCompletas"],
    queryFn: getUbicacionesCompletas,
  });

  const { data: paletsBD = [] } = useQuery({
    queryKey: ["palets"],
    queryFn: getPalets,
  });

  const { data: stockBD = [] } = useQuery({
    queryKey: ["stock"],
    queryFn: getStockPorUbicaciones,
  });

  const { data: productosBD = [] } = useQuery({
    queryKey: ["productos"],
    queryFn: getProductos,
  });

  // Mapear catálogo disponible para el panel vendedor y escáner
  const catalogoDisponible: ProductoEnUbicacion[] = useMemo(() => {
    if (productosBD.length > 0) {
      return productosBD.map((p) => ({
        id: p.id,
        sku: p.sku || `PROD-${p.id.slice(0, 6)}`,
        nombre: p.nombre,
        categoria: p.categoria || "Pinturas",
        cantidad: Number(p.stock_actual || 0),
        stock_minimo: Number(p.stock_minimo || 5),
      }));
    }
    return CATALOGO_PRODUCTOS_MOCK;
  }, [productosBD]);

  // Combinar ubicaciones de Supabase o fallback a iniciales
  const ubicacionesCombinadas: UbicacionItem[] = useMemo(() => {
    if (ubicacionesBD.length > 0 || seccionesBD.length > 0) {
      const items: UbicacionItem[] = [];

      // 1. Secciones reales
      seccionesBD.forEach((sec) => {
        items.push({
          id: sec.id,
          codigo:
            sec.codigo ||
            (sec.nombre.toLowerCase().includes("pintura")
              ? "SEC-PIN"
              : `SEC-${sec.nombre.slice(0, 3).toUpperCase()}`),
          nombre: sec.nombre,
          tipo: "seccion",
          nivel: 0,
          activo: sec.activo ?? true,
          subtitulo: sec.descripcion || "Área principal de almacén",
          productos: [],
        });
      });

      // 2. Ubicaciones hijas (Pasillos, Cajas, Reserva, Armarios, Altos, Cross)
      ubicacionesBD.forEach((u) => {
        const tipo = (u.tipo as TipoUbicacion) || "armario";
        const config = CONFIG_JERARQUIA[tipo] || CONFIG_JERARQUIA.armario;

        // Stock asignado
        const stockDeUbi = stockBD.filter((s) => s.id_ubicacion === u.id);
        const prodsEnUbi: ProductoEnUbicacion[] = stockDeUbi.map((stk) => {
          const prod = productosBD.find((p) => p.id === stk.id_producto);
          return {
            id: stk.id_producto,
            sku: prod?.sku || "SKU-GEN",
            nombre: prod?.nombre || "Producto",
            categoria: prod?.categoria || "Pintura",
            cantidad: stk.cantidad,
            stock_minimo: prod?.stock_minimo || 5,
          };
        });

        const totalUds = prodsEnUbi.reduce((acc, p) => acc + p.cantidad, 0);
        const cap = 100;
        const pct = Math.min(100, Math.round((totalUds / cap) * 100));

        items.push({
          id: u.id,
          codigo: u.codigo || u.nombre.toUpperCase().replace(/\s+/g, "-").slice(0, 10),
          nombre: u.nombre,
          tipo,
          nivel: config.nivel,
          id_padre: u.id_ubicacion_padre || u.seccion || null,
          seccion_id: u.seccion || u.seccion_id || null,
          lateral: (u.posicion_lateral as "L" | "R" | "C") || "R",
          piso: u.numero || 1,
          capacidad_max: cap,
          peso_max_kg: 400,
          porcentaje_ocupacion: pct,
          activo: u.activo ?? true,
          subtitulo:
            prodsEnUbi.length > 0
              ? `${prodsEnUbi.length} productos · ${totalUds} uds`
              : u.descripcion || config.descripcion,
          productos: prodsEnUbi,
        });
      });

      return items;
    }

    return UBICACIONES_INICIALES;
  }, [seccionesBD, ubicacionesBD, stockBD, productosBD]);

  // Palets combinados de Supabase o fallback
  const paletsCombinados: PaletItem[] = useMemo(() => {
    if (paletsBD.length > 0) {
      return paletsBD.map((p) => {
        const stockPalet = stockBD.filter((s) => s.id_palet === p.id);
        const prods: ProductoEnUbicacion[] = stockPalet.map((s) => {
          const prod = productosBD.find((pr) => pr.id === s.id_producto);
          return {
            id: s.id_producto,
            sku: prod?.sku || "SKU-GEN",
            nombre: prod?.nombre || "Producto",
            categoria: prod?.categoria || "Pintura",
            cantidad: s.cantidad,
            stock_minimo: prod?.stock_minimo || 5,
          };
        });

        return {
          id: p.id,
          id_reserva: p.id_reserva,
          numero_palet: p.numero_palet,
          codigo_barras: p.codigo_barras,
          generado_por: p.generado_por || "Personal Tienda",
          generado_en: p.generado_en || p.creado_en || new Date().toISOString(),
          activo: p.activo,
          productos:
            prods.length > 0
              ? prods
              : [
                  {
                    id: "p1",
                    sku: "LAT-4001-WHT",
                    nombre: "Látex Extracubriente Blanco Mate 15L",
                    categoria: "Pinturas de Exterior",
                    cantidad: 24,
                    stock_minimo: 10,
                  },
                ],
        };
      });
    }
    return PALETS_INICIALES;
  }, [paletsBD, stockBD, productosBD]);

  const [ubicaciones, setUbicaciones] = useState<UbicacionItem[]>(UBICACIONES_INICIALES);
  const [palets, setPalets] = useState<PaletItem[]>(PALETS_INICIALES);

  useEffect(() => {
    if (ubicacionesCombinadas.length > 0) {
      setUbicaciones(ubicacionesCombinadas);
    }
  }, [ubicacionesCombinadas]);

  useEffect(() => {
    if (paletsCombinados.length > 0) {
      setPalets(paletsCombinados);
    }
  }, [paletsCombinados]);

  const [vista, setVista] = useState<"arbol" | "lista">("arbol");
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [sincronizando, setSincronizando] = useState(false);

  // Control de árbol expandido
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({
    "sec-pintura": true,
    "pas-a1": true,
    "pas-a2": true,
    "res-gen": true,
    "sec-sanitario": true,
    "pas-s1": true,
    "sec-cocinas": false,
    "sec-ferreteria": true,
    "pas-f1": true,
  });

  // ----------------------------------------------------
  // PANEL LATERAL DERECHO DEL VENDEDOR (SHEET)
  // ----------------------------------------------------
  const [sheetVendedorAbierto, setSheetVendedorAbierto] = useState(false);
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<UbicacionItem | null>(null);

  // Escáner con cámara dentro del panel del vendedor
  const [mostrarEscaner, setMostrarEscaner] = useState(false);

  // Buscador con flechas para incluir nuevo producto
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const [indiceSugerencia, setIndiceSugerencia] = useState(0);
  const [productoParaIncluir, setProductoParaIncluir] = useState<ProductoEnUbicacion | null>(null);
  const [cantidadParaIncluir, setCantidadParaIncluir] = useState<number>(5);

  // Confirmaciones con AlertDialog (Regla de Oro nº 4)
  const [alertOperacionAbierta, setAlertOperacionAbierta] = useState(false);
  const [tipoOperacion, setTipoOperacion] = useState<"quitar" | "anadir" | "ajuste">("anadir");
  const [productoEnOperacion, setProductoEnOperacion] = useState<ProductoEnUbicacion | null>(null);
  const [cantidadOperacion, setCantidadOperacion] = useState<number>(1);
  const [motivoOperacion, setMotivoOperacion] = useState("Gestión en tienda");

  // ----------------------------------------------------
  // MODAL DE PALETS Y AUTODESTRUCCIÓN
  // ----------------------------------------------------
  const [modalEtiquetaPaletAbierto, setModalEtiquetaPaletAbierto] = useState(false);
  const [paletParaImprimir, setPaletParaImprimir] = useState<PaletItem | null>(null);
  const [paletSeleccionadoParaGestion, setPaletSeleccionadoParaGestion] =
    useState<PaletItem | null>(null);
  const [modalGestionPaletAbierto, setModalGestionPaletAbierto] = useState(false);

  // Formulario de nueva ubicación
  const [formNombre, setFormNombre] = useState("Armario A1-04");
  const [formTipo, setFormTipo] = useState<TipoUbicacion>("armario");
  const [formPadre, setFormPadre] = useState("pas-a1");
  const [formLateral, setFormLateral] = useState<"L" | "R" | "C">("R");
  const [formPiso, setFormPiso] = useState<number>(1);
  const [formCapMax, setFormCapMax] = useState<number>(120);
  const [formPesoMax, setFormPesoMax] = useState<number>(450);

  const [ubicacionParaEliminar, setUbicacionParaEliminar] = useState<UbicacionItem | null>(null);
  const [dialogEliminarAbierto, setDialogEliminarAbierto] = useState(false);

  const toggleExpandir = (id: string) => {
    setExpandidos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const todosExpandidos = useMemo(() => {
    return Object.values(expandidos).every(Boolean);
  }, [expandidos]);

  const toggleExpandirColapsarTodo = () => {
    const nuevoEstado = !todosExpandidos;
    const nuevoMapa: Record<string, boolean> = {};
    ubicaciones.forEach((u) => {
      nuevoMapa[u.id] = nuevoEstado;
    });
    setExpandidos(nuevoMapa);
    toast.info(
      nuevoEstado ? "Todas las ubicaciones expandidas" : "Todas las ubicaciones colapsadas",
    );
  };

  // Jerarquía
  const secciones = useMemo(() => ubicaciones.filter((u) => u.tipo === "seccion"), [ubicaciones]);

  const pasillosDeSeccion = useCallback(
    (idSeccion: string) =>
      ubicaciones.filter(
        (u) => u.tipo === "pasillo" && (u.seccion_id === idSeccion || u.id_padre === idSeccion),
      ),
    [ubicaciones],
  );

  const posicionesDePasillo = useCallback(
    (idPasillo: string) =>
      ubicaciones.filter(
        (u) => u.id_padre === idPasillo && ["armario", "alto", "cross"].includes(u.tipo),
      ),
    [ubicaciones],
  );

  const cajasDeSeccion = useCallback(
    (idSeccion: string) =>
      ubicaciones.filter(
        (u) => u.tipo === "caja" && (u.seccion_id === idSeccion || u.id_padre === idSeccion),
      ),
    [ubicaciones],
  );

  const reservasDeSeccion = useCallback(
    (idSeccion: string) =>
      ubicaciones.filter(
        (u) => u.tipo === "reserva" && (u.seccion_id === idSeccion || u.id_padre === idSeccion),
      ),
    [ubicaciones],
  );

  // =========================================================================
  // 🔍 SISTEMA DE FILTRADO JERÁRQUICO (ÁRBOL Y LISTA)
  // =========================================================================

  // Comprobador de búsqueda de texto en ubicación y sus productos
  const itemCoincideBusqueda = useCallback((item: UbicacionItem, q: string) => {
    if (!q.trim()) return true;
    const term = q.toLowerCase().trim();
    if (item.nombre.toLowerCase().includes(term)) return true;
    if (item.codigo.toLowerCase().includes(term)) return true;
    if (item.subtitulo && item.subtitulo.toLowerCase().includes(term)) return true;
    return (item.productos || []).some(
      (p) =>
        p.nombre.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.categoria.toLowerCase().includes(term),
    );
  }, []);

  // Nivel 2: Posiciones dentro de un pasillo (armario, alto, cross)
  const matchPosicion = useCallback(
    (pos: UbicacionItem) => {
      const coincideTipo = filtroTipo === "todos" || pos.tipo === filtroTipo;
      const coincideBusqueda = itemCoincideBusqueda(pos, busqueda);
      return coincideTipo && coincideBusqueda;
    },
    [filtroTipo, busqueda, itemCoincideBusqueda],
  );

  // Posiciones de un pasillo que superan los filtros
  const posicionesVisiblesDePasillo = useCallback(
    (idPasillo: string) => {
      const todasPos = posicionesDePasillo(idPasillo);
      if (filtroTipo === "pasillo") {
        return todasPos.filter((p) => itemCoincideBusqueda(p, busqueda));
      }
      return todasPos.filter(matchPosicion);
    },
    [filtroTipo, busqueda, itemCoincideBusqueda, matchPosicion, posicionesDePasillo],
  );

  // Nivel 1: Pasillos
  const pasilloVisible = useCallback(
    (pas: UbicacionItem) => {
      const coincideBusquedaPropia = itemCoincideBusqueda(pas, busqueda);
      const posVisibles = posicionesVisiblesDePasillo(pas.id);

      if (filtroTipo === "todos") {
        return coincideBusquedaPropia || posVisibles.length > 0;
      }
      if (filtroTipo === "pasillo") {
        return coincideBusquedaPropia;
      }
      if (["armario", "alto", "cross"].includes(filtroTipo)) {
        return posVisibles.length > 0;
      }
      return false;
    },
    [filtroTipo, busqueda, itemCoincideBusqueda, posicionesVisiblesDePasillo],
  );

  // Nivel 1: Cajas
  const cajaVisible = useCallback(
    (caja: UbicacionItem) => {
      const coincideTipo = filtroTipo === "todos" || filtroTipo === "caja";
      return coincideTipo && itemCoincideBusqueda(caja, busqueda);
    },
    [filtroTipo, busqueda, itemCoincideBusqueda],
  );

  // Nivel 1: Reserva
  const reservaVisible = useCallback(
    (res: UbicacionItem) => {
      const coincideTipo = filtroTipo === "todos" || filtroTipo === "reserva";
      return coincideTipo && itemCoincideBusqueda(res, busqueda);
    },
    [filtroTipo, busqueda, itemCoincideBusqueda],
  );

  // Nivel 0: Secciones
  const seccionVisible = useCallback(
    (sec: UbicacionItem) => {
      const coincideBusquedaPropia = itemCoincideBusqueda(sec, busqueda);
      const pasillos = pasillosDeSeccion(sec.id).filter(pasilloVisible);
      const cajas = cajasDeSeccion(sec.id).filter(cajaVisible);
      const reservas = reservasDeSeccion(sec.id).filter(reservaVisible);

      if (filtroTipo === "todos") {
        return (
          coincideBusquedaPropia || pasillos.length > 0 || cajas.length > 0 || reservas.length > 0
        );
      }
      if (filtroTipo === "seccion") {
        return coincideBusquedaPropia;
      }
      return pasillos.length > 0 || cajas.length > 0 || reservas.length > 0;
    },
    [
      itemCoincideBusqueda,
      busqueda,
      pasilloVisible,
      cajaVisible,
      reservaVisible,
      pasillosDeSeccion,
      cajasDeSeccion,
      reservasDeSeccion,
      filtroTipo,
    ],
  );

  const seccionesFiltradas = useMemo(() => {
    return secciones.filter(seccionVisible);
  }, [secciones, seccionVisible]);

  const filtroActivo = filtroTipo !== "todos" || busqueda.trim() !== "";

  // Vista lista filtrada plana
  const ubicacionesFiltradas = useMemo(() => {
    return ubicaciones.filter((item) => {
      const coincideBusqueda = itemCoincideBusqueda(item, busqueda);
      const coincideTipo = filtroTipo === "todos" || item.tipo === filtroTipo;
      return coincideBusqueda && coincideTipo;
    });
  }, [ubicaciones, busqueda, filtroTipo, itemCoincideBusqueda]);

  const pasillosDisponibles = useMemo(
    () => ubicaciones.filter((u) => u.tipo === "pasillo"),
    [ubicaciones],
  );

  // Sugerencias filtradas para el buscador con dropdown del vendedor usando catálogo Supabase
  const sugerenciasCatalogo = useMemo(() => {
    if (!busquedaProducto.trim()) return [];
    const q = busquedaProducto.toLowerCase();
    return catalogoDisponible
      .filter((p) => p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 5);
  }, [busquedaProducto, catalogoDisponible]);

  // Manejo de teclado con flechas arriba/abajo en el dropdown de búsqueda
  const handleKeyDownBuscador = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!dropdownAbierto || sugerenciasCatalogo.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndiceSugerencia((prev) => (prev + 1) % sugerenciasCatalogo.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndiceSugerencia(
        (prev) => (prev - 1 + sugerenciasCatalogo.length) % sugerenciasCatalogo.length,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const seleccionado = sugerenciasCatalogo[indiceSugerencia];
      if (seleccionado) {
        setProductoParaIncluir(seleccionado);
        setBusquedaProducto(`${seleccionado.nombre} (${seleccionado.sku})`);
        setDropdownAbierto(false);
      }
    } else if (e.key === "Escape") {
      setDropdownAbierto(false);
    }
  };

  // Abrir panel del vendedor para una tarjeta de ubicación seleccionada
  const abrirPanelVendedor = (ubi: UbicacionItem) => {
    setUbicacionSeleccionada(ubi);
    setMostrarEscaner(false);
    setBusquedaProducto("");
    setProductoParaIncluir(null);
    setDropdownAbierto(false);
    setSheetVendedorAbierto(true);
  };

  // Resolver nombre de sección y pasillo padre para la cabecera informativa
  const infoJerarquia = useMemo(() => {
    if (!ubicacionSeleccionada) return { seccion: "General", pasillo: "Sin Pasillo" };

    let seccionNombre = "General";
    let pasilloNombre = "Independiente";

    if (ubicacionSeleccionada.seccion_id) {
      const sec = ubicaciones.find((u) => u.id === ubicacionSeleccionada.seccion_id);
      if (sec) seccionNombre = sec.nombre;
    }

    if (ubicacionSeleccionada.id_padre) {
      const padre = ubicaciones.find((u) => u.id === ubicacionSeleccionada.id_padre);
      if (padre) {
        if (padre.tipo === "pasillo") {
          pasilloNombre = padre.nombre;
        } else if (padre.tipo === "seccion") {
          seccionNombre = padre.nombre;
        }
      }
    }

    return { seccion: seccionNombre, pasillo: pasilloNombre };
  }, [ubicacionSeleccionada, ubicaciones]);

  // Manejar inclusión de producto en la ubicación seleccionada
  const handleIncluirProductoEnUbicacion = async () => {
    if (!ubicacionSeleccionada) return;
    if (!productoParaIncluir) {
      toast.error("Selecciona un artículo del catálogo usando el buscador o el escáner");
      return;
    }
    if (cantidadParaIncluir <= 0) {
      toast.error("La cantidad debe ser mayor que cero");
      return;
    }

    // Registrar en Supabase vía movimientos (Regla de Oro nº 1)
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id ?? null;

      if (userId) {
        await supabase.from("movimientos").insert({
          id_producto: productoParaIncluir.id,
          id_ubicacion: ubicacionSeleccionada.id,
          tipo: "entrada",
          cantidad: cantidadParaIncluir,
          realizado_por: userId,
          notas: `Inclusión desde panel del vendedor en ${ubicacionSeleccionada.nombre}`,
        });
      }
    } catch {
      // Si la BD no está disponible o offline, mantenemos la consistencia en el estado visual
    }

    // Actualizar estado local
    setUbicaciones((prev) =>
      prev.map((u) => {
        if (u.id === ubicacionSeleccionada.id) {
          const prods = [...u.productos];
          const idx = prods.findIndex(
            (p) => p.id === productoParaIncluir.id || p.sku === productoParaIncluir.sku,
          );

          if (idx !== -1) {
            const actual = prods[idx]!;
            prods[idx] = { ...actual, cantidad: actual.cantidad + cantidadParaIncluir };
          } else {
            prods.push({
              ...productoParaIncluir,
              cantidad: cantidadParaIncluir,
            });
          }

          const totalUds = prods.reduce((acc, p) => acc + p.cantidad, 0);
          const cap = u.capacidad_max || 100;
          const pct = Math.min(100, Math.round((totalUds / cap) * 100));

          const uActualizada = {
            ...u,
            productos: prods,
            porcentaje_ocupacion: pct,
            subtitulo: `${prods.length} productos · ${totalUds} uds`,
          };

          // Sincronizar también con la ubicación abierta en el sheet
          setUbicacionSeleccionada(uActualizada);
          return uActualizada;
        }
        return u;
      }),
    );

    toast.success(
      `Se añadieron ${cantidadParaIncluir} uds de "${productoParaIncluir.nombre}" a ${ubicacionSeleccionada.nombre}`,
    );
    setProductoParaIncluir(null);
    setBusquedaProducto("");
  };

  // Ejecutar operación de stock (quitar / añadir / ajuste) confirmada vía AlertDialog
  const ejecutarOperacionStock = async () => {
    if (!ubicacionSeleccionada || !productoEnOperacion) return;

    const tipoMov =
      tipoOperacion === "quitar" ? "salida" : tipoOperacion === "anadir" ? "reposicion" : "ajuste";

    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id ?? null;

      if (userId) {
        await supabase.from("movimientos").insert({
          id_producto: productoEnOperacion.id,
          id_ubicacion: ubicacionSeleccionada.id,
          tipo: tipoMov,
          cantidad: cantidadOperacion,
          realizado_por: userId,
          notas: `${motivoOperacion} (${tipoOperacion})`,
        });
      }
    } catch {
      // Silencioso para fallback offline
    }

    setUbicaciones((prev) =>
      prev.map((u) => {
        if (u.id === ubicacionSeleccionada.id) {
          const prods = [...u.productos];
          const idx = prods.findIndex((p) => p.id === productoEnOperacion.id);

          if (idx !== -1) {
            const actual = prods[idx]!;
            let nuevaCant = actual.cantidad;

            if (tipoOperacion === "quitar") {
              nuevaCant = Math.max(0, actual.cantidad - cantidadOperacion);
            } else if (tipoOperacion === "anadir") {
              nuevaCant = actual.cantidad + cantidadOperacion;
            } else if (tipoOperacion === "ajuste") {
              nuevaCant = cantidadOperacion;
            }

            if (nuevaCant === 0 && tipoOperacion === "quitar") {
              // Si queda en 0 tras quitar, alertar
              toast.warning(
                `El producto "${actual.nombre}" se ha quedado sin existencias (0 uds) en ${u.nombre}`,
              );
            }

            prods[idx] = { ...actual, cantidad: nuevaCant };
          }

          const totalUds = prods.reduce((acc, p) => acc + p.cantidad, 0);
          const cap = u.capacidad_max || 100;
          const pct = Math.min(100, Math.round((totalUds / cap) * 100));

          const uActualizada = {
            ...u,
            productos: prods,
            porcentaje_ocupacion: pct,
            subtitulo: `${prods.length} productos · ${totalUds} uds`,
          };

          setUbicacionSeleccionada(uActualizada);
          return uActualizada;
        }
        return u;
      }),
    );

    toast.success(
      `Operación de ${tipoOperacion} (${cantidadOperacion} uds) aplicada y registrada en movimientos`,
    );
    setAlertOperacionAbierta(false);
  };

  // Exportar Excel (CSV formateado) de la ubicación
  const exportarExcelUbicacion = () => {
    if (!ubicacionSeleccionada) return;

    const encabezados = ["SKU", "Nombre", "Categoría", "Cantidad (Uds)", "Stock Mínimo", "Estado"];
    const filas = (ubicacionSeleccionada.productos || []).map((p) => [
      `"${p.sku}"`,
      `"${p.nombre.replace(/"/g, '""')}"`,
      `"${p.categoria}"`,
      p.cantidad,
      p.stock_minimo,
      p.cantidad <= p.stock_minimo ? "BAJO STOCK" : "OK",
    ]);

    const contenidoCsv = [
      `"Ubicación: ${ubicacionSeleccionada.nombre} [${ubicacionSeleccionada.codigo}]"`,
      `"Jerarquía: ${infoJerarquia.seccion} > ${infoJerarquia.pasillo}"`,
      `"Fecha de Extracción: ${new Date().toLocaleString()}"`,
      "",
      encabezados.join(";"),
      ...filas.map((f) => f.join(";")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + contenidoCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Inventario_${ubicacionSeleccionada.codigo}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Excel / CSV de ${ubicacionSeleccionada.nombre} descargado correctamente`);
  };

  // Imprimir PDF / Documento físico
  const imprimirPdfUbicacion = () => {
    window.print();
  };

  // ----------------------------------------------------
  // GESTIÓN DE PALETS EN RESERVA (SOLO EN RESERVA)
  // ----------------------------------------------------
  const handleCrearNuevoPalet = async (idReservaEspecifica?: string) => {
    // La ubicación SOLO puede ser en Reserva para evitar que el vendedor lo cree en otro lugar
    const idReserva =
      idReservaEspecifica ||
      (ubicacionSeleccionada?.tipo === "reserva" ? ubicacionSeleccionada.id : null) ||
      reservas[0]?.id ||
      "res-gen";
    const ubiReserva = ubicaciones.find((u) => u.id === idReserva);
    const nombreReserva = ubiReserva?.nombre || "Reserva (Almacén de Tienda)";

    const siguienteNum =
      (palets.length > 0 ? Math.max(...palets.map((p) => p.numero_palet)) : 0) + 1;
    const padNum = String(siguienteNum).padStart(3, "0");
    const hoy = new Date();
    const diaMesAnio = `${String(hoy.getDate()).padStart(2, "0")}${String(hoy.getMonth() + 1).padStart(2, "0")}${hoy.getFullYear()}`;
    const usuarioNombre = "Carlos Ruiz (Vendedor Pintura)";
    const codBarras = `PAL-${padNum}-Vendedor-${diaMesAnio}`;

    const nuevoPalet: PaletItem = {
      id: `pal-${Date.now()}`,
      id_reserva: idReserva,
      numero_palet: siguienteNum,
      codigo_barras: codBarras,
      generado_por: usuarioNombre,
      generado_en: new Date().toISOString(),
      activo: true,
      productos: [
        {
          id: `p-${Date.now()}`,
          sku: "LAT-4001-WHT",
          nombre: "Látex Extracubriente Blanco Mate 15L",
          categoria: "Pinturas de Exterior",
          cantidad: 24,
          stock_minimo: 10,
        },
      ],
    };

    try {
      await crearPaletBD({
        id_reserva: idReserva,
        numero_palet: siguienteNum,
        codigo_barras: codBarras,
        generado_por: usuarioNombre,
      });
      queryClient.invalidateQueries({ queryKey: ["palets"] });
    } catch (err: any) {
      console.warn("Aviso al crear palet en Supabase:", err.message);
    }

    setPalets((prev) => [nuevoPalet, ...prev]);
    toast.success(`Palet #${padNum} creado en ${nombreReserva} (${codBarras})`, {
      description:
        "Ubicación fijada en Reserva. Etiqueta oficial lista para imprimir con Quién, Cuándo y Dónde.",
    });

    setPaletParaImprimir(nuevoPalet);
    setModalEtiquetaPaletAbierto(true);
  };

  // Reponer desde el palet hacia la tienda con REGLA DE AUTODESTRUCCIÓN
  const handleReponerEnTienda = async (palet: PaletItem, prodId: string, cantAReponer: number) => {
    const prodsActualizados = palet.productos
      .map((p) => {
        if (p.id === prodId) {
          const rem = Math.max(0, p.cantidad - cantAReponer);
          return { ...p, cantidad: rem };
        }
        return p;
      })
      .filter((p) => p.cantidad > 0);

    const totalRestante = prodsActualizados.reduce((acc, p) => acc + p.cantidad, 0);

    if (totalRestante === 0) {
      // ⚠️ REGLA DE ORO DE AUTODESTRUCCIÓN DEL PALET
      setPalets((prev) => prev.filter((p) => p.id !== palet.id));
      setModalGestionPaletAbierto(false);

      try {
        await darDeBajaPaletBD(palet.id);
        queryClient.invalidateQueries({ queryKey: ["palets"] });
      } catch (err: any) {
        console.warn("Aviso al dar de baja palet en Supabase:", err.message);
      }

      toast.error(`🚨 ¡PALET #${String(palet.numero_palet).padStart(3, "0")} AUTODESTRUIDO!`, {
        description: `Todos los artículos del palet [${palet.codigo_barras}] han sido traspasados a tienda. El palet se ha dado de baja automáticamente en Supabase.`,
        duration: 6000,
      });
    } else {
      setPalets((prev) =>
        prev.map((p) => (p.id === palet.id ? { ...p, productos: prodsActualizados } : p)),
      );
      toast.success(
        `Mercancía repuesta en tienda. Quedan ${totalRestante} uds en el Palet #${palet.numero_palet}`,
      );
    }
  };

  const handleGuardarUbicacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      toast.error("El nombre de la ubicación es obligatorio");
      return;
    }

    const config = CONFIG_JERARQUIA[formTipo];
    if (config.nivel === 2 && !formPadre) {
      toast.error("Las ubicaciones de Nivel 2 requieren un Pasillo padre");
      return;
    }

    const nuevoId = `loc-${Date.now()}`;
    const nuevoCodigo = formNombre.toUpperCase().replace(/\s+/g, "-").slice(0, 8);

    const nuevaUbi: UbicacionItem = {
      id: nuevoId,
      codigo: nuevoCodigo,
      nombre: formNombre,
      tipo: formTipo,
      nivel: config.nivel,
      id_padre: config.nivel === 2 ? formPadre : null,
      lateral: formLateral,
      piso: formPiso,
      capacidad_max: formCapMax,
      peso_max_kg: formPesoMax,
      porcentaje_ocupacion: 0,
      activo: true,
      subtitulo: "0 productos · 0 uds (Posición recién creada)",
      productos: [],
    };

    setUbicaciones((prev) => [...prev, nuevaUbi]);
    if (formPadre) {
      setExpandidos((prev) => ({ ...prev, [formPadre]: true }));
    }

    try {
      await crearUbicacionBD({
        nombre: formNombre,
        tipo: formTipo,
        id_ubicacion_padre: config.nivel === 2 ? formPadre : null,
        seccion: formPadre,
        posicion_lateral: formLateral,
        numero: formPiso,
      });
      queryClient.invalidateQueries({ queryKey: ["ubicacionesCompletas"] });
      toast.success(`Ubicación "${formNombre}" guardada en Supabase exitosamente`);
    } catch (err: any) {
      console.warn("Guardado localmente. Supabase:", err.message);
      toast.success(`Ubicación "${formNombre}" creada exitosamente`);
    }

    setFormNombre("");
  };

  const confirmarEliminarUbicacion = async () => {
    if (!ubicacionParaEliminar) return;

    if (ubicacionParaEliminar.productos && ubicacionParaEliminar.productos.length > 0) {
      toast.error(
        "No se puede eliminar una ubicación con stock activo. Ajusta el stock a 0 primero.",
      );
      setDialogEliminarAbierto(false);
      return;
    }

    const idEliminar = ubicacionParaEliminar.id;
    const nombreEliminar = ubicacionParaEliminar.nombre;
    setUbicaciones((prev) => prev.filter((u) => u.id !== idEliminar));

    try {
      await desactivarUbicacionBD(idEliminar);
      queryClient.invalidateQueries({ queryKey: ["ubicacionesCompletas"] });
    } catch (err: any) {
      console.warn("Eliminado localmente. Supabase:", err.message);
    }

    toast.success(`Ubicación "${nombreEliminar}" eliminada`);
    setDialogEliminarAbierto(false);
    setUbicacionParaEliminar(null);
  };

  // Sincronizar catálogo inicial completo a Supabase si la BD está vacía
  const handleSincronizarSupabase = async () => {
    setSincronizando(true);
    try {
      const secList = [
        {
          id: "sec-pintura",
          nombre: "Pintura",
          descripcion: "Área central de pinturas, solventes y herramientas",
        },
        {
          id: "sec-sanitario",
          nombre: "Sanitario",
          descripcion: "Fontanería, grifería y porcelana sanitaria",
        },
        {
          id: "sec-cocinas",
          nombre: "Armarios y Cocinas",
          descripcion: "Módulos, herrajes de ensamble y tiradores",
        },
        {
          id: "sec-ferreteria",
          nombre: "Ferretería",
          descripcion: "Tornillería, anclajes y fijaciones de seguridad",
        },
      ];
      const ubiList = UBICACIONES_INICIALES.filter((u) => u.tipo !== "seccion").map((u) => {
        const secPadre = UBICACIONES_INICIALES.find((s) => s.id === u.seccion_id);
        const ubiPadre = UBICACIONES_INICIALES.find((p) => p.id === u.id_padre);
        return {
          nombre: u.nombre,
          tipo: u.tipo,
          seccion_nombre: secPadre?.nombre,
          padre_nombre: ubiPadre?.nombre,
          lateral: u.lateral,
          piso: u.piso,
          descripcion: u.subtitulo,
        };
      });

      const res = await sincronizarEstructuraInicialSupabase(secList, ubiList);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["secciones"] }),
        queryClient.invalidateQueries({ queryKey: ["ubicacionesCompletas"] }),
      ]);
      toast.success(
        `Estructura sincronizada con Supabase: ${res.seccionesCreadas} secciones y ${res.ubicacionesCreadas} ubicaciones guardadas en tu base de datos`,
      );
    } catch (err: any) {
      toast.error(err.message || "Error al sincronizar con Supabase");
    } finally {
      setSincronizando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* CABECERA SUPERIOR */}
      <div className="border-b bg-white no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                <span>INVENTARIO LM</span>
                <span>/</span>
                <span>ALMACÉN</span>
                <span>/</span>
                <span className="text-blue-600 font-semibold">JERARQUÍA DE UBICACIONES</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Ubicaciones del Almacén
                </h1>
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200 font-medium px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  18 Zonas Activas • 94% Ocupación
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto bg-slate-100 p-1 rounded-lg border border-slate-200">
              <Button
                variant={vista === "arbol" ? "default" : "ghost"}
                size="sm"
                onClick={() => setVista("arbol")}
                className={`text-xs gap-1.5 h-8 ${vista === "arbol" ? "bg-white text-blue-700 shadow-xs hover:bg-white" : "text-slate-600 hover:text-slate-900"}`}
              >
                <FolderTree className="w-3.5 h-3.5" />
                Vista Árbol
              </Button>
              <Button
                variant={vista === "lista" ? "default" : "ghost"}
                size="sm"
                onClick={() => setVista("lista")}
                className={`text-xs gap-1.5 h-8 ${vista === "lista" ? "bg-white text-blue-700 shadow-xs hover:bg-white" : "text-slate-600 hover:text-slate-900"}`}
              >
                <List className="w-3.5 h-3.5" />
                Vista Lista
              </Button>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="flex flex-1 items-center gap-2 max-w-xl">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar ubicación por nombre o código (ej. A1-01, Látex)..."
                    className="pl-9 bg-slate-50/70 border-slate-200 text-sm h-9 focus-visible:ring-blue-500"
                  />
                  {busqueda && (
                    <button
                      onClick={() => setBusqueda("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="h-9 text-xs rounded-md border border-slate-200 bg-white px-2.5 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="todos">Tipo de ubicación (Todos)</option>
                  <option value="seccion">Sección (Nivel 0)</option>
                  <option value="pasillo">Pasillo (Nivel 1)</option>
                  <option value="caja">Caja (Nivel 1)</option>
                  <option value="reserva">Reserva (Nivel 1)</option>
                  <option value="armario">Armario (Nivel 2)</option>
                  <option value="alto">Alto (Nivel 2)</option>
                  <option value="cross">Cross (Nivel 2)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleExpandirColapsarTodo}
                  className="text-xs h-9 text-slate-700 border-slate-200 gap-1.5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  {todosExpandidos ? "Colapsar todo" : "Expandir todo"}
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    setFormNombre("Nueva Posición");
                    setFormTipo("armario");
                    toast.info("Configura la nueva ubicación en el panel lateral");
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-9 px-3.5 gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  NUEVA UBICACIÓN
                </Button>
              </div>
            </div>

            {/* CHIPS RÁPIDOS DE FILTRADO POR TIPO */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filtro:
              </span>
              {[
                { id: "todos", label: "Todos", count: ubicaciones.length },
                { id: "seccion", label: "Secciones", count: secciones.length },
                {
                  id: "pasillo",
                  label: "Pasillos",
                  count: ubicaciones.filter((u) => u.tipo === "pasillo").length,
                },
                {
                  id: "armario",
                  label: "Armarios",
                  count: ubicaciones.filter((u) => u.tipo === "armario").length,
                },
                {
                  id: "alto",
                  label: "Altos",
                  count: ubicaciones.filter((u) => u.tipo === "alto").length,
                },
                {
                  id: "caja",
                  label: "Cajas",
                  count: ubicaciones.filter((u) => u.tipo === "caja").length,
                },
                {
                  id: "reserva",
                  label: "Reserva",
                  count: ubicaciones.filter((u) => u.tipo === "reserva").length,
                },
                {
                  id: "cross",
                  label: "Cross",
                  count: ubicaciones.filter((u) => u.tipo === "cross").length,
                },
              ].map((chip) => {
                const activo = filtroTipo === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setFiltroTipo(chip.id)}
                    className={`px-2.5 py-1 text-xs rounded-full transition-all border flex items-center gap-1.5 cursor-pointer ${
                      activo
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 font-medium"
                    }`}
                  >
                    <span>{chip.label}</span>
                    <span
                      className={`text-[10px] px-1 py-0.2 rounded-full ${
                        activo ? "bg-blue-700/80 text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {chip.count}
                    </span>
                  </button>
                );
              })}

              {filtroActivo && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFiltroTipo("todos");
                    setBusqueda("");
                  }}
                  className="h-6 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 ml-auto gap-1"
                >
                  <X className="w-3 h-3" /> Limpiar filtros
                </Button>
              )}
            </div>

            {/* BANNER INFORMATIVO DE FILTRO ACTIVO */}
            {filtroActivo && (
              <div className="flex items-center justify-between bg-blue-50/70 border border-blue-200/90 rounded-lg px-3 py-1.5 text-xs text-blue-900 animate-in fade-in-50">
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>
                    Filtrando por:{" "}
                    <strong>
                      {filtroTipo === "todos"
                        ? "Cualquier tipo"
                        : CONFIG_JERARQUIA[filtroTipo as TipoUbicacion]?.label || filtroTipo}
                    </strong>
                    {busqueda && (
                      <>
                        {" "}
                        y término &quot;<strong>{busqueda}</strong>&quot;
                      </>
                    )}
                  </span>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-[10px] font-semibold">
                    {ubicacionesFiltradas.length} coincidencia
                    {ubicacionesFiltradas.length === 1 ? "" : "s"}
                  </Badge>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFiltroTipo("todos");
                    setBusqueda("");
                  }}
                  className="text-xs text-blue-700 hover:text-blue-950 font-semibold underline shrink-0 cursor-pointer"
                >
                  Ver todo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BANNER DE SINCRONIZACIÓN CON SUPABASE CUANDO NO HAY FILAS EN LA BD */}
      {ubicacionesBD.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 no-print">
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-slate-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-600 text-white shadow-xs shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span>Base de datos Supabase conectada</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    Tablas listas (0 ubicaciones en BD)
                  </span>
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Las tablas <code>secciones</code>, <code>ubicaciones</code>, <code>stock</code> y{" "}
                  <code>palets</code> ya están creadas en tu Supabase. Puedes sincronizar la
                  topología física maestra de Leroy Merlin con un solo clic para guardar todas las
                  secciones y pasillos reales.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleSincronizarSupabase}
              disabled={sincronizando}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-8 px-3.5 gap-1.5 shrink-0 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {sincronizando ? "Sincronizando..." : "Sincronizar a Supabase"}
            </Button>
          </div>
        </div>
      )}

      {/* MÉTRICAS KPI SUPERIORES */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 no-print">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  TOPOLOGÍA DE NAVE
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-slate-900">{ubicaciones.length}</span>
                  <span className="text-xs font-medium text-slate-500">ubicaciones</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span>4 Secciones (Nivel 0) • Pasillos • Cajas • Reserva</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: "78%" }} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    CAPACIDAD OCUPADA
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700">
                    Alerta: Pasillo B
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-slate-900">92%</span>
                  <span className="text-xs font-medium text-rose-600">Capacidad crítica</span>
                </div>
                <p className="text-xs text-slate-600 mt-2">1,420 de 1,540 m³ volumen ocupado</p>
              </div>
              <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-purple-600 h-full rounded-full" style={{ width: "92%" }} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  PALETS EN RESERVA
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-amber-700">{palets.length}</span>
                  <span className="text-xs font-medium text-amber-600">activos con etiqueta</span>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Autodestrucción al vaciar por reposición
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
                <Warehouse className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-600 h-full rounded-full" style={{ width: "45%" }} />
            </div>
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL: ÁRBOL Y FORMULARIO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                    Estructura Física del Almacén
                  </h2>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  Terminal Nave Central • 3 Niveles
                </span>
              </div>

              {vista === "arbol" && (
                <div className="p-4 sm:p-5 space-y-4">
                  {seccionesFiltradas.length === 0 ? (
                    <div className="py-12 px-4 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                        <Filter className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800">
                        No se encontraron ubicaciones
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        No hay ninguna ubicación de tipo &quot;
                        <strong>
                          {filtroTipo === "todos"
                            ? "Cualquiera"
                            : CONFIG_JERARQUIA[filtroTipo as TipoUbicacion]?.label || filtroTipo}
                        </strong>
                        &quot;
                        {busqueda && (
                          <>
                            {" "}
                            que coincida con &quot;<strong>{busqueda}</strong>&quot;
                          </>
                        )}
                        .
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFiltroTipo("todos");
                          setBusqueda("");
                        }}
                        className="mt-4 text-xs border-slate-300 text-blue-700 hover:bg-blue-50"
                      >
                        Restablecer filtros
                      </Button>
                    </div>
                  ) : (
                    seccionesFiltradas.map((sec) => {
                      const secAbierta = filtroActivo ? true : (expandidos[sec.id] ?? true);
                      const pasillos = pasillosDeSeccion(sec.id).filter(pasilloVisible);
                      const cajas = cajasDeSeccion(sec.id).filter(cajaVisible);
                      const reservas = reservasDeSeccion(sec.id).filter(reservaVisible);

                      return (
                        <div
                          key={sec.id}
                          className="rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-xs"
                        >
                          {/* CABECERA DE SECCIÓN (NIVEL 0) */}
                          <div className="p-3.5 bg-indigo-50/40 hover:bg-indigo-50/70 transition-colors flex items-center justify-between gap-3 border-b border-indigo-100/70">
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <button
                                onClick={() => toggleExpandir(sec.id)}
                                className="p-1 rounded-md text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100/70 transition-colors"
                              >
                                {secAbierta ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>
                              <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
                                <Building2 className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-sm text-slate-900">
                                    {sec.nombre}
                                  </span>
                                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                                    Nivel 0 · Sección
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 truncate mt-0.5">
                                  {sec.subtitulo}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setFormNombre(`Pasillo nuevo`);
                                  setFormTipo("pasillo");
                                  toast.info(`Añadiendo Pasillo bajo sección ${sec.nombre}`);
                                }}
                                className="h-7 text-xs px-2.5 rounded-full border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50 gap-1 font-semibold"
                              >
                                <Plus className="w-3 h-3" /> Pasillo
                              </Button>
                            </div>
                          </div>

                          {secAbierta && (
                            <div className="p-3 sm:p-4 space-y-3 bg-slate-50/20">
                              {/* PASILLOS (NIVEL 1) */}
                              {pasillos.map((pas) => {
                                const pasAbierto = filtroActivo
                                  ? true
                                  : (expandidos[pas.id] ?? true);
                                const posiciones = posicionesVisiblesDePasillo(pas.id);

                                return (
                                  <div
                                    key={pas.id}
                                    className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs"
                                  >
                                    <div className="p-3 bg-blue-50/30 hover:bg-blue-50/50 transition-colors flex items-center justify-between gap-3 border-b border-slate-100">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <button
                                          onClick={() => toggleExpandir(pas.id)}
                                          className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                                        >
                                          {pasAbierto ? (
                                            <ChevronDown className="w-3.5 h-3.5" />
                                          ) : (
                                            <ChevronRight className="w-3.5 h-3.5" />
                                          )}
                                        </button>
                                        <div className="p-1.5 rounded-md bg-blue-100 text-blue-700">
                                          <ArrowLeftRight className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-sm text-slate-800">
                                              {pas.nombre}
                                            </span>
                                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                              Nivel 1 · Pasillo
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setFormNombre(`${pas.codigo}-0${posiciones.length + 1}`);
                                          setFormTipo("armario");
                                          setFormPadre(pas.id);
                                          toast.info(`Añadiendo Posición bajo ${pas.nombre}`);
                                        }}
                                        className="h-6 text-[11px] px-2 rounded-full border-slate-200 text-slate-700 hover:bg-slate-100 gap-1"
                                      >
                                        <Plus className="w-3 h-3" /> Posición
                                      </Button>
                                    </div>

                                    {/* POSICIONES DEL PASILLO (NIVEL 2: ARMARIOS, ALTOS, CROSS) */}
                                    {pasAbierto && (
                                      <div className="p-2 sm:p-3 space-y-2 bg-white">
                                        {posiciones.length === 0 ? (
                                          <div className="p-3 text-center text-xs text-slate-400">
                                            Sin posiciones asignadas en este pasillo.
                                          </div>
                                        ) : (
                                          posiciones.map((pos) => {
                                            const config = CONFIG_JERARQUIA[pos.tipo];
                                            const IconoPos = config.icon;

                                            return (
                                              <div
                                                key={pos.id}
                                                onClick={() => abrirPanelVendedor(pos)}
                                                className="p-2.5 rounded-lg border border-slate-200/90 bg-slate-50/30 hover:bg-blue-50/50 hover:border-blue-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group shadow-2xs"
                                              >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                  <div className="w-4 h-4 flex items-center justify-center text-slate-400">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-blue-500" />
                                                  </div>
                                                  <div
                                                    className={`p-1.5 rounded-md ${config.badgeClass}`}
                                                  >
                                                    <IconoPos className="w-3.5 h-3.5" />
                                                  </div>
                                                  <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                      <span className="font-semibold text-xs text-slate-900 group-hover:text-blue-700">
                                                        {pos.nombre}
                                                      </span>
                                                      <span
                                                        className={`px-1.5 py-0.2 text-[10px] font-medium rounded-full border ${config.badgeClass}`}
                                                      >
                                                        {config.label}
                                                      </span>
                                                      <span className="text-[10px] font-mono text-slate-400">
                                                        [{pos.codigo}]
                                                      </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                                      {pos.subtitulo}
                                                    </p>
                                                  </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      abrirPanelVendedor(pos);
                                                    }}
                                                    className="h-7 text-xs px-2.5 rounded-md border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 font-semibold"
                                                  >
                                                    Ver Productos & Stock
                                                  </Button>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setUbicacionParaEliminar(pos);
                                                      setDialogEliminarAbierto(true);
                                                    }}
                                                    className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                                                  >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                  </Button>
                                                </div>
                                              </div>
                                            );
                                          })
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {/* CAJAS INDEPENDIENTES (NIVEL 1) */}
                              {cajas.map((caja) => (
                                <div
                                  key={caja.id}
                                  onClick={() => abrirPanelVendedor(caja)}
                                  className="rounded-lg border border-rose-200/90 bg-rose-50/20 hover:bg-rose-50/50 p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="p-1.5 rounded-md bg-rose-100 text-rose-700">
                                      <Package className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-xs text-slate-900">
                                          {caja.nombre}
                                        </span>
                                        <span className="px-1.5 py-0.2 text-[10px] font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                                          Nivel 1 · Caja Independiente
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                        {caja.subtitulo}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        abrirPanelVendedor(caja);
                                      }}
                                      className="h-7 text-xs px-2.5 rounded-md border-rose-200 text-rose-700 bg-white hover:bg-rose-50 font-semibold"
                                    >
                                      Ver Contenido
                                    </Button>
                                  </div>
                                </div>
                              ))}

                              {/* RESERVA GENERAL (NIVEL 1 - GESTIÓN DE PALETS CON AUTODESTRUCCIÓN) */}
                              {reservas.map((res) => (
                                <div
                                  key={res.id}
                                  className="rounded-xl border border-amber-300 bg-amber-50/30 p-3.5 shadow-xs space-y-3"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div
                                      onClick={() => abrirPanelVendedor(res)}
                                      className="flex items-center gap-3 min-w-0 cursor-pointer group"
                                      title="Abrir panel de gestión de palets en esta reserva"
                                    >
                                      <div className="p-2 rounded-lg bg-amber-600 text-white shadow-xs group-hover:bg-amber-700 transition-colors">
                                        <Warehouse className="w-4 h-4" />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-bold text-sm text-slate-900 group-hover:text-amber-800 transition-colors">
                                            {res.nombre}
                                          </span>
                                          <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                                            Nivel 1 · Reserva (Almacén de Tienda)
                                          </span>
                                        </div>
                                        <p className="text-xs text-slate-600 truncate mt-0.5">
                                          {palets.length} Palets activos con correlativo automático
                                          y etiqueta
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-start sm:self-auto">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => abrirPanelVendedor(res)}
                                        className="border-amber-300 text-amber-900 bg-amber-100 hover:bg-amber-200 text-xs font-semibold h-8 px-3 gap-1.5 shadow-xs"
                                      >
                                        <Warehouse className="w-3.5 h-3.5" />
                                        Abrir Reserva
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCrearNuevoPalet(res.id);
                                        }}
                                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold h-8 px-3 gap-1.5 shadow-xs"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        Crear Palet
                                      </Button>
                                    </div>
                                  </div>

                                  {/* LISTADO DE PALETS ACTIVOS EN ESTA RESERVA */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                    {palets.map((palet) => (
                                      <div
                                        key={palet.id}
                                        className="p-3 rounded-lg border border-amber-200 bg-white shadow-2xs hover:border-amber-400 transition-all space-y-2"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-1.5">
                                            <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-bold text-xs">
                                              Palet #{String(palet.numero_palet).padStart(3, "0")}
                                            </Badge>
                                            <span className="text-[10px] font-mono text-slate-500">
                                              [{palet.codigo_barras}]
                                            </span>
                                          </div>
                                          <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold">
                                            {palet.productos.reduce(
                                              (acc, p) => acc + p.cantidad,
                                              0,
                                            )}{" "}
                                            uds
                                          </span>
                                        </div>

                                        <div className="text-[11px] text-slate-600 space-y-0.5">
                                          <div className="flex items-center gap-1">
                                            <User className="w-3 h-3 text-slate-400" />
                                            <span>
                                              Generado por:{" "}
                                              <strong className="text-slate-800">
                                                {palet.generado_por}
                                              </strong>
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3 text-slate-400" />
                                            <span>
                                              Fecha:{" "}
                                              {new Date(palet.generado_en).toLocaleDateString()}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setPaletParaImprimir(palet);
                                              setModalEtiquetaPaletAbierto(true);
                                            }}
                                            className="flex-1 h-7 text-xs border-amber-200 text-amber-800 hover:bg-amber-50 gap-1 font-medium"
                                          >
                                            <Printer className="w-3 h-3" /> Imprimir Etiqueta
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={() => {
                                              setPaletSeleccionadoParaGestion(palet);
                                              setModalGestionPaletAbierto(true);
                                            }}
                                            className="flex-1 h-7 text-xs bg-slate-800 hover:bg-slate-900 text-white gap-1 font-medium"
                                          >
                                            <RefreshCw className="w-3 h-3" /> Reponer en Tienda
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {vista === "lista" && (
                <div className="divide-y divide-slate-100">
                  {ubicacionesFiltradas.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-sm">
                      No se encontraron ubicaciones con los filtros actuales
                    </div>
                  ) : (
                    ubicacionesFiltradas.map((item) => {
                      const config = CONFIG_JERARQUIA[item.tipo];
                      const Icono = config.icon;
                      return (
                        <div
                          key={item.id}
                          className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2 rounded-lg ${config.badgeClass}`}>
                              <Icono className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-slate-900">
                                  {item.nombre}
                                </span>
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${config.badgeClass}`}
                                >
                                  {config.label}
                                </span>
                                <span className="text-xs text-slate-400 font-mono">
                                  [{item.codigo}]
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {item.subtitulo || config.descripcion}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => abrirPanelVendedor(item)}
                              className="h-7 text-xs border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 font-semibold"
                            >
                              Gestionar Productos
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* PANEL LATERAL DE CREACIÓN DE UBICACIÓN */}
          <div className="lg:col-span-4 space-y-5 no-print">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-blue-100 text-blue-700">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Modal: Nueva Ubicación en Almacén
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
                  EDITOR
                </span>
              </div>

              <form onSubmit={handleGuardarUbicacion} className="space-y-3.5">
                <div>
                  <Label className="text-xs font-semibold text-slate-700 mb-1 block">
                    Nombre de Ubicación
                  </Label>
                  <Input
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    placeholder="Ej. Armario A1-04"
                    className="h-8 text-xs bg-slate-50/60 border-slate-200"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700 mb-1 block">
                    Tipo de Ubicación
                  </Label>
                  <select
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value as TipoUbicacion)}
                    className="w-full h-8 text-xs rounded-md border border-slate-200 bg-slate-50/60 px-2.5 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="armario">Armario (Estantería media - Nivel 2)</option>
                    <option value="alto">Alto (Altillo superior - Nivel 2)</option>
                    <option value="cross">Cross-docking (Tránsito - Nivel 2)</option>
                    <option value="caja">Caja (Independiente - Nivel 1)</option>
                    <option value="pasillo">Pasillo (Corredor - Nivel 1)</option>
                    <option value="reserva">Reserva (Palets - Nivel 1)</option>
                    <option value="seccion">Sección (Zona General - Nivel 0)</option>
                  </select>
                </div>

                {CONFIG_JERARQUIA[formTipo].nivel === 2 && (
                  <div>
                    <Label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Ubicación Padre
                    </Label>
                    <select
                      value={formPadre}
                      onChange={(e) => setFormPadre(e.target.value)}
                      className="w-full h-8 text-xs rounded-md border border-slate-200 bg-slate-50/60 px-2.5 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    >
                      {pasillosDisponibles.map((pas) => (
                        <option key={pas.id} value={pas.id}>
                          {pas.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <Label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Lateral
                    </Label>
                    <select
                      value={formLateral}
                      onChange={(e) => setFormLateral(e.target.value as "L" | "R" | "C")}
                      className="w-full h-8 text-xs rounded-md border border-slate-200 bg-slate-50/60 px-2 text-slate-800"
                    >
                      <option value="R">Derecha (R)</option>
                      <option value="L">Izquierda (L)</option>
                      <option value="C">Central (C)</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Altura / Piso
                    </Label>
                    <select
                      value={formPiso}
                      onChange={(e) => setFormPiso(Number(e.target.value))}
                      className="w-full h-8 text-xs rounded-md border border-slate-200 bg-slate-50/60 px-2 text-slate-800"
                    >
                      <option value={1}>Nivel 1 (Suelo)</option>
                      <option value={2}>Nivel 2 (Medio)</option>
                      <option value={3}>Nivel 3 (Alto)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <Label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Cap. Máx (uds)
                    </Label>
                    <Input
                      type="number"
                      value={formCapMax}
                      onChange={(e) => setFormCapMax(Number(e.target.value))}
                      className="h-8 text-xs bg-slate-50/60 border-slate-200"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Peso Máx (kg)
                    </Label>
                    <Input
                      type="number"
                      value={formPesoMax}
                      onChange={(e) => setFormPesoMax(Number(e.target.value))}
                      className="h-8 text-xs bg-slate-50/60 border-slate-200"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFormNombre("");
                      toast.info("Formulario limpiado");
                    }}
                    className="h-8 text-xs text-slate-600"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 shadow-xs"
                  >
                    Guardar Ubicación
                  </Button>
                </div>
              </form>
            </div>

            {/* MAPA NAVE EN VIVO */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900 tracking-wider">
                  MAPA NAVE A-NORTE
                </span>
                <span className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline">
                  Plano 2D
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 py-2">
                {["A1-01", "A1-02", "A1-03", "A1-04", "A2-01", "S1-01"].map((slot) => {
                  const match = ubicaciones.find((u) => u.codigo === slot);
                  const isLibre = !match || match.productos.length === 0;

                  return (
                    <div
                      key={slot}
                      onClick={() => match && abrirPanelVendedor(match)}
                      className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                        match
                          ? "bg-blue-50/70 border-blue-300 hover:bg-blue-100"
                          : "border-slate-300 bg-slate-50/40"
                      }`}
                    >
                      <div className="text-[11px] font-bold text-slate-800">{slot}</div>
                      <div
                        className={`text-[10px] font-medium ${isLibre ? "text-slate-400" : "text-blue-700 font-semibold"}`}
                      >
                        {isLibre ? "LIBRE" : `${match?.porcentaje_ocupacion ?? 80}%`}
                      </div>
                    </div>
                  );
                })}
                <div
                  onClick={() => {
                    const res = ubicaciones.find((u) => u.tipo === "reserva");
                    if (res) abrirPanelVendedor(res);
                  }}
                  className="col-span-2 p-2.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-center transition-all cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-amber-900">RES-TIENDA</div>
                  <div className="text-[10px] font-medium text-amber-700">
                    {palets.length} PALETS
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Último inventario físico:</span>
                <span className="font-semibold text-slate-700">Hoy, 10:15</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📱 PANEL / MODAL LATERAL DERECHO DEL VENDEDOR (SHEET) */}
      {/* ========================================================================= */}
      <Sheet open={sheetVendedorAbierto} onOpenChange={setSheetVendedorAbierto}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto p-0 flex flex-col bg-white"
        >
          {ubicacionSeleccionada && (
            <div className="flex-1 flex flex-col">
              {/* CABECERA INFORMATIVA */}
              <div className="p-5 border-b border-slate-200 bg-slate-50/80 sticky top-0 z-10">
                {/* Miga de pan informativa requerida */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1.5">
                  <span className="text-indigo-600 font-semibold">{infoJerarquia.seccion}</span>
                  <span>/</span>
                  <span className="text-blue-600 font-semibold">{infoJerarquia.pasillo}</span>
                  <span>/</span>
                  <span className="text-slate-900 font-bold">{ubicacionSeleccionada.nombre}</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      {ubicacionSeleccionada.nombre}
                      <Badge className={CONFIG_JERARQUIA[ubicacionSeleccionada.tipo].badgeClass}>
                        {CONFIG_JERARQUIA[ubicacionSeleccionada.tipo].label}
                      </Badge>
                    </h2>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {ubicacionSeleccionada.tipo === "reserva" ? (
                        <span className="text-amber-800 font-medium font-sans">
                          Zona de Almacén · Ubicación Exclusiva para Palets Móviles
                        </span>
                      ) : (
                        `Código: [${ubicacionSeleccionada.codigo}] • Lateral: ${ubicacionSeleccionada.lateral || "Central"} • Nivel/Piso: ${ubicacionSeleccionada.piso || 1}`
                      )}
                    </p>
                  </div>

                  <div className="text-right">
                    {ubicacionSeleccionada.tipo === "reserva" ? (
                      <>
                        <span className="text-sm font-bold text-amber-900">
                          {palets.length} {palets.length === 1 ? "Palet activo" : "Palets activos"}
                        </span>
                        <div className="text-[10px] text-amber-700 font-medium">
                          {palets.reduce(
                            (acc, p) => acc + p.productos.reduce((a, b) => a + b.cantidad, 0),
                            0,
                          )}{" "}
                          uds en reserva
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-bold text-slate-900">
                          {ubicacionSeleccionada.productos?.reduce((a, b) => a + b.cantidad, 0) ||
                            0}{" "}
                          / {ubicacionSeleccionada.capacidad_max || 100} uds
                        </span>
                        <div className="text-[10px] text-slate-500 font-medium">
                          Ocupación: {ubicacionSeleccionada.porcentaje_ocupacion || 0}%
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* BOTONES DE HERRAMIENTAS */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200/80">
                  {ubicacionSeleccionada.tipo === "reserva" ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleCrearNuevoPalet(ubicacionSeleccionada.id)}
                        className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Crear Palet en Reserva
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.print()}
                        className="h-8 text-xs border-amber-300 text-amber-900 hover:bg-amber-100 gap-1.5 font-medium"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-700" />
                        Imprimir Listado
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={imprimirPdfUbicacion}
                        className="h-8 text-xs border-slate-200 text-slate-700 hover:bg-slate-100 gap-1.5"
                        title="Imprimir PDF del contenido del armario"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-600" />
                        Imprimir PDF
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportarExcelUbicacion}
                        className="h-8 text-xs border-slate-200 text-slate-700 hover:bg-slate-100 gap-1.5"
                        title="Descargar hoja Excel (.csv) del armario"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        Exportar Excel
                      </Button>

                      <Button
                        variant={mostrarEscaner ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMostrarEscaner(!mostrarEscaner)}
                        className={`h-8 text-xs gap-1.5 ${mostrarEscaner ? "bg-blue-600 text-white" : "border-slate-200 text-slate-700"}`}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {mostrarEscaner ? "Ocultar Cámara" : "Escanear Código"}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* SI LA UBICACIÓN ES RESERVA: PANEL EXCLUSIVO DE PALETS CON REGLA DE AUTODESTRUCCIÓN */}
              {ubicacionSeleccionada.tipo === "reserva" ? (
                <div className="p-5 flex-1 space-y-4">
                  {/* BLINDAJE DE SEGURIDAD: PALETS SOLO EN RESERVA */}
                  <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-300 text-amber-950 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide text-amber-900">
                      <Warehouse className="w-4 h-4 text-amber-700" />
                      <span>Ubicación Restringida: Solo en Reserva</span>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Por seguridad operativa y para evitar que el vendedor cree palets por error en
                      estanterías o pasillos, la creación y alojamiento de palets está{" "}
                      <strong>estrictamente blindada solo para zonas de Reserva</strong>.
                    </p>
                    <div className="text-[11px] text-amber-800 bg-white/80 p-2.5 rounded-md border border-amber-200 flex items-center gap-2 font-medium">
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>
                        <strong>Regla de Autodestrucción:</strong> Cuando el palet salga a tienda
                        para reponer y quede vacío (0 uds), se autodestruirá automáticamente en el
                        sistema.
                      </span>
                    </div>
                  </div>

                  {/* ACCIÓN PRINCIPAL: CREAR PALET EN ESTA RESERVA */}
                  <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Boxes className="w-4 h-4 text-amber-600" />
                        Crear Palet en {ubicacionSeleccionada.nombre}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Asigna correlativo oficial, código PAL-XXX y genera la etiqueta oficial
                        homologada con Quién, Cuándo y Dónde.
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleCrearNuevoPalet(ubicacionSeleccionada.id)}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-9 px-4 gap-2 shadow-xs shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      Crear Palet en Reserva
                    </Button>
                  </div>

                  {/* LISTADO DE PALETS ACTIVOS EN ESTA RESERVA */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Palets en esta Reserva ({palets.length} activos)
                      </span>
                      <span className="text-xs text-amber-700 font-semibold">
                        Etiquetas: Quién • Cuándo • Dónde
                      </span>
                    </div>

                    {palets.length === 0 ? (
                      <div className="p-8 text-center border-2 border-dashed border-amber-200 rounded-xl bg-amber-50/20 text-slate-500 text-xs space-y-2">
                        <Boxes className="w-8 h-8 text-amber-400 mx-auto" />
                        <p className="font-semibold text-slate-700">
                          No hay palets en esta reserva actualmente.
                        </p>
                        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                          Haz clic en "Crear Palet en Reserva" para generar el primer palet con su
                          correlativo y etiqueta física.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {palets.map((palet) => {
                          const totalUds = palet.productos.reduce((a, b) => a + b.cantidad, 0);

                          return (
                            <div
                              key={palet.id}
                              className="p-4 rounded-xl border border-amber-200 bg-white shadow-2xs hover:border-amber-400 transition-all space-y-3"
                            >
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-bold text-xs px-2.5 py-0.5">
                                    Palet #{String(palet.numero_palet).padStart(3, "0")}
                                  </Badge>
                                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border">
                                    {palet.codigo_barras}
                                  </span>
                                </div>
                                <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                                  {totalUds} unidades
                                </span>
                              </div>

                              {/* DATOS CLAVE: QUIÉN, CUÁNDO Y DÓNDE */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-200/80">
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                                    DÓNDE (Ubicación)
                                  </span>
                                  <strong className="text-amber-800 truncate block">
                                    {ubicacionSeleccionada.nombre}
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                                    QUIÉN (Generado Por)
                                  </span>
                                  <strong className="text-slate-800 truncate block">
                                    {palet.generado_por}
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                                    CUÁNDO (Fecha y Hora)
                                  </span>
                                  <span className="text-slate-700 text-[11px] block">
                                    {new Date(palet.generado_en).toLocaleString("es-ES")}
                                  </span>
                                </div>
                              </div>

                              {/* ARTÍCULOS ASIGNADOS */}
                              <div className="border rounded-md overflow-hidden bg-white text-xs divide-y divide-slate-100">
                                {palet.productos.map((prod) => (
                                  <div
                                    key={prod.id}
                                    className="p-2 flex items-center justify-between"
                                  >
                                    <div className="min-w-0 pr-2">
                                      <div className="font-semibold text-slate-900 truncate">
                                        {prod.nombre}
                                      </div>
                                      <div className="text-[10px] text-slate-500 font-mono">
                                        SKU: {prod.sku}
                                      </div>
                                    </div>
                                    <span className="font-bold text-slate-800 shrink-0">
                                      {prod.cantidad} uds
                                    </span>
                                  </div>
                                ))}
                              </div>

                              {/* ACCIONES: IMPRIMIR ETIQUETA Y REPONER EN TIENDA */}
                              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setPaletParaImprimir(palet);
                                    setModalEtiquetaPaletAbierto(true);
                                  }}
                                  className="flex-1 h-8 text-xs border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 gap-1.5 font-bold shadow-2xs"
                                >
                                  <Printer className="w-3.5 h-3.5 text-amber-700" />
                                  Imprimir Etiqueta
                                </Button>

                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setPaletSeleccionadoParaGestion(palet);
                                    setModalGestionPaletAbierto(true);
                                  }}
                                  className="flex-1 h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white gap-1.5 font-bold shadow-2xs"
                                >
                                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                                  Reponer en Tienda
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* GESTIÓN ORDINARIA DE ARMARIOS / ALTOS / CAJAS */
                <>
                  {/* LECTOR CON CÁMARA (SI ESTÁ ACTIVO) */}
                  {mostrarEscaner && (
                    <div className="p-4 bg-slate-900 text-white border-b border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold flex items-center gap-1.5">
                          <Barcode className="w-4 h-4 text-emerald-400" />
                          Lector de Códigos con Cámara
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setMostrarEscaner(false)}
                          className="h-6 text-xs text-slate-400 hover:text-white"
                        >
                          Cerrar
                        </Button>
                      </div>
                      <Escaner
                        onCodigo={(cod) => {
                          toast.info(`Código detectado: ${cod}`);
                          const prodEncontrado = CATALOGO_PRODUCTOS_MOCK.find(
                            (p) => p.sku.toLowerCase() === cod.toLowerCase() || cod.includes(p.sku),
                          );
                          if (prodEncontrado) {
                            setProductoParaIncluir(prodEncontrado);
                            setBusquedaProducto(`${prodEncontrado.nombre} (${prodEncontrado.sku})`);
                            toast.success(`Producto identificado: ${prodEncontrado.nombre}`);
                            setMostrarEscaner(false);
                          } else {
                            toast.warning(`No se encontró ningún artículo para el código ${cod}`);
                          }
                        }}
                        onCerrar={() => setMostrarEscaner(false)}
                      />
                    </div>
                  )}

                  {/* BUSCADOR CON LISTA DESPLEGABLE CON FLECHAS PARA INCLUIR ARTÍCULO */}
                  <div className="p-5 border-b border-slate-200 bg-white space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 text-blue-600" />
                        Incluir Artículo en este Armario
                      </Label>
                      <span className="text-[10px] text-slate-400">
                        Navega con flechas ↑ / ↓ y pulsa Enter
                      </span>
                    </div>

                    <div className="relative">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <Input
                            value={busquedaProducto}
                            onChange={(e) => {
                              setBusquedaProducto(e.target.value);
                              setDropdownAbierto(true);
                              setIndiceSugerencia(0);
                            }}
                            onFocus={() => setDropdownAbierto(true)}
                            onKeyDown={handleKeyDownBuscador}
                            placeholder="Buscar por nombre o SKU (ej. Látex, LAT-4001)..."
                            className="pl-8 text-xs h-9 bg-slate-50 border-slate-200"
                          />
                        </div>
                        <div className="w-24">
                          <Input
                            type="number"
                            min={1}
                            value={cantidadParaIncluir}
                            onChange={(e) =>
                              setCantidadParaIncluir(Math.max(1, Number(e.target.value)))
                            }
                            className="text-xs h-9 text-center bg-slate-50 border-slate-200"
                            title="Cantidad a añadir"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={handleIncluirProductoEnUbicacion}
                          disabled={!productoParaIncluir}
                          className="h-9 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                        >
                          Añadir
                        </Button>
                      </div>

                      {/* DESPLEGABLE PREDICTIVO CON FLECHAS */}
                      {dropdownAbierto && sugerenciasCatalogo.length > 0 && (
                        <div className="absolute top-full left-0 right-28 mt-1 bg-white rounded-lg border border-slate-200 shadow-lg z-30 max-h-56 overflow-y-auto">
                          {sugerenciasCatalogo.map((prod, idx) => (
                            <div
                              key={prod.id}
                              onClick={() => {
                                setProductoParaIncluir(prod);
                                setBusquedaProducto(`${prod.nombre} (${prod.sku})`);
                                setDropdownAbierto(false);
                              }}
                              className={`p-2.5 text-xs cursor-pointer border-b border-slate-100 last:border-0 flex items-center justify-between ${
                                idx === indiceSugerencia
                                  ? "bg-blue-50 text-blue-900 font-semibold"
                                  : "hover:bg-slate-50 text-slate-800"
                              }`}
                            >
                              <div>
                                <div className="font-medium">{prod.nombre}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  SKU: {prod.sku} • {prod.categoria}
                                </div>
                              </div>
                              <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                Catálogo
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {productoParaIncluir && (
                      <div className="p-2.5 rounded-md bg-blue-50/70 border border-blue-200 text-xs flex items-center justify-between text-blue-900">
                        <div>
                          <span>
                            Seleccionado: <strong>{productoParaIncluir.nombre}</strong>
                          </span>
                          <span className="block text-[10px] text-blue-700 font-mono">
                            SKU: {productoParaIncluir.sku}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setProductoParaIncluir(null);
                            setBusquedaProducto("");
                          }}
                          className="h-6 w-6 p-0 text-blue-700 hover:text-blue-900"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* LISTADO DE PRODUCTOS ACTUALMENTE EN LA UBICACIÓN */}
                  <div className="p-5 flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Contenido del Armario ({ubicacionSeleccionada.productos?.length || 0}{" "}
                        artículos)
                      </span>
                      <span className="text-xs text-slate-500">
                        Regla de Oro: Registro auditado en tabla movimientos
                      </span>
                    </div>

                    {!ubicacionSeleccionada.productos ||
                    ubicacionSeleccionada.productos.length === 0 ? (
                      <div className="p-8 text-center border border-dashed rounded-lg text-slate-400 text-xs">
                        Esta ubicación no contiene artículos en este momento. Utiliza el buscador o
                        escáner superior para incluir productos.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-150 border rounded-lg bg-white overflow-hidden shadow-2xs">
                        {ubicacionSeleccionada.productos.map((prod) => {
                          const bajoStock = prod.cantidad <= prod.stock_minimo;

                          return (
                            <div
                              key={prod.id}
                              className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-xs text-slate-900">
                                    {prod.nombre}
                                  </span>
                                  {bajoStock && (
                                    <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px] font-bold">
                                      Bajo Stock
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                  SKU: {prod.sku} • {prod.categoria} • Mínimo: {prod.stock_minimo}{" "}
                                  uds
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="text-base font-bold text-slate-900">
                                    {prod.cantidad}
                                  </span>
                                  <span className="text-xs text-slate-400 ml-1">uds</span>
                                </div>

                                {/* BOTONES INTERACTIVOS: QUITAR (-), AÑADIR (+), AJUSTAR CON DIALOG DE CONFIRMACIÓN */}
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setProductoEnOperacion(prod);
                                      setTipoOperacion("quitar");
                                      setCantidadOperacion(1);
                                      setMotivoOperacion("Venta o reposición en tienda");
                                      setAlertOperacionAbierta(true);
                                    }}
                                    className="h-7 w-7 p-0 text-rose-600 border-rose-200 hover:bg-rose-50"
                                    title="Quitar unidades (Salida)"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </Button>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setProductoEnOperacion(prod);
                                      setTipoOperacion("anadir");
                                      setCantidadOperacion(5);
                                      setMotivoOperacion("Reposición de existencias");
                                      setAlertOperacionAbierta(true);
                                    }}
                                    className="h-7 w-7 p-0 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                    title="Añadir unidades (Entrada)"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setProductoEnOperacion(prod);
                                      setTipoOperacion("ajuste");
                                      setCantidadOperacion(prod.cantidad);
                                      setMotivoOperacion("Ajuste por recuento físico");
                                      setAlertOperacionAbierta(true);
                                    }}
                                    className="h-7 text-xs px-2 text-slate-600 hover:text-blue-600 font-medium"
                                  >
                                    Ajuste
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ========================================================================= */}
      {/* ⚠️ ALERT DIALOG OBLIGATORIO PARA QUITAR / MODIFICAR STOCK (REGLA 4) */}
      {/* ========================================================================= */}
      <AlertDialog open={alertOperacionAbierta} onOpenChange={setAlertOperacionAbierta}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              {tipoOperacion === "quitar" ? (
                <>
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  Confirmar Salida de Stock
                </>
              ) : tipoOperacion === "anadir" ? (
                <>
                  <Plus className="w-5 h-5 text-emerald-600" />
                  Confirmar Reposición de Stock
                </>
              ) : (
                <>
                  <SlidersHorizontal className="w-5 h-5 text-amber-600" />
                  Ajuste Directo de Conteo Físico
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-600">
              Esta operación registrará una mutación en la tabla <strong>movimientos</strong> y
              actualizará el stock de <strong>{productoEnOperacion?.nombre}</strong> en{" "}
              <strong>{ubicacionSeleccionada?.nombre}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1 block">
                {tipoOperacion === "ajuste"
                  ? "Nueva Cantidad Exacta (uds)"
                  : "Cantidad a Procesar (uds)"}
              </Label>
              <Input
                type="number"
                min={tipoOperacion === "ajuste" ? 0 : 1}
                value={cantidadOperacion}
                onChange={(e) => setCantidadOperacion(Number(e.target.value))}
                className="h-8 text-xs font-semibold"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1 block">
                Motivo / Justificación
              </Label>
              <Input
                value={motivoOperacion}
                onChange={(e) => setMotivoOperacion(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs h-8">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={ejecutarOperacionStock}
              className={`text-xs h-8 text-white ${
                tipoOperacion === "quitar"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : tipoOperacion === "anadir"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              Confirmar y Registrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ========================================================================= */}
      {/* 🏷️ MODAL DE ETIQUETA IMPRIMIBLE DE PALET (HOMOLOGADA) */}
      {/* ========================================================================= */}
      <Dialog open={modalEtiquetaPaletAbierto} onOpenChange={setModalEtiquetaPaletAbierto}>
        <DialogContent className="max-w-md p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Barcode className="w-5 h-5 text-amber-600" />
              Etiqueta Oficial de Palet
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Formato homologado para imprimir y colocar sobre el palet físico en Reserva.
            </DialogDescription>
          </DialogHeader>

          {paletParaImprimir && (
            <div className="p-4 border-2 border-dashed border-amber-300 rounded-xl bg-amber-50/30 space-y-3 font-sans print-area">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <span className="font-black text-sm tracking-widest text-slate-900 uppercase">
                  LEROY MERLIN
                </span>
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-300">
                  PALET #{String(paletParaImprimir.numero_palet).padStart(3, "0")}
                </span>
              </div>

              <div className="text-center py-2 space-y-1 bg-white p-3 rounded-lg border border-amber-100 shadow-2xs">
                <div className="font-mono text-2xl font-black tracking-widest text-slate-900">
                  |||||| || ||||| |||||||
                </div>
                <div className="font-mono text-xs font-bold text-slate-800">
                  {paletParaImprimir.codigo_barras}
                </div>
              </div>

              {/* DATOS OFICIALES: QUIÉN, CUÁNDO Y DÓNDE */}
              <div className="grid grid-cols-2 gap-2 text-xs border-t border-amber-200 pt-2 text-slate-700">
                <div className="p-2 bg-white rounded border border-amber-200/80">
                  <span className="text-[10px] text-amber-800 block uppercase font-bold">
                    DÓNDE (Ubicación)
                  </span>
                  <strong className="text-slate-900 text-xs block truncate">
                    {ubicaciones.find((u) => u.id === paletParaImprimir.id_reserva)?.nombre ||
                      ubicacionSeleccionada?.nombre ||
                      "Reserva (Almacén de Tienda)"}
                  </strong>
                </div>
                <div className="p-2 bg-white rounded border border-amber-200/80">
                  <span className="text-[10px] text-amber-800 block uppercase font-bold">
                    QUIÉN (Generado Por)
                  </span>
                  <strong className="text-slate-900 text-xs block truncate">
                    {paletParaImprimir.generado_por}
                  </strong>
                </div>
                <div className="p-2 bg-white rounded border border-amber-200/80">
                  <span className="text-[10px] text-amber-800 block uppercase font-bold">
                    CUÁNDO (Fecha y Hora)
                  </span>
                  <span className="text-slate-800 font-semibold text-xs block">
                    {new Date(paletParaImprimir.generado_en).toLocaleString("es-ES")}
                  </span>
                </div>
                <div className="p-2 bg-white rounded border border-amber-200/80">
                  <span className="text-[10px] text-amber-800 block uppercase font-bold">
                    CANTIDAD TOTAL
                  </span>
                  <span className="text-emerald-700 font-bold text-xs block">
                    {paletParaImprimir.productos.reduce((a, b) => a + b.cantidad, 0)} unidades
                  </span>
                </div>
              </div>

              {/* ARTÍCULOS EN PALET */}
              <div className="text-[11px] bg-white p-2.5 rounded border border-amber-200/80 space-y-1">
                <div className="font-bold text-[10px] text-slate-500 uppercase tracking-wider">
                  Artículos Asignados:
                </div>
                {paletParaImprimir.productos.map((prod) => (
                  <div key={prod.id} className="flex justify-between items-center text-slate-800">
                    <span className="truncate max-w-[220px]">
                      {prod.nombre}{" "}
                      <span className="font-mono text-[10px] text-slate-400">({prod.sku})</span>
                    </span>
                    <strong className="shrink-0">{prod.cantidad} uds</strong>
                  </div>
                ))}
              </div>

              <div className="text-[10px] text-amber-900 bg-amber-100/60 p-2 rounded text-center border border-amber-200 font-medium">
                🔒 Ubicación fijada: Solo en Reserva. Al reponer en tienda y quedar vacío, se
                autodestruye.
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 gap-2 no-print">
            <Button variant="ghost" size="sm" onClick={() => setModalEtiquetaPaletAbierto(false)}>
              Cerrar
            </Button>
            <Button
              size="sm"
              onClick={() => window.print()}
              className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 font-bold"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Etiqueta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 🔄 MODAL DE REPOSICIÓN EN TIENDA DESDE EL PALET (CON AUTODESTRUCCIÓN) */}
      {/* ========================================================================= */}
      <Dialog open={modalGestionPaletAbierto} onOpenChange={setModalGestionPaletAbierto}>
        <DialogContent className="max-w-lg p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-amber-600" />
              Reponer Mercancía a Tienda desde Palet #{paletSeleccionadoParaGestion?.numero_palet}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Traspasa la mercancía de este palet a las estanterías de tienda. Cuando el stock del
              palet llegue a 0, se autodestruirá automáticamente.
            </DialogDescription>
          </DialogHeader>

          {paletSeleccionadoParaGestion && (
            <div className="space-y-3 my-2">
              <div className="divide-y border rounded-lg overflow-hidden bg-slate-50/50">
                {paletSeleccionadoParaGestion.productos.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{prod.nombre}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        SKU: {prod.sku} • Cantidad en Palet: {prod.cantidad} uds
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        handleReponerEnTienda(paletSeleccionadoParaGestion, prod.id, prod.cantidad)
                      }
                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5"
                    >
                      Reponer Todo ({prod.cantidad} uds)
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="ghost" size="sm" onClick={() => setModalGestionPaletAbierto(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIÁLOGO DE ELIMINAR UBICACIÓN */}
      {/* ========================================================================= */}
      <AlertDialog open={dialogEliminarAbierto} onOpenChange={setDialogEliminarAbierto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base text-slate-900 font-bold">
              ¿Eliminar ubicación "{ubicacionParaEliminar?.nombre}"?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500">
              Esta acción eliminará la ubicación del mapa del almacén. Solo se puede realizar si la
              ubicación no tiene productos con stock físico activo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs h-8">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarEliminarUbicacion}
              className="text-xs h-8 bg-rose-600 hover:bg-rose-700 text-white"
            >
              Eliminar Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
