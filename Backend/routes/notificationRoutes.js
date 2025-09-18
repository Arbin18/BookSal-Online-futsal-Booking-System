const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

// Get user notifications
router.get('/', authenticate, notificationController.getUserNotifications);

// Get unread notification count
router.get('/unread-count', authenticate, notificationController.getUnreadCount);

// Mark notification as read
router.put('/:id/read', authenticate, notificationController.markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', authenticate, notificationController.markAllAsRead);

module.exports = router;