import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import loginbg from '../assets/login-bg.jpg';
import BookSalLogo from '../assets/BookSal-logo.png';
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, Phone, MapPin, UserCheck } from 'lucide-react';

function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    password: '',
    role: 'player'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (!formData.fullName || !formData.email || !formData.password) {
        throw new Error('Full name, email and password are required');
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Validate email format - must be @gmail.com
      const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      if (!emailRegex.test((formData.email || '').trim())) {
        throw new Error('Email must be a valid @gmail.com address.');
      }

      // Validate phone: must start with 9 and be exactly 10 digits
      const phoneRegex = /^9[0-9]{9}$/;
      if (formData.phoneNumber && !phoneRegex.test((formData.phoneNumber || '').trim())) {
        throw new Error('Phone number must start with 9 and be exactly 10 digits.');
      }

      const response = await AuthService.register(
        formData.fullName,
        formData.email,
        formData.phoneNumber,
        formData.address,
        formData.password,
        formData.role
      );

      if (!response.success) {
        throw new Error(response.error);
      }

      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 relative" style={{ backgroundImage: `url(${loginbg})` }}>
      {/* Enhanced overlay */}
      <div className="absolute inset-0 bg-black/30 z-0" />
      
      {/* Subtle animated background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-10 w-2 h-2 bg-green-400/30 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-3 h-3 bg-green-400/20 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-32 w-2 h-2 bg-green-300/40 rounded-full animate-pulse delay-500"></div>
        <div className="absolute bottom-20 right-16 w-4 h-4 bg-green-300/20 rounded-full animate-pulse delay-1500"></div>
      </div>

      {/* Professional Register Card */}
      <div className="max-w-lg w-full space-y-8 z-10 relative">
        {/* Main Card */}
        <div className="bg-white/85 backdrop-blur-xl border border-white/30 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.3)] transition-all duration-500 hover:shadow-[0_35px_80px_rgba(0,0,0,0.4)] relative">
          
          {/* Back Button */}
          <button 
            onClick={() => navigate('/')} 
            className="absolute top-5 left-5 text-gray-600 hover:text-gray-800 transition p-1 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          {/* Header Section */}
          <div className="p-6">
            <div className="text-center">
              {/* BookSal Logo */}
              <div className="mx-auto w-24 h-24 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-lg p-2">
                <img
                  src={BookSalLogo}
                  alt="BookSal Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              
              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Join BookSal
              </h1>
              <p className="text-gray-600 text-sm font-medium">
                Create your account and start booking your favorite courts
              </p>
            </div>
          </div>

          {/* Form Section */}
          <div className="px-10 pb-10">
            {/* Error Display */}
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Display */}
            {success && (
              <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700 font-medium">Registration successful! Redirecting to login...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Register Form */}
            <form onSubmit={handleRegister} className="space-y-5">
              {/* Full Name Field */}
              <div className="space-y-2">
                <label htmlFor="fullName" className="block text-lg font-semibold text-green-700">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    id="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="block w-full pl-12 pr-4 py-4 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all duration-300 text-sm"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-lg font-semibold text-green-700">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your @gmail.com email"
                    className="block w-full pl-12 pr-4 py-4 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all duration-300 text-sm"
                  />
                </div>
              </div>

              {/* Phone Number Field */}
              <div className="space-y-2">
                <label htmlFor="phoneNumber" className="block text-lg font-semibold text-green-700">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phoneNumber"
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="Enter phone number (9xxxxxxxxx)"
                    maxLength="10"
                    className="block w-full pl-12 pr-4 py-4 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all duration-300 text-sm"
                  />
                </div>
              </div>

              {/* Address Field */}
              <div className="space-y-2">
                <label htmlFor="address" className="block text-lg font-semibold text-green-700">
                  Address
                </label>
                <div className="relative">
                  <div className="absolute top-4 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    name="address"
                    id="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter your address"
                    rows="3"
                    className="block w-full pl-12 pr-4 py-4 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all duration-300 text-sm resize-none"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-lg font-semibold text-green-700">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    id="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password (min 6 characters)"
                    minLength="6"
                    className="block w-full pl-12 pr-12 py-4 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all duration-300 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Role Selection - Beautified */}
              <div className="space-y-3">
                <label className="block text-lg font-semibold text-green-700">
                  Select Your Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                    formData.role === 'player' 
                      ? 'border-green-500 bg-green-50 shadow-md' 
                      : 'border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-25'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="player"
                      checked={formData.role === 'player'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="flex flex-col items-center text-center w-full">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                        formData.role === 'player' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        <User className="w-4 h-4" />
                      </div>
                      <span className={`text-sm font-semibold ${
                        formData.role === 'player' ? 'text-green-700' : 'text-gray-600'
                      }`}>
                        Player
                      </span>
                      <span className="text-xs text-gray-500 mt-1">Book courts & play</span>
                    </div>
                  </label>

                  <label className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                    formData.role === 'court_manager' 
                      ? 'border-green-500 bg-green-50 shadow-md' 
                      : 'border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-25'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="court_manager"
                      checked={formData.role === 'court_manager'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="flex flex-col items-center text-center w-full">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                        formData.role === 'court_manager' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <span className={`text-sm font-semibold ${
                        formData.role === 'court_manager' ? 'text-green-700' : 'text-gray-600'
                      }`}>
                        Court Manager
                      </span>
                      <span className="text-xs text-gray-500 mt-1">Manage courts</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center items-center py-4 px-6 text-white text-sm font-semibold rounded-xl shadow-lg transition-all duration-300 transform ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserCheck className="w-5 h-5 mr-2" />
                    Create Your Account
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <a 
                  href="/login" 
                  className="font-semibold text-green-600 hover:text-green-700 transition-colors duration-200 hover:underline"
                >
                  Sign in here
                </a>
              </p>
            </div>

            {/* Security Notice */}
            <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-500">
              <span>🔒 Your information is secure and protected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;