import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import useProductStore, {
  calcFinalPrice,
  formatPrice,
  hasDiscount,
  getBadge,
  getTag,
  getSoldText,
} from "../../Store/useProductStore";
import styles from "./Trending.module.css";

/* ─────────────────────────────────────────────
   FALLBACK images
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
   HOOK — generic section reveal (header, ticker)
───────────────────────────────────────────── */
function useScrollReveal(threshold = 0.1) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) { setVisible(true); return; }

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
   HOOK — per-card reveal
───────────────────────────────────────────── */
function useCardReveal(delay = 0) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const show = () => setVisible(true);

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight + 60) {
      const t = setTimeout(show, delay);
      return () => clearTimeout(t);
    }

    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          const t = setTimeout(show, delay);
          obs.disconnect();
          return () => clearTimeout(t);
        }
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

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
      className={`${styles.card} ${isEven ? styles.cardEven : styles.cardOdd} ${styles.skeletonCard}`}
      style={{ "--idx": index }}
      aria-hidden="true"
    >
      <div className={styles.cardInner}>
        <div className={`${styles.imgBlock} ${styles.skeletonImgBlock}`}>
          <div className={styles.skeletonShimmer} />
        </div>
        <div className={styles.body}>
          <div className={styles.skeletonLine} style={{ width: "35%", height: "9px" }} />
          <div className={styles.skeletonLine} style={{ width: "65%", height: "28px", marginTop: "8px" }} />
          <div className={styles.skeletonLine} style={{ width: "25%", height: "13px", marginTop: "10px" }} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PRODUCT CARD — 3D Tilt + Realistic Hover
