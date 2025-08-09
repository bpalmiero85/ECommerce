import { useState, useEffect, useRef, useContext } from "react";
import { CartContext } from "../contexts/CartContext";
import "../styles/AdminPage.css";
import "../styles/ProductPage.css";
import Product from "../components/Product";
import ShoppingCart from "../components/ShoppingCart";
import AnimatedBackground from "../components/AnimatedBackground";
import CheckoutPage from "./CheckoutPage";

const ProductPage = ({ products: externalProducts }) => {
  const [products, setProducts] = useState([]);
  const [isCartShown, setIsCartShown] = useState(false);
  const { cartItems } = useContext(CartContext);

  const handleClickCart = () => {
    setIsCartShown((open) => !open);
  };

  const handleCancelCart = () => {
    setIsCartShown(false);
  };

    const decrementProductQty = (productId) => {
    setProducts(prev => 
      prev.map((p) => 
        p.id === productId && p.quantity > 0 ? { ...p, quantity: p.quantity - 1 } : p
      )
    )
  };


  useEffect(() => {
    if (externalProducts?.length > 0) {
      setProducts(externalProducts);
    }
  }, [externalProducts]);

  useEffect(() => {
    if (products.length > 0) {
      addLogoEffects();
    }
    return () => {};
  }, [products]);

  const addLogoEffects = () => {
    document.querySelectorAll(".product-design").forEach((logo) => {
      if (!logo.dataset.effectAdded) {
        logo.addEventListener("click", function () {
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
    <div className="product-page-container">
      {isCartShown && (
        <div className="cart-modal">
          <ShoppingCart />
          <div className="checkout-page">
            <CheckoutPage />
            <div className="cart-modal-cancel-button">
              <button type="button" onClick={handleCancelCart}>
                Cancel
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
          <div className="nav-container">
            <nav className="nav">
              <a href="#home">Home</a>
              <a
                href="#gallery"
                style={{ "--hover-color": "var(--neon-blue)" }}
              >
                Gallery
              </a>
              <a href="#shop" style={{ "--hover-color": "var(--neon-purple)" }}>
                Shop
              </a>
              <a
                href="#contact"
                style={{ "--hover-color": "var(--neon-pink)" }}
              >
                Contact
              </a>
              {/* Right side actions */}
              <div className="nav-actions">
                <button
                  className="btn btn-sm btn-ghost"
                  style={{ color: "white" }}
                >
                  🔍
                </button>
                <button
                  onClick={handleClickCart}
                  className="btn btn-sm btn-ghost relative"
                  style={{ color: "white" }}
                >
                  🛒
                  <span className="cart-badge">{cartItems.length}</span>
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  style={{ color: "white" }}
                >
                  👤
                </button>
              </div>
            </nav>
          </div>
        </div>
      </div>

      <AnimatedBackground />
      <div className="product-body">
        <div className="product-main-container">
        <div className="products-container">
          <div className="product-grid">
              {products.length > 0 ? (
                products.map((product) => (
                  <div className="product-item-container" key={product.id}>
                    <Product
                      id={product.id}
                      name={product.name}
                      description={product.description}
                      price={product.price}
                      quantity={product.quantity}
                      pictureVersion={product.pictureVersion}
                      pictureType={product.pictureType}
                      onDecrementQty={decrementProductQty}
                    />
                  </div>
                ))
              ) : (
                <p>No products available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
  );
};

export default ProductPage;
