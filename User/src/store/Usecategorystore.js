import { create } from "zustand";  
import useApiStore from "../store/others";

const API = useApiStore.getState().API;

/* ─────────────────────────────────────────────────
   VISUAL CONFIG (unchanged)
─────────────────────────────────────────────────── */
const VISUAL_MAP = [
  { match: ["evening", "gown"], size: "tall", desc: "Where silk meets starlight", accent: "#c9a84c" },
  { match: ["suit", "tailor", "formal"], size: "wide", desc: "Power dressed in silence", accent: "#d4cfc8" },
  { match: ["resort", "beach", "summer"], size: "normal", desc: "Effortless sun-drenched luxury", accent: "#c9a84c" },
  { match: ["bridal", "wedding"], size: "normal", desc: "Once-in-a-lifetime perfection", accent: "#e8dcc8" },
  { match: ["cashmere", "knit", "wool"], size: "tall", desc: "Second-skin softness", accent: "#c9a84c" },
  { match: ["accessor", "jewel", "bag", "belt"], size: "wide", desc: "The final punctuation", accent: "#b8a898" },
  { match: ["women", "woman", "female", "lady"], size: "wide", desc: "Femininity without compromise", accent: "#c9a84c" },
  { match: ["men", "man", "male", "bespoke"], size: "normal", desc: "Refined masculine elegance", accent: "#d4cfc8" },
  { match: ["couture", "haute", "atelier"], size: "tall", desc: "Handcrafted for the few", accent: "#e8c97a" },
  { match: ["spring", "ss", "light"], size: "wide", desc: "Light as morning air", accent: "#c9a84c" },
  { match: ["winter", "autumn", "fall", "aw"], size: "normal", desc: "Warmth woven with intention", accent: "#b8a898" },
  { match: ["limited", "exclusive", "archive"], size: "tall", desc: "Pieces made for the few", accent: "#e8c97a" },
];

const FALLBACK_SIZES = ["tall", "wide", "normal", "normal", "tall", "wide"];
const FALLBACK_ACCENTS = ["#c9a84c", "#d4cfc8", "#e8dcc8", "#b8a898", "#e8c97a", "#c9a84c"];
const FALLBACK_DESCS = [
  "Crafted for those who know",
  "Designed without compromise",
  "Timeless. Effortless. Luxurious.",
  "A universe of its own",
  "Where quality speaks first",
  "The art of being dressed",
];

/* ─────────────────────────────────────────────────
   HELPER — enrich one raw category from backend
─────────────────────────────────────────────────── */
export function enrichCategory(cat, index) {
  const searchKey = (cat.name + " " + (cat.slug || "")).toLowerCase();
  const rule = VISUAL_MAP.find((r) =>
    r.match.some((keyword) => searchKey.includes(keyword))
  );

  const words = (cat.name || "").trim().split(/\s+/);
  const label = words[0] || "Luxury";
  const sublabel = words.length > 1 ? words.slice(1).join(" ") : "Collection";

  return {
    id: cat._id,
    slug: cat.slug,
    name: cat.name,
    description: cat.description,
    isActive: cat.isActive,
    sortOrder: cat.sortOrder,
    img: cat.image || null,
    label,
    sublabel,
    desc: rule?.desc ?? FALLBACK_DESCS[index % FALLBACK_DESCS.length],
    size: rule?.size ?? FALLBACK_SIZES[index % FALLBACK_SIZES.length],
    accent: rule?.accent ?? FALLBACK_ACCENTS[index % FALLBACK_ACCENTS.length],
  };
}

/* ─────────────────────────────────────────────────
   ZUSTAND STORE (FIXED)
─────────────────────────────────────────────────── */
const useCategoryStore = create((set, get) => ({
  // State
  categories: [],
  loading: false,
  error: null,
  fetchedAt: null,

  // Fetch categories (with caching)
  fetchCategories: async ({ force = false } = {}) => {
    const { loading, fetchedAt } = get();

    if (loading) return;
    if (!force && fetchedAt && Date.now() - fetchedAt < 5 * 60 * 1000) return;

    set({ loading: true, error: null });

    try {
      const res = await fetch(
        `${API}/categories?active=true&parent=null`,
        { headers: { "Content-Type": "application/json" } }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Server error ${res.status}`);
      }

      const raw = await res.json();
      if (!Array.isArray(raw)) {
        throw new Error("Unexpected response format from /api/categories");
      }

      const sorted = [...raw].sort((a, b) => {
        const orderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        if (orderDiff !== 0) return orderDiff;
        return new Date(a.createdAt ?? 0) - new Date(b.createdAt ?? 0);
      });

      const categories = sorted.map((cat, i) => enrichCategory(cat, i));
      set({ categories, loading: false, error: null, fetchedAt: Date.now() });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  // Force refresh (bypass cache)
  refresh: () => get().fetchCategories({ force: true }),

  // External sync (e.g., from a consolidated fetch on landing page)
  setCategories: (raw) => {
    if (!Array.isArray(raw)) return;
    const sorted = [...raw].sort((a, b) => {
      const orderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      if (orderDiff !== 0) return orderDiff;
      return new Date(a.createdAt ?? 0) - new Date(b.createdAt ?? 0);
    });
    const categories = sorted.map((cat, i) => enrichCategory(cat, i));
    set({ categories, loading: false, error: null, fetchedAt: Date.now() });
  },
}));

export default useCategoryStore;