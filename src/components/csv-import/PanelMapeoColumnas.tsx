// src/components/csv-import/PanelMapeoColumnas.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import {
  type CampoRequerido,
  type MapeoSugerido,
  sugerirMapeo,
  validarMapeo,
} from "@/lib/csv-mapper";

interface PanelMapeoColumnasProps {
  cabeceras: string[];
  filasPreview: Record<string, string>[];
  /** Mapeo guardado de una importación anterior (opcional). Solo se usa al cargar un archivo nuevo. */
  mapeoInicial?: MapeoSugerido;
  onMapeoChange: (mapeo: MapeoSugerido) => void;
  onValidoChange: (esValido: boolean) => void;
}

// Las claves son las del mapper (sku, ean, cantidad, nombre): sin capa de traducción.
const CAMPOS: { key: CampoRequerido; label: string; obligatorio: boolean }[] = [
  { key: "sku", label: "REFERENCIA (SKU)", obligatorio: true },
  { key: "ean", label: "EAN (Código de barras)", obligatorio: true },
  { key: "cantidad", label: "CANTIDAD", obligatorio: true },
  { key: "nombre", label: "NOMBRE (Descripción)", obligatorio: false },
];
const ETIQUETA: Record<CampoRequerido, string> = {
  sku: "REFERENCIA (SKU)",
  ean: "EAN",
  cantidad: "CANTIDAD",
  nombre: "NOMBRE",
};

// Valor interno para "sin columna": no puede coincidir con una cabecera real.
const SIN_COLUMNA = "__sin_columna__";
// EAN que Excel ha convertido a notación científica (8,41E+12): los dígitos ya se perdieron.
const EAN_CIENTIFICO = /^\d+(?:[.,]\d+)?e\+?\d+$/i;

interface EstadoMapeo {
  mapeo: MapeoSugerido;
  /** true si se aplicó (al menos en parte) el mapeo guardado y el usuario aún no lo ha tocado. */
  desdeGuardado: boolean;
}

/**
 * Mapeo inicial: primero el guardado (solo columnas que existan en este archivo),
 * después se completa lo que falte con la sugerencia automática.
 * Garantiza que ninguna columna se asigne a dos campos.
 */
function calcularInicial(cabeceras: string[], guardado?: MapeoSugerido): EstadoMapeo {
  const sugerido = sugerirMapeo(cabeceras);
  const mapeo: MapeoSugerido = { sku: null, ean: null, cantidad: null, nombre: null };
  const usadas = new Set<string>();
  let desdeGuardado = false;

  if (guardado) {
    for (const { key } of CAMPOS) {
      const col = guardado[key];
      if (col && cabeceras.includes(col) && !usadas.has(col)) {
        mapeo[key] = col;
        usadas.add(col);
        desdeGuardado = true;
      }
    }
  }
  for (const { key } of CAMPOS) {
    if (mapeo[key] !== null) continue;
    const col = sugerido[key];
    if (col && !usadas.has(col)) {
      mapeo[key] = col;
      usadas.add(col);
    }
  }
  return { mapeo, desdeGuardado };
}

