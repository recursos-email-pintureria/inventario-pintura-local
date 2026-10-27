import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Store,
  Package,
  AlertTriangle,
  Users,
  Database,
  Save,
  RotateCcw,
  Plus,
  Pencil,
  Trash2,
  Download,
  Upload,
  CheckCircle2,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Imports de Supabase y TanStack Query
import {
  getCategorias,
  crearCategoria,
  actualizarCategoria,
  desactivarCategoria,
} from "@/lib/inventario";
import type { Categoria } from "@/lib/tipos";

export const Route = createFileRoute("/_authenticated/configuracion")({
  component: ConfiguracionPage,
});

// ============================================================================
// TIPOS LOCALES (solo para Usuarios, ya que Categorías viene de @/lib/tipos)
// ============================================================================
interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
}

// ============================================================================
// DATOS MOCK (Solo Usuarios y Backup por ahora, Categorías es real)
// ============================================================================
const USUARIOS_INICIALES: Usuario[] = [
  {
    id: "u-1",
    nombre: "Javier Martínez",
    email: "javier@inventariolm.com",
    rol: "Administrador",
    activo: true,
  },
  {
    id: "u-2",
    nombre: "Elena Rodríguez",
    email: "elena@inventariolm.com",
    rol: "Operadora de Almacén",
    activo: true,
  },
  {
    id: "u-3",
    nombre: "Carlos Domínguez",
    email: "carlos@inventariolm.com",
    rol: "Vendedor",
    activo: true,
  },
  {
    id: "u-4",
    nombre: "Roberto Sánchez",
    email: "roberto@inventariolm.com",
    rol: "Mozo de Almacén",
    activo: true,
  },
  { id: "u-5", nombre: "Ana López", email: "ana@inventariolm.com", rol: "Vendedor", activo: true },
  {
    id: "u-6",
    nombre: "Miguel Torres",
    email: "miguel@inventariolm.com",
    rol: "Operador de Almacén",
    activo: false,
  },
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
function ConfiguracionPage() {
  const queryClient = useQueryClient();

  // Estado de configuración general
  const [nombreTienda, setNombreTienda] = useState("Pinturas LM - Sucursal Norte");
  const [direccion, setDireccion] = useState("Polígono Industrial Las Palmeras, Nave 14B");
  const [telefono, setTelefono] = useState("+34 912 345 678");
  const [email, setEmail] = useState("admin@inventariolm.com");
  const [zonaHoraria, setZonaHoraria] = useState("Europe/Madrid");
  const [moneda, setMoneda] = useState("EUR");
  const [idioma, setIdioma] = useState("es");

  // Estado de alertas de stock
  const [alertaStockBajo, setAlertaStockBajo] = useState(true);
  const [umbralStockBajo, setUmbralStockBajo] = useState(20);
  const [umbralStockCritico, setUmbralStockCritico] = useState(10);
  const [emailAdmin, setEmailAdmin] = useState(true);
  const [emailOperador, setEmailOperador] = useState(false);

  // Estado de parámetros
  const [stockMinimoDefecto, setStockMinimoDefecto] = useState(10);
  const [unidadMedida, setUnidadMedida] = useState("gal");
  const [permitirStockNegativo, setPermitirStockNegativo] = useState(false);
  const [bloquearVentasStockBajo, setBloquearVentasStockBajo] = useState(false);
  const [iva, setIva] = useState(21);

  // Categorías (REAL con TanStack Query)
  const { data: categorias = [], isLoading: cargandoCategorias } = useQuery<Categoria[]>({
    queryKey: ["categorias"],
    queryFn: getCategorias,
  });

  const [modalCategoriaAbierto, setModalCategoriaAbierto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null);
  const [formCatNombre, setFormCatNombre] = useState("");
  const [formCatDescripcion, setFormCatDescripcion] = useState("");

  // Usuarios (Mock por ahora)
  const [usuarios] = useState<Usuario[]>(USUARIOS_INICIALES);

  // Backup
  const [ultimoBackup] = useState("26/10/2026, 03:00");

  // AlertDialog para eliminar categoría
  const [categoriaAEliminar, setCategoriaAEliminar] = useState<Categoria | null>(null);
  const [dialogEliminarAbierto, setDialogEliminarAbierto] = useState(false);

  // ============================================================================
  // MUTACIONES (Supabase)
  // ============================================================================
  const mutationCrear = useMutation({
    mutationFn: ({ nombre, descripcion }: { nombre: string; descripcion: string }) =>
      crearCategoria(nombre, descripcion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoría creada correctamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al crear la categoría");
    },
  });

  const mutationActualizar = useMutation({
    mutationFn: ({
      id,
      nombre,
      descripcion,
    }: {
      id: string;
      nombre: string;
      descripcion: string;
    }) => actualizarCategoria(id, { nombre, descripcion }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoría actualizada correctamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar la categoría");
    },
  });

  const mutationEliminar = useMutation({
    mutationFn: (id: string) => desactivarCategoria(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoría eliminada correctamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al eliminar la categoría");
    },
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleGuardarCambios = () => {
    toast.success("Configuración guardada correctamente (simulado)");
  };

  const handleRestaurarValores = () => {
    setNombreTienda("Pinturas LM - Sucursal Norte");
    setDireccion("Polígono Industrial Las Palmeras, Nave 14B");
    setTelefono("+34 912 345 678");
    setEmail("admin@inventariolm.com");
    setUmbralStockBajo(20);
    setUmbralStockCritico(10);
    setStockMinimoDefecto(10);
    setIva(21);
    toast.info("Valores restaurados a los predeterminados");
  };

  const handleCrearCategoria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCatNombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    if (categoriaEditando) {
      mutationActualizar.mutate({
        id: categoriaEditando.id,
        nombre: formCatNombre,
        descripcion: formCatDescripcion,
      });
    } else {
      mutationCrear.mutate({
        nombre: formCatNombre,
        descripcion: formCatDescripcion,
      });
    }

    setModalCategoriaAbierto(false);
    setCategoriaEditando(null);
    setFormCatNombre("");
    setFormCatDescripcion("");
  };

  const handleEliminarCategoria = () => {
    if (!categoriaAEliminar) return;
    mutationEliminar.mutate(categoriaAEliminar.id);
    setDialogEliminarAbierto(false);
    setCategoriaAEliminar(null);
  };

  const handleExportarBackup = () => {
    const datos = {
      tienda: { nombre: nombreTienda, direccion, telefono, email },
      categorias,
      usuarios,
      exportado: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup_inventario_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    toast.success("Backup exportado correctamente");
  };

  const abrirModalEditarCategoria = (cat: Categoria) => {
    setCategoriaEditando(cat);
    setFormCatNombre(cat.nombre);
    setFormCatDescripcion(cat.descripcion || "");
    setModalCategoriaAbierto(true);
  };

  const abrirModalNuevaCategoria = () => {
    setCategoriaEditando(null);
    setFormCatNombre("");
    setFormCatDescripcion("");
    setModalCategoriaAbierto(true);
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* HEADER */}
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                <span>INVENTARIO LM</span>
                <span>/</span>
                <span>ADMINISTRACIÓN</span>
                <span>/</span>
                <span className="text-[#D24D09] font-semibold">CONFIGURACIÓN</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Configuración del Sistema
                </h1>
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  Sincronizado
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Ajustes globales de la sucursal, políticas de stock y copias de seguridad.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start md:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestaurarValores}
                className="text-xs h-9 px-3.5 border-slate-200 text-slate-700 hover:bg-slate-100 gap-1.5"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                Restaurar Valores
              </Button>
              <Button
                size="sm"
                onClick={handleGuardarCambios}
                className="bg-[#D24D09] hover:bg-[#b83f05] text-white text-xs font-semibold h-9 px-4 gap-1.5"
              >
                <Save className="w-4 h-4" />
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <Tabs defaultValue="general" className="space-y-6">
          {/* TABS */}
          <TabsList className="w-full justify-start h-auto bg-white border border-slate-200 p-1 rounded-lg overflow-x-auto flex-wrap gap-1">
            <TabsTrigger value="general" className="gap-1.5 text-xs">
              <Store className="w-3.5 h-3.5" /> General
            </TabsTrigger>
            <TabsTrigger value="categorias" className="gap-1.5 text-xs">
              <Package className="w-3.5 h-3.5" /> Categorías
            </TabsTrigger>
            <TabsTrigger value="stock" className="gap-1.5 text-xs">
              <AlertTriangle className="w-3.5 h-3.5" /> Stock y Alertas
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="gap-1.5 text-xs">
              <Users className="w-3.5 h-3.5" /> Usuarios
            </TabsTrigger>
            <TabsTrigger value="backup" className="gap-1.5 text-xs">
              <Database className="w-3.5 h-3.5" /> Backup
            </TabsTrigger>
          </TabsList>

          {/* TAB: GENERAL */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Store className="w-4 h-4 text-[#D24D09]" />
                  Información de la Tienda
                </CardTitle>
                <CardDescription className="text-xs">
                  Datos fiscales y de contacto para reportes y albaranes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Nombre Comercial</Label>
                    <Input
                      value={nombreTienda}
                      onChange={(e) => setNombreTienda(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Teléfono</Label>
                    <Input
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Dirección Física</Label>
                  <Input
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Email</Label>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Zona Horaria</Label>
                    <select
                      value={zonaHoraria}
                      onChange={(e) => setZonaHoraria(e.target.value)}
                      className="w-full h-9 text-xs rounded-md border border-slate-200 bg-white px-2.5"
                    >
                      <option value="Europe/Madrid">Europe/Madrid (UTC+1)</option>
                      <option value="Europe/London">Europe/London (UTC+0)</option>
                      <option value="America/Mexico_City">America/Mexico City (UTC-6)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Moneda</Label>
                    <select
                      value={moneda}
                      onChange={(e) => setMoneda(e.target.value)}
                      className="w-full h-9 text-xs rounded-md border border-slate-200 bg-white px-2.5"
                    >
                      <option value="EUR">EUR (€) - Euro</option>
                      <option value="USD">USD ($) - Dólar</option>
                      <option value="MXN">MXN ($) - Peso Mexicano</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#D24D09]" />
                  Preferencias de Visualización
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Idioma</p>
                      <p className="text-[10px] text-slate-500">Idioma de la interfaz</p>
                    </div>
                    <select
                      value={idioma}
                      onChange={(e) => setIdioma(e.target.value)}
                      className="h-8 text-xs rounded-md border border-slate-200 bg-white px-2"
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Formato de fecha</p>
                      <p className="text-[10px] text-slate-500">Cómo se muestran las fechas</p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-slate-100 text-slate-700 border-slate-200"
                    >
                      DD/MM/YYYY
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: CATEGORÍAS (CONECTADO A SUPABASE) */}
          <TabsContent value="categorias">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#D24D09]" />
                    Categorías de Productos
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Gestiona las categorías que aparecen en el catálogo.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={abrirModalNuevaCategoria}
                  className="bg-[#D24D09] hover:bg-[#b83f05] text-white text-xs gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Nueva Categoría
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">NOMBRE</TableHead>
                      <TableHead className="text-xs">DESCRIPCIÓN</TableHead>
                      <TableHead className="text-xs text-right">ESTADO</TableHead>
                      <TableHead className="text-xs text-right">ACCIONES</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cargandoCategorias ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                          Cargando categorías desde la base de datos...
                        </TableCell>
                      </TableRow>
                    ) : categorias.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                          No hay categorías registradas. Crea una nueva.
                        </TableCell>
                      </TableRow>
                    ) : (
                      categorias.map((cat) => (
                        <TableRow key={cat.id}>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="bg-indigo-50 text-indigo-800 border-indigo-200 text-xs font-medium"
                            >
                              {cat.nombre}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 max-w-[300px] truncate">
                            {cat.descripcion || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant="outline"
                              className={
                                cat.activo
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
                                  : "bg-slate-100 text-slate-600 border-slate-200 text-xs"
                              }
                            >
                              {cat.activo ? "Activa" : "Inactiva"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => abrirModalEditarCategoria(cat)}
                                className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setCategoriaAEliminar(cat);
                                  setDialogEliminarAbierto(true);
                                }}
                                className="h-7 w-7 p-0 text-slate-500 hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: STOCK Y ALERTAS */}
          <TabsContent value="stock" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#D24D09]" />
                  Límites de Stock y Alertas
                </CardTitle>
                <CardDescription className="text-xs">
                  Reglas automáticas de bloqueo y reposición preventiva.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Alerta de Stock Bajo</p>
                    <p className="text-[10px] text-slate-500">
                      Notificar cuando un producto esté por debajo del mínimo
                    </p>
                  </div>
                  <Switch checked={alertaStockBajo} onCheckedChange={setAlertaStockBajo} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Umbral Stock Bajo (%)
                    </Label>
                    <Input
                      type="number"
                      value={umbralStockBajo}
                      onChange={(e) => setUmbralStockBajo(Number(e.target.value))}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Umbral Stock Crítico (%)
                    </Label>
                    <Input
                      type="number"
                      value={umbralStockCritico}
                      onChange={(e) => setUmbralStockCritico(Number(e.target.value))}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Email al Administrador</p>
                    <p className="text-[10px] text-slate-500">Enviar alertas críticas por email</p>
                  </div>
                  <Switch checked={emailAdmin} onCheckedChange={setEmailAdmin} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Email al Operador</p>
                    <p className="text-[10px] text-slate-500">Notificar al operador de almacén</p>
                  </div>
                  <Switch checked={emailOperador} onCheckedChange={setEmailOperador} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#D24D09]" />
                  Parámetros de Stock
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Stock Mínimo por Defecto
                    </Label>
                    <Input
                      type="number"
                      value={stockMinimoDefecto}
                      onChange={(e) => setStockMinimoDefecto(Number(e.target.value))}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Unidad de Medida</Label>
                    <select
                      value={unidadMedida}
                      onChange={(e) => setUnidadMedida(e.target.value)}
                      className="w-full h-9 text-xs rounded-md border border-slate-200 bg-white px-2.5"
                    >
                      <option value="gal">Galones (gal)</option>
                      <option value="L">Litros (L)</option>
                      <option value="unid">Unidades (unid)</option>
                      <option value="Kg">Kilogramos (Kg)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      IVA por Defecto (%)
                    </Label>
                    <Input
                      type="number"
                      value={iva}
                      onChange={(e) => setIva(Number(e.target.value))}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Permitir Stock Negativo</p>
                    <p className="text-[10px] text-slate-500">
                      Permitir ventas cuando el stock sea 0
                    </p>
                  </div>
                  <Switch
                    checked={permitirStockNegativo}
                    onCheckedChange={setPermitirStockNegativo}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      Bloquear Ventas con Stock Bajo
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Impedir ventas si está por debajo del mínimo
                    </p>
                  </div>
                  <Switch
                    checked={bloquearVentasStockBajo}
                    onCheckedChange={setBloquearVentasStockBajo}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: USUARIOS */}
          <TabsContent value="usuarios">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#D24D09]" />
                  Usuarios del Sistema
                </CardTitle>
                <CardDescription className="text-xs">
                  Lista de usuarios registrados y sus roles.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">USUARIO</TableHead>
                      <TableHead className="text-xs">EMAIL</TableHead>
                      <TableHead className="text-xs">ROL</TableHead>
                      <TableHead className="text-xs text-center">ESTADO</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuarios.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#D24D09]/10 text-[#D24D09] flex items-center justify-center text-xs font-bold">
                              {u.nombre
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </div>
                            <span className="text-xs font-semibold text-slate-800">{u.nombre}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">{u.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-800 border-blue-200 text-xs"
                          >
                            {u.rol}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {u.activo ? (
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
                            >
                              Activo
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-slate-100 text-slate-600 border-slate-200 text-xs"
                            >
                              Inactivo
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: BACKUP */}
          <TabsContent value="backup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#D24D09]" />
                  Copia de Seguridad
                </CardTitle>
                <CardDescription className="text-xs">
                  Exporta e importa los datos del sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/50 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-900">
                      Último backup local completo
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      {ultimoBackup} • Exportado correctamente
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleExportarBackup}
                    className="h-10 text-xs gap-1.5 border-slate-200"
                  >
                    <Download className="w-4 h-4" />
                    Exportar Backup (JSON)
                  </Button>
                  <Button variant="outline" className="h-10 text-xs gap-1.5 border-slate-200">
                    <Upload className="w-4 h-4" />
                    Importar desde Archivo
                  </Button>
                </div>

                <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/50 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-900">Zona de peligro</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Las acciones irreversibles requieren confirmación adicional.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 h-7 text-xs border-rose-200 text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Purgar datos de prueba
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* MODAL: NUEVA / EDITAR CATEGORÍA */}
      <Dialog
        open={modalCategoriaAbierto}
        onOpenChange={(open) => {
          if (!open) {
            setModalCategoriaAbierto(false);
            setCategoriaEditando(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {categoriaEditando ? "Editar Categoría" : "Nueva Categoría"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {categoriaEditando
                ? "Modifica los datos de la categoría."
                : "Crea una nueva categoría para el catálogo."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCrearCategoria} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Nombre *</Label>
              <Input
                value={formCatNombre}
                onChange={(e) => setFormCatNombre(e.target.value)}
                placeholder="Ej: Pinturas de Exterior"
                className="h-9 text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Descripción</Label>
              <Textarea
                value={formCatDescripcion}
                onChange={(e) => setFormCatDescripcion(e.target.value)}
                placeholder="Descripción breve de la categoría"
                className="text-xs"
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalCategoriaAbierto(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#D24D09] hover:bg-[#b83f05] text-white text-xs"
              >
                {categoriaEditando ? "Guardar Cambios" : "Crear Categoría"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ALERT DIALOG: ELIMINAR CATEGORÍA */}
      <AlertDialog open={dialogEliminarAbierto} onOpenChange={setDialogEliminarAbierto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              ¿Estás seguro de eliminar la categoría «<strong>{categoriaAEliminar?.nombre}</strong>
              »? Los productos asociados quedarán sin categoría asignada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminarCategoria}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
