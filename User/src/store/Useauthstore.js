import { create } from "zustand";
import { persist } from "zustand/middleware";
import useCartStore from "./Usecartstore";
import useApiStore from "./others.js";
const API = useApiStore.getState().API;
// const API = "http://localhost:3000/api";

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

    localStorage.setItem('userToken', token);
    localStorage.setItem('userData', JSON.stringify(user));

    set({
      user,
      accessToken: token,
      isLoggedIn: true,
      loading: false,
      authModal: false,
      error: null,
    });

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

          const useCartStore = (await import("./Usecartstore")).default;
          await useCartStore.getState().initialize();
        } catch (_) {
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
