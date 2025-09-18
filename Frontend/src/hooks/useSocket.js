import { useEffect, useRef } from 'react';
import socketService from '../services/socketService';

export const useSocket = (token) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (token) {
      socketRef.current = socketService.connect(token);
    }
    return () => {
      socketService.disconnect();
    };
  }, [token]);

  return socketRef.current;
};

export const useNotifications = (onNewNotification) => {
  useEffect(() => {
    if (onNewNotification) {
      socketService.onNewNotification(onNewNotification);
      return () => socketService.off('new_notification', onNewNotification);
    }
  }, [onNewNotification]);
};

export const useTimeSlots = (onTimeSlotUpdate) => {
  useEffect(() => {
    socketService.onTimeSlotUpdate(onTimeSlotUpdate);
    return () => socketService.off('time_slots_update', onTimeSlotUpdate);
  }, [onTimeSlotUpdate]);
};

export const useImageUpload = (onImageUploadComplete) => {
  useEffect(() => {
    socketService.onImageUploadComplete(onImageUploadComplete);
    return () => socketService.off('image_upload_complete', onImageUploadComplete);
  }, [onImageUploadComplete]);
};

export const useContactMessages = (onNewContactMessage) => {
  useEffect(() => {
    if (onNewContactMessage) {
      socketService.onNewContactMessage(onNewContactMessage);
      return () => socketService.off('new_contact_message', onNewContactMessage);
    }
  }, [onNewContactMessage]);
};

export const useRatingUpdates = (onRatingUpdate) => {
  useEffect(() => {
    socketService.onRatingUpdate(onRatingUpdate);
    return () => socketService.off('rating_update', onRatingUpdate);
  }, [onRatingUpdate]);
};