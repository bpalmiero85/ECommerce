import { useContext } from "react";
import { CartContext } from "../contexts/CartContext";
import "../styles/ShoppingCart.css";

const ShoppingCart = ({ succeeded = false }) => {
  const { cartItems, setItemQty } = useContext(CartContext);

  const handleDecrement = (productId, qty) => {
    if (qty <= 0) return;
    setItemQty(productId, qty - 1);
    window.dispatchEvent(
      new CustomEvent("inventory:changed", { detail: [productId] }),
    );
  };

  const handleIncrement = (productId, qty, maxAvailable) => {
    const max = Number(maxAvailable);
    const hasLimit = Number.isFinite(max);
    const next = hasLimit ? Math.min(qty + 1, max) : qty + 1;
    setItemQty(productId, next);
  };

  return (
    <div className="shopping-cart-container">
      {cartItems.map((item) => {
        const qty = Number(item.qty ?? item.quantity ?? 1);
        const price = Number(item.price) || 0;

        const remaining = Number(item.available);
        const hasRemaining = Number.isFinite(remaining);

        const maxTotal = hasRemaining
          ? qty + remaining
          : Number.isFinite(Number(item.quantity))
            ? Number(item.quantity)
            : Infinity;

        const disableIncrease = qty >= maxTotal;

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
                    disabled={disableIncrease}
                    aria-label={`Increase ${item.name}`}
                    onClick={() => handleIncrement(item.id, qty, maxTotal)}
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
