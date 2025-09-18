const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { authenticate, authorize } = require('../middleware/authMiddleware');
const courtController = require('../controllers/courtController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'court-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Public route
router.get('/', courtController.getAllCourts);

// Authenticated routes
router.get('/manager', authenticate, courtController.getManagerCourt); // ✅ updated path (no :managerId)
router.post(
  '/manage',
  authenticate,
  authorize('court_manager', 'admin'),
  upload.single('image'),
  courtController.manageCourt
);
router.put(
  '/manage/:id',
  authenticate,
  authorize('court_manager', 'admin'),
  upload.single('image'),
  courtController.manageCourt
);
router.get('/:id', courtController.getCourtById);
router.delete('/:id', authenticate, authorize('court_manager', 'admin'), courtController.deleteCourt);

module.exports = router;
