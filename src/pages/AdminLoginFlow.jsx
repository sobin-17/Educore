// AdminLoginFlow.jsx (React Frontend)
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
    
        try {
            // Add more detailed logging
            console.log('Attempting login with:', { email: formData.email });
            
            const response = await fetch('/api/auth/admin-login', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData),
            });
    
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers.get('content-type'));
    
            // Check if response is actually JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('Server returned non-JSON response');
                const textResponse = await response.text();
                console.error('Response body:', textResponse);
                setError('Server error: Invalid response format. Check if the backend is running.');
                return;
            }
    
            const result = await response.json();
            console.log('Response data:', result);
    
            if (response.ok && result.user && result.user.role === 'admin') {
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                onLoginSuccess(result.user);
            } else {
                setError(result.message || 'Invalid admin credentials');
            }
        } catch (err) {
            console.error('Fetch error details:', err);
            
            // More specific error messages
            if (err.name === 'TypeError' && err.message.includes('fetch')) {
                setError('Cannot connect to server. Please ensure the backend is running.');
            } else if (err instanceof SyntaxError) {
                setError('Server returned invalid response. This usually means the API endpoint doesn\'t exist.');
            } else {
                setError('Network error. Please check your connection and try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };
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
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
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
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
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
                            <div className="flex items-center">
                                <XCircle className="h-4 w-4 text-red-600 mr-2" />
                                <span className="text-sm text-red-800">{error}</span>
                            </div>
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
                        {isSubmitting ? 'Signing in...' : 'Sign In to Admin Dashboard'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl'
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className={`bg-white rounded-xl shadow-2xl p-6 w-full ${sizeClasses[size]} mx-auto max-h-[90vh] overflow-y-auto`}>
                <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

const CreateInstructorForm = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', phone: '', country: '', date_of_birth: '', gender: '', bio: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name || formData.name.length < 2) newErrors.name = 'Name must be at least 2 characters';
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Valid email is required';
        if (!formData.password || formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        setMessage('');

        try {
            const response = await fetch('/api/admin/create-instructor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ ...formData, role: 'instructor', status: 'active' })
            });

            const result = await response.json();
            if (response.ok) {
                setMessage('Instructor account created successfully! They can now log in with their credentials.');
                setFormData({ name: '', email: '', password: '', phone: '', country: '', date_of_birth: '', gender: '', bio: '' });
                onSuccess && onSuccess();
                setTimeout(() => onClose(), 3000);
            } else {
                setMessage(result.message || 'Failed to create instructor account');
            }
        } catch (err) {
            setMessage('Failed to create instructor. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Instructor Account" size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                        <UserPlus className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                        <div>
                            <h4 className="text-sm font-semibold text-blue-800">Account Creation</h4>
                            <p className="text-sm text-blue-700 mt-1">
                                Creates a new instructor account with login credentials.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter full name"
                        />
                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Login email address"
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Initial Password *</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Set login password"
                        />
                        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Phone number"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                        <input
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Country"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input
                            type="date"
                            name="date_of_birth"
                            value={formData.date_of_birth}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                        <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows="3"
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Instructor bio"
                    />
                </div>
                {message && (
                    <div className={`p-3 rounded-lg text-sm ${message.includes('successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        <div className="flex items-center">
                            {message.includes('successfully') ? <CheckCircle className="h-4 w-4 mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                            {message}
                        </div>
                    </div>
                )}
                <div className="flex justify-end space-x-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {isSubmitting ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Creating Account...
                            </>
                        ) : (
                            <>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Create Account
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const UserManagement = ({ users, onRefresh }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [resetMessage, setResetMessage] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ totalPages: 1 });

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
    });

    const handlePasswordReset = async () => {
        if (!selectedUser) return;
        setIsResettingPassword(true);
        setResetMessage('');
        try {
            const response = await fetch(`/api/admin/users/${selectedUser.id}/reset-password`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const result = await response.json();
            if (response.ok) {
                setResetMessage(result.message);
            } else {
                setResetMessage(result.message || 'Failed to reset password');
            }
        } catch (err) {
            setResetMessage('Failed to reset password. Please try again.');
        } finally {
            setIsResettingPassword(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.ok) {
                onRefresh();
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to delete user');
            }
        } catch (err) {
            console.error('Delete user error:', err);
            alert('Failed to delete user');
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-red-100 text-red-800';
            case 'instructor': return 'bg-green-100 text-green-800';
            case 'parent': return 'bg-purple-100 text-purple-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'inactive': return 'bg-yellow-100 text-yellow-800';
            case 'suspended': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">User Management</h3>
                <div className="flex space-x-4">
                    <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="instructor">Instructor</option>
                        <option value="student">Student</option>
                        <option value="parent">Parent</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                    </select>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role & Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Info</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                                            <User className="h-6 w-6 text-gray-600" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="space-y-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                            {user.role}
                                        </span>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                                            {user.status}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <div>{user.phone || 'N/A'}</div>
                                    <div className="text-gray-500">{user.country || 'N/A'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div>Created: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</div>
                                    <div>Last Login: {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => { setSelectedUser(user); setShowPasswordResetModal(true); }}
                                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                            title="Reset Password"
                                        >
                                            <Key className="h-4 w-4" />
                                        </button>
                                        <button
                                            className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50"
                                            title="Edit User"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                            title="Delete User"
                                            disabled={user.role === 'admin'}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-between items-center mt-4">
                <button
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
                >
                    Previous
                </button>
                <span>Page {page} of {pagination.totalPages}</span>
                <button
                    onClick={() => setPage(prev => prev + 1)}
                    disabled={page >= pagination.totalPages}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
                >
                    Next
                </button>
            </div>
            <Modal
                isOpen={showPasswordResetModal}
                onClose={() => { setShowPasswordResetModal(false); setResetMessage(''); }}
                title="Reset User Password"
                size="sm"
            >
                <div className="text-center">
                    <Key className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-700 mb-4">
                        Reset password for "{selectedUser?.name}"?
                    </p>
                    {resetMessage ? (
                        <div className={`bg-${resetMessage.includes('successfully') ? 'green' : 'red'}-50 border border-${resetMessage.includes('successfully') ? 'green' : 'red'}-200 rounded-lg p-4 mb-4`}>
                            <p className={`text-sm text-${resetMessage.includes('successfully') ? 'green' : 'red'}-800`}>{resetMessage}</p>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-yellow-800">
                                This will generate a new temporary password and send it to the user's email.
                            </p>
                        </div>
                    )}
                    <div className="flex justify-center space-x-3">
                        <button
                            onClick={() => { setShowPasswordResetModal(false); setResetMessage(''); }}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                        >
                            {resetMessage ? 'Close' : 'Cancel'}
                        </button>
                        {!resetMessage && (
                            <button
                                onClick={handlePasswordReset}
                                disabled={isResettingPassword}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
                            >
                                {isResettingPassword ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}
                                Reset Password
                            </button>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

const AdminDashboard = ({ user, onLogout }) => {
    const [selectedTab, setSelectedTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateInstructorModal, setShowCreateInstructorModal] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/users?page=1&limit=10', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            setUsers(data.users);
            setPagination(data.pagination);
        } catch (err) {
            console.error('Error loading users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        onLogout();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-xl text-gray-700 flex items-center">
                    <RefreshCw className="h-6 w-6 mr-2 animate-spin" />
                    Loading dashboard...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <BookOpen className="h-8 w-8 text-blue-600" />
                            <span className="ml-2 text-xl font-bold text-gray-900">EduPlatform</span>
                            <span className="ml-2 text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full">Admin</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 bg-red-50 px-3 py-2 rounded-lg">
                                <Shield className="h-4 w-4 text-red-600" />
                                <span className="text-sm font-medium text-red-800">{user.name}</span>
                                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Admin</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-1 text-gray-600 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="text-sm">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
                        <button
                            onClick={() => setShowCreateInstructorModal(true)}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
                        >
                            <UserPlus className="h-5 w-5 mr-2" />
                            Create Instructor
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <button
                            onClick={() => setSelectedTab('users')}
                            className={`flex items-center justify-center p-4 rounded-lg shadow-md text-lg font-semibold ${selectedTab === 'users' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 hover:bg-blue-50'}`}
                        >
                            <Users className="h-6 w-6 mr-2" /> User Management
                        </button>
                        <button
                            onClick={() => setSelectedTab('overview')}
                            className={`flex items-center justify-center p-4 rounded-lg shadow-md text-lg font-semibold ${selectedTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 hover:bg-blue-50'}`}
                        >
                            <Users className="h-6 w-6 mr-2" /> Overview
                        </button>
                        <button
                            onClick={() => setSelectedTab('settings')}
                            className={`flex items-center justify-center p-4 rounded-lg shadow-md text-lg font-semibold ${selectedTab === 'settings' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 hover:bg-blue-50'}`}
                        >
                            <Settings className="h-6 w-6 mr-2" /> Settings
                        </button>
                    </div>
                    {selectedTab === 'users' && <UserManagement users={users} onRefresh={loadUsers} />}
                    {selectedTab === 'overview' && (
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">System Overview</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">{users.length}</div>
                                    <div className="text-sm text-gray-600">Total Users</div>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">
                                        {users.filter(u => u.role === 'instructor').length}
                                    </div>
                                    <div className="text-sm text-gray-600">Instructors</div>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {users.filter(u => u.role === 'student').length}
                                    </div>
                                    <div className="text-sm text-gray-600">Students</div>
                                </div>
                                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                    <div className="text-2xl font-bold text-yellow-600">
                                        {users.filter(u => u.status === 'active').length}
                                    </div>
                                    <div className="text-sm text-gray-600">Active Users</div>
                                </div>
                            </div>
                        </div>
                    )}
                    {selectedTab === 'settings' && (
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Admin Settings</h3>
                            <div className="space-y-6">
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <div className="flex items-start">
                                        <XCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                                        <div>
                                            <h4 className="text-sm font-semibold text-yellow-800">Admin Privileges</h4>
                                            <p className="text-sm text-yellow-700 mt-1">
                                                You have full administrative access to manage users and create instructor accounts.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <button
                                        onClick={() => setShowCreateInstructorModal(true)}
                                        className="flex items-center justify-center p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50"
                                    >
                                        <UserPlus className="h-6 w-6 text-green-600 mr-2" />
                                        <span className="text-green-700 font-medium">Create Instructor Account</span>
                                    </button>
                                    <button
                                        onClick={loadUsers}
                                        className="flex items-center justify-center p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50"
                                    >
                                        <RefreshCw className="h-6 w-6 text-blue-600 mr-2" />
                                        <span className="text-blue-700 font-medium">Refresh Data</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <CreateInstructorForm
                isOpen={showCreateInstructorModal}
                onClose={() => setShowCreateInstructorModal(false)}
                onSuccess={loadUsers}
            />
        </div>
    );
};

const AdminLoginFlow = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
            try {
                const parsedUser = JSON.parse(userData);
                if (parsedUser.role === 'admin') {
                    setUser(parsedUser);
                } else {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            } catch (err) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const handleLoginSuccess = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        setUser(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <>
            {!user ? (
                <AdminLogin onLoginSuccess={handleLoginSuccess} />
            ) : (
                <AdminDashboard user={user} onLogout={handleLogout} />
            )}
        </>
    );
};

export default AdminLoginFlow;