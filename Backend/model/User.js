// User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const addressSchema = new mongoose.Schema({
  address1: { type: String, required: true, trim: true },
  address2: { type: String, trim: true },
  city: String,
  state: String,
  pincode: String,
  country: { type: String, default: "India" }
}, { _id: false });

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  name: String,
  price: Number,
  size: String,
  color: String,
  quantity: { type: Number, default: 1 },
  image: String
}, { _id: false });

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

  cartData: [cartItemSchema],

  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order"
  }],

  role: {
    type: String,
    enum: ["admin","user" ],
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


userSchema.pre("save", async function () {

   if (!this.password) {
      return next(new Error("Password missing"));
   }

   if (!this.isModified("password")) {
      return 0;
   }

   this.password = await bcrypt.hash(this.password, 10);
  //  next();
});
  //  ✅ PASSWORD COMPARISON METHOD


userSchema.methods.comparePassword = async function (enteredPassword) {
   return await bcrypt.compare(enteredPassword, this.password);
};


  //  ✅ GENERATE ACCESS TOKEN


userSchema.methods.generateAccessToken = function () {

  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      role: this.role
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m"
    }
  );
};



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