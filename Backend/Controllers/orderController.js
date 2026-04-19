import Order from "../model/Order.js";
import Cart from "../model/Cart.js";
import Product from "../model/Product.js";
import DeliveryPartner from "../model/DeliveryPartner.js";
import { sendOrderConfirmationEmail } from "../utils/emailService.js";

/* ═══════════════════════════════════════════════════════════
   CUSTOMER CONTROLLERS
═══════════════════════════════════════════════════════════ */


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

    console.log("=== ORDER CREATION DEBUG ===");
    console.log("User from token:", {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    });

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

    const enrichedShippingAddress = {
      name: req.user.name,  // Add user's name to shipping address
      ...shippingAddress
    };

    const order = await Order.create({
      userId: req.user._id,
      items: processedItems,
      subtotal: calculatedSubtotal,
      discount: discount || 0,
      shippingCharge: shippingCharge || (calculatedSubtotal > 500 ? 0 : 50),
      tax: tax || calculatedSubtotal * 0.18,
      totalAmount: calculatedTotal,
      shippingAddress: enrichedShippingAddress,
      billingAddress: billingAddress || enrichedShippingAddress,
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

    console.log(`✅ Order created for user: ${req.user.email} (${req.user.name})`);
    console.log(`Order ID: ${order._id}, Order Number: ${order.orderNumber}`);

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

    if (paymentMethod === "cod" || !req.body.fromBuyNow) {
      await Cart.findOneAndUpdate(
        { userId: req.user._id },
        { $set: { items: [] } }
      );
    }

    const populatedOrder = await Order.findById(order._id).populate("userId", "name email mobileNo");

    // Send order confirmation/received email
    try {
      if (populatedOrder && populatedOrder.userId) {
        await sendOrderConfirmationEmail(populatedOrder.userId.email, populatedOrder);
      }
    } catch (emailErr) {
      console.error("Error sending initial order email:", emailErr);
    }

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ message: error.message });
  }
};


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


export const getMyOrders = async (req, res) => {
  try {
    console.log(`Fetching orders for user: ${req.user._id} (${req.user.email})`);
    
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("items.productId", "name mainImage slug");
    
    console.log(`Found ${orders.length} orders for user ${req.user.email}`);
    
    if (orders.length === 0) {
      return res.json([]);
    }
    
    res.json(orders);
  } catch (error) {
    console.error("getMyOrders error:", error);
    res.status(500).json({ message: error.message });
  }
};


export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "name email mobileNo")
      .populate("statusHistory.changedBy", "name");
    
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.userId._id.toString() !== req.user._id.toString() && req.user.role !== "admin")
      return res.status(403).json({ message: "Not authorized" });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const prev = order.orderStatus;
    order.orderStatus = status;
    order.statusHistory.push({ status, note, changedAt: new Date(), changedBy: req.user._id });

    if (status === "delivered") order.deliveredAt = new Date();

    if (status === "confirmed" && prev !== "confirmed") {
      try {
        const populatedOrder = await Order.findById(order._id).populate("userId", "email name");
        if (populatedOrder && populatedOrder.userId) {
          await sendOrderConfirmationEmail(populatedOrder.userId.email, populatedOrder);
        }
      } catch (emailErr) {
        console.error("Error sending order email in updateOrderStatus:", emailErr);
      }
    }

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
   ADMIN CONTROLLERS
═══════════════════════════════════════════════════════════ */


