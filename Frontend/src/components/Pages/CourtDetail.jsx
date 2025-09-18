import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Clock, Users, Star, Calendar, Sparkles, Check, X, DollarSign, Phone, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import RatingSection from '../RatingSection';
import { useSocket, useTimeSlots, useRatingUpdates } from '../../hooks/useSocket';
import AuthService from '../../services/AuthService';

const fixedTimeSlots = [
  '06:00 AM - 07:00 AM', '07:00 AM - 08:00 AM', '08:00 AM - 09:00 AM', 
  '09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM', 
  '12:00 PM - 1:00 PM', '1:00 PM - 2:00 PM', '2:00 PM - 3:00 PM', 
  '3:00 PM - 4:00 PM', '4:00 PM - 5:00 PM', '5:00 PM - 6:00 PM',
  '6:00 PM - 7:00 PM', '7:00 PM - 8:00 PM', '8:00 PM - 9:00 PM',
];

const CourtDetail = () => {
  const { id } = useParams();
  const [court, setCourt] = useState(null);
  const [pricing5v5, setPricing5v5] = useState([]);
  const [pricing7v7, setPricing7v7] = useState([]);
  const [saturdayPrice5v5, setSaturdayPrice5v5] = useState('');
  const [saturdayPrice7v7, setSaturdayPrice7v7] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [lastTimeSlotUpdate, setLastTimeSlotUpdate] = useState(null);

  // Establish Socket.io connection
  const user = AuthService.getCurrentUser();
  const socket = useSocket(user?.token);

  // Fetch court data
  useEffect(() => {
    const fetchCourt = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/courts/${id}`);
        const courtData = response.data.data;
        
        
        // Initialize pricing data based on court capacity
        if (courtData.capacity === '5v5') {
          const transformedPricing5v5 = fixedTimeSlots.map(slot => {
            const pricingItem = courtData.pricing5v5?.find(p => p.hour === slot);
            return {
              hour: slot,
              price: pricingItem?.price || 'N/A',
              type: '5v5'
            };
          });
          
          setPricing5v5(transformedPricing5v5);
          setSaturdayPrice5v5(courtData.saturdayPrice5v5 || 'N/A');
        } 
        else if (courtData.capacity === '7v7') {
          const transformedPricing7v7 = fixedTimeSlots.map(slot => {
            const pricingItem = courtData.pricing7v7?.find(p => p.hour === slot);
            return {
              hour: slot,
              price: pricingItem?.price || 'N/A',
              type: '7v7'
            };
          });
          
          setPricing7v7(transformedPricing7v7);
          setSaturdayPrice7v7(courtData.saturdayPrice7v7 || 'N/A');
        }
        else if (courtData.capacity === '5v5 & 7v7') {
          const transformedPricing5v5 = fixedTimeSlots.map(slot => {
            const pricingItem = courtData.pricing5v5?.find(p => p.hour === slot);
            return {
              hour: slot,
              price: pricingItem?.price || 'N/A',
              type: '5v5'
            };
          });
          
          const transformedPricing7v7 = fixedTimeSlots.map(slot => {
            const pricingItem = courtData.pricing7v7?.find(p => p.hour === slot);
            return {
              hour: slot,
              price: pricingItem?.price || 'N/A',
              type: '7v7'
            };
          });
          
          setPricing5v5(transformedPricing5v5);
          setPricing7v7(transformedPricing7v7);
          setSaturdayPrice5v5(courtData.saturdayPrice5v5 || 'N/A');
          setSaturdayPrice7v7(courtData.saturdayPrice7v7 || 'N/A');
        }
        else {
          // Default pricing if no specific pricing data available
          const defaultPricing = fixedTimeSlots.map(slot => ({
            hour: slot,
            price: courtData.price_per_hour || 'N/A',
            type: 'general'
          }));
          setPricing5v5(defaultPricing);
          setSaturdayPrice5v5(courtData.price_per_hour || 'N/A');
        }

        // Fallback: If no pricing data is found, show raw pricing data for debugging
        if (!courtData.pricing5v5 && !courtData.pricing7v7) {
          console.log('No formatted pricing data found. Raw Pricings:', courtData.Pricings);
          if (courtData.Pricings && courtData.Pricings.length > 0) {
            // Log all stored time slots to see the format
            const allTimeSlots = courtData.Pricings.map(p => p.hour).filter(h => h !== 'Saturday (Whole Day)');
            
            
            // Try to create pricing from raw data
            const rawPricing5v5 = courtData.Pricings.filter(p => p.type === '5v5' && p.hour !== 'Saturday (Whole Day)');
            const rawPricing7v7 = courtData.Pricings.filter(p => p.type === '7v7' && p.hour !== 'Saturday (Whole Day)');
            
            
            if (rawPricing5v5.length > 0) {
              const fallbackPricing5v5 = fixedTimeSlots.map(slot => {
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
              const fallbackPricing7v7 = fixedTimeSlots.map(slot => {
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
            }
            
            // Set Saturday prices from raw data
            const saturday5v5 = courtData.Pricings.find(p => p.type === '5v5' && p.hour === 'Saturday (Whole Day)');
            const saturday7v7 = courtData.Pricings.find(p => p.type === '7v7' && p.hour === 'Saturday (Whole Day)');
            
            if (saturday5v5) setSaturdayPrice5v5(saturday5v5.price);
            if (saturday7v7) setSaturdayPrice7v7(saturday7v7.price);
          }
        }

        setCourt(courtData);
      } catch (err) {
        console.error('Error fetching court:', err);
        setError('Error loading court data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourt();
  }, [id, lastTimeSlotUpdate]);

  const handleTimeSlotUpdate = (data) => {
    if (data.courtId === parseInt(id)) {
      setLastTimeSlotUpdate(data.updated_at);
    }
  };

  useTimeSlots(handleTimeSlotUpdate);

  // Real-time rating updates
  useRatingUpdates((data) => {
    if (data.court_id === parseInt(id)) {
      setCourt(prevCourt => ({
        ...prevCourt,
        averageRating: data.averageRating,
        totalRatings: data.totalRatings
      }));
    }
  });

    const renderPricingTable = () => {
    if (!court) return null;

    return (
      <div className="space-y-8">
        {/* 5v5 Pricing - only show if court supports 5v5 */}
        {(court.capacity === '5v5' || court.capacity === '5v5 & 7v7') && (
          <div>
            <h3 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">
              <Users size={20} /> 5v5 Pricing
            </h3>
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time Slot
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price (Rs.)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pricing5v5.map((slot, index) => (
                    <tr key={`5v5-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {slot.hour}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {slot.price === 'N/A' ? (
                          <span className="text-gray-400">Not available</span>
                        ) : (
                          <span className="font-medium">Rs. {slot.price}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {/* Saturday Special */}
                  <tr className="bg-green-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Saturday (Whole Day Special)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      {saturdayPrice5v5 === 'N/A' ? (
                        <span className="text-gray-400">Not available</span>
                        ) : (
                        <span>Rs. {saturdayPrice5v5}</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7v7 Pricing - only show if court supports 7v7 */}
        {(court.capacity === '7v7' || court.capacity === '5v5 & 7v7') && (
          <div>
            <h3 className="text-xl font-bold text-purple-700 mb-4 flex items-center gap-2">
              <Users size={20} /> 7v7 Pricing
            </h3>
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time Slot
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price (Rs.)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pricing7v7.map((slot, index) => (
                    <tr key={`7v7-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {slot.hour}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {slot.price === 'N/A' ? (
                          <span className="text-gray-400">Not available</span>
                        ) : (
                          <span className="font-medium">Rs. {slot.price}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {/* Saturday Special */}
                  <tr className="bg-green-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Saturday (Whole Day Special)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      {saturdayPrice7v7 === 'N/A' ? (
                        <span className="text-gray-400">Not available</span>
                      ) : (
                        <span>Rs. {saturdayPrice7v7}</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };


  const handleImageError = () => {
    setImageError(true);
  };

  const handleMapError = () => {
    setMapError(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700 font-medium">Loading court details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center max-w-md p-6 bg-white rounded-xl shadow-lg mx-4">
          <div className="bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <MapPin className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">{error}</h3>
          <Link 
            to="/courts" 
            className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Courts
          </Link>
        </div>
      </div>
    );
  }

  if (!court) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center max-w-md p-6 bg-white rounded-xl shadow-lg mx-4">
          <div className="bg-yellow-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <MapPin className="h-8 w-8 text-yellow-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Court not found</h3>
          <p className="text-gray-600 mb-4">The requested court could not be found.</p>
          <Link 
            to="/courts" 
            className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Courts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Link 
          to="/courts" 
          className="inline-flex items-center text-gray-700 hover:text-blue-600 mb-4 font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to all courts
        </Link>
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="relative h-64 md:h-80">
            {court.image && !imageError ? (
              <img 
                src={`http://localhost:5000/uploads/${court.image}`} 
                alt={court.name}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setIsImageModalOpen(true)}
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <Sparkles className="h-12 w-12 text-gray-400" />
              </div>
            )}

            <div className="absolute bottom-3 right-3 bg-white/90 px-3 py-1 rounded-full flex items-center">
              <Star className="w-5 h-5 text-yellow-500 fill-current mr-1" />
              <span className="font-bold">{court.averageRating || court.rating}</span>
              {court.totalRatings > 0 && (
                <span className="text-sm text-gray-600 ml-1">({court.totalRatings})</span>
              )}
            </div>
          </div>
          
          <div className="p-6 md:p-8">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{court.name}</h1>
              {(court.averageRating || court.rating) >= 4.5 && (
                <div className="bg-yellow-50 px-3 py-1 rounded-full flex items-center">
                  <Sparkles className="w-5 h-5 text-yellow-500 mr-1" />
                  <span className="font-bold text-yellow-700">PREMIUM</span>
                </div>
              )}
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700">{court.location}</span>
              </div>
              
              <div className="flex items-start">
                <Clock className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700">{court.opening_hours}</span>
              </div>
              
              <div className="flex items-start">
                <Users className="w-5 h-5 text-purple-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700">{court.capacity}</span>
              </div>
              
              {court.phone_number && (
                <div className="flex items-start">
                  <Phone className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{court.phone_number}</span>
                </div>
              )}
            </div>
            
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Description</h2>
              <p className="text-gray-600">{court.description}</p>
            </div>
            
            {court.facilities && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Facilities</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {JSON.parse(court.facilities).map((facility, index) => (
                    <div key={index} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-2" />
                      <span className="text-gray-600">{facility}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pricing Table Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="bg-blue-100 p-2 rounded-full mr-3">
              <DollarSign className="w-5 h-5 text-green-600" />
            </span>
            Pricing Details
          </h2>
          {renderPricingTable()}
        </div>

        {/* Location Map */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="bg-green-100 p-2 rounded-full mr-3">
              <MapPin className="w-5 h-5 text-green-600" />
            </span>
            Location
          </h2>
          <div className="h-64 bg-gray-100 rounded-xl overflow-hidden">
            {court.latitude && court.longitude && !mapError ? (
              <iframe
                src={`https://maps.google.com/maps?q=${court.latitude},${court.longitude}&z=15&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                onError={handleMapError}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center">
                <MapPin className="h-12 w-12 text-gray-400" />
                <span className="text-gray-500 mt-2">Map not available</span>
              </div>
            )}
          </div>
        </div>

        
        
        <Link
          to={`/booking/${court.id}`}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-xl font-bold flex items-center justify-center mb-8 shadow-lg transition-colors"
        >
          <Calendar className="w-5 h-5 mr-2" />
          Book This Court Now
        </Link>

          {/* Ratings Section */}
        <RatingSection courtId={court.id} />

        {isImageModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setIsImageModalOpen(false)}
        >
          <img 
            src={`http://localhost:5000/uploads/${court.image}`} 
            alt="Full View"
            className="max-w-full max-h-full rounded-lg shadow-lg"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
          />
          <button 
            className="absolute top-4 right-4 text-white text-3xl font-bold"
            onClick={() => setIsImageModalOpen(false)}
          >
            &times;
          </button>
        </div>
      )}

      </div>
    </div>
  );
};

export default CourtDetail;