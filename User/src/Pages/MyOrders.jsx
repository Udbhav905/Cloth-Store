import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import useAuthStore from "../store/Useauthstore";
import ReviewModal from "../Components/Reviewmodal/Reviewmodal";
import styles from "./styles/MyOrders.module.css";

// Premium Map Icons
const partnerIcon = new L.DivIcon({
  html: `<div style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
    <svg viewBox="0 0 24 24" width="32" height="32" fill="#c9a84c">
      <path d="M21 16.5c0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5.7-1.5 1.5-1.5 1.5.7 1.5 1.5zm-13.5 0c0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5.7-1.5 1.5-1.5 1.5.7 1.5 1.5zm15-4.5v-3c0-.8-.7-1.5-1.5-1.5h-3c-.8 0-1.5.7-1.5 1.5v3h6zm-9-4.5h-4.5c-.8 0-1.5.7-1.5 1.5v4.5h7.5v-4.5c0-.8-.7-1.5-1.5-1.5zm-6 4.5h-1.5v-4.5h1.5v4.5zm13.5 4.5h-13.5c-1.1 0-2 .9-2 2h17.5c0-1.1-.9-2-2-2z"/>
      <circle cx="12" cy="8" r="3" fill="none" stroke="#c9a84c" stroke-width="1.5"/>
    </svg>
  </div>`,
  className: "custom-marker-icon",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const destinationIcon = new L.DivIcon({
  html: `<div style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
    <svg viewBox="0 0 24 24" width="32" height="32" fill="#1a1a1e" stroke="#c9a84c" stroke-width="1.5">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  </div>`,
  className: "custom-marker-icon",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});
import useApiStore from "../store/others";
const API = useApiStore.getState().API;

// const API = "http://localhost:3000/api";

function authHeader() {
  const token = localStorage.getItem("userToken") || useAuthStore.getState()?.accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeader(), ...(opts.headers || {}) },
    ...opts,
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(d.message || `HTTP ${res.status}`);
  return d;
}

function fmt(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
}
function fmtDate(d, short = false) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", short ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

const S = {
  pending:          { label: "Pending",          cls: "gold",  step: 0, icon: "⏳" },
  confirmed:        { label: "Confirmed",        cls: "gold",  step: 1, icon: "✓" },
  processing:       { label: "Processing",       cls: "blue",  step: 2, icon: "⚙" },
  shipped:          { label: "Shipped",          cls: "blue",  step: 3, icon: "📦" },
  out_for_delivery: { label: "Out for Delivery", cls: "blue",  step: 4, icon: "🚚" },
  delivered:        { label: "Delivered",        cls: "green", step: 5, icon: "✓" },
  cancelled:        { label: "Cancelled",        cls: "red",   step: -1, icon: "✕" },
  returned:         { label: "Returned",         cls: "red",   step: -1, icon: "↩" },
  refunded:         { label: "Refunded",         cls: "red",   step: -1, icon: "₹" },
};

const TRACK_STEPS = [
  { key: "confirmed",        label: "Confirmed",        sub: "Order accepted" },
  { key: "processing",       label: "Processing",       sub: "Being prepared" },
  { key: "shipped",          label: "Shipped",          sub: "On its way" },
  { key: "out_for_delivery", label: "Out for Delivery", sub: "Nearby you" },
  { key: "delivered",        label: "Delivered",        sub: "Enjoy!" },
];

const TABS = [
  { id: "all",       label: "All Orders" },
  { id: "active",    label: "Active" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

function filterOrders(orders, tab) {
  if (tab === "active")    return orders.filter((o) => ["pending", "confirmed", "processing", "shipped", "out_for_delivery"].includes(o.orderStatus));
  if (tab === "delivered") return orders.filter((o) => o.orderStatus === "delivered");
  if (tab === "cancelled") return orders.filter((o) => ["cancelled", "returned", "refunded"].includes(o.orderStatus));
  return orders;
}

function OrderTracker({ status }) {
  const cfg = S[status];
  if (!cfg || cfg.step === -1) return null;
  const cur = cfg.step;
  return (
    <div className={styles.tracker}>
      {TRACK_STEPS.map((s, i) => {
        const done   = i < cur;
        const active = i === cur - 1;
        return (
          <div key={s.key} className={styles.trackerStep}>
            <div className={`${styles.trackerDot} ${done ? styles.trackerDone : ""} ${active ? styles.trackerActive : ""} ${!done && !active ? styles.trackerFuture : ""}`}>
              {done ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg> : <span>{i + 1}</span>}
            </div>
            <div className={styles.trackerText}>
              <span className={`${styles.trackerLabel} ${done || active ? styles.trackerLabelOn : ""}`}>{s.label}</span>
              <span className={styles.trackerSub}>{s.sub}</span>
            </div>
            {i < TRACK_STEPS.length - 1 && <div className={`${styles.trackerLine} ${done ? styles.trackerLineDone : ""}`} />}
          </div>
        );
      })}
    </div>
  );
}

function MapUpdater({ center, bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: true });
    } else if (center) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, bounds, map]);
  return null;
}

