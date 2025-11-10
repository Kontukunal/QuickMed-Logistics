import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ordersService, inventoryService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const CreateOrder = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    items: [],
    deliveryAddress: {
      street:
        user.customerInfo?.address?.street ||
        user.healthcareFacility?.address?.street ||
        "",
      city:
        user.customerInfo?.address?.city ||
        user.healthcareFacility?.address?.city ||
        "",
      state:
        user.customerInfo?.address?.state ||
        user.healthcareFacility?.address?.state ||
        "",
      zipCode:
        user.customerInfo?.address?.zipCode ||
        user.healthcareFacility?.address?.zipCode ||
        "",
    },
    orderType: "standard",
    priority: "medium",
    specialRequirements: {
      refrigeration: false,
      fragile: false,
      handlingInstructions: "",
    },
  });

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getAll();
      setInventory(response.data || []);
    } catch (error) {
      console.error("Error loading inventory:", error);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (productId) => {
    const product = inventory.find((item) => item._id === productId);
    if (!product) return;

    const existingItem = formData.items.find(
      (item) => item.product === productId
    );

    if (existingItem) {
      // Increase quantity if item already exists
      setFormData((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.product === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      }));
    } else {
      // Add new item
      setFormData((prev) => ({
        ...prev,
        items: [
          ...prev.items,
          {
            product: productId,
            quantity: 1,
          },
        ],
      }));
    }
  };

  const handleRemoveItem = (productId) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.product !== productId),
    }));
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(productId);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.product === productId ? { ...item, quantity: newQuantity } : item
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.items.length === 0) {
      setError("Please add at least one item to the order");
      return;
    }

    // Validate delivery address
    const { deliveryAddress } = formData;
    if (
      !deliveryAddress.street ||
      !deliveryAddress.city ||
      !deliveryAddress.state ||
      !deliveryAddress.zipCode
    ) {
      setError("Please fill in all delivery address fields");
      return;
    }

    try {
      setSubmitting(true);

      // Prepare the data for submission
      const submitData = {
        items: formData.items.map((item) => ({
          product: item.product,
          quantity: item.quantity,
        })),
        deliveryAddress: formData.deliveryAddress,
        orderType: formData.orderType,
        priority: formData.priority,
        specialRequirements: formData.specialRequirements,
      };

      console.log("Submitting order data:", submitData);

      const response = await ordersService.create(submitData);

      if (response.success) {
        navigate("/orders");
      } else {
        setError(response.message || "Failed to create order");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.join(", ") ||
        error.message ||
        "Error creating order. Please try again.";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate total amount for display
  const calculateTotalAmount = () => {
    return formData.items.reduce((total, item) => {
      const product = inventory.find((p) => p._id === item.product);
      if (product) {
        return total + product.price * item.quantity;
      }
      return total;
    }, 0);
  };

  const totalAmount = calculateTotalAmount();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Order</h1>
          <p className="text-gray-600">Place an order for medical supplies</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Inventory Selection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Select Items
            </h2>

            {inventory.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No inventory items available
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {inventory.map((item) => (
                  <div
                    key={item._id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {item.description}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        ${item.price}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        Stock: {item.quantity} {item.unit}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddItem(item._id)}
                        disabled={item.quantity === 0}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Add to Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Items */}
          {formData.items.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Order Items
              </h2>
              <div className="space-y-3">
                {formData.items.map((item) => {
                  const product = inventory.find((p) => p._id === item.product);
                  if (!product) return null;

                  const itemTotal = product.price * item.quantity;

                  return (
                    <div
                      key={item.product}
                      className="flex justify-between items-center border-b border-gray-200 pb-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          ${product.price} per {product.unit}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateQuantity(
                                item.product,
                                item.quantity - 1
                              )
                            }
                            className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateQuantity(
                                item.product,
                                item.quantity + 1
                              )
                            }
                            className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-medium text-gray-900 w-20 text-right">
                          ${itemTotal}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.product)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-lg font-bold text-gray-900">
                    Total Amount
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    ${totalAmount}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Delivery Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={formData.deliveryAddress.street}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      deliveryAddress: {
                        ...prev.deliveryAddress,
                        street: e.target.value,
                      },
                    }))
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123 Main St"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.deliveryAddress.city}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      deliveryAddress: {
                        ...prev.deliveryAddress,
                        city: e.target.value,
                      },
                    }))
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="New York"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  value={formData.deliveryAddress.state}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      deliveryAddress: {
                        ...prev.deliveryAddress,
                        state: e.target.value,
                      },
                    }))
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="NY"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  value={formData.deliveryAddress.zipCode}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      deliveryAddress: {
                        ...prev.deliveryAddress,
                        zipCode: e.target.value,
                      },
                    }))
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10001"
                />
              </div>
            </div>
          </div>

          {/* Order Options */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Order Options
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Type
                </label>
                <select
                  value={formData.orderType}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      orderType: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="standard">Standard</option>
                  <option value="emergency">Emergency</option>
                  <option value="recurring">Recurring</option>
                  <option value="bulk">Bulk</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      priority: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Special Requirements
              </h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.specialRequirements.refrigeration}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        specialRequirements: {
                          ...prev.specialRequirements,
                          refrigeration: e.target.checked,
                        },
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Refrigeration Required
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.specialRequirements.fragile}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        specialRequirements: {
                          ...prev.specialRequirements,
                          fragile: e.target.checked,
                        },
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Fragile Items
                  </span>
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Handling Instructions
                  </label>
                  <textarea
                    value={formData.specialRequirements.handlingInstructions}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        specialRequirements: {
                          ...prev.specialRequirements,
                          handlingInstructions: e.target.value,
                        },
                      }))
                    }
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Any special instructions for delivery..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/orders")}
              className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || formData.items.length === 0}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {submitting ? "Creating Order..." : "Create Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrder;
