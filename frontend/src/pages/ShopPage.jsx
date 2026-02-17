import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";
import { error as logError } from "../utils/logger";
import ProductPage from "./ProductPage.jsx";
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
              <div>
                <img
                alt="Sludgy product preview"
                  style={{ display: "flex", width: "150px" }}
                  src="/sludgy.jpg"
                ></img>
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
          <div className="promo-title">GET UP TO 30% OFF</div>
          <div className="promo-text">
            You can get 30% off this product if you are buying now
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
    <div
      style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}
    >
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

      {/* Footer */}
      <footer className="footer">
        <div>
          <img
            alt="Goth & Glitter logo"
            className="gglogo"
            src="./gglogo.svg"
          />
        </div>

        <p className="footer-text">
          © 2025 Goth & Glitter. Conjuring cute spooky magic through 3D
          printing.
        </p>
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact Us</a>
        </div>
      </footer>
    </div>
  );
}
