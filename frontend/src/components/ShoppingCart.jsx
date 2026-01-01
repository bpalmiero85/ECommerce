import { useContext } from "react";
import { CartContext } from "../contexts/CartContext";
import "../styles/ShoppingCart.css";

const ShoppingCart = ({ succeeded = false }) => {
  const { cartItems, setItemQty } = useContext(CartContext);

  const handleDecrement = async (productId, qty) => {
    const response = await fetch(
      `http://localhost:8080/api/cart/${productId}/remove?qty=1`,
      { method: "POST", credentials: "include" }
    );
    if (!response.ok) {
      throw new Error("Something went wrong. Please try again.");
    }
    const data = await response.json();

    if (typeof data !== "number") {
      console.error("Unexpected response from /remove: ", data);
    }
    console.log("Decrement Qty data: " + JSON.stringify(data));
    setItemQty(productId, qty - 1);
    console.log("New quantity: " + Number(qty - 1));
    window.dispatchEvent(
      new CustomEvent("inventory:changed", { detail: [productId] })
    );
    try {
      localStorage.setItem(
        "inventory:broadcast",
        JSON.stringify({ ids: [productId], ts: Date.now() })
      );
    } catch {}
  };

  const handleIncrement = async (productId, qty) => {
    const response = await fetch(
      `http://localhost:8080/api/cart/${productId}/add?qty=1`,
      { method: "POST", credentials: "include" }
    );
    if (!response.ok) {
      throw new Error("Something went wrong. Please try again.");
    }
    const data = await response.json();
    if (typeof data !== "number") {
      console.error("Unexpected response from /add: ", data);
      return;
    }
    if (data <= 0) {
      alert("No more available");
      return;
    }
    console.log("Increment Qty data: " + JSON.stringify(data));
    setItemQty(productId, qty + 1);
    console.log("New quantity: " + Number(qty + 1));
  };


  return (
    <div className="shopping-cart-container">
      {cartItems.map((item) => {
        const qty = Number(item.qty ?? item.quantity ?? 1);
        const price = Number(item.price) || 0;
        console.log("CART ITEM RAW:", item);
        return (
          <div key={item.id} className="cart-item">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="cart-item-image"
            />
            <div className="cart-item-details">
              <span className="cart-item-name">{item.name}</span>
              {(() => {
                const qty = Number(item.qty ?? item.quantity ?? 1);
                return (
                  <div className="cart-qty-controls">
                    <button
                      type="button"
                      className="qty-btn"
                      disabled={qty <= 0}
                      aria-label={`Decrease ${item.name}`}
                      onClick={() => handleDecrement(item.id, qty)}
                    >
                      -
                    </button>
                    <span className="qty-count">{qty}</span>

                    <button
                      type="button"
                      className="qty-btn"
                      disabled={
                        typeof item.quantity === "number" &&
                        qty >= item.quantity
                      }
                      aria-label={`Increase ${item.name}`}
                      onClick={() => handleIncrement(item.id, qty)}
                    >
                      +
                    </button>
                  </div>
                );
              })()}

              <span className="cart-item-qty-price">
                {qty} × ${price.toFixed(2)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ShoppingCart;
