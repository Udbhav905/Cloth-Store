import express from "express";
import {
  createOrder,
  getOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder
} from "../Controllers/orderController.js";
import { protect, admin } from "../Middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
  .post(protect, createOrder)
  .get(protect, admin, getOrders);

router.get("/my-orders", protect, getMyOrders);

router.put("/:id/status", protect, admin, updateOrderStatus);
router.put("/:id/payment", protect, admin, updatePaymentStatus);
router.put("/:id/cancel", protect, cancelOrder);

router.route("/:id")
  .get(protect, getOrderById);

export default router;