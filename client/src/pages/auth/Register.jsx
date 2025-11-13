import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "hospital",
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
      let serverRole = formData.role;
      if (formData.role === "hospital") {
        serverRole = "healthcare_provider";
      }

      const submitData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: serverRole,
      };

      if (serverRole === "healthcare_provider") {
        submitData.healthcareFacility = {
          ...formData.healthcareFacility,
          address: formData.address,
        };
      } else if (serverRole === "driver") {
        submitData.driverInfo = formData.driverInfo;
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 text-center">
          <div className="flex justify-center items-center mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-white font-bold text-lg">QM</span>
            </div>
            <span className="ml-3 text-2xl font-bold">QuickMed</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Join QuickMed</h2>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            Start your journey in medical logistics
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left Side - Basic Information */}
          <div className="p-8 lg:p-12">
            <div className="max-w-md mx-auto">
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center mb-6">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    {error}
                  </div>
                )}

                {/* Demo Accounts Message - Perfectly placed and highlighted */}
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 text-center">
                  <p className="text-blue-700 text-sm font-medium">
                    🚀 Want to try demo accounts?{" "}
                    <Link
                      to="/login"
                      className="font-bold text-blue-600 hover:text-blue-700 underline transition-colors"
                    >
                      Click here to login
                    </Link>
                  </p>
                </div>

                {/* Basic Information */}
                <div className="space-y-6 mb-8">
                  <h3 className="font-semibold text-gray-900 text-lg flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Basic Information
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter your email"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password
                        </label>
                        <input
                          name="password"
                          type="password"
                          required
                          value={formData.password}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          placeholder="Create password"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          name="phone"
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          placeholder="Your phone number"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role Selection */}
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 text-lg flex items-center mb-4">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Select Your Role
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      {
                        value: "hospital",
                        label: "Healthcare",
                        icon: "🏥",
                        description: "Hospitals & Clinics",
                      },
                      {
                        value: "driver",
                        label: "Driver",
                        icon: "🚚",
                        description: "Delivery Personnel",
                      },
                      {
                        value: "admin",
                        label: "Admin",
                        icon: "👨‍💼",
                        description: "System Management",
                      },
                    ].map((role) => (
                      <div
                        key={role.value}
                        className={`relative cursor-pointer border-2 rounded-lg p-4 transition-all duration-200 ${
                          formData.role === role.value
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-gray-200 hover:border-blue-300 bg-white"
                        }`}
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, role: role.value }))
                        }
                      >
                        <div className="flex items-center">
                          <div
                            className={`text-2xl mr-3 ${
                              formData.role === role.value
                                ? "text-white"
                                : "text-gray-600"
                            }`}
                          >
                            {role.icon}
                          </div>
                          <div className="flex-1">
                            <div
                              className={`font-semibold ${
                                formData.role === role.value
                                  ? "text-white"
                                  : "text-gray-900"
                              }`}
                            >
                              {role.label}
                            </div>
                            <div
                              className={`text-sm ${
                                formData.role === role.value
                                  ? "text-blue-100"
                                  : "text-gray-500"
                              }`}
                            >
                              {role.description}
                            </div>
                          </div>
                          {formData.role === role.value && (
                            <div className="w-5 h-5 bg-white text-blue-500 rounded-full flex items-center justify-center">
                              ✓
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Right Side - Role-specific Information & Address */}
          <div className="p-8 lg:p-12 bg-gray-50">
            <div className="max-w-md mx-auto">
              <form onSubmit={handleSubmit}>
                {/* Hospital Information */}
                {formData.role === "hospital" && (
                  <div className="space-y-6 mb-8">
                    <h3 className="font-semibold text-gray-900 text-lg flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Facility Details
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Facility Name
                        </label>
                        <input
                          name="healthcareFacility.name"
                          type="text"
                          required
                          value={formData.healthcareFacility.name}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          placeholder="Enter facility name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Facility Type
                        </label>
                        <select
                          name="healthcareFacility.type"
                          value={formData.healthcareFacility.type}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        >
                          <option value="hospital">Hospital</option>
                          <option value="clinic">Clinic</option>
                          <option value="pharmacy">Pharmacy</option>
                          <option value="laboratory">Laboratory</option>
                          <option value="nursing_home">Nursing Home</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Driver Information */}
                {formData.role === "driver" && (
                  <div className="space-y-6 mb-8">
                    <h3 className="font-semibold text-gray-900 text-lg flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Driver Details
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          License Number
                        </label>
                        <input
                          name="driverInfo.licenseNumber"
                          type="text"
                          required
                          value={formData.driverInfo.licenseNumber}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          placeholder="Enter license number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vehicle Type
                        </label>
                        <select
                          name="driverInfo.vehicleType"
                          value={formData.driverInfo.vehicleType}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
                    </div>
                  </div>
                )}

                {/* Admin Information */}
                {formData.role === "admin" && (
                  <div className="space-y-6 mb-8">
                    <h3 className="font-semibold text-gray-900 text-lg flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Admin Access
                    </h3>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-700 text-sm">
                        Full system access for management and oversight.
                      </p>
                    </div>
                  </div>
                )}

                {/* Address Information */}
                <div className="space-y-6 mb-8">
                  <h3 className="font-semibold text-gray-900 text-lg flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    Address
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address
                      </label>
                      <input
                        name="address.street"
                        type="text"
                        required
                        value={formData.address.street}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter street address"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <input
                          name="address.city"
                          type="text"
                          required
                          value={formData.address.city}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          placeholder="Enter city"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State
                        </label>
                        <input
                          name="address.state"
                          type="text"
                          required
                          value={formData.address.state}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          placeholder="Enter state"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP Code
                      </label>
                      <input
                        name="address.zipCode"
                        type="text"
                        required
                        value={formData.address.zipCode}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter ZIP code"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating Account...
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
