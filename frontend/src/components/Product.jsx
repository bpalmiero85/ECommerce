import { useState, useRef, useEffect, useContext } from "react";
import { CartContext } from "../contexts/CartContext";
import { API_BASE_URL } from "../config/api";
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
  const idStr = String(id);
  const inCartQty = cartItems.reduce(
    (sum, item) => (String(item.id) === idStr ? sum + (item.qty ?? 1) : sum),
    0,
  );
  const isActuallySoldOut = quantity === 0 && inCartQty === 0;
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isLastItemShown, setIsLastItemShown] = useState(false);
  const cardRef = useRef(null);
  const [added, setAdded] = useState(false);
  const depletionTakeRef = useRef(0);
  const [showCheck, setShowCheck] = useState(false);
  const prevInCartQtyForCheckRef = useRef(inCartQty);
  const hasPicture = Number(pictureVersion) > 0;
  const imageUrl = hasPicture
    ? `${API_BASE_URL}/api/product/${id}/picture?v=${pictureVersion}`
    : "";
    

  useEffect(() => {
    if (!isLastItemShown) return;

    if (quantity > 0 && inCartQty === 0) {
      setIsLastItemShown(false);
      setMessage("");
      depletionTakeRef.current = 0;
    }
  }, [quantity, inCartQty, isLastItemShown]);

  async function handleQtyChange(nextQty) {
    if (Number.isNaN(nextQty)) nextQty = 0;
    nextQty = Math.max(0, nextQty);

    const max = quantity + inCartQty;
    if (nextQty > max) nextQty = max;
    if (nextQty === inCartQty) return;

    setSaving(true);
    try {
      const delta = nextQty - inCartQty;

      if (delta < 0) {
        setIsLastItemShown(false);
        setMessage("");
      }

      if (delta > 0) {
        const remainingAfter = quantity - delta;

        if (remainingAfter === 0) {
          const taken = inCartQty + delta;

          showTempMessage(
            taken === 1
              ? "You got the last one!"
              : `You got the last ${taken}!`,
          );
        } else {
          setTimeout(() => {
            setIsLastItemShown(false);
            setMessage("");
          }, 5000);
        }
      }

      await setItemQty(id, delta, {
        name,
        price,
        imageUrl: `/api/product/${id}/picture`,
        available: quantity,
      });
      if (delta > 0) {
        const unitPrice = Number(price);
        const quantityAdded = delta;

        window.gtag?.("event", "add_to_cart", {
          currency: "USD",
          value: unitPrice * quantityAdded,
          items: [
            {
              item_id: String(id),
              item_name: name,
              item_category: category,
              item_brand: "Goth & Glitter",
              item_variant: featured
                ? "featured"
                : newArrival
                  ? "new-arrival"
                  : "standard",
              price: unitPrice,
              quantity: quantityAdded,
            },
          ],
        });
      }
      window.dispatchEvent(
        new CustomEvent("inventory:changed", { detail: [id] })
      );
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
    const prev = prevInCartQtyForCheckRef.current;

    if (prev === 0 && inCartQty === 1) {
      setShowCheck(true);
      const t = setTimeout(() => setShowCheck(false), 700);
      prevInCartQtyForCheckRef.current = inCartQty;
      return () => clearTimeout(t);
    }

    prevInCartQtyForCheckRef.current = inCartQty;
  }, [inCartQty]);

  useEffect(() => {
    function onInventoryChanged(e) {
      const ids = Array.isArray(e?.detail) ? e.detail : [];
      if (ids.map(String).includes(String(id))) {
      
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
    setAdded(inCartQty > 0);
  }, [inCartQty]);

  const stopProp = (e) => e.stopPropagation();
  const stopAll = (e) => e.stopPropagation();

  return (
    <>
      <div
        className={quantity === 0 ? "product-card-sold-out" : "product-card"}
      >
        {quantity === 0 && <div className="sold-out-badge">Sold Out</div>}
        <a
          className={`product-anchor ${isActuallySoldOut ? "is-disabled" : ""}`}
          tabIndex={isActuallySoldOut ? -1 : 0}
          href={`/product/${name}`}
          aria-disabled={isActuallySoldOut}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            if (isActuallySoldOut) {
              return;
            }

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
            isActuallySoldOut
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
              {featured && <span className="badge-purple">Featured!</span>}
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
        {quantity === 1 && inCartQty === 0 && (
          <div className="last-one">Last one! Get it before it's gone!</div>
        )}
        <div className={`purchase-container${isOpen ? " hidden" : ""}`}>
          <div className="purchase-buttons">
            {inCartQty === 0 ? (
              <button
                type="button"
                className={
                  isActuallySoldOut ? "sold-out-added-to-cart" : "add-to-cart"
                }
                onMouseDownCapture={stopProp}
                disabled={isOpen || isActuallySoldOut || saving}
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isActuallySoldOut || saving) return;
                  handleQtyChange(1);
                }}
              >
                {isActuallySoldOut
                  ? added
                    ? `${inCartQty} in your cart`
                    : "Sold Out"
                  : saving
                    ? "Adding..."
                    : "Add to cart"}
              </button>
            ) : (
              <div className="qty-inline" onMouseDownCapture={stopAll}>
                <span className="in-cart-wrap">
                  <button
                    type="button"
                    className="qty-btn"
                    aria-label="Decrease quantity"
                    onMouseDownCapture={stopAll}
                    disabled={inCartQty <= 0}
                    onClick={() => handleQtyChange(inCartQty - 1)}
                  >
                    −
                  </button>

                  <span className="qty-count">{inCartQty}</span>
                  <button
                    type="button"
                    className="qty-btn"
                    aria-label="Increase quantity"
                    onMouseDownCapture={stopAll}
                    disabled={quantity <= 0}
                    onClick={() => handleQtyChange(inCartQty + 1)}
                  >
                    +
                  </button>

                  <span className="qty-label">in your cart</span>

                  {added && !isActuallySoldOut && (
                    <span className="check-mark">✅</span>
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
