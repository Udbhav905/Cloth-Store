import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

/* ─────────────────────────────────────────────
   FOOTER DATA - Updated routes to match your app
───────────────────────────────────────────── */
const LINKS = [
  {
    heading: "Collections",
    items: [
      { label: "Mens",    to: "/collections/men" },
      { label: "Women Suiting", to: "/collections/women" },
      { label: "Sales",      to: "/collections/sale" },
      // { label: "Bridal Couture",   to: "/collections/accessories" },
      // { label: "Cashmere Knits",   to: "/collections/cashmere-knits" },
      { label: "Accessories",      to: "/collections/accessories" },
    ],
  },
  // {
  //   heading: "Maison",
  //   items: [
  //     { label: "Our Heritage",   to: "/heritage" },
  //     { label: "Atelier",        to: "/atelier" },
  //     { label: "Sustainability", to: "/sustainability" },
  //     { label: "Careers",        to: "/careers" },
  //     { label: "Press",          to: "/press" },
  //   ],
  // },
  {
    heading: "Client Services",
    items: [
      { label: "My Orders",         to: "/my-orders" },
      { label: "Wishlist",          to: "/wishlist" },
      { label: "Profile",           to: "/profile" },
      { label: "Size Guide",        to: "/size-guide" },
      { label: "Shipping & Returns",to: "/shipping" },
      { label: "Care Instructions", to: "/care" },
      { label: "Contact Us",        to: "/contact" },
    ],
  },
];

const SOCIALS = [
  {
    name: "Instagram",
    href: "https://instagram.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: "Pinterest",
    href: "https://pinterest.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.428 1.808-2.428.852 0 1.265.64 1.265 1.408 0 .858-.546 2.14-.828 3.33-.236.995.499 1.806 1.476 1.806 1.772 0 3.138-1.868 3.138-4.566 0-2.386-1.716-4.054-4.162-4.054-2.833 0-4.498 2.125-4.498 4.322 0 .856.33 1.772.741 2.272a.3.3 0 01.069.284l-.276 1.126c-.044.18-.146.218-.336.131-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.967-.527-2.292-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.522 0 10-4.477 10-10S17.522 2 12 2z" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    href: "https://tiktok.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
      </svg>
    ),
  },
  {
    name: "X / Twitter",
    href: "https://x.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M4 4l16 16M4 20L20 4" />
      </svg>
    ),
  },
];

/* ─────────────────────────────────────────────
   INTERSECTION HOOK
───────────────────────────────────────────── */
function useInView(threshold = 0.08) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─────────────────────────────────────────────
   MAIN FOOTER
