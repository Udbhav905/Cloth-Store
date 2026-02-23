// Routes/authRoutes.js
import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateProfile,createAdmin
} from "../Controllers/authController.js";
import { protect,admin } from "../Middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/registeradmin", createAdmin); 

// Protected routes
router.route("/profile")
  .get(protect, getProfile)
  .put(protect, updateProfile);

export default router;