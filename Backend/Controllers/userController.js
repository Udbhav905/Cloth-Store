import User from "../model/User.js";
import Order from "../model/Order.js";

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password -refreshToken");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.body.name !== undefined) user.name = req.body.name.trim();

    const updated = await user.save();

    res.json({
      _id:       updated._id,
      name:      updated.name,
      email:     updated.email,
      mobileNo:  updated.mobileNo,
      role:      updated.role,
      isVerified:updated.isVerified,
      addresses: updated.addresses,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("addresses");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getAddressById = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("addresses");
    if (!user) return res.status(404).json({ message: "User not found" });

    const address = user.addresses.id(req.params.addressId);
    if (!address) return res.status(404).json({ message: "Address not found" });

    res.json(address);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { address1, address2, city, state, pincode, country, isDefault } = req.body;

    if (!address1) return res.status(400).json({ message: "address1 is required" });

    if (isDefault) {
      user.addresses.forEach((a) => { a.isDefault = false; });
    }

    user.addresses.push({ address1, address2, city, state, pincode, country: country || "India", isDefault: !!isDefault });
    await user.save();

    res.status(201).json(user.addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const address = user.addresses.id(req.params.addressId);
    if (!address) return res.status(404).json({ message: "Address not found" });

    const { address1, address2, city, state, pincode, country, isDefault } = req.body;

    if (isDefault) {
      user.addresses.forEach((a) => { a.isDefault = false; });
    }

    if (address1  !== undefined) address.address1 = address1;
    if (address2  !== undefined) address.address2 = address2;
    if (city      !== undefined) address.city      = city;
    if (state     !== undefined) address.state     = state;
    if (pincode   !== undefined) address.pincode   = pincode;
    if (country   !== undefined) address.country   = country;
    if (isDefault !== undefined) address.isDefault = isDefault;

    await user.save();
    res.json(user.addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const before = user.addresses.length;
    user.addresses = user.addresses.filter(
      (a) => a._id.toString() !== req.params.addressId
    );

    if (user.addresses.length === before)
      return res.status(404).json({ message: "Address not found" });

    await user.save();
    res.json({ message: "Address removed", addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const setDefaultAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    let found = false;
    user.addresses.forEach((a) => {
      if (a._id.toString() === req.params.addressId) {
        a.isDefault = true;
        found = true;
      } else {
        a.isDefault = false;
      }
    });

    if (!found) return res.status(404).json({ message: "Address not found" });

    await user.save();
    res.json(user.addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("items.productId", "name mainImage slug");

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════
   ADMIN controllers (kept here for single-file clarity)
══════════════════════════════════════════════════════════ */

export const getUsers = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const users = await User.find({})
      .select("-password -refreshToken")
      .skip(skip).limit(limit).sort({ createdAt: -1 });

    const total = await User.countDocuments({});
    res.json({ users, page, pages: Math.ceil(total / limit), total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -refreshToken");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.name      = req.body.name      ?? user.name;
    user.email     = req.body.email     ?? user.email;
    user.mobileNo  = req.body.mobileNo  ?? user.mobileNo;
    user.role      = req.body.role      ?? user.role;
    user.isBlocked = req.body.isBlocked ?? user.isBlocked;

    const u = await user.save();
    res.json({ _id: u._id, name: u.name, email: u.email, mobileNo: u.mobileNo, role: u.role, isBlocked: u.isBlocked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    await user.deleteOne();
    res.json({ message: "User removed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleUserBlock = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully`, isBlocked: user.isBlocked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};