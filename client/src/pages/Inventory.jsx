import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { inventoryAPI } from "../services/api";

const Inventory = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    category: "medicine",
    quantity: 0,
    reorderLevel: 10,
    price: 0,
    unit: "",
    supplier: {
      name: "",
      contact: "",
      email: "",
    },
    storageRequirements: {
      temperature: { min: 0, max: 25 },
      humidity: 50,
      specialConditions: "",
    },
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await inventoryAPI.getAll();
      // Updated: Use response.data.data instead of response.data.inventory
      setInventory(response.data.data || []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      // Create payload with all required fields
      const payload = {
        name: newItem.name,
        description: newItem.description,
        category: newItem.category,
        quantity: Number(newItem.quantity),
        reorderLevel: Number(newItem.reorderLevel),
        price: Number(newItem.price),
        unit: newItem.unit,
        // Include optional fields only if they have values
        ...(newItem.supplier.name && { supplier: newItem.supplier }),
        ...(newItem.storageRequirements.specialConditions && {
          storageRequirements: newItem.storageRequirements,
        }),
      };

      console.log("Sending payload:", payload);

      await inventoryAPI.create(payload);
      setShowCreateModal(false);
      fetchInventory();

      // Reset form
      setNewItem({
        name: "",
        description: "",
        category: "medicine",
        quantity: 0,
        reorderLevel: 10,
        price: 0,
        unit: "",
        supplier: {
          name: "",
          contact: "",
          email: "",
        },
        storageRequirements: {
          temperature: { min: 0, max: 25 },
          humidity: 50,
          specialConditions: "",
        },
      });
    } catch (error) {
      console.error("Error creating inventory item:", error);

      let errorMessage = "Failed to create inventory item";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      alert(errorMessage);
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: selectedItem.name,
        description: selectedItem.description,
        category: selectedItem.category,
        quantity: Number(selectedItem.quantity),
        reorderLevel: Number(selectedItem.reorderLevel),
        price: Number(selectedItem.price),
        unit: selectedItem.unit,
      };

      await inventoryAPI.update(selectedItem._id, payload);
      setShowEditModal(false);
      fetchInventory();
    } catch (error) {
      console.error("Error updating inventory item:", error);

      let errorMessage = "Failed to update item";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      alert(errorMessage);
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await inventoryAPI.delete(id);
        fetchInventory();
      } catch (error) {
        console.error("Error deleting inventory item:", error);
        alert(
          `Failed to delete item: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      medicine: "bg-blue-100 text-blue-800",
      equipment: "bg-green-100 text-green-800",
      supplies: "bg-purple-100 text-purple-800",
      vaccine: "bg-orange-100 text-orange-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const getStockStatus = (quantity, reorderLevel) => {
    if (quantity === 0)
      return { text: "Out of Stock", color: "bg-red-100 text-red-800" };
    if (quantity <= reorderLevel)
      return { text: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
    return { text: "In Stock", color: "bg-green-100 text-green-800" };
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
              Inventory Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage medical supplies and equipment
            </p>
          </div>
          {(user.role === "admin" || user.role === "healthcare_provider") && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300"
            >
              + Add Item
            </button>
          )}
        </div>

        {/* Inventory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventory.map((item) => {
            const stockStatus = getStockStatus(
              item.quantity,
              item.reorderLevel
            );
            return (
              <div
                key={item._id}
                className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.name}
                    </h3>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(
                        item.category
                      )}`}
                    >
                      {item.category.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">
                    {item.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">SKU:</span>
                      <span className="text-sm font-medium">{item.sku}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Quantity:</span>
                      <span className="text-sm font-medium">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Price:</span>
                      <span className="text-sm font-medium">${item.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">
                        Reorder Level:
                      </span>
                      <span className="text-sm font-medium">
                        {item.reorderLevel}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}
                    >
                      {stockStatus.text}
                    </span>
                    {(user.role === "admin" ||
                      user.role === "healthcare_provider") && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item._id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {inventory.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No inventory items
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new inventory item.
              </p>
              {(user.role === "admin" ||
                user.role === "healthcare_provider") && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    + Add Item
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">
                  Add New Inventory Item
                </h2>
                <form onSubmit={handleCreateItem}>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={newItem.name}
                        onChange={(e) =>
                          setNewItem((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                        placeholder="Enter item name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        value={newItem.category}
                        onChange={(e) =>
                          setNewItem((prev) => ({
                            ...prev,
                            category: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="medicine">Medicine</option>
                        <option value="equipment">Equipment</option>
                        <option value="supplies">Supplies</option>
                        <option value="vaccine">Vaccine</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newItem.description}
                      onChange={(e) =>
                        setNewItem((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter item description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit *
                      </label>
                      <input
                        type="text"
                        value={newItem.unit}
                        onChange={(e) =>
                          setNewItem((prev) => ({
                            ...prev,
                            unit: e.target.value,
                          }))
                        }
                        placeholder="e.g., pieces, boxes, bottles"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={newItem.quantity}
                        onChange={(e) =>
                          setNewItem((prev) => ({
                            ...prev,
                            quantity: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reorder Level *
                      </label>
                      <input
                        type="number"
                        value={newItem.reorderLevel}
                        onChange={(e) =>
                          setNewItem((prev) => ({
                            ...prev,
                            reorderLevel: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newItem.price}
                        onChange={(e) =>
                          setNewItem((prev) => ({
                            ...prev,
                            price: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Supplier Information */}
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Supplier Information (Optional)
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Supplier Name
                        </label>
                        <input
                          type="text"
                          value={newItem.supplier.name}
                          onChange={(e) =>
                            setNewItem((prev) => ({
                              ...prev,
                              supplier: {
                                ...prev.supplier,
                                name: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Supplier name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contact
                        </label>
                        <input
                          type="text"
                          value={newItem.supplier.contact}
                          onChange={(e) =>
                            setNewItem((prev) => ({
                              ...prev,
                              supplier: {
                                ...prev.supplier,
                                contact: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Phone number"
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={newItem.supplier.email}
                        onChange={(e) =>
                          setNewItem((prev) => ({
                            ...prev,
                            supplier: {
                              ...prev.supplier,
                              email: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Email address"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-6 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition duration-200"
                    >
                      Create Item
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Edit Inventory Item</h2>
                <form onSubmit={handleUpdateItem}>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={selectedItem.name}
                        onChange={(e) =>
                          setSelectedItem((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        value={selectedItem.category}
                        onChange={(e) =>
                          setSelectedItem((prev) => ({
                            ...prev,
                            category: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="medicine">Medicine</option>
                        <option value="equipment">Equipment</option>
                        <option value="supplies">Supplies</option>
                        <option value="vaccine">Vaccine</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={selectedItem.description}
                      onChange={(e) =>
                        setSelectedItem((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit *
                      </label>
                      <input
                        type="text"
                        value={selectedItem.unit}
                        onChange={(e) =>
                          setSelectedItem((prev) => ({
                            ...prev,
                            unit: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={selectedItem.quantity}
                        onChange={(e) =>
                          setSelectedItem((prev) => ({
                            ...prev,
                            quantity: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reorder Level *
                      </label>
                      <input
                        type="number"
                        value={selectedItem.reorderLevel}
                        onChange={(e) =>
                          setSelectedItem((prev) => ({
                            ...prev,
                            reorderLevel: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={selectedItem.price}
                        onChange={(e) =>
                          setSelectedItem((prev) => ({
                            ...prev,
                            price: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-6 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition duration-200"
                    >
                      Update Item
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

export default Inventory;
