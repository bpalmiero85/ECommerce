import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import ProductPage from "./ProductPage.jsx";
import "../styles/styles.css";
import "../styles/ProductPage.css";
import { CartContext } from "../contexts/CartContext.jsx";

function Category() {
  const [products, setProducts] = useState([]);
  const { slug } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const inFlight = useRef(false);
  const firstLoad = useRef(true);
  const prevSig = useRef("");
  const displayName = (slug ?? "").replace(/-/g, " ");

  function SkeletonGrid({ count = 8 }) {
    return (
      <div className="skeleton-grid">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton-card" />
        ))}
      </div>
    );
  }

  function InlineError({ message, onRetry }) {
    return (
      <div className="inline-error">
        <span>{message}</span>
        <button className="btn btn-sm" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }

  function EmptyState({ category }) {
    return (
      <div className="empty-state">
        No products in <strong>{category}</strong> yet.
      </div>
    );
  }

  const retry = () => setRetryKey((k) => k + 1);

  useEffect(() => {
    if (!slug) {
      setProducts([]);
      return;
    }
    let alive = true;
    const fetchProducts = async (showLoader = false) => {
      if (inFlight.current) return;
      inFlight.current = true;
      if (showLoader && firstLoad.current) setLoading(true);
      setError("");
      try {
        const categoryParam = (slug ?? "").replace(/-/g, " ");
        const url = `http://localhost:8080/api/products?category=${encodeURIComponent(
          categoryParam
        )}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
        const sig = sorted
          .map(
            (p) =>
              `${p.id}:${p.pictureVersion ?? p.updatedAt ?? 0}:${p.quantity}`
          )
          .join("|");
        if (sig !== prevSig.current) {
          prevSig.current = sig;
          setProducts(sorted);
        }
      } catch (error) {
        setError("Could not load products");
        console.error(error);
      } finally {
        if (showLoader && firstLoad.current) {
          setLoading(false);
          firstLoad.current = false;
        }
        inFlight.current = false;
        setRefreshing(false);
      }
    };
    fetchProducts(true);

    const id = setInterval(() => {
      setRefreshing(true);
      fetchProducts(false);
    }, 5000);
    return () => {
      clearInterval(id);
    };
  }, [slug, retryKey]);

  const isEmpty = !loading && !error && products.length === 0;

  return (
    <section className="products-section">
      <div className="section-header">
        <h2 className="section-title">
          <span className="neon-glow" style={{ color: "var(--neon-pink)" }}>
            {displayName}
          </span>
          {!loading && !error && products.length === 0 && (
            <span className="result-count"> • {products.length} items</span>
          )}
        </h2>
      </div>

      <div className="products-grid-container">
        {loading ? (
          <SkeletonGrid count={8} />
        ) : error ? (
          <InlineError message={error} onRetry={retry} />
        ) : isEmpty ? (
          <EmptyState category={displayName} />
        ) : (
          <ProductPage products={products} key={slug} />
        )}
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
export default function CategoryPage() {
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
        <Category />
      </div>

      {/* Footer */}
      <footer className="footer">
        <div>
          <img className="gglogo" src="/gglogo.svg"></img>
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
