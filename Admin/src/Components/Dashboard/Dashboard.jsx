import React from 'react';
import Navbar from '../Navbar/navbar.jsx';
import Sidebar from '../Sidebar/Sidebar';
import styles from './Dashboard.module.css';

const Dashboard = ({ user, onLogout }) => {
  // Use user data from props
  const userName = user?.name || 'Admin';
  const userRole = user?.role || 'Store Manager';

  const stats = [
    { title: 'Total Sales', value: '$45,678', change: '+12.5%', icon: '💰' },
    { title: 'Total Orders', value: '1,234', change: '+8.2%', icon: '📦' },
    { title: 'Products', value: '567', change: '+3.1%', icon: '👕' },
    { title: 'Customers', value: '892', change: '+15.3%', icon: '👥' },
  ];

  const recentOrders = [
    { id: '#1234', customer: 'John Doe', amount: '$234', status: 'Delivered' },
    { id: '#1235', customer: 'Jane Smith', amount: '$567', status: 'Processing' },
    { id: '#1236', customer: 'Bob Johnson', amount: '$123', status: 'Shipped' },
    { id: '#1237', customer: 'Alice Brown', amount: '$890', status: 'Pending' },
  ];

  return (
    <div className={styles.dashboardContainer}>
      <Navbar onLogout={onLogout} user={user} />
      <Sidebar />
      
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <div className={styles.welcomeSection}>
            <h1 className={styles.welcomeTitle}>Welcome back, {userName}!</h1>
            <p className={styles.welcomeSubtitle}>Here's what's happening with your store today.</p>
          </div>

          <div className={styles.statsGrid}>
            {stats.map((stat, index) => (
              <div key={index} className={styles.statCard}>
                <div className={styles.statIcon}>{stat.icon}</div>
                <div className={styles.statInfo}>
                  <h3 className={styles.statTitle}>{stat.title}</h3>
                  <p className={styles.statValue}>{stat.value}</p>
                  <span className={`${styles.statChange} ${stat.change.startsWith('+') ? styles.positive : styles.negative}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.recentOrdersSection}>
            <h2 className={styles.sectionTitle}>Recent Orders</h2>
            <div className={styles.ordersTable}>
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, index) => (
                    <tr key={index}>
                      <td>{order.id}</td>
                      <td>{order.customer}</td>
                      <td>{order.amount}</td>
                      <td>
                        <span className={`${styles.status} ${styles[order.status.toLowerCase()]}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;