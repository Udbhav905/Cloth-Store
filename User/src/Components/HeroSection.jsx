import React, { useState, useEffect } from 'react';
import styles from '../Styles/HeroSection.module.css';
import men from '../assets/mens.jpeg'

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  // const img='../assets/mens.jpeg'
  const slides = [
    {
      id: 1,
      image:men,
      title: 'Autumn Elegance',
      subtitle: 'Discover the new collection',
      description: 'Handcrafted luxury for the modern silhouette',
      buttonText: 'Explore Collection',
      buttonLink: '/collections/autumn',
      accent: 'New Season'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80',
      title: 'Timeless Sophistication',
      subtitle: 'Where art meets fashion',
      description: 'Exclusive pieces for the discerning taste',
      buttonText: 'Shop Now',
      buttonLink: '/collections/timeless',
      accent: 'Limited Edition'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',

      
      title: 'Luxury Redefined',
      subtitle: 'The art of dressing well',
      description: 'Premium fabrics, impeccable craftsmanship',
      buttonText: 'Discover',
      buttonLink: '/collections/luxury',
      accent: 'Exclusive'
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      title: 'Urban Chic',
      subtitle: 'Street style meets luxury',
      description: 'Effortless elegance for the modern world',
      buttonText: 'View Collection',
      buttonLink: '/collections/urban',
      accent: 'Just Arrived'
    }
  ];

  useEffect(() => {
    let interval;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000); // Change slide every 5 seconds
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length]);

  const handleDotClick = (index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 8 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  return (
    <section className={styles.hero}>
      {/* Background Images */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`${styles.slide} ${index === currentSlide ? styles.active : ''}`}
          style={{ backgroundImage: `url(${slide.image})`, backgroundPosition:'top'}}
        >
          {/* Overlay */}
          <div className={styles.overlay}></div>
          
          {/* Content */}
          <div className={styles.content}>
            <div className={styles.contentInner}>
              {/* Accent Badge */}
              <span className={styles.accent}>{slide.accent}</span>
              
              {/* Main Title */}
              <h1 className={styles.title}>{slide.title}</h1>
              
              {/* Subtitle */}
              <h2 className={styles.subtitle}>{slide.subtitle}</h2>
              
              {/* Description */}
              <p className={styles.description}>{slide.description}</p>
              
              {/* Button */}
              <a href={slide.buttonLink} className={styles.button}>
                {slide.buttonText}
                <span className={styles.buttonIcon}>→</span>
              </a>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button 
        className={`${styles.navArrow} ${styles.prevArrow}`} 
        onClick={prevSlide}
        aria-label="Previous slide"
      >
        ←
      </button>
      <button 
        className={`${styles.navArrow} ${styles.nextArrow}`} 
        onClick={nextSlide}
        aria-label="Next slide"
      >
        →
      </button>

      {/* Slide Indicators */}
      <div className={styles.indicators}>
        {slides.map((_, index) => (
          <button
            key={index}
            className={`${styles.indicator} ${index === currentSlide ? styles.activeIndicator : ''}`}
            onClick={() => handleDotClick(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Slide Counter */}
      <div className={styles.counter}>
        <span className={styles.current}>{String(currentSlide + 1).padStart(2, '0')}</span>
        <span className={styles.separator}>/</span>
        <span className={styles.total}>{String(slides.length).padStart(2, '0')}</span>
      </div>

      {/* Scroll Indicator */}
      <div className={styles.scrollIndicator}>
        <span className={styles.scrollText}>Scroll</span>
        <span className={styles.scrollLine}></span>
      </div>
    </section>
  );
};

export default HeroSection;