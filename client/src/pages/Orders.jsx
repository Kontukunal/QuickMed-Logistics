// pages/Orders.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ordersAPI, inventoryAPI } from "../services/api";

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    orderType: "",
    priority: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({
    items: [{ product: "", quantity: 1 }],
    deliveryAddress: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
    orderType: "standard",
    priority: "medium",
    specialRequirements: {
      refrigeration: false,
      fragile: false,
      handlingInstructions: "",
    },
    notes: "",
  });

  useEffect(() => {
    fetchOrders();
    fetchInventory();
  }, [filters]);

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      // Remove empty filters
      const params = {
        page,
        limit: 10,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== "")
        ),
      };

      console.log("Fetching orders with params:", params);

      const response = await ordersAPI.getAll(params);

      if (response.data.success) {
        console.log("Orders fetched successfully:", response.data.data.length);
        setOrders(response.data.data || []);
        setPagination(
          response.data.pagination || {
            current: page,
            pages: 1,
            total: (response.data.data || []).length,
          }
        );
      } else {
        console.error("Error fetching orders:", response.data.message);
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await inventoryAPI.getAll();
      if (response.data.success) {
        setInventory(response.data.data || []);
      } else {
        console.error("Error fetching inventory:", response.data.message);
        setInventory([]);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setInventory([]);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();

    if (creatingOrder) return;

    try {
      setCreatingOrder(true);
      console.log("=== CREATING ORDER ===");
      console.log("User:", user);
      console.log("New Order Data:", newOrder);

      // Validate items
      const validItems = newOrder.items.filter(
        (item) => item.product && item.quantity > 0
      );

      console.log("Valid Items:", validItems);

      if (validItems.length === 0) {
        alert("Please add at least one valid item to the order");
        setCreatingOrder(false);
        return;
      }

      // Validate delivery address
      if (
        !newOrder.deliveryAddress.street?.trim() ||
        !newOrder.deliveryAddress.city?.trim() ||
        !newOrder.deliveryAddress.state?.trim() ||
        !newOrder.deliveryAddress.zipCode?.trim()
      ) {
        alert("Please complete all required delivery address fields");
        setCreatingOrder(false);
        return;
      }

      const payload = {
        items: validItems.map((item) => ({
          product: item.product,
          quantity: parseInt(item.quantity),
        })),
        deliveryAddress: {
          street: newOrder.deliveryAddress.street.trim(),
          city: newOrder.deliveryAddress.city.trim(),
          state: newOrder.deliveryAddress.state.trim(),
          zipCode: newOrder.deliveryAddress.zipCode.trim(),
        },
        orderType: newOrder.orderType,
        priority: newOrder.priority,
        specialRequirements: {
          refrigeration: newOrder.specialRequirements.refrigeration,
          fragile: newOrder.specialRequirements.fragile,
          handlingInstructions:
            newOrder.specialRequirements.handlingInstructions.trim(),
        },
        notes: newOrder.notes.trim(),
      };

      console.log("Final Payload to API:", JSON.stringify(payload, null, 2));

      const response = await ordersAPI.create(payload);

      if (response.data.success) {
        console.log("Order creation successful:", response.data);
        setShowCreateModal(false);
        fetchOrders();

        // Reset form
        setNewOrder({
          items: [{ product: "", quantity: 1 }],
          deliveryAddress: {
            street: "",
            city: "",
            state: "",
            zipCode: "",
          },
          orderType: "standard",
          priority: "medium",
          specialRequirements: {
            refrigeration: false,
            fragile: false,
            handlingInstructions: "",
          },
          notes: "",
        });

        alert("Order created successfully!");
      } else {
        throw new Error(response.data.message || "Failed to create order");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      console.error("Error details:", error.response?.data);

      let errorMessage = "Failed to create order";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Show detailed validation errors if available
      if (error.response?.data?.details) {
        const validationErrors = error.response.data.details
          .map((detail) => `${detail.field}: ${detail.message}`)
          .join("\n");
        errorMessage = `Validation errors:\n${validationErrors}`;
      }

      alert(errorMessage);
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      try {
        const response = await ordersAPI.cancel(orderId);
        if (response.data.success) {
          alert("Order cancelled successfully");
          fetchOrders();
        } else {
          throw new Error(response.data.message || "Failed to cancel order");
        }
      } catch (error) {
        console.error("Error cancelling order:", error);
        alert(
          `Failed to cancel order: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      const response = await ordersAPI.updateStatus(orderId, { status });
      if (response.data.success) {
        alert("Order status updated successfully");
        fetchOrders();
      } else {
        throw new Error(response.data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert(
        `Failed to update status: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const addItem = () => {
    setNewOrder((prev) => ({
      ...prev,
      items: [...prev.items, { product: "", quantity: 1 }],
    }));
  };

  const removeItem = (index) => {
    if (newOrder.items.length > 1) {
      setNewOrder((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const updateItem = (index, field, value) => {
    setNewOrder((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      preparing: "bg-purple-100 text-purple-800",
      dispatched: "bg-indigo-100 text-indigo-800",
      in_transit: "bg-orange-100 text-orange-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    };
    return colors[priority] || "bg-gray-100 text-gray-800";
  };

  const availableProducts = inventory.filter((product) => product.quantity > 0);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      orderType: "",
      priority: "",
      search: "",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600 mt-2">
              Manage and track your medical supply orders
            </p>
          </div>
          {(user.role === "customer" ||
            user.role === "healthcare_provider") && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300"
              disabled={creatingOrder}
            >
              {creatingOrder ? "Creating..." : "+ New Order"}
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="dispatched">Dispatched</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Type
              </label>
              <select
                value={filters.orderType}
                onChange={(e) =>
                  handleFilterChange("orderType", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="standard">Standard</option>
                <option value="emergency">Emergency</option>
                <option value="recurring">Recurring</option>
                <option value="bulk">Bulk</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Order number, city..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Orders Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="text-sm font-medium text-gray-600">
              Total Orders
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {pagination.total}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="text-sm font-medium text-gray-600">Delivered</div>
            <div className="text-2xl font-bold text-gray-900">
              {orders.filter((order) => order.status === "delivered").length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-yellow-500">
            <div className="text-sm font-medium text-gray-600">In Progress</div>
            <div className="text-2xl font-bold text-gray-900">
              {
                orders.filter((order) =>
                  [
                    "pending",
                    "confirmed",
                    "preparing",
                    "dispatched",
                    "in_transit",
                  ].includes(order.status)
                ).length
              }
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-500">
            <div className="text-sm font-medium text-gray-600">Cancelled</div>
            <div className="text-2xl font-bold text-gray-900">
              {orders.filter((order) => order.status === "cancelled").length}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type/Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <svg
                          className="w-16 h-16 text-gray-400 mb-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        <p className="text-lg font-medium text-gray-900 mb-2">
                          No orders found
                        </p>
                        <p className="text-gray-600 mb-4">
                          Try adjusting your filters or create a new order
                        </p>
                        {(user.role === "customer" ||
                          user.role === "healthcare_provider") && (
                          <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                          >
                            Create Your First Order
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order._id}
                      className="hover:bg-gray-50 transition duration-150"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.items?.length || 0} items
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString()} at{" "}
                          {new Date(order.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {order.deliveryAddress?.street || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.deliveryAddress?.city || "N/A"},{" "}
                          {order.deliveryAddress?.state || "N/A"}{" "}
                          {order.deliveryAddress?.zipCode || ""}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 capitalize mb-2">
                          {order.orderType}
                        </div>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                            order.priority
                          )}`}
                        >
                          {order.priority?.toUpperCase() || "MEDIUM"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-2">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status?.replace("_", " ").toUpperCase() ||
                              "PENDING"}
                          </span>
                          {order.assignedDriver && (
                            <div className="text-xs text-gray-500">
                              Driver: {order.assignedDriver?.name || "N/A"}
                            </div>
                          )}
                          {order.estimatedDelivery && (
                            <div className="text-xs text-gray-500">
                              Est:{" "}
                              {new Date(
                                order.estimatedDelivery
                              ).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">
                          ${order.totalAmount?.toFixed(2) || "0.00"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-2">
                          <Link
                            to={`/orders/${order._id}`}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium transition duration-150"
                          >
                            View Details
                          </Link>

                          {(user.role === "customer" ||
                            user.role === "healthcare_provider") &&
                            ["pending", "confirmed"].includes(order.status) && (
                              <button
                                onClick={() => handleCancelOrder(order._id)}
                                className="text-red-600 hover:text-red-900 text-sm font-medium transition duration-150 text-left"
                              >
                                Cancel Order
                              </button>
                            )}

                          {(user.role === "admin" ||
                            user.role === "driver" ||
                            user.role === "dispatcher") &&
                            order.status !== "delivered" &&
                            order.status !== "cancelled" && (
                              <select
                                value={order.status}
                                onChange={(e) =>
                                  handleUpdateStatus(order._id, e.target.value)
                                }
                                className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="preparing">Preparing</option>
                                <option value="dispatched">Dispatched</option>
                                <option value="in_transit">In Transit</option>
                                <option value="delivered">Delivered</option>
                              </select>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                <div className="text-sm text-gray-700">
                  Showing {(pagination.current - 1) * 10 + 1} to{" "}
                  {Math.min(pagination.current * 10, pagination.total)} of{" "}
                  {pagination.total} orders
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => fetchOrders(pagination.current - 1)}
                    disabled={pagination.current === 1}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition duration-150"
                  >
                    Previous
                  </button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === pagination.pages ||
                          Math.abs(page - pagination.current) <= 1
                      )
                      .map((page, index, array) => (
                        <React.Fragment key={page}>
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2 text-gray-500">...</span>
                          )}
                          <button
                            onClick={() => fetchOrders(page)}
                            className={`px-3 py-1 text-sm rounded ${
                              pagination.current === page
                                ? "bg-blue-600 text-white"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      ))}
                  </div>
                  <button
                    onClick={() => fetchOrders(pagination.current + 1)}
                    disabled={pagination.current === pagination.pages}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition duration-150"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create Order Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Create New Order
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition duration-150"
                    disabled={creatingOrder}
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleCreateOrder}>
                  {/* Order Items */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">
                      Order Items *
                    </h3>
                    <div className="space-y-4">
                      {newOrder.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex gap-4 items-end bg-gray-50 p-4 rounded-lg"
                        >
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Product *
                            </label>
                            <select
                              value={item.product}
                              onChange={(e) =>
                                updateItem(index, "product", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              required
                            >
                              <option value="">Select Product</option>
                              {availableProducts.map((product) => (
                                <option key={product._id} value={product._id}>
                                  {product.name} - ${product.price} (Stock:{" "}
                                  {product.quantity} {product.unit})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="w-32">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Quantity *
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "quantity",
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>
                          {newOrder.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-sm transition duration-200 flex items-center"
                            >
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addItem}
                      className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm transition duration-200 flex items-center"
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
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Add Another Item
                    </button>
                  </div>

                  {/* Delivery Address */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">
                      Delivery Address *
                    </h3>
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          placeholder="Enter street address"
                          value={newOrder.deliveryAddress.street}
                          onChange={(e) =>
                            setNewOrder((prev) => ({
                              ...prev,
                              deliveryAddress: {
                                ...prev.deliveryAddress,
                                street: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City *
                          </label>
                          <input
                            type="text"
                            placeholder="Enter city"
                            value={newOrder.deliveryAddress.city}
                            onChange={(e) =>
                              setNewOrder((prev) => ({
                                ...prev,
                                deliveryAddress: {
                                  ...prev.deliveryAddress,
                                  city: e.target.value,
                                },
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            State *
                          </label>
                          <input
                            type="text"
                            placeholder="Enter state"
                            value={newOrder.deliveryAddress.state}
                            onChange={(e) =>
                              setNewOrder((prev) => ({
                                ...prev,
                                deliveryAddress: {
                                  ...prev.deliveryAddress,
                                  state: e.target.value,
                                },
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ZIP Code *
                        </label>
                        <input
                          type="text"
                          placeholder="Enter ZIP code"
                          value={newOrder.deliveryAddress.zipCode}
                          onChange={(e) =>
                            setNewOrder((prev) => ({
                              ...prev,
                              deliveryAddress: {
                                ...prev.deliveryAddress,
                                zipCode: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Order Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Order Type
                      </label>
                      <select
                        value={newOrder.orderType}
                        onChange={(e) =>
                          setNewOrder((prev) => ({
                            ...prev,
                            orderType: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="standard">Standard</option>
                        <option value="emergency">Emergency</option>
                        <option value="recurring">Recurring</option>
                        <option value="bulk">Bulk</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        value={newOrder.priority}
                        onChange={(e) =>
                          setNewOrder((prev) => ({
                            ...prev,
                            priority: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  {/* Special Requirements */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">
                      Special Requirements
                    </h3>
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newOrder.specialRequirements.refrigeration}
                          onChange={(e) =>
                            setNewOrder((prev) => ({
                              ...prev,
                              specialRequirements: {
                                ...prev.specialRequirements,
                                refrigeration: e.target.checked,
                              },
                            }))
                          }
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="text-sm font-medium text-gray-700">
                          Requires Refrigeration
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newOrder.specialRequirements.fragile}
                          onChange={(e) =>
                            setNewOrder((prev) => ({
                              ...prev,
                              specialRequirements: {
                                ...prev.specialRequirements,
                                fragile: e.target.checked,
                              },
                            }))
                          }
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="text-sm font-medium text-gray-700">
                          Fragile Items
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Handling Instructions
                        </label>
                        <textarea
                          value={
                            newOrder.specialRequirements.handlingInstructions
                          }
                          onChange={(e) =>
                            setNewOrder((prev) => ({
                              ...prev,
                              specialRequirements: {
                                ...prev.specialRequirements,
                                handlingInstructions: e.target.value,
                              },
                            }))
                          }
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Any special handling instructions..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Notes
                    </label>
                    <textarea
                      value={newOrder.notes}
                      onChange={(e) =>
                        setNewOrder((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Any additional notes or instructions..."
                    />
                  </div>

                  {/* Modal Actions */}
                  <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-6 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md font-medium transition duration-200 hover:bg-gray-50"
                      disabled={creatingOrder}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      disabled={creatingOrder}
                    >
                      {creatingOrder ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Creating Order...
                        </>
                      ) : (
                        <>
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
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Create Order
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
