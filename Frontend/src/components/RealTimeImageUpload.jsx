import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useImageUpload } from '../hooks/useSocket';
import axios from 'axios';

const RealTimeImageUpload = ({ onUploadComplete, accept = "image/*", className = "" }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleUploadComplete = (data) => {
    setUploading(false);
    setUploadStatus('success');
    if (onUploadComplete) {
      onUploadComplete(data);
    }
    
    // Clear status after 3 seconds
    setTimeout(() => {
      setUploadStatus(null);
      setSelectedFile(null);
    }, 3000);
  };

  useImageUpload(handleUploadComplete);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      handleUpload(file);
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;

    setUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append('profile_image', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/profile/upload-image`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        // Real-time completion will be handled by Socket.io
        console.log('Upload initiated successfully');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploading(false);
      setUploadStatus('error');
      
      setTimeout(() => {
        setUploadStatus(null);
        setSelectedFile(null);
      }, 3000);
    }
  };

  const getStatusIcon = () => {
    if (uploading) return <Loader className="h-5 w-5 animate-spin text-blue-500" />;
    if (uploadStatus === 'success') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (uploadStatus === 'error') return <AlertCircle className="h-5 w-5 text-red-500" />;
    return <Upload className="h-5 w-5 text-gray-500" />;
  };

  const getStatusText = () => {
    if (uploading) return 'Uploading...';
    if (uploadStatus === 'success') return 'Upload complete!';
    if (uploadStatus === 'error') return 'Upload failed';
    return 'Choose image';
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
        id="image-upload"
      />
      <label
        htmlFor="image-upload"
        className={`
          flex items-center justify-center space-x-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors
          ${uploading ? 'border-blue-300 bg-blue-50 cursor-not-allowed' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}
          ${uploadStatus === 'success' ? 'border-green-300 bg-green-50' : ''}
          ${uploadStatus === 'error' ? 'border-red-300 bg-red-50' : ''}
        `}
      >
        {getStatusIcon()}
        <span className={`text-sm font-medium ${
          uploading ? 'text-blue-600' : 
          uploadStatus === 'success' ? 'text-green-600' :
          uploadStatus === 'error' ? 'text-red-600' : 'text-gray-600'
        }`}>
          {getStatusText()}
        </span>
      </label>
      
      {selectedFile && (
        <div className="mt-2 text-xs text-gray-500">
          Selected: {selectedFile.name}
        </div>
      )}
    </div>
  );
};

export default RealTimeImageUpload;