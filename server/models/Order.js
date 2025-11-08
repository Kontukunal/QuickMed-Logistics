const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: false,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    healthcareFacility: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

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

    totalAmount: { type: Number, required: true },

    deliveryAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      coordinates: { lat: Number, lng: Number },
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
    assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    estimatedDelivery: Date,
    actualDelivery: Date,

    specialRequirements: {
      refrigeration: { type: Boolean, default: false },
      temperature: { min: Number, max: Number },
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
        location: { lat: Number, lng: Number },
        timestamp: { type: Date, default: Date.now },
        description: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],

    notes: String,
  },
  { timestamps: true }
);

// Generate unique order number - SIMPLIFIED VERSION
orderSchema.pre("save", function (next) {
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `ORD${timestamp}${random}`;
    console.log("Generated order number:", this.orderNumber);
  }
  next();
});

// Calculate totals before save
orderSchema.pre("save", function (next) {
  if (this.isModified("items") && this.items.length > 0) {
    this.totalAmount = this.items.reduce((total, item) => {
      item.total = item.price * item.quantity;
      return total + item.total;
    }, 0);
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
