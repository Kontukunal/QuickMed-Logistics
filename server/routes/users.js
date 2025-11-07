const express = require("express");
const { auth, authorize } = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

// Get all users (admin only)
router.get("/", auth, authorize("admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ users });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error fetching users", error: error.message });
  }
});

// Get user by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error fetching user", error: error.message });
  }
});

// Update user profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address },
      { new: true }
    ).select("-password");

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error updating profile", error: error.message });
  }
});

// Update driver location
router.patch(
  "/driver/location",
  auth,
  authorize("driver"),
  async (req, res) => {
    try {
      const { lat, lng } = req.body;

      const user = await User.findByIdAndUpdate(
        req.user._id,
        {
          "driverInfo.currentLocation": { lat, lng },
          "driverInfo.isAvailable": true,
        },
        { new: true }
      ).select("-password");

      res.json({
        message: "Location updated successfully",
        user,
      });
    } catch (error) {
      res
        .status(500)
        .json({
          message: "Server error updating location",
          error: error.message,
        });
    }
  }
);

module.exports = router;