function OrderDrawer({ order: initialOrder, onClose, onCancel, onReview }) {
  const [order, setOrder] = useState(initialOrder);
  const [cancelling, setCancelling] = useState(false);
  const drawerBodyRef = useRef(null);
  const pollInterval = useRef(null);

  const cfg = S[order.orderStatus] || { label: order.orderStatus, cls: "gold" };
  const canCancel  = ["pending", "confirmed"].includes(order.orderStatus);
  const isDelivered = order.orderStatus === "delivered";
  const isTracking = ["shipped", "out_for_delivery"].includes(order.orderStatus);
  const isCOD = order.paymentMethod === "cod";
  const gstPercent = order.tax && order.subtotal
    ? Math.round((order.tax / (order.subtotal - (order.discount || 0))) * 100)
    : 18;

  // Poll for live location if tracking is active
  useEffect(() => {
    if (isTracking) {
      pollInterval.current = setInterval(async () => {
        try {
          const updated = await apiFetch(`/orders/${order._id}`);
          if (updated) setOrder(updated);
        } catch (e) {
          console.error("Poll error:", e);
        }
      }, 10000); // Poll every 10s
    }
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [isTracking, order._id]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    const el = drawerBodyRef.current;
    if (!el) return;
    const stop = (e) => e.stopPropagation();
    el.addEventListener("wheel", stop, { passive: true });
    el.addEventListener("touchmove", stop, { passive: true });
    return () => { el.removeEventListener("wheel", stop); el.removeEventListener("touchmove", stop); };
  }, []);

  const handleCancel = async () => {
    if (!window.confirm("Cancel this order?")) return;
    setCancelling(true);
    await onCancel(order._id);
    setCancelling(false);
    onClose();
  };

  return (
    <div className={styles.drawerBackdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.drawer}>
        {/* Header */}
        <div className={styles.drawerHeader}>
          <div className={styles.drawerHeaderLeft}>
            <p className={styles.drawerOrderNum}>#{order.orderNumber || order._id?.slice(-8).toUpperCase()}</p>
            <p className={styles.drawerDate}>{fmtDate(order.createdAt)} · {fmtTime(order.createdAt)}</p>
          </div>
          <div className={styles.drawerHeaderRight}>
            <span className={`${styles.statusBadge} ${styles[`status_${cfg.cls}`]}`}>{cfg.label}</span>
            <button className={styles.drawerClose} onClick={onClose} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div ref={drawerBodyRef} className={styles.drawerBody}>
          {/* Progress */}
          <section className={styles.drawerSection}>
            <h3 className={styles.drawerSectionTitle}>Order Progress</h3>
            {cfg.step === -1 ? (
              <div className={styles.cancelledBanner}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                This order has been {cfg.label.toLowerCase()}
                {order.cancellationReason && <span className={styles.cancelReason}> — {order.cancellationReason}</span>}
              </div>
            ) : (
              <OrderTracker status={order.orderStatus} />
            )}
          </section>

          {/* Live Map Tracking */}
          {isTracking && (
            <section className={styles.drawerSection}>
              <div className={styles.mapHeader}>
                <h3 className={styles.drawerSectionTitle}>Live Tracking</h3>
                <span className={styles.liveBadge}>LIVE</span>
              </div>
              
              {order.liveLocation?.lat ? (
                <div className={styles.mapContainer}>
                  <MapContainer 
                    center={[order.liveLocation.lat, order.liveLocation.lng]} 
                    zoom={15} 
                    style={{ height: '320px', width: '100%', borderRadius: '12px', zIndex: 1, border: '1px solid rgba(201,168,76,0.2)' }}
                    zoomControl={false}
                  >
                    <TileLayer 
                      url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                    
                    {/* Route line */}
                    {order.shippingAddress?.coordinates?.lat && (
                      <Polyline 
                        positions={[
                          [order.liveLocation.lat, order.liveLocation.lng],
                          [order.shippingAddress.coordinates.lat, order.shippingAddress.coordinates.lng]
                        ]}
                        color="#c9a84c"
                        dashArray="8, 12"
                        weight={3}
                        opacity={0.6}
                      />
                    )}

                    {/* Destination Marker */}
                    {order.shippingAddress?.coordinates?.lat && (
                      <Marker 
                        position={[order.shippingAddress.coordinates.lat, order.shippingAddress.coordinates.lng]}
                        icon={destinationIcon}
                      >
                        <Popup className="custom-popup">
                          <div className={styles.popupContent}>
                            <strong>Delivery Address</strong>
                            <p>{order.shippingAddress.city}</p>
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Partner Marker */}
                    <Marker 
                      position={[order.liveLocation.lat, order.liveLocation.lng]}
                      icon={partnerIcon}
                    >
                      <Popup className="custom-popup">
                        <div className={styles.popupContent}>
                          <strong>Delivery Partner</strong>
                          <p>Moving towards you</p>
                        </div>
                      </Popup>
                    </Marker>

                    <MapUpdater 
                      center={[order.liveLocation.lat, order.liveLocation.lng]} 
                      bounds={order.shippingAddress?.coordinates?.lat ? [
                        [order.liveLocation.lat, order.liveLocation.lng],
                        [order.shippingAddress.coordinates.lat, order.shippingAddress.coordinates.lng]
                      ] : null}
                    />
                  </MapContainer>
                  <div className={styles.mapStats}>
                    <div className={styles.mapStat}>
                      <span className={styles.mapStatIcon}>📍</span>
                      <div className={styles.mapStatText}>
                        <p>Status</p>
                        <strong>On the way</strong>
                      </div>
                    </div>
                    <div className={styles.mapStat}>
                      <span className={styles.mapStatIcon}>🏁</span>
                      <div className={styles.mapStatText}>
                        <p>Destination</p>
                        <strong>{order.shippingAddress?.city || 'Home'}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.mapWaiting}>
                  <div className={styles.mapWaitingIcon}>📡</div>
                  <p>Waiting for delivery partner to share live location...</p>
                  <span>Tracking will appear automatically once they start their journey.</span>
                </div>
              )}
            </section>
          )}


          {/* Items */}
          <section className={styles.drawerSection}>
            <h3 className={styles.drawerSectionTitle}>
              Items <span className={styles.drawerSectionCount}>{order.items?.length || 0}</span>
            </h3>
            <div className={styles.itemsList}>
              {(order.items || []).map((item, i) => (
                <div key={i} className={styles.itemRow}>
                  <div className={styles.itemImgWrap}>
                    {item.image ? <img src={item.image} alt={item.productName} className={styles.itemImg} /> : <div className={styles.itemImgFallback}>◆</div>}
                    <span className={styles.itemQtyBadge}>{item.quantity}</span>
                  </div>
                  <div className={styles.itemDetails}>
                    <p className={styles.itemName}>{item.productName || item.name}</p>
                    <div className={styles.itemVariants}>
                      {(item.variant?.size || item.size) && <span className={styles.variantChip}>{item.variant?.size || item.size}</span>}
                      {(item.variant?.color || item.color) && <span className={styles.variantChip}>{item.variant?.color || item.color}</span>}
                    </div>
                    <p className={styles.itemPriceInfo}>{fmt(item.price)} × {item.quantity}</p>
                  </div>
                  <div className={styles.itemTotal}>{fmt(item.totalPrice || item.price * item.quantity)}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Price */}
          <section className={styles.drawerSection}>
            <h3 className={styles.drawerSectionTitle}>Price Breakdown</h3>
            <div className={styles.priceTable}>
              <div className={styles.priceLine}><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
              {order.discount > 0 && <div className={`${styles.priceLine} ${styles.priceDiscount}`}><span>Discount</span><span>-{fmt(order.discount)}</span></div>}
              <div className={styles.priceLine}><span>Shipping</span><span>{order.shippingCharge === 0 ? <span className={styles.free}>Free</span> : fmt(order.shippingCharge)}</span></div>
              <div className={styles.priceLine}><span>GST ({gstPercent}%)</span><span>{fmt(order.tax)}</span></div>
              <div className={`${styles.priceLine} ${styles.priceTotal}`}><span>Total Paid</span><span>{fmt(order.totalAmount)}</span></div>
            </div>
          </section>

          {/* Address + Payment */}
          <div className={styles.drawerCols}>
            {order.shippingAddress && (
              <section className={styles.drawerSection}>
                <h3 className={styles.drawerSectionTitle}>Delivery Address</h3>
                <div className={styles.addrBlock}>
                  {order.shippingAddress.name && <p><strong>{order.shippingAddress.name}</strong></p>}
                  <p>{order.shippingAddress.address1}</p>
                  {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                  <p>{[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.pincode].filter(Boolean).join(", ")}</p>
                  {order.shippingAddress.phone && <p>📞 {order.shippingAddress.phone}</p>}
                </div>
              </section>
            )}
            <section className={styles.drawerSection}>
              <h3 className={styles.drawerSectionTitle}>Payment</h3>
              <div className={styles.payBlock}>
                <div className={styles.payRow}><span className={styles.payLabel}>Method</span><span className={styles.payVal}>{isCOD ? "Cash on Delivery" : "Online"}</span></div>
                <div className={styles.payRow}><span className={styles.payLabel}>Status</span><span className={`${styles.payStatus} ${order.paymentStatus === "paid" ? styles.payPaid : ""}`}>{order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1)}</span></div>
              </div>
            </section>
          </div>

          {/* Tracking */}
          {(order.trackingNumber || order.courierName) && (
            <section className={styles.drawerSection}>
              <h3 className={styles.drawerSectionTitle}>Tracking</h3>
              <div className={styles.trackingBlock}>
                {order.courierName && <div className={styles.payRow}><span className={styles.payLabel}>Courier</span><span className={styles.payVal}>{order.courierName}</span></div>}
                {order.trackingNumber && <div className={styles.payRow}><span className={styles.payLabel}>Tracking #</span><span className={`${styles.payVal} ${styles.payTxn}`}>{order.trackingNumber}</span></div>}
              </div>
            </section>
          )}

          {/* History */}
          {(order.statusHistory || []).length > 0 && (
            <section className={styles.drawerSection}>
              <h3 className={styles.drawerSectionTitle}>History</h3>
              <div className={styles.historyList}>
                {[...(order.statusHistory || [])].reverse().map((h, i) => (
                  <div key={i} className={styles.historyItem}>
                    <div className={styles.historyDot} />
                    <div className={styles.historyContent}>
                      <span className={styles.historyStatus}>{S[h.status]?.label || h.status}</span>
                      {h.note && <span className={styles.historyNote}>{h.note}</span>}
                      <span className={styles.historyTime}>{fmtDate(h.changedAt)} {fmtTime(h.changedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className={styles.drawerFooter}>
          {canCancel && (
            <button className={styles.cancelBtn} onClick={handleCancel} disabled={cancelling}>
              {cancelling ? "Cancelling…" : "Cancel Order"}
            </button>
          )}

          {/* Review buttons for delivered orders */}
          {isDelivered && (order.items || []).slice(0, 2).map((item, i) => (
            <button
              key={i}
              className={styles.reviewBtn}
              onClick={() => { onReview({ order, item }); onClose(); }}
            >
              ★ {(order.items || []).length > 1 ? `Review Item ${i + 1}` : "Write Review"}
            </button>
          ))}

          <Link to="/collections" className={styles.shopMoreBtn}>
            Continue Shopping
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, index, onOpen }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  const cfg = S[order.orderStatus] || { label: order.orderStatus, cls: "gold" };
  const previewItems = (order.items || []).slice(0, 4);
  const extraCount   = Math.max(0, (order.items || []).length - 4);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); io.disconnect(); } }, { threshold: 0.06 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <article
      ref={ref}
      className={`${styles.card} ${vis ? styles.cardVis : ""}`}
      style={{ "--delay": `${index * 0.06}s` }}
      onClick={() => onOpen(order)}
    >
      <div className={styles.cardTop}>
        <div className={styles.cardTopLeft}>
          <span className={styles.cardOrderNum}>#{order.orderNumber || order._id?.slice(-8).toUpperCase()}</span>
          <span className={styles.cardDate}>{fmtDate(order.createdAt)}</span>
        </div>
        <span className={`${styles.statusBadge} ${styles[`status_${cfg.cls}`]}`}>{cfg.label}</span>
      </div>

      <div className={styles.cardImages}>
        {previewItems.map((item, i) => (
          <div key={i} className={styles.cardImgSlot}>
            {item.image ? <img src={item.image} alt={item.productName} loading="lazy" /> : <div className={styles.cardImgFallback}>◆</div>}
          </div>
        ))}
        {extraCount > 0 && <div className={`${styles.cardImgSlot} ${styles.cardImgExtra}`}>+{extraCount}</div>}
      </div>

      <div className={styles.cardItemNames}>
        {(order.items || []).slice(0, 2).map((item, i) => (
          <span key={i} className={styles.cardItemName}>{item.productName || item.name}</span>
        ))}
        {(order.items || []).length > 2 && <span className={styles.cardItemMore}>+{order.items.length - 2} more items</span>}
      </div>

      <div className={styles.cardBottom}>
        <div className={styles.cardTotal}>
          <span className={styles.cardTotalLabel}>Total</span>
          <span className={styles.cardTotalVal}>{fmt(order.totalAmount)}</span>
        </div>
        <div className={styles.cardBottomRight}>
          {order.orderStatus === "delivered" && (
            <span className={styles.reviewHint}>★ Review</span>
          )}
          <button className={styles.cardDetailBtn}>
            View Details
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}

function Skeleton() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.skRow}><div className={`${styles.skBlock} ${styles.skShort}`} /><div className={`${styles.skBlock} ${styles.skBadge}`} /></div>
      <div className={styles.skImages}>{[0,1,2,3].map(i => <div key={i} className={`${styles.skBlock} ${styles.skImg}`} />)}</div>
      <div className={styles.skRow}><div className={`${styles.skBlock} ${styles.skMed}`} /><div className={`${styles.skBlock} ${styles.skShort}`} /></div>
    </div>
  );
}

/* ════════ MAIN PAGE ════════ */
export default function MyOrders() {
  const navigate = useNavigate();
  const { user, isLoggedIn, accessToken } = useAuthStore();

  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [tab,          setTab]          = useState("all");
  const [open,         setOpen]         = useState(null);
  const [toast,        setToast]        = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null); // { order, item }
  const toastRef = useRef(null);

  const showToast = useCallback((msg, type = "ok") => {
    clearTimeout(toastRef.current);
    setToast({ msg, type });
    toastRef.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const handleCancel = useCallback(async (id) => {
    try {
      await apiFetch(`/orders/${id}/cancel`, { method: "PUT", body: JSON.stringify({ reason: "Cancelled by customer" }) });
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, orderStatus: "cancelled" } : o)));
      showToast("Order cancelled", "neutral");
    } catch (e) {
      showToast(e.message, "err");
    }
  }, [showToast]);

  useEffect(() => {
    if (!user || !isLoggedIn) { navigate("/login"); return; }
    const token = localStorage.getItem("userToken") || accessToken;
    if (!token) { navigate("/login"); return; }

    setLoading(true);
    apiFetch("/orders/my-orders")
      .then((data) => {
        const list = Array.isArray(data) ? data : data.orders || data.data || [];
        setOrders(list);
      })
      .catch((err) => {
        setError(err.message);
        if (err.message.includes("401")) navigate("/login");
      })
      .finally(() => setLoading(false));
  }, [user, isLoggedIn, accessToken, navigate]);

  const displayed = useMemo(() => filterOrders(orders, tab), [orders, tab]);
  const counts = useMemo(() => ({
    all:       orders.length,
    active:    filterOrders(orders, "active").length,
    delivered: filterOrders(orders, "delivered").length,
    cancelled: filterOrders(orders, "cancelled").length,
  }), [orders]);

  return (
    <div className={styles.page}>
      {/* Toast */}
      <div className={`${styles.toast} ${toast ? styles.toastVis : ""} ${toast?.type === "err" ? styles.toastErr : ""}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {toast?.type === "err" ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></> : <polyline points="20 6 9 17 4 12" />}
        </svg>
        {toast?.msg}
      </div>

      {/* Order drawer */}
      {open && (
        <OrderDrawer
          order={open}
          onClose={() => setOpen(null)}
          onCancel={handleCancel}
          onReview={setReviewTarget}
        />
      )}

      {/* Review modal */}
      {reviewTarget && (
        <ReviewModal
          order={reviewTarget.order}
          item={reviewTarget.item}
          onClose={() => setReviewTarget(null)}
          onSuccess={() => showToast("Review submitted — thank you! ★")}
        />
      )}

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerText}>
            <p className={styles.eyebrow}>◆ LUXURIA</p>
            <h1 className={styles.title}>My <em>Orders</em></h1>
            <p className={styles.sub}>{loading ? "Loading your orders…" : `${orders.length} order${orders.length !== 1 ? "s" : ""} placed`}</p>
          </div>
          <Link to="/collections" className={styles.shopLink}>
            Shop More
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Tab bar */}
      <div className={styles.tabBar}>
        {TABS.map((t) => (
          <button key={t.id} className={`${styles.tab} ${tab === t.id ? styles.tabActive : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
            {!loading && <span className={styles.tabCount}>{counts[t.id]}</span>}
          </button>
        ))}
      </div>

      {/* Main */}
      <main className={styles.main}>
        {loading ? (
          <div className={styles.grid}>{[0,1,2,3,4,5].map(i => <Skeleton key={i} />)}</div>
        ) : error ? (
          <div className={styles.errorState}>
            <div className={styles.errorIcon}>◆</div>
            <h2>Could not load orders</h2>
            <p>{error}</p>
            <button className={styles.retryBtn} onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : displayed.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconWrap}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>
            <h2 className={styles.emptyTitle}>{tab === "all" ? "No orders yet" : `No ${tab} orders`}</h2>
            <p className={styles.emptySub}>{tab === "all" ? "Your purchase history will appear here." : "Try a different filter."}</p>
            {tab === "all" ? <Link to="/collections" className={styles.emptyBtn}>Start Shopping</Link> : <button className={styles.emptyBtn} onClick={() => setTab("all")}>Show All</button>}
          </div>
        ) : (
          <div className={styles.grid}>
            {displayed.map((o, i) => <OrderCard key={o._id} order={o} index={i} onOpen={setOpen} />)}
          </div>
        )}
      </main>

      <div className={styles.pageFooter}>
        <Link to="/profile" className={styles.footerLink}>← Back to Profile</Link>
      </div>
    </div>
  );
}