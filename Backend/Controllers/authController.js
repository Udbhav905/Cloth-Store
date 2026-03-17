import User from "../model/User.js";
import jwt from "jsonwebtoken";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, mobileNo, password } = req.body;

    if (!name || !email || !mobileNo || !password) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const userExists = await User.findOne({ $or: [{ email }, { mobileNo }] });
    if (userExists) {
      return res.status(400).json({ message: "User already exists with this email or mobile number" });
    }

    const user = await User.create({ name, email, mobileNo, password, role: "user" });

    if (user) {
      const token = generateToken(user._id);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      return res.status(201).json({
        user: {
          _id:      user._id,
          name:     user.name,
          email:    user.email,
          mobileNo: user.mobileNo,
          role:     user.role,
        },
        token,
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create admin user
// @route   POST /api/auth/registeradmin
// @access  Public (secure with a secret key in production)
export const createAdmin = async (req, res) => {
  try {
    const { name, email, mobileNo, password } = req.body;

    if (!name || !email || !mobileNo || !password) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const userExists = await User.findOne({ $or: [{ email }, { mobileNo }] });
    if (userExists) {
      return res.status(400).json({ message: "User already exists with this email or mobile number" });
    }

    const user = await User.create({ name, email, mobileNo, password, role: "admin" });

    return res.status(201).json({
      user: {
        _id:      user._id,
        name:     user.name,
        email:    user.email,
        mobileNo: user.mobileNo,
        role:     user.role,
      },
    });
  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
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

    // ✅ Use findByIdAndUpdate to avoid triggering the pre-save hook
    await User.findByIdAndUpdate(user._id, { lastLogin: Date.now() });

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    // ✅ { user, token } shape matches frontend extractUserAndToken()
    return res.json({
      user: {
        _id:      user._id,
        name:     user.name,
        email:    user.email,
        mobileNo: user.mobileNo,
        role:     user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  return res.json({ message: "Logged out successfully" });
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
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
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name     = req.body.name     || user.name;
    user.email    = req.body.email    || user.email;
    user.mobileNo = req.body.mobileNo || user.mobileNo;

    // pre-save hook will hash the new password automatically
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    return res.json({
      user: {
        _id:      updatedUser._id,
        name:     updatedUser.name,
        email:    updatedUser.email,
        mobileNo: updatedUser.mobileNo,
        role:     updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============= ADDRESS MANAGEMENT =============

// @desc    Get all addresses
// @route   GET /api/users/addresses
// @access  Private
export const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("addresses");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user.addresses);
  } catch (error) {
    console.error("Get addresses error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add new address
// @route   POST /api/users/address
// @access  Private
export const addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { address1, address2, city, state, pincode, country } = req.body;

    if (!address1 || !city || !state || !pincode) {
      return res.status(400).json({ message: "Please provide address1, city, state, and pincode" });
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
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update existing address
// @route   PUT /api/users/address/:addressId
// @access  Private
export const updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { addressId } = req.params;
    const address = user.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    const { address1, address2, city, state, pincode, country } = req.body;

    if (address1  !== undefined) address.address1 = address1;
    if (address2  !== undefined) address.address2 = address2;
    if (city      !== undefined) address.city      = city;
    if (state     !== undefined) address.state     = state;
    if (pincode   !== undefined) address.pincode   = pincode;
    if (country   !== undefined) address.country   = country;

    await user.save();

    return res.json({
      message:   "Address updated successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Update address error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete address
// @route   DELETE /api/users/address/:addressId
// @access  Private
export const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { addressId } = req.params;
    const address = user.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    user.addresses.pull({ _id: addressId });
    await user.save();

    return res.json({
      message:   "Address deleted successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Delete address error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single address by ID
// @route   GET /api/users/address/:addressId
// @access  Private
export const getAddressById = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("addresses");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { addressId } = req.params;
    const address = user.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    return res.json(address);
  } catch (error) {
    console.error("Get address error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Set address as default
// @route   PUT /api/users/address/:addressId/default
// @access  Private
export const setDefaultAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { addressId } = req.params;
    const address = user.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Clear all defaults first, then set the selected one
    user.addresses.forEach((a) => { a.isDefault = false; });
    address.isDefault = true;

    await user.save();

    return res.json({
      message:   "Default address set successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Set default address error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============= ADMIN USER MANAGEMENT =============

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const users = await User.find({})
      .select("-password -refreshToken")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments({});

    return res.json({
      users,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user (admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name      = req.body.name      || user.name;
    user.email     = req.body.email     || user.email;
    user.mobileNo  = req.body.mobileNo  || user.mobileNo;
    user.role      = req.body.role      || user.role;
    user.isBlocked = req.body.isBlocked !== undefined ? req.body.isBlocked : user.isBlocked;

    const updatedUser = await user.save();

    return res.json({
      _id:       updatedUser._id,
      name:      updatedUser.name,
      email:     updatedUser.email,
      mobileNo:  updatedUser.mobileNo,
      role:      updatedUser.role,
      isBlocked: updatedUser.isBlocked,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne();
    return res.json({ message: "User removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle user block status
// @route   PUT /api/users/:id/toggle-block
// @access  Private/Admin
export const toggleUserBlock = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    return res.json({
      message:   `User ${user.isBlocked ? "blocked" : "unblocked"} successfully`,
      isBlocked: user.isBlocked,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user orders
// @route   GET /api/users/orders
// @access  Private
export const getUserOrders = async (req, res) => {
  try {
    // Uncomment and import Order model when ready:
    // import Order from "../model/Order.js";
    // const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    // return res.json(orders);

    return res.json([]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};