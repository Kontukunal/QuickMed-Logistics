const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/Users");
const { auth } = require("../middleware/auth");

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "quickmed_secret", {
    expiresIn: "7d",
  });
};

// Register
router.post("/register", async (req, res) => {
  try {
    console.log("Registration request received:", req.body);

    const {
      name,
      email,
      password,
      phone,
      role,
      healthcareFacility,
      driverInfo,
      customerInfo,
    } = req.body;

    // Basic validation
    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({
        success: false,
        message:
          "All required fields must be provided: name, email, password, phone, role",
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Validate role
    const validRoles = ["admin", "healthcare_provider", "driver", "customer"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role provided",
      });
    }

    // Clean up data based on role
    const userData = {
      name,
      email,
      password,
      phone,
      role,
    };

    // Only include healthcareFacility if role is healthcare_provider
    if (role === "healthcare_provider" && healthcareFacility) {
      userData.healthcareFacility = healthcareFacility;
    }

    // Only include driverInfo if role is driver
    if (role === "driver" && driverInfo) {
      userData.driverInfo = driverInfo;
    }

    // Only include customerInfo if role is customer
    if (role === "customer" && customerInfo) {
      userData.customerInfo = customerInfo;
    }

    console.log("Creating user with data:", userData);

    user = new User(userData);
    await user.save();

    const token = generateToken(user._id);
    await user.updateLastLogin();

    // Return user data without password
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      healthcareFacility: user.healthcareFacility,
      driverInfo: user.driverInfo,
      customerInfo: user.customerInfo,
    };

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        token,
        user: userResponse,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors,
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user._id);
    await user.updateLastLogin();

    // Return user data without password
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      healthcareFacility: user.healthcareFacility,
      driverInfo: user.driverInfo,
      customerInfo: user.customerInfo,
    };

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: userResponse,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching user data",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

module.exports = router;
