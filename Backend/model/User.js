import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/* ─────────────────────────────────────────────
   Address Schema
   Added: isDefault (needed by profile/checkout)
   Added: _id: true  (needed by address.id() in profileController)
───────────────────────────────────────────── */
const addressSchema = new mongoose.Schema({
  address1: { type: String, required: true, trim: true },
  address2: { type: String, trim: true },
  city:     String,
  state:    String,
  pincode:  String,
  country:  { type: String, default: "India" },
  isDefault: { type: Boolean, default: false },   // ← added for profile/checkout
}, { _id: true });  // ← changed to true so address.id() works in profileController

/* ─────────────────────────────────────────────
   Cart Item Schema (unchanged)
───────────────────────────────────────────── */
const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  name:     String,
  price:    Number,
  size:     String,
  color:    String,
  quantity: { type: Number, default: 1 },
  image:    String
}, { _id: false });

/* ─────────────────────────────────────────────
   User Schema (unchanged from your original)
───────────────────────────────────────────── */
const userSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    trim: true
  },

  mobileNo: {
    type: String,
    required: true,
    unique: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  password: {
    type: String,
    required: true
  },

  addresses: [addressSchema],
  cartData:  [cartItemSchema],

  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order"
  }],

  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user"
  },

  refreshToken: String,

  isVerified: {
    type: Boolean,
    default: false
  },

  isBlocked: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });


/* ─────────────────────────────────────────────
   Pre-save hook — FIXED

   Original problems:
   1. `next` was not declared as a parameter → "next is not a function"
   2. `return next(new Error(...))` called before isModified check
   3. `return 0` instead of `return next()` when password not modified
   4. `next()` was commented out at the end → Mongoose hung on every save

   Fix: declare `next`, check isModified first, always call next()
───────────────────────────────────────────── */
userSchema.pre("save", async function (next) {   // ← next MUST be declared here

  // If password was not changed, skip hashing entirely
  if (!this.isModified("password")) {
    return next();                               // ← always call next()
  }

  // Password was modified — hash it
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();                                      // ← call next() after hashing
  } catch (err) {
    next(err);                                   // ← forward any bcrypt error
  }
});


/* ─────────────────────────────────────────────
   Methods (unchanged from your original)
───────────────────────────────────────────── */

// ✅ Password comparison
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ✅ Generate access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id:   this._id,
      email: this.email,
      role:  this.role
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m"
    }
  );
};

// ✅ Generate refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { _id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d"
    }
  );
};

export default mongoose.model("User", userSchema);