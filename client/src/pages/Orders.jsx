import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ordersService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const status = searchParams.get("status") || "all";
  const page = searchParams.get("page") || 1;

  useEffect(() => {
    loadOrders();
  }, [status, page]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      console.log("Loading orders with params:", {
        status,
        page,
        userRole: user.role,
      });

      const params = { page, limit: 10 };
      if (status !== "all") {
        params.status = status;
      }

      const response = await ordersService.getAll(params);
      console.log("Orders API response:", response);

      // Fix: Make sure we're accessing the correct response structure
      setOrders(response.data || []);
      setPagination(response.pagination || {});
    } catch (error) {
      console.error("Error loading orders:", error);
      console.error("Error details:", error.response?.data);
      setOrders([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  };

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
      case "accepted":
        return "bg-yellow-100 text-yellow-800";
      case "assigned":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    if (!status) return "Pending";
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleStatusFilter = (newStatus) => {
    const newParams = new URLSearchParams(searchParams);
    if (newStatus === "all") {
      newParams.delete("status");
    } else {
      newParams.set("status", newStatus);
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const refreshOrders = () => {
    loadOrders();
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user.role === "admin" || user.role === "driver"
                  ? "All Orders"
                  : "My Orders"}
              </h1>
              <p className="text-gray-600">
                {user.role === "admin" || user.role === "driver"
                  ? "View and manage all orders"
                  : "Manage and track your orders"}
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={refreshOrders}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
              {/* Only show for healthcare providers and customers, not admin/driver */}
              {(user.role === "healthcare_provider" ||
                user.role === "customer") && (
                <Link
                  to="/orders/new"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  + New Order
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              "all",
              "pending",
              "confirmed",
              "assigned",
              "accepted",
              "picked_up",
              "in_transit",
              "delivered",
              "cancelled",
            ].map((filterStatus) => (
              <button
                key={filterStatus}
                onClick={() => handleStatusFilter(filterStatus)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  status === filterStatus
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {filterStatus === "all"
                  ? "All Orders"
                  : getStatusText(filterStatus)}
              </button>
            ))}
          </div>
        </div>

        

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">No orders found</p>
              <p className="text-gray-400 mb-4">
                {status !== "all"
                  ? `No orders with status "${getStatusText(status)}"`
                  : "No orders available for your account"}
              </p>
              {(user.role === "healthcare_provider" ||
                user.role === "customer") && (
                <Link
                  to="/orders/new"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Place Your First Order
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order #
                      </th>
                      {(user.role === "admin" || user.role === "driver") && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      {(user.role === "admin" || user.role === "driver") && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Driver
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {order.orderNumber || `ORD-${order._id?.slice(-8)}`}
                          </div>
                        </td>
                        {(user.role === "admin" || user.role === "driver") && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {order.customer?.healthcareFacility?.name ||
                                order.customer?.name ||
                                "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {order.customer?.email}
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {order.items?.length || 0} items
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            $
                            {order.totalAmount
                              ? order.totalAmount.toFixed(2)
                              : "0.00"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        {(user.role === "admin" || user.role === "driver") && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {order.assignedDriver?.name ||
                                order.driver?.name ||
                                "Not assigned"}
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            to={`/orders/${order._id}`}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            View
                          </Link>
                          {user.role === "admin" &&
                            (order.status === "confirmed" ||
                              order.status === "pending") && (
                              <Link
                                to={`/order-assignment/${order._id}`}
                                className="text-green-600 hover:text-green-900"
                              >
                                Assign
                              </Link>
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="bg-white px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing page {pagination.current} of {pagination.pages} (
                      {pagination.total} total orders)
                    </div>
                    <div className="flex space-x-2">
                      {pagination.hasPrev && (
                        <button
                          onClick={() => {
                            const newParams = new URLSearchParams(searchParams);
                            newParams.set(
                              "page",
                              (pagination.current - 1).toString()
                            );
                            setSearchParams(newParams);
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Previous
                        </button>
                      )}
                      {pagination.hasNext && (
                        <button
                          onClick={() => {
                            const newParams = new URLSearchParams(searchParams);
                            newParams.set(
                              "page",
                              (pagination.current + 1).toString()
                            );
                            setSearchParams(newParams);
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Next
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;
