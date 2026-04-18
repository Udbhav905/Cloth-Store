
import { useState, useEffect, useRef } from "react";
import styles from "./Reviewmodal.module.css";

import useApiStore from "../../store/others";
const API = useApiStore.getState().API;
// const API = "http://localhost:3000/api";

function authHeader() {
  const token = localStorage.getItem("userToken");
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

function StarPicker({ value, onChange, size = 32 }) {
  const [hover, setHover] = useState(0);
  return (
    <div className={styles.starPicker}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`${styles.starBtn} ${n <= (hover || value) ? styles.starOn : ""}`}
          style={{ fontSize: size }}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
      <span className={styles.starLabel}>
        {["", "Poor", "Fair", "Good", "Great", "Excellent"][hover || value] || "Tap to rate"}
      </span>
    </div>
  );
}

function QualityPicker({ value, onChange }) {
  return (
    <div className={styles.qualityRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`${styles.qualityBtn} ${value === n ? styles.qualityOn : ""}`}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

const FIT_OPTIONS = [
  { value: "small",         label: "Runs Small" },
  { value: "true_to_size",  label: "True to Size" },
  { value: "large",         label: "Runs Large" },
];

export default function ReviewModal({ order, item, onClose, onSuccess }) {
  const [rating,  setRating]  = useState(0);
  const [title,   setTitle]   = useState("");
  const [review,  setReview]  = useState("");
  const [fit,     setFit]     = useState("");
  const [quality, setQuality] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [check,   setCheck]   = useState(null); // canReview result

  const backdropRef = useRef(null);

  /* Check if user can review this product */
  useEffect(() => {
    if (!item?.productId?._id && !item?.productId) return;
    const pid = item.productId?._id || item.productId;
    apiFetch(`/reviews/can-review/${pid}`)
      .then(setCheck)
      .catch(() => setCheck({ canReview: true }));
  }, [item]);

  /* Lock body scroll */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setError("Please select a rating"); return; }
    if (!review.trim()) { setError("Please write a review"); return; }

    setLoading(true);
    setError("");
    try {
      const pid = item.productId?._id || item.productId;
      const result = await apiFetch("/reviews", {
        method: "POST",
        body: JSON.stringify({
          productId: pid,
          orderId:   order._id,
          rating,
          title:   title.trim() || undefined,
          review:  review.trim(),
          fit:     fit     || undefined,
          quality: quality || undefined,
        }),
      });
      onSuccess?.(result);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const productName = item?.productName || item?.name || "Product";
  const productImg  = item?.image || "";
  const pid = item?.productId?._id || item?.productId;

  return (
    <div
      ref={backdropRef}
      className={styles.backdrop}
      onClick={(e) => e.target === backdropRef.current && onClose()}
    >
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.eyebrow}>◆ REVIEW</span>
            <h2 className={styles.heading}>Rate your purchase</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Product strip */}
        <div className={styles.productStrip}>
          <div className={styles.productImg}>
            {productImg
              ? <img src={productImg} alt={productName} />
              : <span className={styles.imgFallback}>◆</span>
            }
          </div>
          <div className={styles.productInfo}>
            <p className={styles.productName}>{productName}</p>
            <p className={styles.orderRef}>Order #{order.orderNumber}</p>
            {item?.variant?.size && (
              <p className={styles.variantTag}>
                {[item.variant.size, item.variant.color].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          {check?.alreadyReviewed && (
            <span className={styles.reviewedBadge}>Already Reviewed</span>
          )}
        </div>

        {check?.alreadyReviewed ? (
          <div className={styles.alreadyDone}>
            <span className={styles.doneTick}>✓</span>
            <p>You've already submitted a review for this product.</p>
            <button className={styles.closeAltBtn} onClick={onClose}>Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Overall rating */}
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Overall Rating *</label>
              <StarPicker value={rating} onChange={setRating} size={36} />
            </div>

            {/* Review title */}
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Review Title</label>
              <input
                className={styles.input}
                placeholder="Summarise your experience…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            {/* Review body */}
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Your Review *</label>
              <textarea
                className={styles.textarea}
                placeholder="Share what you loved (or didn't) about this product…"
                rows={4}
                value={review}
                onChange={(e) => setReview(e.target.value)}
                maxLength={1000}
              />
              <span className={styles.charCount}>{review.length}/1000</span>
            </div>

            {/* Fit */}
            <div className={styles.field}>
              <label className={styles.fieldLabel}>How did it fit?</label>
              <div className={styles.fitRow}>
                {FIT_OPTIONS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    className={`${styles.fitBtn} ${fit === f.value ? styles.fitBtnOn : ""}`}
                    onClick={() => setFit(fit === f.value ? "" : f.value)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality */}
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Quality <span className={styles.subLabel}>(1 = Poor, 5 = Excellent)</span></label>
              <QualityPicker value={quality} onChange={setQuality} />
            </div>

            {error && <p className={styles.errorMsg}>⚠ {error}</p>}

            <div className={styles.formFooter}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? (
                  <><span className={styles.spinner} /> Submitting…</>
                ) : (
                  "Submit Review"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}