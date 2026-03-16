import express from "express";
import { createPaymentIntent, verifyPayment, stripeWebhook } from "../Controllers/paymentController.js";
import { protect } from "../Middleware/authMiddleware.js";

const router = express.Router();

/* ── Webhook MUST use raw body — register BEFORE express.json() parses it ──
   In server.js/app.js mount this route BEFORE app.use(express.json()):

     app.use("/api/payments/webhook",
       express.raw({ type: "application/json" }),
       paymentRoutes  ← only the webhook needs raw body
     );

   OR mount the whole router after express.json() and handle raw body
   inline here (done below — works for most setups).
──────────────────────────────────────────────────────────────────────────── */

// ── Webhook: raw body required for Stripe signature verification ──────────
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),  // override json parser for this route
  stripeWebhook
);

// ── Create PaymentIntent (called before showing payment form) ─────────────
router.post("/create-intent", protect, createPaymentIntent);

// ── Verify payment after frontend confirms it ────────────────────────────
router.post("/verify", protect, verifyPayment);

export default router;