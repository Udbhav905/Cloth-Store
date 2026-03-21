import React, { useState, useEffect, useRef } from 'react';
import styles from './Navbar.module.css';

const Navbar = ({ onLogout, user, onMenuToggle, sidebarOpen }) => {
  const [visible, setVisible]     = useState(true);
  const [scrolled, setScrolled]   = useState(false);
  const [currentTime, setTime]    = useState(new Date());
  const [searchFocus, setSearchFocus] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setVisible(y < lastScrollY.current || y < 60);
      setScrolled(y > 20);
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const getInitials = () => {
    if (user?.name) return user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return 'A';
  };

  const formatTime = (d) =>
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  const formatDate = (d) =>
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <nav className={`${styles.navbar} ${visible ? styles.navbarVisible : styles.navbarHidden} ${scrolled ? styles.navbarScrolled : ''}`}>
      {/* Top shimmer */}
      <div className={styles.topRule} />

      <div className={styles.navbarInner}>
        {/* ── Left ── */}
        <div className={styles.navLeft}>
          {/* Mobile hamburger */}
          <button
            className={`${styles.hamburger} ${sidebarOpen ? styles.hamburgerOpen : ''}`}
            onClick={onMenuToggle}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>

          {/* Search */}
          {/* <div className={`${styles.searchWrap} ${searchFocus ? styles.searchFocused : ''}`}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M16 16L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search catalogue…"
              className={styles.searchInput}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setSearchFocus(false)}
            />
            <span className={styles.searchShortcut}>⌘K</span>
          </div> */}
        </div>

        {/* ── Centre wordmark ── */}
        <div className={styles.navCentre}>
          <span className={styles.wordmark}>Luxuria</span>
          <span className={styles.wordmarkSub}>Atelier Suite</span>
        </div>

        {/* ── Right ── */}
        <div className={styles.navRight}>
          {/* Clock */}
          <div className={styles.clockWidget}>
            <svg viewBox="0 0 24 24" fill="none" className={styles.clockIcon}>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <div className={styles.clockText}>
              <span className={styles.clockTime}>{formatTime(currentTime)}</span>
              <span className={styles.clockDate}>{formatDate(currentTime)}</span>
            </div>
          </div>

          {/* Divider */}
          <div className={styles.navDivider} />

          {/* Profile */}
          <div className={styles.profile}>
            <div className={styles.profileAvatar}>{getInitials()}</div>
            <div className={styles.profileInfo}>
              <span className={styles.profileName}>{user?.name || 'Admin'}</span>
              <span className={styles.profileRole}>{user?.role || 'Administrator'}</span>
            </div>
          </div>

          {/* Logout */}
          <button className={styles.logoutBtn} onClick={onLogout} title="Sign out">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M16 17L21 12L16 7M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;