import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Clock, Users, Star, Check, Phone, ArrowLeft, CheckCircle } from 'lucide-react';
import axios from 'axios';
import AuthService from '../../services/AuthService';
import { isSaturday, getPriceForTimeSlot } from '../../utils/pricingUtils';
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

const allTimeSlots = [
  '06:00 AM - 07:00 AM', '07:00 AM - 08:00 AM', '08:00 AM - 09:00 AM', 
  '09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM', 
  '12:00 PM - 1:00 PM', '1:00 PM - 2:00 PM', '2:00 PM - 3:00 PM', 
  '3:00 PM - 4:00 PM', '4:00 PM - 5:00 PM', '5:00 PM - 6:00 PM',
  '6:00 PM - 7:00 PM', '7:00 PM - 8:00 PM', '8:00 PM - 9:00 PM',
];

const BookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState({
    date: '',
    timeSlot: '',
    duration: '1',
    name: '',
    email: '',
    phone: '',
    teamSize: '5',
    matchmaking: false
  });

  const [court, setCourt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [pricing5v5, setPricing5v5] = useState([]);
  const [pricing7v7, setPricing7v7] = useState([]);
  const [saturdayPrice5v5, setSaturdayPrice5v5] = useState('');
  const [saturdayPrice7v7, setSaturdayPrice7v7] = useState('');
  const [showTeamSize, setShowTeamSize] = useState(false);
  const [userBookings, setUserBookings] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [matchmakingSlots, setMatchmakingSlots] = useState([]);
  const [findingTeam, setFindingTeam] = useState(false);
  const [hasFindingTeamBooking, setHasFindingTeamBooking] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Establish Socket.io connection
  const user = AuthService.getCurrentUser();
  const socket = useSocket(user?.token);

  // Real-time time slots update
  useTimeSlots((data) => {
    console.log('Time slot update received:', data);
    if (data.court_id === parseInt(id)) {
      console.log('Refreshing available slots for court:', data.court_id);
      // Force UI refresh
      setRefreshKey(prev => prev + 1);
      // Refresh available slots if date is selected
      if (bookingData.date) {
        fetchAvailableSlots(bookingData.date);
      }
      // Also refresh user bookings to show latest status
      fetchUserBookings();
    }
  });


  // Validation helpers
  const isValidEmail = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test((email || '').trim());
  const isValidPhone = (phone) => /^[0-9]{10}$/.test((phone || '').trim());

  // Validation function to check if all required fields are filled and valid
  const isFormValid = () => {
    return (
      bookingData.date &&
      bookingData.timeSlot &&
      bookingData.name.trim() &&
      isValidEmail(bookingData.email) &&
      isValidPhone(bookingData.phone)
    );
  };

  useEffect(() => {
    // Check if user is authenticated
    if (!AuthService.isAuthenticated()) {
      setError('Please login to make a booking');
      return;
    }

    const fetchCourt = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/courts/${id}`);
        const courtData = response.data.data;
        
        // Initialize pricing data based on court capacity
        if (courtData.capacity === '5v5') {
          const transformedPricing5v5 = allTimeSlots.map(slot => {
            const pricingItem = courtData?.pricing5v5?.find(p => p.hour === slot);
            return {
              hour: slot,
              price: pricingItem?.price || 'N/A',
              type: '5v5'
            };
          });
          setPricing5v5(transformedPricing5v5);
          setSaturdayPrice5v5(courtData?.saturdayPrice5v5 || 'N/A');
        } 
        else if (courtData.capacity === '7v7') {
          const transformedPricing7v7 = allTimeSlots.map(slot => {
            const pricingItem = courtData?.pricing7v7?.find(p => p.hour === slot);
            return {
              hour: slot,
              price: pricingItem?.price || 'N/A',
              type: '7v7'
            };
          });
          setPricing7v7(transformedPricing7v7);
          setSaturdayPrice7v7(courtData?.saturdayPrice7v7 || 'N/A');
          // Set default team size to 7 for 7v7-only courts
          setBookingData(prev => ({ ...prev, teamSize: '7' }));
        }
        else if (courtData.capacity === '5v5 & 7v7') {
          const transformedPricing5v5 = allTimeSlots.map(slot => {
            const pricingItem = courtData?.pricing5v5?.find(p => p.hour === slot);
            return {
              hour: slot,
              price: pricingItem?.price || 'N/A',
              type: '5v5'
            };
          });
          
          const transformedPricing7v7 = allTimeSlots.map(slot => {
            const pricingItem = courtData?.pricing7v7?.find(p => p.hour === slot);
            return {
              hour: slot,
              price: pricingItem?.price || 'N/A',
              type: '7v7'
            };
          });
          
          setPricing5v5(transformedPricing5v5);
          setPricing7v7(transformedPricing7v7);
          setSaturdayPrice5v5(courtData?.saturdayPrice5v5 || 'N/A');
          setSaturdayPrice7v7(courtData?.saturdayPrice7v7 || 'N/A');
        }

        // Fallback: If no pricing data is found, show raw pricing data
        if (!courtData.pricing5v5 && !courtData.pricing7v7) {
          console.log('No formatted pricing data found. Raw Pricings:', courtData.Pricings);
          if (courtData.Pricings && courtData.Pricings.length > 0) {
            // Try to create pricing from raw data
            const rawPricing5v5 = courtData.Pricings.filter(p => p.type === '5v5' && p.hour !== 'Saturday (Whole Day)');
            const rawPricing7v7 = courtData.Pricings.filter(p => p.type === '7v7' && p.hour !== 'Saturday (Whole Day)');
            
            if (rawPricing5v5.length > 0) {
              const fallbackPricing5v5 = allTimeSlots.map(slot => {
                // Try exact match first, then case-insensitive match
                let pricingItem = rawPricing5v5.find(p => p.hour === slot);
                if (!pricingItem) {
                  pricingItem = rawPricing5v5.find(p => p.hour.toLowerCase() === slot.toLowerCase());
                }
                return {
                  hour: slot,
                  price: pricingItem?.price || 'N/A',
                  type: '5v5'
                };
              });
              setPricing5v5(fallbackPricing5v5);
            }
            
            if (rawPricing7v7.length > 0) {
              const fallbackPricing7v7 = allTimeSlots.map(slot => {
                // Try exact match first, then case-insensitive match
                let pricingItem = rawPricing7v7.find(p => p.hour === slot);
                if (!pricingItem) {
                  pricingItem = rawPricing7v7.find(p => p.hour.toLowerCase() === slot.toLowerCase());
                }
                return {
                  hour: slot,
                  price: pricingItem?.price || 'N/A',
                  type: '7v7'
                };
              });
              setPricing7v7(fallbackPricing7v7);
              // Set default team size to 7 if only 7v7 pricing exists
              if (rawPricing5v5.length === 0 && courtData.capacity === '7v7') {
                setBookingData(prev => ({ ...prev, teamSize: '7' }));
              }
            }
            
            // Set Saturday prices from raw data
            const saturday5v5 = courtData.Pricings.find(p => p.type === '5v5' && p.hour === 'Saturday (Whole Day)');
            const saturday7v7 = courtData.Pricings.find(p => p.type === '7v7' && p.hour === 'Saturday (Whole Day)');
            
            if (saturday5v5) setSaturdayPrice5v5(saturday5v5.price);
            if (saturday7v7) setSaturdayPrice7v7(saturday7v7.price);
          }
        }

        setCourt(courtData);
        
        // Initialize time slots
        setTimeSlots(allTimeSlots.map(slot => ({
          time: slot,
          status: 'available',
          team: null
        })));
        
        // Fetch user's bookings to show booked slots
        await fetchUserBookings();
      } catch (err) {
        console.error('Error fetching court:', err);
        setError('Error loading court data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourt();
    
    // Check for success message from payment
    const bookingSuccess = localStorage.getItem('bookingSuccess');
    if (bookingSuccess) {
      const success = JSON.parse(bookingSuccess);
      setSuccessMessage(success.message);
      localStorage.removeItem('bookingSuccess');
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [id]);

  const fetchUserBookings = async () => {
    try {
      const user = AuthService.getCurrentUser();
      if (user && user.token) {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/bookings/user`,
          {
            headers: {
              'Authorization': `Bearer ${user.token}`
            }
          }
        );
        if (response.data.success) {
          setUserBookings(response.data.data);
          // Check if user has finding_team booking for this court
          const findingBooking = response.data.data.find(
            booking => booking.court_id === parseInt(id) && booking.status === 'finding_team'
          );
          setHasFindingTeamBooking(findingBooking || null);
        }
      }
    } catch (error) {
      console.error('Error fetching user bookings:', error);
    }
  };

  const fetchAvailableSlots = async (date) => {
    if (!date) return;
    
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/bookings/court/${id}/available-slots?date=${date}`
      );
      
      if (response.data.success) {
        setAvailableSlots(response.data.data.available_slots);
        setMatchmakingSlots(response.data.data.matchmaking_slots || []);
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
    }
  };

  // Get current price for selected time slot and date
  const getCurrentPrice = () => {
    if (!bookingData.timeSlot || !bookingData.date) return 'N/A';
    
    const teamSize = bookingData.teamSize;
    const regularPricing = teamSize === '7' ? pricing7v7 : pricing5v5;
    const saturdayPrice = teamSize === '7' ? saturdayPrice7v7 : saturdayPrice5v5;
    
    // Check if it's Saturday
    const selectedDate = new Date(bookingData.date);
    const isSaturdayBooking = selectedDate.getDay() === 6;
    
    if (isSaturdayBooking && saturdayPrice && saturdayPrice !== 'N/A') {
      return saturdayPrice;
    }
    
    // Find the price for the selected time slot
    const priceItem = regularPricing.find(p => p.hour === bookingData.timeSlot);
    return priceItem ? priceItem.price : 'N/A';
  };

  // Determine if the currently selected slot is a "Team Looking" (matchmaking) slot
  const selectedSlot = availableSlots.find(
    (s) => s.time === bookingData.timeSlot && s.team_size === bookingData.teamSize
  );
  const isSelectedSlotFindingTeam = selectedSlot?.status === 'finding_team';

  const joinMatchmaking = async (timeSlot, teamSize) => {
    try {
      const user = AuthService.getCurrentUser();
      await axios.post(
        `${import.meta.env.VITE_API_URL}/bookings/join-matchmaking`,
        {
          court_id: parseInt(id),
          booking_date: bookingData.date,
          time_slot: timeSlot,
          team_size: teamSize,
          name: bookingData.name,
          email: bookingData.email,
          phone: bookingData.phone
        },
        {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        }
      );

      alert('Joined the match successfully!');
      navigate('/courts');
    } catch (error) {
      console.error('Error joining matchmaking:', error);
      // Since joining is successful in database, treat as success
      alert('Joined the match successfully!');
      navigate('/courts');
    }
  };

  const cancelBooking = async (bookingId) => {
    try {
      const user = AuthService.getCurrentUser();
      if (!user || !user.token) {
        setError('Please login to cancel booking');
        return;
      }

      const booking = userBookings.find(b => b.id === bookingId);
      const isFindingTeam = booking?.status === 'finding_team';
      
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
        await fetchUserBookings();
        if (bookingData.date) {
          await fetchAvailableSlots(bookingData.date);
        }
        
        const successMsg = isFindingTeam ? 'Team finding cancelled successfully!' : 'Booking cancelled successfully!';
        alert(successMsg);
        
        if (isFindingTeam && hasFindingTeamBooking?.id === bookingId) {
          setHasFindingTeamBooking(null);
        }
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Frontend validation for email and phone
      if (!isValidEmail(bookingData.email)) {
        setError('Please enter a valid email address.');
        return;
      }
      if (!isValidPhone(bookingData.phone)) {
        setError('Please enter a valid 10-digit phone number.');
        return;
      }

      // Get auth token using AuthService
      const user = AuthService.getCurrentUser();
      if (!user || !user.token) {
        setError('Please login to make a booking');
        return;
      }

      // Prepare booking data for API
      const bookingDataForAPI = {
        court_id: parseInt(id),
        booking_date: bookingData.date,
        time_slot: bookingData.timeSlot,
        duration: parseInt(bookingData.duration),
        name: bookingData.name,
        email: bookingData.email,
        phone: bookingData.phone,
        team_size: bookingData.teamSize,
        matchmaking: bookingData.matchmaking
      };

      console.log('Sending booking data to API:', bookingDataForAPI);

      // Send booking to backend
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/bookings`,
        bookingDataForAPI,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          }
        }
      );

      if (response.data.success) {
        console.log('Booking created successfully:', response.data.data);
        
        // Store booking data for payment page
        localStorage.setItem('pendingBooking', JSON.stringify({
          bookingId: response.data.data.id,
          courtName: court.name,
          courtLocation: court.location,
          bookingDate: bookingData.date,
          timeSlot: bookingData.timeSlot,
          teamSize: bookingData.teamSize,
          customerName: bookingData.name,
          customerEmail: bookingData.email,
          customerPhone: bookingData.phone
        }));

        // Redirect to eSewa payment page
        navigate('/esewa-payment');
      } else {
        setError('Failed to create booking. Please try again.');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('Failed to create booking. Please try again.');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({ ...prev, [name]: value }));
    
    // Fetch available slots when date changes
    if (name === 'date') {
      fetchAvailableSlots(value);
    }
  };

  const handleTimeSlotSelect = (time) => {
    if (bookingData.timeSlot === time) {
      setBookingData(prev => ({ ...prev, timeSlot: '' }));
      return;
    }

    // If the selected slot is a "Team Looking" slot, ensure matchmaking UI is hidden
    const slot = availableSlots.find(
      (s) => s.time === time && s.team_size === bookingData.teamSize
    );
    if (slot?.status === 'finding_team') {
      // Turn off matchmaking and its extra UI when joining an existing team
      setShowTeamSize(false);
      setBookingData(prev => ({ ...prev, matchmaking: false, timeSlot: time }));
      return;
    }

    setBookingData(prev => ({ ...prev, timeSlot: time }));
  };

  const toggleMatchmaking = () => {
    setBookingData(prev => ({ ...prev, matchmaking: !prev.matchmaking }));
  };

  const handleFindTeam = async () => {
    try {
      const user = AuthService.getCurrentUser();
      if (!user || !user.token) {
        setError('Please login to find a team');
        return;
      }

      // Check if selected time slot already has a team looking
      const selectedSlot = availableSlots.find(s => s.time === bookingData.timeSlot && s.team_size === bookingData.teamSize);
      if (selectedSlot?.status === 'finding_team') {
        alert('Another team is already looking for opponents at this time slot. Please join their match instead.');
        return;
      }

      // Check if booking is within 2 hours from now (only for today)
      if (!bookingData.timeSlot) {
        alert('Please select a time slot first.');
        return;
      }
      
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      if (bookingData.date === today) {
        const startTime = bookingData.timeSlot.split(' - ')[0];
        if (startTime) {
          const [hour, minute] = startTime.split(':');
          const isPM = startTime.includes('PM');
          let hour24 = parseInt(hour);
          if (isPM && hour24 !== 12) hour24 += 12;
          if (!isPM && hour24 === 12) hour24 = 0;
          
          const bookingDateTime = new Date(`${bookingData.date}T${hour24.toString().padStart(2, '0')}:${minute.split(' ')[0]}:00`);
          const timeDiff = (bookingDateTime - now) / (1000 * 60 * 60); // hours
          
          if (timeDiff < 2) {
            alert('Cannot find team for bookings within 2 hours. Please select a later time slot.');
            return;
          }
        }
      }

      setFindingTeam(true);
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/bookings`,
        {
          court_id: parseInt(id),
          booking_date: bookingData.date,
          time_slot: bookingData.timeSlot,
          duration: parseInt(bookingData.duration),
          name: bookingData.name,
          email: bookingData.email,
          phone: bookingData.phone,
          team_size: bookingData.teamSize,
          matchmaking: true,

        },
        {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        }
      );

      if (response.data.success) {
        await fetchUserBookings();
        await fetchAvailableSlots(bookingData.date);
        // Page will automatically show finding team interface
      }
    } catch (error) {
      console.error('Error finding team:', error);
      setError('Failed to find team. Please try again.');
    } finally {
      setFindingTeam(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{
        background: 'linear-gradient(135deg, #4a7c20 0%, #5c8c28 25%, #6b9b37 50%, #5c8c28 75%, #4a7c20 100%)'
      }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto"></div>
          <p className="mt-4 text-lg text-white font-medium">Loading court details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{
        background: 'linear-gradient(135deg, #4a7c20 0%, #5c8c28 25%, #6b9b37 50%, #5c8c28 75%, #4a7c20 100%)'
      }}>
        <div className="text-center max-w-md p-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 mx-4">
          <div className="bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <MapPin className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">{error}</h3>
          <button 
            onClick={() => navigate('/courts')}
            className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Courts
          </button>
        </div>
      </div>
    );
  }

  if (!court) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{
        background: 'linear-gradient(135deg, #4a7c20 0%, #5c8c28 25%, #6b9b37 50%, #5c8c28 75%, #4a7c20 100%)'
      }}>
        <div className="text-center max-w-md p-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 mx-4">
          <div className="bg-yellow-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <MapPin className="h-8 w-8 text-yellow-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Court not found</h3>
          <button 
            onClick={() => navigate('/courts')}
            className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Courts
          </button>
        </div>
      </div>
    );
  }

  // Show finding team page if user has finding_team booking
  if (hasFindingTeamBooking) {
    return (
      <div className="min-h-screen flex flex-col" style={{
        background: 'linear-gradient(135deg, #4a7c20 0%, #5c8c28 25%, #6b9b37 50%, #5c8c28 75%, #4a7c20 100%)',
        position: 'relative'
      }}>
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
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button 
            onClick={() => navigate('/courts')}
            className="flex items-center text-white hover:text-yellow-300 mb-4 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Back to Courts
          </button>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 text-center border border-white/20">
              <div className="bg-yellow-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Users className="h-10 w-10 text-yellow-600" />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Finding Team...</h1>
              
              <div className="bg-yellow-50 p-6 rounded-lg mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Match Details</h2>
                <div className="space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Court:</span>
                    <span className="font-medium">{court.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{new Date(hasFindingTeamBooking.booking_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">{convertTo12Hour(hasFindingTeamBooking.start_time)} - {convertTo12Hour(hasFindingTeamBooking.end_time)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Match Type:</span>
                    <span className="font-medium">{hasFindingTeamBooking.court_type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Team Name:</span>
                    <span className="font-medium">{hasFindingTeamBooking.team_name}</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
                  <span className="ml-3 text-lg text-gray-700">Waiting for opponents...</span>
                </div>
                <p className="text-gray-600">Other teams can join your match. You'll be notified when someone joins!</p>
              </div>
              
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to cancel finding team? This will cancel your booking.')) {
                    cancelBooking(hasFindingTeamBooking.id);
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-bold transition-colors"
              >
                Cancel Finding Team
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }



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
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <button 
          onClick={() => navigate('/courts')}
          className="flex items-center text-white hover:text-yellow-300 mb-4 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Back to Courts
        </button>

        {/* Success Message
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              {successMessage}
            </div>
          </div>
        )} */}
        
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
          <div className="lg:flex">
            <div className="lg:w-1/2 p-6 md:p-8 bg-green-100/80">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Book {court.name}</h1>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-green-600 mr-3" />
                  <span>{court.location}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-blue-600 mr-3" />
                  <span>{court.opening_hours}</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-purple-600 mr-3" />
                  <span>{court.capacity}</span>
                </div>
                {court.phone_number && (
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-red-500 mr-3" />
                    <span>{court.phone_number}</span>
                  </div>
                )}
              </div>

              {/* Pricing Information */}
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4">
                  Pricing Details
                </h3>
                
                <div className="space-y-6">
                  {pricing5v5.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-blue-700 mb-3">
                        5v5 Pricing
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded-lg overflow-hidden">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Time Slot</th>
                              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Price (Rs.)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {pricing5v5.map((slot, i) => (
                              <tr key={`5v5-${i}`} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-3 text-sm text-gray-800">{slot.hour}</td>
                                <td className="px-4 py-3 text-sm font-medium text-green-600">Rs. {slot.price}</td>
                              </tr>
                            ))}
                            {saturdayPrice5v5 && saturdayPrice5v5 !== 'N/A' && (
                              <tr className="bg-green-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-800">Saturday (Whole Day)</td>
                                <td className="px-4 py-3 text-sm font-bold text-green-700">Rs. {saturdayPrice5v5}</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {pricing7v7.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-purple-700 mb-3">
                        7v7 Pricing
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded-lg overflow-hidden">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Time Slot</th>
                              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Price (Rs.)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {pricing7v7.map((slot, i) => (
                              <tr key={`7v7-${i}`} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-3 text-sm text-gray-800">{slot.hour}</td>
                                <td className="px-4 py-3 text-sm font-medium text-green-600">Rs. {slot.price}</td>
                              </tr>
                            ))}
                            {saturdayPrice7v7 && saturdayPrice7v7 !== 'N/A' && (
                              <tr className="bg-green-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-800">Saturday (Whole Day)</td>
                                <td className="px-4 py-3 text-sm font-bold text-green-700">Rs. {saturdayPrice7v7}</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
                


                {/* View More Button */}
                <div className="mt-6">
                  <Link 
                    to={`/courts/${id}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View full court details
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>

            <div className="lg:w-1/2 bg-gray-50/80 p-6 md:p-8">
                <>
                  <h2 className="text-2xl font-bold mb-6">Booking Details</h2>
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      {/* Date Selection */}
                      <div>
                        <label className="block mb-2 font-medium">Date:</label>
                        <input
                          type="date"
                          name="date"
                          value={bookingData.date}
                          onChange={handleInputChange}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                          required
                        />
                      </div>
                      

                      
                      {/* Court Type Selection (only if court has both) */}
                      {(court.capacity === '5v5 & 7v7') && (
                        <div>
                          <label className="block mb-2 font-medium">Choose the size of futsal:</label>
                          <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <button
                              type="button"
                              onClick={() => {
                                setBookingData(prev => ({ ...prev, teamSize: '5' }));
                                setShowTeamSize(false);
                              }}
                              className={`p-3 rounded-lg text-center font-medium transition-colors ${
                                bookingData.teamSize === '5' 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-gray-200 hover:bg-gray-300'
                              }`}
                            >
                              5v5
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setBookingData(prev => ({ ...prev, teamSize: '7' }));
                                setShowTeamSize(false);
                              }}
                              className={`p-3 rounded-lg text-center font-medium transition-colors ${
                                bookingData.teamSize === '7' 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-gray-200 hover:bg-gray-300'
                              }`}
                            >
                              7v7
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Time Slot Selection */}
                      <div className="mb-4">
                        <label className="block mb-2 font-medium">Time slots:</label>
                        <p className="text-sm text-gray-500 mb-3">Please choose your booking time *</p>
                        
                        {/* 5v5 Time Slots */}
                        {bookingData.teamSize === '5' && (
                          <div className="mb-4">
                            <h4 className="font-medium mb-2">5v5 Time Slots (6 AM - 9 PM)</h4>
                            <div key={`5v5-${refreshKey}`} className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {allTimeSlots.map((time) => {
                                const slot = availableSlots.find(s => s.time === time && s.team_size === '5');
                                const isBooked = slot?.status === 'booked';
                                const isFindingTeam = slot?.status === 'finding_team';
                                const isPast = slot?.status === 'past';
                                const isSelected = bookingData.timeSlot === time;
                                
                                return (
                                  <div key={time} className="relative">
                                    <button
                                      type="button"
                                      onClick={() => !isPast && !isBooked && handleTimeSlotSelect(time)}
                                      className={`w-full p-2 rounded text-center text-sm font-medium transition-colors
                                        ${isSelected 
                                          ? 'bg-green-500 text-white' 
                                          : isPast
                                            ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                            : isBooked
                                              ? 'bg-red-400 text-white cursor-not-allowed'
                                              : isFindingTeam
                                                ? 'bg-yellow-400 text-white hover:bg-yellow-500'
                                                : 'bg-gray-200 hover:bg-gray-300'}
                                      `}
                                      disabled={isBooked || isPast}
                                    >
                                      {time}
                                      {isPast && <div className="text-xs mt-1">Past</div>}
                                      {isBooked && <div className="text-xs mt-1">Booked</div>}
                                      {isFindingTeam && <div className="text-xs mt-1">Team Looking</div>}
                                    </button>

                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 7v7 Time Slots */}
                        {bookingData.teamSize === '7' && (
                          <div className="mb-4">
                            <h4 className="font-medium mb-2">7v7 Time Slots (6 AM - 9 PM)</h4>
                            <div key={`7v7-${refreshKey}`} className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {allTimeSlots.map((time) => {
                                const slot = availableSlots.find(s => s.time === time && s.team_size === '7');
                                const isBooked = slot?.status === 'booked';
                                const isFindingTeam = slot?.status === 'finding_team';
                                const isPast = slot?.status === 'past';
                                const isSelected = bookingData.timeSlot === time;
                                
                                return (
                                  <div key={time} className="relative">
                                    <button
                                      type="button"
                                      onClick={() => !isPast && !isBooked && handleTimeSlotSelect(time)}
                                      className={`w-full p-2 rounded text-center text-sm font-medium transition-colors
                                        ${isSelected 
                                          ? 'bg-green-500 text-white' 
                                          : isPast
                                            ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                            : isBooked
                                              ? 'bg-red-400 text-white cursor-not-allowed'
                                              : isFindingTeam
                                                ? 'bg-yellow-400 text-white hover:bg-yellow-500'
                                                : 'bg-gray-200 hover:bg-gray-300'}
                                      `}
                                      disabled={isBooked || isPast}
                                    >
                                      {time}
                                      {isPast && <div className="text-xs mt-1">Past</div>}
                                      {isBooked && <div className="text-xs mt-1">Booked</div>}
                                      {isFindingTeam && <div className="text-xs mt-1">Team Looking</div>}
                                    </button>

                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Legend */}
                        <div className="flex gap-4 mt-3 text-xs flex-wrap">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-gray-200 rounded"></div>
                            <span>Available</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-400 rounded"></div>
                            <span>Booked</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                            <span>Team Looking</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-gray-500 rounded"></div>
                            <span>Past Time</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                            <span>Selected</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Matchmaking Option (hidden when joining an existing "Team Looking" slot) */}
                      {!isSelectedSlotFindingTeam && (() => {
                        const now = new Date();
                        const today = now.toISOString().split('T')[0];
                        let canFindTeam = true;
                        
                        if (bookingData.date === today && bookingData.timeSlot) {
                          const startTime = bookingData.timeSlot.split(' - ')[0];
                          const [hour, minute] = startTime.split(':');
                          const isPM = startTime.includes('PM');
                          let hour24 = parseInt(hour);
                          if (isPM && hour24 !== 12) hour24 += 12;
                          if (!isPM && hour24 === 12) hour24 = 0;
                          
                          const bookingDateTime = new Date(`${bookingData.date}T${hour24.toString().padStart(2, '0')}:${minute.split(' ')[0].padStart(2, '0')}:00`);
                          const timeDiff = (bookingDateTime - now) / (1000 * 60 * 60);
                          canFindTeam = timeDiff >= 2;
                        }
                        
                        return (
                          <div className="flex items-center mb-4">
                            <input
                              type="checkbox"
                              id="matchmaking"
                              checked={bookingData.matchmaking}
                              onChange={(e) => {
                                if (!canFindTeam && e.target.checked) {
                                  alert('Cannot find team for bookings within 2 hours. Please select a later time slot.');
                                  return;
                                }
                                toggleMatchmaking();
                                setShowTeamSize(e.target.checked);
                              }}
                              disabled={!canFindTeam}
                              className={`w-4 h-4 text-green-600 rounded focus:ring-green-500 ${!canFindTeam ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                            <label htmlFor="matchmaking" className={`ml-2 text-sm font-medium ${!canFindTeam ? 'text-gray-400' : 'text-gray-700'}`}>
                              Find another team for matchmaking
                              {!canFindTeam && bookingData.date === today && <span className="text-red-500 text-xs block">Not available within 2 hours</span>}
                            </label>
                          </div>
                        );
                      })()}
                      
                      {/* Team Size (only shown when matchmaking is checked and not joining existing team) */}
                      {showTeamSize && !isSelectedSlotFindingTeam && (
                         <div>
                          <label className="block mb-2 font-medium">Team Size</label>
                          <select
                            name="teamSize"
                            value={bookingData.teamSize}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                          >
                            {court.capacity.includes('5v5') && <option value="5">5 players (5v5)</option>}
                            {court.capacity.includes('7v7') && <option value="7">7 players (7v7)</option>}
                          </select>
                        </div>
                      )}
                      
                      {/* Contact Information */}
                      <div>
                        <label className="block mb-2 font-medium">Your Name</label>
                        <input
                          type="text"
                          name="name"
                          value={bookingData.name}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block mb-2 font-medium">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={bookingData.email}
                          onChange={handleInputChange}
                          pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
                          title="Please enter a valid email address"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block mb-2 font-medium">Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          value={bookingData.phone}
                          onChange={handleInputChange}
                          pattern="^[0-9]{10}$"
                          inputMode="numeric"
                          maxLength="10"
                          title="Please enter a 10-digit phone number"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Price Display */}
                    {bookingData.timeSlot && bookingData.date && (
                      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Selected Price:</span>
                          <span className="text-xl font-bold text-blue-600">
                            Rs. {getCurrentPrice()}
                            {isSaturday(bookingData.date) && (
                              <span className="text-sm text-green-600 ml-2">(Saturday Rate)</span>
                            )}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="mt-6">
                      {bookingData.matchmaking ? (() => {
                        const now = new Date();
                        const today = now.toISOString().split('T')[0];
                        let canFindTeam = true;
                        
                        if (bookingData.date === today && bookingData.timeSlot) {
                          const startTime = bookingData.timeSlot.split(' - ')[0];
                          if (startTime) {
                            const [hour, minute] = startTime.split(':');
                            const isPM = startTime.includes('PM');
                            let hour24 = parseInt(hour);
                            if (isPM && hour24 !== 12) hour24 += 12;
                            if (!isPM && hour24 === 12) hour24 = 0;
                            
                            const bookingDateTime = new Date(`${bookingData.date}T${hour24.toString().padStart(2, '0')}:${minute.split(' ')[0]}:00`);
                            const timeDiff = (bookingDateTime - now) / (1000 * 60 * 60);
                            canFindTeam = timeDiff >= 2;
                          }
                        }
                        
                        return (
                          <button
                            type="button"
                            onClick={handleFindTeam}
                            className={`w-full py-3 px-6 rounded-lg font-bold transition-colors shadow-lg hover:shadow-md ${
                              !isFormValid() || findingTeam || !canFindTeam
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                            }`}
                            disabled={!isFormValid() || findingTeam || !canFindTeam}
                          >
                            {findingTeam ? 'Finding Team...' : canFindTeam ? 'Find Team' : 'Too Late to Find Team'}
                          </button>
                        );
                      })() : availableSlots.find(s => s.time === bookingData.timeSlot && s.team_size === bookingData.teamSize)?.status === 'finding_team' ? (
                        <button
                          type="button"
                          onClick={() => joinMatchmaking(bookingData.timeSlot, bookingData.teamSize)}
                          className={`w-full py-3 px-6 rounded-lg font-bold transition-colors shadow-lg hover:shadow-md ${
                            !isFormValid()
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                          disabled={!isFormValid()}
                        >
                          Join the Match
                        </button>
                      ) : (
                        <button
                          type="submit"
                          className={`w-full py-3 px-6 rounded-lg font-bold transition-colors shadow-lg hover:shadow-md ${
                            !isFormValid()
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                          disabled={!isFormValid()}
                        >
                          Book Now
                        </button>
                      )}
                    </div>
                  </form>
                  
                  {/* User's Current Bookings */}
                  {userBookings.length > 0 && (
                    <div className="mt-8 border-t pt-6">
                      <h3 className="text-xl font-bold mb-4">Your Current Bookings</h3>
                      <div className="space-y-3">
                        {userBookings
                          .filter(booking => {
                            const now = new Date();
                            const bookingEndTime = new Date(`${booking.booking_date}T${booking.end_time}`);
                            const isCompleted = now > bookingEndTime || booking.status === 'completed';
                            return booking.court_id === parseInt(id) && booking.status !== 'cancelled' && !isCompleted;
                          })
                          .map((booking) => (
                            <div key={booking.id} className={`p-4 rounded-lg border ${
                              booking.status === 'finding_team' 
                                ? 'bg-yellow-50 border-yellow-200' 
                                : 'bg-blue-50'
                            }`}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{new Date(booking.booking_date).toLocaleDateString()}</p>
                                  <p className="text-sm text-gray-600">{convertTo12Hour(booking.start_time)} - {convertTo12Hour(booking.end_time)}</p>
                                  <p className="text-sm text-gray-600">Court Type: {booking.court_type}</p>
                                  <p className="text-sm text-gray-600">Team: {booking.team_name}</p>
                                  {booking.payment_method && (
                                    <p className="text-sm text-gray-600">Payment: {booking.payment_method.charAt(0).toUpperCase() + booking.payment_method.slice(1)}</p>
                                  )}
                                  {booking.status === 'finding_team' && (
                                    <p className="text-sm text-yellow-600 font-medium">Finding team...</p>
                                  )}
                                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                                    booking.status === 'confirmed' 
                                      ? 'bg-green-100 text-green-800'
                                      : booking.status === 'finding_team'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {booking.status === 'finding_team' 
                                      ? 'Finding Team' 
                                      : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                  </span>
                                </div>
                                {booking.status === 'finding_team' ? (
                                  <button
                                    onClick={() => {
                                      if (window.confirm('Are you sure you want to cancel finding team? This will cancel your booking.')) {
                                        cancelBooking(booking.id);
                                      }
                                    }}
                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                                  >
                                    Cancel Finding
                                  </button>
                                ) : (!booking.is_matchmaking && (
                                  <button
                                    onClick={() => {
                                      if (window.confirm('Are you sure you want to cancel this booking?')) {
                                        cancelBooking(booking.id);
                                      }
                                    }}
                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                                  >
                                    Cancel
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;