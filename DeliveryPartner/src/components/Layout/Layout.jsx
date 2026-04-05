import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import './Layout.css';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const partner = JSON.parse(localStorage.getItem('partnerData') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('partnerToken');
    localStorage.removeItem('partnerData');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/orders', label: 'My Deliveries', icon: '🚚' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🚚</span>
            <span className="logo-text">LUXURIA</span>
            <span className="logo-sub">Delivery Partner</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="partner-info">
            <div className="partner-avatar">
              {partner.name?.charAt(0)?.toUpperCase() || 'D'}
            </div>
            <div className="partner-details">
              <p className="partner-name">{partner.name || 'Delivery Partner'}</p>
              <p className="partner-role">Delivery Executive</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;