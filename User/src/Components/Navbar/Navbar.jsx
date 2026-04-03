import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../../store/Useauthstore";
import useCartStore from "../../store/Usecartstore";
import axios from "axios";
import styles from "./Navbar.module.css";

const API_URL = "http://localhost:3000/api";
const getInitials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();


export default function Navbar() {
  const navigate = useNavigate();

  const { user, isLoggedIn, logout, openAuthModal, fetchProfile } =
    useAuthStore();
  
  // Get cart store state and actions - get the actual arrays, not functions
  const cartItems = useCartStore((state) => state.items);
  const wishlistItems = useCartStore((state) => state.wishlist);
  const initialize = useCartStore((state) => state.initialize);
  const resetCart = useCartStore((state) => state.resetCart);
  const isInitialized = useCartStore((state) => state.isInitialized);
  const syncInProgress = useCartStore((state) => state.syncInProgress);

  // Compute counts from the actual items (these will update when items change)
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlistItems.length;

  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  const drawerTimerRef = useRef(null);
  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const cursorRef = useRef(null);

  // Initialize cart and wishlist when user logs in
  useEffect(() => {
    const initStore = async () => {
      if (isLoggedIn) {
        if (!isInitialized) {
          await initialize();
        }
      } else {
        resetCart();
      }
    };

    initStore();
  }, [isLoggedIn, initialize, resetCart, isInitialized]);

  // Debug: Log cart changes in real-time
  useEffect(() => {
    console.log("Cart updated - Items:", cartItems.length, "Count:", cartItemCount);
  }, [cartItems, cartItemCount]);

  // Rest of your existing code remains the same...
  
  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        console.log("Fetching categories from:", `${API_URL}/categories`);

        const response = await axios.get(`${API_URL}/categories`);
        console.log("Raw categories response:", response.data);

        let categoriesData = [];

        if (response.data.success) {
          categoriesData = response.data.data;
        } else if (Array.isArray(response.data)) {
          categoriesData = response.data;
        } else if (response.data.categories) {
          categoriesData = response.data.categories;
        } else {
          categoriesData = response.data;
        }

        console.log("Categories data:", categoriesData);

        // Create a structured menu with proper subcategories
        const menSubcategories = categoriesData
          .filter(
            (cat) =>
              cat.parentCategory === "699d7d23a7f166db0aabd088" ||
              cat.name === "Shirt" ||
              cat.name === "T-shirts" ||
              cat.name === "Jacket" ||
              cat.name === "Pants",
          )
          .map((cat) => ({
            _id: cat._id,
            name: cat.name,
            slug: cat.slug,
            subcategories: [],
          }));

        console.log("Men subcategories:", menSubcategories);

        const structuredCategories = [
          {
            _id: "men",
            name: "Men",
            slug: "men",
            subcategories:
              menSubcategories.length > 0
                ? menSubcategories
                : [
                    { _id: "shirt", name: "Shirt", slug: "shirt" },
                    { _id: "tshirts", name: "T-shirts", slug: "t-shirts" },
                    { _id: "jacket", name: "Jacket", slug: "jacket" },
                    { _id: "pants", name: "Pants", slug: "pants" },
                  ],
          },
          {
            _id: "women",
            name: "Women",
            slug: "women",
            subcategories: [],
          },
          {
            _id: "couture",
            name: "Couture",
            slug: "couture",
            subcategories: [],
          },
          {
            _id: "season",
            name: "Season",
            slug: "season",
            subcategories: [],
          },
        ];

        setCategories([
          {
            _id: "collections",
            name: "Collections",
            slug: "collections",
            subcategories: structuredCategories,
          },
        ]);

        console.log("Final categories structure:", structuredCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        // Fallback data
        setCategories([
          {
            _id: "1",
            name: "Collections",
            slug: "collections",
            subcategories: [
              {
                _id: "men",
                name: "Men",
                slug: "men",
                subcategories: [
                  { _id: "shirt", name: "Shirt", slug: "shirt" },
                  { _id: "tshirts", name: "T-shirts", slug: "t-shirts" },
                  { _id: "jacket", name: "Jacket", slug: "jacket" },
                  { _id: "pants", name: "Pants", slug: "pants" },
                ],
              },
              {
                _id: "women",
                name: "Women",
                slug: "women",
                subcategories: [],
              },
              {
                _id: "couture",
                name: "Couture",
                slug: "couture",
                subcategories: [],
              },
              {
                _id: "season",
                name: "Season",
                slug: "season",
                subcategories: [],
              },
            ],
          },
        ]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const move = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
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
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleCollectionsEnter = () => {
    clearTimeout(drawerTimerRef.current);
    setDrawerOpen(true);
  };

  const handleDrawerLeave = () => {
    drawerTimerRef.current = setTimeout(() => setDrawerOpen(false), 120);
  };

  const handleDrawerEnter = () => clearTimeout(drawerTimerRef.current);

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
  };

  const handleSearchSubmit = () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearchOpen(false);
    setSearchQuery("");
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") handleSearchSubmit();
    if (e.key === "Escape") {
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleSearchIconClick = () => {
    if (searchOpen && searchQuery.trim()) {
      handleSearchSubmit();
    } else if (searchOpen) {
      setSearchOpen(false);
      setSearchQuery("");
    } else {
      setSearchOpen(true);
    }
  };

  const handleCategoryClick = (slug, name) => {
    console.log(`Navigating to: /collections/${slug}`);
    navigate(`/collections/${slug}`);
    setDrawerOpen(false);
  };

  const activeCategory = categories[0] || null;

  return (
    <>
      <div className={styles.cursor} ref={cursorRef} />

      <div className={styles.marqueeStrip}>
        <div className={styles.marqueeTrack}>
          {Array(8)
            .fill(
              "LUXURIA · Wear the Trend. Own the Moment · Crafted for Comfort · Designed for You · Where Quality Meets Elegance ·",
            )
            .map((t, i) => (
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
              <svg
                className={`${styles.chevron} ${drawerOpen ? styles.chevronUp : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
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
            <div
              className={`${styles.searchWrap} ${searchOpen ? styles.searchWrapOpen : ""}`}
            >
              {searchOpen && (
                <input
                  ref={searchRef}
                  className={styles.searchInput}
                  type="text"
                  placeholder="Search pieces, collections, price…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
              )}
              <button
                className={styles.iconBtn}
                onClick={handleSearchIconClick}
                aria-label={
                  searchOpen && searchQuery.trim()
                    ? "Submit search"
                    : searchOpen
                      ? "Close search"
                      : "Open search"
                }
              >
                {searchOpen && !searchQuery.trim() ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                )}
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
                  <span className={styles.avatarInitials}>
                    {getInitials(user.name)}
                  </span>
                  <span className={styles.avatarOnline} />
                </button>

                {profileOpen && (
                  <div className={styles.profileDropdown}>
                    <div className={styles.profileHeader}>
                      <div className={styles.profileHeaderInfo}>
                        <span className={styles.profileName}>{user.name}</span>
                        <span className={styles.profileMeta}>
                          {user.role === "admin" ? "◆ Admin" : "◆ Member"}
                        </span>
                      </div>
                    </div>
                    <div className={styles.profileDivider} />
                    {[
                      { label: "Profile", to: "/profile" },
                      { label: "My Orders", to: "/my-orders" },
                      { label: "Wishlist", to: "/wishlist" },
                    ].map((item) => (
                      <Link
                        key={item.label}
                        to={item.to}
                        className={styles.profileItem}
                        onClick={() => setProfileOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                    {user.role === "admin" && (
                      <Link
                        to="/admin"
                        className={styles.profileItemAdmin}
                        onClick={() => setProfileOpen(false)}
                      >
                        ◆ Admin Panel
                      </Link>
                    )}
                    <div className={styles.profileDivider} />
                    <button
                      className={styles.profileSignOut}
                      onClick={handleLogout}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className={styles.signInBtn}
                onClick={() => openAuthModal("login")}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                >
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Sign In</span>
              </button>
            )}

            {/* Cart - Now updates in real-time */}
            <Link to="/cart" className={styles.iconBtn} aria-label="Cart">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              >
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              {!isInitialized || syncInProgress ? (
                <span className={styles.badge}>0</span>
              ) : (
                cartItemCount > 0 && (
                  <span className={styles.badge}>{cartItemCount}</span>
                )
              )}
            </Link>

            {/* Wishlist - Now updates in real-time */}
            <Link
              to="/wishlist"
              className={styles.iconBtn}
              aria-label="Wishlist"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              >
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
              {wishlistCount > 0 && (
                <span className={`${styles.badge} ${styles.badgeHeart}`}>
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Hamburger */}
            <button
              className={`${styles.hamburger} ${menuOpen ? styles.hamburgerActive : ""}`}
              onClick={() => setMenuOpen((p) => !p)}
              aria-label="Menu"
            >
              <span />
              <span />
              <span />
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
                <h2 className={styles.drawerHeadline}>
                  Spring
                  <br />
                  <em>Séduction</em>
                </h2>
                <p className={styles.drawerSub}>2025 Resort Collection</p>
                <button
                  onClick={() => {
                    console.log("New arrivals clicked");
                    navigate("/collections/");
                    setDrawerOpen(false);
                  }}
                  className={styles.drawerCta}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  Explore Now
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </div>
            <div className={styles.drawerCategories}>
              {!loadingCategories &&
                activeCategory?.subcategories?.map((sub, si) => (
                  <div
                    key={sub._id}
                    className={styles.drawerCol}
                    style={{ "--col-delay": `${si * 0.06}s` }}
                  >
                    <h3 className={styles.drawerColTitle}>{sub.name}</h3>
                    <ul className={styles.drawerList}>
                      {sub.subcategories && sub.subcategories.length > 0 ? (
                        sub.subcategories.map((item, ii) => (
                          <li
                            key={item._id}
                            style={{
                              "--item-delay": `${si * 0.06 + ii * 0.04}s`,
                            }}
                          >
                            <button
                              onClick={() =>
                                handleCategoryClick(item.slug, item.name)
                              }
                              className={styles.drawerLink}
                            >
                              <span className={styles.drawerLinkDot}>·</span>
                              <span className={styles.drawerLinkText}>
                                {item.name}
                              </span>
                            </button>
                          </li>
                        ))
                      ) : (
                        <li className={styles.drawerEmpty}>
                          <span className={styles.drawerLinkDot}>·</span>
                          <span className={styles.drawerLinkText}>
                            Coming Soon
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                ))}
            </div>
          </div>
          <div className={styles.drawerBottomAccent} />
        </div>

        {drawerOpen && (
          <div className={styles.backdrop} onMouseEnter={handleDrawerLeave} />
        )}
      </nav>

      {/* MOBILE MENU */}
      <div
        className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ""}`}
      >
        <button
          className={styles.mobileCloseBtn}
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className={styles.mobileMenuInner}>
          <div className={styles.mobileMenuLogo}>◆ LUXURIA ◆</div>

          {/* Mobile Search */}
          <div className={styles.mobileSearchWrap}>
            <input
              className={styles.mobileSearchInput}
              type="text"
              placeholder="Search pieces, collections, price…"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.target.value.trim()) {
                  setMenuOpen(false);
                  navigate(
                    `/search?q=${encodeURIComponent(e.target.value.trim())}`,
                  );
                  e.target.value = "";
                }
              }}
            />
            <svg
              className={styles.mobileSearchIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          {!loadingCategories &&
            categories[0]?.subcategories?.map((sub, si) => (
              <div
                key={sub._id}
                className={styles.mobileSection}
                style={{ "--delay": `${si * 0.08}s` }}
              >
                <h4 className={styles.mobileSectionTitle}>{sub.name}</h4>
                <div className={styles.mobileSectionItems}>
                  {sub.subcategories && sub.subcategories.length > 0 ? (
                    sub.subcategories.map((item) => (
                      <button
                        key={item._id}
                        onClick={() => {
                          console.log(
                            `Mobile: Navigating to /collections/${item.slug}`,
                          );
                          navigate(`/collections/${item.slug}`);
                          setMenuOpen(false);
                        }}
                        className={styles.mobileSectionLink}
                      >
                        {item.name}
                      </button>
                    ))
                  ) : (
                    <p className={styles.mobileEmpty}>Coming Soon</p>
                  )}
                </div>
              </div>
            ))}

          <div className={styles.mobileMenuFooter}>
            {isLoggedIn && user ? (
              <div className={styles.mobileUserInfo}>
                <span className={styles.mobileUserName}>{user.name}</span>
                <button
                  className={styles.mobileSignOut}
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                className={styles.mobileSignIn}
                onClick={() => {
                  setMenuOpen(false);
                  openAuthModal("login");
                }}
              >
                Sign In to LUXURIA
              </button>
            )}
            <p className={styles.mobileFooterCities}>
              Paris · Milan · New York · Dubai
            </p>
          </div>
        </div>
      </div>
    </>
  );
}