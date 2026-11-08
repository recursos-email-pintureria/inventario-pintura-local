import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Download, FileSpreadsheet, Mail, Printer, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEnviarEmail } from "@/hooks/useEnviarEmail";
import {
  descargarBlob,
  descargarPdf,
  generarExcelInforme,
  generarPdfInforme,
  imprimirPdf,
  nombreArchivoInforme,
  pdfABase64,
  type InformeInventario,
} from "@/lib/reportes";
import { cn } from "@/lib/utils";
import { ReporteInventarioDocumento } from "@/components/inventario/ReporteInventarioDocumento";

const MAX_ADJUNTO_BYTES = 1024 * 1024;

function bytesDeBase64(base64: string): number {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

function textoResumen(informe: InformeInventario): string {
  return [
    "Hola,",
    "",
    `Adjunto el ${informe.titulo}.`,
    `Resumen: ${informe.resumen.referencias} referencias, ${informe.resumen.unidades} unidades, ${informe.resumen.lineasBajo} líneas bajo stock y ${informe.resumen.lineasAgotadas} agotadas.`,
    "",
    "Un saludo,",
    informe.generadoPor,
  ].join("\n");
}

interface ModalInformeInventarioProps {
  abierto: boolean;
  onOpenChange: (open: boolean) => void;
  informe: InformeInventario | null;
  puedeExportar: boolean;
  puedeEnviarEmail: boolean;
  esAdmin: boolean;
  emailPropio: string;
}

export function ModalInformeInventario({
  abierto,
  onOpenChange,
  informe,
  puedeExportar,
  puedeEnviarEmail,
  esAdmin,
  emailPropio,
}: ModalInformeInventarioProps) {
  const enviarEmail = useEnviarEmail();
  const [vista, setVista] = useState<"preview" | "email">("preview");
  const [destinatario, setDestinatario] = useState(emailPropio);
  const [asunto, setAsunto] = useState("");
  const [cuerpo, setCuerpo] = useState("");

  useEffect(() => {
    if (!abierto || !informe) return;
    setVista("preview");
    setDestinatario(emailPropio);
    setAsunto(informe.titulo);
    setCuerpo(textoResumen(informe));
  }, [abierto, informe, emailPropio]);

  const nombreArchivo = useMemo(
    () => nombreArchivoInforme(informe?.titulo ?? "informe"),
    [informe?.titulo],
  );

  const pdfBase64 = useMemo(() => {
    if (!informe) return "";
    return pdfABase64(generarPdfInforme(informe));
  }, [informe]);

  const adjuntoDemasiadoGrande = bytesDeBase64(pdfBase64) > MAX_ADJUNTO_BYTES;

  if (!informe) return null;

  const descargarPdfActual = () => {
    if (!puedeExportar) {
      toast.error("No tienes permisos para exportar inventario.");
      return;
    }
    descargarPdf(generarPdfInforme(informe), nombreArchivo);
    toast.success("PDF descargado correctamente.");
  };

  const imprimir = () => {
    if (!puedeExportar) {
      toast.error("No tienes permisos para imprimir inventario.");
      return;
    }
    imprimirPdf(generarPdfInforme(informe), nombreArchivo);
  };

  const descargarExcel = () => {
    if (!puedeExportar) {
      toast.error("No tienes permisos para exportar inventario.");
      return;
    }
    descargarBlob(generarExcelInforme(informe), `${nombreArchivo}.xlsx`);
    toast.success("Excel descargado correctamente.");
  };

  const enviar = (event: React.FormEvent) => {
    event.preventDefault();
    if (!puedeEnviarEmail) {
      toast.error("No tienes permisos para enviar informes por email.");
      return;
    }
    if (adjuntoDemasiadoGrande) {
      toast.error("El PDF supera el límite de 1 MB para enviarse por email.");
      return;
    }
    if (!destinatario.trim()) {
      toast.error("Indica un destinatario.");
      return;
    }

    void enviarEmail.mutateAsync({
      destinatario: destinatario.trim(),
      asunto: asunto.trim(),
      cuerpo: cuerpo.trim(),
      tipo: "reporte_inventario",
      adjunto: {
        filename: `${nombreArchivo}.pdf`,
        content: pdfBase64,
      },
    });
  };

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto p-0">
        <div className="border-b border-border bg-muted/80 px-5 py-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Printer className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              {informe.titulo}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {informe.subtitulo} · {new Date(informe.fecha).toLocaleString("es-ES")}
            </DialogDescription>
          </DialogHeader>

          {puedeExportar && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={descargarPdfActual}
                className="h-8 gap-1.5 bg-blue-600 text-xs text-white hover:bg-blue-700"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Descargar PDF
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={imprimir}
                className="h-8 gap-1.5 text-xs"
              >
                <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                Imprimir
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={descargarExcel}
                className="h-8 gap-1.5 text-xs"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                Excel
              </Button>
              {puedeEnviarEmail && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setVista("email")}
                  className={cn(
                    "h-8 gap-1.5 text-xs",
                    vista === "email" && "border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-100",
                  )}
                >
                  <Mail className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                  Enviar por email
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5">
          {vista === "preview" ? (
            <ReporteInventarioDocumento informe={informe} />
          ) : (
            <form onSubmit={enviar} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Enviar informe por email</h3>
                  <p className="text-xs text-muted-foreground">
                    Se adjuntará el PDF del informe. Límite de adjunto: 1 MB.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setVista("preview")}
                  className="h-8 text-xs"
                >
                  Volver a la vista previa
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="informe-destinatario">Destinatario</Label>
                  <Input
                    id="informe-destinatario"
                    type="email"
                    value={destinatario}
                    onChange={(event) => setDestinatario(event.target.value)}
                    readOnly={!esAdmin}
                    className={!esAdmin ? "bg-muted text-muted-foreground" : undefined}
                    required
                  />
                  {!esAdmin && (
                    <p className="text-[11px] text-muted-foreground">
                      Solo puedes enviarte el informe a tu propia cuenta.
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="informe-asunto">Asunto</Label>
                  <Input
                    id="informe-asunto"
                    value={asunto}
                    onChange={(event) => setAsunto(event.target.value)}
                    maxLength={150}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="informe-cuerpo">Mensaje</Label>
                <Textarea
                  id="informe-cuerpo"
                  value={cuerpo}
                  onChange={(event) => setCuerpo(event.target.value)}
                  rows={7}
                  maxLength={20_000}
                  required
                />
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted p-3 text-xs text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span>
                  Adjunto: <strong>{nombreArchivo}.pdf</strong>
                </span>
              </div>

              {adjuntoDemasiadoGrande && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-3 text-xs text-rose-800 dark:text-rose-200"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  El PDF supera el límite de 1 MB. Descárgalo y envíalo manualmente.
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={enviarEmail.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    enviarEmail.isPending ||
                    adjuntoDemasiadoGrande ||
                    !puedeEnviarEmail ||
                    !destinatario.trim()
                  }
                  className="gap-1.5 bg-amber-600 text-white hover:bg-amber-700"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  {enviarEmail.isPending ? "Enviando..." : "Enviar informe"}
                </Button>
              </div>
            </form>
          )}
        </div>

        <DialogFooter className="border-t border-border bg-muted/80 px-5 py-3">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
