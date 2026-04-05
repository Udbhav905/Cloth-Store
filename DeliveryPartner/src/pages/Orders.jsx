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

  const getAuthConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('partnerToken')}` }
  });

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/delivery-partner/orders`, getAuthConfig());
      setOrders(response.data.data);
    } catch (error) {
      console.error('Fetch orders error:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('partnerToken');
        localStorage.removeItem('partnerData');
        window.location.href = '/login';
      } else {
        toast.error('Failed to fetch orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    setUpdating(true);
    try {
      await axios.put(`${API_BASE_URL}/api/delivery-partner/orders/${orderId}/status`, 
        { status }, 
        getAuthConfig()
      );
      toast.success(`Order status updated to ${status}`);
      fetchOrders();
      setSelectedOrder(null);
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('partnerToken');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    fetchOrders();
  }, []);

  // Rest of your component remains the same...
  const getStatusIcon = (status) => {
    switch(status) {
      case 'assigned': return '📋';
      case 'picked': return '📦';
      case 'delivered': return '✅';
      default: return '❌';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'assigned': return 'Pending Pickup';
      case 'picked': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      default: return 'Failed';
    }
  };

  const pendingOrders = orders.filter(o => o.status !== 'delivered');
  const completedOrders = orders.filter(o => o.status === 'delivered');

  return (
    <div className="orders-page">
      <div className="page-header">
        <h1>My Deliveries</h1>
        <p>Manage and track your assigned deliveries</p>
      </div>

      <div className="orders-tabs">
        <button className="tab active">Active Deliveries ({pendingOrders.length})</button>
        <button className="tab">Completed ({completedOrders.length})</button>
      </div>

      {loading ? (
        <div className="loading">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🚚</div>
          <h3>No deliveries assigned yet</h3>
          <p>When admin assigns orders, they'll appear here</p>
        </div>
      ) : (
        <div className="orders-grid">
          {pendingOrders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div className="order-number">{order.orderNumber}</div>
                <div className={`order-status ${order.status}`}>
                  {getStatusIcon(order.status)} {getStatusLabel(order.status)}
                </div>
              </div>
              
              <div className="order-body">
                <div className="customer-info">
                  <div className="info-row">
                    <span className="label">Customer:</span>
                    <span>{order.customerName}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Phone:</span>
                    <span>{order.customerPhone}</span>
                  </div>
                </div>

                <div className="address-info">
                  <div className="info-row">
                    <span className="label">Address:</span>
                  </div>
                  <p>{order.shippingAddress?.address1}</p>
                  {order.shippingAddress?.address2 && <p>{order.shippingAddress.address2}</p>}
                  <p>
                    {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                  </p>
                </div>

                <div className="items-info">
                  <div className="info-row">
                    <span className="label">Items:</span>
                    <span>{order.items?.length} item(s)</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Total Amount:</span>
                    <span className="amount">₹{order.totalAmount}</span>
                  </div>
                </div>
              </div>

              <div className="order-actions">
                {order.status === 'assigned' && (
                  <button 
                    className="action-btn pickup"
                    onClick={() => updateOrderStatus(order._id, 'picked')}
                    disabled={updating}
                  >
                    📦 Mark as Picked
                  </button>
                )}
                {order.status === 'picked' && (
                  <button 
                    className="action-btn deliver"
                    onClick={() => updateOrderStatus(order._id, 'delivered')}
                    disabled={updating}
                  >
                    ✅ Mark as Delivered
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
          ))}
        </div>
      )}

      {/* Order Details Modal - keep as is */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Details</h3>
              <button onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h4>Order Information</h4>
                <p><strong>Order Number:</strong> {selectedOrder.orderNumber}</p>
                <p><strong>Status:</strong> {getStatusLabel(selectedOrder.status)}</p>
                <p><strong>Assigned At:</strong> {new Date(selectedOrder.assignedAt).toLocaleString()}</p>
              </div>

              <div className="detail-section">
                <h4>Customer Information</h4>
                <p><strong>Name:</strong> {selectedOrder.customerName}</p>
                <p><strong>Phone:</strong> {selectedOrder.customerPhone}</p>
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
                {selectedOrder.items?.map((item, index) => (
                  <div key={index} className="detail-item">
                    <span>{item.productName || item.name}</span>
                    <span>Qty: {item.quantity}</span>
                    <span>₹{item.totalPrice || item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="detail-section">
                <h4>Payment Summary</h4>
                <p><strong>Subtotal:</strong> ₹{selectedOrder.subtotal}</p>
                {selectedOrder.discount > 0 && <p><strong>Discount:</strong> -₹{selectedOrder.discount}</p>}
                <p><strong>Total:</strong> ₹{selectedOrder.totalAmount}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;