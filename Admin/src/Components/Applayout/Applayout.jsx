import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Navbar from '../Navbar/navbar';
import styles from './AppLayout.module.css';

const AppLayout = ({ children, user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close sidebar on route change (mobile)
  const handleClose = () => setSidebarOpen(false);
  const handleToggle = () => setSidebarOpen(prev => !prev);

  return (
    <div className={styles.appLayout}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={handleClose}
      />

      {/* Main area — offset by sidebar on desktop */}
      <div className={`${styles.mainArea} ${isMobile ? styles.mainAreaMobile : ''}`}>
        <Navbar
          user={user}
          onLogout={onLogout}
          onMenuToggle={handleToggle}
          sidebarOpen={sidebarOpen}
        />

        {/* Page content below navbar */}
        <main className={styles.pageContent}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;