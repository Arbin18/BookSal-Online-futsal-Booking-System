const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const bookingController = require('../controllers/bookingController');

// Public routes (no authentication required)
router.get('/court/:court_id/available-slots', bookingController.getAvailableTimeSlots);

// Authenticated routes (require login)
router.post('/', authenticate, bookingController.createBooking);
router.post('/join-matchmaking', authenticate, bookingController.joinMatchmaking);
router.get('/user', authenticate, bookingController.getUserBookings);
router.get('/:id', authenticate, bookingController.getBookingById);
router.put('/:id/status', authenticate, bookingController.updateBookingStatus);
router.put('/:id/cancel', authenticate, bookingController.cancelBooking);
router.delete('/:id', authenticate, bookingController.cancelBooking);

// Court manager routes (require court_manager role)
router.get('/court/:court_id', authenticate, authorize('court_manager', 'admin'), bookingController.getCourtBookings);
router.get('/stats/:court_id', authenticate, authorize('court_manager', 'admin'), bookingController.getBookingStats);

module.exports = router;
