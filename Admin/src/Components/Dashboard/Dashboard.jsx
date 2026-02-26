import React, { useState, useEffect } from 'react';
import styles from './Dashboard.module.css';

const stats = [
  { title: 'Total Revenue',  value: '$45,678', change: '+12.5%', positive: true,  icon: '◈', sub: 'vs last month' },
  { title: 'Total Orders',   value: '1,234',   change: '+8.2%',  positive: true,  icon: '◻', sub: 'vs last month' },
  { title: 'Products',       value: '567',     change: '+3.1%',  positive: true,  icon: '◇', sub: 'in catalogue' },
  { title: 'Customers',      value: '892',     change: '+15.3%', positive: true,  icon: '◉', sub: 'registered' },
];

const recentOrders = [
  { id: '#LX-1234', customer: 'John Doe',      product: 'Silk Evening Gown',     amount: '$234', status: 'Delivered' },
  { id: '#LX-1235', customer: 'Jane Smith',     product: 'Cashmere Overcoat',     amount: '$567', status: 'Processing' },
  { id: '#LX-1236', customer: 'Robert Johnson', product: 'Merino Wool Blazer',    amount: '$123', status: 'Shipped' },
  { id: '#LX-1237', customer: 'Alice Brûlée',   product: 'Embroidered Shawl',     amount: '$890', status: 'Pending' },
  { id: '#LX-1238', customer: 'Marcus Wei',     product: 'Linen Summer Suit',     amount: '$340', status: 'Delivered' },
];

const statusMeta = {
  Delivered:  { label: 'Delivered',  symbol: '✦' },
  Processing: { label: 'Processing', symbol: '◌' },
  Shipped:    { label: 'Shipped',    symbol: '△' },
  Pending:    { label: 'Pending',    symbol: '◯' },
};

const Counter = ({ target, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0);
  const numeric = parseFloat(target.replace(/[^0-9.]/g, ''));

  useEffect(() => {
    let start = 0;
    const steps = 60;
    const inc = numeric / steps;
    const timer = setInterval(() => {
      start += inc;
      if (start >= numeric) { setCount(numeric); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 18);
    return () => clearInterval(timer);
  }, [numeric]);

  const formatted = target.includes(',')
    ? count.toLocaleString()
    : count.toLocaleString();

  return <>{prefix}{formatted}{suffix}</>;
};

const Dashboard = ({ user }) => {
  const userName = user?.name || 'Admin';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`${styles.dashboard} ${mounted ? styles.mounted : ''}`}>
      {/* ── Welcome ── */}
      <section className={styles.welcome}>
        <div className={styles.welcomeLeft}>
          <span className={styles.welcomeEyebrow}>Atelier Dashboard</span>
          <h1 className={styles.welcomeTitle}>
            નમસ્તે ,&nbsp;<em>{userName}</em>
          </h1>
          <p className={styles.welcomeSub}>Here is your store's performance at a glance.</p>
        </div>
        <div className={styles.welcomeRight}>
          <div className={styles.datePill}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </section>

      {/* ── Stats Grid ── */}
      <section className={styles.statsGrid}>
        {stats.map((s, i) => (
          <div
            key={i}
            className={styles.statCard}
            style={{ animationDelay: `${0.1 + i * 0.08}s` }}
          >
            {/* Background shimmer */}
            <div className={styles.statShimmer} />

            <div className={styles.statTop}>
              <span className={styles.statIcon}>{s.icon}</span>
              <span className={`${styles.statBadge} ${s.positive ? styles.positive : styles.negative}`}>
                {s.change}
              </span>
            </div>

            <div className={styles.statValue}>
              {s.value.startsWith('$') ? (
                <Counter target={s.value.replace('$', '')} prefix="$" />
              ) : (
                <Counter target={s.value} />
              )}
            </div>

            <div className={styles.statMeta}>
              <span className={styles.statTitle}>{s.title}</span>
              <span className={styles.statSub}>{s.sub}</span>
            </div>

            <div className={styles.statRule} />
          </div>
        ))}
      </section>

      {/* ── Bottom row ── */}
      <section className={styles.bottomRow}>
        {/* Recent Orders */}
        <div className={styles.ordersPanel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Recent Orders</h2>
              <p className={styles.panelSub}>Latest transactions across all channels</p>
            </div>
            <button className={styles.viewAllBtn}>View All →</button>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Client</th>
                  <th className={styles.hideTablet}>Item</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o, i) => (
                  <tr
                    key={i}
                    className={styles.tableRow}
                    style={{ animationDelay: `${0.5 + i * 0.07}s` }}
                  >
                    <td className={styles.orderId}>{o.id}</td>
                    <td className={styles.customer}>{o.customer}</td>
                    <td className={`${styles.product} ${styles.hideTablet}`}>{o.product}</td>
                    <td className={styles.amount}>{o.amount}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[o.status.toLowerCase()]}`}>
                        <span className={styles.statusDot}>{statusMeta[o.status]?.symbol}</span>
                        {statusMeta[o.status]?.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Stats Side Panel */}
        <div className={styles.sidePanel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Performance</h2>
          </div>

          <div className={styles.perfList}>
            {[
              { label: 'Conversion Rate', value: 68, display: '68%' },
              { label: 'Avg Order Value', value: 82, display: '$312' },
              { label: 'Return Rate',     value: 12, display: '12%' },
              { label: 'Satisfaction',    value: 94, display: '94%' },
            ].map((p, i) => (
              <div key={i} className={styles.perfItem} style={{ animationDelay: `${0.6 + i * 0.08}s` }}>
                <div className={styles.perfTop}>
                  <span className={styles.perfLabel}>{p.label}</span>
                  <span className={styles.perfValue}>{p.display}</span>
                </div>
                <div className={styles.perfTrack}>
                  <div
                    className={styles.perfFill}
                    style={{ '--pct': `${p.value}%`, animationDelay: `${0.8 + i * 0.1}s` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className={styles.sidePanelDivider} />

          <div className={styles.quickActions}>
            <p className={styles.qaTitle}>Quick Actions</p>
            {['Add Product', 'View Reports', 'Manage Orders'].map((a, i) => (
              <button key={i} className={styles.qaBtn}>{a} →</button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;