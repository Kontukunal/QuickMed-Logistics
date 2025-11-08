const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ["admin", "customer", "driver", "healthcare_provider"],
      default: "customer",
    },
    phone: {
      type: String,
      required: true,
      match: [/^\+?[\d\s\-\(\)]{10,}$/, "Please enter a valid phone number"],
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      coordinates: { lat: Number, lng: Number },
    },
    isActive: { type: Boolean, default: true },
    lastLogin: Date,

    // Healthcare provider specific fields
    healthcareFacility: {
      name: String,
      licenseNumber: String,
      facilityType: {
        type: String,
        enum: ["hospital", "clinic", "pharmacy", "laboratory", "other"],
      },
    },

    // Driver specific fields
    driverInfo: {
      licenseNumber: String,
      vehicleType: {
        type: String,
        enum: ["motorcycle", "car", "van", "truck", "refrigerated_van"],
      },
      vehicleCapacity: { weight: Number, volume: Number },
      currentLocation: { lat: Number, lng: Number },
      isAvailable: { type: Boolean, default: true },
      rating: { type: Number, default: 0, min: 0, max: 5 },
      totalDeliveries: { type: Number, default: 0 },
      completedDeliveries: { type: Number, default: 0 },
      earnings: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update last login
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save();
};

// Get driver performance stats
userSchema.methods.getDriverStats = function () {
  if (this.role !== "driver") return null;

  const completionRate =
    this.totalDeliveries > 0
      ? (this.completedDeliveries / this.totalDeliveries) * 100
      : 0;

  return {
    totalDeliveries: this.driverInfo.totalDeliveries,
    completedDeliveries: this.driverInfo.completedDeliveries,
    completionRate: Math.round(completionRate * 100) / 100,
    rating: this.driverInfo.rating,
    earnings: this.driverInfo.earnings,
  };
};

// Static method to find available drivers
userSchema.statics.findAvailableDrivers = function (vehicleType = null) {
  const query = {
    role: "driver",
    "driverInfo.isAvailable": true,
    isActive: true,
  };

  if (vehicleType) {
    query["driverInfo.vehicleType"] = vehicleType;
  }

  return this.find(query).select("name driverInfo email phone");
};

module.exports = mongoose.model("User", userSchema);
