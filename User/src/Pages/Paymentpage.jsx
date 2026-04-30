import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import useAuthStore from "../store/Useauthstore";
import useCartStore from "../store/Usecartstore";
import styles from "./styles/Paymentpage.module.css";

import useApiStore from "../store/others";
const API = useApiStore.getState().API;

// const API = "http://localhost:3000/api";

function authHeader() {
  const token =
    useAuthStore.getState()?.accessToken ||
    localStorage.getItem("accessToken") ||
    "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...(options.headers || {}),
    },
    credentials: "include",
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

function fmt(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

/* ── Build card number display from Stripe's brand + completion state ── */
function buildCardDisplay(brand, filledGroups) {
  const isAmex = brand === "amex";
  const groups = isAmex ? [4, 6, 5] : [4, 4, 4, 4];
  const result = groups.map((len, i) => {
    if (i < filledGroups) return "•".repeat(len);
    return "·".repeat(len);
  });
  return result.join("  ");
}

/* ── Map Stripe brand string → display label ── */
function mapBrand(stripeBrand) {
  const map = {
    visa: "VISA",
    mastercard: "MC",
    amex: "AMEX",
    discover: "DISC",
    jcb: "JCB",
    unionpay: "UP",
    diners: "DINE",
  };
  return map[stripeBrand] || "CARD";
}

/* ── Stripe element shared style ── */
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
   MAIN COMPONENT
════════════════════════════════════════════════════════ */
export default function PaymentPage() {
  const stripe   = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const location = useLocation();
  const clearCart = useCartStore((s) => s.clearCart);

  const { orderBody, subtotal, shipping, gst, gstRate, discount, total } =
    location.state || {};

  useEffect(() => {
    if (!orderBody || !total) {
      navigate("/cart", { replace: true });
    }
  }, []);

  /* ── Card display state ── */
  const [stripeBrand,   setStripeBrand]   = useState("unknown");
  const [filledGroups,  setFilledGroups]  = useState(0);
  const [cardExpiry,    setCardExpiry]    = useState("");
  const [cvcLength,     setCvcLength]     = useState(0);
  const [cardName,      setCardName]      = useState(
    (useAuthStore.getState()?.user?.name || "").toUpperCase()
  );
  const [flipped,       setFlipped]       = useState(false);
  const [focusedField,  setFocused]       = useState("");

  const [numComplete, setNumComplete] = useState(false);
  const [expComplete, setExpComplete] = useState(false);
  const [cvcComplete, setCvcComplete] = useState(false);
  const cardComplete = numComplete && expComplete && cvcComplete;

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const nameRef = useRef(null);

  useEffect(() => {
    setFlipped(focusedField === "cvc");
  }, [focusedField]);

  const brand          = mapBrand(stripeBrand);
  const cardNumDisplay = buildCardDisplay(stripeBrand, filledGroups);
  const cvcDisplay = cvcLength > 0
    ? "•".repeat(cvcLength)
    : (brand === "AMEX" ? "····" : "···");
  const expiryDisplay = cardExpiry || "MM / YY";

  const displayGSTPercent = gstRate ? Math.round(gstRate * 100) : 0;

  const focusElement = (elementType) => {
    if (!elements) return;
    const element = elements.getElement(elementType);
    if (element) element.focus();
  };

  const handlePay = async () => {
    if (!stripe || !elements) { setError("Stripe not ready."); return; }
    if (!cardComplete)         { setError("Please complete all card fields."); return; }
    if (!cardName.trim())      { setError("Please enter the cardholder name."); return; }

    setError("");
    setLoading(true);

    try {
      const amountToPay = Math.round(total);
      
      console.log("💰 Payment Amount:", amountToPay);
      console.log("📊 GST Details:", { gst, gstRate, displayGSTPercent });
      
      const { clientSecret } = await apiFetch("/payments/create-intent", {
        method: "POST",
        body: JSON.stringify({
          amount:   amountToPay,
          currency: "inr",
          metadata: { 
            itemCount: String(orderBody?.items?.length || 0),
            subtotal: subtotal,
            discount: discount,
            gst: gst,
            gstRate: gstRate
          },
        }),
      });
      if (!clientSecret) throw new Error("No client secret from server.");

      /* Step 2 — Confirm card payment */
      const { error: stripeErr, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardNumberElement),
            billing_details: { name: cardName || "Customer" },
          },
        });
      if (stripeErr)
        throw new Error(stripeErr.message);
      if (paymentIntent.status !== "succeeded")
        throw new Error(`Payment ${paymentIntent.status}. Try again.`);

      /* Step 3 — Create order with ALL correct values */
      const order = await apiFetch("/orders", {
        method: "POST",
        body: JSON.stringify({
          ...orderBody,
          paymentMethod:  "card",
          paymentStatus:  "paid",
          orderStatus:    "confirmed",
          subtotal: subtotal,
          discount: discount,
          gst: gst,
          gstRate: gstRate,
          shippingCharge: shipping || 0,
          totalAmount: amountToPay,
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
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          orderId: order._id,
        }),
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

  /* ── Brand logo JSX ── */
  const BrandLogo = () => {
    if (brand === "VISA") return <span className={styles.brandVisa}>VISA</span>;
    if (brand === "MC")
      return (
        <div className={styles.brandMC}>
          <span className={styles.brandMCLeft}  />
          <span className={styles.brandMCRight} />
        </div>
      );
    if (brand === "AMEX")
      return <span className={styles.brandAmex}>AMEX</span>;
    if (brand === "DISC")
      return <span className={styles.brandDisc}>DISC<em>OVER</em></span>;
    return <span className={styles.brandGeneric}>{brand !== "CARD" ? brand : ""}</span>;
  };

  return (
    <div className={styles.page}>

      {/* Header */}
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>◆ LUXURIA</Link>
        <div className={styles.headerCenter}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.3" className={styles.lockIcon}>
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <span>Secure Payment</span>
        </div>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>
      </header>

      <div className={styles.layout}>

        {/* LEFT COLUMN */}
        <div className={styles.left}>

          {/* 3-D Flip Card */}
          <div
            className={`${styles.cardScene} ${flipped ? styles.cardSceneFlipped : ""}`}
            aria-label="Credit card preview"
          >
            {/* FRONT */}
            <div className={styles.cardFace}>
              <div className={styles.cardShine} />
              <div className={styles.cardTopRow}>
                <div className={styles.cardChip}>
                  <div className={styles.chipGrid}>
                    <div /><div /><div />
                    <div /><div /><div />
                    <div /><div /><div />
                  </div>
                </div>
                <div className={styles.cardBrand}><BrandLogo /></div>
              </div>
              <div
                className={`${styles.cardNumberDisplay} ${
                  focusedField === "number" ? styles.cardFieldHighlight : ""
                }`}
              >
                {cardNumDisplay}
              </div>
              <div className={styles.cardBottomRow}>
                <div
                  className={`${styles.cardFieldBlock} ${
                    focusedField === "name" ? styles.cardFieldHighlight : ""
                  }`}
                >
                  <span className={styles.cardMiniLabel}>Card Holder</span>
                  <span className={styles.cardFieldValue}>
                    {cardName || "YOUR NAME"}
                  </span>
                </div>
                <div
                  className={`${styles.cardFieldBlock} ${
                    focusedField === "expiry" ? styles.cardFieldHighlight : ""
                  }`}
                >
                  <span className={styles.cardMiniLabel}>Expires</span>
                  <span className={styles.cardFieldValue}>{expiryDisplay}</span>
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
                  <span className={styles.cvcLabel}>CVC</span>
                  <span className={styles.cvcValue}>{cvcDisplay}</span>
                </div>
              </div>
              <div className={styles.cardBackBrand}><BrandLogo /></div>
            </div>
          </div>

          {/* Form */}
          <div className={styles.formCard}>
            <h2 className={styles.formTitle}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.3">
                <rect x="1" y="4" width="22" height="16" rx="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              Card Details
            </h2>

            {/* Card Number */}
            <div className={styles.field}>
              <label className={styles.label}>Card Number</label>
              <div
                className={`${styles.stripeBox} ${
                  focusedField === "number" ? styles.stripeBoxFocused : ""
                }`}
                style={{ height: '42px', minHeight: '42px', maxHeight: '42px' }}
                onClick={() => focusElement(CardNumberElement)}
              >
                <CardNumberElement
                  options={{ ...stripeStyle, showIcon: true }}
                  onFocus={() => setFocused("number")}
                  onBlur={()  => setFocused("")}
                  onChange={(e) => {
                    setNumComplete(e.complete);
                    if (e.brand) setStripeBrand(e.brand);
                    
                    if (e.empty) {
                      setFilledGroups(0);
                    } else if (e.complete) {
                      setFilledGroups(4); // Max groups for display
                    } else {
                      // If not empty but not complete, show as "filling" (2 groups)
                      setFilledGroups(2);
                    }

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
                <div
                  className={`${styles.stripeBox} ${
                    focusedField === "expiry" ? styles.stripeBoxFocused : ""
                  }`}
                  style={{ height: '42px', minHeight: '42px', maxHeight: '42px' }}
                  onClick={() => focusElement(CardExpiryElement)}
                >
                  <CardExpiryElement
                    options={stripeStyle}
                    onFocus={() => setFocused("expiry")}
                    onBlur={()  => setFocused("")}
                    onChange={(e) => {
                      setExpComplete(e.complete);
                      if (e.empty) {
                        setCardExpiry("");
                      } else if (e.complete) {
                        setCardExpiry("•• / ••");
                      } else {
                        setCardExpiry("·· / ··");
                      }
                      if (e.error) setError(e.error.message);
                      else setError("");
                    }}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  CVC
                  <span className={styles.cvcHint}>← flip</span>
                </label>
                <div
                  className={`${styles.stripeBox} ${
                    focusedField === "cvc" ? styles.stripeBoxFocused : ""
                  }`}
                  style={{ height: '42px', minHeight: '42px', maxHeight: '42px' }}
                  onClick={() => focusElement(CardCvcElement)}
                >
                  <CardCvcElement
                    options={stripeStyle}
                    onFocus={() => setFocused("cvc")}
                    onBlur={()  => setFocused("")}
                    onChange={(e) => {
                      setCvcComplete(e.complete);
                      const maxCvc = stripeBrand === "amex" ? 4 : 3;
                      if (e.empty)     setCvcLength(0);
                      else if (e.complete) setCvcLength(maxCvc);
                      else             setCvcLength(Math.max(1, maxCvc - 1));
                      if (e.error) setError(e.error.message);
                      else setError("");
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
                placeholder="As printed on card"
                onFocus={() => setFocused("name")}
                onBlur={()  => setFocused("")}
                onChange={(e) => setCardName(e.target.value)}
                autoComplete="cc-name"
                spellCheck={false}
              />
            </div>

            {/* Test mode banner */}
            <div className={styles.testBanner}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.4">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div>
                <strong>Test Mode</strong>
                <span>
                  Card: <code>4242 4242 4242 4242</code>&nbsp;·&nbsp;
                  Expiry: any future date&nbsp;·&nbsp;
                  CVC: any 3 digits
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className={styles.errorBox} role="alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8"  x2="12"    y2="12"/>
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
              aria-busy={loading}
            >
              {loading ? (
                <><div className={styles.spinner} /><span>Processing…</span></>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="1.5">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                  <span>Pay {fmt(total)} Securely</span>
                </>
              )}
            </button>

            <div className={styles.secureRow}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.3">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>256-bit SSL · PCI DSS · Powered by Stripe</span>
            </div>
          </div>
        </div>

        {/* RIGHT — ORDER SUMMARY */}
        <aside className={styles.summary} aria-label="Order summary">
          <h3 className={styles.summaryTitle}>Order Summary</h3>

          {(orderBody?.items || []).length > 0 && (
            <div className={styles.summaryItems}>
              {orderBody.items.map((item, i) => (
                <div key={i} className={styles.summaryItem}>
                  <div className={styles.summaryImg}>
                    <div className={styles.summaryImgInner}>
                      {item.image
                        ? <img src={item.image} alt={item.name} loading="lazy" />
                        : <span>◆</span>
                      }
                    </div>
                    <span className={styles.summaryQty}>{item.quantity}</span>
                  </div>
                  <div className={styles.summaryInfo}>
                    <p className={styles.summaryName}>{item.name}</p>
                    <p className={styles.summaryMeta}>
                      {[item.size, item.color].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span className={styles.summaryPrice}>
                    {fmt(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className={styles.summaryLines}>
            <div className={styles.summaryLine}>
              <span>Subtotal</span><span>{fmt(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className={`${styles.summaryLine} ${styles.summaryDiscount}`}>
                <span>Discount</span><span>-{fmt(discount)}</span>
              </div>
            )}
            <div className={styles.summaryLine}>
              <span>GST ({displayGSTPercent}%)</span>
              <span>{fmt(gst)}</span>
            </div>
            <div className={styles.summaryLine}>
              <span>Shipping</span>
              <span className={styles.free}>Free</span>
            </div>
            <div className={`${styles.summaryLine} ${styles.summaryTotal}`}>
              <span>Total</span>
              <span>{fmt(total)}</span>
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