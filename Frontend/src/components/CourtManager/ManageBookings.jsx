import React, { useEffect, useState } from 'react';
import Header from '../Header';
import Footer from '../Footer';
import Sidebar from '../Sidebar';
import { Calendar } from 'lucide-react';
import axios from 'axios';
import { useSocket, useTimeSlots } from '../../hooks/useSocket';
import AuthService from '../../services/AuthService';

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [courtId, setCourtId] = useState(null);

  // Establish Socket.io connection
  const user = AuthService.getCurrentUser();
  const socket = useSocket(user?.token);

  const convertTo12Hour = (time24h) => {
    const [hours, minutes] = time24h.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const groupMatchmakingBookings = (bookings) => {
    const matchmakingGroups = {};
    const regularBookings = [];
    
    bookings.forEach(booking => {
      if (booking.is_matchmaking && booking.status === 'confirmed') {
        const key = `${booking.booking_date}-${booking.start_time}-${booking.end_time}-${booking.court_type}`;
        if (!matchmakingGroups[key]) {
          matchmakingGroups[key] = [];
        }
        matchmakingGroups[key].push(booking);
      } else {
        regularBookings.push(booking);
      }
    });
    
    const groupedBookings = [];
    Object.values(matchmakingGroups).forEach(group => {
      if (group.length === 2) {
        groupedBookings.push({ type: 'matchmaking', bookings: group });
      } else {
        groupedBookings.push(...group.map(b => ({ type: 'single', booking: b })));
      }
    });
    
    groupedBookings.push(...regularBookings.map(b => ({ type: 'single', booking: b })));
    return groupedBookings;
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const token = user?.token;
        
        if (!token) return;
        
        // Get court details first
        const courtRes = await axios.get(`${import.meta.env.VITE_API_URL}/courts/manager`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const courtData = courtRes.data.success ? courtRes.data.data : courtRes.data;
        
        if (courtData?.id) {
          setCourtId(courtData.id);
          const bookingsRes = await axios.get(`${import.meta.env.VITE_API_URL}/bookings/court/${courtData.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (bookingsRes.data.success) {
            const sortedBookings = (bookingsRes.data.data || []).sort((a, b) => {
              const dateA = new Date(`${a.booking_date}T${a.start_time}`);
              const dateB = new Date(`${b.booking_date}T${b.start_time}`);
              return dateA - dateB;
            });
            setBookings(sortedBookings);
            // Filter bookings for today's date initially
            const todayBookings = sortedBookings.filter(booking => booking.booking_date === selectedDate);
            setFilteredBookings(groupMatchmakingBookings(todayBookings));
          }
        }
      } catch (err) {
        console.error('Failed to fetch bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Real-time bookings update
  useTimeSlots((data) => {
    if (data.court_id === courtId) {
      // Refetch bookings when time slots are updated
      const fetchUpdatedBookings = async () => {
        try {
          const userStr = localStorage.getItem('user');
          const user = userStr ? JSON.parse(userStr) : null;
          const token = user?.token;
          
          if (!token || !courtId) return;
          
          const bookingsRes = await axios.get(`${import.meta.env.VITE_API_URL}/bookings/court/${courtId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (bookingsRes.data.success) {
            const sortedBookings = (bookingsRes.data.data || []).sort((a, b) => {
              const dateA = new Date(`${a.booking_date}T${a.start_time}`);
              const dateB = new Date(`${b.booking_date}T${b.start_time}`);
              return dateA - dateB;
            });
            setBookings(sortedBookings);
            // Update filtered bookings based on current selected date
            const filtered = selectedDate ? 
              sortedBookings.filter(booking => booking.booking_date === selectedDate) : 
              sortedBookings;
            setFilteredBookings(groupMatchmakingBookings(filtered));
          }
        } catch (err) {
          console.error('Failed to fetch updated bookings:', err);
        }
      };
      
      fetchUpdatedBookings();
    }
  });

  const handleDateFilter = (date) => {
    setSelectedDate(date);
    if (date) {
      const filtered = bookings.filter(booking => booking.booking_date === date);
      setFilteredBookings(groupMatchmakingBookings(filtered));
    } else {
      setFilteredBookings(groupMatchmakingBookings(bookings));
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex md:flex-row flex-col relative bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
          <Sidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg text-gray-700 font-medium">Loading bookings...</p>
            </div>
          </main>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="flex md:flex-row flex-col relative bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 max-w-5xl">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-blue-100 rounded-xl mr-4">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-bold text-gray-900">Manage Bookings</h1>
                <p className="text-gray-600 mt-1">View and track all court bookings and matches</p>
              </div>
            </div>
          </div>
          
          {/* Date Filter */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Filter by Date:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <div className="text-sm text-gray-500">
                Showing {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          
          {filteredBookings.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white rounded-2xl shadow-sm p-12 border border-gray-100">
                <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-600 mb-2">
                  {selectedDate ? 'No bookings found' : 'Select a date'}
                </h3>
                <p className="text-gray-500">
                  {selectedDate ? 'No bookings found for the selected date.' : 'Please select a date to view bookings.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Team</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Court Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBookings.map((item, index) => {
                      if (item.type === 'matchmaking') {
                        const [team1, team2] = item.bookings;
                        return (
                          <tr key={`match-${index}`} className="bg-gradient-to-r from-orange-50 to-yellow-50 hover:from-orange-100 hover:to-yellow-100 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {new Date(team1.booking_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {convertTo12Hour(team1.start_time)} - {convertTo12Hour(team1.end_time)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-blue-600">{team1.team_name}</span>
                                <span className="text-red-500 font-bold text-xs">VS</span>
                                <span className="font-semibold text-green-600">{team2.team_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">{team1.court_type}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="text-xs space-y-1">
                                <div className="font-medium">{team1.contact_phone}</div>
                                <div className="font-medium">{team2.contact_phone}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {team1.payment_method || 'Cash'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                                Matchmaking
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              Rs. {team1.total_price}
                            </td>
                          </tr>
                        );
                      } else {
                        const booking = item.booking;
                        return (
                          <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {new Date(booking.booking_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {convertTo12Hour(booking.start_time)} - {convertTo12Hour(booking.end_time)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {booking.team_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">{booking.court_type}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {booking.contact_phone}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {booking.payment_method || 'Cash'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${
                                booking.status === 'confirmed' ? 'bg-green-100 text-green-800 border-green-200' :
                                booking.status === 'finding_team' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                booking.status === 'pending' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                'bg-red-100 text-red-800 border-red-200'
                              }`}>
                                {booking.status === 'finding_team' ? 'Finding Team' : 
                                 booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              Rs. {booking.total_price}
                            </td>
                          </tr>
                        );
                      }
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Card View */}
              <div className="lg:hidden p-4 space-y-4">
                {filteredBookings.map((item, index) => {
                  if (item.type === 'matchmaking') {
                    const [team1, team2] = item.bookings;
                    return (
                      <div key={`match-${index}`} className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 border-2 border-orange-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-blue-600 text-sm">{team1.team_name}</span>
                            <span className="text-red-500 font-bold text-xs">VS</span>
                            <span className="font-semibold text-green-600 text-sm">{team2.team_name}</span>
                          </div>
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-semibold">
                            Matchmaking
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="text-gray-500">Date:</span> <span className="font-medium">{new Date(team1.booking_date).toLocaleDateString()}</span></div>
                          <div><span className="text-gray-500">Time:</span> <span className="font-medium">{convertTo12Hour(team1.start_time)} - {convertTo12Hour(team1.end_time)}</span></div>
                          <div><span className="text-gray-500">Court:</span> <span className="font-medium">{team1.court_type}</span></div>
                          <div><span className="text-gray-500">Price:</span> <span className="font-semibold text-green-600">Rs. {team1.total_price}</span></div>
                          <div className="col-span-2"><span className="text-gray-500">Contacts:</span> <span className="font-medium">{team1.contact_phone}, {team2.contact_phone}</span></div>
                        </div>
                      </div>
                    );
                  } else {
                    const booking = item.booking;
                    return (
                      <div key={booking.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{booking.team_name}</h3>
                            <p className="text-sm text-gray-600">{new Date(booking.booking_date).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'finding_team' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {booking.status === 'finding_team' ? 'Finding Team' : 
                             booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="text-gray-500">Time:</span> <span className="font-medium">{convertTo12Hour(booking.start_time)} - {convertTo12Hour(booking.end_time)}</span></div>
                          <div><span className="text-gray-500">Court:</span> <span className="font-medium">{booking.court_type}</span></div>
                          <div><span className="text-gray-500">Contact:</span> <span className="font-medium">{booking.contact_phone}</span></div>
                          <div><span className="text-gray-500">Price:</span> <span className="font-semibold text-green-600">Rs. {booking.total_price}</span></div>
                          <div className="col-span-2"><span className="text-gray-500">Payment:</span> <span className="font-medium">{booking.payment_method || 'Cash'}</span></div>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
};

export default ManageBookings;