import React from "react";

const Footer = () => {
  return (
    <footer className="bg-black text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">QuickMed</h3>
            <p className="text-gray-400 text-sm">
              Medical Logistics Simplified
            </p>
          </div>
          <div className="border-t border-gray-800 w-20 my-4"></div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              &copy; 2025 QuickMed By{" "}
              <span className="text-blue-400 text-sm">Kunal Mali</span>. All
              rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
