import User from "../model/User.js";
import jwt from "jsonwebtoken";

/* ─────────────────────────────────────────────
   Helper — generate a simple JWT token
   Uses JWT_SECRET (single-secret approach)
   If you later switch to access/refresh tokens,
   use user.generateAccessToken() instead.
───────────────────────────────────────────── */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

/* ─────────────────────────────────────────────
   Helper — attach token cookie to response
───────────────────────────────────────────── */
const setTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge:   30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

/* ─────────────────────────────────────────────
   Helper — safe user response shape
───────────────────────────────────────────── */
const userShape = (user) => ({
  _id:      user._id,
  name:     user.name,
  email:    user.email,
  mobileNo: user.mobileNo,
  role:     user.role,
});


// ─────────────────────────────────────────────
// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────────
export const registerUser = async (req, res) => {
  try {
    const { name, email, mobileNo, password } = req.body;

    // Validate required fields
    if (!name || !email || !mobileNo || !password) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // Check for existing user
    const userExists = await User.findOne({ $or: [{ email }, { mobileNo }] });
    if (userExists) {
      return res.status(400).json({
        message: "User already exists with this email or mobile number",
      });
    }

    // Create user — pre-save hook hashes password automatically
    const user = await User.create({ name, email, mobileNo, password, role: "user" });

    const token = generateToken(user._id);
    setTokenCookie(res, token);

    return res.status(201).json({
      user: userShape(user),
      token,
    });

  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: error.message });
  }
};


// ─────────────────────────────────────────────
// @desc    Create admin user
// @route   POST /api/auth/registeradmin
// @access  Public (lock down with secret key in production)
// ─────────────────────────────────────────────
export const createAdmin = async (req, res) => {
  try {
    const { name, email, mobileNo, password } = req.body;

    if (!name || !email || !mobileNo || !password) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const userExists = await User.findOne({ $or: [{ email }, { mobileNo }] });
    if (userExists) {
      return res.status(400).json({
        message: "User already exists with this email or mobile number",
      });
    }

    const user = await User.create({ name, email, mobileNo, password, role: "admin" });

    return res.status(201).json({ user: userShape(user) });

  } catch (error) {
    console.error("Create admin error:", error);
    return res.status(500).json({ message: error.message });
  }
};


// ─────────────────────────────────────────────
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account has been blocked" });
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Use findByIdAndUpdate to avoid triggering pre-save hook on login
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const token = generateToken(user._id);
    setTokenCookie(res, token);

    return res.json({
      user:  userShape(user),
      token,
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: error.message });
  }
};


// ─────────────────────────────────────────────
// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
// ─────────────────────────────────────────────
export const logoutUser = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires:  new Date(0),
  });
  return res.json({ message: "Logged out successfully" });
};


// ─────────────────────────────────────────────
// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
// ─────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      user: {
        _id:       user._id,
        name:      user.name,
        email:     user.email,
        mobileNo:  user.mobileNo,
        role:      user.role,
        addresses: user.addresses,
        isBlocked: user.isBlocked,
      },
    });

  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ message: error.message });
  }
};


// ─────────────────────────────────────────────
// @desc    Update user profile (self)
// @route   PUT /api/auth/profile
// @access  Private
// ─────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.body.name)     user.name     = req.body.name;
    if (req.body.email)    user.email    = req.body.email;
    if (req.body.mobileNo) user.mobileNo = req.body.mobileNo;

    // Pre-save hook will re-hash only if password is set here
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    return res.json({ user: userShape(updatedUser) });

  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: error.message });
  }
};


// ═══════════════════════════════════════════════
//   ADDRESS MANAGEMENT
// ═══════════════════════════════════════════════

// @desc    Get all addresses
// @route   GET /api/users/addresses
// @access  Private
export const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("addresses");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user.addresses);
  } catch (error) {
    console.error("Get addresses error:", error);
    return res.status(500).json({ message: error.message });
  }
};


// @desc    Get single address by ID
// @route   GET /api/users/address/:addressId
// @access  Private
export const getAddressById = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("addresses");
    if (!user) return res.status(404).json({ message: "User not found" });

    const address = user.addresses.id(req.params.addressId);
    if (!address) return res.status(404).json({ message: "Address not found" });

    return res.json(address);
  } catch (error) {
    console.error("Get address error:", error);
    return res.status(500).json({ message: error.message });
  }
};


