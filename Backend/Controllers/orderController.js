import Order from "../model/Order.js";
import Cart from "../model/Cart.js";
import Product from "../model/Product.js";
import DeliveryPartner from "../model/DeliveryPartner.js";

/* ═══════════════════════════════════════════════════════════
   CUSTOMER CONTROLLERS  (unchanged from original)
═══════════════════════════════════════════════════════════ */

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
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
      paymentDetails,
    } = req.body;

    if (!items || !items.length)
      return res.status(400).json({ message: "Order items are required" });

    if (!shippingAddress)
      return res.status(400).json({ message: "Shipping address is required" });

    let calculatedSubtotal = subtotal;
    let calculatedTotal    = totalAmount;

    if (!calculatedSubtotal)
      calculatedSubtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    if (!calculatedTotal) {
      const calculatedTax      = tax      || calculatedSubtotal * 0.18;
      const calculatedShipping = shippingCharge || (calculatedSubtotal > 500 ? 0 : 50);
      const calculatedDiscount = discount || 0;
      calculatedTotal = calculatedSubtotal - calculatedDiscount + calculatedShipping + calculatedTax;
    }

    const processedItems = items.map((item) => ({
      productId:   item.productId,
      productName: item.name || item.productName,
      variant: {
        size:  item.size  || "FREE",
        color: item.color || "Default",
        sku:   item.sku   || "",
      },
      quantity:   item.quantity,
      price:      item.price,
      totalPrice: item.price * item.quantity,
      image:      item.image || "",
    }));

    const order = await Order.create({
      userId:         req.user._id,
      items:          processedItems,
      subtotal:       calculatedSubtotal,
      discount:       discount || 0,
      shippingCharge: shippingCharge || (calculatedSubtotal > 500 ? 0 : 50),
      tax:            tax || calculatedSubtotal * 0.18,
      totalAmount:    calculatedTotal,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod:  paymentMethod  || "cod",
      paymentStatus:  paymentStatus  || "pending",
      orderStatus:    orderStatus    || "pending",
      paymentDetails: paymentDetails || {},
      customerNotes:  customerNotes  || "",
      statusHistory: [{
        status:    orderStatus || "pending",
        note:      "Order created",
        changedAt: new Date(),
        changedBy: req.user._id,
      }],
    });

    // Reduce product stock
    for (const item of processedItems) {
      const product = await Product.findById(item.productId);
      if (product) {
        const variant = product.variants?.find(
          (v) => v.size === item.variant.size && v.color === item.variant.color
        );
        if (variant) {
          variant.stock -= item.quantity;
          await product.save();
        }
      }
    }

    // Clear cart (skip for buy-now flows)
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

