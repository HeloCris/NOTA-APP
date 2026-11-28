import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProductDetailsModal } from "./ProductDetailsModal";

describe("ProductDetailsModal", () => {
  const mockProduct = {
    id: 1,
    name: "Jasmim Sambac",
    brand: { id: 10, name: "Maison Noire Parfums" },
    ean: "7891234567890",
    anvisa_code: "25351.123456/2026-00",
    concentration: "EDP",
    gender: "Feminino",
    olfactory_family: "Floral",
    top_notes: ["Bergamota", "Pera"],
    heart_notes: ["Jasmim Sambac", "Tuberosa"],
    base_notes: ["Sândalo", "Baunilha"],
    description: "Fragrância floral opulenta e sofisticada.",
    image_url: "https://example.com/jasmim.png",
    is_approved: true,
  };

  it("renderiza todos os dados técnicos e notas da pirâmide olfativa", () => {
    const onClose = vi.fn();
    render(<ProductDetailsModal product={mockProduct} onClose={onClose} />);

    expect(
      screen.getByRole("heading", { name: "Jasmim Sambac" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Jasmim Sambac")).toHaveLength(2);
    expect(screen.getByText("Maison Noire Parfums")).toBeInTheDocument();
    expect(screen.getByText("7891234567890")).toBeInTheDocument();
    expect(screen.getByText("25351.123456/2026-00")).toBeInTheDocument();
    expect(screen.getByText("EDP")).toBeInTheDocument();
    expect(screen.getByText("Feminino")).toBeInTheDocument();
    expect(screen.getByText("Floral")).toBeInTheDocument();
    expect(screen.getByText("Aprovado")).toBeInTheDocument();

    expect(screen.getByText("Bergamota")).toBeInTheDocument();
    expect(screen.getByText("Baunilha")).toBeInTheDocument();
    expect(screen.getByText("Fragrância floral opulenta e sofisticada.")).toBeInTheDocument();
  });

  it("renderiza informações de estoque da loja quando storeProduct é fornecido", () => {
    const mockStoreProduct = {
      id: 5,
      product: {
        id: 1,
        name: "Jasmim Sambac",
        brand: "Maison Noire Parfums",
      },
      volume_ml: 10,
      price: "89.90",
      promotional_price: "69.90",
      stock_quantity: 15,
      is_available: true,
    };

    render(
      <ProductDetailsModal
        product={mockProduct}
        storeProduct={mockStoreProduct}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("10ml (Decant)")).toBeInTheDocument();
    expect(screen.getByText("15 unidades")).toBeInTheDocument();
    expect(screen.getByText("Ativo")).toBeInTheDocument();
  });

  it("chama onClose ao clicar no botão de fechar", () => {
    const onClose = vi.fn();
    render(<ProductDetailsModal product={mockProduct} onClose={onClose} />);

    fireEvent.click(screen.getByLabelText("Fechar detalhes"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
