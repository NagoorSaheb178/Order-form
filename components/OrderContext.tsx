"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import type { MenuItem } from "@/lib/menu";

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

interface OrderContextType {
  phone: string;
  setPhone: (phone: string) => void;
  cart: CartItem[];
  addItem: (item: MenuItem) => void;
  updateQuantity: (itemId: string, qty: number) => void;
  clearCart: () => void;
  totalAmount: number;
}

const OrderContext = createContext<OrderContextType | null>(null);

export const useOrder = () => {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrder must be used within OrderProvider");
  return ctx;
};

export function OrderProvider({ children }: { children: ReactNode }) {
  const [phone, setPhone] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  const addItem = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((c) => c.item.id != itemId);
      return prev.map((c) =>
        c.item.id === itemId ? { ...c, quantity: qty } : c
      );
    });
  };

  const clearCart = () => setCart([]);

  const totalAmount = cart.reduce(
    (sum, c) => sum + c.item.price * c.quantity,
    0
  );

  return (
    <OrderContext.Provider
      value={{ phone, setPhone, cart, addItem, updateQuantity, clearCart, totalAmount }}
    >
      {children}
    </OrderContext.Provider>
  );
}
