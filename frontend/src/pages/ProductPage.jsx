import { useState, useEffect, useRef, useContext, useCallback } from "react";
import { CartContext } from "../contexts/CartContext";
import "../styles/AdminPage.css";
import "../styles/ProductPage.css";
import Product from "../components/Product";
import ShoppingCart from "../components/ShoppingCart";
import CheckoutPage from "./CheckoutPage";

const toSlug = (name) => {
  if (!name) return "";
  let slug = name.toLowerCase().trim();
  slug = slug.replace(/&/g, " ");
  slug = slug.replace(/\s+/g, "-");
  slug = slug.replace(/-+/g, "-");

  return slug;
};

const ProductPage = ({ products: externalProducts = [] }) => {
  const [checkoutSucceeded, setCheckoutSucceeded] = useState(false);
  const [products, setProducts] = useState([]);
  const [availableById, setAvailableById] = useState({});
  const [isCartShown, setIsCartShown] = useState(false);
  const { cartItems: rawCart, setItemQty } = useContext(CartContext);
  const [modalSaving, setModalSaving] = useState(false);
  const cartItems = Array.isArray(rawCart) ? rawCart : [];
  const checkoutRef = useRef();
  const [activeCategories, setActiveCategories] = useState([]);
  const totalItems = cartItems.reduce((sum, i) => sum + (i?.qty ?? 1), 0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const subtotal = cartItems.reduce(
    (sum, i) =>
      sum + (Number(i.price) || 0) * (Number(i.qty ?? i.quantity ?? 1) || 0),
    0
  );

  const modalInCartQty = selectedProduct
    ? cartItems.reduce(
        (sum, item) =>
          item.id === selectedProduct.id ? sum + (item.qty ?? 1) : sum,
        0
      )
    : 0;

  const modalAvailableQty = selectedProduct
    ? availableById[selectedProduct.id] ?? selectedProduct.quantity
    : 0;
  const modalImageUrl = selectedProduct
    ? `http://localhost:8080/api/product/${selectedProduct.id}/picture?version=${selectedProduct.pictureVersion}`
    : "";

  async function handleModalQtyChange(nextQty) {
    if (!selectedProduct) return;

    if (Number.isNaN(nextQty)) nextQty = 0;
    nextQty = Math.max(0, nextQty);

    const max = modalAvailableQty + modalInCartQty;
    if (nextQty > max) nextQty = max; // ✅ you were missing this

    if (nextQty === modalInCartQty) return;

    setModalSaving(true);
    try {
      const delta = nextQty - modalInCartQty;

      if (delta > 0) {
        const take = Math.min(delta, modalAvailableQty);
        for (let i = 0; i < take; i++) {
          const r = await fetch(
            `http://localhost:8080/api/cart/${selectedProduct.id}/add?qty=1`,
            { method: "POST", credentials: "include" }
          );
          if (!r.ok) throw new Error(`reserve failed ${r.status}`);
        }
      } else {
        for (let i = 0; i < -delta; i++) {
          const r = await fetch(
            `http://localhost:8080/api/cart/${selectedProduct.id}/remove?qty=1`,
            { method: "POST", credentials: "include" }
          );
          if (!r.ok) throw new Error(`unreserve failed ${r.status}`);
        }

        window.dispatchEvent(
          new CustomEvent("inventory:changed", { detail: [selectedProduct.id] })
        );
      }

      setItemQty(selectedProduct.id, nextQty, {
        name: selectedProduct.name,
        price: selectedProduct.price,
        imageUrl: modalImageUrl,
        available: modalAvailableQty,
      });

      if (delta > 0) {
        const newAvail = await fetchAvailable(selectedProduct.id);
        if (newAvail === 0) {
          closeProductModal();
        }
      } else {
        await fetchAvailable(selectedProduct.id);
      }

      fetchAvailable(selectedProduct.id);
    } catch (err) {
      console.error(err);
      alert("Could not update quantity. Please try again.");
    } finally {
      setModalSaving(false);
    }
  }

  const openProductModal = useCallback((p) => {
    setSelectedProduct(p);
    setIsProductModalOpen(true);
  }, []);

  const closeProductModal = useCallback((p) => {
    setIsProductModalOpen(false);
    setSelectedProduct(null);
  }, []);

  async function fetchAvailable(id) {
    const API = process.env.REACT_APP_BASE || "http://localhost:8080";
    const resp = await fetch(
      `${API}/api/inventory/${id}/available?_=${Date.now()}`,
      { cache: "no-store", credentials: "include" }
    );
    if (!resp.ok) return;
    const qty = await resp.json();
    setAvailableById((prev) => ({ ...prev, [id]: qty }));
    return qty;
  }

  useEffect(() => {
    const API = process.env.REACT_APP_BASE || "http://localhost:8080";
    const load = async () => {
      try {
        const response = await fetch(`${API}/api/products`);
        if (!response.ok) {
          throw new Error("error fetching products");
        }
        const product = await response.json();
        const hasNew = product.some((p) => p?.newArrival === true);
        const categoriesSet = new Set(
          product.map((p) => String(p.category).trim()).filter(Boolean)
        );
        const categoriesArray = [...categoriesSet];
        const sorted = categoriesArray.sort((a, b) =>
          a.localeCompare(b, undefined, { sensitivity: "base" })
        );

        // put "New Arrivals" at the front only if any exist
        const finalCategories = hasNew ? ["New Arrivals", ...sorted] : sorted;
        setActiveCategories(finalCategories);
        console.log("Present categories:", finalCategories);
      } catch (e) {
        console.error("failed to load products: ", e);
      }
    };
    load();

    const onProductsChanged = (e) => {
      console.log("Detected products:changed event", e.detail);
      load();
    };
    window.addEventListener("products:changed", onProductsChanged);

    return () => {
      window.removeEventListener("products:changed", onProductsChanged);
    };
  }, []);

  useEffect(() => {
    function onInventoryChanged(e) {
      const ids = Array.isArray(e?.detail) ? e.detail : [];
      if (!ids.length) return;
      ids.forEach((id) => {
        fetchAvailable(id);
      });
    }
    window.addEventListener("inventory:changed", onInventoryChanged);
    return () =>
      window.removeEventListener("inventory:changed", onInventoryChanged);
  }, []);

  useEffect(() => {
    const list = Array.isArray(externalProducts) ? externalProducts : [];
    setProducts(list);
    list.forEach((p) => fetchAvailable(p.id));
  }, [externalProducts]);

  const handleClickCart = () => {
    setIsCartShown((open) => !open);
  };

  const handleCancelCart = useCallback(() => {
    setCheckoutSucceeded(false);
    setIsCartShown(false);
  }, [setCheckoutSucceeded, setIsCartShown]);

  useEffect(() => {
    if (!products.length) return;
  }, [products]);

  useEffect(() => {
    if (products.length > 0) {
      addLogoEffects();
    }
    return () => {};
  }, [products]);

  useEffect(() => {
    if (!isCartShown) {
      return;
    }
    function onPointerDown(e) {
      const cartBox = checkoutRef.current;
      if (!cartBox) {
        return;
      }
      if (!cartBox.contains(e.target)) {
        handleCancelCart();
      }
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [isCartShown, handleCancelCart]);

  const addLogoEffects = () => {
    document.querySelectorAll(".product-design").forEach((logo) => {
      if (!logo.dataset.effectAdded) {
        logo.addEventListener("click", function () {
          const qty = Number(
            this.closest(".product-item-container")?.dataset.qty || "0"
          );
          if (qty <= 0) return;
          this.style.transform = "scale(0.95)";
          setTimeout(() => {
            this.style.transform = "";
          }, 150);
        });
        logo.dataset.effectAdded = "true";
      }
    });

    document.querySelectorAll(".product-card").forEach((card) => {
      if (!card.dataset.effectAdded) {
        card.addEventListener("mouseenter", function () {
          const qty = Number(
            this.closest(".product-item-container")?.dataset.qty || "0"
          );
          if (qty <= 0) return;
          const sparkles = ["✨", "⭐", "✦", "✧"];
          const SPARKLE_COUNT = 20;
          for (let i = 0; i < SPARKLE_COUNT; i++) {
            setTimeout(() => {
              const sparkle = document.createElement("div");
              sparkle.innerHTML =
                sparkles[Math.floor(Math.random() * sparkles.length)];
              Object.assign(sparkle.style, {
                position: "absolute",
                left: Math.random() * 100 + "%",
                top: Math.random() * 100 + "%",
                pointerEvents: "none",
                animation: "sparkle 1s ease-out forwards",
              });
              this.appendChild(sparkle);
              setTimeout(() => sparkle.remove(), 1000);
            }, i * 100);
          }
        });
        card.dataset.effectAdded = "true";
      }
    });
  };

  return (
    <div className="product-page-container" ref={checkoutRef}>
      {isCartShown && (
        <div className="cart-modal">
          <ShoppingCart succeeded={checkoutSucceeded} />
          <div className="checkout-page">
            <div>
              <button onClick={handleCancelCart} className="cancel-cart-x">
                <strong>X</strong>
              </button>
            </div>
            <CheckoutPage onSuccess={() => setCheckoutSucceeded(true)} />
            <div className="cart-modal-cancel-button">
              <button type="button" onClick={handleCancelCart}>
                {checkoutSucceeded ? "Close" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="banner-nav-container">
        <svg
          className="banner"
          viewBox="0 0 2000 200"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* original background */}
            <radialGradient id="bg-radial" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="#39FF14" />
              <stop offset="50%" stopColor="#1a001a" />
              <stop offset="100%" stopColor="#000000" />
            </radialGradient>

            {/* original text fill */}
            <linearGradient
              id="text-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#222222" />
              <stop offset="50%" stopColor="#5f0aa6" />
              <stop offset="100%" stopColor="#222222" />
            </linearGradient>

            {/* glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="8" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* the animated white band */}
            <linearGradient
              id="shine-grad"
              gradientUnits="userSpaceOnUse"
              x1="-150%"
              y1="0%"
              x2="0%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#39FF14" stopOpacity="0" />
              <stop offset="30%" stopColor="#39FF14" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#39FF14" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#39FF14" stopOpacity="0" />

              <animate
                attributeName="x1"
                values="-150%;200%"
                dur="4s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="x2"
                values="0%;350%"
                dur="4s"
                repeatCount="indefinite"
              />
            </linearGradient>

            {/* mask to reveal just that band */}
            <mask
              id="shine-mask"
              maskUnits="userSpaceOnUse"
              maskContentUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="2000"
              height="500"
            >
              <rect width="2000" height="500" fill="black" />
              <rect width="2000" height="500" fill="url(#shine-grad)" />
            </mask>
          </defs>

          {/* background */}
          <rect width="100%" height="100%" fill="url(#bg-radial)" />

          {/* text + glow */}
          <g
            fontFamily="Creepster, Griffy, cursive"
            textAnchor="middle"
            dominantBaseline="middle"
            filter="url(#glow)"
          >
            {/* base gradient text */}
            <text
              x="50%"
              y="50%"
              fill="url(#text-gradient)"
              className="main-title"
            >
              Goth &amp; Glitter
            </text>

            {/* white overlay text, masked so only the shine band shows */}
            <text
              x="50%"
              y="50%"
              fill="#FF007F"
              mask="url(#shine-mask)"
              className="main-title"
            >
              Goth &amp; Glitter
            </text>

            {/* existing rocking animation */}
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="-3 1000 250; 3 1000 250; -3 1000 250"
              dur="5s"
              repeatCount="indefinite"
            />
            {/* original sparkles */}
          </g>
          <text x="150" y="105" fill="#E1BEE7" className="banner-star">
            <animate
              attributeName="x"
              from="-50"
              to="435"
              dur="15.5s"
              begin="0s; shotting.restart+3s"
              id="shooting"
              repeatCount="indefinite"
            />
            ⭐
          </text>

          <text x="1600" y="155" fill="#E1BEE7" className="shooting-star">
            <animate
              attributeName="opacity"
              values="0.2;0.8;0.2"
              keyTimes="0;0.5;1"
              dur="3.2s"
              begin="1s"
              repeatCount="indefinite"
            />
            ⭐
          </text>

          <text x="50" y="80" fill="#39FF14" filter="url(#glow)">
            ★
            <animate
              attributeName="opacity"
              values="0.2;0.5;0.2"
              keyTimes="0;0.5;1"
              dur="5.2s"
              begin="2s"
              repeatCount="indefinite"
            ></animate>
          </text>

          {/* Neon Blue ★ */}
          <text
            x="1910"
            y="70"
            fill="#00FFFF"
            filter="url(#glow)"
            opacity="0.6"
          >
            ★
            <animate
              attributeName="opacity"
              values="0.2;0.5;0.2"
              keyTimes="0;0.5;1"
              dur="7.2s"
              begin="1s"
              repeatCount="indefinite"
            ></animate>
          </text>
          <text
            x="1860"
            y="120"
            fill="#D000FF"
            filter="url(#glow)"
            opacity="0.6"
          >
            ★
            <animate
              attributeName="opacity"
              values="0.2;0.5;0.2"
              keyTimes="0;0.5;1"
              dur="5.2s"
              begin="1s"
              repeatCount="indefinite"
            ></animate>
          </text>

          {/* Neon Purple ★ */}
          <text x="350" y="60" fill="#D000FF" filter="url(#glow)">
            ★
            <animate
              attributeName="opacity"
              values="0.2;0.4;0.2"
              keyTimes="0;0.5;1"
              dur="2.2s"
              begin="1.7s"
              repeatCount="indefinite"
            ></animate>
          </text>

          {/* Neon Orange ★ */}
          <text x="230" y="115" fill="#FF7F00" filter="url(#glow)">
            ★
            <animate
              attributeName="opacity"
              values="0.2;0.5;0.2"
              keyTimes="0;0.5;1"
              dur="4.2s"
              begin="1.7s"
              repeatCount="indefinite"
            ></animate>
          </text>

          <text x="1710" y="75" fill="#FF7F00" filter="url(#glow)">
            ★
            <animate
              attributeName="opacity"
              values="0.2;0.5;0.2"
              keyTimes="0;0.5;1"
              dur="4.2s"
              begin="1.7s"
              repeatCount="indefinite"
            ></animate>
          </text>

          <text x="450" y="110" fill="#E1BEE7">
            <animate
              attributeName="x"
              from="450"
              to="485"
              dur="4.5s"
              begin="0s; shooting.restart+3s"
              id="shooting"
              repeatCount="indefinite"
            />
            ✨
          </text>

          <text x="1500" y="110" fill="#E1BEE7">
            <animate
              attributeName="x"
              from="1500"
              to="1585"
              dur="4.5s"
              begin="0s; shooting.restart+3s"
              id="shooting"
              repeatCount="indefinite"
            />
            ✨
          </text>

          <circle cx="300" cy="100" r="5" fill="#00FF00" filter="url(#glow)">
            <animate
              attributeName="opacity"
              values="0.2;0.5;0.2"
              keyTimes="0;0.5;1"
              dur="4.2s"
              begin="0s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="1600" cy="145" r="7" fill="#1E90FF" filter="url(#glow)">
            <animate
              attributeName="opacity"
              values="0.2;0.6;0.2"
              keyTimes="0;0.5;1"
              dur="5.2s"
              begin="1s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="1715" cy="120" r="6" fill="#FFD700" filter="url(#glow)">
            <animate
              attributeName="opacity"
              values="0.2;0.5;0.2"
              keyTimes="0;0.5;1"
              dur="3.2s"
              begin="0.8s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="800" cy="150" r="4" fill="#4A148C" filter="url(#glow)">
            <animate
              attributeName="opacity"
              values="0.2;0.6;0.2"
              keyTimes="0;0.5;1"
              dur="4.2s"
              begin="0.6s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="1800" cy="60" r="5" fill="#E1BEE7" filter="url(#glow)">
            <animate
              attributeName="opacity"
              values="0.2;0.5;0.2"
              keyTimes="0;0.5;1"
              dur="3.6s"
              begin="0s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="150" cy=" 50" r="3" fill="#E1BEE7" filter="url(#glow)">
            <animate
              attributeName="opacity"
              values="0.2;0.6;0.2"
              keyTimes="0;0.5;1"
              dur="4.2s"
              begin="1s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="70" cy="160" r="4" fill="#FFD700" filter="url(#glow)">
            <animate
              attributeName="opacity"
              values="0.2;0.5;0.2"
              keyTimes="0;0.5;1"
              dur="5.2s"
              begin="0.4s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="200" cy=" 120" r="6" fill="#39FF14" filter="url(#glow)">
            <animate
              attributeName="opacity"
              values="0.2;0.6;0.2"
              keyTimes="0;0.5;1"
              dur="4.2s"
              begin="1s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="140" cy="120" r="2" fill="#FF007F" filter="url(#glow)">
            <animate
              attributeName="opacity"
              values="0.2;0.5;0.2"
              keyTimes="0;0.5;1"
              dur="3.2s"
              begin="1s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="1790" cy="160" r="5" fill="#00FF00" filter="url(#glow)">
            <animate
              attributeName="opacity"
              values="0.2;0.5;0.2"
              keyTimes="0;0.5;1"
              dur="4.2s"
              begin="0s"
              repeatCount="indefinite"
            />
          </circle>

          <circle cx="1770" cy="105" r="5" fill="#00FF00" filter="url(#glow)">
            <animate
              attributeName="opacity"
              values="0.2;0.5;0.2"
              keyTimes="0;0.5;1"
              dur="4.2s"
              begin="0s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>

        <div className="nav-container">
          <nav className="nav">
            <a href="/shop" style={{ "--hover-color": "var(--neon-purple)" }}>
              Shop
            </a>
            <div className="dropdown">
              <button className="dropdown-button">Categories ▼</button>
              <div className="dropdown-content">
                {activeCategories.map((category) => (
                  <a key={category} href={`/category/${toSlug(category)}`}>
                    {category}
                  </a>
                ))}
              </div>
            </div>
            <a href="/contact" style={{ "--hover-color": "var(--neon-pink)" }}>
              Contact
            </a>

            {/* Right side actions */}
            <div className="nav-actions">
              {/* Search button to be implemented at future date */}
              {/* <button
                className="btn btn-sm btn-ghost"
                style={{ color: "white" }}
              >
                🔍
              </button> */}
              {/* End of search button */}

              <button
                onClick={handleClickCart}
                className="btn btn-sm btn-ghost relative"
                style={{ color: "white", left: "150px" }}
              >
                🛒
                <span className="cart-badge">{totalItems}</span>
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* <AnimatedBackground /> */}
      <div className="product-body">
        <div className="product-main-container">
          <div className="products-container">
            <div className="product-grid">
              {products.length > 0 ? (
                products.map((product) => (
                  <div
                    className="product-item-container"
                    key={product.id}
                    data-qty={availableById[product.id] ?? product.quantity}
                  >
                    <Product
                      id={product.id}
                      name={product.name}
                      category={product.category}
                      description={product.description}
                      price={product.price}
                      quantity={availableById[product.id] ?? product.quantity}
                      pictureVersion={product.pictureVersion}
                      pictureType={product.pictureType}
                      featured={product.featured}
                      newArrival={product.newArrival}
                      onReserved={fetchAvailable}
                      onOpenModal={openProductModal}
                    />
                  </div>
                ))
              ) : (
                <p>No products available.</p>
              )}

              <div
                className={`second-cart-container ${
                  cartItems.length ? "show" : ""
                }`}
              >
                {cartItems.length > 0 && !isCartShown && (
                  <div className="second-cart-container">
                    <button
                      onClick={handleClickCart}
                      className="btn btn-lg anchored"
                      style={{ color: "white" }}
                    >
                      <div className="cart-header">
                        <p className="cart-header-text">Your Cart</p>
                      </div>

                      <div className="cart-container">
                        <img
                          className="shopping-cart"
                          src="/shopping-cart.png"
                          alt="Cart"
                        ></img>
                      </div>
                      <span className="cart-badge">{totalItems}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCT MODAL RETURN **/}
      {isProductModalOpen && selectedProduct && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeProductModal}
          className="product-modal-overlay"
        >
          <div
            className="product-modal-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* THIS is the modal header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <h2 className="product-modal-title">{selectedProduct.name}</h2>
              <button
                type="button"
                onClick={closeProductModal}
                className="product-modal-close"
              >
                X
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              <img
                alt={selectedProduct.name}
                src={`http://localhost:8080/api/product/${selectedProduct.id}/picture?version=${selectedProduct.pictureVersion}`}
                style={{
                  width: "100%",
                  maxHeight: 420,
                  objectFit: "contain",
                  borderRadius: 8,
                }}
              />
            </div>

            <p className="product-modal-description">
              {selectedProduct.description}
            </p>

            <p className="product-modal-price">
              ${Number(selectedProduct.price).toFixed(2)}
            </p>

            <p className="product-modal-qty">
              Available qty: {selectedProduct.quantity}
            </p>
            <div className="purchase-container">
              <div className="purchase-buttons">
                {modalInCartQty === 0 ? (
                  <button
                    type="button"
                    className={
                      modalAvailableQty === 0
                        ? "sold-out-added-to-cart"
                        : "add-to-cart"
                    }
                    disabled={modalAvailableQty === 0 || modalSaving}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (modalAvailableQty === 0 || modalSaving) return;
                      handleModalQtyChange(1);
                    }}
                  >
                    {modalAvailableQty === 0
                      ? "Sold Out"
                      : modalSaving
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
                      disabled={modalSaving || modalInCartQty <= 0}
                      onClick={() => handleModalQtyChange(modalInCartQty - 1)}
                    >
                      −
                    </button>

                    <span className="qty-count">{modalInCartQty}</span>

                    <button
                      type="button"
                      className="qty-btn"
                      aria-label="Increase quantity"
                      disabled={modalSaving || modalAvailableQty <= 0}
                      onClick={() => handleModalQtyChange(modalInCartQty + 1)}
                    >
                      +
                    </button>

                    <span className="qty-label">in your cart</span>
                  </div>
                )}
              </div>
            </div>

            <div className="product-modal-footer">
              {totalItems > 0 ? (
                <div classNAme="modal-action-row">
                  <button
                    type="button"
                    className="modal-secondary"
                    onClick={closeProductModal}
                  >
                    Keep shopping
                  </button>

                  <button
                    type="button"
                    className="modal-primary"
                    onClick={() => {
                      closeProductModal();
                      setIsCartShown(true);
                    }}
                  >
                    Checkout
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="product-modal-exit"
                  onClick={closeProductModal}
                >
                  Exit
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPage;