───────────────────────────────────────────── */
export default function Footer() {
  const [footerRef, inView] = useInView(0.05);
  const [email, setEmail]   = useState("");
  const [subState, setSubState] = useState("idle"); // idle | loading | done | error
  const [showTop, setShowTop]   = useState(false);

  /* Show scroll-to-top after scrolling down */
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    // Use Lenis if available for smooth scroll
    if (window.lenis) {
      window.lenis.scrollTo(0, { duration: 0.8 });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  /* Newsletter submit */
  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim() || subState !== "idle") return;
    setSubState("loading");
    // Simulate API call
    setTimeout(() => {
      setSubState("done");
      setEmail("");
      // Reset after 3 seconds
      setTimeout(() => setSubState("idle"), 3000);
    }, 1400);
  };

  return (
    <footer className={styles.footer} ref={footerRef}>

      {/* ── Top gold divider ── */}
      <div className={styles.topDivider}>
        <span className={styles.topDividerLine} />
        <span className={styles.topDividerDiamond}>◆</span>
        <span className={styles.topDividerLine} />
      </div>

      {/* ══════════════════════════════
          NEWSLETTER BAND
      ══════════════════════════════ */}
      <div className={`${styles.newsletter} ${inView ? styles.newsletterIn : ""}`}>
        <div className={styles.newsletterInner}>
          <div className={styles.newsletterLeft}>
            <span className={styles.nlEyebrow}>
              <span className={styles.nlEyebrowDash} />
              Private Access
            </span>
            <h2 className={styles.nlTitle}>
              Enter the<br /><em>Inner Circle</em>
            </h2>
          </div>
          <div className={styles.newsletterRight}>
            <p className={styles.nlDesc}>
              First access to new arrivals, private sales, and invitations
              to exclusive LUXURIA events worldwide.
            </p>
            <form className={styles.nlForm} onSubmit={handleSubscribe}>
              <div className={`${styles.nlInputWrap} ${subState === "done" ? styles.nlInputDone : ""}`}>
                {subState === "done" ? (
                  <span className={styles.nlSuccess}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Welcome to the Inner Circle
                  </span>
                ) : (
                  <>
                    <input
                      type="email"
                      className={styles.nlInput}
                      placeholder="Your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      className={`${styles.nlBtn} ${subState === "loading" ? styles.nlBtnLoading : ""}`}
                      disabled={subState !== "idle"}
                    >
                      {subState === "loading" ? (
                        <span className={styles.nlSpinner} />
                      ) : (
                        <>
                          <span>Subscribe</span>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
              <p className={styles.nlPrivacy}>
                By subscribing you agree to our Privacy Policy. Unsubscribe anytime.
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className={styles.midDivider} />

      {/* ══════════════════════════════
          MAIN FOOTER BODY
      ══════════════════════════════ */}
      <div className={`${styles.body} ${inView ? styles.bodyIn : ""}`}>

        {/* Brand column */}
        <div className={styles.brandCol}>
          <Link to="/" className={styles.brandLogo}>
            <span className={styles.brandDiamond}>◆</span>
            <span className={styles.brandName}>LUXURIA</span>
            <span className={styles.brandDiamond}>◆</span>
          </Link>
          <p className={styles.brandTagline}>
            Haute Couture · Est. MMXXIV
          </p>
          <p className={styles.brandDesc}>
            Crafted for those who understand that true luxury is not
            purchased — it is recognised.
          </p>

          {/* Socials */}
          <div className={styles.socials}>
            {SOCIALS.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialBtn}
                aria-label={s.name}
              >
                {s.icon}
              </a>
            ))}
          </div>

          {/* Awards / Trust badges */}
          <div className={styles.awards}>
            {["Carbon Neutral", "B Corp", "Made in Italy"].map((a) => (
              <span key={a} className={styles.awardBadge}>
                <span className={styles.awardDot}>◆</span>
                {a}
              </span>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {LINKS.map((col, ci) => (
          <div
            key={col.heading}
            className={styles.linkCol}
            style={{ "--ci": ci }}
          >
            <h4 className={styles.colHeading}>{col.heading}</h4>
            <ul className={styles.colList}>
              {col.items.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className={styles.colLink}>
                    <span className={styles.colLinkDot}>·</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Contact column */}
        <div className={styles.contactCol} style={{ "--ci": 3 }}>
          <h4 className={styles.colHeading}>Find Us</h4>
          <div className={styles.contactList}>
            {[
              { city: "Nadiad", addr: "DDU,Collage Road" },
              { city: "NAGPUR",  addr: "WHITE HOUSE" },
              // { city: "BOTAD",  addr: "NEAR VARIYADEVI TEMPLE" },
            ].map((loc) => (
              <div key={loc.city} className={styles.contactItem}>
                <span className={styles.contactCity}>{loc.city}</span>
                <span className={styles.contactAddr}>{loc.addr}</span>
              </div>
            ))}
            <div className={styles.contactItem}>
              <span className={styles.contactCity}>Nadiad</span>
              <span className={styles.contactAddr}>+8128049281</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className={`${styles.bottomBar} ${inView ? styles.bottomBarIn : ""}`}>
        <div className={styles.bottomLeft}>
          <span>© {new Date().getFullYear()} LUXURIA Maison. All rights reserved.</span>
        </div>
        <div className={styles.bottomCenter}>
          <span className={styles.bottomDiamond}>◆ LUXURIA ◆</span>
        </div>
        <div className={styles.bottomRight}>
          <Link to="/privacy-policy" className={styles.bottomLink}>Privacy Policy</Link>
          <span className={styles.bottomSep}>·</span>
          <Link to="/terms-of-use" className={styles.bottomLink}>Terms of Use</Link>
          <span className={styles.bottomSep}>·</span>
          <Link to="/cookie-settings" className={styles.bottomLink}>Cookie Settings</Link>
        </div>
      </div>

      {/* ── Scroll to top ── */}
      <button
        className={`${styles.scrollTop} ${showTop ? styles.scrollTopVisible : ""}`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      </button>

    </footer>
  );
}