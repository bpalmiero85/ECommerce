import { useState, useRef, useEffect, useContext } from "react";
import { CartContext } from "../contexts/CartContext";
import DescriptionMore from "../components/DescriptionMore.jsx";
import "../styles/AdminPage.css";
import "../styles/ProductPage.css";
import "../styles/DescriptionMore.css";

const Product = ({
  id,
  name,
  price,
  quantity,
  description,
  category,
  pictureVersion,
  onReserved,
}) => {
  const { addToCart, cartItems: rawItems, setItemQty } = useContext(CartContext);
  const cartItems = Array.isArray(rawItems) ? rawItems : [];
  const inCartQty = cartItems.reduce(
    (sum, item) => (item.id === id ? sum + (item.quantity ?? 1) : sum),
    0
  );
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
  async function handleQtyChange(nextQty) {
    if (Number.isNaN(nextQty)) nextQty = 0;
    nextQty = Math.max(0, nextQty);

    const max = quantity + inCartQty;
    if (nextQty > max) nextQty = max;

    if (nextQty === inCartQty) return;

    setSaving(true);
    try {
      const delta = nextQty - inCartQty;

      if (delta > 0) {
        for (let i = 0; i < delta; i++) {
          const r = await fetch(
            `http://localhost:8080/api/inventory/${id}/reserve`,
            { method: "POST" }
          );
          if (!r.ok) throw new Error(`reserve failed ${r.status}`);
        }
      } else {
        for (let i = 0; i < -delta; i++) {
          await fetch(`http://localhost:8080/api/inventory/${id}/release`, {
            method: "POST",
          });
        }
      }

      // sync global cart and trigger stock refresh
      setItemQty(id, nextQty, { name, price, imageUrl });
      onReserved?.(id);
    } catch (err) {
      console.error(err);
      alert("Could not update quantity. Please try again.");
    } finally {
      setSaving(false);
    }
 
  }

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
    <div
      className={
        quantity === 0
          ? "product-card-sold-out"
          : `product-card ${quantity === 0 ? "-sold-out" : ""}`
      }
    >
      {quantity === 0 && <div className="sold-out-badge">Sold Out</div>}
      <a
        className={`product-anchor ${quantity === 0 ? "is-disabled" : ""}`}
        tabIndex={quantity === 0 ? -1 : 0}
        href={quantity === 0 ? undefined : `/product/${id}`}
        aria-disabled={quantity === 0}
        onClick={
          quantity === 0
            ? (e) => {
                e.preventDefault();
                e.stopPropagation();
              }
            : undefined
        }
        onKeyDown={
          quantity === 0
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }
            : undefined
        }
      >
        <div className="product-design">
          <div className="animated-item-container">
            <div
              className={
                quantity === 0 ? "animated-item-sold-out" : "animated-item"
              }
            >
              <img className="product-image" src={imageUrl} alt={name}></img>
            </div>
          </div>
        </div>
        <div className="product-name-container">
          <h3 className={quantity === 0 ? "sold-out-name" : "product-name"}>
            {name}
          </h3>
        </div>

        <div className="modal-product-description-container">
          <DescriptionMore
            text={typeof description === "string" ? description : String(description ?? "")}
            quantity={Number.isFinite(quantity) ? quantity : 0}
          />
        </div>

        <div className="product-price-container">
          <p className={quantity === 0 ? "sold-out-price" : "product-price"}>
            ${price}
          </p>
        </div>
        <div className="product-quantity-container">
          <p
            className={
              quantity === 0 ? "sold-out-quantity" : "product-quantity"
            }
          >
            Available qty: {quantity}
          </p>
        </div>
      </a>

      <div className={`purchase-container${isOpen ? " hidden" : ""}`}>
        <div className="purchase-buttons">
          {inCartQty === 0 ? (
            <button
              type="button"
              className={
                added && quantity === 0
                  ? "sold-out-added-to-cart"
                  : added
                  ? "added-to-cart"
                  : "add-to-cart"
              }
              disabled={isOpen || quantity === 0 || saving}
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (quantity === 0 || saving) return;
                setSaving(true);
                try {
                  const res = await fetch(
                    `http://localhost:8080/api/inventory/${id}/reserve`,
                    { method: "POST" }
                  );
                  if (quantity === 1) showTempMessage("You got the last one!");
                  if (res.ok) {
                    // first one in cart
                    setItemQty(id, 1, { name, price, imageUrl });
                    setAdded(true);
                    onReserved?.(id);
                    addPriceToCart();
                  } else if (res.status === 409) {
                    alert("Sorry, this item just sold out.");
                  }
                } finally {
                  setSaving(false);
                }
              }}
            >
              {quantity === 0
                ? (added ? `${inCartQty} in your cart` : "Sold Out")
                : saving
                ? "Adding..."
                : "Add to cart"}
            </button>
          ) : (
            <div
              className="qty-inline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <button
                type="button"
                className="qty-btn"
                aria-label="Decrease quantity"
                disabled={saving || inCartQty <= 0}
                onClick={() => handleQtyChange(inCartQty - 1)}
              >
                −
              </button>

              <span className="qty-count">{inCartQty}</span>
              <button
                type="button"
                className="qty-btn"
                aria-label="Increase quantity"
                disabled={saving || quantity <= 0}
                onClick={() => handleQtyChange(inCartQty + 1)}
              >
                +
              </button>
              <span className="qty-label">in your cart</span>
            </div>
          )}

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
