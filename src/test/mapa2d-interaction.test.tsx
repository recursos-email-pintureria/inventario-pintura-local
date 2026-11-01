import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Mapa2DModal } from "@/components/ubicaciones/Mapa2DModal";
import type { MapaUbicacion } from "@/components/ubicaciones/mapa2d-layout";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock("@/hooks/useAddStock", () => ({
  useAddStock: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const location: MapaUbicacion = {
  id: "loc-e651",
  codigo: "E651",
  nombre: "Armario E651",
  tipo: "armario",
  padreId: null,
  seccionId: null,
  lateral: null,
  numero: null,
  activo: true,
  capacidadMax: 100,
  productos: [],
};

const pasillo12: MapaUbicacion = {
  ...location,
  id: "pasillo-12",
  codigo: "12",
  nombre: "Pasillo 12",
  tipo: "pasillo",
};

describe("Mapa2DModal interactions", () => {
  beforeEach(() => {
    mocks.navigate.mockReset();
  });

  it("opens the map and shows location details when a map node is selected", async () => {
    const onSelectLocation = vi.fn();

    render(
      <Mapa2DModal
        open
        onOpenChange={vi.fn()}
        locations={[pasillo12, location]}
        productCatalog={[]}
        selectedLocationId={null}
        onSelectLocation={onSelectLocation}
        onOpenManagement={vi.fn()}
        onManagePallet={vi.fn()}
      />,
    );

    expect(await screen.findByText("Mapa 2D del almacén")).toBeInTheDocument();
    const mapSvg = screen.getByRole("group", { name: "Mapa interactivo del almacén" });
    expect(mapSvg).toHaveClass("h-auto");
    expect(mapSvg).toHaveClass("min-w-[1480px]");
    expect(mapSvg.parentElement).toHaveClass("overflow-auto");
    expect(mapSvg.parentElement).toHaveClass("min-h-[220px]");
    expect(screen.getByRole("combobox", { name: "Filtrar vista del mapa" })).toHaveTextContent(
      "Todo el almacén",
    );
    const mapNode = mapSvg.querySelector<SVGGElement>('[data-location-id="loc-e651"]');
    expect(mapNode).not.toBeNull();
    if (!mapNode) throw new Error("No se encontró el nodo de ubicación en el mapa");
    expect(mapNode.querySelector("title")).toHaveTextContent("E651 - Lado Derecho del Pasillo 12");
    fireEvent.click(mapNode);

    expect(await screen.findByText("Productos y stock actual")).toBeInTheDocument();
    expect(onSelectLocation).toHaveBeenCalledWith(location);
    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: /Armario E651/ })).toBeInTheDocument();
    });
  });

  it("restores the full warehouse view each time the map opens", async () => {
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
    const props = {
      onOpenChange: vi.fn(),
      locations: [pasillo12, location],
      productCatalog: [],
      selectedLocationId: null,
      onSelectLocation: vi.fn(),
      onOpenManagement: vi.fn(),
      onManagePallet: vi.fn(),
    };
    const { rerender } = render(<Mapa2DModal open {...props} />);

    fireEvent.click(screen.getByRole("combobox", { name: "Filtrar vista del mapa" }));
    fireEvent.click(await screen.findByRole("option", { name: "Solo pasillos" }));
    expect(screen.getByRole("combobox", { name: "Filtrar vista del mapa" })).toHaveTextContent(
      "Solo pasillos",
    );

    rerender(<Mapa2DModal open={false} {...props} />);
    rerender(<Mapa2DModal open {...props} />);

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: "Filtrar vista del mapa" })).toHaveTextContent(
        "Todo el almacén",
      );
    });
  });

  it("finds a location by its code and opens its detail from the suggestion", async () => {
    render(
      <Mapa2DModal
        open
        onOpenChange={vi.fn()}
        locations={[pasillo12, location]}
        productCatalog={[]}
        selectedLocationId={null}
        onSelectLocation={vi.fn()}
        onOpenManagement={vi.fn()}
        onManagePallet={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByRole("combobox", { name: "Buscar ubicación" }), {
      target: { value: "E651" },
    });

    const result = await screen.findByRole("option", { name: /Armario E651/ });
    fireEvent.click(result);

    expect(await screen.findByText("Productos y stock actual")).toBeInTheDocument();
    expect(document.querySelector('[data-location-id="loc-e651"]')).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("clears location dimming when closing the detail and allows selecting another node", async () => {
    const secondLocation: MapaUbicacion = {
      ...location,
      id: "loc-e652",
      codigo: "E652",
      nombre: "Armario E652",
    };
    const locations = [pasillo12, location, secondLocation];

    render(
      <Mapa2DModal
        open
        onOpenChange={vi.fn()}
        locations={locations}
        productCatalog={[]}
        selectedLocationId={null}
        onSelectLocation={vi.fn()}
        onOpenManagement={vi.fn()}
        onManagePallet={vi.fn()}
      />,
    );

    const map = screen.getByRole("group", { name: "Mapa interactivo del almacén" });
    fireEvent.click(map.querySelector('[data-location-id="loc-e651"]')!);

    const detailDialog = await screen.findByRole("dialog", { name: /Armario E651/ });
    fireEvent.click(within(detailDialog).getByRole("button", { name: "Close" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: /Armario E651/ })).not.toBeInTheDocument();
      expect(map.querySelector('[data-location-id="loc-e651"]')).toHaveStyle({ opacity: "1" });
      expect(map.querySelector('[data-location-id="loc-e652"]')).toHaveStyle({ opacity: "1" });
    });

    fireEvent.click(map.querySelector('[data-location-id="loc-e652"]')!);

    expect(await screen.findByRole("dialog", { name: /Armario E652/ })).toBeInTheDocument();
  });

  it("shows a title matching the selected map section", async () => {
    const section: MapaUbicacion = {
      ...location,
      id: "sec-pintura",
      codigo: "PINT",
      nombre: "Pintura",
      tipo: "seccion",
    };
    const aisle: MapaUbicacion = {
      ...location,
      id: "pasillo-pintura",
      codigo: "12",
      nombre: "Pasillo 12",
      tipo: "pasillo",
      padreId: section.id,
      seccionId: section.id,
    };

    render(
      <Mapa2DModal
        open
        onOpenChange={vi.fn()}
        locations={[section, aisle]}
        productCatalog={[]}
        selectedLocationId={null}
        onSelectLocation={vi.fn()}
        onOpenManagement={vi.fn()}
        onManagePallet={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("combobox", { name: "Filtrar vista del mapa" }));
    fireEvent.click(await screen.findByRole("option", { name: "Por sección" }));

    expect(await screen.findByText("MAPA SECCIÓN PINTURA")).toBeInTheDocument();
  });

  it("abre la gestión existente al seleccionar un palet dentro de Reserva", async () => {
    const onManagePallet = vi.fn();
    const reserve: MapaUbicacion = {
      ...location,
      id: "reserva",
      codigo: "RES",
      nombre: "Reserva",
      tipo: "reserva",
      palets: [
        {
          id: "palet-1",
          idReserva: "reserva",
          numero: 1,
          codigo: "PAL-001",
          stockTotal: 7,
          productos: [
            {
              id: "prod-1",
              sku: "SKU-1",
              nombre: "Producto",
              categoria: "Pintura",
              cantidad: 7,
              stock_minimo: 2,
            },
          ],
        },
      ],
    };

    render(
      <Mapa2DModal
        open
        onOpenChange={vi.fn()}
        locations={[reserve]}
        productCatalog={[]}
        selectedLocationId={null}
        onSelectLocation={vi.fn()}
        onOpenManagement={vi.fn()}
        onManagePallet={onManagePallet}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: /Palet 1 de 1/ }));

    expect(onManagePallet).toHaveBeenCalledWith("palet-1");
    expect(screen.getByText("RESERVA · Reserva")).toBeInTheDocument();
  });
});
