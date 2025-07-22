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
  pictureType,
}) => {
  const { addToCart } = useContext(CartContext);
  const [purchaseProductId, setPurchaseProductId] = useState(null);
  const [subtotal, setSubtotal] = useState(0);

  const [isOpen, setIsOpen] = useState(false);
  const cardRef = useRef(null);

  const imageUrl = `http://localhost:8080/api/product/${id}/picture`;

  const openPurchase = () => {
    setSubtotal(price);
    setPurchaseProductId(id);
    setIsOpen(true);
  };

  const handleClickOutside = (e) => {
    if (cardRef.current && !cardRef.current.contains(e.target)) {
      setIsOpen(false);
      setPurchaseProductId(null);
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
    <div className="logo-card">
      <a className="product-anchor" href={`/product/${id}`}>
        <div className="logo-design">
          <div className="gothic-rose-container">
            <div className="gothic-rose">
              <img
                className="product-image"
                src={`http://localhost:8080/api/product/${id}/picture`}
              ></img>
            </div>
            <div className="rose-glitter-effect">
              <div className="glitter-particle">✨</div>
              <div className="glitter-particle">✦</div>
              <div className="glitter-particle">✧</div>
              <div className="glitter-particle">✨</div>
            </div>
          </div>
        </div>
        <div className="logo-text">
          <h3>{name}</h3>
        </div>
        <div className="logo-description2">
          <p>{description}</p>
        </div>
        <div className="product-price">
          <p>${price}</p>
        </div>
        <div className="product-quantity">
          <p>Qty: {quantity}</p>
        </div>
        <p className="click">-- click --</p>
      </a>
      {!isOpen && (
        <div className="purchase-container">
          {purchaseProductId !== id && (
            <div className="purchase-buttons">
              <button
                type="button"
                className="purchase-button"
                onClick={openPurchase}
              >
                Purchase
              </button>
              <button
                type="button"
                onClick={() => {
                  addToCart({ id, name, price, imageUrl });
                  addPriceToCart();
                }}
              >
                Add to cart
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Product;
