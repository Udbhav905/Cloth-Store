import React, { useState, useEffect, useRef } from 'react';
import styles from '../Styles/NewArrivals.module.css';

const NewArrivals = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const sliderRef = useRef(null);

  // Slider images data
  const sliderImages = [
    {
      id: 1,
      image:'https://images.unsplash.com/photo-1583424201621-2f15102362e3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzR8fG1lbiUyMEhEfGVufDB8fDJ8fHww',
      title: 'Autumn Collection 2024',
      subtitle: 'Where elegance meets comfort'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      title: 'Evening Gowns',
      subtitle: 'For those special moments'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      title: 'Casual Luxury',
      subtitle: 'Effortless style for everyday'
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80',
      title: 'Accessories Collection',
      subtitle: 'Complete your look'
    }
  ];

  // Products data
  const products = [
    {
      id: 1,
      name: 'Silk Evening Gown',
      category: 'Dresses',
      price: 899,
      originalPrice: 1299,
      image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2008&q=80',
      isNew: true,
      isSale: false
    },
    {
      id: 2,
      name: 'Cashmere Blend Coat',
      category: 'Outerwear',
      price: 1299,
      originalPrice: 1899,
      image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80',
      isNew: true,
      isSale: true
    },
    {
      id: 3,
      name: 'Leather Ankle Boots',
      category: 'Footwear',
      price: 599,
      originalPrice: 899,
      image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1980&q=80',
      isNew: true,
      isSale: false
    },
    {
      id: 4,
      name: 'Designer Handbag',
      category: 'Accessories',
      price: 799,
      originalPrice: 1199,
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1935&q=80',
      isNew: true,
      isSale: true
    },
    {
      id: 5,
      name: 'Wool Trousers',
      category: 'Bottoms',
      price: 349,
      originalPrice: 499,
      image: 'https://images.unsplash.com/photo-1473966968600-fa801b8695b1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80',
      isNew: true,
      isSale: false
    },
    {
      id: 6,
      name: 'Silk Blouse',
      category: 'Tops',
      price: 299,
      originalPrice: 449,
      image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2005&q=80',
      isNew: true,
      isSale: false
    },
    {
      id: 7,
      name: 'Gold Bracelet',
      category: 'Jewelry',
      price: 449,
      originalPrice: 649,
      image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80',
      isNew: true,
      isSale: true
    },
    {
      id: 8,
      name: 'Knit Sweater',
      category: 'Knitwear',
      price: 279,
      originalPrice: 399,
      image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2005&q=80',
      isNew: true,
      isSale: false
    },
    {
      id: 9,
      name: 'Designer Sunglasses',
      category: 'Accessories',
      price: 349,
      originalPrice: 499,
      image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2080&q=80',
      isNew: true,
      isSale: false
    },
    {
      id: 10,
      name: 'Leather Belt',
      category: 'Accessories',
      price: 149,
      originalPrice: 229,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80',
      isNew: true,
      isSale: true
    }
  ];

  // Auto-slide effect
  useEffect(() => {
    let interval;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, sliderImages.length]);

 const handleTouchStart = (e) => {
  e.preventDefault(); // Add this
  setTouchStart(e.touches[0].clientX);
  setIsAutoPlaying(false);
};

const handleTouchMove = (e) => {
  e.preventDefault(); // Add this
  setTouchEnd(e.touches[0].clientX);
};

const handleTouchEnd = (e) => {
  e.preventDefault(); // Add this
  if (touchStart - touchEnd > 75) {
    setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
  } else if (touchStart - touchEnd < -75) {
    setCurrentSlide((prev) => (prev - 1 + sliderImages.length) % sliderImages.length);
  }
  setTimeout(() => setIsAutoPlaying(true), 5000);
};

  return (
    <section className={styles.newArrivals}>
      {/* Animated Title Section */}
      <div className={styles.titleContainer}>
        <span className={styles.titleAccent}>LUXURIA</span>
        <h2 className={styles.title}>
          <span className={styles.titleWord}>New</span>
          <span className={styles.titleWord}>Arrivals</span>
        </h2>
        <div className={styles.titleLine}>
          <span className={styles.titleLineInner}></span>
        </div>
        <p className={styles.titleSubtext}>Discover the latest additions to our collection</p>
      </div>

      {/* Touch Slider Section */}
      <div 
        className={styles.sliderContainer}
        ref={sliderRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className={styles.sliderTrack}
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {sliderImages.map((slide) => (
            <div key={slide.id} className={styles.slide}>
              <img src={slide.image} alt={slide.title} className={styles.slideImage} />
              <div className={styles.slideOverlay}>
                <h3 className={styles.slideTitle}>{slide.title}</h3>
                <p className={styles.slideSubtitle}>{slide.subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Slide Indicators */}
        <div className={styles.slideIndicators}>
          {sliderImages.map((_, index) => (
            <button
              key={index}
              className={`${styles.slideIndicator} ${index === currentSlide ? styles.activeIndicator : ''}`}
              onClick={() => {
                setCurrentSlide(index);
                setIsAutoPlaying(false);
                setTimeout(() => setIsAutoPlaying(true), 5000);
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className={styles.productsGrid}>
        {products.map((product) => (
          <div key={product.id} className={styles.productCard}>
            <div className={styles.cardInner}>
              {/* Product Image */}
              <div className={styles.imageContainer}>
                <img src={product.image} alt={product.name} className={styles.productImage} />
                
                {/* Badges */}
                <div className={styles.badges}>
                  {product.isNew && <span className={`${styles.badge} ${styles.newBadge}`}>New</span>}
                  {product.isSale && <span className={`${styles.badge} ${styles.saleBadge}`}>-{Math.round((1 - product.price/product.originalPrice) * 100)}%</span>}
                </div>

                {/* Quick Actions */}
                <div className={styles.quickActions}>
                  <button className={styles.actionBtn} aria-label="Add to wishlist">
                    <svg className={styles.actionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M4.31802 6.31802C2.56066 8.07538 2.56066 10.9246 4.31802 12.682L12 20.364L19.682 12.682C21.4393 10.9246 21.4393 8.07538 19.682 6.31802C17.9246 4.56066 15.0754 4.56066 13.318 6.31802L12 7.63609L10.682 6.31802C8.92462 4.56066 6.07538 4.56066 4.31802 6.31802Z" strokeWidth="2"/>
                    </svg>
                  </button>
                  <button className={styles.actionBtn} aria-label="Quick view">
                    <svg className={styles.actionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" strokeWidth="2"/>
                      <path d="M2 12C3.6 7 7.5 4 12 4C16.5 4 20.4 7 22 12C20.4 17 16.5 20 12 20C7.5 20 3.6 17 2 12Z" strokeWidth="2"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Product Details */}
              <div className={styles.productDetails}>
                <span className={styles.productCategory}>{product.category}</span>
                <h3 className={styles.productName}>{product.name}</h3>
                
                <div className={styles.priceContainer}>
                  <span className={styles.currentPrice}>${product.price}</span>
                  {product.originalPrice > product.price && (
                    <span className={styles.originalPrice}>${product.originalPrice}</span>
                  )}
                </div>

                <button className={styles.addToCartBtn}>
                  <span>Add to Cart</span>
                  <svg className={styles.cartIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11M5 9H19L18 19H6L5 9Z" strokeWidth="2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View All Button */}
      <div className={styles.viewAllContainer}>
        <a href="/new-arrivals" className={styles.viewAllBtn}>
          <span>View All Arrivals</span>
          <span className={styles.btnArrow}>→</span>
        </a>
      </div>
    </section>
  );
};

export default NewArrivals;