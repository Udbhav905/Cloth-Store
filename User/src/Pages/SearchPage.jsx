import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import useProductStore, { calcFinalPrice, hasDiscount, formatPrice } from "../store/useProductStore";
import styles from "./styles/SearchPage.module.css";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue]     = useState(searchParams.get("q") || "");

  const searchResults    = useProductStore((s) => s.searchResults);
  const searchLoading    = useProductStore((s) => s.searchLoading);
  const searchError      = useProductStore((s) => s.searchError);
  const searchTotal      = useProductStore((s) => s.searchTotal);
  const fetchSearchResults = useProductStore((s) => s.fetchSearchResults);
  const clearSearch      = useProductStore((s) => s.clearSearch);

  const query = searchParams.get("q") || "";

  useEffect(() => {
    if (query) {
      fetchSearchResults(query);
    } else {
      clearSearch();
    }
  }, [query]);

  useEffect(() => {
    setInputValue(searchParams.get("q") || "");
  }, [searchParams]);

  const handleSearch = () => {
    const q = inputValue.trim();
    if (q) setSearchParams({ q });
  };

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          {query ? <>Results for <em>"{query}"</em></> : "Search"}
        </h1>
        <p className={styles.count}>
          {searchLoading
            ? "Searching…"
            : query
              ? `${searchResults.length} ${searchResults.length === 1 ? "piece" : "pieces"} found`
              : "Enter a search term above"}
        </p>

        {/* Search bar */}
        <div className={styles.searchBar}>
          <input
            className={styles.searchInput}
            type="text"
            value={inputValue}
            placeholder="e.g. Men, Shirt, under 500…"
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button className={styles.searchBtn} onClick={handleSearch} aria-label="Search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="7"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
        </div>

        {/* Quick hint chips */}
        <div className={styles.hints}>
          <span className={styles.hintLabel}>Try:</span>
          {["Men", "Women", "Shirt", "under 500", "above 300"].map((hint) => (
            <button
              key={hint}
              className={`${styles.hintChip} ${query === hint ? styles.hintChipActive : ""}`}
              onClick={() => { setInputValue(hint); setSearchParams({ q: hint }); }}
            >
              {hint}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error ── */}
      {searchError && (
        <div className={styles.errorBox}>
          <span>⚠ {searchError}</span>
          <button onClick={() => fetchSearchResults(query)}>Retry</button>
        </div>
      )}

      {/* ── Loading Skeleton ── */}
      {searchLoading && (
        <div className={styles.grid}>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className={styles.skeleton}>
              <div className={styles.skeletonImg} />
              <div className={styles.skeletonBody}>
                <div className={styles.skeletonLine} style={{ width: "40%" }} />
                <div className={styles.skeletonLine} style={{ width: "70%" }} />
                <div className={styles.skeletonLine} style={{ width: "30%" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Results Grid ── */}
      {!searchLoading && searchResults.length > 0 && (
        <div className={styles.grid}>
          {searchResults.map((product) => {
            const finalPrice   = calcFinalPrice(product);
            const discounted   = hasDiscount(product);
            const categoryName = product.category?.name || "";
            return (
              <Link
                key={product._id}
                to={`/products/${product._id}`}
                className={styles.card}
              >
                <div className={styles.cardImg}>
                  {product.mainImage
                    ? <img src={product.mainImage} alt={product.name} loading="lazy" />
                    : <span className={styles.cardImgPlaceholder}>◆</span>
                  }
                  {discounted && (
                    <span className={styles.discountBadge}>
                      -{product.discountValue}
                      {product.discountType === "percentage" ? "%" : ""}
                    </span>
                  )}
                  {product.isNewArrival && !discounted && (
                    <span className={`${styles.discountBadge} ${styles.newBadge}`}>NEW</span>
                  )}
                </div>
                <div className={styles.cardBody}>
                  {categoryName && (
                    <span className={styles.cardCategory}>{categoryName}</span>
                  )}
                  <h3 className={styles.cardName}>{product.name}</h3>
                  <div className={styles.cardPriceRow}>
                    <span className={styles.cardPrice}>{formatPrice(finalPrice)}</span>
                    {discounted && (
                      <span className={styles.cardPriceOld}>
                        {formatPrice(product.basePrice)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Empty State ── */}
      {!searchLoading && !searchError && query && searchResults.length === 0 && (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>◆</span>
          <h2 className={styles.emptyTitle}>No pieces found for "{query}"</h2>
          <p className={styles.emptySub}>
            Try <em>"Men"</em>, <em>"Shirt"</em>, or <em>"under 500"</em>
          </p>
          <Link to="/" className={styles.emptyBack}>Back to Home</Link>
        </div>
      )}

      {/* ── Initial empty (no query yet) ── */}
      {!searchLoading && !query && (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>◆</span>
          <h2 className={styles.emptyTitle}>Discover your style</h2>
          <p className={styles.emptySub}>Search by name, category or price</p>
        </div>
      )}

    </div>
  );
}