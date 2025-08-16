// src/contexts/CartContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const noop = () => {};
const defaultValue = {
  cartItems: [],
  addToCart: noop,
  setItemQty: noop,
  removeFromCart: noop,
  clearCart: noop,
};

export const CartContext = createContext(defaultValue);

function migrateItem(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id;
  if (id == null) return null;

  // normalize field names; prefer `qty`, fall back to `quantity`
  const qty = Number(raw.qty ?? raw.quantity ?? 1);
  return {
    id,
    name: raw.name ?? "",
    price: Number(raw.price ?? 0),
    imageUrl: raw.imageUrl ?? "",
    qty: Number.isFinite(qty) && qty > 0 ? qty : 1,
  };
}

function loadInitial() {
  try {
    const s = localStorage.getItem("cart");
    if (!s) return [];
    const parsed = JSON.parse(s);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(migrateItem).filter(Boolean);
  } catch {
    // If JSON.parse throws, don’t crash the app
    return [];
  }
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => loadInitial());

  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(cartItems));
    } catch {
      // ignore storage errors
    }
  }, [cartItems]);

  const addToCart = (item) => {
    setCartItems((prev) => {
      const normalized = migrateItem({ ...item, qty: item.qty ?? 1 });
      if (!normalized) return prev;

      const idx = prev.findIndex((p) => p.id === normalized.id);
      if (idx === -1) return [...prev, normalized];
      const next = [...prev];
      next[idx] = { ...next[idx], qty: next[idx].qty + normalized.qty };
      return next;
    });
  };

  const setItemQty = (id, nextQty, fallback = {}) => {
    setCartItems((prev) => {
      const qty = Math.max(0, Number(nextQty) || 0);
      const idx = prev.findIndex((p) => p.id === id);

      if (idx === -1) {
        if (qty <= 0) return prev;
        // add new entry using fallback data
        const item = migrateItem({ id, qty, ...fallback });
        return item ? [...prev, item] : prev;
        }
      if (qty <= 0) {
        // remove item
        const copy = [...prev];
        copy.splice(idx, 1);
        return copy;
      }
      const copy = [...prev];
      copy[idx] = { ...copy[idx], qty };
      return copy;
    });
  };

  const removeFromCart = (id) =>
    setCartItems((prev) => prev.filter((p) => p.id !== id));

  const clearCart = () => setCartItems([]);

  const value = useMemo(
    () => ({ cartItems, addToCart, setItemQty, removeFromCart, clearCart }),
    [cartItems]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Optional helper to safely consume
export function useCart() {
  return useContext(CartContext);
}