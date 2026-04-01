import { create } from "zustand";
import { persist } from "zustand/middleware";
import useAuthStore from "./Useauthstore";

const API = "http://localhost:3000/api";

// Helper to get auth token from the auth store
const getAuthToken = () => {
  const { accessToken } = useAuthStore.getState();
  return accessToken;
};

// Helper to check if user is logged in
const isUserLoggedIn = () => {
  const { isLoggedIn } = useAuthStore.getState();
  return isLoggedIn;
};

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      wishlist: [],
      loading: false,
      error: null,
      coupon: null,
      couponDiscount: 0,
      subtotal: 0,
      total: 0,
      isInitialized: false,
      syncInProgress: false,
      syncQueue: [], // Queue for pending sync operations

      /* ── Helper to make authenticated requests ── */
      _fetchWithAuth: async (url, options = {}) => {
        const token = getAuthToken();
        if (!token) {
          throw new Error("No authentication token");
        }
        
        try {
          const response = await fetch(`${API}${url}`, {
            ...options,
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
              ...options.headers,
            },
          });
          
          // Try to parse response as JSON
          let data;
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            data = await response.json();
          } else {
            data = await response.text();
          }
          
          if (!response.ok) {
            if (response.status === 401) {
              get().resetCart();
            }
            throw new Error(data.message || data || `HTTP ${response.status}`);
          }
          
          return data;
        } catch (error) {
          console.error(`Fetch error for ${url}:`, error);
          throw error;
        }
      },

      /* ── Transform backend cart item to frontend format ── */
      _transformCartItem: (item) => ({
        productId: item.productId?._id || item.productId,
        name: item.name,
        price: item.price,
        discountedPrice: item.discountedPrice,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        image: item.image,
        variantId: item.variantId,
        _id: item._id
      }),

      /* ── Transform backend wishlist item ── */
      _transformWishlistItem: (item) => item.productId?._id || item.productId,

      /* ── Initialize cart from backend ── */
      initCart: async () => {
        if (!isUserLoggedIn()) {
          console.log("User not logged in, skipping cart init");
          set({ isInitialized: true, loading: false });
          return;
        }

        try {
          set({ loading: true });
          const data = await get()._fetchWithAuth("/cart");
          
          const items = (data.items || []).map(get()._transformCartItem);
          
          set({
            items,
            coupon: data.couponCode,
            couponDiscount: data.couponDiscount || 0,
            subtotal: data.subtotal || 0,
            total: data.total || 0,
            loading: false
          });
        } catch (error) {
          console.error("Failed to load cart:", error);
          set({ loading: false, error: error.message });
        }
      },

      /* ── Initialize wishlist from backend ── */
      fetchWishlist: async () => {
        if (!isUserLoggedIn()) {
          console.log("User not logged in, skipping wishlist fetch");
          return;
        }

        try {
          set({ loading: true });
          const data = await get()._fetchWithAuth("/wishlist");
          
          const wishlist = (data.items || []).map(get()._transformWishlistItem);
          
          set({
            wishlist,
            loading: false
          });
        } catch (error) {
          console.error("Failed to load wishlist:", error);
          set({ loading: false, error: error.message });
        }
      },

      /* ── Add to cart ── */
      addToCart: async (item) => {
        // If not logged in, store locally only
        if (!isUserLoggedIn()) {
          const items = get().items;
          const exists = items.find(
            (i) => i.productId === item.productId && i.size === item.size && i.color === item.color
          );
          
          if (exists) {
            set({ items: items.map((i) =>
              i.productId === item.productId && i.size === item.size && i.color === item.color
                ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                : i
            )});
          } else {
            set({ items: [...items, { ...item, quantity: item.quantity || 1, _id: Date.now().toString() }] });
          }
          return { success: true, offline: true };
        }

        try {
          set({ loading: true });
          
          const data = await get()._fetchWithAuth("/cart/add", {
            method: "POST",
            body: JSON.stringify({
              productId: item.productId,
              size: item.size,
              color: item.color,
              quantity: item.quantity || 1
            })
          });
          
          const items = (data.items || []).map(get()._transformCartItem);
          
          set({
            items,
            coupon: data.couponCode,
            couponDiscount: data.couponDiscount || 0,
            subtotal: data.subtotal || 0,
            total: data.total || 0,
            loading: false
          });
          
          return { success: true, cart: data };
        } catch (error) {
          console.error("Failed to add to cart:", error);
          set({ loading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      /* ── Remove from cart ── */
      removeFromCart: async (itemId) => {
        if (!isUserLoggedIn()) {
          const items = get().items.filter(item => item._id !== itemId);
          set({ items });
          return { success: true, offline: true };
        }

        try {
          set({ loading: true });
          
          const data = await get()._fetchWithAuth(`/cart/remove/${itemId}`, {
            method: "DELETE"
          });
          
          const items = (data.items || []).map(get()._transformCartItem);
          
          set({
            items,
            coupon: data.couponCode,
            couponDiscount: data.couponDiscount || 0,
            subtotal: data.subtotal || 0,
            total: data.total || 0,
            loading: false
          });
          
          return { success: true };
        } catch (error) {
          console.error("Failed to remove from cart:", error);
          set({ loading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      /* ── Clear cart ── */
      clearCart: async () => {
        if (!isUserLoggedIn()) {
          set({ items: [], coupon: null, couponDiscount: 0, subtotal: 0, total: 0 });
          return;
        }

        try {
          set({ loading: true });
          await get()._fetchWithAuth("/cart/clear", { method: "DELETE" });
          set({
            items: [],
            coupon: null,
            couponDiscount: 0,
            subtotal: 0,
            total: 0,
            loading: false
          });
        } catch (error) {
          console.error("Failed to clear cart:", error);
          set({ loading: false, error: error.message });
        }
      },

      /* ── Wishlist Methods ── */
      addToWishlist: async (productId) => {
        if (!isUserLoggedIn()) {
          const wishlist = get().wishlist;
          if (!wishlist.includes(productId)) {
            set({ wishlist: [...wishlist, productId] });
          }
          return { success: true, offline: true };
        }

        try {
          set({ loading: true });
          await get()._fetchWithAuth("/wishlist/add", {
            method: "POST",
            body: JSON.stringify({ productId })
          });
          
          set(state => ({
            wishlist: [...state.wishlist, productId],
            loading: false
          }));
          
          return { success: true };
        } catch (error) {
          console.error("Failed to add to wishlist:", error);
          set({ loading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      removeFromWishlist: async (productId) => {
        if (!isUserLoggedIn()) {
          const wishlist = get().wishlist.filter(id => id !== productId);
          set({ wishlist });
          return { success: true, offline: true };
        }

        try {
          set({ loading: true });
          await get()._fetchWithAuth(`/wishlist/remove/${productId}`, {
            method: "DELETE"
          });
          
          set(state => ({
            wishlist: state.wishlist.filter(id => id !== productId),
            loading: false
          }));
          
          return { success: true };
        } catch (error) {
          console.error("Failed to remove from wishlist:", error);
          set({ loading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      toggleWishlist: async (productId) => {
        const isWishlisted = get().isWishlisted(productId);
        
        if (isWishlisted) {
          return await get().removeFromWishlist(productId);
        } else {
          return await get().addToWishlist(productId);
        }
      },

      isWishlisted: (productId) => {
        return get().wishlist.includes(productId);
      },

      /* ── Sync local cart with backend (after login) ── */
      syncLocalCart: async () => {
        const localItems = [...get().items]; // Copy items
        if (localItems.length === 0) return;
        
        set({ syncInProgress: true });
        
        try {
          // Add each local item to backend
          for (const item of localItems) {
            await get().addToCart({
              productId: item.productId,
              size: item.size,
              color: item.color,
              quantity: item.quantity
            });
          }
          
          // Clear local items after sync
          set({ items: [] });
          console.log("✅ Local cart synced to backend");
        } catch (error) {
          console.error("Failed to sync local cart:", error);
        } finally {
          set({ syncInProgress: false });
        }
      },

      /* ── Sync local wishlist with backend ── */
      syncLocalWishlist: async () => {
        const localWishlist = [...get().wishlist]; // Copy wishlist
        if (localWishlist.length === 0) return;
        
        try {
          // Add each local wishlist item to backend
          for (const productId of localWishlist) {
            await get().addToWishlist(productId);
          }
          
          // Clear local wishlist after sync
          set({ wishlist: [] });
          console.log("✅ Local wishlist synced to backend");
        } catch (error) {
          console.error("Failed to sync local wishlist:", error);
        }
      },

      /* ── Helper methods ── */
      cartCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      cartSubtotal: () => {
        return get().items.reduce((sum, item) => {
          const price = item.discountedPrice || item.price;
          return sum + (price * item.quantity);
        }, 0);
      },

      wishCount: () => {
        return get().wishlist.length;
      },

      clearError: () => set({ error: null }),
      
      resetCart: () => {
        console.log("🔄 Resetting cart store");
        set({
          items: [],
          wishlist: [],
          coupon: null,
          couponDiscount: 0,
          subtotal: 0,
          total: 0,
          loading: false,
          error: null,
          isInitialized: false,
          syncInProgress: false
        });
      },

      /* ── Full initialization (call after login) ── */
      initialize: async () => {
        if (!isUserLoggedIn()) {
          console.log("User not logged in, skipping initialization");
          return;
        }
        
        console.log("🚀 Initializing cart and wishlist...");
        set({ loading: true, syncInProgress: true });
        
        try {
          // First, sync local data to backend
          await get().syncLocalCart();
          await get().syncLocalWishlist();
          
          // Then fetch fresh data from backend
          await Promise.all([
            get().initCart(),
            get().fetchWishlist()
          ]);
          
          console.log("✅ Cart and wishlist initialized successfully");
        } catch (error) {
          console.error("❌ Failed to initialize:", error);
        } finally {
          set({ loading: false, syncInProgress: false, isInitialized: true });
        }
      }
    }),
    {
      name: "luxuria_cart",
      partialize: (state) => ({
        // Only persist these fields for offline support
        items: state.items,
        wishlist: state.wishlist,
        coupon: state.coupon,
        couponDiscount: state.couponDiscount
      })
    }
  )
);

export default useCartStore;