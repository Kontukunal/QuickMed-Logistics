import React from "react";
import { useAuth } from "../contexts/AuthContext";
import AdminDashboard from "./AdminDashboard";
import HealthcareDashboard from "./HealthcareDashboard";
import DriverDashboard from "./DriverDashboard";
import CustomerDashboard from "./CustomerDashboard";

const Dashboard = () => {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user.role) {
      case "admin":
        return <AdminDashboard />;
      case "healthcare_provider":
        return <HealthcareDashboard />;
      case "driver":
        return <DriverDashboard />;
      case "customer":
        return <CustomerDashboard />;
      default:
        return <CustomerDashboard />;
    }
  };

  return <div className="min-h-screen bg-gray-50">{renderDashboard()}</div>;
};

export default Dashboard;
