// pages/VehicleManagement.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { vehiclesAPI } from "../services/api";

const VehicleManagement = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    registrationNumber: "",
    type: "car",
    capacity: {
      weight: 0,
      volume: 0,
    },
    features: {
      refrigeration: false,
      temperatureControl: { min: 0, max: 25 },
      secureStorage: false,
    },
    maxDistance: 100,
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await vehiclesAPI.getAll();
      if (response.data.success) {
        setVehicles(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    try {
      await vehiclesAPI.create(newVehicle);
      setShowCreateModal(false);
      fetchVehicles();
      setNewVehicle({
        registrationNumber: "",
        type: "car",
        capacity: { weight: 0, volume: 0 },
        features: {
          refrigeration: false,
          temperatureControl: { min: 0, max: 25 },
          secureStorage: false,
        },
        maxDistance: 100,
      });
      alert("Vehicle created successfully!");
    } catch (error) {
      console.error("Error creating vehicle:", error);
      alert("Failed to create vehicle");
    }
  };

  const handleAssignDriver = async (vehicleId, driverId) => {
    try {
      await vehiclesAPI.assign(vehicleId, { driverId });
      fetchVehicles();
      alert("Driver assigned successfully!");
    } catch (error) {
      console.error("Error assigning driver:", error);
      alert("Failed to assign driver");
    }
  };

  const getVehicleTypeColor = (type) => {
    const colors = {
      motorcycle: "bg-gray-100 text-gray-800",
      car: "bg-blue-100 text-blue-800",
      van: "bg-green-100 text-green-800",
      truck: "bg-orange-100 text-orange-800",
      refrigerated_van: "bg-purple-100 text-purple-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status) => {
    const colors = {
      available: "bg-green-100 text-green-800",
      on_route: "bg-blue-100 text-blue-800",
      maintenance: "bg-yellow-100 text-yellow-800",
      offline: "bg-red-100 text-red-800",
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
              Vehicle Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage delivery vehicles and their assignments
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
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              + Add Vehicle
            </button>
          </div>
        </div>

        {/* Vehicles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle._id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-6">
                {/* Vehicle Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {vehicle.registrationNumber}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {vehicle.type.replace("_", " ").toUpperCase()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getVehicleTypeColor(
                        vehicle.type
                      )}`}
                    >
                      {vehicle.type.replace("_", " ").toUpperCase()}
                    </span>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        vehicle.status
                      )}`}
                    >
                      {vehicle.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Vehicle Details */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Specifications
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Capacity:</span>
                      <span className="text-sm font-medium">
                        {vehicle.capacity.weight} kg / {vehicle.capacity.volume}{" "}
                        m³
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Max Distance:
                      </span>
                      <span className="text-sm font-medium">
                        {vehicle.maxDistance} km
                      </span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                {vehicle.features && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Features
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {vehicle.features.refrigeration && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          ❄️ Refrigeration
                        </span>
                      )}
                      {vehicle.features.secureStorage && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          🔒 Secure Storage
                        </span>
                      )}
                      {vehicle.features.temperatureControl && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          🌡️ Temp Control
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Assigned Driver */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Assigned Driver
                  </h4>
                  {vehicle.assignedDriver ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {vehicle.assignedDriver.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {vehicle.assignedDriver.phone}
                        </p>
                      </div>
                      <button
                        onClick={() => handleAssignDriver(vehicle._id, null)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Unassign
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No driver assigned</p>
                  )}
                </div>

                {/* Current Location */}
                {vehicle.currentLocation && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">
                      Current Location
                    </h4>
                    <p className="text-sm text-gray-600">
                      {vehicle.currentLocation.lat?.toFixed(4)},{" "}
                      {vehicle.currentLocation.lng?.toFixed(4)}
                    </p>
                    {vehicle.currentLocation.address && (
                      <p className="text-xs text-gray-500">
                        {vehicle.currentLocation.address}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  <Link
                    to={`/admin/order-assignment?vehicle=${vehicle._id}`}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm font-medium text-center"
                  >
                    Assign to Order
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {vehicles.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No vehicles
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first vehicle.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  + Add Vehicle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Vehicle Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Add New Vehicle</h2>
                <form onSubmit={handleCreateVehicle}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Registration Number *
                      </label>
                      <input
                        type="text"
                        value={newVehicle.registrationNumber}
                        onChange={(e) =>
                          setNewVehicle((prev) => ({
                            ...prev,
                            registrationNumber: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                        placeholder="e.g., ABC123"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vehicle Type *
                      </label>
                      <select
                        value={newVehicle.type}
                        onChange={(e) =>
                          setNewVehicle((prev) => ({
                            ...prev,
                            type: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="motorcycle">Motorcycle</option>
                        <option value="car">Car</option>
                        <option value="van">Van</option>
                        <option value="truck">Truck</option>
                        <option value="refrigerated_van">
                          Refrigerated Van
                        </option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Weight Capacity (kg) *
                        </label>
                        <input
                          type="number"
                          value={newVehicle.capacity.weight}
                          onChange={(e) =>
                            setNewVehicle((prev) => ({
                              ...prev,
                              capacity: {
                                ...prev.capacity,
                                weight: parseInt(e.target.value) || 0,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Volume Capacity (m³) *
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={newVehicle.capacity.volume}
                          onChange={(e) =>
                            setNewVehicle((prev) => ({
                              ...prev,
                              capacity: {
                                ...prev.capacity,
                                volume: parseFloat(e.target.value) || 0,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                          min="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Distance (km) *
                      </label>
                      <input
                        type="number"
                        value={newVehicle.maxDistance}
                        onChange={(e) =>
                          setNewVehicle((prev) => ({
                            ...prev,
                            maxDistance: parseInt(e.target.value) || 100,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">
                        Features
                      </h4>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newVehicle.features.refrigeration}
                          onChange={(e) =>
                            setNewVehicle((prev) => ({
                              ...prev,
                              features: {
                                ...prev.features,
                                refrigeration: e.target.checked,
                              },
                            }))
                          }
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="text-sm text-gray-700">
                          Refrigeration Capability
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newVehicle.features.secureStorage}
                          onChange={(e) =>
                            setNewVehicle((prev) => ({
                              ...prev,
                              features: {
                                ...prev.features,
                                secureStorage: e.target.checked,
                              },
                            }))
                          }
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="text-sm text-gray-700">
                          Secure Storage
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                    >
                      Add Vehicle
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

export default VehicleManagement;
