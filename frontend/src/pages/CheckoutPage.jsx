import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useState, useContext, useEffect } from "react";
import { CartContext } from "../contexts/CartContext";
import ClearCartButton from "../components/ClearCartButton";
import "../styles/CheckoutPage.css";
import "../styles/ProductPage.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";
const PAYMENT_API_BASE =
  process.env.REACT_APP_PAYMENT_API_BASE || "http://localhost:3001";

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

export default function CheckoutPage({ onSuccess }) {
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
  const { cartItems, clearCartAfterPayment } = useContext(CartContext);
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
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");

  // Empty cart state
  // const [isEmpty, setIsEmpty] = useState(true);

  const [attemptedPay, setAttemptedPay] = useState(false);

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

  const [orderSaveError, setOrderSaveError] = useState(null);
  const [orderPayloadToRetry, setOrderPayloadToRetry] = useState(null);
  const [paidIntentId, setPaidIntentId] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const trimmed = destinationZip.trim();
    if (!trimmed) {
      setShippingRate(null);
      setShippingError(null);
      return;
    } else if (trimmed === null) {
      setShippingRate(null);
      setShippingError(null);
    } else if (!/^\d{5}(-\d{4})?$/.test(trimmed)) {
      setShippingRate(null);
      setShippingError(null);
      return;
    } else if (cartItems.length === 0) {
      setShippingRate(null);
      setShippingError("Your cart is empty.");
      return;
    }
    handleCalculateShipping();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinationZip, cartItems.length]);

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

  const saveOrder = async (payload) => {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.error || data?.message || `Saving order failed (${res.status})`
      );
    }
    return data;
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
    setAttemptedPay(true);
    setProcessing(true);

    try {
      const tax = shippingState === "OH" ? subtotal * 0.0725 : 0;
      const shipping = shippingRate || 0;
      const total = subtotal + tax + shipping;

      const piRes = await fetch(
        `${PAYMENT_API_BASE}/api/create-payment-intent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Math.round(total * 100),
            state: shippingState,
            shipping,
          }),
        }
      );

      const piData = await piRes.json().catch(() => ({}));
      if (!piRes.ok) {
        throw new Error(
          piData?.error || piData?.message || "Failed to start payment."
        );
      }

      const clientSecret = piData.clientSecret;

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: { name, email },
        },
      });

      if (result.error) {
        setError(result.error.message);
        return;
      }

      if (result.paymentIntent?.status !== "succeeded") {
        setError("Payment did not complete. Please try again.");
        return;
      }

      setError(null);

      const payload = {
        name,
        email,
        total: Number(total.toFixed(2)),
        status: "PAID",
        items: cartItems.map((it) => ({
          productId: it.id,
          productName: it.name,
          quantity: Number(it.qty ?? it.quantity ?? 1),
          unitPrice: Number(it.price),
        }))
      };

      setPaidIntentId(result.paymentIntent.id);
      setOrderPayloadToRetry(payload);
      setOrderSaveError(null);

      try {
        await saveOrder(payload);

        setSucceeded(true);
        clearCartAfterPayment();
        if (onSuccess) onSuccess();
      } catch (err) {
        console.error("Order save failed:", err);
        setOrderSaveError(err.message || "Failed to save order.");
        setSucceeded(false);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.message || "Payment failed. Please try again.");
    } finally {
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
      const body = {
        destinationZip: destinationZip,
        weightOunces: totalWeightOunces || 6,
        lengthInches: 4,
        widthInches: 3,
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

  const payDisabled =
    !stripe ||
    !isCardComplete ||
    processing ||
    succeeded ||
    !name.trim() ||
    !email.trim() ||
    !isEmailValid ||
    !addressLine1.trim() ||
    !city.trim() ||
    !destinationZip.trim() ||
    shippingRate == null;

  return cartItems.length === 0 ? (
    <div className="empty-cart-message">
      {succeeded ? "Thank you for your order!" : "Your cart is empty."}
    </div>
  ) : (
    <form
      onSubmit={handleSubmit}
      style={{ maxWidth: 400, margin: "0 auto" }}
      className="checkout-form"
    >
      {/* Display subtotal */}
      <div className="payment-form">
        <h3>Subtotal: ${subtotal.toFixed(2)}</h3>
        {shippingState === "OH" && (
          <h3>Ohio sales tax: ${(subtotal * 0.0725).toFixed(2)}</h3>
        )}

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
        {/* Collect customer details */}
        <label>
          Address line 1:
          <br />
          <input
            name="addressLine1"
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            required
          ></input>
        </label>
        <br />
        <label>
          Address line 2 (optional):
          <br />
          <input
            name="addressLine2"
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
          ></input>
        </label>
        <br />
        <label>
          City:
          <br />
          <input
            name="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          ></input>
        </label>
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
      {orderSaveError && (
        <div className="inline-card-error" style={{ marginTop: "10px" }}>
          <div>
            Payment succeeded, but saving the order failed: {orderSaveError}
          </div>

          <button
            type="button"
            style={{ marginTop: "8px" }}
            disabled={!orderPayloadToRetry || processing}
            onClick={async () => {
              try {
                setProcessing(true);
                setOrderSaveError(null);
                await saveOrder(orderPayloadToRetry);

                setSucceeded(true);
                clearCartAfterPayment();
                if (onSuccess) onSuccess();
              } catch (err) {
                setOrderSaveError(err.message || "Retry failed.");
              } finally {
                setProcessing(false);
              }
            }}
          >
            Retry saving order
          </button>
        </div>
      )}

      {/* Payment button */}
      <div
        className={
          cartItems.length === 0
            ? "cart-modal-pay-button empty"
            : "cart-modal-pay-button"
        }
        onClick={() => setAttemptedPay(true)}
      >
        <button type="submit" disabled={payDisabled}>
          {processing ? "Processing..." : succeeded ? "Paid!" : "Pay"}
        </button>

        {attemptedPay && payDisabled && (
          <div className="inline-card-error" style={{ marginTop: "8px" }}>
            {!email.trim()
              ? "Email is required."
              : !isEmailValid
              ? "Please enter a valid email address."
              : !name.trim()
              ? "Name is required."
              : !addressLine1
              ? "Address line 1 is required"
              : !city.trim()
              ? "City is required."
              : !destinationZip.trim()
              ? "ZIP code is required."
              : shippingRate == null
              ? "Please enter a valid ZIP code to calculate shipping."
              : !isCardComplete
              ? "Please complete your card details."
              : "Please complete the form above."}
          </div>
        )}

        <div className="clear-cart-button-container">
          <ClearCartButton />
        </div>
      </div>
    </form>
  );
}
