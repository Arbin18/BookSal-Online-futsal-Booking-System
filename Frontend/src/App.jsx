import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Pages/Home';
import Login from './components/Login';
import Register from './components/Register';
import AboutUs from './components/Pages/AboutUs';
import Courts from './components/Pages/Courts';
import ContactUs from './components/Pages/ContactUs';
import RealTimeNotifications from './components/RealTimeNotifications';
import { useSocket } from './hooks/useSocket';
import AuthService from './services/AuthService';
import AdminDashboard from './components/Admin/AdminDashboard';
import UsersManagement from './components/Admin/UsersManagement';
import CourtsManagement from './components/Admin/CourtsManagement';
import ContactMessages from './components/Admin/ContactMessages';
import ManagerDashboard from './components/CourtManager/ManagerDashboard';
import ManageCourt from './components/CourtManager/ManageCourt';
import CourtDetail from './components/Pages/CourtDetail';
import AddCourt from './components/CourtManager/AddCourt';
import ManageBookings from './components/CourtManager/ManageBookings';
import ViewTimeSlots from './components/CourtManager/ViewTimeSlots';
import BookingPage from './components/Pages/BookingPage';
import EsewaPaymentPage from './components/Pages/EsewaPaymentPage';
import PaymentSuccess from './components/Pages/PaymentSuccess';
import PaymentFailure from './components/Pages/PaymentFailure';
import MyBookings from './components/Pages/MyBookings';
import NotificationPage from './components/Pages/NotificationPage';
import Profile from './components/Pages/Profile';


function App() {
  const user = AuthService.getCurrentUser();
  const token = user?.token;
  
  // Initialize Socket.io connection (minimal version)
  useSocket(token);
  
  return (
    <Router>
      <div className="App">
        <RealTimeNotifications />
        <Routes>
          {/* Public Routes - Accessible to everyone */}
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/courts" element={<Courts />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/booking/:id" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
          <Route path="/esewa-payment" element={<ProtectedRoute><EsewaPaymentPage /></ProtectedRoute>} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failure" element={<PaymentFailure />} />
          <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/courts/:id" element={<CourtDetail />} />
          
          {/* Admin-only Routes */}
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminRoutes />
              </ProtectedRoute>
            } 
          />
          
          {/* Court Manager Routes */}
          <Route 
            path="/courtmanager/*" 
            element={
              <ProtectedRoute allowedRoles={['court_manager']}>
                <CourtManagerRoutes/>
              </ProtectedRoute>
            } 
          />
          
          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/home" />} />
        </Routes>
      </div>
    </Router>
  );
}
const AdminRoutes = () => (
  <Routes>
    <Route path="dashboard" element={<AdminDashboard />} />
    <Route path="users" element={<UsersManagement />} />
    <Route path="courts" element={<CourtsManagement />} />
    <Route path="contact-messages" element={<ContactMessages />} />
  </Routes>
)
const CourtManagerRoutes = () => (
  <Routes>
    <Route path="dashboard" element={<ManagerDashboard />} />
    <Route path="manageCourts" element={<ManageCourt />} />
    <Route path="addCourt" element={<AddCourt />} />
    <Route path="manage-bookings" element={<ManageBookings />} />
    <Route path="view-time-slots" element={<ViewTimeSlots />} />
  </Routes>
)


// Enhanced ProtectedRoute with role checking
function ProtectedRoute({ children, allowedRoles }) {
  const user = AuthService.getCurrentUser();
  console.log('ProtectedRoute - User:', user); // Debug
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  const userRole = user?.user?.role?.toLowerCase();
  console.log('ProtectedRoute - User Role:', userRole); // Debug
  
  if (allowedRoles) {
    const hasAccess = allowedRoles
      .map(role => role.toLowerCase())
      .includes(userRole);
    
    if (!hasAccess) {
      return <Navigate to="/home" replace />;
    }
  }
  
  return children;
}

export default App;