import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import useCartStore from "../../store/Usecartstore";
import useAuthStore from "../../store/Useauthstore";
import styles from "./ProductDetail.module.css";

const API = "http://localhost:3000/api";

function fmtPrice(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n);
}
function calcFinal(p) {
  if (!p) return 0;
  const b = p.basePrice ?? 0;
  if (p.discountType === "percentage" && p.discountValue > 0) return b - (b * p.discountValue) / 100;
  if (p.discountType === "fixed"      && p.discountValue > 0) return Math.max(0, b - p.discountValue);
  return b;
}
function discPct(p) {
  if (!p || !p.discountValue || p.discountType === "none") return null;
  if (p.discountType === "percentage") return Math.round(p.discountValue);
  return Math.round((p.discountValue / p.basePrice) * 100);
}

function safeArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) {
    if (val.length > 0 && typeof val[0] === "string" && val[0].startsWith("[")) {
      try { return JSON.parse(val[0]); } catch { return val; }
    }
    return val;
  }
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return [val]; }
  }
  return [];
}

/* ── Stars ── */
function Stars({ rating, count }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className={styles.stars}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={
          i < full ? styles.starFull : i === full && half ? styles.starHalf : styles.starEmpty
        }>★</span>
      ))}
      <span className={styles.starsNum}>{rating.toFixed(1)}</span>
      {count > 0 && <span className={styles.starsCount}>({count} reviews)</span>}
    </div>
  );
}

