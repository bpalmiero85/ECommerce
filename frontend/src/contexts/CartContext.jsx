import { createContext, useContext, useEffect, useState, useRef } from "react";

import { API_BASE_URL } from "../config/api";

const noop = () => {};
const defaultValue = {
  cartItems: [],
  setItemQty: noop,
  removeFromCart: noop,
  clearCart: noop,
  clearCartAndRelease: noop,
  clearCartAfterPayment: noop,
};

export const CartContext = createContext(defaultValue);

function migrateItem(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id;
  if (id == null) return null;

  const qtySafe = Number(raw.qty ?? raw.quantity ?? 0);
  const qty = Number.isFinite(qtySafe) ? Math.max(0, qtySafe) : 0;
  if (qty <= 0) return null;
  const priceNum = Number(raw.price ?? 0);

  return {
    id,
    name: raw.name ?? "",
    price: Number.isFinite(priceNum) ? priceNum : 0,
    imageUrl: raw.imageUrl ?? "",
    qty,
    available: Number(
      raw.available ??
        raw.inventory ??
        raw.quantityAvailable ??
        raw.quantity ??
        Number.POSITIVE_INFINITY,
    ),
  };
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const cartItemsRef = useRef([]);
  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  useEffect(() => {
    if (cartItems.length === 0) return;

    let hadActivity = false;
    let timer = null;

    const mark = () => {
      hadActivity = true;
    };

    const ping = async () => {
      if (!hadActivity) return;
      hadActivity = false;

      try {
        await fetch(`${API_BASE_URL}/api/cart/touch`, {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });
      } catch {
        // ignore
      }
    };

    timer = setInterval(ping, 60_000);

    const events = ["mousemove", "keydown", "click", "scroll", "focus"];
    events.forEach((ev) =>
      window.addEventListener(ev, mark, { passive: true }),
    );

    mark();

    return () => {
      clearInterval(timer);
      events.forEach((ev) => window.removeEventListener(ev, mark));
    };
  }, [cartItems.length]);

  async function clearCartServerAndBroadcast(reason = "manual") {
    const ids = cartItemsRef.current.map((i) => i.id);

    const resp = await fetch(`${API_BASE_URL}/api/cart/clear`, {
      method: "POST",
      credentials: "include",
    });
    if (!resp.ok) throw new Error(`clear failed ${resp.status}`);

    setCartItems([]);

    if (ids.length) {
      window.dispatchEvent(
        new CustomEvent("inventory:changed", { detail: ids }),
      );
      try {
        localStorage.setItem(
          "inventory:broadcast",
          JSON.stringify({ ids, ts: Date.now(), reason }),
        );
      } catch (e) {}
    }
  }

  const clearCartAndRelease = (reason = "manual") =>
    clearCartServerAndBroadcast(reason);

  const clearCartAfterPayment = () => clearCartServerAndBroadcast("payment");

  const setItemQty = async (id, nextQty, fallback = {}) => {
    const current = cartItemsRef.current.find((p) => p.id === id)?.qty ?? 0;
    const target = Math.max(0, Number(nextQty) || 0);
    const delta = target - current;

    if (delta === 0) return;

    const url =
      delta > 0
        ? `${API_BASE_URL}/api/cart/${id}/add?qty=${delta}`
        : `${API_BASE_URL}/api/cart/${id}/remove?qty=${Math.abs(delta)}`;

    const resp = await fetch(url, { method: "POST", credentials: "include" });
    if (!resp.ok) throw new Error(`cart update failed ${resp.status}`);

    setCartItems((prev) => {
      const idx = prev.findIndex((p) => p.id === id);

      if (idx === -1 && target > 0) {
        const item = migrateItem({ id, ...fallback, qty: target });
        return item ? [...prev, item] : prev;
      }

      if (idx !== -1 && target <= 0) {
        const copy = [...prev];
        copy.splice(idx, 1);
        return copy;
      }

      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...fallback, qty: target };
        return copy;
      }

      return prev;
    });
  };

  const removeFromCart = (id) =>
    setCartItems((prev) => prev.filter((p) => p.id !== id));

  const clearCart = () => setCartItems([]);

  const IDLE_MS = 20 * 60 * 1000;
  const lastActivity = useRef(null);
  const idleTimer = useRef(null);

  async function refreshCart() {
    const resp = await fetch(`${API_BASE_URL}/api/cart`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!resp.ok) return;
    const serverCart = await resp.json();

    console.log("[refreshCart] server cart ->", serverCart);

    setCartItems((prev) => {
      const prevById = new Map(prev.map((p) => [String(p.id), p]));
      const next = Object.entries(serverCart || {})
        .map(([idStr, qty]) => {
          const prevItem = prevById.get(String(idStr));
          return migrateItem({
            id: Number(idStr),
            qty: Number(qty) || 0,
            name: prevItem?.name ?? "",
            price: prevItem?.price ?? 0,
            imageUrl: prevItem?.imageUrl ?? "",
            available: prevItem?.available ?? Number.POSITIVE_INFINITY,
          });
        })
        .filter(Boolean);

      console.log("[refreshCart] cartItems set to ->", next);
      return next;
    });
  }
  useEffect(() => {
    refreshCart();
  }, []);

  useEffect(() => {
    const bump = () => {
      lastActivity.current = Date.now();
      resetTimer();
    };
    const resetTimer = () => {
      clearTimeout(idleTimer.current);

      if (cartItems.length > 0) {
        idleTimer.current = setTimeout(() => {
          clearCartAndRelease("idle");
        }, IDLE_MS);
      }
    };

    resetTimer();

    const events = ["mousemove", "keydown", "click", "scroll", "focus"];
    events.forEach((ev) =>
      window.addEventListener(ev, bump, { passive: true }),
    );

    return () => {
      clearTimeout(idleTimer.current);
      events.forEach((ev) => window.removeEventListener(ev, bump));
    };
  }, [cartItems.length]);

  const value = {
    cartItems,
    setItemQty,
    removeFromCart,
    clearCart,
    clearCartAndRelease,
    clearCartAfterPayment,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
