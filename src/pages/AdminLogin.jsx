import React, { useState, useEffect } from 'react';
import {
    BookOpen, User, LogOut, Users, Settings, Edit, Trash2, X, Shield, UserPlus,
    RefreshCw, Search, XCircle, Key, CheckCircle
} from 'lucide-react';

const AdminLogin = ({ onLoginSuccess }) => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        // Basic validation
        if (!formData.email || !formData.password) {
            setError('Please enter both email and password');
            setIsSubmitting(false);
            return;
        }

        try {
            console.log('Attempting admin login with:', { email: formData.email });
            
            // Determine the correct API URL
            const baseUrl = process.env.NODE_ENV === 'development' 
                ? 'http://localhost:5000'  // Direct URL for development
                : '';  // Use relative URL for production
            
            const apiUrl = `${baseUrl}/api/auth/admin-login`;
            console.log('Making request to:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    email: formData.email.trim(),
                    password: formData.password.trim()
                }),
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', [...response.headers.entries()]);

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('Server returned non-JSON response');
                const textResponse = await response.text();
                console.error('Response body:', textResponse);
                
                if (textResponse.includes('Cannot POST')) {
                    setError('Backend server is not running or admin-login endpoint is not available. Please check if the server is running on port 5000.');
                } else {
                    setError('Server configuration error. Please check the server logs.');
                }
                return;
            }

            const result = await response.json();
            console.log('Response data:', result);

            if (response.ok && result.success && result.user && result.user.role === 'admin') {
                // Store auth data
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                
                console.log('Admin login successful, calling onLoginSuccess');
                onLoginSuccess(result.user);
            } else {
                setError(result.message || 'Invalid admin credentials');
            }

        } catch (err) {
            console.error('Admin login error:', err);
            
            if (err.name === 'TypeError' && err.message.includes('fetch')) {
                setError('Cannot connect to server. Please ensure the backend is running on http://localhost:5000');
            } else if (err instanceof SyntaxError) {
                setError('Server returned invalid response. Please check the server logs.');
            } else {
                setError('Network error. Please check your connection and try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Test server connectivity on component mount
    useEffect(() => {
        const testConnection = async () => {
            try {
                const baseUrl = process.env.NODE_ENV === 'development' 
                    ? 'http://localhost:5000'
                    : '';
                const response = await fetch(`${baseUrl}/health`);
                if (!response.ok) {
                    console.warn('Health check failed:', response.status);
                }
            } catch (err) {
                console.warn('Server connection test failed:', err);
            }
        };
        
        testConnection();
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <Shield className="h-12 w-12 text-red-600 mx-auto" />
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Admin Portal</h2>
                    <p className="mt-2 text-sm text-gray-600">Sign in to access the administrative dashboard</p>
                </div>
                
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                                placeholder="Enter admin email"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                                placeholder="Enter password"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-start">
                                <XCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-red-800">{error}</span>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Shield className="h-4 w-4 mr-2" />
                        )}
                        {isSubmitting ? 'Signing in...' : 'Sign In to Admin Dashboard'}
                    </button>
                </form>

                {/* Debug info */}
                <div className="text-center text-xs text-gray-500 mt-4">
                    <details>
                        <summary className="cursor-pointer hover:text-gray-700">Debug Info</summary>
                        <div className="mt-2 text-left bg-gray-100 p-2 rounded text-xs space-y-1">
                            <p><strong>Environment:</strong> {process.env.NODE_ENV || 'development'}</p>
                            <p><strong>Current URL:</strong> {window.location.origin}</p>
                            <p><strong>Backend URL:</strong> {process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : window.location.origin}</p>
                            <p><strong>API Endpoint:</strong> /api/auth/admin-login</p>
                            <p><strong>Method:</strong> POST</p>
                        </div>
                    </details>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;