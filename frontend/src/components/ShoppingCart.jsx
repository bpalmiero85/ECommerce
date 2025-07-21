import { useContext } from "react";
import { CartContext } from "../contexts/CartContext";
import "../styles/ShoppingCart.css";

const ShoppingCart = () => {
  const { cartItems } = useContext(CartContext);

  return (
    <div className="shopping-cart-container">
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        cartItems.map((item, i) => (
          <div key={i} className="cart-item">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="cart-item-image"
            ></img>
            <div className="cart-item-details">
              <span className="cart-item-name">{item.name}</span>
              <span className="cart-item-price">${item.price.toFixed(2)}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
export default ShoppingCart;
