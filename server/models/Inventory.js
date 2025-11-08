const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    category: {
      type: String,
      enum: ["medicine", "equipment", "supplies", "vaccine"],
      required: true,
    },
    sku: {
      type: String,
      unique: true,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    reorderLevel: {
      type: Number,
      default: 10,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
    },
    supplier: {
      name: String,
      contact: String,
      email: String,
    },
    storageRequirements: {
      temperature: { min: Number, max: Number },
      humidity: Number,
      specialConditions: String,
    },
    expirationDate: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
    location: {
      warehouse: String,
      shelf: String,
      bin: String,
    },
  },
  { timestamps: true }
);

// Simplified SKU generation
inventorySchema.pre("save", function (next) {
  if (this.isNew && !this.sku) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.sku = `SKU${timestamp}${random}`;
  }
  next();
});

// Check for low stock
inventorySchema.methods.isLowStock = function () {
  return this.quantity <= this.reorderLevel;
};

// Static method for low stock items
inventorySchema.statics.findLowStock = function () {
  return this.find({
    isActive: true,
    $expr: { $lte: ["$quantity", "$reorderLevel"] },
  });
};

module.exports = mongoose.model("Inventory", inventorySchema);
