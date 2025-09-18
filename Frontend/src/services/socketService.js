import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    if (!token) {
      console.warn('No token provided for Socket.io connection');
      return null;
    }

    if (this.socket) {
      this.disconnect();
    }

    // Use base URL without /api for Socket.io
    const serverUrl = 'http://localhost:5000';
    console.log('Connecting to Socket.io server:', serverUrl);

    this.socket = io(serverUrl, {
      auth: {
        token: token
      }
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.io connected successfully');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket.io disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.io connection error:', error);
    });



    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  sendNotification(userId, notification) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit('new_notification', notification);
    }
  }

  sendTimeSlotUpdate(courtId, timeSlots) {
    if (this.io) {
      this.io.emit('time_slots_update', { courtId, timeSlots });
    }
  }

  sendImageUploadComplete(userId, imageData) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit('image_upload_complete', imageData);
    }
  }

  onNewNotification(callback) {
    if (this.socket) {
      // Remove existing listeners first
      this.socket.off('new_notification');
      this.socket.on('new_notification', (notification) => {
        console.log('📢 Received notification:', notification.title);
        callback(notification);
      });
    }
  }

  onTimeSlotUpdate(callback) {
    if (this.socket) {
      this.socket.off('time_slots_update');
      this.socket.on('time_slots_update', callback);
    }
  }

  onImageUploadComplete(callback) {
    if (this.socket) {
      this.socket.on('image_upload_complete', callback);
    }
  }

  onNewContactMessage(callback) {
    if (this.socket) {
      this.socket.off('new_contact_message');
      this.socket.on('new_contact_message', callback);
    }
  }

  onRatingUpdate(callback) {
    if (this.socket) {
      this.socket.off('rating_update');
      this.socket.on('rating_update', callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  getSocket() {
    return this.socket;
  }
}

export default new SocketService();