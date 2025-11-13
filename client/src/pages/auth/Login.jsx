import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        navigate("/dashboard");
      } else {
        setError(result.message || "Login failed. Please try again.");
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const demoCredentials = [
    { role: "Admin", email: "admin@gmail.com", password: "123456" },
    { role: "Hospital", email: "hospital@gmail.com", password: "123456" },
    { role: "Driver", email: "driver1@gmail.com", password: "123456" },
  ];

  const handleDemoLogin = (email, password) => {
    setFormData({ email, password });
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
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Welcome Back</h2>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            Sign in to your QuickMed account
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left Side - Login Form */}
          <div className="p-8 lg:p-12">
            <div className="max-w-md mx-auto">
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center mb-6">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    {error}
                  </div>
                )}

                {/* Login Information */}
                <div className="space-y-6 mb-8">
                  <h3 className="font-semibold text-gray-900 text-lg flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Login Information
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter your email"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                      </label>
                      <input
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter your password"
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
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              {/* Sign Up Link */}
              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Create one now
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Demo Credentials */}
          <div className="p-8 lg:p-12 bg-gray-50">
            <div className="max-w-md mx-auto">
              <div className="text-center lg:text-left mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Quick Access
                </h2>
                <p className="text-gray-600">Try our demo accounts</p>
              </div>

              {/* Demo Credentials */}
              <div className="space-y-6">
                <h3 className="font-semibold text-gray-900 text-lg flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Demo Accounts
                </h3>

                <div className="space-y-4">
                  {demoCredentials.map((cred, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
                      onClick={() => handleDemoLogin(cred.email, cred.password)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div
                            className={`text-xl mr-3 ${
                              cred.role === "Admin"
                                ? "text-purple-500"
                                : cred.role === "Hospital"
                                ? "text-green-500"
                                : "text-blue-500"
                            }`}
                          >
                            {cred.role === "Admin"
                              ? "👨‍💼"
                              : cred.role === "Hospital"
                              ? "🏥"
                              : "🚚"}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {cred.role}
                            </div>
                            <div className="text-sm text-gray-500">
                              {cred.email}
                            </div>
                          </div>
                        </div>
                        <div className="text-blue-600 group-hover:text-blue-700 transition-colors">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Demo Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 text-sm mb-2">
                    How to use demo accounts:
                  </h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Click on any demo account above</li>
                    <li>• Credentials will auto-fill</li>
                    <li>• Click "Sign In" to continue</li>
                    <li>• Explore different role features</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
