import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  const [isHovered, setIsHovered] = useState(false);

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/categories', icon: '🏷️', label: 'Categories' },
    { path: '/products', icon: '👕', label: 'Products' },
    { path: '/orders', icon: '📦', label: 'Orders' },
    { path: '/delivery-partners', icon: '🚚', label: 'Delivery Partners' },
    { path: '/analytics', icon: '📈', label: 'Analytics' },
  ];

  return (
    <>
      <aside 
        className={`${styles.sidebar} ${isHovered ? styles.sidebarExpanded : styles.sidebarCollapsed}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.logoContainer}>
            <div className={styles.logoWrapper}>
              <span className={styles.logoIcon}>👕</span>
            </div>
            {isHovered && (
              <span className={styles.logoText}>ClothStore</span>
            )}
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          {menuItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) => 
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {isHovered && (
                <span className={styles.navLabel}>{item.label}</span>
              )}
              {isHovered && (
                <span className={styles.navBadge}>●</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.storageInfo}>
            <div className={styles.storageBar}>
              <div className={styles.storageUsed} style={{ width: '65%' }}></div>
            </div>
            {isHovered && (
              <div className={styles.storageText}>
                <span>Storage: 6.5GB / 10GB</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className={`${styles.mainContent} ${isHovered ? styles.mainContentShifted : ''}`}>
        {/* Main content will be rendered here */}
      </div>
    </>
  );
};

export default Sidebar;