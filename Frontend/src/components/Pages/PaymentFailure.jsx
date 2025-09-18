import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, AlertTriangle } from 'lucide-react';

const PaymentFailure = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const processPaymentFailure = () => {
      try {
        const error = searchParams.get('error');
        const transaction_uuid = searchParams.get('transaction_uuid');

        if (error === 'missing_transaction') {
          setError('Invalid payment response. Please try again.');
        } else if (error === 'booking_not_found') {
          setError('Booking not found. Please contact support.');
        } else if (error === 'processing_failed') {
          setError('Payment processing failed. Please try again.');
        } else {
          setError('Payment was cancelled or failed. Please try again.');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Payment failure processing error:', error);
        setError('Payment failed. Please try again.');
        setLoading(false);
      }
    };

    processPaymentFailure();
  }, [searchParams]);

  const handleRetry = () => {
    // Check if there's pending booking data to retry
    const pendingBooking = localStorage.getItem('pendingBooking');
    if (pendingBooking) {
      navigate('/esewa-payment');
    } else {
      navigate('/courts');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">Processing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          
          <div className="bg-yellow-50 p-4 rounded-lg mb-6 flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm text-yellow-800">
                <strong>Don't worry!</strong> Your booking is still pending. You can try the payment again or choose to pay at the venue.
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Try Payment Again
            </button>
            <button
              onClick={() => navigate('/courts')}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Back to Courts
            </button>
          </div>
          
          <div className="mt-6 text-sm text-gray-500">
            <p>Need help? Contact support for assistance.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;