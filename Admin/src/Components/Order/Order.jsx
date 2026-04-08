/* Components/Order/Order.jsx - Admin Panel (Optimized) */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, clearAdminSession } from "../../utils/AdminApi";
import styles from "./Order.module.css";

// Use ONLY the status values that exist in your backend schema
const STATUS_CONFIG = {
  pending:          { label:"Pending",          color:"#d4ac0d", bg:"rgba(212,172,13,0.12)",  icon:"⏳" },
  confirmed:        { label:"Confirmed",        color:"#5dade2", bg:"rgba(93,173,226,0.12)",  icon:"✓"  },
  processing:       { label:"Processing",       color:"#a569bd", bg:"rgba(165,105,189,0.12)", icon:"⚙"  },
  shipped:          { label:"Shipped",          color:"#48c9b0", bg:"rgba(72,201,176,0.12)",  icon:"📦" },
  out_for_delivery: { label:"Out for Delivery", color:"#e67e22", bg:"rgba(230,126,34,0.12)",  icon:"🚚" },
  delivered:        { label:"Delivered",        color:"#58d68d", bg:"rgba(88,214,141,0.12)",  icon:"✔"  },
  cancelled:        { label:"Cancelled",        color:"#ec7063", bg:"rgba(236,112,99,0.12)",  icon:"✕"  },
  returned:         { label:"Returned",         color:"#f0b27a", bg:"rgba(240,178,122,0.12)", icon:"↩"  },
  refunded:         { label:"Refunded",         color:"#85c1e9", bg:"rgba(133,193,233,0.12)", icon:"↺"  },
};

const PAYMENT_STATUS = {
  pending:  { label:"Pending",  color:"#d4ac0d" },
  paid:     { label:"Paid",     color:"#58d68d" },
  failed:   { label:"Failed",   color:"#ec7063" },
  refunded: { label:"Refunded", color:"#85c1e9" },
};

