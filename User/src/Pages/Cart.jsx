import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useCartStore from "../store/Usecartstore";
import styles from "./styles/Cart.module.css";

function fmtPrice(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

/* ── Single cart row ── */
function CartItem({ item, index, onRemove, onQtyChange }) {
  const [removing, setRemoving] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleRemove = () => {
    setRemoving(true);
    setTimeout(() => onRemove(item.productId, item.size, item.color), 380);
  };

  return (
    <div
      className={`${styles.item} ${removing ? styles.itemRemoving : ""}`}
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      {/* Image */}
      <Link to={`/products/${item.productId}`} className={styles.itemImgLink}>
        <div className={styles.itemImgWrap}>
          {!imgLoaded && <div className={styles.imgSkeleton} />}
          <img
            src={item.image || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&q=80"}
            alt={item.name}
            className={`${styles.itemImg} ${imgLoaded ? styles.itemImgLoaded : ""}`}
            onLoad={() => setImgLoaded(true)}
            onError={e => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&q=80";
              setImgLoaded(true);
            }}
          />
          <div className={styles.itemImgOverlay}>
            <span>View</span>
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className={styles.itemInfo}>
        <div className={styles.itemTop}>
          <div>
            <Link to={`/products/${item.productId}`} className={styles.itemName}>
              {item.name}
            </Link>
            <div className={styles.itemMeta}>
              <span className={styles.metaTag}>
                <span className={styles.metaKey}>Size</span>
                <span className={styles.metaVal}>{item.size}</span>
              </span>
              <span className={styles.metaDivider}>·</span>
              <span className={styles.metaTag}>
                <span className={styles.metaKey}>Colour</span>
                <span className={styles.metaVal}>{item.color}</span>
              </span>
            </div>
          </div>

          <button
            className={styles.removeBtn}
            onClick={handleRemove}
            aria-label="Remove item"
            title="Remove"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.itemBottom}>
          {/* Qty stepper */}
          <div className={styles.qtyBox}>
            <button
              className={styles.qtyBtn}
              onClick={() => onQtyChange(item.productId, item.size, item.color, item.quantity - 1)}
              disabled={item.quantity <= 1}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className={styles.qtyNum}>{item.quantity}</span>
            <button
              className={styles.qtyBtn}
              onClick={() => onQtyChange(item.productId, item.size, item.color, item.quantity + 1)}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          {/* Price */}
          <div className={styles.itemPriceBlock}>
            <span className={styles.itemPrice}>{fmtPrice(item.price * item.quantity)}</span>
            {item.quantity > 1 && (
              <span className={styles.itemPricePer}>{fmtPrice(item.price)} each</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Empty state ── */
function EmptyCart() {
    const nav=useNavigate()
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1">
          <circle cx="32" cy="32" r="28" strokeDasharray="4 3" opacity=".3" />
          <path d="M20 24h24l-3 16H23L20 24z" strokeWidth="1.2" />
          <path d="M16 20h4l4 16" strokeWidth="1.2" />
          <circle cx="26" cy="44" r="2" fill="currentColor" opacity=".5" />
          <circle cx="38" cy="44" r="2" fill="currentColor" opacity=".5" />
        </svg>
      </div>
      <h2 className={styles.emptyTitle}>Your cart is empty</h2>
      <p className={styles.emptyText}>
        Discover our curated collection and add pieces that speak to you.
      </p>
      <span onClick={()=>nav(-1)} className={styles.emptyBtn}>
        <span>Explore Collections</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </span>
    </div>
  );
}

/* ── Promo code input ── */
function PromoCode({ onApply, applied, discount }) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error

  const handleApply = () => {
    if (!code.trim()) return;
    setStatus("loading");
    setTimeout(() => {
      // Mock: "LUXURIA10" = 10% off
      if (code.trim().toUpperCase() === "LUXURIA10") {
        setStatus("success");
        onApply(10, code.trim().toUpperCase());
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 2000);
      }
    }, 800);
  };

  if (applied) {
    return (
      <div className={styles.promoApplied}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>
          <strong>{discount}% off</strong> applied with code{" "}
          <em>{code || "LUXURIA10"}</em>
        </span>
      </div>
    );
  }

  return (
    <div className={styles.promoRow}>
      <input
        type="text"
        value={code}
        onChange={e => setCode(e.target.value.toUpperCase())}
        onKeyDown={e => e.key === "Enter" && handleApply()}
        placeholder="Promo code"
        className={`${styles.promoInput} ${status === "error" ? styles.promoError : ""}`}
        disabled={status === "loading"}
      />
      <button
        className={`${styles.promoBtn} ${status === "loading" ? styles.promoBtnLoading : ""}`}
        onClick={handleApply}
        disabled={status === "loading" || !code.trim()}
      >
        {status === "loading" ? (
          <span className={styles.promoSpinner} />
        ) : (
          "Apply"
        )}
      </button>
      {status === "error" && (
        <p className={styles.promoErrorMsg}>Invalid code. Try LUXURIA10</p>
      )}
    </div>
  );
}

/* ════════════════════════════════════
   MAIN CART PAGE
════════════════════════════════════ */
export default function Cart() {
  const navigate = useNavigate();
  const { items, removeFromCart, clearCart, addToCart } = useCartStore();
  const cart = items ?? [];

  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoApplied, setPromoApplied]   = useState(false);
  const [clearing, setClearing]           = useState(false);

  /* ── Totals ── */
  const subtotal   = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount  = cart.reduce((sum, i) => sum + i.quantity, 0);
  const discount   = promoDiscount > 0 ? Math.round(subtotal * promoDiscount / 100) : 0;
  const shipping   = subtotal > 999 ? 0 : 99;
  const total      = subtotal - discount + shipping;

  const handleApplyPromo = (pct, code) => {
    setPromoDiscount(pct);
    setPromoApplied(true);
  };

  const handleClearCart = () => {
    if (!window.confirm("Remove all items from your cart?")) return;
    setClearing(true);
    setTimeout(() => { clearCart(); setClearing(false); }, 400);
  };

  const handleQtyChange = (productId, size, color, newQty) => {
    if (newQty < 1) return;
    // Store has no updateQuantity — patch via set on items directly
    useCartStore.setState(state => ({
      items: state.items.map(i =>
        i.productId === productId && i.size === size && i.color === color
          ? { ...i, quantity: newQty }
          : i
      )
    }));
  };

  const handleRemove = (productId, size, color) => {
    removeFromCart(productId, size, color);
  };

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <nav className={styles.crumbs}>
            <Link to="/" className={styles.crumb}>Home</Link>
            <span className={styles.crumbSep}>◆</span>
            <span className={styles.crumbNow}>Shopping Cart</span>
          </nav>

          <div className={styles.titleRow}>
            <div>
              <h1 className={styles.title}>
                Your <em>Cart</em>
              </h1>
              {cart.length > 0 && (
                <p className={styles.subtitle}>
                  {itemCount} {itemCount === 1 ? "piece" : "pieces"} selected
                </p>
              )}
            </div>
            {cart.length > 0 && (
              <button
                className={`${styles.clearBtn} ${clearing ? styles.clearBtnActive : ""}`}
                onClick={handleClearCart}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Rule ── */}
      <div className={styles.pageRule}>
        <span className={styles.pageRuleLine} />
        <span className={styles.pageRuleDia}>◆</span>
        <span className={styles.pageRuleLine} />
      </div>

      {/* ── Body ── */}
      {cart.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className={styles.body}>

          {/* Left — items */}
          <div className={styles.itemsCol}>

            {/* Column headers */}
            <div className={styles.colHeaders}>
              <span>Product</span>
              <span>Quantity</span>
              <span>Total</span>
            </div>

            {/* Item list */}
            <div className={styles.itemList}>
              {cart.map((item, i) => (
                <CartItem
                  key={`${item.productId}-${item.size}-${item.color}`}
                  item={item}
                  index={i}
                  onRemove={handleRemove}
                  onQtyChange={handleQtyChange}
                />
              ))}
            </div>

            {/* Continue shopping */}
            <div className={styles.continueShopping}>
              <span onClick={()=>navigate(-1)} className={styles.continueLink}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Continue Shopping</span>
              </span>
            </div>
          </div>

          {/* Right — summary */}
          <div className={styles.summaryCol}>
            <div className={styles.summaryCard}>

              <h2 className={styles.summaryTitle}>Order Summary</h2>

              {/* Line items */}
              <div className={styles.summaryLines}>
                <div className={styles.summaryLine}>
                  <span className={styles.summaryKey}>
                    Subtotal
                    <span className={styles.summaryCount}>({itemCount} items)</span>
                  </span>
                  <span className={styles.summaryVal}>{fmtPrice(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className={`${styles.summaryLine} ${styles.summaryDiscount}`}>
                    <span className={styles.summaryKey}>Promo Discount</span>
                    <span className={styles.summaryVal}>− {fmtPrice(discount)}</span>
                  </div>
                )}

                <div className={styles.summaryLine}>
                  <span className={styles.summaryKey}>Shipping</span>
                  <span className={`${styles.summaryVal} ${shipping === 0 ? styles.summaryFree : ""}`}>
                    {shipping === 0 ? "Free" : fmtPrice(shipping)}
                  </span>
                </div>

                {shipping > 0 && (
                  <p className={styles.freeShippingNote}>
                    Add {fmtPrice(999 - subtotal)} more for free shipping
                  </p>
                )}
              </div>

              <div className={styles.summaryRule} />

              {/* Total */}
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total</span>
                <span className={styles.totalVal}>{fmtPrice(total)}</span>
              </div>

              <div className={styles.taxNote}>Inclusive of all taxes</div>

              <div className={styles.summaryRule} />

              {/* Promo code */}
              <div className={styles.promoSection}>
                <p className={styles.promoLabel}>
                  <span className={styles.promoDia}>◆</span>
                  Have a promo code?
                </p>
                <PromoCode
                  onApply={handleApplyPromo}
                  applied={promoApplied}
                  discount={promoDiscount}
                />
              </div>

              <div className={styles.summaryRule} />

              {/* Checkout CTA */}
              <button
                className={styles.checkoutBtn}
                onClick={() => navigate("/checkout")}
              >
                <span>Proceed to Checkout</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>

              {/* Trust row */}
              <div className={styles.trustRow}>
                {[
                  { icon: "🔒", text: "Secure Checkout" },
                  { icon: "↩️",  text: "Easy Returns"    },
                  { icon: "🚚", text: "Fast Delivery"   },
                ].map(t => (
                  <div key={t.text} className={styles.trust}>
                    <span>{t.icon}</span>
                    <span>{t.text}</span>
                  </div>
                ))}
              </div>

              {/* Accepted payments */}
              <div className={styles.payments}>
                <span className={styles.paymentsLabel}>We accept</span>
                <div className={styles.paymentIcons}>
                  {["VISA", "MC", "UPI", "EMI"].map(p => (
                    <span key={p} className={styles.paymentBadge}>{p}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}