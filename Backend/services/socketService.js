const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

class SocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> socketId mapping
  }

  init(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true
      }
    });

    // Authentication middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        next();
      } catch (err) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`User ${socket.userId} connected`);
      
      // Store user socket mapping
      this.userSockets.set(socket.userId, socket.id);
      
      // Join user to their personal room
      socket.join(`user_${socket.userId}`);

      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
        this.userSockets.delete(socket.userId);
      });



      // Handle image upload progress
      socket.on('upload_progress', (data) => {
        socket.emit('upload_progress_update', data);
      });
    });

    console.log('✅ Socket.io initialized');
  }

  // Send notification to specific user
  sendNotification(userId, notification) {
    if (this.io) {
      console.log(`Emitting notification to user_${userId}:`, notification.title);
      this.io.to(`user_${userId}`).emit('new_notification', notification);
    } else {
      console.warn('Socket.io not initialized');
    }
  }

  // Send booking update to specific user
  sendBookingUpdate(userId, booking) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit('booking_update', booking);
    }
  }

  // Send time slot update to all users viewing a specific court
  sendTimeSlotUpdate(courtId, timeSlots) {
    if (this.io) {
      console.log(`Emitting time slot update for court ${courtId}`);
      this.io.emit('time_slots_update', { court_id: courtId, ...timeSlots });
    }
  }

  // Send image upload completion
  sendImageUploadComplete(userId, imageData) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit('image_upload_complete', imageData);
    }
  }

  // Send new contact message
  sendNewContactMessage(userId, contactMessage) {
    if (this.io) {
      console.log(`Emitting new contact message to user_${userId}`);
      this.io.to(`user_${userId}`).emit('new_contact_message', contactMessage);
    }
  }

  // Send rating update to all users
  sendRatingUpdate(courtId, ratingData) {
    if (this.io) {
      console.log(`Emitting rating update for court ${courtId}`);
      this.io.emit('rating_update', { court_id: courtId, ...ratingData });
    }
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.userSockets.size;
  }
}

module.exports = new SocketService();