import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon
} from "../Controllers/cartController.js";
import { protect } from "../Middleware/authMiddleware.js";

const router = express.Router();

// All cart routes are protected
router.use(protect);

router.route("/")
  .get(getCart)
  .delete(clearCart);

router.post("/add", addToCart);
router.post("/apply-coupon", applyCoupon);
router.delete("/remove-coupon", removeCoupon);

router.route("/:itemId")
  .put(updateCartItem)
  .delete(removeFromCart);

export default router;