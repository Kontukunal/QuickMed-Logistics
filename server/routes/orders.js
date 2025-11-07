const express = require("express");
const { auth, authorize } = require("../middleware/auth");
const Order = require("../models/Order");
const Inventory = require("../models/Inventory");

const router = express.Router();

// Create order
router.post("/", auth, async (req, res) => {
  try {
    const {
      items,
      deliveryAddress,
      orderType,
      priority,
      scheduledDelivery,
      specialRequirements,
    } = req.body;

    // Calculate total amount and validate items
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Inventory.findById(item.product);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product ${item.product} not found` });
      }
      if (product.quantity < item.quantity) {
        return res
          .status(400)
          .json({ message: `Insufficient stock for ${product.name}` });
      }

      totalAmount += product.price * item.quantity;
      orderItems.push({
        product: item.product,
        quantity: item.quantity,
        price: product.price,
      });
    }

    const order = new Order({
      customer: req.user._id,
      items: orderItems,
      totalAmount,
      deliveryAddress,
      orderType,
      priority,
      scheduledDelivery,
      specialRequirements,
      trackingHistory: [
        {
          status: "pending",
          description: "Order placed successfully",
        },
      ],
    });

    await order.save();

    // Update inventory
    for (const item of items) {
      await Inventory.findByIdAndUpdate(item.product, {
        $inc: { quantity: -item.quantity },
      });
    }

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error creating order", error: error.message });
  }
});

// Get all orders (with filters based on role)
router.get("/", auth, async (req, res) => {
  try {
    let query = {};

    // Filter based on user role
    if (req.user.role === "customer") {
      query.customer = req.user._id;
    } else if (req.user.role === "driver") {
      query.assignedDriver = req.user._id;
    } else if (req.user.role === "healthcare_provider") {
      query.healthcareFacility = req.user._id;
    }

    const orders = await Order.find(query)
      .populate("customer", "name email phone")
      .populate("assignedDriver", "name phone driverInfo")
      .populate("items.product", "name category")
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error fetching orders", error: error.message });
  }
});

// Get single order
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer", "name email phone address")
      .populate("assignedDriver", "name phone driverInfo")
      .populate("items.product", "name category description");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check authorization
    if (
      req.user.role === "customer" &&
      order.customer._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ order });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error fetching order", error: error.message });
  }
});

// Update order status
router.patch(
  "/:id/status",
  auth,
  authorize("admin", "driver"),
  async (req, res) => {
    try {
      const { status, location, description } = req.body;

      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      order.status = status;
      order.trackingHistory.push({
        status,
        location,
        description: description || `Order status updated to ${status}`,
      });

      if (status === "delivered") {
        order.actualDelivery = new Date();
      }

      await order.save();

      res.json({
        message: "Order status updated successfully",
        order,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Server error updating order", error: error.message });
    }
  }
);

module.exports = router;
