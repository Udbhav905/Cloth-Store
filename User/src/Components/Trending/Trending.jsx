import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import useProductStore, {
  calcFinalPrice,
  formatPrice,
  hasDiscount,
  getBadge,
  getTag,
  getSoldText,
} from "../../store/useProductStore";
import styles from "./Trending.module.css";

/* ─────────────────────────────────────────────
   FALLBACK images — used when product has no mainImage
───────────────────────────────────────────── */
const FALLBACK_IMGS = [
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=700&q=90&auto=format&fit=crop&crop=top",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&q=90&auto=format&fit=crop&crop=top",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=700&q=90&auto=format&fit=crop&crop=top",
  "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=700&q=90&auto=format&fit=crop&crop=top",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=700&q=90&auto=format&fit=crop&crop=top",
  "https://images.unsplash.com/photo-1566479179817-0b1c6a6f5c9b?w=700&q=90&auto=format&fit=crop&crop=top",
];

/* ─────────────────────────────────────────────
   HOOKS
───────────────────────────────────────────── */
function useScrollReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function useParallax(speed = 0.08) {
  const ref = useRef(null);
  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return;
      const rect   = ref.current.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - window.innerHeight / 2;
      ref.current.style.transform = `translateY(${center * speed}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [speed]);
  return ref;
}

/* ─────────────────────────────────────────────
   SKELETON CARD
───────────────────────────────────────────── */
function SkeletonCard({ index }) {
  const isEven = index % 2 === 0;
  return (
    <div
      className={`
        ${styles.card}
        ${isEven ? styles.cardEven : styles.cardOdd}
        ${styles.skeletonCard}
      `}
      style={{ "--idx": index }}
      aria-hidden="true"
    >
      <div className={`${styles.imgBlock} ${styles.skeletonImgBlock}`}>
        <div className={styles.skeletonShimmer} />
      </div>
      <div className={styles.body}>
        <div className={styles.skeletonLine} style={{ width: "35%", height: "9px" }} />
        <div className={styles.skeletonLine} style={{ width: "65%", height: "28px", marginTop: "8px" }} />
        <div className={styles.skeletonLine} style={{ width: "25%", height: "13px", marginTop: "10px" }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PRODUCT CARD  — real backend data
───────────────────────────────────────────── */
function ProductCard({ product, index, visible }) {
  const [hovered,   setHovered]   = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const isEven = index % 2 === 0;
  const rank   = String(index + 1).padStart(2, "0");

  /* Prices */
  const finalPrice    = calcFinalPrice(product);
  const discounted    = hasDiscount(product);
  const priceDisplay  = formatPrice(finalPrice);
  const originalPrice = discounted ? formatPrice(product.basePrice) : null;

  /* Metadata */
  const badge    = getBadge(product, index);
  const tag      = getTag(product);
  const soldText = getSoldText(product);

  /* Category name from populated field */
  const categoryName =
    product.category?.name ?? product.subCategory?.name ?? "Collection";

  /* Image — Cloudinary URL or fallback */
  const imgSrc = product.mainImage || FALLBACK_IMGS[index % FALLBACK_IMGS.length];

  return (
    <Link
      to={`/products/${product._id}`}
      className={`
        ${styles.card}
        ${visible ? styles.cardIn : ""}
        ${isEven ? styles.cardEven : styles.cardOdd}
      `}
      style={{ "--idx": index, "--accent": "#c9a84c" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      draggable={false}
    >
      {/* Rank watermark */}
      <span className={styles.rankBg}>{rank}</span>

      {/* ── Image block ── */}
      <div className={styles.imgBlock}>
        {!imgLoaded && <div className={styles.shimmer} />}
        <img
          src={imgSrc}
          alt={product.name}
          className={`${styles.img} ${imgLoaded ? styles.imgOn : ""}`}
          onLoad={() => setImgLoaded(true)}
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMGS[index % FALLBACK_IMGS.length];
          }}
          draggable={false}
          style={{ transform: hovered ? "scale(1.09)" : "scale(1.0)" }}
          loading={index < 3 ? "eager" : "lazy"}
        />

        {/* Badge */}
        <span className={styles.badge}>{badge}</span>

        {/* Tag pill */}
        <span className={styles.tagPill}>{tag}</span>

        {/* Hover overlay */}
        <div className={`${styles.overlay} ${hovered ? styles.overlayOn : ""}`}>
          <div className={styles.overlayInner}>
            <span className={styles.overlayRank}>{rank}</span>
            <span className={styles.overlayDivider} />
            <span className={styles.overlayLabel}>View Piece</span>
          </div>
        </div>
      </div>

      {/* ── Card body ── */}
      <div className={styles.body}>
        <div className={styles.topRow}>
          <span className={styles.category}>{categoryName}</span>
          <span className={styles.sold}>{soldText}</span>
        </div>

        <h3 className={styles.name}>{product.name}</h3>

        <div className={styles.priceRow}>
          <span className={styles.price}>{priceDisplay}</span>
          {originalPrice && (
            <span className={styles.originalPrice}>{originalPrice}</span>
          )}
          {/* Rating stars if available */}
          {product.averageRating > 0 && (
            <span className={styles.rating}>
              {"★".repeat(Math.round(product.averageRating))}
              {"☆".repeat(5 - Math.round(product.averageRating))}
              <span className={styles.ratingNum}>
                &nbsp;{product.averageRating.toFixed(1)}
              </span>
            </span>
          )}
          <span className={styles.priceDot}>◆</span>
        </div>

        <div className={`${styles.hoverBar} ${hovered ? styles.hoverBarOn : ""}`} />
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
export default function Trending() {
  const [sectionRef, inView]  = useScrollReveal(0.05);
  const [headerRef,  headerIn] = useScrollReveal(0.2);
  const [gridRef,    gridIn]   = useScrollReveal(0.05);
  const bgParallaxRef          = useParallax(0.06);

  const {
    trending,
    trendingLoading,
    trendingError,
    fetchTrending,
    refreshTrending,
  } = useProductStore();

  /* Fetch on mount — 5-min cache in store */
  useEffect(() => {
    fetchTrending();
  }, []);

  const isLoading = trendingLoading && trending.length === 0;
  const hasError  = !trendingLoading && !!trendingError && trending.length === 0;
  const isEmpty   = !trendingLoading && !trendingError && trending.length === 0;

  /* Skeleton count while loading */
  const SKELETON_COUNT = 6;

  const TICKER = "TRENDING NOW · MOST WANTED · THIS WEEK'S OBSESSIONS · ";

  return (
    <section className={styles.section} ref={sectionRef}>

      {/* ── Background ── */}
      <div className={styles.bgWrap} ref={bgParallaxRef} aria-hidden="true">
        <div className={styles.bgGrid} />
        <div className={styles.bgGlow1} />
        <div className={styles.bgGlow2} />
        <div className={styles.bgNoise} />
      </div>

      {/* ── Top ticker ── */}
      <div className={`${styles.ticker} ${inView ? styles.tickerIn : ""}`}>
        <div className={styles.tickerTrack}>
          {Array(6).fill(TICKER).map((t, i) => (
            <span key={i} className={styles.tickerItem}>{t}</span>
          ))}
        </div>
      </div>

      {/* ── Header ── */}
      <div
        className={`${styles.header} ${headerIn ? styles.headerIn : ""}`}
        ref={headerRef}
      >
        <div className={styles.headerAccent}>
          <span className={styles.accentNum}>
            {isLoading ? "—" : String(trending.length).padStart(2, "0")}
          </span>
          <span className={styles.accentLabel}>Pieces</span>
        </div>

        <div className={styles.headerCenter}>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowLine} />
            Right Now
            <span className={styles.eyebrowLine} />
          </p>
          <h2 className={styles.title}>
            <span className={styles.titleLine}>What</span>
            <span className={`${styles.titleLine} ${styles.titleLineGold}`}>Everyone's</span>
            <span className={styles.titleLine}>Wearing</span>
          </h2>
        </div>

        <div className={styles.headerRight}>
          <p className={styles.desc}>
            {isLoading
              ? "Fetching this week's most wanted pieces…"
              : "Curated from our best-sellers. Updated weekly. These are the pieces the world can't stop talking about."}
          </p>
          <div className={styles.liveTag}>
            <span className={`${styles.liveDot} ${!isLoading ? styles.liveDotActive : ""}`} />
            {isLoading ? "Loading…" : "Live Trending Data"}
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      {hasError || isEmpty ? (
        <ErrorState
          message={
            hasError
              ? trendingError
              : "No trending products yet. Mark products as Best Sellers in your admin panel."
          }
          onRetry={refreshTrending}
        />
      ) : (
        <div
          className={`${styles.grid} ${gridIn ? styles.gridIn : ""}`}
          ref={gridRef}
        >
          {isLoading
            ? Array.from({ length: SKELETON_COUNT }, (_, i) => (
                <SkeletonCard key={`sk-${i}`} index={i} />
              ))
            : trending.map((p, i) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  index={i}
                  visible={gridIn}
                />
              ))
          }
        </div>
      )}

      {/* ── Bottom ticker ── */}
      <div className={`${styles.tickerBottom} ${inView ? styles.tickerIn : ""}`}>
        <div className={`${styles.tickerTrack} ${styles.tickerTrackRev}`}>
          {Array(6).fill("LUXURIA SELECTION · MOST COVETED · STYLE ICONS CHOOSE · ").map((t, i) => (
            <span key={i} className={styles.tickerItem}>{t}</span>
          ))}
        </div>
      </div>

    </section>
  );
}