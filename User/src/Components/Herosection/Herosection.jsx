import { useState, useEffect, useRef, useCallback } from "react";
import img1 from '../../assets/men.png'
import img2 from '../../assets/women.jpg'
import img3 from '../../assets/medium-shot-man-posing-outdoors.jpg'
import styles from "./HeroSection.module.css";

const SLIDES = [
  {
    id: 0,
    eyebrow: "New Arrival · SS 2025",
    bigWord: "ELEGANCE",
    sub: "EFFORTLESS",
    desc: "The boldest edition we ever made. Wide collar, clean stitching, shipping globally. Bold layers, straight stacks.",
    cta: "Shop Now",
    img: img3,
    cards: [img1, img2, img3],
    labels: ["Navy Trek", "Daily Hak", "Navy Trek"],
    tag: "Earn 3.1",
  },
  {
    id: 1,
    eyebrow: "Couture · Limited Edition",
    bigWord: "SILENCE",
    sub: "DRESSED IN",
    desc: "Where restraint becomes the most seductive statement. Limited drops, global reach.",
    cta: "View Couture",
    img: img2,
    cards: [img2, img3, img1],
    labels: ["Noir Cut", "Archive 1", "Silhouette"],
    tag: "Earn 2.4",
  },
  {
    id: 2,
    eyebrow: "Heritage · Archive",
    bigWord: "CENTURY",
    sub: "WOVEN FROM A",
    desc: "Every thread tells the story of generations of mastery. Archive pieces, timeless craft.",
    cta: "Our Heritage",
    img: img1,
    cards: [img3, img1, img2],
    labels: ["Heritage", "Craft Co.", "Archive"],
    tag: "Earn 1.9",
  },
];

const DURATION = 6000;

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const currentRef  = useRef(0);
  const timerRef    = useRef(null);
  const progressRef = useRef(null);
  const tickRef     = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 60);
    return () => clearTimeout(t);
  }, []);

  const advance = useCallback(() => {
    const next = (currentRef.current + 1) % SLIDES.length;
    currentRef.current = next;
    setCurrent(next);
    setAnimKey(k => k + 1);
  }, []);

  const resetProgress = useCallback(() => {
    clearInterval(progressRef.current);
    clearTimeout(timerRef.current);
    setProgress(0);
    tickRef.current = 0;
    const TICKS = DURATION / 50;
    progressRef.current = setInterval(() => {
      tickRef.current += 1;
      setProgress((tickRef.current / TICKS) * 100);
    }, 50);
    timerRef.current = setTimeout(() => {
      clearInterval(progressRef.current);
      advance();
    }, DURATION);
  }, [advance]);

  useEffect(() => {
    resetProgress();
    return () => { clearInterval(progressRef.current); clearTimeout(timerRef.current); };
  }, [current]); // eslint-disable-line

  const goTo = useCallback((idx) => {
    if (idx === currentRef.current) return;
    currentRef.current = idx;
    setCurrent(idx);
    setAnimKey(k => k + 1);
  }, []);

  const slide = SLIDES[current];

  return (
    <section className={`${styles.hero} ${loaded ? styles.loaded : ""}`}>

      {/* TOP UTILITY STRIP */}
      <div className={styles.topStrip}>
        <div className={styles.topLinks}>
          <span>Lumine</span><span className={styles.dot}>·</span>
          <span>Tisre</span><span className={styles.dot}>·</span>
          <span>Drafts</span><span className={styles.dot}>·</span>
          <span>Flayp</span>
        </div>
        <div className={styles.topCenter}>For Disturbing Pushing carefully</div>
        <div className={styles.topRight}>DrtY &nbsp; ✦ &nbsp; ⊕</div>
      </div>

      {/* NAVBAR */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>STRETKAT</div>
        <div className={styles.navLinks}>
          {["Home", "Store", "Storylets", "Money", "Apd", "Est", "Blog"].map(l => (
            <a key={l} href="#">{l}</a>
          ))}
        </div>
        <div className={styles.navIcons}>
          <button aria-label="search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/>
            </svg>
          </button>
          <button aria-label="menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* MAIN HERO CONTENT */}
      <div className={styles.mainPanel} key={`panel-${animKey}`}>

        {/* GIANT BACKGROUND TEXT */}
        <div className={styles.bgTextBlock} aria-hidden="true">
          <span className={styles.bgSub}>{slide.sub}</span>
          <span className={styles.bgBig}>{slide.bigWord}</span>
        </div>

        {/* HERO MODEL */}
        <div className={styles.modelWrap}>
          <img src={slide.img} alt="model" className={styles.modelImg} />
        </div>

        {/* CTA PILL */}
        <div className={styles.ctaWrap}>
          <button className={styles.ctaBtn}>
            <span className={styles.ctaBtnDot} />
            {slide.cta}
          </button>
        </div>

        {/* PRODUCT CARDS */}
        <div className={styles.cardStrip}>
          {slide.cards.map((src, i) => (
            <div key={i} className={styles.productCard}>
              <div className={styles.productImgWrap}>
                <img src={src} alt={slide.labels[i]} />
              </div>
              <div className={styles.productInfo}>
                <span className={styles.productName}>{slide.labels[i]}</span>
                <span className={styles.productTag}>{slide.tag.replace(/\d+\.\d+/, (n) => (parseFloat(n) + i * 0.1).toFixed(1))}</span>
              </div>
            </div>
          ))}
        </div>

        {/* DESCRIPTION */}
        <p className={styles.desc}>{slide.desc}</p>

      </div>

      {/* SLIDE DOTS + COUNTER */}
      <div className={styles.sliderControls}>
        <button
          className={styles.arrowBtn}
          onClick={() => goTo((current - 1 + SLIDES.length) % SLIDES.length)}
          aria-label="Prev"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>

        <div className={styles.pips}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`${styles.pip} ${i === current ? styles.pipActive : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
            >
              <span
                className={styles.pipFill}
                style={{ width: i === current ? `${progress}%` : i < current ? "100%" : "0%" }}
              />
            </button>
          ))}
        </div>

        <button
          className={styles.arrowBtn}
          onClick={() => goTo((current + 1) % SLIDES.length)}
          aria-label="Next"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>

        <span className={styles.counter}>
          <b>{String(current + 1).padStart(2, "0")}</b>
          <span> / {String(SLIDES.length).padStart(2, "0")}</span>
        </span>
      </div>

    </section>
  );
}