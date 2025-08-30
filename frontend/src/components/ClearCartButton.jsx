import { useContext, useState } from "react";
import { CartContext } from "../contexts/CartContext";
import "../styles/styles.css";

export default function ClearCartButton() {
  const { cartItems, clearCartAndRelease } = useContext(CartContext);
  const [busy, setBusy] = useState(false);

  const handleClear = async () => {
    if (!cartItems.length) return;
    setBusy(true);
    await fetch(clearCartAndRelease());
    setBusy(false);
  };

  return(
    <button 
      className="clear-cart"
      onClick={handleClear}
      disabled={busy || cartItems.length === 0}
      title="Clear cart and release holds"
      >
        {busy ? "Clearing..." : "Clear cart"}
      </button>
  );
}