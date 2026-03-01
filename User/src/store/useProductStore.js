import { create } from "zustand";

const API = "http://localhost:3000/api";

/* ─────────────────────────────────────────────────
   PRICE HELPERS  — match your Product schema virtuals
─────────────────────────────────────────────────── */
export function calcFinalPrice(product) {
  const base = product.basePrice ?? 0;
  if (product.discountType === "percentage" && product.discountValue > 0) {
    return base - (base * product.discountValue) / 100;
  }
  if (product.discountType === "fixed" && product.discountValue > 0) {
    return Math.max(0, base - product.discountValue);
  }
  return base;
}

export function formatPrice(num) {
  if (num == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

export function hasDiscount(product) {
  return (
    product.discountType !== "none" &&
    product.discountValue > 0
  );
}

/* ─────────────────────────────────────────────────
   TRENDING / BADGE helpers
─────────────────────────────────────────────────── */
export function getBadge(product, index) {
  if (index === 0)              return "TRENDING #1";
  if (product.isBestSeller)     return "BEST SELLER";
  if (product.isNewArrival)     return "NEW ARRIVAL";
  if (product.isFeatured)       return "EDITORS' PICK";
  if (product.totalStock <= (product.lowStockThreshold ?? 5)) return "LIMITED";
  return "TRENDING";
}

export function getTag(product) {
  const sold = product.totalSold ?? 0;
  if (sold > 150) return "🔥 Hot";
  if (sold > 50)  return "⚡ Rising";
  return "✦ Exclusive";
}

export function getSoldText(product) {
  const sold = product.totalSold ?? 0;
  if (product.totalStock <= (product.lowStockThreshold ?? 5) && product.totalStock > 0) {
    return `Only ${product.totalStock} left`;
  }
  if (sold > 0) return `${sold} sold this week`;
  return "New Arrival";
}

/* ─────────────────────────────────────────────────
   ZUSTAND STORE
─────────────────────────────────────────────────── */
const useProductStore = create((set, get) => ({
  /* ── Trending (best sellers) ── */
  trending:        [],
  trendingLoading: false,
  trendingError:   null,
  trendingFetchedAt: null,

  /* ── New Arrivals ── */
  newArrivals:        [],
  newArrivalsLoading: false,
  newArrivalsError:   null,
  newArrivalsFetchedAt: null,

  /* ── Featured ── */
  featured:        [],
  featuredLoading: false,
  featuredError:   null,
  featuredFetchedAt: null,

  /* ─── INTERNAL fetch helper ─── */
  _fetch: async (endpoint, stateKey, { force = false } = {}) => {
    const loadingKey   = `${stateKey}Loading`;
    const errorKey     = `${stateKey}Error`;
    const fetchedAtKey = `${stateKey}FetchedAt`;

    const state = get();
    if (state[loadingKey]) return;
    if (
      !force &&
      state[fetchedAtKey] &&
      Date.now() - state[fetchedAtKey] < 5 * 60 * 1000
    ) return;

    set({ [loadingKey]: true, [errorKey]: null });

    try {
      const res = await fetch(`${API}/products/${endpoint}`, {
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Server error ${res.status}`);
      }

      const data = await res.json();
      // Your controller returns a plain array for these endpoints
      const products = Array.isArray(data) ? data : (data.products ?? []);

      set({
        [stateKey]:      products,
        [loadingKey]:    false,
        [errorKey]:      null,
        [fetchedAtKey]:  Date.now(),
      });
    } catch (err) {
      set({ [loadingKey]: false, [errorKey]: err.message });
    }
  },

  /* ── Public actions ── */
  fetchTrending:    (opts) => get()._fetch("best-sellers",  "trending",    opts),
  fetchNewArrivals: (opts) => get()._fetch("new-arrivals",  "newArrivals", opts),
  fetchFeatured:    (opts) => get()._fetch("featured",      "featured",    opts),

  refreshTrending:    () => get().fetchTrending({ force: true }),
  refreshNewArrivals: () => get().fetchNewArrivals({ force: true }),
  refreshFeatured:    () => get().fetchFeatured({ force: true }),
}));

export default useProductStore;