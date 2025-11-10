import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Home = () => {
  const { user } = useAuth();

  const features = [
    {
      title: "Fast Medical Delivery",
      description:
        "Quick and reliable delivery of medical supplies to healthcare facilities and patients.",
      icon: "🚚",
    },
    {
      title: "Real-time Tracking",
      description:
        "Track your deliveries in real-time with live location updates and status notifications.",
      icon: "📍",
    },
    {
      title: "Inventory Management",
      description:
        "Efficiently manage medical inventory with automated stock alerts and ordering.",
      icon: "📊",
    },
    {
      title: "Emergency Response",
      description:
        "Priority handling for emergency medical supplies and critical care equipment.",
      icon: "🚨",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              QuickMed Logistics
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Delivering medical supplies with care and precision
            </p>
            <p className="text-lg mb-12 max-w-2xl mx-auto text-blue-200">
              Streamline your medical supply chain with our comprehensive
              logistics platform. From inventory management to real-time
              delivery tracking, we've got you covered.
            </p>
            <div className="space-x-4">
              {user ? (
                <Link
                  to="/dashboard"
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors"
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/login"
                    className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose QuickMed?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform is designed specifically for the unique needs of
              medical logistics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Medical Logistics?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join healthcare providers and medical facilities who trust QuickMed
            for their supply chain needs.
          </p>
          {!user && (
            <Link
              to="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
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
