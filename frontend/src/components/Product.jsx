import { useState, useRef, useEffect } from "react";
import CheckoutPage from "../pages/CheckoutPage";
import "../styles/HomePage.css";
import "../styles/ProductPage.css";

const Product = (props) => {
  const [purchaseProductId, setPurchaseProductId] = useState(null);

  const [isOpen, setIsOpen] = useState(false);
  const cardRef = useRef(null);

  const openPurchase = () => {
    setPurchaseProductId(props.id);
    setIsOpen(true);
  };

  const handleClickOutside = (e) => {
    if (cardRef.current && !cardRef.current.contains(e.target)) {
      setIsOpen(false);
      setPurchaseProductId(null);
    }
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
      <a className="product-anchor" href={`/product/${props.id}`}>
        <div className="logo-design">
          <div className="gothic-rose-container">
            <div className="gothic-rose">
              <img
                className="product-image"
                src={`http://localhost:8080/api/product/${props.id}/picture`}
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
          <h3>{props.name}</h3>
        </div>
        <div className="logo-description2">
          <p>{props.description}</p>
        </div>
        <div className="product-price">
          <p>${props.price}</p>
        </div>
        <div className="product-quantity">
          <p>Qty: {props.quantity}</p>
        </div>
        <p className="click">-- click --</p>
      </a>
      {!isOpen && (
        <div className="purchase-container">
          {purchaseProductId !== props.id && (
            <div className="purchase-buttons">
              <button
                type="button"
                className="purchase-button"
                onClick={openPurchase}
              >
                Purchase
              </button>
              <button type="button">Add to cart</button>
            </div>
          )}
        </div>
      )}

      {isOpen && purchaseProductId === props.id && (
        <div className="credit-card-window" ref={cardRef}>
          <CheckoutPage productId={props.id} />
          <button className="cancel-button" onClick={() => {
          setIsOpen(false);
          setPurchaseProductId(null);
          }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default Product;
