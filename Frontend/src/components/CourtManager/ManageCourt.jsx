import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../Sidebar';
import Header from '../Header';
import Footer from '../Footer';
import {
  Star, Clock, Users, MapPin, Camera, DollarSign, MapPinned, Edit3, Save, X, Phone, Upload, Trash2
} from 'lucide-react';
import AuthService from '../../services/AuthService';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../Toast/ToastContainer';

const fixedTimeSlots = [
  '06:00 AM - 07:00 AM', '07:00 AM - 08:00 AM', '08:00 AM - 09:00 AM', 
  '09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM', 
  '12:00 PM - 1:00 PM', '1:00 PM - 2:00 PM', '2:00 PM - 3:00 PM', 
  '3:00 PM - 4:00 PM', '4:00 PM - 5:00 PM', '5:00 PM - 6:00 PM',
  '6:00 PM - 7:00 PM', '7:00 PM - 8:00 PM', '8:00 PM - 9:00 PM',
];

const ManageCourt = () => {
  const { toasts, showToast, removeToast } = useToast();
  const user = AuthService.getCurrentUser();
  const userId = user?.user?.id;
  const token = user?.token;

  const [court, setCourt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    pricing5v5: fixedTimeSlots.map(slot => ({ hour: slot, price: '', type: '5v5' })),
    pricing7v7: fixedTimeSlots.map(slot => ({ hour: slot, price: '', type: '7v7' })),
    saturdayPrice5v5: '',
    saturdayPrice7v7: ''
  });
  const [imageError, setImageError] = useState(false);
  const [mapError, setMapError] = useState(false);

  // Fetch court data
  useEffect(() => {
    if (!userId || !token) return;

    const fetchCourt = async () => {
      try {
        const response = await axios.get(`/api/courts/manager`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data && response.data.data) {
          const courtData = response.data.data;
          
          // Initialize transformed data structure
          const transformedData = {
            ...courtData,
            pricing5v5: [],
            pricing7v7: [],
            saturdayPrice5v5: '',
            saturdayPrice7v7: ''
          };

          // Handle pricing data
          if (courtData.capacity === '5v5' || courtData.capacity === '5v5 & 7v7') {
            if (courtData.pricing5v5 && Array.isArray(courtData.pricing5v5)) {
              transformedData.pricing5v5 = fixedTimeSlots.map(slot => {
                const pricingItem = courtData.pricing5v5.find(p => p.hour === slot);
                return {
                  hour: slot,
                  price: pricingItem?.price || '',
                  type: '5v5'
                };
              });
            } else {
              transformedData.pricing5v5 = fixedTimeSlots.map(slot => ({ hour: slot, price: '', type: '5v5' }));
            }
            transformedData.saturdayPrice5v5 = courtData.saturdayPrice5v5 || '';
          }
          
          if (courtData.capacity === '7v7' || courtData.capacity === '5v5 & 7v7') {
            if (courtData.pricing7v7 && Array.isArray(courtData.pricing7v7)) {
              transformedData.pricing7v7 = fixedTimeSlots.map(slot => {
                const pricingItem = courtData.pricing7v7.find(p => p.hour === slot);
                return {
                  hour: slot,
                  price: pricingItem?.price || '',
                  type: '7v7'
                };
              });
            } else {
              transformedData.pricing7v7 = fixedTimeSlots.map(slot => ({ hour: slot, price: '', type: '7v7' }));
            }
            transformedData.saturdayPrice7v7 = courtData.saturdayPrice7v7 || '';
          }

          setCourt(courtData);
          setEditData(transformedData);
        } else {
          setError('No court found. Please add a court first.');
        }
      } catch (err) {
        console.error('Error fetching court:', err);
        if (err.response?.status === 404) {
          setError('No court found. Please add a court first.');
        } else {
          setError('Error loading court data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCourt();
  }, [userId, token]);

const handleEdit = () => {
  setIsEditing(true);
  // Create a deep copy of the current edit data to avoid reference issues
  setEditData(prev => ({ ...prev }));
};

  const handleCancel = () => {
    setIsEditing(false);
    // Reset edit data to the current court data
    if (court) {
      const transformedData = {
        ...court,
        pricing5v5: [],
        pricing7v7: [],
        saturdayPrice5v5: '',
        saturdayPrice7v7: ''
      };

      // Handle different capacity types and transform pricing data
      if (court.capacity === '5v5') {
        if (court.pricing5v5 && Array.isArray(court.pricing5v5)) {
          transformedData.pricing5v5 = fixedTimeSlots.map(slot => {
            const pricingItem = court.pricing5v5.find(p => p.hour === slot);
            return {
              hour: slot,
              price: pricingItem?.price || '',
              type: '5v5'
            };
          });
        } else {
          transformedData.pricing5v5 = fixedTimeSlots.map(slot => ({ hour: slot, price: '', type: '5v5' }));
        }
        transformedData.saturdayPrice5v5 = court.saturdayPrice5v5 || '';
        
      } else if (court.capacity === '7v7') {
        if (court.pricing7v7 && Array.isArray(court.pricing7v7)) {
          transformedData.pricing7v7 = fixedTimeSlots.map(slot => {
            const pricingItem = court.pricing7v7.find(p => p.hour === slot);
            return {
              hour: slot,
              price: pricingItem?.price || '',
              type: '7v7'
            };
          });
        } else {
          transformedData.pricing7v7 = fixedTimeSlots.map(slot => ({ hour: slot, price: '', type: '7v7' }));
        }
        transformedData.saturdayPrice7v7 = court.saturdayPrice7v7 || '';
        
      } else if (court.capacity === '5v5 & 7v7') {
        if (court.pricing5v5 && Array.isArray(court.pricing5v5)) {
          transformedData.pricing5v5 = fixedTimeSlots.map(slot => {
            const pricingItem = court.pricing5v5.find(p => p.hour === slot);
            return {
              hour: slot,
              price: pricingItem?.price || '',
              type: '5v5'
            };
          });
        } else {
          transformedData.pricing5v5 = fixedTimeSlots.map(slot => ({ hour: slot, price: '', type: '5v5' }));
        }
        
        if (court.pricing7v7 && Array.isArray(court.pricing7v7)) {
          transformedData.pricing7v7 = fixedTimeSlots.map(slot => {
            const pricingItem = court.pricing7v7.find(p => p.hour === slot);
            return {
              hour: slot,
              price: pricingItem?.price || '',
              type: '7v7'
            };
          });
        } else {
          transformedData.pricing7v7 = fixedTimeSlots.map(slot => ({ hour: slot, price: '', type: '7v7' }));
        }
        
        transformedData.saturdayPrice5v5 = court.saturdayPrice5v5 || '';
        transformedData.saturdayPrice7v7 = court.saturdayPrice7v7 || '';
      }

      setEditData(transformedData);
    }
    setImageError(false);
    setMapError(false);
  };

  const handleSave = async () => {
    try {
      console.log('Starting court update...');
      console.log('Edit data:', editData);
      
      // Create FormData for multipart/form-data submission
      const formData = new FormData();
      
      // Add basic court data
      formData.append('name', editData.name || '');
      formData.append('location', editData.location || '');
      formData.append('opening_hours', editData.opening_hours || '');
      formData.append('phone_number', editData.phone_number || '');
      formData.append('description', editData.description || '');
      
      // Prepare pricing data based on capacity type
      if (court.capacity === '5v5') {
        formData.append('pricing5v5', JSON.stringify(editData.pricing5v5.map(slot => ({
          hour: slot.hour,
          price: slot.price || '0',
          type: '5v5'
        }))));
        formData.append('saturdayPrice5v5', editData.saturdayPrice5v5 || '0');
      } 
      else if (court.capacity === '7v7') {
        formData.append('pricing7v7', JSON.stringify(editData.pricing7v7.map(slot => ({
          hour: slot.hour,
          price: slot.price || '0',
          type: '7v7'
        }))));
        formData.append('saturdayPrice7v7', editData.saturdayPrice7v7 || '0');
      }
      else if (court.capacity === '5v5 & 7v7') {
        formData.append('pricing5v5', JSON.stringify(editData.pricing5v5.map(slot => ({
          hour: slot.hour,
          price: slot.price || '0',
          type: '5v5'
        }))));
        formData.append('pricing7v7', JSON.stringify(editData.pricing7v7.map(slot => ({
          hour: slot.hour,
          price: slot.price || '0',
          type: '7v7'
        }))));
        formData.append('saturdayPrice5v5', editData.saturdayPrice5v5 || '0');
        formData.append('saturdayPrice7v7', editData.saturdayPrice7v7 || '0');
      }

      // Handle image upload if new image selected
      if (editData.imageFile) {
        formData.append('image', editData.imageFile);
        console.log('Image file added:', editData.imageFile.name);
      }
      
      const response = await axios.put(
        `/api/courts/manage/${court.id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Response received:', response.data);

      if (response.data.success) {
        // Update the court state with the response data
        const updatedCourt = response.data.data;

        console.log('Updated court data:', updatedCourt);
        
        // Transform the updated court data to match our frontend structure
        const transformedData = {
          ...updatedCourt,
          pricing5v5: [],
          pricing7v7: [],
          saturdayPrice5v5: '',
          saturdayPrice7v7: ''
        };

        // Handle different capacity types and transform pricing data
        if (updatedCourt.capacity === '5v5') {
          if (updatedCourt.pricing5v5 && Array.isArray(updatedCourt.pricing5v5)) {
            transformedData.pricing5v5 = fixedTimeSlots.map(slot => {
              const pricingItem = updatedCourt.pricing5v5.find(p => p.hour === slot);
              return {
                hour: slot,
                price: pricingItem?.price || '',
                type: '5v5'
              };
            });
          } else {
            transformedData.pricing5v5 = fixedTimeSlots.map(slot => ({ hour: slot, price: '', type: '5v5' }));
          }
          transformedData.saturdayPrice5v5 = updatedCourt.saturdayPrice5v5 || '';
          
        } else if (updatedCourt.capacity === '7v7') {
          if (updatedCourt.pricing7v7 && Array.isArray(updatedCourt.pricing7v7)) {
            transformedData.pricing7v7 = fixedTimeSlots.map(slot => {
              const pricingItem = updatedCourt.pricing7v7.find(p => p.hour === slot);
              return {
                hour: slot,
                price: pricingItem?.price || '',
                type: '7v7'
              };
            });
          } else {
            transformedData.pricing7v7 = fixedTimeSlots.map(slot => ({ hour: slot, price: '', type: '7v7' }));
          }
          transformedData.saturdayPrice7v7 = updatedCourt.saturdayPrice7v7 || '';
          
        } else if (updatedCourt.capacity === '5v5 & 7v7') {
          if (updatedCourt.pricing5v5 && Array.isArray(updatedCourt.pricing5v5)) {
            transformedData.pricing5v5 = fixedTimeSlots.map(slot => {
              const pricingItem = updatedCourt.pricing5v5.find(p => p.hour === slot);
              return {
                hour: slot,
                price: pricingItem?.price || '',
                type: '5v5'
              };
            });
          } else {
            transformedData.pricing5v5 = fixedTimeSlots.map(slot => ({ hour: slot, price: '', type: '5v5' }));
          }
          
          if (updatedCourt.pricing7v7 && Array.isArray(updatedCourt.pricing7v7)) {
            transformedData.pricing7v7 = fixedTimeSlots.map(slot => {
              const pricingItem = updatedCourt.pricing7v7.find(p => p.hour === slot);
              return {
                hour: slot,
                price: pricingItem?.price || '',
                type: '7v7'
              };
            });
          } else {
            transformedData.pricing7v7 = fixedTimeSlots.map(slot => ({ hour: slot, price: '', type: '7v7' }));
          }
          
          transformedData.saturdayPrice5v5 = updatedCourt.saturdayPrice5v5 || '';
          transformedData.saturdayPrice7v7 = updatedCourt.saturdayPrice7v7 || '';
        }

        console.log('Transformed data:', transformedData);

        // Update both court and editData states
        setCourt(updatedCourt);
        setEditData(transformedData);
        setIsEditing(false);
        
        showToast('Court updated successfully!', 'success');
        window.location.reload();
      }
    } catch (err) {
      console.error('Error updating court:', err);
      let errorMessage = 'Error updating court. Please try again.';
      
      if (err.response?.data?.details) {
        errorMessage = err.response.data.details || err.response.data.error || errorMessage;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      showToast(errorMessage, 'error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };


  const handlePriceChange = (type, index, value) => {
    if (type === '5v5') {
      setEditData(prev => ({
        ...prev,
        pricing5v5: prev.pricing5v5.map((item, i) => 
          i === index ? { ...item, price: value } : item
        )
      }));
    } else {
      setEditData(prev => ({
        ...prev,
        pricing7v7: prev.pricing7v7.map((item, i) => 
          i === index ? { ...item, price: value } : item
        )
      }));
    }
  };

  const handleSaturdayPriceChange = (type, value) => {
    if (type === '5v5') {
      setEditData(prev => ({ 
        ...prev, 
        saturdayPrice5v5: value
      }));
    } else {
      setEditData(prev => ({ 
        ...prev, 
        saturdayPrice7v7: value
      }));
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditData(prev => ({ ...prev, imageFile: file }));
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleMapError = () => {
    setMapError(true);
  };

  const handleDeleteCourt = async () => {
    if (!window.confirm('Are you sure you want to delete this court? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/courts/${court.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        showToast('Court deleted successfully!', 'success');
        window.location.href = '/courtmanager/addCourt';
      }
    } catch (err) {
      console.error('Error deleting court:', err);
      showToast('Failed to delete court. Please try again.', 'error');
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex md:flex-row flex-col relative bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
          <Sidebar />
          <main className="flex-1 flex items-center justify-center p-4 md:p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg text-gray-700 font-medium">Loading court details...</p>
            </div>
          </main>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="flex md:flex-row flex-col relative bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
          <Sidebar />
          <main className="flex-1 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 text-center border border-gray-100">
                <div className="bg-blue-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <MapPinned className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{error}</h3>
                <p className="text-gray-600 mb-8 text-lg">
                  You need to add a court before you can manage it.
                </p>
                <a
                  href="/courtmanager/addCourt"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors shadow-sm"
                >
                  Add Court
                </a>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </>
    );
  }

  if (!court) {
    return (
      <>
        <Header />
        <div className="flex md:flex-row flex-col relative bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
          <Sidebar />
          <main className="flex-1 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 text-center border border-gray-100">
                <div className="bg-green-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <MapPinned className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">No court found</h3>
                <p className="text-gray-600 mb-8 text-lg">
                  You haven't added any court yet. Add a court to start managing it.
                </p>
                <a
                  href="/courtmanager/addCourt"
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold transition-colors shadow-sm"
                >
                  Add Court
                </a>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </>
    );
  }

  const renderPricingTable = () => {
    if (!editData) return null;

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-100 rounded-xl">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-900">Pricing Structure</h3>
        </div>
        

        
        {/* Pricing */}
        <div className="mb-8">
          {(court.capacity === '5v5' || court.capacity === '5v5 & 7v7') && (
            <div className="mb-6">
              <h5 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" /> 5v5 Pricing
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {editData.pricing5v5?.map((slot, index) => (
                  <div key={`5v5-${index}`} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <div className="text-sm font-semibold text-blue-700 mb-2">{slot.hour}</div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium">Rs. </span>
                      {isEditing ? (
                        <input
                          type="number"
                          value={slot.price || ''}
                          onChange={(e) => handlePriceChange('5v5', index, e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="0"
                          step="0.01"
                        />
                      ) : (
                        <div className="pl-10 pr-4 py-2 font-bold text-gray-800">{slot.price || '0'}</div>
                      )}
                    </div>
                  </div>
                ))}
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-4 border-2 border-blue-300">
                  <div className="text-sm font-semibold text-blue-700 mb-2">Saturday (Whole Day)</div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium">Rs. </span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editData.saturdayPrice5v5 || ''}
                        onChange={(e) => handleSaturdayPriceChange('5v5', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      <div className="pl-10 pr-4 py-2 font-bold text-gray-800">{editData.saturdayPrice5v5 || '0'}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {(court.capacity === '7v7' || court.capacity === '5v5 & 7v7') && (
            <div className="mb-6">
              <h5 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" /> 7v7 Pricing
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {editData.pricing7v7?.map((slot, index) => (
                  <div key={`7v7-${index}`} className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                    <div className="text-sm font-semibold text-purple-700 mb-2">{slot.hour}</div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium">Rs. </span>
                      {isEditing ? (
                        <input
                          type="number"
                          value={slot.price || ''}
                          onChange={(e) => handlePriceChange('7v7', index, e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          min="0"
                          step="0.01"
                        />
                      ) : (
                        <div className="pl-10 pr-4 py-2 font-bold text-gray-800">{slot.price || '0'}</div>
                      )}
                    </div>
                  </div>
                ))}
                <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-4 border-2 border-purple-300">
                  <div className="text-sm font-semibold text-purple-700 mb-2">Saturday (Whole Day)</div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium">Rs. </span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editData.saturdayPrice7v7 || ''}
                        onChange={(e) => handleSaturdayPriceChange('7v7', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      <div className="pl-10 pr-4 py-2 font-bold text-gray-800">{editData.saturdayPrice7v7 || '0'}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Header />
      <div className="flex md:flex-row flex-col relative bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center mb-4 sm:mb-0">
                  <div className="p-3 bg-blue-100 rounded-xl mr-4">
                    <MapPinned className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-4xl font-bold text-gray-900">Manage Court</h1>
                    <p className="text-gray-600 mt-1">Update your court details and pricing</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  {!isEditing ? (
                    <>
                      <button
                        onClick={handleEdit}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors shadow-sm"
                      >
                        <Edit3 size={18} />
                        Edit Details
                      </button>
                      <button
                        onClick={handleDeleteCourt}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold transition-colors shadow-sm"
                      >
                        <Trash2 size={18} />
                        Delete Court
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleSave}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold transition-colors shadow-sm"
                      >
                        <Save size={18} />
                        Save Changes
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 font-semibold transition-colors shadow-sm"
                      >
                        <X size={18} />
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Court Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Court Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Court Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={editData.name || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900 bg-gray-50 p-3 rounded-xl">{court.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="location"
                      value={editData.location || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-lg text-gray-700 bg-gray-50 p-3 rounded-xl">{court.location}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Capacity
                    <span className="text-xs text-gray-500 font-normal">(Read-only)</span>
                  </label>
                  <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="text-lg text-gray-700">{court.capacity}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Capacity cannot be modified after court creation</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Opening Hours</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="opening_hours"
                      value={editData.opening_hours || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-2">
                      <Clock className="w-5 h-5 text-green-600" />
                      <span className="text-lg text-gray-700">{court.opening_hours}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone_number"
                      value={editData.phone_number || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-2">
                      <Phone className="w-5 h-5 text-red-600" />
                      <span className="text-lg text-gray-700">{court.phone_number || 'Not provided'}</span>
                    </div>
                  )}
                </div>


              </div>

              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                {isEditing ? (
                  <textarea
                    name="description"
                    value={editData.description || ''}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                ) : (
                  <p className="text-lg text-gray-700 bg-gray-50 p-4 rounded-xl leading-relaxed">{court.description}</p>
                )}
              </div>
            </div>

            {/* Court Image */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Camera className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900">Court Image</h3>
              </div>
              
              {isEditing && (
                <div className="mb-6">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <Camera size={18} className="text-green-600" />
                    Upload New Image
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                    <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 10MB</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Leave empty to keep current image</p>
                </div>
              )}
              
              {court.image && !imageError ? (
                <div className="relative overflow-hidden rounded-xl">
                  <img
                    src={`http://localhost:5000/uploads/${court.image}`}
                    alt={court.name}
                    className="w-full h-64 md:h-96 object-cover hover:scale-105 transition-transform duration-300"
                    onError={handleImageError}
                  />
                </div>
              ) : (
                <div className="w-full h-64 md:h-96 bg-gray-100 rounded-xl flex flex-col items-center justify-center">
                  <div className="bg-gray-200 p-6 rounded-full mb-4">
                    <Camera className="h-12 w-12 text-gray-400" />
                  </div>
                  <span className="text-xl text-gray-500 font-medium">Image not available</span>
                </div>
              )}
            </div>

            {/* 3rd Row - Pricing */}
            <div className="mb-8">
              {renderPricingTable()}
            </div>

            {/* Location Map */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900">Location Map</h3>
              </div>
              <div className="h-64 md:h-96 bg-gray-100 rounded-xl overflow-hidden">
                {court.latitude && court.longitude && !mapError ? (
                  <iframe
                    src={`https://maps.google.com/maps?q=${court.latitude},${court.longitude}&z=15&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    className="rounded-xl"
                    onError={handleMapError}
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className="bg-gray-200 p-6 rounded-full mb-4">
                      <MapPin className="h-12 w-12 text-gray-400" />
                    </div>
                    <span className="text-xl text-gray-500 font-medium">Map not available</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
};

export default ManageCourt;