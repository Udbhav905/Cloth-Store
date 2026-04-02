import { useState, useEffect, useRef, useCallback } from "react";
import img1 from '../../assets/men.png';
import img2 from '../../assets/women.jpg';
import img3 from '../../assets/medium-shot-man-posing-outdoors.jpg';
import styles from "./Herosection.module.css";
import { Link } from "react-router-dom";

const SLIDES = [
  {
    id: 0,
    tag: "Spring / Summer 2025",
    title: "Ethereal",
    subtitle: "A symphony of pure elegance and effortless grace. Discover the new collection that brings harmony back to modern fashion.",
    cta: "Explore Collection",
    img: img3,
    pos: "center 30%",
  },
  {
    id: 1,
    tag: "High Fashion Archive",
    title: "Midnight",
    subtitle: "Embrace the power of shadows and striking silhouettes. Pieces that command attention when the sun goes down.",
    cta: "Shop The Look",
    img: img2,
    pos: "center 20%",
  },
  {
    id: 2,
    tag: "Modern Heritage",
    title: "Lumina",
    subtitle: "Woven narratives meeting contemporary tailoring. A homage to traditional craftsmanship infused with tomorrow's vision.",
    cta: "Discover Origins",
    img: img1,
    pos: "center 10%",
  },
];

const DURATION = 6000;

export default function Herosection() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const timerRef = useRef(null);
  const heroRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const changeSlide = useCallback((nextIdx) => {
    if (isTransitioning || nextIdx === current) return;
    setIsTransitioning(true);
    setPrev(current);
    setCurrent(nextIdx);
    
    // Reset timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
        changeSlide((nextIdx + 1) % SLIDES.length);
    }, DURATION);

    setTimeout(() => {
      setIsTransitioning(false);
      setPrev(null);
    }, 1400); // duration of slide transition
  }, [current, isTransitioning]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
        changeSlide((current + 1) % SLIDES.length);
    }, DURATION);
    return () => clearInterval(timerRef.current);
  }, [changeSlide, current]);

  const handleMouseMove = (e) => {
    if (!heroRef.current) return;
    const { width, height, left, top } = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    setMousePos({ x, y });
  };

  const SplitText = ({ text, delayOffset = 0 }) => {
    return (
      <span className={styles.splitText}>
        {text.split("").map((char, i) => (
          <span 
            key={i} 
            className={styles.charWrapper}
          >
            <span 
                className={styles.char}
                style={{ animationDelay: `${delayOffset + i * 0.03}s` }}
            >
                {char === " " ? "\u00A0" : char}
            </span>
          </span>
        ))}
      </span>
    );
  };

  return (
    <section 
      className={styles.hero} 
      ref={heroRef}
      onMouseMove={handleMouseMove}
    >
        {/* Backgrounds */}
        <div className={styles.bgContainer}>
            {SLIDES.map((slide, idx) => {
                const isActive = idx === current;
                const isPrev = idx === prev;
                let stateClass = "";
                if (isActive) stateClass = styles.slideActive;
                else if (isPrev) stateClass = styles.slidePrev;
                else stateClass = styles.slideHidden;

                return (
                    <div key={slide.id} className={`${styles.bgLayer} ${stateClass}`}>
                        <div 
                            className={styles.bgImage} 
                            style={{ 
                                backgroundImage: `url(${slide.img})`,
                                backgroundPosition: slide.pos,
                                transform: isActive 
                                    ? `scale(1.05) translate(${mousePos.x * 15}px, ${mousePos.y * 15}px)` 
                                    : `scale(1.15) translate(0,0)`
                            }} 
                        />
                        <div className={styles.overlay} />
                    </div>
                )
            })}
        </div>

        {/* Content */}
        <div className={styles.content}>
            {SLIDES.map((slide, idx) => {
                const isActive = idx === current;
                const isPrev = idx === prev;
                if (!isActive && !isPrev) return null;
                
                return (
                    <div key={`content-${slide.id}`} className={`${styles.textWrap} ${isActive ? styles.textActive : styles.textPrev}`}>
                        <div className={styles.tagWrap}>
                            <div className={styles.tagLine} />
                            <p className={styles.tag}><SplitText text={slide.tag} delayOffset={0.2} /></p>
                        </div>
                        
                        <h1 className={styles.title}>
                            <SplitText text={slide.title} delayOffset={0.4} />
                        </h1>
                        
                        <div className={styles.subWrap}>
                            <p className={styles.subtitle}>{slide.subtitle}</p>
                        </div>
                        
                        <div className={styles.ctaWrap}>
                            <Link to="/collections" className={styles.ctaBtn}>
                                <span className={styles.ctaBg}></span>
                                <span className={styles.ctaText}>{slide.cta}</span>
                                <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
                            </Link>
                        </div>
                    </div>
                )
            })}
        </div>

        {/* Slide Progress Controls */}
        <div className={styles.pagination}>
            {SLIDES.map((_, idx) => (
                <button 
                    key={idx}
                    className={`${styles.dot} ${idx === current ? styles.dotActive : ""}`}
                    onClick={() => changeSlide(idx)}
                    aria-label={`Slide ${idx + 1}`}
                >
                    <div className={styles.dotProgress}>
                        <div className={styles.dotFill} style={{
                            animationDuration: `${DURATION}ms`,
                            animationPlayState: idx === current && !isTransitioning ? 'running' : 'paused'
                        }} />
                    </div>
                </button>
            ))}
        </div>
        
        {/* Decor */}
        <div className={styles.decorLeft} />
        <div className={styles.decorRight} />
        
        {/* Scroll Indicator */}
        <div className={styles.scrollIndicator}>
            <span>Scroll</span>
            <div className={styles.scrollLine}>
                <div className={styles.scrollDot} />
            </div>
        </div>
    </section>
  );
}