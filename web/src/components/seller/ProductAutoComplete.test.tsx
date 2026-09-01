import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { catalogService } from "../../services/catalogService";
import type { Product } from "../../types/catalog";
import { OlfactoryPyramidModal } from "./OlfactoryPyramidModal";
import { ProductAutocomplete } from "./ProductAutocomplete";

vi.mock("../../services/catalogService", () => ({
  catalogService: {
    searchProducts: vi.fn(),
  },
}));

const product: Product = {
  id: 1,
  name: "Sauvage",
  brand: { id: 1, name: "Dior" },
  olfactory_family: "Amadeirado",
  top_notes: ["Bergamota", "Pimenta"],
  heart_notes: ["Lavanda", "Vetiver"],
  base_notes: ["Ambroxan", "Cedro"],
  description: "Uma fragrância marcante.",
  image_url: "https://example.com/sauvage.png",
};

const searchProducts = vi.mocked(catalogService.searchProducts);

function CatalogSearch() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <>
      <ProductAutocomplete onSelect={setSelectedProduct} />
      {selectedProduct ? (
        <OlfactoryPyramidModal
          onClose={() => setSelectedProduct(null)}
          product={selectedProduct}
        />
      ) : null}
    </>
  );
}

describe("ProductAutocomplete", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    searchProducts.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renderiza o campo de busca do catálogo", () => {
    render(<ProductAutocomplete onSelect={vi.fn()} />);

    expect(
      screen.getByRole("searchbox", { name: /buscar no catálogo oficial/i }),
    ).toBeInTheDocument();
  });

  it("busca após o debounce de 300 ms e exibe os resultados do mock", async () => {
    searchProducts.mockResolvedValueOnce([product]);
    render(<ProductAutocomplete onSelect={vi.fn()} />);

    fireEvent.change(
      screen.getByRole("searchbox", { name: /buscar no catálogo oficial/i }),
      { target: { value: "Sauvage" } },
    );

    expect(searchProducts).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(searchProducts).toHaveBeenCalledWith("Sauvage");
    expect(screen.getByRole("button", { name: /sauvage/i })).toBeInTheDocument();
    expect(screen.getByText(/dior.*amadeirado/i)).toBeInTheDocument();
  });

  it("abre a ficha técnica com as três camadas ao selecionar um resultado", async () => {
    searchProducts.mockResolvedValueOnce([product]);
    render(<CatalogSearch />);

    fireEvent.change(
      screen.getByRole("searchbox", { name: /buscar no catálogo oficial/i }),
      { target: { value: "Sauvage" } },
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    fireEvent.click(screen.getByRole("button", { name: /sauvage/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Saída" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Corpo" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Fundo" })).toBeInTheDocument();
    expect(screen.getByText("Bergamota")).toBeInTheDocument();
    expect(screen.getByText("Lavanda")).toBeInTheDocument();
    expect(screen.getByText("Ambroxan")).toBeInTheDocument();
  });
});