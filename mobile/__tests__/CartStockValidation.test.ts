import { getCartStockState } from "../src/utils/cartStock";

describe("RF-17 cart stock validation", () => {
  it("blocks checkout state for an unavailable item", () => {
    expect(getCartStockState({ id: "1", quantity: 1 }, 0)).toEqual({
      unavailable: true,
      adjustedQuantity: null,
    });
  });

  it("limits a quantity above the available stock", () => {
    expect(getCartStockState({ id: "1", quantity: 5 }, 2)).toEqual({
      unavailable: false,
      adjustedQuantity: 2,
    });
  });
});
