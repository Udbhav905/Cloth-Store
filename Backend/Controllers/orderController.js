import Order from "../model/Order.js";
import Cart from "../model/Cart.js";
import Product from "../model/Product.js";
// import Coupon from "../model/Coupon.js";

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
// In orderController.js, update the createOrder function:

export const createOrder = async (req, res) => {
  try {
    const {
      items,
      subtotal,
      discount,
      shippingCharge,
      tax,
      totalAmount,
      shippingAddress,
      billingAddress,
      paymentMethod,
      paymentStatus,
      orderStatus,
      couponCode,
      customerNotes,
      paymentDetails
    } = req.body;

    // Validate required fields
    if (!items || !items.length) {
      return res.status(400).json({ message: "Order items are required" });
    }

    if (!shippingAddress) {
      return res.status(400).json({ message: "Shipping address is required" });
    }

    // Calculate totals if not provided
    let calculatedSubtotal = subtotal;
    let calculatedTotal = totalAmount;
    
    if (!calculatedSubtotal) {
      calculatedSubtotal = items.reduce((acc, item) => 
        acc + (item.price * item.quantity), 0
      );
    }
    
    if (!calculatedTotal) {
      const calculatedTax = tax || (calculatedSubtotal * 0.18);
      const calculatedShipping = shippingCharge || (calculatedSubtotal > 500 ? 0 : 50);
      const calculatedDiscount = discount || 0;
      calculatedTotal = calculatedSubtotal - calculatedDiscount + calculatedShipping + calculatedTax;
    }

    // Process items to match schema
    const processedItems = items.map(item => ({
      productId: item.productId,
      productName: item.name || item.productName,
      variant: {
        size: item.size || "FREE",
        color: item.color || "Default",
        sku: item.sku || "",
      },
      quantity: item.quantity,
      price: item.price,
      totalPrice: item.price * item.quantity,
      image: item.image || "",
    }));

    // Create order
    const order = await Order.create({
      userId: req.user._id,
      items: processedItems,
      subtotal: calculatedSubtotal,
      discount: discount || 0,
      shippingCharge: shippingCharge || (calculatedSubtotal > 500 ? 0 : 50),
      tax: tax || (calculatedSubtotal * 0.18),
      totalAmount: calculatedTotal,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod: paymentMethod || "cod",
      paymentStatus: paymentStatus || "pending",
      orderStatus: orderStatus || "pending",
      paymentDetails: paymentDetails || {},
      customerNotes: customerNotes || "",
      statusHistory: [{
        status: orderStatus || "pending",
        note: "Order created",
        changedAt: new Date(),
        changedBy: req.user._id,
      }],
    });

    // Update product stock
    for (const item of processedItems) {
      const product = await Product.findById(item.productId);
      if (product) {
        const variant = product.variants?.find(v => 
          v.size === item.variant.size && v.color === item.variant.color
        );
        if (variant) {
          variant.stock -= item.quantity;
          await product.save();
        }
      }
    }

    // Clear cart only for COD or if not coming from buy now
    if (paymentMethod === "cod" || !req.body.fromBuyNow) {
      await Cart.findOneAndUpdate(
        { userId: req.user._id },
        { $set: { items: [] } }
      );
    }

    res.status(201).json(order);
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    
    // Filter by status
    if (req.query.status) {
      query.orderStatus = req.query.status;
    }
    
    if (req.query.paymentStatus) {
      query.paymentStatus = req.query.paymentStatus;
    }

    const orders = await Order.find(query)
      .populate("userId", "name email mobileNo")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user orders
// @route   GET /api/orders/my-orders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "name email mobileNo");

    if (order) {
      // Check if user is authorized
      if (order.userId._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      res.json(order);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (order) {
      order.orderStatus = status;
      
      // Add to status history
      order.statusHistory.push({
        status,
        note,
        changedAt: new Date(),
        changedBy: req.user._id
      });

      // Update timestamps based on status
      if (status === "delivered") {
        order.deliveredAt = new Date();
      } else if (status === "cancelled") {
        order.cancelledAt = new Date();
        
        // Restore stock for cancelled orders
        for (const item of order.items) {
          const product = await Product.findById(item.productId);
          if (product) {
            const variant = product.variants.find(v => 
              v.size === item.variant.size && v.color === item.variant.color
            );
            if (variant) {
              variant.stock += item.quantity;
              await product.save();
            }
          }
        }
      }

      await order.save();
      res.json(order);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update payment status
// @route   PUT /api/orders/:id/payment
// @access  Private/Admin
export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, transactionId } = req.body;
    const order = await Order.findById(req.params.id);

    if (order) {
      order.paymentStatus = paymentStatus;
      order.paymentDetails = {
        ...order.paymentDetails,
        transactionId,
        paymentId: transactionId,
        paidAt: paymentStatus === "paid" ? new Date() : null
      };

      await order.save();
      res.json(order);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    
    // Validate order ID
    if (!req.params.id) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user is authorized
    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to cancel this order" });
    }

    // Check if order can be cancelled
    const cancellableStatuses = ["pending", "confirmed", "processing"]; // Added "processing"
    
    if (!cancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({ 
        message: `Order cannot be cancelled at '${order.orderStatus}' stage. Only orders with status: ${cancellableStatuses.join(', ')} can be cancelled.`
      });
    }

    // Update order status
    order.orderStatus = "cancelled";
    order.cancellationReason = reason || "Cancelled by customer";
    order.cancelledAt = new Date();

    // Add to status history
    order.statusHistory.push({
      status: "cancelled",
      note: reason || "Cancelled by customer",
      changedAt: new Date(),
      changedBy: req.user._id
    });

    // Restore stock for each item
    for (const item of order.items) {
      try {
        const product = await Product.findById(item.productId);
        if (product) {
          // Handle different product structures
          if (product.variants && product.variants.length > 0) {
            // If product has variants
            const variant = product.variants.find(v => 
              v.size === item.variant?.size && v.color === item.variant?.color
            );
            if (variant) {
              variant.stock = (variant.stock || 0) + item.quantity;
              await product.save();
            }
          } else {
            // If product doesn't have variants, update main stock
            product.stock = (product.stock || 0) + item.quantity;
            await product.save();
          }
        }
      } catch (stockError) {
        console.error(`Error restoring stock for product ${item.productId}:`, stockError);
        // Continue with cancellation even if stock restore fails
      }
    }

    await order.save();
    
    res.json({ 
      success: true,
      message: "Order cancelled successfully", 
      order 
    });
    
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ 
      message: error.message || "Internal server error while cancelling order" 
    });
  }
};