// @desc    Get all orders (basic, admin)
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const query = {};
    if (req.query.status)        query.orderStatus   = req.query.status;
    if (req.query.paymentStatus) query.paymentStatus = req.query.paymentStatus;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("userId", "name email mobileNo")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Order.countDocuments(query),
    ]);

    res.json({ orders, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my orders
// @route   GET /api/orders/my-orders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
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
    const order = await Order.findById(req.params.id).populate("userId", "name email mobileNo");
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.userId._id.toString() !== req.user._id.toString() && req.user.role !== "admin")
      return res.status(403).json({ message: "Not authorized" });

    res.json(order);
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
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.orderStatus = status;
    order.statusHistory.push({ status, note, changedAt: new Date(), changedBy: req.user._id });

    if (status === "delivered") order.deliveredAt = new Date();

    if (status === "cancelled") {
      order.cancelledAt = new Date();
      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (product) {
          const variant = product.variants.find(
            (v) => v.size === item.variant.size && v.color === item.variant.color
          );
          if (variant) { variant.stock += item.quantity; await product.save(); }
        }
      }
    }

    await order.save();
    res.json(order);
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
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.paymentStatus = paymentStatus;
    order.paymentDetails = {
      ...order.paymentDetails,
      transactionId,
      paymentId: transactionId,
      paidAt: paymentStatus === "paid" ? new Date() : null,
    };

    await order.save();
    res.json(order);
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
    if (!req.params.id) return res.status(400).json({ message: "Order ID is required" });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== "admin")
      return res.status(403).json({ message: "Not authorized to cancel this order" });

    const cancellableStatuses = ["pending", "confirmed", "processing"];
    if (!cancellableStatuses.includes(order.orderStatus))
      return res.status(400).json({
        message: `Order cannot be cancelled at '${order.orderStatus}' stage.`,
      });

    order.orderStatus        = "cancelled";
    order.cancellationReason = reason || "Cancelled by customer";
    order.cancelledAt        = new Date();
    order.statusHistory.push({
      status:    "cancelled",
      note:      reason || "Cancelled by customer",
      changedAt: new Date(),
      changedBy: req.user._id,
    });

    for (const item of order.items) {
      try {
        const product = await Product.findById(item.productId);
        if (product) {
          if (product.variants?.length) {
            const variant = product.variants.find(
              (v) => v.size === item.variant?.size && v.color === item.variant?.color
            );
            if (variant) { variant.stock = (variant.stock || 0) + item.quantity; await product.save(); }
          } else {
            product.stock = (product.stock || 0) + item.quantity;
            await product.save();
          }
        }
      } catch (stockErr) {
        console.error(`Stock restore error for ${item.productId}:`, stockErr);
      }
    }

    await order.save();
    res.json({ success: true, message: "Order cancelled successfully", order });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

/* ═══════════════════════════════════════════════════════════
   ADMIN CONTROLLERS  (new — required by admin Orders page)
═══════════════════════════════════════════════════════════ */

