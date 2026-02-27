import { useState, useEffect, useRef } from "react";
import styles from "./Navbar.module.css";

/* ── Category Data ─────────────────────────── */
const categories = [
  {
    label: "Collections",
    featured: "New Season 2025",
    subcategories: [
      {
        title: "Women",
        items: ["Evening Gowns", "Resort Wear", "Silk Blouses", "Tailored Suits", "Cashmere Knits"],
      },
      {
        title: "Men",
        items: ["Bespoke Suits", "Dress Shirts", "Overcoats", "Trousers", "Accessories"],
      },
      {
        title: "Couture",
        items: ["Bridal", "Red Carpet", "Haute Couture", "Made-to-Measure", "Archive Pieces"],
      },
      {
        title: "Season",
        items: ["Spring / Summer", "Autumn / Winter", "Pre-Fall", "Capsule", "Limited Edition"],
      },
    ],
  },
];

/* ── Mock Auth State ───────────────────────── */
const MOCK_USER = { name: "Aria Fontaine", avatar: "AF" };

export default function Navbar() {
  const [scrolled, setScrolled]           = useState(false);
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [menuOpen, setMenuOpen]           = useState(false);
  const [searchOpen, setSearchOpen]       = useState(false);
  const [searchQuery, setSearchQuery]     = useState("");
  const [isLoggedIn, setIsLoggedIn]       = useState(false);
  const [profileOpen, setProfileOpen]     = useState(false);
  const [cartCount, setCartCount]         = useState(3);
  const [wishCount, setWishCount]         = useState(5);
  const [activeCategory, setActiveCategory] = useState(null);
  const [drawerLeaveTimer, setDrawerLeaveTimer] = useState(null);

  const searchRef   = useRef(null);
  const profileRef  = useRef(null);
  const cursorRef   = useRef(null);

  /* Scroll listener */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Custom cursor */
  useEffect(() => {
    const move = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top  = `${e.clientY}px`;
      }
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  /* Focus search input */
  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  /* Close profile dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Drawer hover handlers with small delay to prevent flicker */
  const handleCollectionsEnter = () => {
    clearTimeout(drawerLeaveTimer);
    setDrawerOpen(true);
    setActiveCategory(categories[0]);
  };
  const handleDrawerLeave = () => {
    const t = setTimeout(() => setDrawerOpen(false), 120);
    setDrawerLeaveTimer(t);
  };
  const handleDrawerEnter = () => {
    clearTimeout(drawerLeaveTimer);
  };

  return (
    <>
      {/* Custom cursor dot */}
      <div className={styles.cursor} ref={cursorRef} />

      {/* ── Marquee Strip ── */}
      <div className={styles.marqueeStrip}>
        <div className={styles.marqueeTrack}>
          {Array(8).fill("LUXURIA |  Wear the Trend. Own the Moment | Crafted for Comfort | Designed for You | Where Quality Meets Elegance |").map((t, i) => (
            <span key={i}>{t}&nbsp;</span>
          ))}
        </div>
      </div>

      {/* ── Main Nav ── */}
      <nav className={[styles.nav, scrolled ? styles.navScrolled : ""].filter(Boolean).join(" ")}>
        <div className={styles.navInner}>

          {/* ═══ LEFT — Collections trigger ═══ */}
          <div className={styles.navLeft}>
            <button
              className={[styles.collectionsBtn, drawerOpen ? styles.collectionsBtnActive : ""].filter(Boolean).join(" ")}
              onMouseEnter={handleCollectionsEnter}
              onMouseLeave={handleDrawerLeave}
              aria-expanded={drawerOpen}
            >
              <span className={styles.collectionsBtnText}>Collections</span>
              <svg className={[styles.chevron, drawerOpen ? styles.chevronUp : ""].filter(Boolean).join(" ")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          {/* ═══ CENTER — Logo ═══ */}
          <div className={styles.navCenter}>
            <a href="/" className={styles.logo}>
              <span className={styles.logoDiamond}>◆</span>
              <span className={styles.logoText}>LUXURIA</span>
              <span className={styles.logoDiamond}>◆</span>
            </a>
          </div>

          {/* ═══ RIGHT — Actions ═══ */}
          <div className={styles.navRight}>

            {/* Search */}
            <div className={[styles.searchWrap, searchOpen ? styles.searchWrapOpen : ""].filter(Boolean).join(" ")}>
              {searchOpen && (
                <input
                  ref={searchRef}
                  className={styles.searchInput}
                  type="text"
                  placeholder="Search pieces, collections…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
                />
              )}
              <button
                className={styles.iconBtn}
                onClick={() => { setSearchOpen((p) => !p); setSearchQuery(""); }}
                aria-label="Search"
              >
                {searchOpen ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                )}
              </button>
            </div>

            {/* Auth */}
            {isLoggedIn ? (
              <div className={styles.profileWrap} ref={profileRef}>
                <button
                  className={styles.avatarBtn}
                  onClick={() => setProfileOpen((p) => !p)}
                  aria-label="Profile"
                >
                  <span className={styles.avatarInitials}>{MOCK_USER.avatar}</span>
                </button>
                {profileOpen && (
                  <div className={styles.profileDropdown}>
                    <div className={styles.profileHeader}>
                      <span className={styles.profileName}>{MOCK_USER.name}</span>
                      <span className={styles.profileMeta}>Member since 2024</span>
                    </div>
                    <div className={styles.profileDivider} />
                    {["My Orders", "Wishlist", "Style Profile", "Settings"].map((item) => (
                      <a key={item} href="#" className={styles.profileItem}>{item}</a>
                    ))}
                    <div className={styles.profileDivider} />
                    <button className={styles.profileSignOut} onClick={() => { setIsLoggedIn(false); setProfileOpen(false); }}>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className={styles.signInBtn} onClick={() => setIsLoggedIn(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span>Sign In</span>
              </button>
            )}

            {/* Cart */}
            <button className={styles.iconBtn} aria-label="Cart">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
            </button>

            {/* Wishlist / Heart */}
            <button className={styles.iconBtn} aria-label="Wishlist">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              {wishCount > 0 && <span className={[styles.badge, styles.badgeHeart].join(" ")}>{wishCount}</span>}
            </button>

            {/* Mobile hamburger */}
            <button
              className={[styles.hamburger, menuOpen ? styles.hamburgerActive : ""].filter(Boolean).join(" ")}
              onClick={() => setMenuOpen((p) => !p)}
              aria-label="Menu"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════
            MEGA DRAWER — Collections
        ══════════════════════════════════════ */}
        <div
          className={[styles.drawer, drawerOpen ? styles.drawerOpen : ""].filter(Boolean).join(" ")}
          onMouseEnter={handleDrawerEnter}
          onMouseLeave={handleDrawerLeave}
        >
          <div className={styles.drawerInner}>
            {/* Left — featured editorial panel */}
            <div className={styles.drawerEditorial}>
              <div className={styles.drawerEditorialBg} />
              <div className={styles.drawerEditorialContent}>
                <span className={styles.drawerTag}>New Arrival</span>
                <h2 className={styles.drawerHeadline}>Spring<br /><em>Séduction</em></h2>
                <p className={styles.drawerSub}>2025 Resort Collection</p>
                <a href="#" className={styles.drawerCta}>
                  Explore Now
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </a>
              </div>
            </div>

            {/* Right — subcategory grid */}
            <div className={styles.drawerCategories}>
              {activeCategory?.subcategories.map((sub, si) => (
                <div
                  key={sub.title}
                  className={styles.drawerCol}
                  style={{ "--col-delay": `${si * 0.06}s` }}
                >
                  <h3 className={styles.drawerColTitle}>{sub.title}</h3>
                  <ul className={styles.drawerList}>
                    {sub.items.map((item, ii) => (
                      <li key={item} style={{ "--item-delay": `${si * 0.06 + ii * 0.04}s` }}>
                        <a href="#" className={styles.drawerLink}>
                          <span className={styles.drawerLinkDot}>·</span>
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          {/* Gold bottom border accent */}
          <div className={styles.drawerBottomAccent} />
        </div>

        {/* Backdrop */}
        {drawerOpen && (
          <div className={styles.backdrop} onMouseEnter={handleDrawerLeave} />
        )}
      </nav>

      {/* ══ Mobile fullscreen menu ══ */}
      <div className={[styles.mobileMenu, menuOpen ? styles.mobileMenuOpen : ""].filter(Boolean).join(" ")}>
        {/* Close button inside mobile menu */}
        <button
          className={styles.mobileCloseBtn}
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className={styles.mobileMenuInner}>
          <div className={styles.mobileMenuLogo}>◆ LUXURIA ◆</div>
          {categories[0].subcategories.map((sub, si) => (
            <div key={sub.title} className={styles.mobileSection} style={{ "--delay": `${si * 0.08}s` }}>
              <h4 className={styles.mobileSectionTitle}>{sub.title}</h4>
              <div className={styles.mobileSectionItems}>
                {sub.items.map((item) => (
                  <a key={item} href="#" className={styles.mobileSectionLink} onClick={() => setMenuOpen(false)}>
                    {item}
                  </a>
                ))}
              </div>
            </div>
          ))}
          <div className={styles.mobileMenuFooter}>
            {!isLoggedIn && (
              <button className={styles.mobileSignIn} onClick={() => { setIsLoggedIn(true); setMenuOpen(false); }}>
                Sign In to LUXURIA
              </button>
            )}
            <p className={styles.mobileFooterCities}>Paris · Milan · New York · Dubai</p>
          </div>
        </div>
      </div>
    </>
  );
}