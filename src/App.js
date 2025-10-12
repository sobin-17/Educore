import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CourseDetail from './pages/CourseDetail';
import ProfileSettings from './pages/ProfileSettings';
import CourseCard from './pages/CourseCard';
import AdminDashboard from './pages/AdminDashboard';
import AdminLoginFlow from './pages/AdminLoginFlow';
import AdminLogin from './pages/AdminLogin';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';

// Protected Route component
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
};

// Admin Route component
const AdminRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token) {
        return <Navigate to="/login" />;
    }
    
    if (user.role !== 'admin') {
        return <Navigate to="/dashboard" />;
    }
    
    return children;
};

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/courses/:slug" element={<CourseDetail />} />
                    <Route path="/course-card" element={<CourseCard />} />
                    <Route path="/adminlogin" element={<AdminLogin />} />
                    <Route path="/admin-dashboard" element={<AdminDashboard />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    {/* Remove duplicate route */}
                    <Route
                        path="/profile-settings"
                        element={
                            <ProtectedRoute>
                                <ProfileSettings />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    
                </Routes>
            </div>
        </Router>
    );
}

export default App;