import express from "express";
import { getDashboardStats } from "../Controllers/adminController.js";
import { protect, admin } from "../Middleware/authMiddleware.js";

const router = express.Router();

router.get("/dashboard", protect, admin, getDashboardStats);

export default router;