export function PanelMapeoColumnas({
  cabeceras,
  filasPreview,
  mapeoInicial,
  onMapeoChange,
  onValidoChange,
}: PanelMapeoColumnasProps) {
  // El estado nace ya calculado (sin pasar por un mapeo vacío) y se reinicia
  // solo cuando cambian las cabeceras, es decir, cuando se sube otro archivo.
  const firma = cabeceras.join("\u0001");
  const [firmaActual, setFirmaActual] = useState(firma);
  const [estado, setEstado] = useState<EstadoMapeo>(() => calcularInicial(cabeceras, mapeoInicial));
  if (firma !== firmaActual) {
    setFirmaActual(firma);
    setEstado(calcularInicial(cabeceras, mapeoInicial));
  }
  const { mapeo, desdeGuardado } = estado;

  const validacion = useMemo(() => validarMapeo(mapeo, cabeceras), [mapeo, cabeceras]);

  // Callbacks en refs: si el padre los pasa sin useCallback no se genera un bucle de renders.
  const onMapeoRef = useRef(onMapeoChange);
  const onValidoRef = useRef(onValidoChange);
  useEffect(() => {
    onMapeoRef.current = onMapeoChange;
    onValidoRef.current = onValidoChange;
  });
  useEffect(() => {
    onMapeoRef.current(mapeo);
    onValidoRef.current(validacion.esValido);
  }, [mapeo, validacion.esValido]);

  // Elegir una columna que ya usa otro campo se la quita a ese campo.
  const handleSelectChange = (campo: CampoRequerido, valor: string) => {
    setEstado((prev) => {
      const siguiente: MapeoSugerido = { ...prev.mapeo };
      if (valor !== SIN_COLUMNA) {
        for (const { key } of CAMPOS) if (siguiente[key] === valor) siguiente[key] = null;
      }
      siguiente[campo] = valor === SIN_COLUMNA ? null : valor;
      return { mapeo: siguiente, desdeGuardado: false };
    });
  };

  const eanCientifico =
    mapeo.ean !== null &&
    filasPreview.some((fila) => EAN_CIENTIFICO.test((fila[mapeo.ean as string] ?? "").trim()));

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Mapeo de columnas</h3>
        <p className="text-sm text-muted-foreground">
          Asigna cada campo del sistema a la columna correspondiente de tu archivo CSV.
        </p>

        {desdeGuardado && (
          <Alert className="border-border bg-muted text-foreground">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Mapeo aplicado de una importación anterior. Puedes modificarlo.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {CAMPOS.map(({ key, label, obligatorio }) => {
            const valorActual = mapeo[key];
            const esInvalido = validacion.camposFaltantes.includes(key);
            const idControl = `mapeo-${key}`;

            return (
              <div key={key} className="space-y-2">
                <Label htmlFor={idControl} className={esInvalido ? "text-destructive" : ""}>
                  {label}
                  {obligatorio && <span aria-hidden="true"> *</span>}
                </Label>
                <Select
                  value={valorActual ?? SIN_COLUMNA}
                  onValueChange={(val) => handleSelectChange(key, val)}
                >
                  <SelectTrigger id={idControl} className={esInvalido ? "border-destructive/50" : ""}>
                    <SelectValue placeholder="Seleccionar columna..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SIN_COLUMNA}>-- No mapear --</SelectItem>
                    {cabeceras.map((col) => {
                      const usadaPor = CAMPOS.find((c) => c.key !== key && mapeo[c.key] === col);
                      return (
                        <SelectItem key={col} value={col}>
                          {col}
                          {usadaPor && ` (en ${ETIQUETA[usadaPor.key]})`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {valorActual && filasPreview.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    <p className="font-medium">Vista previa:</p>
                    {filasPreview.slice(0, 3).map((fila, i) => (
                      <div key={i} className="truncate bg-muted px-2 py-1 rounded">
                        {fila[valorActual] || (
                          <span className="text-muted-foreground/50">[vacío]</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {validacion.camposFaltantes.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Faltan campos obligatorios:{" "}
            {validacion.camposFaltantes.map((c) => ETIQUETA[c]).join(", ")}.
          </AlertDescription>
        </Alert>
      )}

      {eanCientifico && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:text-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertCircle className="h-4 w-4 text-primary dark:text-amber-400" />
          <AlertDescription>
            La columna EAN parece venir en notación científica (por ejemplo 8,41E+12): Excel ha
            perdido dígitos. Vuelve a exportar el archivo con esa columna como texto.
          </AlertDescription>
        </Alert>
      )}

      {!mapeo.nombre && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:text-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertCircle className="h-4 w-4 text-primary dark:text-amber-400" />
          <AlertDescription>
            El campo &quot;NOMBRE&quot; no está mapeado. Los productos nuevos se crearán sin
            descripción.
          </AlertDescription>
        </Alert>
      )}

      {validacion.esValido && (
        <Alert className="border-success/30 bg-success/10 text-foreground">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertDescription>Mapeo válido. Puedes continuar con la vista previa.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
