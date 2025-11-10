import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ordersService, usersService } from "../services/api";

const OrderAssignment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [orderRes, driversRes] = await Promise.all([
        ordersService.getById(id),
        usersService.getAvailableDrivers(),
      ]);
      setOrder(orderRes.data);
      setAvailableDrivers(driversRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedDriver) return;

    try {
      setAssigning(true);
      await ordersService.assignDriver(id, selectedDriver);
      navigate(`/orders/${id}`);
    } catch (error) {
      console.error("Error assigning driver:", error);
      alert("Error assigning driver. Please try again.");
    } finally {
      setAssigning(false);
    }
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
          <button
            onClick={() => navigate("/orders")}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Assign Driver</h1>
          <p className="text-gray-600 mt-2">
            Assign a driver to order {order.orderNumber}
          </p>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Order Summary
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Customer</p>
              <p className="font-medium">
                {order.customer?.healthcareFacility?.name ||
                  order.customer?.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="font-medium">${order.totalAmount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Delivery Address</p>
              <p className="font-medium">
                {order.deliveryAddress.city}, {order.deliveryAddress.state}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Priority</p>
              <p className="font-medium capitalize">{order.priority}</p>
            </div>
          </div>
        </div>

        {/* Driver Selection */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Select Driver
          </h2>

          {availableDrivers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                No available drivers at the moment
              </p>
              <p className="text-sm text-gray-400">
                All drivers are currently occupied with deliveries.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {availableDrivers.map((driver) => (
                  <div
                    key={driver._id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedDriver === driver._id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                    onClick={() => setSelectedDriver(driver._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {driver.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {driver.driverInfo?.vehicleType} • {driver.phone}
                        </p>
                        <p className="text-xs text-gray-500">
                          Completed Deliveries:{" "}
                          {driver.driverInfo?.completedDeliveries || 0}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          Rating: {driver.driverInfo?.rating || "N/A"}
                        </p>
                        <p className="text-xs text-green-600">Available</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => navigate(`/orders/${id}`)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignDriver}
                  disabled={!selectedDriver || assigning}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  {assigning ? "Assigning..." : "Assign Driver"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderAssignment;
