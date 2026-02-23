import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  variantId: mongoose.Schema.Types.ObjectId,
  name: String,
  size: String,
  color: String,
  price: {
    type: Number,
    required: true
  },
  discountedPrice: Number,
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  image: String,
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  
  totalItems: {
    type: Number,
    default: 0
  },
  subtotal: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  
  couponCode: String,
  couponDiscount: {
    type: Number,
    default: 0
  },
  
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 7*24*60*60*1000) 
  }
}, { timestamps: true });

cartSchema.pre('save', function(next) {
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.subtotal = this.items.reduce((sum, item) => 
    sum + (item.discountedPrice || item.price) * item.quantity, 0
  );
  this.total = this.subtotal - this.couponDiscount;
  next();
});

cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Cart", cartSchema);