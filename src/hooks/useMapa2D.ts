import { useCallback, useState } from "react";

export interface MapaPosition {
  x: number;
  y: number;
}

export type MapaVista = "todo" | "seccion" | "pasillos";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;

export function useMapa2D() {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<string | null>(null);
  const [vista, setVista] = useState<MapaVista>("todo");
  const [seccionSeleccionada, setSeccionSeleccionada] = useState<string | null>(null);

  const zoomIn = useCallback(() => {
    setZoom((actual) => Math.min(MAX_ZOOM, Number((actual + 0.2).toFixed(2))));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((actual) => Math.max(MIN_ZOOM, Number((actual - 0.2).toFixed(2))));
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const centerOnLocation = useCallback(
    (
      locationId: string,
      position: MapaPosition,
      canvasWidth: number,
      canvasHeight: number,
      currentZoom: number,
    ) => {
      setUbicacionSeleccionada(locationId);
      setPan({
        x: (canvasWidth / 2 - position.x) * currentZoom,
        y: (canvasHeight / 2 - position.y) * currentZoom,
      });
    },
    [],
  );

  const selectLocation = useCallback((locationId: string | null) => {
    setUbicacionSeleccionada(locationId);
  }, []);

  return {
    zoom,
    setZoom,
    pan,
    setPan,
    ubicacionSeleccionada,
    selectLocation,
    vista,
    setVista,
    seccionSeleccionada,
    setSeccionSeleccionada,
    zoomIn,
    zoomOut,
    resetView,
    centerOnLocation,
  };
}
