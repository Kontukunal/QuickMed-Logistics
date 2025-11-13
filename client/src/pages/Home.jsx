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
      {/* Hero Section with Image Container */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <div className="text-left">
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-600/20 border border-blue-400/30 mb-8">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
                <span className="text-blue-600 text-sm font-medium">
                  Trusted by 500+ Healthcare Providers
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                QuickMed
                <span className="block text-blue-600">Logistics</span>
              </h1>

              <p className="text-xl md:text-2xl lg:text-3xl mb-8 text-gray-700 font-light">
                Delivering medical supplies with
                <span className="text-gray-900 font-semibold">
                  {" "}
                  care and precision
                </span>
              </p>

              <p className="text-lg md:text-xl mb-12 max-w-2xl text-gray-600 leading-relaxed">
                Streamline your medical supply chain with our comprehensive
                logistics platform. From intelligent inventory management to
                real-time delivery tracking, we ensure your medical supplies
                reach their destination safely and on time.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {user ? (
                  <Link
                    to="/dashboard"
                    className="group bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    Go to Dashboard
                    <span className="group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="group bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                      Get Started Free
                      <span className="group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                    </Link>
                    <Link
                      to="/login"
                      className="group border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 hover:border-blue-600 transition-all duration-300 transform hover:scale-105"
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right Side - Image Container */}
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
                <img
                  src="/hero.png"
                  alt="Medical Logistics"
                  className="w-full h-[600px] object-cover"
                />
                {/* Overlay Gradient */}
                <div className="rounded-3xl absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-blue-500/10 rounded-2xl transform rotate-12"></div>
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-blue-600/10 rounded-2xl transform -rotate-12"></div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-gray-400 rounded-full mt-2"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-semibold text-lg mb-2 block">
              WHY CHOOSE QUICKMED
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              Built for{" "}
              <span className="text-blue-600">Medical Excellence</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our platform is specifically designed to meet the unique demands
              of healthcare logistics, ensuring reliability when it matters
              most.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group text-center p-8 rounded-2xl bg-gradient-to-b from-white to-gray-50 hover:from-blue-50 hover:to-white border border-gray-100 hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl"
              >
                <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
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
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Medical Logistics?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of healthcare providers and medical facilities who
            trust QuickMed for their critical supply chain needs.
          </p>
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="group bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                Start Your Journey Today
                <span className="group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </Link>
              <Link
                to="/about"
                className="group border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300"
              >
                Learn More
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
