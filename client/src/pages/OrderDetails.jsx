import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ordersService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const response = await ordersService.getById(id);
      setOrder(response.data);
    } catch (error) {
      console.error("Error loading order:", error);
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
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusText = (status) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Order Not Found
          </h2>
          <Link to="/orders" className="text-blue-600 hover:text-blue-700">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Order Details
              </h1>
              <p className="text-gray-600 mt-2">{order.orderNumber}</p>
            </div>
            <Link
              to="/orders"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Back to Orders
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Order Status
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <span
                    className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusText(order.status)}
                  </span>
                  <p className="text-sm text-gray-600 mt-2">
                    Created: {new Date(order.createdAt).toLocaleString()}
                  </p>
                  {order.actualDelivery && (
                    <p className="text-sm text-gray-600">
                      Delivered:{" "}
                      {new Date(order.actualDelivery).toLocaleString()}
                    </p>
                  )}
                </div>
                {user.role === "driver" &&
                  order.assignedDriver?._id === user._id &&
                  order.status !== "delivered" && (
                    <div className="space-x-2">
                      {order.status === "assigned" && (
                        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                          Mark as Picked Up
                        </button>
                      )}
                      {order.status === "picked_up" && (
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                          Start Delivery
                        </button>
                      )}
                      {order.status === "in_transit" && (
                        <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                          Mark as Delivered
                        </button>
                      )}
                    </div>
                  )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Order Items
              </h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.productName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity} {item.product?.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">${item.price}</p>
                      <p className="text-sm text-gray-600">
                        Total: ${item.total}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <p className="text-lg font-bold text-gray-900">
                    Total Amount
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    ${order.totalAmount}
                  </p>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Delivery Information
              </h2>
              <div className="space-y-2">
                <p>
                  <strong>Address:</strong> {order.deliveryAddress.street},{" "}
                  {order.deliveryAddress.city}, {order.deliveryAddress.state}{" "}
                  {order.deliveryAddress.zipCode}
                </p>
                <p>
                  <strong>Order Type:</strong> {order.orderType}
                </p>
                <p>
                  <strong>Priority:</strong> {order.priority}
                </p>
                {order.specialRequirements && (
                  <div>
                    <p>
                      <strong>Special Requirements:</strong>
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                      {order.specialRequirements.refrigeration && (
                        <li>Refrigeration Required</li>
                      )}
                      {order.specialRequirements.fragile && (
                        <li>Fragile Handling</li>
                      )}
                      {order.specialRequirements.handlingInstructions && (
                        <li>
                          Instructions:{" "}
                          {order.specialRequirements.handlingInstructions}
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Driver Information */}
            {order.assignedDriver && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Driver Information
                </h2>
                <div className="space-y-3">
                  <p>
                    <strong>Name:</strong> {order.assignedDriver.name}
                  </p>
                  <p>
                    <strong>Phone:</strong> {order.assignedDriver.phone}
                  </p>
                  <p>
                    <strong>Vehicle:</strong>{" "}
                    {order.assignedDriver.driverInfo?.vehicleType}
                  </p>
                  <p>
                    <strong>Status:</strong>
                    <span
                      className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                        order.assignedDriver.driverInfo?.isAvailable
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {order.assignedDriver.driverInfo?.isAvailable
                        ? "Available"
                        : "On Delivery"}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Tracking History */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Tracking History
              </h2>
              <div className="space-y-4">
                {order.trackingHistory
                  .slice()
                  .reverse()
                  .map((tracking, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {tracking.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(tracking.timestamp).toLocaleString()}
                        </p>
                        {tracking.note && (
                          <p className="text-xs text-gray-600 mt-1">
                            Note: {tracking.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Admin Actions */}
            {user.role === "admin" && order.status === "confirmed" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Admin Actions
                </h2>
                <Link
                  to={`/order-assignment/${order._id}`}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-center block transition-colors"
                >
                  Assign Driver
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
