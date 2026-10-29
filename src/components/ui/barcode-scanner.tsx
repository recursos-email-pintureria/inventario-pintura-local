import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, X, CheckCircle2, AlertCircle, Flashlight, FlashlightOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const READER_ID = "barcode-reader";
const CONFIRMACIONES = 2; // lecturas idénticas consecutivas necesarias

const FORMATOS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.QR_CODE,
];

// ── Utilidades ───────────────────────────────────────────────

/** Valida el dígito de control de EAN-13 / EAN-8 / UPC-A. Otros formatos pasan. */
function checksumValido(code: string): boolean {
  if (!/^\d+$/.test(code) || ![8, 12, 13].includes(code.length)) return true;
  const digitos = code.split("").map(Number);
  const control = digitos.pop()!;
  // Desde la derecha, el primer dígito (sin control) pesa 3, el siguiente 1, etc.
  const suma = digitos
    .reverse()
    .reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (suma % 10)) % 10 === control;
}

let audioCtx: AudioContext | null = null;
function pitido() {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    audioCtx ??= new AC();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.1;
    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);
  } catch {
    /* sin audio */
  }
  navigator.vibrate?.(60);
}

// ── Componente ───────────────────────────────────────────────

export function BarcodeScanner({ open, onOpenChange, onScan }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const [activo, setActivo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ultimo, setUltimo] = useState<string | null>(null);
  const [manual, setManual] = useState("");

  const [linternaOk, setLinternaOk] = useState(false);
  const [linterna, setLinterna] = useState(false);
  const [zoom, setZoom] = useState<{ min: number; max: number; step: number; value: number } | null>(null);

  const detener = useCallback(async () => {
    const s = scannerRef.current;
    scannerRef.current = null;
    if (!s) return;
    try {
      if (s.isScanning) await s.stop();
      s.clear();
    } catch {
      /* ya detenido */
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    let cancelado = false;
    let candidato = "";
    let repeticiones = 0;
    let terminado = false;

    setError(null);
    setUltimo(null);
    setActivo(false);
    setLinterna(false);
    setLinternaOk(false);
    setZoom(null);

    const iniciar = async () => {
      if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
        setError("La cámara requiere HTTPS. Usa la entrada manual.");
        return;
      }
      if (!document.getElementById(READER_ID)) return;

      try {
        const scanner = new Html5Qrcode(READER_ID, {
          verbose: false,
          formatsToSupport: FORMATOS,
          // Usa el BarcodeDetector nativo si el navegador lo tiene (mucho más rápido y preciso)
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        } as any);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 15,
            disableFlip: true, // los códigos de barras no necesitan la imagen espejada
            qrbox: (w, h) => ({
              width: Math.floor(Math.min(w * 0.85, 420)),
              height: Math.floor(Math.min(h * 0.4, 160)),
            }),
            videoConstraints: {
              facingMode: "environment",
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              advanced: [{ focusMode: "continuous" } as any],
            },
          },
          (texto) => {
            if (terminado) return;
            const code = texto.trim();
            if (!code || !checksumValido(code)) return; // lectura corrupta

            repeticiones = code === candidato ? repeticiones + 1 : 1;
            candidato = code;
            if (repeticiones < CONFIRMACIONES) return;

            terminado = true;
            pitido();
            setUltimo(code);
            onScanRef.current(code);
            void detener();
            onOpenChange(false);
          },
          () => {
            /* frames sin código: ignorar */
          },
        );

        if (cancelado) {
          await detener();
          return;
        }
        setActivo(true);

        // Linterna y zoom (si el dispositivo los soporta)
        try {
          const caps = scanner.getRunningTrackCameraCapabilities();
          setLinternaOk(caps.torchFeature().isSupported());
          const z = caps.zoomFeature();
          if (z.isSupported()) {
            const min = z.min(), max = z.max(), step = z.step();
            const inicial = Math.min(max, Math.max(min, 2)); // ~2x ayuda con códigos pequeños
            await z.apply(inicial);
            setZoom({ min, max, step, value: inicial });
          }
        } catch {
          /* capacidades no disponibles */
        }
      } catch (err: any) {
        if (cancelado) return;
        const msg = String(err?.name || err?.message || err);
        setError(
          /NotAllowed|Permission/i.test(msg)
            ? "Permiso de cámara denegado. Actívalo en el candado de la barra de direcciones."
            : /NotFound|Overconstrained/i.test(msg)
              ? "No se encontró una cámara disponible."
              : /NotReadable/i.test(msg)
                ? "La cámara está siendo usada por otra aplicación."
                : "No se pudo acceder a la cámara. Usa la entrada manual.",
        );
        setActivo(false);
      }
    };

    // Espera a que Radix monte el contenido del diálogo en el DOM
    const timer = setTimeout(iniciar, 300);

    return () => {
      cancelado = true;
      clearTimeout(timer);
      void detener();
    };
  }, [open, detener, onOpenChange]);

  const alternarLinterna = async () => {
    try {
      const f = scannerRef.current?.getRunningTrackCameraCapabilities().torchFeature();
      if (!f) return;
      await f.apply(!linterna);
      setLinterna(!linterna);
    } catch {
      setLinternaOk(false);
    }
  };

  const cambiarZoom = async (valor: number) => {
    try {
      await scannerRef.current?.getRunningTrackCameraCapabilities().zoomFeature().apply(valor);
      setZoom((z) => (z ? { ...z, value: valor } : z));
    } catch {
      /* ignorar */
    }
  };

  const usarManual = () => {
    const code = manual.trim();
    if (!code) return;
    onScanRef.current(code);
    setManual("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Escanear código
          </DialogTitle>
          <DialogDescription>
            Coloca el código dentro del recuadro, a unos 15–20 cm, con buena luz.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-lg border bg-gray-900">
            <div id={READER_ID} className="w-full" style={{ minHeight: 240 }} />
            {!activo && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 text-white">
                <div className="text-center">
                  <Camera className="mx-auto mb-2 h-10 w-10 animate-pulse opacity-60" />
                  <p className="text-sm">Iniciando cámara…</p>
                </div>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 p-4 text-center">
                <div>
                  <AlertCircle className="mx-auto mb-2 h-10 w-10 text-rose-500" />
                  <p className="text-sm text-white">{error}</p>
                </div>
              </div>
            )}
            {activo && linternaOk && (
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute right-2 top-2 z-10"
                onClick={alternarLinterna}
                aria-label="Linterna"
              >
                {linterna ? <FlashlightOff className="h-4 w-4" /> : <Flashlight className="h-4 w-4" />}
              </Button>
            )}
          </div>

          {zoom && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Zoom</span>
              <input
                type="range"
                className="flex-1"
                min={zoom.min}
                max={zoom.max}
                step={zoom.step}
                value={zoom.value}
                onChange={(e) => cambiarZoom(Number(e.target.value))}
              />
              <span className="w-8 text-right">{zoom.value.toFixed(1)}x</span>
            </div>
          )}

          {ultimo && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <p className="font-mono text-sm font-bold text-emerald-900">{ultimo}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && usarManual()}
              placeholder="O escribe el código manualmente"
              inputMode="numeric"
            />
            <Button type="button" variant="secondary" disabled={!manual.trim()} onClick={usarManual}>
              Usar
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" /> Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}