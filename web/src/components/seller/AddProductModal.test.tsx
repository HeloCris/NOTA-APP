import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { inventoryService } from "../../services/inventoryService";
import type { Product } from "../../types/catalog";
import type { StoreProduct } from "../../types/inventory";
import { AddProductModal } from "./AddProductModal";

vi.mock("../../services/inventoryService", () => ({
  inventoryService: {
    createStoreProduct: vi.fn(),
  },
}));

vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const createStoreProduct = vi.mocked(inventoryService.createStoreProduct);
const successToast = vi.mocked(toast.success);
const errorToast = vi.mocked(toast.error);

const product: Product = {
  id: 1,
  name: "Sauvage",
  brand: { id: 1, name: "Dior" },
  olfactory_family: "Amadeirado",
  top_notes: ["Bergamota"],
  heart_notes: ["Lavanda"],
  base_notes: ["Ambroxan"],
  description: "Uma fragrância marcante.",
  image_url: "",
};

function renderModal(onCreated = vi.fn(), onClose = vi.fn()) {
  render(
    <AddProductModal
      initialProduct={product}
      onClose={onClose}
      onCreated={onCreated}
    />,
  );

  return { onCreated, onClose };
}

describe("AddProductModal", () => {
  beforeEach(() => {
    createStoreProduct.mockReset();
    successToast.mockReset();
    errorToast.mockReset();
  });

  it("renderiza o perfume selecionado e os campos do formulário", () => {
    renderModal();

    expect(screen.getByText("Sauvage")).toBeInTheDocument();
    expect(screen.getByLabelText("Volume (ml)")).toBeInTheDocument();
    expect(screen.getByLabelText("Quantidade")).toBeInTheDocument();
    expect(screen.getByLabelText("Preço")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Preço promocional (opcional)"),
    ).toBeInTheDocument();
  });

  it("cria o item de estoque ao preencher e submeter", async () => {
    const user = userEvent.setup();
    const { onCreated, onClose } = renderModal();

    createStoreProduct.mockResolvedValueOnce({
      id: 9,
      product: { id: 1, name: "Sauvage", brand: "Dior" },
      volume_ml: 100,
      price: "349.9",
      promotional_price: "299.9",
      stock_quantity: 10,
      is_available: true,
    } as StoreProduct);

    await user.type(screen.getByLabelText("Volume (ml)"), "100");
    await user.type(screen.getByLabelText("Quantidade"), "10");
    await user.type(screen.getByLabelText("Preço"), "349.90");
    await user.type(screen.getByLabelText("Preço promocional (opcional)"), "299.90");

    await user.click(screen.getByRole("button", { name: "Adicionar ao Estoque" }));

    expect(createStoreProduct).toHaveBeenCalledWith({
      product_id: 1,
      volume_ml: 100,
      price: "349.9",
      promotional_price: "299.9",
      stock_quantity: 10,
    });

    expect(successToast).toHaveBeenCalledWith(
      "Perfume adicionado ao seu estoque.",
    );
    expect(onCreated).toHaveBeenCalledWith(
      expect.objectContaining({ id: 9 }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("envia promotional_price nulo quando o campo está vazio", async () => {
    const user = userEvent.setup();
    renderModal();

    createStoreProduct.mockResolvedValueOnce({
      id: 9,
      product: { id: 1, name: "Sauvage", brand: "Dior" },
      volume_ml: 100,
      price: "349.9",
      promotional_price: null,
      stock_quantity: 5,
      is_available: true,
    } as StoreProduct);

    await user.type(screen.getByLabelText("Volume (ml)"), "100");
    await user.type(screen.getByLabelText("Quantidade"), "5");
    await user.type(screen.getByLabelText("Preço"), "349.90");

    await user.click(screen.getByRole("button", { name: "Adicionar ao Estoque" }));

    expect(createStoreProduct).toHaveBeenCalledWith({
      product_id: 1,
      volume_ml: 100,
      price: "349.9",
      promotional_price: null,
      stock_quantity: 5,
    });
  });

  it("valida preço obrigatório antes de chamar a API", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText("Volume (ml)"), "100");
    await user.type(screen.getByLabelText("Quantidade"), "3");

    await user.click(screen.getByRole("button", { name: "Adicionar ao Estoque" }));

    expect(await screen.findByText("Informe o preço.")).toBeInTheDocument();
    expect(createStoreProduct).not.toHaveBeenCalled();
  });

  it("avisa ao submeter o formulário sem selecionar um perfume", async () => {
    const user = userEvent.setup();
    render(<AddProductModal onClose={vi.fn()} onCreated={vi.fn()} />);

    await user.type(screen.getByLabelText("Volume (ml)"), "100");
    await user.type(screen.getByLabelText("Quantidade"), "3");
    await user.type(screen.getByLabelText("Preço"), "349.90");

    await user.click(screen.getByRole("button", { name: "Adicionar ao Estoque" }));

    expect(successToast).not.toHaveBeenCalled();
    expect(errorToast).toHaveBeenCalledWith(
      "Selecione um perfume do catálogo.",
    );
    expect(createStoreProduct).not.toHaveBeenCalled();
  });

  it("exibe a mensagem de erro da API quando a criação falha", async () => {
    const user = userEvent.setup();
    renderModal();

    createStoreProduct.mockRejectedValueOnce({
      response: {
        data: {
          detail: "Este produto já está no seu estoque.",
        },
      },
    });

    await user.type(screen.getByLabelText("Volume (ml)"), "100");
    await user.type(screen.getByLabelText("Quantidade"), "3");
    await user.type(screen.getByLabelText("Preço"), "349.90");

    await user.click(screen.getByRole("button", { name: "Adicionar ao Estoque" }));

    expect(errorToast).toHaveBeenCalledWith(
      "Este produto já está no seu estoque.",
    );
    expect(createStoreProduct).toHaveBeenCalledTimes(1);
  });
});