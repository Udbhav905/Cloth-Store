import { create } from "zustand";
import { persist } from "zustand/middleware";
import useAuthStore from "./Useauthstore";

import useApiStore from "../store/others";
const API = useApiStore.getState().API;

// const API = "http://localhost:3000/api";

const getAuthToken = () => {
  const { accessToken } = useAuthStore.getState();
  return accessToken;
};

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
      syncQueue: [],

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
              Authorization: `Bearer ${token}`,
              ...options.headers,
            },
          });

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
        _id: item._id,
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
            loading: false,
          });
          
          console.log("Cart initialized with items:", items.length);
          return { success: true, items };
        } catch (error) {
          console.error("Failed to load cart:", error);
          set({ loading: false, error: error.message });
          return { success: false, error: error.message };
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
            loading: false,
          });
          
          console.log("Wishlist initialized with items:", wishlist.length);
          return { success: true, wishlist };
        } catch (error) {
          console.error("Failed to load wishlist:", error);
          set({ loading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      addToCart: async (item) => {
        console.log("🛒 addToCart called with:", item);
        
        if (!isUserLoggedIn()) {
          console.log("🔵 Adding to local cart (offline mode)");
          const items = get().items;
          const exists = items.find(
            (i) =>
              i.productId === item.productId &&
              i.size === item.size &&
              i.color === item.color,
          );

          let updatedItems;
          if (exists) {
            updatedItems = items.map((i) =>
              i.productId === item.productId &&
              i.size === item.size &&
              i.color === item.color
                ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                : i,
            );
          } else {
            updatedItems = [
              ...items,
              {
                ...item,
                quantity: item.quantity || 1,
                _id: Date.now().toString(),
              },
            ];
          }
          
          set({ items: updatedItems });
          console.log("✅ Local cart updated, new count:", updatedItems.reduce((sum, i) => sum + i.quantity, 0));
          return { success: true, offline: true };
        }

        try {
          console.log("🔵 Adding to backend cart");
          set({ loading: true });

          const data = await get()._fetchWithAuth("/cart/add", {
            method: "POST",
            body: JSON.stringify({
              productId: item.productId,
              size: item.size,
              color: item.color,
              quantity: item.quantity || 1,
            }),
          });

          const items = (data.items || []).map(get()._transformCartItem);
          console.log("✅ Backend cart updated, items:", items.length);

          set({
            items,
            coupon: data.couponCode,
            couponDiscount: data.couponDiscount || 0,
            subtotal: data.subtotal || 0,
            total: data.total || 0,
            loading: false,
          });

          return { success: true, cart: data };
        } catch (error) {
          console.error("Failed to add to cart:", error);
          set({ loading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      /* ── Update cart item quantity ── */
      updateCartItemQuantity: async (itemId, quantity) => {
        if (!isUserLoggedIn()) {
          const items = get().items.map(item =>
            item._id === itemId ? { ...item, quantity } : item
          );
          set({ items });
          return { success: true, offline: true };
        }

        try {
          set({ loading: true });
          const data = await get()._fetchWithAuth(`/cart/${itemId}`, {
            method: "PUT",
            body: JSON.stringify({ quantity }),
          });

          const items = (data.items || []).map(get()._transformCartItem);

          set({
            items,
            coupon: data.couponCode,
            couponDiscount: data.couponDiscount || 0,
            subtotal: data.subtotal || 0,
            total: data.total || 0,
            loading: false,
          });

          return { success: true };
        } catch (error) {
          console.error("Failed to update cart item:", error);
          set({ loading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      /* ── Remove from cart ── */
      removeFromCart: async (itemId) => {
        if (!isUserLoggedIn()) {
          const items = get().items.filter((item) => item._id !== itemId);
          set({ items });
          return { success: true, offline: true };
        }

        try {
          set({ loading: true });
          const data = await get()._fetchWithAuth(`/cart/${itemId}`, {
            method: "DELETE",
          });

          const items = (data.items || []).map(get()._transformCartItem);

          set({
            items,
            coupon: data.couponCode,
            couponDiscount: data.couponDiscount || 0,
            subtotal: data.subtotal || 0,
            total: data.total || 0,
            loading: false,
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
          set({
            items: [],
            coupon: null,
            couponDiscount: 0,
            subtotal: 0,
            total: 0,
          });
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
            loading: false,
          });
        } catch (error) {
          console.error("Failed to clear cart:", error);
          set({ loading: false, error: error.message });
        }
      },

      /* ── Sync local cart with backend (after login) ── */
      syncLocalCart: async () => {
        const localItems = [...get().items];
        if (localItems.length === 0) return;

        set({ syncInProgress: true });

        try {
          let backendCart = null;
          try {
            const data = await get()._fetchWithAuth("/cart");
            backendCart = data;
            console.log("📦 Current backend cart:", backendCart);
          } catch (error) {
            console.error("Failed to fetch backend cart:", error);
            set({ syncInProgress: false });
            return;
          }

          let allSuccess = true;
          const backendItems = backendCart?.items || [];

          for (const localItem of localItems) {
            const existingBackendItem = backendItems.find(
              item => 
                (item.productId?._id?.toString() === localItem.productId?.toString() ||
                 item.productId?.toString() === localItem.productId?.toString()) &&
                item.size === localItem.size &&
                item.color === localItem.color
            );

            if (existingBackendItem) {
              if (existingBackendItem.quantity !== localItem.quantity) {
                console.log(`Updating quantity for ${localItem.name}`);
                const result = await get().updateCartItemQuantity(
                  existingBackendItem._id,
                  localItem.quantity
                );
                if (!result.success) allSuccess = false;
              }
            } else {
              console.log(`Adding new item: ${localItem.name}`);
              const result = await get().addToCart({
                productId: localItem.productId,
                size: localItem.size,
                color: localItem.color,
                quantity: localItem.quantity,
                name: localItem.name,
                price: localItem.price,
                image: localItem.image,
              });
              if (!result.success) allSuccess = false;
            }
          }

          if (allSuccess) {
            await get().initCart();
            set({ items: [] });
            console.log("✅ Local cart synced to backend successfully");
          } else {
            console.warn("⚠️ Some cart items failed to sync, keeping local copy");
          }
        } catch (error) {
          console.error("Failed to sync local cart:", error);
        } finally {
          set({ syncInProgress: false });
        }
      },

      /* ── Sync local wishlist with backend ── */
      syncLocalWishlist: async () => {
        const localWishlist = [...get().wishlist];
        if (localWishlist.length === 0) return;

        try {
          let existingWishlist = [];
          try {
            const data = await get()._fetchWithAuth("/wishlist");
            existingWishlist = (data.items || []).map(
              get()._transformWishlistItem,
            );
          } catch (error) {
            console.error("Failed to fetch existing wishlist:", error);
          }

          const itemsToAdd = localWishlist.filter(
            (id) => !existingWishlist.includes(id),
          );

          for (const productId of itemsToAdd) {
            try {
              await get().addToWishlist(productId);
            } catch (error) {
              if (!error.message.includes("already in wishlist")) {
                console.error(`Failed to add product ${productId}:`, error);
              }
            }
          }

          set({ wishlist: [] });
          console.log("✅ Local wishlist synced to backend");
        } catch (error) {
          console.error("Failed to sync local wishlist:", error);
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
            body: JSON.stringify({ productId }),
          });

          set((state) => ({
            wishlist: [...state.wishlist, productId],
            loading: false,
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
          const wishlist = get().wishlist.filter((id) => id !== productId);
          set({ wishlist });
          return { success: true, offline: true };
        }

        try {
          set({ loading: true });
          await get()._fetchWithAuth(`/wishlist/remove/${productId}`, {
            method: "DELETE",
          });

          set((state) => ({
            wishlist: state.wishlist.filter((id) => id !== productId),
            loading: false,
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

      /* ── Helper methods ── */
      cartCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      cartSubtotal: () => {
        return get().items.reduce((sum, item) => {
          const price = item.discountedPrice || item.price;
          return sum + price * item.quantity;
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
          syncInProgress: false,
        });
      },

      /* ── Full initialization (FIXED) ── */
      initialize: async () => {
        if (!isUserLoggedIn()) {
          console.log("User not logged in, skipping initialization");
          set({ isInitialized: true, loading: false });
          return;
        }

        console.log("🚀 Initializing cart and wishlist...");
        set({ loading: true, syncInProgress: true });

        try {
          await get().syncLocalCart();
          await get().syncLocalWishlist();
          
          await Promise.all([get().initCart(), get().fetchWishlist()]);
          console.log("✅ Cart and wishlist initialized successfully");
          
          // Log final state
          const finalState = get();
          console.log("Final cart count:", finalState.items.reduce((sum, item) => sum + item.quantity, 0));
        } catch (error) {
          console.error("❌ Failed to initialize:", error);
        } finally {
          set({ loading: false, syncInProgress: false, isInitialized: true });
        }
      },
    }),
    {
      name: "luxuria_cart",
      partialize: (state) => ({
        items: state.items,
        wishlist: state.wishlist,
        coupon: state.coupon,
        couponDiscount: state.couponDiscount,
      }),
    }
  )
);

export default useCartStore;