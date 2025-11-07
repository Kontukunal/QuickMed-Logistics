const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["admin", "customer", "driver", "healthcare_provider"],
      default: "customer",
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    healthcareFacility: {
      name: String,
      licenseNumber: String,
      facilityType: String, // hospital, clinic, pharmacy
    },
    driverInfo: {
      licenseNumber: String,
      vehicleType: String,
      vehicleCapacity: Number,
      currentLocation: {
        lat: Number,
        lng: Number,
      },
      isAvailable: {
        type: Boolean,
        default: true,
      },
      rating: {
        type: Number,
        default: 0,
      },
      totalDeliveries: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
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

module.exports = mongoose.model("User", userSchema);
