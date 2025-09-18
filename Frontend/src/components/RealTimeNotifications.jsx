import React, { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '../hooks/useSocket';

const RealTimeNotifications = () => {
  const [showToast, setShowToast] = useState(false);
  const [latestNotification, setLatestNotification] = useState(null);

  const handleNewNotification = (notification) => {
    setLatestNotification(notification);
    setShowToast(true);
    
    setTimeout(() => {
      setShowToast(false);
    }, 5000);
  };

  useNotifications(handleNewNotification);

  if (!showToast || !latestNotification) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 animate-slide-in">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Bell className="h-6 w-6 text-blue-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {latestNotification.title}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {latestNotification.message}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowToast(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RealTimeNotifications;