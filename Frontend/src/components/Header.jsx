import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, Bell } from 'lucide-react';
import axios from 'axios';
import AuthService from '../services/AuthService';
import BookSalLogo from '../assets/BookSal-logo.png';
import { useNotifications } from '../hooks/useSocket';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchUserProfile = async () => {
    try {
      const currentUser = AuthService.getCurrentUser();
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        }
      });
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    const isAuth = AuthService.isAuthenticated();
    setIsLoggedIn(isAuth);
    if (isAuth) {
      const userData = AuthService.getCurrentUser();
      setUserRole(userData?.user?.role || null);
      fetchUserProfile();
      fetchNotifications();
    } else {
      setUserRole(null);
      setUser(null);
    }
  }, [location]);

  // Handle real-time notifications
  const handleNewNotification = (notification) => {
    console.log('Header received notification:', notification.id);
    setNotificationCount(prev => prev + 1);
    setNotifications(prev => [notification, ...prev.slice(0, 2)]);
  };

  useNotifications(handleNewNotification);

  // Listen for notification count reset
  useEffect(() => {
    const handleResetCount = () => {
      setNotificationCount(0);
    };
    
    window.addEventListener('resetNotificationCount', handleResetCount);
    return () => window.removeEventListener('resetNotificationCount', handleResetCount);
  }, []);

  const fetchNotifications = async () => {
    try {
      const user = AuthService.getCurrentUser();
      
      // Fetch unread count
      const countResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/notifications/unread-count`,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        }
      );
      
      if (countResponse.data.success) {
        setNotificationCount(countResponse.data.data.unread_count);
      }
      
      // Fetch recent notifications for dropdown
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/notifications`,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        }
      );

      if (response.data.success) {
        setNotifications(response.data.data.slice(0, 3)); // Show only first 3
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showDropdown || showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown, showNotifications]);

  const handleLogout = () => {
    AuthService.logout();
    setIsLoggedIn(false);
    setShowDropdown(false);
    setUserRole(null);
    navigate('/');
  };

