import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CourseDetail from './pages/CourseDetail'; // Import the CourseDetail component
import ProfileSettings from './pages/ProfileSettings';
import CourseCard from './pages/CourseCard';

// Protected Route component
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Route for CourseDetail, using a dynamic slug parameter */}
                    <Route path="/courses/:slug" element={<CourseDetail />} />
                    <Route path="/profile-settings" element={<ProfileSettings />} />
                    <Route path="/course-card" element={<CourseCard />} />

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