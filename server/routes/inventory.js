const express = require("express");
const { auth, authorize } = require("../middleware/auth");
const Inventory = require("../models/Inventory");

const router = express.Router();

// Get all inventory items
router.get("/", auth, async (req, res) => {
  try {
    const { category, lowStock } = req.query;
    let query = { isActive: true };

    if (category) query.category = category;
    if (lowStock === "true") {
      query.$expr = { $lte: ["$quantity", "$reorderLevel"] };
    }

    const inventory = await Inventory.find(query);
    res.json({ success: true, data: inventory });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching inventory",
      error: error.message,
    });
  }
});

// Create inventory item
router.post(
  "/",
  auth,
  authorize("admin", "healthcare_provider"),
  async (req, res) => {
    try {
      const inventory = new Inventory(req.body);
      await inventory.save();

      res.status(201).json({
        success: true,
        message: "Inventory item created successfully",
        data: inventory,
      });
    } catch (error) {
      console.error("Inventory creation error:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Server error creating inventory item",
        error: error.message,
      });
    }
  }
);

// Update inventory item
router.put(
  "/:id",
  auth,
  authorize("admin", "healthcare_provider"),
  async (req, res) => {
    try {
      const inventory = await Inventory.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!inventory) {
        return res.status(404).json({
          success: false,
          message: "Inventory item not found",
        });
      }

      res.json({
        success: true,
        message: "Inventory item updated successfully",
        data: inventory,
      });
    } catch (error) {
      console.error("Inventory update error:", error);
      res.status(500).json({
        success: false,
        message: "Server error updating inventory item",
        error: error.message,
      });
    }
  }
);

// Delete inventory item (soft delete)
router.delete(
  "/:id",
  auth,
  authorize("admin", "healthcare_provider"),
  async (req, res) => {
    try {
      const inventory = await Inventory.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      );

      if (!inventory) {
        return res.status(404).json({
          success: false,
          message: "Inventory item not found",
        });
      }

      res.json({
        success: true,
        message: "Inventory item deleted successfully",
      });
    } catch (error) {
      console.error("Inventory deletion error:", error);
      res.status(500).json({
        success: false,
        message: "Server error deleting inventory item",
        error: error.message,
      });
    }
  }
);

// Get low stock alerts
router.get(
  "/alerts/low-stock",
  auth,
  authorize("admin", "healthcare_provider"),
  async (req, res) => {
    try {
      const lowStockItems = await Inventory.findLowStock();
      res.json({ success: true, data: lowStockItems });
    } catch (error) {
      console.error("Error fetching low stock items:", error);
      res.status(500).json({
        success: false,
        message: "Server error fetching low stock items",
        error: error.message,
      });
    }
  }
);

module.exports = router;
