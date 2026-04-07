import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_BASE_URL from '../config/api';
import './Orders.css';

const STATUS_OPTIONS = [
  { value: 'assigned', label: 'Ready for Pickup', icon: '📋' },
  { value: 'picked', label: 'Out for Delivery', icon: '📦' },
  { value: 'delivered', label: 'Delivered', icon: '✅' }
];

const getStatusDetails = (statusValue) => {
  return STATUS_OPTIONS.find(opt => opt.value === statusValue) || { label: statusValue || 'Assigned', icon: '📋' };
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [partnerData, setPartnerData] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const getAuthConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('partnerToken')}` }
  });

  const getPartnerInfo = () => {
    const data = localStorage.getItem('partnerData');
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const partner = getPartnerInfo();
      console.log("Partner info:", partner);
      
      const response = await axios.get(`${API_BASE_URL}/api/delivery-partner/orders`, getAuthConfig());
      console.log("Orders response:", response.data);
      
      let ordersList = [];
      if (response.data.data) {
        ordersList = response.data.data;
      } else if (response.data.orders) {
        ordersList = response.data.orders;
      } else if (Array.isArray(response.data)) {
        ordersList = response.data;
      }
      
      // Map status to delivery partner statuses if needed
      const mappedOrders = ordersList.map(order => {
        // If order has status like 'processing', map to 'assigned' for delivery partner
        let deliveryStatus = order.status;
        if (order.status === 'processing' || order.status === 'confirmed' || order.status === 'pending') {
          deliveryStatus = 'assigned';
        } else if (order.status === 'shipped' || order.status === 'out_for_delivery') {
          deliveryStatus = 'picked';
        }
        
        return {
          ...order,
          status: deliveryStatus
        };
      });
      
      console.log("Processed orders:", mappedOrders);
      setOrders(mappedOrders);
      
      if (mappedOrders.length === 0) {
        console.log("No orders found for this delivery partner");
      }
    } catch (error) {
      console.error('Fetch orders error:', error);
      console.error('Error details:', error.response?.data);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('partnerToken');
        localStorage.removeItem('partnerData');
        window.location.href = '/login';
      } else {
        toast.error(error.response?.data?.message || 'Failed to fetch orders');
      }
    } finally {
      setLoading(false);
    }
  };

  // Update order status (for delivery partner)
  const updateOrderStatus = async (orderId, status) => {
    setUpdating(true);
    try {
      // Map delivery status to actual order status if needed
      let actualStatus = status;
      if (status === 'assigned') actualStatus = 'processing';
      if (status === 'picked') actualStatus = 'shipped';
      
      const response = await axios.put(
        `${API_BASE_URL}/api/delivery-partner/orders/${orderId}/status`, 
        { status: actualStatus }, 
        getAuthConfig()
      );
      
      console.log("Update response:", response.data);
      
      const statusMessages = {
        assigned: 'Order accepted!',
        picked: 'Order marked as picked up!',
        delivered: 'Order marked as delivered! 🎉'
      };
      toast.success(statusMessages[status] || `Order status updated to ${status}`);
      
      fetchOrders();
      setSelectedOrder(null);
      setOpenDropdownId(null);
    } catch (error) {
      console.error('Update status error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update status';
      toast.error(errorMsg);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.custom-select-container')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('partnerToken');
    const partner = getPartnerInfo();
    setPartnerData(partner);
    
    if (!token) {
      window.location.href = '/login';
      return;
    }
    fetchOrders();
  }, []);

  const pendingOrders = orders.filter(o => o.status !== 'delivered');
  const completedOrders = orders.filter(o => o.status === 'delivered');

  const handleStatusSelect = (orderId, newStatus) => {
    updateOrderStatus(orderId, newStatus);
    setOpenDropdownId(null);
  };

  const renderStatusDropdown = (order, isModal = false) => {
    const currentStatus = getStatusDetails(order.status);
    const isOpen = openDropdownId === (isModal ? `modal-${order._id}` : order._id);
    
    // Get available next statuses based on current status
    const getAvailableStatuses = () => {
      switch(order.status) {
        case 'assigned':
          return STATUS_OPTIONS.filter(opt => opt.value === 'picked' || opt.value === 'delivered');
        case 'picked':
          return STATUS_OPTIONS.filter(opt => opt.value === 'delivered');
        case 'delivered':
          return [];
        default:
          return STATUS_OPTIONS;
      }
    };
    
    const availableStatuses = getAvailableStatuses();
    
    return (
      <div className={`custom-select-container ${isOpen ? 'active' : ''}`}>
        <button 
          className={`select-trigger status-btn-${order.status}`}
          onClick={(e) => {
            e.stopPropagation();
            setOpenDropdownId(isOpen ? null : (isModal ? `modal-${order._id}` : order._id));
          }}
          disabled={updating || order.status === 'delivered'}
        >
          <span className="select-icon">{currentStatus.icon}</span>
          <span className="select-label">{currentStatus.label}</span>
          {order.status !== 'delivered' && <span className={`select-arrow ${isOpen ? 'up' : 'down'}`}>▼</span>}
        </button>
        
        {isOpen && order.status !== 'delivered' && (
          <div className="select-dropdown-menu">
            {availableStatuses.map((option) => (
              <button
                key={option.value}
                className={`select-option ${order.status === option.value ? 'selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusSelect(order._id, option.value);
                }}
              >
                <span className="option-icon">{option.icon}</span>
                <span className="option-label">{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="orders-page">
      <div className="page-header">
        <h1>My Deliveries</h1>
        <p>Manage and update delivery status for orders assigned to you</p>
      </div>

      {partnerData && (
        <div className="profile-section">
          <div className="profile-card">
            <div className="profile-avatar">
              {partnerData.name?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
            </div>
            <div className="profile-info">
              <h3>{partnerData.name}</h3>
              <p className="profile-company">{partnerData.companyName || "Delivery Partner"}</p>
              <div className="profile-details">
                <span>📧 {partnerData.email}</span>
                <span>📞 {partnerData.phone}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <h3>{pendingOrders.length}</h3>
            <p>Active Deliveries</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{completedOrders.length}</h3>
            <p>Completed</p>
          </div>
        </div>
      </div>

      <div className="section-header">
        <h2>Active Deliveries</h2>
        <span className="badge">{pendingOrders.length} orders</span>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your deliveries...</p>
        </div>
      ) : pendingOrders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🚚</div>
          <h3>No active deliveries</h3>
          <p>When admin assigns orders to you, they'll appear here</p>
          <button className="refresh-btn" onClick={fetchOrders}>Refresh</button>
        </div>
      ) : (
        <div className="orders-grid">
          {pendingOrders.map((order) => {
            return (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-number">{order.orderNumber}</div>
                  <div className="order-status-wrapper">
                    {renderStatusDropdown(order)}
                  </div>
                </div>
                
                <div className="order-body">
                  <div className="info-section">
                    <h4>Customer Details</h4>
                    <div className="info-row">
                      <span className="label">Name:</span>
                      <span>{order.customerName || "—"}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Phone:</span>
                      <span>{order.customerPhone || "—"}</span>
                    </div>
                  </div>

                  <div className="info-section">
                    <h4>Delivery Address</h4>
                    <p className="address-line">{order.shippingAddress?.address1}</p>
                    {order.shippingAddress?.address2 && (
                      <p className="address-line">{order.shippingAddress.address2}</p>
                    )}
                    <p className="address-line">
                      {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                    </p>
                  </div>

                  <div className="info-section">
                    <h4>Order Summary</h4>
                    <div className="info-row">
                      <span className="label">Items:</span>
                      <span>{order.items?.length} item(s)</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Total Amount:</span>
                      <span className="amount">₹{(order.totalAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Payment:</span>
                      <span className={`payment-status ${order.paymentStatus}`}>
                        {order.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="order-actions">
                  <button 
                    className="action-btn details full-width"
                    onClick={() => setSelectedOrder(order)}
                  >
                    View Complete Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {completedOrders.length > 0 && (
        <>
          <div className="section-header">
            <h2>Completed Deliveries</h2>
            <span className="badge completed">{completedOrders.length} orders</span>
          </div>
          <div className="completed-list">
            {completedOrders.map((order) => (
              <div key={order._id} className="completed-card">
                <div className="completed-header">
                  <span className="order-number">{order.orderNumber}</span>
                  <span className="delivered-badge">✅ Delivered</span>
                </div>
                <div className="completed-details">
                  <span>{order.customerName}</span>
                  <span>•</span>
                  <span>{order.shippingAddress?.city}</span>
                  <span>•</span>
                  <span>₹{(order.totalAmount || 0).toLocaleString()}</span>
                </div>
                <button 
                  className="view-details-btn"
                  onClick={() => setSelectedOrder(order)}
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Details</h3>
              <button className="close-btn" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h4>Order Information</h4>
                <p><strong>Order Number:</strong> {selectedOrder.orderNumber}</p>
                <p><strong>Status:</strong></p>
                <div className="modal-status-selector">
                  {renderStatusDropdown(selectedOrder, true)}
                </div>
                <p><strong>Assigned At:</strong> {selectedOrder.assignedAt ? new Date(selectedOrder.assignedAt).toLocaleString() : "Not specified"}</p>
              </div>

              <div className="detail-section">
                <h4>Customer Information</h4>
                <p><strong>Name:</strong> {selectedOrder.customerName || "—"}</p>
                <p><strong>Phone:</strong> {selectedOrder.customerPhone || "—"}</p>
              </div>

              <div className="detail-section">
                <h4>Shipping Address</h4>
                <p>{selectedOrder.shippingAddress?.address1}</p>
                {selectedOrder.shippingAddress?.address2 && <p>{selectedOrder.shippingAddress.address2}</p>}
                <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state}</p>
                <p>Pincode: {selectedOrder.shippingAddress?.pincode}</p>
              </div>

              <div className="detail-section">
                <h4>Items</h4>
                <div className="items-list">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="detail-item">
                      <div className="item-info">
                        <span className="item-name">{item.productName || item.name}</span>
                        <span className="item-meta">
                          {item.variant?.size && `Size: ${item.variant.size}`}
                          {item.variant?.color && ` • Color: ${item.variant.color}`}
                        </span>
                      </div>
                      <div className="item-pricing">
                        <span>Qty: {item.quantity}</span>
                        <span>₹{item.totalPrice || (item.price * item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h4>Payment Summary</h4>
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>₹{(selectedOrder.subtotal || 0).toLocaleString()}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="summary-row discount">
                    <span>Discount:</span>
                    <span>-₹{selectedOrder.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span>Total Amount:</span>
                  <span>₹{(selectedOrder.totalAmount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;