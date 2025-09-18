import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/AuthService';
import Sidebar from '../Sidebar';
import Header from '../Header';
import Footer from '../Footer';
import {
  Star, Clock, Users, MapPin, Camera, DollarSign, MapPinned, Phone
} from 'lucide-react';

const fixedTimeSlots = [
  '06:00 AM - 07:00 AM', '07:00 AM - 08:00 AM', '08:00 AM - 09:00 AM', '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM', '12:00 PM - 1:00 PM', '1:00 PM - 2:00 PM',
  '2:00 PM - 3:00 PM', '3:00 PM - 4:00 PM', '4:00 PM - 5:00 PM', '5:00 PM - 6:00 PM',
  '6:00 PM - 7:00 PM', '7:00 PM - 8:00 PM', '8:00 PM - 9:00 PM',
];

const AddCourt = () => {
  const navigate = useNavigate();
  const [selectedPosition, setSelectedPosition] = useState({ lat: 27.7172, lng: 85.3240 });
  const [imageFile, setImageFile] = useState(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [hasExistingCourt, setHasExistingCourt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Get user ID from AuthService
  const user = authService.getCurrentUser();
  const userId = user?.user?.id;

  const [courtData, setCourtData] = useState({
    name: '',
    location: '',
    opening_hours: '6:00 AM - 9:00 PM',
    description: '',
    phone_number: '',
    capacity: '5v5',
    pricing5v5: fixedTimeSlots.map(slot => ({ hour: slot, price: '' })),
    pricing7v7: fixedTimeSlots.map(slot => ({ hour: slot, price: '' })),
    saturdayPrice5v5: '',
    saturdayPrice7v7: ''
  });

  // Check for existing court on mount and persist the state
  useEffect(() => {
    const checkExistingCourt = async () => {
      try {
        // Check if user is logged in
        if (!userId) {
          navigate('/login');
          return;
        }

        const user = JSON.parse(localStorage.getItem('user'));
        const token = user?.token;
        
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`/api/courts/manager`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.data?.data) {
          localStorage.setItem('userCourt', 'true');
          setHasExistingCourt(true);
        } else {
          localStorage.setItem('userCourt', 'false');
        }
      } catch (err) {
        if (err.response?.status === 404) {
          localStorage.setItem('userCourt', 'false');
        } else {
          console.error('Court check error:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    checkExistingCourt();
  }, [userId, navigate]);

  const handleChange = (e) => {
    setCourtData({ ...courtData, [e.target.name]: e.target.value });
  };



  const handlePriceChange5v5 = (index, value) => {
    const updated = [...courtData.pricing5v5];
    updated[index].price = value;
    setCourtData({ ...courtData, pricing5v5: updated });
  };

  const handlePriceChange7v7 = (index, value) => {
    const updated = [...courtData.pricing7v7];
    updated[index].price = value;
    setCourtData({ ...courtData, pricing7v7: updated });
  };





  // Initialize Google Maps
  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current) return;
      
      // Initialize map
      const map = new window.google.maps.Map(mapRef.current, {
        center: selectedPosition,
        zoom: 15,
      });
      
      mapInstanceRef.current = map;
      
      // Create marker using AdvancedMarkerElement
      const advancedMarker = new google.maps.marker.AdvancedMarkerElement({
        map: map,
        position: selectedPosition,
        title: "Court Location",
      });
      
      markerRef.current = advancedMarker;
      
      // Add click listener to update marker position
      map.addListener("click", (event) => {
        const newPosition = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };
        
        setSelectedPosition(newPosition);
        
        // Update marker position
        if (markerRef.current) {
          markerRef.current.position = newPosition;
        }
      });
    };

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initMap();
      return;
    }
    
    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      // Wait for the existing script to load
      existingScript.addEventListener('load', initMap);
      existingScript.addEventListener('error', (error) => {
        console.error('Google Maps script load error:', error);
      });
      return () => {
        existingScript.removeEventListener('load', initMap);
        existingScript.removeEventListener('error', () => {});
      };
    }
    
    // Get Google Maps API key from environment variable or use default
    const googleMapsApiKey = import.meta.env.GOOGLE_MAPS_API_KEY || 'AIzaSyDJkYr-m0tmmHXnRHFCTq7EVYEQ2_MHPx4';
    
    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=marker`;
    script.async = true;
    script.defer = true;
    script.onload = initMap;
    script.onerror = (error) => {
      console.error('Google Maps script load error:', error);
      // Show error message to user
      const mapContainer = mapRef.current;
      if (mapContainer) {
        mapContainer.innerHTML = `
          <div class="flex flex-col items-center justify-center h-full p-4 text-center">
            <div class="text-red-500 font-medium">Failed to load Google Maps</div>
            <div class="text-gray-600 text-sm mt-2">Please check your API key and ensure billing is enabled.</div>
          </div>
        `;
      }
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Clean up script when component unmounts
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);
  
  // Update marker position when selectedPosition changes
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.position = selectedPosition;
    }
    
    // Update map center when selectedPosition changes
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(selectedPosition);
    }
  }, [selectedPosition]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Check if user is logged in
    if (!userId) {
      alert('Please login to add a court');
      navigate('/login');
      setSubmitting(false);
      return;
    }

    // Validate required fields
    if (!courtData.name || !courtData.location || !imageFile) {
      alert('Please fill all required fields and upload an image');
      setSubmitting(false);
      return;
    }

    // Validate pricing data
    if (courtData.capacity === '5v5 & 7v7') {
      if (courtData.pricing5v5.some(slot => !slot.price) || courtData.pricing7v7.some(slot => !slot.price)) {
        alert('Please fill all pricing fields for both 5v5 and 7v7 capacities');
        setSubmitting(false);
        return;
      }
    } else if (courtData.capacity === '5v5') {
      if (courtData.pricing5v5.some(slot => !slot.price)) {
        alert('Please fill all pricing fields for 5v5 capacity');
        setSubmitting(false);
        return;
      }
    } else if (courtData.capacity === '7v7') {
      if (courtData.pricing7v7.some(slot => !slot.price)) {
        alert('Please fill all pricing fields for 7v7 capacity');
        setSubmitting(false);
        return;
      }
    }

    const formData = new FormData();
    formData.append('court_manager_id', userId);
    formData.append('name', courtData.name);
    formData.append('location', courtData.location);
    formData.append('phone_number', courtData.phone_number);
    formData.append('opening_hours', courtData.opening_hours);
    formData.append('description', courtData.description);
    formData.append('capacity', courtData.capacity);
    formData.append('latitude', selectedPosition.lat);
    formData.append('longitude', selectedPosition.lng);
    formData.append('map_url', `https://www.google.com/maps?q=${selectedPosition.lat},${selectedPosition.lng}`);
    
    // Handle pricing based on capacity
    if (courtData.capacity === '5v5 & 7v7') {
      formData.append('pricing5v5', JSON.stringify(courtData.pricing5v5));
      formData.append('pricing7v7', JSON.stringify(courtData.pricing7v7));
      formData.append('saturdayPrice5v5', courtData.saturdayPrice5v5 || '0');
      formData.append('saturdayPrice7v7', courtData.saturdayPrice7v7 || '0');
    } else if (courtData.capacity === '5v5') {
      formData.append('pricing5v5', JSON.stringify(courtData.pricing5v5));
      formData.append('saturdayPrice5v5', courtData.saturdayPrice5v5 || '0');
    } else if (courtData.capacity === '7v7') {
      formData.append('pricing7v7', JSON.stringify(courtData.pricing7v7));
      formData.append('saturdayPrice7v7', courtData.saturdayPrice7v7 || '0');
    }
    
    if (imageFile) formData.append('image', imageFile);

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user?.token;
      
      if (!token) {
        alert('Session expired. Please login again.');
        navigate('/login');
        return;
      }
      
      const response = await axios.post(
        `/api/courts/manage`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        localStorage.setItem('userCourt', 'true');
        alert('Court added successfully!');
        navigate('/courtmanager/manageCourts');
      }
    } catch (err) {
      console.error('Submission error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      let errorMessage = 'Failed to add court. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alert(`Error: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const inputFields = [
    { name: 'name', label: 'Court Name', icon: MapPin, type: 'text', required: true },
    { name: 'location', label: 'Location', icon: MapPin, type: 'text', required: true },
    { name: 'phone_number', label: 'Phone Number', icon: Phone, type: 'tel', required: false },
    { name: 'opening_hours', label: 'Opening Hours', icon: Clock, type: 'text', required: true },
    { name: 'description', label: 'Description', icon: null, type: 'textarea', required: true }
  ];

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex md:flex-row flex-col relative">
          <Sidebar />
          <main className="flex-1 p-6 bg-gray-50 min-h-screen w-full">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900">Loading...</h2>
                </div>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </>
    );
  }

  if (hasExistingCourt) {
    return (
      <>
        <Header />
        <div className="flex md:flex-row flex-col relative">
          <Sidebar />
          <main className="flex-1 p-6 bg-gray-50 min-h-screen w-full">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <MapPinned className="text-blue-600" size={28} />
                    Court Already Added
                  </h2>
                  <p className="text-gray-600 mt-1">You have already added a court. Each court manager can only add one court.</p>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 mb-4">To manage your existing court, please visit the Manage Court section.</p>
                  <a 
                    href="/courtmanager/manageCourts" 
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg"
                  >
                    Manage Your Court
                  </a>
                </div>
              </div>
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
          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-green-100 rounded-xl mr-4">
                  <MapPinned className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-4xl font-bold text-gray-900">Add New Court</h1>
                  <p className="text-gray-600 mt-1">Create your court profile with details, pricing, and location</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 md:p-8 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Court Information</h2>
                <p className="text-gray-600 mt-1">Fill in the basic details about your court</p>
              </div>

              <div className="p-6 md:p-8 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {inputFields.map((field) => (
                    <div key={field.name} className={field.name === 'description' ? 'md:col-span-2' : ''}>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        {field.icon && <field.icon size={16} className="text-gray-500" />}
                        {field.label}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          name={field.name}
                          value={courtData[field.name]}
                          onChange={handleChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          required={field.required}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                      ) : (
                        <input
                          type={field.type}
                          name={field.name}
                          value={courtData[field.name]}
                          onChange={handleChange}
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          required={field.required}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                      )}
                    </div>
                  ))}

                  {/* Image Upload */}
                  <div className="lg:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                      <Camera size={18} className="text-green-600" />
                      Upload Court Image *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files[0])}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                </div>

                {/* Capacity */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <label className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                    <Users size={20} className="text-blue-600" />
                    Court Capacity *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['5v5', '7v7', '5v5 & 7v7'].map((capacity) => (
                      <label key={capacity} className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        courtData.capacity === capacity 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:border-blue-300'
                      }`}>
                        <input
                          type="radio"
                          name="capacity"
                          value={capacity}
                          checked={courtData.capacity === capacity}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className="text-center w-full">
                          <div className="font-semibold text-gray-900">{capacity}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {capacity === '5v5' ? 'Small Court' : capacity === '7v7' ? 'Large Court' : 'Both Sizes'}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>





                {/* Pricing */}
                {courtData.capacity === '5v5 & 7v7' ? (
                  <>
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                        Hourly Pricing (5v5)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {courtData.pricing5v5.map((slot, index) => (
                          <div key={index} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <div className="text-sm font-medium text-gray-700 mb-2">{slot.hour}</div>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rs. </span>
                              <input
                                type="number"
                                value={slot.price}
                                onChange={(e) => handlePriceChange5v5(index, e.target.value)}
                                placeholder="0"
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md"
                                required
                                min="0"
                              />
                            </div>
                          </div>
                        ))}
                        <div className="bg-blue-100 rounded-lg p-4 border border-blue-300">
                          <div className="text-sm font-medium text-gray-700 mb-2">Saturday (Whole Day)</div>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rs. </span>
                            <input
                              type="number"
                              value={courtData.saturdayPrice5v5 || ''}
                              onChange={(e) => setCourtData({ ...courtData, saturdayPrice5v5: e.target.value })}
                              placeholder="0"
                              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md"
                              min="0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                        Hourly Pricing (7v7)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {courtData.pricing7v7.map((slot, index) => (
                          <div key={index} className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                            <div className="text-sm font-medium text-gray-700 mb-2">{slot.hour}</div>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rs. </span>
                              <input
                                type="number"
                                value={slot.price}
                                onChange={(e) => handlePriceChange7v7(index, e.target.value)}
                                placeholder="0"
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md"
                                required
                                min="0"
                              />
                            </div>
                          </div>
                        ))}
                        <div className="bg-purple-100 rounded-lg p-4 border border-purple-300">
                          <div className="text-sm font-medium text-gray-700 mb-2">Saturday (Whole Day)</div>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rs. </span>
                            <input
                              type="number"
                              value={courtData.saturdayPrice7v7 || ''}
                              onChange={(e) => setCourtData({ ...courtData, saturdayPrice7v7: e.target.value })}
                              placeholder="0"
                              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md"
                              min="0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : courtData.capacity === '5v5' ? (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                      Hourly Pricing (5v5)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {courtData.pricing5v5.map((slot, index) => (
                        <div key={index} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <div className="text-sm font-medium text-gray-700 mb-2">{slot.hour}</div>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rs. </span>
                            <input
                              type="number"
                              value={slot.price}
                              onChange={(e) => handlePriceChange5v5(index, e.target.value)}
                              placeholder="0"
                              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md"
                              required
                              min="0"
                            />
                          </div>
                        </div>
                      ))}
                      <div className="bg-blue-100 rounded-lg p-4 border border-blue-300">
                        <div className="text-sm font-medium text-gray-700 mb-2">Saturday (Whole Day)</div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rs. </span>
                          <input
                            type="number"
                            value={courtData.saturdayPrice5v5 || ''}
                            onChange={(e) => setCourtData({ ...courtData, saturdayPrice5v5: e.target.value })}
                            placeholder="0"
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                      Hourly Pricing (7v7)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {courtData.pricing7v7.map((slot, index) => (
                        <div key={index} className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                          <div className="text-sm font-medium text-gray-700 mb-2">{slot.hour}</div>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rs. </span>
                            <input
                              type="number"
                              value={slot.price}
                              onChange={(e) => handlePriceChange7v7(index, e.target.value)}
                              placeholder="0"
                              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md"
                              required
                              min="0"
                            />
                          </div>
                        </div>
                      ))}
                      <div className="bg-purple-100 rounded-lg p-4 border border-purple-300">
                        <div className="text-sm font-medium text-gray-700 mb-2">Saturday (Whole Day)</div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rs. </span>
                          <input
                            type="number"
                            value={courtData.saturdayPrice7v7 || ''}
                            onChange={(e) => setCourtData({ ...courtData, saturdayPrice7v7: e.target.value })}
                            placeholder="0"
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Map Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                    <MapPinned className="text-blue-600" size={20} />
                    Select Court Location
                  </h3>
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    <div ref={mapRef} className="w-full h-96" />
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Click on the map to set the court location. Current position: {selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}
                  </div>
                </div>

                {/* Submit */}
                <div className="border-t border-gray-200 pt-8">
                  <div className="flex flex-col sm:flex-row gap-4 justify-end">
                    <button
                      type="button"
                      onClick={() => navigate('/courtmanager/dashboard')}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-colors shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Adding Court...' : 'Add Court'}
                    </button>
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

export default AddCourt;