───────────────────────────────────────────── */
function ProductCard({ product, index }) {
  const [hovered,   setHovered]   = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const innerRef = useRef(null);

  const staggerDelay = Math.min(index * 80, 400);
  const [cardRef, visible] = useCardReveal(staggerDelay);

  const isEven        = index % 2 === 0;
  const rank          = String(index + 1).padStart(2, "0");
  const finalPrice    = calcFinalPrice(product);
  const discounted    = hasDiscount(product);
  const priceDisplay  = formatPrice(finalPrice);
  const originalPrice = discounted ? formatPrice(product.basePrice) : null;
  const badge         = getBadge(product, index);
  const tag           = getTag(product);
  const soldText      = getSoldText(product);
  const categoryName  = product.category?.name ?? product.subCategory?.name ?? "Collection";
  const imgSrc        = product.mainImage || FALLBACK_IMGS[index % FALLBACK_IMGS.length];

  const handleMouseMove = (e) => {
    if (!innerRef.current) return;
    const rect = innerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate rotation (-10 to 10 degrees max depends on distance from center)
    const xPct = (x / rect.width - 0.5) * 2; 
    const yPct = (y / rect.height - 0.5) * 2;
    
    innerRef.current.style.setProperty('--rx', `${-yPct * 8}deg`);
    innerRef.current.style.setProperty('--ry', `${xPct * 8}deg`);
    innerRef.current.style.setProperty('--gx', `${x}px`);
    innerRef.current.style.setProperty('--gy', `${y}px`);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    if (!innerRef.current) return;
    innerRef.current.style.setProperty('--rx', `0deg`);
    innerRef.current.style.setProperty('--ry', `0deg`);
  };

  return (
    <Link
      ref={cardRef}
      to={`/products/${product._id}`}
      className={`
        ${styles.card}
        ${visible ? styles.cardIn : ""}
        ${isEven ? styles.cardEven : styles.cardOdd}
      `}
      style={{ "--idx": index, "--accent": "#c9a84c" }}
      draggable={false}
    >
      <div 
        className={`${styles.cardInner} ${hovered ? styles.cardInnerHovered : ""}`}
        ref={innerRef}
        onMouseEnter={() => setHovered(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className={styles.glare} />
        <span className={styles.rankBg}>{rank}</span>

        <div className={styles.imgBlock}>
          {!imgLoaded && <div className={styles.shimmer} />}
          <img
            src={imgSrc}
            alt={product.name}
            className={`${styles.img} ${imgLoaded ? styles.imgOn : ""}`}
            onLoad={() => setImgLoaded(true)}
            onError={(e) => { e.currentTarget.src = FALLBACK_IMGS[index % FALLBACK_IMGS.length]; }}
            draggable={false}
            loading={index < 3 ? "eager" : "lazy"}
          />
          <span className={styles.badge}>{badge}</span>
          <span className={styles.tagPill}>{tag}</span>
          
          <div className={`${styles.overlay} ${hovered ? styles.overlayOn : ""}`}>
            <div className={styles.overlayInner}>
              <span className={styles.overlayRank}>{rank}</span>
              <span className={styles.overlayDivider} />
              <span className={styles.overlayLabel}>View Piece</span>
            </div>
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.topRow}>
            <span className={styles.category}>{categoryName}</span>
            <span className={styles.sold}>{soldText}</span>
          </div>
          <h3 className={styles.name}>{product.name}</h3>
          <div className={styles.priceRow}>
            <span className={styles.price}>{priceDisplay}</span>
            {originalPrice && <span className={styles.originalPrice}>{originalPrice}</span>}
            {product.averageRating > 0 && (
              <span className={styles.rating}>
                {"★".repeat(Math.round(product.averageRating))}
                {"☆".repeat(5 - Math.round(product.averageRating))}
                <span className={styles.ratingNum}>&nbsp;{product.averageRating.toFixed(1)}</span>
              </span>
            )}
            <span className={styles.priceDot}>◆</span>
          </div>
          <div className={`${styles.hoverBar} ${hovered ? styles.hoverBarOn : ""}`} />
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
export default function Trending() {
  const [sectionRef, inView]   = useScrollReveal(0.03);
  const [headerRef,  headerIn] = useScrollReveal(0.15);
  const bgParallaxRef          = useParallax(0.06);

  const {
    trending,
    trendingLoading,
    trendingError,
    fetchTrending,
    refreshTrending,
  } = useProductStore();

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  const isLoading = trendingLoading && trending.length === 0;
  const hasError  = !trendingLoading && !!trendingError && trending.length === 0;
  const isEmpty   = !trendingLoading && !trendingError && trending.length === 0;

  const TICKER = "TRENDING NOW · THE NEW STANDARD · LUXURY REDEFINED · ";

  return (
    <section className={styles.section} ref={sectionRef}>

      <div className={styles.bgWrap} ref={bgParallaxRef} aria-hidden="true">
        <div className={styles.bgGrid} />
        <div className={styles.bgGlow1} />
        <div className={styles.bgGlow2} />
        <div className={styles.bgGlow3} />
        <div className={styles.bgNoise} />
      </div>

      {/* Ticker */}
      <div className={`${styles.ticker} ${inView ? styles.tickerIn : ""}`}>
        <div className={styles.tickerTrack}>
          {Array(8).fill(TICKER).map((t, i) => (
            <span key={i} className={styles.tickerItem}>{t}</span>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className={`${styles.header} ${headerIn ? styles.headerIn : ""}`} ref={headerRef}>
        <div className={styles.headerAccent}>
          <span className={styles.accentNum}>
            {isLoading ? "—" : String(trending.length).padStart(2, "0")}
          </span>
          <span className={styles.accentLabel}>Pieces</span>
        </div>

        <div className={styles.headerCenter}>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowLine} />
            <span className={styles.eyebrowGlowText}>Right Now</span>
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
              : "Curated from our finest collection. Updated weekly. These are the pieces dictating tomorrow's trends."}
          </p>
          <div className={styles.liveTagWrap}>
            <div className={styles.liveTagBackground} />
            <div className={styles.liveTag}>
              <span className={`${styles.liveDot} ${!isLoading ? styles.liveDotActive : ""}`} />
              {isLoading ? "Syncing…" : "Live Pulse Data"}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      {hasError || isEmpty ? (
        <ErrorState
          message={
            hasError
              ? trendingError
              : "No trending products right now. Stay tuned for our latest drops."
          }
          onRetry={refreshTrending}
        />
      ) : (
        <div className={styles.grid}>
          {isLoading
            ? Array.from({ length: 6 }, (_, i) => <SkeletonCard key={`sk-${i}`} index={i} />)
            : trending.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)
          }
        </div>
      )}

      {/* Bottom ticker */}
      <div className={`${styles.tickerBottom} ${inView ? styles.tickerIn : ""}`}>
        <div className={`${styles.tickerTrack} ${styles.tickerTrackRev}`}>
          {Array(8).fill("CLASSIC ELEGANCE · MODERN AESTHETIC · ICONIC SILHOUETTES · ").map((t, i) => (
            <span key={i} className={styles.tickerItem}>{t}</span>
          ))}
        </div>
      </div>
      
    </section>
  );
}