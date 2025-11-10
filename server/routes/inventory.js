const express = require("express");
const { auth, authorize } = require("../middleware/auth");
const Inventory = require("../models/Inventory");

const router = express.Router();

// Get all inventory items
router.get("/", auth, async (req, res) => {
  try {
    const { category, lowStock, search } = req.query;
    let query = { isActive: true };

    if (category && category !== "all") query.category = category;
    if (lowStock === "true") {
      query.$expr = { $lte: ["$quantity", "$reorderLevel"] };
    }
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const inventory = await Inventory.find(query).sort({ name: 1 });
    res.json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error fetching inventory",
      error: error.message,
    });
  }
});

// Create inventory item
router.post("/", auth, authorize("admin"), async (req, res) => {
  try {
    const inventoryData = { ...req.body };
    if (inventoryData.sku === "" || inventoryData.sku === null) {
      delete inventoryData.sku;
    }

    const inventory = new Inventory(inventoryData);
    await inventory.save();

    res.status(201).json({
      success: true,
      message: "Inventory item created successfully",
      data: inventory,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating inventory item",
      error: error.message,
    });
  }
});

// Update inventory item
router.put("/:id", auth, authorize("admin"), async (req, res) => {
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
    res.status(400).json({
      success: false,
      message: "Error updating inventory item",
      error: error.message,
    });
  }
});

// Delete inventory item
router.delete("/:id", auth, authorize("admin"), async (req, res) => {
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
    res.status(500).json({
      success: false,
      message: "Server error deleting inventory item",
      error: error.message,
    });
  }
});

// Get low stock alerts
router.get("/alerts/low-stock", auth, authorize("admin"), async (req, res) => {
  try {
    const lowStockItems = await Inventory.findLowStock();
    res.json({ success: true, data: lowStockItems });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error fetching low stock items",
      error: error.message,
    });
  }
});

module.exports = router;
