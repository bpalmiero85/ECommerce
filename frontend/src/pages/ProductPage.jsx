import { useState, useEffect, useRef } from "react";
import "../styles/ProductPage.css";
import "../styles/HomePage.css";
import Product from "../components/Product";
import CreditCard from "../components/CreditCard";
import ShoppingCart from "../components/ShoppingCart"

const ProductPage = () => {
  const [products, setProducts] = useState([]);

  const [purchaseProductId, setPurchaseProductId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    fetch("http://localhost:8080/api/products")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(setProducts)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      addLogoEffects();
    }
  }, [products]);

  const handlePurchase = (id) => {
    setPurchaseProductId(id);
    setIsOpen(true);
  };

  const handleClickOutside = (e) => {
    if (isOpen && cardRef.current && !cardRef.current.contains(e.target)) {
      setIsOpen(false);
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

  const addLogoEffects = () => {
    // Click effect for logo-design
    document.querySelectorAll(".logo-design").forEach((logo) => {
      logo.addEventListener("click", function () {
        this.style.transform = "scale(0.95)";
        setTimeout(() => {
          this.style.transform = "";
        }, 150);
      });
    });

    // Add extra sparkle effects on hover
    document.querySelectorAll(".logo-card").forEach((card) => {
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
    });
  };

  return (
    <div className="product-page-container">
    <div className="product-body">
      <div className="container">
        <h1 className="product-page-header">
          ✨ Goth & Glitter - Items for Sale ✨
        </h1>

        <div className="logo-grid">
          {products.length > 0 ? (
            products.map((product) => (
              <>
               <div className="product-main-container">
                <div className="product-item-container" key={product.id}>
               
                  <Product
                    id={product.id}
                    name={product.name}
                    description={product.description}
                    price={product.price}
                    quantity={product.quantity}
                    pictureVersion={product.pictureVersion}
                    pictureType={product.pictureType}
                  />
                  </div>

                  <div className="purchase-container">
                    {purchaseProductId !== product.id && (
                      <button
                        className="purchase-button"
                        onClick={() => handlePurchase(product.id)}
                      >
                        Purchase
                      </button>
                    )}
                    {isOpen && purchaseProductId === product.id && (
                      <div className="credit-card-window" ref={cardRef}>
                        <CreditCard productId={product.id} />
                        <button
                          className="cancel-button"
                          onClick={() => setIsOpen(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ))
          ) : (
            <p>No products available.</p>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default ProductPage;
