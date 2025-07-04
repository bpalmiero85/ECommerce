import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState } from 'react';

export default function CheckoutPage() {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    // 1) Hit your backend to create a PaymentIntent
    const { clientSecret } = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount:{} /* price-in-cents from your cart/state */
      }),
    }).then((r) => r.json());

    // 2) Confirm the payment on the client
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name:{}, /* customer name from your form state */
          email:{} /* customer email from your form state */
        },
      },
    });

    if (result.error) {
      setError(result.error.message);
      setProcessing(false);
    } else if (result.paymentIntent.status === 'succeeded') {
      setError(null);
      setProcessing(false);
      setSucceeded(true);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '0 auto' }}>
      <h2>Checkout</h2>

      {/* Collect any other details you need (name, email, etc) */}
      <div>
        <label>
          Name
          <input name="name" required />
        </label>
      </div>

      <div style={{ margin: '20px 0' }}>
        <CardElement options={{ hidePostalCode: true }} />
      </div>

      {error && <div style={{ color: 'red' }}>{error}</div>}

      <button type="submit" disabled={!stripe || processing || succeeded}>
        {processing ? 'Processing...' : succeeded ? 'Paid!' : 'Pay'}
      </button>
    </form>
  );
}
