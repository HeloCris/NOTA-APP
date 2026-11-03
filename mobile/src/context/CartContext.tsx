import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { saveToken, getToken } from '../utils/storage';

export interface CartItem {
  id: string; // unique cart item id: `${productId}-${volumeMl}-${storeId}`
  productId: number;
  productName: string;
  brandName: string;
  volume: string;
  volumeMl: number;
  price: number;
  quantity: number;
  imageUrl?: string;
  storeProductId?: number;
  storeId?: number;
  storeName?: string;
  storeIsOfficial?: boolean;
  storeCity?: string;
  storeState?: string;
}

interface CartContextData {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity' | 'id'> & { quantity?: number }) => void;
  updateQuantity: (id: string, delta: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalItemsCount: number;
  subtotal: number;
  shipping: number;
  total: number;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

// Ajustado para remover o caractere '@' e evitar erros com SecureStore no Expo
const CART_STORAGE_KEY = 'app_cart_items';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carrega carrinho do storage local
  useEffect(() => {
    (async () => {
      try {
        const stored = await getToken(CART_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setItems(parsed);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar carrinho do storage:', err);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  // Salva no storage quando houver alterações
  useEffect(() => {
    if (!isLoaded) return;
    saveToken(CART_STORAGE_KEY, JSON.stringify(items)).catch((err) => {
      console.error('Erro ao persistir carrinho:', err);
    });
  }, [items, isLoaded]);

  const addItem = useCallback(
    (item: Omit<CartItem, 'quantity' | 'id'> & { quantity?: number }) => {
      setItems((prev) => {
        const cartId = `${item.productId}-${item.volumeMl}-${item.storeId || 0}`;
        const existingIndex = prev.findIndex((i) => i.id === cartId);
        const addQty = item.quantity && item.quantity > 0 ? item.quantity : 1;

        if (existingIndex > -1) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + addQty,
            price: item.price,
          };
          return updated;
        }

        const newItem: CartItem = {
          ...item,
          id: cartId,
          quantity: addQty,
        };
        return [...prev, newItem];
      });
    },
    []
  );

  const updateQuantity = useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((item) => item.id === id
          ? (quantity > 0 ? { ...item, quantity } : null)
          : item)
        .filter(Boolean) as CartItem[],
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = items.length > 0 ? 15.0 : 0;
  const total = subtotal + shipping;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        setQuantity,
        removeItem,
        clearCart,
        totalItemsCount,
        subtotal,
        shipping,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
}