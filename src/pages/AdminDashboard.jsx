import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    fetchUserProfile,
    fetchAllUsers, createInstructor, updateUser, deleteUser, resetUserPassword,
    fetchAllCourses, deleteCourse, updateCourse, updateCourseStatus,
    fetchCategories, createCategory, updateCategory, deleteCategory,
    fetchEnrolledStudents, fetchCourseMaterials
} from '../api';
import {
    BookOpen, User, LogOut, Users, GraduationCap, Settings, 
    Plus, Edit, Trash2, Eye, X, Shield, UserPlus, Mail, Lock, 
    Phone, Globe, Calendar, FileText, Video, BarChart, Clock,
    DollarSign, Search, Filter, ChevronDown, ChevronUp, Save,
    AlertTriangle, CheckCircle, XCircle, UserCheck, UserX
} from 'lucide-react';

// Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-6">
                    <h3 className="text-2xl font-extrabold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

// Create Instructor Form
const CreateInstructorForm = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', phone: '', country: '', bio: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState('');

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.match(/^\S+@\S+\.\S+$/)) newErrors.email = 'Valid email is required';
        if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setIsSubmitting(true);
        setErrors({});
        setSuccess('');

        try {
            await createInstructor(formData);
            setSuccess('Instructor created successfully!');
            setFormData({ name: '', email: '', password: '', phone: '', country: '', bio: '' });
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);
        } catch (err) {
            setErrors({ general: err.response?.data?.message || 'Failed to create instructor' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Instructor">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500`}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500`}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500`}
                    />
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country (Optional)</label>
                    <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio (Optional)</label>
                    <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows="3"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                {errors.general && (
                    <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">{errors.general}</div>
                )}
                {success && (
                    <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">{success}</div>
                )}
                <div className="flex justify-end space-x-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Creating...' : 'Create Instructor'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// Edit User Form
const EditUserForm = ({ isOpen, onClose, user, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        country: user?.country || '',
        role: user?.role || 'student',
        status: user?.status || 'active'
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState('');

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.match(/^\S+@\S+\.\S+$/)) newErrors.email = 'Valid email is required';
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setIsSubmitting(true);
        setErrors({});
        setSuccess('');

        try {
            await updateUser(user.id, formData);
            setSuccess('User updated successfully!');
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);
        } catch (err) {
            setErrors({ general: err.response?.data?.message || 'Failed to update user' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit User">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500`}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500`}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country (Optional)</label>
                    <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="student">Student</option>
                        <option value="instructor">Instructor</option>
                        <option value="admin">Admin</option>
                        <option value="parent">Parent</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
                {errors.general && (
                    <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">{errors.general}</div>
                )}
                {success && (
                    <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">{success}</div>
                )}
                <div className="flex justify-end space-x-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Updating...' : 'Update User'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// Edit Course Form
const EditCourseForm = ({ isOpen, onClose, course, onSuccess, categories }) => {
    const [formData, setFormData] = useState({
        title: course?.title || '',
        short_description: course?.short_description || '',
        price: course?.price || 0,
        category_id: course?.category_id || '',
        status: course?.status || 'draft'
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState('');

    const validateForm = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.short_description.trim()) newErrors.short_description = 'Description is required';
        if (formData.price < 0) newErrors.price = 'Price cannot be negative';
        if (!formData.category_id) newErrors.category_id = 'Category is required';
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setIsSubmitting(true);
        setErrors({});
        setSuccess('');

        try {
            await updateCourse(course.id, formData);
            setSuccess('Course updated successfully!');
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);
        } catch (err) {
            setErrors({ general: err.response?.data?.message || 'Failed to update course' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) : value }));
        setErrors(prev => ({ ...prev, [name]: '' }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Course">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className={`w-full border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500`}
                    />
                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        name="short_description"
                        value={formData.short_description}
                        onChange={handleChange}
                        rows="3"
                        className={`w-full border ${errors.short_description ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500`}
                    />
                    {errors.short_description && <p className="text-red-500 text-xs mt-1">{errors.short_description}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                    <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className={`w-full border ${errors.price ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500`}
                    />
                    {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleChange}
                        className={`w-full border ${errors.category_id ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500`}
                    >
                        <option value="">Select a category</option>
                        {categories.map(category => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                    </select>
                    {errors.category_id && <p className="text-red-500 text-xs mt-1">{errors.category_id}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
                {errors.general && (
                    <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">{errors.general}</div>
                )}
                {success && (
                    <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">{success}</div>
                )}
                <div className="flex justify-end space-x-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Updating...' : 'Update Course'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// User Management Component
const UserManagement = ({ users, onRefresh }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [isDeleting, setIsDeleting] = useState({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [showEditUser, setShowEditUser] = useState(null);

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const handleDeleteUser = async (userId) => {
        setIsDeleting(prev => ({ ...prev, [userId]: true }));
        try {
            await deleteUser(userId);
            alert('User deleted successfully');
            onRefresh();
            setShowDeleteConfirm(null);
        } catch (err) {
            const message = err.response?.status === 404
                ? 'User not found'
                : err.response?.status === 401
                ? 'Unauthorized: Please log in again'
                : err.response?.status === 403
                ? 'Forbidden: You do not have permission to delete this user'
                : err.response?.data?.message || 'Failed to delete user';
            alert(message);
            if (err.response?.status === 401 || err.response?.status === 403) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        } finally {
            setIsDeleting(prev => ({ ...prev, [userId]: false }));
        }
    };

    const handleResetPassword = async (userId) => {
        try {
            const response = await resetUserPassword(userId);
            alert(`Password reset successfully. Temporary password: ${response.temporaryPassword}`);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to reset password');
        }
    };

    return (
        <div className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
                <div className="w-full md:w-48">
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="instructor">Instructor</option>
                        <option value="student">Student</option>
                        <option value="parent">Parent</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                <User className="h-5 w-5 text-gray-600" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                            user.role === 'instructor' ? 'bg-green-100 text-green-800' :
                                            user.role === 'parent' ? 'bg-purple-100 text-purple-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {user.status === 'active' ? (
                                                <><UserCheck className="h-3 w-3 mr-1" /> Active</>
                                            ) : (
                                                <><UserX className="h-3 w-3 mr-1" /> Inactive</>
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => setShowEditUser(user)}
                                                className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                                title="Edit User"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleResetPassword(user.id)}
                                                className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                                title="Reset Password"
                                            >
                                                <Lock className="h-4 w-4" />
                                            </button>
                                            {user.role !== 'admin' && (
                                                <button
                                                    onClick={() => setShowDeleteConfirm(user)}
                                                    className="text-red-600 hover:text-red-900 p-1 rounded"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit User Modal */}
            {showEditUser && (
                <EditUserForm
                    isOpen={true}
                    onClose={() => setShowEditUser(null)}
                    user={showEditUser}
                    onSuccess={onRefresh}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <Modal
                    isOpen={true}
                    onClose={() => setShowDeleteConfirm(null)}
                    title="Confirm Delete"
                >
                    <div className="space-y-4">
                        <p className="text-gray-700">
                            Are you sure you want to delete <strong>{showDeleteConfirm.name}</strong>? 
                            This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteUser(showDeleteConfirm.id)}
                                disabled={isDeleting[showDeleteConfirm.id]}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {isDeleting[showDeleteConfirm.id] ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

// Course Management Component
const CourseManagement = ({ courses, categories, onRefresh }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [showEditCourse, setShowEditCourse] = useState(null);
    const [isDeleting, setIsDeleting] = useState({});
    const [isToggling, setIsToggling] = useState({});

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            course.instructor_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleDeleteCourse = async (courseId) => {
        setIsDeleting(prev => ({ ...prev, [courseId]: true }));
        try {
            await deleteCourse(courseId);
            onRefresh();
            setShowDeleteConfirm(null);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete course');
        } finally {
            setIsDeleting(prev => ({ ...prev, [courseId]: false }));
        }
    };

    const handleToggleStatus = async (courseId, currentStatus) => {
        setIsToggling(prev => ({ ...prev, [courseId]: true }));
        try {
            const newStatus = currentStatus === 'published' ? 'draft' : 'published';
            await updateCourseStatus(courseId, newStatus);
            onRefresh();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update course status');
        } finally {
            setIsToggling(prev => ({ ...prev, [courseId]: false }));
        }
    };

    return (
        <div className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
                <div className="w-full md:w-48">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                        <option value="all">All Status</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map(course => (
                    <div key={course.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                        {course.thumbnail_url && (
                            <img 
                                src={course.thumbnail_url} 
                                alt={course.title}
                                className="w-full h-48 object-cover"
                            />
                        )}
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{course.title}</h3>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    course.status === 'published' ? 'bg-green-100 text-green-800' :
                                    course.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {course.status}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">by {course.instructor_name}</p>
                            <p className="text-sm text-gray-500 line-clamp-3 mb-4">{course.short_description}</p>
                            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                <span className="flex items-center">
                                    <DollarSign className="h-4 w-4 mr-1" />
                                    ${course.price}
                                </span>
                                <span className="flex items-center">
                                    <Users className="h-4 w-4 mr-1" />
                                    {course.enrolled_students_count || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setShowEditCourse(course)}
                                        className="px-3 py-1 text-xs rounded-lg font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                                        title="Edit Course"
                                    >
                                        <Edit className="h-4 w-4 inline mr-1" /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleToggleStatus(course.id, course.status)}
                                        disabled={isToggling[course.id]}
                                        className={`px-3 py-1 text-xs rounded-lg font-medium ${
                                            course.status === 'published' 
                                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                                        } disabled:opacity-50`}
                                    >
                                        {isToggling[course.id] ? 'Updating...' : course.status === 'published' ? 'Unpublish' : 'Publish'}
                                    </button>
                                </div>
                                <button
                                    onClick={() => setShowDeleteConfirm(course)}
                                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg"
                                    title="Delete Course"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredCourses.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-gray-500">No courses found matching your criteria.</p>
                </div>
            )}

            {/* Edit Course Modal */}
            {showEditCourse && (
                <EditCourseForm
                    isOpen={true}
                    onClose={() => setShowEditCourse(null)}
                    course={showEditCourse}
                    categories={categories}
                    onSuccess={onRefresh}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <Modal
                    isOpen={true}
                    onClose={() => setShowDeleteConfirm(null)}
                    title="Confirm Delete Course"
                >
                    <div className="space-y-4">
                        <p className="text-gray-700">
                            Are you sure you want to delete <strong>{showDeleteConfirm.title}</strong>? 
                            This will also delete all associated materials and enrollments. This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteCourse(showDeleteConfirm.id)}
                                disabled={isDeleting[showDeleteConfirm.id]}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {isDeleting[showDeleteConfirm.id] ? 'Deleting...' : 'Delete Course'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

// Main Admin Dashboard Component
const AdminDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [selectedTab, setSelectedTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [allUsers, setAllUsers] = useState([]);
    const [allCourses, setAllCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [coursesLoading, setCoursesLoading] = useState(false);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [showCreateInstructorModal, setShowCreateInstructorModal] = useState(false);

    const [stats, setStats] = useState({
        totalUsers: 0, adminCount: 0, instructorCount: 0, studentCount: 0,
        totalCourses: 0, publishedCourses: 0, draftCourses: 0,
        totalEnrollments: 0, totalRevenue: 0
    });

    // Load categories
    const loadCategories = async () => {
        setCategoriesLoading(true);
        try {
            const categoriesData = await fetchCategories();
            setCategories(categoriesData || []);
        } catch (err) {
            setError('Failed to load categories: ' + (err.response?.data?.message || err.message));
            setCategories([]);
        } finally {
            setCategoriesLoading(false);
        }
    };

    // Load users
    const loadUsers = async () => {
        setUsersLoading(true);
        try {
            const users = await fetchAllUsers();
            setAllUsers(users || []);
        } catch (err) {
            setError('Failed to load users: ' + (err.response?.data?.message || err.message));
            setAllUsers([]);
        } finally {
            setUsersLoading(false);
        }
    };

    // Load courses
    const loadCourses = async () => {
        setCoursesLoading(true);
        try {
            const courses = await fetchAllCourses();
            setAllCourses(courses || []);
        } catch (err) {
            setError('Failed to load courses: ' + (err.response?.data?.message || err.message));
            setAllCourses([]);
        } finally {
            setCoursesLoading(false);
        }
    };

    // Calculate statistics
    const calculateStats = useCallback(() => {
        const adminCount = allUsers.filter(u => u.role === 'admin').length;
        const instructorCount = allUsers.filter(u => u.role === 'instructor').length;
        const studentCount = allUsers.filter(u => u.role === 'student').length;
        const publishedCourses = allCourses.filter(c => c.status === 'published').length;
        const draftCourses = allCourses.filter(c => c.status === 'draft').length;
        const totalEnrollments = allCourses.reduce((sum, course) => sum + (course.enrolled_students_count || 0), 0);
        const totalRevenue = allCourses.reduce((sum, course) => sum + (course.price * (course.enrolled_students_count || 0)), 0);

        setStats({
            totalUsers: allUsers.length,
            adminCount,
            instructorCount,
            studentCount,
            totalCourses: allCourses.length,
            publishedCourses,
            draftCourses,
            totalEnrollments,
            totalRevenue
        });
    }, [allUsers, allCourses]);

    // Load all data
    const loadAllData = async () => {
        await Promise.all([
            loadUsers(),
            loadCourses(),
            loadCategories()
        ]);
    };

    // Initial load
    useEffect(() => {
        const initializeAdminDashboard = async () => {
            setLoading(true);
            setError('');
            try {
                const userData = await fetchUserProfile();
                if (!userData) {
                    navigate('/login');
                    return;
                }
                if (userData.role !== 'admin') {
                    navigate('/dashboard');
                    return;
                }
                setUser(userData);
                await loadAllData();
            } catch (err) {
                setError('Failed to initialize admin dashboard: ' + (err.response?.data?.message || err.message));
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };
        initializeAdminDashboard();
    }, [navigate]);

    // Calculate stats when data changes
    useEffect(() => {
        calculateStats();
    }, [calculateStats]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const handleRefreshData = async () => {
        setError('');
        await loadAllData();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-xl text-gray-700 mb-4">Loading admin dashboard...</div>
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Link to="" className="inline-flex items-center">
                                <BookOpen className="h-8 w-8 text-blue-600" />
                                <span className="ml-2 text-xl font-bold text-gray-900">EduPlatform</span>
                                <span className="ml-2 text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full">Admin</span>
                            </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-2 bg-red-50 px-3 py-2 rounded-lg">
                                    <Shield className="h-4 w-4 text-red-600" />
                                    <span className="text-sm font-medium text-red-800">{user?.name || 'Admin'}</span>
                                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Admin</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center space-x-1 text-gray-600 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span className="text-sm">Logout</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
                        <div className="flex space-x-3">
                            <button
                                onClick={handleRefreshData}
                                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 transition-colors"
                            >
                                <Settings className="h-5 w-5 mr-2" />
                                Refresh Data
                            </button>
                            <button
                                onClick={() => setShowCreateInstructorModal(true)}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors"
                            >
                                <UserPlus className="h-5 w-5 mr-2" />
                                Create Instructor
                            </button>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                            <div className="flex items-center">
                                <AlertTriangle className="h-5 w-5 mr-2" />
                                <span>{error}</span>
                            </div>
                        </div>
                    )}

                    {/* Tab Navigation */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <button
                            onClick={() => setSelectedTab('overview')}
                            className={`flex items-center justify-center p-4 rounded-lg shadow-md text-lg font-semibold transition-all duration-200
                                        ${selectedTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 hover:bg-blue-50'}`}
                        >
                            <BarChart className="h-6 w-6 mr-2" /> Overview
                        </button>
                        <button
                            onClick={() => setSelectedTab('users')}
                            className={`flex items-center justify-center p-4 rounded-lg shadow-md text-lg font-semibold transition-all duration-200
                                        ${selectedTab === 'users' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 hover:bg-blue-50'}`}
                        >
                            <Users className="h-6 w-6 mr-2" /> Users ({stats.totalUsers})
                            {usersLoading && <div className="ml-2 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>}
                        </button>
                        <button
                            onClick={() => setSelectedTab('courses')}
                            className={`flex items-center justify-center p-4 rounded-lg shadow-md text-lg font-semibold transition-all duration-200
                                        ${selectedTab === 'courses' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 hover:bg-blue-50'}`}
                        >
                            <BookOpen className="h-6 w-6 mr-2" /> Courses ({stats.totalCourses})
                            {coursesLoading && <div className="ml-2 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>}
                        </button>
                    </div>

                    {/* Tab Content */}
                    {selectedTab === 'overview' && (
                        <div>
                            {/* System Statistics */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <div className="bg-white rounded-lg shadow-lg p-6">
                                    <div className="flex items-center">
                                        <div className="p-3 rounded-full bg-blue-100">
                                            <Users className="h-8 w-8 text-blue-600" />
                                        </div>
                                        <div className="ml-4">
                                            <p className="text-sm font-medium text-gray-500">Total Users</p>
                                            {usersLoading ? (
                                                <div className="w-8 h-6 bg-gray-200 rounded animate-pulse"></div>
                                            ) : (
                                                <>
                                                    <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {stats.adminCount} Admin, {stats.instructorCount} Instructors, {stats.studentCount} Students
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg shadow-lg p-6">
                                    <div className="flex items-center">
                                        <div className="p-3 rounded-full bg-green-100">
                                            <BookOpen className="h-8 w-8 text-green-600" />
                                        </div>
                                        <div className="ml-4">
                                            <p className="text-sm font-medium text-gray-500">Total Courses</p>
                                            {coursesLoading ? (
                                                <div className="w-8 h-6 bg-gray-200 rounded animate-pulse"></div>
                                            ) : (
                                                <>
                                                    <p className="text-2xl font-semibold text-gray-900">{stats.totalCourses}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {stats.publishedCourses} Published, {stats.draftCourses} Draft
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg shadow-lg p-6">
                                    <div className="flex items-center">
                                        <div className="p-3 rounded-full bg-purple-100">
                                            <GraduationCap className="h-8 w-8 text-purple-600" />
                                        </div>
                                        <div className="ml-4">
                                            <p className="text-sm font-medium text-gray-500">Total Enrollments</p>
                                            <p className="text-2xl font-semibold text-gray-900">
                                                {stats.totalEnrollments}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg shadow-lg p-6">
                                    <div className="flex items-center">
                                        <div className="p-3 rounded-full bg-yellow-100">
                                            <DollarSign className="h-8 w-8 text-yellow-600" />
                                        </div>
                                        <div className="ml-4">
                                            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                                            <p className="text-2xl font-semibold text-gray-900">
                                                ${stats.totalRevenue.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white rounded-lg shadow-lg p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Users</h3>
                                    {usersLoading ? (
                                        <div className="space-y-3">
                                            {[1,2,3].map(i => (
                                                <div key={i} className="flex items-center space-x-3">
                                                    <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                                                    <div className="flex-1">
                                                        <div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                                                        <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : allUsers.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">No users found</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {allUsers.slice(0, 5).map(user => (
                                                <div key={user.id} className="flex items-center space-x-3">
                                                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                                        <User className="h-4 w-4 text-gray-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                                        <p className="text-xs text-gray-500">{user.email}</p>
                                                    </div>
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                                        user.role === 'instructor' ? 'bg-green-100 text-green-800' :
                                                        user.role === 'parent' ? 'bg-purple-100 text-purple-800' :
                                                        'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {user.role}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="bg-white rounded-lg shadow-lg p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Courses</h3>
                                    {coursesLoading ? (
                                        <div className="space-y-3">
                                            {[1,2,3].map(i => (
                                                <div key={i} className="flex items-center space-x-3">
                                                    <div className="h-12 w-16 bg-gray-200 rounded animate-pulse"></div>
                                                    <div className="flex-1">
                                                        <div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                                                        <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : allCourses.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">No courses found</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {allCourses.slice(0, 5).map(course => (
                                                <div key={course.id} className="flex items-center space-x-3">
                                                    {course.thumbnail_url && (
                                                        <img src={course.thumbnail_url} alt={course.title} className="h-12 w-16 object-cover rounded" />
                                                    )}
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{course.title}</p>
                                                        <p className="text-xs text-gray-500">by {course.instructor_name}</p>
                                                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                            <span>${course.price}</span>
                                                            <span>•</span>
                                                            <span>{course.enrolled_students_count || 0} enrolled</span>
                                                        </div>
                                                    </div>
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                        course.status === 'published' ? 'bg-green-100 text-green-800' :
                                                        course.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {course.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedTab === 'users' && (
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">User Management</h3>
                            <UserManagement users={allUsers} onRefresh={loadUsers} />
                        </div>
                    )}

                    {selectedTab === 'courses' && (
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Course Management</h3>
                            <CourseManagement courses={allCourses} categories={categories} onRefresh={loadCourses} />
                        </div>
                    )}
                </div>
            </div>

            {/* Create Instructor Modal */}
            <CreateInstructorForm
                isOpen={showCreateInstructorModal}
                onClose={() => setShowCreateInstructorModal(false)}
                onSuccess={loadAllData}
            />
        </div>
    );
};

export default AdminDashboard;