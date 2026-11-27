import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CatalogPickerModal } from "./CatalogPickerModal";
import { catalogService } from "../../services/catalogService";
import type { Product } from "../../types/catalog";

vi.mock("../../services/catalogService", () => ({
  catalogService: {
    searchProducts: vi.fn(),
  },
}));

const mockProducts: Product[] = [
  {
    id: 10,
    name: "Sauvage Elixir",
    brand: { id: 1, name: "Dior" },
    concentration: "Parfum",
    gender: "Masculino",
    olfactory_family: "Amadeirado",
    top_notes: ["Canela", "Noz-moscada"],
    heart_notes: ["Lavanda"],
    base_notes: ["Sândalo", "Alcaçuz"],
    ean: "1234567890123",
    anvisa_code: "25351.123456/2026-01",
    description: "Fragrância intensa",
    image_url: "https://example.com/sauvage.jpg",
    is_approved: true,
  },
  {
    id: 11,
    name: "Delina",
    brand: { id: 2, name: "Parfums de Marly" },
    concentration: "EDP",
    gender: "Feminino",
    olfactory_family: "Floral",
    top_notes: ["Lichia", "Ruibarbo"],
    heart_notes: ["Rosa Turca", "Peônia"],
    base_notes: ["Baunilha", "Almíscar"],
    ean: "9876543210987",
    anvisa_code: "25351.654321/2026-02",
    description: "Floral exuberante",
    image_url: "https://example.com/delina.jpg",
    is_approved: true,
  },
];

describe("CatalogPickerModal", () => {
  it("renderiza produtos e permite selecionar para oferta", async () => {
    const user = userEvent.setup();
    vi.mocked(catalogService.searchProducts).mockResolvedValue(mockProducts);

    const onSelect = vi.fn();
    const onClose = vi.fn();

    render(
      <CatalogPickerModal
        onSelectProduct={onSelect}
        onClose={onClose}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Adicionar Perfume ao Estoque" }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Sauvage Elixir")).toBeInTheDocument();
      expect(screen.getByText("Delina")).toBeInTheDocument();
    });

    const offerButtons = screen.getAllByRole("button", {
      name: /ofertar no meu estoque/i,
    });
    expect(offerButtons.length).toBe(2);

    await user.click(offerButtons[0]);
    expect(onSelect).toHaveBeenCalledWith(mockProducts[0]);
  });

  it("filtra por família olfativa", async () => {
    const user = userEvent.setup();
    vi.mocked(catalogService.searchProducts).mockResolvedValue([mockProducts[1]]);

    const onSelect = vi.fn();
    const onClose = vi.fn();

    render(
      <CatalogPickerModal
        onSelectProduct={onSelect}
        onClose={onClose}
      />,
    );

    const floralButton = screen.getByRole("button", { name: "Floral" });
    await user.click(floralButton);

    await waitFor(() => {
      expect(catalogService.searchProducts).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({ family: "Floral" }),
      );
    });
  });
});
