import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ordersService, inventoryService, usersService } from "../services/api";

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, lowStockRes, ordersRes, driversRes] = await Promise.all([
        ordersService.getDashboardStats(),
        inventoryService.getLowStock(),
        ordersService.getAll({ page: 1, limit: 5 }),
        usersService.getAvailableDrivers(),
      ]);

      setStats(statsRes.data || {});
      setLowStockItems(lowStockRes.data || []);
      setRecentOrders(ordersRes.data?.orders || ordersRes.data || []);
      setAvailableDrivers(driversRes.data || []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setStats({});
      setLowStockItems([]);
      setRecentOrders([]);
      setAvailableDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, color, icon, link }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color} mr-4`}>{icon}</div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value || 0}</p>
        </div>
      </div>
    </div>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "in_transit":
        return "bg-blue-100 text-blue-800";
      case "picked_up":
        return "bg-purple-100 text-purple-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your logistics operations</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Inventory Management */}
          <Link
            to="/inventory"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                📦
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Manage Inventory
                </p>
                <p className="text-lg font-bold text-gray-900">
                  View & Edit Items
                </p>
              </div>
            </div>
          </Link>

          {/* Orders */}
          <Link
            to="/orders"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-green-500"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                🚚
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">View Orders</p>
                <p className="text-lg font-bold text-gray-900">Manage Orders</p>
              </div>
            </div>
          </Link>

          {/* Driver Management */}
          <Link
            to="/driver-management"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-purple-500"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                👥
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Driver Management
                </p>
                <p className="text-lg font-bold text-gray-900">
                  Manage Drivers
                </p>
              </div>
            </div>
          </Link>

          {/* User Management */}
          <Link
            to="/user-management"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-orange-500"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
                👨‍💼
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  User Management
                </p>
                <p className="text-lg font-bold text-gray-900">Manage Users</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Orders"
            value={stats.totalOrders || 0}
            color="bg-blue-100 text-blue-600"
            icon="📦"
          />
          <StatCard
            title="Pending Orders"
            value={stats.pendingOrders || 0}
            color="bg-yellow-100 text-yellow-600"
            icon="⏳"
          />
          <StatCard
            title="In Transit"
            value={stats.inTransitOrders || 0}
            color="bg-orange-100 text-orange-600"
            icon="🚚"
          />
          <StatCard
            title="Delivered"
            value={stats.deliveredOrders || 0}
            color="bg-green-100 text-green-600"
            icon="✅"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Low Stock Alerts */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Low Stock Alerts
              </h2>
              <Link
                to="/inventory"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Manage Inventory
              </Link>
            </div>
            {!lowStockItems || lowStockItems.length === 0 ? (
              <p className="text-gray-500 py-4 text-center">
                No low stock items
              </p>
            ) : (
              <div className="space-y-3">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div
                    key={item._id}
                    className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        Stock: {item.quantity} {item.unit} | Reorder:{" "}
                        {item.reorderLevel}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                      Low Stock
                    </span>
                  </div>
                ))}
                {lowStockItems.length > 5 && (
                  <div className="text-center pt-2">
                    <span className="text-sm text-gray-500">
                      +{lowStockItems.length - 5} more items
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Available Drivers */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Available Drivers
              </h2>
              <Link
                to="/driver-management"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            {!availableDrivers || availableDrivers.length === 0 ? (
              <p className="text-gray-500 py-4 text-center">
                No available drivers
              </p>
            ) : (
              <div className="space-y-3">
                {availableDrivers.slice(0, 5).map((driver) => (
                  <div
                    key={driver._id}
                    className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{driver.name}</p>
                      <p className="text-sm text-gray-600">
                        {driver.driverInfo?.vehicleType ||
                          "Vehicle not specified"}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Available
                    </span>
                  </div>
                ))}
                {availableDrivers.length > 5 && (
                  <div className="text-center pt-2">
                    <span className="text-sm text-gray-500">
                      +{availableDrivers.length - 5} more drivers
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
              <Link
                to="/orders"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            {!recentOrders || recentOrders.length === 0 ? (
              <p className="text-gray-500 py-4 text-center">No recent orders</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentOrders.slice(0, 5).map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {order.orderNumber || `ORD-${order._id?.slice(-8)}`}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {order.customer?.healthcareFacility?.name ||
                            order.customer?.name ||
                            "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status?.replace("_", " ") || "pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          $
                          {order.totalAmount
                            ? order.totalAmount.toFixed(2)
                            : "0.00"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString()
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
