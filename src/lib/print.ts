import { useCallback, useEffect, useRef } from "react";

/**
 * Activa una impresión aislada: solo se imprime el elemento con la clase
 * `print-target`. El resto de la aplicación y los diálogos abiertos quedan ocultos.
 */
export function usePrint() {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  return useCallback(() => {
    cleanupRef.current?.();

    const body = document.body;
    body.classList.add("printing");

    let cleaned = false;
    let timeoutId = 0;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      body.classList.remove("printing");
      window.removeEventListener("afterprint", cleanup);
      window.clearTimeout(timeoutId);
      cleanupRef.current = null;
    };

    timeoutId = window.setTimeout(cleanup, 60_000);
    cleanupRef.current = cleanup;
    window.addEventListener("afterprint", cleanup, { once: true });

    window.requestAnimationFrame(() => {
      window.print();
    });
  }, []);
}
