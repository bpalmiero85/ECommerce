import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useState, useContext, useEffect, useRef } from "react";
import { CartContext } from "../contexts/CartContext";
import { API_BASE_URL, PAYMENT_API_BASE_URL } from "../config/api";
import ClearCartButton from "../components/ClearCartButton";
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

  const shippingDebounceRef = useRef(null);

  // Access the shopping cart context to calculate subtotal.
  const { cartItems, clearCartAfterPayment } = useContext(CartContext);
  const subtotal = cartItems.reduce(
    (sum, item) =>
      sum +
      (Number(item.price) || 0) * (Number(item.qty ?? item.quantity ?? 1) || 0),
    0,
  );

  // TODO: replace this with real product weights later.

  const totalWeightOunces = cartItems.reduce(
    (sum, item) => sum + 8 * (Number(item.qty ?? item.quantity ?? 1) || 0),
    0,
  );

  // Shippo Shipping
  const [shippingCheapest, setShippingCheapest] = useState(null);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedRateId, setSelectedRateId] = useState(null);
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

  // store order information to display to customer
  const [savedOrder, setSavedOrder] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const trimmed = destinationZip.trim();
    if (!trimmed) {
      setShippingRate(null);
      setShippingError(null);
      setShippingOptions([]);
      setSelectedRateId(null);
      setShippingCheapest(null);
      return;
    } else if (!/^\d{5}(-\d{4})?$/.test(trimmed)) {
      setShippingRate(null);
      setShippingError(null);
      setShippingOptions([]);
      setSelectedRateId(null);
      setShippingCheapest(null);
      return;
    }

    if (cartItems.length === 0) {
      setShippingRate(null);
      setShippingError("Your cart is empty.");
      setShippingOptions([]);
      setSelectedRateId(null);
      setShippingCheapest(null);
      return;
    }

    if (shippingDebounceRef.current) {
      clearTimeout(shippingDebounceRef.current);
    }

    shippingDebounceRef.current = setTimeout(() => {
      handleCalculateShipping();
    }, 300);

    return () => {
      if (shippingDebounceRef.current) {
        clearTimeout(shippingDebounceRef.current);
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinationZip, totalWeightOunces, addressLine1, addressLine2, city]);

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
    const res = await fetch(`${API_BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const rawText = await res.text();
    let data = {};

    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {}

    if (!res.ok) {
      console.error("saveOrder failed:", {
        status: res.status,
        rawText,
        data,
        payloadSent: payload,
      });
      throw new Error(
        data?.error || rawText || `Saving order failed (${res.status})`,
      );
    }
    return data;
  };

  const submitLockRef = useRef(false);

  /**
   * Handles the form submission to process the payment.
   * 1. Calls the backend to create a PaymentIntent and retrieve clientSecret.
   * 2. Uses Stripe's confirmCardPayment to finalize the payment.
   *
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitLockRef.current) return;
    submitLockRef.current = true;

    setAttemptedPay(true);
    setProcessing(true);

    try {
      // ✅ Single source of truth: compute from current inputs (no async state timing)
      const stateNow = inferStateFromZip(destinationZip);

      const taxTotal =
        stateNow === "OH" ? Number((subtotal * 0.0725).toFixed(2)) : 0;

      const shippingTotal =
        shippingRate != null ? Number(Number(shippingRate).toFixed(2)) : 0;

      const discountTotal = 0;

      const total = Number(
        (subtotal + taxTotal + shippingTotal - discountTotal).toFixed(2),
      );

      console.log("TOTALS:", {
        subtotal,
        stateNow,
        taxTotal,
        shippingTotal,
        discountTotal,
        total,
      });

      // ✅ Use the SAME values for Stripe
      const piRes = await fetch(
        `${PAYMENT_API_BASE_URL}/api/create-payment-intent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Math.round(total * 100),
            state: stateNow,
            shipping: shippingTotal,
          }),
        },
      );
      const piData = await piRes.json().catch(() => ({}));
      if (!piRes.ok) {
        throw new Error(
          piData?.error || piData?.message || "Failed to start payment.",
        );
      }

      if (!piData?.clientSecret) throw new Error("No client secret returned.");

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
        shippingAddress1: addressLine1,
        shippingAddress2: addressLine2,
        shippingCity: city,
        shippingState: inferStateFromZip(destinationZip),
        shippingZip: destinationZip,
        paymentIntentId: paidIntentId,
        status: "PAID",
        shippingTotal,
        taxTotal,
        discountTotal,
        total: Number(total.toFixed(2)),

        items: cartItems.map((it) => ({
          productId: it.id,
          productName: it.name,
          quantity: Number(it.qty ?? it.quantity ?? 1),
          unitPrice: Number(it.price),
        })),
      };

      console.log("SENDING ORDER PAYLOAD:", payload);

      setPaidIntentId(result.paymentIntent.id);
      setOrderPayloadToRetry(payload);
      setOrderSaveError(null);

      try {
        console.log("Attempting to save order with payload:", payload);
        console.log("payload keys:", Object.keys(payload));
        console.log("payload json:", JSON.stringify(payload));
        console.log("totals check:", {
          shippingTotal,
          taxTotal,
          discountTotal,
          total,
        });
        const createdOrder = await saveOrder(payload);
        console.log("createdOrder response:", createdOrder);

        const resolvedEmail = String(
          createdOrder?.orderEmail || payload.email || email || "",
        ).trim();

        const resolvedName = String(
          createdOrder?.orderName || payload.name || name || "",
        ).trim();

        const resolvedTotal = Number(
          createdOrder?.orderTotal ?? payload.total ?? 0,
        );

        const normalizedOrder = {
          ...createdOrder,
          orderEmail: resolvedEmail,
          orderName: resolvedName,
          orderTotal: resolvedTotal,
        };

        setSavedOrder(normalizedOrder);

        try {
          await fetch(
            `${API_BASE_URL}/api/orders/${normalizedOrder.orderId}/send-confirmation`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
            },
          );
        } catch (emailErr) {
          console.error("EmailJS failed:", emailErr);
          console.error("EmailJS details:", emailErr?.status, emailErr?.text);
        }

        setSucceeded(true);
        clearCartAfterPayment();
        if (onSuccess) onSuccess();
      } catch (err) {
        console.error("Post-payment step failed:", err);
        setOrderSaveError(
          err?.text || err?.message || "Post-payment step failed.",
        );
        setSucceeded(false);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
      submitLockRef.current = false;
    }
  };

  const getShipScheduleNote = () => {
    const day = new Date().getDay();

    if (day === 5 || day === 6 || day === 0) {
      return "All orders ship next business day. Orders placed Fri and Sat ship Monday (next business day) unless it's a holiday.";
    }
    return "Orders ship next business day.";
  };

  const handleCalculateShipping = async () => {
    setShippingError(null);

    const zip = destinationZip.trim();
    if (!zip || !/^\d{5}(-\d{4})?$/.test(zip)) {
      setShippingError("Please enter a valid ZIP code.");
      return;
    }
    if (cartItems.length === 0) {
      setShippingError("Your cart is empty.");
      return;
    }

    const stateNow = inferStateFromZip(zip);
    setShippingState(stateNow);
    setShippingLoading(true);

    try {
      const body = {
        toName: name,
        toStreet1: addressLine1,
        toStreet2: addressLine2 || "",
        toCity: city,
        toState: stateNow || "OH",
        toZip: zip,
        weightOunces: totalWeightOunces || 6,
        lengthInches: 4,
        widthInches: 3,
        heightInches: 4,
      };

      const res = await fetch(`${API_BASE_URL}/api/shipping/quote`, {
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
            `Shipping lookup failed (${res.status})`,
        );
      }

      const amount = Number(data?.cheapest?.amount);

      if (!amount || Number.isNaN(amount)) {
        throw new Error("No valid shipping rate returned.");
      }
      const cheapest = data?.cheapest || null;
      setShippingOptions(data?.options || []);
      setShippingCheapest(cheapest);
      setSelectedRateId(cheapest?.object_id || null);
      setShippingRate(cheapest ? Number(cheapest.amount) : null);
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
    <div className={`empty-cart-message ${succeeded ? "success" : ""}`}>
      {succeeded ? (
        <>
          <div style={{ fontSize: "2rem" }}>
            <h2 className="thank-you">Thank you for your order! 🖤✨</h2>

            {savedOrder?.orderId && (
              <div
                style={{
                  fontSize: "1.6rem",
                  marginTop: 20,
                  position: "relative",
                }}
              >
                <h3 className="thank-you">
                  <strong>Order #:</strong>
                </h3>{" "}
                {savedOrder.orderId}
              </div>
            )}

            {savedOrder?.orderEmail && (
              <div
                style={{
                  fontSize: "1.6rem",
                  marginTop: 25,
                  position: "relative",
                }}
              >
                <p className="thank-you">
                  &hearts;We sent a confirmation email to{" "}
                  <strong>{savedOrder.orderEmail}</strong>&hearts;
                </p>
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: 30,
              fontSize: "1.3rem",
              opacity: 0.95,
              position: "relative",
            }}
          >
            <p className="thank-you">
              (If you don&apos;t see it, check spam/promotions)
            </p>
          </div>
        </>
      ) : (
        "Your cart is empty."
      )}
    </div>
  ) : (
    <>
      <div className="checkout-header">Checkout</div>
      <div className="checkout-form">
        <form onSubmit={handleSubmit}>
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

            {shippingOptions.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                  Choose shipping (defaults to least expensive):
                </div>

                <select
                  className="shipping-options"
                  value={selectedRateId || ""}
                  onChange={(e) => {
                    const rateId = e.target.value;
                    setSelectedRateId(rateId);

                    const chosen =
                      shippingOptions.find((o) => o.object_id === rateId) ||
                      null;

                    if (chosen) {
                      setShippingRate(Number(chosen.amount));
                      setShippingCheapest(chosen);
                    } else {
                      setShippingRate(null);
                      setShippingCheapest(null);
                    }
                  }}
                >
                  <option value="" disabled>
                    -- choose shipping --
                  </option>

                  {shippingOptions.map((opt) => {
                    const service =
                      opt?.servicelevel?.display_name ||
                      opt?.servicelevel?.name ||
                      "Shipping";

                    const days =
                      opt.estimated_days != null
                        ? ` (${opt.estimated_days}d est)`
                        : "";

                    const label = `${service} • $${Number(opt.amount).toFixed(2)}${days}`;

                    return (
                      <option key={opt.object_id} value={opt.object_id}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {shippingRate != null && (
              <div className="shipping-summary">
                <div style={{ fontSize: "0.95rem", opacity: 0.95 }}>
                  <strong>Shipping:</strong> ${shippingRate.toFixed(2)}
                  {shippingCheapest?.servicelevel && (
                    <>
                      {" "}
                      •{" "}
                      {shippingCheapest.servicelevel.display_name ||
                        shippingCheapest.servicelevel.name}
                    </>
                  )}
                  {shippingCheapest?.estimated_days != null && (
                    <>
                      {" "}
                      • about {shippingCheapest.estimated_days}d (plus 1 day for
                      handling)
                    </>
                  )}
                </div>

                <div
                  style={{ marginTop: 6, fontSize: "0.85rem", opacity: 0.85 }}
                >
                  {getShipScheduleNote()}
                </div>

                <div style={{ marginTop: 6 }}>
                  <h3>
                    <strong>
                      Estimated Total: $
                      {(
                        subtotal +
                        (shippingState === "OH" ? subtotal * 0.0725 : 0) +
                        shippingRate
                      ).toFixed(2)}
                    </strong>
                  </h3>
                </div>
              </div>
            )}

            {/* ✅ Keep these inputs INSIDE payment-form */}
            <label className="payment-form-input">
              Name:
              <input
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            <label className="payment-form-input">
              Email:
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

            <label>
              Address line 1:
              <input
                name="addressLine1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                required
              />
            </label>

            <label>
              Address line 2 (optional):
              <input
                name="addressLine2"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
              />
            </label>

            <label>
              City:
              <input
                name="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </label>

            <label>
              ZIP code:
              <input
                name="destinationZip"
                className="payment-form-input"
                value={destinationZip}
                onChange={(e) => setDestinationZip(e.target.value)}
                required
              />
            </label>
          </div>

          {/* Stripe CardElement for secure card input */}
          <div className="card-element">
            <label>
              Card #:
              <CardElement
                className="StripeElement"
                options={CARD_ELEMENT_OPTIONS}
                onChange={(e) => {
                  console.log("Complete: ", e.complete, "Error: ", e.error);
                  setIsCardComplete(e.complete);
                  setCardError(e.error ? e.error.message : null);
                }}
              />
              {cardError && (
                <div className="inline-card-error">{cardError}</div>
              )}
            </label>
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

                    const createdOrder = await saveOrder(orderPayloadToRetry);

                    const resolvedEmail = String(
                      createdOrder?.orderEmail ||
                        orderPayloadToRetry.email ||
                        email ||
                        "",
                    ).trim();

                    const resolvedName = String(
                      createdOrder?.orderName ||
                        orderPayloadToRetry.name ||
                        name ||
                        "",
                    ).trim();

                    const resolvedTotal = Number(
                      createdOrder?.orderTotal ??
                        orderPayloadToRetry.total ??
                        0,
                    );

                    const normalizedOrder = {
                      ...createdOrder,
                      orderEmail: resolvedEmail,
                      orderName: resolvedName,
                      orderTotal: resolvedTotal,
                    };

                    setSavedOrder(normalizedOrder);

                    try {
                      await fetch(
                        `${API_BASE_URL}/api/orders/${normalizedOrder.orderId}/send-confirmation`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                        },
                      );
                    } catch (emailErr) {
                      console.error("Confirmation email failed:", emailErr);
                    }

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
          {/* Payment button */}
          <div
            className={
              cartItems.length === 0
                ? "cart-modal-pay-button empty"
                : "cart-modal-pay-button"
            }
            onClick={() => setAttemptedPay(true)}
          >
            <div className="checkout-actions">
              <button
                className="pay-button"
                type="submit"
                disabled={payDisabled}
              >
                {processing ? "Processing..." : succeeded ? "Paid!" : "Pay"}
              </button>

              <div className="clear-cart-button-container">
                <ClearCartButton />
              </div>
            </div>

            {attemptedPay && payDisabled && (
              <div className="inline-card-error" style={{ marginTop: "8px" }}>
                {/* unchanged */}
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
                                : !processing
                                  ? "Please complete the form above."
                                  : ""}
              </div>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
