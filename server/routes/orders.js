const express = require("express");
const { auth, authorize } = require("../middleware/auth");
const Order = require("../models/Order");
const Inventory = require("../models/Inventory");
const User = require("../models/Users");

const router = express.Router();

// Get orders with filtering
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, orderType, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Role-based filtering
    if (req.user.role === "customer") {
      query.customer = req.user._id;
    } else if (req.user.role === "driver") {
      query.assignedDriver = req.user._id;
    } else if (req.user.role === "healthcare_provider") {
      query.healthcareFacility = req.user._id;
    }

    if (status) query.status = status;
    if (orderType) query.orderType = orderType;

    // Search functionality
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { "deliveryAddress.city": { $regex: search, $options: "i" } },
        { "deliveryAddress.state": { $regex: search, $options: "i" } },
      ];
    }

    const orders = await Order.find(query)
      .populate("customer", "name email phone")
      .populate("assignedDriver", "name phone")
      .populate("healthcareFacility", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching orders",
      error: error.message,
    });
  }
});

// Get single order
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer", "name email phone")
      .populate("assignedDriver", "name phone driverInfo")
      .populate("healthcareFacility", "name email phone")
      .populate("items.product", "name category sku unit");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Authorization check
    if (
      req.user.role === "customer" &&
      order.customer._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (
      req.user.role === "healthcare_provider" &&
      order.healthcareFacility &&
      order.healthcareFacility._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching order",
      error: error.message,
    });
  }
});

// Create order - FIXED VERSION (without transactions)
router.post("/", auth, async (req, res) => {
  try {
    console.log("=== ORDER CREATION STARTED ===");
    console.log("User:", req.user._id, req.user.role);
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const {
      items,
      deliveryAddress,
      orderType = "standard",
      priority = "medium",
      specialRequirements = {},
      notes,
    } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
      });
    }

    if (
      !deliveryAddress?.street ||
      !deliveryAddress?.city ||
      !deliveryAddress?.state ||
      !deliveryAddress?.zipCode
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Street, city, state, and zipCode are required in delivery address",
      });
    }

    // Process items and validate stock
    const orderItems = [];
    let totalAmount = 0;

    // First, validate all items and check stock
    for (const item of items) {
      if (!item.product || !item.quantity || item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Each item must have a valid product and quantity",
        });
      }

      const product = await Inventory.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.product} not found`,
        });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.quantity} ${product.unit}`,
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: item.product,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal,
      });
    }

    // Now update inventory and create order
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const product = await Inventory.findById(item.product);
      product.quantity -= item.quantity;
      await product.save();
    }

    // Create order data
    const orderData = {
      customer: req.user._id,
      items: orderItems,
      totalAmount,
      deliveryAddress,
      orderType,
      priority,
      specialRequirements,
      notes,
      trackingHistory: [
        {
          status: "pending",
          description: "Order placed successfully",
          updatedBy: req.user._id,
        },
      ],
    };

    // Add healthcareFacility if user is healthcare provider
    if (req.user.role === "healthcare_provider") {
      orderData.healthcareFacility = req.user._id;
    }

    console.log("Creating order with data:", orderData);

    // Create and save order
    const order = new Order(orderData);
    await order.save();

    console.log("Order created successfully:", order.orderNumber);

    // Populate for response
    const populatedOrder = await Order.findById(order._id)
      .populate("customer", "name email phone")
      .populate("healthcareFacility", "name email")
      .populate("items.product", "name category unit");

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: populatedOrder,
    });
  } catch (error) {
    console.error("Order creation error:", error);

    // More specific error handling
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.message,
        details: validationErrors,
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate order detected",
        error: "Duplicate order number",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error creating order",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Update order status
router.patch("/:id/status", auth, async (req, res) => {
  try {
    const { status, description, location } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Authorization check
    if (
      req.user.role === "customer" &&
      order.customer.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (
      req.user.role === "driver" &&
      (!order.assignedDriver ||
        order.assignedDriver.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (
      req.user.role === "healthcare_provider" &&
      order.healthcareFacility &&
      order.healthcareFacility.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const previousStatus = order.status;
    order.status = status;

    const trackingEntry = {
      status,
      description:
        description || `Status updated from ${previousStatus} to ${status}`,
      updatedBy: req.user._id,
      timestamp: new Date(),
    };

    if (location) {
      trackingEntry.location = location;
    }

    order.trackingHistory.push(trackingEntry);

    if (status === "delivered") {
      order.actualDelivery = new Date();

      // Update driver stats if assigned
      if (order.assignedDriver) {
        await User.findByIdAndUpdate(order.assignedDriver, {
          $inc: {
            "driverInfo.completedDeliveries": 1,
            "driverInfo.earnings": order.totalAmount * 0.1, // 10% commission
          },
        });
      }
    }

    await order.save();

    res.json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating order",
      error: error.message,
    });
  }
});

// Assign driver to order
router.patch(
  "/:id/assign-driver",
  auth,
  authorize("admin", "dispatcher"),
  async (req, res) => {
    try {
      const { driverId } = req.body;

      const order = await Order.findById(req.params.id);
      const driver = await User.findById(driverId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      if (!driver || driver.role !== "driver") {
        return res.status(404).json({
          success: false,
          message: "Driver not found",
        });
      }

      if (!driver.driverInfo?.isAvailable) {
        return res.status(400).json({
          success: false,
          message: "Driver is not available",
        });
      }

      order.assignedDriver = driverId;
      order.status = "confirmed";

      order.trackingHistory.push({
        status: "confirmed",
        description: `Driver ${driver.name} assigned to delivery`,
        updatedBy: req.user._id,
        timestamp: new Date(),
      });

      await order.save();

      // Update driver's total deliveries
      await User.findByIdAndUpdate(driverId, {
        $inc: { "driverInfo.totalDeliveries": 1 },
      });

      const populatedOrder = await Order.findById(order._id)
        .populate("assignedDriver", "name phone driverInfo")
        .populate("customer", "name email phone")
        .populate("healthcareFacility", "name email");

      res.json({
        success: true,
        message: "Driver assigned successfully",
        data: populatedOrder,
      });
    } catch (error) {
      console.error("Error assigning driver:", error);
      res.status(500).json({
        success: false,
        message: "Server error assigning driver",
        error: error.message,
      });
    }
  }
);

// Cancel order - FIXED VERSION (without transactions)
router.patch("/:id/cancel", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Authorization check
    if (
      req.user.role === "customer" &&
      order.customer.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (
      req.user.role === "healthcare_provider" &&
      order.healthcareFacility &&
      order.healthcareFacility.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (["delivered", "cancelled"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.status}`,
      });
    }

    // Restore inventory
    for (const item of order.items) {
      await Inventory.findByIdAndUpdate(item.product, {
        $inc: { quantity: item.quantity },
      });
    }

    order.status = "cancelled";
    order.trackingHistory.push({
      status: "cancelled",
      description: `Order cancelled by ${req.user.role}`,
      updatedBy: req.user._id,
      timestamp: new Date(),
    });

    await order.save();

    res.json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({
      success: false,
      message: "Server error cancelling order",
      error: error.message,
    });
  }
});

module.exports = router;
