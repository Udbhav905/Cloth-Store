import express from "express";
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserBlock,
  addAddress,
  updateAddress,
  deleteAddress,
  getAddresses,
  getAddressById,
  setDefaultAddress,
  getUserOrders
} from "../Controllers/authController.js"; // Make sure path is correct
import { protect, admin } from "../Middleware/authMiddleware.js";

const router = express.Router();

// All routes are protected with authentication

// Address routes
router.get("/addresses", protect, getAddresses);
router.post("/address", protect, addAddress);
router.get("/address/:addressId", protect, getAddressById);
router.put("/address/:addressId", protect, updateAddress);
router.delete("/address/:addressId", protect, deleteAddress);
router.put("/address/:addressId/default", protect, setDefaultAddress);

// User orders
router.get("/orders", protect, getUserOrders);

// Admin only routes
router.route("/")
  .get(protect, admin, getUsers);

router.route("/:id")
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

router.put("/:id/toggle-block", protect, admin, toggleUserBlock);

export default router;