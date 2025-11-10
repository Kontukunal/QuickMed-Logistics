const express = require("express");
const { auth, authorize } = require("../middleware/auth");
const Vehicle = require("../models/Vehicle");
const User = require("../models/Users");

const router = express.Router();

// Get all vehicles
router.get("/", auth, async (req, res) => {
  try {
    const { type, status } = req.query;
    let query = { isActive: true };

    if (type) query.type = type;
    if (status) query.status = status;

    const vehicles = await Vehicle.find(query).populate(
      "assignedDriver",
      "name phone"
    );

    res.json({ success: true, data: vehicles });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching vehicles",
      error: error.message,
    });
  }
});

// Create vehicle (admin only)
router.post("/", auth, authorize("admin"), async (req, res) => {
  try {
    const vehicle = new Vehicle(req.body);
    await vehicle.save();

    res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
      data: vehicle,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating vehicle",
      error: error.message,
    });
  }
});

// Assign vehicle to driver
router.patch("/:id/assign", auth, authorize("admin"), async (req, res) => {
  try {
    const { driverId } = req.body;
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { assignedDriver: driverId },
      { new: true }
    ).populate("assignedDriver", "name phone");

    // Update driver's vehicle info
    await User.findByIdAndUpdate(driverId, {
      "driverInfo.vehicle": req.params.id,
    });

    res.json({
      success: true,
      message: "Vehicle assigned successfully",
      data: vehicle,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error assigning vehicle",
      error: error.message,
    });
  }
});

module.exports = router;
