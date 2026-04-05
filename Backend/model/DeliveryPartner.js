import mongoose from "mongoose";

const deliveryPartnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Partner name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please enter a valid email",
    ],
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
    trim: true,
    match: [/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"],
  },
  // Add this to your schema
   password: {
    type: String,
    default: function() {
      // Generate a default password based on phone number
      return this.phone || 'delivery@123';
    }
  },
  lastLogin: {
    type: Date,
  }, // Add this to your schema
 
  companyName: {
    type: String,
    required: [true, "Company name is required"],
    trim: true,
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" },
  },
  vehicleType: {
    type: String,
    enum: ["bike", "car", "truck", "van", "auto"],
    required: true,
  },
  vehicleNumber: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  licenseNumber: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  aadharNumber: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  bankDetails: {
    accountNumber: { type: String, required: true },
    ifscCode: { type: String, required: true },
    bankName: { type: String, required: true },
    accountHolderName: { type: String, required: true },
  },
  status: {
    type: String,
    enum: ["active", "inactive", "suspended", "pending"],
    default: "pending",
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalDeliveries: {
    type: Number,
    default: 0,
  },
  totalEarnings: {
    type: Number,
    default: 0,
  },
  commissionRate: {
    type: Number,
    default: 10, // 10% commission
    min: 0,
    max: 100,
  },
  documents: {
    aadharCard: { type: String }, // URL or path
    drivingLicense: { type: String },
    vehicleRC: { type: String },
    insurance: { type: String },
  },
  availability: {
    isAvailable: { type: Boolean, default: true },
    currentLocation: {
      lat: { type: Number },
      lng: { type: Number },
    },
    lastUpdated: { type: Date },
  },
  assignedOrders: [
    {
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
      assignedAt: { type: Date, default: Date.now },
      status: {
        type: String,
        enum: ["assigned", "picked", "delivered", "failed"],
        default: "assigned",
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
// ✅ CORRECT - Regular function works with mongoose middleware
deliveryPartnerSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  //   next();
});

// Index for faster queries
// deliveryPartnerSchema.index({ email: 1 });
deliveryPartnerSchema.index({ phone: 1 });
deliveryPartnerSchema.index({ status: 1 });
deliveryPartnerSchema.index({ "availability.isAvailable": 1 });

const DeliveryPartner = mongoose.model(
  "DeliveryPartner",
  deliveryPartnerSchema,
);

export default DeliveryPartner;
