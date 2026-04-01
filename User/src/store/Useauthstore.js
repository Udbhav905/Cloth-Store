/* ═══════════════════════════════════════════════════════════
   store/Useauthstore.js  — USER SIDE ONLY

   THE ROOT PROBLEM:
   Both apps run on localhost so they share:
     1. localStorage  (fixed with namespaced keys)
     2. HTTP cookies  (same domain = same cookie jar)

   The cookie "token" set by the backend is sent automatically
   on EVERY request to localhost:3000, regardless of which
   port (5173 or 5174) made the request. So when the user app
   calls fetchProfile() on mount, if the admin was last logged
   in, the cookie holds the ADMIN token → backend returns admin
   user → our guard sees admin role → wipes user store.

   FIX:
   1. NEVER rely on cookies for auth — always send the stored
      token explicitly via Authorization: Bearer header.
   2. fetchProfile() sends the user's OWN token from the store,
      not the cookie. If there's no token in the store, skip.
   3. If the server returns an admin user for our token, that
      means someone stored an admin token here — clear it.
   4. The user store NEVER calls localStorage directly — only
      Zustand's set() — so it can never accidentally wipe admin keys.
═══════════════════════════════════════════════════════════ */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import useCartStore from "./Usecartstore";

const API = "http://localhost:3000/api";

function extractUserAndToken(data) {
  const payload = data?.data ?? data;
  const user =
    payload?.user ?? payload?.userData ?? (payload?._id ? payload : null);
  const token =
    payload?.accessToken ??
    payload?.token ??
    payload?.access_token ??
    data?.accessToken ??
    data?.token ??
    null;
  return { user, token };
}

const isAdmin = (u) => u?.role === "admin";
const EMPTY = { user: null, accessToken: null, isLoggedIn: false };

const useAuthStore = create(
  persist(
    (set, get) => ({
      ...EMPTY,
      loading: false,
      error: null,
      authModal: false,
      authTab: "login",

      openAuthModal: (tab = "login") =>
        set({ authModal: true, authTab: tab, error: null }),
      closeAuthModal: () => set({ authModal: false, error: null }),
      setAuthTab: (tab) => set({ authTab: tab, error: null }),
      clearError: () => set({ error: null }),

      /* ── Register ── */
      register: async ({ name, email, mobileNo, password }) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API}/auth/register`, {
            method: "POST",
            /* NO credentials:"include" — do NOT send/receive cookies */
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, mobileNo, password }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Registration failed");
          const { user, token } = extractUserAndToken(data);
          if (!user) throw new Error("No user returned from server");
          if (isAdmin(user))
            throw new Error("Admin accounts cannot register here.");
          set({
            user,
            accessToken: token,
            isLoggedIn: true,
            loading: false,
            authModal: false,
            error: null,
          });
          return { success: true };
        } catch (err) {
          set({ loading: false, error: err.message });
          return { success: false, error: err.message };
        }
      },

      /* ── Login ── */
      /* ── Login ── */
      login: async ({ email, password }) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Login failed");
          const { user, token } = extractUserAndToken(data);
          if (!user) throw new Error("Server returned no user object");
          if (isAdmin(user))
            throw new Error("Admin accounts must use the Admin Panel.");
          if (!token) throw new Error("No token received from server");

          set({
            user,
            accessToken: token,
            isLoggedIn: true,
            loading: false,
            authModal: false,
            error: null,
          });

          // Initialize cart after successful login
          const useCartStore = (await import("./Usecartstore")).default;
          await useCartStore.getState().initialize();

          return { success: true };
        } catch (err) {
          set({ loading: false, error: err.message });
          return { success: false, error: err.message };
        }
      },

      /* ── Logout ── */
      logout: async () => {
        const { accessToken } = get();
        try {
          /* Send token via header, not cookie */
          await fetch(`${API}/auth/logout`, {
            method: "POST",
            headers: accessToken
              ? { Authorization: `Bearer ${accessToken}` }
              : { "Content-Type": "application/json" },
          });
          useCartStore.getState().resetCart();
        } catch (_) {}
        /* Only reset this store's state — never touch localStorage directly */
        set(EMPTY);
      },

      /* ── Refresh profile ──────────────────────────────────
         KEY FIX: only runs if this store has a token.
         Sends token via Authorization header — NOT cookie.
         Cookie is shared across ports and causes cross-
         contamination between admin and user sessions.
      ─────────────────────────────────────────────────────── */
      /* ── Refresh profile ── */
      fetchProfile: async () => {
        const { accessToken, isLoggedIn } = get();

        if (!accessToken || !isLoggedIn) return;

        try {
          const res = await fetch(`${API}/auth/profile`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (!res.ok) {
            set(EMPTY);
            return;
          }

          const data = await res.json();
          const user = data?.user ?? data?.data ?? data;

          if (!user?._id) {
            set(EMPTY);
            return;
          }

          if (isAdmin(user)) {
            console.warn(
              "[USER APP] Admin token found in user store — clearing.",
            );
            set(EMPTY);
            return;
          }

          set({ user, isLoggedIn: true });

          // Initialize cart after profile refresh (if token is valid)
          const useCartStore = (await import("./Usecartstore")).default;
          await useCartStore.getState().initialize();
        } catch (_) {
          // Network error — keep existing state, don't clear
        }
      },
    }),

    {
      name: "luxuria_user_auth" /* unique to user app */,
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        isLoggedIn: s.isLoggedIn,
      }),
      onRehydrateStorage: () => (state) => {
        /* If somehow admin data ended up here, clear on load */
        if (state && isAdmin(state.user)) {
          state.user = null;
          state.accessToken = null;
          state.isLoggedIn = false;
        }
      },
    },
  ),
);

export default useAuthStore;
