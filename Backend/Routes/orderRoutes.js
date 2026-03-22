import express from "express";
import {
  /* ── Customer routes ── */
  createOrder,
  getOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,

  /* ── Admin routes (new) ── */
  adminGetAllOrders,
  adminGetOrderById,
  adminUpdateStatus,
  adminAssignDelivery,
  adminUpdateNote,
} from "../Controllers/orderController.js";
import { protect, admin } from "../Middleware/authMiddleware.js";

const router = express.Router();

/* ═══════════════════════════════════════════════════════════
   IMPORTANT: Place specific routes BEFORE param routes (:id)
   so Express matches them correctly.
═══════════════════════════════════════════════════════════ */

/* ── Customer ──────────────────────────────────────────── */
router.route("/")
  .post(protect, createOrder)
  .get(protect, admin, getOrders);

router.get("/my-orders", protect, getMyOrders);

/* ── Admin — must come before /:id ─────────────────────── */

// GET  /api/orders/admin/all          — paginated list + stats + search
router.get("/admin/all", protect, admin, adminGetAllOrders);

// GET  /api/orders/admin/:id          — single order detail
router.get("/admin/:id", protect, admin, adminGetOrderById);

// PUT  /api/orders/admin/:id/status   — update order status
router.put("/admin/:id/status", protect, admin, adminUpdateStatus);

// PUT  /api/orders/admin/:id/assign   — assign delivery partner
router.put("/admin/:id/assign", protect, admin, adminAssignDelivery);

// PUT  /api/orders/admin/:id/note     — save admin note
router.put("/admin/:id/note", protect, admin, adminUpdateNote);

/* ── Existing customer routes ───────────────────────────── */
router.put("/:id/status",  protect, admin, updateOrderStatus);
router.put("/:id/payment", protect, admin, updatePaymentStatus);
router.put("/:id/cancel",  protect, cancelOrder);

router.route("/:id").get(protect, getOrderById);

export default router;