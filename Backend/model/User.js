import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/* ─────────────────────────────────────────────
   Address Schema
───────────────────────────────────────────── */
const addressSchema = new mongoose.Schema({
  address1:  { type: String, required: true, trim: true },
  address2:  { type: String, trim: true },
  city:      String,
  state:     String,
  pincode:   String,
  country:   { type: String, default: "India" },
  isDefault: { type: Boolean, default: false },
}, { _id: true });

/* ─────────────────────────────────────────────
   Cart Item Schema
───────────────────────────────────────────── */
const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name:     String,
  price:    Number,
  size:     String,
  color:    String,
  quantity: { type: Number, default: 1 },
  image:    String,
}, { _id: false });

/* ─────────────────────────────────────────────
   User Schema
───────────────────────────────────────────── */
const userSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    trim: true,
  },

  mobileNo: {
    type: String,
    required: true,
    unique: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },

  password: {
    type: String,
    required: true,
  },

  addresses: [addressSchema],
  cartData:  [cartItemSchema],

  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  }],

  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },

  refreshToken: String,

  isVerified: {
    type: Boolean,
    default: false,
  },

  isBlocked: {
    type: Boolean,
    default: false,
  },

  lastLogin: Date,

}, { timestamps: true });


/* ─────────────────────────────────────────────
   Pre-save Hook — Hash password only when modified
   FIX: `next` properly declared, always called
───────────────────────────────────────────── */
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

/* ─────────────────────────────────────────────
   Instance Methods
───────────────────────────────────────────── */

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate short-lived access token
// Uses JWT_SECRET as fallback so authController.js works too
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id:   this._id,
      email: this.email,
      role:  this.role,
    },
    process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m",
    }
  );
};

// Generate long-lived refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { _id: this._id },
    process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d",
    }
  );
};

export default mongoose.model("User", userSchema);