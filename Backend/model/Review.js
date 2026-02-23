import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order" 
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: String,
  review: {
    type: String,
    required: true
  },
  
  fit: {
    type: String,
    enum: ["small", "true_to_size", "large"]
  },
  quality: {
    type: Number,
    min: 1,
    max: 5
  },
  
  images: [String],
  
  helpfulCount: {
    type: Number,
    default: 0
  },
  helpfulUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  
  adminResponse: {
    response: String,
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    respondedAt: Date
  },
  
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);