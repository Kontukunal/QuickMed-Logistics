import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ordersService } from "../services/api";

const CustomerDashboard = () => {
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        ordersService.getDashboardStats(),
        ordersService.getAll({ page: 1, limit: 5 }),
      ]);

      setStats(statsRes.data || {});
      setRecentOrders(ordersRes.data || []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setStats({});
      setRecentOrders([]);
    }
  };

  const StatCard = ({ title, value, color, icon, link }) => (
    <Link to={link} className="block">
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center">
          <div className={`p-3 rounded-full ${color} mr-4`}>{icon}</div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value || 0}</p>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Customer Dashboard</h1>
        <p className="text-gray-600">Track your medical supply orders</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Orders"
          value={stats.totalOrders || 0}
          color="bg-blue-100 text-blue-600"
          icon="📦"
          link="/orders"
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders || 0}
          color="bg-yellow-100 text-yellow-600"
          icon="⏳"
          link="/orders?status=pending"
        />
        <StatCard
          title="In Transit"
          value={stats.inTransitOrders || 0}
          color="bg-orange-100 text-orange-600"
          icon="🚚"
          link="/orders?status=in_transit"
        />
        <StatCard
          title="Delivered"
          value={stats.deliveredOrders || 0}
          color="bg-green-100 text-green-600"
          icon="✅"
          link="/orders?status=delivered"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              to="/orders/new"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center transition-colors"
            >
              📦 Place New Order
            </Link>
            <Link
              to="/orders"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center justify-center transition-colors"
            >
              🔍 Track Orders
            </Link>
          </div>
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
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No orders yet</p>
              <Link
                to="/orders/new"
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Place Your First Order
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order._id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {order.orderNumber}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.items?.length || 0} items • $
                        {order.totalAmount || 0}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        order.status === "delivered"
                          ? "bg-green-100 text-green-800"
                          : order.status === "in_transit"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {order.status?.replace("_", " ") || "pending"}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                    <Link
                      to={`/orders/${order._id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
