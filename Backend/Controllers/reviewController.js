import Review from "../model/Review.js";
import Product from "../model/Product.js";
import Order from "../model/Order.js";
import mongoose from "mongoose";

/* ─────────────────────────────────────────────
   CREATE REVIEW  (user must have bought the product)
───────────────────────────────────────────── */
export const createReview = async (req, res) => {
  try {
    const { productId, orderId, rating, title, review, fit, quality, images } = req.body;

    if (!productId || !rating || !review) {
      return res.status(400).json({ message: "productId, rating, and review are required" });
    }

    const existingReview = await Review.findOne({ userId: req.user._id, productId });
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }

    /* Verified-purchase check */
    let isVerifiedPurchase = false;
    if (orderId) {
      const order = await Order.findOne({
        _id: orderId,
        userId: req.user._id,
        "items.productId": productId,
        orderStatus: "delivered",
      });
      isVerifiedPurchase = !!order;
    } else {
      /* Check without orderId – any delivered order containing this product */
      const anyOrder = await Order.findOne({
        userId: req.user._id,
        "items.productId": productId,
        orderStatus: "delivered",
      });
      isVerifiedPurchase = !!anyOrder;
    }

    const reviewData = {
      userId: req.user._id,
      productId,
      rating,
      title,
      review,
      fit,
      quality,
      images: images || [],
      isVerifiedPurchase,
      isApproved: true, // auto-approve; set false if you want manual moderation
    };
    if (orderId) reviewData.orderId = orderId;

    const newReview = await Review.create(reviewData);
    await updateProductRating(productId);

    const populated = await Review.findById(newReview._id).populate("userId", "name");
    res.status(201).json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }
    res.status(500).json({ message: error.message });
  }
};

/* ─────────────────────────────────────────────
   GET REVIEWS FOR A PRODUCT  (public)
───────────────────────────────────────────── */
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const query = { productId, isApproved: true };
    if (req.query.rating) query.rating = parseInt(req.query.rating);
    if (req.query.fit)    query.fit    = req.query.fit;

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate("userId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(query),
    ]);

    /* Rating distribution */
    const allRatings = await Review.find({ productId, isApproved: true }).select("rating");
    const dist = [5, 4, 3, 2, 1].map((r) => ({
      rating: r,
      count: allRatings.filter((x) => x.rating === r).length,
    }));
    const avg =
      allRatings.length > 0
        ? allRatings.reduce((s, x) => s + x.rating, 0) / allRatings.length
        : 0;

    res.json({
      reviews,
      page,
      pages: Math.ceil(total / limit),
      total,
      averageRating: parseFloat(avg.toFixed(1)),
      ratingDistribution: dist,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ─────────────────────────────────────────────
   CHECK IF USER CAN REVIEW A PRODUCT
   GET /api/reviews/can-review/:productId
───────────────────────────────────────────── */
export const canUserReview = async (req, res) => {
  try {
    const { productId } = req.params;

    const [existing, order] = await Promise.all([
      Review.findOne({ userId: req.user._id, productId }),
      Order.findOne({
        userId: req.user._id,
        "items.productId": productId,
        orderStatus: "delivered",
      }).select("_id orderNumber").lean(),
    ]);

    res.json({
      canReview: !existing && !!order,
      alreadyReviewed: !!existing,
      hasPurchased: !!order,
      orderId: order?._id || null,
      orderNumber: order?.orderNumber || null,
      existingReview: existing || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ─────────────────────────────────────────────
   GET REVIEWS BY ORDER  (for "my orders" page)
   GET /api/reviews/order/:orderId
───────────────────────────────────────────── */
export const getReviewsByOrder = async (req, res) => {
  try {
    const reviews = await Review.find({
      orderId: req.params.orderId,
      userId: req.user._id,
    }).select("productId rating title review isVerifiedPurchase createdAt");
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ─────────────────────────────────────────────
   UPDATE REVIEW
───────────────────────────────────────────── */
export const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (
      review.userId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { rating, title, review: reviewText, fit, quality, images } = req.body;
    if (rating)      review.rating  = rating;
    if (title)       review.title   = title;
    if (reviewText)  review.review  = reviewText;
    if (fit)         review.fit     = fit;
    if (quality)     review.quality = quality;
    if (images)      review.images  = images;

    await review.save();
    await updateProductRating(review.productId);

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ─────────────────────────────────────────────
   DELETE REVIEW
───────────────────────────────────────────── */
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (
      review.userId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const productId = review.productId;
    await review.deleteOne();
    await updateProductRating(productId);

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ─────────────────────────────────────────────
   MARK HELPFUL
───────────────────────────────────────────── */
export const markHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    const uid = req.user._id.toString();
    const idx = review.helpfulUsers.findIndex((u) => u.toString() === uid);

    if (idx > -1) {
      review.helpfulUsers.splice(idx, 1);
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    } else {
      review.helpfulUsers.push(req.user._id);
      review.helpfulCount += 1;
    }
    await review.save();
    res.json({ helpfulCount: review.helpfulCount, marked: idx === -1 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ─────────────────────────────────────────────
   ADMIN – GET ALL REVIEWS
───────────────────────────────────────────── */
export const getAllReviews = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip  = (page - 1) * limit;
    const query = {};
    if (req.query.isApproved !== undefined)
      query.isApproved = req.query.isApproved === "true";
    if (req.query.productId) query.productId = req.query.productId;

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate("userId",    "name email")
        .populate("productId", "name slug mainImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(query),
    ]);

    res.json({ reviews, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ─────────────────────────────────────────────
   ADMIN – MODERATE REVIEW
───────────────────────────────────────────── */
export const moderateReview = async (req, res) => {
  try {
    const { isApproved, adminResponse } = req.body;
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    review.isApproved = isApproved;
    if (adminResponse) {
      review.adminResponse = {
        response:    adminResponse,
        respondedBy: req.user._id,
        respondedAt: new Date(),
      };
    }
    await review.save();
    if (isApproved) await updateProductRating(review.productId);
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ─────────────────────────────────────────────
   INTERNAL HELPER – recalculate product rating
───────────────────────────────────────────── */
const updateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    {
      $match: {
        productId: new mongoose.Types.ObjectId(productId),
        isApproved: true,
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews:  { $sum: 1 },
      },
    },
  ]);

  await Product.findByIdAndUpdate(productId, {
    averageRating: parseFloat((stats[0]?.averageRating || 0).toFixed(1)),
    totalReviews:  stats[0]?.totalReviews || 0,
  });
};