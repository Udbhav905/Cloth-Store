import { useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import styles from "./styles/OrderSuccess.module.css";

function fmt(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
}

const STATUS_COLORS = {
  pending:         "gold",
  confirmed:       "gold",
  processing:      "blue",
  shipped:         "blue",
  out_for_delivery:"blue",
  delivered:       "green",
  cancelled:       "red",
};

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { order } = location.state || {};

  /* Redirect if landed without state */
  useEffect(() => {
    if (!order) navigate("/");
  }, []);

  /* Confetti burst — CSS-only particles */
  const particles = Array.from({ length: 24 }, (_, i) => ({
    left:  `${(i * 4.17) % 100}%`,
    delay: `${(i * 0.08).toFixed(2)}s`,
    dur:   `${0.9 + (i % 4) * 0.2}s`,
    color: ["#c9a96e","#e8e0d4","#fff","#c9a96e88"][i % 4],
    size:  `${4 + (i % 4) * 2}px`,
  }));

  if (!order) return null;

  const isCOD    = order.paymentMethod === "cod";
  const total    = order.totalAmount || 0;

  return (
    <div className={styles.page}>

      {/* Confetti */}
      <div className={styles.confetti} aria-hidden>
        {particles.map((p, i) => (
          <div
            key={i}
            className={styles.confettiPiece}
            style={{
              left:            p.left,
              width:           p.size,
              height:          p.size,
              background:      p.color,
              animationDelay:  p.delay,
              animationDuration: p.dur,
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div className={styles.card}>

        {/* Success icon */}
        <div className={styles.iconWrap}>
          <div className={styles.iconRing} />
          <div className={styles.iconCircle}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        </div>

        <h1 className={styles.title}>
          {isCOD ? "Order Placed!" : "Payment Successful!"}
        </h1>
        <p className={styles.sub}>
          {isCOD
            ? "Your order has been placed. Pay when it arrives."
            : "Your payment was confirmed. We're preparing your order."}
        </p>

        {/* Order number */}
        <div className={styles.orderNum}>
          <span className={styles.orderNumLabel}>Order Number</span>
          <span className={styles.orderNumVal}>{order.orderNumber || order._id?.slice(-8).toUpperCase()}</span>
        </div>

        {/* Order items */}
        {order.items?.length > 0 && (
          <div className={styles.items}>
            {order.items.map((item, i) => (
              <div key={i} className={styles.item}>
                {item.image && <img src={item.image} alt={item.productName} className={styles.itemImg} />}
                <div className={styles.itemInfo}>
                  <p className={styles.itemName}>{item.productName}</p>
                  <p className={styles.itemMeta}>
                    {[item.variant?.size, item.variant?.color].filter(Boolean).join(" · ")} · Qty {item.quantity}
                  </p>
                </div>
                <span className={styles.itemPrice}>{fmt(item.totalPrice)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        <div className={styles.totals}>
          {order.subtotal    > 0  && <div className={styles.totalLine}><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>}
          {order.shippingCharge   && <div className={styles.totalLine}><span>Shipping</span><span>{order.shippingCharge === 0 ? "Free" : fmt(order.shippingCharge)}</span></div>}
          {order.tax         > 0  && <div className={styles.totalLine}><span>GST</span><span>{fmt(order.tax)}</span></div>}
          {order.discount    > 0  && <div className={`${styles.totalLine} ${styles.discount}`}><span>Discount</span><span>-{fmt(order.discount)}</span></div>}
          <div className={`${styles.totalLine} ${styles.grandTotal}`}><span>Total Paid</span><span>{fmt(total)}</span></div>
        </div>

        {/* Delivery address */}
        {order.shippingAddress && (
          <div className={styles.addrBlock}>
            <span className={styles.addrBlockLabel}>Delivering to</span>
            <p className={styles.addrBlockText}>
              {[
                order.shippingAddress.address1,
                order.shippingAddress.address2,
                order.shippingAddress.city,
                order.shippingAddress.state,
                order.shippingAddress.pincode,
              ].filter(Boolean).join(", ")}
            </p>
          </div>
        )}

        {/* Status */}
        <div className={styles.statusRow}>
          <span className={styles.statusLabel}>Order Status</span>
          <span className={`${styles.statusBadge} ${styles[`status_${STATUS_COLORS[order.orderStatus] || "gold"}`]}`}>
            {order.orderStatus || "Pending"}
          </span>
        </div>

        {/* Payment badge */}
        <div className={styles.statusRow}>
          <span className={styles.statusLabel}>Payment</span>
          <span className={`${styles.statusBadge} ${isCOD ? styles.status_gold : styles.status_green}`}>
            {isCOD ? "Cash on Delivery" : "Paid · " + (order.paymentDetails?.transactionId?.slice(-8) || "")}
          </span>
        </div>

        {/* CTA Buttons */}
        <div className={styles.ctaRow}>
          <Link to="/my-orders" className={styles.btnPrimary}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            View My Orders
          </Link>
          <Link to="/collections" className={styles.btnSecondary}>
            Continue Shopping
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </Link>
        </div>

        <p className={styles.footNote}>◆ LUXURIA · Thank you for shopping with us</p>
      </div>
    </div>
  );
}