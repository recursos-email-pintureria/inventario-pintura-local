import { useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Escaner({ onCodigo, onCerrar }: { onCodigo: (codigo: string) => void; onCerrar: () => void }) {
  const id = `scanner-${useId().replace(/:/g, '')}`;
  const [error, setError] = useState('');
  const [manual, setManual] = useState('');
  useEffect(() => {
    let cancelado = false;
    let iniciado = false;
    let scanner: import('html5-qrcode').Html5Qrcode | undefined;
    let ocupado = false;
    const iniciar = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelado) return;
        scanner = new Html5Qrcode(id);
        await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 250, height: 150 } }, (codigo) => {
          if (!cancelado && !ocupado) { ocupado = true; onCodigo(codigo); }
        }, () => {});
        iniciado = true;
        if (cancelado) { await scanner.stop(); scanner.clear(); }
      } catch {
        if (!cancelado) setError('No se pudo abrir la cámara. Revisa el permiso o introduce el código manualmente.');
      }
    };
    void iniciar();
    return () => { cancelado = true; if (scanner && iniciado) void scanner.stop().then(() => scanner?.clear()).catch(() => {}); };
  }, [id, onCodigo]);
  return <div className="space-y-4"><div id={id} className="min-h-48 w-full overflow-hidden" />{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="space-y-2"><Label htmlFor={`${id}-manual`}>Código de barras</Label><Input id={`${id}-manual`} value={manual} onChange={e => setManual(e.target.value)} /></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={onCerrar}>Cancelar</Button><Button disabled={!manual.trim()} onClick={() => onCodigo(manual.trim())}>Usar código</Button></div></div>;
}
