# BookSal - Futsal Court Booking System

A comprehensive futsal court booking system with real-time features, built with React.js and Node.js.

## Features

### 🏟️ Court Management
- Browse and search futsal courts
- Detailed court information with pricing
- Real-time availability updates
- Court ratings and reviews
- Premium court badges

### 📅 Booking System
- Real-time time slot booking
- Team matchmaking functionality
- Multiple payment options (Cash, eSewa)
- Booking history and management
- Real-time booking status updates

### 💰 Payment Integration
- eSewa payment gateway integration
- Advance payment system (Rs. 50)
- Secure payment processing
- Payment status tracking

### 🔔 Real-Time Features
- Live notifications for bookings
- Real-time time slot updates
- Instant rating updates
- Socket.io powered communication

### 👥 User Management
- User registration and authentication
- Profile management with image upload
- Role-based access (Admin, Court Manager, User)
- JWT-based security

### 📊 Admin Dashboard
- User management
- Court management
- Booking analytics
- Contact message handling

## Tech Stack

### Frontend
- **React.js** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client
- **React Router** - Navigation

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **Sequelize** - ORM
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **Multer** - File uploads
- **bcrypt** - Password hashing

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MySQL database
- npm or yarn

### Backend Setup
```bash
cd Backend
npm install
```

Create `.env` file in Backend directory:
```env
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=BookSalDB
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
```

Start the backend server:
```bash
npm start
```

### Frontend Setup
```bash
cd Frontend
npm install
```

Create `.env` file in Frontend directory:
```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend development server:
```bash
npm run dev
```

## Database Setup

1. Create a MySQL database named `BookSalDB`
2. The application will automatically create tables on first run
3. Seed data can be added through the admin panel
4. Create your admin credentials directly in Database 


## Project Structure

```
BookSal/
├── Backend/
│   ├── config/          # Database and JWT configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Authentication and upload middleware
│   ├── models/          # Sequelize models
│   ├── routes/          # API routes
│   ├── services/        # Socket.io service
│   ├── uploads/         # File uploads directory
│   └── server.js        # Main server file
├── Frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── services/    # API and Socket services
│   │   ├── utils/       # Utility functions
│   │   └── App.jsx      # Main App component
│   └── public/          # Static assets
├── ESEWA_INTEGRATION.md # eSewa integration guide
└── REALTIME_SETUP.md   # Real-time features guide
```

## Key Features Implementation

### Real-Time Updates
- Time slot availability updates instantly across all users
- Live notifications for booking confirmations, cancellations
- Real-time rating updates when new reviews are submitted

### Payment System
- Advance payment through eSewa (Rs. 50)
- Remaining amount paid at venue
- Secure HMAC-SHA256 signature validation

### Matchmaking System
- Teams can find opponents for matches
- Real-time team joining notifications
- Automatic booking confirmation when teams match

### Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization

## Support

For support and questions, please contact the development team or create an issue in the repository.
