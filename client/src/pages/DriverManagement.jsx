import React, { useState, useEffect } from "react";
import { usersService, ordersService } from "../services/api";

const DriverManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [driverStats, setDriverStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const [driversResponse, ordersResponse] = await Promise.all([
        usersService.getAllUsers({ role: "driver" }),
        ordersService.getAll({ status: "delivered", limit: 1000 }),
      ]);

      const driversData = driversResponse.data || [];
      const deliveredOrders = ordersResponse.data || [];

      // Calculate driver statistics
      const stats = {};
      deliveredOrders.forEach((order) => {
        if (order.assignedDriver) {
          const driverId = order.assignedDriver._id || order.assignedDriver;
          if (!stats[driverId]) {
            stats[driverId] = {
              totalDeliveries: 0,
              totalRevenue: 0,
              orders: [],
            };
          }
          stats[driverId].totalDeliveries += 1;
          stats[driverId].totalRevenue += order.totalAmount || 0;
          stats[driverId].orders.push(order);
        }
      });

      setDriverStats(stats);
      setDrivers(driversData);
    } catch (error) {
      console.error("Error loading drivers:", error);
      setDrivers([]);
      setDriverStats({});
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (isAvailable) => {
    return isAvailable
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  const getStatusText = (isAvailable) => {
    return isAvailable ? "Available" : "On Delivery";
  };

  const getDriverStats = (driverId) => {
    return (
      driverStats[driverId] || {
        totalDeliveries: 0,
        totalRevenue: 0,
        orders: [],
      }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Driver Management
          </h1>
          <p className="text-gray-600">
            Monitor and manage delivery drivers performance
          </p>
        </div>

        {/* Driver Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                👥
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Drivers
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {drivers.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                ✅
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-900">
                  {drivers.filter((d) => d.driverInfo?.isAvailable).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
                🚚
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">On Delivery</p>
                <p className="text-2xl font-bold text-gray-900">
                  {drivers.filter((d) => !d.driverInfo?.isAvailable).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                📦
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Deliveries
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(driverStats).reduce(
                    (sum, stats) => sum + stats.totalDeliveries,
                    0
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Drivers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drivers.map((driver) => {
            const stats = getDriverStats(driver._id);
            const driverInfo = driver.driverInfo || {};

            return (
              <div
                key={driver._id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-6">
                  {/* Driver Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {driver.name}
                      </h3>
                      <p className="text-sm text-gray-600">{driver.email}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          driverInfo.isAvailable
                        )}`}
                      >
                        {getStatusText(driverInfo.isAvailable)}
                      </span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex justify-between">
                      <span>Phone:</span>
                      <span className="font-medium">{driver.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vehicle:</span>
                      <span className="font-medium capitalize">
                        {driverInfo.vehicleType?.replace("_", " ") || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>License:</span>
                      <span className="font-medium">
                        {driverInfo.licenseNumber || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Performance Stats */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Performance Stats
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Total Deliveries:</span>
                        <p className="font-bold text-lg">
                          {stats.totalDeliveries}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Completed:</span>
                        <p className="font-bold text-lg">
                          {driverInfo.completedDeliveries || 0}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Revenue:</span>
                        <p className="font-bold text-lg">
                          ${stats.totalRevenue.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Rating:</span>
                        <p className="font-bold text-lg">
                          {driverInfo.rating ? `${driverInfo.rating}/5` : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Location Info */}
                  {driverInfo.currentLocation && (
                    <div className="border-t pt-3">
                      <p className="text-xs text-gray-600 mb-1">
                        Current Location:
                      </p>
                      <p className="text-sm font-medium">
                        {driverInfo.currentLocation.address ||
                          "Location updated"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Lat: {driverInfo.currentLocation.lat?.toFixed(4)}, Lng:{" "}
                        {driverInfo.currentLocation.lng?.toFixed(4)}
                      </p>
                    </div>
                  )}

                  {/* Recent Deliveries */}
                  {stats.orders.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-xs text-gray-600 mb-2">
                        Recent Deliveries:
                      </p>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {stats.orders.slice(0, 3).map((order) => (
                          <div
                            key={order._id}
                            className="flex justify-between text-xs"
                          >
                            <span className="truncate">
                              {order.orderNumber}
                            </span>
                            <span>${order.totalAmount || 0}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {drivers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No drivers found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverManagement;
