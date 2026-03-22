/* Components/AppLayout/AppLayout.jsx */
import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../Sidebar/Sidebar";
import styles from "./AppLayout.module.css";

export default function AppLayout({ children, user, onLogout }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  /* Mobile: drawer open/closed (separate from desktop collapse) */
  const [mobileOpen,       setMobileOpen]       = useState(false);
  /* Track if we're on mobile */
  const [isMobile,         setIsMobile]         = useState(false);

  /* Detect viewport */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  /* Lock body scroll when mobile drawer is open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  /* Close drawer on ESC */
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const handleToggle = useCallback(() => {
    if (isMobile) setMobileOpen(p => !p);
    else          setSidebarCollapsed(p => !p);
  }, [isMobile]);

  return (
    <div className={`${styles.layout} ${sidebarCollapsed && !isMobile ? styles.collapsed : ""}`}>

      {/* ── Mobile backdrop ── */}
      {isMobile && (
        <div
          className={`${styles.mobileBackdrop} ${mobileOpen ? styles.mobileBackdropOpen : ""}`}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <Sidebar
        user={user}
        onLogout={onLogout}
        collapsed={isMobile ? false : sidebarCollapsed}
        onToggle={handleToggle}
        mobileOpen={mobileOpen}
        isMobile={isMobile}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* ── Main ── */}
      <main className={styles.main}>
        {/* Mobile top bar */}
        {isMobile && (
          <div className={styles.mobileTopBar}>
            <button
              className={styles.mobileMenuBtn}
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <span/><span/><span/>
            </button>
            <span className={styles.mobileTopLogo}>◆ LUXURIA</span>
            <div className={styles.mobileTopUser}>
              {user?.name?.split(" ").slice(0,2).map(n=>n[0]).join("").toUpperCase() || "A"}
            </div>
          </div>
        )}

        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}