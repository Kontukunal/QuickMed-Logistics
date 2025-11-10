import React, { useState, useEffect } from "react";
import { ordersService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const DriverOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const { user } = useAuth();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      // Use the driver-specific endpoint to get all orders
      const response = await ordersService.getDriverOrders();
      console.log("Driver orders:", response.data);
      setOrders(response.data || []);
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      setActionLoading(orderId);
      await ordersService.acceptOrder(orderId);
      await loadOrders(); // Refresh the list
      alert("Order accepted successfully!");
    } catch (error) {
      console.error("Error accepting order:", error);
      alert(
        error.response?.data?.message ||
          "Error accepting order. Please try again."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateDeliveryStatus = async (orderId, newStatus) => {
    try {
      setActionLoading(orderId);
      await ordersService.updateDeliveryStatus(orderId, newStatus);
      await loadOrders(); // Refresh the list
      alert(`Order status updated to ${newStatus.replace("_", " ")}!`);
    } catch (error) {
      console.error("Error updating order status:", error);
      alert(
        error.response?.data?.message ||
          "Error updating order status. Please try again."
      );
    } finally {
      setActionLoading(null);
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
      case "pending":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    return status ? status.replace("_", " ") : "pending";
  };

  const canAcceptOrder = (order) => {
    return (
      (order.status === "pending" || order.status === "assigned") &&
      !order.assignedDriver
    );
  };

  const isMyOrder = (order) => {
    return order.assignedDriver && order.assignedDriver._id === user._id;
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      accepted: ["picked_up"],
      picked_up: ["in_transit"],
      in_transit: ["delivered"],
    };
    return statusFlow[currentStatus] || [];
  };

  const formatAddress = (address) => {
    if (!address) return "N/A";
    const { street, city, state, zipCode } = address;
    return `${street}, ${city}, ${state} ${zipCode}`;
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
                Available Deliveries
              </h1>
              <p className="text-gray-600">
                View and accept delivery orders from all hospitals
              </p>
            </div>
            <button
              onClick={loadOrders}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
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
          </div>
        </div>

        {/* Driver Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Driver Status:{" "}
                <span
                  className={
                    user.driverInfo?.isAvailable
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {user.driverInfo?.isAvailable ? "Available" : "On Delivery"}
                </span>
              </h3>
              <p className="text-gray-600">
                Completed Deliveries:{" "}
                {user.driverInfo?.completedDeliveries || 0}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                Points: {user.driverInfo?.points || 0}
              </p>
              <p className="text-sm text-gray-600">
                Total Deliveries: {user.driverInfo?.totalDeliveries || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 gap-6">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">
                No delivery orders found
              </p>
              <p className="text-gray-400">
                Orders from hospitals will appear here for you to accept.
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order._id}
                className={`bg-white rounded-lg shadow-md overflow-hidden border-l-4 ${
                  isMyOrder(order)
                    ? "border-green-500"
                    : order.assignedDriver
                    ? "border-orange-500"
                    : "border-blue-500"
                }`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order # {order.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-600">
                        From:{" "}
                        {order.customer?.healthcareFacility?.name ||
                          order.customer?.name ||
                          "Hospital"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Delivery: {formatAddress(order.deliveryAddress)}
                      </p>
                      {order.assignedDriver && (
                        <p
                          className={`text-sm ${
                            isMyOrder(order)
                              ? "text-green-600 font-medium"
                              : "text-orange-600"
                          }`}
                        >
                          Driver: {order.assignedDriver.name}{" "}
                          {isMyOrder(order) && "(You)"}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusText(order.status)}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">
                        $
                        {order.totalAmount
                          ? order.totalAmount.toFixed(2)
                          : "0.00"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  {order.items && order.items.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Order Items ({order.items.length})
                      </h4>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between text-sm bg-gray-50 p-2 rounded"
                          >
                            <div>
                              <span className="font-medium text-gray-900">
                                {item.productName || `Item ${index + 1}`}
                              </span>
                              <span className="text-gray-600 ml-2">
                                (Qty: {item.quantity})
                              </span>
                            </div>
                            <span className="text-gray-900">
                              ${item.total ? item.total.toFixed(2) : "0.00"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Special Requirements */}
                  {order.specialRequirements &&
                    Object.keys(order.specialRequirements).some(
                      (key) =>
                        order.specialRequirements[key] &&
                        key !== "handlingInstructions"
                    ) && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Special Requirements
                        </h4>
                        <div className="flex gap-2">
                          {order.specialRequirements.refrigeration && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              ❄️ Refrigeration
                            </span>
                          )}
                          {order.specialRequirements.fragile && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                              🧩 Fragile
                            </span>
                          )}
                        </div>
                        {order.specialRequirements.handlingInstructions && (
                          <p className="text-sm text-gray-600 mt-1">
                            {order.specialRequirements.handlingInstructions}
                          </p>
                        )}
                      </div>
                    )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                    {/* Accept Order Button - Show for pending/assigned orders without driver */}
                    {canAcceptOrder(order) && (
                      <button
                        onClick={() => handleAcceptOrder(order._id)}
                        disabled={
                          actionLoading === order._id ||
                          !user.driverInfo?.isAvailable
                        }
                        className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
                      >
                        {actionLoading === order._id ? (
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
                            Accepting...
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
                            Accept Delivery
                          </>
                        )}
                      </button>
                    )}

                    {/* Status Update Buttons - Show for my orders */}
                    {isMyOrder(order) &&
                      getNextStatus(order.status).map((nextStatus) => (
                        <button
                          key={nextStatus}
                          onClick={() =>
                            handleUpdateDeliveryStatus(order._id, nextStatus)
                          }
                          disabled={actionLoading === order._id}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          {actionLoading === order._id
                            ? "Updating..."
                            : `Mark as ${nextStatus.replace("_", " ")}`}
                        </button>
                      ))}

                    {/* Show assigned to other driver message */}
                    {order.assignedDriver && !isMyOrder(order) && (
                      <span className="inline-flex items-center px-3 py-2 text-sm font-medium text-orange-800 bg-orange-100 rounded-md">
                        Assigned to {order.assignedDriver.name}
                      </span>
                    )}

                    {/* Show completed message for delivered orders */}
                    {order.status === "delivered" && isMyOrder(order) && (
                      <span className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-800 bg-green-100 rounded-md">
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
                        Delivery Completed
                      </span>
                    )}
                  </div>

                  {/* Timeline */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Delivery Timeline
                    </h4>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 overflow-x-auto">
                      <span
                        className={`whitespace-nowrap ${
                          [
                            "pending",
                            "assigned",
                            "accepted",
                            "picked_up",
                            "in_transit",
                            "delivered",
                          ].includes(order.status)
                            ? "text-blue-600 font-medium"
                            : ""
                        }`}
                      >
                        📋{" "}
                        {order.status === "assigned" ? "Assigned" : "Pending"}
                      </span>
                      <span>→</span>
                      <span
                        className={`whitespace-nowrap ${
                          [
                            "accepted",
                            "picked_up",
                            "in_transit",
                            "delivered",
                          ].includes(order.status)
                            ? "text-yellow-600 font-medium"
                            : ""
                        }`}
                      >
                        ✅ Accepted
                      </span>
                      <span>→</span>
                      <span
                        className={`whitespace-nowrap ${
                          ["picked_up", "in_transit", "delivered"].includes(
                            order.status
                          )
                            ? "text-purple-600 font-medium"
                            : ""
                        }`}
                      >
                        🚚 Picked Up
                      </span>
                      <span>→</span>
                      <span
                        className={`whitespace-nowrap ${
                          ["in_transit", "delivered"].includes(order.status)
                            ? "text-blue-600 font-medium"
                            : ""
                        }`}
                      >
                        🚛 In Transit
                      </span>
                      <span>→</span>
                      <span
                        className={`whitespace-nowrap ${
                          order.status === "delivered"
                            ? "text-green-600 font-medium"
                            : ""
                        }`}
                      >
                        🎉 Delivered
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverOrders;
