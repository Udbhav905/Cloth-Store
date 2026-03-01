import Review from "../model/Review.js";
import Product from "../model/Product.js";
import Order from "../model/Order.js";

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
export const createReview = async (req, res) => {
  try {
    const { productId, orderId, rating, title, review, fit, quality, images } = req.body;

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      userId: req.user._id,
      productId
    });

    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }

    // Check if user purchased this product (if orderId provided)
    let isVerifiedPurchase = false;
    if (orderId) {
      const order = await Order.findOne({
        _id: orderId,
        userId: req.user._id,
        "items.productId": productId,
        orderStatus: "delivered"
      });
      isVerifiedPurchase = !!order;
    }

    const reviewData = {
      userId: req.user._id,
      productId,
      rating,
      title,
      review,
      fit,
      quality,
      images,
      isVerifiedPurchase
    };

    if (orderId) {
      reviewData.orderId = orderId;
    }

    const newReview = await Review.create(reviewData);

    // Update product rating
    await updateProductRating(productId);

    res.status(201).json(newReview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { 
      productId,
      isApproved: true 
    };

    // Filter by rating
    if (req.query.rating) {
      query.rating = parseInt(req.query.rating);
    }

    // Filter by fit
    if (req.query.fit) {
      query.fit = req.query.fit;
    }

    const reviews = await Review.find(query)
      .populate("userId", "name")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Review.countDocuments(query);

    // Get rating statistics
    const stats = await Review.aggregate([
      { $match: { productId: mongoose.Types.ObjectId(productId), isApproved: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          ratingCounts: {
            $push: "$rating"
          }
        }
      }
    ]);

    const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: reviews.filter(r => r.rating === rating).length
    }));

    res.json({
      reviews,
      page,
      pages: Math.ceil(total / limit),
      total,
      stats: stats[0] || { averageRating: 0, totalReviews: 0 },
      ratingDistribution
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
export const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check ownership
    if (review.userId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { rating, title, review: reviewText, fit, quality, images } = req.body;

    review.rating = rating || review.rating;
    review.title = title || review.title;
    review.review = reviewText || review.review;
    review.fit = fit || review.fit;
    review.quality = quality || review.quality;
    review.images = images || review.images;

    await review.save();

    // Update product rating
    await updateProductRating(review.productId);

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check ownership
    if (review.userId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const productId = review.productId;
    await review.deleteOne();

    // Update product rating
    await updateProductRating(productId);

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark review as helpful
// @route   POST /api/reviews/:id/helpful
// @access  Private
export const markHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.helpfulUsers.includes(req.user._id)) {
      return res.status(400).json({ message: "You already marked this as helpful" });
    }

    review.helpfulUsers.push(req.user._id);
    review.helpfulCount += 1;

    await review.save();

    res.json({ message: "Review marked as helpful", helpfulCount: review.helpfulCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: Get all reviews (for moderation)
// @route   GET /api/reviews/admin/all
// @access  Private/Admin
export const getAllReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    
    if (req.query.isApproved !== undefined) {
      query.isApproved = req.query.isApproved === 'true';
    }

    const reviews = await Review.find(query)
      .populate("userId", "name email")
      .populate("productId", "name slug")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Review.countDocuments(query);

    res.json({
      reviews,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: Approve/reject review
// @route   PUT /api/reviews/:id/moderate
// @access  Private/Admin
export const moderateReview = async (req, res) => {
  try {
    const { isApproved, adminResponse } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.isApproved = isApproved;

    if (adminResponse) {
      review.adminResponse = {
        response: adminResponse,
        respondedBy: req.user._id,
        respondedAt: new Date()
      };
    }

    await review.save();

    // Update product rating if approved
    if (isApproved) {
      await updateProductRating(review.productId);
    }

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to update product rating
const updateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { productId: mongoose.Types.ObjectId(productId), isApproved: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  await Product.findByIdAndUpdate(productId, {
    averageRating: stats[0]?.averageRating || 0,
    totalReviews: stats[0]?.totalReviews || 0
  });
};