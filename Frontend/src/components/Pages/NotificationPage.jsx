import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Calendar, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import AuthService from '../../services/AuthService';
import Header from '../Header';
import Footer from '../Footer';
import { isSaturday } from '../../utils/pricingUtils';
import { useNotifications } from '../../hooks/useSocket';

const NotificationPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchNotifications();
    markAllAsRead();
    
    // Reset notification count in header when page loads
    window.dispatchEvent(new CustomEvent('resetNotificationCount'));
  }, [navigate]);

  // Handle real-time notifications
  const handleNewNotification = (notification) => {
    const formattedNotification = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      timestamp: new Date(notification.created_at || new Date()),
      read: false
    };
    
    setNotifications(prev => [formattedNotification, ...prev]);
    setFilteredNotifications(prev => {
      if (filter === 'all') {
        return [formattedNotification, ...prev];
      } else if (filter === 'confirmed' && 
        (notification.type === 'booking_confirmed' || 
         notification.type === 'team_joined' || 
         notification.type === 'payment_success')) {
        return [formattedNotification, ...prev];
      } else if (filter === 'cancelled' && notification.type === 'booking_cancelled') {
        return [formattedNotification, ...prev];
      }
      return prev;
    });
  };

  useNotifications(handleNewNotification);

  const fetchNotifications = async () => {
    try {
      const user = AuthService.getCurrentUser();
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/notifications`,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        }
      );

      if (response.data.success) {
        const formattedNotifications = response.data.data.map(notification => ({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          date: notification.Booking?.booking_date,
          time: notification.Booking ? `${convertTo12Hour(notification.Booking.start_time)} - ${convertTo12Hour(notification.Booking.end_time)}` : null,
          courtName: notification.Booking?.Court?.name,
          opponentName: notification.opponent_name,
          amount: notification.Booking?.total_price ? `Rs. ${notification.Booking.total_price}` : null,
          timestamp: new Date(notification.created_at),
          read: notification.is_read
        }));
        setNotifications(formattedNotifications);
        setFilteredNotifications(formattedNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType) => {
    setFilter(filterType);
    if (filterType === 'all') {
      setFilteredNotifications(notifications);
    } else if (filterType === 'confirmed') {
      setFilteredNotifications(notifications.filter(n => 
        n.type === 'booking_confirmed' || 
        n.type === 'team_joined' || 
        n.type === 'payment_success'
      ));
    } else if (filterType === 'cancelled') {
      setFilteredNotifications(notifications.filter(n => n.type === 'booking_cancelled'));
    }
  };

  // Helper function to convert 24-hour format to 12-hour format
  const convertTo12Hour = (time24h) => {
    if (!time24h) return '';
    const [hours, minutes] = time24h.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_confirmed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'team_joined':
        return <Users className="w-6 h-6 text-green-600" />;
      case 'payment_success':
        return <CheckCircle className="w-6 h-6 text-blue-500" />;
      case 'booking_cancelled':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <AlertCircle className="w-6 h-6 text-gray-500" />;
    }
  };

  const markAllAsRead = async () => {
    try {
      const user = AuthService.getCurrentUser();
      await axios.put(
        `${import.meta.env.VITE_API_URL}/notifications/mark-all-read`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        }
      );
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-8 py-8 md:px-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Bell className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            </div>
            
            <select
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Notifications</option>
              <option value="confirmed">Confirmation Notifications</option>
              <option value="cancelled">Cancellation Notifications</option>
            </select>
          </div>

          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {filter === 'all' ? 'No notifications' : `No ${filter} notifications`}
              </h3>
              <p className="text-gray-500">
                {filter === 'all' ? "You're all caught up!" : `No ${filter} notifications found.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                    notification.read ? 'border-gray-300' : 'border-blue-500'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-4">{notification.message}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {notification.date && (
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>
                              {new Date(notification.date).toLocaleDateString()}
                              {isSaturday(notification.date) && (
                                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  Saturday Rate
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                        
                        {notification.time && (
                          <div className="flex items-center text-gray-600">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>{notification.time}</span>
                          </div>
                        )}
                        
                        {notification.courtName && (
                          <div className="flex items-center text-gray-600">
                            <span className="font-medium">Court: {notification.courtName}</span>
                          </div>
                        )}
                        
                        {notification.opponentName && (
                          <div className="flex items-center text-gray-600">
                            <Users className="w-4 h-4 mr-2" />
                            <span>Opponent: {notification.opponentName}</span>
                          </div>
                        )}
                        
                        {notification.amount && (
                          <div className="flex items-center text-gray-600">
                            <span className="font-medium">Amount: {notification.amount}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotificationPage;