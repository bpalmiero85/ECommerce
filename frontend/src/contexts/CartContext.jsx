// src/contexts/CartContext.jsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";

const noop = () => {};
const defaultValue = {
  cartItems: [],
  addToCart: noop,
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

  // normalize field names; prefer `qty`, fall back to `quantity`
  const qtyNum = Number(raw.qty ?? raw.quantity ?? 1);
  const priceNum = Number(raw.price ?? 0);

  return {
    id,
    name: raw.name ?? "",
    price: Number.isFinite(priceNum) ? priceNum : 0,
    imageUrl: raw.imageUrl ?? "",
    qty: Number.isFinite(qtyNum) && qtyNum > 0 ? qtyNum : 1,
    available: Number(
      raw.available ??
        raw.inventory ??
        raw.quantityAvailable ??
        raw.quantity ??
        Number.POSITIVE_INFINITY,
    ),
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
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    function onStorage(e) {
      if (e.key !== "cart") return;
      try {
        const next = e.newValue ? JSON.parse(e.newValue) : [];
        // migrate to ensure shape is correct
        const normalized = Array.isArray(next)
          ? next.map(migrateItem).filter(Boolean)
          : [];
        setCartItems(normalized);
      } catch {
        // ignore parse errors
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(cartItems));
    } catch {
      // ignore storage errors
    }
  }, [cartItems]);

  async function releaseQty(id, qty) {
    const count = Math.max(0, Number(qty) || 0);
    for (let i = 0; i < count; i++) {
      try {
        await fetch(`http://localhost:8080/api/inventory/${id}/unreserve`, {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });
      } catch (e) {
        console.error("release failed", id, e);
      }
    }
  }

  async function clearCartAndRelease(reason = "manual") {
    const API = process.env.REACT_APP_BASE || "http://localhost:8080";
    const ids = cartItems.map((i) => i.id);

    const resp = await fetch(`${API}/api/cart/clear`, {
      method: "POST",
      credentials: "include",
    });
    if (!resp.ok) throw new Error(`clear failed ${resp.status}`);

    setCartItems([]);
    window.dispatchEvent(new CustomEvent("inventory:changed", { detail: ids }));
    try {
      localStorage.setItem(
        "inventory:broadcast",
        JSON.stringify({ ids, ts: Date.now() }),
      );
    } catch {}

    await refreshCart();
  }

  function clearCartAfterPayment() {
    try {
      sessionStorage.removeItem("pendingRelease");
    } catch {}
    setCartItems([]);
  }

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

  const setItemQty = async (id, nextQty, fallback = {}) => {
    const API = process.env.REACT_APP_BASE || "http://localhost:8080";

    const current = cartItems.find((p) => p.id === id)?.qty ?? 0;
    const target = Math.max(0, Number(nextQty) || 0);
    const delta = target - current;

    if (delta === 0) return;

    const url =
      delta > 0
        ? `${API}/api/cart/${id}/add?qty=${delta}`
        : `${API}/api/cart/${id}/remove?qty=${Math.abs(delta)}`;

    const resp = await fetch(url, { method: "POST", credentials: "include" });
    if (!resp.ok) throw new Error(`cart update failed ${resp.status}`);

    setCartItems((prev) => {
      const idx = prev.findIndex((p) => p.id === id);

      if (idx === -1 && target > 0) {
        const item = migrateItem({ id, qty: target, ...fallback });
        return item ? [...prev, item] : prev;
      }

      if (idx !== -1 && target <= 0) {
        const copy = [...prev];
        copy.splice(idx, 1);
        return copy;
      }

      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: target, ...fallback };
        return copy;
      }

      return prev;
    });

    await refreshCart();
  };

  const removeFromCart = (id) =>
    setCartItems((prev) => prev.filter((p) => p.id !== id));

  const clearCart = () => setCartItems([]);

  const IDLE_MS = 20 * 60 * 1000;
  const lastActivity = useRef(null);
  const idleTimer = useRef(null);

  async function refreshCart() {
    const API = process.env.REACT_APP_BASE || "http://localhost:8080";
    const resp = await fetch(`${API}/api/cart`, { credentials: "include" });
    const serverCart = resp.ok ? await resp.json() : {};
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

  useEffect(() => {
    const s = sessionStorage.getItem("pendingRelease");
    if (!s) return;
    sessionStorage.removeItem("pendingRelease");

    try {
      const payload = JSON.parse(s) || {};
      const list = Array.isArray(payload.list) ? payload.list : [];
      const ts = Number(payload.ts) || 0;
      const AGE_MS = Date.now() - ts;

      if (AGE_MS > 30_000 && list.length) {
        (async () => {
          for (const it of list) await releaseQty(it.id, it.qty);
        })();
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const s = sessionStorage.getItem("pendingRelease");
    if (s) {
      sessionStorage.removeItem("pendingRelease");
      try {
        const list = JSON.parse(s) || [];
        (async () => {
          for (const it of list) await releaseQty(it.id, it.qty);
        })();
      } catch {}
    }
  }, []);

  const value = useMemo(
    () => ({
      cartItems,
      addToCart,
      setItemQty,
      removeFromCart,
      clearCart,
      clearCartAndRelease,
      clearCartAfterPayment,
    }),
    [cartItems],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
