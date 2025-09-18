import React from 'react';
import Header from '../Header';
import Footer from '../Footer';
import { Award, Target, Users, Zap, ShieldCheck, Clock, CheckCircle, Star, Globe, Heart } from 'lucide-react';
import BookSalLogo from '../../assets/BookSal-logo.png';

const AboutUs = () => {
  return (
    <div className="min-h-screen flex flex-col" style={{
      background: 'linear-gradient(135deg, #4a7c20 0%, #5c8c28 25%, #6b9b37 50%, #5c8c28 75%, #4a7c20 100%)',
      position: 'relative'
    }}>
      {/* Grass texture overlay */}
      <div className="absolute inset-0" style={{
        backgroundImage: `repeating-linear-gradient(
          0deg,
          rgba(255,255,255,0.03) 0px,
          transparent 1px,
          transparent 2px,
          rgba(255,255,255,0.03) 3px
        ),
        repeating-linear-gradient(
          90deg,
          rgba(0,0,0,0.05) 0px,
          transparent 1px,
          transparent 2px,
          rgba(0,0,0,0.05) 3px
        )`,
        pointerEvents: 'none'
      }}></div>
      
      <Header />

      {/* Hero Section */}
      <section className="relative py-4 overflow-hidden">
        {/* Field lines pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-0 right-0 h-0.5 bg-white/20"></div>
          <div className="absolute bottom-20 left-0 right-0 h-0.5 bg-white/20"></div>
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white/20 rounded-full"></div>
        </div>
        
        {/* Floating particles */}
        <div className="absolute top-10 left-10 w-2 h-2 bg-green-300/40 rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-20 w-3 h-3 bg-green-400/30 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-32 w-2 h-2 bg-green-200/50 rounded-full animate-pulse delay-500"></div>
        <div className="absolute bottom-32 right-10 w-4 h-4 bg-green-300/20 rounded-full animate-pulse delay-1500"></div>
        
        <div className="relative max-w-6xl mx-auto text-center px-4 sm:px-6 lg:px-8 text-white">
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
            About <span className="text-yellow-300 drop-shadow-lg">BookSal</span>
          </h1>
          <p className="text-xl md:text-2xl mb-6 max-w-4xl mx-auto leading-relaxed text-green-50">
            Nepal's Premier Futsal Booking Platform - Revolutionizing How You Play
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-1">
            <div className="flex items-center bg-white/15 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20 shadow-lg">
              <Award className="w-5 h-5 mr-2 text-yellow-400" />
              <span className="text-white font-medium">Trusted Platform</span>
            </div>
            <div className="flex items-center bg-white/15 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20 shadow-lg">
              <Star className="w-5 h-5 mr-2 text-yellow-400" />
              <span className="text-white font-medium">5-Star Service</span>
            </div>
            <div className="flex items-center bg-white/15 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20 shadow-lg">
              <Globe className="w-5 h-5 mr-2 text-yellow-400" />
              <span className="text-white font-medium">Nepal's #1</span>
            </div>
          </div>
        </div>
      </section>

      {/* Company Overview */}
      <section className="relative py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8">
              <div>
                <h2 className="text-4xl font-bold text-yellow-300 mb-6 relative inline-block">
                  Who We Are
                  <div className="absolute -bottom-2 left-0 w-24 h-1 bg-yellow-400 rounded-full"></div>
                </h2>
                <p className="text-xl text-green-100 leading-relaxed mb-6">
                  BookSal is Nepal's first comprehensive digital platform dedicated to futsal court bookings and sports community building. We bridge the gap between futsal enthusiasts and court owners, creating a seamless ecosystem where players can easily discover, book, and enjoy their favorite sport.
                </p>
                <p className="text-lg text-green-50 leading-relaxed mb-6">
                  Founded with a passion for futsal and technology, BookSal transforms the traditional booking experience into a modern, efficient, and user-friendly process. Our platform serves both individual players looking for their next game and businesses seeking to optimize their court management and reach more customers.
                </p>
                <p className="text-lg text-green-50 leading-relaxed mb-6">
                  From real-time availability tracking to secure payment processing, from community features to business analytics, BookSal is more than just a booking platform – it's the future of sports facility management in Nepal.
                </p>
              </div>
            </div>
            
            <div className="flex-1 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-400/20 rounded-3xl blur-2xl opacity-50 scale-110"></div>
                <div className="relative bg-white/95 backdrop-blur-sm p-10 rounded-3xl shadow-2xl border border-white/30">
                  <img
                    src={BookSalLogo}
                    alt="BookSal Logo"
                    className="max-w-sm h-auto object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div className="text-4xl font-bold text-green-600 hidden">
                    BOOKSAL
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission & Vision */}
      <section className="relative py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-yellow-300 mb-6 relative inline-block">
              Our Mission & Vision
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-yellow-400 rounded-full"></div>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Mission */}
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
              <div className="flex items-center mb-6">
                <div className="bg-yellow-500 p-4 rounded-full mr-4">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Our Mission</h3>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">
                To revolutionize futsal culture in Nepal by making court bookings accessible, organized, and technology-driven. We connect players, encourage sportsmanship, and support futsal businesses through innovative digital solutions.
              </p>
            </div>
            
            {/* Vision */}
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
              <div className="flex items-center mb-6">
                <div className="bg-green-600 p-4 rounded-full mr-4">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Our Vision</h3>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">
                To become Nepal's leading sports technology platform, fostering a vibrant futsal community where every player can easily find courts, connect with others, and enjoy the beautiful game.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="relative py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-yellow-300 mb-6 relative inline-block">
              Why Choose BookSal?
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-yellow-400 rounded-full"></div>
            </h2>
            <p className="text-xl text-green-100 max-w-3xl mx-auto">
              Experience the future of futsal booking with our comprehensive platform designed for players and businesses
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-white p-8 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="text-center">
                <div className="bg-yellow-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Lightning Fast</h3>
                <p className="text-gray-700 leading-relaxed">
                  Book your court in seconds with our streamlined booking process and real-time availability updates.
                </p>
              </div>
            </div>
            
            <div className="group bg-white p-8 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="text-center">
                <div className="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Community Driven</h3>
                <p className="text-gray-700 leading-relaxed">
                  Join a thriving community of futsal enthusiasts. Find teammates, organize matches, and grow your network.
                </p>
              </div>
            </div>
            
            <div className="group bg-white p-8 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="text-center">
                <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Trusted & Secure</h3>
                <p className="text-gray-700 leading-relaxed">
                  Your data and payments are protected with enterprise-grade security. Book with confidence and peace of mind.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="w-full bg-green-200 py-6 ">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="text-black">
            <h2 className="text-4xl font-bold mb-6 relative inline-block">
              Ready to Join the Revolution?
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-yellow-400 rounded-full"></div>
            </h2>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed">
              Experience the future of futsal booking. Join thousands of players who have already made the switch to BookSal.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/courts" 
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Start Booking Now
              </a>
              <a 
                href="/contact" 
                className="bg-transparent border-2 border-gray-400 text-gray-700 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300"
              >
                Get in Touch
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutUs;