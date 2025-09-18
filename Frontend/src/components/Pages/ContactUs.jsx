import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Header';
import Footer from '../Footer';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, LogIn } from 'lucide-react';
import axios from 'axios';
import AuthService from '../../services/AuthService';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../Toast/ToastContainer';

const ContactUs = () => {
  const navigate = useNavigate();
  const { toasts, showToast, removeToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = AuthService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      // Pre-fill form with user data if authenticated
      if (authenticated) {
        const userData = AuthService.getUserData();
        if (userData) {
          setFormData(prev => ({
            ...prev,
            name: userData.fullName || '',
            email: userData.email || ''
          }));
        }
      }
    };
    
    checkAuth();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check authentication before submitting
    if (!AuthService.isAuthenticated()) {
      showToast('Please login to send a message.', 'error');
      navigate('/login');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Submitting form data:', formData);
      console.log('API URL:', `${import.meta.env.VITE_API_URL}/contact`);
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/contact`,
        formData
      );
      
      console.log('Response:', response.data);
      
      if (response.data.success) {
        showToast('Message sent successfully! We\'ll get back to you soon.', 'success');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        showToast('Failed to send message: ' + (response.data.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to send message';
      showToast('Failed to send message: ' + errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Get In <span className="text-yellow-300 drop-shadow-lg">Touch</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto leading-relaxed text-green-50">
            Have questions about BookSal? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center bg-white/15 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20 shadow-lg">
              <Clock className="w-5 h-5 mr-2 text-yellow-400" />
              <span className="text-white font-medium">Quick Response</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Contact Form */}
            <div className="relative">

              
              <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Send us a Message</h2>
                  <p className="text-gray-600">Fill out the form below and we'll respond within 24 hours</p>
                </div>

                {!isAuthenticated && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <LogIn className="w-5 h-5 text-yellow-600" />
                      <h3 className="font-semibold text-yellow-800">Login Required</h3>
                    </div>
                    <p className="text-yellow-700 mb-4">
                      You must be logged in to send us a message. This helps us provide better support and follow up on your inquiry.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Login Now
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={!isAuthenticated}
                        className={`w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-300 hover:border-gray-300 ${
                          !isAuthenticated ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={!isAuthenticated}
                        className={`w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-300 hover:border-gray-300 ${
                          !isAuthenticated ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Enter your phone number (optional)"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!isAuthenticated}
                      className={`w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-300 hover:border-gray-300 ${
                        !isAuthenticated ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Subject *</label>
                    <input
                      type="text"
                      name="subject"
                      placeholder="What's this about?"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      disabled={!isAuthenticated}
                      className={`w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-300 hover:border-gray-300 ${
                        !isAuthenticated ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Message *</label>
                    <textarea
                      name="message"
                      placeholder="Tell us more about your inquiry..."
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="5"
                      disabled={!isAuthenticated}
                      className={`w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-300 hover:border-gray-300 resize-none ${
                        !isAuthenticated ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting || !isAuthenticated}
                    className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform ${
                      isSubmitting || !isAuthenticated
                        ? 'bg-gray-400 cursor-not-allowed scale-95' 
                        : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white hover:scale-105 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send Message
                        </>
                      )}
                    </div>
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                  <p className="text-sm text-gray-500">
                    By submitting this form, you agree to our privacy policy and terms of service.
                  </p>
                </div>
              </div>
            </div>
        </div>
      </section>

      <Footer />
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default ContactUs;