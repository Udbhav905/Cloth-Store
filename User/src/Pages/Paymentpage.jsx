import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from "@stripe/react-stripe-js";
import useAuthStore from "../store/Useauthstore";
import useCartStore from "../store/Usecartstore";
import styles from "./styles/Paymentpage.module.css";

const API = "http://localhost:3000/api";

function authHeader() {
  const token =
    useAuthStore.getState()?.accessToken ||
    localStorage.getItem("accessToken") ||
    "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeader(), ...(options.headers || {}) },
    credentials: "include",
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

function fmt(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
}

/* ── Format card number for display on card face ── */
function displayCardNumber(raw) {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  const padded = digits.padEnd(16, "•");
  return padded.match(/.{1,4}/g).join("  ");
}

/* ── Detect card brand from first digits ── */
function getCardBrand(num) {
  const d = num.replace(/\D/g, "");
  if (/^4/.test(d))           return "VISA";
  if (/^5[1-5]/.test(d))      return "MC";
  if (/^3[47]/.test(d))       return "AMEX";
  if (/^6(?:011|5)/.test(d))  return "DISC";
  return "CARD";
}

/* ── Stripe element base style ── */
const stripeStyle = {
  style: {
    base: {
      fontSize: "15px",
      color: "#e8e0d4",
      fontFamily: '"DM Sans","Helvetica Neue",sans-serif',
      fontSmoothing: "antialiased",
      letterSpacing: "0.04em",
      "::placeholder": { color: "#6b6560" },
    },
    invalid: { color: "#dc5050", iconColor: "#dc5050" },
  },
};

/* ════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════ */
export default function PaymentPage() {
  const stripe   = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const location = useLocation();
  const clearCart = useCartStore((s) => s.clearCart);

  const { orderBody, subtotal, shipping, tax, discount, total } = location.state || {};

  useEffect(() => {
    if (!orderBody || !total) navigate("/cart", { replace: true });
  }, []);

  /* ── Card display state ─────────────────────────── */
  const [cardNum,    setCardNum]    = useState("");     // raw digits typed
  const [cardExpiry, setCardExpiry] = useState("");     // "MM / YY"
  const [cardCvc,    setCardCvc]    = useState("");     // "•••"
  const [cardName,   setCardName]   = useState(
    useAuthStore.getState()?.user?.name?.toUpperCase() || ""
  );
  const [flipped,    setFlipped]    = useState(false);  // true = show back (CVC)
  const [focusedField, setFocused]  = useState("");     // "number"|"expiry"|"cvc"|"name"

  /* ── Stripe completeness ───────────────────────── */
  const [numComplete,  setNumComplete]  = useState(false);
  const [expComplete,  setExpComplete]  = useState(false);
  const [cvcComplete,  setCvcComplete]  = useState(false);
  const cardComplete = numComplete && expComplete && cvcComplete;

  /* ── UI state ──────────────────────────────────── */
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const nameRef = useRef(null);

  /* Flip to back when CVC focused, front otherwise */
  useEffect(() => {
    setFlipped(focusedField === "cvc");
  }, [focusedField]);

  /* ── Payment handler ───────────────────────────── */
  const handlePay = async () => {
    if (!stripe || !elements) { setError("Stripe not ready."); return; }
    if (!cardComplete)         { setError("Please complete all card fields."); return; }

    setError("");
    setLoading(true);

    try {
      /* Step 1 — Create PaymentIntent */
      const { clientSecret } = await apiFetch("/payments/create-intent", {
        method: "POST",
        body: JSON.stringify({
          amount:   total,
          currency: "inr",
          metadata: { itemCount: String(orderBody?.items?.length || 0) },
        }),
      });
      if (!clientSecret) throw new Error("No client secret from server.");

      /* Step 2 — Confirm card payment using CardNumberElement */
      const { error: stripeErr, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardNumberElement),
            billing_details: { name: cardName || "Customer" },
          },
        }
      );
      if (stripeErr)                            throw new Error(stripeErr.message);
      if (paymentIntent.status !== "succeeded") throw new Error(`Payment ${paymentIntent.status}. Try again.`);

      /* Step 3 — Create order */
      const order = await apiFetch("/orders", {
        method: "POST",
        body: JSON.stringify({
          ...orderBody,
          paymentMethod:  "card",
          paymentStatus:  "paid",
          orderStatus:    "confirmed",
          paymentDetails: {
            transactionId: paymentIntent.id,
            paymentId:     paymentIntent.id,
            paidAt:        new Date().toISOString(),
          },
        }),
      });

      /* Step 4 — Verify (non-blocking) */
      apiFetch("/payments/verify", {
        method: "POST",
        body: JSON.stringify({ paymentIntentId: paymentIntent.id, orderId: order._id }),
      }).catch((e) => console.warn("[verify non-critical]", e.message));

      clearCart();
      navigate("/order-success", { state: { order }, replace: true });

    } catch (e) {
      console.error("Payment error:", e.message);
      setError(e.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const brand = getCardBrand(cardNum);

  return (
    <div className={styles.page}>

      {/* Header */}
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>◆ LUXURIA</Link>
        <div className={styles.headerCenter}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className={styles.lockIcon}>
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <span>Secure Payment</span>
        </div>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
      </header>

      <div className={styles.layout}>

        {/* ═══════════════════ LEFT ═══════════════════ */}
        <div className={styles.left}>

          {/* ── 3D Card Preview ── */}
          <div className={`${styles.cardScene} ${flipped ? styles.cardSceneFlipped : ""}`}>

            {/* FRONT */}
            <div className={styles.cardFace}>
              {/* Shine overlay */}
              <div className={styles.cardShine} />

              <div className={styles.cardTopRow}>
                {/* Chip */}
                <div className={styles.cardChip}>
                  <div className={styles.chipInner}>
                    <div className={styles.chipLine} />
                    <div className={styles.chipLine} />
                    <div className={styles.chipLine} />
                  </div>
                </div>
                {/* Brand */}
                <div className={styles.cardBrand}>
                  {brand === "VISA" && <span className={styles.brandVisa}>VISA</span>}
                  {brand === "MC"   && (
                    <div className={styles.brandMC}>
                      <span className={styles.brandMCLeft}  />
                      <span className={styles.brandMCRight} />
                    </div>
                  )}
                  {(brand === "CARD" || brand === "AMEX" || brand === "DISC") && (
                    <span className={styles.brandGeneric}>{brand}</span>
                  )}
                </div>
              </div>

              {/* Card number */}
              <div className={`${styles.cardNumberDisplay} ${focusedField === "number" ? styles.cardFieldHighlight : ""}`}>
                {displayCardNumber(cardNum)}
              </div>

              {/* Bottom row */}
              <div className={styles.cardBottomRow}>
                <div className={`${styles.cardFieldBlock} ${focusedField === "name" ? styles.cardFieldHighlight : ""}`}>
                  <span className={styles.cardMiniLabel}>Card Holder</span>
                  <span className={styles.cardFieldValue}>
                    {cardName || "YOUR NAME"}
                  </span>
                </div>
                <div className={`${styles.cardFieldBlock} ${focusedField === "expiry" ? styles.cardFieldHighlight : ""}`}>
                  <span className={styles.cardMiniLabel}>Expires</span>
                  <span className={styles.cardFieldValue}>
                    {cardExpiry || "MM / YY"}
                  </span>
                </div>
              </div>
            </div>

            {/* BACK */}
            <div className={`${styles.cardFace} ${styles.cardBack}`}>
              <div className={styles.cardShine} />
              <div className={styles.magStripe} />
              <div className={styles.cvcRow}>
                <div className={styles.cvcWhiteStripe} />
                <div className={styles.cvcBox}>
                  <span className={styles.cardMiniLabel}>CVC</span>
                  <span className={styles.cvcValue}>
                    {cardCvc ? "•".repeat(cardCvc.length) : "•••"}
                  </span>
                </div>
              </div>
              <div className={styles.cardBackBrand}>
                {brand === "VISA" && <span className={styles.brandVisa}>VISA</span>}
                {brand === "MC"   && (
                  <div className={styles.brandMC}>
                    <span className={styles.brandMCLeft}  />
                    <span className={styles.brandMCRight} />
                  </div>
                )}
                {(brand === "CARD" || brand === "AMEX" || brand === "DISC") && (
                  <span className={styles.brandGeneric}>{brand}</span>
                )}
              </div>
            </div>
          </div>

          {/* ── Form ── */}
          <div className={styles.formCard}>
            <h2 className={styles.formTitle}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                <rect x="1" y="4" width="22" height="16" rx="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              Card Details
            </h2>

            {/* Card number */}
            <div className={styles.field}>
              <label className={styles.label}>Card Number</label>
              <div className={`${styles.stripeBox} ${focusedField === "number" ? styles.stripeBoxFocused : ""}`}>
                <CardNumberElement
                  options={{ ...stripeStyle, showIcon: true }}
                  onFocus={() => setFocused("number")}
                  onBlur={() => setFocused("")}
                  onChange={(e) => {
                    setNumComplete(e.complete);
                    // Extract the value Stripe gives us for display
                    // Stripe doesn't expose raw digits for security,
                    // so we show a placeholder pattern based on completion
                    if (e.complete) setCardNum("4242424242424242"); // masked display
                    else if (e.empty) setCardNum("");
                    else setCardNum("42424242"); // partial
                    if (e.error) setError(e.error.message);
                    else setError("");
                  }}
                />
              </div>
            </div>

            {/* Expiry + CVC row */}
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>Expiry Date</label>
                <div className={`${styles.stripeBox} ${focusedField === "expiry" ? styles.stripeBoxFocused : ""}`}>
                  <CardExpiryElement
                    options={stripeStyle}
                    onFocus={() => setFocused("expiry")}
                    onBlur={() => setFocused("")}
                    onChange={(e) => {
                      setExpComplete(e.complete);
                      if (e.complete) setCardExpiry("12 / 28");
                      else if (e.empty) setCardExpiry("");
                      else setCardExpiry("12 / ••");
                      if (e.error) setError(e.error.message);
                    }}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  CVC
                  <span className={styles.cvcHint}>← flip card</span>
                </label>
                <div className={`${styles.stripeBox} ${focusedField === "cvc" ? styles.stripeBoxFocused : ""}`}>
                  <CardCvcElement
                    options={stripeStyle}
                    onFocus={() => setFocused("cvc")}
                    onBlur={() => setFocused("")}
                    onChange={(e) => {
                      setCvcComplete(e.complete);
                      if (e.complete) setCardCvc("•••");
                      else if (e.empty) setCardCvc("");
                      else setCardCvc("••");
                      if (e.error) setError(e.error.message);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Cardholder name */}
            <div className={styles.field}>
              <label className={styles.label}>Cardholder Name</label>
              <input
                ref={nameRef}
                className={styles.nameInput}
                type="text"
                value={cardName}
                placeholder="As on card"
                onFocus={() => setFocused("name")}
                onBlur={() => setFocused("")}
                onChange={(e) => setCardName(e.target.value.toUpperCase())}
              />
            </div>

            {/* Test card info */}
            <div className={styles.testBanner}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div>
                <strong>Test Mode</strong>
                <span>
                  Card: <code>4242 4242 4242 4242</code> &nbsp;·&nbsp;
                  Expiry: any future date &nbsp;·&nbsp;
                  CVC: any 3 digits
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className={styles.errorBox}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Pay button */}
            <button
              className={styles.payBtn}
              onClick={handlePay}
              disabled={loading || !stripe || !cardComplete}
            >
              {loading ? (
                <><div className={styles.spinner} /><span>Processing…</span></>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                  <span>Pay {fmt(total)} Securely</span>
                </>
              )}
            </button>

            <div className={styles.secureRow}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>256-bit SSL · PCI DSS · Powered by Stripe</span>
            </div>
          </div>
        </div>

        {/* ═══════════════════ RIGHT ═══════════════════ */}
        <aside className={styles.summary}>
          <h3 className={styles.summaryTitle}>Order Summary</h3>

          {(orderBody?.items || []).length > 0 && (
            <div className={styles.summaryItems}>
              {orderBody.items.map((item, i) => (
                <div key={i} className={styles.summaryItem}>
                  <div className={styles.summaryImg}>
                    <div className={styles.summaryImgInner}>
                      {item.image ? <img src={item.image} alt={item.name} /> : <span>◆</span>}
                    </div>
                    <span className={styles.summaryQty}>{item.quantity}</span>
                  </div>
                  <div className={styles.summaryInfo}>
                    <p className={styles.summaryName}>{item.name}</p>
                    <p className={styles.summaryMeta}>{[item.size, item.color].filter(Boolean).join(" · ")}</p>
                  </div>
                  <span className={styles.summaryPrice}>{fmt(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          )}

          <div className={styles.summaryLines}>
            <div className={styles.summaryLine}><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div className={styles.summaryLine}>
              <span>Shipping</span>
              <span className={shipping === 0 ? styles.free : ""}>{shipping === 0 ? "Free" : fmt(shipping)}</span>
            </div>
            <div className={styles.summaryLine}><span>GST (18%)</span><span>{fmt(tax)}</span></div>
            {discount > 0 && (
              <div className={`${styles.summaryLine} ${styles.summaryDiscount}`}>
                <span>Discount</span><span>-{fmt(discount)}</span>
              </div>
            )}
            <div className={`${styles.summaryLine} ${styles.summaryTotal}`}>
              <span>Total</span><span>{fmt(total)}</span>
            </div>
          </div>

          {orderBody?.shippingAddress && (
            <div className={styles.addrPreview}>
              <span className={styles.addrLabel}>Delivering to</span>
              <p className={styles.addrText}>
                {[
                  orderBody.shippingAddress.address1,
                  orderBody.shippingAddress.city,
                  orderBody.shippingAddress.state,
                  orderBody.shippingAddress.pincode,
                ].filter(Boolean).join(", ")}
              </p>
            </div>
          )}

          <div className={styles.badges}>
            {["SSL Secured", "PCI DSS", "Stripe"].map((l) => (
              <span key={l} className={styles.badge}>{l}</span>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}