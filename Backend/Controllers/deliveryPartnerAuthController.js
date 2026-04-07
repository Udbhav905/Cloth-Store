import DeliveryPartner from '../model/DeliveryPartner.js';
import Order from '../model/Order.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id, role: 'delivery_partner' }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// @desc    Login delivery partner
export const loginPartner = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if partner exists
    const partner = await DeliveryPartner.findOne({ email });
    if (!partner) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if partner is active
    if (partner.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: `Your account is ${partner.status}. Please contact admin.`,
      });
    }

    // Check password - Compare with hashed password
    const isPasswordValid = await bcrypt.compare(password, partner.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Update last login
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

// @desc    Get partner dashboard stats
// @route   GET /api/delivery-partner/stats
// @access  Private/DeliveryPartner
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

// @desc    Get partner's assigned orders (FIXED - Properly populate user data)
// @route   GET /api/delivery-partner/orders
// @access  Private/DeliveryPartner
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
    
    // Get all order IDs from assigned orders
    const orderIds = partner.assignedOrders
      .filter(assignment => assignment.orderId)
      .map(assignment => assignment.orderId);
    
    // Fetch orders with full population
    const orders = await Order.find({ _id: { $in: orderIds } })
      .populate('userId', 'name email mobileNo') // Populate user data
      .lean();
    
    // Create a map for quick lookup of assignment status
    const assignmentMap = {};
    partner.assignedOrders.forEach(assignment => {
      assignmentMap[assignment.orderId.toString()] = {
        status: assignment.status,
        assignedAt: assignment.assignedAt
      };
    });
    
    // Format orders for response
    const formattedOrders = orders.map(order => {
      const assignment = assignmentMap[order._id.toString()];
      
      // Get customer name from userId or fallback to shippingAddress
      let customerName = 'N/A';
      if (order.userId) {
        customerName = order.userId.name || 'N/A';
      } else if (order.shippingAddress?.name) {
        customerName = order.shippingAddress.name;
      }
      
      // Get customer phone
      let customerPhone = 'N/A';
      if (order.userId?.mobileNo) {
        customerPhone = order.userId.mobileNo;
      } else if (order.shippingAddress?.phone) {
        customerPhone = order.shippingAddress.phone;
      }
      
      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        customerName: customerName,
        customerPhone: customerPhone,
        shippingAddress: order.shippingAddress,
        totalAmount: order.totalAmount,
        items: order.items || [],
        status: assignment?.status || 'assigned',
        assignedAt: assignment?.assignedAt,
        deliveredAt: order.deliveredAt,
        subtotal: order.subtotal,
        discount: order.discount,
        paymentStatus: order.paymentStatus,
      };
    });
    
    console.log("Processed orders count:", formattedOrders.length);
    console.log("First order customer name:", formattedOrders[0]?.customerName);
    
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

// @desc    Update delivery status (FIXED - Also updates order status)
// @route   PUT /api/delivery-partner/orders/:orderId/status
// @access  Private/DeliveryPartner
// export const updateDeliveryStatus = async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const { status } = req.body;

//     console.log(`Updating order ${orderId} status to ${status}`);

//     // Find the delivery partner
//     const partner = await DeliveryPartner.findById(req.user.id);
    
//     if (!partner) {
//       return res.status(404).json({
//         success: false,
//         message: 'Delivery partner not found',
//       });
//     }
    
//     // Find the assignment
//     const assignment = partner.assignedOrders.find(
//       a => a.orderId.toString() === orderId
//     );

//     if (!assignment) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not assigned to you',
//       });
//     }

//     // Update assignment status
//     assignment.status = status;
    
//     // Update the actual order status
//     const order = await Order.findById(orderId);
//     if (order) {
//       // Map delivery partner status to order status
//       let orderStatus = '';
//       switch(status) {
//         case 'assigned':
//           orderStatus = 'processing';
//           break;
//         case 'picked':
//           orderStatus = 'shipped';
//           break;
//         case 'delivered':
//           orderStatus = 'delivered';
//           break;
//         default:
//           orderStatus = status;
//       }
      
//       order.orderStatus = orderStatus;
      
//       // Add to status history
//       order.statusHistory.push({
//         status: orderStatus,
//         note: `Delivery partner updated status to ${status}`,
//         changedAt: new Date(),
//         changedBy: req.user.id,
//       });
      
//       if (status === 'delivered') {
//         order.deliveredAt = new Date();
//         partner.totalDeliveries = (partner.totalDeliveries || 0) + 1;
//         partner.totalEarnings = (partner.totalEarnings || 0) + 50;
//       }
      
//       await order.save();
//     }

//     await partner.save();

//     res.status(200).json({
//       success: true,
//       message: `Order status updated to ${status}`,
//       data: {
//         orderId,
//         status,
//         orderStatus: order?.orderStatus
//       }
//     });
//   } catch (error) {
//     console.error("updateDeliveryStatus error:", error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };
// @desc    Update delivery status
// @route   PUT /api/delivery-partner/orders/:orderId/status
// @access  Private/DeliveryPartner
// export const updateDeliveryStatus = async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const { status } = req.body;

//     console.log(`Updating order ${orderId} status to ${status}`);

