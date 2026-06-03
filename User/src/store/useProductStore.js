import { create } from "zustand";
import useApiStore from "../store/others";
import useCategoryStore from "./Usecategorystore";
const API = useApiStore.getState().API;
// const API = "http://localhost:3000/api";

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
  if (index === 0) return "TRENDING #1";
  if (product.isBestSeller) return "BEST SELLER";
  if (product.isNewArrival) return "NEW ARRIVAL";
  if (product.isFeatured) return "EDITORS' PICK";
  if (product.totalStock <= (product.lowStockThreshold ?? 5)) return "LIMITED";
  return "TRENDING";
}

export function getTag(product) {
  const sold = product.totalSold ?? 0;
  if (sold > 150) return "🔥 Hot";
  if (sold > 50) return "⚡ Rising";
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
  trending: [],
  trendingLoading: false,
  trendingError: null,
  trendingFetchedAt: null,

  /* ── New Arrivals ── */
  newArrivals: [],
  newArrivalsLoading: false,
  newArrivalsError: null,
  newArrivalsFetchedAt: null,

  /* ── Featured ── */
  featured: [],
  featuredLoading: false,
  featuredError: null,
  featuredFetchedAt: null,

  /* ── Combined Landing Data ── */
  landingPageLoading: false,
  landingPageError: null,
  landingPageFetchedAt: null,
  landingCategories: [],
  _landingPagePromise: null,

  /* ── Search ── */
  searchResults: [],
  searchLoading: false,
  searchError: null,
  searchQuery: "",      // last query that was fetched
  searchTotal: 0,       // total count from server (for pagination later)

  /* ─── INTERNAL fetch helper (for trending / arrivals / featured) ─── */
  _fetch: async (endpoint, stateKey, { force = false } = {}) => {
    const loadingKey = `${stateKey}Loading`;
    const errorKey = `${stateKey}Error`;
    const fetchedAtKey = `${stateKey}FetchedAt`;

    const state = get();
    if (state[loadingKey] || (!force && state.landingPageLoading)) return;
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
      console.log("res-->", data);

      const products = Array.isArray(data) ? data : (data.products ?? []);

      set({
        [stateKey]: products,
        [loadingKey]: false,
        [errorKey]: null,
        [fetchedAtKey]: Date.now(),
      });
    } catch (err) {
      set({ [loadingKey]: false, [errorKey]: err.message });
    }
  },

  fetchLandingPageData: async ({ force = false } = {}) => {
    const state = get();

    if (state._landingPagePromise) return state._landingPagePromise;

    // Check if we have cached data in localStorage to hydrate the UI instantly (SWR pattern)
    let hasCache = false;
    try {
      const cached = localStorage.getItem("luxuria_landing_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.trending?.length || parsed.newArrivals?.length || parsed.categories?.length)) {
          hasCache = true;
          set({
            trending: parsed.trending || [],
            newArrivals: parsed.newArrivals || [],
            featured: parsed.featured || [],
            landingCategories: parsed.categories || [],
            landingPageLoading: false,
            trendingLoading: false,
            newArrivalsLoading: false,
            featuredLoading: false,
          });
        }
      }
    } catch (e) {
      console.warn("⚠️ Failed to read landing cache:", e);
    }

    // Cache check (5 min) - if fresh and not forced, return immediately
    if (!force && state.landingPageFetchedAt && Date.now() - state.landingPageFetchedAt < 5 * 60 * 1000) {
      return;
    }

    // Set loading flags if no cache exists, to show skeletons
    if (!hasCache) {
      set({
        landingPageLoading: true,
        trendingLoading: true,
        newArrivalsLoading: true,
        featuredLoading: true,
        landingPageError: null,
        trendingError: null,
        newArrivalsError: null,
        featuredError: null,
      });
    }

    const landingPromise = (async () => {
      try {
        // Fetch everything in one optimized request from the backend
        const res = await fetch(`${API}/products/landing-page`, {
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          throw new Error(`Server error ${res.status}`);
        }

        const data = await res.json();

        // Update category store
        if (data.categories) {
          useCategoryStore.getState().setCategories(data.categories);
        }

        // Update product store with fresh data
        set({
          trending: data.trending || [],
          newArrivals: data.newArrivals || [],
          featured: data.featured || [],
          landingCategories: data.categories || [],
          landingPageLoading: false,
          landingPageFetchedAt: Date.now(),
          trendingLoading: false,
          newArrivalsLoading: false,
          featuredLoading: false,
          trendingFetchedAt: Date.now(),
          newArrivalsFetchedAt: Date.now(),
          featuredFetchedAt: Date.now(),
          trendingError: null,
          newArrivalsError: null,
          featuredError: null,
          landingPageError: null,
        });

        // Cache for next load (localStorage)
        try {
          localStorage.setItem("luxuria_landing_cache", JSON.stringify({
            trending: data.trending || [],
            newArrivals: data.newArrivals || [],
            featured: data.featured || [],
            categories: data.categories || []
          }));
          console.log("💾 Cache saved after optimized fetch.");
        } catch (e) {
          console.warn("⚠️ Failed to write cache:", e);
        }
      } catch (err) {
        set({
          landingPageLoading: false,
          trendingLoading: false,
          newArrivalsLoading: false,
          featuredLoading: false,
          landingPageError: err.message || "Failed to load landing page data",
          trendingError: err.message,
          newArrivalsError: err.message,
          featuredError: err.message,
        });
      }
    })();

    set({ _landingPagePromise: landingPromise });
    await landingPromise;
    set({ _landingPagePromise: null });
  },



fetchSearchResults: async (query) => {
  const q = (query || "").trim();
  if (get().searchQuery === q && get().searchResults.length > 0) return;

  set({ searchLoading: true, searchError: null, searchQuery: q });

  try {
    const params = new URLSearchParams();
    if (q) params.set("q", q);

    const res = await fetch(`${API}/products/search?${params.toString()}`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Server error ${res.status}`);
    }

    const data = await res.json();
    const products = Array.isArray(data) ? data : (data.products ?? []);
    const total = data.total ?? products.length;

    set({ searchResults: products, searchTotal: total, searchLoading: false });
  } catch (err) {
    set({ searchLoading: false, searchError: err.message });
  }
},
  clearSearch: () => set({ searchResults: [], searchQuery: "", searchTotal: 0, searchError: null }),

  fetchTrending: (opts) => get()._fetch("best-sellers", "trending", opts),
  fetchNewArrivals: (opts) => get()._fetch("new-arrivals", "newArrivals", opts),
  fetchFeatured: (opts) => get()._fetch("featured", "featured", opts),

  refreshTrending: () => get().fetchTrending({ force: true }),
  refreshNewArrivals: () => get().fetchNewArrivals({ force: true }),
  refreshFeatured: () => get().fetchFeatured({ force: true }),
}));

export default useProductStore;