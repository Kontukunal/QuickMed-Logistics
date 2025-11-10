import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { deliveriesAPI, ordersAPI, usersAPI } from "../services/api";

const DeliveryManagement = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    orderId: "",
    driverId: "",
    vehicleId: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [deliveriesResponse, ordersResponse, driversResponse] = await Promise.all([
        deliveriesAPI.getAll(),
        ordersAPI.getAll({ status: "confirmed,preparing" }),
        usersAPI.getAvailableDrivers()
      ]);

      setDeliveries(deliveriesResponse.data.data || []);
      setAvailableOrders(ordersResponse.data.data || []);
      setAvailableDrivers(driversResponse.data.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDelivery = async (e) => {
    e.preventDefault();
    try {
      await deliveriesAPI.assign({
        orderId: assignmentData.orderId,
        driverId: assignmentData.driverId,
        vehicleId: assignmentData.vehicleId
      });
      
      setShowAssignModal(false);
      setAssignmentData({ orderId: "", driverId: "", vehicleId: "" });
      fetchData();
      alert("Delivery assigned successfully!");
    } catch (error) {
      console.error("Error assigning delivery:", error);
      alert("Failed to assign delivery");
    }
  };

  const handleStatusUpdate = async (deliveryId, status) => {
    try {
      await deliveriesAPI.updateStatus(deliveryId, { status });
      fetchData();
      alert("Delivery status updated!");
    } catch (error) {
      console.error("Error updating delivery status:", error);
      alert("Failed to update delivery status");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: "bg-gray-100 text-gray-800",
      assigned: "bg-blue-100 text-blue-800",
      picked_up: "bg-purple-100 text-purple-800",
      in_transit: "bg-orange-100 text-orange-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
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
            <h1 className="text-3xl font-bold text-gray-900">
              Delivery Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage and track all deliveries in the system
            </p>
          </div>
          <div className="flex space-x-4">
            <Link
              to="/admin/dashboard"
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              Back to Dashboard
            </Link>
            <button
              onClick={() => setShowAssignModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              + Assign Delivery
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="text-sm font-medium text-gray-600">Total Deliveries</div>
            <div className="text-2xl font-bold text-gray-900">{deliveries.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="text-sm font-medium text-gray-600">Active</div>
            <div className="text-2xl font-bold text-gray-900">
              {deliveries.filter(d => ["assigned", "picked_up", "in_transit"].includes(d.status)).length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="text-sm font-medium text-gray-600">Completed</div>
            <div className="text-2xl font-bold text-gray-900">
              {deliveries.filter(d => d.status === "delivered").length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="text-sm font-medium text-gray-600">Available Drivers</div>
            <div className="text-2xl font-bold text-gray-900">{availableDrivers.length}</div>
          </div>
        </div>

        {/* Deliveries Table */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver & Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timeline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deliveries.map((delivery) => (
                  <tr key={delivery._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {delivery.order?.orderNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {delivery.order?.healthcareFacility?.name || delivery.order?.customer?.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {delivery.route?.endLocation?.address}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {delivery.driver?.name || "Not assigned"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {delivery.vehicle?.registrationNumber || "No vehicle"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          delivery.status
                        )}`}
                      >
                        {delivery.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {delivery.timeline && delivery.timeline.length > 0 ? (
                          new Date(delivery.timeline[delivery.timeline.length - 1].timestamp).toLocaleString()
                        ) : (
                          "No updates"
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-2">
                        <Link
                          to={`/orders/${delivery.order?._id}`}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          View Order
                        </Link>
                        {delivery.status !== "delivered" && delivery.status !== "cancelled" && (
                          <select
                            value={delivery.status}
                            onChange={(e) => handleStatusUpdate(delivery._id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="assigned">Assigned</option>
                            <option value="picked_up">Picked Up</option>
                            <option value="in_transit">In Transit</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Assign Delivery Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Assign Delivery</h2>
                <form onSubmit={handleAssignDelivery}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Order *
                      </label>
                      <select
                        value={assignmentData.orderId}
                        onChange={(e) => setAssignmentData(prev => ({ ...prev, orderId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Choose an order...</option>
                        {availableOrders.map((order) => (
                          <option key={order._id} value={order._id}>
                            {order.orderNumber} - {order.healthcareFacility?.name} - ${order.totalAmount}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Driver *
                      </label>
                      <select
                        value={assignmentData.driverId}
                        onChange={(e) => setAssignmentData(prev => ({ ...prev, driverId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Choose a driver...</option>
                        {availableDrivers.map((driver) => (
                          <option key={driver._id} value={driver._id}>
                            {driver.name} - {driver.driverInfo?.vehicleType}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Vehicle (Optional)
                      </label>
                      <select
                        value={assignmentData.vehicleId}
                        onChange={(e) => setAssignmentData(prev => ({ ...prev, vehicleId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">No specific vehicle</option>
                        {/* Vehicle options would be populated from vehicles API */}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowAssignModal(false)}
                      className="px-4 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                    >
                      Assign Delivery
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

export default DeliveryManagement;