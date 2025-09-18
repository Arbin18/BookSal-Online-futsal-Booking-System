import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, MapPinned, ChevronRight, ChevronLeft, Calendar, Clock, Users, MessageSquare, Settings, Home } from 'lucide-react';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const userData = userStr ? JSON.parse(userStr) : null;
    const role = userData?.user?.role || userData?.role;
    setUserRole(role);
  }, []);

  const isAdmin = userRole === 'admin';
  const isCourtManager = userRole === 'court_manager';

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  const linkStyle = (path) => {
    const isActive = isActiveLink(path);
    return `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
      isActive
        ? 'text-green-700 bg-green-100 shadow-sm border border-green-200'
        : 'text-gray-300 hover:text-green-400 hover:bg-gray-700/50'
    }`;
  };

  return (
    <>
      {/* Toggle Button for Mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-20 left-0 z-50 p-3 bg-green-600 hover:bg-green-700 text-white rounded-r-2xl shadow-lg transition-all duration-300"
      >
        {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-51"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-green-950 backdrop-blur-lg text-white z-55 md:z-20 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out border-r border-gray-700 flex flex-col`}
      >
        {/* Header - Fixed */}
        <div className="flex-shrink-0 p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isAdmin ? 'Admin Panel' : 'Court Manager'}
              </h2>
              <p className="text-sm text-gray-400 capitalize">{userRole || 'Loading...'}</p>
            </div>
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          {isAdmin ? (
            <>
              {/* Admin Navigation */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-4">
                  Administration
                </p>
                <div className="space-y-1">
                  <Link 
                    to="/admin/dashboard" 
                    className={linkStyle('/admin/dashboard')}
                    onClick={() => setIsOpen(false)}
                  >
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                  </Link>
                  <Link 
                    to="/admin/users" 
                    className={linkStyle('/admin/users')}
                    onClick={() => setIsOpen(false)}
                  >
                    <Users size={20} />
                    <span>Users Management</span>
                  </Link>
                  <Link 
                    to="/admin/courts" 
                    className={linkStyle('/admin/courts')}
                    onClick={() => setIsOpen(false)}
                  >
                    <MapPinned size={20} />
                    <span>Courts Management</span>
                  </Link>
                  <Link 
                    to="/admin/contact-messages" 
                    className={linkStyle('/admin/contact-messages')}
                    onClick={() => setIsOpen(false)}
                  >
                    <MessageSquare size={20} />
                    <span>Contact Messages</span>
                  </Link>
                </div>
              </div>
            </>
          ) : isCourtManager ? (
            <>
              {/* Court Manager Navigation */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-4">
                  Court Management
                </p>
                <div className="space-y-1">
                  <Link 
                    to="/courtmanager/dashboard" 
                    className={linkStyle('/courtmanager/dashboard')}
                    onClick={() => setIsOpen(false)}
                  >
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                  </Link>
                  <Link 
                    to="/courtmanager/manageCourts" 
                    className={linkStyle('/courtmanager/manageCourts')}
                    onClick={() => setIsOpen(false)}
                  >
                    <MapPinned size={20} />
                    <span>Manage Courts</span>
                  </Link>
                  <Link 
                    to="/courtmanager/addCourt" 
                    className={linkStyle('/courtmanager/addCourt')}
                    onClick={() => setIsOpen(false)}
                  >
                    <MapPinned size={20} />
                    <span>Add New Court</span>
                  </Link>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-4">
                  Booking Management
                </p>
                <div className="space-y-1">
                  <Link 
                    to="/courtmanager/manage-bookings" 
                    className={linkStyle('/courtmanager/manage-bookings')}
                    onClick={() => setIsOpen(false)}
                  >
                    <Calendar size={20} />
                    <span>Manage Bookings</span>
                  </Link>
                  <Link 
                    to="/courtmanager/view-time-slots" 
                    className={linkStyle('/courtmanager/view-time-slots')}
                    onClick={() => setIsOpen(false)}
                  >
                    <Clock size={20} />
                    <span>Time Slots</span>
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Settings className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-400 text-sm">Loading role...</p>
              </div>
            </div>
          )}

          {/* Quick Actions
          {(isAdmin || isCourtManager) && (
            <div className="pt-4 border-t border-gray-700">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-4">
                Quick Actions
              </p>
              <Link 
                to="/" 
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-300 hover:text-green-400 hover:bg-gray-700/50 transition-all duration-300"
                onClick={() => setIsOpen(false)}
              >
                <Home size={20} />
                <span>Back to Website</span>
              </Link>
            </div>
          )} */}
        </nav>

        {/* Footer - Fixed */}
        <div className="flex-shrink-0 p-4 border-t border-gray-700">
          <div className="flex items-center space-x-3 px-4 py-3 bg-gray-800/50 rounded-xl">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {userRole ? userRole.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {isAdmin ? 'Administrator' : 'Court Manager'}
              </p>
              <p className="text-xs text-gray-400">BookSal System</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;