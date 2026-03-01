import express from "express";
import {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  markHelpful,
  getAllReviews,
  moderateReview
} from "../Controllers/reviewController.js";
import { protect, admin } from "../Middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/product/:productId", getProductReviews);

// Protected routes
router.post("/", protect, createReview);
router.post("/:id/helpful", protect, markHelpful);

// Admin routes
router.get("/admin/all", protect, admin, getAllReviews);
router.put("/:id/moderate", protect, admin, moderateReview);

router.route("/:id")
  .put(protect, updateReview)
  .delete(protect, deleteReview);

export default router;