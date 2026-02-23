import User from "../model/User.js";
import Order from "../model/Order.js";

// @desc    Get all users
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

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -refreshToken")
      .populate("addresses")
      .populate("orders");

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
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
    } else {
      res.status(404).json({ message: "User not found" });
    }
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

    if (user) {
      await user.deleteOne();
      res.json({ message: "User removed successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Block/Unblock user
// @route   PUT /api/users/:id/toggle-block
// @access  Private/Admin
export const toggleUserBlock = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.isBlocked = !user.isBlocked;
      await user.save();
      
      res.json({ 
        message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`,
        isBlocked: user.isBlocked
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add user address
// @route   POST /api/users/address
// @access  Private
export const addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.addresses.push(req.body);
      await user.save();
      
      res.json(user.addresses);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user address
// @route   PUT /api/users/address/:addressId
// @access  Private
export const updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      const address = user.addresses.id(req.params.addressId);
      if (address) {
        Object.assign(address, req.body);
        await user.save();
        res.json(user.addresses);
      } else {
        res.status(404).json({ message: "Address not found" });
      }
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user address
// @route   DELETE /api/users/address/:addressId
// @access  Private
export const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.addresses = user.addresses.filter(
        addr => addr._id.toString() !== req.params.addressId
      );
      await user.save();
      res.json({ message: "Address removed" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user orders
// @route   GET /api/users/orders
// @access  Private
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("items.productId", "name images");

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};