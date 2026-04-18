import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/Useauthstore";
import styles from "./styles/Profile.module.css";

const API = "http://localhost:3000/api";

/* ─── helpers ───────────────────────────────────────────── */
const getInitials = (name = "") =>
  name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

function authHeader() {
  const token = useAuthStore.getState()?.accessToken || localStorage.getItem('userToken') || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}
 
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
  return data;
}

/* ─── Toast ─────────────────────────────────────────────── */
function Toast({ toast }) {
  return (
    <div className={`${styles.toast} ${toast ? styles.toastVisible : ""} ${toast?.type === "error" ? styles.toastError : ""}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {toast?.type === "error"
          ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
          : <polyline points="20 6 9 17 4 12"/>}
      </svg>
      <span>{toast?.msg}</span>
    </div>
  );
}

/* ─── Address Form Modal ─────────────────────────────────── */
const EMPTY_ADDR = { address1: "", address2: "", city: "", state: "", pincode: "", country: "India", isDefault: false };

function AddressModal({ existing, onSave, onClose, saving }) {
  const [form, setForm] = useState(existing || EMPTY_ADDR);
  const firstRef = useRef(null);

  useEffect(() => {
    firstRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.address1.trim()) return;
    onSave(form);
  };

  return (
    <div className={styles.modalBackdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{existing ? "Edit Address" : "New Address"}</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Address Line 1 *</label>
            <input ref={firstRef} className={styles.input} value={form.address1} onChange={set("address1")} placeholder="House/Flat no, Street" required />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Address Line 2</label>
            <input className={styles.input} value={form.address2} onChange={set("address2")} placeholder="Landmark, Area (optional)" />
          </div>
          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>City</label>
              <input className={styles.input} value={form.city} onChange={set("city")} placeholder="City" />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>State</label>
              <input className={styles.input} value={form.state} onChange={set("state")} placeholder="State" />
            </div>
          </div>
          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Pincode</label>
              <input className={styles.input} value={form.pincode} onChange={set("pincode")} placeholder="Pincode" maxLength={6} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Country</label>
              <input className={styles.input} value={form.country} onChange={set("country")} placeholder="Country" />
            </div>
          </div>
          <label className={styles.checkRow}>
            <input type="checkbox" className={styles.checkbox} checked={form.isDefault} onChange={set("isDefault")} />
            <span>Set as default address</span>
          </label>

          <div className={styles.modalActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? "Saving…" : existing ? "Update Address" : "Add Address"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Address Card ───────────────────────────────────────── */
function AddressCard({ addr, index, onEdit, onDelete, onSetDefault, loading }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${styles.addrCard} ${visible ? styles.addrCardVisible : ""} ${addr.isDefault ? styles.addrCardDefault : ""}`}
      style={{ "--i": index }}
    >
      {addr.isDefault && <span className={styles.defaultBadge}>◆ Default</span>}
      <p className={styles.addrLine}>{addr.address1}</p>
      {addr.address2 && <p className={styles.addrLine}>{addr.address2}</p>}
      <p className={styles.addrLine}>
        {[addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}
      </p>
      <p className={styles.addrLine}>{addr.country}</p>

      <div className={styles.addrActions}>
        <button className={styles.addrBtn} onClick={() => onEdit(addr)}>Edit</button>
        {!addr.isDefault && (
          <button className={styles.addrBtn} onClick={() => onSetDefault(addr._id)} disabled={loading}>
            Set Default
          </button>
        )}
        <button className={`${styles.addrBtn} ${styles.addrBtnDanger}`} onClick={() => onDelete(addr._id)} disabled={loading}>
          Remove
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ORDER CARD COMPONENT - FIXED
════════════════════════════════════════════════════════════ */
function OrderStatusBadge({ status }) {
  const getStatusConfig = (s) => {
    const statusMap = {
      'pending': { label: 'Pending', class: 'statusPending' },
      'confirmed': { label: 'Confirmed', class: 'statusConfirmed' },
      'processing': { label: 'Processing', class: 'statusProcessing' },
      'shipped': { label: 'Shipped', class: 'statusShipped' },
      'out_for_delivery': { label: 'Out for Delivery', class: 'statusOutForDelivery' },
      'delivered': { label: 'Delivered', class: 'statusDelivered' },
      'cancelled': { label: 'Cancelled', class: 'statusCancelled' },
      'returned': { label: 'Returned', class: 'statusReturned' },
      'refunded': { label: 'Refunded', class: 'statusRefunded' }
    };
    return statusMap[s] || { label: s || 'Pending', class: 'statusPending' };
  };

  const config = getStatusConfig(status);
  return <span className={`${styles.orderStatus} ${styles[config.class]}`}>{config.label}</span>;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
}

function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════ */
const TABS = ["profile", "addresses", "orders"];

export default function ProfilePage() {
  const navigate   = useNavigate();
  const { user: authUser, fetchProfile, logout } = useAuthStore();

  /* ── Data state ─────────────────────────────────────────── */
  const [profile,   setProfile]   = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [orders,    setOrders]    = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  /* ── UI state ───────────────────────────────────────────── */
  const [tab,        setTab]        = useState("profile");
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [addrModal,  setAddrModal]  = useState(null);
  const [toast,      setToast]      = useState(null);
  const toastRef = useRef(null);

  /* ── Name edit ──────────────────────────────────────────── */
  const [nameEdit,  setNameEdit]  = useState(false);
  const [nameVal,   setNameVal]   = useState("");
  const nameInputRef = useRef(null);

  /* ── Show toast ─────────────────────────────────────────── */
  const showToast = useCallback((msg, type = "success") => {
    clearTimeout(toastRef.current);
    setToast({ msg, type });
    toastRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  /* ── Fetch all data on mount ────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [prof, addrs] = await Promise.all([
          apiFetch("/users/me"),
          apiFetch("/users/addresses"),
        ]);
        setProfile(prof);
        setNameVal(prof.name || "");
        setAddresses(addrs || []);
      } catch (err) {
        showToast(err.message, "error");
        if (err.message.includes("401")) navigate("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, showToast]);

  /* ── ✅ FIXED: Fetch orders from correct endpoint ── */
  useEffect(() => {
    if (tab !== "orders") return;
    
    const fetchOrders = async () => {
      setOrdersLoading(true);
      try {
        const data = await apiFetch("/orders/my-orders");
        const ordersList = Array.isArray(data) ? data : data.orders || data.data || [];
        setOrders(ordersList);
        console.log(`✅ Fetched ${ordersList.length} orders`);
      } catch (err) {
        console.error("Error fetching orders:", err);
        showToast(err.message, "error");
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [tab, showToast]);

  useEffect(() => {
    if (nameEdit) nameInputRef.current?.focus();
  }, [nameEdit]);

  const handleSaveName = async () => {
    if (!nameVal.trim() || nameVal.trim() === profile.name) { setNameEdit(false); return; }
    try {
      setSaving(true);
      const updated = await apiFetch("/users/me", {
        method: "PUT",
        body: JSON.stringify({ name: nameVal.trim() }),
      });
      setProfile(updated);
      setNameVal(updated.name);
      await fetchProfile?.();
      showToast("Name updated successfully");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
      setNameEdit(false);
    }
  };

  const handleSaveAddress = async (form) => {
    try {
      setSaving(true);
      let updated;
      if (addrModal?._id) {
        updated = await apiFetch(`/users/address/${addrModal._id}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
      } else {
        updated = await apiFetch("/users/address", {
          method: "POST",
          body: JSON.stringify(form),
        });
      }
      setAddresses(updated);
      setAddrModal(null);
      showToast(addrModal?._id ? "Address updated" : "Address added");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Remove this address?")) return;
    try {
      const data = await apiFetch(`/users/address/${id}`, { method: "DELETE" });
      setAddresses(data.addresses);
      showToast("Address removed", "neutral");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const updated = await apiFetch(`/users/address/${id}/default`, { method: "PUT" });
      setAddresses(updated);
      showToast("Default address updated");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleLogout = async () => {
    await logout?.();
    navigate("/");
  };

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.loadWrap}>
        <div className={styles.loadSpinner} />
        <p className={styles.loadText}>Loading your profile…</p>
      </div>
    </div>
  );

  const initials = getInitials(profile?.name || authUser?.name || "");

  return (
    <div className={styles.page}>
      <Toast toast={toast} />

      {/* Address modal */}
      {addrModal !== null && (
        <AddressModal
          existing={addrModal === "new" ? null : addrModal}
          onSave={handleSaveAddress}
          onClose={() => setAddrModal(null)}
          saving={saving}
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────── */}
      <aside className={styles.sidebar}>
        <div className={styles.avatarWrap}>
          <div className={styles.avatarRing} />
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.avatarGlow} />
        </div>

        <h2 className={styles.sidebarName}>{profile?.name}</h2>
        <p className={styles.sidebarRole}>
          {profile?.role === "admin" ? "◆ Admin" : "◆ Member"}
        </p>
        <p className={styles.sidebarEmail}>{profile?.email}</p>
        {profile?.isVerified && (
          <span className={styles.verifiedBadge}>✓ Verified</span>
        )}

        <nav className={styles.sidebarNav}>
          {TABS.map((t) => (
            <button
              key={t}
              className={`${styles.sidebarNavItem} ${tab === t ? styles.sidebarNavItemActive : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "profile"   && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
              {t === "addresses" && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>}
              {t === "orders"    && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>}
              <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
            </button>
          ))}
        </nav>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign Out
        </button>
      </aside>

      {/* ── Main content ───────────────────────────────────── */}
      <main className={styles.main}>

        {/* ════ PROFILE TAB ════ */}
        {tab === "profile" && (
          <div className={styles.tabPanel} key="profile">
            <div className={styles.panelHeader}>
              <h1 className={styles.panelTitle}>My <em>Profile</em></h1>
              <p className={styles.panelSub}>Manage your personal information</p>
            </div>

            <div className={styles.infoGrid}>
              <div className={`${styles.infoCard} ${styles.infoCardFull}`}>
                <div className={styles.infoCardHeader}>
                  <span className={styles.infoCardLabel}>Full Name</span>
                  {!nameEdit && (
                    <button className={styles.editBtn} onClick={() => { setNameEdit(true); setNameVal(profile.name); }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Edit
                    </button>
                  )}
                </div>
                {nameEdit ? (
                  <div className={styles.nameEditRow}>
                    <input
                      ref={nameInputRef}
                      className={styles.input}
                      value={nameVal}
                      onChange={(e) => setNameVal(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setNameEdit(false); }}
                      placeholder="Your full name"
                    />
                    <button className={styles.btnPrimary} onClick={handleSaveName} disabled={saving}>
                      {saving ? "…" : "Save"}
                    </button>
                    <button className={styles.btnSecondary} onClick={() => setNameEdit(false)}>Cancel</button>
                  </div>
                ) : (
                  <p className={styles.infoCardValue}>{profile?.name}</p>
                )}
              </div>

              <div className={styles.infoCard}>
                <div className={styles.infoCardHeader}>
                  <span className={styles.infoCardLabel}>Email Address</span>
                  <span className={styles.lockedBadge}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                    Locked
                  </span>
                </div>
                <p className={styles.infoCardValue}>{profile?.email}</p>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.infoCardHeader}>
                  <span className={styles.infoCardLabel}>Mobile Number</span>
                  <span className={styles.lockedBadge}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                    Locked
                  </span>
                </div>
                <p className={styles.infoCardValue}>{profile?.mobileNo || "—"}</p>
              </div>

              <div className={styles.infoCard}>
                <span className={styles.infoCardLabel}>Member Since</span>
                <p className={styles.infoCardValue}>
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
                    : "—"}
                </p>
              </div>
            </div>

            <div className={styles.quickLinks}>
              <button className={styles.quickLink} onClick={() => setTab("addresses")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <div><span>My Addresses</span><small>{addresses.length} saved</small></div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              <button className={styles.quickLink} onClick={() => setTab("orders")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
                </svg>
                <div><span>My Orders</span><small>{orders.length > 0 ? `${orders.length} orders` : "View history"}</small></div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              <Link to="/wishlist" className={styles.quickLink}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
                <div><span>Wishlist</span><small>Saved pieces</small></div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            </div>
          </div>
        )}

        {/* ════ ADDRESSES TAB ════ */}
        {tab === "addresses" && (
          <div className={styles.tabPanel} key="addresses">
            <div className={styles.panelHeader}>
              <div>
                <h1 className={styles.panelTitle}>My <em>Addresses</em></h1>
                <p className={styles.panelSub}>{addresses.length} saved address{addresses.length !== 1 ? "es" : ""}</p>
              </div>
              <button className={styles.btnPrimary} onClick={() => setAddrModal("new")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className={styles.emptyTab}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" className={styles.emptyTabIcon}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <h3>No addresses saved yet</h3>
                <p>Add your first delivery address</p>
                <button className={styles.btnPrimary} onClick={() => setAddrModal("new")}>Add Address</button>
              </div>
            ) : (
              <div className={styles.addrGrid}>
                {addresses.map((addr, i) => (
                  <AddressCard
                    key={addr._id || i}
                    addr={addr}
                    index={i}
                    onEdit={(a) => setAddrModal(a)}
                    onDelete={handleDeleteAddress}
                    onSetDefault={handleSetDefault}
                    loading={saving}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════ ORDERS TAB - ✅ FIXED ════ */}
        {tab === "orders" && (
          <div className={styles.tabPanel} key="orders">
            <div className={styles.panelHeader}>
              <h1 className={styles.panelTitle}>My <em>Orders</em></h1>
              <p className={styles.panelSub}>Your complete purchase history</p>
            </div>

            {ordersLoading ? (
              <div className={styles.loadWrap}>
                <div className={styles.loadSpinner} />
                <p className={styles.loadText}>Loading your orders…</p>
              </div>
            ) : orders.length === 0 ? (
              <div className={styles.emptyTab}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" className={styles.emptyTabIcon}>
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
                <h3>No orders yet</h3>
                <p>Start shopping to see your orders here</p>
                <Link to="/collections" className={styles.btnPrimary}>Explore Collections</Link>
              </div>
            ) : (
              <div className={styles.orderList}>
                {orders.map((order, i) => (
                  <div
                    key={order._id}
                    className={styles.orderCard}
                    style={{ animation: `fadeUp 0.5s ease ${i * 0.07}s both` }}
                  >
                    <div className={styles.orderCardTop}>
                      <div>
                        <span className={styles.orderId}>#{order.orderNumber || order._id?.slice(-8).toUpperCase()}</span>
                        <span className={styles.orderDate}>
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                      <OrderStatusBadge status={order.orderStatus} />
                    </div>

                    {/* Items preview */}
                    <div className={styles.orderItems}>
                      {(order.items || []).slice(0, 3).map((item, j) => (
                        <div key={j} className={styles.orderItem}>
                          {item.image && (
                            <img src={item.image} alt={item.productName || item.name} className={styles.orderItemImg} />
                          )}
                          <span className={styles.orderItemName}>{item.productName || item.name}</span>
                          <span className={styles.orderItemQty}>×{item.quantity}</span>
                        </div>
                      ))}
                      {(order.items || []).length > 3 && (
                        <span className={styles.orderMoreItems}>+{order.items.length - 3} more</span>
                      )}
                    </div>

                    <div className={styles.orderCardBottom}>
                      <span className={styles.orderTotal}>
                        {formatCurrency(order.totalAmount)}
                      </span>
                      <Link to={`/orders/${order._id}`} className={styles.orderViewBtn}>
                        View Details
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}