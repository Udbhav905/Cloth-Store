import React, { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Lenis from "@studio-freight/lenis";

// Styles
import styles from "./App.module.css";

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
const ProductDetail = lazy(
  () => import("./Components/ProductDetail/ProductDetail"),
);
const Cart = lazy(() => import("./Pages/Cart"));

// ── Stripe ──────────────────────────────────────────────────────────────────
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import MyOrders from "./Pages/MyOrders";
import ProtectedRoute from "./Components/ProtectedRoute";

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

// ── Smooth Scroll Wrapper with Optimized Settings for Quick Clicks ──────────
function ScrollProvider({ children }) {
  const { pathname } = useLocation();

  useEffect(() => {
    // Initialize Lenis with OPTIMIZED settings for better click responsiveness
    const lenis = new Lenis({
      duration: 0.4, // Reduced from 1.2 to 0.8 for faster response
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -8 * t)), // Faster easing
      direction: "vertical",
      gestureDirection: "vertical",
      smooth: true,
      smoothTouch: false,
      touchMultiplier: 0.9, // Reduced for better touch response
      wheelMultiplier: 0.5, // Reduced for better wheel response
      infinite: false,
      orientation: "vertical",
      // IMPORTANT: These settings prevent scroll from blocking clicks
      syncTouch: true,
    });

    // RAF loop for smooth scroll
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Scroll to top on route change with faster animation
    setTimeout(() => {
      lenis.scrollTo(0, { 
        immediate: false,
        duration: 0.6, // Faster scroll to top
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -8 * t))
      });
    }, 50); // Reduced delay from 100 to 50

    // Don't stop scroll on any elements - let clicks work normally
    // This ensures all click interactions are responsive
    
    return () => {
      lenis.destroy();
    };
  }, [pathname]);

  return <div className={styles.appContainer}>{children}</div>;
}

// ── Error Boundary for better UX ───────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorBoundary}>
          <div className={styles.errorContent}>
            <span className={styles.errorIcon}>◆</span>
            <h2>Something went wrong</h2>
            <p>Please refresh the page or try again later</p>
            <button 
              onClick={() => window.location.reload()}
              className={styles.errorButton}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Analytics Wrapper (optional - add your analytics) ─────────────────────
function AnalyticsProvider({ children }) {
  const location = useLocation();

  useEffect(() => {
    // Track page views
    console.log(`Page viewed: ${location.pathname}`);
    // You can add Google Analytics, Mixpanel, etc. here
    // Example: gtag('config', 'GA_MEASUREMENT_ID', { page_path: location.pathname });
  }, [location]);

  return <>{children}</>;
}

// ── Preload Links for Better Performance ───────────────────────────────────
function PreloadLinks() {
  useEffect(() => {
    // Preload critical resources
    const preloadImages = () => {
      const images = [
        '/assets/hero-bg.jpg',
        '/assets/logo.svg'
      ];
      
      images.forEach(img => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = img;
        document.head.appendChild(link);
      });
    };

    preloadImages();
  }, []);

  return null;
}

// ── 404 Not Found Component ────────────────────────────────────────────────
function NotFound() {
  const navigate = useNavigate();
  
  return (
    <div className={styles.notFound}>
      <div className={styles.notFoundContent}>
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <button onClick={() => navigate('/')} className={styles.notFoundButton}>
          Return to Home
        </button>
      </div>
    </div>
  );
}

// ── App Component ───────────────────────────────────────────────────────────
const App = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AnalyticsProvider>
          <ScrollProvider>
            <PreloadLinks />
            
            {/* Global UI */}
            <Navbar />
            <AuthModal />

            {/* Main Content */}
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                {/* Core Pages */}
                <Route path="/" element={<Home />} />
                <Route path="/collections" element={<Collections />} />
                <Route path="/collections/:slug" element={<CategoryPage />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                
                {/* Protected Routes */}
                <Route
                  path="/cart"
                  element={
                    <ProtectedRoute>
                      <Cart />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/wishlist"
                  element={
                    <ProtectedRoute>
                      <Wishlist />
                    </ProtectedRoute>
                  }
                />
                
                {/* User Pages */}
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/my-orders" element={<MyOrders />} />

                {/* Checkout Flow */}
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
                
                {/* 404 Fallback Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ScrollProvider>
        </AnalyticsProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;