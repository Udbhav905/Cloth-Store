import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  name: String,
  description: String,
  
  discountType: {
    type: String,
    enum: ["percentage", "fixed"],
    required: true
  },
  discountValue: {
    type: Number,
    required: true
  },
  maxDiscountAmount: Number, 
  
  minOrderAmount: {
    type: Number,
    default: 0
  },
  maxUsage: {
    type: Number,
    default: null 
  },
  usagePerUser: {
    type: Number,
    default: 1
  },
  
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  }],
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  }],
  excludedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  }],
  
  applicableUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  minUserOrders: Number, 
  firstTimeOnly: {
    type: Boolean,
    default: false
  },
  
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  
  totalUsed: {
    type: Number,
    default: 0
  },
  userUsage: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    usedCount: { type: Number, default: 0 }
  }],
  
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.model("Coupon", couponSchema);