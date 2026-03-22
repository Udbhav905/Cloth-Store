/* ═══════════════════════════════════════════════════════════
   src/utils/adminApi.js  — ADMIN APP ONLY
═══════════════════════════════════════════════════════════ */
export const API_BASE        = "http://localhost:3000/api";
export const ADMIN_USER_KEY  = "luxuria_admin_user";
export const ADMIN_TOKEN_KEY = "luxuria_admin_token";

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || "";
}
export function getAdminUser() {
  try { return JSON.parse(localStorage.getItem(ADMIN_USER_KEY) || "null"); }
  catch { return null; }
}
export function authHeader() {
  const t = getAdminToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}
export function isAdminSessionValid() {
  const t = getAdminToken(), u = getAdminUser();
  if (!t || !u) return false;
  return u.role === "admin" || u.role === "superadmin";
}
export function clearAdminSession() {
  localStorage.removeItem(ADMIN_USER_KEY);
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}
export async function apiFetch(path, options = {}, onAuthFail) {
  const token = getAdminToken();
  if (!token) {
    const err = Object.assign(new Error("No admin session. Please log in."), { status: 401 });
    if (onAuthFail) onAuthFail(err);
    throw err;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeader(), ...(options.headers || {}) },
    credentials: "include",
    ...options,
  });
  if (res.status === 401 || res.status === 403) {
    const err = Object.assign(
      new Error(res.status === 401 ? "Session expired. Please log in again." : "Not authorized as admin."),
      { status: res.status }
    );
    if (onAuthFail) onAuthFail(err);
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}