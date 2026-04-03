// Routes/authRoutes.js
import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateProfile,createAdmin,forgotPassword,resetPassword,changePassword
} from "../Controllers/authController.js";
import { protect,admin } from "../Middleware/authMiddleware.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();
// ------------------------
router.post("/test-email", async (req, res) => {
  try {
    await sendEmail({
      email: "prajapatiudbhav95@gmail.com", // Change this to your email
      subject: "Test Email from LUXURIA",
      message: "This is a test email to verify email configuration is working correctly.",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #d4af37;">LUXURIA Test Email</h1>
          <p>If you received this email, your email configuration is working correctly!</p>
          <p>You can now use the password reset feature.</p>
          <hr>
          <p style="color: #666;">Best regards,<br>LUXURIA Team</p>
        </div>
      `
    });
    res.json({ message: "Test email sent successfully! Check your inbox." });
  } catch (error) {
    console.error("Test email error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/registeradmin", createAdmin); 
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", protect, changePassword);

// Protected routes
router.route("/profile")
  .get(protect, getProfile)
  .put(protect, updateProfile);

export default router;