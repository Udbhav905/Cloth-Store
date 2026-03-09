import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getNewArrivals,
  getBestSellers,
  searchProducts
} from "../Controllers/productController.js";
import { protect, admin } from "../Middleware/authMiddleware.js";
import upload from "../Middleware/uploadMiddleware.js";

const router = express.Router();

// Public routes
router.get("/featured", getFeaturedProducts);
router.get("/new-arrivals", getNewArrivals);
router.get("/best-sellers", getBestSellers);
router.get("/slug/:slug", getProductBySlug);
router.get("/search",       searchProducts); 

router.route("/")
  .get(getProducts)
  .post(
    protect,
    admin,
    upload.fields([
      { name: "mainImage", maxCount: 1 },
      { name: "galleryImages", maxCount: 5 },
      { name: "variantImages", maxCount: 20 }
    ]),
    createProduct
  );

router.route("/:id")
  .get(getProductById)
  .put(
    protect, 
    admin, 
    // FIX: Add multer middleware here for update
    upload.fields([
      { name: "mainImage", maxCount: 1 },
      { name: "galleryImages", maxCount: 5 },
      { name: "variantImages", maxCount: 20 }
    ]),
    updateProduct
  )
  .delete(protect, admin, deleteProduct);



export default router;