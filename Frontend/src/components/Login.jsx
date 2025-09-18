import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import loginbg from '../assets/login-bg.jpg';
import BookSalLogo from '../assets/BookSal-logo.png';
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Attempt login
      const result = await AuthService.login(formData.email, formData.password);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // 2. Get user role
      const userRole = AuthService.getUserRole(); 
      
      // 3. Redirect based on role
      const role = userRole ? userRole.toLowerCase() : '';
      
      switch(role) {
        case 'admin':
          navigate('/admin/dashboard', { replace: true });  
          break;
        case 'court_manager':
          navigate('/courtmanager/dashboard', { replace: true });  
          break;
        default:
          navigate('/', { replace: true }); 
      }

    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
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

      {/* Professional Login Card */}
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
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Welcome
              </h1>
              <p className="text-gray-600 text-sm font-medium">
                Sign in to access your account and book your favorite courts
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

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
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
                    placeholder="Enter your email address"
                    className="block w-full pl-12 pr-4 py-4 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all duration-300 text-sm"
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
                    placeholder="Enter your password"
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

              {/* Sign In Button */}
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
                    Signing you in...
                  </>
                ) : (
                  <>
                    <User className="w-5 h-5 mr-2" />
                    Sign In to Your Account
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600">
                New to BookSal?{' '}
                <a 
                  href="/register" 
                  className="font-semibold text-green-600 hover:text-green-700 transition-colors duration-200 hover:underline"
                >
                  Create your account
                </a>
              </p>
            </div>

            {/* Security Notice */}
            <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-500">
              <span>🔒 Your data is protected with enterprise-grade security</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;