//     // Find the delivery partner
//     const partner = await DeliveryPartner.findById(req.user.id);
    
//     if (!partner) {
//       return res.status(404).json({
//         success: false,
//         message: 'Delivery partner not found',
//       });
//     }
    
//     // Find the assignment
//     const assignment = partner.assignedOrders.find(
//       a => a.orderId.toString() === orderId
//     );

//     if (!assignment) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not assigned to you',
//       });
//     }

//     // ✅ Map incoming status to valid enum values for DeliveryPartner.assignedOrders
//     // Valid values for assignedOrders.status are: 'assigned', 'picked', 'delivered'
//     let partnerStatus = status;
//     if (status === 'processing') partnerStatus = 'assigned';
//     if (status === 'shipped') partnerStatus = 'picked';
//     if (status === 'out_for_delivery') partnerStatus = 'picked';
    
//     // Update assignment status (for DeliveryPartner model)
//     assignment.status = partnerStatus;
    
//     // Update the actual order status (for Order model)
//     const order = await Order.findById(orderId);
//     if (order) {
//       // Map delivery partner status to order status
//       let orderStatus = '';
//       switch(status) {
//         case 'assigned':
//           orderStatus = 'processing';
//           break;
//         case 'picked':
//           orderStatus = 'shipped';
//           break;
//         case 'delivered':
//           orderStatus = 'delivered';
//           break;
//         default:
//           orderStatus = status;
//       }
      
//       order.orderStatus = orderStatus;
      
//       // Add to status history
//       order.statusHistory.push({
//         status: orderStatus,
//         note: `Delivery partner updated status to ${partnerStatus}`,
//         changedAt: new Date(),
//         changedBy: req.user.id,
//       });
      
//       if (partnerStatus === 'delivered') {
//         order.deliveredAt = new Date();
//         partner.totalDeliveries = (partner.totalDeliveries || 0) + 1;
//         partner.totalEarnings = (partner.totalEarnings || 0) + 50;
//       }
      
//       await order.save();
//       console.log(`✅ Order ${order.orderNumber} status updated to ${orderStatus}`);
//     }

//     await partner.save();
//     console.log(`✅ Partner ${partner.name} assignment status updated to ${partnerStatus}`);

//     res.status(200).json({
//       success: true,
//       message: `Order status updated to ${partnerStatus}`,
//       data: {
//         orderId,
//         status: partnerStatus,
//         orderStatus: order?.orderStatus
//       }
//     });
//   } catch (error) {
//     console.error("updateDeliveryStatus error:", error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };
// @desc    Update delivery status
// @route   PUT /api/delivery-partner/orders/:orderId/status
// @access  Private/DeliveryPartner
export const updateDeliveryStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    console.log(`Updating order ${orderId} status to ${status}`);

    // Find the delivery partner
    const partner = await DeliveryPartner.findById(req.user.id);
    
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Delivery partner not found',
      });
    }
    
    // Find the assignment
    const assignment = partner.assignedOrders.find(
      a => a.orderId.toString() === orderId
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Order not assigned to you',
      });
    }

    // ✅ Map incoming status to valid enum values for DeliveryPartner.assignedOrders
    // Valid values for assignedOrders.status are: 'assigned', 'picked', 'delivered'
    let partnerStatus = status;
    if (status === 'processing') partnerStatus = 'assigned';
    if (status === 'shipped') partnerStatus = 'picked';
    if (status === 'out_for_delivery') partnerStatus = 'picked';
    
    // Update assignment status (for DeliveryPartner model)
    assignment.status = partnerStatus;
    
    // Update the actual order status (for Order model)
    const order = await Order.findById(orderId);
    if (order) {
      // Map delivery partner status to order status
      let orderStatus = '';
      switch(partnerStatus) {  // ✅ USE partnerStatus here, not status
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
      
      console.log(`Mapping: partnerStatus=${partnerStatus} -> orderStatus=${orderStatus}`);
      
      order.orderStatus = orderStatus;
      
      // Add to status history
      order.statusHistory.push({
        status: orderStatus,
        note: `Delivery partner updated status to ${partnerStatus}`,
        changedAt: new Date(),
        changedBy: req.user.id,
      });
      
      // ✅ USE partnerStatus here to check for delivered
      if (partnerStatus === 'delivered') {
        order.deliveredAt = new Date();
        partner.totalDeliveries = (partner.totalDeliveries || 0) + 1;
        partner.totalEarnings = (partner.totalEarnings || 0) + 50;
        console.log(`✅ Order ${order.orderNumber} marked as delivered`);
      }
      
      await order.save();
      console.log(`✅ Order ${order.orderNumber} status updated from ${assignment.status} to ${orderStatus}`);
    } else {
      console.log(`⚠️ Order ${orderId} not found`);
    }

    await partner.save();
    console.log(`✅ Partner ${partner.name} assignment status updated to ${partnerStatus}`);

    res.status(200).json({
      success: true,
      message: `Order status updated to ${partnerStatus}`,
      data: {
        orderId,
        partnerStatus: partnerStatus,
        orderStatus: order?.orderStatus
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

// @desc    Update partner availability
// @route   PUT /api/delivery-partner/availability
// @access  Private/DeliveryPartner
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