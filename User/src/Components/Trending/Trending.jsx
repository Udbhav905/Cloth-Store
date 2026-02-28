import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import styles from "./Trending.module.css";

/* ─────────────────────────────────────────────
   TRENDING PRODUCTS DATA
───────────────────────────────────────────── */
const PRODUCTS = [
  {
    id: 1,
    rank: "01",
    name: "Obsidian Drape",
    category: "Evening Wear",
    price: "€6,200",
    originalPrice: "€7,800",
    tag: "🔥 Hot",
    sold: "142 sold this week",
    img: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=700&q=90&auto=format&fit=crop&crop=top",
    badge: "TRENDING #1",
    color: "#1a0f00",
    accent: "#c9a84c",
  },
  {
    id: 2,
    rank: "02",
    name: "Velvet Reverie",
    category: "Cocktail",
    price: "€3,450",
    originalPrice: null,
    tag: "⚡ Rising",
    sold: "98 sold this week",
    img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&q=90&auto=format&fit=crop&crop=top",
    badge: "EDITORS' PICK",
    color: "#0a0a14",
    accent: "#9b8ec4",
  },
  {
    id: 3,
    rank: "03",
    name: "Ivory Phantom",
    category: "Bridal Couture",
    price: "€8,900",
    originalPrice: null,
    tag: "✦ Exclusive",
    sold: "34 made globally",
    img: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=700&q=90&auto=format&fit=crop&crop=top",
    badge: "LIMITED",
    color: "#0f0f0a",
    accent: "#e8dcc8",
  },
  {
    id: 4,
    rank: "04",
    name: "Crimson Séance",
    category: "Statement Piece",
    price: "€4,100",
    originalPrice: "€5,200",
    tag: "🔥 Hot",
    sold: "211 sold this week",
    img: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=700&q=90&auto=format&fit=crop&crop=top",
    badge: "BEST SELLER",
    color: "#140508",
    accent: "#c44b4b",
  },
  {
    id: 5,
    rank: "05",
    name: "Noir Manifesto",
    category: "Power Suiting",
    price: "€5,750",
    originalPrice: null,
    tag: "⚡ Rising",
    sold: "76 sold this week",
    img: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=700&q=90&auto=format&fit=crop&crop=top",
    badge: "NEW ICON",
    color: "#080808",
    accent: "#c9a84c",
  },
  {
    id: 6,
    rank: "06",
    name: "Auroral Silk",
    category: "Resort Wear",
    price: "€2,800",
    originalPrice: "€3,400",
    tag: "✦ Exclusive",
    sold: "55 sold this week",
    img: "https://images.unsplash.com/photo-1566479179817-0b1c6a6f5c9b?w=700&q=90&auto=format&fit=crop&crop=top",
    badge: "TRENDING",
    color: "#0a0a0a",
    accent: "#c9a84c",
  },
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
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* Parallax on scroll */
function useParallax(speed = 0.08) {
  const ref   = useRef(null);
  const yRef  = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - window.innerHeight / 2;
      yRef.current = center * speed;
      ref.current.style.transform = `translateY(${yRef.current}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [speed]);
  return ref;
}

/* ─────────────────────────────────────────────
   PRODUCT CARD
───────────────────────────────────────────── */
function ProductCard({ product, index, visible }) {
  const [hovered, setHovered]   = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const isEven = index % 2 === 0;

  return (
    <Link
      to={`/products/${product.id}`}
      className={`
        ${styles.card}
        ${visible ? styles.cardIn : ""}
        ${isEven ? styles.cardEven : styles.cardOdd}
      `}
      style={{ "--idx": index, "--accent": product.accent }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      draggable={false}
    >
      {/* ── Rank watermark ── */}
      <span className={styles.rankBg}>{product.rank}</span>

      {/* ── Image block ── */}
      <div className={styles.imgBlock}>
        {!imgLoaded && <div className={styles.shimmer} />}
        <img
          src={product.img}
          alt={product.name}
          className={`${styles.img} ${imgLoaded ? styles.imgOn : ""}`}
          onLoad={() => setImgLoaded(true)}
          draggable={false}
          style={{ transform: hovered ? "scale(1.09)" : "scale(1.0)" }}
        />

        {/* Badge top-left */}
        <span className={styles.badge}>{product.badge}</span>

        {/* Tag pill top-right */}
        <span className={styles.tagPill}>{product.tag}</span>

        {/* Hover overlay with rank */}
        <div className={`${styles.overlay} ${hovered ? styles.overlayOn : ""}`}>
          <div className={styles.overlayInner}>
            <span className={styles.overlayRank}>{product.rank}</span>
            <span className={styles.overlayDivider} />
            <span className={styles.overlayLabel}>View Piece</span>
          </div>
        </div>
      </div>

      {/* ── Card body ── */}
      <div className={styles.body}>
        {/* Top row */}
        <div className={styles.topRow}>
          <span className={styles.category}>{product.category}</span>
          <span className={styles.sold}>{product.sold}</span>
        </div>

        {/* Name */}
        <h3 className={styles.name}>{product.name}</h3>

        {/* Price row */}
        <div className={styles.priceRow}>
          <span className={styles.price}>{product.price}</span>
          {product.originalPrice && (
            <span className={styles.originalPrice}>{product.originalPrice}</span>
          )}
          <span className={styles.priceDot}>◆</span>
        </div>

        {/* Hover underline */}
        <div className={`${styles.hoverBar} ${hovered ? styles.hoverBarOn : ""}`} />
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function Trending() {
  const [sectionRef, inView]   = useScrollReveal(0.05);
  const [headerRef, headerIn]  = useScrollReveal(0.2);
  const [gridRef, gridIn]      = useScrollReveal(0.05);
  const bgParallaxRef          = useParallax(0.06);

  /* Scrolling ticker text */
  const TICKER = "TRENDING NOW · MOST WANTED · THIS WEEK'S OBSESSIONS · ";

  return (
    <section className={styles.section} ref={sectionRef}>

      {/* ── Background layer with parallax ── */}
      <div className={styles.bgWrap} ref={bgParallaxRef} aria-hidden="true">
        <div className={styles.bgGrid} />
        <div className={styles.bgGlow1} />
        <div className={styles.bgGlow2} />
        <div className={styles.bgNoise} />
      </div>

      {/* ── Scrolling marquee ticker ── */}
      <div className={`${styles.ticker} ${inView ? styles.tickerIn : ""}`}>
        <div className={styles.tickerTrack}>
          {Array(6).fill(TICKER).map((t, i) => (
            <span key={i} className={styles.tickerItem}>{t}</span>
          ))}
        </div>
      </div>

      {/* ── Section Header ── */}
      <div
        className={`${styles.header} ${headerIn ? styles.headerIn : ""}`}
        ref={headerRef}
      >
        {/* Left — big number accent */}
        <div className={styles.headerAccent}>
          <span className={styles.accentNum}>06</span>
          <span className={styles.accentLabel}>Pieces</span>
        </div>

        {/* Center — title block */}
        <div className={styles.headerCenter}>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowLine} />
            Right Now
            <span className={styles.eyebrowLine} />
          </p>
          <h2 className={styles.title}>
            <span className={styles.titleLine}>What</span>
            <span className={`${styles.titleLine} ${styles.titleLineGold}`}>
              Everyone's
            </span>
            <span className={styles.titleLine}>Wearing</span>
          </h2>
        </div>

        {/* Right — desc */}
        <div className={styles.headerRight}>
          <p className={styles.desc}>
            Curated by our style council. Updated every Monday.
            These are the pieces the world can't stop talking about.
          </p>
          <div className={styles.liveTag}>
            <span className={styles.liveDot} />
            Live Trending Data
          </div>
        </div>
      </div>

      {/* ── PRODUCT GRID ── */}
      <div
        className={`${styles.grid} ${gridIn ? styles.gridIn : ""}`}
        ref={gridRef}
      >
        {PRODUCTS.map((p, i) => (
          <ProductCard
            key={p.id}
            product={p}
            index={i}
            visible={gridIn}
          />
        ))}
      </div>

      {/* ── Bottom ticker (reversed) ── */}
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