import express from "express";
import {
  createCoupon,
  getCoupons,
  getCouponById,
  getCouponByCode,
  updateCoupon,
  deleteCoupon,
  validateCoupon
} from "../Controllers/couponController.js";
import { protect, admin } from "../Middleware/authMiddleware.js";

const router = express.Router();

router.get("/code/:code", getCouponByCode);
router.post("/validate", protect, validateCoupon);

router.route("/")
  .get(protect, admin, getCoupons)
  .post(protect, admin, createCoupon);

router.route("/:id")
  .get(protect, admin, getCouponById)
  .put(protect, admin, updateCoupon)
  .delete(protect, admin, deleteCoupon);

export default router;