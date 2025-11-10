import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Layout/Navbar";
import Footer from "./components/Layout/Footer";

// Pages
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import CreateOrder from "./pages/CreateOrder";
import OrderAssignment from "./pages/OrderAssignment";
import Inventory from "./pages/Inventory";
import UserManagement from "./pages/UserManagement";
import DriverManagement from "./pages/DriverManagement";
import Tracking from "./pages/Tracking";
import DriverOrders from "./pages/DriverOrders";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import "./App.css";

function AppContent() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders/new"
            element={
              <ProtectedRoute
                allowedRoles={["healthcare_provider", "customer"]}
              >
                <CreateOrder />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/order-assignment/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <OrderAssignment />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory"
            element={
              <ProtectedRoute allowedRoles={["admin", "healthcare_provider"]}>
                <Inventory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tracking"
            element={
              <ProtectedRoute>
                <Tracking />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user-management"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <UserManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/driver-management"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <DriverManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver-orders"
            element={
              <ProtectedRoute allowedRoles={["driver"]}>
                <DriverOrders />
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
