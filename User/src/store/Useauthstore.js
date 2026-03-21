import { create } from "zustand";
import { persist } from "zustand/middleware";

const API = "http://localhost:3000/api";

function extractUserAndToken(data) {
  const payload = data?.data ?? data;

  const user =
    payload?.user ??
    payload?.userData ??
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
   Helper — returns true if user is admin/superadmin
─────────────────────────────────────────────────── */
const isAdminRole = (user) =>
  user?.role === "admin" || user?.role === "superadmin";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:       null,
      token:      null,
      isLoggedIn: false,
      loading:    false,
      error:      null,
      authModal:  false,
      authTab:    "login",

      openAuthModal:  (tab = "login") => set({ authModal: true,  authTab: tab, error: null }),
      closeAuthModal: ()               => set({ authModal: false, error: null }),
      setAuthTab:     (tab)            => set({ authTab: tab,     error: null }),
      clearError:     ()               => set({ error: null }),

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
          console.log("[LUXURIA] Login raw response:", data);

          if (!res.ok) throw new Error(data.message || "Login failed");

          const { user, token } = extractUserAndToken(data);
          console.log("[LUXURIA] Extracted → user:", user, "| token:", token);

          if (!user) throw new Error("Server returned success but no user object found");

          // ── GUARD: admin accounts must use the Admin Panel ──
          if (isAdminRole(user)) {
            set({ loading: false, error: null });
            throw new Error("Admin accounts cannot sign in here. Please use the Admin Panel.");
          }

          set({ user, token, isLoggedIn: true, loading: false, authModal: false, error: null });
          return { success: true };
        } catch (err) {
          set({ loading: false, error: err.message });
          return { success: false, error: err.message };
        }
      },

      logout: async () => {
        try {
          await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
        } catch (_) {}
        set({ user: null, token: null, isLoggedIn: false, error: null });
      },

      fetchProfile: async () => {
        const { token, isLoggedIn } = get();
        if (!token || !isLoggedIn) return;

        try {
          const res = await fetch(`${API}/auth/profile`, {
            headers:     { Authorization: `Bearer ${token}` },
            credentials: "include",
          });

          if (!res.ok) {
            set({ user: null, token: null, isLoggedIn: false });
            return;
          }

          const data = await res.json();
          const user = data?.data ?? data?.user ?? data;

          if (user?._id) {
            // ── GUARD: if admin session leaked into luxuria-auth, clear it ──
            if (isAdminRole(user)) {
              console.warn("[LUXURIA] Admin account detected in user store — clearing session.");
              set({ user: null, token: null, isLoggedIn: false });
              return;
            }
            set({ user, isLoggedIn: true });
          }
        } catch (_) {
          // Network error — keep existing state
        }
      },
    }),

    {
      name: "luxuria-auth", // key unchanged — no other files need to change
      partialize: (s) => ({
        user:       s.user,
        token:      s.token,
        isLoggedIn: s.isLoggedIn,
      }),

      // ── GUARD: runs once when Zustand rehydrates from localStorage on page load ──
      // If the stored user is an admin (e.g. admin logged in on same browser),
      // wipe the state before it ever reaches the app.
      onRehydrateStorage: () => (state) => {
        if (state && isAdminRole(state.user)) {
          console.warn("[LUXURIA] Admin data found in luxuria-auth on load — clearing.");
          state.user       = null;
          state.token      = null;
          state.isLoggedIn = false;
        }
      },
    }
  )
);

export default useAuthStore;