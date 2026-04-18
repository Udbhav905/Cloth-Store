import express from "express";
import {
  createReview,
  getProductReviews,
  canUserReview,
  getReviewsByOrder,
  updateReview,
  deleteReview,
  markHelpful,
  getAllReviews,
  moderateReview,
} from "../Controllers/reviewController.js";
import { protect, admin } from "../Middleware/authMiddleware.js";

const router = express.Router();

/* ── Public ── */
router.get("/product/:productId", getProductReviews);

/* ── Authenticated ── */
router.post("/",                    protect, createReview);
router.get("/can-review/:productId", protect, canUserReview);
router.get("/order/:orderId",        protect, getReviewsByOrder);
router.put("/:id",                   protect, updateReview);
router.delete("/:id",                protect, deleteReview);
router.post("/:id/helpful",          protect, markHelpful);

/* ── Admin ── */
router.get("/",            protect, admin, getAllReviews);
router.put("/:id/moderate", protect, admin, moderateReview);

export default router;