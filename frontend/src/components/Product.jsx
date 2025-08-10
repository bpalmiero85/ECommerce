import { useState, useRef, useEffect, useContext } from "react";
import { CartContext } from "../contexts/CartContext";
import CheckoutPage from "../pages/CheckoutPage";
import "../styles/AdminPage.css";
import "../styles/ProductPage.css";
import ShoppingCart from "./ShoppingCart";

const Product = ({
  id,
  name,
  price,
  quantity,
  description,
  pictureVersion,
  onReserved,
}) => {
  const { addToCart } = useContext(CartContext);
  const [subtotal, setSubtotal] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isLastItemShown, setIsLastItemShown] = useState(false);
  const cardRef = useRef(null);
  const [added, setAdded] = useState(false);

  const imageUrl = `http://localhost:8080/api/product/${id}/picture?version=${pictureVersion}`;

  const openPurchase = (e) => {
    e.preventDefault();
    setSubtotal(price);
    setIsOpen(true);
  };

  const showTempMessage = (text) => {
    setMessage(text);
    setIsLastItemShown(true);
  };

  const handleClickOutside = (e) => {
    if (cardRef.current && !cardRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  };

  const addPriceToCart = () => {
    setSubtotal((prev) => prev + price);
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <div className={`product-card ${quantity === 0 ? "sold-out" : ""}`}>
      {quantity === 0 && <div className="sold-out-badge">Sold Out</div>}
      <a className="product-anchor" href={`/product/${id}`}>
        <div className="product-design">
          <div className="gothic-rose-container">
            <div className="gothic-rose">
              <img className="product-image" src={imageUrl} alt={name}></img>
            </div>
          </div>
        </div>
        <div className="product-name-container">
          <h3 className="product-name">{name}</h3>
        </div>
        <div className="product-description-container">
          <p className="product-description">{description}</p>
        </div>
        <div className="product-price-container">
          <p className="product-price">${price}</p>
        </div>
        <div className="product-quantity-container">
          <p className="product-quantity">Available qty: {quantity}</p>
        </div>
      </a>

      <div className={`purchase-container${isOpen ? " hidden" : ""}`}>
        <div className="purchase-buttons">
          <button
            type="button"
            className={added ? "added-to-cart" : "add-to-cart"}
            disabled={isOpen || quantity === 0 || saving}
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (quantity === 0 || saving) return;
              setSaving(true);
              const res = await fetch(
                `http://localhost:8080/api/inventory/${id}/reserve`,
                {
                  method: "POST",
                }
              );

              if (quantity === 1) {
                showTempMessage("You got the last one!");
              }

              if (res.ok) {
                addToCart({ id, name, price, imageUrl });
                setAdded(true);
                onReserved?.(id);
                addPriceToCart();
              } else if (res.status === 409) {
                alert("Sorry, this item just sold out.");
              }

              setSaving(false);
            }}
          >
            {quantity === 0
              ? added
                ? "Item in your cart"
                : "Sold Out"
              : saving
              ? "Adding..."
              : added
              ? "Item in your cart"
              : "Add to cart"}
          </button>
          {added && (
            <div className="check-mark">
              <h3>✅</h3>
            </div>
          )}
          {isLastItemShown && (
            <div className="last-item-message">{message}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Product;
