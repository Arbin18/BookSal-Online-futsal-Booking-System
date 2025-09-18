const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const esewaController = require('../controllers/esewaController');

// Initiate eSewa payment (authenticated)
router.post('/initiate', authenticate, esewaController.initiatePayment);

// eSewa callback routes (public - called by eSewa)
router.get('/success', esewaController.handleSuccess);
router.get('/failure', esewaController.handleFailure);

module.exports = router;