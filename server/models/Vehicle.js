const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["motorcycle", "car", "van", "truck", "refrigerated_van"],
      required: true,
    },
    capacity: {
      weight: { type: Number, required: true }, // in kg
      volume: { type: Number, required: true }, // in cubic meters
    },
    features: {
      refrigeration: { type: Boolean, default: false },
      temperatureControl: { min: Number, max: Number },
    },
    currentLocation: {
      lat: Number,
      lng: Number,
      address: String,
    },
    maxDistance: { type: Number, default: 100 }, // in km
    status: {
      type: String,
      enum: ["available", "on_route", "maintenance", "offline"],
      default: "available",
    },
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
