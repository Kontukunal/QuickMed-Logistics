import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "hospital", // This will be mapped to "healthcare_provider" for server
    healthcareFacility: {
      name: "",
      type: "hospital",
    },
    driverInfo: {
      licenseNumber: "",
      vehicleType: "car",
    },
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("healthcareFacility.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        healthcareFacility: { ...prev.healthcareFacility, [field]: value },
      }));
    } else if (name.startsWith("driverInfo.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        driverInfo: { ...prev.driverInfo, [field]: value },
      }));
    } else if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Map frontend role names to server role names
      let serverRole = formData.role;
      if (formData.role === "hospital") {
        serverRole = "healthcare_provider";
      }

      // Prepare data for server
      const submitData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: serverRole,
      };

      // Add role-specific data
      if (serverRole === "healthcare_provider") {
        submitData.healthcareFacility = {
          ...formData.healthcareFacility,
          address: formData.address,
        };
      } else if (serverRole === "driver") {
        submitData.driverInfo = formData.driverInfo;
        // Add address to driver info if needed, or handle separately
      } else if (serverRole === "admin") {
        // Admin doesn't need additional fields in current schema
      }

      console.log("Sending registration data:", submitData);

      const result = await register(submitData);

      if (result.success) {
        navigate("/dashboard");
      } else {
        setError(result.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">QM</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{" "}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700"
              >
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="hospital">Hospital</option>
                <option value="driver">Driver</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Hospital Information - Show for hospital role only */}
            {formData.role === "hospital" && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-medium text-gray-900">
                  Hospital Information
                </h3>
                <div>
                  <label
                    htmlFor="healthcareFacility.name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Hospital Name
                  </label>
                  <input
                    id="healthcareFacility.name"
                    name="healthcareFacility.name"
                    type="text"
                    required
                    value={formData.healthcareFacility.name}
                    onChange={handleChange}
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter hospital name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="healthcareFacility.type"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Facility Type
                  </label>
                  <select
                    id="healthcareFacility.type"
                    name="healthcareFacility.type"
                    value={formData.healthcareFacility.type}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="hospital">Hospital</option>
                    <option value="clinic">Clinic</option>
                    <option value="pharmacy">Pharmacy</option>
                    <option value="laboratory">Laboratory</option>
                    <option value="nursing_home">Nursing Home</option>
                  </select>
                </div>
              </div>
            )}

            {/* Address Information - Show for all roles */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-medium text-gray-900">
                Address Information
              </h3>
              <div>
                <label
                  htmlFor="address.street"
                  className="block text-sm font-medium text-gray-700"
                >
                  Street Address
                </label>
                <input
                  id="address.street"
                  name="address.street"
                  type="text"
                  required
                  value={formData.address.street}
                  onChange={handleChange}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter street address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="address.city"
                    className="block text-sm font-medium text-gray-700"
                  >
                    City
                  </label>
                  <input
                    id="address.city"
                    name="address.city"
                    type="text"
                    required
                    value={formData.address.city}
                    onChange={handleChange}
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label
                    htmlFor="address.state"
                    className="block text-sm font-medium text-gray-700"
                  >
                    State
                  </label>
                  <input
                    id="address.state"
                    name="address.state"
                    type="text"
                    required
                    value={formData.address.state}
                    onChange={handleChange}
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter state"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="address.zipCode"
                  className="block text-sm font-medium text-gray-700"
                >
                  ZIP Code
                </label>
                <input
                  id="address.zipCode"
                  name="address.zipCode"
                  type="text"
                  required
                  value={formData.address.zipCode}
                  onChange={handleChange}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter ZIP code"
                />
              </div>
            </div>

            {/* Driver Information - Only for driver role */}
            {formData.role === "driver" && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-medium text-gray-900">
                  Driver Information
                </h3>
                <div>
                  <label
                    htmlFor="driverInfo.licenseNumber"
                    className="block text-sm font-medium text-gray-700"
                  >
                    License Number
                  </label>
                  <input
                    id="driverInfo.licenseNumber"
                    name="driverInfo.licenseNumber"
                    type="text"
                    required
                    value={formData.driverInfo.licenseNumber}
                    onChange={handleChange}
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter driver license number"
                  />
                </div>
                <div>
                  <label
                    htmlFor="driverInfo.vehicleType"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Vehicle Type
                  </label>
                  <select
                    id="driverInfo.vehicleType"
                    name="driverInfo.vehicleType"
                    value={formData.driverInfo.vehicleType}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="motorcycle">Motorcycle</option>
                    <option value="car">Car</option>
                    <option value="van">Van</option>
                    <option value="truck">Truck</option>
                    <option value="refrigerated_van">Refrigerated Van</option>
                  </select>
                </div>
              </div>
            )}

            {/* Admin Information - Only for admin role */}
            {formData.role === "admin" && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-medium text-gray-900">
                  Admin Information
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <p className="text-sm text-blue-700">
                    As an admin, you'll have full access to manage the entire
                    system including users, drivers, orders, and inventory.
                  </p>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Role Information
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-gray-600">
              <div>
                <strong>Hospital:</strong> Manage inventory and create orders
              </div>
              <div>
                <strong>Driver:</strong> Deliver orders and update status
              </div>
              <div>
                <strong>Admin:</strong> Full system access and management
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
