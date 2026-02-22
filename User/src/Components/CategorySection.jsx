import React, { useState, useEffect } from 'react';
import styles from '../Styles/CategorySection.module.css';

const CategorySection = () => {
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const categories = [
    {
      id: 'men',
      title: 'MEN',
      subtitle: 'Timeless Elegance',
      description: 'Discover refined tailoring and contemporary silhouettes crafted for the modern gentleman.',
      image:'https://images.unsplash.com/photo-1622519407650-3df9883f76a5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bWVuJTIwZmFzaGlvbnxlbnwwfHwwfHx8MA%3D%3D',
      accent: 'Premium Collection',
      link: '/men',
      stats: { items: '450+', new: '24', sale: '15%' }
    },
    {
      id: 'women',
      title: 'WOMEN',
      subtitle: 'Grace & Sophistication',
      description: 'Curated pieces that celebrate femininity with luxurious fabrics and impeccable craftsmanship.',
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      accent: 'New Arrivals',
      link: '/women',
      stats: { items: '620+', new: '36', sale: '20%' }
    },
    {
      id: 'sale',
      title: 'SALE',
      subtitle: 'Luxury at Exceptional Value',
      description: 'Exclusive offers on premium pieces from past collections. Limited time only.',
      image: 'https://images.unsplash.com/photo-1603400521630-9f2de124b33b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80',
      accent: 'Up to 50% Off',
      link: '/sale',
      stats: { items: '120+', new: '8', sale: '50%' }
    }
  ];

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className={styles.categorySection}>
      <div className={styles.container}>
        {/* Section Header */}
        <div className={styles.header}>
          <span className={styles.headerAccent}>EXCLUSIVE COLLECTIONS</span>
          <h2 className={styles.headerTitle}>
            <span className={styles.headerTitleWord}>Shop by</span>
            <span className={styles.headerTitleWord}>Category</span>
          </h2>
          <div className={styles.headerLine}>
            <span className={styles.headerLineInner}></span>
          </div>
          <p className={styles.headerSubtext}>
            Explore our curated selection of premium apparel
          </p>
        </div>

        {/* Categories Grid */}
        <div className={styles.categoriesGrid}>
          {categories.map((category, index) => (
            <div
              key={category.id}
              className={`${styles.categoryCard} ${hoveredCategory === category.id ? styles.hovered : ''}`}
              onMouseEnter={() => setHoveredCategory(category.id)}
              onMouseLeave={() => setHoveredCategory(null)}
              style={{
                '--mouse-x': `${mousePosition.x}px`,
                '--mouse-y': `${mousePosition.y}px`
              }}
            >
              {/* Background Image with Parallax */}
              <div className={styles.imageWrapper}>
                <img 
                  src={category.image} 
                  alt={category.title}
                  className={styles.categoryImage}
                  style={{
                    transform: hoveredCategory === category.id ? 'scale(1.1)' : 'scale(1)'
                  }}
                />
                <div className={styles.imageOverlay}></div>
              </div>

              {/* Gradient Overlay */}
              <div className={styles.gradientOverlay}></div>

              <div className={styles.content}>
                <span className={styles.accent}>{category.accent}</span>
                
                <h3 className={styles.title}>{category.title}</h3>
                <h4 className={styles.subtitle}>{category.subtitle}</h4>
                
                <p className={styles.description}>{category.description}</p>

                {/* Stats */}
                <div className={styles.statsContainer}>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{category.stats.items}</span>
                    <span className={styles.statLabel}>Items</span>
                  </div>
                  <div className={styles.statDivider}></div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{category.stats.new}</span>
                    <span className={styles.statLabel}>New</span>
                  </div>
                  <div className={styles.statDivider}></div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{category.stats.sale}</span>
                    <span className={styles.statLabel}>Sale</span>
                  </div>
                </div>

                {/* Explore Button */}
                <a href={category.link} className={styles.exploreBtn}>
                  <span>Explore {category.title}</span>
                  <span className={styles.btnIcon}>→</span>
                  <span className={styles.btnGlow}></span>
                </a>
              </div>

              {/* Decorative Elements */}
              <div className={styles.decorativeCircle}></div>
              <div className={styles.decorativeLine}></div>
              
              {/* Shine Effect */}
              <div className={styles.shine}></div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className={styles.bottomCta}>
          <a href="/all-categories" className={styles.viewAllBtn}>
            <span>View All Categories</span>
            <span className={styles.viewAllIcon}>→</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;