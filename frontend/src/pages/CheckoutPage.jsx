import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useState, useContext } from "react";
import { CartContext } from "../contexts/CartContext";
import "../styles/CheckoutPage.css";
import "../styles/ProductPage.css";

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
  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);

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

  // Stripe card state
  const [isCardComplete, setIsCardComplete] = useState(false);

  // Stripe card error
  const [cardError, setCardError] = useState(null);

  // Check validity of user email address
  const [isEmailValid, setIsEmailValid] = useState(false);

  // Store what state (location) the user resides in
  const [shippingState, setShippingState] = useState("");

  // Charge local state's sales tax if shipping locally
  const [isLocal, setIsLocal] = useState(false);

  // Sales tax ($0 for any state but local)
  const [salesTax, setSalesTax] = useState(0);

  // List of US States
  const STATES = [
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DE",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY",
  ];

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
         const total = subtotal + tax;

         const { clientSecret } = await fetch("/api/create-payment-intent", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            amount: Math.round(total * 100),
            state: shippingState,
          
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

  return (
    <form
      onSubmit={handleSubmit}
      style={{ maxWidth: 400, margin: "0 auto" }}
      className="checkout-form"
    >
      <h2>Checkout</h2>

      {/* Display subtotal and collect customer details */}
      <form className="payment-form">
        <h3>Subtotal: ${subtotal.toFixed(2)}</h3>
        {shippingState === "OH" && 
            <h3>Ohio sales tax: ${(subtotal * 0.0725).toFixed(2)}</h3>
        }
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
        <label htmlFor="state-select">State:</label>
        <select
          value={shippingState}
          onChange={(e) => setShippingState(e.target.value)}
        >
          {STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </form>

      {/* Stripe CardElement for secure card input */}
      <div style={{ margin: "20px 0" }} className="card-element">
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
      <div className="cart-modal-pay-button">
        <button
          type="submit"
          disabled={
            !stripe ||
            !isCardComplete ||
            processing ||
            succeeded ||
            !name.trim() ||
            !email.trim() ||
            !isEmailValid
          }
        >
          {processing ? "Processing..." : succeeded ? "Paid!" : "Pay"}
        </button>
      </div>
    </form>
  );
}
