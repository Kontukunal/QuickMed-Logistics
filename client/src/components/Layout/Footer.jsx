import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">QM</span>
              </div>
              <span className="text-xl font-bold">QuickMed</span>
            </div>
            <p className="text-gray-300 text-sm">
              Delivering healthcare solutions with speed, reliability, and care.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link
                  to="/"
                  className="hover:text-blue-400 transition duration-300"
                >
                  Medical Delivery
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  className="hover:text-blue-400 transition duration-300"
                >
                  Emergency Supply
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  className="hover:text-blue-400 transition duration-300"
                >
                  Inventory Management
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  className="hover:text-blue-400 transition duration-300"
                >
                  Route Optimization
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link
                  to="/"
                  className="hover:text-blue-400 transition duration-300"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  className="hover:text-blue-400 transition duration-300"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  className="hover:text-blue-400 transition duration-300"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  className="hover:text-blue-400 transition duration-300"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <div className="text-sm text-gray-300 space-y-2">
              <p>📞 +1 (555) 123-HELP</p>
              <p>✉️ support@quickmed.com</p>
              <p>📍 123 Healthcare Ave, Medical City</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2024 QuickMed Logistics. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
