import Order from "../model/Order.js";
import Cart from "../model/Cart.js";
import Product from "../model/Product.js";
import Coupon from "../model/Coupon.js";

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      couponCode,
      customerNotes
    } = req.body;

    // Get user's cart if items not provided
    let orderItems = items;
    if (!items) {
      const cart = await Cart.findOne({ userId: req.user._id });
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }
      orderItems = cart.items;
    }

    // Calculate totals
    let subtotal = 0;
    for (const item of orderItems) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ message: `Product ${item.productId} not found` });
      }

      // Check stock
      const variant = product.variants.find(v => 
        v.size === item.size && v.color === item.color
      );
      
      if (!variant || variant.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name} (${item.size}, ${item.color})` 
        });
      }

      // Calculate price
      const price = variant.discountedPrice || variant.price;
      item.price = price;
      item.totalPrice = price * item.quantity;
      subtotal += item.totalPrice;
    }

    // Apply coupon
    let discount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ 
        code: couponCode.toUpperCase(),
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() }
      });

      if (coupon) {
        if (subtotal >= coupon.minOrderAmount) {
          if (coupon.discountType === "percentage") {
            discount = (subtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscountAmount) {
              discount = Math.min(discount, coupon.maxDiscountAmount);
            }
          } else {
            discount = coupon.discountValue;
          }
        }
      }
    }

    // Calculate tax and shipping
    const tax = subtotal * 0.18; // 18% GST example
    const shippingCharge = subtotal > 500 ? 0 : 50;

    const totalAmount = subtotal - discount + shippingCharge + tax;

    // Create order
    const order = await Order.create({
      userId: req.user._id,
      items: orderItems.map(item => ({
        productId: item.productId,
        productName: item.name,
        variant: {
          size: item.size,
          color: item.color,
          sku: item.sku
        },
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.price * item.quantity,
        image: item.image
      })),
      subtotal,
      discount,
      shippingCharge,
      tax,
      totalAmount,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod,
      customerNotes,
      orderStatus: "pending",
      paymentStatus: paymentMethod === "cod" ? "pending" : "pending"
    });

    // Update product stock
    for (const item of orderItems) {
      const product = await Product.findById(item.productId);
      const variant = product.variants.find(v => 
        v.size === item.size && v.color === item.color
      );
      if (variant) {
        variant.stock -= item.quantity;
        await product.save();
      }
    }

    // Clear cart
    await Cart.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { items: [] } }
    );

    res.status(201).json(order);
  } catch (error) {
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
export const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user is authorized
    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Check if order can be cancelled
    if (!["pending", "confirmed"].includes(order.orderStatus)) {
      return res.status(400).json({ 
        message: "Order cannot be cancelled at this stage" 
      });
    }

    order.orderStatus = "cancelled";
    order.cancellationReason = reason;
    order.cancelledAt = new Date();

    // Restore stock
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

    await order.save();
    res.json({ message: "Order cancelled successfully", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};