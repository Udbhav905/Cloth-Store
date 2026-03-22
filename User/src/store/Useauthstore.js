/* ═══════════════════════════════════════════════════════════
   store/Useauthstore.js  — USER SIDE (Luxuria Customer App)
   
   Key fix: persist key = "luxuria_user_auth" (unique to user app)
   Admin app uses "luxuria_admin_auth" (set in admin Login.jsx)
   The two never collide.
═══════════════════════════════════════════════════════════ */
import { create } from "zustand";
import { persist } from "zustand/middleware";

const API = "http://localhost:3000/api";

/* ── Extract user + token from any server response shape ── */
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

/* ── Guard: is this user an admin role? ── */
const isAdminRole = (user) =>
  user?.role === "admin" || user?.role === "superadmin";

/* ════════════════════════════════════════════════════════ */
const useAuthStore = create(
  persist(
    (set, get) => ({
      user:        null,
      accessToken: null,   // keep "accessToken" for PaymentPage compatibility
      isLoggedIn:  false,
      loading:     false,
      error:       null,
      authModal:   false,
      authTab:     "login",

      /* ── Modal controls ── */
      openAuthModal:  (tab = "login") => set({ authModal: true,  authTab: tab, error: null }),
      closeAuthModal: ()               => set({ authModal: false, error: null }),
      setAuthTab:     (tab)            => set({ authTab: tab,     error: null }),
      clearError:     ()               => set({ error: null }),

      /* ── Register ── */
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
          if (!user)  throw new Error("No user returned from server");

          /* Block admins registering through the user app */
          if (isAdminRole(user)) {
            throw new Error("Admin accounts cannot register here.");
          }

          set({
            user,
            accessToken: token,
            isLoggedIn:  true,
            loading:     false,
            authModal:   false,
            error:       null,
          });
          return { success: true };
        } catch (err) {
          set({ loading: false, error: err.message });
          return { success: false, error: err.message };
        }
      },

      /* ── Login ── */
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

          if (!res.ok) throw new Error(data.message || "Login failed");

          const { user, token } = extractUserAndToken(data);
          if (!user) throw new Error("Server returned success but no user object found");

          /* Hard block: admins must use the Admin Panel */
          if (isAdminRole(user)) {
            set({ loading: false, error: null });
            throw new Error(
              "Admin accounts cannot sign in here. Please use the Admin Panel."
            );
          }

          set({
            user,
            accessToken: token,
            isLoggedIn:  true,
            loading:     false,
            authModal:   false,
            error:       null,
          });
          return { success: true };
        } catch (err) {
          set({ loading: false, error: err.message });
          return { success: false, error: err.message };
        }
      },

      /* ── Logout ── */
      logout: async () => {
        try {
          const { accessToken } = get();
          await fetch(`${API}/auth/logout`, {
            method:  "POST",
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
            credentials: "include",
          });
        } catch (_) {}
        set({ user: null, accessToken: null, isLoggedIn: false, error: null });
      },

      /* ── Refresh profile from server ── */
      fetchProfile: async () => {
        const { accessToken, isLoggedIn } = get();
        if (!accessToken || !isLoggedIn) return;

        try {
          const res = await fetch(`${API}/auth/profile`, {
            headers:     { Authorization: `Bearer ${accessToken}` },
            credentials: "include",
          });

          if (!res.ok) {
            /* Token expired / invalid — clear everything */
            set({ user: null, accessToken: null, isLoggedIn: false });
            return;
          }

          const data = await res.json();
          const user = data?.data ?? data?.user ?? data;

          if (user?._id) {
            /* If somehow an admin token ended up here, evict it */
            if (isAdminRole(user)) {
              console.warn("[USER APP] Admin account found in user store — clearing.");
              set({ user: null, accessToken: null, isLoggedIn: false });
              return;
            }
            set({ user, isLoggedIn: true });
          }
        } catch (_) {
          /* Network error — keep existing state */
        }
      },
    }),

    {
      /* ─── CRITICAL: unique key so admin app's storage never overwrites this ─── */
      name: "luxuria_user_auth",

      partialize: (s) => ({
        user:        s.user,
        accessToken: s.accessToken,
        isLoggedIn:  s.isLoggedIn,
      }),

      /* ── Guard on rehydration: wipe admin data if it leaked in ── */
      onRehydrateStorage: () => (state) => {
        if (state && isAdminRole(state.user)) {
          console.warn("[USER APP] Admin data in user store on load — clearing.");
          state.user        = null;
          state.accessToken = null;
          state.isLoggedIn  = false;
        }
      },
    }
  )
);

export default useAuthStore;