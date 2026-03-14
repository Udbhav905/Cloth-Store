import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// ── Always eager — needed on every page ──────────────────────────────────────
import Navbar from "./Components/Navbar/Navbar";
import AuthModal from "./Components/Authmodal/Authmodal";

// ── Eager pages ─────────────────────────────────────────────────────────────
import SearchPage from "./Pages/SearchPage";
import Collections from "./Pages/Collections";
import Wishlist from "./Pages/Wishlist";
import ProfilePage from "./Pages/Profile";

// ── Checkout flow ───────────────────────────────────────────────────────────
import Checkout from "./Components/Checkout/Checkout";
import PaymentPage from "./Pages/Paymentpage";
import OrderSuccess from "./Pages/Ordersuccess";

// ── Lazy pages ──────────────────────────────────────────────────────────────
const Home = lazy(() => import("./Pages/Home"));
const CategoryPage = lazy(() => import("./Pages/CategoryPage"));
const ProductDetail = lazy(() =>
  import("./Components/ProductDetail/ProductDetail")
);
const Cart = lazy(() => import("./Pages/Cart"));

// ── Stripe ──────────────────────────────────────────────────────────────────
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import MyOrders from "./Pages/MyOrders";

// IMPORTANT: create stripe promise OUTSIDE component
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// ── Loading Skeleton ────────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f0e0c",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          border: "2px solid rgba(201,168,76,.2)",
          borderTopColor: "#c9a84c",
          borderRadius: "50%",
          animation: "spin .8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── App Component ───────────────────────────────────────────────────────────
const App = () => {
  return (
    <BrowserRouter>
      {/* Global UI */}
      <Navbar />
      <AuthModal />

      <Suspense fallback={<PageSkeleton />}>
        <Routes>

          {/* Core Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/collections/:slug" element={<CategoryPage />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />

          {/* User Pages */}
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/my-orders" element={<MyOrders />} />

          {/* Checkout */}
          <Route path="/checkout" element={<Checkout />} />

          {/* Stripe Payment */}
          <Route
            path="/checkout/payment"
            element={
              <Elements stripe={stripePromise}>
                <PaymentPage />
              </Elements>
            }
          />

          {/* Success */}
          <Route path="/order-success" element={<OrderSuccess />} />

        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;