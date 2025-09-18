const multer = require('multer');
const path = require('path');
const fs = require('fs');
const socketService = require('../services/socketService');

// Ensure uploads directory exists
const ensureUploadDir = () => {
  const uploadDir = path.join(__dirname, '..', 'uploads', 'profiles');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = ensureUploadDir();
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Create multer instance with progress tracking
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Middleware to track upload progress
const uploadWithProgress = (fieldName) => {
  return (req, res, next) => {
    const uploadSingle = upload.single(fieldName);
    
    uploadSingle(req, res, (err) => {
      if (err) {
        return next(err);
      }
      
      // Emit upload completion if file was uploaded
      if (req.file && req.user) {
        socketService.sendImageUploadComplete(req.user.id, {
          filename: req.file.filename,
          originalname: req.file.originalname,
          size: req.file.size,
          path: req.file.path
        });
      }
      
      next();
    });
  };
};

module.exports = {
  upload,
  uploadWithProgress
};
