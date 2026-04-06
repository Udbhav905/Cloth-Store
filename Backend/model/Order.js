import mongoose from "mongoose";

/* ─────────────────────────────────────────────
   Order Item Schema
───────────────────────────────────────────── */
const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  variant: {
    size:  String,
    color: String,
    sku:   String
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  discountedPrice: Number,
  totalPrice: {
    type: Number,
    required: true
  },
  image: String
});

/* ─────────────────────────────────────────────
   Main Order Schema
───────────────────────────────────────────── */
const orderSchema = new mongoose.Schema({

  orderNumber: {
    type: String,
    unique: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  items: [orderItemSchema],

  subtotal:       { type: Number, required: true },
  discount:       { type: Number, default: 0 },
  shippingCharge: { type: Number, default: 0 },
  tax:            { type: Number, default: 0 },
  totalAmount:    { type: Number, required: true },

  shippingAddress: {
    address1: String,
    address2: String,
    landmark: String,
    city:     String,
    state:    String,
    pincode:  String,
    country:  String,
    phone:    String
  },

  billingAddress: {
    address1: String,
    address2: String,
    city:     String,
    state:    String,
    pincode:  String,
    country:  String,
    phone:    String
  },

  paymentMethod: {
    type: String,
    enum: ["cod", "card", "upi", "netbanking", "wallet"],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending"
  },
  paymentDetails: {
    transactionId: String,
    paymentId:     String,
    paidAt:        Date
  },

  orderStatus: {
    type: String,
    enum: [
      "pending", "confirmed", "processing", "shipped",
      "out_for_delivery", "delivered", "cancelled", "returned", "refunded"
    ],
    default: "pending"
  },

  // ✅ NEW: Store delivery partner ID (for proper linking)
  deliveryPartnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DeliveryPartner",
    default: null
  },

  // ✅ NEW: Store delivery partner name (for quick display)
  deliveryPartnerName: String,

  trackingNumber:    String,
  courierName:       String,
  estimatedDelivery: Date,
  deliveredAt:       Date,

  // ✅ NEW: Track assignment time
  assignedAt: Date,

  statusHistory: [{
    status:    String,
    note:      String,
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  }],

  cancellationReason: String,
  cancelledAt:        Date,
  returnReason:       String,
  returnedAt:         Date,
  customerNotes:      String,
  adminNotes:         String

}, { timestamps: true });


/* ─────────────────────────────────────────────
   Auto-generate orderNumber with proper error handling
───────────────────────────────────────────── */
orderSchema.pre("save", async function() {
  // Only generate for new documents
  if (!this.isNew || this.orderNumber) {
    return;
  }

  try {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");

    const lastOrder = await this.constructor
      .findOne({}, { orderNumber: 1 })
      .sort({ createdAt: -1 })
      .lean();

    let sequence = 1;
    if (lastOrder?.orderNumber) {
      const lastSeq = parseInt(lastOrder.orderNumber.slice(-4), 10);
      if (!isNaN(lastSeq)) sequence = lastSeq + 1;
    }

    this.orderNumber = `ORD${year}${month}${day}${sequence.toString().padStart(4, "0")}`;
  } catch (err) {
    console.error("Error in pre-save hook:", err);
    this.orderNumber = `ORD${Date.now().toString().slice(-8)}`;
  }
});

/* ── Indexes ── */
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
// ✅ NEW: Index for delivery partner orders
orderSchema.index({ deliveryPartnerId: 1, createdAt: -1 });

export default mongoose.model("Order", orderSchema);