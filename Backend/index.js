/* server.js — BACKEND
   
   KEY FIXES:
   1. Added port 5174 (admin) to CORS allowed origins
   2. Cookie is now SameSite:"lax" in dev so it doesn't
      auto-bleed across localhost ports when using header auth
   3. The frontend apps no longer send credentials:"include"
      so the cookie is never used — auth is header-only
*/
import dotenv from "dotenv";
dotenv.config();
import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express      from "express";
import mongoose     from "mongoose";
import cors         from "cors";
import cookieParser from "cookie-parser";
import morgan       from "morgan";
import path         from "path";
import { fileURLToPath } from "url";

import authRoutes     from "./Routes/authRoutes.js";
import userRoutes     from "./Routes/userRoutes.js";
import categoryRoutes from "./Routes/categoryRoutes.js";
import productRoutes  from "./Routes/productRoutes.js";
import orderRoutes    from "./Routes/orderRoutes.js";
import cartRoutes     from "./Routes/cartRoutes.js";
import reviewRoutes   from "./Routes/reviewRoutes.js";
import couponRoutes   from "./Routes/couponRoutes.js";
import adminRoutes    from "./Routes/Adminroutes.js";
import paymentRoutes  from "./Routes/paymentRoutes.js";
import wishlistRoutes  from "./Routes/wishlistRoutes.js";
import { errorHandler, notFound } from "./Middleware/errorMiddleware.js";



const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const app        = express();

/* ── Stripe webhook (must be before express.json) ── */
app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  paymentRoutes
);

/* ── Body parsing ── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ── CORS ──────────────────────────────────────────────────
   Added 5174 for admin dev server.
   credentials:true still needed for cookie-based fallback,
   but our frontend apps now use header-only auth.
─────────────────────────────────────────────────────────── */
const ALLOWED_ORIGINS = [
  "http://localhost:5173",  /* user app */
  "http://localhost:5174",  /* admin app */
  "http://localhost:5175",  /* fallback if vite picks next port */
  "http://localhost:3000",  /* backend itself */
];

app.use(cors({
  origin: (origin, callback) => {
    /* Allow requests with no origin (curl, mobile, Postman) */
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

/* ── Logging ── */
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

/* ── Static ── */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ── Routes ── */
app.use("/api/auth",       authRoutes);
app.use("/api/users",      userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products",   productRoutes);
app.use("/api/orders",     orderRoutes);
// Add these after other route declarations
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews",    reviewRoutes);
app.use("/api/coupons",    couponRoutes);
app.use("/api/admin",      adminRoutes);
app.use("/api/payments",   paymentRoutes);




/* ── Health check ── */
app.get("/api/health", (_, res) =>
  res.json({ status: "OK", timestamp: new Date().toISOString() })
);

/* ── Root ── */
app.get("/", (_, res) => res.json({ message: "Clothing Store API v1.0" }));

/* ── Error handling ── */
app.use(notFound);
app.use(errorHandler);

/* ── DB + Start ── */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected");
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server → http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (err) {
    console.error(`DB Error: ${err.message}`);
    process.exit(1);
  }
};

connectDB();
export default app;