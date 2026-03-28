import React, { useState, useEffect, useRef } from "react";
import { error as logError } from "../utils/logger";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import ProductPage from "./ProductPage.jsx";
import "../styles/styles.css";
import "../styles/ProductPage.css";

const SLUG_TO_CATEGORY = {
  "fidgets-sensory": "Fidgets & Sensory",
  "home-decor": "Home Decor",
  "custom-orders": "Custom Orders",
  "garbage-ghouls": "Garbage Ghouls",
  jewelry: "Jewelry",
  figurines: "Figurines",
  accessories: "Accessories",
  "new-arrivals": "New Arrivals", // sentinel for the special route
};

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
  const slugKey = String(slug ?? "")
    .trim()
    .toLowerCase();
  const displayName =
    SLUG_TO_CATEGORY[slugKey] ?? (slug ?? "").replace(/-/g, " ");
  const normalizedCategory = displayName.toLowerCase().trim();
  const categoryObject = {
    "fidgets sensory":
      "Restless spirits deserve restless toys. Spin, squish, and click your way through the shadows with fidgets that keep haunted hands busy.",
    jewelry:
      "Tiny charms of the night. From moons to monsters, our gothic jewelry adds a touch of eerie sparkle to your everyday ritual.",
    figurines:
      "Creepy-cute characters ready to haunt your shelves. From little monsters to strange critters, these figurines bring personality to any corner.",
    accessories:
      "Odd little extras to tag along wherever you go. Keychains, charms, and small gothic add-ons that bring a spark of spooky style.",
    "home decor":
      "Spooky accents for everyday spaces. Turn your lair into a haunted haven. Bowls, holders, and decorations that turn your home into a cozy haunted hideaway.",
    "custom orders":
      "Got something unusual in mind? Tell us, and we’ll whip up a custom print made just for you — unique, personal, and full of character.",
    "garbage ghouls":
      "Our original creatures of chaos. Born of slime and shadows, the Garbage Ghouls crawl from the crypt to be collected. Strange, silly, and a little grotesque — they’re impossible not to love.",
  };
  const categoryDescription =
    categoryObject[normalizedCategory] ??
    "Discover our enchanting collection of 3D printed cute but spooky items. From adorable ghosts to mystical creatures, bring magic to your world.";

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
        No products currently listed in <strong>{category}</strong> category.
      </div>
    );
  }

  const retry = () => setRetryKey((k) => k + 1);

  useEffect(() => {
    function onInventoryChanged() {
      // trigger a refetch using your existing [slug, retryKey] effect
      setRetryKey((k) => k + 1);
    }
    window.addEventListener("inventory:changed", onInventoryChanged);
    return () =>
      window.removeEventListener("inventory:changed", onInventoryChanged);
  }, []);

  useEffect(() => {
    if (!slug) {
      setProducts([]);
      return;
    }
    const fetchProducts = async (showLoader = false) => {
      if (inFlight.current) return;
      inFlight.current = true;
      if (showLoader && firstLoad.current) setLoading(true);
      setError("");
      const slugValue = String(slug ?? "")
        .trim()
        .toLowerCase();
      const mappedCategory =
        SLUG_TO_CATEGORY[slugValue] ?? slugValue.replace(/-/g, " ");
      const url =
        slugValue === "new-arrivals"
          ? `${API_BASE_URL}/api/products?newArrival=true`
          : `${API_BASE_URL}/api/products?category=${encodeURIComponent(
              mappedCategory,
            )}`;
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
        const sig = sorted
          .map(
            (p) =>
              `${p.id}:${p.pictureVersion ?? p.updatedAt ?? 0}:${p.quantity}`,
          )
          .join("|");
        if (sig !== prevSig.current) {
          prevSig.current = sig;
          setProducts(sorted);
        }
      } catch (error) {
        setError("Could not load products");
        logError("CategoryPage fetchProducts failed", {
          slug,
          slugKey,
          slugValue,
          mappedCategory,
          urlAttempted: url,
          message: error?.message,
        });
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
      <div className="hero-section">
        <HeroSection categoryDescription={categoryDescription} />
      </div>
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
          <div className="product-page">
            <ProductPage products={products} key={slug} />
          </div>
        )}
      </div>
    </section>
  );
}

