import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileUp,
  Info,
  RotateCcw,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { ModalLimpiarLotes } from "@/components/inventario/ModalLimpiarLotes";
import { ModalRevertirListaArmario } from "@/components/inventario/ModalRevertirListaArmario";
import {
  TablaVistaPreviaArmario,
  type FilaVistaPreviaArmario,
} from "@/components/inventario/TablaVistaPreviaArmario";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMyProfile } from "@/hooks/usePermissions";
import { parsearCSVArmarioDesdeBytes, type ResultadoParser } from "@/lib/parser-lista-armario";
import { parsearCSV } from "@/lib/csv-parser";
import { transformarACanonico } from "@/lib/csv-transformer";
import { type MapeoSugerido } from "@/lib/csv-mapper";
import { PanelMapeoColumnas } from "@/components/csv-import/PanelMapeoColumnas";
import { supabase } from "@/lib/supabase";
import {
  validarFilasCSV,
  type FilaConError,
  type FilaValida,
  type OpcionesValidacion,
} from "@/lib/validador-lista-armario";

export const Route = createFileRoute("/_authenticated/cargar-lista-armario")({
  component: CargarListaArmarioPage,
});

type Paso = 1 | 2 | 3 | 4;
type ModoImportacion = OpcionesValidacion["modo"];
type OpcionDuplicados = OpcionesValidacion["duplicados"];

interface UbicacionArmario {
  id: string;
  nombre: string;
}

interface ProductoExistente {
  id: string;
  sku: string;
  codigo_barras: string;
  nombre: string;
}

interface StockExistente {
  id_producto: string;
  cantidad: number;
}

interface DatosVistaPrevia {
  productosPorSku: Map<string, ProductoExistente>;
  productosPorEan: Map<string, ProductoExistente>;
  stockPorProducto: Map<string, number>;
}

interface DetalleImportacion {
  fila?: number;
  sku?: string;
  codigo_barras?: string;
  estado?: string;
  motivo?: string;
  aviso?: string;
  stock_actual?: number;
  stock_resultante?: number;
}

interface RespuestaImportacion {
  aplicado: boolean;
  lote_id?: string;
  resumen: {
    creados: number;
    actualizados: number;
    omitidos: number;
    errores: number;
    conflictos: number;
  };
  detalles: DetalleImportacion[];
}

const PASOS: { numero: Paso; nombre: string }[] = [
  { numero: 1, nombre: "Armario y modo" },
  { numero: 2, nombre: "Subir CSV" },
  { numero: 3, nombre: "Vista previa" },
  { numero: 4, nombre: "Resultado" },
];

function leerRespuestaImportacion(valor: unknown): RespuestaImportacion {
  if (typeof valor !== "object" || valor === null || !("aplicado" in valor)) {
    throw new Error("La respuesta de la importación no tiene el formato esperado.");
  }
  const respuesta = valor as Partial<RespuestaImportacion>;
  if (
    typeof respuesta.aplicado !== "boolean" ||
    typeof respuesta.resumen !== "object" ||
    respuesta.resumen === null ||
    !Array.isArray(respuesta.detalles)
  ) {
    throw new Error("La respuesta de la importación está incompleta.");
  }
  return respuesta as RespuestaImportacion;
}

function errorMensaje(error: unknown): string {
  return error instanceof Error ? error.message : "Error inesperado al procesar la solicitud.";
}

function claseEstado(estado: string | undefined): string {
  if (estado === "error" || estado === "conflicto")
    return "border-rose-200 bg-rose-50 text-rose-900";
  if (estado === "omitida") return "border-slate-200 bg-slate-50 text-slate-700";
  if (estado === "aviso") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-emerald-200 bg-emerald-50 text-emerald-900";
}

function CargarListaArmarioPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    isAdmin,
    isPending: cargandoPerfil,
    isError: errorPerfil,
    refetch,
    permisos,
  } = useMyProfile();
  const inputArchivo = useRef<HTMLInputElement>(null);
  const [paso, setPaso] = useState<Paso>(1);
  const [armarioId, setArmarioId] = useState("");
  const [modo, setModo] = useState<ModoImportacion>("sumar");
  const [duplicados, setDuplicados] = useState<OpcionDuplicados>("sumar");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [resultadoParser, setResultadoParser] = useState<ResultadoParser | null>(null);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const [modalReversionAbierto, setModalReversionAbierto] = useState(false);
  const [modalLimpiezaOpen, setModalLimpiezaOpen] = useState(false);
  const [resultadoImportacion, setResultadoImportacion] = useState<RespuestaImportacion | null>(
    null,
  );
  const [arrastrando, setArrastrando] = useState(false);

  useEffect(() => {
    if (!cargandoPerfil && !errorPerfil && !isAdmin) {
      void navigate({ to: "/", replace: true });
    }
  }, [cargandoPerfil, errorPerfil, isAdmin, navigate]);

  const armariosQuery = useQuery({
    queryKey: ["armarios-activos-importacion"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ubicaciones")
        .select("id,nombre")
        .eq("tipo", "armario")
        .eq("activo", true)
        .order("nombre");
      if (error) throw error;
      return (data ?? []) as UbicacionArmario[];
    },
    enabled: isAdmin,
  });

  const validacion = useMemo(
    () =>
      validarFilasCSV(resultadoParser?.filas ?? [], {
        modo,
        duplicados,
      }),
    [resultadoParser, modo, duplicados],
  );

  const datosVistaPreviaQuery = useQuery({
    queryKey: [
      "vista-previa-importacion-armario",
      armarioId,
      validacion.filasValidas.map((fila) => fila.sku).join("|"),
    ],
    queryFn: async (): Promise<DatosVistaPrevia> => {
      const skus = [...new Set(validacion.filasValidas.map((fila) => fila.sku))];
      const eans = [...new Set(validacion.filasValidas.map((fila) => fila.codigoBarras))];
      if (skus.length === 0) {
        return {
          productosPorSku: new Map(),
          productosPorEan: new Map(),
          stockPorProducto: new Map(),
        };
      }

      const [productosSkuResult, productosEanResult] = await Promise.all([
        supabase.from("productos").select("id,sku,codigo_barras,nombre").in("sku", skus),
        supabase.from("productos").select("id,sku,codigo_barras,nombre").in("codigo_barras", eans),
      ]);
      if (productosSkuResult.error) throw productosSkuResult.error;
      if (productosEanResult.error) throw productosEanResult.error;

      const productosSku = (productosSkuResult.data ?? []) as ProductoExistente[];
      const productosEan = (productosEanResult.data ?? []) as ProductoExistente[];
      const productos = [
        ...new Map(
          [...productosSku, ...productosEan].map((producto) => [producto.id, producto]),
        ).values(),
      ];
      const productoIds = productos.map((producto) => producto.id);
      let stocks: StockExistente[] = [];
      if (productoIds.length > 0) {
        const { data: stockData, error: stockError } = await supabase
          .from("stock")
          .select("id_producto,cantidad")
          .eq("id_ubicacion", armarioId)
          .is("id_palet", null)
          .in("id_producto", productoIds);
        if (stockError) throw stockError;
        stocks = (stockData ?? []) as StockExistente[];
      }

      return {
        productosPorSku: new Map(productosSku.map((producto) => [producto.sku, producto])),
        productosPorEan: new Map(
          productosEan.map((producto) => [producto.codigo_barras, producto]),
        ),
        stockPorProducto: new Map(stocks.map((stock) => [stock.id_producto, stock.cantidad])),
      };
    },
    enabled: paso === 3 && !!armarioId && validacion.filasValidas.length > 0,
    staleTime: 0,
  });

  const filasVistaPrevia = useMemo(() => {
    const datos = datosVistaPreviaQuery.data;
    const filasValidas: FilaVistaPreviaArmario[] = validacion.filasValidas.map((fila) => {
      const existente = datos?.productosPorSku.get(fila.sku);
      const productoPorEan = datos?.productosPorEan.get(fila.codigoBarras);
      const conflictoBD =
        productoPorEan !== undefined &&
        (existente === undefined || productoPorEan.id !== existente.id);
      const productoStock = existente ?? productoPorEan;
      const stockActual = datos
        ? productoStock
          ? (datos.stockPorProducto.get(productoStock.id) ?? 0)
          : 0
        : null;
      const avisos = [
        fila.aviso,
        existente && existente.codigo_barras !== fila.codigoBarras
          ? "El producto ya existe con otro EAN; no se sobrescribirá."
          : undefined,
        existente && existente.nombre !== fila.nombre
          ? "El producto ya existe con otro nombre; no se sobrescribirá."
          : undefined,
      ].filter((aviso): aviso is string => Boolean(aviso));
      const cantidadFinal =
        stockActual === null
          ? null
          : modo === "sumar"
            ? stockActual + fila.cantidad
            : fila.cantidad;
      const motivo = conflictoBD
        ? "La REFERENCIA y el EAN corresponden a productos distintos."
        : avisos.length > 0
          ? avisos.join(" ")
          : undefined;

      return {
        numeroFila: fila.numeroFila,
        sku: fila.sku,
        codigoBarras: fila.codigoBarras,
        nombre: fila.nombre,
        cantidad: fila.cantidad,
        estado: conflictoBD ? "conflicto" : avisos.length > 0 ? "aviso" : "correcta",
        ...(motivo ? { motivo } : {}),
        stockActual,
        stockResultante: cantidadFinal,
      };
    });
    const filasConError: FilaVistaPreviaArmario[] = validacion.filasConError.map((fila) => ({
      numeroFila: fila.numeroFila,
      sku: fila.sku,
      codigoBarras: fila.codigoBarras,
      nombre: fila.nombre,
      cantidad: null,
      estado: fila.estado,
      motivo: fila.motivo,
      stockActual: null,
      stockResultante: null,
    }));

    return [...filasValidas, ...filasConError].sort((a, b) => a.numeroFila - b.numeroFila);
  }, [datosVistaPreviaQuery.data, modo, validacion]);

  const errorParserBloqueante = (resultadoParser?.erroresParseo.length ?? 0) > 0;
  const puedeCrearProductos = permisos?.puede_crear_productos === true;
  const filasProblematicas = useMemo<FilaConError[]>(() => {
    const problemasCSV = validacion.filasConError;
    const conflictosBD = filasVistaPrevia
      .filter((fila) => fila.estado === "conflicto")
      .map((fila) => ({
        numeroFila: fila.numeroFila,
        sku: fila.sku,
        codigoBarras: fila.codigoBarras,
        nombre: fila.nombre,
        cantidadTexto: fila.cantidad?.toString() ?? null,
        estado: "conflicto" as const,
        motivo: fila.motivo ?? "Conflicto de producto",
      }));
    return [...problemasCSV, ...conflictosBD].sort((a, b) => a.numeroFila - b.numeroFila);
  }, [filasVistaPrevia, validacion.filasConError]);

  const mutacionImportar = useMutation({
    mutationFn: async () => {
      if (!isAdmin) throw new Error("Solo un administrador puede importar listas.");
      if (!puedeCrearProductos) {
        throw new Error(
          "Tu perfil necesita el permiso puede_crear_productos para registrar movimientos.",
        );
      }
      if (!armarioId || validacion.filasValidas.length === 0) {
        throw new Error("Selecciona un armario y revisa al menos una fila válida.");
      }

      const p_items = validacion.filasValidas.map((fila: FilaValida) => ({
        sku: fila.sku,
        codigo_barras: fila.codigoBarras,
        nombre: fila.nombre,
        cantidad: fila.cantidad,
        fila: fila.numeroFila,
      }));
      const { data, error } = await supabase.rpc("importar_lista_a_armario", {
        p_items,
        p_ubicacion_id: armarioId,
        p_modo: modo,
        p_duplicados: duplicados,
      });
      if (error) throw error;
      return leerRespuestaImportacion(data);
    },
    onSuccess: async (respuesta) => {
      setResultadoImportacion(respuesta);
      setPaso(4);
      if (respuesta.aplicado) {
        toast.success("La lista se importó correctamente.");
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["productos"] }),
          queryClient.invalidateQueries({ queryKey: ["ubicaciones"] }),
          queryClient.invalidateQueries({ queryKey: ["stock"] }),
          queryClient.invalidateQueries({ queryKey: ["movimientos"] }),
          queryClient.invalidateQueries({ queryKey: ["lotes-importacion-armario"] }),
        ]);
      } else {
        toast.error("La importación no se aplicó. Revisa los errores indicados.");
      }
    },
    onError: (error) => toast.error(errorMensaje(error)),
  });

  const seleccionarArchivo = async (nuevoArchivo: File | undefined) => {
    if (!nuevoArchivo) return;
    setErrorArchivo(null);
    setResultadoImportacion(null);
    if (!/\.csv$/i.test(nuevoArchivo.name) && nuevoArchivo.type !== "text/csv") {
      setArchivo(null);
      setResultadoParser(null);
      setErrorArchivo("Selecciona un archivo CSV.");
      return;
    }

    try {
      const bytes = await nuevoArchivo.arrayBuffer();
      const resultado = parsearCSVArmarioDesdeBytes(bytes);
      setArchivo(nuevoArchivo);
      setResultadoParser(resultado);
      if (resultado.erroresParseo.length > 0) {
        setErrorArchivo("El archivo tiene problemas de lectura. Corrígelos antes de continuar.");
      } else {
        toast.success(`${resultado.filas.length} fila(s) leída(s) del CSV.`);
      }
    } catch (error) {
      setArchivo(null);
      setResultadoParser(null);
      setErrorArchivo(`No se pudo leer el archivo: ${errorMensaje(error)}`);
    }
  };

  const soltarArchivo = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setArrastrando(false);
    void seleccionarArchivo(event.dataTransfer.files[0]);
  };

  if (cargandoPerfil) {
    return <EstadoPagina mensaje="Comprobando permisos de administrador..." />;
  }
  if (errorPerfil) {
    return (
      <EstadoPagina
        mensaje="No se pudo comprobar tu perfil."
        accion={<Button onClick={() => void refetch()}>Reintentar</Button>}
      />
    );
  }
  if (!isAdmin) return <EstadoPagina mensaje="Redirigiendo al inicio..." />;

  const armarioSeleccionado = armariosQuery.data?.find((armario) => armario.id === armarioId);

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 pb-8 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4">
        <nav
          aria-label="Migas de pan"
          className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
        >
          <Link to="/ubicaciones" className="hover:text-foreground">
            Almacén
          </Link>
          <span aria-hidden="true">/</span>
          <Link to="/ubicaciones" className="hover:text-foreground">
            Armarios
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="font-medium text-foreground">
            Carga masiva CSV
          </span>
        </nav>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Cargar Lista de Productos en Armario
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Importa un CSV, revisa el stock proyectado y confirma los cambios.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => setModalReversionAbierto(true)}
            >
              <Button variant="outline" size="sm" onClick={() => setModalLimpiezaOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Limpiar BD
              </Button>
              <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
              Revertir lote
            </Button>
            <Button asChild type="button" variant="outline" className="min-h-11">
              <Link to="/ubicaciones">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Volver a Almacén
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0 space-y-5">
          <ol
            aria-label="Pasos de la importación"
            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          >
            {PASOS.map((item) => {
              const terminado = paso > item.numero;
              const activo = paso === item.numero;
              return (
                <li
                  key={item.numero}
                  aria-current={activo ? "step" : undefined}
                  className={`flex min-h-14 items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    activo
                      ? "border-amber-500 bg-amber-50 text-amber-950"
                      : terminado
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "bg-card text-muted-foreground"
                  }`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold">
                    {terminado ? <Check className="h-4 w-4" aria-hidden="true" /> : item.numero}
                  </span>
                  <span className="font-medium">{item.nombre}</span>
                </li>
              );
            })}
          </ol>

          {paso === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>1. Elige el armario y el modo</CardTitle>
                <CardDescription>
                  Define dónde y cómo cambiará el stock de los productos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {armariosQuery.isPending && (
                  <p className="text-sm text-muted-foreground">Cargando armarios activos...</p>
                )}
                {armariosQuery.isError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No se pudieron cargar los armarios. {errorMensaje(armariosQuery.error)}
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 pl-1"
                        onClick={() => void armariosQuery.refetch()}
                      >
                        Reintentar
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                {armariosQuery.isSuccess && armariosQuery.data.length === 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      No hay armarios activos. Activa o crea un armario antes de importar.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="armario-destino">Armario de destino</Label>
                  <Select value={armarioId} onValueChange={setArmarioId}>
                    <SelectTrigger id="armario-destino" className="min-h-11">
                      <SelectValue placeholder="Selecciona un armario" />
                    </SelectTrigger>
                    <SelectContent>
                      {(armariosQuery.data ?? []).map((armario) => (
                        <SelectItem key={armario.id} value={armario.id}>
                          {armario.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium">Modo de actualización</legend>
                  <RadioGroup
                    value={modo}
                    onValueChange={(value) => {
                      if (value === "sumar" || value === "establecer") setModo(value);
                    }}
                  >
                    <OpcionRadio
                      id="modo-sumar"
                      valor="sumar"
                      titulo="Sumar"
                      descripcion="Añade la cantidad del CSV al stock actual."
                    />
                    <OpcionRadio
                      id="modo-establecer"
                      valor="establecer"
                      titulo="Establecer"
                      descripcion="Deja el stock exactamente en la cantidad del CSV."
                    />
                  </RadioGroup>
                </fieldset>

                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium">Productos duplicados en el CSV</legend>
                  <RadioGroup
                    value={duplicados}
                    onValueChange={(value) => {
                      if (value === "sumar" || value === "rechazar") setDuplicados(value);
                    }}
                  >
                    <OpcionRadio
                      id="duplicados-sumar"
                      valor="sumar"
                      titulo="Sumar cantidades"
                      descripcion="Agrupa las filas con el mismo SKU y EAN."
                    />
                    <OpcionRadio
                      id="duplicados-rechazar"
                      valor="rechazar"
                      titulo="Rechazar duplicados"
                      descripcion="Marca las filas duplicadas como conflicto."
                    />
                  </RadioGroup>
                </fieldset>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    className="min-h-11 bg-amber-600 text-white hover:bg-amber-700"
                    disabled={!armarioId || armariosQuery.isPending || armariosQuery.isError}
                    onClick={() => setPaso(2)}
                  >
                    Continuar
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {paso === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>2. Sube el archivo CSV</CardTitle>
                <CardDescription>
                  {armarioSeleccionado
                    ? `Destino: ${armarioSeleccionado.nombre}`
                    : "El archivo debe tener las columnas NOMBRE, REFERENCIA, EAN y CANTIDAD."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setArrastrando(true);
                  }}
                  onDragLeave={() => setArrastrando(false)}
                  onDrop={soltarArchivo}
                  className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors sm:p-10 ${
                    arrastrando ? "border-amber-500 bg-amber-50" : "border-muted-foreground/30"
                  }`}
                >
                  <FileUp className="mx-auto h-10 w-10 text-amber-600" aria-hidden="true" />
                  <p className="mt-3 font-medium">Arrastra el CSV aquí</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    o selecciónalo desde tu equipo
                  </p>
                  <Input
                    ref={inputArchivo}
                    type="file"
                    accept=".csv,text/csv"
                    className="sr-only"
                    aria-label="Seleccionar archivo CSV"
                    onChange={(event) => void seleccionarArchivo(event.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 min-h-11"
                    onClick={() => inputArchivo.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                    Seleccionar CSV
                  </Button>
                </div>

                {archivo && resultadoParser && (
                  <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{archivo.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {resultadoParser.filas.length} fila(s) ·{" "}
                        {resultadoParser.totalFilasDescartadas} descartada(s)
                      </p>
                    </div>
                    <Badge variant={errorParserBloqueante ? "destructive" : "outline"}>
                      {errorParserBloqueante ? "Revisar archivo" : "CSV leído"}
                    </Badge>
                  </div>
                )}
                {(errorArchivo || errorParserBloqueante) && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {errorArchivo}
                      {resultadoParser?.erroresParseo.map((error, indice) => (
                        <span key={`${indice}-${error}`} className="block">
                          {error}
                        </span>
                      ))}
                    </AlertDescription>
                  </Alert>
                )}
                {resultadoParser &&
                  !errorParserBloqueante &&
                  resultadoParser.filas.length === 0 && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        El CSV se leyó, pero no contiene filas con nombre o referencia.
                      </AlertDescription>
                    </Alert>
                  )}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    onClick={() => setPaso(1)}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                    Volver
                  </Button>
                  <Button
                    type="button"
                    className="min-h-11 bg-amber-600 text-white hover:bg-amber-700"
                    disabled={
                      !archivo ||
                      !resultadoParser ||
                      errorParserBloqueante ||
                      resultadoParser.filas.length === 0
                    }
                    onClick={() => setPaso(3)}
                  >
                    Revisar vista previa
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {paso === 3 && resultadoParser && (
            <Card>
              <CardContent className="pt-6">
                {datosVistaPreviaQuery.isError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No se pudieron consultar los productos o el stock del armario.{" "}
                      {errorMensaje(datosVistaPreviaQuery.error)}
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 pl-1"
                        onClick={() => void datosVistaPreviaQuery.refetch()}
                      >
                        Reintentar
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                {!puedeCrearProductos && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Tu cuenta necesita el permiso puede_crear_productos para registrar
                      movimientos. Solicítalo al administrador del sistema.
                    </AlertDescription>
                  </Alert>
                )}
                <TablaVistaPreviaArmario
                  filas={filasVistaPrevia}
                  validacion={validacion}
                  filasProblematicas={filasProblematicas}
                  hayErroresParseo={errorParserBloqueante}
                  errorCargaDatos={datosVistaPreviaQuery.isError}
                  bloqueadoPorPermisos={!puedeCrearProductos}
                  cargandoStock={
                    datosVistaPreviaQuery.isPending && validacion.filasValidas.length > 0
                  }
                  cargando={mutacionImportar.isPending}
                  onConfirmar={() => mutacionImportar.mutate()}
                />
                {mutacionImportar.isError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No se pudo enviar la importación. No se mostrarán cambios como completados.{" "}
                      {errorMensaje(mutacionImportar.error)}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    onClick={() => setPaso(2)}
                    disabled={mutacionImportar.isPending}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                    Volver al archivo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {paso === 4 && resultadoImportacion && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {resultadoImportacion.aplicado ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-rose-600" aria-hidden="true" />
                  )}
                  {resultadoImportacion.aplicado
                    ? "Importación completada"
                    : "No se aplicaron cambios"}
                </CardTitle>
                <CardDescription>
                  {resultadoImportacion.aplicado
                    ? "El servidor confirmó la operación atómica."
                    : "La validación del servidor encontró errores o conflictos. No se modificó el stock."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {resultadoImportacion.lote_id && (
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Identificador del lote</p>
                    <p className="break-all font-mono text-sm">{resultadoImportacion.lote_id}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <ResumenFinal titulo="Creados" valor={resultadoImportacion.resumen.creados} />
                  <ResumenFinal
                    titulo="Actualizados"
                    valor={resultadoImportacion.resumen.actualizados}
                  />
                  <ResumenFinal titulo="Omitidos" valor={resultadoImportacion.resumen.omitidos} />
                  <ResumenFinal titulo="Errores" valor={resultadoImportacion.resumen.errores} />
                  <ResumenFinal
                    titulo="Conflictos"
                    valor={resultadoImportacion.resumen.conflictos}
                  />
                </div>
                {resultadoImportacion.detalles.length > 0 && (
                  <div className="space-y-2">
                    <h2 className="font-semibold">
                      {resultadoImportacion.aplicado
                        ? "Detalle del lote"
                        : "Filas que requieren atención"}
                    </h2>
                    <div className="max-h-72 space-y-2 overflow-auto">
                      {resultadoImportacion.detalles.map((detalle, indice) => (
                        <div
                          key={`${detalle.fila ?? indice}-${detalle.sku ?? "sin-sku"}`}
                          className={`rounded-lg border p-3 text-sm ${claseEstado(detalle.estado)}`}
                        >
                          <p className="font-medium">
                            Fila {detalle.fila ?? indice + 1} · {detalle.sku ?? "SKU desconocido"}
                            {detalle.estado ? ` · ${detalle.estado}` : ""}
                          </p>
                          {(detalle.motivo || detalle.aviso) && (
                            <p className="mt-1">{detalle.motivo ?? detalle.aviso}</p>
                          )}
                          {detalle.stock_actual !== undefined &&
                            detalle.stock_resultante !== undefined && (
                              <p className="mt-1">
                                Stock: {detalle.stock_actual} → {detalle.stock_resultante}
                              </p>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {resultadoImportacion.aplicado && (
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11"
                      onClick={() => setModalReversionAbierto(true)}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                      Revertir lote
                    </Button>
                  )}
                  <Button
                    type="button"
                    className="min-h-11 bg-amber-600 text-white hover:bg-amber-700"
                    onClick={() => {
                      setPaso(1);
                      setArchivo(null);
                      setResultadoParser(null);
                      setResultadoImportacion(null);
                      setErrorArchivo(null);
                    }}
                  >
                    Cargar otra lista
                  </Button>
                  <Button asChild type="button" variant="outline" className="min-h-11">
                    <Link to="/ubicaciones">Volver a Almacén</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                Reglas de la importación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <Regla>
                  El sistema detectará las columnas de tu CSV y te pedirá mapearlas a REFERENCIA, NOMBRE, EAN y CANTIDAD.
                </Regla>
                <Regla>
                  El SKU y el EAN son obligatorios. Un EAN-13 incorrecto genera un aviso.
                </Regla>
                <Regla>
                  Las cantidades deben ser enteros positivos; las filas vacías o con cero se omiten.
                </Regla>
                <Regla>Los duplicados se suman o se rechazan según la opción elegida.</Regla>
                <Regla>Los productos existentes conservan su nombre y código de barras.</Regla>
                <Regla>
                  El stock solo cambia mediante movimientos registrados en el historial.
                </Regla>
              </ul>
            </CardContent>
          </Card>

          {paso > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuración elegida</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <DatoConfiguracion titulo="Armario" valor={armarioSeleccionado?.nombre ?? "—"} />
                <DatoConfiguracion
                  titulo="Modo"
                  valor={modo === "sumar" ? "Sumar" : "Establecer"}
                />
                <DatoConfiguracion
                  titulo="Duplicados"
                  valor={duplicados === "sumar" ? "Sumar cantidades" : "Rechazar"}
                />
                {archivo && <DatoConfiguracion titulo="Archivo" valor={archivo.name} />}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      <ModalRevertirListaArmario
        open={modalReversionAbierto}
        onOpenChange={setModalReversionAbierto}
      />

      <ModalLimpiarLotes open={modalLimpiezaOpen} onOpenChange={setModalLimpiezaOpen} />
    </div>
  );
}

function EstadoPagina({ mensaje, accion }: { mensaje: string; accion?: React.ReactNode }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-muted-foreground" role="status">
        {mensaje}
      </p>
      {accion}
    </div>
  );
}

function OpcionRadio({
  id,
  valor,
  titulo,
  descripcion,
}: {
  id: string;
  valor: string;
  titulo: string;
  descripcion: string;
}) {
  return (
    <div className="flex min-h-14 items-start gap-3 rounded-lg border p-3">
      <RadioGroupItem id={id} value={valor} className="mt-1" />
      <Label htmlFor={id} className="cursor-pointer">
        <span className="block font-medium">{titulo}</span>
        <span className="mt-0.5 block text-sm font-normal text-muted-foreground">
          {descripcion}
        </span>
      </Label>
    </div>
  );
}

function Regla({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

function DatoConfiguracion({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{titulo}</span>
      <span className="max-w-[65%] truncate text-right font-medium" title={valor}>
        {valor}
      </span>
    </div>
  );
}

function ResumenFinal({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{titulo}</p>
      <p className="text-xl font-bold tabular-nums">{valor}</p>
    </div>
  );
}