// @desc    Get all orders with stats, search, pagination
// @route   GET /api/orders/admin/all
// @access  Private/Admin
export const adminGetAllOrders = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip  = (page - 1) * limit;

    /* ── Build filter query ── */
    const query = {};

    if (req.query.status && req.query.status !== "all")
      query.orderStatus = req.query.status;

    if (req.query.paymentStatus && req.query.paymentStatus !== "all")
      query.paymentStatus = req.query.paymentStatus;

    /* ── Search: order number, phone, customer name ── */
    if (req.query.search) {
      const s = req.query.search.trim();
      query.$or = [
        { orderNumber: { $regex: s, $options: "i" } },
        { "shippingAddress.phone": { $regex: s, $options: "i" } },
      ];
    }

    /* ── Sort ── */
    const sortMap = {
      newest:      { createdAt: -1 },
      oldest:      { createdAt:  1 },
      amount_desc: { totalAmount: -1 },
      amount_asc:  { totalAmount:  1 },
    };
    const sort = sortMap[req.query.sort] || { createdAt: -1 };

    /* ── Execute in parallel ── */
    const [orders, total, statsRaw] = await Promise.all([
      Order.find(query)
        .populate("userId", "name email mobileNo")
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .lean(),
      Order.countDocuments(query),

      // Aggregate stats (always across ALL orders, no filter)
      Order.aggregate([
        {
          $facet: {
            byStatus: [
              { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
            ],
            revenue: [
              { $match: { paymentStatus: "paid" } },
              { $group: { _id: null, total: { $sum: "$totalAmount" } } },
            ],
            totalAll: [{ $count: "n" }],
          },
        },
      ]),
    ]);

    /* ── Shape stats ── */
    const byStatus = {};
    (statsRaw[0]?.byStatus || []).forEach((s) => { byStatus[s._id] = s.count; });
    const stats = {
      total:     statsRaw[0]?.totalAll?.[0]?.n || 0,
      pending:   byStatus.pending   || 0,
      confirmed: byStatus.confirmed || 0,
      processing:byStatus.processing|| 0,
      shipped:   byStatus.shipped   || 0,
      out_for_delivery: byStatus.out_for_delivery || 0,
      delivered: byStatus.delivered || 0,
      cancelled: byStatus.cancelled || 0,
      returned:  byStatus.returned  || 0,
      refunded:  byStatus.refunded  || 0,
      revenue:   statsRaw[0]?.revenue?.[0]?.total || 0,
    };

    res.json({
      orders,
      page,
      totalPages: Math.ceil(total / limit),
      total,
      stats,
    });
  } catch (error) {
    console.error("adminGetAllOrders error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single order detail (admin — always allowed)
// @route   GET /api/orders/admin/:id
// @access  Private/Admin
export const adminGetOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "name email mobileNo")
      .populate("statusHistory.changedBy", "name")
      .lean();

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({ order });
  } catch (error) {
    console.error("adminGetOrderById error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status (admin panel — richer response)
// @route   PUT /api/orders/admin/:id/status
// @access  Private/Admin
export const adminUpdateStatus = async (req, res) => {
  try {
    const { orderStatus, note } = req.body;

    if (!orderStatus)
      return res.status(400).json({ message: "orderStatus is required" });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const prev = order.orderStatus;
    order.orderStatus = orderStatus;

    order.statusHistory.push({
      status:    orderStatus,
      note:      note || `Status changed from ${prev} to ${orderStatus}`,
      changedAt: new Date(),
      changedBy: req.user._id,
    });

    if (orderStatus === "delivered") order.deliveredAt = new Date();

    if (orderStatus === "cancelled") {
      order.cancelledAt = new Date();
      // Restore stock
      for (const item of order.items) {
        try {
          const product = await Product.findById(item.productId);
          if (product) {
            const variant = product.variants?.find(
              (v) => v.size === item.variant?.size && v.color === item.variant?.color
            );
            if (variant) {
              variant.stock = (variant.stock || 0) + item.quantity;
              await product.save();
            }
          }
        } catch (e) { console.error("Stock restore error:", e.message); }
      }
    }

    await order.save();
    const updated = await Order.findById(order._id)
      .populate("userId", "name email mobileNo")
      .lean();

    res.json({ success: true, order: updated });
  } catch (error) {
    console.error("adminUpdateStatus error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    ✅ FIXED: Assign delivery partner to order
// @route   PUT /api/orders/admin/:id/assign
// @access  Private/Admin
export const adminAssignDelivery = async (req, res) => {
  try {
    const {
      courierName,
      trackingNumber,
      deliveryPartnerId,   // ✅ NEW: Accept partner ID
      deliveryPartnerName, // ✅ NEW: Accept partner name
      estimatedDelivery,
      note
    } = req.body;

    if (!courierName || !deliveryPartnerId)
      return res.status(400).json({ message: "courierName and deliveryPartnerId are required" });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // ✅ FIXED: Save delivery partner info to order
    order.deliveryPartnerId   = deliveryPartnerId;
    order.deliveryPartnerName = deliveryPartnerName || courierName;
    order.courierName         = courierName;
    order.trackingNumber      = trackingNumber || `TRK${Date.now().toString().slice(-8)}`;
    order.assignedAt          = new Date();

    if (estimatedDelivery) order.estimatedDelivery = new Date(estimatedDelivery);

    // Keep existing status (do NOT auto-advance to shipped)
    order.statusHistory.push({
      status:    order.orderStatus,
      note:      note || `Assigned to ${courierName} (${deliveryPartnerName}) · Tracking: ${order.trackingNumber}`,
      changedAt: new Date(),
      changedBy: req.user._id,
    });

    await order.save();
    
    const updated = await Order.findById(order._id)
      .populate("userId", "name email mobileNo")
      .lean();

    res.json({ success: true, order: updated });
  } catch (error) {
    console.error("adminAssignDelivery error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Save / update admin note on order
// @route   PUT /api/orders/admin/:id/note
// @access  Private/Admin
export const adminUpdateNote = async (req, res) => {
  try {
    const { adminNotes } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.adminNotes = adminNotes || "";
    await order.save();

    res.json({ success: true, message: "Note saved", adminNotes: order.adminNotes });
  } catch (error) {
    console.error("adminUpdateNote error:", error);
    res.status(500).json({ message: error.message });
  }
};