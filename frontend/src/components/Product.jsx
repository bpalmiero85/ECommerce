import { useState, useRef, useEffect, useContext } from "react";
import { CartContext } from "../contexts/CartContext";
import CheckoutPage from "../pages/CheckoutPage";
import "../styles/AdminPage.css";
import "../styles/ProductPage.css";

const Product = ({
  id,
  name,
  price,
  quantity,
  description,
  pictureVersion,
}) => {
  const { addToCart } = useContext(CartContext);
  const [subtotal, setSubtotal] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const cardRef = useRef(null);
  const [added, setAdded] = useState(false);

  const imageUrl = `http://localhost:8080/api/product/${id}/picture?version=${pictureVersion}`;

  const openPurchase = (e) => {
    e.preventDefault();
    setSubtotal(price);
    setIsOpen(true);
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
    <div className="product-card">
      <a className="product-anchor" href={`/product/${id}`}>
        <div className="product-design">
          <div className="gothic-rose-container">
            <div className="gothic-rose">
              <img className="product-image" src={imageUrl} alt={name}></img>
            </div>
            <div className="rose-glitter-effect">
              <div className="glitter-particle">✨</div>
              <div className="glitter-particle">✦</div>
              <div className="glitter-particle">✧</div>
              <div className="glitter-particle">✨</div>
            </div>
          </div>
        </div>
        <div className="product-text">
          <h3>{name}</h3>
        </div>
        <div className="product-description2">
          <p>{description}</p>
        </div>
        <div className="product-price">
          <p>${price}</p>
        </div>
        <div className="product-quantity">
          <p>Qty: {quantity}</p>
        </div>
      </a>

      <div className={`purchse-container${isOpen ? " hidden" : ""}`}>
        <div className="purchase-buttons">
          <button
            type="button"
            className="purchase-button"
            onClick={openPurchase}
            disabled={isOpen}
          >
            Purchase
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCart({ id, name, price, imageUrl });
              addPriceToCart();
              setAdded(true);
            }}
          >
            {added ? "Added to cart" : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Product;
