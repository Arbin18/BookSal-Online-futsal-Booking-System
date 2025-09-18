import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import axios from 'axios';
import AuthService from '../../services/AuthService';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);

  const createEsewaBookingNotification = async (transactionCode) => {
    try {
      const user = AuthService.getCurrentUser();
      const storedBooking = localStorage.getItem('pendingBooking');
      
      if (user && user.token && storedBooking) {
        const bookingData = JSON.parse(storedBooking);
        
        console.log('Creating eSewa notification for booking:', bookingData.bookingId);
        
        // Create notification with exact same format as cash payment
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/notifications`,
          {
            type: 'booking_confirmed',
            title: 'Booking Confirmed',
            message: `Your ${bookingData.teamSize}v${bookingData.teamSize} booking for ${new Date(bookingData.bookingDate).toLocaleDateString()} at ${bookingData.timeSlot} has been confirmed via eSewa. Total amount: Rs. ${bookingData.totalPrice || '1200.00'}.`,
            booking_id: parseInt(bookingData.bookingId)
          },
          {
            headers: {
              'Authorization': `Bearer ${user.token}`
            }
          }
        );
        console.log('eSewa notification created successfully:', response.data);
      } else {
        console.log('Missing data for eSewa notification:', { user: !!user, token: !!user?.token, storedBooking: !!storedBooking });
      }
    } catch (error) {
      console.error('Error creating eSewa notification:', error.response?.data || error.message);
    }
  };

  const updateBookingStatusForEsewa = async (transactionUuid, transactionCode) => {
    try {
      const user = AuthService.getCurrentUser();
      if (user && user.token) {
        // Get booking ID from localStorage pendingBooking
        const storedBooking = localStorage.getItem('pendingBooking');
        let bookingId = null;
        
        if (storedBooking) {
          const bookingData = JSON.parse(storedBooking);
          bookingId = bookingData.bookingId;
        }
        
        if (bookingId) {
          console.log('Updating eSewa booking status for booking ID:', bookingId);
          const response = await axios.put(
            `${import.meta.env.VITE_API_URL}/bookings/${bookingId}/status`,
            {
              status: 'confirmed',
              payment_method: 'esewa',
              transaction_code: transactionCode
            },
            {
              headers: {
                'Authorization': `Bearer ${user.token}`
              }
            }
          );
          console.log('eSewa booking status updated successfully:', response.data);
        } else {
          console.error('No booking ID found for eSewa payment');
        }
      }
    } catch (error) {
      console.error('Error updating eSewa booking status:', error);
    }
  };

  useEffect(() => {
    const processPaymentSuccess = async () => {
      try {
        const transaction_uuid = searchParams.get('transaction_uuid');
        const transaction_code = searchParams.get('transaction_code');
        const amount_paid = searchParams.get('amount_paid');
        const remaining_amount = searchParams.get('remaining_amount');
        const error = searchParams.get('error');

        if (error) {
          setError('Payment processing failed. Please try again.');
          setLoading(false);
          return;
        }

        if (!transaction_uuid) {
          setError('Invalid payment response');
          setLoading(false);
          return;
        }

        // Set payment data from URL parameters
        setPaymentData({
          transaction_uuid,
          transaction_code,
          amount_paid: amount_paid || 50,
          remaining_amount: remaining_amount || 950
        });
        
        // Clear any pending booking data
        localStorage.removeItem('pendingBooking');
        
        // Store success message for other pages
        localStorage.setItem('bookingSuccess', JSON.stringify({
          message: 'Payment successful! Advance payment completed via eSewa.',
          transaction_code
        }));
        
        // Create notification directly with booking details
        await createEsewaBookingNotification(transaction_code);
        
        // Wait a bit and try again to ensure notification is created
        setTimeout(async () => {
          await createEsewaBookingNotification(transaction_code);
        }, 2000);
        
        setLoading(false);
      } catch (error) {
        console.error('Payment success processing error:', error);
        setError('Failed to process payment success.');
        setLoading(false);
      }
    };

    processPaymentSuccess();
  }, [searchParams]);

  const handleContinue = () => {
    navigate('/my-bookings');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">Verifying payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/courts')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Back to Courts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">Your advance payment has been processed successfully.</p>
          
          {paymentData && (
            <div className="bg-green-50 p-6 rounded-lg mb-6 text-left">
              <h3 className="font-semibold text-gray-800 mb-4">Payment Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction UUID:</span>
                  <span className="font-medium text-xs">{paymentData.transaction_uuid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-medium">{paymentData.transaction_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-medium text-green-600">Rs. {paymentData.amount_paid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Remaining Amount:</span>
                  <span className="font-medium text-orange-600">Rs. {paymentData.remaining_amount}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-blue-800">
              <strong>Important:</strong> Please pay the remaining amount of Rs. {paymentData?.remaining_amount || '950'} at the venue after playing.
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={handleContinue}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              View My Bookings
            </button>
            <button
              onClick={() => navigate('/courts')}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Back to Courts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;