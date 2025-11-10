const express = require("express");
const { auth, authorize } = require("../middleware/auth");
const User = require("../models/Users");

const router = express.Router();

// Get user profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error fetching profile",
      error: error.message,
    });
  }
});

// Update user profile
router.put("/profile", auth, async (req, res) => {
  try {
    const allowedUpdates = [
      "name",
      "phone",
      "healthcareFacility",
      "driverInfo",
      "customerInfo",
    ];
    const updates = {};

    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error updating profile",
      error: error.message,
    });
  }
});

// Update driver location
router.patch("/driver/location", auth, authorize("driver"), async (req, res) => {
  try {
    const { lat, lng, address, isAvailable } = req.body;

    const updateData = {
      "driverInfo.currentLocation": { lat, lng, address },
    };

    if (typeof isAvailable !== "undefined") {
      updateData["driverInfo.isAvailable"] = isAvailable;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
    }).select("-password");

    res.json({
      success: true,
      message: "Location updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error updating location",
      error: error.message,
    });
  }
});

// Get available drivers
router.get("/drivers/available", auth, async (req, res) => {
  try {
    const drivers = await User.findAvailableDrivers();
    res.json({ success: true, data: drivers });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error fetching available drivers",
      error: error.message,
    });
  }
});

// Get all users (admin only)
router.get("/", auth, authorize("admin"), async (req, res) => {
  try {
    const { role } = req.query;
    let query = { isActive: true };
    
    if (role && role !== "all") {
      query.role = role;
    }

    const users = await User.find(query).select("-password");
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error fetching users",
      error: error.message,
    });
  }
});

module.exports = router;