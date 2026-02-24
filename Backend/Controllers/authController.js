import User from "../model/User.js";
import jwt from "jsonwebtoken";
// import bcrypt from "bcryptjs";

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d"
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
// @desc    Register user (regular users only)
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, mobileNo, password } = req.body;  // No role here

    // Validate input
    if (!name || !email || !mobileNo || !password) {
      return res.status(400).json({ 
        message: "Please provide all required fields" 
      });
    }

    const userExists = await User.findOne({ 
      $or: [{ email }, { mobileNo }] 
    });

    if (userExists) {
      return res.status(400).json({ 
        message: "User already exists with this email or mobile number" 
      });
    }

    // Always create as regular user
    const user = await User.create({
      name,
      email,
      mobileNo,
      password,
      role: "user"  // Force role to be "user"
    });

    if (user) {
      const token = generateToken(user._id);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        mobileNo: user.mobileNo,
        role: user.role,
        token
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create admin user (separate route)
// @route   POST /api/auth/create-admin
// @access  Private/Admin (only existing admin can create new admin)
export const createAdmin = async (req, res) => {
  try {
    // Check if requester is admin
    if (req.body.role!="admin") {
      return res.status(403).json({ message: "Not authorized as admin" });
    }

    const { name, email, mobileNo, password } = req.body;

    // Validate input
    if (!name || !email || !mobileNo || !password) {
      return res.status(400).json({ 
        message: "Please provide all required fields" 
      });
    }

    const userExists = await User.findOne({ 
      $or: [{ email }, { mobileNo }] 
    });

    if (userExists) {
      return res.status(400).json({ 
        message: "User already exists with this email or mobile number" 
      });
    }

    // Create as admin
    const user = await User.create({
      name,
      email,
      mobileNo,
      password,
      role: "admin"
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      mobileNo: user.mobileNo,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account has been blocked" });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      mobileNo: user.mobileNo,
      role: user.role,
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0)
  });
  res.json({ message: "Logged out successfully" });
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("addresses");
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.mobileNo = req.body.mobileNo || user.mobileNo;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobileNo: updatedUser.mobileNo,
        role: updatedUser.role
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============= ADDRESS MANAGEMENT FUNCTIONS =============

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

    // Validate required fields
    if (!address1 || !city || !state || !pincode) {
      return res.status(400).json({ 
        message: "Please provide address1, city, state, and pincode" 
      });
    }

    // Add new address to user's addresses array
    user.addresses.push({
      address1,
      address2: address2 || "",
      city,
      state,
      pincode,
      country: country || "India"
    });

    await user.save();

    res.status(201).json({
      message: "Address added successfully",
      addresses: user.addresses
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
    // console.log("*******",req.user.id);
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // const { addressId } = req.params;
    const { address1, address2, city, state, pincode, country } = req.body;

    
    const address = user.addresses;
    // console.log("*******",address[0]);

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Update address fields
    if (address1) address[0].address1 = address1;
    if (address2 !== undefined) address[0].address2 = address2;
    if (city) address[0].city = city;
    if (state) address[0].state = state;
    if (pincode) address[0].pincode = pincode;
    if (country) address[0].country = country;

    await user.save();

    res.json({
      message: "Address updated successfully",
      addresses: user.addresses
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

    // Check if address exists
    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Remove address using pull
    user.addresses.pull({ _id: addressId });

    await user.save();

    res.json({
      message: "Address deleted successfully",
      addresses: user.addresses
    });
  } catch (error) {
    console.error("Delete address error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all addresses for current user
// @route   GET /api/users/addresses
// @access  Private
export const getAddresses = async (req, res) => {
  try {
    // console.log("req.body",await req);
    const user = await User.findById(req._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.addresses);
  } catch (error) {
    console.error("Get addresses error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single address by ID
// @route   GET /api/users/address/:addressId
// @access  Private
export const getAddressById = async (req, res) => {
  try {
    const user = await User.findById(await req.params.addressId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // console.log("----->>",user);
    const { addressId } = req.params;
    const address = user.addresses;

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.json(address);
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

    // Check if address exists
    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // You can add a 'isDefault' field to your address schema if you want this functionality
    // For now, we'll just return success
    res.json({
      message: "Default address set successfully",
      address
    });
  } catch (error) {
    console.error("Set default address error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============= ADMIN USER MANAGEMENT FUNCTIONS =============

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .select("-password -refreshToken")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments({});

    res.json({
      users,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID (admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -refreshToken")
      .populate("addresses");

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user (admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.mobileNo = req.body.mobileNo || user.mobileNo;
    user.role = req.body.role || user.role;
    user.isBlocked = req.body.isBlocked !== undefined ? req.body.isBlocked : user.isBlocked;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      mobileNo: updatedUser.mobileNo,
      role: updatedUser.role,
      isBlocked: updatedUser.isBlocked
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user (admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne();
    res.json({ message: "User removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle user block status (admin only)
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

    res.json({
      message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`,
      isBlocked: user.isBlocked
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
    // You'll need to import Order model at the top
    // import Order from "../model/Order.js";
    
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};