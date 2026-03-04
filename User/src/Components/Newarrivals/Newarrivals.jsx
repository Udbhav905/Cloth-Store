import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import useProductStore, { calcFinalPrice, formatPrice, hasDiscount } from "../../Store/useProductStore";
import styles from "./NewArrivals.module.css";

const FALLBACK_IMGS = [
  "https://images.unsplash.com/photo-1566479179817-0b1c6a6f5c9b?w=800&q=85&auto=format&fit=crop&crop=top",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=85&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=85&auto=format&fit=crop&crop=top",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=85&auto=format&fit=crop&crop=top",
  "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=85&auto=format&fit=crop&crop=top",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=85&auto=format&fit=crop&crop=top",
];

/* ── Scroll reveal ── */
function useInView(threshold = 0.1) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ── Skeleton card ── */
function SkeletonCard() {
  return (
    <div className={styles.card} aria-hidden="true" style={{ pointerEvents: "none" }}>
      <div className={styles.imgWrap}>
        <div className={styles.shimmer} />
      </div>
      <div className={styles.info}>
        <div style={{ height: 9,  width: "55%", background: "rgba(201,168,76,.07)", borderRadius: 2, marginBottom: 10 }} />
        <div style={{ height: 20, width: "70%", background: "rgba(201,168,76,.07)", borderRadius: 2, marginBottom: 8  }} />
        <div style={{ height: 9,  width: "35%", background: "rgba(201,168,76,.07)", borderRadius: 2 }} />
      </div>
    </div>
  );
}

/* ── Single product card ── */
function Card({ product: p, idx, onPause, onResume }) {
  const [hovered, setHovered] = useState(false);
  const [loaded,  setLoaded]  = useState(false);

  const enter = () => { setHovered(true);  onPause();  };
  const leave = () => { setHovered(false); onResume(); };

  const finalPrice = calcFinalPrice(p);
  const discounted = hasDiscount(p);
  const priceLabel = formatPrice(finalPrice);
  const origLabel  = discounted ? formatPrice(p.basePrice) : null;

  const tag = p.isBestSeller      ? "Best Seller"
            : p.isNewArrival      ? "New Arrival"
            : (p.season?.length   ? p.season[0] : "SS 2025");

  const material = p.fabric || p.brand || p.pattern || "Fine Fabric";
  const origin   = p.subCategory?.name || p.category?.name || "LUXURIA";
  const imgSrc   = p.mainImage || FALLBACK_IMGS[idx % FALLBACK_IMGS.length];

  return (
    <Link
      to={`/products/${p._id}`}
      className={`${styles.card} ${hovered ? styles.cardHovered : ""}`}
      onMouseEnter={enter}
      onMouseLeave={leave}
      onFocus={enter}
      onBlur={leave}
      aria-label={`${p.name} — ${p.category?.name ?? ""}`}
      draggable={false}
    >
      {/* Image */}
      <div className={styles.imgWrap}>
        {!loaded && <div className={styles.shimmer} />}
        <img
          src={imgSrc}
          alt={p.name}
          className={`${styles.img} ${loaded ? styles.imgLoaded : ""}`}
          onLoad={() => setLoaded(true)}
          onError={e => { e.currentTarget.src = FALLBACK_IMGS[idx % FALLBACK_IMGS.length]; }}
          draggable={false}
          loading="lazy"
        />
        <div className={styles.reveal}>
          <span className={styles.revealLine} />
          <span className={styles.revealText}>Discover</span>
          <span className={styles.revealLine} />
        </div>
        <span className={styles.tag}>{tag}</span>
      </div>

      {/* Info */}
      <div className={styles.info}>
        <div className={styles.meta}>
          <span>{p.category?.name ?? "Collection"}</span>
          <span className={styles.dot}>·</span>
          <span>{material}</span>
        </div>
        <div className={styles.nameRow}>
          <h3 className={styles.name}>{p.name}</h3>
          <div className={styles.priceBlock}>
            <span className={styles.price}>{priceLabel}</span>
            {origLabel && <span className={styles.origPrice}>{origLabel}</span>}
          </div>
        </div>
        <div className={styles.origin}>
          <span className={styles.diamond}>◆</span>
          {origin}
        </div>
        <div className={`${styles.underline} ${hovered ? styles.underlineOn : ""}`} />
      </div>
    </Link>
  );
}

