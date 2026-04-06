import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_BASE_URL from '../config/api';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [partnerData, setPartnerData] = useState(null);

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
      
      console.log("Processed orders:", ordersList);
      setOrders(ordersList);
      
      if (ordersList.length === 0) {
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

  // ✅ FIXED: Use only valid status values from backend schema
  const updateOrderStatus = async (orderId, status) => {
    setUpdating(true);
    try {
      // Map status to valid backend values
      let validStatus = status;
      
      // Only use status values that exist in your backend
      // Based on your error, valid statuses are: pending, confirmed, processing, shipped, out_for_delivery, delivered, cancelled, returned, refunded
      if (status === 'assigned') {
        validStatus = 'processing'; // Map 'assigned' to 'processing' if needed
      }
      
      const response = await axios.put(`${API_BASE_URL}/api/delivery-partner/orders/${orderId}/status`, 
        { status: validStatus }, 
        getAuthConfig()
      );
      
      console.log("Update response:", response.data);
      
      const statusMessages = {
        processing: 'Order accepted! Status updated to Processing',
        shipped: 'Order marked as Shipped!',
        out_for_delivery: 'Order is Out for Delivery!',
        delivered: 'Order marked as Delivered! 🎉'
      };
      toast.success(statusMessages[status] || `Order status updated to ${status}`);
      
      fetchOrders();
      setSelectedOrder(null);
    } catch (error) {
      console.error('Update status error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update status';
      toast.error(errorMsg);
    } finally {
      setUpdating(false);
    }
  };

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

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return '⏳';
      case 'confirmed': return '✓';
      case 'processing': return '⚙';
      case 'shipped': return '📦';
      case 'out_for_delivery': return '🚚';
      case 'delivered': return '✅';
      case 'cancelled': return '✕';
      default: return '📋';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'processing': return 'Processing';
      case 'shipped': return 'Shipped';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status || 'Unknown';
    }
  };

  // Define valid status flow based on your backend
  const getNextAction = (status) => {
    switch(status) {
      case 'pending':
        return { action: 'confirmed', label: '✓ Confirm Order', buttonClass: 'confirm' };
      case 'confirmed':
        return { action: 'processing', label: '⚙ Start Processing', buttonClass: 'process' };
      case 'processing':
        return { action: 'shipped', label: '📦 Mark as Shipped', buttonClass: 'ship' };
      case 'shipped':
        return { action: 'out_for_delivery', label: '🚚 Out for Delivery', buttonClass: 'outfordelivery' };
      case 'out_for_delivery':
        return { action: 'delivered', label: '✅ Mark as Delivered', buttonClass: 'deliver' };
      default:
        return null;
    }
  };

  const pendingOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  const completedOrders = orders.filter(o => o.status === 'delivered');

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
            const nextAction = getNextAction(order.status);
            return (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-number">{order.orderNumber}</div>
                  <div className={`order-status ${order.status}`}>
                    {getStatusIcon(order.status)} {getStatusLabel(order.status)}
                  </div>
                </div>
                
                <div className="order-body">
                  <div className="info-section">
                    <h4>Customer Details</h4>
                    <div className="info-row">
                      <span className="label">Name:</span>
                      <span>{order.customerName || order.userId?.name || "—"}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Phone:</span>
                      <span>{order.customerPhone || order.shippingAddress?.phone || "—"}</span>
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
                  {nextAction && (
                    <button 
                      className={`action-btn ${nextAction.buttonClass}`}
                      onClick={() => updateOrderStatus(order._id, nextAction.action)}
                      disabled={updating}
                    >
                      {nextAction.label}
                    </button>
                  )}
                  <button 
                    className="action-btn details"
                    onClick={() => setSelectedOrder(order)}
                  >
                    View Details
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
                  <span>{order.customerName || order.userId?.name}</span>
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
                <p><strong>Status:</strong> 
                  <span className={`status-badge ${selectedOrder.status}`}>
                    {getStatusIcon(selectedOrder.status)} {getStatusLabel(selectedOrder.status)}
                  </span>
                </p>
                <p><strong>Assigned At:</strong> {selectedOrder.assignedAt ? new Date(selectedOrder.assignedAt).toLocaleString() : "Not specified"}</p>
              </div>

              <div className="detail-section">
                <h4>Customer Information</h4>
                <p><strong>Name:</strong> {selectedOrder.customerName || selectedOrder.userId?.name || "—"}</p>
                <p><strong>Phone:</strong> {selectedOrder.customerPhone || selectedOrder.shippingAddress?.phone || "—"}</p>
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
                          {item.size && `Size: ${item.size}`}
                          {item.color && ` • Color: ${item.color}`}
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

              {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                <div className="modal-actions">
                  {selectedOrder.status === 'pending' && (
                    <button 
                      className="modal-action-btn confirm"
                      onClick={() => {
                        updateOrderStatus(selectedOrder._id, 'confirmed');
                        setSelectedOrder(null);
                      }}
                      disabled={updating}
                    >
                      ✓ Confirm Order
                    </button>
                  )}
                  {selectedOrder.status === 'confirmed' && (
                    <button 
                      className="modal-action-btn process"
                      onClick={() => {
                        updateOrderStatus(selectedOrder._id, 'processing');
                        setSelectedOrder(null);
                      }}
                      disabled={updating}
                    >
                      ⚙ Start Processing
                    </button>
                  )}
                  {selectedOrder.status === 'processing' && (
                    <button 
                      className="modal-action-btn ship"
                      onClick={() => {
                        updateOrderStatus(selectedOrder._id, 'shipped');
                        setSelectedOrder(null);
                      }}
                      disabled={updating}
                    >
                      📦 Mark as Shipped
                    </button>
                  )}
                  {selectedOrder.status === 'shipped' && (
                    <button 
                      className="modal-action-btn outfordelivery"
                      onClick={() => {
                        updateOrderStatus(selectedOrder._id, 'out_for_delivery');
                        setSelectedOrder(null);
                      }}
                      disabled={updating}
                    >
                      🚚 Out for Delivery
                    </button>
                  )}
                  {selectedOrder.status === 'out_for_delivery' && (
                    <button 
                      className="modal-action-btn deliver"
                      onClick={() => {
                        updateOrderStatus(selectedOrder._id, 'delivered');
                        setSelectedOrder(null);
                      }}
                      disabled={updating}
                    >
                      ✅ Mark as Delivered
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;