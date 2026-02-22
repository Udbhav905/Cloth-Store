import React, { useEffect, useState } from 'react';
import styles from '../Styles/SplashScreen.module.css';

const SplashScreen = ({ onFinish }) => {
  const [animationStage, setAnimationStage] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Animation sequence
    const stage1 = setTimeout(() => setAnimationStage(1), 500);
    const stage2 = setTimeout(() => setAnimationStage(2), 1500);
    const stage3 = setTimeout(() => setAnimationStage(3), 2500);
    const stage4 = setTimeout(() => setAnimationStage(4), 3200);
    
    // Simulate data fetching and finish splash screen
    const finishTimeout = setTimeout(() => {
      setIsVisible(false);
      if (onFinish) onFinish();
    }, 6000);

    return () => {
      clearTimeout(stage1);
      clearTimeout(stage2);
      clearTimeout(stage3);
      clearTimeout(stage4);
      clearTimeout(finishTimeout);
    };
  }, [onFinish]);

  if (!isVisible) return null;

  return (
    <div className={styles.splashContainer}>
      {/* Animated Background */}
      <div className={styles.background}>
        <div className={styles.gradientOrb}></div>
        <div className={styles.gradientOrb2}></div>
        <div className={styles.particleContainer}>
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className={styles.particle}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Luxury Badge */}
        <div className={`${styles.badge} ${animationStage >= 1 ? styles.badgeVisible : ''}`}>
          <span className={styles.badgeText}>EST. 2024</span>
        </div>

        {/* Main Logo/Name */}
        <div className={styles.logoContainer}>
          <h1 className={styles.logo}>
            <span className={`${styles.logoChar} ${animationStage >= 1 ? styles.charVisible : ''}`}>L</span>
            <span className={`${styles.logoChar} ${animationStage >= 1 ? styles.charVisible : ''}`}>U</span>
            <span className={`${styles.logoChar} ${animationStage >= 1 ? styles.charVisible : ''}`}>X</span>
            <span className={`${styles.logoChar} ${animationStage >= 1 ? styles.charVisible : ''}`}>U</span>
            <span className={`${styles.logoChar} ${animationStage >= 1 ? styles.charVisible : ''}`}>R</span>
            <span className={`${styles.logoChar} ${animationStage >= 1 ? styles.charVisible : ''}`}>I</span>
            <span className={`${styles.logoChar} ${animationStage >= 1 ? styles.charVisible : ''}`}>A</span>
          </h1>

          {/* Underline Animation */}
          <div className={`${styles.underline} ${animationStage >= 2 ? styles.underlineAnimate : ''}`}>
            <div className={styles.underlineInner}></div>
          </div>

          {/* Tagline */}
          <p className={`${styles.tagline} ${animationStage >= 2 ? styles.taglineVisible : ''}`}>
            Where Luxury Meets Elegance
          </p>
        </div>

        {/* Loading Indicator */}
        <div className={`${styles.loadingContainer} ${animationStage >= 3 ? styles.loadingVisible : ''}`}>
          {/* Animated Circles */}
          <div className={styles.loadingCircles}>
            <div className={styles.circle}></div>
            <div className={styles.circle}></div>
            <div className={styles.circle}></div>
            <div className={styles.circle}></div>
          </div>

          {/* Loading Text */}
          <p className={styles.loadingText}>
            <span>C</span>
            <span>U</span>
            <span>R</span>
            <span>A</span>
            <span>T</span>
            <span>I</span>
            <span>N</span>
            <span>G</span>
            <span>&nbsp;</span>
            <span>L</span>
            <span>U</span>
            <span>X</span>
            <span>U</span>
            <span>R</span>
            <span>Y</span>
          </p>

          {/* Progress Bar */}
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: animationStage >= 4 ? '100%' : `${(animationStage / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className={styles.decorativeLines}>
          <div className={`${styles.line} ${styles.lineLeft}`}></div>
          <div className={`${styles.line} ${styles.lineRight}`}></div>
        </div>

        {/* Fashion Icons Animation */}
        {/* <div className={`${styles.fashionIcons} ${animationStage >= 2 ? styles.iconsVisible : ''}`}>
          <div className={styles.icon} style={{ animationDelay: '0s' }}>👔</div>
          <div className={styles.icon} style={{ animationDelay: '0.5s' }}>👗</div>
          <div className={styles.icon} style={{ animationDelay: '1s' }}>👠</div>
          <div className={styles.icon} style={{ animationDelay: '1.5s' }}>💎</div>
          <div className={styles.icon} style={{ animationDelay: '2s' }}>👛</div>
          <div className={styles.icon} style={{ animationDelay: '2.5s' }}>⌚</div>
        </div> */}
      </div>

      {/* Footer */}
      <div className={`${styles.footer} ${animationStage >= 3 ? styles.footerVisible : ''}`}>
        <p className={styles.footerText}>Premium Collection • Since 2024</p>
      </div>
    </div>
  );
};

export default SplashScreen;