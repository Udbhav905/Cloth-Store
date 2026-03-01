import { useState, useEffect, useRef, useCallback } from "react";
import img1 from '../../assets/confident-young-handsome-man-holds-his-coat-shoulder-near-lake-autumn-forest.jpg'
import img2 from '../../assets/women.jpg'
import img3 from '../../assets/medium-shot-man-posing-outdoors.jpg'
import styles from "./HeroSection.module.css";

/* ─────────────────────────────────────────────
   SLIDE DATA
───────────────────────────────────────────── */
const SLIDES = [
  {
    id: 0,
    tag: "New Arrival · SS 2025",
    lines: ["The Art of", "Effortless", "Elegance"],
    italic: 1,
    sub: "Handcrafted in Milan. Worn by the discerning few.",
    cta: "Explore Collection",
    img: img3,
    pos: "60% center",
  },
  {
    id: 1,
    tag: "Couture · Limited Edition",
    lines: ["Dressed in", "Silence &", "Power"],
    italic: 2,
    sub: "Where restraint becomes the most seductive statement.",
    cta: "View Couture",
    img: img2,
    pos: "50% 30%",
  },
  {
    id: 2,
    tag: "Heritage · Archive",
    lines: ["Woven From", "A Century", "Of Craft"],
    italic: 1,
    sub: "Every thread tells the story of generations of mastery.",
    cta: "Our Heritage",
    img: img1,
    pos: "40% center",
  },
];

const DURATION = 5000; // ms per slide

/* ─────────────────────────────────────────────
   PARTICLES  (memoised — never re-creates)
───────────────────────────────────────────── */
const PARTICLE_DATA = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: 20 + Math.random() * 70,
  size: Math.random() * 2.2 + 0.6,
  dur: Math.random() * 12 + 9,
  delay: Math.random() * 8,
  drift: (Math.random() - 0.5) * 50,
}));

