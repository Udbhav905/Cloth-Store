import express from "express";
import { createPaymentIntent, verifyPayment, stripeWebhook } from "../Controllers/paymentController.js";
import { protect } from "../Middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),  // override json parser for this route
  stripeWebhook
);

router.post("/create-intent", protect, createPaymentIntent);

router.post("/verify", protect, verifyPayment);

export default router;