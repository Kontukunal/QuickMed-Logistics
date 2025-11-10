import React, { useState, useEffect } from "react";
import { ordersService, usersService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const DriverOrders = () => {
  const [availableOrders, setAvailableOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);

      // Load available orders (pending/confirmed orders without drivers)
      const ordersResponse = await ordersService.getAll({
        status: "pending,confirmed",
        page: 1,
        limit: 50,
      });

      setAvailableOrders(ordersResponse.data || []);

      // Load current assigned order
      if (user.driverInfo?.currentOrder) {
        const currentOrderResponse = await ordersService.getById(
          user.driverInfo.currentOrder
        );
        setCurrentOrder(currentOrderResponse.data);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      setAvailableOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      const response = await ordersService.acceptOrder(orderId);
      if (response.success) {
        await loadOrders(); // Reload orders
        alert("Order accepted successfully!");
      }
    } catch (error) {
      console.error("Error accepting order:", error);
      alert(error.response?.data?.message || "Error accepting order");
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!currentOrder) return;

    try {
      await ordersService.updateStatus(currentOrder._id, { status: newStatus });
      await loadOrders(); // Reload orders
      alert(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Error updating order status");
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Available Orders</h1>
          <p className="text-gray-600">Accept and manage delivery orders</p>
        </div>

        {/* Current Order */}
        {currentOrder && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Current Delivery
            </h2>
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="font-medium text-blue-900">
                  {currentOrder.orderNumber}
                </p>
                <p className="text-sm text-blue-700">
                  {currentOrder.items?.length || 0} items • $
                  {currentOrder.totalAmount || 0}
                </p>
                <p className="text-sm text-blue-700">
                  Delivery to: {currentOrder.deliveryAddress.street},{" "}
                  {currentOrder.deliveryAddress.city}
                </p>
              </div>

              <div className="flex space-x-2">
                {currentOrder.status === "assigned" && (
                  <button
                    onClick={() => handleUpdateStatus("picked_up")}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Mark as Picked Up
                  </button>
                )}
                {currentOrder.status === "picked_up" && (
                  <button
                    onClick={() => handleUpdateStatus("in_transit")}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Start Delivery
                  </button>
                )}
                {currentOrder.status === "in_transit" && (
                  <button
                    onClick={() => handleUpdateStatus("delivered")}
                    className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Mark as Delivered
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Available Orders */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Available Orders{" "}
            {!currentOrder && "(You can accept one order at a time)"}
          </h2>

          {availableOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No available orders at the moment
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableOrders.map((order) => (
                <div
                  key={order._id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {order.orderNumber}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.items?.length || 0} items • $
                        {order.totalAmount || 0}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                      {order.priority}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p>
                      <strong>To:</strong> {order.deliveryAddress.city},{" "}
                      {order.deliveryAddress.state}
                    </p>
                    <p>
                      <strong>Type:</strong> {order.orderType}
                    </p>
                    {order.specialRequirements?.refrigeration && (
                      <p className="text-blue-600">❄️ Refrigeration Required</p>
                    )}
                  </div>

                  {!currentOrder && (
                    <button
                      onClick={() => handleAcceptOrder(order._id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      Accept Delivery
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverOrders;
