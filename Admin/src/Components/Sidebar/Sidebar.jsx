/* Components/Sidebar/Sidebar.jsx */
import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./Sidebar.module.css";

const NAV_ITEMS = [
  {
    path: "/dashboard", label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    path: "/orders", label: "Orders",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/>
        <line x1="9" y1="12" x2="15" y2="12"/>
        <line x1="9" y1="16" x2="13" y2="16"/>
      </svg>
    ),
  },
  {
    path: "/products", label: "Products",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>
    ),
  },
  {
    path: "/categories", label: "Categories",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M3 6h18M3 12h18M3 18h18"/>
      </svg>
    ),
  },
  {
    path: "/delivery-partners", label: "Delivery",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="1" y="3" width="15" height="13" rx="1"/>
        <path d="M16 8h4l3 3v5h-7V8z"/>
        <circle cx="5.5" cy="18.5" r="2.5"/>
        <circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
  },
  {
    path: "/analytics", label: "Analytics",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6"  y1="20" x2="6"  y2="14"/>
      </svg>
    ),
  },
];

export default function Sidebar({
  user,
  onLogout,
  collapsed,
  onToggle,
  mobileOpen    = false,
  isMobile      = false,
  onMobileClose = () => {},
}) {
  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
    : "A";

  /* On mobile, clicking a nav link closes the drawer */
  const handleNavClick = () => {
    if (isMobile) onMobileClose();
  };

  return (
    <aside className={[
      styles.sidebar,
      collapsed && !isMobile ? styles.collapsed : "",
      isMobile ? styles.mobileSidebar : "",
      isMobile && mobileOpen ? styles.mobileOpen : "",
    ].filter(Boolean).join(" ")}>

      {/* ── Logo area ── */}
      <div className={styles.logoArea}>
        {!collapsed && (
          <div className={styles.logoText}>
            <span className={styles.logoDiamond}>◆</span>
            <div className={styles.logoWords}>
              <span className={styles.logoName}>LUXURIA</span>
              <span className={styles.logoSub}>ADMIN</span>
            </div>
          </div>
        )}
        {collapsed && !isMobile && <span className={styles.logoDiamond}>◆</span>}

        {/* Desktop: toggle collapse | Mobile: close button */}
        {isMobile ? (
          <button className={styles.closeBtn} onClick={onMobileClose} aria-label="Close menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        ) : (
          <button className={styles.toggleBtn} onClick={onToggle} title={collapsed ? "Expand" : "Collapse"}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              {collapsed
                ? <polyline points="9 18 15 12 9 6"/>
                : <polyline points="15 18 9 12 15 6"/>}
            </svg>
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
            }
            onClick={handleNavClick}
            title={collapsed && !isMobile ? item.label : undefined}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {(!collapsed || isMobile) && (
              <span className={styles.navLabel}>{item.label}</span>
            )}
            {/* Active indicator dot on mobile */}
            {isMobile && (
              <svg className={styles.navArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── User area ── */}
      <div className={styles.userArea}>
        <div className={styles.avatar}>{initials}</div>
        {(!collapsed || isMobile) && (
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name || "Admin"}</span>
            <span className={styles.userRole}>{user?.role || "admin"}</span>
          </div>
        )}
        <button className={styles.logoutBtn} onClick={onLogout} title="Sign out">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </aside>
  );
}