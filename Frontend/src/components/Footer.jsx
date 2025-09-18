import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info - Wider column */}
          <div className="col-span-1 md:col-span-2">
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 mb-4">
              BOOKSAL
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Your premier destination for futsal court bookings. Play at the best courts across the city with seamless reservation experience.
            </p>
          </div>

          {/* Quick Links - Compact column */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Access</h3>
            <ul className="space-y-2">
              <li><Link to="/courts" className="text-gray-300 hover:text-green-400 transition-colors duration-200">Booking</Link></li>
              <li><Link to="/courts" className="text-gray-300 hover:text-green-400 transition-colors duration-200">Courts</Link></li>
              <li><Link to="/about" className="text-gray-300 hover:text-green-400 transition-colors duration-200">About Us</Link></li>
              <li><Link to="/contact" className="text-gray-300 hover:text-green-400 transition-colors duration-200">Customer Support</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom section with copyright */}
        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p className="text-gray-400">
            &copy; {new Date().getFullYear()} Booksal. All rights reserved. | Professional Futsal Booking Platform
          </p>

          <div className="flex space-x-6">
            <a href="#" className="text-gray-400 hover:text-green-400">
              <span className="sr-only">Facebook</span>
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-green-400">
              <span className="sr-only">Instagram</span>
              <i className="fab fa-instagram"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-green-400">
              <span className="sr-only">Twitter</span>
              <i className="fab fa-twitter"></i>
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;