/* ════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════ */
export default function NewArrivals() {
  const [sectionRef, inView] = useInView(0.05);

  /* ── Real data from store ── */
  const { newArrivals, newArrivalsLoading, fetchNewArrivals } = useProductStore();

  /* Fetch eagerly on mount — 5-min cache prevents redundant calls */
  useEffect(() => { fetchNewArrivals(); }, []);

  const isLoading = newArrivalsLoading && newArrivals.length === 0;

  /* Double the array for seamless infinite loop */
  const ITEMS = [...newArrivals, ...newArrivals];

  /* ── rAF infinite scroll ── */
  const trackRef     = useRef(null);
  const offsetRef    = useRef(0);
  const pausedRef    = useRef(true);
  const rafRef       = useRef(null);
  const halfWidthRef = useRef(0);
  const SPEED        = 0.55;

  useEffect(() => {
    if (!inView || isLoading || newArrivals.length === 0) return;

    const measure = () => {
      if (!trackRef.current) return;
      halfWidthRef.current = trackRef.current.scrollWidth / 2;
    };
    const tid = setTimeout(measure, 120);
    window.addEventListener("resize", measure, { passive: true });
    pausedRef.current = false;

    const tick = () => {
      if (!pausedRef.current && trackRef.current && halfWidthRef.current > 0) {
        offsetRef.current -= SPEED;
        if (Math.abs(offsetRef.current) >= halfWidthRef.current) {
          offsetRef.current = 0;
        }
        trackRef.current.style.transform = `translateX(${offsetRef.current}px)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      clearTimeout(tid);
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", measure);
    };
  }, [inView, isLoading, newArrivals.length]);

  const pause  = () => { pausedRef.current = true;  };
  const resume = () => { pausedRef.current = false; };

  return (
    <section className={styles.section} ref={sectionRef}>

      {/* Header */}
      <div className={`${styles.header} ${inView ? styles.headerIn : ""}`}>
        <div className={styles.hLeft}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowLine} />
            Just Arrived
          </span>
          <h2 className={styles.title}>
            New<br /><em>Arrivals</em>
          </h2>
        </div>
        <div className={styles.hRight}>
          <p className={styles.desc}>
            The season's most anticipated pieces — each a testament
            to the relentless pursuit of perfection.
          </p>
          <div className={styles.pills}>
            <span className={styles.pill}>
              <span className={styles.pillDot}>◆</span>
              {isLoading
                ? "Loading…"
                : `${newArrivals.length} New Piece${newArrivals.length !== 1 ? "s" : ""}`
              }
            </span>
            <span className={styles.pillDiv} />
            <span className={styles.pill}>SS 2025</span>
          </div>
        </div>
      </div>

      {/* Infinite scroll viewport */}
      <div className={styles.viewport}>
        <div className={`${styles.fade} ${styles.fadeL}`} />
        <div className={`${styles.fade} ${styles.fadeR}`} />

        <div ref={trackRef} className={styles.track}>
          {isLoading
            ? Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)
            : ITEMS.map((p, i) => (
                <Card
                  key={`${p._id}-${i}`}
                  product={p}
                  idx={i % newArrivals.length}
                  onPause={pause}
                  onResume={resume}
                />
              ))
          }
        </div>
      </div>

      {/* Bottom ornament */}
      <div className={`${styles.rule} ${inView ? styles.ruleIn : ""}`}>
        <span className={styles.ruleLine} />
        <span className={styles.ruleDiamond}>◆</span>
        <span className={styles.ruleLine} />
      </div>

    </section>
  );
}