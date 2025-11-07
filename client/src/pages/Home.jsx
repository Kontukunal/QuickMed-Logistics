import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Home = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: "🚚",
      title: "Fast Delivery",
      description:
        "Quick and reliable medical supply delivery to healthcare facilities and patients.",
    },
    {
      icon: "📱",
      title: "Real-time Tracking",
      description:
        "Live tracking of deliveries with estimated arrival times and status updates.",
    },
    {
      icon: "🔄",
      title: "Route Optimization",
      description:
        "Smart route planning to ensure fastest delivery times and efficient resource usage.",
    },
    {
      icon: "🛡️",
      title: "Secure Handling",
      description:
        "Specialized handling for temperature-sensitive and emergency medical supplies.",
    },
    {
      icon: "📊",
      title: "Inventory Management",
      description:
        "Comprehensive inventory tracking with automated low-stock alerts.",
    },
    {
      icon: "🏥",
      title: "Healthcare Focused",
      description:
        "Designed specifically for the unique needs of healthcare logistics.",
    },
  ];

  const stats = [
    { number: "99.8%", label: "On-time Delivery" },
    { number: "500+", label: "Healthcare Partners" },
    { number: "24/7", label: "Emergency Support" },
    { number: "15min", label: "Average Response Time" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Delivering Health,
              <span className="block text-blue-200">Saving Lives</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              QuickMed ensures fast, reliable delivery of medical supplies to
              healthcare facilities and patients when it matters most.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link
                  to="/dashboard"
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition duration-300 shadow-lg"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition duration-300 shadow-lg"
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/login"
                    className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition duration-300"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="p-6">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose QuickMed?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform is designed specifically for the unique challenges of
              medical logistics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition duration-300 border border-gray-100"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Medical Logistics?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of healthcare providers who trust QuickMed for their
            critical supply chain needs.
          </p>
          {!user && (
            <Link
              to="/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition duration-300 inline-block"
            >
              Start Your Journey Today
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
