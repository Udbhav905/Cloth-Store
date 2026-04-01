import express from "express";
import {
  createCategory,
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
  getCategoryTree
} from "../Controllers/categoryController.js";
import { protect, admin } from "../Middleware/authMiddleware.js";
import upload from "../Middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/tree", getCategoryTree);
router.get("/slug/:slug", getCategoryBySlug);


router.route("/")
  .get(getCategories)
   .post(protect, admin, upload.single("image"), createCategory);

router.route("/:id")
  .get(getCategoryById)
  .put(protect, admin,upload.single("image"), updateCategory)   
  .delete(protect, admin, deleteCategory);

export default router;