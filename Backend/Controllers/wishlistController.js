import Wishlist from "../model/Wishlist.js";
import Product from "../model/Product.js";


export const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ userId: req.user._id })
      .populate("items.productId", "name slug mainImage basePrice discountType discountValue averageRating totalReviews");

    if (!wishlist) {
      wishlist = await Wishlist.create({ userId: req.user._id, items: [] });
    }

    res.status(200).json(wishlist);
  } catch (error) {
    console.error("Error in getWishlist:", error);
    res.status(500).json({ message: error.message });
  }
};


export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let wishlist = await Wishlist.findOne({ userId: req.user._id });

    if (!wishlist) {
      wishlist = new Wishlist({ userId: req.user._id, items: [] });
    }

    const alreadyExists = wishlist.items.some(
      item => item.productId.toString() === productId
    );

    if (alreadyExists) {
      return res.status(400).json({ message: "Product already in wishlist" });
    }

    wishlist.items.push({ productId });
    await wishlist.save();

    await wishlist.populate("items.productId", "name slug mainImage basePrice discountType discountValue");

    res.status(200).json(wishlist);
  } catch (error) {
    console.error("Error in addToWishlist:", error);
    res.status(500).json({ message: error.message });
  }
};


export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ userId: req.user._id });

    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    wishlist.items = wishlist.items.filter(
      item => item.productId.toString() !== productId
    );

    await wishlist.save();
    await wishlist.populate("items.productId", "name slug mainImage basePrice discountType discountValue");

    res.status(200).json(wishlist);
  } catch (error) {
    console.error("Error in removeFromWishlist:", error);
    res.status(500).json({ message: error.message });
  }
};


export const clearWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user._id });

    if (wishlist) {
      wishlist.items = [];
      await wishlist.save();
    }

    res.status(200).json({ message: "Wishlist cleared successfully" });
  } catch (error) {
    console.error("Error in clearWishlist:", error);
    res.status(500).json({ message: error.message });
  }
};