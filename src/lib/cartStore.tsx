"use client";
// Lightweight cart store with localStorage persistence.
// No extra deps — just React Context.
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { CartLine, priceCart, CartTotals } from "./pricing";

type CartContextValue = CartTotals & {
  hydrated: boolean;
  add: (line: CartLine) => void;
  remove: (sku: string) => void;
  setQty: (sku: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "gb_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(lines)); } catch {}
  }, [lines, hydrated]);

  const totals = useMemo(() => priceCart(lines), [lines]);

  const value: CartContextValue = {
    ...totals,
    hydrated,
    add: (line) => setLines(prev => {
      const idx = prev.findIndex(l => l.sku === line.sku);
      if (idx >= 0) {
        const next = [...prev]; next[idx] = { ...next[idx], qty: next[idx].qty + line.qty };
        return next;
      }
      return [...prev, line];
    }),
    remove: (sku) => setLines(prev => prev.filter(l => l.sku !== sku)),
    setQty: (sku, qty) => setLines(prev => qty <= 0
      ? prev.filter(l => l.sku !== sku)
      : prev.map(l => l.sku === sku ? { ...l, qty } : l)),
    clear: () => setLines([])
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    const empty = priceCart([]);
    return {
      ...empty,
      hydrated: false,
      add: () => {}, remove: () => {}, setQty: () => {}, clear: () => {}
    };
  }
  return ctx;
}