function fmt(n) {
  return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n||0);
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff/60000);
  if (m<1)  return "just now";
  if (m<60) return `${m}m ago`;
  const h = Math.floor(m/60);
  if (h<24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

export default function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPay, setFilterPay] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [noteModal, setNoteModal] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [partnersLoading, setPartnersLoading] = useState(false);

  // Refs for optimization
  const searchTimeoutRef = useRef(null);
  const isInitialMount = useRef(true);

  const onAuthFail = useCallback((err) => {
    clearAdminSession();
    setToast({ msg: err.message + " Redirecting…", type:"error" });
    setTimeout(() => navigate("/login", { replace:true }), 2000);
  }, [navigate]);

  const showToast = useCallback((msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchDeliveryPartners = useCallback(async () => {
    setPartnersLoading(true);
    try {
      const data = await apiFetch('/delivery-partners?status=active&limit=100', {}, onAuthFail);
      const partners = (data.data || []).map(partner => ({
        id: partner._id,
        name: partner.name,
        phone: partner.phone,
        vehicle: partner.vehicleType,
        zone: `${partner.address?.city || 'N/A'}, ${partner.address?.state || 'N/A'}`,
        rating: partner.rating || 4.5,
        active: partner.status === 'active',
        vehicleNumber: partner.vehicleNumber,
        companyName: partner.companyName,
        totalDeliveries: partner.totalDeliveries || 0
      }));
      setDeliveryPartners(partners);
    } catch (e) {
      console.error('Failed to fetch delivery partners:', e);
      setDeliveryPartners([]);
    } finally {
      setPartnersLoading(false);
    }
  }, [onAuthFail]);

  const fetchOrders = useCallback(async () => {
    setLoading(true); 
    setError("");
    try {
      const params = new URLSearchParams({
        page, 
        limit: 15, 
        sort: sortBy,
        ...(filterStatus !== "all" && { status: filterStatus }),
        ...(filterPay !== "all" && { paymentStatus: filterPay }),
        ...(search.trim() && { search: search.trim() }),
      });
      const data = await apiFetch(`/orders/admin/all?${params}`, {}, onAuthFail);
      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
      setStats(data.stats || null);
    } catch (e) {
      if (e.status !== 401 && e.status !== 403) setError(e.message);
    } finally { 
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, filterStatus, filterPay, search, sortBy, onAuthFail]);

  // Debounced search handler
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearch(value);
    setPage(1);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      fetchOrders();
    }, 500);
  }, [fetchOrders]);

  // Manual refresh handler
  const handleManualRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
  }, [fetchOrders]);

  // Fetch delivery partners only once on mount
  useEffect(() => {
    fetchDeliveryPartners();
  }, [fetchDeliveryPartners]);

  // Fetch orders when dependencies change (with debounce for search)
  useEffect(() => {
    // Skip initial mount to prevent double fetch
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchOrders();
      return;
    }
    
    // For search, debounce is handled in handleSearchChange
    // For other filters, fetch immediately
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    fetchOrders();
  }, [fetchOrders, page, filterStatus, filterPay, sortBy]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const fetchDetail = useCallback(async (id) => {
    try {
      const data = await apiFetch(`/orders/admin/${id}`, {}, onAuthFail);
      setSelected(data.order || data);
    } catch (e) {
      if (e.status !== 401 && e.status !== 403) showToast(e.message, "error");
    }
  }, [onAuthFail, showToast]);

  const handleAssign = useCallback(async (orderId, partner) => {
    setActionLoading(true);
    try {
      const orderData = await apiFetch(`/orders/admin/${orderId}`, {}, onAuthFail);
      const order = orderData.order || orderData;
      
      const response = await apiFetch(`/orders/admin/${orderId}/assign`,
        { method:"PUT", body:JSON.stringify({
          courierName: partner.name,
          trackingNumber: `TRK${Date.now().toString().slice(-8)}`,
          deliveryPartnerId: partner.id,
          partnerId: partner.id,
          deliveryPartnerName: partner.name,
          partnerName: partner.name,
          note: `Assigned to ${partner.name} (${partner.zone}) - Vehicle: ${partner.vehicle} (${partner.vehicleNumber})`,
          assignedAt: new Date().toISOString()
        })},
        onAuthFail);
      
      console.log("Assignment response:", response);
      showToast(`Order ${order.orderNumber} assigned to ${partner.name}`);
      setAssignModal(null);
      fetchOrders();
      if (selected?._id === orderId) setSelected(null);
    } catch (e) { 
      console.error("Assignment error:", e);
      if (e.status !== 401 && e.status !== 403) showToast(e.message, "error"); 
    }
    finally { setActionLoading(false); }
  }, [selected, fetchOrders, onAuthFail, showToast]);

  const handleNote = useCallback(async () => {
    if (!noteModal || !adminNote.trim()) return;
    setActionLoading(true);
    try {
      await apiFetch(`/orders/admin/${noteModal._id}/note`,
        { method:"PUT", body:JSON.stringify({ adminNotes:adminNote }) },
        onAuthFail);
      showToast("Note saved");
      setNoteModal(null); setAdminNote("");
      fetchOrders();
    } catch (e) { 
      if (e.status !== 401 && e.status !== 403) showToast(e.message, "error"); 
    }
    finally { setActionLoading(false); }
  }, [noteModal, adminNote, fetchOrders, onAuthFail, showToast]);

  // Allow assigning to pending, confirmed, processing orders (without changing status)
  const canAssign = (o) => ["pending","confirmed","processing"].includes(o.orderStatus);
  const isAssigned = (o) => o.deliveryPartnerId || o.partnerId || o.courierName;

  const activePartners = deliveryPartners.filter(p => p.active);

  return (
    <div className={styles.page}>

      {toast && (
        <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>
          {toast.type==="error" ? "✕" : "✓"}&ensp;{toast.msg}
        </div>
      )}

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Order Management</h1>
          <p className={styles.pageSubtitle}>View orders and assign to delivery partners</p>
        </div>
        <button 
          className={`${styles.refreshBtn} ${refreshing ? styles.refreshing : ''}`} 
          onClick={handleManualRefresh} 
          title="Refresh"
          disabled={refreshing}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
        </button>
      </div>

      {stats && (
        <div className={styles.statsRow}>
          {[
            { label:"Total", val:stats.total, icon:"📋", accent:"#c9a84c" },
            { label:"Pending", val:stats.pending, icon:"⏳", accent:"#d4ac0d" },
            { label:"Confirmed", val:stats.confirmed || 0, icon:"✓", accent:"#5dade2" },
            { label:"Processing", val:stats.processing, icon:"⚙", accent:"#a569bd" },
            { label:"Shipped", val:stats.shipped || 0, icon:"📦", accent:"#48c9b0" },
            { label:"Delivered", val:stats.delivered, icon:"✔", accent:"#58d68d" },
            { label:"Revenue", val:fmt(stats.revenue), icon:"₹", accent:"#c9a84c" },
          ].map(s => (
            <div key={s.label} className={styles.statCard} style={{"--accent":s.accent}}>
              <span className={styles.statIcon}>{s.icon}</span>
              <span className={styles.statVal}>{s.val??"—"}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.filtersBar}>
        <div className={styles.searchBox}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input 
            className={styles.searchInput} 
            placeholder="Order #, customer, phone…"
            value={search} 
            onChange={handleSearchChange}
          />
          {search && <button className={styles.clearSearch} onClick={() => {
            setSearch("");
            setPage(1);
            fetchOrders();
          }}>✕</button>}
        </div>
        <div className={styles.filterGroup}>
          <select className={styles.select} value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="all">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className={styles.select} value={filterPay}
            onChange={e => { setFilterPay(e.target.value); setPage(1); }}>
            <option value="all">All Payments</option>
            {Object.entries(PAYMENT_STATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className={styles.select} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount_desc">Amount ↓</option>
            <option value="amount_asc">Amount ↑</option>
          </select>
        </div>
      </div>

      <div className={styles.statusTabs}>
        <button className={`${styles.tab} ${filterStatus==="all"?styles.tabActive:""}`}
          onClick={() => { setFilterStatus("all"); setPage(1); }}>All</button>
        {Object.entries(STATUS_CONFIG).map(([k,v]) => (
          <button key={k}
            className={`${styles.tab} ${filterStatus===k?styles.tabActive:""}`}
            style={filterStatus===k ? {"--tab-color":v.color} : {}}
            onClick={() => { setFilterStatus(k); setPage(1); }}>
            <span className={styles.tabDot} style={{background:v.color}}/>{v.label}
          </button>
        ))}
      </div>

      <div className={styles.tableWrap}>
        {loading ? (
          <div className={styles.loadState}><div className={styles.loader}/><span>Loading orders…</span></div>
        ) : error ? (
          <div className={styles.errorState}>
            <div className={styles.errorIcon}>⚠</div>
            <p>{error}</p>
            <button onClick={fetchOrders}>Retry</button>
          </div>
        ) : orders.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <p>No orders found</p>
            <span>Try adjusting your filters</span>
          </div>
        ) : (
          <table className={styles.table}>
            <thead><tr>
              <th>Order</th><th>Customer</th><th>Items</th><th>Amount</th>
              <th>Payment</th><th>Status</th><th>Partner</th><th>Date</th><th>Actions</th>
            </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const sc = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.pending;
                const pc = PAYMENT_STATUS[order.paymentStatus] || PAYMENT_STATUS.pending;
                const partnerName = order.deliveryPartnerName || order.partnerName || order.courierName || "—";
                return (
                  <tr key={order._id}
                    className={`${styles.row} ${selected?._id===order._id?styles.rowSelected:""}`}>
                    <td>
                      <button className={styles.orderNumBtn} onClick={() => fetchDetail(order._id)}>
                        {order.orderNumber}
                      </button>
                    </td>
                     <td>
                      <div className={styles.customerCell}>
                        <span className={styles.customerName}>{order.userId?.name || order.customerName ||"—"}</span>
                        <span className={styles.customerPhone}>{order.shippingAddress?.phone || order.customerPhone}</span>
                      </div>
                    </td>
                     <td><span className={styles.itemCount}>{order.items?.length} item{order.items?.length!==1?"s":""}</span></td>
                     <td><span className={styles.amount}>{fmt(order.totalAmount)}</span></td>
                     <td><span className={styles.payBadge} style={{color:pc.color,borderColor:`${pc.color}44`}}>{pc.label}</span></td>
                     <td><span className={styles.statusBadge} style={{color:sc.color,background:sc.bg}}>{sc.icon} {sc.label}</span></td>
                     <td><span className={styles.courierCell}>{partnerName}</span></td>
                     <td><span className={styles.dateCell}>{timeAgo(order.createdAt)}</span></td>
                     <td>
                      <div className={styles.actionBtns}>
                        <button className={styles.actionBtn} title="View" onClick={() => fetchDetail(order._id)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                        {canAssign(order) && !isAssigned(order) && (
                          <button className={`${styles.actionBtn} ${styles.actionBtnAssign}`} title="Assign Partner"
                            onClick={() => setAssignModal(order._id)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 10-16 0"/>
                              <polyline points="14 18 16 20 20 16"/>
                            </svg>
                          </button>
                        )}
                        <button className={styles.actionBtn} title="Admin Note"
                          onClick={() => { setNoteModal(order); setAdminNote(order.adminNotes||""); }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                      </div>
                     </td>
                   </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button className={styles.pageBtn} disabled={page===1} onClick={() => setPage(p=>p-1)}>← Prev</button>
          <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
          <button className={styles.pageBtn} disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>Next →</button>
        </div>
      )}

      {/* Detail Panel */}
      {selected && (
        <>
          <div className={styles.panelBackdrop} onClick={() => setSelected(null)}/>
          <div className={styles.detailPanel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>{selected.orderNumber}</h2>
                <span className={styles.panelDate}>{new Date(selected.createdAt).toLocaleString("en-IN")}</span>
              </div>
              <button className={styles.panelClose} onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className={styles.panelBody}>
              <section className={styles.panelSection}>
                <h3 className={styles.sectionTitle}>Items ({selected.items?.length})</h3>
                <div className={styles.itemsList}>
                  {(selected.items||[]).map((item,i) => (
                    <div key={i} className={styles.itemRow}>
                      <div className={styles.itemInfo}>
                        <p className={styles.itemName}>{item.productName || item.name}</p>
                        <p className={styles.itemMeta}>{[item.size, item.color].filter(Boolean).join(" · ")}</p>
                        <p className={styles.itemQty}>Qty: {item.quantity}</p>
                      </div>
                      <div className={styles.itemPrice}><span>{fmt(item.totalPrice || item.price * item.quantity)}</span></div>
                    </div>
                  ))}
                </div>
              </section>

              <section className={styles.panelSection}>
                <h3 className={styles.sectionTitle}>Price Breakdown</h3>
                <div className={styles.priceTable}>
                  <div className={styles.priceLine}><span>Subtotal</span><span>{fmt(selected.subtotal)}</span></div>
                  {selected.discount > 0 && (
                    <div className={styles.priceLine}><span>Discount</span><span className={styles.discountVal}>−{fmt(selected.discount)}</span></div>
                  )}
                  <div className={`${styles.priceLine} ${styles.priceTotal}`}><span>Total</span><span>{fmt(selected.totalAmount)}</span></div>
                </div>
              </section>

              <section className={styles.panelSection}>
                <h3 className={styles.sectionTitle}>Shipping Address</h3>
                {selected.shippingAddress ? (
                  <div className={styles.addressBox}>
                    <p>{selected.shippingAddress.address1}</p>
                    {selected.shippingAddress.address2 && <p>{selected.shippingAddress.address2}</p>}
                    <p>{[selected.shippingAddress.city, selected.shippingAddress.state, selected.shippingAddress.pincode].filter(Boolean).join(", ")}</p>
                    <p className={styles.addrPhone}>📞 {selected.shippingAddress.phone}</p>
                  </div>
                ) : <p className={styles.noData}>No address on record</p>}
              </section>

              {selected.adminNotes && (
                <section className={styles.panelSection}>
                  <h3 className={styles.sectionTitle}>Admin Notes</h3>
                  <div className={styles.noteBox}>{selected.adminNotes}</div>
                </section>
              )}

              <div className={styles.panelActions}>
                {canAssign(selected) && !isAssigned(selected) && (
                  <button className={`${styles.panelBtn} ${styles.panelBtnAssign}`} onClick={() => setAssignModal(selected._id)}>
                    Assign Delivery Partner
                  </button>
                )}
                <button className={styles.panelBtnOutline}
                  onClick={() => { setNoteModal(selected); setAdminNote(selected.adminNotes||""); }}>
                  Add Note
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal — Assign Partner */}
      {assignModal && (
        <div className={styles.modalOverlay} onClick={() => setAssignModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Assign Delivery Partner</h3>
              <button onClick={() => setAssignModal(null)}>✕</button>
            </div>
            <p className={styles.modalSubtitle}>
              {partnersLoading ? "Loading partners..." : `${activePartners.length} active partner${activePartners.length !== 1 ? 's' : ''} available`}
            </p>
            {partnersLoading ? (
              <div className={styles.loadState}><div className={styles.loader}/><span>Loading delivery partners...</span></div>
            ) : activePartners.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🚚</div>
                <p>No active delivery partners found</p>
                <span>Please add delivery partners in the Delivery Partner section</span>
              </div>
            ) : (
              <div className={styles.partnerList}>
                {activePartners.map(p => (
                  <div key={p.id} className={styles.partnerCard}>
                    <div className={styles.partnerAvatar}>{p.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
                    <div className={styles.partnerInfo}>
                      <p className={styles.partnerName}>{p.name}</p>
                      <p className={styles.partnerMeta}>{p.zone} · {p.vehicle} ({p.vehicleNumber})</p>
                      <p className={styles.partnerPhone}>{p.phone}</p>
                    </div>
                    <div className={styles.partnerRight}>
                      <span className={styles.partnerRating}>★ {p.rating}</span>
                      <button className={styles.assignBtn} disabled={actionLoading}
                        onClick={() => handleAssign(assignModal, p)}>
                        {actionLoading ? "…" : "Assign"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal — Note */}
      {noteModal && (
        <div className={styles.modalOverlay} onClick={() => setNoteModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}><h3>Admin Note — {noteModal.orderNumber}</h3><button onClick={() => setNoteModal(null)}>✕</button></div>
            <textarea className={styles.modalTextarea} rows={5}
              placeholder="Write an internal note…" value={adminNote}
              onChange={e => setAdminNote(e.target.value)}/>
            <div className={styles.modalFooter}>
              <button className={styles.modalCancelBtn} onClick={() => setNoteModal(null)}>Cancel</button>
              <button className={styles.modalConfirmBtn} disabled={!adminNote.trim()||actionLoading} onClick={handleNote}>
                {actionLoading?"Saving…":"Save Note"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}