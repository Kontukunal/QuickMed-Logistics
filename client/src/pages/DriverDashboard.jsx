import React, { useState, useEffect } from "react";
import { ordersService, usersService } from "../services/api";

const DriverDashboard = () => {
  const [stats, setStats] = useState({});
  const [currentOrder, setCurrentOrder] = useState(null);
  const [location, setLocation] = useState({ lat: 0, lng: 0, address: "" });

  useEffect(() => {
    loadDashboardData();
    getCurrentLocation();
  }, []);

  const loadDashboardData = async () => {
    try {
      const statsRes = await ordersService.getDashboardStats();
      setStats(statsRes.data);

      if (statsRes.data.currentOrder) {
        const orderRes = await ordersService.getById(
          statsRes.data.currentOrder._id
        );
        setCurrentOrder(orderRes.data);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: "Current Location",
          };
          setLocation(newLocation);
          updateDriverLocation(newLocation);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  const updateDriverLocation = async (newLocation) => {
    try {
      await usersService.updateDriverLocation(newLocation);
    } catch (error) {
      console.error("Error updating location:", error);
    }
  };

  const updateOrderStatus = async (newStatus) => {
    try {
      await ordersService.updateStatus(currentOrder._id, {
        status: newStatus,
        location: location,
      });
      await loadDashboardData();
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const StatCard = ({ title, value, color, icon }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color} mr-4`}>{icon}</div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Driver Dashboard</h1>
        <p className="text-gray-600">
          Manage your deliveries and track your progress
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Deliveries"
          value={stats.totalDeliveries || 0}
          color="bg-blue-100 text-blue-600"
          icon="📦"
        />
        <StatCard
          title="Completed"
          value={stats.completedDeliveries || 0}
          color="bg-green-100 text-green-600"
          icon="✅"
        />
        <StatCard
          title="Success Rate"
          value={`${
            stats.completedDeliveries && stats.totalDeliveries
              ? Math.round(
                  (stats.completedDeliveries / stats.totalDeliveries) * 100
                )
              : 0
          }%`}
          color="bg-purple-100 text-purple-600"
          icon="📊"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Order */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Current Delivery
          </h2>
          {!currentOrder ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No active delivery assigned</p>
              <p className="text-sm text-gray-400">
                You'll see order details here when assigned
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="font-medium text-blue-900">
                  {currentOrder.orderNumber}
                </p>
                <p className="text-sm text-blue-700">
                  {currentOrder.items.length} items • $
                  {currentOrder.totalAmount}
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-medium text-gray-900">Delivery Address:</p>
                <p className="text-gray-600">
                  {currentOrder.deliveryAddress.street},{" "}
                  {currentOrder.deliveryAddress.city}
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-medium text-gray-900">
                  Special Requirements:
                </p>
                {currentOrder.specialRequirements?.refrigeration && (
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">
                    ❄️ Refrigeration
                  </span>
                )}
                {currentOrder.specialRequirements?.fragile && (
                  <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                    🚨 Fragile
                  </span>
                )}
              </div>

              <div className="flex space-x-2">
                {currentOrder.status === "assigned" && (
                  <button
                    onClick={() => updateOrderStatus("picked_up")}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Mark as Picked Up
                  </button>
                )}
                {currentOrder.status === "picked_up" && (
                  <button
                    onClick={() => updateOrderStatus("in_transit")}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Start Delivery
                  </button>
                )}
                {currentOrder.status === "in_transit" && (
                  <button
                    onClick={() => updateOrderStatus("delivered")}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Mark as Delivered
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Location & Actions */}
        <div className="space-y-6">
          {/* Location Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Current Location
            </h2>
            <div className="space-y-2">
              <p className="text-gray-600">
                <strong>Latitude:</strong> {location.lat.toFixed(6)}
              </p>
              <p className="text-gray-600">
                <strong>Longitude:</strong> {location.lng.toFixed(6)}
              </p>
              <p className="text-gray-600">
                <strong>Address:</strong> {location.address}
              </p>
            </div>
            <button
              onClick={getCurrentLocation}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              🔄 Update Location
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <button
                onClick={() =>
                  updateDriverLocation({ ...location, isAvailable: true })
                }
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                ✅ Go Online
              </button>
              <button
                onClick={() =>
                  updateDriverLocation({ ...location, isAvailable: false })
                }
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                ❌ Go Offline
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
