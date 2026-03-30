import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import men from "../../assets/confident-young-handsome-man-holds-his-coat-shoulder-near-lake-autumn-forest.jpg"
import styles from "./CategoryShowcase.module.css";

// High-quality optimized images (using Unsplash CDN with specific dimensions for low file size)
const categoryImages = {
  men: {
    url: men,
    fallback:men,
    label: "Men",
    description: "Discover the latest collection",
    slug: "men"
  },
  women: {
    url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&h=1000&fit=crop&q=80&auto=format",
    fallback: "https://images.pexels.com/photos/1468379/pexels-photo-1468379.jpeg?w=800&h=1000&fit=crop&q=80&auto=format",
    label: "Women",
    description: "Elegance redefined",
    slug: "women"
  }
};

// SVG Icons
const ArrowIcon = () => (
  <svg className={styles.arrowIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const CategoryCard = ({ category, index, isVisible }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <Link 
      to={`/collections/${category.slug}`} 
      className={`${styles.categoryCard} ${isVisible ? styles.cardVisible : ""}`}
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      <div className={styles.cardInner}>
        {/* Image Container */}
        <div className={styles.imageContainer}>
          {!imageLoaded && !imageError && (
            <div className={styles.imageLoader}>
              <div className={styles.loaderSpinner} />
            </div>
          )}
          <img
            src={imageError ? category.fallback : category.url}
            alt={category.label}
            className={styles.categoryImage}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            loading="lazy"
          />
          <div className={styles.imageOverlay} />
        </div>

        {/* Content Overlay */}
        <div className={styles.cardContent}>
          <span className={styles.categoryBadge}>{category.label}</span>
          <h3 className={styles.categoryTitle}>{category.label}</h3>
          <p className={styles.categoryDescription}>{category.description}</p>
          <div className={styles.ctaWrapper}>
            <span className={styles.ctaText}>Explore Collection</span>
            <ArrowIcon />
          </div>
        </div>

        {/* Decorative Elements */}
        <div className={styles.decorativeLines}>
          <span className={styles.line} />
          <span className={styles.line} />
        </div>
      </div>
    </Link>
  );
};

export default function CategoryShowcase() {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    const element = document.getElementById('category-showcase');
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <section id="category-showcase" className={styles.showcaseSection}>
      <div className={styles.container}>
        {/* Section Header */}
        <div className={`${styles.sectionHeader} ${isVisible ? styles.headerVisible : ""}`}>
          {/* <span className={styles.sectionTag}>Shop by Category</span> */}
          <h2 className={styles.sectionTitle}>
            Discover Your Style
            <span className={styles.titleAccent}>.</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            Explore our curated collections for men and women, 
            crafted with precision and passion.
          </p>
        </div>

        {/* Categories Grid */}
        <div className={styles.categoriesGrid}>
          {Object.values(categoryImages).map((category, index) => (
            <div 
              key={category.slug}
              className={styles.cardWrapper}
              onMouseEnter={() => setHoveredCard(category.slug)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <CategoryCard 
                category={category} 
                index={index} 
                isVisible={isVisible}
              />
            </div>
          ))}
        </div>

        {/* Decorative Background Elements */}
        <div className={styles.bgDecoration}>
          <div className={styles.blob1} />
          <div className={styles.blob2} />
        </div>
      </div>
    </section>
  );
}