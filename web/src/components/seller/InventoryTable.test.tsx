import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { StoreProduct, StoreProductPayload } from "../../types/inventory";
import { InventoryTable } from "./InventoryTable";

function makeItem(overrides: Partial<StoreProduct> = {}): StoreProduct {
  return {
    id: 1,
    product: { id: 1, name: "Sauvage", brand: "Dior" },
    volume_ml: 100,
    price: "349.90",
    promotional_price: null,
    stock_quantity: 10,
    is_available: true,
    ...overrides,
  };
}

function renderTable(items: StoreProduct[]) {
  const onToggleAvailability = vi.fn();
  const onUpdate = vi.fn();
  const onDelete = vi.fn();

  const utils = render(
    <InventoryTable
      items={items}
      onDelete={onDelete}
      onToggleAvailability={onToggleAvailability}
      onUpdate={onUpdate}
    />,
  );

  return { onToggleAvailability, onUpdate, onDelete, ...utils };
}

describe("InventoryTable", () => {
  it("renderiza os perfumes com volume, preço formatado e estoque", () => {
    renderTable([
      makeItem(),
      makeItem({
        id: 2,
        product: { id: 2, name: "Baccarat Rouge", brand: "Maison" },
        volume_ml: 50,
        price: "789.00",
      }),
    ]);

    expect(screen.getByText("Sauvage")).toBeInTheDocument();
    expect(screen.getByText("Dior")).toBeInTheDocument();
    expect(screen.getByText("100ml")).toBeInTheDocument();
    expect(screen.getByText(/349,90/)).toBeInTheDocument();

    expect(screen.getAllByText("Baccarat Rouge").length).toBeGreaterThan(0);
    expect(screen.getByText("50ml")).toBeInTheDocument();
    expect(screen.getByText(/789,00/)).toBeInTheDocument();
    expect(
      screen.getByText("2 perfumes no estoque"),
    ).toBeInTheDocument();
  });

  it("exibe preço promocional com o preço original riscado", () => {
    renderTable([
      makeItem({ price: "349.90", promotional_price: "299.90" }),
    ]);

    expect(screen.getByText(/299,90/)).toBeInTheDocument();
  });

  it("destaca perfumes com estoque baixo (menos de 3 unidades)", () => {
    renderTable([
      makeItem({ id: 1, stock_quantity: 2 }),
      makeItem({ id: 2, product: { id: 2, name: "Oud Wood", brand: "Maison" }, stock_quantity: 5 }),
    ]);

    expect(
      screen.getByText("2 perfumes no estoque · 1 com estoque baixo"),
    ).toBeInTheDocument();
  });

  it("chama onToggleAvailability ao alternar o switch", () => {
    const { onToggleAvailability } = renderTable([makeItem()]);

    fireEvent.click(
      screen.getByRole("switch", { name: /perfume ativo/i }),
    );

    expect(onToggleAvailability).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 }),
    );
  });

  it("edita preço e estoque em lote e chama onUpdate ao salvar", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTable([makeItem()]);

    await user.click(screen.getByRole("button", { name: /editar sauvage/i }));

    const priceInput = screen.getByLabelText("Preço Sauvage");
    await user.clear(priceInput);
    await user.type(priceInput, "399.90");

    const stockInput = screen.getByLabelText("Estoque Sauvage");
    await user.clear(stockInput);
    await user.type(stockInput, "8");

    await user.click(screen.getByRole("button", { name: /salvar/i }));

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 }),
      expect.objectContaining<Partial<StoreProductPayload>>({
        price: "399.90",
        promotional_price: null,
        stock_quantity: 8,
      }),
    );
  });

  it("chama onDelete ao confirmar a remoção", () => {
    const { onDelete } = renderTable([makeItem()]);

    fireEvent.click(screen.getByRole("button", { name: /remover sauvage/i }));

    expect(onDelete).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 }),
    );
  });

  it("renderiza o estado vazio quando não há perfumes", () => {
    renderTable([]);

    expect(
      screen.getByText("Nenhum perfume no estoque ainda"),
    ).toBeInTheDocument();
  });
});