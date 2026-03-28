import React, { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "../config/api";
import { error as logError } from "../utils/logger";
import ProductPage from "../pages/ProductPage.jsx";
import "../styles/styles.css";
import "../styles/ProductPage.css";

function FeaturedProducts() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const url = `${API_BASE_URL}/api/products?featured=true`;
      try {
        const response = await fetch(url);

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
        logError("FeaturedProducts fetchProducts failed", {
          urlAttempted: url,
          message: err?.message,
        });
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
            POPULAR
          </span>{" "}
          CREATIONS
        </h2>
        <p className="section-subtitle">
          Discover our most beloved spooky-cute 3D prints
        </p>
      </div>

      <div className="products-grid-container">
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
          FEATURED{" "}
          <span className="neon-glow" style={{ color: "var(--neon-green)" }}>
            PRODUCTS.
          </span>{" "}
        </h1>

        <p className="hero-description">
          Hand-picked fan favorites—spooky-cute treasures our coven loves most.
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
        </div>

        {/* Floating promotion card */}
        <div className="promo-card gothic-card">
          <div className="promo-title">GET UP TO 20% OFF</div>
          <div className="promo-text">
            You can get 20% off this product if you are buying now
          </div>
        </div>
      </div>
    </section>
  );
}

// Main App Component
export default function FeaturedProductsPage() {
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
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

    setIsPrivacyModalOpen(true);
  };

  const closePrivacyModal = (e) => {
    setIsPrivacyModalOpen(false);
  };

  return (
    <div
      onClick={() => {
        if (isPrivacyModalOpen) closePrivacyModal();
      }}
      style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}
    >
    {isPrivacyModalOpen && (
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
      <div className="relative z-10">
        <HeroSection />
        <FeaturedProducts />
      </div>

      {/* Footer */}
      <footer className="footer">
        <div>
          <img
            alt="Goth and Glitter logo"
            className="gglogo"
            src="./gglogo.svg"
          ></img>
        </div>

        <p className="footer-text">
          © 2025 Goth & Glitter. Conjuring cute spooky magic through 3D
          printing.
        </p>
        <div className="footer-links" ref={footerLinksRef}>
          <button onClick={handlePrivacyPolicy}>Privacy Policy</button>
          <button>Terms of Service</button>
          <button>Contact Us</button>
        </div>
      </footer>
    </div>
  );
}
