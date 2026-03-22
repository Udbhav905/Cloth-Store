import mongoose from "mongoose";

/* ─────────────────────────────────────────────
   VARIANT SCHEMA
───────────────────────────────────────────── */
const productVariantSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      required: true,
      enum: ["XS","S","M","L","XL","XXL","28","30","32","34","36","38","40","FREE"],
    },
    color:     { type: String, required: true },
    colorCode: String,
    sku:       { type: String, required: true, unique: true },
    price:     { type: Number, required: true, min: 0 },
    discountedPrice: { type: Number, min: 0 },
    stock:     { type: Number, required: true, min: 0, default: 0 },
    images:    [String],
    isActive:  { type: Boolean, default: true },
  },
  { _id: false } // ← saves storage + speeds up variant reads (no _id per variant)
);

/* ─────────────────────────────────────────────
   RATING SCHEMA (extracted for clarity)
───────────────────────────────────────────── */
const ratingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    review: String,
  },
  {
    _id: false,                    // ← no _id per rating
    timestamps: { createdAt: true, updatedAt: false }, // ← only createdAt
  }
);

/* ─────────────────────────────────────────────
   PRODUCT SCHEMA
───────────────────────────────────────────── */
const productSchema = new mongoose.Schema(
  {
    /* ── Core ── */
    name:             { type: String, required: true, trim: true },
    slug:             { type: String, required: true, unique: true, lowercase: true, trim: true },
    description:      { type: String, required: true },
    shortDescription: String,

    /* ── Category ── */
    category:    { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },

    /* ── Attributes ── */
    brand:    String,
    fabric:   String,
    pattern:  String,
    occasion: [String],
    season:   [String],

    /* ── Media ── */
    mainImage:     { type: String, required: true },
    galleryImages: { type: [String], default: [] },
    videoUrl:      String,

    /* ── Pricing ── */
    basePrice:     { type: Number, required: true, min: 0 },
    discountType:  { type: String, enum: ["percentage", "fixed", "none"], default: "none" },
    discountValue: { type: Number, default: 0, min: 0 },

    /* ── Variants & Stock ── */
    variants:          { type: [productVariantSchema], default: [] },
    totalStock:        { type: Number, min: 0, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },

    /* ── Ratings ── */
    ratings:       { type: [ratingSchema], default: [] },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews:  { type: Number, default: 0, min: 0 },

    /* ── SEO ── */
    metaTitle:       String,
    metaDescription: String,
    metaKeywords:    { type: [String], default: [] },

    /* ── Flags ── */
    isFeatured:   { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isActive:     { type: Boolean, default: true },

    /* ── Stats ── */
    totalSold: { type: Number, default: 0, min: 0 },

    /* ── Policy ── */
    returnPolicy: {
      isReturnable: { type: Boolean, default: true },
      returnPeriod: { type: Number, default: 7 },
    },
  },
  {
    timestamps: true,
    // ── Virtuals included in toJSON/toObject (for .lean() use select instead)
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ─────────────────────────────────────────────
   INDEXES
   Rule: index every field used in .find(),
   .sort(), or .populate() filter
───────────────────────────────────────────── */

// ── Unique (already implied but explicit is faster)
// productSchema.index({ slug: 1 },        { unique: true });

// ── Single field — most common filters
productSchema.index({ category: 1 });
productSchema.index({ subCategory: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isNewArrival: 1 });
productSchema.index({ isBestSeller: 1 });
productSchema.index({ basePrice: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ totalSold: -1 });
productSchema.index({ createdAt: -1 });

// ── Compound — matches exact query patterns your API uses
// GET /products?category=X&isActive=true  (most common)
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ category: 1, isActive: 1, createdAt: -1 });
productSchema.index({ category: 1, isActive: 1, basePrice: 1 });

// GET /products/featured  →  { isFeatured: true, isActive: true }
productSchema.index({ isFeatured: 1, isActive: 1, createdAt: -1 });

// GET /products/new-arrivals  →  { isNewArrival: true, isActive: true }
productSchema.index({ isNewArrival: 1, isActive: 1, createdAt: -1 });

// GET /products/best-sellers  →  { isBestSeller: true, isActive: true }
productSchema.index({ isBestSeller: 1, isActive: 1, totalSold: -1 });

// Sort by price + filter active
productSchema.index({ isActive: 1, basePrice: 1 });
productSchema.index({ isActive: 1, createdAt: -1 });

// ── Full-text search on name + description + brand
productSchema.index(
  { name: "text", description: "text", brand: "text", shortDescription: "text" },
  { weights: { name: 10, brand: 5, shortDescription: 3, description: 1 }, name: "product_text_search" }
);

/* ─────────────────────────────────────────────
   VIRTUAL — computed final price
   (only works when NOT using .lean())
───────────────────────────────────────────── */
productSchema.virtual("finalPrice").get(function () {
  if (this.discountType === "percentage" && this.discountValue > 0) {
    return Math.max(0, this.basePrice - (this.basePrice * this.discountValue) / 100);
  }
  if (this.discountType === "fixed" && this.discountValue > 0) {
    return Math.max(0, this.basePrice - this.discountValue);
  }
  return this.basePrice;
});

/* ─────────────────────────────────────────────
   PRE-SAVE HOOK — auto-sync totalStock
   from variants so you never query variants
   just to get total stock
───────────────────────────────────────────── */
productSchema.pre("save", function (next) {
  if (this.isModified("variants")) {
    this.totalStock = this.variants
      .filter((v) => v.isActive)
      .reduce((sum, v) => sum + (v.stock || 0), 0);
  }
  // next();
});

/* ─────────────────────────────────────────────
   STATIC METHODS
   Use these in your controllers instead of
   raw .find() for consistent lean() + select
───────────────────────────────────────────── */

// Usage: Product.findFeatured(8)
productSchema.statics.findFeatured = function (limit = 8) {
  return this.find({ isFeatured: true, isActive: true })
    .lean()
    .select("name slug mainImage basePrice discountType discountValue averageRating totalReviews isBestSeller isNewArrival category totalStock")
    .populate("category", "name slug")
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Usage: Product.findNewArrivals(8)
productSchema.statics.findNewArrivals = function (limit = 8) {
  return this.find({ isNewArrival: true, isActive: true })
    .lean()
    .select("name slug mainImage basePrice discountType discountValue averageRating totalReviews isBestSeller category totalStock")
    .populate("category", "name slug")
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Usage: Product.findBestSellers(8)
productSchema.statics.findBestSellers = function (limit = 8) {
  return this.find({ isBestSeller: true, isActive: true })
    .lean()
    .select("name slug mainImage basePrice discountType discountValue averageRating totalReviews category totalStock totalSold")
    .populate("category", "name slug")
    .sort({ totalSold: -1 })
    .limit(limit);
};

// Usage: Product.findByCategory(categoryId, { page, limit, sort })
productSchema.statics.findByCategory = function (categoryId, { page = 1, limit = 12, sort = "-createdAt" } = {}) {
  const skip = (page - 1) * limit;
  return this.find({ category: categoryId, isActive: true })
    .lean()
    .select("name slug mainImage basePrice discountType discountValue averageRating totalReviews isBestSeller isNewArrival totalStock")
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

export default mongoose.model("Product", productSchema);