const navLinkStyle = ({ isActive }) =>
  `px-4 py-2 rounded-lg transition-all duration-300 relative group font-medium
   ${isActive 
      ? 'text-white bg-green-500 shadow-sm border border-green-200'
      : 'text-gray-700 hover:text-green-700 hover:bg-green-300 hover:shadow-sm'
   }`;

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'About Us', to: '/about' },
    { label: 'Courts', to: '/courts' },
    { label: 'Contact Us', to: '/contact' },
  ];

  return (
    <nav className="sticky top-0 py-4 z-50 bg-green-200 shadow-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Row */}
        <div className="flex justify-between items-center h-16">
          {/* Left - Logo and Hamburger */}
          <div className="flex items-center space-x-4">
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-green-600 p-2"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

            <NavLink to="/" className="flex items-center">
              <img
                src={BookSalLogo}
                alt="BookSal Logo"
                className="h-9 w-auto object-contain"
              />
            </NavLink>
          </div>

          {/* Center - Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={navLinkStyle}>
                {link.label}
              </NavLink>
            ))}

            {(userRole === 'admin') && (
              <NavLink to="/admin/dashboard" className={navLinkStyle}>
                Dashboard
              </NavLink>
            )}
            {(userRole === 'court_manager') && (
              <NavLink to="/courtmanager/dashboard" className={navLinkStyle}>
                Dashboard
              </NavLink>
            )}
          </div>

          {/* Right - Auth/Profile */}
          <div className="flex items-center space-x-3 relative">
            {isLoggedIn ? (
              <>
                {/* Notification Icon */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-gray-600 hover:text-green-600 transition-colors"
                  >
                    <Bell className="w-6 h-6" />
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {notificationCount}
                      </span>
                    )}
                  </button>
                  
                  {/* Notification Modal */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            <p className="text-sm">No notifications</p>
                          </div>
                        ) : (
                          notifications.map((notification) => {
                            const getColor = (type) => {
                              switch (type) {
                                case 'booking_confirmed': return 'bg-blue-500';
                                case 'team_joined': return 'bg-yellow-500';
                                case 'payment_success': return 'bg-green-500';
                                default: return 'bg-gray-500';
                              }
                            };
                            
                            const getTimeAgo = (timestamp) => {
                              const now = new Date();
                              const diff = now - new Date(timestamp);
                              const minutes = Math.floor(diff / (1000 * 60));
                              const hours = Math.floor(diff / (1000 * 60 * 60));
                              const days = Math.floor(hours / 24);
                              if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
                              if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
                              if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
                              return 'Just now';
                            };
                            
                            return (
                              <div key={notification.id} className="p-3 border-b border-gray-100 hover:bg-gray-50">
                                <div className="flex items-start space-x-3">
                                  <div className={`w-2 h-2 ${getColor(notification.type)} rounded-full mt-2 flex-shrink-0`}></div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">{notification.title}</p>
                                    <p className="text-xs text-gray-600">{notification.message}</p>
                                    <p className="text-xs text-gray-400 mt-1">{getTimeAgo(notification.created_at)}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                      <div className="p-3 border-t border-gray-200">
                        <button 
                          onClick={async () => {
                            setShowNotifications(false);
                            navigate('/notifications');
                          }}
                          className="w-full text-center text-sm text-green-600 hover:text-green-700 font-medium"
                        >
                          View All Notifications
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-1 rounded-full hover:bg-green-50 transition duration-200"
                >
                  {user?.profile_image ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/${user.profile_image}`}
                      alt="Profile"
                      className="w-9 h-9 rounded-full object-cover border-2 border-green-500"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                  )}
                </button>
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-lg border border-gray-300 rounded-2xl shadow-xl z-10">
                    {/* User Info Header */}
                    <div className="px-5 py-3 border-b bg-green-300">
                      <p className="text-sm font-semibold ">{user?.full_name}</p>
                      <p className="text-xs truncate">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                        {user?.role || 'Player'}
                      </span>
                    </div>
                    
                    {/* Navigation Links */}
                    <div className="py-2">
                      <NavLink
                        to="/my-bookings"
                        className={({ isActive }) => 
                          `flex items-center px-4 py-2 mx-2 rounded-xl transition-all duration-200 ${
                            isActive 
                              ? 'text-green-700 bg-green-100 shadow-sm' 
                              : 'text-gray-700 hover:text-green-700 hover:bg-green-50'
                          }`
                        }
                        onClick={() => setShowDropdown(false)}
                      >
                        <span className="text-sm font-medium">My Bookings</span>
                      </NavLink>
                      <NavLink
                        to="/profile"
                        className={({ isActive }) => 
                          `flex items-center px-4 py-2 mx-2 rounded-xl transition-all duration-200 ${
                            isActive 
                              ? 'text-green-700 bg-green-100 shadow-sm' 
                              : 'text-gray-700 hover:text-green-700 hover:bg-green-50'
                          }`
                        }
                        onClick={() => setShowDropdown(false)}
                      >
                        <span className="text-sm font-medium">My Profile</span>
                      </NavLink>
                    </div>
                    
                    {/* Logout Section */}
                    <div className="border-t py-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 mx-2 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                      >
                        <span className="text-sm font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `text-sm md:text-base border-2 px-4 py-2 rounded-full transition-all ${
                      isActive
                        ? 'bg-green-100 text-green-600 border-green-600 font-semibold'
                        : 'text-green-600 border-green-500 hover:bg-green-50'
                    }`
                  }
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className={({ isActive }) =>
                    `text-sm md:text-base px-4 py-2 rounded-full shadow transition-all ${
                      isActive
                        ? 'bg-green-600 text-white'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`
                  }
                >
                  Sign Up
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Professional Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-lg border-t border-green-200 shadow-xl">
          <div className="px-6 py-6 space-y-3">
            {/* Navigation Links */}
            <div className="space-y-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                      isActive
                        ? 'text-green-700 bg-green-100 shadow-sm border border-green-200'
                        : 'text-gray-700 hover:text-green-700 hover:bg-green-50 hover:shadow-sm'
                    }`
                  }
                >
                  <span className="text-base">{link.label}</span>
                </NavLink>
              ))}
            </div>

            {/* Dashboard Links */}
            {(userRole === 'admin' || userRole === 'court_manager') && (
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-4">Management</p>
                {userRole === 'admin' && (
                  <NavLink
                    to="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                        isActive
                          ? 'text-green-700 bg-green-100 shadow-sm border border-green-200'
                          : 'text-gray-700 hover:text-green-700 hover:bg-green-50 hover:shadow-sm'
                      }`
                    }
                  >
                    <span className="text-base">Admin Dashboard</span>
                  </NavLink>
                )}
                {userRole === 'court_manager' && (
                  <NavLink
                    to="/courtmanager/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                        isActive
                          ? 'text-green-700 bg-green-100 shadow-sm border border-green-200'
                          : 'text-gray-700 hover:text-green-700 hover:bg-green-50 hover:shadow-sm'
                      }`
                    }
                  >
                    <span className="text-base">Manager Dashboard</span>
                  </NavLink>
                )}
              </div>
            )}

            {/* Auth Buttons for Mobile */}
            {!isLoggedIn && (
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <NavLink
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-3 border-2 border-green-500 text-green-600 font-semibold rounded-xl hover:bg-green-50 transition-all duration-300"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 shadow-lg transition-all duration-300"
                >
                  Sign Up
                </NavLink>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Header;
