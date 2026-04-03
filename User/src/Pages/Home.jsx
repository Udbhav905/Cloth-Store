import { lazy, Suspense } from "react";

// ── HeroSection loads eagerly — it's above the fold, user sees it first ──
import HeroSection from "../Components/Herosection/Herosection";

// ── Everything else loads lazily ──
const CategoryShowcase = lazy(() => import("../Components/CategoryShowcase/CategoryShowcase"));
const Trending         = lazy(() => import("../Components/Trending/Trending"));
const NewArrivals      = lazy(() => import("../Components/Newarrivals/Newarrivals"));
const ShopByCategory   = lazy(() => import("../Components/ShopByCategory/ShopByCategory"));
const Footer           = lazy(() => import("../Components/Footer/Footer"));

// ── Lightweight section placeholder while a section loads ──
function SectionSkeleton({ height = "400px" }) {
  return (
    <div style={{
      width: "100%",
      height,
      background: "linear-gradient(90deg, #181612 0%, #211f1b 50%, #181612 100%)",
      backgroundSize: "600px 100%",
      animation: "shimmer 1.6s linear infinite",
    }}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
      `}</style>
    </div>
  );
}

const Home = () => {
  return (
    <>
      {/* Hero — eager, no Suspense needed */}
      <HeroSection />

      {/* All below-fold sections are now lazy */}
      <Suspense fallback={<SectionSkeleton height="480px" />}>
        <CategoryShowcase />
      </Suspense>
      
      <Suspense fallback={<SectionSkeleton height="500px" />}>
        <Trending />
      </Suspense>

      <Suspense fallback={<SectionSkeleton height="480px" />}>
        <NewArrivals />
      </Suspense>

      <Suspense fallback={<SectionSkeleton height="360px" />}>
        <ShopByCategory />
      </Suspense>

      <Suspense fallback={<SectionSkeleton height="300px" />}>
        <Footer />
      </Suspense>
    </>
  );
};

export default Home;