/* ── Image Gallery ── */
function Gallery({ images, name }) {
  const [active,  setActive]  = useState(0);
  const [zoomed,  setZoomed]  = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imgRef = useRef(null);

  const imgs = images.filter(Boolean);

  const handleMouseMove = useCallback((e) => {
    if (!imgRef.current) return;
    const r = imgRef.current.getBoundingClientRect();
    setZoomPos({
      x: ((e.clientX - r.left) / r.width)  * 100,
      y: ((e.clientY - r.top)  / r.height) * 100,
    });
  }, []);

  useEffect(() => { setActive(0); }, [images]);

  if (!imgs.length) return (
    <div className={styles.galleryEmpty}>No image available</div>
  );

  return (
    <div className={styles.gallery}>
      {imgs.length > 1 && (
        <div className={styles.thumbs}>
          {imgs.map((src, i) => (
            <button key={i}
              className={`${styles.thumb} ${i === active ? styles.thumbOn : ""}`}
              onClick={() => setActive(i)}
            >
              <img src={src} alt={`View ${i + 1}`}
                onError={e => { e.currentTarget.style.opacity = "0.2"; }} />
            </button>
          ))}
        </div>
      )}

      <div className={styles.mainImgWrap}
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <img
          ref={imgRef}
          src={imgs[active]}
          alt={name}
          className={styles.mainImg}
          style={zoomed ? {
            transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
            transform: "scale(1.9)",
            cursor: "crosshair",
          } : {}}
          onError={e => { e.currentTarget.src = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80"; }}
        />

        {imgs.length > 1 && <>
          <button className={`${styles.gNav} ${styles.gPrev}`}
            onClick={() => setActive(a => (a - 1 + imgs.length) % imgs.length)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <button className={`${styles.gNav} ${styles.gNext}`}
            onClick={() => setActive(a => (a + 1) % imgs.length)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </>}

        {imgs.length > 1 && (
          <div className={styles.imgCounter}>
            {String(active + 1).padStart(2, "0")}
            <span className={styles.counterSep}>/</span>
            {String(imgs.length).padStart(2, "0")}
          </div>
        )}

        {!zoomed && (
          <div className={styles.zoomHint}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="11" y1="8" x2="11" y2="14"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
            Hover to zoom
          </div>
        )}
      </div>

      {imgs.length > 1 && (
        <div className={styles.imgDots}>
          {imgs.map((_, i) => (
            <button key={i}
              className={`${styles.imgDot} ${i === active ? styles.imgDotOn : ""}`}
              onClick={() => setActive(i)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Toast ── */
function Toast({ msg, visible }) {
  const nav = useNavigate();
  return (
    <div className={`${styles.toast} ${visible ? styles.toastIn : ""}`}>
      <section onClick={() => nav('/cart')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        {msg}
      </section>
    </div>
  );
}

/* ═══════════════════════════════════
   MAIN PAGE
═══════════════════════════════════ */
export default function ProductDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();

  // ── AUTH: get isLoggedIn + openAuthModal ──────────────────────────
  const { user, isLoggedIn, openAuthModal } = useAuthStore();
  const { addToCart, toggleWishlist, isWishlisted } = useCartStore();

  const [product,  setProduct]  = useState(null);
  const [related,  setRelated]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const [selColor,  setSelColor]  = useState(null);
  const [selSize,   setSelSize]   = useState(null);
  const [qty,       setQty]       = useState(1);
  const [activeTab, setActiveTab] = useState("details");
  const [adding,    setAdding]    = useState(false);
  const [toast,     setToast]     = useState({ msg: "", visible: false });

  /* ── Fetch ── */
  useEffect(() => {
    if (!id) return;
    setLoading(true); setError(null);
    setProduct(null); setSelColor(null); setSelSize(null); setQty(1);
    window.scrollTo({ top: 0, behavior: "smooth" });

    fetch(`${API}/products/${id}`)
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(data => {
        const p = data.product || data;
        setProduct(p);
        setLoading(false);

        const firstColor = [...new Set(
          (p.variants || []).filter(v => v.isActive !== false).map(v => v.color)
        )][0];
        if (firstColor) setSelColor(firstColor);

        const catId = p.category?._id || (typeof p.category === "string" ? p.category : null);
        if (catId) {
          fetch(`${API}/products?category=${catId}&limit=8`)
            .then(r => r.json())
            .then(d => setRelated((d.products || []).filter(rp => rp._id !== p._id).slice(0, 4)))
            .catch(() => {});
        }
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [id]);

  /* ── Loading skeleton ── */
  if (loading) return (
    <div className={styles.page}>
      <div className={styles.skWrap}>
        <div className={styles.skGallery}>
          <div className={`${styles.skBlock} ${styles.skMainImg}`} />
          <div className={styles.skThumbs}>{[0,1,2,3].map(i=><div key={i} className={`${styles.skBlock} ${styles.skThumb}`}/>)}</div>
        </div>
        <div className={styles.skInfo}>
          {[["40%",10],["80%",44],["30%",26],["100%",1],["55%",12],["100%",44],["60%",12],["100%",52],["100%",52]].map(([w,h],i)=>(
            <div key={i} className={styles.skBlock} style={{width:w,height:h,marginTop:i===0?0:i===3?24:12,borderRadius:i===3?0:3}}/>
          ))}
        </div>
      </div>
    </div>
  );

  /* ── Error / not found ── */
  if (error || !product) return (
    <div className={styles.page}>
      <div className={styles.errFull}>
        <span className={styles.errDia}>◆</span>
        <h2>Product not found</h2>
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className={styles.errBack}>← Go Back</button>
      </div>
    </div>
  );

  /* ── Derived ── */
  const allImages   = [product.mainImage, ...(product.galleryImages || [])].filter(Boolean);
  const colorOpts   = [...new Map((product.variants || []).filter(v => v.isActive !== false).map(v => [v.color, { name: v.color, code: v.colorCode }])).values()];
  const sizeOpts    = selColor
    ? (product.variants || []).filter(v => v.color === selColor && v.isActive !== false).map(v => ({ size: v.size, stock: v.stock }))
    : [];
  const selVariant  = selColor && selSize
    ? (product.variants || []).find(v => v.color === selColor && v.size === selSize)
    : null;

  const finalPrice  = calcFinal(product);
  const hasDis      = product.discountType !== "none" && product.discountValue > 0;
  const disc        = discPct(product);
  const wishlisted  = isWishlisted(product._id);
  const stockCount  = selVariant?.stock ?? product?.totalStock ?? 0;
  const inStock     = selVariant ? selVariant.stock > 0 : product?.totalStock > 0;
  const lowStock    = stockCount > 0 && stockCount <= (product?.lowStockThreshold ?? 5);

  const occasionList = safeArray(product.occasion);
  const seasonList   = safeArray(product.season);

  const showToast = (msg) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2800);
  };

  /* ── Validate selection before any cart/buy action ── */
  const validateSelection = () => {
    if (!selColor) { showToast("Please select a colour"); return false; }
    if (!selSize)  { showToast("Please select a size");   return false; }
    if (!inStock)  { showToast("Out of stock");           return false; }
    return true;
  };

  // ── UPDATED: Add to Cart — requires login ─────────────────────────
  const handleAddToCart = () => {
    if (!isLoggedIn) {
      openAuthModal("login");
      return;
    }
    if (!validateSelection()) return;
    setAdding(true);
    addToCart({
      productId: product._id,
      name:      product.name,
      price:     finalPrice,
      size:      selSize,
      color:     selColor,
      image:     product.mainImage,
      quantity:  qty,
    });
    setTimeout(() => {
      setAdding(false);
      showToast(`${product.name} added to cart ✓`);
    }, 600);
  };

  // ── UPDATED: Buy Now — requires login ────────────────────────────
  const handleBuyNow = () => {
    if (!isLoggedIn) {
      openAuthModal("login");
      return;
    }
    if (!validateSelection()) return;
    navigate("/checkout", {
      state: {
        buyNow: {
          product,
          selectedVariant: selVariant || {
            size:  selSize,
            color: selColor,
            price: finalPrice,
            discountedPrice: finalPrice,
          },
          quantity: qty,
        },
      },
    });
  };

  // ── UPDATED: Wishlist — requires login ───────────────────────────
  const handleWish = () => {
    if (!isLoggedIn) {
      openAuthModal("login");
      return;
    }
    toggleWishlist(product._id);
    showToast(wishlisted ? "Removed from wishlist" : "Saved to wishlist ♡");
  };

  return (
    <div className={styles.page}>
      <Toast msg={toast.msg} visible={toast.visible} />

      {/* Breadcrumb */}
      <nav className={styles.crumbs}>
        <Link to="/" className={styles.crumb}>Home</Link>
        <span className={styles.crumbSep}>◆</span>
        {product.category?.slug && product.category?.name ? (
          <>
            <Link to={`/collections/${product.category.slug}`} className={styles.crumb}>
              {product.category.name}
            </Link>
            <span className={styles.crumbSep}>◆</span>
          </>
        ) : null}
        <span className={styles.crumbNow}>{product.name}</span>
      </nav>

      {/* ── Product grid ── */}
      <div className={styles.grid}>

        {/* Gallery */}
        <div className={styles.galleryCol}>
          <Gallery images={allImages} name={product.name} />
        </div>

        {/* Details */}
        <div className={styles.infoCol}>

          {/* Badges */}
          <div className={styles.badgeRow}>
            {product.isBestSeller && <span className={styles.bdg}>Best Seller</span>}
            {product.isNewArrival && <span className={`${styles.bdg} ${styles.bdgNew}`}>New Arrival</span>}
            {product.isFeatured   && <span className={`${styles.bdg} ${styles.bdgFeat}`}>Featured</span>}
            {disc != null         && <span className={`${styles.bdg} ${styles.bdgSale}`}>-{disc}% Off</span>}
          </div>

          {product.category?.slug && product.category?.name && (
            <Link to={`/collections/${product.category.slug}`} className={styles.catLink}>
              {product.category.name}
              {product.subCategory?.name && ` / ${product.subCategory.name}`}
            </Link>
          )}

          <h1 className={styles.pName}>{product.name}</h1>

          {product.averageRating > 0 && (
            <Stars rating={product.averageRating} count={product.totalReviews} />
          )}

          <div className={styles.priceBlock}>
            <span className={styles.finalPrice}>{fmtPrice(finalPrice)}</span>
            {hasDis && <span className={styles.origPrice}>{fmtPrice(product.basePrice)}</span>}
            {hasDis && <span className={styles.saveTag}>Save {fmtPrice(product.basePrice - finalPrice)}</span>}
          </div>

          <div className={styles.rule} />

          {product.shortDescription && <p className={styles.shortDesc}>{product.shortDescription}</p>}

          {/* Colour selector */}
          {colorOpts.length > 0 && (
            <div className={styles.selector}>
              <div className={styles.selLabel}>
                Colour {selColor && <span className={styles.selVal}>— {selColor}</span>}
              </div>
              <div className={styles.colorRow}>
                {colorOpts.map(c => (
                  <button key={c.name}
                    className={`${styles.colorBtn} ${selColor === c.name ? styles.colorBtnOn : ""}`}
                    onClick={() => { setSelColor(c.name); setSelSize(null); }}
                    title={c.name}
                  >
                    <span className={styles.colorDot} style={{ background: c.code || "#888" }} />
                    {selColor === c.name && (
                      <svg className={styles.colorTick} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size selector */}
          {sizeOpts.length > 0 && (
            <div className={styles.selector}>
              <div className={styles.selLabel}>
                Size {selSize && <span className={styles.selVal}>— {selSize}</span>}
              </div>
              <div className={styles.sizeRow}>
                {sizeOpts.map(({ size, stock }) => (
                  <button key={size}
                    className={`${styles.sizeBtn}
                      ${selSize === size ? styles.sizeBtnOn : ""}
                      ${stock === 0     ? styles.sizeBtnOut : ""}
                    `}
                    onClick={() => stock > 0 && setSelSize(size)}
                    disabled={stock === 0}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock status */}
          {selSize && (
            <p className={`${styles.stockStatus} ${inStock ? styles.stockIn : styles.stockOut}`}>
              <span className={styles.stockDot} />
              {inStock ? (lowStock ? `Only ${stockCount} left — order soon` : "In Stock") : "Out of Stock"}
            </p>
          )}

          {/* ── Qty + CTA row ── */}
          <div className={styles.qtyCtaRow}>
            <div className={styles.qtyBox}>
              <button className={styles.qtyBtn} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span className={styles.qtyNum}>{qty}</span>
              <button className={styles.qtyBtn} onClick={() => setQty(q => Math.min(stockCount || 10, q + 1))}>+</button>
            </div>

            {/* Wishlist */}
            <button
              className={`${styles.wishBtn} ${wishlisted ? styles.wishOn : ""}`}
              onClick={handleWish}
              aria-label="Wishlist"
            >
              <svg viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"}
                stroke="currentColor" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
          </div>

          {/* ── Primary action buttons ── */}
          <div className={styles.actionBtns}>
            <button
              className={`${styles.addBtn} ${adding ? styles.addBtnLoading : ""}`}
              onClick={handleAddToCart}
              disabled={adding}
            >
              {adding
                ? <><span className={styles.dot}/><span className={styles.dot}/><span className={styles.dot}/></>
                : (inStock || !selSize) ? "Add to Cart" : "Out of Stock"
              }
            </button>

            <button
              className={styles.buyNowBtn}
              onClick={handleBuyNow}
              disabled={!inStock && !!selSize}
              title={!selColor ? "Select colour first" : !selSize ? "Select size first" : "Buy Now"}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              Buy Now
            </button>
          </div>

          <div className={styles.rule} />

          {/* Trust badges */}
          <div className={styles.trustRow}>
            {[
              { icon: "🚚", label: "Free Delivery",  sub: "Orders above ₹999" },
              { icon: "↩️",  label: product.returnPolicy?.isReturnable ? `${product.returnPolicy.returnPeriod}-Day Returns` : "Final Sale", sub: "Hassle-free" },
              { icon: "🔒", label: "Secure Payment", sub: "SSL protected" },
            ].map(t => (
              <div key={t.label} className={styles.trust}>
                <span className={styles.trustIcon}>{t.icon}</span>
                <div>
                  <p className={styles.trustLabel}>{t.label}</p>
                  <p className={styles.trustSub}>{t.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Meta details */}
          <div className={styles.metaGrid}>
            {product.brand    && <><span className={styles.mKey}>Brand</span>   <span className={styles.mVal}>{product.brand}</span></>}
            {product.fabric   && <><span className={styles.mKey}>Fabric</span>  <span className={styles.mVal}>{product.fabric}</span></>}
            {product.pattern  && <><span className={styles.mKey}>Pattern</span> <span className={styles.mVal}>{product.pattern}</span></>}
            {occasionList.length > 0 && <><span className={styles.mKey}>Occasion</span><span className={styles.mVal}>{occasionList.join(", ")}</span></>}
            {seasonList.length   > 0 && <><span className={styles.mKey}>Season</span>  <span className={styles.mVal}>{seasonList.join(", ")}</span></>}
            {product.totalSold > 0   && <><span className={styles.mKey}>Sold</span>    <span className={styles.mVal}>{product.totalSold}+ pieces</span></>}
            <span className={styles.mKey}>SKU</span>
            <span className={styles.mVal}>{product.slug}</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={styles.tabsSection}>
        <div className={styles.tabBar}>
          {[
            { key: "details",    label: "Description" },
            { key: "reviews",    label: `Reviews (${product.totalReviews})` },
            { key: "size-guide", label: "Size Guide" },
          ].map(t => (
            <button key={t.key}
              className={`${styles.tabBtn} ${activeTab === t.key ? styles.tabBtnOn : ""}`}
              onClick={() => setActiveTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className={styles.tabContent}>

          {activeTab === "details" && (
            <div className={styles.descTab}>
              <p className={styles.descText}>{product.description}</p>
              {(product.variants || []).length > 0 && (
                <div className={styles.varTable}>
                  <h4 className={styles.varTitle}>Available Variants</h4>
                  <div className={styles.varGrid}>
                    {["Colour","Size","SKU","Price","Stock"].map(h =>
                      <span key={h} className={styles.varTH}>{h}</span>
                    )}
                    {(product.variants || []).filter(v => v.isActive !== false).map((v, i) => (
                      [
                        <span key={`c${i}`} className={styles.varTD}>
                          <span className={styles.varDot} style={{ background: v.colorCode || "#888" }} />
                          {v.color}
                        </span>,
                        <span key={`s${i}`} className={styles.varTD}>{v.size}</span>,
                        <span key={`k${i}`} className={`${styles.varTD} ${styles.varSku}`}>{v.sku}</span>,
                        <span key={`p${i}`} className={styles.varTD}>{fmtPrice(v.discountedPrice || v.price)}</span>,
                        <span key={`st${i}`} className={`${styles.varTD} ${v.stock===0?styles.varOut:v.stock<=5?styles.varLow:styles.varOk}`}>
                          {v.stock === 0 ? "Sold Out" : v.stock <= 5 ? `Only ${v.stock}` : `${v.stock} units`}
                        </span>
                      ]
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className={styles.reviewsTab}>
              {product.totalReviews === 0 ? (
                <div className={styles.noReviews}>
                  <span className={styles.nrDia}>◆</span>
                  <p>No reviews yet. Be the first to review this piece.</p>
                </div>
              ) : (
                <>
                  <div className={styles.revSummary}>
                    <div className={styles.revBig}>
                      <span className={styles.revNum}>{product.averageRating.toFixed(1)}</span>
                      <Stars rating={product.averageRating} count={product.totalReviews} />
                    </div>
                    <div className={styles.revBars}>
                      {[5,4,3,2,1].map(n => {
                        const c = (product.ratings||[]).filter(r=>Math.round(r.rating)===n).length;
                        const p = product.totalReviews > 0 ? (c/product.totalReviews)*100 : 0;
                        return (
                          <div key={n} className={styles.revBarRow}>
                            <span className={styles.revBarLabel}>{n}★</span>
                            <div className={styles.revBarTrack}>
                              <div className={styles.revBarFill} style={{ width: `${p}%` }} />
                            </div>
                            <span className={styles.revBarCount}>{c}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {(product.ratings||[]).slice(0,5).map((r,i) => (
                    <div key={i} className={styles.reviewCard}>
                      <div className={styles.revCardTop}>
                        <span className={styles.revUser}>Verified Customer</span>
                        <Stars rating={r.rating} count={0} />
                        <span className={styles.revDate}>
                          {new Date(r.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
                        </span>
                      </div>
                      {r.review && <p className={styles.revText}>{r.review}</p>}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {activeTab === "size-guide" && (
            <div className={styles.sizeTab}>
              <p className={styles.sizeNote}>All measurements in inches. When between sizes, we recommend sizing up.</p>
              <div className={styles.sizeTable}>
                <div className={styles.sizeTHead}>
                  {["Size","Chest","Waist","Hip","Length"].map(h=><span key={h}>{h}</span>)}
                </div>
                {[["XS","32–33","24–25","34–35","38"],["S","34–35","26–27","36–37","39"],
                  ["M","36–37","28–29","38–39","40"],["L","38–40","30–32","40–42","41"],
                  ["XL","41–43","33–35","43–45","42"],["XXL","44–46","36–38","46–48","43"]
                ].map(row => (
                  <div key={row[0]} className={`${styles.sizeTRow} ${selSize===row[0]?styles.sizeTRowOn:""}`}>
                    {row.map((cell,ci)=>(
                      <span key={ci} className={ci===0?styles.sizeTSize:""}>{cell}</span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Related products ── */}
      {related.length > 0 && (
        <div className={styles.related}>
          <div className={styles.relHead}>
            <div className={styles.relTitle}>
              <span className={styles.relEye}>◆</span>
              You may also like
            </div>
            {product.category?.slug && product.category?.name && (
              <Link to={`/collections/${product.category.slug}`} className={styles.relMore}>
                View all in {product.category.name} →
              </Link>
            )}
          </div>
          <div className={styles.relGrid}>
            {related.map(rp => {
              const rf  = calcFinal(rp);
              const rHd = rp.discountType !== "none" && rp.discountValue > 0;
              return (
                <Link key={rp._id} to={`/products/${rp._id}`} className={styles.relCard}>
                  <div className={styles.relImgWrap}>
                    <img src={rp.mainImage || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80"}
                      alt={rp.name} className={styles.relImg}
                      onError={e=>{e.currentTarget.src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80";}} />
                    <div className={styles.relOverlay}>View →</div>
                  </div>
                  <div className={styles.relInfo}>
                    <p className={styles.relCat}>{rp.category?.name}</p>
                    <p className={styles.relName}>{rp.name}</p>
                    <div className={styles.relPriceRow}>
                      <span className={styles.relPrice}>{fmtPrice(rf)}</span>
                      {rHd && <span className={styles.relWas}>{fmtPrice(rp.basePrice)}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}