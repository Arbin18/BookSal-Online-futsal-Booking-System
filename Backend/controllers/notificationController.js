const { Notification, User, Booking, Court } = require('../models');
const socketService = require('../services/socketService');

// Get all notifications for a user
exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Booking,
          include: [{ model: Court, attributes: ['name'] }],
          attributes: ['booking_date', 'start_time', 'end_time', 'total_price', 'court_type']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('getUserNotifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
};

// Create notification
exports.createNotification = async (userId, type, title, message, bookingId = null, opponentName = null) => {
  try {
    console.log('Creating notification:', { userId, type, title, message, bookingId, opponentName });
    const notification = await Notification.create({
      user_id: userId,
      type,
      title,
      message,
      booking_id: bookingId,
      opponent_name: opponentName
    });
    console.log('Notification created successfully:', notification.id);
    
    // Send real-time notification
    console.log('Sending real-time notification to user:', userId);
    socketService.sendNotification(userId, {
      id: notification.id,
      type,
      title,
      message,
      booking_id: bookingId,
      opponent_name: opponentName,
      created_at: notification.created_at
    });
    
    return notification;
  } catch (error) {
    console.error('createNotification error:', error);
    throw error;
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    await Notification.update(
      { is_read: true },
      { 
        where: { 
          id, 
          user_id: req.user.id 
        } 
      }
    );

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('markAsRead error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { is_read: true },
      { 
        where: { 
          user_id: req.user.id,
          is_read: false
        } 
      }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('markAllAsRead error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.count({
      where: {
        user_id: req.user.id,
        is_read: false
      }
    });

    res.json({
      success: true,
      data: { unread_count: count }
    });
  } catch (error) {
    console.error('getUnreadCount error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unread count'
    });
  }
};