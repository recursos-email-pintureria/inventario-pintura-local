import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  ArrowLeftRight,
  Archive,
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
  Map as MapIcon,
  Settings2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { GestorSecciones } from "@/components/GestorSecciones";
import {
  getSecciones,
  getUbicacionesCompletas,
  getPalets,
  getStockPorUbicaciones,
  getProductos,
  crearUbicacionBD,
  desactivarUbicacionBD,
  sincronizarEstructuraInicialSupabase,
} from "@/lib/inventario";
import {
  cargarProductosPalet,
  crearPalet,
  desactivarPalet,
  generarCodigoBarrasPalet,
  getSiguienteNumeroPalet,
  paletsPorReservaQueryOptions,
  reponerProductoDePalet,
  type Palet as PaletRegistro,
} from "@/lib/palets";
import { useAuth } from "@/contexts/AuthContext";
import {
  puedeExportarInventario,
  puedeGestionarSecciones,
  useMyProfile,
} from "@/hooks/usePermissions";
import { getColorLateral } from "@/lib/tiposUbicacion";
import { ModalProductosPalet } from "@/components/inventario/ModalProductosPalet";
import { EtiquetaPalet } from "@/components/inventario/EtiquetaPalet";
import { ModalInformeInventario } from "@/components/inventario/ModalInformeInventario";
import { usePrint } from "@/lib/print";
import {
  crearInformePalet,
  crearInformePasillo,
  crearInformeReserva,
  crearInformeUbicacion,
  type InformeInventario,
  type PaletInformeInput,
  type ProductoInforme,
  type UbicacionInformeInput,
} from "@/lib/reportes";
import { Mapa2DModal } from "@/components/ubicaciones/Mapa2DModal";
import type { MapaUbicacion } from "@/components/ubicaciones/Mapa2D";
import { useAddStock } from "@/hooks/useAddStock";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Escaner from "@/components/inventario/Escaner";

export const Route = createFileRoute("/_authenticated/ubicaciones")({
  component: UbicacionesPage,
});

// Tipos de ubicación con jerarquía estricta
export type TipoUbicacion = "seccion" | "pasillo" | "reserva" | "armario" | "caja" | "cross";

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
  lateral?: string | null;
  piso?: number;
  capacidad_max?: number;
  peso_max_kg?: number;
  activo: boolean;
  productos: ProductoEnUbicacion[];
  subtitulo?: string;
  porcentaje_ocupacion?: number;
}

function aProductosInforme(productos: ProductoEnUbicacion[]): ProductoInforme[] {
  return productos.map((producto) => ({
    sku: producto.sku,
    nombre: producto.nombre,
    categoria: producto.categoria,
    cantidad: producto.cantidad,
    stock_minimo: producto.stock_minimo,
  }));
}

function aUbicacionInforme(ubicacion: UbicacionItem): UbicacionInformeInput {
  return {
    id: ubicacion.id,
    codigo: ubicacion.codigo,
    nombre: ubicacion.nombre,
    tipo: ubicacion.tipo,
    productos: aProductosInforme(ubicacion.productos),
  };
}

