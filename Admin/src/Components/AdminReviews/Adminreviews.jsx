/* AdminReviews.jsx — Admin panel component
   Place alongside your existing Order.jsx admin component.
   Add route: /admin/reviews → <AdminReviews />
*/

import React, { useState, useEffect, useCallback } from "react";
import { apiFetch, clearAdminSession } from "../../utils/AdminApi";
import { useNavigate } from "react-router-dom";
import styles from "./AdminReviews.module.css";

function Stars({ rating }) {
  return (
    <span className={styles.stars}>
      {[1,2,3,4,5].map(n => (
        <span key={n} className={n <= Math.round(rating) ? styles.starOn : styles.starOff}>★</span>
      ))}
    </span>
  );
}

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminReviews() {
  const navigate = useNavigate();
  const [reviews,    setReviews]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [page,       setPage]       = useState(1);
  const [pages,      setPages]      = useState(1);
  const [total,      setTotal]      = useState(0);
  const [filter,     setFilter]     = useState("all"); // all | pending | approved
  const [selected,   setSelected]   = useState(null);
  const [response,   setResponse]   = useState("");
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState(null);

  const onAuthFail = useCallback((err) => {
    clearAdminSession?.();
    navigate("/login", { replace: true });
  }, [navigate]);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (filter === "pending")  params.set("isApproved", "false");
      if (filter === "approved") params.set("isApproved", "true");

      const data = await apiFetch(`/reviews?${params}`, {}, onAuthFail);
      setReviews(data.reviews || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (e) {
      if (e.status !== 401) setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, filter, onAuthFail]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleModerate = async (id, isApproved) => {
    setSaving(true);
    try {
      await apiFetch(`/reviews/${id}/moderate`,
        { method: "PUT", body: JSON.stringify({ isApproved, adminResponse: response || undefined }) },
        onAuthFail);
      showToast(isApproved ? "Review approved" : "Review rejected");
      setSelected(null);
      setResponse("");
      fetchReviews();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await apiFetch(`/reviews/${id}`, { method: "DELETE" }, onAuthFail);
      showToast("Review deleted");
      setSelected(null);
      fetchReviews();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const FILTERS = [
    { id: "all",      label: "All Reviews" },
    { id: "pending",  label: "Pending" },
    { id: "approved", label: "Approved" },
  ];

  return (
    <div className={styles.page}>
      {toast && (
        <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>
          {toast.type === "error" ? "✕" : "✓"}&ensp;{toast.msg}
        </div>
      )}

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Reviews</h1>
          <p className={styles.pageSubtitle}>Manage customer product reviews</p>
        </div>
        <div className={styles.headerStat}>
          <span className={styles.statNum}>{total}</span>
          <span className={styles.statLbl}>Total</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className={styles.filterTabs}>
        {FILTERS.map(f => (
          <button key={f.id}
            className={`${styles.filterTab} ${filter === f.id ? styles.filterTabOn : ""}`}
            onClick={() => { setFilter(f.id); setPage(1); }}>
            {f.label}
          </button>
        ))}
      </div>

      <div className={styles.tableWrap}>
        {loading ? (
          <div className={styles.loadState}><div className={styles.loader} /><span>Loading reviews…</span></div>
        ) : error ? (
          <div className={styles.errorState}><p>⚠ {error}</p><button onClick={fetchReviews}>Retry</button></div>
        ) : reviews.length === 0 ? (
          <div className={styles.emptyState}><div className={styles.emptyIcon}>★</div><p>No reviews found</p></div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Customer</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Verified</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(r => (
                <tr key={r._id} className={`${styles.row} ${selected?._id === r._id ? styles.rowSelected : ""}`}>
                  <td>
                    <div className={styles.productCell}>
                      {r.productId?.mainImage && (
                        <img src={r.productId.mainImage} alt="" className={styles.productThumb} />
                      )}
                      <span className={styles.productName}>{r.productId?.name || "—"}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.customerCell}>
                      <span className={styles.customerName}>{r.userId?.name || "—"}</span>
                      <span className={styles.customerEmail}>{r.userId?.email || ""}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.ratingCell}>
                      <Stars rating={r.rating} />
                      <span className={styles.ratingNum}>{r.rating}</span>
                    </div>
                  </td>
                  <td>
                    <p className={styles.reviewPreview}>{r.title && <strong>{r.title} — </strong>}{r.review?.slice(0, 80)}{r.review?.length > 80 ? "…" : ""}</p>
                  </td>
                  <td>
                    <span className={`${styles.verifiedBadge} ${r.isVerifiedPurchase ? styles.verifiedOn : ""}`}>
                      {r.isVerifiedPurchase ? "✓ Verified" : "Unverified"}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${r.isApproved ? styles.statusApproved : styles.statusPending}`}>
                      {r.isApproved ? "Approved" : "Pending"}
                    </span>
                  </td>
                  <td><span className={styles.dateCell}>{fmt(r.createdAt)}</span></td>
                  <td>
                    <div className={styles.actionBtns}>
                      <button className={styles.actionBtn} title="View" onClick={() => { setSelected(r); setResponse(""); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      {!r.isApproved && (
                        <button className={`${styles.actionBtn} ${styles.actionBtnApprove}`} title="Approve" onClick={() => handleModerate(r._id, true)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </button>
                      )}
                      <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} title="Delete" onClick={() => handleDelete(r._id)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className={styles.pagination}>
          <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className={styles.pageInfo}>Page {page} of {pages}</span>
          <button className={styles.pageBtn} disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <>
          <div className={styles.panelBackdrop} onClick={() => setSelected(null)} />
          <div className={styles.detailPanel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Review Detail</h2>
                <span className={styles.panelSub}>{selected.productId?.name}</span>
              </div>
              <button className={styles.panelClose} onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className={styles.panelBody}>
              {/* Product info */}
              <section className={styles.panelSection}>
                <h3 className={styles.sectionTitle}>Product</h3>
                <div className={styles.panelProductRow}>
                  {selected.productId?.mainImage && (
                    <img src={selected.productId.mainImage} alt="" className={styles.panelProductImg} />
                  )}
                  <div>
                    <p className={styles.panelProductName}>{selected.productId?.name}</p>
                    <Stars rating={selected.rating} />
                    <p className={styles.panelMeta}>{selected.fit && `Fit: ${selected.fit.replace("_", " ")}`} {selected.quality && `· Quality: ${selected.quality}/5`}</p>
                  </div>
                </div>
              </section>

              {/* Review content */}
              <section className={styles.panelSection}>
                <h3 className={styles.sectionTitle}>Review Content</h3>
                {selected.title && <p className={styles.reviewTitle}>{selected.title}</p>}
                <p className={styles.reviewBody}>{selected.review}</p>
                {selected.images?.length > 0 && (
                  <div className={styles.reviewImages}>
                    {selected.images.map((img, i) => (
                      <img key={i} src={img} alt="" className={styles.reviewImg} />
                    ))}
                  </div>
                )}
              </section>

              {/* Customer */}
              <section className={styles.panelSection}>
                <h3 className={styles.sectionTitle}>Customer</h3>
                <div className={styles.infoGrid}>
                  <label>Name</label><span>{selected.userId?.name}</span>
                  <label>Email</label><span>{selected.userId?.email}</span>
                  <label>Verified Purchase</label><span>{selected.isVerifiedPurchase ? "✓ Yes" : "No"}</span>
                  <label>Submitted</label><span>{fmt(selected.createdAt)}</span>
                  <label>Helpful</label><span>{selected.helpfulCount} people found this helpful</span>
                </div>
              </section>

              {/* Existing admin response */}
              {selected.adminResponse?.response && (
                <section className={styles.panelSection}>
                  <h3 className={styles.sectionTitle}>Existing Response</h3>
                  <div className={styles.existingResponse}>{selected.adminResponse.response}</div>
                </section>
              )}

              {/* Admin response input */}
              <section className={styles.panelSection}>
                <h3 className={styles.sectionTitle}>Admin Response (optional)</h3>
                <textarea
                  className={styles.responseTextarea}
                  rows={3}
                  placeholder="Add a public response to this review…"
                  value={response}
                  onChange={e => setResponse(e.target.value)}
                />
              </section>
            </div>

            {/* Panel actions */}
            <div className={styles.panelFooter}>
              {!selected.isApproved ? (
                <>
                  <button className={`${styles.panelBtn} ${styles.panelBtnApprove}`}
                    disabled={saving} onClick={() => handleModerate(selected._id, true)}>
                    {saving ? "…" : "✓ Approve"}
                  </button>
                  <button className={`${styles.panelBtn} ${styles.panelBtnReject}`}
                    disabled={saving} onClick={() => handleModerate(selected._id, false)}>
                    Reject
                  </button>
                </>
              ) : (
                <button className={`${styles.panelBtn} ${styles.panelBtnReject}`}
                  disabled={saving} onClick={() => handleModerate(selected._id, false)}>
                  Unapprove
                </button>
              )}
              <button className={`${styles.panelBtn} ${styles.panelBtnDanger}`}
                onClick={() => handleDelete(selected._id)}>
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}