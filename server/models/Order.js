const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    healthcareFacility: {
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
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    deliveryAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
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
        "dispatched",
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
    },
    estimatedDelivery: Date,
    actualDelivery: Date,
    specialRequirements: {
      refrigeration: Boolean,
      temperature: {
        min: Number,
        max: Number,
      },
      fragile: Boolean,
      handlingInstructions: String,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "refunded"],
      default: "pending",
    },
    trackingHistory: [
      {
        status: String,
        location: {
          lat: Number,
          lng: Number,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        description: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Generate order number before saving
orderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const count = await mongoose.model("Order").countDocuments();
    this.orderNumber = `QM${Date.now()}${count.toString().padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
