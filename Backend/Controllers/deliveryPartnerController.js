import DeliveryPartner from "../model/DeliveryPartner.js";


import bcrypt from "bcryptjs";

const registerDeliveryPartner = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      companyName,
      address,
      vehicleType,
      vehicleNumber,
      licenseNumber,
      aadharNumber,
      bankDetails,
    } = req.body;

    const existingPartner = await DeliveryPartner.findOne({
      $or: [
        { email },
        { phone },
        { vehicleNumber },
        { licenseNumber },
        { aadharNumber },
      ],
    });

    if (existingPartner) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery partner already exists with this email, phone, vehicle number, license, or Aadhar",
      });
    }

    const defaultPassword = phone; // or use a more secure default like 'Delivery@123'

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    const deliveryPartner = new DeliveryPartner({
      name,
      email,
      phone,
      companyName,
      address,
      vehicleType,
      vehicleNumber,
      licenseNumber,
      aadharNumber,
      bankDetails,
      status: "pending",
      password: hashedPassword, // Store hashed password
    });

    await deliveryPartner.save();

    res.status(201).json({
      success: true,
      message: "Delivery partner registered successfully",
      data: {
        _id: deliveryPartner._id,
        name: deliveryPartner.name,
        email: deliveryPartner.email,
        phone: deliveryPartner.phone,
        defaultPassword: defaultPassword, // Send plain text password for admin to share
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


const getAllDeliveryPartners = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;

    let query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const deliveryPartners = await DeliveryPartner.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await DeliveryPartner.countDocuments(query);

    res.status(200).json({
      success: true,
      data: deliveryPartners,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const getDeliveryPartnerById = async (req, res) => {
  try {
    const deliveryPartner = await DeliveryPartner.findById(req.params.id);

    if (!deliveryPartner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found",
      });
    }

    res.status(200).json({
      success: true,
      data: deliveryPartner,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


const updateDeliveryPartner = async (req, res) => {
  try {
    const updates = req.body;
    const deliveryPartner = await DeliveryPartner.findById(req.params.id);

    if (!deliveryPartner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found",
      });
    }

    delete updates._id;
    delete updates.createdAt;

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        deliveryPartner[key] = updates[key];
      }
    });

    await deliveryPartner.save();

    res.status(200).json({
      success: true,
      message: "Delivery partner updated successfully",
      data: deliveryPartner,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const deleteDeliveryPartner = async (req, res) => {
  try {
    const deliveryPartner = await DeliveryPartner.findById(req.params.id);

    if (!deliveryPartner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found",
      });
    }

    await deliveryPartner.deleteOne();

    res.status(200).json({
      success: true,
      message: "Delivery partner deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


const updatePartnerStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "inactive", "suspended", "pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const deliveryPartner = await DeliveryPartner.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true, runValidators: true },
    );

    if (!deliveryPartner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Delivery partner status updated to ${status}`,
      data: deliveryPartner,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


const getPartnerStats = async (req, res) => {
  try {
    const totalPartners = await DeliveryPartner.countDocuments();
    const activePartners = await DeliveryPartner.countDocuments({
      status: "active",
    });
    const pendingPartners = await DeliveryPartner.countDocuments({
      status: "pending",
    });
    const suspendedPartners = await DeliveryPartner.countDocuments({
      status: "suspended",
    });
    const inactivePartners = await DeliveryPartner.countDocuments({
      status: "inactive",
    });

    const totalDeliveries = await DeliveryPartner.aggregate([
      { $group: { _id: null, total: { $sum: "$totalDeliveries" } } },
    ]);

    const totalEarnings = await DeliveryPartner.aggregate([
      { $group: { _id: null, total: { $sum: "$totalEarnings" } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalPartners,
        active: activePartners,
        pending: pendingPartners,
        suspended: suspendedPartners,
        inactive: inactivePartners,
        totalDeliveries: totalDeliveries[0]?.total || 0,
        totalEarnings: totalEarnings[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export {
  registerDeliveryPartner,
  getAllDeliveryPartners,
  getDeliveryPartnerById,
  updateDeliveryPartner,
  deleteDeliveryPartner,
  updatePartnerStatus,
  getPartnerStats,
};
