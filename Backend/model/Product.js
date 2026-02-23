import mongoose from "mongoose";

const productVariantSchema = new mongoose.Schema({
  size: {
    type: String,
    required: true,
    enum: ["XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "36", "38", "40", "FREE"]
  },
  color: {
    type: String,
    required: true
  },
  colorCode: String, // HEX code for UI
  sku: {
    type: String,
    required: true,
    unique: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discountedPrice: {
    type: Number,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  images: [String],
  isActive: {
    type: Boolean,
    default: true
  }
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: String,
  
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  },
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  },
  
  brand: String,
  fabric: String,
  pattern: String,
  occasion: [String], 
  season: [String],
  
  mainImage: {
    type: String,
    required: true
  },
  galleryImages: [String],
  videoUrl: String,
  
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  discountType: {
    type: String,
    enum: ["percentage", "fixed", "none"],
    default: "none"
  },
  discountValue: {
    type: Number,
    default: 0,
    min: 0
  },
  
  variants: [productVariantSchema],
  
  totalStock: {
    type: Number,
    min: 0,
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 5
  },
  
  ratings: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rating: { type: Number, min: 1, max: 5 },
    review: String,
    createdAt: { type: Date, default: Date.now }
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  
  metaTitle: String,
  metaDescription: String,
  metaKeywords: [String],
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  isNewArrival: {
    type: Boolean,
    default: false
  },
  isBestSeller: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  totalSold: {
    type: Number,
    default: 0
  },
  
  returnPolicy: {
    isReturnable: { type: Boolean, default: true },
    returnPeriod: { type: Number, default: 7 } // Days
  }
}, { timestamps: true });

productSchema.index({ name: "text", description: "text" });
productSchema.index({ category: 1, "variants.price": 1 });
productSchema.index({ isFeatured: 1, createdAt: -1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ totalSold: -1 });

productSchema.virtual('currentPrice').get(function() {
  if (this.discountType === "percentage") {
    return this.basePrice - (this.basePrice * this.discountValue / 100);
  } else if (this.discountType === "fixed") {
    return this.basePrice - this.discountValue;
  }
  return this.basePrice;
});

export default mongoose.model("Product", productSchema);