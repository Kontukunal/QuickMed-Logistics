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
    },
    storageRequirements: {
      temperature: { min: Number, max: Number },
      specialConditions: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

inventorySchema.pre("save", function (next) {
  if (!this.sku) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.sku = `SKU${timestamp}${random}`;
  }
  next();
});

inventorySchema.methods.isLowStock = function () {
  return this.quantity <= this.reorderLevel;
};

inventorySchema.statics.findLowStock = function () {
  return this.find({
    isActive: true,
    $expr: { $lte: ["$quantity", "$reorderLevel"] },
  });
};

module.exports = mongoose.model("Inventory", inventorySchema);
