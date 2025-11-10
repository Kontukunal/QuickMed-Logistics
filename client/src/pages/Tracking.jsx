import React, { useState, useEffect } from "react";
import { ordersService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const Tracking = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      let params = {};
      if (user.role === "driver") {
        params.status = "assigned,picked_up,in_transit";
      } else {
        params.status = "assigned,picked_up,in_transit";
      }

      const response = await ordersService.getAll(params);
      setOrders(response.data);

      if (response.data.length > 0 && !selectedOrder) {
        setSelectedOrder(response.data[0]);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "in_transit":
        return "bg-blue-100 text-blue-800";
      case "picked_up":
        return "bg-purple-100 text-purple-800";
      case "assigned":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const simulateLocationUpdate = () => {
    if (selectedOrder && selectedOrder.assignedDriver) {
      // In a real app, this would come from the driver's GPS
      const newLocation = {
        lat:
          selectedOrder.assignedDriver.driverInfo.currentLocation?.lat +
          (Math.random() - 0.5) * 0.01,
        lng:
          selectedOrder.assignedDriver.driverInfo.currentLocation?.lng +
          (Math.random() - 0.5) * 0.01,
        address: "Moving to destination...",
      };

      // Update the selected order's driver location for demo
      setSelectedOrder((prev) => ({
        ...prev,
        assignedDriver: {
          ...prev.assignedDriver,
          driverInfo: {
            ...prev.assignedDriver.driverInfo,
            currentLocation: newLocation,
          },
        },
      }));
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
          <h1 className="text-3xl font-bold text-gray-900">Live Tracking</h1>
          <p className="text-gray-600">Track your deliveries in real-time</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Orders List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Active Deliveries
              </h2>
              {orders.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No active deliveries
                </p>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order._id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedOrder?._id === order._id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">
                            {order.orderNumber}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.items.length} items • ${order.totalAmount}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        To: {order.deliveryAddress.city},{" "}
                        {order.deliveryAddress.state}
                      </p>
                      {order.assignedDriver && (
                        <p className="text-xs text-gray-500 mt-1">
                          Driver: {order.assignedDriver.name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Map and Details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedOrder ? (
              <>
                {/* Map Simulation */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Tracking Order: {selectedOrder.orderNumber}
                  </h2>

                  <div className="bg-gray-100 rounded-lg h-64 relative mb-4">
                    {/* Simplified map simulation */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🗺️</div>
                        <p className="text-gray-600">Live Tracking Map</p>
                        <p className="text-sm text-gray-500 mt-2">
                          {selectedOrder.assignedDriver ? (
                            <>
                              Driver: {selectedOrder.assignedDriver.name}
                              <br />
                              Vehicle:{" "}
                              {
                                selectedOrder.assignedDriver.driverInfo
                                  ?.vehicleType
                              }
                              <br />
                              Status: {getStatusText(selectedOrder.status)}
                            </>
                          ) : (
                            "Waiting for driver assignment"
                          )}
                        </p>
                      </div>

                      {/* Driver marker simulation */}
                      {selectedOrder.assignedDriver?.driverInfo
                        ?.currentLocation && (
                        <div
                          className="absolute w-4 h-4 bg-blue-600 rounded-full animate-pulse"
                          style={{
                            left: "70%",
                            top: "60%",
                            transform: "translate(-50%, -50%)",
                          }}
                        >
                          <div className="absolute -top-8 -left-8 bg-blue-600 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                            Driver
                          </div>
                        </div>
                      )}

                      {/* Destination marker */}
                      <div
                        className="absolute w-4 h-4 bg-red-600 rounded-full"
                        style={{
                          left: "30%",
                          top: "40%",
                          transform: "translate(-50%, -50%)",
                        }}
                      >
                        <div className="absolute -top-8 -left-8 bg-red-600 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                          Destination
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">
                        Last updated: {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                    <button
                      onClick={simulateLocationUpdate}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Simulate Movement
                    </button>
                  </div>
                </div>

                {/* Order Details */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Delivery Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">
                        Delivery Information
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <strong>Address:</strong>{" "}
                          {selectedOrder.deliveryAddress.street},{" "}
                          {selectedOrder.deliveryAddress.city}
                        </p>
                        <p>
                          <strong>Order Type:</strong> {selectedOrder.orderType}
                        </p>
                        <p>
                          <strong>Priority:</strong> {selectedOrder.priority}
                        </p>
                        {selectedOrder.specialRequirements?.refrigeration && (
                          <p className="text-blue-600">
                            ❄️ Refrigeration Required
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">
                        Driver Information
                      </h3>
                      {selectedOrder.assignedDriver ? (
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Name:</strong>{" "}
                            {selectedOrder.assignedDriver.name}
                          </p>
                          <p>
                            <strong>Phone:</strong>{" "}
                            {selectedOrder.assignedDriver.phone}
                          </p>
                          <p>
                            <strong>Vehicle:</strong>{" "}
                            {
                              selectedOrder.assignedDriver.driverInfo
                                ?.vehicleType
                            }
                          </p>
                          <p>
                            <strong>Status:</strong>
                            <span
                              className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                selectedOrder.assignedDriver.driverInfo
                                  ?.isAvailable
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {selectedOrder.assignedDriver.driverInfo
                                ?.isAvailable
                                ? "Available"
                                : "On Delivery"}
                            </span>
                          </p>
                          {selectedOrder.assignedDriver.driverInfo
                            ?.currentLocation && (
                            <p className="text-xs text-gray-500 mt-2">
                              <strong>Location:</strong>
                              <br />
                              Lat:{" "}
                              {selectedOrder.assignedDriver.driverInfo.currentLocation.lat?.toFixed(
                                6
                              )}
                              <br />
                              Lng:{" "}
                              {selectedOrder.assignedDriver.driverInfo.currentLocation.lng?.toFixed(
                                6
                              )}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500">
                          Waiting for driver assignment
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tracking History */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Tracking History
                  </h2>
                  <div className="space-y-4">
                    {selectedOrder.trackingHistory
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
                            {tracking.location && (
                              <p className="text-xs text-gray-600 mt-1">
                                Location: {tracking.location.lat?.toFixed(4)},{" "}
                                {tracking.location.lng?.toFixed(4)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No Order Selected
                </h3>
                <p className="text-gray-600">
                  Select an order from the list to view tracking information
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tracking;
