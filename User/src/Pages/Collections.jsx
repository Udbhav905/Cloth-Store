import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import useProductStore, { calcFinalPrice, hasDiscount, formatPrice } from "../store/useProductStore";
import useCategoryStore from "../store/useCategoryStore";
import styles from "./styles/Collections.module.css";

/* ─── Floating fabric particle ─────────────────────────── */
function FabricParticle({ style }) {
  return <div className={styles.particle} style={style} />;
}

/* ─── Single product card ───────────────────────────────── */
function ProductCard({ product, index }) {
  const final      = calcFinalPrice(product);
  const discounted = hasDiscount(product);
  const ref        = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.12 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Link
      ref={ref}
      to={`/products/${product._id}`}
      className={`${styles.card} ${visible ? styles.cardVisible : ""}`}
      style={{ "--card-delay": `${(index % 4) * 0.08}s` }}
    >
      <div className={styles.cardImgWrap}>
        {product.mainImage
          ? <img src={product.mainImage} alt={product.name} loading="lazy" className={styles.cardImg} />
          : <div className={styles.cardImgFallback}><span>◆</span></div>
        }
        <div className={styles.cardOverlay}>
          <span className={styles.cardOverlayText}>View Piece</span>
        </div>
        {discounted && (
          <span className={styles.cardBadge}>
            -{product.discountValue}{product.discountType === "percentage" ? "%" : ""}
          </span>
        )}
        {product.isNewArrival && !discounted && (
          <span className={`${styles.cardBadge} ${styles.cardBadgeNew}`}>NEW</span>
        )}
      </div>
      <div className={styles.cardInfo}>
        <p className={styles.cardBrand}>{product.brand || product.category?.name}</p>
        <h3 className={styles.cardName}>{product.name}</h3>
        <div className={styles.cardPriceRow}>
          <span className={styles.cardPrice}>{formatPrice(final)}</span>
          {discounted && (
            <span className={styles.cardPriceOld}>{formatPrice(product.basePrice)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ─── Category section ──────────────────────────────────── */
function CategorySection({ category, products }) {
  const ref     = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.05 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  if (!products.length) return null;

  return (
    <section
      ref={ref}
      className={`${styles.catSection} ${visible ? styles.catSectionVisible : ""}`}
      id={`cat-${category.slug}`}
    >
      {/* Section header */}
      <div className={styles.catHeader}>
        <div className={styles.catHeaderLeft}>
          <span className={styles.catCount}>{products.length} pieces</span>
          <h2 className={styles.catTitle}>{category.name}</h2>
          {category.description && (
            <p className={styles.catDesc}>{category.description}</p>
          )}
        </div>
        <div className={styles.catHeaderLine} />
        <Link to={`/collections/${category.slug}`} className={styles.catViewAll}>
          View All <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>

      {/* Products grid */}
      <div className={styles.catGrid}>
        {products.map((p, i) => (
          <ProductCard key={p._id} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}

export default function Collections() {
  const navigate = useNavigate();

  
  const trending         = useProductStore((s) => s.trending     || []);
  const newArrivals      = useProductStore((s) => s.newArrivals  || []);
  const featured         = useProductStore((s) => s.featured     || []);
  const fetchTrending    = useProductStore((s) => s.fetchTrending);
  const fetchNewArrivals = useProductStore((s) => s.fetchNewArrivals);
  const fetchFeatured    = useProductStore((s) => s.fetchFeatured);
  const trendingLoading  = useProductStore((s) => s.trendingLoading);

  const categoriesRaw   = useCategoryStore((s) => s.categories || s.allCategories);
  const fetchCategories = useCategoryStore((s) => s.fetchCategories || s.getCategories);
  const categories      = categoriesRaw || [];

  const [entranceDone, setEntranceDone]   = useState(false);
  const [searchQ,      setSearchQ]        = useState("");
  const [sortBy,       setSortBy]         = useState("default");
  const [activeFilter, setActiveFilter]   = useState("all");  // category filter
  const [priceRange,   setPriceRange]     = useState([0, 10000]);
  const [filterOpen,   setFilterOpen]     = useState(false);
  const heroRef  = useRef(null);
  const bodyRef  = useRef(null);

  /* ── Fetch data ─────────────────────────────────────────── */
  useEffect(() => {
    fetchTrending?.();
    fetchNewArrivals?.();
    fetchFeatured?.();
    fetchCategories?.();
  }, []);

  /* ── Entrance sequence ──────────────────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => setEntranceDone(true), 3200);
    return () => clearTimeout(t);
  }, []);

  /* ── Parallax on hero ───────────────────────────────────── */
  useEffect(() => {
    const onScroll = () => {
      if (!heroRef.current) return;
      const y = window.scrollY;
      heroRef.current.style.setProperty("--scroll-y", `${y}px`);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { filtered, grouped, uncategorised } = useMemo(() => {
    const merged = [...trending, ...newArrivals, ...featured];
    const unique  = Array.from(new Map(merged.map((p) => [p._id, p])).values());

    const fil = unique.filter((p) => {
      if (activeFilter !== "all" && p.category?.slug !== activeFilter) return false;
      const price = calcFinalPrice(p);
      if (price < priceRange[0] || price > priceRange[1]) return false;
      if (searchQ.trim()) {
        const q = searchQ.toLowerCase();
        return (
          p.name?.toLowerCase().includes(q) ||
          p.category?.name?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.slug?.toLowerCase().includes(q)
        );
      }
      return true;
    });

    const sorted = [...fil].sort((a, b) => {
      if (sortBy === "price-asc")  return calcFinalPrice(a) - calcFinalPrice(b);
      if (sortBy === "price-desc") return calcFinalPrice(b) - calcFinalPrice(a);
      if (sortBy === "newest")     return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "name-az")    return a.name.localeCompare(b.name);
      if (sortBy === "name-za")    return b.name.localeCompare(a.name);
      return 0;
    });

    const grp = categories.reduce((acc, cat) => {
      acc[cat._id] = {
        category: cat,
        products: sorted.filter(
          (p) => p.category?._id === cat._id || p.category?.slug === cat.slug
        ),
      };
      return acc;
    }, {});

    const catIds = new Set(
      Object.values(grp).flatMap((g) => g.products.map((p) => p._id))
    );
    const uncat = sorted.filter((p) => !catIds.has(p._id));

    return { filtered: sorted, grouped: grp, uncategorised: uncat };
  }, [trending, newArrivals, featured, activeFilter, priceRange, searchQ, sortBy, categories]);

  /* ── Particles — stable, computed once ─────────────────── */
  const particles = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    left:      `${5  + (i * 5.3) % 90}%`,
    top:       `${10 + (i * 7.1) % 80}%`,
    width:     `${1  + (i % 3)}px`,
    height:    `${40 + (i % 4) * 30}px`,
    animDelay: `${(i * 0.4) % 4}s`,
    animDur:   `${3  + (i % 3)}s`,
    opacity:   `${0.04 + (i % 5) * 0.02}`,
  })), []);

  const handleSearchKey = (e) => {
    if (e.key === "Enter" && searchQ.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`);
    }
  };

  return (
    <div className={styles.page}>

      {/* ════════════════════════════════
          ENTRANCE OVERLAY
      ════════════════════════════════ */}
      {/* <div className={`${styles.entrance} ${entranceDone ? styles.entranceDone : ""}`}>
        <div className={styles.entranceShade} />
        <div className={styles.entranceWordmark}>
          <span className={styles.entranceDiamond}>◆</span>
          <span className={styles.entranceText}>COLLECTIONS</span>
          <span className={styles.entranceDiamond}>◆</span>
        </div>
        <div className={styles.entranceRevealBar} />
      </div> */}

      {/* ════════════════════════════════
          HERO
      ════════════════════════════════ */}
      <header ref={heroRef} className={styles.hero}>

        {/* Floating fabric threads */}
        {particles.map((p, i) => (
          <FabricParticle
            key={i}
            style={{
              left:             p.left,
              top:              p.top,
              width:            p.width,
              height:           p.height,
              opacity:          p.opacity,
              animationDelay:   p.animDelay,
              animationDuration:p.animDur,
            }}
          />
        ))}

        {/* Background gradient orbs */}
        <div className={styles.heroOrb1} />
        <div className={styles.heroOrb2} />

        {/* 3D cloth silhouettes */}
        <div className={styles.clothWrap}>
          <div className={`${styles.cloth} ${styles.cloth1}`}>
            <div className={styles.clothInner} />
          </div>
          <div className={`${styles.cloth} ${styles.cloth2}`}>
            <div className={styles.clothInner} />
          </div>
          <div className={`${styles.cloth} ${styles.cloth3}`}>
            <div className={styles.clothInner} />
          </div>
        </div>

        {/* Hero copy */}
        <div className={styles.heroCopy}>
          <p className={styles.heroEyebrow}>LUXURIA · A/W 2025</p>
          <h1 className={styles.heroTitle}>
            <span className={styles.heroTitleLine1}>The</span>
            <span className={styles.heroTitleLine2}>Collection</span>
          </h1>
          <p className={styles.heroSub}>
            Every piece. Every category.<br />Curated without compromise.
          </p>
          <button
            className={styles.heroCta}
            onClick={() => bodyRef.current?.scrollIntoView({ behavior: "smooth" })}
          >
            Explore All
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <line x1="12" y1="5" x2="12" y2="19" /><polyline points="5 12 12 19 19 12" />
            </svg>
          </button>
        </div>

        {/* Scroll indicator */}
        <div className={styles.scrollIndicator}>
          <div className={styles.scrollLine} />
          <span className={styles.scrollLabel}>SCROLL</span>
        </div>
      </header>

      {/* ════════════════════════════════
          CONTROLS BAR
      ════════════════════════════════ */}
      <div ref={bodyRef} className={styles.controls}>

        {/* Search */}
        <div className={styles.controlsSearch}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search within collections…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            onKeyDown={handleSearchKey}
            className={styles.controlsSearchInput}
          />
          {searchQ && (
            <button className={styles.controlsClear} onClick={() => setSearchQ("")}>✕</button>
          )}
        </div>

        {/* Sort */}
        <div className={styles.controlsSort}>
          <label className={styles.controlsLabel}>Sort</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.controlsSelect}
          >
            <option value="default">Default</option>
            <option value="newest">Newest First</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="name-az">Name: A → Z</option>
            <option value="name-za">Name: Z → A</option>
          </select>
        </div>

        {/* Filter toggle */}
        <button
          className={`${styles.controlsFilterBtn} ${filterOpen ? styles.controlsFilterBtnActive : ""}`}
          onClick={() => setFilterOpen((p) => !p)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" />
            <line x1="11" y1="18" x2="13" y2="18" />
          </svg>
          Filters
        </button>

        {/* Results count */}
        <span className={styles.controlsCount}>
          {trendingLoading ? "Loading…" : `${filtered.length} pieces`}
        </span>
      </div>

      {/* ── Filter Panel ─────────────────────────────────────── */}
      <div className={`${styles.filterPanel} ${filterOpen ? styles.filterPanelOpen : ""}`}>

        {/* Category chips */}
        <div className={styles.filterGroup}>
          <span className={styles.filterGroupLabel}>Category</span>
          <div className={styles.filterChips}>
            <button
              className={`${styles.chip} ${activeFilter === "all" ? styles.chipActive : ""}`}
              onClick={() => setActiveFilter("all")}
            >All</button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                className={`${styles.chip} ${activeFilter === cat.slug ? styles.chipActive : ""}`}
                onClick={() => setActiveFilter(cat.slug)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Price range */}
        <div className={styles.filterGroup}>
          <span className={styles.filterGroupLabel}>
            Price Range — ₹{priceRange[0].toLocaleString()} – ₹{priceRange[1].toLocaleString()}
          </span>
          <div className={styles.rangeWrap}>
            <input
              type="range" min={0} max={10000} step={100}
              value={priceRange[0]}
              onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])}
              className={styles.rangeInput}
            />
            <input
              type="range" min={0} max={10000} step={100}
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
              className={styles.rangeInput}
            />
          </div>
        </div>

        {/* Reset */}
        <button
          className={styles.filterReset}
          onClick={() => { setActiveFilter("all"); setPriceRange([0, 10000]); setSearchQ(""); setSortBy("default"); }}
        >
          Reset All Filters
        </button>
      </div>

      {/* ── Category jump nav ────────────────────────────────── */}
      {categories.length > 0 && (
        <nav className={styles.catNav}>
          {categories.map((cat) => (
            <Link key={cat._id} to={`/collections/${cat.slug}`} className={styles.catNavLink} onClick={()=>screenTop(0)}>
              {cat.name}
            </Link>
          ))}
        </nav>
      )}

      {/* ════════════════════════════════
          BODY — grouped by category
      ════════════════════════════════ */}
      <main className={styles.body}>

        {trendingLoading ? (
          /* Skeleton grid */
          <div className={styles.skeletonGrid}>
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className={styles.skeleton}>
                <div className={styles.skeletonImg} />
                <div className={styles.skeletonBody}>
                  <div className={styles.skeletonLine} style={{ width: "35%" }} />
                  <div className={styles.skeletonLine} style={{ width: "65%" }} />
                  <div className={styles.skeletonLine} style={{ width: "25%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state */
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>◆</span>
            <h2 className={styles.emptyTitle}>No pieces match your filters</h2>
            <p className={styles.emptySub}>Try adjusting your search or filters</p>
            <button
              className={styles.emptyReset}
              onClick={() => { setActiveFilter("all"); setPriceRange([0, 10000]); setSearchQ(""); setSortBy("default"); }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* Category sections */}
            {Object.values(grouped).map(({ category, products }) =>
              products.length > 0 ? (
                <CategorySection key={category._id} category={category} products={products} />
              ) : null
            )}

            {/* Uncategorised overflow */}
            {uncategorised.length > 0 && (
              <CategorySection
                category={{ name: "Other Pieces", slug: "other", _id: "other" }}
                products={uncategorised}
              />
            )}
          </>
        )}
      </main>

      {/* Footer accent */}
      <div className={styles.footerAccent}>
        <span>◆ LUXURIA ◆</span>
        <p> · NADIAD · NAGPUR  ·  </p>
      </div>

    </div>
  );
}