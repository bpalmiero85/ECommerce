import React, { useState, useEffect } from "react";
import ProductPage from "../pages/ProductPage.jsx";
import "../styles/ProductPage.css";
import "../styles/styles.css";

function FeaturedProducts() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/products");
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const fetched = await response.json();

        setProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const onlyNew = fetched.filter((p) => !existingIds.has(p.id));
          const fetchedMap = new Map(fetched.map((p) => [p.id, p]));
          const updatedProducts = prev.map((oldProd) =>
            fetchedMap.has(oldProd.id) ? fetchedMap.get(oldProd.id) : oldProd
          );
          return [...updatedProducts, ...onlyNew];
        });

      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };

    fetchProducts();
    const interval = setInterval(fetchProducts, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="products-section">
      <div className="section-header">
        <h2 className="section-title">
          <span className="neon-glow" style={{ color: "var(--neon-pink)" }}>
            POPULAR
          </span>{" "}
          CREATIONS
        </h2>
        <p className="section-subtitle">
          Discover our most beloved spooky-cute 3D prints
        </p>
      </div>

      <div className="products-grid">
        <ProductPage products={products} />
      </div>
    </section>
  );
}

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

        <button className="btn btn-lg btn-gradient bold">Shop Now</button>
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
              <div className="hero-ghost">👻</div>
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

          {/* Dashed orbit lines */}
          <div className="orbit-line orbit-1"></div>
          <div className="orbit-line orbit-2"></div>
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
export default function FeaturedProductsPage() {
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
      <div className="relative z-10">
        <HeroSection />
        <FeaturedProducts />
      </div>

      {/* Footer */}
      <footer className="footer">
        <div>
          <img className="gglogo" src="./gglogo.svg"></img>
        </div>

        <p className="footer-text">
          © 2025 Goth & Glitter. Conjuring cute spooky magic through 3D
          printing.
        </p>
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <button type="button">Contact Us</button>
        </div>
      </footer>
    </div>
  );
}
