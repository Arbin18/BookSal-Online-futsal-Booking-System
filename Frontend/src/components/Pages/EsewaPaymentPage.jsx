import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, Users, CreditCard, AlertCircle } from 'lucide-react';
import axios from 'axios';
import AuthService from '../../services/AuthService';
import { isSaturday } from '../../utils/pricingUtils';

const EsewaPaymentPage = () => {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('esewa');
  const [pricing, setPricing] = useState({ total: 0, advance: 50 });

  useEffect(() => {
    // Check if user is authenticated
    if (!AuthService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Get booking data from localStorage
    const storedBooking = localStorage.getItem('pendingBooking');
    if (!storedBooking) {
      navigate('/courts');
      return;
    }

    try {
      const parsedBooking = JSON.parse(storedBooking);
      setBookingData(parsedBooking);
      fetchPricing(parsedBooking);
    } catch (error) {
      console.error('Error parsing booking data:', error);
      navigate('/courts');
    }
  }, [navigate]);

  const fetchPricing = async (booking) => {
    try {
      const user = AuthService.getCurrentUser();
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/bookings/${booking.bookingId}`,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        }
      );

      if (response.data.success) {
        const totalPrice = response.data.data.total_price;
        setPricing({ 
          total: totalPrice, 
          advance: 50
        });
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
      // Keep existing pricing if fetch fails
    }
  };

  const handleEsewaPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const user = AuthService.getCurrentUser();
      if (!user || !user.token) {
        setError('Please login to complete payment');
        return;
      }

      // Initiate eSewa payment
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/esewa/initiate`,
        { bookingId: bookingData.bookingId },
        {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        }
      );

      if (response.data.success) {
        const { form_url, payment_data } = response.data.data;
        
        // Create and submit form to eSewa
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = form_url;
        
        // Add all payment data as hidden inputs
        Object.keys(payment_data).forEach(key => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = payment_data[key];
          form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
      } else {
        setError('Failed to initiate payment. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.response?.data?.error || 'Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCashPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const user = AuthService.getCurrentUser();
      if (!user || !user.token) {
        setError('Please login to complete booking');
        return;
      }

      // Update booking status to confirmed with cash payment
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/bookings/${bookingData.bookingId}/status`,
        {
          status: 'confirmed',
          payment_method: 'cash'
        },
        {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        }
      );

      if (response.data.success) {
        // Clear the pending booking from localStorage
        localStorage.removeItem('pendingBooking');
        
        // Show success alert
        alert('Booking confirmed successfully! Please pay at the venue after playing.');
        
        // Store success message
        localStorage.setItem('bookingSuccess', JSON.stringify({
          message: 'Booking confirmed! Please pay at the venue after playing.',
          bookingId: bookingData.bookingId
        }));
        
        navigate('/courts');
      } else {
        setError('Failed to confirm booking. Please try again.');
      }
    } catch (error) {
      console.error('Booking error:', error);
      setError(error.response?.data?.error || 'Failed to confirm booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!bookingData) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{
        background: 'linear-gradient(135deg, #4a7c20 0%, #5c8c28 25%, #6b9b37 50%, #5c8c28 75%, #4a7c20 100%)'
      }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto"></div>
          <p className="mt-4 text-lg text-white font-medium">Loading payment details...</p>
        </div>
      </div>
    );
  }

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
          onClick={() => navigate(-1)}
          className="flex items-center text-white hover:text-yellow-300 mb-4 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Back
        </button>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
            <div className="lg:flex">
              {/* Booking Summary */}
              <div className="lg:w-1/2 p-6 md:p-8 bg-blue-50/80">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Booking Summary</h1>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-blue-600 mr-3" />
                    <div>
                      <p className="font-semibold">{bookingData.courtName}</p>
                      <p className="text-sm text-gray-600">{bookingData.courtLocation}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-green-600 mr-3" />
                    <span>
                      {new Date(bookingData.bookingDate).toLocaleDateString()}
                      {isSaturday(bookingData.bookingDate) && (
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Saturday Rate
                        </span>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-purple-600 mr-3" />
                    <span>{bookingData.timeSlot}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-orange-600 mr-3" />
                    <span>{bookingData.teamSize}v{bookingData.teamSize}</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border mb-6">
                  <h3 className="font-semibold mb-3">Customer Details</h3>
                  <p className="text-sm text-gray-600">{bookingData.customerName}</p>
                  <p className="text-sm text-gray-600">{bookingData.customerEmail}</p>
                  <p className="text-sm text-gray-600">{bookingData.customerPhone}</p>
                </div>

                {/* Pricing Information */}
                <div className="bg-blue-100 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Amount:</span>
                      <span className="text-lg font-bold text-blue-600">Rs. {pricing.total}</span>
                    </div>
                    {paymentMethod === 'esewa' && (
                      <>
                        <div className="flex justify-between items-center text-sm">
                          <span>Advance Payment (eSewa):</span>
                          <span className="font-medium text-green-600">Rs. {pricing.advance}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span>Remaining (At Venue):</span>
                          <span className="font-medium text-orange-600">Rs. {pricing.total - pricing.advance}</span>
                        </div>
                      </>
                    )}
                    {paymentMethod === 'cash' && (
                      <div className="flex justify-between items-center text-sm">
                        <span>Payment at Venue:</span>
                        <span className="font-medium text-green-600">Rs. {pricing.total}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Options */}
              <div className="lg:w-1/2 p-6 md:p-8">
                <h2 className="text-2xl font-bold mb-6">Choose Payment Method</h2>

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {error}
                  </div>
                )}

                <div className="space-y-4 mb-6">
                  {/* eSewa Payment Option */}
                  <div 
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      paymentMethod === 'esewa' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod('esewa')}
                  >
                    <div className="flex items-center mb-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="esewa"
                        checked={paymentMethod === 'esewa'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex items-center">
                        <img 
                          src="https://esewa.com.np/common/images/esewa-logo.png" 
                          alt="eSewa" 
                          className="h-8 mr-3"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'inline';
                          }}
                        />
                        <CreditCard className="w-6 h-6 text-green-600 mr-2 hidden" />
                        <span className="font-semibold text-lg">eSewa Payment</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 ml-6">
                      Pay Rs. {pricing.advance} advance now through eSewa, remaining Rs. {pricing.total - pricing.advance} at venue after playing
                    </p>
                    <div className="ml-6 mt-2">
                      <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        Secure & Fast
                      </span>
                    </div>
                  </div>

                  {/* Cash Payment Option */}
                  <div 
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      paymentMethod === 'cash' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <div className="flex items-center mb-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex items-center">
                        <span className="w-6 h-6 mr-2 text-blue-600 font-bold text-lg">₨</span>
                        <span className="font-semibold text-lg">Cash Payment</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 ml-6">
                      Pay full amount Rs. {pricing.total} at the venue after playing
                    </p>
                    <div className="ml-6 mt-2">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        Pay Later
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Button */}
                <div className="mt-8">
                  {paymentMethod === 'esewa' ? (
                    <button
                      onClick={handleEsewaPayment}
                      disabled={loading}
                      className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-colors shadow-lg ${
                        loading
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        'Pay Rs. 50 with eSewa'
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleCashPayment}
                      disabled={loading}
                      className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-colors shadow-lg ${
                        loading
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Confirming...
                        </div>
                      ) : (
                        'Confirm Booking (Pay at Venue)'
                      )}
                    </button>
                  )}
                </div>

                {/* Security Notice */}
                <div className="text-center text-sm text-gray-500 mt-4">
                  <div className="flex items-center justify-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Your payment is secure and encrypted
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EsewaPaymentPage;