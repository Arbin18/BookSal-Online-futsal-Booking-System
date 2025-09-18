import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Save, Lock, User, Phone, MapPin, Mail, X } from 'lucide-react';
import axios from 'axios';
import AuthService from '../../services/AuthService';
import Header from '../Header';
import Footer from '../Footer';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../Toast/ToastContainer';


const Profile = () => {
  const navigate = useNavigate();
  const { toasts, showToast, removeToast } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [editingImage, setEditingImage] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone_number: '',
    address: ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Image upload state
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const currentUser = AuthService.getCurrentUser();
      
      if (!currentUser) {
        navigate('/login');
        return;
      }
      
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        }
      });

      if (response.data.success) {
        const userData = response.data.data;
        setUser(userData);
        setProfileForm({
          full_name: userData.full_name || '',
          phone_number: userData.phone_number || '',
          address: userData.address || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showToast(error.response?.data?.message || 'Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const currentUser = AuthService.getCurrentUser();
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/profile`, profileForm, {
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        }
      });

      if (response.data.success) {
        setUser(response.data.data);
        showToast('Profile updated successfully!', 'success');
        setEditingInfo(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast(error.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    e.preventDefault();
    if (!selectedImage) {
      showToast('Please select an image first', 'error');
      return;
    }

    setUploading(true);

    try {
      const currentUser = AuthService.getCurrentUser();
      const formData = new FormData();
      formData.append('profile_image', selectedImage);

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/profile/upload-image`, formData, {
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setUser(prev => ({ ...prev, profile_image: response.data.data.profile_image }));
        showToast('Profile image uploaded successfully!', 'success');
        setSelectedImage(null);
        setImagePreview(null);
        setEditingImage(false);
        // Refresh page to update header
        window.location.reload();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast(error.response?.data?.message || 'Failed to upload image', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showToast('New password must be at least 6 characters long', 'error');
      return;
    }

    setChangingPassword(true);

    try {
      const currentUser = AuthService.getCurrentUser();
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/profile/change-password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }, {
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        }
      });

      if (response.data.success) {
        showToast('Password changed successfully!', 'success');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showToast(error.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size must be less than 5MB', 'error');
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getProfileImageUrl = () => {
    if (user?.profile_image) {
      // Remove /api from VITE_API_URL for static files
      const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');
      return `${baseUrl}/${user.profile_image}`;
    }
    return null;
  };

  // Image Modal Component
  const ImageModal = ({ isOpen, onClose, imageUrl }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="relative w-full h-full flex items-center justify-center">
          <button
            onClick={onClose}
            className="absolute top-0 right-4 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-2"
          >
            <X size={24} />
          </button>
          <img
            src={imageUrl}
            alt="Profile"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            style={{ maxHeight: 'calc(100vh - 2rem)' }}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <>
    <Header/>
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="mt-2 text-gray-600">Manage your account information and preferences</p>
        </div>



        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <User className="inline w-4 h-4 mr-2" />
                Profile Information
              </button>
              
              <button
                onClick={() => setActiveTab('password')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'password'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Lock className="inline w-4 h-4 mr-2" />
                Change Password
              </button>
            </nav>
          </div>
        </div>

        {/* Profile Information Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
            
            {/* Profile Image Section */}
            <div className="mb-8 pb-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Profile Image</h3>
                <button
                  onClick={() => setEditingImage(!editingImage)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {editingImage ? 'Cancel' : 'Edit Image'}
                </button>
              </div>
              
              {!editingImage ? (
                <div className="flex items-center gap-4">
                                     <div 
                     className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                     onClick={() => getProfileImageUrl() && setShowImageModal(true)}
                   >
                    {getProfileImageUrl() ? (
                      <img
                        src={getProfileImageUrl()}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">JPG, PNG or GIF (max. 5MB)</p>
                    {getProfileImageUrl() && (
                      <p className="text-xs text-blue-600">Click to view full size</p>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleImageUpload} className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                    <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 5MB</p>
                  </div>
                  {imagePreview && (
                    <div className="flex justify-center">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 border-4 border-green-100">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                  <div className="flex justify-center">
                    <button
                      type="submit"
                      disabled={!selectedImage || uploading}
                      className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-colors shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Profile Information Display/Edit */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
                <button
                  onClick={() => setEditingInfo(!editingInfo)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {editingInfo ? 'Cancel' : 'Edit Your Info'}
                </button>
              </div>
              
              {!editingInfo ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="inline w-4 h-4 mr-2" />
                      Full Name
                    </label>
                    <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                      {user?.full_name || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="inline w-4 h-4 mr-2" />
                      Email
                    </label>
                    <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                      {user?.email || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="inline w-4 h-4 mr-2" />
                      Phone Number
                    </label>
                    <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                      {user?.phone_number || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="inline w-4 h-4 mr-2" />
                      Address
                    </label>
                    <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                      {user?.address || 'Not provided'}
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleProfileUpdate}>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="inline w-4 h-4 mr-2" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="inline w-4 h-4 mr-2" />
                        Email
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="inline w-4 h-4 mr-2" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileForm.phone_number}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, phone_number: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="inline w-4 h-4 mr-2" />
                        Address
                      </label>
                      <textarea
                        value={profileForm.address}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        

        {/* Change Password Tab */}
        {activeTab === 'password' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Change Password</h2>
            <form onSubmit={handlePasswordChange}>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {changingPassword ? 'Changing Password...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
    <Footer/>

    

    {/* Toast Container */}
    <ToastContainer toasts={toasts} removeToast={removeToast} />
    
    {/* Image Modal */}
    <ImageModal 
      isOpen={showImageModal} 
      onClose={() => setShowImageModal(false)} 
      imageUrl={imagePreview || getProfileImageUrl()} 
    />
    </>
  );
};

export default Profile;
