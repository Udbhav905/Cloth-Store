import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import useCategoryStore from "../../store/Usecategorystore";
import useProductStore from "../../store/useProductStore";
import styles from "./ShopByCategory.module.css";

/* ─────────────────────────────────────────────
   Fallback images — used when category.img is null
   (i.e. admin hasn't uploaded a category image yet)
───────────────────────────────────────────── */
const FALLBACK_IMGS = [
  "https://images.unsplash.com/photo-1566479179817-0b1c6a6f5c9b?w=900&q=88&auto=format&fit=crop&crop=top",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&q=88&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900&q=88&auto=format&fit=crop&crop=top",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&q=88&auto=format&fit=crop&crop=top",
  "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&q=88&auto=format&fit=crop&crop=top",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=900&q=88&auto=format&fit=crop&crop=top",
];

/* ─────────────────────────────────────────────
   HOOK — scroll reveal
───────────────────────────────────────────── */
function useInView(threshold = 0.1) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─────────────────────────────────────────────
   SKELETON CARD — shown while API loads
───────────────────────────────────────────── */
const SKELETON_LAYOUT = ["tall", "wide", "normal", "normal", "tall", "wide"];

function SkeletonCard({ size, index }) {
  return (
    <div
      className={`${styles.card} ${styles[`card--${size}`]} ${styles.skeletonCard}`}
      style={{ "--idx": index }}
      aria-hidden="true"
    >
      <div className={styles.skeletonShimmer} />
      <div className={styles.skeletonContent}>
        <div className={styles.skeletonLine} style={{ width: "40%", height: "9px" }} />
        <div className={styles.skeletonLine} style={{ width: "70%", height: "36px", marginTop: "8px" }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CATEGORY CARD — real backend data
───────────────────────────────────────────── */
function CategoryCard({ cat, index, visible }) {
  const [hovered, setHovered] = useState(false);
  const [loaded,  setLoaded]  = useState(false);
  const cardRef = useRef(null);
  
  // 3D Tilt Parameters
  const [tilt, setTilt] = useState({ rX: 0, rY: 0, gX: 50, gY: 50 });

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10; // Max tilt up/down
    const rotateY = ((x - centerX) / centerX) * 10;  // Max tilt left/right

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTilt({ rX: rotateX, rY: rotateY, gX: glareX, gY: glareY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    // Reset tilt with smooth spring
    setTilt({ rX: 0, rY: 0, gX: 50, gY: 50 });
  }, []);

  /* Use backend Cloudinary image, fall back to placeholder */
  const imgSrc = cat.img || FALLBACK_IMGS[index % FALLBACK_IMGS.length];

  return (
    <Link
      to={`/collections/${cat.slug}`}
      ref={cardRef}
      className={`
        ${styles.card}
        ${styles[`card--${cat.size}`]}
        ${visible ? styles.cardVisible : ""}
      `}
      style={{ 
        "--idx": index, 
        "--accent": cat.accent,
        "--rX": `${tilt.rX}deg`,
        "--rY": `${tilt.rY}deg`,
        "--gX": `${tilt.gX}%`,
        "--gY": `${tilt.gY}%`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      draggable={false}
    >
      <div className={`${styles.cardInner} ${hovered ? styles.cardInnerHovered : ""}`}>
      {/* ── Spotlight / Glare ── */}
      <div className={`${styles.glare} ${hovered ? styles.glareVisible : ""}`} />

      {/* ── Image ── */}
      <div className={styles.imgWrap}>
        {!loaded && <div className={styles.skeleton} />}
        <img
          src={imgSrc}
          alt={cat.name}
          className={`${styles.img} ${loaded ? styles.imgLoaded : ""}`}
          onLoad={() => setLoaded(true)}
          onError={(e) => {
            /* If Cloudinary URL fails, fallback to placeholder */
            e.currentTarget.src = FALLBACK_IMGS[index % FALLBACK_IMGS.length];
          }}
          style={{ transform: hovered ? "scale(1.08)" : "scale(1.0)" }}
          draggable={false}
          loading={index < 3 ? "eager" : "lazy"}
        />
        <div className={styles.overlay} />
        <div className={styles.overlayBottom} />
      </div>

      {/* ── Count badge (hidden when null) ── */}
      {cat.count && (
        <span className={`${styles.countBadge} ${hovered ? styles.countBadgeHovered : ""}`}>
          {cat.count}
        </span>
      )}

      {/* ── Rotating "Explore" ring ── */}
      <div className={`${styles.exploreRing} ${hovered ? styles.exploreRingVisible : ""}`}>
        <svg viewBox="0 0 100 100" className={styles.ringText}>
          <defs>
            <path
              id={`circle-${cat.id}`}
              d="M 50,50 m -35,0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0"
            />
          </defs>
          <text className={styles.ringTextEl}>
            <textPath href={`#circle-${cat.id}`} startOffset="0%">
              EXPLORE · SHOP NOW · DISCOVER ·&nbsp;
            </textPath>
          </text>
        </svg>
        <div className={styles.ringArrow}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <line x1="5"  y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
      </div>

      {/* ── Text ── */}
      <div className={`${styles.content} ${hovered ? styles.contentHovered : ""}`}>
        {/* Description from backend OR visual map */}
        <p className={styles.desc}>{cat.desc}</p>

        <div className={styles.labelWrap}>
          <h3 className={styles.label}>
            <span className={styles.labelTop}>{cat.label}</span>
            <span className={styles.labelBottom}>{cat.sublabel}</span>
          </h3>
          <span className={`${styles.arrow} ${hovered ? styles.arrowVisible : ""}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
              <line x1="5"  y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </div>
        <span className={`${styles.revealLine} ${hovered ? styles.revealLineOn : ""}`} />
      </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────
   ERROR STATE
───────────────────────────────────────────── */
function ErrorState({ message, onRetry }) {
  return (
    <div className={styles.errorWrap}>
      <span className={styles.errorDiamond}>◆</span>
      <p className={styles.errorText}>{message}</p>
      <button className={styles.retryBtn} onClick={onRetry}>
        Retry
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 .49-3" />
        </svg>
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function ShopByCategory() {
  const [sectionRef, inView]  = useInView(0.08);
  const [headerRef,  headerIn] = useInView(0.2);

  const { fetchLandingPageData, landingPageError, landingPageLoading } = useProductStore();
  const { categories, loading, error, fetchCategories } = useCategoryStore();

  /* Fetch on mount — store caches for 5 min automatically */
  // Data is fetched once by the parent Home page

  const isLoading = (loading || landingPageLoading) && categories.length === 0;
  const hasError  = (!loading && !landingPageLoading) && (!!error || !!landingPageError) && categories.length === 0;
  const isEmpty   = (!loading && !landingPageLoading) && !error && !landingPageError && categories.length === 0 && !isLoading;

  const onRetry = () => fetchLandingPageData({ force: true });

  /* Grid items — real data or skeletons */
  const gridItems = isLoading
    ? SKELETON_LAYOUT.map((size, i) => (
        <SkeletonCard key={`sk-${i}`} size={size} index={i} />
      ))
    : categories.map((cat, i) => (
        <CategoryCard key={cat.id} cat={cat} index={i} visible={inView} />
      ));

  return (
    <section className={styles.section} ref={sectionRef}>

      {/* ── Ambient BG ── */}
      <div className={styles.ambientBg} aria-hidden="true">
        <div className={styles.ambientGlow1} />
        <div className={styles.ambientGlow2} />
        <div className={styles.ambientGrid} />
      </div>

      {/* ── Header ── */}
      <div
        className={`${styles.header} ${headerIn ? styles.headerIn : ""}`}
        ref={headerRef}
      >
        <div className={styles.headerLeft}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDash} />
            Browse by Category
          </span>
          <h2 className={styles.title}>
            <span className={styles.titleMain}>Shop by</span>
            <span className={styles.titleAccent}>Universe</span>
          </h2>
        </div>

        <div className={styles.headerRight}>
          <p className={styles.subtitle}>
            {isLoading
              ? "Loading our curated universes…"
              : isEmpty
              ? "No categories found."
              : `${categories.length} worlds of distinction. Each one a doorway into a different dimension of the LUXURIA experience.`
            }
          </p>
          <div className={styles.headerStats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>
                {isLoading ? "—" : categories.length}
              </span>
              <span className={styles.statLabel}>Categories</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>251+</span>
              <span className={styles.statLabel}>Unique Pieces</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>SS25</span>
              <span className={styles.statLabel}>Season</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      {hasError || isEmpty ? (
        <ErrorState
          message={hasError ? (error || landingPageError) : "No categories found. Add some from your admin panel."}
          onRetry={onRetry}
        />
      ) : (
        <div className={styles.grid}>{gridItems}</div>
      )}

      {/* ── Bottom ornament ── */}
      <div className={`${styles.rule} ${inView ? styles.ruleVisible : ""}`}>
        <span className={styles.ruleLine} />
        <span className={styles.ruleDiamond}>◆</span>
        <span className={styles.ruleLine} />
      </div>

    </section>
  );
}