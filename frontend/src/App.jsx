import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterUser from './pages/RegisterUser';
import Layout from './components/Layout';
import DashboardUser from './pages/DashboardUser';
import DashboardCaretaker from './pages/DashboardCaretaker';
import DashboardAdmin from './pages/DashboardAdmin';
import BookingPage from './pages/BookingPage';
import ChatPage from './pages/ChatPage';
import PaymentPage from './pages/PaymentPage';
import ProfilePage from './pages/ProfilePage';
import VoiceChatPage from './pages/VoiceChatPage';
import HealthScanPage from './pages/HealthScanPage';

// Debug wrapper for ProtectedRoute (Simplified)
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect logic
    if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (userRole === 'caretaker') return <Navigate to="/caretaker/dashboard" replace />;
    if (userRole === 'user') return <Navigate to="/user/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh' }}>
        {/* Added container to ensure height */}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register/user" element={<RegisterUser />} />
          <Route path="/register/caretaker" element={<Register />} />
          <Route path="/admin/login" element={<Login isAdmin={true} />} />

          {/* Redirect /dashboard to role based one */}
          <Route path="/dashboard" element={<Navigate to={`/${localStorage.getItem('role') || 'user'}/dashboard`} />} />

          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardAdmin />
            </ProtectedRoute>
          } />
          <Route path="/caretaker/dashboard" element={
            <ProtectedRoute allowedRoles={['caretaker']}>
              <DashboardCaretaker />
            </ProtectedRoute>
          } />
          <Route path="/user/dashboard" element={
            <ProtectedRoute allowedRoles={['user']}>
              <DashboardUser />
            </ProtectedRoute>
          } />

          {/* Missing Routes mapped to Dashboards for now */}
          <Route path="/bookings" element={
            <ProtectedRoute allowedRoles={['user']}>
              <DashboardUser view="bookings" />
            </ProtectedRoute>
          } />
          <Route path="/schedule" element={
            <ProtectedRoute allowedRoles={['caretaker']}>
              <DashboardCaretaker view="schedule" />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['user', 'caretaker', 'admin']}>
              <ProfilePage />
            </ProtectedRoute>
          } />


          {/* Feature Routes */}
          <Route path="/book" element={
            <ProtectedRoute allowedRoles={['user', 'caretaker']}>
              <BookingPage />
            </ProtectedRoute>
          } />
          <Route path="/voice-ai" element={
            <ProtectedRoute allowedRoles={['user']}>
              <VoiceChatPage />
            </ProtectedRoute>
          } />
          <Route path="/health-scan" element={
            <ProtectedRoute allowedRoles={['user']}>
              <HealthScanPage />
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute allowedRoles={['user', 'caretaker', 'admin']}>
              <ChatPage />
            </ProtectedRoute>
          } />
          <Route path="/payment/:bookingId" element={
            <ProtectedRoute allowedRoles={['user', 'caretaker']}>
              <PaymentPage />
            </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/login" />} />

          {/* CATCH ALL DEBUG ROUTE */}
          <Route path="*" element={
            <div style={{ padding: 50, textAlign: 'center' }}>
              <h1>404 - Page Not Found</h1>
              <p>The path you requested does not exist.</p>
              <a href="/login">Go to Login</a>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
