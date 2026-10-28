import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (code: string) => void;
}

export function BarcodeScanner({ open, onOpenChange, onScan }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  // Iniciar escaneo cuando se abre el diálogo
  useEffect(() => {
    if (!open) {
      stopScanning();
      return;
    }

    const startScanner = async () => {
      setError(null);
      setLastScanned(null);

      try {
        const scanner = new Html5Qrcode("barcode-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
          },
          (decodedText) => {
            // Código escaneado exitosamente
            setLastScanned(decodedText);
            onScan(decodedText);
            stopScanning();
            onOpenChange(false);
          },

          (errorMessage) => {
            // Errores de escaneo (ignoramos los de "no code found")
            if (!errorMessage.includes("No MultiFormat Readers")) {
              console.warn("Scanner error:", errorMessage);
            }
          },
        );

        setIsScanning(true);
      } catch (err: any) {
        setError(
          err?.message?.includes("Permission")
            ? "Permiso de cámara denegado. Actívalo en la configuración del navegador."
            : "No se pudo acceder a la cámara. Verifica que tengas una cámara disponible.",
        );
        setIsScanning(false);
      }
    };

    // Pequeño delay para que el DOM del Dialog esté listo
    const timeout = setTimeout(startScanner, 300);
    return () => {
      clearTimeout(timeout);
      stopScanning();
    };
  }, [open]);

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.warn("Error al detener scanner:", err);
      }
      scannerRef.current = null;
      setIsScanning(false);
    }
  };

  const handleClose = () => {
    stopScanning();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-amber-700" />
            Escanear Código de Barras
          </DialogTitle>
          <DialogDescription>
            Apunta la cámara al código de barras del producto. El código se detectará
            automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Contenedor de la cámara */}
          <div
            ref={containerRef}
            className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-900"
          >
            <div
              id="barcode-reader"
              className="w-full"
              style={{ minHeight: isScanning ? "300px" : "200px" }}
            />

            {!isScanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                <div className="text-center text-white">
                  <Camera className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p className="text-sm">Iniciando cámara...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 p-4">
                <div className="text-center">
                  <AlertCircle className="mx-auto h-12 w-12 mb-2 text-rose-500" />
                  <p className="text-sm text-white">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Último código escaneado */}
          {lastScanned && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div className="flex-1">
                <p className="text-xs font-medium text-emerald-700">Código detectado:</p>
                <p className="font-mono text-sm font-bold text-emerald-900">{lastScanned}</p>
              </div>
            </div>
          )}

          {/* Instrucciones */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            <p className="font-semibold mb-1">💡 Consejos:</p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-700">
              <li>Asegúrate de tener buena iluminación</li>
              <li>Mantén el código a 10-20 cm de la cámara</li>
              <li>El código se detectará automáticamente</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <X className="mr-2 h-4 w-4" />
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
