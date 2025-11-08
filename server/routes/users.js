const express = require("express");
const { auth, authorize } = require("../middleware/auth");
const User = require("../models/Users");

const router = express.Router();

// Get user profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    let stats = null;
    if (user.role === "driver") {
      stats = user.getDriverStats();
    }

    res.json({
      success: true,
      data: { user, stats },
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
      "address",
      "healthcareFacility",
      "driverInfo",
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
router.patch(
  "/driver/location",
  auth,
  authorize("driver"),
  async (req, res) => {
    try {
      const { lat, lng, isAvailable } = req.body;

      const updateData = { "driverInfo.currentLocation": { lat, lng } };
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
  }
);

// Get available drivers
router.get(
  "/drivers/available",
  auth,
  authorize("admin", "healthcare_provider"),
  async (req, res) => {
    try {
      const { vehicleType } = req.query;
      const drivers = await User.findAvailableDrivers(vehicleType);

      res.json({ success: true, data: drivers });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error fetching available drivers",
        error: error.message,
      });
    }
  }
);

module.exports = router;