// Hero Section Component
function HeroSection({ categoryDescription }) {
  return (
    <div className="hero-content">
      <h2>{categoryDescription}</h2>
    </div>
  );
}

// Header Component
function Nav() {
  return "";
}

// Main App Component
export default function CategoryPage() {
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);
  const [privacyModalPosition, setPrivacyModalPosition] = useState({
    top: 0,
    left: 0,
  });
  const footerLinksRef = useRef(null);

  const handlePrivacyPolicy = () => {
    const rect = footerLinksRef.current?.getBoundingClientRect();
    if (!rect) return;

    setPrivacyModalPosition({
      top: rect.top - 12,
      left: rect.left + rect.width / 2,
    });

    setIsPrivacyPolicyOpen(true);
  };

  const closePrivacyModal = (e) => {
    setIsPrivacyPolicyOpen(false);
  };

  return (
    <div
      onClick={() => {
        if (isPrivacyPolicyOpen) closePrivacyModal();
      }}
      style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}
    >
      {isPrivacyPolicyOpen && (
        <div
          className="privacy-policy-modal"
          onClick={(e) => {
            e.stopPropagation();
          }}
          style={{
            position: "fixed",
            top: `${privacyModalPosition.top}px`,
            left: `${privacyModalPosition.left}px`,
            transform: "translate(-50%, -100%)",
            zIndex: 5000,
          }}
        >
          <div className="privacy-modal-x" onClick={closePrivacyModal}>
            <button>
              <strong>X</strong>
            </button>
          </div>
          <div className="privacy-policy-modal-text">
            Goth & Glitter Privacy Policy:
            <br />
            <br />
            Goth & Glitter respects your privacy. This Privacy Policy explains
            how we collect, use, disclose, and protect your information when you
            visit our website, place an order, or otherwise interact with us.
            <br />
            <br />
            By using our website, you agree to the practices described in this
            Privacy Policy.
            <br />
            <br />
            1. Information We Collect:
            <br />
            We may collect the following types of information...
            <br />
            • Personal Information You Provide
            <br />
            When you place an order, contact us, or interact with our website,
            you may provide information such as...
            <br />
            • Name
            <br />
            • Email address
            <br />
            • Shipping address
            <br />
            • Billing address
            <br />
            • Phone number, if provided
            <br />
            • Order details
            <br />
            • Any information you submit through contact forms or messages
            <br />
            <br />
            Payment Information
            <br />
            We do not directly store your full payment card details. Payments
            are processed by a third-party payment processor named Stripe.
            Stripe collects and processes your payment information according to
            their own privacy policies.
            <br />
            <br />
            Automatically Collected Information:
            <br />
            When you visit our website, certain information may be collected
            automatically, such as...
            <br />
            • IP address
            <br />
            • Browser type
            <br />
            • Device information
            <br />
            • Pages visited
            <br />
            • Time spent on pages
            <br />
            • Referring website
            <br />
            • Basic usage and diagnostic information
            <br />
            This information helps us operate, secure, and improve the website.
            <br />
            <br />
            2. How We Use Your Information:
            <br />
            We may use your information to...
            <br />
            • Process and fulfill orders
            <br />
            • Send order confirmations, shipping updates, and customer service
            messages
            <br />
            • Respond to questions or requests
            <br />
            • Improve our website, products, and services
            <br />
            • Detect, prevent, and address fraud, abuse, or security issues
            <br />
            • Comply with legal obligations
            <br />
            • Maintain business records
            <br />
            We do not sell your personal information.
            <br />
            <br />
            3. Sharing of Information:
            <br />
            We may share your information with trusted third parties only as
            needed to operate our business, including...
            <br />
            • Payment processors
            <br />
            • Shipping and fulfillment providers
            <br />
            • Website hosting or technical service providers
            <br />
            • Analytics or fraud prevention providers
            <br />
            • Law enforcement or government authorities when required by law
            <br />
            We only share information reasonably necessary for these purposes.
            <br />
            <br />
            4. Cookies and Similar Technologies
            <br />
            Our website may use cookies or similar technologies to improve
            functionality, remember preferences, understand site usage, and
            support security or analytics.
            <br />
            <br />
            You can usually control cookies through your browser settings.
            Disabling cookies may affect some website features.
            <br />
            <br />
            5. Data Retention:
            <br />
            We retain personal information for as long as reasonably necessary
            to...
            <br />
            • Fulfill orders
            <br />
            • Provide customer support
            <br />
            • Maintain records
            <br />
            • Comply with legal, tax, accounting, or regulatory obligations
            <br />
            • Resolve disputes and enforce agreements
            <br />
            <br />
            6. Data Security:
            <br />
            We take reasonable measures to protect your information from
            unauthorized access, loss, misuse, or disclosure. However, no method
            of transmission over the internet or electronic storage is
            completely secure, so we cannot guarantee absolute security.
            <br />
            <br />
            7. Your Rights and Choices:
            <br />
            Depending on where you live, you may have rights regarding your
            personal information, including the right to request access to,
            correction of, or deletion of your information.
            <br />
            To make a privacy-related request, contact us at
            info.gothandglitter@gmail.com.
            <br />
            We may need to verify your identity before completing certain
            requests.
            <br />
            <br />
            8. Third-Party Services and Links:
            <br />
            Our website may contain links to third-party websites or use
            third-party services such as payment processors or shipping
            providers. We are not responsible for the privacy practices of those
            third parties. Please review their privacy policies separately.
            <br />
            <br />
            9. Children’s Privacy:
            <br />
            Our website is not directed to children under 18, and we do not
            knowingly collect personal information from individuals under 18. If
            we learn that we have collected personal information from a person
            under 18 without appropriate authorization where required, we will
            take reasonable steps to delete that information.
            <br />
            <br />
            10. Changes to This Privacy Policy:
            <br />
            We may update this Privacy Policy from time to time. When we do, we
            will post the updated version on this page and update the Effective
            Date above. Your continued use of the website after changes are
            posted means you accept the revised Privacy Policy.
            <br />
            <br />
            11. Contact Us:
            <br />
            If you have questions about this Privacy Policy or our privacy
            practices, contact us at...
            <br />
            <br />
            Goth & Glitter Email: info.gothandglitter@gmail.com Website:
            www.gothandglitter.com
          </div>
          <button className="privacy-modal-close" onClick={closePrivacyModal}>
            Close
          </button>
        </div>
      )}
      {/* Animated background elements */}
      <div className="bg-dots">
        <div className="dot dot-1"></div>
        <div className="dot dot-2"></div>
        <div className="dot dot-3"></div>
        <div className="dot dot-4"></div>
        <div className="dot dot-5"></div>
      </div>

      {/* Main content */}
      <div className="category-page">
        <Category />
      </div>

      {/* Footer */}
      <footer className="footer">
        <div>
          <img
            alt="Goth & Glitter logo"
            className="gglogo"
            src="/gglogo.svg"
          ></img>
        </div>

        <p className="footer-text">
          © 2025 Goth & Glitter. Conjuring cute spooky magic through 3D
          printing.
        </p>
        <div className="footer-links" ref={footerLinksRef}>
          <button className="footer-button" onClick={handlePrivacyPolicy}>
            Privacy Policy
          </button>
          <button className="footer-button" href="#terms">
            Terms of Service
          </button>
          <button className="footer-button" href="#contact">
            Contact Us
          </button>
        </div>
      </footer>
    </div>
  );
}
