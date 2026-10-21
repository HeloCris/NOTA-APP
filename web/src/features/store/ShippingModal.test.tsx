import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { StoreOrder } from "../../services/storeOrderService";
import { ShippingModal } from "./ShippingModal";

const order = {
  id: 105,
  status: "PROCESSING",
  carrier: null,
} as StoreOrder;

describe("ShippingModal", () => {
  it("abre com os dados do pedido e cancela", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <ShippingModal order={order} onCancel={onCancel} onSubmit={vi.fn()} />,
    );

    expect(screen.getByRole("heading", { name: "Despachar Pedido #105" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("impede o envio com código vazio", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <ShippingModal order={order} onCancel={vi.fn()} onSubmit={onSubmit} />,
    );

    await user.type(screen.getByLabelText("Transportadora"), "Correios");
    await user.click(screen.getByRole("button", { name: "Confirmar Envio" }));

    expect(screen.getByRole("alert")).toHaveTextContent("pelo menos 6");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("envia transportadora e código válidos", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <ShippingModal order={order} onCancel={vi.fn()} onSubmit={onSubmit} />,
    );

    await user.type(screen.getByLabelText("Transportadora"), "Correios");
    await user.type(screen.getByLabelText("Código de rastreio"), "BR123456");
    await user.click(screen.getByRole("button", { name: "Confirmar Envio" }));

    expect(onSubmit).toHaveBeenCalledWith("Correios", "BR123456");
  });
});