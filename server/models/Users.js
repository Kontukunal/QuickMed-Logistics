const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "healthcare_provider", "driver", "customer"],
        message:
          "Role must be one of: admin, healthcare_provider, driver, customer",
      },
      required: [true, "Role is required"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^\+?[\d\s\-\(\)]{10,}$/, "Please enter a valid phone number"],
    },

    // Healthcare Provider specific fields
    healthcareFacility: {
      name: String,
      type: {
        type: String,
        enum: ["hospital", "clinic", "pharmacy", "laboratory", "nursing_home"],
      },
      licenseNumber: String,
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
      },
    },

    // Driver specific fields
    driverInfo: {
      licenseNumber: String,
      vehicleType: {
        type: String,
        enum: ["motorcycle", "car", "van", "truck", "refrigerated_van"],
      },
      currentLocation: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 },
        address: String,
      },
      isAvailable: { type: Boolean, default: true },
      rating: { type: Number, default: 0, min: 0, max: 5 },
      totalDeliveries: { type: Number, default: 0 },
      completedDeliveries: { type: Number, default: 0 },
      currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    },

    // Customer specific fields
    customerInfo: {
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
      },
    },

    isActive: { type: Boolean, default: true },
    lastLogin: Date,
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save();
};

userSchema.statics.findAvailableDrivers = function () {
  return this.find({
    role: "driver",
    "driverInfo.isAvailable": true,
    isActive: true,
  }).select("name driverInfo email phone");
};

module.exports = mongoose.model("User", userSchema);
