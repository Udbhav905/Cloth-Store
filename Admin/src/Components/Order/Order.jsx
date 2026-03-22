/* Components/Order/Order.jsx */
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, clearAdminSession } from "../../utils/AdminApi";
import styles from "./Order.module.css";

const DELIVERY_PARTNERS = [
  { id:"dp1", name:"Rajan Kumar",    phone:"+91 98765 43210", vehicle:"Bike",  zone:"North Mumbai", rating:4.8, active:true  },
  { id:"dp2", name:"Priya Sharma",   phone:"+91 87654 32109", vehicle:"Bike",  zone:"South Mumbai", rating:4.6, active:true  },
  { id:"dp3", name:"Anil Mehta",     phone:"+91 76543 21098", vehicle:"Van",   zone:"Thane",        rating:4.9, active:true  },
  { id:"dp4", name:"Sunita Verma",   phone:"+91 65432 10987", vehicle:"Bike",  zone:"Pune",         rating:4.5, active:false },
  { id:"dp5", name:"Mohammed Rafiq", phone:"+91 54321 09876", vehicle:"Truck", zone:"Navi Mumbai",  rating:4.7, active:true  },
];

const STATUS_CONFIG = {
  pending:          { label:"Pending",          color:"#d4ac0d", bg:"rgba(212,172,13,0.12)",  icon:"⏳" },
  confirmed:        { label:"Confirmed",        color:"#5dade2", bg:"rgba(93,173,226,0.12)",  icon:"✓"  },
  processing:       { label:"Processing",       color:"#a569bd", bg:"rgba(165,105,189,0.12)", icon:"⚙"  },
  shipped:          { label:"Shipped",          color:"#48c9b0", bg:"rgba(72,201,176,0.12)",  icon:"📦" },
  out_for_delivery: { label:"Out for Delivery", color:"#e67e22", bg:"rgba(230,126,34,0.12)",  icon:"🚴" },
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
const STATUS_FLOW = ["pending","confirmed","processing","shipped","out_for_delivery","delivered"];

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

  /* ── State ── */
  const [orders,        setOrders]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [selected,      setSelected]      = useState(null);
  const [filterStatus,  setFilterStatus]  = useState("all");
  const [filterPay,     setFilterPay]     = useState("all");
  const [search,        setSearch]        = useState("");
  const [sortBy,        setSortBy]        = useState("newest");
  const [page,          setPage]          = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);
  const [stats,         setStats]         = useState(null);
  const [assignModal,   setAssignModal]   = useState(null);
  const [statusModal,   setStatusModal]   = useState(null);
  const [cancelModal,   setCancelModal]   = useState(null);
  const [noteModal,     setNoteModal]     = useState(null);
  const [adminNote,     setAdminNote]     = useState("");
  const [cancelReason,  setCancelReason]  = useState("");
  const [newStatus,     setNewStatus]     = useState("");
  const [statusNote,    setStatusNote]    = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toast,         setToast]         = useState(null);

  /* ── Auth fail → clear + redirect ── */
  const onAuthFail = useCallback((err) => {
    clearAdminSession();
    setToast({ msg: err.message + " Redirecting…", type:"error" });
    setTimeout(() => navigate("/login", { replace:true }), 2000);
  }, [navigate]);

  const showToast = useCallback((msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  /* ── Fetch orders ── */
  const fetchOrders = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({
        page, limit:15, sort:sortBy,
        ...(filterStatus !== "all" && { status:       filterStatus }),
        ...(filterPay    !== "all" && { paymentStatus:filterPay    }),
        ...(search.trim()          && { search:       search.trim() }),
      });
      const data = await apiFetch(`/orders/admin/all?${params}`, {}, onAuthFail);
      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
      setStats(data.stats || null);
    } catch (e) {
      if (e.status !== 401 && e.status !== 403) setError(e.message);
    } finally { setLoading(false); }
  }, [page, filterStatus, filterPay, search, sortBy, onAuthFail]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  /* ── Fetch detail ── */
  const fetchDetail = useCallback(async (id) => {
    try {
      const data = await apiFetch(`/orders/admin/${id}`, {}, onAuthFail);
      setSelected(data.order || data);
    } catch (e) {
      if (e.status !== 401 && e.status !== 403) showToast(e.message, "error");
    }
  }, [onAuthFail, showToast]);

  /* ── Update status ── */
  const handleStatusUpdate = useCallback(async () => {
    if (!newStatus || !statusModal) return;
    setActionLoading(true);
    try {
      await apiFetch(`/orders/admin/${statusModal._id}/status`,
        { method:"PUT", body:JSON.stringify({ orderStatus:newStatus, note:statusNote }) },
        onAuthFail);
      showToast(`Order ${statusModal.orderNumber} → ${STATUS_CONFIG[newStatus]?.label}`);
      setStatusModal(null); setNewStatus(""); setStatusNote("");
      fetchOrders();
      if (selected?._id === statusModal._id) setSelected(null);
    } catch (e) { if (e.status !== 401 && e.status !== 403) showToast(e.message, "error"); }
    finally { setActionLoading(false); }
  }, [newStatus, statusModal, statusNote, selected, fetchOrders, onAuthFail, showToast]);

  /* ── Assign partner ── */
  const handleAssign = useCallback(async (orderId, partner) => {
    setActionLoading(true);
    try {
      await apiFetch(`/orders/admin/${orderId}/assign`,
        { method:"PUT", body:JSON.stringify({
          courierName:    partner.name,
          trackingNumber: `TRK${Date.now().toString().slice(-8)}`,
          orderStatus:    "shipped",
          note:           `Assigned to ${partner.name} (${partner.zone})`,
        })},
        onAuthFail);
      showToast(`Assigned to ${partner.name}`);
      setAssignModal(null);
      fetchOrders();
      if (selected?._id === orderId) setSelected(null);
    } catch (e) { if (e.status !== 401 && e.status !== 403) showToast(e.message, "error"); }
    finally { setActionLoading(false); }
  }, [selected, fetchOrders, onAuthFail, showToast]);

  /* ── Cancel ── */
  const handleCancel = useCallback(async () => {
    if (!cancelModal) return;
    setActionLoading(true);
    try {
      await apiFetch(`/orders/admin/${cancelModal._id}/status`,
        { method:"PUT", body:JSON.stringify({ orderStatus:"cancelled", note:cancelReason||"Cancelled by admin" }) },
        onAuthFail);
      showToast(`Order ${cancelModal.orderNumber} cancelled`);
      setCancelModal(null); setCancelReason("");
      fetchOrders();
      if (selected?._id === cancelModal._id) setSelected(null);
    } catch (e) { if (e.status !== 401 && e.status !== 403) showToast(e.message, "error"); }
    finally { setActionLoading(false); }
  }, [cancelModal, cancelReason, selected, fetchOrders, onAuthFail, showToast]);

  /* ── Note ── */
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
    } catch (e) { if (e.status !== 401 && e.status !== 403) showToast(e.message, "error"); }
    finally { setActionLoading(false); }
  }, [noteModal, adminNote, fetchOrders, onAuthFail, showToast]);

  const canProgress = (o) => STATUS_FLOW.indexOf(o.orderStatus) < STATUS_FLOW.length - 1;
  const canCancel   = (o) => !["delivered","cancelled","returned","refunded"].includes(o.orderStatus);
  const canAssign   = (o) => ["confirmed","processing"].includes(o.orderStatus);

  /* ════ RENDER ════ */
  return (
    <div className={styles.page}>

      {toast && (
        <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>
          {toast.type==="error" ? "✕" : "✓"}&ensp;{toast.msg}
        </div>
      )}

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Order Management</h1>
          <p className={styles.pageSubtitle}>{stats ? `${stats.total??orders.length} total orders` : "Manage, track and dispatch orders"}</p>
        </div>
        <button className={styles.refreshBtn} onClick={fetchOrders} title="Refresh">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className={styles.statsRow}>
          {[
            { label:"Total",      val:stats.total,      icon:"📋", accent:"#c9a84c" },
            { label:"Pending",    val:stats.pending,    icon:"⏳", accent:"#d4ac0d" },
            { label:"Processing", val:stats.processing, icon:"⚙",  accent:"#a569bd" },
            { label:"Shipped",    val:stats.shipped,    icon:"📦", accent:"#48c9b0" },
            { label:"Delivered",  val:stats.delivered,  icon:"✔",  accent:"#58d68d" },
            { label:"Cancelled",  val:stats.cancelled,  icon:"✕",  accent:"#ec7063" },
            { label:"Revenue",    val:fmt(stats.revenue), icon:"₹", accent:"#c9a84c" },
          ].map(s => (
            <div key={s.label} className={styles.statCard} style={{"--accent":s.accent}}>
              <span className={styles.statIcon}>{s.icon}</span>
              <span className={styles.statVal}>{s.val??"—"}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className={styles.filtersBar}>
        <div className={styles.searchBox}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className={styles.searchInput} placeholder="Order #, customer, phone…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}/>
          {search && <button className={styles.clearSearch} onClick={() => setSearch("")}>✕</button>}
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

      {/* Status Tabs */}
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

      {/* Table */}
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
              <th>Payment</th><th>Status</th><th>Courier</th><th>Date</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {orders.map(order => {
                const sc = STATUS_CONFIG[order.orderStatus]    || STATUS_CONFIG.pending;
                const pc = PAYMENT_STATUS[order.paymentStatus] || PAYMENT_STATUS.pending;
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
                        <span className={styles.customerName}>{order.userId?.name||"—"}</span>
                        <span className={styles.customerPhone}>{order.shippingAddress?.phone}</span>
                      </div>
                    </td>
                    <td><span className={styles.itemCount}>{order.items?.length} item{order.items?.length!==1?"s":""}</span></td>
                    <td><span className={styles.amount}>{fmt(order.totalAmount)}</span></td>
                    <td><span className={styles.payBadge} style={{color:pc.color,borderColor:`${pc.color}44`}}>{pc.label}</span></td>
                    <td><span className={styles.statusBadge} style={{color:sc.color,background:sc.bg}}>{sc.icon} {sc.label}</span></td>
                    <td><span className={styles.courierCell}>{order.courierName||<span className={styles.unassigned}>—</span>}</span></td>
                    <td><span className={styles.dateCell}>{timeAgo(order.createdAt)}</span></td>
                    <td>
                      <div className={styles.actionBtns}>
                        <button className={styles.actionBtn} title="View" onClick={() => fetchDetail(order._id)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                        {canProgress(order) && (
                          <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} title="Update Status"
                            onClick={() => { setStatusModal(order); setNewStatus(""); }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <polyline points="9 11 12 14 22 4"/>
                              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                            </svg>
                          </button>
                        )}
                        {canAssign(order) && (
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
                        {canCancel(order) && (
                          <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} title="Cancel"
                            onClick={() => setCancelModal(order)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
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

            {/* Timeline */}
            <div className={styles.timeline}>
              {STATUS_FLOW.map((s,i) => {
                const cur = STATUS_FLOW.indexOf(selected.orderStatus);
                const done = i<=cur, active = i===cur;
                return (
                  <div key={s} className={`${styles.tlStep} ${done?styles.tlDone:""} ${active?styles.tlActive:""}`}>
                    <div className={styles.tlDot} style={active?{background:STATUS_CONFIG[s]?.color}:{}}/>
                    {i<STATUS_FLOW.length-1 && <div className={`${styles.tlLine} ${done&&i<cur?styles.tlLineDone:""}`}/>}
                    <span className={styles.tlLabel}>{STATUS_CONFIG[s]?.label}</span>
                  </div>
                );
              })}
            </div>

            <div className={styles.panelBody}>
              {/* Items */}
              <section className={styles.panelSection}>
                <h3 className={styles.sectionTitle}>Items ({selected.items?.length})</h3>
                <div className={styles.itemsList}>
                  {(selected.items||[]).map((item,i) => (
                    <div key={i} className={styles.itemRow}>
                      <div className={styles.itemImg}>
                        {item.image ? <img src={item.image} alt={item.productName}/> : <span>◆</span>}
                      </div>
                      <div className={styles.itemInfo}>
                        <p className={styles.itemName}>{item.productName}</p>
                        <p className={styles.itemMeta}>{[item.variant?.size,item.variant?.color,item.variant?.sku].filter(Boolean).join(" · ")}</p>
                        <p className={styles.itemQty}>Qty: {item.quantity}</p>
                      </div>
                      <div className={styles.itemPrice}><span>{fmt(item.totalPrice)}</span></div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Price */}
              <section className={styles.panelSection}>
                <h3 className={styles.sectionTitle}>Price Breakdown</h3>
                <div className={styles.priceTable}>
                  <div className={styles.priceLine}><span>Subtotal</span><span>{fmt(selected.subtotal)}</span></div>
                  {selected.discount>0 && <div className={styles.priceLine}><span>Discount</span><span className={styles.discountVal}>−{fmt(selected.discount)}</span></div>}
                  <div className={styles.priceLine}><span>Shipping</span><span>{selected.shippingCharge===0?"Free":fmt(selected.shippingCharge)}</span></div>
                  <div className={styles.priceLine}><span>GST (18%)</span><span>{fmt(selected.tax)}</span></div>
                  <div className={`${styles.priceLine} ${styles.priceTotal}`}><span>Total</span><span>{fmt(selected.totalAmount)}</span></div>
                </div>
              </section>

              {/* Payment */}
              <section className={styles.panelSection}>
                <h3 className={styles.sectionTitle}>Payment</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}><label>Method</label><span>{selected.paymentMethod?.toUpperCase()}</span></div>
                  <div className={styles.infoItem}><label>Status</label>
                    <span style={{color:PAYMENT_STATUS[selected.paymentStatus]?.color}}>{PAYMENT_STATUS[selected.paymentStatus]?.label}</span>
                  </div>
                  {selected.paymentDetails?.transactionId && (
                    <div className={`${styles.infoItem} ${styles.infoFull}`}><label>Transaction ID</label>
                      <span className={styles.mono}>{selected.paymentDetails.transactionId}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Address */}
              <section className={styles.panelSection}>
                <h3 className={styles.sectionTitle}>Shipping Address</h3>
                {selected.shippingAddress ? (
                  <div className={styles.addressBox}>
                    <p>{selected.shippingAddress.address1}</p>
                    {selected.shippingAddress.address2 && <p>{selected.shippingAddress.address2}</p>}
                    {selected.shippingAddress.landmark  && <p>Near: {selected.shippingAddress.landmark}</p>}
                    <p>{[selected.shippingAddress.city,selected.shippingAddress.state,selected.shippingAddress.pincode].filter(Boolean).join(", ")}</p>
                    {selected.shippingAddress.phone && <p className={styles.addrPhone}>📞 {selected.shippingAddress.phone}</p>}
                  </div>
                ) : <p className={styles.noData}>No address on record</p>}
              </section>

              {/* Delivery */}
              {(selected.courierName||selected.trackingNumber) && (
                <section className={styles.panelSection}>
                  <h3 className={styles.sectionTitle}>Delivery</h3>
                  <div className={styles.infoGrid}>
                    {selected.courierName    && <div className={styles.infoItem}><label>Partner</label><span>{selected.courierName}</span></div>}
                    {selected.trackingNumber && <div className={styles.infoItem}><label>Tracking #</label><span className={styles.mono}>{selected.trackingNumber}</span></div>}
                    {selected.deliveredAt    && <div className={styles.infoItem}><label>Delivered</label><span>{new Date(selected.deliveredAt).toLocaleString("en-IN")}</span></div>}
                  </div>
                </section>
              )}

              {/* History */}
              {selected.statusHistory?.length > 0 && (
                <section className={styles.panelSection}>
                  <h3 className={styles.sectionTitle}>Status History</h3>
                  <div className={styles.historyList}>
                    {[...selected.statusHistory].reverse().map((h,i) => (
                      <div key={i} className={styles.historyItem}>
                        <div className={styles.historyDot} style={{background:STATUS_CONFIG[h.status]?.color||"#c9a84c"}}/>
                        <div className={styles.historyContent}>
                          <span className={styles.historyStatus}>{STATUS_CONFIG[h.status]?.label||h.status}</span>
                          {h.note && <span className={styles.historyNote}>{h.note}</span>}
                          <span className={styles.historyTime}>{new Date(h.changedAt).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {selected.adminNotes && (
                <section className={styles.panelSection}>
                  <h3 className={styles.sectionTitle}>Admin Notes</h3>
                  <div className={styles.noteBox}>{selected.adminNotes}</div>
                </section>
              )}

              {/* Panel actions */}
              <div className={styles.panelActions}>
                {canProgress(selected) && (
                  <button className={styles.panelBtn} onClick={() => { setStatusModal(selected); setNewStatus(""); }}>Update Status</button>
                )}
                {canAssign(selected) && (
                  <button className={`${styles.panelBtn} ${styles.panelBtnAssign}`} onClick={() => setAssignModal(selected._id)}>Assign Partner</button>
                )}
                <button className={styles.panelBtnOutline}
                  onClick={() => { setNoteModal(selected); setAdminNote(selected.adminNotes||""); }}>Add Note</button>
                {canCancel(selected) && (
                  <button className={`${styles.panelBtnOutline} ${styles.panelBtnDanger}`} onClick={() => setCancelModal(selected)}>Cancel Order</button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal — Assign */}
      {assignModal && (
        <div className={styles.modalOverlay} onClick={() => setAssignModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}><h3>Assign Delivery Partner</h3><button onClick={() => setAssignModal(null)}>✕</button></div>
            <p className={styles.modalSubtitle}>Select an available delivery partner</p>
            <div className={styles.partnerList}>
              {DELIVERY_PARTNERS.map(p => (
                <div key={p.id} className={`${styles.partnerCard} ${!p.active?styles.partnerInactive:""}`}>
                  <div className={styles.partnerAvatar}>{p.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
                  <div className={styles.partnerInfo}>
                    <p className={styles.partnerName}>{p.name}</p>
                    <p className={styles.partnerMeta}>{p.zone} · {p.vehicle}</p>
                    <p className={styles.partnerPhone}>{p.phone}</p>
                  </div>
                  <div className={styles.partnerRight}>
                    <span className={styles.partnerRating}>★ {p.rating}</span>
                    <span className={`${styles.partnerStatus} ${p.active?styles.partnerActive:""}`}>{p.active?"Available":"Offline"}</span>
                    <button className={styles.assignBtn} disabled={!p.active||actionLoading}
                      onClick={() => handleAssign(assignModal, p)}>{actionLoading?"…":"Assign"}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal — Status */}
      {statusModal && (
        <div className={styles.modalOverlay} onClick={() => setStatusModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}><h3>Update Order Status</h3><button onClick={() => setStatusModal(null)}>✕</button></div>
            <p className={styles.modalSubtitle}>
              Current: <strong style={{color:STATUS_CONFIG[statusModal.orderStatus]?.color}}>{STATUS_CONFIG[statusModal.orderStatus]?.label}</strong>
            </p>
            <div className={styles.statusGrid}>
              {Object.entries(STATUS_CONFIG).map(([k,v]) => (
                <button key={k}
                  className={`${styles.statusOption} ${newStatus===k?styles.statusOptionSelected:""}`}
                  style={{"--s-color":v.color}}
                  onClick={() => setNewStatus(k)}
                  disabled={k===statusModal.orderStatus}>
                  <span>{v.icon}</span><span>{v.label}</span>
                </button>
              ))}
            </div>
            <textarea className={styles.modalTextarea} rows={3}
              placeholder="Add a note (optional)…" value={statusNote}
              onChange={e => setStatusNote(e.target.value)}/>
            <div className={styles.modalFooter}>
              <button className={styles.modalCancelBtn} onClick={() => setStatusModal(null)}>Cancel</button>
              <button className={styles.modalConfirmBtn} disabled={!newStatus||actionLoading} onClick={handleStatusUpdate}>
                {actionLoading?"Updating…":"Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Cancel */}
      {cancelModal && (
        <div className={styles.modalOverlay} onClick={() => setCancelModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}><h3>Cancel Order</h3><button onClick={() => setCancelModal(null)}>✕</button></div>
            <p className={styles.modalSubtitle}>Cancel <strong>{cancelModal.orderNumber}</strong>? This cannot be undone.</p>
            <textarea className={styles.modalTextarea} rows={3}
              placeholder="Reason for cancellation…" value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}/>
            <div className={styles.modalFooter}>
              <button className={styles.modalCancelBtn} onClick={() => setCancelModal(null)}>Go Back</button>
              <button className={`${styles.modalConfirmBtn} ${styles.modalConfirmDanger}`}
                disabled={actionLoading} onClick={handleCancel}>
                {actionLoading?"Cancelling…":"Confirm Cancel"}
              </button>
            </div>
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