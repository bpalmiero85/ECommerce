import { useRef, useState } from "react";
import "../styles/ProductPage.css";

const Footer = () => {
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);
  const [privacyModalPosition, setPrivacyModalPosition] = useState({
    top: 0,
    left: 0,
  });

  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [termsModalPosition, setTermsModalPosition] = useState({
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

  const handleSendEmail = () => {
    const confirm = window.confirm(
      "Send an email to info.gothandglitter@gmail.com?",
    );
    if (!confirm) return;

    const response = (window.location.href =
      "mailto:info.gothandglitter@gmail.com");

    return response;
  };

  const handleTerms = () => {
    const rect = footerLinksRef.current?.getBoundingClientRect();
    if (!rect) return;

    setTermsModalPosition({
      top: rect.top - 12,
      left: rect.left + rect.width / 2,
    });

    setIsTermsOpen(true);
  };

  const closeTermsModal = () => {
    setIsTermsOpen(false);
  };

  return (
    <div
      onClick={() => {
        if (isPrivacyPolicyOpen) closePrivacyModal();
      }}
      style={{
        minHeight: "fit-content",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {isPrivacyPolicyOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: "1000" }}
          onClick={closePrivacyModal}
        >
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
              how we collect, use, disclose, and protect your information when
              you visit our website, place an order, or otherwise interact with
              us.
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
              Stripe collects and processes your payment information according
              to their own privacy policies.
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
              This information helps us operate, secure, and improve the
              website.
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
              unauthorized access, loss, misuse, or disclosure. However, no
              method of transmission over the internet or electronic storage is
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
              providers. We are not responsible for the privacy practices of
              those third parties. Please review their privacy policies
              separately.
              <br />
              <br />
              9. Children’s Privacy:
              <br />
              Our website is not directed to children under 18, and we do not
              knowingly collect personal information from individuals under 18.
              If we learn that we have collected personal information from a
              person under 18 without appropriate authorization where required,
              we will take reasonable steps to delete that information.
              <br />
              <br />
              10. Changes to This Privacy Policy:
              <br />
              We may update this Privacy Policy from time to time. When we do,
              we will post the updated version on this page and update the
              Effective Date above. Your continued use of the website after
              changes are posted means you accept the revised Privacy Policy.
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
        </div>
      )}

      {isTermsOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: "1000" }}
          onClick={closeTermsModal}
        >
          <div
            className="privacy-policy-modal"
            onClick={(e) => {
              e.stopPropagation();
            }}
            style={{
              position: "fixed",
              top: `${termsModalPosition.top}px`,
              left: `${termsModalPosition.left}px`,
              transform: "translate(-50%, -100%)",
              zIndex: 5000,
            }}
          >
            <div className="privacy-modal-x" onClick={closeTermsModal}>
              <button>
                <strong>X</strong>
              </button>
            </div>
            <div className="privacy-policy-modal-text">
              Goth & Glitter Terms of Service:
              <br />
              <br />
              These Terms of Service ("Terms") govern your use of the Goth &
              Glitter website and any purchases made through it.
              <br />
              <br />
              By accessing or using our website, you agree to these Terms. If
              you do not agree, please do not use the site.
              <br />
              <br />
              1. Use of the Website:
              <br />
              You agree to use this website only for lawful purposes and in a
              way that does not infringe the rights of others or restrict their
              use of the site.
              <br />
              <br />
              You may not...
              <br />
              • Use the site for fraudulent or unlawful activity
              <br />
              • Attempt to gain unauthorized access to systems or data
              <br />
              • Interfere with the functionality or security of the website
              <br />
              <br />
              2. Products and Orders:
              <br />
              All products are subject to availability. We reserve the right to
              limit quantities, discontinue products, or cancel orders at our
              discretion.
              <br />
              <br />
              We make every effort to display products accurately, but colors,
              sizes, and details may vary slightly due to screen differences or
              the nature of 3D printing.
              <br />
              <br />
              3. Pricing and Payments:
              <br />
              All prices are listed in USD and are subject to change without
              notice.
              <br />
              <br />
              Payments are processed securely through a third-party provider
              (Stripe). We do not store your full payment information.
              <br />
              <br />
              4. Shipping and Delivery:
              <br />
              We aim to process and ship orders promptly, but delivery times are
              estimates and not guaranteed.
              <br />
              <br />
              We are not responsible for delays caused by shipping carriers,
              incorrect addresses, or unforeseen circumstances.
              <br />
              <br />
              5. Returns and Refunds:
              <br />
              Due to the nature of our products, all sales are generally final
              unless an item arrives damaged or defective.
              <br />
              <br />
              If there is an issue with your order, please contact us and we
              will work to resolve it.
              <br />
              <br />
              6. Intellectual Property:
              <br />
              All content on this website—including designs, images, text, and
              branding—is the property of Goth & Glitter and may not be copied,
              reproduced, or used without permission.
              <br />
              <br />
              7. Limitation of Liability:
              <br />
              Goth & Glitter is not liable for any indirect, incidental, or
              consequential damages arising from your use of the website or
              products.
              <br />
              <br />
              All products are provided "as is" without warranties of any kind,
              except where required by law.
              <br />
              <br />
              8. Changes to These Terms:
              <br />
              We may update these Terms at any time. Changes will be posted on
              this page, and continued use of the website means you accept the
              updated Terms.
              <br />
              <br />
              9. Governing Law:
              <br />
              These Terms are governed by the laws of the State of Ohio, without
              regard to conflict of law principles.
              <br />
              <br />
              10. Contact Us:
              <br />
              If you have any questions about these Terms, contact us at...
              <br />
              <br />
              Goth & Glitter Email: info.gothandglitter@gmail.com
              <br />
              Website: www.gothandglitter.com
            </div>
            <button className="privacy-modal-close" onClick={closeTermsModal}>
              Close
            </button>
          </div>
        </div>
      )}
      {/* Footer */}
      <footer className="footer">
        <div>
          <img alt="Goth & Glitter logo" className="gglogo" src="/gglogo.svg" />
        </div>

        <p className="footer-text">
          © 2025 Goth & Glitter. Conjuring cute spooky magic through 3D
          printing.
        </p>
        <div className="footer-links" ref={footerLinksRef}>
          <button onClick={handlePrivacyPolicy}>Privacy Policy</button>
          <button onClick={handleTerms}>Terms of Service</button>
          <button onClick={handleSendEmail}>Contact Us</button>
        </div>
      </footer>
    </div>
  );
};
export default Footer;
