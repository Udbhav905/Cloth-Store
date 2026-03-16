import express from "express";
import {
  getMe,
  updateMe,
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
  getUserOrders,
} from "../Controllers/userController.js";
import { protect, admin } from "../Middleware/authMiddleware.js";

const router = express.Router();

/* ─────────────────────────────────────────────
   My Profile  (logged-in user's own data)
   MUST be declared BEFORE /:id routes
───────────────────────────────────────────── */
router.get  ("/me",  protect, getMe);
router.put  ("/me",  protect, updateMe);

/* ─────────────────────────────────────────────
   My Addresses
───────────────────────────────────────────── */
router.get   ("/addresses",                  protect, getAddresses);
router.post  ("/address",                    protect, addAddress);
router.get   ("/address/:addressId",         protect, getAddressById);
router.put   ("/address/:addressId",         protect, updateAddress);
router.delete("/address/:addressId",         protect, deleteAddress);
router.put   ("/address/:addressId/default", protect, setDefaultAddress);

/* ─────────────────────────────────────────────
   My Orders
───────────────────────────────────────────── */
router.get("/orders", protect, getUserOrders);

/* ─────────────────────────────────────────────
   Admin routes
───────────────────────────────────────────── */
router.route("/")
  .get(protect, admin, getUsers);

router.route("/:id")
  .get   (protect, admin, getUserById)
  .put   (protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

router.put("/:id/toggle-block", protect, admin, toggleUserBlock);

export default router;