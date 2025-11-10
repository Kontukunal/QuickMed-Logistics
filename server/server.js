const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/inventory", require("./routes/inventory"));

// MongoDB Connection
mongoose
  .connect(
    process.env.MONGODB_URI ||
      "mongodb+srv://kunalmali20251_db_user:zyxlYDR4wN4GFP3P@cluster0.btqjxgg.mongodb.net/quickmed?appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() =>
    console.log(`MongoDB connected successfully ${process.env.MONGODB_URI}`)
  )
  .catch((err) => console.log("MongoDB connection error:", err));

// Basic route
app.get("/api", (req, res) => {
  res.json({
    message: "QuickMed Logistics API is running!",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      orders: "/api/orders",
      inventory: "/api/inventory",
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "production" ? {} : err.message,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
