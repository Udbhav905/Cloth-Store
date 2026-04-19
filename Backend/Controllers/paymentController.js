import Stripe from "stripe";
import Order from "../model/Order.js";
import { sendOrderConfirmationEmail } from "../utils/emailService.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ══════════════════════════════════════════════════════════
   @desc    Create a Stripe PaymentIntent
   @route   POST /api/payments/create-intent
   @access  Private

   Compatible with BOTH:
   - stripe.confirmCardPayment()  (CardElement — your current setup)
   - stripe.confirmPayment()      (PaymentElement — newer setup)
══════════════════════════════════════════════════════════ */
export const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = "inr", metadata = {} } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const amountInPaise = Math.round(Number(amount) * 100);

    const safeMetadata = {
      userId:     String(req.user._id),
      orderTotal: String(amount),
      itemCount:  String(metadata.itemCount || 0),
    };

    const paymentIntentOptions = {
      amount:   amountInPaise,
      currency: currency.toLowerCase(),
      metadata: safeMetadata,
    };

 

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);

    res.status(200).json({
      clientSecret:    paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount:          paymentIntent.amount,      
      currency:        paymentIntent.currency,
    });

  } catch (err) {
    console.error("[createPaymentIntent] error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════
   @desc    Verify a PaymentIntent after frontend confirms
            and update the order's payment status
   @route   POST /api/payments/verify
   @access  Private
   Body: { paymentIntentId, orderId? }
══════════════════════════════════════════════════════════ */
export const verifyPayment = async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ message: "paymentIntentId is required" });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        message: `Payment not successful. Stripe status: ${paymentIntent.status}`,
      });
    }

    if (orderId) {
      const order = await Order.findById(orderId);
      if (order && order.paymentStatus !== "paid") {
        order.paymentStatus = "paid";
        order.orderStatus   = "confirmed";
        order.paymentDetails = {
          transactionId: paymentIntent.id,
          paymentId:     paymentIntent.id,
          paidAt:        new Date(),
        };
        order.statusHistory.push({
          status:    "confirmed",
          note:      `Payment verified. Stripe Intent: ${paymentIntent.id}`,
          changedAt: new Date(),
          changedBy: req.user._id,
        });
        await order.save();

        // Send order confirmation email
        try {
          const populatedOrder = await Order.findById(order._id).populate("userId", "email name");
          if (populatedOrder && populatedOrder.userId) {
            await sendOrderConfirmationEmail(populatedOrder.userId.email, populatedOrder);
          }
        } catch (emailErr) {
          console.error("Error sending order confirmation email:", emailErr);
        }
      }
    }

    res.status(200).json({
      success:         true,
      paymentIntentId: paymentIntent.id,
      status:          paymentIntent.status,
      amountRupees:    paymentIntent.amount / 100,
    });

  } catch (err) {
    console.error("[verifyPayment] error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════
   @desc    Stripe Webhook — handles async payment events
   @route   POST /api/payments/webhook
   @access  Public (Stripe signs each request with HMAC)

   Set STRIPE_WEBHOOK_SECRET in .env:
     npx stripe listen --forward-to localhost:3000/api/payments/webhook
     → copy the whsec_... it prints
══════════════════════════════════════════════════════════ */
export const stripeWebhook = async (req, res) => {
  const sig    = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.warn("[webhook] STRIPE_WEBHOOK_SECRET not set — skipping verification");
    return res.status(200).json({ received: true });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err.message);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {

      case "payment_intent.succeeded": {
        const pi    = event.data.object;
        const order = await Order.findOne({ "paymentDetails.transactionId": pi.id });
        if (order && order.paymentStatus !== "paid") {
          order.paymentStatus          = "paid";
          order.orderStatus            = "confirmed";
          order.paymentDetails.paidAt  = new Date();
          order.statusHistory.push({
            status:    "confirmed",
            note:      "Stripe webhook: payment_intent.succeeded",
            changedAt: new Date(),
          });
          await order.save();
          console.log(`[webhook] Order ${order.orderNumber} marked paid.`);

          // Send order confirmation email
          try {
            const populatedOrder = await Order.findById(order._id).populate("userId", "email name");
            if (populatedOrder && populatedOrder.userId) {
              await sendOrderConfirmationEmail(populatedOrder.userId.email, populatedOrder);
            }
          } catch (emailErr) {
            console.error("Error sending order confirmation email in webhook:", emailErr);
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi    = event.data.object;
        const order = await Order.findOne({ "paymentDetails.transactionId": pi.id });
        if (order) {
          order.paymentStatus = "failed";
          order.statusHistory.push({
            status:    "pending",
            note:      `Stripe webhook: payment failed — ${pi.last_payment_error?.message || "unknown"}`,
            changedAt: new Date(),
          });
          await order.save();
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const order  = await Order.findOne({ "paymentDetails.transactionId": charge.payment_intent });
        if (order) {
          order.paymentStatus = "refunded";
          order.orderStatus   = "refunded";
          order.statusHistory.push({
            status: "refunded", note: "Stripe webhook: charge.refunded", changedAt: new Date(),
          });
          await order.save();
        }
        break;
      }

      default:
        break;
    }

    res.status(200).json({ received: true });

  } catch (err) {
    console.error("[webhook] Handler error:", err.message);
    res.status(500).json({ message: err.message });
  }
};