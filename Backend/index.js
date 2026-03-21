import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

// Routes
import authRoutes from "./Routes/authRoutes.js";
import userRoutes from "./Routes/userRoutes.js";
import categoryRoutes from "./Routes/categoryRoutes.js";
import productRoutes from "./Routes/productRoutes.js";
import orderRoutes from "./Routes/orderRoutes.js";
import cartRoutes from "./Routes/cartRoutes.js";
import reviewRoutes from "./Routes/reviewRoutes.js";
import couponRoutes from "./Routes/couponRoutes.js";
import adminRoutes from "./Routes/Adminroutes.js";
import paymentRoutes from "./Routes/paymentRoutes.js"; // ✅ Stripe payments

// Middleware
import { errorHandler, notFound } from "./Middleware/errorMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* =========================================================
   STRIPE WEBHOOK (MUST BE BEFORE express.json())
   ========================================================= */
app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  paymentRoutes
);

/* =========================================================
   NORMAL MIDDLEWARE
   ========================================================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* =========================================================
   CORS
   ========================================================= */

app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
      ];

      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

/* =========================================================
   LOGGING
   ========================================================= */

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

/* =========================================================
   STATIC FILES
   ========================================================= */

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =========================================================
   ROUTES
   ========================================================= */

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/admin",adminRoutes );

/* Stripe Payment Routes */
app.use("/api/payments", paymentRoutes);

/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server Running ✅",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

/* =========================================================
   ROOT ROUTE
   ========================================================= */

app.get("/", (req, res) => {
  res.json({
    message: "Clothing Store API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      categories: "/api/categories",
      products: "/api/products",
      orders: "/api/orders",
      cart: "/api/cart",
      reviews: "/api/reviews",
      coupons: "/api/coupons",
      payments: "/api/payments",
    },
  });
});

/* =========================================================
   ERROR HANDLING
   ========================================================= */

app.use(notFound);
app.use(errorHandler);

/* =========================================================
   DATABASE CONNECTION
   ========================================================= */

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB Connected");

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

connectDB();

export default app;