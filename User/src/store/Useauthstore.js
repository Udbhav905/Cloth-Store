import { create } from "zustand";
import { persist } from "zustand/middleware";

const API = "http://localhost:3000/api";

/* ─────────────────────────────────────────────────
   HELPER — normalise whatever shape the backend sends
   Handles:
     { user, accessToken }
     { user, token }
     { data: { user, accessToken } }
     { data: { user, token } }
     { _id, name, email, ... }   ← profile endpoint
─────────────────────────────────────────────────── */
function extractUserAndToken(data) {
  // Unwrap { data: { ... } }
  const payload = data?.data ?? data;

  const user =
    payload?.user ??
    payload?.userData ??
    // if the payload itself looks like a user object
    (payload?._id ? payload : null);

  const token =
    payload?.accessToken ??
    payload?.token ??
    payload?.access_token ??
    data?.accessToken ??
    data?.token ??
    null;

  return { user, token };
}

/* ─────────────────────────────────────────────────
   AUTH STORE
─────────────────────────────────────────────────── */
const useAuthStore = create(
  persist(
    (set, get) => ({
      /* ── State ── */
      user:       null,
      token:      null,
      isLoggedIn: false,
      loading:    false,
      error:      null,
      authModal:  false,
      authTab:    "login",

      /* ── UI ── */
      openAuthModal:  (tab = "login") => set({ authModal: true,  authTab: tab, error: null }),
      closeAuthModal: ()               => set({ authModal: false, error: null }),
      setAuthTab:     (tab)            => set({ authTab: tab,     error: null }),
      clearError:     ()               => set({ error: null }),

      /* ── REGISTER ── */
      register: async ({ name, email, mobileNo, password }) => {
        set({ loading: true, error: null });
        try {
          const res  = await fetch(`${API}/auth/register`, {
            method:      "POST",
            headers:     { "Content-Type": "application/json" },
            credentials: "include",
            body:        JSON.stringify({ name, email, mobileNo, password }),
          });
          const data = await res.json();

          if (!res.ok) throw new Error(data.message || "Registration failed");

          const { user, token } = extractUserAndToken(data);

          if (!user) throw new Error("No user returned from server");

          set({ user, token, isLoggedIn: true, loading: false, authModal: false, error: null });
          return { success: true };
        } catch (err) {
          set({ loading: false, error: err.message });
          return { success: false, error: err.message };
        }
      },

      /* ── LOGIN ── */
      login: async ({ email, password }) => {
        set({ loading: true, error: null });
        try {
          const res  = await fetch(`${API}/auth/login`, {
            method:      "POST",
            headers:     { "Content-Type": "application/json" },
            credentials: "include",
            body:        JSON.stringify({ email, password }),
          });
          const data = await res.json();

          // Log the raw response so you can see exact shape in DevTools console
          console.log("[LUXURIA] Login raw response:", data);

          if (!res.ok) throw new Error(data.message || "Login failed");

          const { user, token } = extractUserAndToken(data);

          console.log("[LUXURIA] Extracted → user:", user, "| token:", token);

          if (!user) throw new Error("Server returned success but no user object found");

          set({ user, token, isLoggedIn: true, loading: false, authModal: false, error: null });
          return { success: true };
        } catch (err) {
          set({ loading: false, error: err.message });
          return { success: false, error: err.message };
        }
      },

      /* ── LOGOUT ── */
      logout: async () => {
        try {
          await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
        } catch (_) { /* silent */ }
        set({ user: null, token: null, isLoggedIn: false, error: null });
      },

      /* ── RE-HYDRATE on app load ── */
      fetchProfile: async () => {
        const { token, isLoggedIn } = get();

        // Already have user data in store — no need to re-fetch
        if (!token || !isLoggedIn) return;

        try {
          const res  = await fetch(`${API}/auth/profile`, {
            headers:     { Authorization: `Bearer ${token}` },
            credentials: "include",
          });

          if (!res.ok) {
            // Token expired or invalid → clear auth
            set({ user: null, token: null, isLoggedIn: false });
            return;
          }

          const data = await res.json();
          // Profile endpoint returns the user directly
          const user = data?.data ?? data?.user ?? data;

          if (user?._id) {
            set({ user, isLoggedIn: true });
          }
        } catch (_) {
          // Network error — keep existing state, don't log out
        }
      },
    }),

    {
      name: "luxuria-auth",
      // ⚡ Persist ALL three fields — this is what was missing
      partialize: (s) => ({
        user:       s.user,
        token:      s.token,
        isLoggedIn: s.isLoggedIn,
      }),
    }
  )
);

export default useAuthStore;