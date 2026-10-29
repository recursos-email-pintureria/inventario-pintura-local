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

// 🔊 Función para reproducir un bip corto (no requiere archivos externos)
const playBeep = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime); // Frecuencia 880Hz (tono agudo claro)
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime); // Volumen bajo para que no sea molesto
    
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.15); // Duración de 150ms
  } catch (e) {
    // Ignorar errores de audio (ej: políticas de autoplay del navegador)
  }
};

export function BarcodeScanner({ open, onOpenChange, onScan }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  
  // 🔒 BLINDAJE: Evita lecturas múltiples en la misma apertura del modal
  const hasScannedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      stopScanning();
      return;
    }

    const startScanner = async () => {
      setError(null);
      setLastScanned(null);
      hasScannedRef.current = false; // Resetear el candado al abrir

      try {
        const element = document.getElementById("barcode-reader");
        if (!element) {
          throw new Error("Elemento de cámara no encontrado en el DOM");
        }

        const scanner = new Html5Qrcode("barcode-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Si ya escaneamos uno, ignoramos el resto
            if (hasScannedRef.current) return;
            hasScannedRef.current = true;

            // 🔊 REPRODUCIR BIP AQUÍ
            playBeep();

            setLastScanned(decodedText);
            onScan(decodedText);
            stopScanning();
            onOpenChange(false);
          },
          (errorMessage) => {
            if (!errorMessage.includes("No MultiFormat Readers") && !errorMessage.includes("NotFoundException")) {
              console.warn("Scanner warning:", errorMessage);
            }
          }
        );

        setIsScanning(true);
      } catch (err: any) {
        console.error("Error al iniciar escáner:", err);
        setError(
          err?.message?.includes("Permission") || err?.message?.includes("NotAllowedError")
            ? "Permiso de cámara denegado. Actívalo en la configuración del navegador."
            : "No se pudo acceder a la cámara. Verifica que tengas una cámara disponible."
        );
        setIsScanning(false);
      }
    };

    const timeout = setTimeout(startScanner, 500);
    return () => {
      clearTimeout(timeout);
      stopScanning();
    };
  }, [open]);

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
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
          <DialogTitle className="flex items-center gap-2 text-orange-900">
            <Camera className="h-5 w-5 text-orange-600" />
            Escanear Código de Barras
          </DialogTitle>
          <DialogDescription>
            Apunta la cámara al código. Se detectará, sonará un bip y se cerrará automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-lg border border-orange-200 bg-gray-900">
            <div
              id="barcode-reader"
              className="w-full"
              style={{ minHeight: isScanning ? "300px" : "200px" }}
            />

            {!isScanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                <div className="text-center text-white">
                  <Camera className="mx-auto h-12 w-12 mb-2 opacity-50 animate-pulse" />
                  <p className="text-sm">Solicitando acceso a la cámara...</p>
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

          {lastScanned && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div className="flex-1">
                <p className="text-xs font-medium text-emerald-700">Código detectado:</p>
                <p className="font-mono text-sm font-bold text-emerald-900">{lastScanned}</p>
              </div>
            </div>
          )}

          <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-xs text-orange-800">
            <p className="font-semibold mb-1">💡 Consejos:</p>
            <ul className="list-disc list-inside space-y-0.5 text-orange-700">
              <li>Usa la cámara trasera del móvil.</li>
              <li>Asegúrate de tener buena iluminación.</li>
              <li>Mantén el código a 10-15 cm de la cámara.</li>
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