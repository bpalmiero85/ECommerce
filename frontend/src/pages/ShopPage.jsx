import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";
import { error as logError } from "../utils/logger";
import ProductPage from "./ProductPage.jsx";
import Footer from "../components/Footer.jsx"
import "../styles/styles.css";
import "../styles/ProductPage.css";

const Shop = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async (category) => {
      try {
        const url = category
          ? `${API_BASE_URL}/api/products?category=${encodeURIComponent(category)}`
          : `${API_BASE_URL}/api/products`;

        const response = await fetch(url, { credentials: "include" });

        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const fetched = await response.json();

        setProducts((prev) => {
          const fetchedMap = new Map(fetched.map((p) => [p.id, p]));
          const keptUpdated = prev
            .filter((p) => fetchedMap.has(p.id))
            .map((p) => fetchedMap.get(p.id));
          const keptIds = new Set(keptUpdated.map((p) => p.id));
          const onlyNew = fetched.filter((p) => !keptIds.has(p.id));
          return [...keptUpdated, ...onlyNew];
        });
      } catch (err) {
        logError("ShopPage failed fetching products:", err);
      }
    };

    fetchProducts();
    const interval = setInterval(() => fetchProducts(), 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="products-section">
      <div className="section-header">
        <h2 className="section-title">
          <span className="neon-glow" style={{ color: "var(--neon-pink)" }}>
            OUR
          </span>{" "}
          COLLECTION
        </h2>
        <p className="section-subtitle">
          All the spooky, all the sparkly—every creation in one place.
        </p>
          <div className="shipping-disclaimer">
        🇺🇸 Ships within the United States only
        </div>
      </div>

      <div className="products-grid-container">
        <ProductPage products={products} />
      </div>
    </section>
  );
};

// Hero Section Component
function HeroSection() {
  return (
    <section className="hero">
      {/* Left content */}
      <div className="hero-content">
        <h1 className="hero-title">
          CONJURE YOUR{" "}
          <span className="neon-glow" style={{ color: "var(--neon-green)" }}>
            SPOOKY
          </span>{" "}
          PRINTS NOW.
        </h1>

        <p className="hero-description">
          Discover our enchanting collection of 3D printed cute but spooky
          items. From adorable ghosts to mystical creatures, bring magic to your
          world.
        </p>
      </div>

      {/* Right side - Hero image area */}
      <div className="hero-visual">
        <div className="relative">
          {/* Floating elements */}
          <div className="floating-element floating-1"></div>
          <div className="floating-element floating-2"></div>

          {/* Main hero illustration */}
          <div className="hero-circle">
            <div className="hero-inner-circle">
              <div className="promo-product">
                <img
                  alt="Sludgy product preview"
                  style={{ display: "flex", width: "150px" }}
                  src="/sludgy.png"
                ></img>
                <div className="promo-product-details">
                  <p>Product name:</p>
                  <h2 className="promo-product-name">Sludgy</h2>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div
              className="absolute"
              style={{
                top: "1rem",
                right: "1rem",
                animation: "spin 2s linear infinite",
              }}
            >
              ⭐
            </div>
          </div>
        </div>

        {/* Floating promotion card */}
        <div className="promo-card gothic-card">
          <div className="promo-title">GET 20% OFF!</div>
          <div className="promo-text">
            You can get 20% off this product using promo code SLUDGE20. Limit 1
            per order.
          </div>
        </div>
      </div>
    </section>
  );
}

// Header Component
function Nav() {
  return "";
}

// Main App Component
export default function ShopPage() {
  return (
  <div>
    {/* Animated background elements */}
    <div className="bg-dots">
      <div className="dot dot-1"></div>
      <div className="dot dot-2"></div>
      <div className="dot dot-3"></div>
      <div className="dot dot-4"></div>
      <div className="dot dot-5"></div>
    </div>

    {/* Main content */}
    <div className="relative">
      <HeroSection />
      <Shop />
    </div>
    <Footer />
  </div>
  );
}
