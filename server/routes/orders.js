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

// Get all orders - FIXED VERSION
router.get("/", auth, async (req, res) => {
  try {
    console.log("Fetching orders for user:", {
      userId: req.user._id,
      role: req.user.role,
      email: req.user.email,
    });

    let query = {};

    // If user is healthcare provider or customer, show only their orders
    if (
      req.user.role === "healthcare_provider" ||
      req.user.role === "customer"
    ) {
      query.customer = req.user._id;
      console.log("Filtering orders for customer:", req.user._id);
    }
    // Admin and driver can see all orders (no additional filter)
    else if (req.user.role === "admin" || req.user.role === "driver") {
      console.log("Showing all orders for admin/driver");
      // No customer filter for admin and driver
    }

    // Add status filter if provided
    if (req.query.status && req.query.status !== "all") {
      query.status = req.query.status;
      console.log("Applying status filter:", req.query.status);
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    console.log("Final query:", query);

    const orders = await Order.find(query)
      .populate("customer", "name email phone healthcareFacility")
      .populate("driver", "name phone driverInfo")
      .populate("assignedDriver", "name phone driverInfo")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);
    const pages = Math.ceil(total / limit);

    console.log(`Found ${orders.length} orders out of ${total} total`);

    res.json({
      success: true,
      data: orders,
      pagination: {
        current: page,
        pages: pages,
        total: total,
        hasNext: page < pages,
        hasPrev: page > 1,
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

// Driver accepts an order - UPDATED VERSION
router.patch("/:id/accept", auth, authorize("driver"), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if order can be accepted
    if (order.status !== "pending" && order.status !== "assigned") {
      return res.status(400).json({
        success: false,
        message: "Order cannot be accepted in its current status",
      });
    }

    // Check if driver is available
    if (!req.user.driverInfo.isAvailable) {
      return res.status(400).json({
        success: false,
        message: "You are not available for new deliveries",
      });
    }

    // Check if order is already assigned to another driver
    if (
      order.assignedDriver &&
      order.assignedDriver.toString() !== req.user._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "Order is already assigned to another driver",
      });
    }

    // Assign driver and update status
    order.assignedDriver = req.user._id;
    order.driver = req.user._id; // For backward compatibility
    order.status = "accepted";
    order.acceptedAt = new Date();

    // Add to tracking history
    order.trackingHistory.push({
      status: "accepted",
      description: `Order accepted by driver ${req.user.name}`,
      updatedBy: req.user._id,
      timestamp: new Date(),
    });

    // Update driver status
    const driver = await User.findById(req.user._id);
    driver.driverInfo.isAvailable = false;
    driver.driverInfo.currentOrder = order._id;
    await driver.save();

    await order.save();

    // Populate order before sending response
    await order.populate("customer", "name email phone healthcareFacility");
    await order.populate("assignedDriver", "name phone driverInfo");
    await order.populate("driver", "name phone driverInfo");

    res.json({
      success: true,
      message: "Order accepted successfully",
      data: order,
    });
  } catch (error) {
    console.error("Error accepting order:", error);
    res.status(500).json({
      success: false,
      message: "Server error accepting order",
      error: error.message,
    });
  }
});

// Get orders for driver (all orders like admin) - UPDATED
router.get("/driver/my-orders", auth, authorize("driver"), async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("customer", "name email phone healthcareFacility")
      .populate("assignedDriver", "name phone driverInfo")
      .populate("driver", "name phone driverInfo")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching driver orders:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching driver orders",
      error: error.message,
    });
  }
});

// Update delivery status - UPDATED
router.patch(
  "/:id/delivery-status",
  auth,
  authorize("driver"),
  async (req, res) => {
    try {
      const { status } = req.body;
      const validStatuses = [
        "picked_up",
        "in_transit",
        "delivered",
        "cancelled",
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status provided",
        });
      }

      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Check if driver owns this order
      if (order.assignedDriver?.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only update orders assigned to you",
        });
      }

      const previousStatus = order.status;
      order.status = status;

      // Set timestamps based on status
      if (status === "picked_up") {
        order.pickedUpAt = new Date();
      } else if (status === "delivered") {
        order.deliveredAt = new Date();
        order.actualDelivery = new Date();

        // Update driver stats and make available
        const driver = await User.findById(req.user._id);
        if (driver) {
          driver.driverInfo.completedDeliveries += 1;
          driver.driverInfo.totalDeliveries += 1;
          driver.driverInfo.points += 10;
          driver.driverInfo.isAvailable = true;
          driver.driverInfo.currentOrder = null;
          await driver.save();
        }
      } else if (status === "cancelled") {
        order.cancelledAt = new Date();

        // Make driver available if order cancelled
        const driver = await User.findById(req.user._id);
        if (driver) {
          driver.driverInfo.isAvailable = true;
          driver.driverInfo.currentOrder = null;
          await driver.save();
        }
      }

      // Add to tracking history
      order.trackingHistory.push({
        status: status,
        description: `Status changed from ${previousStatus} to ${status}`,
        updatedBy: req.user._id,
        timestamp: new Date(),
      });

      await order.save();

      // Populate order before sending response
      await order.populate("customer", "name email phone healthcareFacility");
      await order.populate("assignedDriver", "name phone driverInfo");

      res.json({
        success: true,
        message: `Order status updated to ${status}`,
        data: order,
      });
    } catch (error) {
      console.error("Error updating delivery status:", error);
      res.status(500).json({
        success: false,
        message: "Server error updating delivery status",
        error: error.message,
      });
    }
  }
);

// Get order by ID - UPDATED
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer", "name healthcareFacility phone")
      .populate("assignedDriver", "name phone driverInfo")
      .populate("driver", "name phone driverInfo")
      .populate("items.product", "name unit");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if user has access to this order
    if (
      (req.user.role === "healthcare_provider" ||
        req.user.role === "customer") &&
      order.customer._id.toString() !== req.user._id.toString()
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

// Update order status (Admin, Driver for their orders) - UPDATED
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
      timestamp: new Date(),
    });

    // Handle driver rewards when order is delivered
    if (status === "delivered" && order.assignedDriver) {
      order.actualDelivery = new Date();
      order.deliveredAt = new Date();

      // Update driver stats and reward points
      const driver = await User.findById(order.assignedDriver);
      if (driver) {
        driver.driverInfo.completedDeliveries += 1;
        driver.driverInfo.totalDeliveries += 1;
        driver.driverInfo.points += 10;
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
      order.driver = driverId; // For backward compatibility
      order.status = "assigned";

      // Add to tracking history
      order.trackingHistory.push({
        status: "assigned",
        description: `Driver ${driver.name} assigned to order`,
        updatedBy: req.user._id,
        timestamp: new Date(),
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
      (req.user.role === "healthcare_provider" ||
        req.user.role === "customer") &&
      order.customer.toString() !== req.user._id.toString()
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
    order.cancelledAt = new Date();

    // Add to tracking history
    order.trackingHistory.push({
      status: "cancelled",
      description: "Order cancelled by customer",
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
        status: { $in: ["assigned", "accepted", "picked_up", "in_transit"] },
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
        status: { $in: ["assigned", "accepted", "picked_up", "in_transit"] },
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
