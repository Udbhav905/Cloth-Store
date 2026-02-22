import React, { useEffect, useRef, useState } from 'react';
import styles from '../Styles/TrendingSection.module.css';

// Import images (you'll need to add these to your assets folder)

const TrendingSection = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);

  
  const trendingItems = [
    {
      id: 1,
      image: 'https://images.pexels.com/photos/32427323/pexels-photo-32427323.jpeg',
      category: 'Men',
      title: 'Oversized Blazer',      description: 'Modern silhouette with premium wool blend',
      price: '$299',
      originalPrice: '$399',
      discount: '-25%',
      isNew: true,
      isHot: false
    },
    {
      id: 2,
      image: 'https://images.pexels.com/photos/4690501/pexels-photo-4690501.jpeg',
      category: 'Women',
      title: 'Leather Midi Skirt',
      description: 'Sustainable leather, timeless design',
      price: '$349',
      originalPrice: '$449',
      discount: '-22%',
      isNew: false,
      isHot: true
    },
    {
      id: 3,
      image: 'https://images.pexels.com/photos/1485031/pexels-photo-1485031.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      category: 'Accessories',
      title: 'Gold Chain Necklace',
      description: 'Handcrafted in 18k gold finish',
      price: '$189',
      originalPrice: '$279',
      discount: '-32%',
      isNew: true,
      isHot: true
    },
    {
      id: 4,
      image: 'https://images.pexels.com/photos/7697490/pexels-photo-7697490.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      category: 'Men',
      title: 'Cashmere Sweater',
      description: 'Ultra-soft Mongolian cashmere',
      price: '$459',
      originalPrice: '$589',
      discount: '-22%',
      isNew: false,
      isHot: false
    },
    {
      id: 5,
      image: 'https://images.pexels.com/photos/6319869/pexels-photo-6319869.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      category: 'Women',
      title: 'Silk Maxi Dress',
      description: 'Elegant evening wear with subtle print',
      price: '$529',
      originalPrice: '$699',
      discount: '-24%',
      isNew: true,
      isHot: true
    },
    {
      id: 6,
      image: 'https://images.pexels.com/photos/35070982/pexels-photo-35070982.jpeg',
      category: 'Footwear',
      title: 'Leather Loafers',
      description: 'Italian leather, hand-finished',
      price: '$389',
      originalPrice: '$489',
      discount: '-20%',
      isNew: false,
      isHot: false
    }
  ];

  const filters = [
    { id: 'all', label: 'All Trends' },
    { id: 'Men', label: 'Men' },
    { id: 'Women', label: 'Women' },
    { id: 'Accessories', label: 'Accessories' },
    { id: 'Footwear', label: 'Footwear' }
  ];

  const filteredItems = activeFilter === 'all' 
    ? trendingItems 
    : trendingItems.filter(item => item.category === activeFilter);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    cardsRef.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => observer.disconnect();
  }, [filteredItems]);

  return (
    <section className={styles.trending} ref={sectionRef}>
      {/* Decorative background elements */}
      <div className={styles.bgPattern}></div>
      <div className={styles.bgGradient}></div>
      
      <div className={styles.container}>
        {/* Section Header */}
        <div className={styles.header}>
          <span className={styles.sectionSubtitle}>Curated Collection</span>
          <h2 className={styles.sectionTitle}>
            WHAT'S <span className={styles.titleAccent}>TRENDING</span>
          </h2>
          <p className={styles.sectionDescription}>
            Discover the most sought-after pieces of the season, carefully selected for the discerning fashion enthusiast
          </p>
          
          {/* Filter Tabs */}
          <div className={styles.filterContainer}>
            {filters.map((filter) => (
              <button
                key={filter.id}
                className={`${styles.filterBtn} ${activeFilter === filter.id ? styles.activeFilter : ''}`}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
                {activeFilter === filter.id && (
                  <span className={styles.filterUnderline}></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Trending Grid */}
        <div className={styles.trendingGrid}>
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className={styles.trendingCard}
              ref={(el) => (cardsRef.current[index] = el)}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Card Badges */}
              <div className={styles.cardBadges}>
                {item.isNew && <span className={`${styles.badge} ${styles.newBadge}`}>New</span>}
                {item.isHot && <span className={`${styles.badge} ${styles.hotBadge}`}>Hot</span>}
                {item.discount && <span className={`${styles.badge} ${styles.discountBadge}`}>{item.discount}</span>}
              </div>

              {/* Image Container */}
              <div className={styles.imageContainer}>
                <img 
                  src={item.image} 
                  alt={item.title}
                  className={styles.cardImage}
                  loading="lazy"
                />
                
                {/* Overlay with actions */}
                <div className={styles.imageOverlay}>
                  <button className={styles.quickViewBtn}>
                    <span className={styles.btnIcon}>👁️</span>
                    Quick View
                  </button>
                  <button className={styles.wishlistBtn}>
                    <span className={styles.btnIcon}>❤️</span>
                  </button>
                </div>

                {/* Category tag */}
                <span className={styles.categoryTag}>{item.category}</span>
              </div>

              {/* Card Content */}
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardDescription}>{item.description}</p>
                
                {/* Price Section */}
                <div className={styles.priceSection}>
                  <div className={styles.priceWrapper}>
                    <span className={styles.currentPrice}>{item.price}</span>
                    <span className={styles.originalPrice}>{item.originalPrice}</span>
                  </div>
                  
                  {/* Rating */}
                  <div className={styles.rating}>
                    <span className={styles.stars}>★★★★★</span>
                    <span className={styles.reviewCount}>(24)</span>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button className={styles.addToCartBtn}>
                  <span className={styles.cartIcon}>🛒</span>
                  Add to Cart
                </button>
              </div>

              {/* Hover effect line */}
              <div className={styles.cardHoverLine}></div>
            </div>
          ))}
        </div>

        {/* View All Link */}
        <div className={styles.viewAllContainer}>
          <a href="/collections/trending" className={styles.viewAllLink}>
            View All Trends
            <span className={styles.linkArrow}>→</span>
          </a>
        </div>
      </div>

      {/* Floating elements for animation */}
      <div className={styles.floatingElement1}></div>
      <div className={styles.floatingElement2}></div>
    </section>
  );
};

export default TrendingSection;