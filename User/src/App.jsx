import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// ── Only Navbar & AuthModal load eagerly (needed on every page immediately) ──
import Navbar    from "./Components/Navbar/Navbar";
import AuthModal from "./Components/Authmodal/Authmodal";
import SearchPage from "./Pages/SearchPage";
import Collections from "./Pages/Collections";
import Wishlist from "./Pages/Wishlist";

// ── Every page/heavy component is lazy — only loads when route is visited ──
const Home          = lazy(() => import("./Pages/Home"));
const CategoryPage  = lazy(() => import("./Pages/CategoryPage"));
const ProductDetail = lazy(() => import("./Components/ProductDetail/ProductDetail"));
const Cart          = lazy(() => import("./Pages/Cart"));

// ── Commented-out pages — uncomment the import when you uncomment the route ──
// const Collections    = lazy(() => import("./Pages/Collections"));
// const CollectionDetail = lazy(() => import("./Pages/CollectionDetail"));
// const MyOrders       = lazy(() => import("./Pages/MyOrders"));
// const Wishlist       = lazy(() => import("./Pages/Wishlist"));
// const StyleProfile   = lazy(() => import("./Pages/StyleProfile"));
// const Settings       = lazy(() => import("./Pages/Settings"));
// const NotFound       = lazy(() => import("./Pages/NotFound"));

// ── Full-screen skeleton shown while any lazy page is loading ──
function PageSkeleton() {
  return (
    <div style={{
      minHeight: "80vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0f0e0c",
    }}>
      <div style={{
        width: 36,
        height: 36,
        border: "2px solid rgba(201,168,76,.2)",
        borderTopColor: "#c9a84c",
        borderRadius: "50%",
        animation: "spin .8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const App = () => {
  return (
    <BrowserRouter>
      {/* Navbar & AuthModal are eager — always visible, no delay */}
      <Navbar />
      <AuthModal />

      {/* Suspense wraps all routes — shows PageSkeleton during lazy load */}
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/"                  element={<Home />} />
          <Route path="/collections/" element={<Collections />} />
          <Route path="/collections/:slug" element={<CategoryPage />} />
          <Route path="/products/:id"      element={<ProductDetail />} />
          <Route path="/cart"              element={<Cart />} />
          <Route path="/wishlist"                  element={<Wishlist />} />
          <Route path="/search" element={<SearchPage />} />
          {/* Uncomment as you add pages: */}
          {/* <Route path="/collections"    element={<Collections />} /> */}
          {/* <Route path="/my-orders"      element={<MyOrders />} /> */}
          {/* <Route path="/wishlist"        element={<Wishlist />} /> */}
          {/* <Route path="/style-profile"   element={<StyleProfile />} /> */}
          {/* <Route path="/settings"        element={<Settings />} /> */}
          {/* <Route path="*"               element={<NotFound />} /> */}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;