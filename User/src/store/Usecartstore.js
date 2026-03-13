import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ─────────────────────────────────────────────
   CART STORE
───────────────────────────────────────────── */
const useCartStore = create(
  persist(
    (set, get) => ({
      items:     [],   // [{ productId, name, price, size, color, quantity, image }]
      wishlist:  [],   // [productId, ...]
       
      /* ── Cart ── */
      cartCount: () => get().items.reduce((s, i) => s + i.quantity, 0),

      addToCart: (item) => {
        const items = get().items;
        const exists = items.find(
          (i) => i.productId === item.productId && i.size === item.size && i.color === item.color
        );
        if (exists) {
          set({ items: items.map((i) =>
            i.productId === item.productId && i.size === item.size && i.color === item.color
              ? { ...i, quantity: i.quantity + 1 }
              : i
          )});
        } else {
          set({ items: [...items, { ...item, quantity: 1 }] });
        }
      },

      removeFromCart: (productId, size, color) =>
        set({ items: get().items.filter(
          (i) => !(i.productId === productId && i.size === size && i.color === color)
        )}),

      clearCart: () => set({ items: [] }),

      /* ── Wishlist ── */
      wishCount: () => get().wishlist.length,

      toggleWishlist: (productId) => {
        const list = get().wishlist;
        set({ wishlist: list.includes(productId)
          ? list.filter((id) => id !== productId)
          : [...list, productId]
        });
      },

      isWishlisted: (productId) => get().wishlist.includes(productId),
    }),
   
    { name: "luxuria-cart" }
  )
);

export default useCartStore;