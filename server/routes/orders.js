const express = require("express");
const { auth, authorize } = require("../middleware/auth");
const Order = require("../models/Order");
const Inventory = require("../models/Inventory");
const User = require("../models/Users");

const router = express.Router();

// Create new order - UPDATED VERSION
router.post(
  "/",
  auth,
  authorize("healthcare_provider", "customer"),
  async (req, res) => {
    try {
      console.log("Order creation request:", req.body);

      // Validate request body
      if (
        !req.body.items ||
        !Array.isArray(req.body.items) ||
        req.body.items.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Order must contain at least one item",
        });
      }

      if (!req.body.deliveryAddress) {
        return res.status(400).json({
          success: false,
          message: "Delivery address is required",
        });
      }

      // Validate delivery address fields
      const { street, city, state, zipCode } = req.body.deliveryAddress;
      if (!street || !city || !state || !zipCode) {
        return res.status(400).json({
          success: false,
          message: "All delivery address fields are required",
        });
      }

      const orderItems = [];
      let totalAmount = 0;

      // Process each item and validate inventory
      for (const item of req.body.items) {
        const product = await Inventory.findById(item.product);
        if (!product) {
          return res.status(400).json({
            success: false,
            message: `Product not found: ${item.product}`,
          });
        }

        if (product.quantity < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name}. Available: ${product.quantity}`,
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

      // Create order data
      const orderData = {
        items: orderItems,
        totalAmount: totalAmount,
        deliveryAddress: req.body.deliveryAddress,
        orderType: req.body.orderType || "standard",
        priority: req.body.priority || "medium",
        specialRequirements: req.body.specialRequirements || {},
        customer: req.user._id,
        status: "pending",
      };

      console.log("Creating order with data:", orderData);

      const order = new Order(orderData);
      await order.save();

      // Update inventory quantities after order is successfully created
      for (let item of orderItems) {
        await Inventory.findByIdAndUpdate(item.product, {
          $inc: { quantity: -item.quantity },
        });
      }

      // Populate the order before sending response
      const populatedOrder = await Order.findById(order._id)
        .populate("customer", "name healthcareFacility")
        .populate("items.product", "name unit");

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: populatedOrder,
      });
    } catch (error) {
      console.error("Order creation error:", error);

      // Handle specific mongoose validation errors
      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((err) => err.message);
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors,
        });
      }

      res.status(400).json({
        success: false,
        message: error.message || "Error creating order",
      });
    }
  }
);

// Get orders based on user role
router.get("/", auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    let query = {};

    // Role-based filtering
    if (
      req.user.role === "healthcare_provider" ||
      req.user.role === "customer"
    ) {
      query.customer = req.user._id;
    } else if (req.user.role === "driver") {
      query.assignedDriver = req.user._id;
    }

    // Status filter
    if (status) {
      if (status === "active") {
        query.status = {
          $in: [
            "pending",
            "confirmed",
            "preparing",
            "assigned",
            "picked_up",
            "in_transit",
          ],
        };
      } else if (status === "completed") {
        query.status = { $in: ["delivered", "cancelled"] };
      } else {
        query.status = status;
      }
    }

    // Search filter
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { "deliveryAddress.city": { $regex: search, $options: "i" } },
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: "customer", select: "name healthcareFacility" },
        { path: "assignedDriver", select: "name phone driverInfo" },
      ],
    };

    const orders = await Order.find(query)
      .populate("customer", "name healthcareFacility")
      .populate("assignedDriver", "name phone driverInfo")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error fetching orders",
      error: error.message,
    });
  }
});

// Get order by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer", "name healthcareFacility phone")
      .populate("assignedDriver", "name phone driverInfo")
      .populate("items.product", "name unit");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if user has access to this order
    if (
      req.user.role === "healthcare_provider" ||
      (req.user.role === "customer" &&
        order.customer._id.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error fetching order",
      error: error.message,
    });
  }
});

// Update order status (Admin, Driver for their orders)
router.patch("/:id/status", auth, async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Authorization checks
    if (req.user.role === "driver") {
      if (order.assignedDriver?.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this order",
        });
      }
    }

    const previousStatus = order.status;
    order.status = status;

    // Add to tracking history
    order.trackingHistory.push({
      status: status,
      description: `Status changed from ${previousStatus} to ${status}`,
      updatedBy: req.user._id,
      note: note || "",
    });

    // Handle driver rewards when order is delivered
    if (status === "delivered" && order.assignedDriver) {
      order.actualDelivery = new Date();

      // Update driver stats and reward points
      const driver = await User.findById(order.assignedDriver);
      if (driver) {
        driver.driverInfo.completedDeliveries += 1;
        driver.driverInfo.totalDeliveries += 1;
        driver.driverInfo.points += 10; // Reward points
        driver.driverInfo.isAvailable = true;
        driver.driverInfo.currentOrder = null;
        await driver.save();
      }
    }

    await order.save();

    res.json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error updating order status",
      error: error.message,
    });
  }
});

// Driver accepts order
router.patch("/:id/accept", auth, authorize("driver"), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status !== "pending" && order.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Order cannot be accepted at this stage",
      });
    }

    // Check if driver is available
    if (!req.user.driverInfo.isAvailable) {
      return res.status(400).json({
        success: false,
        message: "You are not available for new deliveries",
      });
    }

    // Assign driver to order
    order.assignedDriver = req.user._id;
    order.status = "assigned";

    // Add to tracking history
    order.trackingHistory.push({
      status: "assigned",
      description: `Order accepted by driver ${req.user.name}`,
      updatedBy: req.user._id,
    });

    // Update driver status
    const driver = await User.findById(req.user._id);
    driver.driverInfo.isAvailable = false;
    driver.driverInfo.currentOrder = order._id;
    await driver.save();

    await order.save();

    res.json({
      success: true,
      message: "Order accepted successfully",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error accepting order",
      error: error.message,
    });
  }
});

// Assign driver to order (Admin only)
router.patch(
  "/:id/assign-driver",
  auth,
  authorize("admin"),
  async (req, res) => {
    try {
      const { driverId } = req.body;
      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      const driver = await User.findById(driverId);
      if (!driver || driver.role !== "driver") {
        return res.status(400).json({
          success: false,
          message: "Invalid driver",
        });
      }

      if (!driver.driverInfo.isAvailable) {
        return res.status(400).json({
          success: false,
          message: "Driver is not available",
        });
      }

      // Update order
      order.assignedDriver = driverId;
      order.status = "assigned";

      // Add to tracking history
      order.trackingHistory.push({
        status: "assigned",
        description: `Driver ${driver.name} assigned to order`,
        updatedBy: req.user._id,
      });

      // Update driver
      driver.driverInfo.isAvailable = false;
      driver.driverInfo.currentOrder = order._id;
      await driver.save();

      await order.save();

      res.json({
        success: true,
        message: "Driver assigned successfully",
        data: order,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error assigning driver",
        error: error.message,
      });
    }
  }
);

// Cancel order
router.patch("/:id/cancel", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Only customer who placed order or admin can cancel
    if (
      req.user.role === "healthcare_provider" ||
      (req.user.role === "customer" &&
        order.customer.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this order",
      });
    }

    // Only pending or confirmed orders can be cancelled
    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled at this stage",
      });
    }

    // Restore inventory
    for (let item of order.items) {
      await Inventory.findByIdAndUpdate(item.product, {
        $inc: { quantity: item.quantity },
      });
    }

    order.status = "cancelled";

    // Add to tracking history
    order.trackingHistory.push({
      status: "cancelled",
      description: "Order cancelled by customer",
      updatedBy: req.user._id,
    });

    await order.save();

    res.json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error cancelling order",
      error: error.message,
    });
  }
});

// Get order statistics
router.get("/stats/overview", auth, async (req, res) => {
  try {
    let stats;

    if (req.user.role === "admin") {
      stats = await Order.getPlatformStats();
    } else {
      stats = await Order.getCustomerStats(req.user._id);
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error fetching stats",
      error: error.message,
    });
  }
});

// Get dashboard stats
router.get("/stats/dashboard", auth, async (req, res) => {
  try {
    let stats = {};

    if (req.user.role === "admin") {
      const totalOrders = await Order.countDocuments();
      const pendingOrders = await Order.countDocuments({
        status: { $in: ["pending", "confirmed", "preparing"] },
      });
      const inTransitOrders = await Order.countDocuments({
        status: { $in: ["assigned", "picked_up", "in_transit"] },
      });
      const deliveredOrders = await Order.countDocuments({
        status: "delivered",
      });

      stats = {
        totalOrders,
        pendingOrders,
        inTransitOrders,
        deliveredOrders,
      };
    } else if (
      req.user.role === "healthcare_provider" ||
      req.user.role === "customer"
    ) {
      const totalOrders = await Order.countDocuments({
        customer: req.user._id,
      });
      const pendingOrders = await Order.countDocuments({
        customer: req.user._id,
        status: { $in: ["pending", "confirmed", "preparing"] },
      });
      const inTransitOrders = await Order.countDocuments({
        customer: req.user._id,
        status: { $in: ["assigned", "picked_up", "in_transit"] },
      });
      const deliveredOrders = await Order.countDocuments({
        customer: req.user._id,
        status: "delivered",
      });

      stats = {
        totalOrders,
        pendingOrders,
        inTransitOrders,
        deliveredOrders,
      };
    } else if (req.user.role === "driver") {
      const totalDeliveries = req.user.driverInfo.totalDeliveries;
      const completedDeliveries = req.user.driverInfo.completedDeliveries;
      const currentOrder = await Order.findOne({
        assignedDriver: req.user._id,
        status: { $ne: "delivered" },
      });

      stats = {
        totalDeliveries,
        completedDeliveries,
        currentOrder: currentOrder
          ? {
              _id: currentOrder._id,
              orderNumber: currentOrder.orderNumber,
              status: currentOrder.status,
            }
          : null,
      };
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error fetching stats",
      error: error.message,
    });
  }
});

module.exports = router;
