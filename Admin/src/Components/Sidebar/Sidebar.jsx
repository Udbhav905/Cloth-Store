import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

const menuItems = [
  { path: '/dashboard',          icon: '◈', label: 'Dashboard',         sub: 'Overview' },
  { path: '/categories',         icon: '⬡', label: 'Collections',       sub: 'Manage' },
  { path: '/products',           icon: '◇', label: 'Products',           sub: 'Catalogue' },
  { path: '/orders',             icon: '◻', label: 'Orders',             sub: 'Fulfil' },
  { path: '/delivery-partners',  icon: '△', label: 'Couriers',           sub: 'Partners' },
  { path: '/analytics',          icon: '◉', label: 'Analytics',          sub: 'Insights' },
];

const Sidebar = ({ isOpen, onClose }) => {
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // For desktop: expand on hover. For mobile: controlled by prop.
  const isVisible = isMobile ? isOpen : true;
  const isExpanded = isMobile ? isOpen : expanded;

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div className={styles.overlay} onClick={onClose} />
      )}

      <aside
        className={`
          ${styles.sidebar}
          ${isExpanded ? styles.sidebarExpanded : styles.sidebarCollapsed}
          ${isMobile ? styles.sidebarMobile : ''}
          ${isMobile && isOpen ? styles.sidebarMobileOpen : ''}
        `}
        onMouseEnter={() => !isMobile && setExpanded(true)}
        onMouseLeave={() => !isMobile && setExpanded(false)}
      >
        {/* Top gold rule */}
        <div className={styles.topRule} />

        {/* Header / Logo */}
        <div className={styles.sidebarHeader}>
          <div className={styles.logoMark}>
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.logoSvg}>
              <path d="M16 4C13 4 11 6.5 11 9C11 11.5 13 14 16 14C19 14 21 11.5 21 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M16 14V28" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M12 19L16 14L20 19" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 9H26" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>

          <div className={`${styles.logoText} ${isExpanded ? styles.logoTextVisible : ''}`}>
            <span className={styles.brandName}>Luxuria</span>
            <span className={styles.brandSub}>Atelier</span>
          </div>

          {/* Mobile close */}
          {isMobile && (
            <button className={styles.mobileClose} onClick={onClose}>×</button>
          )}
        </div>

        {/* Divider */}
        <div className={styles.headerDivider} />

        {/* Nav */}
        <nav className={styles.sidebarNav}>
          {menuItems.map((item, i) => (
            <NavLink
              key={i}
              to={item.path}
              onClick={isMobile ? onClose : undefined}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <div className={`${styles.navTextBlock} ${isExpanded ? styles.navTextVisible : ''}`}>
                <span className={styles.navLabel}>{item.label}</span>
                <span className={styles.navSub}>{item.sub}</span>
              </div>
              <span className={`${styles.activeBar} `} />
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className={styles.sidebarFooter}>
          <div className={styles.footerDivider} />
          <div className={styles.storageRow}>
            <div className={styles.storageTrack}>
              <div className={styles.storageFill} style={{ width: '65%' }} />
            </div>
            <div className={`${styles.storageLabel} ${isExpanded ? styles.storageLabelVisible : ''}`}>
              6.5 <span>/ 10 GB</span>
            </div>
          </div>
          <div className={`${styles.versionTag} ${isExpanded ? styles.versionTagVisible : ''}`}>
            v2.4.1 — Maison Suite
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;