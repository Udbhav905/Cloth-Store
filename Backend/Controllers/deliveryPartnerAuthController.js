import DeliveryPartner from '../model/DeliveryPartner.js';
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

// @desc    Get partner's assigned orders
// @route   GET /api/delivery-partner/orders
// @access  Private/DeliveryPartner
export const getPartnerOrders = async (req, res) => {
  try {
    const partner = await DeliveryPartner.findById(req.user.id)
      .populate('assignedOrders.orderId');
    
    if (!partner || !partner.assignedOrders) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }
    
    const orders = partner.assignedOrders.map(assignment => {
      if (!assignment.orderId) return null;
      return {
        _id: assignment.orderId._id,
        orderNumber: assignment.orderId.orderNumber,
        customerName: assignment.orderId.userId?.name || 'N/A',
        customerPhone: assignment.orderId.shippingAddress?.phone,
        shippingAddress: assignment.orderId.shippingAddress,
        totalAmount: assignment.orderId.totalAmount,
        items: assignment.orderId.items || [],
        status: assignment.status,
        assignedAt: assignment.assignedAt,
        deliveredAt: assignment.orderId.deliveredAt,
        subtotal: assignment.orderId.subtotal,
        discount: assignment.orderId.discount,
      };
    }).filter(order => order !== null);

    res.status(200).json({
      success: true,
      data: orders,
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

// @desc    Update delivery status
// @route   PUT /api/delivery-partner/orders/:orderId/status
// @access  Private/DeliveryPartner
export const updateDeliveryStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const partner = await DeliveryPartner.findById(req.user.id);
    
    const assignment = partner.assignedOrders.find(
      a => a.orderId.toString() === orderId
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Order not assigned to you',
      });
    }

    assignment.status = status;
    if (status === 'delivered') {
      partner.totalDeliveries += 1;
      // Add earnings (example: ₹50 per delivery)
      partner.totalEarnings += 50;
    }

    await partner.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
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