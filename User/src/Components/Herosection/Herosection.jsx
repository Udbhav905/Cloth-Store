import { useState, useEffect, useRef, useCallback } from "react";
import img1 from "../../assets/men.png";
import img2 from "../../assets/women-cat.jpg";
import img3 from "../../assets/medium-shot-man-posing-outdoors.jpg";
import styles from "./Herosection.module.css";
import { Link } from "react-router-dom";

const SLIDES = [
  {
    id: 0,
    tag: "Spring / Summer 2025",
    title: "Ethereal",
    subtitle: "A symphony of pure elegance and effortless grace. Discover the new collection.",
    cta: "Explore Collection",
    img: img3,
    pos: "center 30%",
  },
  {
    id: 1,
    tag: "High Fashion Archive",
    title: "Midnight",
    subtitle: "Embrace the power of shadows and striking silhouettes that command attention.",
    cta: "Shop The Look",
    img: img2,
    pos: "center 20%",
  },
  {
    id: 2,
    tag: "Modern Heritage",
    title: "Lumina",
    subtitle: "Traditional craftsmanship meets contemporary tailoring. A homage to origins.",
    cta: "Discover Origins",
    img: img1,
    pos: "center 10%",
  },
];

const WAIT = 5000;       // time each slide is visible

export default function Herosection() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  const resetAutoPlay = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, WAIT);
  }, []);

  const goTo = useCallback((idx) => {
    setCurrent(idx);
    resetAutoPlay();
  }, [resetAutoPlay]);

  useEffect(() => {
    SLIDES.forEach((s) => { const i = new Image(); i.src = s.img; });
    resetAutoPlay();
    return () => clearInterval(timerRef.current);
  }, [resetAutoPlay]);

  return (
    <section className={styles.hero}>

      {/* ── Backgrounds ── */}
      <div className={styles.bgContainer}>
        {SLIDES.map((slide, idx) => {
          const isActive = idx === current;
          return (
            <div 
              key={slide.id} 
              className={`${styles.bgLayer} ${isActive ? styles.slideActive : styles.slideHidden}`}
            >
              <div
                className={styles.bgImage}
                style={{
                  backgroundImage: `url(${slide.img})`,
                  backgroundPosition: slide.pos,
                }}
              />
              <div className={styles.overlay} />
            </div>
          );
        })}
      </div>

      {/* ── Content ── */}
      <div className={styles.content}>
        {SLIDES.map((slide, idx) => {
          const isActive = idx === current;
          return (
            <div
              key={`t-${slide.id}`}
              className={`${styles.textWrap} ${isActive ? styles.textActive : styles.textHidden}`}
            >
              <div className={styles.tagWrap}>
                <div className={styles.tagLine} />
                <p className={styles.tag}>{slide.tag}</p>
              </div>

              <h1 className={styles.title}>{slide.title}</h1>

              <div className={styles.subWrap}>
                <p className={styles.subtitle}>{slide.subtitle}</p>
              </div>

              <div className={styles.ctaWrap}>
                <Link to="/collections" className={styles.ctaBtn}>
                  <span className={styles.ctaBg} />
                  <span className={styles.ctaText}>{slide.cta}</span>
                  <svg viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Dots ── */}
      <div className={styles.pagination}>
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            className={`${styles.dot} ${idx === current ? styles.dotActive : ""}`}
            onClick={() => goTo(idx)}
            aria-label={`Slide ${idx + 1}`}
          >
            <div className={styles.dotProgress}>
              <div
                className={styles.dotFill}
                style={{
                  animationDuration: `${WAIT}ms`,
                  animationPlayState: idx === current ? "running" : "paused",
                }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* ── Counter ── */}
      <div className={styles.slideCounter}>
        <span className={styles.counterCurrent}>
          <span className={styles.counterNum}>
            {String(current + 1).padStart(2, "0")}
          </span>
        </span>
        <span className={styles.counterSep}>/</span>
        <span className={styles.counterTotal}>
          {String(SLIDES.length).padStart(2, "0")}
        </span>
      </div>

      <div className={styles.decorLeft} />
      <div className={styles.decorRight} />

      <div className={styles.scrollIndicator}>
        <span>Scroll</span>
        <div className={styles.scrollLine}>
          <div className={styles.scrollDot} />
        </div>
      </div>
    </section>
  );
}