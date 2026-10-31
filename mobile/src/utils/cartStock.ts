export interface CartStockItem {
  id: string;
  quantity: number;
}

export interface CartStockState {
  unavailable: boolean;
  adjustedQuantity: number | null;
}

export function getCartStockState(
  item: CartStockItem,
  available: number | undefined,
): CartStockState {
  if (available === 0) {
    return { unavailable: true, adjustedQuantity: null };
  }
  if (available !== undefined && item.quantity > available) {
    return { unavailable: false, adjustedQuantity: available };
  }
  return { unavailable: false, adjustedQuantity: null };
}