// @desc    Add new address
// @route   POST /api/users/address
// @access  Private
export const addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { address1, address2, city, state, pincode, country } = req.body;

    if (!address1 || !city || !state || !pincode) {
      return res.status(400).json({
        message: "Please provide address1, city, state, and pincode",
      });
    }

    user.addresses.push({
      address1,
      address2: address2 || "",
      city,
      state,
      pincode,
      country: country || "India",
    });

    await user.save();

    return res.status(201).json({
      message:   "Address added successfully",
      addresses: user.addresses,
    });

  } catch (error) {
    console.error("Add address error:", error);
    return res.status(500).json({ message: error.message });
  }
};


// @desc    Update existing address
// @route   PUT /api/users/address/:addressId
// @access  Private
export const updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const address = user.addresses.id(req.params.addressId);
    if (!address) return res.status(404).json({ message: "Address not found" });

    const { address1, address2, city, state, pincode, country } = req.body;

    if (address1 !== undefined) address.address1 = address1;
    if (address2 !== undefined) address.address2 = address2;
    if (city     !== undefined) address.city     = city;
    if (state    !== undefined) address.state    = state;
    if (pincode  !== undefined) address.pincode  = pincode;
    if (country  !== undefined) address.country  = country;

    await user.save();

    return res.json({
      message:   "Address updated successfully",
      addresses: user.addresses,
    });

  } catch (error) {
    console.error("Update address error:", error);
    return res.status(500).json({ message: error.message });
  }
};


// @desc    Delete address
// @route   DELETE /api/users/address/:addressId
// @access  Private
export const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const address = user.addresses.id(req.params.addressId);
    if (!address) return res.status(404).json({ message: "Address not found" });

    user.addresses.pull({ _id: req.params.addressId });
    await user.save();

    return res.json({
      message:   "Address deleted successfully",
      addresses: user.addresses,
    });

  } catch (error) {
    console.error("Delete address error:", error);
    return res.status(500).json({ message: error.message });
  }
};


// @desc    Set address as default
// @route   PUT /api/users/address/:addressId/default
// @access  Private
export const setDefaultAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const address = user.addresses.id(req.params.addressId);
    if (!address) return res.status(404).json({ message: "Address not found" });

    // Clear all defaults, then set selected one
    user.addresses.forEach((a) => { a.isDefault = false; });
    address.isDefault = true;

    await user.save();

    return res.json({
      message:   "Default address set successfully",
      addresses: user.addresses,
    });

  } catch (error) {
    console.error("Set default address error:", error);
    return res.status(500).json({ message: error.message });
  }
};


// ═══════════════════════════════════════════════
//   ADMIN — USER MANAGEMENT
// ═══════════════════════════════════════════════

// @desc    Get all users (paginated)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({})
        .select("-password -refreshToken")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments({}),
    ]);

    return res.json({
      users,
      page,
      pages: Math.ceil(total / limit),
      total,
    });

  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({ message: error.message });
  }
};


// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -refreshToken");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (error) {
    console.error("Get user by id error:", error);
    return res.status(500).json({ message: error.message });
  }
};


// @desc    Update user (admin) — uses findByIdAndUpdate to SKIP pre-save hook
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Build only the fields that were sent
    const updates = {};
    if (req.body.name      !== undefined) updates.name      = req.body.name;
    if (req.body.email     !== undefined) updates.email     = req.body.email;
    if (req.body.mobileNo  !== undefined) updates.mobileNo  = req.body.mobileNo;
    if (req.body.role      !== undefined) updates.role      = req.body.role;
    if (req.body.isBlocked !== undefined) updates.isBlocked = req.body.isBlocked;

    // Use findByIdAndUpdate so the pre-save hook is NOT triggered
    // (admin shouldn't accidentally re-hash an already-hashed password)
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password -refreshToken");

    return res.json(updatedUser);

  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({ message: error.message });
  }
};


// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.deleteOne();
    return res.json({ message: "User removed successfully" });

  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ message: error.message });
  }
};


// @desc    Toggle user block status
// @route   PUT /api/users/:id/toggle-block
// @access  Private/Admin
export const toggleUserBlock = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Use findByIdAndUpdate to skip pre-save hook
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isBlocked: !user.isBlocked } },
      { new: true }
    );

    return res.json({
      message:   `User ${updatedUser.isBlocked ? "blocked" : "unblocked"} successfully`,
      isBlocked: updatedUser.isBlocked,
    });

  } catch (error) {
    console.error("Toggle block error:", error);
    return res.status(500).json({ message: error.message });
  }
};


// @desc    Get user orders
// @route   GET /api/users/orders
// @access  Private
export const getUserOrders = async (req, res) => {
  try {
    // Uncomment when Order model is ready:
    // import Order from "../model/Order.js";
    // const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    // return res.json(orders);

    return res.json([]);
  } catch (error) {
    console.error("Get user orders error:", error);
    return res.status(500).json({ message: error.message });
  }
};