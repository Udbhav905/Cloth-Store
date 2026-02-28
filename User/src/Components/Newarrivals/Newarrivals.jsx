import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import styles from "./NewArrivals.module.css";

/* ─────────────────────────────────────────────
   DATA  (6 real items — duplicated for infinite loop)
───────────────────────────────────────────── */
const BASE_ITEMS = [
  {
    id: 1,
    slug: "/collections/celestine-gown",
    tag: "SS 2025",
    name: "Célestine",
    type: "Evening Gown",
    material: "Silk Organza",
    origin: "Milan",
    price: "€4,850",
    img: "https://images.unsplash.com/photo-1566479179817-0b1c6a6f5c9b?w=800&q=85&auto=format&fit=crop&crop=top",
  },
  {
    id: 2,
    slug: "/collections/aurore-blazer",
    tag: "Resort 2025",
    name: "Aurore",
    type: "Structured Blazer",
    material: "Cashmere Wool",
    origin: "Florence",
    price: "€2,290",
    img: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=85&auto=format&fit=crop",
  },
  {
    id: 3,
    slug: "/collections/lumiere-dress",
    tag: "Limited",
    name: "Lumière",
    type: "Draped Midi Dress",
    material: "Duchess Satin",
    origin: "Paris",
    price: "€3,100",
    img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=85&auto=format&fit=crop&crop=top",
  },
  {
    id: 4,
    slug: "/collections/noir-coat",
    tag: "AW 2025",
    name: "Noir Absolut",
    type: "Maxi Overcoat",
    material: "Double-face Wool",
    origin: "London",
    price: "€5,600",
    img: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=85&auto=format&fit=crop&crop=top",
  },
  {
    id: 5,
    slug: "/collections/soleil-suit",
    tag: "SS 2025",
    name: "Soleil",
    type: "Tailored Suit",
    material: "Linen Blend",
    origin: "Naples",
    price: "€3,850",
    img: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=85&auto=format&fit=crop&crop=top",
  },
  {
    id: 6,
    slug: "/collections/velours-jumpsuit",
    tag: "Limited",
    name: "Velours",
    type: "Silk Jumpsuit",
    material: "Velvet Silk",
    origin: "Lyon",
    price: "€2,750",
    img: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=85&auto=format&fit=crop&crop=top",
  },
];

/* Duplicate so the CSS loop looks seamless */
const ITEMS = [...BASE_ITEMS, ...BASE_ITEMS];

/* ─────────────────────────────────────────────
   INTERSECTION HOOK
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   SINGLE CARD
───────────────────────────────────────────── */
function Card({ item, onPause, onResume }) {
  const [hovered, setHovered] = useState(false);
  const [loaded,  setLoaded]  = useState(false);

  const enter = () => { setHovered(true);  onPause();  };
  const leave = () => { setHovered(false); onResume(); };

  return (
    <Link
      to={item.slug}
      className={`${styles.card} ${hovered ? styles.cardHovered : ""}`}
      onMouseEnter={enter}
      onMouseLeave={leave}
      onFocus={enter}
      onBlur={leave}
      aria-label={`${item.name} — ${item.type}`}
      draggable={false}
    >
      {/* ── Image ── */}
      <div className={styles.imgWrap}>
        {!loaded && <div className={styles.shimmer} />}
        <img
          src={item.img}
          alt={item.name}
          className={`${styles.img} ${loaded ? styles.imgLoaded : ""}`}
          onLoad={() => setLoaded(true)}
          draggable={false}
        />

        {/* Hover reveal */}
        <div className={styles.reveal}>
          <span className={styles.revealLine} />
          <span className={styles.revealText}>Discover</span>
          <span className={styles.revealLine} />
        </div>

        {/* Tag */}
        <span className={styles.tag}>{item.tag}</span>
      </div>

      {/* ── Info ── */}
      <div className={styles.info}>
        <div className={styles.meta}>
          <span>{item.type}</span>
          <span className={styles.dot}>·</span>
          <span>{item.material}</span>
        </div>
        <div className={styles.nameRow}>
          <h3 className={styles.name}>{item.name}</h3>
          <span className={styles.price}>{item.price}</span>
        </div>
        <div className={styles.origin}>
          <span className={styles.diamond}>◆</span>
          {item.origin}
        </div>
        <div className={`${styles.underline} ${hovered ? styles.underlineOn : ""}`} />
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────
   MAIN — auto-scroll via requestAnimationFrame
   Pause on hover, resume smoothly on leave
───────────────────────────────────────────── */
export default function NewArrivals() {
  const [sectionRef, inView] = useInView(0.05);

  /* rAF-based scroll state */
  const trackRef   = useRef(null);
  const offsetRef  = useRef(0);       // current translateX (negative = moved left)
  const pausedRef  = useRef(true);    // start paused until inView
  const rafRef     = useRef(null);
  const SPEED      = 0.55;            // px per frame (~33px/s at 60fps)

  /* Total width of ONE set of cards (calculated after mount) */
  const halfWidthRef = useRef(0);

  useEffect(() => {
    if (!inView) return;

    /* Measure once after DOM is ready */
    const measure = () => {
      if (!trackRef.current) return;
      /* The track contains ITEMS.length cards; half is BASE_ITEMS.length */
      halfWidthRef.current = trackRef.current.scrollWidth / 2;
    };
    measure();
    window.addEventListener("resize", measure, { passive: true });

    pausedRef.current = false;

    const tick = () => {
      if (!pausedRef.current && trackRef.current && halfWidthRef.current > 0) {
        offsetRef.current -= SPEED;
        /* When we've scrolled exactly one full set, snap back seamlessly */
        if (Math.abs(offsetRef.current) >= halfWidthRef.current) {
          offsetRef.current = 0;
        }
        trackRef.current.style.transform = `translateX(${offsetRef.current}px)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", measure);
    };
  }, [inView]);

  const pause  = () => { pausedRef.current = true; };
  const resume = () => { pausedRef.current = false; };

  return (
    <section className={styles.section} ref={sectionRef}>

      {/* ── Header ── */}
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
            <span className={styles.pill}><span className={styles.pillDot}>◆</span> 6 New Pieces</span>
            <span className={styles.pillDiv} />
            <span className={styles.pill}>SS 2025</span>
          </div>
        </div>
      </div>

      {/* ── Infinite auto-scroll track ── */}
      <div className={styles.viewport}>
        {/* Left + right edge fades */}
        <div className={`${styles.fade} ${styles.fadeL}`} />
        <div className={`${styles.fade} ${styles.fadeR}`} />

        <div ref={trackRef} className={styles.track}>
          {ITEMS.map((item, i) => (
            <Card
              key={`${item.id}-${i}`}
              item={item}
              onPause={pause}
              onResume={resume}
            />
          ))}
        </div>
      </div>

      {/* ── Bottom ornament ── */}
      <div className={`${styles.rule} ${inView ? styles.ruleIn : ""}`}>
        <span className={styles.ruleLine} />
        <span className={styles.ruleDiamond}>◆</span>
        <span className={styles.ruleLine} />
      </div>

    </section>
  );
}