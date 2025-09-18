import React, { useEffect, useState } from 'react';
import Header from '../Header';
import Footer from '../Footer';
import Sidebar from '../Sidebar';
import { Users, Calendar, MapPinned, TrendingUp, Activity, BarChart3, PieChart, ArrowUpRight } from 'lucide-react';
import axios from 'axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    userTypes: { customer: 0, court_manager: 0, player: 0 },
    totalBookings: 0,
    totalCourts: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const token = user?.token;
        
        if (!token) return;

        // Fetch users
        const usersRes = await axios.get(`${import.meta.env.VITE_API_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Fetch courts
        const courtsRes = await axios.get(`${import.meta.env.VITE_API_URL}/courts`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Fetch all bookings
        const bookingsRes = await axios.get(`${import.meta.env.VITE_API_URL}/admin/bookings`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (usersRes.data.success) {
          const users = usersRes.data.data || [];
          const userTypes = users.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
          }, { customer: 0, court_manager: 0, player: 0 });

          setStats(prev => ({
            ...prev,
            totalUsers: users.length,
            userTypes
          }));
        }

        if (courtsRes.data.success) {
          setStats(prev => ({
            ...prev,
            totalCourts: courtsRes.data.data?.length || 0
          }));
        }

        if (bookingsRes.data.success) {
          setStats(prev => ({
            ...prev,
            totalBookings: bookingsRes.data.data?.length || 0
          }));
        }
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
      }
    };

    fetchStats();
  }, []);

  return (
    <>
      <Header />
      <div className="flex md:flex-row flex-col relative bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 w-full">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
                <p className="text-gray-600">Welcome back! Here's what's happening with your platform.</p>
              </div>
              <div className="mt-4 sm:mt-0">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Activity className="w-4 h-4" />
                  <span>Last updated: {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>
            </div>
            
            <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
              </div>
            </div>
            
            <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-purple-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                    <MapPinned className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Courts</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalCourts}</p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
              </div>
            </div>
            
            <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-orange-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Court Managers</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.userTypes.court_manager}</p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
            {/* User Types Chart */}
            <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">User Types Distribution</h2>
                </div>
              </div>
              <div className="relative h-64 md:h-80">
                <div className="flex items-end justify-center h-full space-x-4 md:space-x-8">
                  <div className="flex flex-col items-center group">
                    <div 
                      className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg w-12 md:w-16 transition-all duration-700 hover:from-blue-600 hover:to-blue-500 shadow-lg"
                      style={{ height: `${stats.totalUsers > 0 ? Math.max((stats.userTypes.customer / stats.totalUsers) * 200, 20) : 20}px` }}
                    ></div>
                    <div className="mt-3 text-center">
                      <div className="font-bold text-lg md:text-xl text-gray-900">{stats.userTypes.customer}</div>
                      <div className="text-xs md:text-sm text-gray-600 font-medium">Customers</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center group">
                    <div 
                      className="bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg w-12 md:w-16 transition-all duration-700 hover:from-green-600 hover:to-green-500 shadow-lg"
                      style={{ height: `${stats.totalUsers > 0 ? Math.max((stats.userTypes.court_manager / stats.totalUsers) * 200, 20) : 20}px` }}
                    ></div>
                    <div className="mt-3 text-center">
                      <div className="font-bold text-lg md:text-xl text-gray-900">{stats.userTypes.court_manager}</div>
                      <div className="text-xs md:text-sm text-gray-600 font-medium">Managers</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center group">
                    <div 
                      className="bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg w-12 md:w-16 transition-all duration-700 hover:from-purple-600 hover:to-purple-500 shadow-lg"
                      style={{ height: `${stats.totalUsers > 0 ? Math.max((stats.userTypes.player / stats.totalUsers) * 200, 20) : 20}px` }}
                    ></div>
                    <div className="mt-3 text-center">
                      <div className="font-bold text-lg md:text-xl text-gray-900">{stats.userTypes.player}</div>
                      <div className="text-xs md:text-sm text-gray-600 font-medium">Players</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* System Overview */}
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <PieChart className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">System Overview</h2>
              </div>
              <div className="space-y-4">
                <div className="group p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:shadow-md transition-all duration-300">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-blue-900">Active Users</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-700">{stats.totalUsers}</span>
                  </div>
                </div>
                <div className="group p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200 hover:shadow-md transition-all duration-300">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-500 rounded-lg">
                        <MapPinned className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-green-900">Active Courts</span>
                    </div>
                    <span className="text-2xl font-bold text-green-700">{stats.totalCourts}</span>
                  </div>
                </div>
                <div className="group p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:shadow-md transition-all duration-300">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-500 rounded-lg">
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-purple-900">Total Bookings</span>
                    </div>
                    <span className="text-2xl font-bold text-purple-700">{stats.totalBookings}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default AdminDashboard;