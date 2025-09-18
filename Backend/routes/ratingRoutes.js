const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const ratingController = require('../controllers/ratingController');

// Submit or update rating (authenticated users only)
router.post('/', authenticate, ratingController.submitRating);

// Get ratings for a court (public)
router.get('/court/:court_id', ratingController.getCourtRatings);

// Get user's rating for a specific court (authenticated users only)
router.get('/user/:court_id', authenticate, ratingController.getUserRating);

module.exports = router;