/* Components/AppLayout/AppLayout.jsx */
import React, { useState } from "react";
import Sidebar from "../Sidebar/Sidebar";
import styles from "./AppLayout.module.css";

export default function AppLayout({ children, user, onLogout }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className={`${styles.layout} ${sidebarCollapsed ? styles.collapsed : ""}`}>
      <Sidebar
        user={user}
        onLogout={onLogout}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(p => !p)}
      />
      <main className={styles.main}>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}