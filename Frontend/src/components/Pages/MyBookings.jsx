import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import AuthService from '../../services/AuthService';
import Header from '../Header';
import Footer from '../Footer';
import { isSaturday } from '../../utils/pricingUtils';
import { useSocket, useTimeSlots } from '../../hooks/useSocket';

// Helper function to convert 24-hour format to 12-hour format
const convertTo12Hour = (time24h) => {
  if (!time24h) return '';
  const [hours, minutes] = time24h.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  // Establish Socket.io connection
  const user = AuthService.getCurrentUser();
  const socket = useSocket(user?.token);

  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchBookings();
  }, [navigate]);

  // Real-time bookings update
  useTimeSlots((data) => {
    // Refresh bookings when any time slot is updated
    // This will catch matchmaking joins, cancellations, etc.
    fetchBookings();
  });

  const fetchBookings = async () => {
    try {
      const user = AuthService.getCurrentUser();
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/bookings/user`,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        }
      );

      if (response.data.success) {
        const sortedBookings = response.data.data.sort((a, b) => {
          const now = new Date();
          const dateTimeA = new Date(`${a.booking_date}T${a.end_time}`);
          const dateTimeB = new Date(`${b.booking_date}T${b.end_time}`);
          const isCompletedA = now > dateTimeA || a.status === 'completed';
          const isCompletedB = now > dateTimeB || b.status === 'completed';
          
          if (isCompletedA && !isCompletedB) return 1;
          if (!isCompletedA && isCompletedB) return -1;
          
          const startTimeA = new Date(`${a.booking_date}T${a.start_time}`);
          const startTimeB = new Date(`${b.booking_date}T${b.start_time}`);
          return startTimeA - startTimeB;
        });
        setBookings(sortedBookings);
        setFilteredBookings(sortedBookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    try {
      const user = AuthService.getCurrentUser();
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/bookings/${bookingId}/cancel`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        }
      );

      if (response.data.success) {
        await fetchBookings();
        alert('Booking cancelled successfully!');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking. Please try again.');
    }
  };

  const joinMatch = async (booking) => {
    try {
      const user = AuthService.getCurrentUser();
      const timeSlot = `${convertTo12Hour(booking.start_time)} - ${convertTo12Hour(booking.end_time)}`;
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/bookings/join-matchmaking`,
        { 
          court_id: booking.court_id,
          booking_date: booking.booking_date,
          time_slot: timeSlot,
          team_size: booking.court_type === '7v7' ? '7' : '5',
          name: user.full_name || 'Team Player',
          email: user.email,
          phone: user.phone_number || '9800000000'
        },
        {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        }
      );

      if (response.data.success) {
        alert(`Joined the match successfully! You will be playing against ${booking.team_name}.`);
        navigate('/courts');
      }
    } catch (error) {
      console.error('Error joining match:', error);
      alert('Failed to join matchmaking. Please try again.');
    }
  };

  const handleFilterChange = (filterType) => {
    setFilter(filterType);
    if (filterType === 'all') {
      setFilteredBookings(bookings);
    } else if (filterType === 'confirmed') {
      const now = new Date();
      setFilteredBookings(bookings.filter(b => {
        const bookingEndTime = new Date(`${b.booking_date}T${b.end_time}`);
        const isCompleted = now > bookingEndTime || b.status === 'completed';
        return b.status === 'confirmed' && !isCompleted;
      }));
    } else if (filterType === 'finding_team') {
      setFilteredBookings(bookings.filter(b => b.status === 'finding_team'));
    } else if (filterType === 'cancelled') {
      setFilteredBookings(bookings.filter(b => b.status === 'cancelled'));
    } else if (filterType === 'completed') {
      const now = new Date();
      const completedBookings = bookings.filter(b => {
        const bookingEndTime = new Date(`${b.booking_date}T${b.end_time}`);
        return (now > bookingEndTime || b.status === 'completed') && b.status !== 'cancelled';
      }).sort((a, b) => {
        const dateTimeA = new Date(`${a.booking_date}T${a.end_time}`);
        const dateTimeB = new Date(`${b.booking_date}T${b.end_time}`);
        return dateTimeB - dateTimeA;
      });
      setFilteredBookings(completedBookings);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'finding_team':
        return <Users className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'finding_team':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header/>
      <div className="container mx-auto px-8 py-8 md:px-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
            
            <select
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Bookings</option>
              <option value="confirmed">Confirmed</option>
              <option value="finding_team">Finding Team</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {filter === 'all' ? 'No bookings found' : `No ${filter} bookings found`}
              </h3>
              <p className="text-gray-500 mb-6">
                {filter === 'all' ? "You haven't made any bookings yet." : `No ${filter} bookings to display.`}
              </p>
              {filter === 'all' && (
                <button
                  onClick={() => navigate('/courts')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Browse Courts
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {booking.Court?.name || 'Court'}
                        </h3>
                        <div className="flex items-center text-gray-600 mb-1">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{booking.Court?.location}</span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {getStatusIcon(booking.status)}
                        <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status === 'finding_team' ? 'Finding Team' : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>
                          {new Date(booking.booking_date).toLocaleDateString()}
                          {isSaturday(booking.booking_date) && (
                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Saturday Rate
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{convertTo12Hour(booking.start_time)} - {convertTo12Hour(booking.end_time)}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{booking.court_type}</span>
                      </div>
                      {booking.is_matchmaking && (
                        <div className="flex items-center text-gray-600">
                          <Users className="w-4 h-4 mr-2" />
                          <span>vs {booking.opponent_team || booking.opponent_team_name || booking.matched_team || booking.matched_team_name || 'TBD'}</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          <p><strong>Team:</strong> {booking.team_name}</p>
                          <p><strong>Phone:</strong> {booking.contact_phone}</p>
                          <p><strong>Players:</strong> {booking.number_of_players}</p>
                          <p><strong>Price:</strong> Rs. {booking.total_price}</p>
                          {booking.payment_method && (
                            <p><strong>Payment:</strong> {booking.payment_method === 'esewa' ? 'eSewa (Advance Paid)' : booking.payment_method.charAt(0).toUpperCase() + booking.payment_method.slice(1)}</p>
                          )}
                          {booking.payment_status === 'advance_paid' && (
                            <p className="text-green-600 font-medium"><strong>Status:</strong> Advance paid, remaining at venue</p>
                          )}
                          {booking.status === 'finding_team' && (
                            <div>
                              <p className="text-yellow-600 font-medium">Finding team...</p>
                              {(booking.opponent_team || booking.matched_team) && (
                                <p><strong>Opponent:</strong> {booking.opponent_team || booking.matched_team}{(booking.opponent_phone || booking.matched_team_phone) ? ` (${booking.opponent_phone || booking.matched_team_phone})` : ''}</p>
                              )}
                            </div>
                          )}
                          {booking.is_matchmaking && (
                            <p><strong>Opponent:</strong> {booking.opponent_team || booking.opponent_team_name || booking.matched_team || booking.matched_team_name || 'Waiting for opponent...'}{(booking.opponent_phone || booking.matched_team_phone) ? ` (${booking.opponent_phone || booking.matched_team_phone})` : ''}</p>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          {(() => {
                            const bookingDateTime = new Date(`${booking.booking_date}T${booking.end_time}`);
                            const now = new Date();
                            const bookingStartTime = new Date(`${booking.booking_date}T${booking.start_time}`);
                            const timeDiff = bookingStartTime - now;
                            const hoursUntilBooking = timeDiff / (1000 * 60 * 60);
                            const isCompleted = now > bookingDateTime || booking.status === 'completed';
                            const canCancel = booking.status !== 'cancelled' && !isCompleted && hoursUntilBooking > 1 && (booking.status === 'finding_team' || !booking.is_matchmaking);
                            
                            if (isCompleted && booking.status !== 'cancelled') {
                              return (
                                <button
                                  className="bg-gray-400 text-white px-4 py-2 rounded-lg font-medium cursor-not-allowed"
                                  disabled
                                >
                                  Completed
                                </button>
                              );
                            } else if (booking.is_matchmaking && !isCompleted) {
                              return (
                                <button
                                  className="bg-gray-400 text-white px-4 py-2 rounded-lg font-medium cursor-not-allowed"
                                  disabled
                                  title="Matchmaking bookings cannot be cancelled"
                                >
                                  Cannot Cancel
                                </button>
                              );
                            } else if (canCancel) {
                              return (
                                <button
                                  onClick={() => {
                                    const message = booking.payment_method === 'esewa' || booking.payment_method === 'online' 
                                      ? 'Are you sure you want to cancel the booking?\nPlease be sure, There wont be any Refund of the advance payment.'
                                      : 'Are you sure you want to cancel the booking?';
                                    if (window.confirm(message)) {
                                      cancelBooking(booking.id);
                                    }
                                  }}
                                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                >
                                  Cancel Booking
                                </button>
                              );
                            } else if (hoursUntilBooking <= 1 && hoursUntilBooking >= 0) {
                              return (
                                <button
                                  className="bg-gray-400 text-white px-4 py-2 rounded-lg font-medium cursor-not-allowed"
                                  disabled
                                  title="Cannot cancel within 1 hour of start time"
                                >
                                  Cannot Cancel
                                </button>
                              );
                            }
                            return null;
                          })()
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer/>
    </div>
  );
};

export default MyBookings;