export const adminGetAllOrders = async (req, res) => {
  const startTime = Date.now();
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.status && req.query.status !== "all")
      query.orderStatus = req.query.status;

    if (req.query.paymentStatus && req.query.paymentStatus !== "all")
      query.paymentStatus = req.query.paymentStatus;

    if (req.query.search) {
      const s = req.query.search.trim();
      query.$or = [
        { orderNumber: { $regex: s, $options: "i" } },
        { "shippingAddress.phone": { $regex: s, $options: "i" } },
        { "shippingAddress.name": { $regex: s, $options: "i" } },  // ✅ ADDED: search by customer name
      ];
    }

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      amount_desc: { totalAmount: -1 },
      amount_asc: { totalAmount: 1 },
    };
    const sort = sortMap[req.query.sort] || { createdAt: -1 };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("userId", "name email mobileNo")
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .lean(),
      Order.countDocuments(query),
    ]);

    const [statusCounts, revenueData] = await Promise.all([
      Order.aggregate([
        { $match: {} },
        { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
        { $limit: 20 }
      ]),
      Order.aggregate([
        { $match: { paymentStatus: "paid", orderStatus: { $nin: ["cancelled", "returned", "refunded"] } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        { $limit: 1 }
      ])
    ]);

    const byStatus = {};
    statusCounts.forEach(s => { byStatus[s._id] = s.count; });
    
    const stats = {
      total: total,
      pending: byStatus.pending || 0,
      confirmed: byStatus.confirmed || 0,
      processing: byStatus.processing || 0,
      shipped: byStatus.shipped || 0,
      out_for_delivery: byStatus.out_for_delivery || 0,
      delivered: byStatus.delivered || 0,
      cancelled: byStatus.cancelled || 0,
      returned: byStatus.returned || 0,
      refunded: byStatus.refunded || 0,
      revenue: revenueData[0]?.total || 0,
    };

    const endTime = Date.now();
    console.log(`✅ Orders fetched in ${endTime - startTime}ms`);

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


export const adminUpdateStatus = async (req, res) => {
  try {
    const { orderStatus, note } = req.body;

    if (!orderStatus)
      return res.status(400).json({ message: "orderStatus is required" });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const prev = order.orderStatus;
    order.orderStatus = orderStatus;

    if (orderStatus === "delivered" && order.paymentMethod === "cod") {
      console.log(`💰 Admin: COD Order ${order.orderNumber} marked as delivered - Updating payment to PAID`);
      order.paymentStatus = "paid";
      
      order.paymentDetails = {
        ...order.paymentDetails,
        transactionId: `COD-${order.orderNumber}-${Date.now()}`,
        paymentId: `COD-${order.orderNumber}`,
        paidAt: new Date()
      };
    }

    order.statusHistory.push({
      status: orderStatus,
      note: note || `Status changed from ${prev} to ${orderStatus}`,
      changedAt: new Date(),
      changedBy: req.user._id,
    });

    if (orderStatus === "delivered") order.deliveredAt = new Date();

    if (orderStatus === "cancelled") {
      order.cancelledAt = new Date();
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

    // Send order confirmation email if status is confirmed
    if (orderStatus === "confirmed" && prev !== "confirmed") {
      try {
        const populatedOrder = await Order.findById(order._id).populate("userId", "email name");
        if (populatedOrder && populatedOrder.userId) {
          await sendOrderConfirmationEmail(populatedOrder.userId.email, populatedOrder);
        }
      } catch (emailErr) {
        console.error("Error sending order confirmation email by admin:", emailErr);
      }
    }

    const updated = await Order.findById(order._id)
      .populate("userId", "name email mobileNo")
      .lean();

    res.json({ success: true, order: updated });
  } catch (error) {
    console.error("adminUpdateStatus error:", error);
    res.status(500).json({ message: error.message });
  }
};


export const adminAssignDelivery = async (req, res) => {
  try {
    const { 
      courierName, 
      trackingNumber, 
      deliveryPartnerId,
      deliveryPartnerName,
      note
    } = req.body;

    console.log("📦 Assigning delivery partner:", { courierName, deliveryPartnerId, deliveryPartnerName });

    if (!courierName && !deliveryPartnerName) {
      return res.status(400).json({ message: "courierName or deliveryPartnerName is required" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const partnerName = deliveryPartnerName || courierName;
    const partnerId = deliveryPartnerId;

    if (partnerId) {
      order.deliveryPartnerId = partnerId;
    }
    order.deliveryPartnerName = partnerName;
    order.courierName = courierName || partnerName;
    order.trackingNumber = trackingNumber || `TRK${Date.now().toString().slice(-8)}`;
    order.assignedAt = new Date();

    const advanceStatuses = ["pending", "confirmed", "processing"];
    if (advanceStatuses.includes(order.orderStatus)) {
      order.orderStatus = "processing";
    }

    order.statusHistory.push({
      status: order.orderStatus,
      note: note || `Assigned to ${partnerName} · Tracking: ${order.trackingNumber}`,
      changedAt: new Date(),
      changedBy: req.user._id,
    });

    await order.save();

    if (partnerId) {
      const deliveryPartner = await DeliveryPartner.findById(partnerId);
      
      if (deliveryPartner) {
        const alreadyAssigned = deliveryPartner.assignedOrders?.some(
          a => a.orderId?.toString() === order._id.toString()
        );
        
        if (!alreadyAssigned) {
          if (!deliveryPartner.assignedOrders) {
            deliveryPartner.assignedOrders = [];
          }
          
          deliveryPartner.assignedOrders.push({
            orderId: order._id,
            assignedAt: new Date(),
            status: 'assigned'
          });
          
          await deliveryPartner.save();
          console.log(`✅ Order ${order.orderNumber} assigned to delivery partner ${deliveryPartner.name}`);
        }
      } else {
        console.log(`⚠️ Delivery partner with ID ${partnerId} not found`);
      }
    }

    const updated = await Order.findById(order._id)
      .populate("userId", "name email mobileNo")
      .lean();

    res.json({ success: true, order: updated });
  } catch (error) {
    console.error("adminAssignDelivery error:", error);
    res.status(500).json({ message: error.message });
  }
};


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