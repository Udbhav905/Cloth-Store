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

router.get("/admin/all", protect, admin, adminGetAllOrders);

router.get("/admin/:id", protect, admin, adminGetOrderById);

router.put("/admin/:id/status", protect, admin, adminUpdateStatus);

router.put("/admin/:id/assign", protect, admin, adminAssignDelivery);

router.put("/admin/:id/note", protect, admin, adminUpdateNote);

router.put("/:id/status",  protect, admin, updateOrderStatus);
router.put("/:id/payment", protect, admin, updatePaymentStatus);
router.put("/:id/cancel",  protect, cancelOrder);

router.route("/:id").get(protect, getOrderById);

export default router;