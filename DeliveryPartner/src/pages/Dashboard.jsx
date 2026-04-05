import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import API_BASE_URL from '../config/api';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState(true);
  const [authError, setAuthError] = useState(false);

  const getAuthConfig = () => {
    const token = localStorage.getItem('partnerToken');
    if (!token) {
      setAuthError(true);
      return null;
    }
    return {
      headers: { 
        Authorization: `Bearer ${token}`
      }
    };
  };

  const fetchStats = async () => {
    const config = getAuthConfig();
    if (!config) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/delivery-partner/stats`, config);
      setStats(response.data.data);
    } catch (error) {
      console.error('Stats error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        // Don't redirect immediately, just show error
        toast.error('Session expired. Please login again.');
        setAuthError(true);
      }
    }
  };

  const fetchOrders = async () => {
    const config = getAuthConfig();
    if (!config) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/delivery-partner/orders`, config);
      setRecentOrders(response.data.data.slice(0, 5));
    } catch (error) {
      console.error('Orders error:', error.response?.data || error.message);
      if (error.response?.status !== 401) {
        toast.error('Failed to fetch orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    const config = getAuthConfig();
    if (!config) return;
    
    try {
      await axios.put(`${API_BASE_URL}/api/delivery-partner/availability`, 
        { isAvailable: !availability }, 
        config
      );
      setAvailability(!availability);
      toast.success(`You are now ${!availability ? 'Available' : 'Offline'}`);
    } catch (error) {
      toast.error('Failed to update availability');
    }
  };

  useEffect(() => {
    // Check token on mount
    const token = localStorage.getItem('partnerToken');
    if (!token) {
      setAuthError(true);
      setLoading(false);
      return;
    }
    
    fetchStats();
    fetchOrders();
  }, []);

  // Only redirect if authError is true and user clicks logout or after delay
  useEffect(() => {
    if (authError) {
      const timer = setTimeout(() => {
        localStorage.removeItem('partnerToken');
        localStorage.removeItem('partnerData');
        navigate('/login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [authError, navigate]);

  if (authError) {
    return (
      <div className="dashboard">
        <div className="error-container">
          <div className="error-icon">🔒</div>
          <h2>Session Expired</h2>
          <p>Please login again to continue.</p>
          <button onClick={() => navigate('/login')} className="login-redirect-btn">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Deliveries', value: stats?.totalDeliveries || 0, icon: '📦', color: '#c9a84c' },
    { label: 'Pending Deliveries', value: stats?.pendingDeliveries || 0, icon: '⏳', color: '#f59e0b' },
    { label: 'Completed Today', value: stats?.completedToday || 0, icon: '✅', color: '#58d68d' },
    { label: 'Total Earnings', value: `₹${stats?.totalEarnings || 0}`, icon: '💰', color: '#c9a84c' },
  ];

  const chartData = [
    { name: 'Mon', deliveries: 4 },
    { name: 'Tue', deliveries: 7 },
    { name: 'Wed', deliveries: 5 },
    { name: 'Thu', deliveries: 9 },
    { name: 'Fri', deliveries: 12 },
    { name: 'Sat', deliveries: 8 },
    { name: 'Sun', deliveries: 6 },
  ];

  const statusData = [
    { name: 'Completed', value: stats?.totalDeliveries || 0, color: '#58d68d' },
    { name: 'Pending', value: stats?.pendingDeliveries || 0, color: '#f59e0b' },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome Back! 👋</h1>
          <p>Here's your delivery performance summary</p>
        </div>
        <button 
          className={`availability-btn ${availability ? 'available' : 'offline'}`}
          onClick={toggleAvailability}
        >
          <span className="status-dot"></span>
          {availability ? 'Available for Deliveries' : 'Offline'}
        </button>
      </div>

      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Weekly Deliveries</h3>
            <span className="badge">Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip
                contentStyle={{
                  background: '#1a1a1e',
                  border: '1px solid rgba(201,168,76,0.3)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="deliveries" fill="#c9a84c" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Delivery Status</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#1a1a1e',
                  border: '1px solid rgba(201,168,76,0.3)',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            {statusData.map((item, index) => (
              <div key={index} className="legend-item">
                <span className="legend-dot" style={{ background: item.color }}></span>
                <span>{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="recent-orders">
        <h3>Recent Assignments</h3>
        {loading ? (
          <div className="loading">Loading orders...</div>
        ) : recentOrders.length === 0 ? (
          <div className="empty-state">No orders assigned yet</div>
        ) : (
          <div className="orders-list">
            {recentOrders.map((order) => (
              <div key={order._id} className="order-item">
                <div className="order-info">
                  <span className="order-number">{order.orderNumber}</span>
                  <span className="order-customer">{order.customerName}</span>
                  <span className="order-amount">₹{order.totalAmount}</span>
                </div>
                <div className="order-status">
                  <span className={`status-badge ${order.status}`}>
                    {order.status === 'assigned' ? 'Pending Pickup' : 
                     order.status === 'picked' ? 'Out for Delivery' : 
                     order.status === 'delivered' ? 'Delivered' : 'Failed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;