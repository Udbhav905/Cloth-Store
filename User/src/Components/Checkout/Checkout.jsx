import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import useAuthStore from "../../store/Useauthstore";
import useCartStore from "../../store/Usecartstore";
import styles from "./Checkout.module.css";

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
  if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
  return data;
}

/* ── Price helpers ─────────────────────────────────────── */
function fmt(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
}

/* ── Step indicator ────────────────────────────────────── */
function Steps({ current }) {
  const steps = ["Address", "Payment", "Confirm"];
  return (
    <div className={styles.steps}>
      {steps.map((s, i) => (
        <div key={s} className={`${styles.step} ${i < current ? styles.stepDone : ""} ${i === current ? styles.stepActive : ""}`}>
          <div className={styles.stepDot}>
            {i < current
              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              : <span>{i + 1}</span>
            }
          </div>
          <span className={styles.stepLabel}>{s}</span>
          {i < steps.length - 1 && <div className={`${styles.stepLine} ${i < current ? styles.stepLineDone : ""}`} />}
        </div>
      ))}
    </div>
  );
}

/* ── Address card ──────────────────────────────────────── */
function AddressOption({ addr, selected, onSelect }) {
  return (
    <div
      className={`${styles.addrOption} ${selected ? styles.addrOptionSelected : ""}`}
      onClick={() => onSelect(addr)}
    >
      <div className={styles.addrOptionRadio}>
        <div className={styles.addrOptionDot} />
      </div>
      <div className={styles.addrOptionBody}>
        {addr.isDefault && <span className={styles.defaultTag}>Default</span>}
        <p className={styles.addrText}>{addr.address1}</p>
        {addr.address2 && <p className={styles.addrText}>{addr.address2}</p>}
        <p className={styles.addrText}>{[addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}</p>
        <p className={styles.addrText}>{addr.country}</p>
      </div>
    </div>
  );
}

/* ── EMPTY_ADDR form ───────────────────────────────────── */
const EMPTY = { address1: "", address2: "", city: "", state: "", pincode: "", country: "India" };

/* ════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════ */
export default function Checkout() {
  const navigate  = useNavigate();
  const location  = useLocation();

  /* product passed from "Buy Now" click:
     { product, selectedVariant, quantity } */
  const buyNow = location.state?.buyNow || null;

  const { user }       = useAuthStore();
  const cartItems      = useCartStore((s) => s.items);
  const clearCart      = useCartStore((s) => s.clearCart);

  /* ── Items to order ─────────────────────────────────── */
  const orderItems = useMemo(() => {
    if (buyNow) {
      const { product, selectedVariant, quantity = 1 } = buyNow;
      return [{
        productId:   product._id,
        name:        product.name,
        price:       selectedVariant?.discountedPrice || selectedVariant?.price || product.basePrice,
        size:        selectedVariant?.size  || "FREE",
        color:       selectedVariant?.color || "Default",
        sku:         selectedVariant?.sku   || "",
        quantity,
        image:       product.mainImage,
        slug:        product.slug,
        _product:    product,
      }];
    }
    return cartItems.map((i) => ({ ...i, productId: i.productId }));
  }, [buyNow, cartItems]);

  /* ── Step: 0=address, 1=payment, 2=confirm ─────────── */
  const [step,          setStep]          = useState(0);
  const [addresses,     setAddresses]     = useState([]);
  const [selAddr,       setSelAddr]       = useState(null);
  const [showNewAddr,   setShowNewAddr]   = useState(false);
  const [newAddrForm,   setNewAddrForm]   = useState(EMPTY);
  const [payMethod,     setPayMethod]     = useState("cod");   // "cod" | "card"
  const [loading,       setLoading]       = useState(false);
  const [addrLoading,   setAddrLoading]   = useState(true);
  const [error,         setError]         = useState("");
  const [coupon,        setCoupon]        = useState("");
  const [couponApplied, setCouponApplied] = useState(null);

  /* ── Totals ─────────────────────────────────────────── */
  const subtotal = useMemo(() =>
    orderItems.reduce((acc, i) => acc + (i.price * i.quantity), 0),
  [orderItems]);

  const shipping = subtotal > 500 ? 0 : 50;
  const tax      = Math.round(subtotal * 0.18);
  const discount = couponApplied?.discount || 0;
  const total    = subtotal + shipping + tax - discount;

  /* ── Fetch saved addresses ──────────────────────────── */
  useEffect(() => {
    apiFetch("/users/addresses")
      .then((data) => {
        setAddresses(data || []);
        const def = data?.find((a) => a.isDefault) || data?.[0];
        if (def) setSelAddr(def);
      })
      .catch(() => {})
      .finally(() => setAddrLoading(false));
  }, []);

  /* ── Redirect if no items ───────────────────────────── */
  useEffect(() => {
    if (!buyNow && cartItems.length === 0) navigate("/cart");
  }, []);

  /* ── New address form handler ───────────────────────── */
  const setField = (k) => (e) => setNewAddrForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSaveNewAddr = async () => {
    if (!newAddrForm.address1.trim()) { setError("Address line 1 is required"); return; }
    try {
      setLoading(true);
      const saved = await apiFetch("/users/address", {
        method: "POST",
        body: JSON.stringify(newAddrForm),
      });
      setAddresses(saved);
      const last = saved[saved.length - 1];
      setSelAddr(last);
      setShowNewAddr(false);
      setNewAddrForm(EMPTY);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Coupon apply ───────────────────────────────────── */
  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      const data = await apiFetch(`/api/coupons/validate?code=${coupon}&amount=${subtotal}`);
      setCouponApplied({ code: coupon, discount: data.discount || 0 });
    } catch {
      setError("Invalid or expired coupon");
    }
  };

  /* ── Place order ────────────────────────────────────── */
 // In Checkout.jsx, update the handlePlaceOrder function for COD:

/* ── Place order ────────────────────────────────────── */
const handlePlaceOrder = async () => {
  if (!selAddr) { 
    setError("Please select a delivery address"); 
    return; 
  }
  
  if (payMethod === "cod" && total > 10000) {
    setError("Cash on Delivery not available for orders above ₹10,000");
    return;
  }
  
  setError("");
  setLoading(true);

  const body = {
    items: orderItems.map((i) => ({
      productId: i.productId,
      name: i.name,
      price: i.price,
      size: i.size,
      color: i.color,
      sku: i.sku || "",
      quantity: i.quantity,
      image: i.image,
      totalPrice: i.price * i.quantity,
    })),
    subtotal,
    discount,
    shippingCharge: shipping,
    tax,
    totalAmount: total,
    shippingAddress: {
      address1: selAddr.address1,
      address2: selAddr.address2 || "",
      city: selAddr.city,
      state: selAddr.state,
      pincode: selAddr.pincode,
      country: selAddr.country || "India",
    },
    billingAddress: {
      address1: selAddr.address1,
      address2: selAddr.address2 || "",
      city: selAddr.city,
      state: selAddr.state,
      pincode: selAddr.pincode,
      country: selAddr.country || "India",
    },
    paymentMethod: payMethod,
    paymentStatus: "pending",
    orderStatus: "pending",
    couponCode: couponApplied?.code || undefined,
    customerNotes: "",
  };

  try {
    if (payMethod === "cod") {
      console.log("Creating COD order:", body);
      const order = await apiFetch("/orders", { 
        method: "POST", 
        body: JSON.stringify(body) 
      });
      
      console.log("COD order created:", order);
      
      if (!buyNow) {
        clearCart();
      }
      
      navigate("/order-success", { 
        state: { order }, 
        replace: true 
      });
    } else {
      // card — pass order body to Stripe page
      navigate("/checkout/payment", {
        state: { 
          orderBody: body, 
          subtotal, 
          shipping, 
          tax, 
          discount, 
          total 
        },
      });
    }
  } catch (e) {
    console.error("Order creation error:", e);
    setError(e.message || "Failed to create order. Please try again.");
  } finally {
    setLoading(false);
  }
};

  /* ─────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>

      {/* Header */}
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>◆ LUXURIA</Link>
        <h1 className={styles.headerTitle}>Checkout</h1>
        <div />
      </header>

      <Steps current={step} />

      <div className={styles.layout}>

        {/* ── LEFT: Steps content ──────────────────────── */}
        <div className={styles.left}>

          {/* STEP 0 — Address */}
          {step === 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                Delivery Address
              </h2>

              {addrLoading ? (
                <div className={styles.addrSkeleton}>
                  {[0,1].map((i) => <div key={i} className={styles.addrSkeletonCard} />)}
                </div>
              ) : (
                <>
                  {addresses.length > 0 && (
                    <div className={styles.addrList}>
                      {addresses.map((a, i) => (
                        <AddressOption
                          key={a._id || i}
                          addr={a}
                          selected={selAddr?._id === a._id}
                          onSelect={setSelAddr}
                        />
                      ))}
                    </div>
                  )}

                  {/* Add new address toggle */}
                  <button
                    className={styles.addAddrBtn}
                    onClick={() => setShowNewAddr((p) => !p)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    {showNewAddr ? "Cancel" : "Add New Address"}
                  </button>

                  {showNewAddr && (
                    <div className={styles.newAddrForm}>
                      <div className={styles.fieldRow}>
                        <div className={styles.field}>
                          <label className={styles.label}>Address Line 1 *</label>
                          <input className={styles.input} value={newAddrForm.address1} onChange={setField("address1")} placeholder="House/Flat no, Street" />
                        </div>
                        <div className={styles.field}>
                          <label className={styles.label}>Address Line 2</label>
                          <input className={styles.input} value={newAddrForm.address2} onChange={setField("address2")} placeholder="Landmark, Area" />
                        </div>
                      </div>
                      <div className={styles.fieldRow}>
                        <div className={styles.field}>
                          <label className={styles.label}>City</label>
                          <input className={styles.input} value={newAddrForm.city} onChange={setField("city")} placeholder="City" />
                        </div>
                        <div className={styles.field}>
                          <label className={styles.label}>State</label>
                          <input className={styles.input} value={newAddrForm.state} onChange={setField("state")} placeholder="State" />
                        </div>
                      </div>
                      <div className={styles.fieldRow}>
                        <div className={styles.field}>
                          <label className={styles.label}>Pincode</label>
                          <input className={styles.input} value={newAddrForm.pincode} onChange={setField("pincode")} placeholder="Pincode" maxLength={6} />
                        </div>
                        <div className={styles.field}>
                          <label className={styles.label}>Country</label>
                          <input className={styles.input} value={newAddrForm.country} onChange={setField("country")} placeholder="Country" />
                        </div>
                      </div>
                      <button className={styles.btnPrimary} onClick={handleSaveNewAddr} disabled={loading}>
                        {loading ? "Saving…" : "Save & Use This Address"}
                      </button>
                    </div>
                  )}
                </>
              )}

              {error && <p className={styles.errorMsg}>{error}</p>}

              <button
                className={styles.btnNext}
                onClick={() => { if (!selAddr) { setError("Select a delivery address"); return; } setError(""); setStep(1); }}
              >
                Continue to Payment
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            </section>
          )}

          {/* STEP 1 — Payment method */}
          {step === 1 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
                Payment Method
              </h2>

              <div className={styles.payMethods}>
                {/* COD */}
                <div
                  className={`${styles.payMethod} ${payMethod === "cod" ? styles.payMethodSelected : ""}`}
                  onClick={() => setPayMethod("cod")}
                >
                  <div className={styles.payMethodRadio}><div className={styles.payMethodDot} /></div>
                  <div className={styles.payMethodBody}>
                    <span className={styles.payMethodName}>Cash on Delivery</span>
                    <span className={styles.payMethodDesc}>Pay when your order arrives</span>
                  </div>
                  <svg className={styles.payMethodIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                  </svg>
                </div>

                {/* Card */}
                <div
                  className={`${styles.payMethod} ${payMethod === "card" ? styles.payMethodSelected : ""}`}
                  onClick={() => setPayMethod("card")}
                >
                  <div className={styles.payMethodRadio}><div className={styles.payMethodDot} /></div>
                  <div className={styles.payMethodBody}>
                    <span className={styles.payMethodName}>Pay Online</span>
                    <span className={styles.payMethodDesc}>Credit / Debit card via Stripe (Test Mode)</span>
                  </div>
                  <svg className={styles.payMethodIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                </div>
              </div>

              {payMethod === "card" && (
                <div className={styles.testNote}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>Test card: <strong>4242 4242 4242 4242</strong> · Exp: any future date · CVC: any 3 digits</span>
                </div>
              )}

              <div className={styles.stepBtns}>
                <button className={styles.btnBack} onClick={() => setStep(0)}>← Back</button>
                <button className={styles.btnNext} onClick={() => { setError(""); setStep(2); }}>
                  Review Order
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </div>
            </section>
          )}

          {/* STEP 2 — Confirm */}
          {step === 2 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                </svg>
                Confirm Order
              </h2>

              {/* Address summary */}
              <div className={styles.confirmBlock}>
                <div className={styles.confirmBlockHeader}>
                  <span>Delivery Address</span>
                  <button className={styles.changeBtn} onClick={() => setStep(0)}>Change</button>
                </div>
                <p className={styles.confirmText}>{selAddr?.address1}</p>
                {selAddr?.address2 && <p className={styles.confirmText}>{selAddr.address2}</p>}
                <p className={styles.confirmText}>{[selAddr?.city, selAddr?.state, selAddr?.pincode].filter(Boolean).join(", ")}</p>
              </div>

              {/* Payment summary */}
              <div className={styles.confirmBlock}>
                <div className={styles.confirmBlockHeader}>
                  <span>Payment</span>
                  <button className={styles.changeBtn} onClick={() => setStep(1)}>Change</button>
                </div>
                <p className={styles.confirmText}>
                  {payMethod === "cod" ? "Cash on Delivery" : "Online Payment (Stripe)"}
                </p>
              </div>

              {/* Coupon */}
              <div className={styles.couponRow}>
                <input
                  className={styles.input}
                  placeholder="Coupon code"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                />
                <button className={styles.couponApplyBtn} onClick={handleApplyCoupon}>Apply</button>
              </div>
              {couponApplied && (
                <p className={styles.couponSuccess}>✓ Coupon applied — saving {fmt(couponApplied.discount)}</p>
              )}

              {error && <p className={styles.errorMsg}>{error}</p>}

              <div className={styles.stepBtns}>
                <button className={styles.btnBack} onClick={() => setStep(1)}>← Back</button>
                <button className={styles.btnPlace} onClick={handlePlaceOrder} disabled={loading}>
                  {loading
                    ? "Placing…"
                    : payMethod === "cod"
                      ? `Place Order · ${fmt(total)}`
                      : `Pay ${fmt(total)}`}
                </button>
              </div>
            </section>
          )}
        </div>

        {/* ── RIGHT: Order summary ─────────────────────── */}
        <aside className={styles.summary}>
          <h3 className={styles.summaryTitle}>Order Summary</h3>

          <div className={styles.summaryItems}>
            {orderItems.map((item, i) => (
              <div key={i} className={styles.summaryItem}>
                <div className={styles.summaryItemImg}>
                  {item.image
                    ? <img src={item.image} alt={item.name} />
                    : <span>◆</span>}
                  <span className={styles.summaryItemQty}>{item.quantity}</span>
                </div>
                <div className={styles.summaryItemInfo}>
                  <p className={styles.summaryItemName}>{item.name}</p>
                  <p className={styles.summaryItemMeta}>{[item.size, item.color].filter(Boolean).join(" · ")}</p>
                </div>
                <span className={styles.summaryItemPrice}>{fmt(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className={styles.summaryLines}>
            <div className={styles.summaryLine}>
              <span>Subtotal</span><span>{fmt(subtotal)}</span>
            </div>
            <div className={styles.summaryLine}>
              <span>Shipping</span>
              <span>{shipping === 0 ? <span className={styles.free}>Free</span> : fmt(shipping)}</span>
            </div>
            <div className={styles.summaryLine}>
              <span>GST (18%)</span><span>{fmt(tax)}</span>
            </div>
            {discount > 0 && (
              <div className={`${styles.summaryLine} ${styles.summaryLineDiscount}`}>
                <span>Coupon</span><span>-{fmt(discount)}</span>
              </div>
            )}
            <div className={`${styles.summaryLine} ${styles.summaryLineTotal}`}>
              <span>Total</span><span>{fmt(total)}</span>
            </div>
          </div>

          {subtotal <= 500 && (
            <p className={styles.freeShipNote}>
              Add {fmt(500 - subtotal)} more for free shipping
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}