import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Home, Minus, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useAddStock } from "@/hooks/useAddStock";
import { useMapa2D } from "@/hooks/useMapa2D";
import { useStockVisual } from "@/hooks/useStockVisual";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationIcon, Mapa2D } from "./Mapa2D";
import { getMapa2DLayout, type MapaProducto, type MapaUbicacion } from "./mapa2d-layout";

interface Mapa2DModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locations: MapaUbicacion[];
  productCatalog: MapaProducto[];
  selectedLocationId: string | null;
  onSelectLocation: (location: MapaUbicacion) => void;
  onOpenManagement: (location: MapaUbicacion) => void;
}

export function Mapa2DModal({
  open,
  onOpenChange,
  locations,
  productCatalog,
  selectedLocationId,
  onSelectLocation,
  onOpenManagement,
}: Mapa2DModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const addStockMutation = useAddStock();
  const map = useMapa2D();
  const summaries = useStockVisual(locations);
  const layout = useMemo(() => getMapa2DLayout(locations), [locations]);
  const [detailLocationId, setDetailLocationId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [productId, setProductId] = useState("");
  const [addQuantity, setAddQuantity] = useState("1");
  const [targetQuantity, setTargetQuantity] = useState("");
  const detailLocation = locations.find((location) => location.id === detailLocationId) ?? null;
  const detailSummary = detailLocation ? summaries.get(detailLocation.id) : undefined;
  const sections = locations.filter((location) => location.tipo === "seccion");
  const canEditLocation = Boolean(
    detailLocation?.activo &&
    detailLocation.tipo !== "reserva" &&
    detailLocation.tipo !== "seccion",
  );
  const selectMapLocation = map.selectLocation;

  useEffect(() => {
    if (!open || !selectedLocationId) return;
    selectMapLocation(selectedLocationId);
  }, [open, selectedLocationId, selectMapLocation]);

  const selectLocation = (location: MapaUbicacion, center = false) => {
    map.selectLocation(location.id);
    onSelectLocation(location);
    setDetailLocationId(location.id);
    if (center) {
      const position = layout.positions.get(location.id);
      if (position) map.centerOnLocation(location.id, position, layout.height, map.zoom);
    }
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchText.trim().toLocaleLowerCase();
    if (!query) return;
    const location =
      locations.find(
        (item) =>
          item.codigo.toLocaleLowerCase() === query || item.nombre.toLocaleLowerCase() === query,
      ) ??
      locations.find(
        (item) =>
          item.codigo.toLocaleLowerCase().includes(query) ||
          item.nombre.toLocaleLowerCase().includes(query),
      );
    if (!location) {
      toast.error("No se encontró esa ubicación");
      return;
    }
    selectLocation(location, true);
  };

  const handleQuickAdd = async () => {
    const quantity = Number(addQuantity);
    if (
      !detailLocation ||
      !user?.id ||
      !productId ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      toast.error("Selecciona un producto y una cantidad entera mayor que cero");
      return;
    }

    try {
      await addStockMutation.mutateAsync({
        id_producto: productId,
        id_ubicacion: detailLocation.id,
        tipo: "entrada",
        cantidad: quantity,
        realizado_por: user.id,
      });
      toast.success("Entrada de stock registrada");
      setAddQuantity("1");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar el movimiento");
    }
  };

  const handleAdjust = async () => {
    const target = Number(targetQuantity);
    if (!detailLocation || !user?.id || !productId || !Number.isInteger(target) || target < 0) {
      toast.error("Selecciona un producto y una cantidad final válida");
      return;
    }

    const current =
      detailLocation.productos
        .filter((product) => product.id === productId)
        .reduce((sum, product) => sum + product.cantidad, 0) ?? 0;
    if (target === current) {
      toast.info("La ubicación ya tiene esa cantidad");
      return;
    }
    if (target === 0 && current === 0) {
      toast.info("No hay stock que retirar");
      return;
    }

    try {
      await addStockMutation.mutateAsync({
        id_producto: productId,
        id_ubicacion: detailLocation.id,
        tipo: target === 0 ? "salida" : "ajuste",
        cantidad: target === 0 ? current : target,
        realizado_por: user.id,
      });
      toast.success("Stock ajustado correctamente");
      setTargetQuantity("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo ajustar el stock");
    }
  };

  const handleManage = (location: MapaUbicacion) => {
    onOpenChange(false);
    setDetailLocationId(null);
    onOpenManagement(location);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="flex h-[94vh] w-[96vw] max-w-[96vw] flex-col gap-3 p-4 sm:rounded-xl"
          onKeyDown={(event) => {
            if (
              event.target instanceof HTMLElement &&
              ["INPUT", "BUTTON"].includes(event.target.tagName)
            )
              return;
            if (event.key === "+" || event.key === "=") map.zoomIn();
            if (event.key === "-") map.zoomOut();
          }}
        >
          <DialogHeader className="shrink-0 pr-8">
            <DialogTitle>Mapa Completo del Almacén</DialogTitle>
            <DialogDescription>
              Selecciona una ubicación para ver sus productos. Arrastra para desplazarte y usa la
              rueda para acercar o alejar.
            </DialogDescription>
          </DialogHeader>

          <div className="flex shrink-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Label htmlFor="mapa-busqueda" className="sr-only">
                Buscar ubicación
              </Label>
              <Input
                id="mapa-busqueda"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Buscar ubicación (ej. E651)"
                className="w-full sm:w-56"
              />
              <Button type="submit" variant="outline" aria-label="Buscar ubicación">
                <Search className="h-4 w-4" />
              </Button>
            </form>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={map.vista}
                onValueChange={(value) => {
                  map.setVista(value as "todo" | "seccion" | "pasillos");
                  if (value === "seccion" && !map.seccionSeleccionada && sections[0]) {
                    map.setSeccionSeleccionada(sections[0].id);
                  }
                }}
              >
                <SelectTrigger className="w-[180px]" aria-label="Filtrar vista del mapa">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Todo el almacén</SelectItem>
                  <SelectItem value="seccion">Por sección</SelectItem>
                  <SelectItem value="pasillos">Solo pasillos</SelectItem>
                </SelectContent>
              </Select>
              {map.vista === "seccion" && (
                <Select
                  value={map.seccionSeleccionada ?? ""}
                  onValueChange={map.setSeccionSeleccionada}
                >
                  <SelectTrigger className="w-[180px]" aria-label="Seleccionar sección">
                    <SelectValue placeholder="Elige una sección" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button variant="outline" size="icon" aria-label="Alejar mapa" onClick={map.zoomOut}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="min-w-12 text-center text-sm tabular-nums" aria-live="polite">
                {Math.round(map.zoom * 100)}%
              </span>
              <Button variant="outline" size="icon" aria-label="Acercar mapa" onClick={map.zoomIn}>
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Resetear vista"
                onClick={map.resetView}
              >
                <Home className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Mapa2D
            locations={locations}
            summaries={summaries}
            selectedLocationId={map.ubicacionSeleccionada ?? selectedLocationId}
            zoom={map.zoom}
            pan={map.pan}
            view={map.vista}
            sectionId={map.seccionSeleccionada}
            onZoom={(direction) => (direction > 0 ? map.zoomIn() : map.zoomOut())}
            onPanChange={map.setPan}
            onSelect={(location) => selectLocation(location)}
            onManage={handleManage}
          />

          <div
            className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground"
            aria-label="Leyenda de stock"
          >
            <span className="font-medium text-foreground">Stock:</span>
            <span className="flex items-center gap-1">
              <i className="h-3 w-3 rounded-sm bg-emerald-200" />
              Normal (&gt;20%)
            </span>
            <span className="flex items-center gap-1">
              <i className="h-3 w-3 rounded-sm bg-amber-200" />
              Medio (10–20%)
            </span>
            <span className="flex items-center gap-1">
              <i className="h-3 w-3 rounded-sm bg-rose-200" />
              Crítico (&lt;10%)
            </span>
            <span className="flex items-center gap-1">
              <i className="h-3 w-3 rounded-sm bg-slate-300" />
              Sin stock / inactivo
            </span>
            <span className="ml-auto">
              Doble clic: abrir gestión completa · Capacidad predeterminada: 100 uds
            </span>
          </div>
        </DialogContent>
        <Dialog
          open={Boolean(detailLocation)}
          onOpenChange={(isOpen) => {
            if (!isOpen) setDetailLocationId(null);
          }}
        >
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
            {detailLocation && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <LocationIcon type={detailLocation.tipo} />
                    <span>{detailLocation.nombre}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      ({detailLocation.codigo})
                    </span>
                  </DialogTitle>
                  <DialogDescription>
                    {detailLocation.tipo} · {detailSummary?.productosCount ?? 0} productos ·{" "}
                    {detailSummary?.total ?? 0} unidades
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Productos y stock actual</h3>
                  {detailLocation.productos.length > 0 ? (
                    <ul className="max-h-48 divide-y overflow-y-auto rounded-md border">
                      {detailLocation.productos.map((product, index) => (
                        <li
                          key={`${product.id}-${index}`}
                          className="flex items-center justify-between gap-3 p-2 text-sm"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{product.nombre}</span>
                            <span className="text-xs text-muted-foreground">{product.sku}</span>
                          </span>
                          <span className="shrink-0 tabular-nums">{product.cantidad} uds</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                      No hay productos con stock en esta ubicación.
                    </p>
                  )}
                </div>

                {canEditLocation ? (
                  <div className="space-y-3 rounded-lg border p-3">
                    <h3 className="text-sm font-semibold">Acciones rápidas de stock</h3>
                    <div className="space-y-1.5">
                      <Label htmlFor="mapa-producto">Producto</Label>
                      <Select value={productId} onValueChange={setProductId}>
                        <SelectTrigger id="mapa-producto">
                          <SelectValue placeholder="Selecciona un producto" />
                        </SelectTrigger>
                        <SelectContent>
                          {productCatalog
                            .filter((product) => product.id)
                            .map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.nombre} ({product.sku})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="mapa-entrada-cantidad">Añadir unidades</Label>
                        <div className="flex gap-2">
                          <Input
                            id="mapa-entrada-cantidad"
                            type="number"
                            min="1"
                            step="1"
                            value={addQuantity}
                            onChange={(event) => setAddQuantity(event.target.value)}
                          />
                          <Button
                            type="button"
                            onClick={handleQuickAdd}
                            disabled={addStockMutation.isPending || !productId || !user?.id}
                          >
                            Añadir
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="mapa-stock-objetivo">Ajustar a cantidad final</Label>
                        <div className="flex gap-2">
                          <Input
                            id="mapa-stock-objetivo"
                            type="number"
                            min="0"
                            step="1"
                            value={targetQuantity}
                            onChange={(event) => setTargetQuantity(event.target.value)}
                            placeholder="Ej. 15"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleAdjust}
                            disabled={addStockMutation.isPending || !productId || !user?.id}
                          >
                            Ajustar
                          </Button>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Las acciones registran movimientos; el stock se actualiza mediante el trigger
                      de la base de datos.
                    </p>
                  </div>
                ) : detailLocation.tipo === "reserva" ? (
                  <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                    Las reservas pueden contener stock de palets; gestiona esos movimientos desde el
                    módulo de palets.
                  </p>
                ) : null}

                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void navigate({ to: "/movimientos" })}
                  >
                    Ver movimientos
                  </Button>
                  <Button type="button" onClick={() => handleManage(detailLocation)}>
                    Gestión completa
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </Dialog>
    </>
  );
}
