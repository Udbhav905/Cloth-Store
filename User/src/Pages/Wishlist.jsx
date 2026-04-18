import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import useCartStore from "../store/Usecartstore";
import styles from "./styles/Wishlist.module.css";

const API = "http://localhost:3000/api";


function calcFinal(p) {
  if (!p) return 0;
  const base = p.basePrice ?? 0;
  if (p.discountType === "percentage" && p.discountValue > 0)
    return Math.round(base - (base * p.discountValue) / 100);
  if (p.discountType === "fixed" && p.discountValue > 0)
    return Math.max(0, base - p.discountValue);
  return base;
}
function fmt(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n);
}
function isDiscounted(p) {
  return p && p.discountType !== "none" && p.discountValue > 0;
}

/* ─────────────────────────────────────────────────────────
   Hook: fetch full product objects for an array of IDs
   Calls GET /api/products/:id for each ID in wishlist.
   Results are cached in a local ref so re-renders are cheap.
───────────────────────────────────────────────────────── */
function useWishlistProducts(ids) {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const cache = useRef({});   // { [id]: productObject }

  useEffect(() => {
    if (!ids || ids.length === 0) { setProducts([]); return; }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchAll = async () => {
      try {
        const missing = ids.filter((id) => !cache.current[id]);

        await Promise.all(
          missing.map(async (id) => {
            try {
              const res  = await fetch(`${API}/products/${id}`);
              if (!res.ok) return;                    // skip 404s gracefully
              const data = await res.json();
              cache.current[id] = data.product ?? data;
            } catch {
            }
          })
        );

        if (!cancelled) {
          const result = ids
            .map((id) => cache.current[id])
            .filter(Boolean);
          setProducts(result);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) { setError(err.message); setLoading(false); }
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [JSON.stringify(ids)]);   // re-run only when the ID list actually changes

  return { products, loading, error };
}

function WishlistCard({ product, index, onRemove, onMoveToCart }) {
  const ref = useRef(null);
  const [visible,  setVisible]  = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold: 0.08 }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const final      = calcFinal(product);
  const discounted = isDiscounted(product);
  const catName    = product.category?.name || "";
  const outOfStock = product.totalStock === 0;

  const handleRemove = () => {
    setRemoving(true);
    setTimeout(() => onRemove(product._id), 340);
  };

  return (
    <article
      ref={ref}
      className={`${styles.card} ${visible ? styles.cardVisible : ""} ${removing ? styles.cardRemoving : ""}`}
      style={{ "--i": index }}
    >
      {/* Image */}
      <Link to={`/products/${product._id}`} className={styles.cardImgWrap}>
        {product.mainImage
          ? <img src={product.mainImage} alt={product.name} loading="lazy" className={styles.cardImg} />
          : <div className={styles.cardImgFallback}><span>◆</span></div>
        }
        <div className={styles.cardImgOverlay}>
          <span className={styles.cardImgOverlayText}>View Piece</span>
        </div>
        {discounted && (
          <span className={styles.badge}>
            -{product.discountValue}{product.discountType === "percentage" ? "%" : ""}
          </span>
        )}
        {product.isNewArrival && !discounted && (
          <span className={`${styles.badge} ${styles.badgeNew}`}>NEW</span>
        )}
      </Link>

      {/* Body */}
      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          {catName && <span className={styles.cardCat}>{catName}</span>}
          {product.brand && <span className={styles.cardBrand}>{product.brand}</span>}
        </div>

        <Link to={`/product/${product.slug}`} className={styles.cardName}>
          {product.name}
        </Link>

        <div className={styles.cardPriceRow}>
          <span className={styles.cardPrice}>{fmt(final)}</span>
          {discounted && <span className={styles.cardPriceOld}>{fmt(product.basePrice)}</span>}
          {discounted && <span className={styles.cardSaving}>Save {fmt(product.basePrice - final)}</span>}
        </div>

        {product.totalStock <= (product.lowStockThreshold ?? 5) && product.totalStock > 0 && (
          <p className={styles.cardStock}>Only {product.totalStock} left</p>
        )}
        {outOfStock && (
          <p className={`${styles.cardStock} ${styles.cardStockOut}`}>Out of stock</p>
        )}
      </div>

      {/* Actions */}
      <div className={styles.cardActions}>
        <button
          className={styles.btnCart}
          onClick={() => onMoveToCart(product)}
          disabled={outOfStock}
          title={outOfStock ? "Out of stock" : "Add to cart"}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          <span>{outOfStock ? "Out of Stock" : "Add to Cart"}</span>
        </button>

        <button className={styles.btnRemove} onClick={handleRemove} aria-label="Remove from wishlist">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    </article>
  );
}

/* ─────────────────────────────────────────────────────────
   Skeleton card
───────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.skeletonImg} />
      <div className={styles.skeletonBody}>
        <div className={styles.skeletonLine} style={{ width: "40%" }} />
        <div className={styles.skeletonLine} style={{ width: "70%" }} />
        <div className={styles.skeletonLine} style={{ width: "30%" }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Empty state
───────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyHeart}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
      </div>
      <h2 className={styles.emptyTitle}>Your wishlist is empty</h2>
      <p className={styles.emptySub}>Save pieces you love — they'll appear here, waiting for you.</p>
      <Link to="/collections" className={styles.emptyCta}>
        Explore Collections
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      </Link>
    </div>
  );
}


export default function Wishlist() {
  const wishlistIds    = useCartStore((s) => s.wishlist);         // string[]
  const toggleWishlist = useCartStore((s) => s.toggleWishlist);  // (id) => void
  const addToCart      = useCartStore((s) => s.addToCart);

  const { products, loading, error } = useWishlistProducts(wishlistIds);

  const [sortBy,   setSortBy]   = useState("default");
  const [filterBy, setFilterBy] = useState("all");
  const [toast,    setToast]    = useState(null);
  const toastTimer = useRef(null);

  const categories = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      const cat = p.category;
      if (!cat) return;
      const key = cat.slug || cat._id;
      if (!map.has(key)) map.set(key, cat);
    });
    return Array.from(map.values());
  }, [products]);

  const displayed = useMemo(() => {
    let list = [...products];
    if (filterBy !== "all") {
      list = list.filter(
        (p) => (p.category?.slug || p.category?._id) === filterBy
      );
    }
    switch (sortBy) {
      case "price-asc":  list.sort((a, b) => calcFinal(a) - calcFinal(b)); break;
      case "price-desc": list.sort((a, b) => calcFinal(b) - calcFinal(a)); break;
      case "name-az":    list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "name-za":    list.sort((a, b) => b.name.localeCompare(a.name)); break;
      default: break;
    }
    return list;
  }, [products, sortBy, filterBy]);

  const totalSaved = useMemo(() =>
    products.reduce((acc, p) =>
      isDiscounted(p) ? acc + (p.basePrice - calcFinal(p)) : acc, 0),
  [products]);

  const inStockCount = displayed.filter((p) => p.totalStock > 0).length;

  const showToast = (msg, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  };

  const handleRemove = (id) => {
    toggleWishlist(id);
    showToast("Removed from wishlist", "neutral");
  };

  const handleMoveToCart = (product) => {
    const variant = product.variants?.find((v) => v.isActive && v.stock > 0);
    addToCart({
      productId: product._id,
      name:      product.name,
      price:     calcFinal(product),
      size:      variant?.size  || "FREE",
      color:     variant?.color || "Default",
      image:     product.mainImage,
      slug:      product.slug,
      quantity:  1,
    });
    showToast(`"${product.name}" added to cart`);
  };

  const handleMoveAllToCart = () => {
    let count = 0;
    displayed.forEach((p) => {
      if (p.totalStock > 0) { handleMoveToCart(p); count++; }
    });
    if (count) showToast(`${count} pieces added to cart`);
  };

  return (
    <div className={styles.page}>
      {/* Toast */}
      <div className={`${styles.toast} ${toast ? styles.toastVisible : ""}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {toast?.type === "neutral"
            ? <path d="M18 6L6 18M6 6l12 12"/>
            : <polyline points="20 6 9 17 4 12"/>
          }
        </svg>
        <span>{toast?.msg}</span>
      </div>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerDecor}>
          <svg className={styles.headerHeart} viewBox="0 0 120 110" fill="none">
            <path
              d="M60 95 C40 80 5 60 5 35 C5 18 18 5 35 5 C44 5 52 9 60 18 C68 9 76 5 85 5 C102 5 115 18 115 35 C115 60 80 80 60 95Z"
              stroke="rgba(201,169,110,0.18)" strokeWidth="1" fill="none"
              className={styles.headerHeartPath}
            />
          </svg>
        </div>
        <div className={styles.headerContent}>
          <p className={styles.headerEyebrow}>◆ LUXURIA</p>
          <h1 className={styles.headerTitle}>My <em>Wishlist</em></h1>
          <p className={styles.headerSub}>
            {loading
              ? "Loading your saved pieces…"
              : wishlistIds.length === 0
                ? "Nothing saved yet"
                : `${wishlistIds.length} ${wishlistIds.length === 1 ? "piece" : "pieces"} saved`}
            {!loading && totalSaved > 0 && (
              <span className={styles.headerSaving}>&nbsp;· Saving {fmt(totalSaved)} total</span>
            )}
          </p>
        </div>
      </header>

      {/* Content */}
      {wishlistIds.length === 0 ? (
        <EmptyState />
      ) : error ? (
        <div className={styles.errorBox}>
          <p>⚠ Could not load wishlist: {error}</p>
          <Link to="/collections" className={styles.emptyCta}>Browse Collections</Link>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className={styles.controls}>
            <div className={styles.filterChips}>
              <button
                className={`${styles.chip} ${filterBy === "all" ? styles.chipActive : ""}`}
                onClick={() => setFilterBy("all")}
              >
                All ({products.length})
              </button>
              {categories.map((cat) => {
                const key   = cat.slug || cat._id;
                const count = products.filter(
                  (p) => (p.category?.slug || p.category?._id) === key
                ).length;
                return (
                  <button
                    key={key}
                    className={`${styles.chip} ${filterBy === key ? styles.chipActive : ""}`}
                    onClick={() => setFilterBy(key)}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>

            <div className={styles.controlsRight}>
              <div className={styles.sortWrap}>
                <label className={styles.sortLabel}>Sort</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={styles.sortSelect}>
                  <option value="default">Default</option>
                  <option value="price-asc">Price: Low → High</option>
                  <option value="price-desc">Price: High → Low</option>
                  <option value="name-az">Name: A → Z</option>
                  <option value="name-za">Name: Z → A</option>
                </select>
              </div>
              {!loading && inStockCount > 0 && (
                <button className={styles.btnMoveAll} onClick={handleMoveAllToCart}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 01-8 0"/>
                  </svg>
                  Add All ({inStockCount})
                </button>
              )}
            </div>
          </div>

          {/* Grid */}
          <div className={styles.grid}>
            {loading
              ? wishlistIds.map((id) => <SkeletonCard key={id} />)
              : displayed.length === 0
                ? (
                  <div className={styles.filterEmpty}>
                    <p>No pieces in this category.</p>
                    <button className={styles.filterEmptyReset} onClick={() => setFilterBy("all")}>
                      Show All
                    </button>
                  </div>
                )
                : displayed.map((product, i) => (
                    <WishlistCard
                      key={product._id}
                      product={product}
                      index={i}
                      onRemove={handleRemove}
                      onMoveToCart={handleMoveToCart}
                    />
                  ))
            }
          </div>

          {/* Summary */}
          {!loading && products.length > 0 && (
            <div className={styles.summary}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Total Pieces</span>
                <span className={styles.summaryValue}>{wishlistIds.length}</span>
              </div>
              <div className={styles.summaryDivider} />
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>In Stock</span>
                <span className={styles.summaryValue}>{products.filter((p) => p.totalStock > 0).length}</span>
              </div>
              <div className={styles.summaryDivider} />
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Total Savings</span>
                <span className={`${styles.summaryValue} ${styles.summaryValueGold}`}>
                  {totalSaved > 0 ? fmt(totalSaved) : "—"}
                </span>
              </div>
              <div className={styles.summaryDivider} />
              <Link to="/collections" className={styles.summaryCta}>
                Continue Shopping
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}