import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import styles from "../Pages/styles/CategoryPage.module.css";

const API = "http://localhost:3000/api";

/* ── Price helpers ── */
function calcPrice(p) {
  const b = p.basePrice ?? 0;
  if (p.discountType === "percentage" && p.discountValue > 0)
    return b - (b * p.discountValue) / 100;
  if (p.discountType === "fixed" && p.discountValue > 0)
    return Math.max(0, b - p.discountValue);
  return b;
}
function fmt(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n);
}
function discPct(p) {
  if (!p.discountValue || p.discountType === "none") return null;
  if (p.discountType === "percentage") return Math.round(p.discountValue);
  return Math.round((p.discountValue / p.basePrice) * 100);
}

const SORT_OPTIONS = [
  { v: "newest",    l: "Newest First"       },
  { v: "bestSell",  l: "Best Selling"       },
  { v: "priceLow",  l: "Price: Low → High"  },
  { v: "priceHigh", l: "Price: High → Low"  },
  { v: "topRated",  l: "Top Rated"          },
];

const SIZES = ["XS","S","M","L","XL","XXL","28","30","32","34","36","38","40","FREE"];
const FALLBACK = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80&auto=format";

/* ═══════════════════════════════
   PRODUCT CARD
═══════════════════════════════ */
function Card({ product: p, index, view }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  const [hov, setHov] = useState(false);
  const [ok, setOk] = useState(false);
  const [img, setImg] = useState(0);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const delay = Math.min(index * 55, 320);
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight + 100) {
      const t = setTimeout(() => setVis(true), delay);
      return () => clearTimeout(t);
    }
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { obs.disconnect(); setTimeout(() => setVis(true), delay); }
    }, { threshold: 0.05, rootMargin: "0px 0px -30px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const isList = view === "list";
  const imgs = [p.mainImage, ...(p.galleryImages || [])].filter(Boolean).slice(0, 3);
  const hasDis = p.discountType !== "none" && p.discountValue > 0;
  const disc = discPct(p);
  const colors = [...new Map(
    (p.variants || [])
      .filter(v => v.colorCode && v.isActive !== false)
      .map(v => [v.colorCode, v])
  ).values()].slice(0, 6);

  return (
    <article
      ref={ref}
      className={`${styles.card} ${vis ? styles.cardIn : ""} ${isList ? styles.cardList : ""}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setImg(0); }}
    >
      <Link to={`/products/${p._id}`} className={styles.imgWrap}>
        {!ok && <div className={styles.shimmer} />}
        <img
          src={imgs[img] || FALLBACK}
          alt={p.name}
          className={`${styles.img} ${ok ? styles.imgOn : ""}`}
          style={{ transform: hov ? "scale(1.06)" : "scale(1)" }}
          onLoad={() => setOk(true)}
          onError={e => { e.currentTarget.src = FALLBACK; }}
          loading="lazy"
        />
        {hov && imgs.length > 1 && (
          <div className={styles.dots}>
            {imgs.map((_, i) => (
              <span key={i}
                className={`${styles.dot} ${i === img ? styles.dotOn : ""}`}
                onMouseEnter={() => setImg(i)}
              />
            ))}
          </div>
        )}
        <div className={styles.badges}>
          {disc && <span className={`${styles.bdg} ${styles.bdgSale}`}>-{disc}%</span>}
          {p.isNewArrival && <span className={`${styles.bdg} ${styles.bdgNew}`}>New</span>}
          {p.isBestSeller && <span className={`${styles.bdg} ${styles.bdgBest}`}>Best Seller</span>}
          {p.totalStock === 0 && <span className={`${styles.bdg} ${styles.bdgSold}`}>Sold Out</span>}
        </div>
        <div className={`${styles.cta} ${hov ? styles.ctaIn : ""}`}>
          View Piece
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </div>
      </Link>
      <div className={styles.info}>
        <div className={styles.infoTop}>
          <span className={styles.catTag}>{p.category?.name ?? "Collection"}</span>
          {p.averageRating > 0 && (
            <span className={styles.stars}>
              ★ {p.averageRating.toFixed(1)}
              <em> ({p.totalReviews})</em>
            </span>
          )}
        </div>
        <Link to={`/products/${p._id}`} className={styles.pname}>{p.name}</Link>
        {isList && p.shortDescription && (
          <p className={styles.shortDesc}>{p.shortDescription}</p>
        )}
        {colors.length > 0 && (
          <div className={styles.swatches}>
            {colors.map(v => (
              <span key={v.colorCode} className={styles.sw}
                style={{ background: v.colorCode }} title={v.color} />
            ))}
          </div>
        )}
        <div className={styles.priceRow}>
          <span className={styles.price}>{fmt(calcPrice(p))}</span>
          {hasDis && <span className={styles.was}>{fmt(p.basePrice)}</span>}
        </div>
        {p.totalStock === 0 && <p className={styles.soldOut}>Out of Stock</p>}
      </div>
    </article>
  );
}

/* ── Skeleton ── */
function Skeleton({ view }) {
  return (
    <article className={`${styles.card} ${styles.cardIn} ${styles.skCard} ${view === "list" ? styles.cardList : ""}`}>
      <div className={styles.imgWrap}>
        <div className={styles.skBox}><div className={styles.shimAnim} /></div>
      </div>
      <div className={styles.info}>
        <div className={styles.skLine} style={{ width: "38%", height: "8px" }} />
        <div className={styles.skLine} style={{ width: "70%", height: "15px", marginTop: "10px" }} />
        <div className={styles.skLine} style={{ width: "28%", height: "13px", marginTop: "12px" }} />
      </div>
    </article>
  );
}

/* ═══════════════════════════════
   FILTER SIDEBAR
═══════════════════════════════ */
function FilterSidebar({ open, onClose, filters, setFilter, clearAll, allColors }) {
  const [minIn, setMinIn] = useState(filters.minPrice);
  const [maxIn, setMaxIn] = useState(filters.maxPrice);

  useEffect(() => { setMinIn(filters.minPrice); }, [filters.minPrice]);
  useEffect(() => { setMaxIn(filters.maxPrice); }, [filters.maxPrice]);

  const applyPrice = () => {
    setFilter("minPrice", minIn || "");
    setFilter("maxPrice", maxIn || "");
  };

  const PRICE_PRESETS = [
    { label: "Under ₹500",        min: "",    max: "500"   },
    { label: "₹500 – ₹2,000",    min: "500", max: "2000"  },
    { label: "₹2,000 – ₹5,000",  min: "2000",max: "5000"  },
    { label: "₹5,000 – ₹15,000", min: "5000",max: "15000" },
    { label: "Above ₹15,000",     min: "15000",max: ""     },
  ];

  function Accordion({ title, children, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
      <div className={styles.acc}>
        <button className={styles.accHead} onClick={() => setOpen(p => !p)}>
          <span>{title}</span>
          <svg className={open ? styles.accChevUp : styles.accChev}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        {open && <div className={styles.accBody}>{children}</div>}
      </div>
    );
  }

  return (
    <>
      {open && <div className={styles.backdrop} onClick={onClose} />}
      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        <div className={styles.sbHead}>
          <span className={styles.sbTitle}>Filters</span>
          <button className={styles.sbClose} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.sbBody}>
          <Accordion title="Quick Filters">
            {[
              { key: "inStock",    label: "In Stock Only" },
              { key: "isNew",      label: "New Arrivals"  },
              { key: "isFeatured", label: "Featured"      },
            ].map(({ key, label }) => (
              <label key={key} className={`${styles.tog} ${filters[key] ? styles.togOn : ""}`}>
                <input type="checkbox" checked={!!filters[key]}
                  onChange={() => setFilter(key, !filters[key])} />
                <span className={styles.togTrack}><span className={styles.togThumb} /></span>
                {label}
              </label>
            ))}
          </Accordion>

          <Accordion title="Price Range">
            <div className={styles.presets}>
              {PRICE_PRESETS.map(pr => {
                const on = filters.minPrice === pr.min && filters.maxPrice === pr.max;
                return (
                  <button key={pr.label}
                    className={`${styles.preset} ${on ? styles.presetOn : ""}`}
                    onClick={() => { setFilter("minPrice", pr.min); setFilter("maxPrice", pr.max); }}>
                    {pr.label}
                  </button>
                );
              })}
            </div>
            <div className={styles.priceRow}>
              <div className={styles.pField}>
                <span className={styles.pCur}>₹</span>
                <input type="number" placeholder="Min" value={minIn}
                  className={styles.pInput}
                  onChange={e => setMinIn(e.target.value)}
                  onBlur={applyPrice}
                  onKeyDown={e => e.key === "Enter" && applyPrice()} />
              </div>
              <span className={styles.pDash}>—</span>
              <div className={styles.pField}>
                <span className={styles.pCur}>₹</span>
                <input type="number" placeholder="Max" value={maxIn}
                  className={styles.pInput}
                  onChange={e => setMaxIn(e.target.value)}
                  onBlur={applyPrice}
                  onKeyDown={e => e.key === "Enter" && applyPrice()} />
              </div>
            </div>
          </Accordion>

          <Accordion title="Size">
            <div className={styles.sizeGrid}>
              {SIZES.map(s => (
                <button key={s}
                  className={`${styles.sChip} ${filters.sizes.includes(s) ? styles.sChipOn : ""}`}
                  onClick={() => setFilter("sizes",
                    filters.sizes.includes(s)
                      ? filters.sizes.filter(x => x !== s)
                      : [...filters.sizes, s]
                  )}>
                  {s}
                </button>
              ))}
            </div>
          </Accordion>

          {allColors.length > 0 && (
            <Accordion title="Colour">
              <div className={styles.colorList}>
                {allColors.map(c => (
                  <button key={c.name}
                    className={`${styles.colorRow} ${filters.colors.includes(c.name) ? styles.colorRowOn : ""}`}
                    onClick={() => setFilter("colors",
                      filters.colors.includes(c.name)
                        ? filters.colors.filter(x => x !== c.name)
                        : [...filters.colors, c.name]
                    )}>
                    <span className={styles.colorDot} style={{ background: c.code }} />
                    <span className={styles.colorName}>{c.name}</span>
                    {filters.colors.includes(c.name) && (
                      <svg className={styles.colorTick} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </Accordion>
          )}
        </div>

        <div className={styles.sbFoot}>
          <button className={styles.sbClear} onClick={clearAll}>Clear All</button>
          <button className={styles.sbApply} onClick={onClose}>Show Results →</button>
        </div>
      </aside>
    </>
  );
}

/* ═══════════════════════════════
   MAIN PAGE - USING BACKEND API
═══════════════════════════════ */
export default function CategoryPage() {
  const { slug } = useParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [subCategories, setSubCategories] = useState([]);
  const [parentCategory, setParentCategory] = useState(null);

  // Fetch products from backend API
  useEffect(() => {
    if (!slug) return;

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const timestamp = Date.now();
        
        // First, try to fetch as category (includes subcategories)
        console.log(`🔍 Fetching products for category: ${slug}`);
        const response = await fetch(`${API}/products/category/${slug}?_t=${timestamp}`, {
          headers: { "Cache-Control": "no-cache" }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("✅ Category data received:", data);
          setProducts(data.products || []);
          setCategoryInfo(data.category);
          setSubCategories(data.subCategories || []);
          setParentCategory(null);
          setLoading(false);
          return;
        }
        
        // If not found as category, try as subcategory
        console.log(`🔍 Trying as subcategory: ${slug}`);
        const subResponse = await fetch(`${API}/products/subcategory/${slug}?_t=${timestamp}`, {
          headers: { "Cache-Control": "no-cache" }
        });
        
        if (subResponse.ok) {
          const data = await subResponse.json();
          console.log("✅ Subcategory data received:", data);
          setProducts(data.products || []);
          setCategoryInfo(data.subCategory);
          setSubCategories([]);
          setParentCategory(data.subCategory?.parentCategory);
          setLoading(false);
          return;
        }
        
        // If still not found, try regular products endpoint with search
        console.log(`🔍 Searching products by name: ${slug}`);
        const searchResponse = await fetch(`${API}/products?search=${slug}&_t=${timestamp}`, {
          headers: { "Cache-Control": "no-cache" }
        });
        
        if (searchResponse.ok) {
          const data = await searchResponse.json();
          setProducts(data.products || []);
          setCategoryInfo({ name: slug, description: `Products matching "${slug}"` });
          setLoading(false);
          return;
        }
        
        throw new Error(`No products found for "${slug}"`);
        
      } catch (err) {
        console.error("❌ Error fetching products:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [slug]);

  // Local filter state
  const [filters, setFilters] = useState({
    minPrice: "", maxPrice: "",
    sizes: [], colors: [],
    inStock: false, isNew: false, isFeatured: false,
  });
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("grid");
  const [panelOpen, setPanelOpen] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;

  const setFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearAll = () => {
    setFilters({ minPrice:"", maxPrice:"", sizes:[], colors:[], inStock:false, isNew:false, isFeatured:false });
    setPage(1);
  };

  // Extract unique colors
  const allColors = [...new Map(
    products
      .flatMap(p => p.variants || [])
      .filter(v => v.color && v.colorCode)
      .map(v => [v.color, { name: v.color, code: v.colorCode }])
  ).values()];

  // Apply filters
  const filtered = products.filter(p => {
    if (!p) return false;
    const price = calcPrice(p);
    if (filters.minPrice && price < Number(filters.minPrice)) return false;
    if (filters.maxPrice && price > Number(filters.maxPrice)) return false;
    if (filters.inStock && p.totalStock === 0) return false;
    if (filters.isNew && !p.isNewArrival) return false;
    if (filters.isFeatured && !p.isFeatured) return false;

    if (filters.sizes.length > 0) {
      const productSizes = (p.variants || []).filter(v => v.stock > 0).map(v => v.size);
      if (!filters.sizes.some(s => productSizes.includes(s))) return false;
    }
    if (filters.colors.length > 0) {
      const productColors = (p.variants || []).map(v => v.color);
      if (!filters.colors.some(c => productColors.includes(c))) return false;
    }
    return true;
  });

  // Sort products
  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case "priceLow": return calcPrice(a) - calcPrice(b);
      case "priceHigh": return calcPrice(b) - calcPrice(a);
      case "bestSell": return (b.totalSold || 0) - (a.totalSold || 0);
      case "topRated": return (b.averageRating || 0) - (a.averageRating || 0);
      default: return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
  });

  // Paginate
  const totalFiltered = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PER_PAGE));
  const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => { 
    if (page > totalPages) setPage(1); 
  }, [totalPages, page]);

  const activeN = [
    filters.minPrice, filters.maxPrice,
    ...filters.sizes, ...filters.colors,
    filters.inStock, filters.isNew, filters.isFeatured,
  ].filter(Boolean).length;

  const pageTitle = categoryInfo?.name ?? slug ?? "";
  const pageType = subCategories.length > 0 ? "Category" : (parentCategory ? "Subcategory" : "Products");

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <nav className={styles.crumbs}>
            <Link to="/" className={styles.crumb}>Home</Link>
            <span className={styles.sep}>◆</span>
            <Link to="/collections" className={styles.crumb}>Collections</Link>
            <span className={styles.sep}>◆</span>
            {parentCategory && (
              <>
                <Link to={`/collections/${parentCategory.slug}`} className={styles.crumb}>
                  {parentCategory.name}
                </Link>
                <span className={styles.sep}>◆</span>
              </>
            )}
            <span className={styles.crumbNow}>{pageTitle}</span>
          </nav>

          <h1 className={styles.heroTitle}>{pageTitle}</h1>
          
          {categoryInfo?.description && (
            <p className={styles.heroDesc}>{categoryInfo.description}</p>
          )}

          {/* Show subcategories if available */}
          {subCategories.length > 0 && (
            <div className={styles.subcategoryNav}>
              <div className={styles.subcategoryLinks}>
                {subCategories.map(sub => (
                  <Link 
                    key={sub._id} 
                    to={`/collections/${sub.slug}`}
                    className={styles.subcategoryLink}
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className={styles.heroMeta}>
            <span>{loading ? "..." : `${products.length} Pieces`}</span>
            <span className={styles.metaDot}>·</span>
            <span>{pageType}</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.tbL}>
          <button
            className={`${styles.filterBtn} ${panelOpen ? styles.filterBtnOn : ""}`}
            onClick={() => setPanelOpen(p => !p)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Filter
            {activeN > 0 && <span className={styles.fCount}>{activeN}</span>}
          </button>

          {activeN > 0 && (
            <div className={styles.chipRow}>
              {filters.sizes.map(s => (
                <button key={s} className={styles.chip} onClick={() => setFilter("sizes", filters.sizes.filter(x => x !== s))}>
                  {s} ×
                </button>
              ))}
              {filters.colors.map(c => (
                <button key={c} className={styles.chip} onClick={() => setFilter("colors", filters.colors.filter(x => x !== c))}>
                  {c} ×
                </button>
              ))}
              {(filters.minPrice || filters.maxPrice) && (
                <button className={styles.chip} onClick={() => { setFilter("minPrice",""); setFilter("maxPrice",""); }}>
                  ₹{filters.minPrice||"0"}–₹{filters.maxPrice||"∞"} ×
                </button>
              )}
              {filters.inStock && <button className={styles.chip} onClick={() => setFilter("inStock",false)}>In Stock ×</button>}
              {filters.isNew && <button className={styles.chip} onClick={() => setFilter("isNew",false)}>New ×</button>}
              {filters.isFeatured && <button className={styles.chip} onClick={() => setFilter("isFeatured",false)}>Featured ×</button>}
              <button className={styles.chipX} onClick={clearAll}>Clear All</button>
            </div>
          )}
        </div>

        <div className={styles.tbR}>
          <span className={styles.resTxt}>
            {loading ? "..." : `${totalFiltered} result${totalFiltered !== 1 ? "s" : ""}`}
          </span>

          <div className={styles.sortBox}>
            <select className={styles.sortSel} value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}>
              {SORT_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>

          <div className={styles.viewTog}>
            {["grid","list"].map(m => (
              <button key={m} className={`${styles.vBtn} ${view===m ? styles.vBtnOn : ""}`}
                onClick={() => setView(m)}>
                {m === "grid" ? "□" : "≡"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className={`${styles.layout} ${panelOpen ? styles.layoutOpen : ""}`}>
        <FilterSidebar
          open={panelOpen}
          onClose={() => setPanelOpen(false)}
          filters={filters}
          setFilter={setFilter}
          clearAll={clearAll}
          allColors={allColors}
        />

        <main className={styles.main}>
          {error ? (
            <div className={styles.errBox}>
              <span>◆</span>
              <h3>Error loading products</h3>
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          ) : (
            <>
              <div className={`${styles.grid} ${view === "list" ? styles.gridList : ""}`}>
                {loading ? (
                  Array.from({ length: 12 }, (_, i) => <Skeleton key={i} view={view} />)
                ) : paginated.length === 0 ? (
                  <div className={styles.emptyBox}>
                    <span className={styles.emptyDia}>◆</span>
                    <h3>No pieces found</h3>
                    <p>
                      {activeN > 0 
                        ? "Try adjusting your filters" 
                        : `No products found in "${pageTitle}".`}
                    </p>
                    {activeN > 0 && <button className={styles.emptyClear} onClick={clearAll}>Clear Filters</button>}
                  </div>
                ) : (
                  paginated.map((p, i) => (
                    <Card key={p._id} product={p} index={i} view={view} />
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && !loading && (
                <div className={styles.pager}>
                  <button className={styles.pgBtn} disabled={page === 1}
                    onClick={() => { setPage(p => p - 1); window.scrollTo({top:0, behavior:"smooth"}); }}>
                    ← Prev
                  </button>
                  <div className={styles.pgNums}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                      .reduce((a, n, i, arr) => {
                        if (i > 0 && n - arr[i-1] > 1) a.push("…");
                        a.push(n); return a;
                      }, [])
                      .map((n, i) => n === "…"
                        ? <span key={`e${i}`} className={styles.pgDots}>…</span>
                        : <button key={n}
                            className={`${styles.pgN} ${n === page ? styles.pgNOn : ""}`}
                            onClick={() => { setPage(n); window.scrollTo({top:0, behavior:"smooth"}); }}>
                            {n}
                          </button>
                      )}
                  </div>
                  <button className={styles.pgBtn} disabled={page === totalPages}
                    onClick={() => { setPage(p => p + 1); window.scrollTo({top:0, behavior:"smooth"}); }}>
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}