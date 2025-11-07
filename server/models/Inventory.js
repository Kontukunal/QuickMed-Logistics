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
      temperature: {
        min: Number,
        max: Number,
      },
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
  {
    timestamps: true,
  }
);

// Fixed SKU generation - use async properly
inventorySchema.pre("save", async function (next) {
  if (this.isNew && !this.sku) {
    try {
      // Use countDocuments instead of deprecated count
      const count = await mongoose.model("Inventory").countDocuments();
      this.sku = `SKU${Date.now().toString().slice(-6)}${count
        .toString()
        .padStart(4, "0")}`;
    } catch (error) {
      // Fallback SKU generation if count fails
      this.sku = `SKU${Date.now().toString().slice(-8)}${Math.random()
        .toString(36)
        .substr(2, 4)
        .toUpperCase()}`;
    }
  }
  next();
});

// Alternative simpler SKU generation (uncomment if above still has issues)
// inventorySchema.pre("save", function (next) {
//   if (this.isNew && !this.sku) {
//     this.sku = `SKU${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
//   }
//   next();
// });

// Check for low stock
inventorySchema.methods.isLowStock = function () {
  return this.quantity <= this.reorderLevel;
};

module.exports = mongoose.model("Inventory", inventorySchema);
