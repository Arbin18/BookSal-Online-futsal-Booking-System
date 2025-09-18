import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Calendar, MapPin, Users, Award, Clock, ShieldCheck, Zap } from 'lucide-react';
import Futsal from '../../assets/images/Futsal.jpg';
import BookSalLogo from '../../assets/BookSal-logo.png';
import Header from '../Header'; 
import Footer from '../Footer';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header/>
      
      {/* Hero Section */}
      <section className="relative flex-1 bg-cover bg-center text-white text-center py-32 px-4" style={{ backgroundImage: `url(${Futsal})`}}>
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative bg-none p-4 md:p-12 rounded-lg inline-block z-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Book Your Futsal Court Today!</h1>
          <p className="text-lg md:text-xl font-bold mb-6">Your Game, Your Time, Just a Click Away.</p>
          <div className="space-x-4">
            <Link to="/courts" className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded text-white font-semibold">Book Now</Link>
            <Link to="/about" className="bg-white hover:bg-gray-100 text-blue-600 px-6 py-3 rounded font-semibold">About Us</Link>
          </div>
        </div>
      </section>

      {/* Quick Stats Section */}
      <section className="px-12 py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Easy Booking</h3>
              <p className="text-gray-600">Book your futsal court in just a few clicks with our simple reservation system</p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                <MapPin className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Prime Locations</h3>
              <p className="text-gray-600">Access premium futsal courts across the city at convenient locations</p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Community</h3>
              <p className="text-gray-600">Play futsal with other players and team to improve your futsal skills.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section - Integrated from AboutUs component */}
      <section id="about" className="py-16 bg-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Who We Are Section */}
          <div className="mb-16">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1 space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold text-green-600 mb-4 relative inline-block">
                  About BookSal
                  <div className="absolute -bottom-2 left-0 w-20 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
                </h2>
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                  <p className="text-lg leading-8 mb-6 text-gray-700">
                    <strong className="text-green-700">BookSal</strong> is Nepal's first dedicated futsal booking platform designed to simplify how futsal courts are discovered and booked. We eliminate traditional booking hassles with our easy-to-use digital solution.
                  </p>
                  <p className="text-lg leading-8 text-gray-700">
                    Whether you're a casual player looking for a game or a futsal business managing courts, BookSal provides transparency, efficiency, and real-time availability updates.
                  </p>
                </div>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="relative bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                  <img
                    src={BookSalLogo}
                    alt="BookSal Logo"
                    className="max-w-xs lg:max-w-md h-auto object-contain"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Why Choose BookSal */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-green-600 mb-4 relative inline-block">
                Why Choose BookSal?
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                The features that make us the premier choice for futsal court bookings
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="group p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors duration-300">
                    <Zap className="text-green-600 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Instant Booking</h3>
                    <p className="text-gray-600">Avoid delays with real-time availability and confirmations.</p>
                  </div>
                </div>
              </div>
              
              <div className="group p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors duration-300">
                    <ShieldCheck className="text-blue-600 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Secure Payments</h3>
                    <p className="text-gray-600">(Coming soon) Book and pay directly with trusted gateways.</p>
                  </div>
                </div>
              </div>
              
              <div className="group p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-yellow-100 rounded-full group-hover:bg-yellow-200 transition-colors duration-300">
                    <Users className="text-yellow-600 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Find Teams To Play</h3>
                    <p className="text-gray-600">Players can find a match or team to play the game.</p>
                  </div>
                </div>
              </div>
              
              <div className="group p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors duration-300">
                    <Award className="text-purple-600 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Reliable Platform</h3>
                    <p className="text-gray-600">Trusted by players and futsal businesses across Nepal.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Play?</h2>
          <p className="text-xl text-green-100 mb-8">Find and book the perfect futsal court for your next game</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/courts" 
              className="bg-white text-green-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Browse Courts
            </Link>
            <Link 
              to="/contact" 
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-green-600 transition-all duration-300"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <Footer/>
    </div>
  );
};

export default Home;