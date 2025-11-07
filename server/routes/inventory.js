const express = require("express");
const { auth, authorize } = require("../middleware/auth");
const Inventory = require("../models/Inventory");

const router = express.Router();

// Get all inventory items
router.get("/", auth, async (req, res) => {
  try {
    const inventory = await Inventory.find({ isActive: true });
    res.json({ inventory });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({
      message: "Server error fetching inventory",
      error: error.message,
    });
  }
});

// Create inventory item (admin/healthcare provider only)
router.post(
  "/",
  auth,
  authorize("admin", "healthcare_provider"),
  async (req, res) => {
    try {
      console.log("Received inventory data:", req.body);

      // Generate a simple SKU if not provided (fallback)
      const inventoryData = { ...req.body };
      if (!inventoryData.sku) {
        inventoryData.sku = `SKU${Date.now()}${Math.random()
          .toString(36)
          .substr(2, 6)
          .toUpperCase()}`;
      }

      const inventory = new Inventory(inventoryData);
      await inventory.save();

      res.status(201).json({
        message: "Inventory item created successfully",
        inventory,
      });
    } catch (error) {
      console.error("Inventory creation error:", error);

      // More specific error responses
      if (error.name === "ValidationError") {
        const validationErrors = Object.values(error.errors).map((err) => ({
          field: err.path,
          message: err.message,
        }));

        return res.status(400).json({
          message: "Validation error - Please check all required fields",
          error: error.message,
          details: validationErrors,
        });
      }

      if (error.code === 11000) {
        return res.status(400).json({
          message: "SKU already exists - please try again",
          error: "Duplicate SKU value",
        });
      }

      res.status(500).json({
        message: "Server error creating inventory item",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
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
        return res.status(404).json({ message: "Inventory item not found" });
      }

      res.json({
        message: "Inventory item updated successfully",
        inventory,
      });
    } catch (error) {
      console.error("Inventory update error:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          message: "Validation error",
          error: error.message,
        });
      }

      res.status(500).json({
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
        return res.status(404).json({ message: "Inventory item not found" });
      }

      res.json({
        message: "Inventory item deleted successfully",
      });
    } catch (error) {
      console.error("Inventory deletion error:", error);
      res.status(500).json({
        message: "Server error deleting inventory item",
        error: error.message,
      });
    }
  }
);

// Get low stock items
router.get(
  "/alerts/low-stock",
  auth,
  authorize("admin", "healthcare_provider"),
  async (req, res) => {
    try {
      const lowStockItems = await Inventory.find({
        isActive: true,
        $expr: { $lte: ["$quantity", "$reorderLevel"] },
      });

      res.json({ lowStockItems });
    } catch (error) {
      console.error("Error fetching low stock items:", error);
      res.status(500).json({
        message: "Server error fetching low stock items",
        error: error.message,
      });
    }
  }
);

module.exports = router;
