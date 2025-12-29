import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import AdminPage from "./pages/AdminPage.jsx";
import HomePage from "./pages/ShopPage.jsx";
import ProductPage from "./pages/ProductPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import FeaturedProductsPage from "./pages/FeaturedProductsPage.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";

import { CartProvider } from "./contexts/CartContext.jsx";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
function App() {
  return (
    <Elements stripe={stripePromise}>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/shop" element={<HomePage />} />
        <Route path="/products" element={<ProductPage />} />
        <Route path="/cart" element={<CheckoutPage />} />
        <Route path="/featured" element={<FeaturedProductsPage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/admin-orders" element={<OrdersPage />} />
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
