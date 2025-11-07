import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ordersAPI, inventoryAPI } from "../services/api";

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
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
  });

  useEffect(() => {
    fetchOrders();
    fetchInventory();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getAll();
      setOrders(response.data.orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await inventoryAPI.getAll();
      setInventory(response.data.inventory);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
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

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      await ordersAPI.create(newOrder);
      setShowCreateModal(false);
      fetchOrders();
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
      });
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  const addItem = () => {
    setNewOrder((prev) => ({
      ...prev,
      items: [...prev.items, { product: "", quantity: 1 }],
    }));
  };

  const removeItem = (index) => {
    setNewOrder((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index, field, value) => {
    setNewOrder((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
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
          {user.role === "customer" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300"
            >
              + New Order
            </button>
          )}
        </div>

        {/* Orders Table */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
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
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">
                          {order.orderType}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status.replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${order.totalAmount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/orders/${order._id}`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Order Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Create New Order</h2>
                <form onSubmit={handleCreateOrder}>
                  {/* Order Items */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Order Items</h3>
                    {newOrder.items.map((item, index) => (
                      <div key={index} className="flex gap-4 mb-3 items-end">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product
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
                            {inventory.map((product) => (
                              <option key={product._id} value={product._id}>
                                {product.name} - ${product.price} (Stock:{" "}
                                {product.quantity})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-32">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "quantity",
                                parseInt(e.target.value)
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
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addItem}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
                    >
                      + Add Item
                    </button>
                  </div>

                  {/* Delivery Address */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">
                      Delivery Address
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="Street Address"
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
                      <input
                        type="text"
                        placeholder="City"
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
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <input
                        type="text"
                        placeholder="State"
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
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <input
                        type="text"
                        placeholder="ZIP Code"
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
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Order Options */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
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

                  {/* Modal Actions */}
                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                    >
                      Create Order
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