function Particles() {
  return (
    <div className={styles.particles} aria-hidden="true">
      {PARTICLE_DATA.map((p) => (
        <span
          key={p.id}
          className={styles.particle}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            "--drift": `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   HERO
───────────────────────────────────────────── */
export default function HeroSection() {
  const [current, setCurrent]   = useState(0);
  const [animKey, setAnimKey]   = useState(0);   // forces re-mount of text on slide change
  const [exiting, setExiting]   = useState(-1);  // index of slide currently fading out
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded]     = useState(false);
  const [mouse, setMouse]       = useState({ x: 0.5, y: 0.5 });

  const currentRef   = useRef(0);
  const timerRef     = useRef(null);
  const progressRef  = useRef(null);
  const heroRef      = useRef(null);
  const tickCountRef = useRef(0);

  /* Entrance fade */
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  /* Mouse parallax — only on non-touch */
  useEffect(() => {
    const onMove = (e) => {
      if (!heroRef.current) return;
      const { left, top, width, height } = heroRef.current.getBoundingClientRect();
      setMouse({
        x: Math.max(0, Math.min(1, (e.clientX - left) / width)),
        y: Math.max(0, Math.min(1, (e.clientY - top) / height)),
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  /* ── Auto-advance (fixed: uses ref, not stale closure) ── */
  const advance = useCallback(() => {
    const next = (currentRef.current + 1) % SLIDES.length;
    setExiting(currentRef.current);
    currentRef.current = next;
    setCurrent(next);
    setAnimKey((k) => k + 1);
    setTimeout(() => setExiting(-1), 900);
  }, []);

  const resetProgress = useCallback(() => {
    clearInterval(progressRef.current);
    clearTimeout(timerRef.current);
    setProgress(0);
    tickCountRef.current = 0;

    const TICKS  = DURATION / 50;           // tick every 50ms
    progressRef.current = setInterval(() => {
      tickCountRef.current += 1;
      setProgress((tickCountRef.current / TICKS) * 100);
    }, 50);

    timerRef.current = setTimeout(() => {
      clearInterval(progressRef.current);
      advance();
    }, DURATION);
  }, [advance]);

  /* Start timer on mount and whenever slide changes */
  useEffect(() => {
    resetProgress();
    return () => {
      clearInterval(progressRef.current);
      clearTimeout(timerRef.current);
    };
  }, [current]); // eslint-disable-line

  /* Manual navigation */
  const goTo = useCallback((idx) => {
    if (idx === currentRef.current) return;
    setExiting(currentRef.current);
    currentRef.current = idx;
    setCurrent(idx);
    setAnimKey((k) => k + 1);
    setTimeout(() => setExiting(-1), 900);
  }, []);

  const slide = SLIDES[current];
  const px    = (mouse.x - 0.5) * 22;
  const py    = (mouse.y - 0.5) * 14;

  return (
    <section
      className={`${styles.hero} ${loaded ? styles.heroLoaded : ""}`}
      ref={heroRef}
    >
      {/* ══ BACKGROUNDS ══ */}
      <div className={styles.bgStack}>
        {SLIDES.map((s, i) => (
          <div
            key={s.id}
            className={`${styles.bgLayer}
              ${i === current  ? styles.bgActive  : ""}
              ${i === exiting  ? styles.bgExiting : ""}
              ${i !== current && i !== exiting ? styles.bgHidden : ""}
            `}
          >
            <img
              src={s.img}
              alt=""
              loading={i === 0 ? "eager" : "lazy"}
              style={{
                objectPosition: s.pos,
                transform:
                  i === current
                    ? `translate(${px * 0.35}px, ${py * 0.35}px) scale(1.07)`
                    : "scale(1.07)",
                transition: "transform 0.12s linear",
              }}
            />
            <div className={styles.imgOverlay} />
          </div>
        ))}
        {/* Deep vignette always on top */}
        <div className={styles.vignette} />
      </div>

      {/* ══ GRAIN ══ */}
      <div className={styles.grain} aria-hidden="true" />

      {/* ══ PARTICLES ══ */}
      <Particles />

      {/* ══ DECO FRAME ══ */}
      <div className={styles.decoFrame} aria-hidden="true">
        <div className={styles.decoTL} />
        <div className={styles.decoTR} />
        <div className={styles.decoBL} />
        <div className={styles.decoBR} />
        <div className={styles.decoLineLeft} />
      </div>

      {/* ══ MAIN CONTENT ══ */}
      <div className={styles.content}>
        {/* Tag */}
        <p className={styles.tag} key={`tag-${animKey}`}>
          <span className={styles.tagPulse} />
          {slide.tag}
        </p>

        {/* Headline */}
        <h1 className={styles.headline} key={`h-${animKey}`}>
          {slide.lines.map((line, i) => (
            <span
              key={i}
              className={styles.hLine}
              style={{ "--d": `${0.1 + i * 0.14}s` }}
            >
              {i === slide.italic ? <em>{line}</em> : line}
            </span>
          ))}
        </h1>

        {/* Subtext */}
        <p className={styles.sub} key={`sub-${animKey}`}>{slide.sub}</p>

        {/* CTAs */}
        <div className={styles.ctaRow} key={`cta-${animKey}`}>
          <a href="#" className={styles.btnPrimary}>
            <span>{slide.cta}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
          <a href="#" className={styles.btnGhost}>
            <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2">
              <circle cx="20" cy="20" r="18" />
              <polygon points="16,13 30,20 16,27" fill="currentColor" stroke="none" />
            </svg>
            Watch Film
          </a>
        </div>

        {/* Scroll indicator */}
        <div className={styles.scrollCue}>
          <span className={styles.scrollBar} />
          <span className={styles.scrollText}>Scroll</span>
        </div>
      </div>

      {/* ══ SIDE STATS (desktop only) ══ */}
      <aside className={styles.sideStats}>
        {[
          { num: "XII", label: "Collections" },
          { num: "48", label: "Countries" },
          { num: "∞", label: "Craftsmanship" },
        ].map((s, i) => (
          <div key={i} className={styles.statBlock}>
            <span className={styles.statNum}>{s.num}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </aside>

      {/* ══ SLIDE CONTROLS ══ */}
      <nav className={styles.controls} aria-label="Slide navigation">
        <button
          className={styles.arrow}
          onClick={() => goTo((current - 1 + SLIDES.length) % SLIDES.length)}
          aria-label="Previous slide"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>

        <div className={styles.indicators}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`${styles.indicator} ${i === current ? styles.indicatorActive : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
            >
              <span
                className={styles.indicatorFill}
                style={i === current ? { width: `${progress}%` } : { width: i < current ? "100%" : "0%" }}
              />
            </button>
          ))}
        </div>

        <button
          className={styles.arrow}
          onClick={() => goTo((current + 1) % SLIDES.length)}
          aria-label="Next slide"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>

        <span className={styles.counter}>
          <b>{String(current + 1).padStart(2, "0")}</b>
          <span> / {String(SLIDES.length).padStart(2, "0")}</span>
        </span>
      </nav>

      {/* ══ BOTTOM PERKS STRIP ══ */}
      <div className={styles.perksStrip}>
        {["Free Global Shipping", "Handcrafted in India", "Carbon Neutral 2026", "Made By U & M"].map((t, i) => (
          <div key={i} className={styles.perk}>
            <span className={styles.perkDot}>◆</span>
            {t}
          </div>
        ))}
      </div>
    </section>
  );
}