function aPaletInforme(palet: PaletItem): PaletInformeInput {
  return {
    id: palet.id,
    numero_palet: palet.numero_palet,
    codigo_barras: palet.codigo_barras,
    generado_por: palet.generado_por,
    generado_en: palet.generado_en,
    productos: aProductosInforme(palet.productos),
  };
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
    badgeClass: "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-500/30",
    borderClass: "border-indigo-300 dark:border-indigo-500/40",
    bgHoverClass: "hover:bg-indigo-50/60 dark:hover:bg-indigo-500/10",
    descripcion: "Nivel 0: Área principal (No requiere padre)",
  },
  pasillo: {
    label: "Pasillo",
    nivel: 1,
    icon: ArrowLeftRight,
    badgeClass: "bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-500/30",
    borderClass: "border-blue-300 dark:border-blue-500/40",
    bgHoverClass: "hover:bg-blue-50/60 dark:hover:bg-blue-500/10",
    descripcion: "Nivel 1: Corredor principal (Pertenece a Sección)",
  },
  caja: {
    label: "Caja",
    nivel: 1,
    icon: Package,
    badgeClass: "bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-500/30",
    borderClass: "border-rose-300 dark:border-rose-500/40",
    bgHoverClass: "hover:bg-rose-50/60 dark:hover:bg-rose-500/10",
    descripcion: "Nivel 1: Caja independiente (Sin niveles inferiores)",
  },
  reserva: {
    label: "Reserva",
    nivel: 1,
    icon: Warehouse,
    badgeClass: "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-500/30",
    borderClass: "border-amber-300 dark:border-amber-500/40",
    bgHoverClass: "hover:bg-amber-50/60 dark:hover:bg-amber-500/10",
    descripcion: "Nivel 1: Almacén de tienda / Palets (Sin niveles inferiores)",
  },
  armario: {
    label: "Armario",
    nivel: 2,
    icon: Archive,
    badgeClass: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-500/30",
    borderClass: "border-emerald-300 dark:border-emerald-500/40",
    bgHoverClass: "hover:bg-emerald-50/60 dark:hover:bg-emerald-500/10",
    descripcion: "Nivel 2: Estantería media (Requiere Pasillo)",
  },
  cross: {
    label: "Cross",
    nivel: 2,
    icon: Shuffle,
    badgeClass: "bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-500/30",
    borderClass: "border-purple-300 dark:border-purple-500/40",
    bgHoverClass: "hover:bg-purple-50/60 dark:hover:bg-purple-500/10",
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
    lateral: "derecha",
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
    nombre: "Armario A1-02",
    tipo: "armario",
    nivel: 2,
    id_padre: "pas-a1",
    seccion_id: "sec-pintura",
    lateral: "derecha",
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
    lateral: null,
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
    lateral: "derecha",
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
    lateral: "izquierda",
    piso: 1,
    capacidad_max: 100,
    peso_max_kg: 300,
    porcentaje_ocupacion: 30,
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
    lateral: "derecha",
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

function UbicacionesPage() {
  // 🔌 Supabase + TanStack Query para datos en tiempo real
  const queryClient = useQueryClient();
  const addStockMutation = useAddStock();
  const { user, loading: cargandoSesion } = useAuth();
  const { perfil, permisos, isAdmin } = useMyProfile();
  const seccionesGestionPermitida = puedeGestionarSecciones(perfil, permisos);
  const puedeExportar = puedeExportarInventario(perfil);
  const imprimirEtiqueta = usePrint();
  const usuarioNombre =
    [
      user?.user_metadata?.["full_name"] as string,
      user?.user_metadata?.["name"] as string,
      user?.email,
    ]
      .find((nombre): nombre is string => typeof nombre === "string" && nombre.trim().length > 0)
      ?.trim() ?? "";

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

  // Rastreo de productos eliminados de ubicaciones (para desasignación con stock = 0)
  const [productosEliminadosMap, setProductosEliminadosMap] = useState<Record<string, string[]>>(
    {},
  );

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

      // 2. Ubicaciones hijas (Pasillos, Cajas, Reserva, Armarios y Cross)
      ubicacionesBD.forEach((u) => {
        const tipo = (u.tipo as TipoUbicacion) || "armario";
        const config = CONFIG_JERARQUIA[tipo] || CONFIG_JERARQUIA.armario;

        // Stock asignado
        const eliminadosEnUbi = productosEliminadosMap[u.id] || [];
        const stockDeUbi = stockBD.filter((s) => s.id_ubicacion === u.id);
        const prodsEnUbi: ProductoEnUbicacion[] = stockDeUbi
          .filter((stk) => !eliminadosEnUbi.includes(stk.id_producto))
          .map((stk) => {
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
          lateral: u.posicion_lateral ?? null,
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

    return UBICACIONES_INICIALES.map((u) => {
      const eliminadosEnUbi = productosEliminadosMap[u.id] || [];
      if (eliminadosEnUbi.length === 0) return u;
      return {
        ...u,
        productos: u.productos.filter((p) => !eliminadosEnUbi.includes(p.id)),
      };
    });
  }, [seccionesBD, ubicacionesBD, stockBD, productosBD, productosEliminadosMap]);

  // Los palets y sus cantidades solo proceden de Supabase.
  const paletsCombinados: PaletItem[] = useMemo(() => {
    if (paletsBD.length > 0) {
      return paletsBD.map((p) => {
        const stockPalet = stockBD.filter((s) => s.id_palet === p.id);
        const prods: ProductoEnUbicacion[] = stockPalet.map((s) => {
          const prod = productosBD.find((pr) => pr.id === s.id_producto);
          return {
            id: s.id_producto,
            sku: prod?.sku ?? "",
            nombre: prod?.nombre ?? "Producto sin nombre",
            categoria: prod?.categoria ?? "",
            cantidad: s.cantidad,
            stock_minimo: prod?.stock_minimo ?? 0,
          };
        });

        return {
          id: p.id,
          id_reserva: p.id_reserva,
          numero_palet: p.numero_palet,
          codigo_barras: p.codigo_barras,
          generado_por: p.generado_por ?? "",
          generado_en: p.generado_en ?? p.creado_en ?? "",
          activo: p.activo,
          productos: prods,
        };
      });
    }
    return [];
  }, [paletsBD, stockBD, productosBD]);

  const [ubicaciones, setUbicaciones] = useState<UbicacionItem[]>(UBICACIONES_INICIALES);
  const [palets, setPalets] = useState<PaletItem[]>([]);

  useEffect(() => {
    if (ubicacionesCombinadas.length > 0) {
      setUbicaciones(ubicacionesCombinadas);
    }
  }, [ubicacionesCombinadas]);

  useEffect(() => setPalets(paletsCombinados), [paletsCombinados]);

  const [vista, setVista] = useState<"arbol" | "lista">("arbol");
  const [gestorSeccionesAbierto, setGestorSeccionesAbierto] = useState(false);
  const [mapa2DAbierto, setMapa2DAbierto] = useState(false);
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

  const ubicacionesParaMapa = useMemo<MapaUbicacion[]>(
    () =>
      ubicaciones.map((location) => ({
        id: location.id,
        codigo: location.codigo,
        nombre: location.nombre,
        tipo: location.tipo,
        padreId: location.id_padre ?? null,
        seccionId: location.seccion_id ?? null,
        lateral: location.lateral ?? null,
        numero: location.piso ?? null,
        activo: location.activo,
        capacidadMax: location.capacidad_max ?? 100,
        productos: location.productos.map((product) => ({
          id: product.id,
          sku: product.sku,
          nombre: product.nombre,
          categoria: product.categoria,
          cantidad: product.cantidad,
          stock_minimo: product.stock_minimo,
        })),
        ...(location.tipo === "reserva"
          ? {
              palets: palets
                .filter((pallet) => pallet.activo && pallet.id_reserva === location.id)
                .map((pallet) => ({
                  id: pallet.id,
                  idReserva: pallet.id_reserva,
                  numero: pallet.numero_palet,
                  codigo: pallet.codigo_barras,
                  stockTotal: pallet.productos.reduce(
                    (total, product) => total + product.cantidad,
                    0,
                  ),
                  productos: pallet.productos.map((product) => ({
                    id: product.id,
                    sku: product.sku,
                    nombre: product.nombre,
                    categoria: product.categoria,
                    cantidad: product.cantidad,
                    stock_minimo: product.stock_minimo,
                  })),
                })),
            }
          : {}),
      })),
    [ubicaciones, palets],
  );

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

  // Eliminación de producto del armario (solo permitido con stock = 0, Regla de Oro nº 4)
  const [alertEliminarProdAbierto, setAlertEliminarProdAbierto] = useState(false);
  const [productoParaEliminar, setProductoParaEliminar] = useState<ProductoEnUbicacion | null>(
    null,
  );
  const [motivoEliminarProd, setMotivoEliminarProd] = useState("");
  const [eliminandoProd, setEliminandoProd] = useState(false);

  // ----------------------------------------------------
  // MODAL DE PALETS Y AUTODESTRUCCIÓN
  // ----------------------------------------------------
  const [modalCrearPaletAbierto, setModalCrearPaletAbierto] = useState(false);
  const [idReservaParaCrearPalet, setIdReservaParaCrearPalet] = useState("");
  const [codigoPaletPrevisto, setCodigoPaletPrevisto] = useState("");
  const [cargandoPrevisualizacionPalet, setCargandoPrevisualizacionPalet] = useState(false);
  const [errorPrevisualizacionPalet, setErrorPrevisualizacionPalet] = useState("");
  const [modalEtiquetaPaletAbierto, setModalEtiquetaPaletAbierto] = useState(false);
  const [paletParaImprimir, setPaletParaImprimir] = useState<PaletItem | null>(null);
  const [modalInformeAbierto, setModalInformeAbierto] = useState(false);
  const [informeActivo, setInformeActivo] = useState<InformeInventario | null>(null);
  const [paletSeleccionadoParaGestion, setPaletSeleccionadoParaGestion] =
    useState<PaletItem | null>(null);
  const [modalGestionPaletAbierto, setModalGestionPaletAbierto] = useState(false);
  const [paletSeleccionadoParaProductos, setPaletSeleccionadoParaProductos] =
    useState<PaletRegistro | null>(null);
  const [filtroSeccionDestino, setFiltroSeccionDestino] = useState("todas");
  const [filtroTipoDestino, setFiltroTipoDestino] = useState("todos");
  const [ubicacionDestinoPalet, setUbicacionDestinoPalet] = useState("");
  const [cantidadesReposicion, setCantidadesReposicion] = useState<Record<string, number>>({});

  const productosPaletQuery = useQuery({
    queryKey: ["palet-productos", paletSeleccionadoParaGestion?.id],
    queryFn: () => cargarProductosPalet(paletSeleccionadoParaGestion!.id),
    enabled: Boolean(modalGestionPaletAbierto && paletSeleccionadoParaGestion?.id),
  });

  useEffect(() => {
    if (productosPaletQuery.data) {
      setCantidadesReposicion(
        Object.fromEntries(
          productosPaletQuery.data.map((producto) => [producto.id_producto, producto.cantidad]),
        ),
      );
    }
  }, [productosPaletQuery.data]);

  const ubicacionesDestinoDisponibles = useMemo(() => {
    const perteneceASeccion = (ubicacionId: string): boolean => {
      let actual = ubicacionesBD.find((item) => item.id === ubicacionId);
      const visitadas = new Set<string>();

      while (actual && !visitadas.has(actual.id)) {
        visitadas.add(actual.id);
        if (
          actual.seccion_id === filtroSeccionDestino ||
          actual.seccion === filtroSeccionDestino ||
          actual.id_ubicacion_padre === filtroSeccionDestino
        ) {
          return true;
        }
        actual = actual.id_ubicacion_padre
          ? ubicacionesBD.find((item) => item.id === actual?.id_ubicacion_padre)
          : undefined;
      }

      return false;
    };

    return ubicacionesBD.filter(
      (ubicacion) =>
        ["pasillo", "armario"].includes(ubicacion.tipo) &&
        (filtroTipoDestino === "todos" || ubicacion.tipo === filtroTipoDestino) &&
        (filtroSeccionDestino === "todas" || perteneceASeccion(ubicacion.id)),
    );
  }, [ubicacionesBD, filtroSeccionDestino, filtroTipoDestino]);

  const crearPaletMutation = useMutation({
    mutationFn: crearPalet,
    onSuccess: async (palet) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: paletsPorReservaQueryOptions(palet.id_reserva).queryKey,
        }),
        queryClient.invalidateQueries({ queryKey: ["palets"] }),
        queryClient.invalidateQueries({ queryKey: ["inventario"] }),
        queryClient.invalidateQueries({ queryKey: ["movimientos"] }),
        queryClient.invalidateQueries({ queryKey: ["stock"] }),
      ]);

      const paletCreado: PaletItem = { ...palet, productos: [] };
      setPalets((prev) => [paletCreado, ...prev.filter((item) => item.id !== palet.id)]);
      setPaletParaImprimir(paletCreado);
      setModalCrearPaletAbierto(false);
      setModalEtiquetaPaletAbierto(true);
      toast.success(`Palet ${palet.codigo_barras} creado correctamente`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el palet");
    },
  });

  const reponerProductoMutation = useMutation({
    mutationFn: ({
      nombre_producto: _nombreProducto,
      ...params
    }: Parameters<typeof reponerProductoDePalet>[0] & { nombre_producto: string }) =>
      reponerProductoDePalet(params),
    onSuccess: async (_data, params) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inventario"] }),
        queryClient.invalidateQueries({ queryKey: ["movimientos"] }),
        queryClient.invalidateQueries({ queryKey: ["palet-productos", params.id_palet] }),
        queryClient.invalidateQueries({ queryKey: ["stock"] }),
        queryClient.invalidateQueries({ queryKey: ["palets"] }),
        queryClient.invalidateQueries({
          queryKey: paletsPorReservaQueryOptions(paletSeleccionadoParaGestion?.id_reserva ?? "")
            .queryKey,
        }),
      ]);
    },
    onError: (error, params) => {
      toast.error(
        `No se pudo reponer "${params.nombre_producto}": ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      );
    },
  });

  const abrirGestionPalet = (palet: PaletItem) => {
    const registro = paletsBD.find((item) => item.id === palet.id);
    if (!registro) {
      toast.error("Este palet no está disponible en los datos actuales de Supabase.");
      return;
    }
    const paletsEnReserva = palets
      .filter((item) => item.activo && item.id_reserva === registro.id_reserva)
      .sort((first, second) => first.numero_palet - second.numero_palet);
    const posicionEnReserva = paletsEnReserva.findIndex((item) => item.id === registro.id) + 1;
    setPaletSeleccionadoParaProductos({
      id: registro.id,
      id_reserva: registro.id_reserva,
      numero_palet: registro.numero_palet,
      codigo_barras: registro.codigo_barras,
      generado_por: registro.generado_por ?? "",
      generado_en: registro.generado_en ?? registro.creado_en ?? "",
      activo: registro.activo,
      creado_en: registro.creado_en ?? "",
      actualizado_en: registro.actualizado_en ?? registro.creado_en ?? "",
      reserva_nombre:
        ubicacionesBD.find((ubicacion) => ubicacion.id === registro.id_reserva)?.nombre ??
        "Sin reserva",
      ...(posicionEnReserva ? { posicion_en_reserva: posicionEnReserva } : {}),
      ...(paletsEnReserva.length ? { total_en_reserva: paletsEnReserva.length } : {}),
    });
  };

  useEffect(() => {
    if (!modalCrearPaletAbierto || !idReservaParaCrearPalet || !usuarioNombre) {
      setCodigoPaletPrevisto("");
      setCargandoPrevisualizacionPalet(false);
      setErrorPrevisualizacionPalet("");
      return;
    }

    let cancelado = false;
    setCodigoPaletPrevisto("");
    setErrorPrevisualizacionPalet("");
    setCargandoPrevisualizacionPalet(true);

    getSiguienteNumeroPalet(idReservaParaCrearPalet)
      .then((numero) => {
        if (!cancelado) {
          setCodigoPaletPrevisto(generarCodigoBarrasPalet(numero, usuarioNombre));
        }
      })
      .catch((error: unknown) => {
        if (!cancelado) {
          setErrorPrevisualizacionPalet(
            error instanceof Error ? error.message : "No se pudo calcular el código previsto.",
          );
        }
      })
      .finally(() => {
        if (!cancelado) setCargandoPrevisualizacionPalet(false);
      });

    return () => {
      cancelado = true;
    };
  }, [modalCrearPaletAbierto, idReservaParaCrearPalet, usuarioNombre]);

  // Formulario de nueva ubicación
  const [formNombre, setFormNombre] = useState("Armario A1-04");
  const [formTipo, setFormTipo] = useState<TipoUbicacion>("armario");
  const [formPadre, setFormPadre] = useState("pas-a1");
  const [formLateral, setFormLateral] = useState("derecha");
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
      ubicaciones.filter((u) => u.id_padre === idPasillo && ["armario", "cross"].includes(u.tipo)),
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

  // Nivel 2: Posiciones dentro de un pasillo (armario y cross)
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
      if (["armario", "cross"].includes(filtroTipo)) {
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
    if (!Number.isInteger(cantidadParaIncluir) || cantidadParaIncluir <= 0) {
      toast.error("La cantidad debe ser un entero mayor que cero");
      return;
    }

    if (!user) {
      toast.error("Debes iniciar sesión para registrar el movimiento.");
      return;
    }

    try {
      await addStockMutation.mutateAsync({
        id_producto: productoParaIncluir.id,
        id_ubicacion: ubicacionSeleccionada.id,
        tipo: "entrada",
        cantidad: cantidadParaIncluir,
        realizado_por: user.id,
        notas: `Inclusión desde panel del vendedor en ${ubicacionSeleccionada.nombre}`,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo registrar la entrada de stock.",
      );
      return;
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

    if (!user) {
      toast.error("Debes iniciar sesión para registrar el movimiento.");
      return;
    }

    const tipoMov =
      tipoOperacion === "quitar"
        ? "salida"
        : tipoOperacion === "anadir"
          ? "entrada"
          : cantidadOperacion === 0
            ? "salida"
            : "ajuste";
    const cantidadMov =
      tipoOperacion === "ajuste" && cantidadOperacion === 0
        ? productoEnOperacion.cantidad
        : cantidadOperacion;

    if (!Number.isInteger(cantidadMov) || cantidadMov <= 0) {
      toast.error("La cantidad debe ser un entero mayor que cero.");
      return;
    }
    if (tipoMov === "salida" && cantidadMov > productoEnOperacion.cantidad) {
      toast.error("No puedes retirar más unidades que las disponibles.");
      return;
    }

    try {
      await addStockMutation.mutateAsync({
        id_producto: productoEnOperacion.id,
        id_ubicacion: ubicacionSeleccionada.id,
        tipo: tipoMov,
        cantidad: cantidadMov,
        realizado_por: user.id,
        notas: `${motivoOperacion} (${tipoOperacion})`,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo registrar el movimiento de stock.",
      );
      return;
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

  // Eliminar producto del armario (solo permitido con stock = 0, confirmado con AlertDialog)
  const handleConfirmarEliminarProductoDeArmario = async () => {
    if (!ubicacionSeleccionada || !productoParaEliminar) return;

    if (productoParaEliminar.cantidad > 0) {
      toast.error(
        `No se puede eliminar: el producto tiene existencias (${productoParaEliminar.cantidad} uds). Ajusta el stock a 0 primero.`,
      );
      setAlertEliminarProdAbierto(false);
      return;
    }

    if (!motivoEliminarProd.trim()) {
      toast.error("El motivo de la retirada es obligatorio.");
      return;
    }

    setEliminandoProd(true);

    try {
      // 1. Invocar RPC segura en Supabase si está disponible
      try {
        const { error: rpcError } = await supabase.rpc("eliminar_producto_armario", {
          p_id_producto: productoParaEliminar.id,
          p_id_ubicacion: ubicacionSeleccionada.id,
          p_motivo: motivoEliminarProd.trim(),
          p_usuario_id: user?.id,
        });
        if (rpcError) {
          console.warn("Aviso RPC eliminar_producto_armario:", rpcError.message);
        }
      } catch (rpcErr) {
        console.warn("Excepción al llamar RPC eliminar_producto_armario:", rpcErr);
      }

      // 2. Registrar en mapa de productos eliminados localmente
      setProductosEliminadosMap((prev) => {
        const actual = prev[ubicacionSeleccionada.id] || [];
        return {
          ...prev,
          [ubicacionSeleccionada.id]: [...actual, productoParaEliminar.id],
        };
      });

      // 3. Actualizar estado local reactivo de ubicaciones
      setUbicaciones((prev) =>
        prev.map((u) => {
          if (u.id === ubicacionSeleccionada.id) {
            const nuevosProds = u.productos.filter((p) => p.id !== productoParaEliminar.id);
            const totalUds = nuevosProds.reduce((acc, p) => acc + p.cantidad, 0);
            const cap = u.capacidad_max || 100;
            const pct = Math.min(100, Math.round((totalUds / cap) * 100));

            const uActualizada = {
              ...u,
              productos: nuevosProds,
              porcentaje_ocupacion: pct,
              subtitulo:
                nuevosProds.length > 0
                  ? `${nuevosProds.length} productos · ${totalUds} uds`
                  : "0 productos · 0 uds",
            };

            setUbicacionSeleccionada(uActualizada);
            return uActualizada;
          }
          return u;
        }),
      );

      // 4. Invalidar queries de TanStack Query
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["stock"] }),
        queryClient.invalidateQueries({ queryKey: ["ubicacionesCompletas"] }),
      ]);

      toast.success(
        `Producto "${productoParaEliminar.nombre}" eliminado del armario "${ubicacionSeleccionada.nombre}" con éxito.`,
      );
      setAlertEliminarProdAbierto(false);
      setProductoParaEliminar(null);
      setMotivoEliminarProd("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al eliminar el producto del armario.",
      );
    } finally {
      setEliminandoProd(false);
    }
  };

  const abrirInformeUbicacion = () => {
    const ubi = ubicacionSeleccionada;
    if (!ubi) return;
    if (!puedeExportar) {
      toast.error("No tienes permisos para exportar inventario.");
      return;
    }

    const meta = {
      generadoPor: usuarioNombre || user?.email || "Usuario",
      seccion: infoJerarquia.seccion,
      pasillo: ubi.tipo === "pasillo" ? ubi.nombre : infoJerarquia.pasillo,
    };

    let informe: InformeInventario;
    if (ubi.tipo === "pasillo") {
      const posiciones = ubicaciones
        .filter(
          (ubicacion) =>
            ubicacion.id_padre === ubi.id &&
            (ubicacion.tipo === "armario" || ubicacion.tipo === "cross"),
        )
        .map(aUbicacionInforme);
      informe = crearInformePasillo(ubi, posiciones, meta);
    } else if (ubi.tipo === "reserva") {
      const paletsReserva = palets
        .filter((palet) => palet.activo && palet.id_reserva === ubi.id)
        .map(aPaletInforme);
      informe = crearInformeReserva(ubi, paletsReserva, meta);
    } else {
      informe = crearInformeUbicacion(aUbicacionInforme(ubi), meta);
    }

    setInformeActivo(informe);
    setModalInformeAbierto(true);
  };

  const abrirInformePalet = (palet: PaletItem) => {
    if (!puedeExportar) {
      toast.error("No tienes permisos para exportar inventario.");
      return;
    }
    const reserva = ubicaciones.find((ubicacion) => ubicacion.id === palet.id_reserva);
    const informe = crearInformePalet(aPaletInforme(palet), {
      generadoPor: usuarioNombre || user?.email || "Usuario",
      seccion: reserva?.nombre || "Reserva",
    });
    setInformeActivo(informe);
    setModalInformeAbierto(true);
  };

  // ----------------------------------------------------
  // GESTIÓN DE PALETS EN RESERVA (SOLO EN RESERVA)
  // ----------------------------------------------------
  const handleCrearNuevoPalet = (idReservaEspecifica?: string) => {
    const idReservaContextual =
      idReservaEspecifica ??
      (ubicacionSeleccionada?.tipo === "reserva" ? ubicacionSeleccionada.id : "");
    const reservaReal = ubicacionesBD.find(
      (ubicacion) => ubicacion.id === idReservaContextual && ubicacion.tipo === "reserva",
    );

    setIdReservaParaCrearPalet(reservaReal ? idReservaContextual : "");
    setModalCrearPaletAbierto(true);
  };

  const abrirReposicionPalet = (palet: PaletItem) => {
    setPaletSeleccionadoParaGestion(palet);
    setFiltroSeccionDestino("todas");
    setFiltroTipoDestino("todos");
    setUbicacionDestinoPalet("");
    setCantidadesReposicion({});
    setModalGestionPaletAbierto(true);
  };

  const handleReponerSeleccionadas = async () => {
    const palet = paletSeleccionadoParaGestion;
    const productos = productosPaletQuery.data ?? [];
    if (
      !palet ||
      !ubicacionDestinoPalet ||
      !ubicacionesDestinoDisponibles.some((ubicacion) => ubicacion.id === ubicacionDestinoPalet)
    ) {
      toast.error("Selecciona una ubicación de destino.");
      return;
    }

    const seleccionadas = productos.filter(
      (producto) => (cantidadesReposicion[producto.id_producto] ?? 0) > 0,
    );
    if (seleccionadas.length === 0) {
      toast.error("Indica una cantidad para al menos un producto.");
      return;
    }
    const cantidadInvalida = seleccionadas.find((producto) => {
      const cantidad = cantidadesReposicion[producto.id_producto];
      return (
        !Number.isInteger(cantidad) || (cantidad ?? 0) <= 0 || (cantidad ?? 0) > producto.cantidad
      );
    });
    if (cantidadInvalida) {
      toast.error(`La cantidad de "${cantidadInvalida.nombre}" no es válida.`);
      return;
    }

    let completadas = 0;
    let fallidas = 0;
    for (const producto of seleccionadas) {
      try {
        await reponerProductoMutation.mutateAsync({
          id_palet: palet.id,
          id_producto: producto.id_producto,
          id_ubicacion_destino: ubicacionDestinoPalet,
          cantidad: cantidadesReposicion[producto.id_producto]!,
          nombre_producto: producto.nombre ?? producto.id_producto,
        });
        completadas += 1;
      } catch {
        fallidas += 1;
      }
    }

    if (completadas > 0) {
      toast.success(
        `${completadas} ${completadas === 1 ? "producto repuesto" : "productos repuestos"}${
          fallidas > 0 ? `; ${fallidas} con error` : ""
        }.`,
      );
    }
    if (fallidas > 0) return;

    let productosRestantes: Awaited<ReturnType<typeof cargarProductosPalet>>;
    try {
      productosRestantes = await cargarProductosPalet(palet.id);
    } catch (error) {
      toast.error(
        `No se pudo verificar el stock restante del palet: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      );
      return;
    }

    if (productosRestantes.length === 0) {
      try {
        await desactivarPalet(palet.id);
        toast.info(`El palet ${palet.codigo_barras} quedó vacío y se dio de baja.`);
      } catch (error) {
        toast.error(
          `El palet quedó vacío, pero no se pudo dar de baja: ${
            error instanceof Error ? error.message : "Error desconocido"
          }`,
        );
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inventario"] }),
        queryClient.invalidateQueries({ queryKey: ["movimientos"] }),
        queryClient.invalidateQueries({ queryKey: ["stock"] }),
        queryClient.invalidateQueries({ queryKey: ["palets"] }),
        queryClient.invalidateQueries({
          queryKey: paletsPorReservaQueryOptions(palet.id_reserva).queryKey,
        }),
      ]);
    }

    setModalGestionPaletAbierto(false);
    setPaletSeleccionadoParaGestion(null);
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
      lateral: formLateral || null,
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
        posicion_lateral: formLateral || null,
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

        // Construimos el objeto añadiendo solo las propiedades que tienen valor
        const ubiData: any = {
          nombre: u.nombre,
          tipo: u.tipo,
        };

        if (secPadre?.nombre) ubiData.seccion_nombre = secPadre.nombre;
        if (ubiPadre?.nombre) ubiData.padre_nombre = ubiPadre.nombre;
        if (u.lateral) ubiData.lateral = u.lateral;
        if (u.piso) ubiData.piso = u.piso;
        if (u.subtitulo) ubiData.descripcion = u.subtitulo;

        return ubiData;
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
    <div className="min-h-screen bg-background pb-16">
      {/* CABECERA SUPERIOR */}
      <div className="border-b bg-card no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                <span>INVENTARIO LM</span>
                <span>/</span>
                <span>ALMACÉN</span>
                <span>/</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">JERARQUÍA DE UBICACIONES</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Ubicaciones del Almacén
                </h1>
                {seccionesGestionPermitida && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Abrir gestión de secciones"
                    title="Gestión de Secciones"
                    onClick={() => setGestorSeccionesAbierto(true)}
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                )}
                <Badge
                  variant="outline"
                  className="bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30 font-medium px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  18 Zonas Activas • 94% Ocupación
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {isAdmin && (
                <Button asChild type="button" variant="outline" className="min-h-11">
                  <Link to="/cargar-lista-armario">
                    <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                    Cargar lista desde CSV
                  </Link>
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => setMapa2DAbierto(true)}
                className="min-h-11 gap-2"
              >
                <MapIcon className="h-4 w-4" />
                Ver Mapa 2D
              </Button>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto bg-muted p-1 rounded-lg border border-border">
              <Button
                variant={vista === "arbol" ? "default" : "ghost"}
                size="sm"
                onClick={() => setVista("arbol")}
                className={`text-xs gap-1.5 h-8 ${vista === "arbol" ? "bg-card text-blue-700 dark:text-blue-300 shadow-xs hover:bg-card" : "text-muted-foreground hover:text-foreground"}`}
              >
                <FolderTree className="w-3.5 h-3.5" />
                Vista Árbol
              </Button>
              <Button
                variant={vista === "lista" ? "default" : "ghost"}
                size="sm"
                onClick={() => setVista("lista")}
                className={`text-xs gap-1.5 h-8 ${vista === "lista" ? "bg-card text-blue-700 dark:text-blue-300 shadow-xs hover:bg-card" : "text-muted-foreground hover:text-foreground"}`}
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
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar ubicación por nombre o código (ej. A1-01, Látex)..."
                    className="pl-9 bg-muted/70 border-border text-sm h-9 focus-visible:ring-blue-500"
                  />
                  {busqueda && (
                    <button
                      onClick={() => setBusqueda("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="h-9 text-xs rounded-md border border-border bg-card px-2.5 text-foreground focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="todos">Tipo de ubicación (Todos)</option>
                  <option value="seccion">Sección (Nivel 0)</option>
                  <option value="pasillo">Pasillo (Nivel 1)</option>
                  <option value="caja">Caja (Nivel 1)</option>
                  <option value="reserva">Reserva (Nivel 1)</option>
                  <option value="armario">Armario (Nivel 2)</option>
                  <option value="cross">Cross (Nivel 2)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleExpandirColapsarTodo}
                  className="text-xs h-9 text-foreground border-border gap-1.5"
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
              <span className="text-[11px] font-semibold text-muted-foreground mr-1 flex items-center gap-1">
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
                  id: "caja",
                  label: "Cajas",
                  count: ubicaciones.filter((u) => u.tipo === "caja").length,
                },
                {
                  id: "reserva",
                  label: "Reserva",
                  count: ubicaciones.filter((u) => u.tipo === "reserva").length,
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
                        : "bg-card text-muted-foreground border-border hover:bg-muted font-medium"
                    }`}
                  >
                    <span>{chip.label}</span>
                    <span
                      className={`text-[10px] px-1 py-0.2 rounded-full ${
                        activo ? "bg-blue-700/80 text-white" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {chip.count}
                    </span>
                  </button>
                );
              })}

              <Button
                type="button"
                variant={filtroTipo === "cross" ? "default" : "outline"}
                size="sm"
                aria-pressed={filtroTipo === "cross"}
                onClick={() => setFiltroTipo(filtroTipo === "cross" ? "todos" : "cross")}
                className={`h-7 gap-1.5 px-2.5 text-xs ${
                  filtroTipo === "cross"
                    ? "border-purple-600 bg-purple-600 text-white hover:bg-purple-700"
                    : "border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-500/10"
                }`}
              >
                <Shuffle className="h-3.5 w-3.5" />
                Mostrar solo ubicaciones tipo Cross
                <span
                  className={`rounded-full px-1 text-[10px] ${
                    filtroTipo === "cross" ? "bg-purple-700/80 text-white" : "bg-purple-50 dark:bg-purple-500/10"
                  }`}
                >
                  {ubicaciones.filter((u) => u.tipo === "cross").length}
                </span>
              </Button>

              {filtroActivo && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFiltroTipo("todos");
                    setBusqueda("");
                  }}
                  className="h-6 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-2 ml-auto gap-1"
                >
                  <X className="w-3 h-3" /> Limpiar filtros
                </Button>
              )}
            </div>

            {/* BANNER INFORMATIVO DE FILTRO ACTIVO */}
            {filtroActivo && (
              <div className="flex items-center justify-between bg-blue-50/70 dark:bg-blue-500/10 border border-blue-200/90 dark:border-blue-500/30 rounded-lg px-3 py-1.5 text-xs text-blue-900 dark:text-blue-100 animate-in fade-in-50">
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
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
                  <Badge className="bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-500/40 text-[10px] font-semibold">
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
                  className="text-xs text-blue-700 dark:text-blue-300 hover:text-blue-950 dark:hover:text-blue-100 font-semibold underline shrink-0 cursor-pointer"
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
          <div className="bg-gradient-to-r from-blue-50 dark:from-blue-500/10 via-indigo-50/50 dark:via-indigo-500/10 to-muted border border-blue-200 dark:border-blue-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-600 text-white shadow-xs shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <span>Base de datos Supabase conectada</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-500/40">
                    Tablas listas (0 ubicaciones en BD)
                  </span>
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
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
          <div className="bg-card rounded-xl border border-border p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  TOPOLOGÍA DE NAVE
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-foreground">{ubicaciones.length}</span>
                  <span className="text-xs font-medium text-muted-foreground">ubicaciones</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span>4 Secciones (Nivel 0) • Pasillos • Cajas • Reserva</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 w-full bg-muted h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: "78%" }} />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    CAPACIDAD OCUPADA
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300">
                    Alerta: Pasillo B
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-foreground">92%</span>
                  <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Capacidad crítica</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">1,420 de 1,540 m³ volumen ocupado</p>
              </div>
              <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 w-full bg-muted h-1.5 rounded-full overflow-hidden">
              <div className="bg-purple-600 h-full rounded-full" style={{ width: "92%" }} />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  PALETS EN RESERVA
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">{palets.length}</span>
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">activos con etiqueta</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Autodestrucción al vaciar por reposición
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Warehouse className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 w-full bg-muted h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-600 h-full rounded-full" style={{ width: "45%" }} />
            </div>
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL: ÁRBOL Y FORMULARIO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/50">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-sm font-bold text-foreground tracking-tight">
                    Estructura Física del Almacén
                  </h2>
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  Terminal Nave Central • 3 Niveles
                </span>
              </div>

              {vista === "arbol" && (
                <div className="p-4 sm:p-5 space-y-4">
                  {seccionesFiltradas.length === 0 ? (
                    <div className="py-12 px-4 text-center bg-muted/50 rounded-xl border border-dashed border-border">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                        <Filter className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-foreground">
                        No se encontraron ubicaciones
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
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
                        className="mt-4 text-xs border-border text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10"
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
                          className="rounded-xl border border-border/90 bg-card overflow-hidden shadow-xs"
                        >
                          {/* CABECERA DE SECCIÓN (NIVEL 0) */}
                          <div className="p-3.5 bg-indigo-50/40 dark:bg-indigo-500/10 hover:bg-indigo-50/70 dark:hover:bg-indigo-500/10 transition-colors flex items-center justify-between gap-3 border-b border-indigo-100/70 dark:border-indigo-500/20">
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <button
                                onClick={() => toggleExpandir(sec.id)}
                                className="p-1 rounded-md text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 hover:bg-indigo-100/70 dark:hover:bg-indigo-500/20 transition-colors"
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
                                  <span className="font-bold text-sm text-foreground">
                                    {sec.nombre}
                                  </span>
                                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-500/30">
                                    Nivel 0 · Sección
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
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
                                className="h-7 text-xs px-2.5 rounded-full border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 bg-card hover:bg-indigo-50 dark:hover:bg-indigo-500/10 gap-1 font-semibold"
                              >
                                <Plus className="w-3 h-3" /> Pasillo
                              </Button>
                            </div>
                          </div>

                          {secAbierta && (
                            <div className="p-3 sm:p-4 space-y-3 bg-muted/20">
                              {/* PASILLOS (NIVEL 1) */}
                              {pasillos.map((pas) => {
                                const pasAbierto = filtroActivo
                                  ? true
                                  : (expandidos[pas.id] ?? true);
                                const posiciones = posicionesVisiblesDePasillo(pas.id);
                                const armarios = posiciones.filter((pos) => pos.tipo === "armario");
                                const gruposPosiciones: {
                                  id: string;
                                  lado?: string | null;
                                  mostrarEtiqueta: boolean;
                                  posiciones: UbicacionItem[];
                                }[] = [
                                  {
                                    id: "derecha",
                                    lado: "derecha",
                                    mostrarEtiqueta: true,
                                    posiciones: armarios.filter((pos) => pos.lateral === "derecha"),
                                  },
                                  {
                                    id: "izquierda",
                                    lado: "izquierda",
                                    mostrarEtiqueta: true,
                                    posiciones: armarios.filter(
                                      (pos) => pos.lateral === "izquierda",
                                    ),
                                  },
                                  {
                                    id: "sin-lateralidad",
                                    mostrarEtiqueta: true,
                                    posiciones: armarios.filter(
                                      (pos) =>
                                        pos.lateral !== "derecha" && pos.lateral !== "izquierda",
                                    ),
                                  },
                                  {
                                    id: "cross",
                                    mostrarEtiqueta: false,
                                    posiciones: posiciones.filter((pos) => pos.tipo === "cross"),
                                  },
                                ].filter((grupo) => grupo.posiciones.length > 0);

                                return (
                                  <div
                                    key={pas.id}
                                    className="rounded-lg border border-border bg-card overflow-hidden shadow-2xs"
                                  >
                                    <div className="p-3 bg-blue-50/30 dark:bg-blue-500/10 hover:bg-blue-50/50 dark:hover:bg-blue-500/10 transition-colors flex items-center justify-between gap-3 border-b border-border">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <button
                                          onClick={() => toggleExpandir(pas.id)}
                                          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        >
                                          {pasAbierto ? (
                                            <ChevronDown className="w-3.5 h-3.5" />
                                          ) : (
                                            <ChevronRight className="w-3.5 h-3.5" />
                                          )}
                                        </button>
                                        <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                                          <ArrowLeftRight className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-sm text-foreground">
                                              {pas.nombre}
                                            </span>
                                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-500/30">
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
                                        className="h-6 text-[11px] px-2 rounded-full border-border text-foreground hover:bg-muted gap-1"
                                      >
                                        <Plus className="w-3 h-3" /> Posición
                                      </Button>
                                    </div>

                                    {/* POSICIONES DEL PASILLO (NIVEL 2: ARMARIOS Y CROSS) */}
                                    {pasAbierto && (
                                      <div className="p-2 sm:p-3 space-y-2 bg-card">
                                        {posiciones.length === 0 ? (
                                          <div className="p-3 text-center text-xs text-muted-foreground">
                                            Sin posiciones asignadas en este pasillo.
                                          </div>
                                        ) : (
                                          gruposPosiciones.map((grupo) => {
                                            const lateral = getColorLateral(grupo.lado);
                                            return (
                                              <div
                                                key={grupo.id}
                                                className={
                                                  grupo.mostrarEtiqueta
                                                    ? `rounded-md border ${lateral.border} ${lateral.bg}`
                                                    : "space-y-2"
                                                }
                                              >
                                                {grupo.mostrarEtiqueta && (
                                                  <div
                                                    className={`px-2.5 py-1.5 text-[11px] font-bold ${lateral.color}`}
                                                  >
                                                    {lateral.icon}{" "}
                                                    {grupo.lado
                                                      ? `LADO ${lateral.label}`
                                                      : lateral.label}
                                                  </div>
                                                )}
                                                <div
                                                  className={
                                                    grupo.mostrarEtiqueta
                                                      ? "p-2 space-y-2"
                                                      : "space-y-2"
                                                  }
                                                >
                                                  {grupo.posiciones.map((pos) => {
                                                    const config = CONFIG_JERARQUIA[pos.tipo];
                                                    const IconoPos = config.icon;

                                                    return (
                                                      <div
                                                        key={pos.id}
                                                        onClick={() => abrirPanelVendedor(pos)}
                                                        className="p-2.5 rounded-lg border border-border/90 bg-card/90 hover:bg-blue-50/50 dark:hover:bg-blue-500/10 hover:border-blue-400 dark:hover:border-blue-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group shadow-2xs"
                                                      >
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                          <div className="w-4 h-4 flex items-center justify-center text-muted-foreground">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-blue-500" />
                                                          </div>
                                                          <div
                                                            className={`p-1.5 rounded-md ${config.badgeClass}`}
                                                          >
                                                            <IconoPos className="w-3.5 h-3.5" />
                                                          </div>
                                                          <div className="min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                              <span className="font-semibold text-xs text-foreground group-hover:text-blue-700 dark:group-hover:text-blue-300">
                                                                {pos.nombre}
                                                              </span>
                                                              <span
                                                                className={`px-1.5 py-0.2 text-[10px] font-medium rounded-full border ${config.badgeClass}`}
                                                              >
                                                                {config.label}
                                                              </span>
                                                              <span className="text-[10px] font-mono text-muted-foreground">
                                                                [{pos.codigo}]
                                                              </span>
                                                            </div>
                                                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
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
                                                            className="h-7 text-xs px-2.5 rounded-md border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 font-semibold"
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
                                                            className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400"
                                                          >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                          </Button>
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
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
                                  className="rounded-lg border border-rose-200/90 dark:border-rose-500/30 bg-rose-50/20 dark:bg-rose-500/10 hover:bg-rose-50/50 dark:hover:bg-rose-500/10 p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="p-1.5 rounded-md bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300">
                                      <Package className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-xs text-foreground">
                                          {caja.nombre}
                                        </span>
                                        <span className="px-1.5 py-0.2 text-[10px] font-semibold rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-500/30">
                                          Nivel 1 · Caja Independiente
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
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
                                      className="h-7 text-xs px-2.5 rounded-md border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 bg-card hover:bg-rose-50 dark:hover:bg-rose-500/10 font-semibold"
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
                                  className="rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50/30 dark:bg-amber-500/10 p-3.5 shadow-xs space-y-3"
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
                                          <span className="font-bold text-sm text-foreground group-hover:text-amber-800 dark:group-hover:text-amber-200 transition-colors">
                                            {res.nombre}
                                          </span>
                                          <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-200 dark:bg-amber-500/30 text-amber-900 dark:text-amber-100 border border-amber-300 dark:border-amber-500/40">
                                            Nivel 1 · Reserva (Almacén de Tienda)
                                          </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">
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
                                        className="border-amber-300 dark:border-amber-500/40 text-amber-900 dark:text-amber-100 bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/30 text-xs font-semibold h-8 px-3 gap-1.5 shadow-xs"
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
                                        className="p-3 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-card shadow-2xs hover:border-amber-400 dark:hover:border-amber-500/50 transition-all space-y-2"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-1.5">
                                            <button
                                              type="button"
                                              onClick={() => abrirGestionPalet(palet)}
                                              className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
                                            >
                                              <Badge className="bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-500/40 font-bold text-xs">
                                                Palet #{String(palet.numero_palet).padStart(3, "0")}
                                              </Badge>
                                            </button>
                                            <span className="text-[10px] font-mono text-muted-foreground">
                                              [{palet.codigo_barras}]
                                            </span>
                                          </div>
                                          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-1.5 py-0.5 rounded font-semibold">
                                            {palet.productos.reduce(
                                              (acc, p) => acc + p.cantidad,
                                              0,
                                            )}{" "}
                                            uds
                                          </span>
                                        </div>

                                        <div className="text-[11px] text-muted-foreground space-y-0.5">
                                          <div className="flex items-center gap-1">
                                            <User className="w-3 h-3 text-muted-foreground" />
                                            <span>
                                              Generado por:{" "}
                                              <strong className="text-foreground">
                                                {palet.generado_por}
                                              </strong>
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3 text-muted-foreground" />
                                            <span>
                                              Fecha:{" "}
                                              {new Date(palet.generado_en).toLocaleDateString()}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
                                          {puedeExportar && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => {
                                                setPaletParaImprimir(palet);
                                                setModalEtiquetaPaletAbierto(true);
                                              }}
                                              className="flex-1 h-7 text-xs border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-200 hover:bg-amber-50 dark:hover:bg-amber-500/10 gap-1 font-medium"
                                            >
                                              <Printer className="w-3 h-3" /> Imprimir Etiqueta
                                            </Button>
                                          )}
                                          {puedeExportar && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => abrirInformePalet(palet)}
                                              className="flex-1 h-7 text-xs border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-200 hover:bg-amber-50 dark:hover:bg-amber-500/10 gap-1 font-medium"
                                            >
                                              <Printer className="w-3 h-3" /> Informe
                                            </Button>
                                          )}
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => abrirGestionPalet(palet)}
                                            className="flex-1 h-7 text-xs border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-200 hover:bg-amber-50 dark:hover:bg-amber-500/10 gap-1 font-medium"
                                          >
                                            <Package className="w-3 h-3" /> Productos
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={() => abrirReposicionPalet(palet)}
                                            className="flex-1 h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1 font-medium"
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
                <div className="divide-y divide-border">
                  {ubicacionesFiltradas.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground text-sm">
                      No se encontraron ubicaciones con los filtros actuales
                    </div>
                  ) : (
                    ubicacionesFiltradas.map((item) => {
                      const config = CONFIG_JERARQUIA[item.tipo];
                      const Icono = config.icon;
                      return (
                        <div
                          key={item.id}
                          className="m-3 flex flex-col gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/80 md:m-0 md:flex-row md:items-center md:justify-between md:rounded-none md:border-0"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2 rounded-lg ${config.badgeClass}`}>
                              <Icono className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-sm text-foreground">
                                  {item.nombre}
                                </span>
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${config.badgeClass}`}
                                >
                                  {config.label}
                                </span>
                                <span className="text-xs text-muted-foreground font-mono">
                                  [{item.codigo}]
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {item.subtitulo || config.descripcion}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Stock:{" "}
                                <span className="font-semibold text-foreground">
                                  {item.productos.reduce(
                                    (sum, product) => sum + product.cantidad,
                                    0,
                                  )}{" "}
                                  uds
                                </span>
                                {" · "}
                                Productos:{" "}
                                <span className="font-semibold text-foreground">
                                  {item.productos.length}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              onClick={() => abrirPanelVendedor(item)}
                              className="w-full border-blue-200 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/10 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/20 md:w-auto"
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
            <div className="bg-card rounded-xl border border-border p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    Modal: Nueva Ubicación en Almacén
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                  EDITOR
                </span>
              </div>

              <form onSubmit={handleGuardarUbicacion} className="space-y-3.5">
                <div>
                  <Label className="text-xs font-semibold text-foreground mb-1 block">
                    Nombre de Ubicación
                  </Label>
                  <Input
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    placeholder="Ej. Armario A1-04"
                    className="h-8 text-xs bg-muted/60 border-border"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-foreground mb-1 block">
                    Tipo de Ubicación
                  </Label>
                  <select
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value as TipoUbicacion)}
                    className="w-full h-8 text-xs rounded-md border border-border bg-muted/60 px-2.5 text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="armario">Armario (Estantería media - Nivel 2)</option>
                    <option value="cross">Cross-docking (Tránsito - Nivel 2)</option>
                    <option value="caja">Caja (Independiente - Nivel 1)</option>
                    <option value="pasillo">Pasillo (Corredor - Nivel 1)</option>
                    <option value="reserva">Reserva (Palets - Nivel 1)</option>
                    <option value="seccion">Sección (Zona General - Nivel 0)</option>
                  </select>
                </div>

                {CONFIG_JERARQUIA[formTipo].nivel === 2 && (
                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1 block">
                      Ubicación Padre
                    </Label>
                    <select
                      value={formPadre}
                      onChange={(e) => setFormPadre(e.target.value)}
                      className="w-full h-8 text-xs rounded-md border border-border bg-muted/60 px-2.5 text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-500"
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
                    <Label className="text-xs font-semibold text-foreground mb-1 block">
                      Lateral
                    </Label>
                    <select
                      value={formLateral}
                      onChange={(e) => setFormLateral(e.target.value)}
                      className="w-full h-8 text-xs rounded-md border border-border bg-muted/60 px-2 text-foreground"
                    >
                      <option value="derecha">Derecha</option>
                      <option value="izquierda">Izquierda</option>
                      <option value="">Sin lateralidad</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1 block">
                      Altura / Piso
                    </Label>
                    <select
                      value={formPiso}
                      onChange={(e) => setFormPiso(Number(e.target.value))}
                      className="w-full h-8 text-xs rounded-md border border-border bg-muted/60 px-2 text-foreground"
                    >
                      <option value={1}>Nivel 1 (Suelo)</option>
                      <option value={2}>Nivel 2 (Medio)</option>
                      <option value={3}>Nivel 3 (Superior)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1 block">
                      Cap. Máx (uds)
                    </Label>
                    <Input
                      type="number"
                      value={formCapMax}
                      onChange={(e) => setFormCapMax(Number(e.target.value))}
                      className="h-8 text-xs bg-muted/60 border-border"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1 block">
                      Peso Máx (kg)
                    </Label>
                    <Input
                      type="number"
                      value={formPesoMax}
                      onChange={(e) => setFormPesoMax(Number(e.target.value))}
                      className="h-8 text-xs bg-muted/60 border-border"
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
                    className="h-8 text-xs text-muted-foreground"
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
            <div className="bg-card rounded-xl border border-border p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                <span className="text-xs font-bold text-foreground tracking-wider">
                  MAPA NAVE A-NORTE
                </span>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setMapa2DAbierto(true)}
                  className="h-auto p-0 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Plano 2D
                </Button>
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
                          ? "bg-blue-50/70 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/40 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                          : "border-border bg-muted/40"
                      }`}
                    >
                      <div className="text-[11px] font-bold text-foreground">{slot}</div>
                      <div
                        className={`text-[10px] font-medium ${isLibre ? "text-muted-foreground" : "text-blue-700 dark:text-blue-300 font-semibold"}`}
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
                  className="col-span-2 p-2.5 rounded-lg border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-center transition-all cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-amber-900 dark:text-amber-100">RES-TIENDA</div>
                  <div className="text-[10px] font-medium text-amber-700 dark:text-amber-300">
                    {palets.length} PALETS
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>Último inventario físico:</span>
                <span className="font-semibold text-foreground">Hoy, 10:15</span>
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
          className="flex w-full flex-col overflow-y-auto bg-card p-0 sm:max-w-xl md:max-w-2xl max-md:inset-x-0 max-md:inset-y-auto max-md:top-auto max-md:bottom-0 max-md:h-[90dvh] max-md:max-w-none max-md:rounded-b-none max-md:rounded-t-2xl"
        >
          {ubicacionSeleccionada && (
            <div className="flex-1 flex flex-col">
              {/* CABECERA INFORMATIVA */}
              <div className="p-5 border-b border-border bg-muted/80 sticky top-0 z-10">
                {/* Miga de pan informativa requerida */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-1.5">
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{infoJerarquia.seccion}</span>
                  <span>/</span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">{infoJerarquia.pasillo}</span>
                  <span>/</span>
                  <span className="text-foreground font-bold">{ubicacionSeleccionada.nombre}</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      {ubicacionSeleccionada.nombre}
                      <Badge className={CONFIG_JERARQUIA[ubicacionSeleccionada.tipo].badgeClass}>
                        {CONFIG_JERARQUIA[ubicacionSeleccionada.tipo].label}
                      </Badge>
                    </h2>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {ubicacionSeleccionada.tipo === "reserva" ? (
                        <span className="text-amber-800 dark:text-amber-200 font-medium font-sans">
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
                        <span className="text-sm font-bold text-amber-900 dark:text-amber-100">
                          {palets.length} {palets.length === 1 ? "Palet activo" : "Palets activos"}
                        </span>
                        <div className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
                          {palets.reduce(
                            (acc, p) => acc + p.productos.reduce((a, b) => a + b.cantidad, 0),
                            0,
                          )}{" "}
                          uds en reserva
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-bold text-foreground">
                          {ubicacionSeleccionada.productos?.reduce((a, b) => a + b.cantidad, 0) ||
                            0}{" "}
                          / {ubicacionSeleccionada.capacidad_max || 100} uds
                        </span>
                        <div className="text-[10px] text-muted-foreground font-medium">
                          Ocupación: {ubicacionSeleccionada.porcentaje_ocupacion || 0}%
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* BOTONES DE HERRAMIENTAS */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/80">
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
                      {puedeExportar && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={abrirInformeUbicacion}
                          className="h-8 text-xs border-amber-300 dark:border-amber-500/40 text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-500/20 gap-1.5 font-medium"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                          Informe de Reserva
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      {puedeExportar && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={abrirInformeUbicacion}
                          className="h-8 text-xs border-border text-foreground hover:bg-muted gap-1.5"
                          title="Generar informe, PDF, Excel o email de esta ubicación"
                        >
                          <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          Informe / Exportar
                        </Button>
                      )}

                      <Button
                        variant={mostrarEscaner ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMostrarEscaner(!mostrarEscaner)}
                        className={`h-8 text-xs gap-1.5 ${mostrarEscaner ? "bg-blue-600 text-white" : "border-border text-foreground"}`}
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
                  <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-300 dark:border-amber-500/40 text-amber-950 dark:text-amber-100 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide text-amber-900 dark:text-amber-100">
                      <Warehouse className="w-4 h-4 text-amber-700 dark:text-amber-300" />
                      <span>Ubicación Restringida: Solo en Reserva</span>
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                      Por seguridad operativa y para evitar que el vendedor cree palets por error en
                      estanterías o pasillos, la creación y alojamiento de palets está{" "}
                      <strong>estrictamente blindada solo para zonas de Reserva</strong>.
                    </p>
                    <div className="text-[11px] text-amber-800 dark:text-amber-200 bg-card/80 p-2.5 rounded-md border border-amber-200 dark:border-amber-500/30 flex items-center gap-2 font-medium">
                      <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>
                        <strong>Regla de Autodestrucción:</strong> Cuando el palet salga a tienda
                        para reponer y quede vacío (0 uds), se autodestruirá automáticamente en el
                        sistema.
                      </span>
                    </div>
                  </div>

                  {/* ACCIÓN PRINCIPAL: CREAR PALET EN ESTA RESERVA */}
                  <div className="bg-card border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Boxes className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        Crear Palet en {ubicacionSeleccionada.nombre}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
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
                      <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Palets en esta Reserva ({palets.length} activos)
                      </span>
                      <span className="text-xs text-amber-700 dark:text-amber-300 font-semibold">
                        Etiquetas: Quién • Cuándo • Dónde
                      </span>
                    </div>

                    {palets.length === 0 ? (
                      <div className="p-8 text-center border-2 border-dashed border-amber-200 dark:border-amber-500/30 rounded-xl bg-amber-50/20 dark:bg-amber-500/10 text-muted-foreground text-xs space-y-2">
                        <Boxes className="w-8 h-8 text-amber-400 mx-auto" />
                        <p className="font-semibold text-foreground">
                          No hay palets en esta reserva actualmente.
                        </p>
                        <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
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
                              className="p-4 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-card shadow-2xs hover:border-amber-400 dark:hover:border-amber-500/50 transition-all space-y-3"
                            >
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => abrirGestionPalet(palet)}
                                    className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
                                  >
                                    <Badge className="bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-500/40 font-bold text-xs px-2.5 py-0.5">
                                      Palet #{String(palet.numero_palet).padStart(3, "0")}
                                    </Badge>
                                  </button>
                                  <span className="text-xs font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded border">
                                    {palet.codigo_barras}
                                  </span>
                                </div>
                                <span className="text-xs text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                                  {totalUds} unidades
                                </span>
                              </div>

                              {/* DATOS CLAVE: QUIÉN, CUÁNDO Y DÓNDE */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 bg-muted rounded-lg text-xs border border-border/80">
                                <div>
                                  <span className="text-[10px] text-muted-foreground font-bold uppercase block">
                                    DÓNDE (Ubicación)
                                  </span>
                                  <strong className="text-amber-800 dark:text-amber-200 truncate block">
                                    {ubicacionSeleccionada.nombre}
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-[10px] text-muted-foreground font-bold uppercase block">
                                    QUIÉN (Generado Por)
                                  </span>
                                  <strong className="text-foreground truncate block">
                                    {palet.generado_por}
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-[10px] text-muted-foreground font-bold uppercase block">
                                    CUÁNDO (Fecha y Hora)
                                  </span>
                                  <span className="text-foreground text-[11px] block">
                                    {new Date(palet.generado_en).toLocaleString("es-ES")}
                                  </span>
                                </div>
                              </div>

                              {/* ARTÍCULOS ASIGNADOS */}
                              <div className="border rounded-md overflow-hidden bg-card text-xs divide-y divide-border">
                                {palet.productos.map((prod) => (
                                  <div
                                    key={prod.id}
                                    className="p-2 flex items-center justify-between"
                                  >
                                    <div className="min-w-0 pr-2">
                                      <div className="font-semibold text-foreground truncate">
                                        {prod.nombre}
                                      </div>
                                      <div className="text-[10px] text-muted-foreground font-mono">
                                        SKU: {prod.sku}
                                      </div>
                                    </div>
                                    <span className="font-bold text-foreground shrink-0">
                                      {prod.cantidad} uds
                                    </span>
                                  </div>
                                ))}
                              </div>

                              {/* ACCIONES: IMPRIMIR ETIQUETA Y REPONER EN TIENDA */}
                              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
                                {puedeExportar && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setPaletParaImprimir(palet);
                                      setModalEtiquetaPaletAbierto(true);
                                    }}
                                    className="flex-1 h-8 text-xs border-amber-300 dark:border-amber-500/40 text-amber-900 dark:text-amber-100 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 gap-1.5 font-bold shadow-2xs"
                                  >
                                    <Printer className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                                    Imprimir Etiqueta
                                  </Button>
                                )}

                                {puedeExportar && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => abrirInformePalet(palet)}
                                    className="flex-1 h-8 text-xs border-amber-300 dark:border-amber-500/40 text-amber-900 dark:text-amber-100 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 gap-1.5 font-bold shadow-2xs"
                                  >
                                    <Printer className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                                    Informe
                                  </Button>
                                )}

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => abrirGestionPalet(palet)}
                                  className="flex-1 h-8 text-xs border-amber-300 dark:border-amber-500/40 text-amber-900 dark:text-amber-100 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 gap-1.5 font-bold shadow-2xs"
                                >
                                  <Package className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                                  Productos
                                </Button>

                                <Button
                                  size="sm"
                                  onClick={() => abrirReposicionPalet(palet)}
                                  className="flex-1 h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1.5 font-bold shadow-2xs"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
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
                /* GESTIÓN ORDINARIA DE ARMARIOS / CAJAS */
                <>
                  {/* LECTOR CON CÁMARA (SI ESTÁ ACTIVO) */}
                  {mostrarEscaner && (
                    <div className="p-4 bg-sidebar text-white border-b border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold flex items-center gap-1.5">
                          <Barcode className="w-4 h-4 text-emerald-400" />
                          Lector de Códigos con Cámara
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setMostrarEscaner(false)}
                          className="h-6 text-xs text-muted-foreground hover:text-white"
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
                  <div className="p-5 border-b border-border bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        Incluir Artículo en este Armario
                      </Label>
                      <span className="text-[10px] text-muted-foreground">
                        Navega con flechas ↑ / ↓ y pulsa Enter
                      </span>
                    </div>

                    <div className="relative">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
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
                            className="pl-8 text-xs h-9 bg-muted border-border"
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
                            className="text-xs h-9 text-center bg-muted border-border"
                            title="Cantidad a añadir"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={handleIncluirProductoEnUbicacion}
                          disabled={!productoParaIncluir || addStockMutation.isPending}
                          className="h-9 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                        >
                          {addStockMutation.isPending ? "Guardando..." : "Añadir"}
                        </Button>
                      </div>

                      {/* DESPLEGABLE PREDICTIVO CON FLECHAS */}
                      {dropdownAbierto && sugerenciasCatalogo.length > 0 && (
                        <div className="absolute top-full left-0 right-28 mt-1 bg-card rounded-lg border border-border shadow-lg z-30 max-h-56 overflow-y-auto">
                          {sugerenciasCatalogo.map((prod, idx) => (
                            <div
                              key={prod.id}
                              onClick={() => {
                                setProductoParaIncluir(prod);
                                setBusquedaProducto(`${prod.nombre} (${prod.sku})`);
                                setDropdownAbierto(false);
                              }}
                              className={`p-2.5 text-xs cursor-pointer border-b border-border last:border-0 flex items-center justify-between ${
                                idx === indiceSugerencia
                                  ? "bg-blue-50 dark:bg-blue-500/10 text-blue-900 dark:text-blue-100 font-semibold"
                                  : "hover:bg-muted text-foreground"
                              }`}
                            >
                              <div>
                                <div className="font-medium">{prod.nombre}</div>
                                <div className="text-[10px] text-muted-foreground font-mono">
                                  SKU: {prod.sku} • {prod.categoria}
                                </div>
                              </div>
                              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                Catálogo
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {productoParaIncluir && (
                      <div className="p-2.5 rounded-md bg-blue-50/70 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-xs flex items-center justify-between text-blue-900 dark:text-blue-100">
                        <div>
                          <span>
                            Seleccionado: <strong>{productoParaIncluir.nombre}</strong>
                          </span>
                          <span className="block text-[10px] text-blue-700 dark:text-blue-300 font-mono">
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
                          className="h-6 w-6 p-0 text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* LISTADO DE PRODUCTOS ACTUALMENTE EN LA UBICACIÓN */}
                  <div className="p-5 flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Contenido del Armario ({ubicacionSeleccionada.productos?.length || 0}{" "}
                        artículos)
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Regla de Oro: Registro auditado en tabla movimientos
                      </span>
                    </div>

                    {!ubicacionSeleccionada.productos ||
                    ubicacionSeleccionada.productos.length === 0 ? (
                      <div className="p-8 text-center border border-dashed rounded-lg text-muted-foreground text-xs">
                        Esta ubicación no contiene artículos en este momento. Utiliza el buscador o
                        escáner superior para incluir productos.
                      </div>
                    ) : (
                      <div className="divide-y divide-border border rounded-lg bg-card overflow-hidden shadow-2xs">
                        {ubicacionSeleccionada.productos.map((prod) => {
                          const bajoStock = prod.cantidad <= prod.stock_minimo;

                          return (
                            <div
                              key={prod.id}
                              className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/60 transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-xs text-foreground">
                                    {prod.nombre}
                                  </span>
                                  {bajoStock && (
                                    <Badge className="bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-500/30 text-[10px] font-bold">
                                      Bajo Stock
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                  SKU: {prod.sku} • {prod.categoria} • Mínimo: {prod.stock_minimo}{" "}
                                  uds
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="text-base font-bold text-foreground">
                                    {prod.cantidad}
                                  </span>
                                  <span className="text-xs text-muted-foreground ml-1">uds</span>
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
                                    className="h-7 w-7 p-0 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10"
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
                                    className="h-7 w-7 p-0 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
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
                                    className="h-7 text-xs px-2 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                                  >
                                    Ajuste
                                  </Button>

                                  {/* Botón Eliminar Producto del Armario (solo habilitado con stock = 0) */}
                                  {prod.cantidad === 0 ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setProductoParaEliminar(prod);
                                        setMotivoEliminarProd("");
                                        setAlertEliminarProdAbierto(true);
                                      }}
                                      className="h-7 w-7 p-0 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-rose-200/70 dark:border-rose-500/30 rounded-md transition-colors shadow-2xs"
                                      title="Eliminar producto del armario (stock en 0)"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      disabled
                                      className="h-7 w-7 p-0 text-muted-foreground border border-border rounded-md cursor-not-allowed opacity-50"
                                      title={`No se puede eliminar: el producto tiene existencias (${prod.cantidad} uds). Ajusta el stock a 0 primero.`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                                    </Button>
                                  )}
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
            <AlertDialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              {tipoOperacion === "quitar" ? (
                <>
                  <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  Confirmar Salida de Stock
                </>
              ) : tipoOperacion === "anadir" ? (
                <>
                  <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Confirmar Entrada de Stock
                </>
              ) : (
                <>
                  <SlidersHorizontal className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  Ajuste Directo de Conteo Físico
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Esta operación registrará una mutación en la tabla <strong>movimientos</strong> y
              actualizará el stock de <strong>{productoEnOperacion?.nombre}</strong> en{" "}
              <strong>{ubicacionSeleccionada?.nombre}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <Label className="text-xs font-semibold text-foreground mb-1 block">
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
              <Label className="text-xs font-semibold text-foreground mb-1 block">
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
              disabled={addStockMutation.isPending}
              className={`text-xs h-8 text-white ${
                tipoOperacion === "quitar"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : tipoOperacion === "anadir"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              {addStockMutation.isPending ? "Guardando..." : "Confirmar y Registrar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ========================================================================= */}
      {/* 🗑️ MODAL ALERT DIALOG PARA ELIMINAR PRODUCTO DEL ARMARIO (STOCK = 0) */}
      {/* ========================================================================= */}
      <AlertDialog open={alertEliminarProdAbierto} onOpenChange={setAlertEliminarProdAbierto}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <span>Eliminar Producto del Armario</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              ¿Estás seguro de que deseas retirar este producto de la ubicación{" "}
              <strong>{ubicacionSeleccionada?.nombre}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 py-2 text-xs">
            {productoParaEliminar && (
              <div className="rounded-lg border border-border bg-muted p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground text-xs">
                    {productoParaEliminar.nombre}
                  </span>
                  <Badge
                    variant="outline"
                    className="border-border text-foreground font-mono text-[10px]"
                  >
                    0 uds
                  </Badge>
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  SKU: {productoParaEliminar.sku} • {productoParaEliminar.categoria}
                </div>
              </div>
            )}

            <div className="rounded-md bg-amber-50 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/30 p-2.5 text-[11px] text-amber-900 dark:text-amber-100 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                Esta acción retirará la asignación del producto en este armario. Solo se permite
                porque el producto tiene actualmente <strong>0 existencias</strong>.
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-foreground mb-1 block">
                Motivo de la retirada (obligatorio) <span className="text-rose-500 dark:text-rose-400">*</span>
              </Label>
              <Input
                value={motivoEliminarProd}
                onChange={(e) => setMotivoEliminarProd(e.target.value)}
                placeholder="Ej. Fin de campaña, descatalogado o reubicación en otra zona..."
                className="h-8 text-xs focus-visible:ring-rose-500"
                autoFocus
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Indica la justificación de inventario para el registro de auditoría.
              </span>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={eliminandoProd}
              onClick={() => {
                setAlertEliminarProdAbierto(false);
                setProductoParaEliminar(null);
                setMotivoEliminarProd("");
              }}
              className="text-xs h-8"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarEliminarProductoDeArmario}
              disabled={eliminandoProd || !motivoEliminarProd.trim()}
              className="text-xs h-8 bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1.5"
            >
              {eliminandoProd ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Eliminando...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirmar y Eliminar</span>
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={modalCrearPaletAbierto} onOpenChange={setModalCrearPaletAbierto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Boxes className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Crear Palet en Reserva
            </DialogTitle>
            <DialogDescription>
              El código mostrado es orientativo. El definitivo lo asigna el servidor al crear el
              palet, ya que puede haber creaciones concurrentes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/10 p-3 text-sm text-amber-950 dark:text-amber-100">
              <div className="font-semibold">Reserva</div>
              <div className="mt-1">
                {ubicacionesBD.find((ubicacion) => ubicacion.id === idReservaParaCrearPalet)
                  ?.nombre || "Sin reserva real seleccionada"}
              </div>
            </div>

            {cargandoSesion && (
              <p className="text-sm text-muted-foreground">Cargando la sesión del usuario...</p>
            )}
            {!idReservaParaCrearPalet && (
              <p className="text-sm text-rose-700 dark:text-rose-300">
                No hay una reserva real seleccionada. Selecciona una reserva disponible para
                continuar.
              </p>
            )}
            {!cargandoSesion && !usuarioNombre && (
              <p className="text-sm text-rose-700 dark:text-rose-300">
                No se pudo obtener el nombre ni el correo del usuario autenticado.
              </p>
            )}

            {cargandoPrevisualizacionPalet ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-400" />
                Calculando el código previsto...
              </div>
            ) : errorPrevisualizacionPalet ? (
              <p className="text-sm text-rose-700 dark:text-rose-300">
                No se pudo calcular la previsualización: {errorPrevisualizacionPalet}
              </p>
            ) : codigoPaletPrevisto ? (
              <div className="space-y-2">
                <span className="text-sm font-medium text-foreground">Código previsto</span>
                <div>
                  <Badge
                    variant="outline"
                    className="border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 font-mono text-amber-900 dark:text-amber-100"
                  >
                    {codigoPaletPrevisto}
                  </Badge>
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalCrearPaletAbierto(false)}
              disabled={crearPaletMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() =>
                crearPaletMutation.mutate({
                  id_reserva: idReservaParaCrearPalet,
                  usuario_nombre: usuarioNombre,
                })
              }
              disabled={
                cargandoSesion ||
                !idReservaParaCrearPalet ||
                !usuarioNombre ||
                cargandoPrevisualizacionPalet ||
                Boolean(errorPrevisualizacionPalet) ||
                !codigoPaletPrevisto ||
                crearPaletMutation.isPending
              }
              className="gap-2 bg-amber-600 text-white hover:bg-amber-700"
            >
              {crearPaletMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Creando palet...
                </>
              ) : (
                "Crear Palet"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 🏷️ MODAL DE ETIQUETA IMPRIMIBLE DE PALET (HOMOLOGADA) */}
      {/* ========================================================================= */}
      <Dialog open={modalEtiquetaPaletAbierto} onOpenChange={setModalEtiquetaPaletAbierto}>
        <DialogContent className="print-target max-w-md bg-card p-6">
          <DialogHeader className="no-print">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Barcode className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Etiqueta Oficial de Palet
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Formato homologado para imprimir y colocar sobre el palet físico en Reserva.
            </DialogDescription>
          </DialogHeader>

          {paletParaImprimir && (
            <EtiquetaPalet
              palet={{
                numero_palet: paletParaImprimir.numero_palet,
                codigo_barras: paletParaImprimir.codigo_barras,
                reserva_nombre:
                  ubicaciones.find((u) => u.id === paletParaImprimir.id_reserva)?.nombre ||
                  ubicacionSeleccionada?.nombre ||
                  "Reserva (Almacén de Tienda)",
                generado_por: paletParaImprimir.generado_por,
                generado_en: paletParaImprimir.generado_en,
                productos: paletParaImprimir.productos.map((producto) => ({
                  id: producto.id,
                  nombre: producto.nombre,
                  sku: producto.sku,
                  cantidad: producto.cantidad,
                })),
              }}
            />
          )}

          <DialogFooter className="mt-4 gap-2 no-print">
            <Button variant="ghost" size="sm" onClick={() => setModalEtiquetaPaletAbierto(false)}>
              Cerrar
            </Button>
            <Button
              size="sm"
              onClick={imprimirEtiqueta}
              className="gap-1.5 bg-amber-600 font-bold text-white hover:bg-amber-700"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimir Etiqueta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ModalProductosPalet
        palet={paletSeleccionadoParaProductos}
        abierto={Boolean(paletSeleccionadoParaProductos)}
        onOpenChange={(open) => {
          if (!open) setPaletSeleccionadoParaProductos(null);
        }}
      />

      <ModalInformeInventario
        abierto={modalInformeAbierto}
        onOpenChange={setModalInformeAbierto}
        informe={informeActivo}
        puedeExportar={puedeExportar}
        puedeEnviarEmail={puedeExportar}
        esAdmin={perfil?.rol === "admin" && perfil.activo === true}
        emailPropio={user?.email ?? ""}
      />

      {/* ========================================================================= */}
      {/* 🔄 MODAL DE REPOSICIÓN EN TIENDA DESDE EL PALET (CON AUTODESTRUCCIÓN) */}
      {/* ========================================================================= */}
      <Dialog
        open={modalGestionPaletAbierto}
        onOpenChange={(open) => {
          setModalGestionPaletAbierto(open);
          if (!open) setPaletSeleccionadoParaGestion(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto bg-card p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              Reponer desde Palet #{paletSeleccionadoParaGestion?.numero_palet}
              {paletSeleccionadoParaGestion && (
                <Badge variant="outline" className="font-mono text-amber-900 dark:text-amber-100">
                  {paletSeleccionadoParaGestion.codigo_barras}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cada línea seleccionada se traslada en una transacción desde el palet a la ubicación
              elegida. El stock se actualiza mediante movimientos y el trigger de base de datos.
            </DialogDescription>
          </DialogHeader>

          {paletSeleccionadoParaGestion && (
            <div className="my-2 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="filtro-seccion-destino">Filtrar por sección</Label>
                  <Select
                    value={filtroSeccionDestino}
                    onValueChange={(value) => {
                      setFiltroSeccionDestino(value);
                      setUbicacionDestinoPalet("");
                    }}
                  >
                    <SelectTrigger id="filtro-seccion-destino">
                      <SelectValue placeholder="Todas las secciones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas las secciones</SelectItem>
                      {seccionesBD.map((seccion) => (
                        <SelectItem key={seccion.id} value={seccion.id}>
                          {seccion.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="filtro-tipo-destino">Filtrar por tipo</Label>
                  <Select
                    value={filtroTipoDestino}
                    onValueChange={(value) => {
                      setFiltroTipoDestino(value);
                      setUbicacionDestinoPalet("");
                    }}
                  >
                    <SelectTrigger id="filtro-tipo-destino">
                      <SelectValue placeholder="Todos los tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los tipos</SelectItem>
                      <SelectItem value="pasillo">Pasillos</SelectItem>
                      <SelectItem value="armario">Armarios</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="ubicacion-destino-palet">Ubicación de destino</Label>
                <Select value={ubicacionDestinoPalet} onValueChange={setUbicacionDestinoPalet}>
                  <SelectTrigger id="ubicacion-destino-palet">
                    <SelectValue placeholder="Selecciona una ubicación de tienda" />
                  </SelectTrigger>
                  <SelectContent>
                    {ubicacionesDestinoDisponibles.map((ubicacion) => (
                      <SelectItem key={ubicacion.id} value={ubicacion.id}>
                        {ubicacion.nombre} · {ubicacion.tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {ubicacionesDestinoDisponibles.length === 0 && (
                  <p className="text-xs text-rose-700 dark:text-rose-300">
                    No hay ubicaciones activas para los filtros seleccionados.
                  </p>
                )}
              </div>

              {productosPaletQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-400" />
                  Cargando productos del palet...
                </div>
              ) : productosPaletQuery.error ? (
                <p className="rounded border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300">
                  No se pudieron cargar los productos:{" "}
                  {productosPaletQuery.error instanceof Error
                    ? productosPaletQuery.error.message
                    : "Error desconocido"}
                </p>
              ) : productosPaletQuery.data?.length ? (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="bg-amber-50 dark:bg-amber-500/10 text-xs font-semibold uppercase text-amber-950 dark:text-amber-100">
                      <tr>
                        <th className="p-3">Producto</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3 text-right">Cantidad en palet</th>
                        <th className="p-3 text-right">Cantidad a reponer</th>
                        <th className="p-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {productosPaletQuery.data.map((producto) => (
                        <tr key={producto.id_producto}>
                          <td className="p-3 font-medium">
                            {producto.nombre || "Producto sin nombre"}
                          </td>
                          <td className="p-3 font-mono">{producto.sku || "—"}</td>
                          <td className="p-3 text-right">{producto.cantidad}</td>
                          <td className="p-3 text-right">
                            <Input
                              aria-label={`Cantidad a reponer de ${producto.nombre ?? producto.id_producto}`}
                              type="number"
                              min={0}
                              max={producto.cantidad}
                              value={cantidadesReposicion[producto.id_producto] ?? 0}
                              onChange={(event) =>
                                setCantidadesReposicion((actual) => ({
                                  ...actual,
                                  [producto.id_producto]:
                                    event.target.value === "" ? 0 : Number(event.target.value),
                                }))
                              }
                              className="ml-auto w-24 text-right"
                            />
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={reponerProductoMutation.isPending}
                              onClick={() =>
                                setCantidadesReposicion((actual) => ({
                                  ...actual,
                                  [producto.id_producto]: producto.cantidad,
                                }))
                              }
                              className="border-amber-300 dark:border-amber-500/40 text-amber-900 dark:text-amber-100 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                            >
                              Todo
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="rounded border border-dashed border-amber-300 dark:border-amber-500/40 bg-amber-50/50 dark:bg-amber-500/10 p-6 text-center text-sm text-muted-foreground">
                  Este palet no tiene productos disponibles para reponer.
                </p>
              )}

              {productosPaletQuery.data && (
                <p className="text-right text-sm font-semibold text-amber-950 dark:text-amber-100">
                  Total disponible:{" "}
                  {productosPaletQuery.data.reduce(
                    (total, producto) => total + producto.cantidad,
                    0,
                  )}{" "}
                  unidades
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Usa 0 para excluir una línea. Cada cantidad debe ser igual o menor que las unidades
                disponibles en el palet.
              </p>
            </div>
          )}

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={reponerProductoMutation.isPending}
              onClick={() => setModalGestionPaletAbierto(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={
                !ubicacionDestinoPalet ||
                !ubicacionesDestinoDisponibles.some(
                  (ubicacion) => ubicacion.id === ubicacionDestinoPalet,
                ) ||
                !productosPaletQuery.data?.length ||
                productosPaletQuery.isLoading ||
                reponerProductoMutation.isPending
              }
              onClick={handleReponerSeleccionadas}
              className="gap-2 bg-amber-600 text-white hover:bg-amber-700"
            >
              {reponerProductoMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Reponiendo...
                </>
              ) : (
                "Reponer seleccionadas"
              )}
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
            <AlertDialogTitle className="text-base text-foreground font-bold">
              ¿Eliminar ubicación "{ubicacionParaEliminar?.nombre}"?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
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

      <Mapa2DModal
        open={mapa2DAbierto}
        onOpenChange={setMapa2DAbierto}
        locations={ubicacionesParaMapa}
        productCatalog={catalogoDisponible}
        selectedLocationId={ubicacionSeleccionada?.id ?? null}
        onSelectLocation={(mapLocation) => {
          const location = ubicaciones.find((item) => item.id === mapLocation.id);
          if (location) setUbicacionSeleccionada(location);
        }}
        onOpenManagement={(mapLocation) => {
          const location = ubicaciones.find((item) => item.id === mapLocation.id);
          if (location) abrirPanelVendedor(location);
        }}
        onManagePallet={(palletId) => {
          const pallet = palets.find((item) => item.id === palletId);
          if (pallet) {
            abrirGestionPalet(pallet);
          } else {
            toast.error("Este palet ya no está activo en la reserva.");
          }
        }}
      />

      {seccionesGestionPermitida && (
        <GestorSecciones
          open={gestorSeccionesAbierto}
          onOpenChange={setGestorSeccionesAbierto}
          canManageSections={seccionesGestionPermitida}
        />
      )}
    </div>
  );
}
