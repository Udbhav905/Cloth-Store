import express from "express";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist
} from "../Controllers/wishlistController.js";
import { protect } from "../Middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .get(getWishlist)
  .delete(clearWishlist);

router.post("/add", addToWishlist);
router.delete("/remove/:productId", removeFromWishlist);

export default router;