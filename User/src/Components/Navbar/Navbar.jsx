import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../../store/Useauthstore";
import useCartStore from "../../store/Usecartstore";
import styles from "./Navbar.module.css";

/* ── Category Data ─────────────────────────── */
const categories = [
  {
    label: "Collections",
    subcategories: [
      { title: "Women",   items: ["Evening Gowns", "Resort Wear", "Silk Blouses", "Tailored Suits", "Cashmere Knits"] },
      { title: "Men",     items: ["Bespoke Suits", "Dress Shirts", "Overcoats", "Trousers", "Accessories"] },
      { title: "Couture", items: ["Bridal", "Red Carpet", "Haute Couture", "Made-to-Measure", "Archive Pieces"] },
      { title: "Season",  items: ["Spring / Summer", "Autumn / Winter", "Pre-Fall", "Capsule", "Limited Edition"] },
    ],
  },
];

const getInitials = (name = "") =>
  name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

export default function Navbar() {
  const { user, isLoggedIn, logout, openAuthModal, fetchProfile } = useAuthStore();
  const { items, wishlist } = useCartStore();
  const cartCount = items.reduce((s, i) => s + i.quantity, 0);
  const wishCount = wishlist.length;

  const [scrolled,       setScrolled]       = useState(false);
  const [drawerOpen,     setDrawerOpen]     = useState(false);
  const [menuOpen,       setMenuOpen]       = useState(false);
  const [searchOpen,     setSearchOpen]     = useState(false);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [profileOpen,    setProfileOpen]    = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const drawerTimerRef = useRef(null);
  const searchRef  = useRef(null);
  const profileRef = useRef(null);
  const cursorRef  = useRef(null);

  useEffect(() => { fetchProfile(); }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const move = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top  = `${e.clientY}px`;
      }
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, []);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  useEffect(() => {
    const h = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleCollectionsEnter = () => {
    clearTimeout(drawerTimerRef.current);
    setDrawerOpen(true);
    setActiveCategory(categories[0]);
  };
  const handleDrawerLeave = () => {
    drawerTimerRef.current = setTimeout(() => setDrawerOpen(false), 120);
  };
  const handleDrawerEnter = () => clearTimeout(drawerTimerRef.current);

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
  };

  return (
    <>
      <div className={styles.cursor} ref={cursorRef} />

      <div className={styles.marqueeStrip}>
        <div className={styles.marqueeTrack}>
          {Array(8).fill("LUXURIA · Wear the Trend. Own the Moment · Crafted for Comfort · Designed for You · Where Quality Meets Elegance ·").map((t, i) => (
            <span key={i}>{t}&nbsp;</span>
          ))}
        </div>
      </div>

      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
        <div className={styles.navInner}>

          {/* LEFT */}
          <div className={styles.navLeft}>
            <button
              className={`${styles.collectionsBtn} ${drawerOpen ? styles.collectionsBtnActive : ""}`}
              onMouseEnter={handleCollectionsEnter}
              onMouseLeave={handleDrawerLeave}
              aria-expanded={drawerOpen}
            >
              <span className={styles.collectionsBtnText}>Collections</span>
              <svg className={`${styles.chevron} ${drawerOpen ? styles.chevronUp : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          {/* CENTER */}
          <div className={styles.navCenter}>
            <Link to="/" className={styles.logo}>
              <span className={styles.logoDiamond}>◆</span>
              <span className={styles.logoText}>LUXURIA</span>
              <span className={styles.logoDiamond}>◆</span>
            </Link>
          </div>

          {/* RIGHT */}
          <div className={styles.navRight}>

            {/* Search */}
            <div className={`${styles.searchWrap} ${searchOpen ? styles.searchWrapOpen : ""}`}>
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
                {searchOpen
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                }
              </button>
            </div>

            {/* AUTH */}
            {isLoggedIn && user ? (
              <div className={styles.profileWrap} ref={profileRef}>
                <button
                  className={styles.avatarBtn}
                  onClick={() => setProfileOpen((p) => !p)}
                  aria-label="Profile"
                  title={user.name}
                >
                  <span className={styles.avatarInitials}>{getInitials(user.name)}</span>
                  <span className={styles.avatarOnline} />
                </button>

                {profileOpen && (
                  <div className={styles.profileDropdown}>
                    <div className={styles.profileHeader}>
                      <div className={styles.profileAvatar}>{getInitials(user.name)}</div>
                      <div className={styles.profileHeaderInfo}>
                        <span className={styles.profileName}>{user.name}</span>
                        <span className={styles.profileEmail}>{user.email}</span>
                        <span className={styles.profileMeta}>
                          {user.role === "admin" ? "◆ Admin" : "◆ Member"}
                        </span>
                      </div>
                    </div>
                    <div className={styles.profileDivider} />
                    {[
                      { label: "My Orders",    to: "/my-orders" },
                      { label: "Wishlist",      to: "/wishlist" },
                      { label: "Style Profile", to: "/style-profile" },
                      { label: "Settings",      to: "/settings" },
                    ].map((item) => (
                      <Link key={item.label} to={item.to} className={styles.profileItem} onClick={() => setProfileOpen(false)}>
                        {item.label}
                      </Link>
                    ))}
                    {user.role === "admin" && (
                      <Link to="/admin" className={styles.profileItemAdmin} onClick={() => setProfileOpen(false)}>
                        ◆ Admin Panel
                      </Link>
                    )}
                    <div className={styles.profileDivider} />
                    <button className={styles.profileSignOut} onClick={handleLogout}>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className={styles.signInBtn} onClick={() => openAuthModal("login")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>Sign In</span>
              </button>
            )}

            {/* Cart */}
            <Link to="/cart" className={styles.iconBtn} aria-label="Cart">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
            </Link>

            {/* Wishlist */}
            <Link to="/wishlist" className={styles.iconBtn} aria-label="Wishlist">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
              {wishCount > 0 && <span className={`${styles.badge} ${styles.badgeHeart}`}>{wishCount}</span>}
            </Link>

            {/* Hamburger */}
            <button
              className={`${styles.hamburger} ${menuOpen ? styles.hamburgerActive : ""}`}
              onClick={() => setMenuOpen((p) => !p)}
              aria-label="Menu"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>

        {/* MEGA DRAWER */}
        <div
          className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ""}`}
          onMouseEnter={handleDrawerEnter}
          onMouseLeave={handleDrawerLeave}
        >
          <div className={styles.drawerInner}>
            <div className={styles.drawerEditorial}>
              <div className={styles.drawerEditorialBg} />
              <div className={styles.drawerEditorialContent}>
                <span className={styles.drawerTag}>New Arrival</span>
                <h2 className={styles.drawerHeadline}>Spring<br /><em>Séduction</em></h2>
                <p className={styles.drawerSub}>2025 Resort Collection</p>
                <Link to="/collections/resort-2025" className={styles.drawerCta}>
                  Explore Now
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </Link>
              </div>
            </div>
            <div className={styles.drawerCategories}>
              {activeCategory?.subcategories.map((sub, si) => (
                <div key={sub.title} className={styles.drawerCol} style={{ "--col-delay": `${si * 0.06}s` }}>
                  <h3 className={styles.drawerColTitle}>{sub.title}</h3>
                  <ul className={styles.drawerList}>
                    {sub.items.map((item, ii) => (
                      <li key={item} style={{ "--item-delay": `${si * 0.06 + ii * 0.04}s` }}>
                        <Link
                          to={`/collections/${item.toLowerCase().replace(/\s+/g, "-")}`}
                          className={styles.drawerLink}
                          onClick={() => setDrawerOpen(false)}
                        >
                          <span className={styles.drawerLinkDot}>·</span>
                          {item}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.drawerBottomAccent} />
        </div>

        {drawerOpen && <div className={styles.backdrop} onMouseEnter={handleDrawerLeave} />}
      </nav>

      {/* MOBILE MENU */}
      <div className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ""}`}>
        <button className={styles.mobileCloseBtn} onClick={() => setMenuOpen(false)} aria-label="Close menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <div className={styles.mobileMenuInner}>
          <div className={styles.mobileMenuLogo}>◆ LUXURIA ◆</div>
          {categories[0].subcategories.map((sub, si) => (
            <div key={sub.title} className={styles.mobileSection} style={{ "--delay": `${si * 0.08}s` }}>
              <h4 className={styles.mobileSectionTitle}>{sub.title}</h4>
              <div className={styles.mobileSectionItems}>
                {sub.items.map((item) => (
                  <Link
                    key={item}
                    to={`/collections/${item.toLowerCase().replace(/\s+/g, "-")}`}
                    className={styles.mobileSectionLink}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <div className={styles.mobileMenuFooter}>
            {isLoggedIn && user ? (
              <div className={styles.mobileUserInfo}>
                <span className={styles.mobileUserName}>{user.name}</span>
                <button className={styles.mobileSignOut} onClick={() => { setMenuOpen(false); logout(); }}>
                  Sign Out
                </button>
              </div>
            ) : (
              <button className={styles.mobileSignIn} onClick={() => { setMenuOpen(false); openAuthModal("login"); }}>
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