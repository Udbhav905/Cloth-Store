import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';

/* ─────────────────────────────────────────────
   Animated counter
───────────────────────────────────────────── */
const Counter = ({ target, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0);
  const numeric = parseFloat(String(target).replace(/[^0-9.]/g, '')) || 0;

  useEffect(() => {
    if (numeric === 0) { setCount(0); return; }
    let start = 0;
    const steps = 60;
    const inc   = numeric / steps;
    const timer = setInterval(() => {
      start += inc;
      if (start >= numeric) { setCount(numeric); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 18);
    return () => clearInterval(timer);
  }, [numeric]);

  return <>{prefix}{count.toLocaleString()}{suffix}</>;
};

/* ─────────────────────────────────────────────
   Skeleton loaders
───────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className={`${styles.statCard} ${styles.skeletonCard}`}>
    <div className={styles.skLine} style={{ width: '40%', height: 10 }} />
    <div className={styles.skLine} style={{ width: '55%', height: 30, margin: '14px 0 10px' }} />
    <div className={styles.skLine} style={{ width: '70%', height: 10 }} />
  </div>
);

const SkeletonRow = () => (
  <tr>
    {[80, 110, 150, 65, 85].map((w, i) => (
      <td key={i} style={{ padding: '14px 12px' }}>
        <div className={styles.skLine} style={{ width: w, height: 11 }} />
      </td>
    ))}
  </tr>
);

/* ─────────────────────────────────────────────
   Status badge config
───────────────────────────────────────────── */
const STATUS_META = {
  delivered:        { label: 'Delivered',        symbol: '✦', cls: 'delivered'  },
  processing:       { label: 'Processing',       symbol: '◌', cls: 'processing' },
  shipped:          { label: 'Shipped',          symbol: '△', cls: 'shipped'    },
  pending:          { label: 'Pending',          symbol: '◯', cls: 'pending'    },
  confirmed:        { label: 'Confirmed',        symbol: '✓', cls: 'confirmed'  },
  out_for_delivery: { label: 'Out for Delivery', symbol: '⟳', cls: 'shipped'    },
  cancelled:        { label: 'Cancelled',        symbol: '✕', cls: 'cancelled'  },
  returned:         { label: 'Returned',         symbol: '↩', cls: 'cancelled'  },
  refunded:         { label: 'Refunded',         symbol: '↺', cls: 'cancelled'  },
};

/* ─────────────────────────────────────────────
   Stat card config — route added to each card
───────────────────────────────────────────── */
const STAT_CONFIG = [
  { key: 'revenue',   title: 'Total Revenue', icon: '◈', sub: 'vs last month', prefix: '₹', route: '/analytics' },
  { key: 'orders',    title: 'Total Orders',  icon: '◻', sub: 'vs last month', prefix: '',  route: '/orders'    },
  { key: 'products',  title: 'Products',      icon: '◇', sub: 'in catalogue',  prefix: '',  route: '/products'  },
  { key: 'customers', title: 'Customers',     icon: '◉', sub: 'registered',    prefix: '',  route: '/customers' },
];

/* ─────────────────────────────────────────────
   Quick actions — each wired to a real route
───────────────────────────────────────────── */
const QUICK_ACTIONS = [
  { label: 'Add Product',   route: '/products'  },
  { label: 'View Reports',  route: '/analytics' },
  { label: 'Manage Orders', route: '/orders'    },
];

/* ─────────────────────────────────────────────
   Dashboard Component
───────────────────────────────────────────── */
const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const userName = user?.name || 'Admin';

  const [mounted,         setMounted]         = useState(false);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [stats,           setStats]           = useState(null);
  const [recentOrders,    setRecentOrders]    = useState([]);
  const [statusBreakdown, setStatusBreakdown] = useState({});

  /* mount animation */
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  /* fetch data — sends both cookie and Bearer token */
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/admin/dashboard', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to load dashboard');
      }
      const data = await res.json();
      setStats(data.stats);
      setRecentOrders(data.recentOrders || []);
      setStatusBreakdown(data.orderStatusBreakdown || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  /* derived metrics */
  const avgOrderValue  = stats
    ? Math.round((stats.revenue.value || 0) / Math.max(stats.orders.value, 1))
    : 0;
  const totalOrders    = stats?.orders.value || 1;
  const deliveredCount = statusBreakdown['delivered'] || 0;
  const cancelledCount = statusBreakdown['cancelled'] || 0;
  const conversionRate = Math.round((deliveredCount / totalOrders) * 100);
  const returnRate     = Math.round((cancelledCount  / totalOrders) * 100);

  const perfMetrics = [
    { label: 'Delivery Rate',   value: conversionRate,                  display: `${conversionRate}%`                },
    { label: 'Avg Order Value', value: Math.min(avgOrderValue / 100, 100), display: `₹${avgOrderValue.toLocaleString()}` },
    { label: 'Cancellation',    value: returnRate,                      display: `${returnRate}%`                    },
    { label: 'Satisfaction',    value: 94,                              display: '94%'                               },
  ];

  return (
    <div className={`${styles.dashboard} ${mounted ? styles.mounted : ''}`}>

      {/* ── Welcome ── */}
      <section className={styles.welcome}>
        <div className={styles.welcomeLeft}>
          <span className={styles.welcomeEyebrow}>Atelier Dashboard</span>
          <h1 className={styles.welcomeTitle}>
            નમસ્તે,&nbsp;<em>{userName}</em>
          </h1>
          <p className={styles.welcomeSub}>Here is your store's performance at a glance.</p>
        </div>
        <div className={styles.welcomeRight}>
          <div className={styles.datePill}>
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </div>
          <button
            className={styles.refreshBtn}
            onClick={fetchDashboard}
            disabled={loading}
          >
            <span className={loading ? styles.spinning : ''}>↺</span>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </section>

      {/* ── Error banner ── */}
      {error && (
        <div className={styles.errorBanner}>
          ⚠ {error}
          <button onClick={fetchDashboard} className={styles.retryBtn}>Retry</button>
        </div>
      )}

      {/* ── Stats Grid — each card navigates to its page ── */}
      <section className={styles.statsGrid}>
        {loading
          ? STAT_CONFIG.map((_, i) => <SkeletonCard key={i} />)
          : STAT_CONFIG.map((s, i) => {
              const stat = stats?.[s.key];
              return (
                <div
                  key={i}
                  className={styles.statCard}
                  style={{ animationDelay: `${0.1 + i * 0.08}s`, cursor: 'pointer' }}
                  onClick={() => navigate(s.route)}
                  title={`Go to ${s.title}`}
                >
                  <div className={styles.statShimmer} />
                  <div className={styles.statTop}>
                    <span className={styles.statIcon}>{s.icon}</span>
                    <span className={`${styles.statBadge} ${stat?.positive ? styles.positive : styles.negative}`}>
                      {stat?.change ?? '—'}
                    </span>
                  </div>
                  <div className={styles.statValue}>
                    <Counter target={stat?.value ?? 0} prefix={s.prefix} />
                  </div>
                  <div className={styles.statMeta}>
                    <span className={styles.statTitle}>{s.title}</span>
                    <span className={styles.statSub}>{s.sub}</span>
                  </div>
                  <div className={styles.statRule} />
                </div>
              );
            })}
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
            {/* View All → navigates to /orders */}
            <button
              className={styles.viewAllBtn}
              onClick={() => navigate('/orders')}
            >
              View All →
            </button>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Client</th>
                  <th className={styles.hideTablet}>Item</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  : recentOrders.length === 0
                    ? (
                      <tr>
                        <td colSpan={5} className={styles.emptyCell}>
                          No orders yet — they will appear here once customers start ordering.
                        </td>
                      </tr>
                    )
                    : recentOrders.map((o, i) => {
                        const st = STATUS_META[o.orderStatus] || { label: o.orderStatus, symbol: '·', cls: 'pending' };
                        return (
                          <tr
                            key={o._id}
                            className={styles.tableRow}
                            style={{ animationDelay: `${0.5 + i * 0.07}s`, cursor: 'pointer' }}
                            onClick={() => navigate('/orders')}
                            title="View orders"
                          >
                            <td className={styles.orderId}>
                              {o.orderNumber || `#${o._id?.toString().slice(-6).toUpperCase()}`}
                            </td>
                            <td className={styles.customer}>
                              {o.userId?.name || 'Guest'}
                            </td>
                            <td className={`${styles.product} ${styles.hideTablet}`}>
                              {o.items?.[0]?.productName || '—'}
                              {o.items?.length > 1 ? ` +${o.items.length - 1} more` : ''}
                            </td>
                            <td className={styles.amount}>
                              ₹{o.totalAmount?.toLocaleString('en-IN') || '0'}
                            </td>
                            <td>
                              <span className={`${styles.statusBadge} ${styles[st.cls]}`}>
                                <span className={styles.statusDot}>{st.symbol}</span>
                                {st.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Panel */}
        <div className={styles.sidePanel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Performance</h2>
          </div>

          <div className={styles.perfList}>
            {perfMetrics.map((p, i) => (
              <div key={i} className={styles.perfItem} style={{ animationDelay: `${0.6 + i * 0.08}s` }}>
                <div className={styles.perfTop}>
                  <span className={styles.perfLabel}>{p.label}</span>
                  <span className={styles.perfValue}>{loading ? '—' : p.display}</span>
                </div>
                <div className={styles.perfTrack}>
                  <div
                    className={styles.perfFill}
                    style={{
                      '--pct': loading ? '0%' : `${Math.min(p.value, 100)}%`,
                      animationDelay: `${0.8 + i * 0.1}s`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className={styles.sidePanelDivider} />

          {/* Order Status Breakdown — clicking navigates to /orders */}
          {!loading && Object.keys(statusBreakdown).length > 0 && (
            <div className={styles.statusBreakdown}>
              <p className={styles.qaTitle}>Order Status</p>
              {Object.entries(statusBreakdown).map(([status, count]) => {
                const meta = STATUS_META[status];
                if (!meta) return null;
                return (
                  <div
                    key={status}
                    className={styles.statusBreakdownRow}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate('/orders')}
                    title={`View ${meta.label} orders`}
                  >
                    <span className={`${styles.statusDot} ${styles[meta.cls]}`}>{meta.symbol}</span>
                    <span className={styles.statusBreakdownLabel}>{meta.label}</span>
                    <span className={styles.statusBreakdownCount}>{count}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className={styles.sidePanelDivider} />

          {/* Quick Actions — all wired to real routes */}
          <div className={styles.quickActions}>
            <p className={styles.qaTitle}>Quick Actions</p>
            {QUICK_ACTIONS.map((a, i) => (
              <button
                key={i}
                className={styles.qaBtn}
                onClick={() => navigate(a.route)}
              >
                {a.label} →
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;