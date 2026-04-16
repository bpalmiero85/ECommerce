import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import AdminPage from "./pages/AdminPage.jsx";
import HomePage from "./pages/ShopPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";

import { CartProvider } from "./contexts/CartContext.jsx";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
function App() {
  return (
    <Elements stripe={stripePromise}>
      <Routes>
        <Route path={`/${process.env.REACT_APP_ADMIN_PATH}`} element={<AdminPage />} />
        <Route path={`/${process.env.REACT_APP_ADMIN_ORDERS_PATH}`} element={<OrdersPage />} />
        <Route path="/all" element={<HomePage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
      </Routes>
    </Elements>
  );
}

const AppWrapper = () => {
  return (
    <Router>
      <CartProvider>
        <App />
      </CartProvider>
    </Router>
  );
};

export default AppWrapper;
