import 'dotenv/config';
import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();

// 🔓 Allow requests from React dev server
app.use(
  cors({
    origin: "http://localhost:3000", // React app origin
  })
);

app.use(express.json());

app.post("/api/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency = "usd" } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({ amount, currency });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () =>
  console.log("✅ Payment endpoint listening on port 3001")
);