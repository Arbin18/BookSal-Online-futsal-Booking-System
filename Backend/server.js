require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const http = require('http');
const authRoutes = require('./routes/authRoutes');
const socketService = require('./services/socketService');

const app = express();
const server = http.createServer(app);

// Setup function to create necessary directories
const setupDirectories = () => {
  const uploadsDir = path.join(__dirname, 'uploads');
  const profilesDir = path.join(__dirname, 'uploads', 'profiles');
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Created uploads directory');
  } else {
    console.log('✅ Uploads directory already exists');
  }
  
  if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir, { recursive: true });
    console.log('✅ Created profiles directory');
  } else {
    console.log('✅ Profiles directory already exists');
  }
};

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// ✅ Add this line to enable logging
app.use(morgan('dev')); // or 'combined' for more detailed logs

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courts', require('./routes/courtRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/esewa', require('./routes/esewaRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/ratings', require('./routes/ratingRoutes'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred while processing your request'
  });
});

// Database setup and server start
const sequelize = require('./config/db');
const User = require('./models/User');
const { autoCancelExpiredFindingTeam, autoCompleteBookings, autoCancelTeamFinding } = require('./controllers/bookingController');

const startServer = async () => {
  try {
    // 1. Setup directories
    setupDirectories();
    
    // 2. Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // 3. Sync database models (use alter: false to avoid key limit issues)
    await sequelize.sync({ force: false, alter: false });
    console.log('✅ Database tables synchronized');
    
    // 4. Start schedulers (every 30 minutes)
    setInterval(() => {
      autoCancelExpiredFindingTeam();
      autoCompleteBookings();
      autoCancelTeamFinding();
    }, 30 * 60 * 1000);
    console.log('✅ Auto-schedulers started (runs every 30 minutes)');
    
    // 5. Initialize Socket.io
    socketService.init(server);
    
    // 6. Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📝 API Documentation: http://localhost:${PORT}/api`);
      console.log(`📁 Uploads available at: http://localhost:${PORT}/uploads`);
      console.log(`🔌 Socket.io ready for real-time connections`);
    });
    
  } catch (error) {
    console.error('❌ Server startup error:', error.message);
    console.log('\n📝 Please check your database configuration in .env file');
    process.exit(1);
  }
};

startServer();
