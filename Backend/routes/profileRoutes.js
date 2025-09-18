const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { uploadWithProgress } = require('../middleware/uploadMiddleware');
const {
  getProfile,
  updateProfile,
  uploadProfileImage,
  changePassword,
  serveProfileImage
} = require('../controllers/profileController');

// Get user profile
router.get('/', authenticate, getProfile);

// Update user profile
router.put('/', authenticate, updateProfile);

// Upload profile image
router.post('/upload-image', authenticate, uploadWithProgress('profile_image'), uploadProfileImage);

// Change password
router.post('/change-password', authenticate, changePassword);

// Serve profile images
router.get('/image/:filename', serveProfileImage);

module.exports = router;
