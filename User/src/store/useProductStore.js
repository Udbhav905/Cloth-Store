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
  
  /* ── Combined Landing Data ── */
  landingPageLoading: false,
  landingPageError:   null,
  landingPageFetchedAt: null,
  landingCategories: [],
  _landingPagePromise: null,

  /* ── Search ── */
  searchResults:       [],
  searchLoading:       false,
  searchError:         null,
  searchQuery:         "",      // last query that was fetched
  searchTotal:         0,       // total count from server (for pagination later)

  /* ─── INTERNAL fetch helper (for trending / arrivals / featured) ─── */
  _fetch: async (endpoint, stateKey, { force = false } = {}) => {
    const loadingKey   = `${stateKey}Loading`;
    const errorKey     = `${stateKey}Error`;
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
        [stateKey]:      products,
        [loadingKey]:    false,
        [errorKey]:      null,
        [fetchedAtKey]:  Date.now(),
      });
    } catch (err) {
      set({ [loadingKey]: false, [errorKey]: err.message });
    }
  },

  fetchLandingPageData: async ({ force = false } = {}) => {
    const state = get();
    
    // Deduplicate concurrent requests
    if (state._landingPagePromise) return state._landingPagePromise;

    // Cache check (5 min)
    if (
      !force &&
      state.landingPageFetchedAt &&
      Date.now() - state.landingPageFetchedAt < 5 * 60 * 1000
    ) return;

    // Set loading states
    set({ 
      landingPageLoading: true, 
      landingPageError:   null,
      trendingLoading:    true,
      newArrivalsLoading: true,
      featuredLoading:    true,
      trendingError:      null,
      newArrivalsError:   null,
      featuredError:      null
    });

    const landingPromise = (async () => {
      try {
        console.log("🌐 Calling consolidated landing-page API...");
        const res = await fetch(`${API}/products/landing-page`, {
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          throw new Error(`Server returned ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        
        if (data.categories) {
          useCategoryStore.getState().setCategories(data.categories);
        }

        set({
          trending:             data.trending || [],
          newArrivals:          data.newArrivals || [],
          featured:             data.featured || [],
          landingCategories:    data.categories || [],
          landingPageLoading:   false,
          landingPageFetchedAt: Date.now(),
          trendingLoading:      false,
          newArrivalsLoading:   false,
          featuredLoading:      false,
          trendingFetchedAt:    Date.now(),
          newArrivalsFetchedAt: Date.now(),
          featuredFetchedAt:    Date.now(),
          trendingError:        null,
          newArrivalsError:     null,
          featuredError:        null
        });
      } catch (err) {
        console.warn("⚠️ Landing-page API failed, trying fallbacks...", err.message);
        
        try {
          const [trendingRes, arrivalsRes, featuredRes] = await Promise.allSettled([
            fetch(`${API}/products/best-sellers`, { headers: { "Content-Type": "application/json" } }),
            fetch(`${API}/products/new-arrivals`, { headers: { "Content-Type": "application/json" } }),
            fetch(`${API}/products/featured`,     { headers: { "Content-Type": "application/json" } }),
          ]);

          const parse = async (result) => {
            if (result.status === "fulfilled" && result.value.ok) {
              const d = await result.value.json();
              return Array.isArray(d) ? d : (d.products ?? []);
            }
            return [];
          };

          const [trendingData, arrivalsData, featuredData] = await Promise.all([
            parse(trendingRes),
            parse(arrivalsRes),
            parse(featuredRes),
          ]);

          set({
            trending:             trendingData,
            newArrivals:          arrivalsData,
            featured:             featuredData,
            landingPageLoading:   false,
            landingPageFetchedAt: Date.now(),
            trendingLoading:      false,
            newArrivalsLoading:   false,
            featuredLoading:      false,
            trendingFetchedAt:    Date.now(),
            newArrivalsFetchedAt: Date.now(),
            featuredFetchedAt:    Date.now(),
            trendingError:        trendingData.length === 0 ? "No trending products found" : null,
            newArrivalsError:     arrivalsData.length === 0 ? "No new arrivals found" : null,
            featuredError:        featuredData.length === 0 ? "No featured products found" : null,
            landingPageError:     null,
          });
        } catch (fallbackErr) {
          console.error("❌ All landing page API calls failed:", fallbackErr.message);
          const errMsg = "Unable to reach server. Please check your connection.";
          set({ 
            landingPageLoading: false, 
            landingPageError:   errMsg,
            trendingError:      errMsg,
            newArrivalsError:   errMsg,
            featuredError:      errMsg,
            trendingLoading:    false,
            newArrivalsLoading: false,
            featuredLoading:    false
          });
        }
      }
    })();

    set({ _landingPagePromise: landingPromise });
    try {
      await landingPromise;
    } finally {
      set({ _landingPagePromise: null });
    }
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
      const total    = data.total ?? products.length;

      set({ searchResults: products, searchTotal: total, searchLoading: false });
    } catch (err) {
      set({ searchLoading: false, searchError: err.message });
    }
  },

  clearSearch: () => set({ searchResults: [], searchQuery: "", searchTotal: 0, searchError: null }),

  fetchTrending:    (opts) => get()._fetch("best-sellers",  "trending",    opts),
  fetchNewArrivals: (opts) => get()._fetch("new-arrivals",  "newArrivals", opts),
  fetchFeatured:    (opts) => get()._fetch("featured",      "featured",    opts),

  refreshTrending:    () => get().fetchTrending({ force: true }),
  refreshNewArrivals: () => get().fetchNewArrivals({ force: true }),
  refreshFeatured:    () => get().fetchFeatured({ force: true }),
}));

export default useProductStore;