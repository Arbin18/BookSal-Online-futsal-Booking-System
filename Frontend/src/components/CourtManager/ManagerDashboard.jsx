// === Frontend: src/pages/ManagerDashboard.jsx ===
import React, { useEffect, useState } from 'react';
import Header from '../Header';
import Footer from '../Footer';
import Sidebar from '../Sidebar';
import { Users, Calendar, CreditCard, TrendingUp, Activity, BarChart3, PieChart, ArrowUpRight, MapPin } from 'lucide-react';
import axios from 'axios';

const ManagerDashboard = () => {
  const [court, setCourt] = useState(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalPlayers: 0,
    bookingTypes: { matchmaking: 0, direct: 0 },
    paymentMethods: { esewa: 0, cash: 0 },
    recentBookings: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const token = user?.token;
        
        if (!token) {
          console.error('No token found');
          return;
        }
        
        // Fetch court details
        const courtRes = await axios.get(`${import.meta.env.VITE_API_URL}/courts/manager`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const courtData = courtRes.data.success ? courtRes.data.data : courtRes.data;
        setCourt(courtData);
        
        // Fetch booking statistics
        if (courtData?.id) {
          try {
            const bookingsRes = await axios.get(`${import.meta.env.VITE_API_URL}/bookings/court/${courtData.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (bookingsRes.data.success) {
              const courtBookings = bookingsRes.data.data || [];
              
              const totalBookings = courtBookings.length;
              const uniqueUsers = new Set(courtBookings.map(b => b.user_id));
              const totalPlayers = uniqueUsers.size;
              
              // Group matchmaking bookings by time slot and court type
              const matchmakingSlots = new Set();
              const bookingTypes = courtBookings.reduce((acc, b) => {
                const isMatchmaking = b.is_matchmaking || b.status === 'finding_team';
                if (isMatchmaking) {
                  const slotKey = `${b.booking_date}-${b.start_time}-${b.end_time}-${b.court_type}`;
                  matchmakingSlots.add(slotKey);
                } else {
                  acc.direct = (acc.direct || 0) + 1;
                }
                return acc;
              }, { matchmaking: 0, direct: 0 });
              
              bookingTypes.matchmaking = matchmakingSlots.size;
              
              const paymentMethods = courtBookings.reduce((acc, b) => {
                const method = b.payment_method || 'cash';
                acc[method] = (acc[method] || 0) + 1;
                return acc;
              }, { esewa: 0, cash: 0 });
              
              setStats({
                totalBookings,
                totalPlayers,
                bookingTypes,
                paymentMethods,
                recentBookings: courtBookings.slice(-5).reverse()
              });
            }
          } catch (statsError) {
            console.error('Error fetching booking stats:', statsError);
          }
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <Header />
      <div className="flex md:flex-row flex-col relative bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 max-w-5xl">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center mb-4 sm:mb-0">
                <div className="p-3 bg-green-100 rounded-xl mr-4">
                  <MapPin className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-4xl font-bold text-gray-900">Manager Dashboard</h1>
                  <p className="text-gray-600 mt-1">Monitor your court performance and bookings</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Activity className="w-4 h-4" />
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
          
          {court ? (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
                
                <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Players</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalPlayers}</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
                  </div>
                </div>
                
                <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-purple-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Matchmaking</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.bookingTypes.matchmaking}</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                  </div>
                </div>
                
                <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-orange-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors">
                        <CreditCard className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">eSewa Payments</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.paymentMethods.esewa}</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
                {/* Booking Types Chart */}
                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-gray-100">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-yellow-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Booking Types Distribution</h2>
                  </div>
                  <div className="relative h-64 md:h-80">
                    <div className="flex items-end justify-center h-full space-x-4 md:space-x-8">
                      <div className="flex flex-col items-center group">
                        <div 
                          className="bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t-lg w-12 md:w-16 transition-all duration-700 hover:from-yellow-600 hover:to-yellow-500 shadow-lg"
                          style={{ height: `${stats.totalBookings > 0 ? Math.max((stats.bookingTypes.matchmaking / stats.totalBookings) * 200, 20) : 20}px` }}
                        ></div>
                        <div className="mt-3 text-center">
                          <div className="font-bold text-lg md:text-xl text-gray-900">{stats.bookingTypes.matchmaking}</div>
                          <div className="text-xs md:text-sm text-gray-600 font-medium">Matchmaking</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center group">
                        <div 
                          className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg w-12 md:w-16 transition-all duration-700 hover:from-blue-600 hover:to-blue-500 shadow-lg"
                          style={{ height: `${stats.totalBookings > 0 ? Math.max((stats.bookingTypes.direct / stats.totalBookings) * 200, 20) : 20}px` }}
                        ></div>
                        <div className="mt-3 text-center">
                          <div className="font-bold text-lg md:text-xl text-gray-900">{stats.bookingTypes.direct}</div>
                          <div className="text-xs md:text-sm text-gray-600 font-medium">Direct Booked</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Payment Methods Chart */}
                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-gray-100">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <PieChart className="w-5 h-5 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Payment Methods</h2>
                  </div>
                  <div className="relative h-64 md:h-80">
                    <div className="flex items-end justify-center h-full space-x-4 md:space-x-8">
                      <div className="flex flex-col items-center group">
                        <div 
                          className="bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg w-12 md:w-16 transition-all duration-700 hover:from-green-600 hover:to-green-500 shadow-lg"
                          style={{ height: `${stats.totalBookings > 0 ? Math.max((stats.paymentMethods.esewa / stats.totalBookings) * 200, 20) : 20}px` }}
                        ></div>
                        <div className="mt-3 text-center">
                          <div className="font-bold text-lg md:text-xl text-gray-900">{stats.paymentMethods.esewa}</div>
                          <div className="text-xs md:text-sm text-gray-600 font-medium">eSewa</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center group">
                        <div 
                          className="bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg w-12 md:w-16 transition-all duration-700 hover:from-orange-600 hover:to-orange-500 shadow-lg"
                          style={{ height: `${stats.totalBookings > 0 ? Math.max((stats.paymentMethods.cash / stats.totalBookings) * 200, 20) : 20}px` }}
                        ></div>
                        <div className="mt-3 text-center">
                          <div className="font-bold text-lg md:text-xl text-gray-900">{stats.paymentMethods.cash}</div>
                          <div className="text-xs md:text-sm text-gray-600 font-medium">Cash</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Recent Bookings */}
              {stats.recentBookings.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-8">
                  <div className="p-6 md:p-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">Recent Bookings</h2>
                    </div>
                    
                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Time</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Team</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {stats.recentBookings.map((booking, index) => (
                            <tr key={booking.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {new Date(booking.booking_date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {booking.start_time} - {booking.end_time}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {booking.team_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {booking.is_matchmaking || booking.status === 'finding_team' ? 'Matchmaking' : 'Direct'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {booking.payment_method || 'Cash'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800 border border-green-200' :
                                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                  'bg-red-100 text-red-800 border border-red-200'
                                }`}>
                                  {booking.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-4">
                      {stats.recentBookings.map((booking) => (
                        <div key={booking.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900">{booking.team_name}</h3>
                              <p className="text-sm text-gray-600">{new Date(booking.booking_date).toLocaleDateString()}</p>
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-800 border border-green-200' :
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                              'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {booking.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Time:</span>
                              <span className="ml-1 text-gray-900">{booking.start_time} - {booking.end_time}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Type:</span>
                              <span className="ml-1 text-gray-900">{booking.is_matchmaking || booking.status === 'finding_team' ? 'Matchmaking' : 'Direct'}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-500">Payment:</span>
                              <span className="ml-1 text-gray-900">{booking.payment_method || 'Cash'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="bg-white rounded-2xl shadow-sm p-12 border border-gray-100">
                <MapPin className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-600 mb-2">No Court Added</h3>
                <p className="text-gray-500 mb-6">You need to add a court to start managing bookings and view statistics.</p>
                <a href="/courtmanager/addCourt" className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold">
                  Add Your First Court
                </a>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </>
  );
};

export default ManagerDashboard;