import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
        locations={[location]}
        productCatalog={[]}
        selectedLocationId={null}
        onSelectLocation={onSelectLocation}
        onOpenManagement={vi.fn()}
      />,
    );

    expect(await screen.findByText("Mapa 2D del almacén")).toBeInTheDocument();
    const mapSvg = screen.getByRole("group", { name: "Mapa interactivo del almacén" });
    expect(mapSvg).toHaveClass("h-auto");
    expect(mapSvg.parentElement).toHaveClass("overflow-auto");
    expect(mapSvg.parentElement).toHaveClass("min-h-[220px]");
    expect(screen.getByRole("combobox", { name: "Filtrar vista del mapa" })).toHaveTextContent(
      "Todo el almacén",
    );
    const mapNode = mapSvg.querySelector<SVGGElement>('[data-location-id="loc-e651"]');
    expect(mapNode).not.toBeNull();
    if (!mapNode) throw new Error("No se encontró el nodo de ubicación en el mapa");
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
      locations: [location],
      productCatalog: [],
      selectedLocationId: null,
      onSelectLocation: vi.fn(),
      onOpenManagement: vi.fn(),
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
        locations={[location]}
        productCatalog={[]}
        selectedLocationId={null}
        onSelectLocation={vi.fn()}
        onOpenManagement={vi.fn()}
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
      />,
    );

    fireEvent.click(screen.getByRole("combobox", { name: "Filtrar vista del mapa" }));
    fireEvent.click(await screen.findByRole("option", { name: "Por sección" }));

    expect(await screen.findByText("MAPA SECCIÓN PINTURA")).toBeInTheDocument();
  });
});
