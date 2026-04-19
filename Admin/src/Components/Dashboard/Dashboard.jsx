/* Components/Dashboard/Dashboard.jsx */
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, clearAdminSession } from "../../utils/AdminApi";
import styles from "./Dashboard.module.css";

function fmt(n) {
  return new Intl.NumberFormat("en-IN", { style:"currency", currency:"INR", maximumFractionDigits:0 }).format(n||0);
}

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [stats,   setStats]   = useState(null);
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const onAuthFail = useCallback((err) => {
    clearAdminSession();
    navigate("/login", { replace: true });
  }, [navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [orderData, productData] = await Promise.all([
        apiFetch("/orders/admin/all?page=1&limit=5&sort=newest", {}, onAuthFail),
        apiFetch("/products?limit=1", {}, onAuthFail).catch(() => ({ total: 0 })),
      ]);
      setStats(orderData.stats || null);
      setOrders(orderData.orders || []);
    } catch (e) {
      if (e.status !== 401 && e.status !== 403) setError(e.message);
    } finally { setLoading(false); }
  }, [onAuthFail]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const STATUS_COLOR = {
    pending:"#d4ac0d", confirmed:"#5dade2", processing:"#a569bd",
    shipped:"#48c9b0", out_for_delivery:"#e67e22", delivered:"#58d68d",
    cancelled:"#ec7063", returned:"#f0b27a", refunded:"#85c1e9",
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Welcome back, {user?.name?.split(" ")[0] || "Admin"}</p>
        </div>
        <button className={styles.refreshBtn} onClick={fetchData} title="Refresh">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
        </button>
      </div>

      {loading ? (
        <div className={styles.loadState}><div className={styles.loader}/><span>Loading…</span></div>
      ) : error ? (
        <div className={styles.errorState}><span>⚠ {error}</span><button onClick={fetchData}>Retry</button></div>
      ) : (
        <>
          {/* Stats */}
          {stats && (
            <div className={styles.statsGrid}>
              {[
                { label:"Total Orders", val:stats.total,     icon:"📋", color:"#c9a84c", link:"/orders" },
                { label:"Pending",      val:stats.pending,   icon:"⏳", color:"#d4ac0d", link:"/orders" },
                { label:"Delivered",    val:stats.delivered, icon:"✔",  color:"#58d68d", link:"/orders" },
                { label:"Cancelled",    val:stats.cancelled, icon:"✕",  color:"#ec7063", link:"/orders" },
                { label:"Revenue",      val:fmt(stats.revenue), icon:"₹", color:"#c9a84c", link:"/orders" },
              ].map(s => (
                <div key={s.label} className={styles.statCard}
                  style={{ "--c": s.color }} onClick={() => navigate(s.link)}>
                  <div className={styles.statTop}>
                    <span className={styles.statIcon}>{s.icon}</span>
                    <span className={styles.statVal}>{s.val ?? "—"}</span>
                  </div>
                  <span className={styles.statLabel}>{s.label}</span>
                  <div className={styles.statBar}/>
                </div>
              ))}
            </div>
          )}

          {/* Recent orders */}
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Recent Orders</h2>
              <button className={styles.viewAll} onClick={() => navigate("/orders")}>View All →</button>
            </div>
            {orders.length === 0 ? (
              <p className={styles.empty}>No orders yet</p>
            ) : (
              <div className={styles.orderList}>
                {orders.map(o => (
                  <div key={o._id} className={styles.orderRow} onClick={() => navigate("/orders")}>
                    <div className={styles.orderLeft}>
                      <span className={styles.orderNum}>{o.orderNumber}</span>
                      <span className={styles.orderCustomer}>{o.userId?.name || "—"}</span>
                    </div>
                    <div className={styles.orderRight}>
                      <span className={styles.orderAmount}>
                        {new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(o.totalAmount||0)}
                      </span>
                      <span className={styles.orderStatus}
                        style={{ color: STATUS_COLOR[o.orderStatus] || "#c9a84c" }}>
                        {o.orderStatus?.replace(/_/g," ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Quick Actions</h2>
            <div className={styles.quickGrid}>
              {[
                { label:"Manage Orders",    path:"/orders",    icon:"📋" },
                { label:"View Products",    path:"/products",  icon:"📦" },
                { label:"Categories",       path:"/categories",icon:"🗂"  },
                { label:"Delivery Partners",path:"/delivery-partners", icon:"🚴" },
              ].map(q => (
                <button key={q.path} className={styles.quickCard} onClick={() => navigate(q.path)}>
                  <span className={styles.quickIcon}>{q.icon}</span>
                  <span className={styles.quickLabel}>{q.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}