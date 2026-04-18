import DeliveryPartner from '../model/DeliveryPartner.js';
import Order from '../model/Order.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const generateToken = (id) => {
  return jwt.sign({ id, role: 'delivery_partner' }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

export const loginPartner = async (req, res) => {
  try {
    const { email, password } = req.body;

    const partner = await DeliveryPartner.findOne({ email });
    if (!partner) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (partner.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: `Your account is ${partner.status}. Please contact admin.`,
      });
    }

    const isPasswordValid = await bcrypt.compare(password, partner.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    partner.lastLogin = Date.now();
    await partner.save();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        _id: partner._id,
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        companyName: partner.companyName,
        vehicleType: partner.vehicleType,
        vehicleNumber: partner.vehicleNumber,
        rating: partner.rating,
        totalDeliveries: partner.totalDeliveries,
        totalEarnings: partner.totalEarnings,
        token: generateToken(partner._id),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

export const getPartnerStats = async (req, res) => {
  try {
    const partner = await DeliveryPartner.findById(req.user.id);
    
    const assignedOrders = partner.assignedOrders || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysDeliveries = assignedOrders.filter(order => {
      const assignedDate = new Date(order.assignedAt);
      assignedDate.setHours(0, 0, 0, 0);
      return assignedDate.getTime() === today.getTime();
    }).length;

    res.status(200).json({
      success: true,
      data: {
        totalDeliveries: partner.totalDeliveries || 0,
        pendingDeliveries: assignedOrders.filter(o => o.status === 'assigned').length,
        completedToday: todaysDeliveries,
        totalEarnings: partner.totalEarnings || 0,
        rating: partner.rating || 0,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

export const getPartnerOrders = async (req, res) => {
  try {
    console.log("Fetching orders for partner:", req.user.id);
    
    const partner = await DeliveryPartner.findById(req.user.id);
    
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Delivery partner not found',
      });
    }
    
    console.log("Partner found:", partner.name);
    console.log("Assigned orders count:", partner.assignedOrders?.length || 0);
    
    if (!partner.assignedOrders || partner.assignedOrders.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }
    
    const orderIds = partner.assignedOrders
      .filter(assignment => assignment.orderId)
      .map(assignment => assignment.orderId);
    
    const orders = await Order.find({ _id: { $in: orderIds } })
      .populate('userId', 'name email mobileNo')
      .lean();
    
    const assignmentMap = {};
    partner.assignedOrders.forEach(assignment => {
      assignmentMap[assignment.orderId.toString()] = {
        status: assignment.status,
        assignedAt: assignment.assignedAt
      };
    });
    
    const formattedOrders = orders.map(order => {
      let customerName = 'N/A';
      let customerPhone = 'N/A';
      
      if (order.userId) {
        customerName = order.userId.name || 'N/A';
        customerPhone = order.userId.mobileNo || 'N/A';
      } else if (order.shippingAddress) {
        customerName = order.shippingAddress.name || 'N/A';
        customerPhone = order.shippingAddress.phone || 'N/A';
      }
      
      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        customerName: customerName,
        customerPhone: customerPhone,
        shippingAddress: order.shippingAddress,
        totalAmount: order.totalAmount,
        items: order.items || [],
        status: assignmentMap[order._id.toString()]?.status || 'assigned',
        assignedAt: assignmentMap[order._id.toString()]?.assignedAt,
        deliveredAt: order.deliveredAt,
        subtotal: order.subtotal,
        discount: order.discount,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
      };
    });
    
    console.log("Processed orders count:", formattedOrders.length);
    
    res.status(200).json({
      success: true,
      data: formattedOrders,
    });
  } catch (error) {
    console.error("getPartnerOrders error:", error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

export const updateDeliveryStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    console.log(`🔄 Updating order ${orderId} status to:`, status);

    const partner = await DeliveryPartner.findById(req.user.id);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Delivery partner not found',
      });
    }
    
    const assignment = partner.assignedOrders.find(
      a => a.orderId.toString() === orderId
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Order not assigned to you',
      });
    }

    let partnerStatus = status;
    let orderStatus = '';
    
    if (status === 'processing') partnerStatus = 'assigned';
    if (status === 'shipped') partnerStatus = 'picked';
    if (status === 'out_for_delivery') partnerStatus = 'picked';
    
    switch(partnerStatus) {
      case 'assigned':
        orderStatus = 'processing';
        break;
      case 'picked':
        orderStatus = 'shipped';
        break;
      case 'delivered':
        orderStatus = 'delivered';
        break;
      default:
        orderStatus = partnerStatus;
    }
    
    assignment.status = partnerStatus;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }
    
    console.log(`📦 Updating order ${order.orderNumber}: ${order.orderStatus} → ${orderStatus}`);
    
    order.orderStatus = orderStatus;
    
    if (partnerStatus === 'delivered' && order.paymentMethod === 'cod') {
      console.log(`💰 COD Order ${order.orderNumber} - Updating payment to PAID`);
      order.paymentStatus = 'paid';
      order.paymentDetails = {
        ...order.paymentDetails,
        transactionId: `COD-${order.orderNumber}-${Date.now()}`,
        paymentId: `COD-${order.orderNumber}`,
        paidAt: new Date()
      };
    }
    
    order.statusHistory.push({
      status: orderStatus,
      note: `Delivery partner updated status to ${partnerStatus}`,
      changedAt: new Date(),
      changedBy: req.user.id,
    });
    
    if (partnerStatus === 'delivered') {
      order.deliveredAt = new Date();
      partner.totalDeliveries = (partner.totalDeliveries || 0) + 1;
      partner.totalEarnings = (partner.totalEarnings || 0) + 50;
      console.log(`✅ Order ${order.orderNumber} marked as delivered`);
    }
    
    await order.save();
    await partner.save();
    
    console.log(`✅ Order ${order.orderNumber} status updated to ${order.orderStatus}`);

    const updatedOrder = await Order.findById(orderId).populate('userId', 'name email').lean();

    res.status(200).json({
      success: true,
      message: partnerStatus === 'delivered' && order.paymentMethod === 'cod'
        ? `Order delivered and payment marked as PAID for COD order!`
        : `Order status updated to ${partnerStatus}`,
      data: {
        orderId,
        partnerStatus: partnerStatus,
        orderStatus: updatedOrder?.orderStatus,
        paymentStatus: updatedOrder?.paymentStatus,
        order: updatedOrder
      }
    });
  } catch (error) {
    console.error("updateDeliveryStatus error:", error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

export const updateAvailability = async (req, res) => {
  try {
    const { isAvailable, location } = req.body;
    
    const partner = await DeliveryPartner.findById(req.user.id);
    if (!partner.availability) {
      partner.availability = {};
    }
    partner.availability.isAvailable = isAvailable;
    if (location) {
      partner.availability.currentLocation = location;
    }
    partner.availability.lastUpdated = Date.now();
    await partner.save();

    res.status(200).json({
      success: true,
      message: `Availability updated to ${isAvailable ? 'Available' : 'Offline'}`,
      data: partner.availability,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};