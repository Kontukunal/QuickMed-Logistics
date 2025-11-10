const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: false, // Make it not required, we'll generate it automatically
    },

    // Order placed by healthcare facility or customer
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // In your Order model
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Inventory",
          required: true,
        },
        productName: String,
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
        total: Number,
      },
    ],

    totalAmount: {
      type: Number,
      required: false, // Make it not required, we'll calculate it
      default: 0,
    },

    deliveryAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
    },

    orderType: {
      type: String,
      enum: ["standard", "emergency", "recurring", "bulk"],
      default: "standard",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "assigned",
        "accepted",
        "picked_up",
        "in_transit",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },

    scheduledDelivery: Date,
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    estimatedDelivery: Date,
    actualDelivery: Date,

    // ... other fields ...
    acceptedAt: Date,
    pickedUpAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,

    specialRequirements: {
      refrigeration: { type: Boolean, default: false },
      fragile: { type: Boolean, default: false },
      handlingInstructions: String,
    },

    trackingHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        description: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note: String,
      },
    ],

    notes: String,
  },
  { timestamps: true }
);

// Generate unique order number
orderSchema.pre("save", function (next) {
  if (this.isNew) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `QM${timestamp}${random}`;
  }
  next();
});

// Calculate totals before save
orderSchema.pre("save", function (next) {
  if (this.items && this.items.length > 0) {
    // Calculate item totals and overall total
    this.totalAmount = this.items.reduce((total, item) => {
      // Ensure each item has its total calculated
      if (item.price && item.quantity) {
        item.total = item.price * item.quantity;
        return total + item.total;
      }
      return total;
    }, 0);
  } else {
    this.totalAmount = 0;
  }
  next();
});

// Add to tracking history when status changes
orderSchema.pre("save", function (next) {
  if (this.isModified("status") && !this.isNew) {
    this.trackingHistory.push({
      status: this.status,
      description: `Order status updated to ${this.status}`,
      timestamp: new Date(),
    });
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
