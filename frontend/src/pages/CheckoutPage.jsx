import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useState, useContext } from "react";
import { CartContext } from "../contexts/CartContext";
import ClearCartButton from "../components/ClearCartButton";
import "../styles/CheckoutPage.css";
import "../styles/ProductPage.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

/**
 * CheckoutPage Component
 *
 * Handles payment processing with Stripe, displaying a styled card input field
 * and a summary of the user's cart subtotal. Uses Stripe Elements for secure card entry
 * and communicates with the backend to create and confirm PaymentIntent.
 *
 * @component
 * @returns {JSX.Element} A checkout form with card input, subtotal display, and payment button.
 */

export default function CheckoutPage() {
  /**
   * Options for styling the Stripe CardElement.
   * - Hides postal code field.
   * - Provides custom styling for base and invalid states.
   */
  const CARD_ELEMENT_OPTIONS = {
    hidePostalCode: true,
    style: {
      base: {
        color: "#222",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: "antialiased",
        "::placeholder": {
          color: "#888",
        },
      },
      invalid: {
        color: "#e5424d",
        iconColor: "#e5424d",
      },
    },
  };

  // Access the shopping cart context to calculate subtotal.
  const { cartItems } = useContext(CartContext);
  const subtotal = cartItems.reduce(
    (sum, item) =>
      sum +
      (Number(item.price) || 0) * (Number(item.qty ?? item.quantity ?? 1) || 0),
    0
  );

  // TODO: replace this with real product weights later.

  const totalWeightOunces = cartItems.reduce(
    (sum, item) => sum + 8 * (Number(item.qty ?? item.quantity ?? 1) || 0),
    0
  );

  // Stripe hooks
  const stripe = useStripe();
  const elements = useElements();

  // Component state
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  // Form input state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Empty cart state
 // const [isEmpty, setIsEmpty] = useState(true);

  // Stripe card state
  const [isCardComplete, setIsCardComplete] = useState(false);

  // Stripe card error
  const [cardError, setCardError] = useState(null);

  // Check validity of user email address
  const [isEmailValid, setIsEmailValid] = useState(false);

  // Store what state (location) the user resides in
  const [shippingState, setShippingState] = useState("");

  // Charge local state's sales tax if shipping locally
 // const [isLocal, setIsLocal] = useState(false);

  // Sales tax ($0 for any state but local)
 // const [salesTax, setSalesTax] = useState(0);

  // Shipping address / rates
  const [destinationZip, setDestinationZip] = useState("");
  const [shippingRate, setShippingRate] = useState(null);
 // const [shipping, setShipping] = useState(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState(null);

  const inferStateFromZip = (zip) => {
    if (!/^\d{5}(-\d{4})?$/.test(zip)) {
      return "";
    }

    const num = parseInt(zip.slice(0, 5), 10);

    if (num >= 43001 && num <= 45999) {
      return "OH";
    }

    return "";
  };

  /**
   * Handles the form submission to process the payment.
   * 1. Calls the backend to create a PaymentIntent and retrieve clientSecret.
   * 2. Uses Stripe's confirmCardPayment to finalize the payment.
   *
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   */

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // 1) Hit backend to create a PaymentIntent
      const tax = shippingState === "OH" ? subtotal * 0.0725 : 0;
      const shipping = shippingRate || 0;
      const total = subtotal + tax + shipping;

      const { clientSecret } = await fetch("${API_BASE}/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(total * 100),
          state: shippingState,
          shipping,
        }),
      }).then((r) => r.json());

      // 2) Confirm the payment using Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name,
            email,
          },
        },
      });

      if (result.error) {
        // Display error to the user
        setError(result.error.message);
        setProcessing(false);
      } else if (result.paymentIntent.status === "succeeded") {
        // Payment successful
        setError(null);
        setProcessing(false);
        setSucceeded(true);
      }
    } catch (err) {
      // Catch network or unexpected errors
      setError("Payment failed. Please try again.");
      setProcessing(false);
    }
  };

  const handleCalculateShipping = async () => {
    setShippingError(null);

    if (!destinationZip || !/^\d{5}(-\d{4})?$/.test(destinationZip)) {
      setShippingError("Please enter a valid ZIP code.");
      return;
    }

    if (cartItems.length === 0) {
      setShippingError("Your cart is empty.");
      return;
    }
    setShippingState(inferStateFromZip(destinationZip));
    setShippingLoading(true);

    try {
      // For now: use a fixed box + weight assumption.
      // This matches what you've been testing against USPS.
      const body = {
        destinationZip: destinationZip,
        weightOunces: totalWeightOunces || 16, // TODO: later: derive from cart items
        lengthInches: 10,
        widthInches: 6,
        heightInches: 4,
      };

      const res = await fetch(`${API_BASE}/api/shipping/rates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.error ||
            data?.details ||
            `Shipping lookup failed (${res.status})`
        );
      }

      // Your backend currently returns:
      // {
      //   "totalBasePrice": 16.6,
      //   "rates": [...]
      // }
      const amount =
        typeof data.totalBasePrice === "number"
          ? data.totalBasePrice
          : Number(data.totalBasePrice);

      if (!amount || Number.isNaN(amount)) {
        throw new Error("No valid shipping rate returned.");
      }

      setShippingRate(amount);
    } catch (err) {
      console.error("Shipping error:", err);
      setShippingRate(null);
      setShippingError(err.message || "Unable to calculate shipping.");
    } finally {
      setShippingLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ maxWidth: 400, margin: "0 auto" }}
      className="checkout-form"
    >
      <h2>Checkout</h2>

      {/* Display subtotal */}
      <div className="payment-form">
        <h3>Subtotal: ${subtotal.toFixed(2)}</h3>
        {shippingState === "OH" && (
          <h3>Ohio sales tax: ${(subtotal * 0.0725).toFixed(2)}</h3>
        )}

        {/* Collect customer details */}
        <label>
          ZIP code:
          <br />
          <input
            name="destinationZip"
            value={destinationZip}
            onChange={(e) => setDestinationZip(e.target.value)}
            required
          ></input>
        </label>

        {/* Calculate shipping */}
        <button
          type="button"
          className="calculate-shipping-button"
          onClick={handleCalculateShipping}
          disabled={shippingLoading || !destinationZip}
          style={{ marginTop: "10px" }}
        >
          {shippingLoading ? "Calculating..." : "Calculate Shipping"}
        </button>

        {shippingError && (
          <div className="inline-card-error" style={{ marginTop: "6px" }}>
            {shippingError}
          </div>
        )}

        {shippingRate != null && (
          <div className="shipping-summary" style={{ marginTop: "10px" }}>
            <div>Shipping: ${shippingRate.toFixed(2)}</div>
            <div>
              <strong>
                Estimated Total: $
                {(
                  subtotal +
                  (shippingState === "OH" ? subtotal * 0.0725 : 0) +
                  shippingRate
                ).toFixed(2)}
              </strong>
            </div>
          </div>
        )}

        <label className="payment-form-input">
          Name:
          <br />
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label className="payment-form-input">
          Email:
          <br />
          <input
            name="email"
            type="email"
            value={email}
            onChange={(e) => {
              const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              setIsEmailValid(regex.test(e.target.value));
              setEmail(e.target.value);
            }}
            required
          />
        </label>
        {!isEmailValid && email.length > 0 && (
          <div className="inline-invalid-email">
            Please enter a valid email address.
          </div>
        )}
        <br />
      </div>

      {/* Stripe CardElement for secure card input */}
      <div className="card-element">
        <CardElement
          className="StripeElement"
          options={CARD_ELEMENT_OPTIONS}
          onChange={(e) => {
            console.log("Complete: ", e.complete, "Error: ", e.error);
            setIsCardComplete(e.complete);
            setCardError(e.error ? e.error.message : null);
          }}
        />
        {cardError && <div className="inline-card-error">{cardError}</div>}
      </div>

      {/* Display Stripe or network errors */}
      {error && <div style={{ color: "red" }}>{error}</div>}

      {/* Payment button */}
      <div
        className={
          cartItems.length === 0
            ? "cart-modal-pay-button empty"
            : "cart-modal-pay-button"
        }
      >
        <button
          type="submit"
          disabled={
            !stripe ||
            !isCardComplete ||
            processing ||
            succeeded ||
            !name.trim() ||
            !email.trim() ||
            !isEmailValid ||
            shippingRate == null
          }
        >
          {processing ? "Processing..." : succeeded ? "Paid!" : "Pay"}
        </button>
        <div className="clear-cart-button-container">
          <ClearCartButton />
        </div>
      </div>
    </form>
  );
}
