import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import styles from "./ShopByCategory.module.css";

/* ─────────────────────────────────────────────
   CATEGORY DATA
───────────────────────────────────────────── */
const CATEGORIES = [
  {
    id: 1,
    slug: "evening-gowns",
    label: "Evening",
    sublabel: "Gowns",
    count: "48 Pieces",
    desc: "Where silk meets starlight",
    img: "https://images.unsplash.com/photo-1566479179817-0b1c6a6f5c9b?w=900&q=88&auto=format&fit=crop&crop=top",
    size: "tall",      // tall card — spans 2 rows
    accent: "#c9a84c",
  },
  {
    id: 2,
    slug: "tailored-suits",
    label: "Tailored",
    sublabel: "Suiting",
    count: "34 Pieces",
    desc: "Power dressed in silence",
    img: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&q=88&auto=format&fit=crop",
    size: "wide",      // wide card — spans 2 cols
    accent: "#d4cfc8",
  },
  {
    id: 3,
    slug: "resort-wear",
    label: "Resort",
    sublabel: "Wear",
    count: "62 Pieces",
    desc: "Effortless sun-drenched luxury",
    img: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900&q=88&auto=format&fit=crop&crop=top",
    size: "normal",
    accent: "#c9a84c",
  },
  {
    id: 4,
    slug: "bridal-couture",
    label: "Bridal",
    sublabel: "Couture",
    count: "21 Pieces",
    desc: "Once-in-a-lifetime perfection",
    img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&q=88&auto=format&fit=crop&crop=top",
    size: "normal",
    accent: "#e8dcc8",
  },
  {
    id: 5,
    slug: "cashmere-knits",
    label: "Cashmere",
    sublabel: "Knits",
    count: "29 Pieces",
    desc: "Second-skin softness",
    img: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&q=88&auto=format&fit=crop&crop=top",
    size: "tall",
    accent: "#c9a84c",
  },
  {
    id: 6,
    slug: "accessories",
    label: "Rare",
    sublabel: "Accessories",
    count: "57 Pieces",
    desc: "The final punctuation",
    img: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=900&q=88&auto=format&fit=crop&crop=top",
    size: "wide",
    accent: "#b8a898",
  },
];

/* ─────────────────────────────────────────────
   INTERSECTION HOOK
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
   SINGLE CATEGORY CARD
───────────────────────────────────────────── */
function CategoryCard({ cat, index, visible }) {
  const [hovered, setHovered] = useState(false);
  const [loaded,  setLoaded]  = useState(false);

  return (
    <Link
      to={`/collections/${cat.slug}`}
      className={`
        ${styles.card}
        ${styles[`card--${cat.size}`]}
        ${visible ? styles.cardVisible : ""}
      `}
      style={{ "--idx": index, "--accent": cat.accent }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      draggable={false}
    >
      {/* ── Background image ── */}
      <div className={styles.imgWrap}>
        {!loaded && <div className={styles.skeleton} />}
        <img
          src={cat.img}
          alt={`${cat.label} ${cat.sublabel}`}
          className={`${styles.img} ${loaded ? styles.imgLoaded : ""}`}
          onLoad={() => setLoaded(true)}
          style={{
            transform: hovered ? "scale(1.08)" : "scale(1.0)",
          }}
          draggable={false}
          loading={index < 3 ? "eager" : "lazy"}
        />

        {/* Multi-layer dark overlay */}
        <div className={styles.overlay} />
        {/* Extra dark at bottom for text legibility */}
        <div className={styles.overlayBottom} />
      </div>

      {/* ── Count badge ── */}
      <span className={`${styles.countBadge} ${hovered ? styles.countBadgeHovered : ""}`}>
        {cat.count}
      </span>

      {/* ── Explore ring (appears on hover) ── */}
      <div className={`${styles.exploreRing} ${hovered ? styles.exploreRingVisible : ""}`}>
        <svg viewBox="0 0 100 100" className={styles.ringText}>
          <defs>
            <path id={`circle-${cat.id}`} d="M 50,50 m -35,0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" />
          </defs>
          <text className={styles.ringTextEl}>
            <textPath href={`#circle-${cat.id}`} startOffset="0%">
              EXPLORE · SHOP NOW · DISCOVER ·&nbsp;
            </textPath>
          </text>
        </svg>
        <div className={styles.ringArrow}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
      </div>

      {/* ── Text content ── */}
      <div className={`${styles.content} ${hovered ? styles.contentHovered : ""}`}>
        <p className={styles.desc}>{cat.desc}</p>
        <div className={styles.labelWrap}>
          <h3 className={styles.label}>
            <span className={styles.labelTop}>{cat.label}</span>
            <span className={styles.labelBottom}>{cat.sublabel}</span>
          </h3>
          {/* Animated arrow on hover */}
          <span className={`${styles.arrow} ${hovered ? styles.arrowVisible : ""}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </div>
        {/* Gold reveal line */}
        <span className={`${styles.revealLine} ${hovered ? styles.revealLineOn : ""}`} />
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function ShopByCategory() {
  const [sectionRef, inView] = useInView(0.08);
  const [headerRef, headerIn] = useInView(0.2);

  return (
    <section className={styles.section} ref={sectionRef}>

      {/* ── Ambient background ── */}
      <div className={styles.ambientBg} aria-hidden="true">
        <div className={styles.ambientGlow1} />
        <div className={styles.ambientGlow2} />
        <div className={styles.ambientGrid} />
      </div>

      {/* ── Section header ── */}
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
            Six worlds of distinction. Each one a doorway into
            a different dimension of the LUXURIA experience.
          </p>
          <div className={styles.headerStats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>251+</span>
              <span className={styles.statLabel}>Unique Pieces</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>6</span>
              <span className={styles.statLabel}>Categories</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>SS25</span>
              <span className={styles.statLabel}>Season</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Asymmetric category grid ── */}
      <div className={styles.grid}>
        {CATEGORIES.map((cat, i) => (
          <CategoryCard
            key={cat.id}
            cat={cat}
            index={i}
            visible={inView}
          />
        ))}
      </div>

      {/* ── Bottom ornamental rule ── */}
      <div className={`${styles.rule} ${inView ? styles.ruleVisible : ""}`}>
        <span className={styles.ruleLine} />
        <span className={styles.ruleDiamond}>◆</span>
        <span className={styles.ruleLine} />
      </div>

    </section>
  );
}