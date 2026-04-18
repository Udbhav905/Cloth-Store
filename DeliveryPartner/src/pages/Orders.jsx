import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_BASE_URL from '../config/api';
import './Orders.css';

const STATUS_OPTIONS = [
  { value: 'assigned', label: 'Ready for Pickup', icon: '📋' },
  { value: 'picked',   label: 'Out for Delivery', icon: '📦' },
  { value: 'delivered',label: 'Delivered',         icon: '✅' },
];

const getStatusDetails = (v) =>
  STATUS_OPTIONS.find(o => o.value === v) || { label: v || 'Assigned', icon: '📋' };

export default function Orders() {
  const [orders,          setOrders]          = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [selectedOrder,   setSelectedOrder]   = useState(null);
  const [updating,        setUpdating]        = useState(false);
  const [partnerData,     setPartnerData]     = useState(null);
  const [openDropdownId,  setOpenDropdownId]  = useState(null);

  const getAuthConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('partnerToken')}` },
  });

  const getPartnerInfo = () => {
    try { return JSON.parse(localStorage.getItem('partnerData') || 'null'); }
    catch { return null; }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/delivery-partner/orders`, getAuthConfig());
      const list = res.data.data || res.data.orders || (Array.isArray(res.data) ? res.data : []);
      setOrders(list);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('partnerToken');
        localStorage.removeItem('partnerData');
        window.location.href = '/login';
      } else {
        toast.error(err.response?.data?.message || 'Failed to fetch orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    setUpdating(true);
    try {
      await axios.put(
        `${API_BASE_URL}/api/delivery-partner/orders/${orderId}/status`,
        { status },
        getAuthConfig(),
      );
      const msgs = { assigned: 'Order accepted!', picked: 'Marked as picked up!', delivered: 'Delivered! 🎉' };
      toast.success(msgs[status] || `Status → ${status}`);
      await fetchOrders();
      setSelectedOrder(null);
      setOpenDropdownId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  /* Close dropdown on outside click */
  useEffect(() => {
    const fn = (e) => { if (!e.target.closest('.dp-select-wrap')) setOpenDropdownId(null); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('partnerToken')) { window.location.href = '/login'; return; }
    setPartnerData(getPartnerInfo());
    fetchOrders();
  }, []);

  const active    = orders.filter(o => o.status !== 'delivered');
  const completed = orders.filter(o => o.status === 'delivered');

  /* ── Status dropdown ── */
  const renderDropdown = (order, suffix = '') => {
    const dropId    = `${order._id}${suffix}`;
    const isOpen    = openDropdownId === dropId;
    const cur       = getStatusDetails(order.status);
    const isDone    = order.status === 'delivered';

    const next = STATUS_OPTIONS.filter(o => {
      if (order.status === 'assigned') return o.value === 'picked' || o.value === 'delivered';
      if (order.status === 'picked')   return o.value === 'delivered';
      return false;
    });

    return (
      <div className={`dp-select-wrap ${isOpen ? 'dp-open' : ''}`}>
        <button
          className={`dp-trigger dp-trigger--${order.status}`}
          disabled={updating || isDone}
          onClick={(e) => {
            e.stopPropagation();
            setOpenDropdownId(isOpen ? null : dropId);
          }}
        >
          <span className="dp-icon">{cur.icon}</span>
          <span className="dp-lbl">{cur.label}</span>
          {!isDone && <span className={`dp-arrow ${isOpen ? 'dp-arrow--up' : ''}`}>▾</span>}
        </button>

        {isOpen && !isDone && next.length > 0 && (
          <div className="dp-menu">
            {next.map(opt => (
              <button key={opt.value} className="dp-option"
                onClick={(e) => { e.stopPropagation(); updateOrderStatus(order._id, opt.value); }}>
                <span>{opt.icon}</span>{opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dp-page">
      {/* Header */}
      <div className="dp-header">
        <h1 className="dp-title">My Deliveries</h1>
        <p className="dp-subtitle">Manage and update your assigned orders</p>
      </div>

      {/* Profile */}
      {partnerData && (
        <div className="dp-profile">
          <div className="dp-avatar">
            {partnerData.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="dp-profile-info">
            <h3>{partnerData.name}</h3>
            <p className="dp-company">{partnerData.companyName || 'Delivery Partner'}</p>
            <div className="dp-contact">
              <span>📧 {partnerData.email}</span>
              <span>📞 {partnerData.phone}</span>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="dp-stats">
        <div className="dp-stat">
          <div className="dp-stat-icon">📋</div>
          <div><h3>{active.length}</h3><p>Active</p></div>
        </div>
        <div className="dp-stat">
          <div className="dp-stat-icon">✅</div>
          <div><h3>{completed.length}</h3><p>Completed</p></div>
        </div>
      </div>

      {/* ── ACTIVE ORDERS ── */}
      <div className="dp-section-header">
        <h2>Active Deliveries</h2>
        <span className="dp-badge">{active.length} orders</span>
      </div>

      {loading ? (
        <div className="dp-loading"><div className="dp-spinner" /><p>Loading deliveries…</p></div>
      ) : active.length === 0 ? (
        <div className="dp-empty">
          <div className="dp-empty-icon">🚚</div>
          <h3>No active deliveries</h3>
          <p>When admin assigns orders to you, they'll appear here</p>
          <button className="dp-refresh-btn" onClick={fetchOrders}>Refresh</button>
        </div>
      ) : (
        <div className="dp-grid">
          {active.map(order => (
            <div key={order._id} className="dp-card">
              <div className="dp-card-header">
                <span className="dp-order-num">{order.orderNumber}</span>
                {renderDropdown(order)}
              </div>

              <div className="dp-card-body">
                <div className="dp-info-block">
                  <h4>Customer</h4>
                  <div className="dp-row"><span>Name</span><span>{order.customerName || order.shippingAddress?.name || '—'}</span></div>
                  <div className="dp-row"><span>Phone</span><span>{order.customerPhone || order.shippingAddress?.phone || '—'}</span></div>
                </div>

                <div className="dp-info-block">
                  <h4>Delivery Address</h4>
                  <p>{order.shippingAddress?.address1}</p>
                  {order.shippingAddress?.address2 && <p>{order.shippingAddress.address2}</p>}
                  <p>{[order.shippingAddress?.city, order.shippingAddress?.state].filter(Boolean).join(', ')} — {order.shippingAddress?.pincode}</p>
                </div>

                <div className="dp-info-block">
                  <h4>Order</h4>
                  <div className="dp-row"><span>Items</span><span>{order.items?.length} item(s)</span></div>
                  <div className="dp-row"><span>Amount</span><span className="dp-amount">₹{(order.totalAmount || 0).toLocaleString()}</span></div>
                  <div className="dp-row">
                    <span>Payment</span>
                    <span className={`dp-pay-status dp-pay-${order.paymentStatus}`}>
                      {order.paymentStatus === 'paid' ? '✅ Paid' : '⏳ COD'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="dp-card-footer">
                <button className="dp-details-btn" onClick={() => setSelectedOrder(order)}>
                  View Full Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── COMPLETED ORDERS ── */}
      {completed.length > 0 && (
        <>
          <div className="dp-section-header dp-section-header--completed">
            <h2>Completed Deliveries</h2>
            <span className="dp-badge dp-badge--green">{completed.length} orders</span>
          </div>

          <div className="dp-completed-grid">
            {completed.map(order => (
              <div key={order._id} className="dp-completed-card">
                <div className="dp-completed-left">
                  <span className="dp-order-num">{order.orderNumber}</span>
                  <span className="dp-delivered-chip">✅ Delivered</span>
                </div>
                <div className="dp-completed-mid">
                  <span>{order.customerName || order.shippingAddress?.name || '—'}</span>
                  <span className="dp-sep">·</span>
                  <span>{order.shippingAddress?.city}</span>
                  <span className="dp-sep">·</span>
                  <span className="dp-amount">₹{(order.totalAmount || 0).toLocaleString()}</span>
                </div>
                <button className="dp-view-btn" onClick={() => setSelectedOrder(order)}>
                  Details →
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Order Detail Modal ── */}
      {selectedOrder && (
        <div className="dp-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="dp-modal" onClick={e => e.stopPropagation()}>
            <div className="dp-modal-header">
              <h3>Order Details</h3>
              <button className="dp-modal-close" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>

            <div className="dp-modal-body">
              <div className="dp-detail-section">
                <h4>Order Information</h4>
                <p><strong>Order #:</strong> {selectedOrder.orderNumber}</p>
                <div style={{ margin: '12px 0' }}>{renderDropdown(selectedOrder, '-modal')}</div>
                <p><strong>Assigned At:</strong> {selectedOrder.assignedAt ? new Date(selectedOrder.assignedAt).toLocaleString() : '—'}</p>
              </div>

              <div className="dp-detail-section">
                <h4>Customer</h4>
                <p><strong>Name:</strong> {selectedOrder.customerName || selectedOrder.shippingAddress?.name || '—'}</p>
                <p><strong>Phone:</strong> {selectedOrder.customerPhone || selectedOrder.shippingAddress?.phone || '—'}</p>
              </div>

              <div className="dp-detail-section">
                <h4>Shipping Address</h4>
                <p>{selectedOrder.shippingAddress?.address1}</p>
                {selectedOrder.shippingAddress?.address2 && <p>{selectedOrder.shippingAddress.address2}</p>}
                <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state}</p>
                <p>Pincode: {selectedOrder.shippingAddress?.pincode}</p>
              </div>

              <div className="dp-detail-section">
                <h4>Items</h4>
                <div className="dp-items-list">
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className="dp-item">
                      <div className="dp-item-info">
                        <span className="dp-item-name">{item.productName || item.name}</span>
                        <span className="dp-item-meta">
                          {item.variant?.size && `Size: ${item.variant.size}`}
                          {item.variant?.color && ` · ${item.variant.color}`}
                        </span>
                      </div>
                      <div className="dp-item-price">
                        <span>Qty: {item.quantity}</span>
                        <span>₹{item.totalPrice || item.price * item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dp-detail-section">
                <h4>Payment Summary</h4>
                <div className="dp-summary-row"><span>Subtotal</span><span>₹{(selectedOrder.subtotal || 0).toLocaleString()}</span></div>
                {selectedOrder.discount > 0 && (
                  <div className="dp-summary-row dp-discount"><span>Discount</span><span>-₹{selectedOrder.discount.toLocaleString()}</span></div>
                )}
                <div className="dp-summary-row dp-total"><span>Total</span><span>₹{(selectedOrder.totalAmount || 0).toLocaleString()}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}