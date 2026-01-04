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
  featured,
  newArrival,
  pictureVersion,
  onReserved,
  onOpenModal,
}) => {
  const { cartItems: rawItems, setItemQty } = useContext(CartContext);
  const cartItems = Array.isArray(rawItems) ? rawItems : [];
  const inCartQty = cartItems.reduce(
    (sum, item) => (item.id === id ? sum + (item.qty ?? 1) : sum),
    0
  );
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isLastItemShown, setIsLastItemShown] = useState(false);
  const cardRef = useRef(null);
  const [added, setAdded] = useState(false);
  const prevQtyRef = useRef(quantity);
  const [showCheck, setShowCheck] = useState(false);
  const prevInCartQtyRef = useRef(inCartQty);

  const imageUrl = `http://localhost:8080/api/product/${id}/picture?version=${pictureVersion}`;

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
        const take = Math.min(delta, quantity);

        for (let i = 0; i < take; i++) {
          const r = await fetch(
            `http://localhost:8080/api/cart/${id}/add?qty=1`,
            { method: "POST", credentials: "include" }
          );
          if (!r.ok) throw new Error(`reserve failed ${r.status}`);
        }
      } else {
        for (let i = 0; i < -delta; i++) {
          const r = await fetch(
            `http://localhost:8080/api/cart/${id}/remove?qty=1`,
            { method: "POST", credentials: "include" }
          );
          if (!r.ok) throw new Error(`unreserve failed ${r.status}`);
        }
        setIsLastItemShown(false);
        setMessage("");
        window.dispatchEvent(
          new CustomEvent("inventory:changed", { detail: [id] })
        );
      }

      // sync global cart and trigger stock refresh
      setItemQty(id, nextQty, { name, price, imageUrl, available: quantity });
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

  useEffect(() => {
    const prev = prevInCartQtyRef.current;

    if (prev === 0 && inCartQty === 1) {
      setShowCheck(true);
      const t = setTimeout(() => setShowCheck(false), 700);
      return () => clearTimeout(t);
    }

    prevInCartQtyRef.current = inCartQty;
  }, [inCartQty]);

  useEffect(() => {
    function onStorage(e) {
      if (e.storageArea !== localStorage) return;
      if (e.key !== "inventory:broadcast") return;

      let payload = null;
      try {
        payload = JSON.parse(e.newValue || "null");
      } catch {
        /* ignore */
      }

      const ids = Array.isArray(payload?.ids) ? payload.ids : [];
      // Coerce to strings to avoid number/string mismatches
      const hit = ids.map(String).includes(String(id));
      if (hit) onReserved?.(id);
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [id, onReserved]);

  useEffect(() => {
    function onInventoryChanged(e) {
      const ids = Array.isArray(e?.detail) ? e.detail : [];
      if (ids.includes(id)) {
        // ask parent to refresh this product's available qty
        onReserved?.(id);
      }
    }
    window.addEventListener("inventory:changed", onInventoryChanged);
    return () =>
      window.removeEventListener("inventory:changed", onInventoryChanged);
  }, [id, onReserved]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const prev = prevQtyRef.current;

    if (prev > 0 && quantity === 0) {
      showTempMessage(
        inCartQty === 1 ? "You got the last one!" : "You got the last ones!"
      );
    }

    if (prev === 0 && quantity > 0) {
      setIsLastItemShown(false);
      setMessage("");
    }

    prevQtyRef.current = quantity;
  }, [quantity, inCartQty]);

  useEffect(() => {
    setAdded(inCartQty > 0);
  }, [inCartQty]);

  return (
    <>
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
          href={quantity === 0 ? undefined : `/product/${name}`}
          aria-disabled={quantity === 0}
          onClick={(e) => {
            if (quantity === 0) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            e.preventDefault();
            e.stopPropagation();
            onOpenModal?.({
              id,
              name,
              description,
              price,
              quantity,
              pictureVersion,
              featured,
              newArrival,
              category,
            });
          }}
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
              {featured && <span className="badge-purple">Featured</span>}
              {newArrival && <span className="badge-purple">New Arrival!</span>}
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
              text={description}
              quantity={quantity}
              onMore={() =>
                onOpenModal?.({
                  id,
                  name,
                  description,
                  price,
                  quantity,
                  pictureVersion,
                  featured,
                  newArrival,
                  category,
                })
              }
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
                  quantity === 0 ? "sold-out-added-to-cart" : "add-to-cart"
                }
                disabled={isOpen || quantity === 0 || saving}
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (quantity === 0 || saving) return;
                  handleQtyChange(1);
                }}
              >
                {quantity === 0
                  ? added
                    ? `${inCartQty} in your cart`
                    : "Sold Out"
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
                <span classNAme="in-cart-wrap">
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

                  {added && quantity !== 0 && (
                    <div className="check-mark">
                      <h3>✅</h3>
                    </div>
                  )}
                </span>
              </div>
            )}

            {/** ADDED Animation */}
            <div
              className={`check-bubble ${showCheck ? "check-bubble-show" : ""}`}
            >
              ✅ Added
            </div>
            {/** End of added animation */}

            {isLastItemShown && (
              <div className="last-item-message">{message}</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Product;
