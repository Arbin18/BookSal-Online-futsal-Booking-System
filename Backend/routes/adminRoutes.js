const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

// All admin routes require admin role
router.use(authenticate);
router.use(authorize('admin'));

// Users management
router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser);

// Courts management  
router.delete('/courts/:id', adminController.deleteCourt);

// Bookings
router.get('/bookings', adminController.getAllBookings);

// Contact messages
router.get('/contact-messages', adminController.getContactMessages);
router.post('/contact-messages/:id/reply', adminController.replyToContact);

module.exports = router;