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
    setItemQty(productId, qty - 1);
    window.dispatchEvent(
      new CustomEvent("inventory:changed", { detail: [productId] })
    );
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
    if (typeof data !== "number" || data <= 0) return;
    setItemQty(productId, qty + 1);
  };

  return (
    <div className="shopping-cart-container">
      {cartItems.map((item) => {
        const qty = Number(item.qty ?? item.quantity ?? 1);
        const price = Number(item.price) || 0;

        return (
          <div key={item.id} className="cart-item">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="cart-item-image"
            />

            <div className="cart-item-details">
              <span className="cart-item-name">{item.name}</span>

              <div className="cart-line">
                <div className="cart-qty-controls">
                  <button
                    type="button"
                    className="cart-qty-btn"
                    disabled={qty <= 0}
                    aria-label={`Decrease ${item.name}`}
                    onClick={() => handleDecrement(item.id, qty)}
                  >
                    −
                  </button>

                  <span className="cart-qty-count">{qty}</span>

                  <button
                    type="button"
                    className="cart-qty-btn"
                    disabled={
                      typeof item.quantity === "number" && qty >= item.quantity
                    }
                    aria-label={`Increase ${item.name}`}
                    onClick={() => handleIncrement(item.id, qty)}
                  >
                     + 
                  </button>
                </div>

                <span className="cart-item-qty-price">
                  × ${price.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ShoppingCart;
