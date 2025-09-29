import { useContext } from "react";
import { CartContext } from "../contexts/CartContext";
import "../styles/ShoppingCart.css";

const ShoppingCart = () => {
  const { cartItems } = useContext(CartContext);

  if (cartItems.length === 0) {
    return (
      <div className="shopping-cart-container">
        <p>Your cart is empty.</p>
      </div>
    );
  }

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