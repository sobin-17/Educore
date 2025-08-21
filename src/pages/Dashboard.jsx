import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    fetchUserProfile,
    fetchInstructorCourses, createCourse, updateCourse,
    addCourseMaterial, fetchCourseMaterials, fetchCategories, fetchEnrolledCourses,
    updateCourseMaterial, deleteCourseMaterial,
    fetchCourseChatMessages,
    sendCourseChatMessage,
    fetchEnrolledStudents // NEW: Import the new API function
} from '../api';
import {
    BookOpen, User, LogOut, Book,
    PlusCircle, Edit, Upload, FileText, Video, List, Share2, X, Image, Users, Trash2,
    PlayCircle, Info, CheckCircle, XCircle, Eye, MessageSquare, Send,
    DollarSign, Clock, BarChart, EyeIcon // Added EyeIcon for viewing students
} from 'lucide-react';

// Course Form Component (Integrated directly into Dashboard.jsx)
const CourseForm = ({ courseToEdit, onClose, onSave, categories, loadingCategories, categoryError }) => {
    const [formData, setFormData] = useState({
        title: courseToEdit?.title || '',
        slug: courseToEdit?.slug || '',
        short_description: courseToEdit?.short_description || '',
        description: courseToEdit?.description || '',
        category_id: courseToEdit?.category_id || (categories.length > 0 ? categories[0].id : ''),
        price: courseToEdit?.price || '',
        discount_price: courseToEdit?.discount_price || '',
        difficulty: courseToEdit?.difficulty || 'beginner',
        duration_hours: courseToEdit?.duration_hours || '',
        language: courseToEdit?.language || 'English',
        requirements: courseToEdit?.requirements || '', // Initialize with existing data
        what_you_learn: courseToEdit?.what_you_learn || '', // Initialize with existing data
        target_audience: courseToEdit?.target_audience || '', // Initialize with existing data
        status: courseToEdit?.status || 'published', // Default to published
        is_featured: courseToEdit?.is_featured || false,
    });
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(courseToEdit?.thumbnail_url || null); // For image preview
    const [formErrors, setFormErrors] = useState({});
    const [submitMessage, setSubmitMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Effect to update thumbnail preview if courseToEdit changes
    useEffect(() => {
        if (courseToEdit) {
            setFormData({
                title: courseToEdit.title || '',
                slug: courseToEdit.slug || '',
                short_description: courseToEdit.short_description || '',
                description: courseToEdit.description || '',
                category_id: courseToEdit.category_id || (categories.length > 0 ? categories[0].id : ''),
                price: courseToEdit.price || '',
                discount_price: courseToEdit.discount_price || '',
                difficulty: courseToEdit.difficulty || 'beginner',
                duration_hours: courseToEdit.duration_hours || '',
                language: courseToEdit.language || 'English',
                requirements: courseToEdit.requirements || '',
                what_you_learn: courseToEdit.what_you_learn || '',
                target_audience: courseToEdit.target_audience || '',
                status: courseToEdit.status || 'published',
                is_featured: courseToEdit.is_featured || false,
            });
            setThumbnailPreview(courseToEdit.thumbnail_url || null);
        } else {
            // Reset form for new course creation
            setFormData({
                title: '', slug: '', short_description: '', description: '',
                category_id: categories.length > 0 ? categories[0].id : '', price: '', discount_price: '',
                difficulty: 'beginner', duration_hours: '', language: 'English',
                requirements: '', what_you_learn: '', target_audience: '',
                status: 'published', is_featured: false,
            });
            setThumbnailPreview(null);
        }
        setThumbnailFile(null); // Clear file input when editing/creating a new course
        setFormErrors({}); // Clear errors
        setSubmitMessage(''); // Clear messages
    }, [courseToEdit, categories]);


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let newValue = type === 'checkbox' ? checked : value;

        setFormData(prev => {
            const updatedForm = {
                ...prev,
                [name]: newValue
            };

            // Auto-generate slug if title changes and slug is not manually set
            if (name === 'title' && !prev.slug) { // Only auto-generate for new courses or if editing and slug was not set
                updatedForm.slug = newValue.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
            }
            return updatedForm;
        });
        setFormErrors(prev => ({ ...prev, [name]: '' })); // Clear error on change
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setThumbnailFile(file);
        if (file) {
            setThumbnailPreview(URL.createObjectURL(file));
        } else {
            setThumbnailPreview(courseToEdit?.thumbnail_url || null); // Revert to existing if no new file
        }
        setFormErrors(prev => ({ ...prev, thumbnail: '' })); // Clear error on file change
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.title) errors.title = 'Title is required.';
        if (formData.title.length < 5 || formData.title.length > 255) errors.title = 'Title must be between 5 and 255 characters.';
        if (!formData.short_description) errors.short_description = 'Short description is required.';
        if (formData.short_description.length < 10) errors.short_description = 'Short description must be at least 10 characters.';
        if (!formData.description) errors.description = 'Description is required.';
        if (formData.description.length < 20) errors.description = 'Description must be at least 20 characters.';
        if (!formData.category_id) errors.category_id = 'Category is required.';
        if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) errors.price = 'Valid price is required.';
        if (!formData.difficulty) errors.difficulty = 'Difficulty is required.';
        if (!formData.language) errors.language = 'Language is required.';

        // Thumbnail is required only for new courses if no existing thumbnail is present
        if (!courseToEdit && !thumbnailFile && !thumbnailPreview) errors.thumbnail = 'Thumbnail is required for new courses.';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitMessage('');
        if (!validateForm()) {
            setSubmitMessage('Please correct the errors in the form.');
            return;
        }

        setIsSubmitting(true);
        const data = new FormData();
        for (const key in formData) {
            if (formData[key] !== null && formData[key] !== undefined) { // Include false boolean values
                data.append(key, formData[key]);
            }
        }
        if (thumbnailFile) {
            data.append('thumbnail', thumbnailFile);
        } else if (courseToEdit && !thumbnailPreview) {
            // If editing and user removed existing thumbnail, send a flag to backend to clear it
            data.append('clear_thumbnail', 'true');
        }


        try {
            if (courseToEdit) {
                await updateCourse(courseToEdit.id, data);
                setSubmitMessage('Course updated successfully!');
            } else {
                await createCourse(data);
                setSubmitMessage('Course created successfully!');
                setFormData({ // Reset form after successful creation
                    title: '', slug: '', short_description: '', description: '',
                    category_id: categories.length > 0 ? categories[0].id : '', price: '', discount_price: '',
                    difficulty: 'beginner', duration_hours: '', language: 'English',
                    requirements: '', what_you_learn: '', target_audience: '',
                    status: 'published', is_featured: false,
                });
                setThumbnailFile(null);
                setThumbnailPreview(null);
            }
            onSave(); // Callback to refresh course list
        } catch (err) {
            console.error("Course save error:", err);
            setSubmitMessage(err.response?.data?.message || 'Failed to save course.');
            if (err.response?.data?.errors) {
                const apiErrors = {};
                err.response.data.errors.forEach(e => {
                    // Map API validation errors to form fields
                    if (e.path) apiErrors[e.path] = e.msg;
                });
                setFormErrors(prev => ({ ...prev, ...apiErrors }));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-6">
                <h2 className="text-3xl font-extrabold text-gray-900">{courseToEdit ? 'Edit Course' : 'Create New Course'}</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <X className="h-6 w-6" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder="e.g., Introduction to Data Science"
                    />
                    {formErrors.title && <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>}
                </div>

                <div>
                    <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">Course Slug (Optional, auto-generated if empty)</label>
                    <input
                        type="text"
                        id="slug"
                        name="slug"
                        value={formData.slug}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder="Auto-generated from title, or enter manually"
                    />
                    {formErrors.slug && <p className="text-red-500 text-sm mt-1">{formErrors.slug}</p>}
                </div>

                <div>
                    <label htmlFor="short_description" className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                    <textarea
                        id="short_description"
                        name="short_description"
                        value={formData.short_description}
                        onChange={handleChange}
                        rows="2"
                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder="A brief overview of the course"
                    ></textarea>
                    {formErrors.short_description && <p className="text-red-500 text-sm mt-1">{formErrors.short_description}</p>}
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder="Detailed description of the course content, topics covered, etc."
                    ></textarea>
                    {formErrors.description && <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>}
                </div>

                <div>
                    <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    {loadingCategories ? (
                        <p className="text-gray-500 mt-1">Loading categories...</p>
                    ) : categoryError ? (
                        <p className="text-red-500 text-sm mt-1">{categoryError}</p>
                    ) : categories.length === 0 ? (
                        <p className="text-orange-500 text-sm mt-1">No categories available. Please add categories in the database.</p>
                    ) : (
                        <select
                            id="category_id"
                            name="category_id"
                            value={formData.category_id}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                        >
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    )}
                    {formErrors.category_id && <p className="text-red-500 text-sm mt-1">{formErrors.category_id}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                        <input
                            type="number"
                            id="price"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            step="0.01"
                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        />
                        {formErrors.price && <p className="text-red-500 text-sm mt-1">{formErrors.price}</p>}
                    </div>
                    <div>
                        <label htmlFor="discount_price" className="block text-sm font-medium text-gray-700 mb-1">Discount Price ($) (Optional)</label>
                        <input
                            type="number"
                            id="discount_price"
                            name="discount_price"
                            value={formData.discount_price}
                            onChange={handleChange}
                            step="0.01"
                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                        <select
                            id="difficulty"
                            name="difficulty"
                            value={formData.difficulty}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                        >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                        {formErrors.difficulty && <p className="text-red-500 text-sm mt-1">{formErrors.difficulty}</p>}
                    </div>
                    <div>
                        <label htmlFor="duration_hours" className="block text-sm font-medium text-gray-700 mb-1">Duration (Hours) (Optional)</label>
                        <input
                            type="number"
                            id="duration_hours"
                            name="duration_hours"
                            value={formData.duration_hours}
                            onChange={handleChange}
                            step="0.1"
                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                    <input
                        type="text"
                        id="language"
                        name="language"
                        value={formData.language}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                    {formErrors.language && <p className="text-red-500 text-sm mt-1">{formErrors.language}</p>}
                </div>

                <div>
                    <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-1">Requirements (Optional, newline separated)</label>
                    <textarea
                        id="requirements"
                        name="requirements"
                        value={formData.requirements}
                        onChange={handleChange}
                        rows="3"
                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    ></textarea>
                </div>

                <div>
                    <label htmlFor="what_you_learn" className="block text-sm font-medium text-gray-700 mb-1">What You'll Learn (Optional, newline separated)</label>
                    <textarea
                        id="what_you_learn"
                        name="what_you_learn"
                        value={formData.what_you_learn}
                        onChange={handleChange}
                        rows="3"
                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    ></textarea>
                </div>

                <div>
                    <label htmlFor="target_audience" className="block text-sm font-medium text-gray-700 mb-1">Target Audience (Optional)</label>
                    <textarea
                        id="target_audience"
                        name="target_audience"
                        value={formData.target_audience}
                        onChange={handleChange}
                        rows="2"
                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    ></textarea>
                </div>

                <div>
                    <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 mb-1">Course Thumbnail (Image)</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            {thumbnailPreview ? (
                                <img src={thumbnailPreview} alt="Thumbnail Preview" className="mx-auto h-24 w-auto object-cover rounded-md" />
                            ) : (
                                <Image className="mx-auto h-12 w-12 text-gray-400" />
                            )}
                            <div className="flex text-sm text-gray-600">
                                <label
                                    htmlFor="thumbnail-upload"
                                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                                >
                                    <span>Upload a file</span>
                                    <input
                                        id="thumbnail-upload"
                                        name="thumbnail"
                                        type="file"
                                        className="sr-only"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">
                                PNG, JPG, GIF up to 5MB
                            </p>
                        </div>
                    </div>
                    {formErrors.thumbnail && <p className="text-red-500 text-sm mt-1">{formErrors.thumbnail}</p>}
                </div>

                <div className="flex items-center">
                    <input
                        id="is_featured"
                        name="is_featured"
                        type="checkbox"
                        checked={formData.is_featured}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-900">Feature Course on Homepage</label>
                </div>

                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>

                {submitMessage && (
                    <div className={`p-3 rounded-lg text-sm ${submitMessage.includes('successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} shadow-md`}>
                        {submitMessage}
                    </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-3 border border-transparent rounded-lg shadow-md text-base font-medium text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                        {isSubmitting ? 'Saving...' : (courseToEdit ? 'Update Course' : 'Create Course')}
                    </button>
                </div>
            </form>
        </div>
    );
};

// Custom Modal for Confirmation/Alerts (replaces alert/confirm)
const CustomModal = ({ isOpen, title, message, onConfirm, onCancel, showCancel = true }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-auto transform transition-all scale-100 opacity-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
                <p className="text-gray-700 mb-6">{message}</p>
                <div className="flex justify-end space-x-3">
                    {showCancel && (
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

// NEW: Enrolled Students List Modal Component
const EnrolledStudentsModal = ({ isOpen, onClose, courseTitle, students, loading, error }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl mx-auto transform transition-all scale-100 opacity-100">
                <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-6">
                    <h3 className="text-2xl font-extrabold text-gray-900">Enrolled Students for "{courseTitle}"</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {loading ? (
                    <p className="text-gray-600 text-center py-8">Loading enrolled students...</p>
                ) : error ? (
                    <p className="text-red-600 text-center py-8">{error}</p>
                ) : students.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">No students enrolled in this course yet.</p>
                ) : (
                    <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Student Name
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Enrolled On
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Progress
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {students.map((student) => (
                                    <tr key={student.student_id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {student.student_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {student.student_email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {new Date(student.enrolled_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {student.progress_percentage}%
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                                            {student.enrollment_status.replace(/_/g, ' ')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex justify-end pt-6">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};


// Manage Course Materials Component (Integrated directly into Dashboard.jsx)
const ManageCourseMaterials = ({ course, onClose, onMaterialAdded, courseMaterials, loadingMaterials, materialsError, loadCourseMaterials, user }) => {
    const [materialFormData, setMaterialFormData] = useState({
        title: '',
        type: 'video',
        content: '',
        duration_seconds: '', // Keep as string for input, convert to null/number for API
        order_index: '',
        is_preview: false,
    });
    const [materialFile, setMaterialFile] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [submitMessage, setSubmitMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [copyMessage, setCopyMessage] = useState('');

    // State for editing materials
    const [editingMaterial, setEditingMaterial] = useState(null); // Holds the material object being edited
    const [editMaterialFormData, setEditMaterialFormData] = useState({
        title: '', type: '', content: '', duration_seconds: '', order_index: '', is_preview: false,
    });
    const [editMaterialFile, setEditMaterialFile] = useState(null);
    const [editFormErrors, setEditFormErrors] = useState({});
    const [isUpdatingMaterial, setIsUpdatingMaterial] = useState(false);

    // State for delete confirmation
    const [materialToDelete, setMaterialToDelete] = useState(null);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

    // NEW: Chat States
    const [chatMessages, setChatMessages] = useState([]);
    const [newChatMessage, setNewChatMessage] = useState('');
    const chatMessagesEndRef = useRef(null); // For auto-scrolling chat

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (chatMessagesEndRef.current) {
            chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages]);

    useEffect(() => {
        if (course.id) {
            loadCourseMaterials(course.id);
            fetchChatMessages(course.id); // Fetch chat messages on load
        }
    }, [course.id, loadCourseMaterials]);

    // NEW: Fetch chat messages for the selected course
    const fetchChatMessages = async (courseId) => {
        if (!courseId) return;
        try {
            const messages = await fetchCourseChatMessages(courseId);
            setChatMessages(messages || []); // Ensure messages is always an array
        } catch (err) {
            console.error('Error fetching chat messages:', err);
            // Optionally set a chat error message
        }
    };

    // NEW: Polling for chat messages
    useEffect(() => {
        let chatInterval;
        if (course?.id) { // Ensure course.id exists before setting up interval
            chatInterval = setInterval(() => {
                fetchChatMessages(course.id);
            }, 5000); // Poll every 5 seconds
        }

        return () => {
            if (chatInterval) clearInterval(chatInterval);
        };
    }, [course?.id]); // Depend on course.id to restart polling if course changes


    // Function to reset the "Add New Material" form
    const resetAddMaterialForm = useCallback(() => {
        setMaterialFormData({
            title: '', type: 'video', content: '', duration_seconds: '', order_index: '', is_preview: false,
        });
        setMaterialFile(null);
        const fileInput = document.getElementById('materialFile');
        if (fileInput) fileInput.value = ''; // Clear the actual file input element
        setFormErrors({}); // Clear form errors
        setSubmitMessage(''); // Clear submission message
    }, []);

    // Function to reset the "Edit Material" form
    const resetEditMaterialForm = useCallback(() => {
        setEditingMaterial(null); // Close edit form
        setEditMaterialFormData({
            title: '', type: '', content: '', duration_seconds: '', order_index: '', is_preview: false,
        });
        setEditMaterialFile(null);
        const fileInput = document.getElementById('editMaterialFile');
        if (fileInput) fileInput.value = ''; // Clear the actual file input element
        setEditFormErrors({}); // Clear edit form errors
        setSubmitMessage(''); // Clear submission message
    }, []);


    const handleMaterialChange = (e) => {
        const { name, value, type, checked } = e.target;
        setMaterialFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setFormErrors(prev => ({ ...prev, [name]: '' })); // Clear error on change
        if (name === 'type') {
            // Reset file and content when type changes
            setMaterialFile(null);
            setMaterialFormData(prev => ({ ...prev, content: '' }));
            const fileInput = document.getElementById('materialFile');
            if (fileInput) fileInput.value = '';
            setFormErrors(prev => ({ ...prev, file: '', content: '' }));
        }
    };

    const handleEditMaterialChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditMaterialFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setEditFormErrors(prev => ({ ...prev, [name]: '' }));
        if (name === 'type') {
            setEditMaterialFile(null);
            setEditMaterialFormData(prev => ({ ...prev, content: '' }));
            const fileInput = document.getElementById('editMaterialFile');
            if (fileInput) fileInput.value = '';
            setEditFormErrors(prev => ({ ...prev, file: '', content: '' }));
        }
    };

    const handleMaterialFileChange = (e) => {
        const file = e.target.files[0];
        setMaterialFile(file);
        setFormErrors(prev => ({ ...prev, file: '' })); // Clear previous file error

        if (file) {
            const maxVideoSize = 500 * 1024 * 1024; // 500MB
            const maxDocumentSize = 20 * 1024 * 1024; // 20MB for documents

            if (materialFormData.type === 'video') {
                if (!file.type.startsWith('video/')) {
                    setFormErrors(prev => ({ ...prev, file: 'Only video files are allowed (e.g., .mp4, .mov).' }));
                    setMaterialFile(null);
                    e.target.value = ''; // Clear file input
                    return;
                }
                if (file.size > maxVideoSize) {
                    setFormErrors(prev => ({ ...prev, file: `Video file size must be less than ${maxVideoSize / (1024 * 1024)}MB.` }));
                    setMaterialFile(null);
                    e.target.value = ''; // Clear file input
                    return;
                }
            } else if (materialFormData.type === 'document') {
                // Check for specific document types (PDF, common text types)
                const allowedDocTypes = [
                    'application/pdf',
                    'text/plain',
                    'text/markdown',
                    'text/html',
                    'application/msword', // .doc
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
                ];
                if (!allowedDocTypes.includes(file.type)) {
                    setFormErrors(prev => ({ ...prev, file: 'Only PDF, text, or Word documents are allowed.' }));
                    setMaterialFile(null);
                    e.target.value = '';
                    return;
                }
                if (file.size > maxDocumentSize) {
                    setFormErrors(prev => ({ ...prev, file: `Document file size must be less than ${maxDocumentSize / (1024 * 1024)}MB.` }));
                    setMaterialFile(null);
                    e.target.value = '';
                    return;
                }
            }
        }
    };

    const handleEditMaterialFileChange = (e) => {
        const file = e.target.files[0];
        setEditMaterialFile(file);
        setEditFormErrors(prev => ({ ...prev, file: '' })); // Clear previous file error

        if (file) {
            const maxVideoSize = 500 * 1024 * 1024; // 500MB
            const maxDocumentSize = 20 * 1024 * 1024; // 20MB for documents

            if (editMaterialFormData.type === 'video') {
                if (!file.type.startsWith('video/')) {
                    setEditFormErrors(prev => ({ ...prev, file: 'Only video files are allowed (e.g., .mp4, .mov).' }));
                    setEditMaterialFile(null);
                    e.target.value = '';
                    return;
                }
                if (file.size > maxVideoSize) {
                    setEditFormErrors(prev => ({ ...prev, file: `Video file size must be less than ${maxVideoSize / (1024 * 1024)}MB.` }));
                    setEditMaterialFile(null);
                    e.target.value = '';
                    return;
                }
            } else if (editMaterialFormData.type === 'document') {
                const allowedDocTypes = [
                    'application/pdf',
                    'text/plain',
                    'text/markdown',
                    'text/html',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                ];
                if (!allowedDocTypes.includes(file.type)) {
                    setEditFormErrors(prev => ({ ...prev, file: 'Only PDF, text, or Word documents are allowed.' }));
                    setEditMaterialFile(null);
                    e.target.value = '';
                    return;
                }
                if (file.size > maxDocumentSize) {
                    setEditFormErrors(prev => ({ ...prev, file: `Document file size must be less than ${maxDocumentSize / (1024 * 1024)}MB.` }));
                    setEditMaterialFile(null);
                    e.target.value = '';
                    return;
                }
            }
        }
    };

    const validateAddMaterialForm = () => {
        const errors = {};
        if (!materialFormData.title || materialFormData.title.length < 3 || materialFormData.title.length > 255) {
            errors.title = 'Material title is required and must be between 3 and 255 characters.';
        }
        if (!materialFormData.type) {
            errors.type = 'Material type is required.';
        }

        if (materialFormData.type === 'video' && !materialFile) {
            errors.file = 'Video file is required for video materials.';
        }
        if (materialFormData.type === 'document' && !materialFile && !materialFormData.content) {
            errors.file = 'Document file or text content is required for document materials.';
        }
        if (materialFormData.content && materialFormData.content.length > 5000) {
            errors.content = 'Content cannot exceed 5000 characters.';
        }
        if (materialFormData.duration_seconds && (isNaN(parseInt(materialFormData.duration_seconds)) || parseInt(materialFormData.duration_seconds) < 0)) {
            errors.duration_seconds = 'Duration must be a non-negative integer.';
        }
        if (materialFormData.order_index && (isNaN(parseInt(materialFormData.order_index)) || parseInt(materialFormData.order_index) < 0)) {
            errors.order_index = 'Order index must be a non-negative integer.';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAddMaterialSubmit = async (e) => {
        e.preventDefault();
        setSubmitMessage('');
        if (!validateAddMaterialForm()) {
            setSubmitMessage('Please correct the errors in the form.');
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('title', materialFormData.title);
        formData.append('type', materialFormData.type);
        if (materialFile) {
            formData.append(materialFormData.type === 'video' ? 'video' : 'document', materialFile);
        }
        formData.append('content', materialFormData.content || '');
        formData.append('duration_seconds', materialFormData.duration_seconds || 0);
        formData.append('order_index', materialFormData.order_index || 0);
        formData.append('is_preview', materialFormData.is_preview ? '1' : '0');

        try {
            await addCourseMaterial(course.id, formData);
            setSubmitMessage('Material added successfully!');
            resetAddMaterialForm();
            onMaterialAdded(); // Callback to refresh materials list in parent
        } catch (err) {
            console.error('Add material error:', err);
            setSubmitMessage(err.response?.data?.message || 'Failed to add material.');
            if (err.response?.data?.errors) {
                const apiErrors = {};
                err.response.data.errors.forEach(e => {
                    if (e.path) apiErrors[e.path] = e.msg;
                });
                setFormErrors(prev => ({ ...prev, ...apiErrors }));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditMaterialClick = (material) => {
        setEditingMaterial(material);
        setEditMaterialFormData({
            title: material.title,
            type: material.type,
            content: material.content || '',
            duration_seconds: material.duration_seconds || '',
            order_index: material.order_index || '',
            is_preview: material.is_preview,
        });
        setEditMaterialFile(null); // Clear file input for edit, user re-uploads if needed
        setEditFormErrors({});
        setSubmitMessage('');
    };

    const validateEditMaterialForm = () => {
        const errors = {};
        if (!editMaterialFormData.title || editMaterialFormData.title.length < 3 || editMaterialFormData.title.length > 255) {
            errors.title = 'Material title is required and must be between 3 and 255 characters.';
        }
        if (!editMaterialFormData.type) {
            errors.type = 'Material type is required.';
        }

        // If type is video and no new file, and no existing file, then error
        if (editMaterialFormData.type === 'video' && !editMaterialFile && !editingMaterial.file_path) {
            errors.file = 'Video file is required for video materials.';
        }
        // If type is document and no new file, and no existing file or content, then error
        if (editMaterialFormData.type === 'document' && !editMaterialFile && !editingMaterial.file_path && !editMaterialFormData.content) {
            errors.file = 'Document file or text content is required for document materials.';
        }
        if (editMaterialFormData.content && editMaterialFormData.content.length > 5000) {
            errors.content = 'Content cannot exceed 5000 characters.';
        }
        if (editMaterialFormData.duration_seconds && (isNaN(parseInt(editMaterialFormData.duration_seconds)) || parseInt(editMaterialFormData.duration_seconds) < 0)) {
            errors.duration_seconds = 'Duration must be a non-negative integer.';
        }
        if (editMaterialFormData.order_index && (isNaN(parseInt(editMaterialFormData.order_index)) || parseInt(editMaterialFormData.order_index) < 0)) {
            errors.order_index = 'Order index must be a non-negative integer.';
        }
        setEditFormErrors(errors);
        return Object.keys(errors).length === 0;
    };


    const handleUpdateMaterialSubmit = async (e) => {
        e.preventDefault();
        setSubmitMessage('');
        if (!validateEditMaterialForm()) {
            setSubmitMessage('Please correct the errors in the edit form.');
            return;
        }

        setIsUpdatingMaterial(true);
        const formData = new FormData();
        formData.append('title', editMaterialFormData.title);
        formData.append('type', editMaterialFormData.type);
        if (editMaterialFile) {
            formData.append(editMaterialFormData.type === 'video' ? 'video' : 'document', editMaterialFile);
        }
        formData.append('content', editMaterialFormData.content || '');
        formData.append('duration_seconds', editMaterialFormData.duration_seconds || 0);
        formData.append('order_index', editMaterialFormData.order_index || 0);
        formData.append('is_preview', editMaterialFormData.is_preview ? '1' : '0');

        // If user explicitly cleared content and file (e.g., changed type from file-based to text-based, or vice versa)
        // This logic might need refinement based on backend API for clearing fields.
        // For now, if a new file is uploaded, it replaces. If content is empty, it clears.
        // If changing from file to text and no new file, ensure old file is marked for deletion.
        if (editingMaterial.file_path && !editMaterialFile && editMaterialFormData.type !== editingMaterial.type) {
            formData.append('clear_content_and_file', 'true'); // Custom flag for backend to clear old file
        }


        try {
            await updateCourseMaterial(course.id, editingMaterial.id, formData);
            setSubmitMessage('Material updated successfully!');
            resetEditMaterialForm();
            onMaterialAdded(); // Callback to refresh materials list in parent
        } catch (err) {
            console.error('Update material error:', err);
            setSubmitMessage(err.response?.data?.message || 'Failed to update material.');
            if (err.response?.data?.errors) {
                const apiErrors = {};
                err.response.data.errors.forEach(e => {
                    if (e.path) apiErrors[e.path] = e.msg;
                });
                setEditFormErrors(prev => ({ ...prev, ...apiErrors }));
            }
        } finally {
            setIsUpdatingMaterial(false);
        }
    };

    const handleDeleteClick = (material) => {
        setMaterialToDelete(material);
        setShowDeleteConfirmModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!materialToDelete) return;
        try {
            await deleteCourseMaterial(course.id, materialToDelete.id);
            setSubmitMessage('Material deleted successfully!');
            onMaterialAdded(); // Refresh materials list
        } catch (err) {
            console.error('Delete material error:', err);
            setSubmitMessage(err.response?.data?.message || 'Failed to delete material.');
        } finally {
            setShowDeleteConfirmModal(false);
            setMaterialToDelete(null);
        }
    };

    const handleCopyLink = (url) => {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(url)
                .then(() => {
                    setCopyMessage('Link copied to clipboard!');
                    setTimeout(() => setCopyMessage(''), 3000);
                })
                .catch(err => {
                    console.error('Failed to copy link:', err);
                    setCopyMessage('Failed to copy link. Please copy manually.');
                });
        } else {
            // Fallback for older browsers or non-secure contexts
            const textArea = document.createElement("textarea");
            textArea.value = url;
            textArea.style.position = "fixed"; // Avoid scrolling to bottom
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                setCopyMessage('Link copied to clipboard!');
                setTimeout(() => setCopyMessage(''), 3000);
            } catch (err) {
                console.error('Fallback: Oops, unable to copy', err);
                setCopyMessage('Failed to copy link. Please copy manually.');
            }
            document.body.removeChild(textArea);
        }
    };

    // NEW: Chat Handlers
    const handleNewChatMessageChange = (e) => {
        setNewChatMessage(e.target.value);
    };

    const handleSendChatMessage = async (e) => {
        e.preventDefault();
        if (!newChatMessage.trim() || !course?.id || !user) {
            return; // Don't send empty messages or if no course/user selected
        }

        try {
            // Optimistically add message to UI
            const tempMessage = {
                id: Date.now(), // Temporary ID
                user_id: user.id,
                user_name: user.name,
                user_role: user.role,
                message_content: newChatMessage,
                timestamp: new Date().toISOString(),
                is_optimistic: true // Flag for optimistic update
            };
            setChatMessages(prev => [...prev, tempMessage]);
            setNewChatMessage(''); // Clear input immediately

            await sendCourseChatMessage(course.id, newChatMessage);
            // On successful send, re-fetch to get actual message with correct ID and timestamp
            await fetchChatMessages(course.id);
        } catch (err) {
            console.error('Error sending chat message:', err);
            setSubmitMessage(err.response?.data?.message || 'Failed to send message.');
            // Revert optimistic update if sending fails
            setChatMessages(prev => prev.filter(msg => !msg.is_optimistic));
            setNewChatMessage(newChatMessage); // Restore message content
        }
    };


    return (
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-6">
                <h2 className="text-3xl font-extrabold text-gray-900">Manage Materials for "{course.title}"</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <X className="h-6 w-6" />
                </button>
            </div>

            {submitMessage && (
                <div className={`p-3 mb-4 rounded-lg text-sm ${submitMessage.includes('successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} shadow-md`}>
                    {submitMessage}
                </div>
            )}
            {copyMessage && (
                <div className="p-3 mb-4 rounded-lg text-sm bg-blue-100 text-blue-800 shadow-md">
                    {copyMessage}
                </div>
            )}

            {/* Add New Material Form */}
            <div className="border border-gray-200 p-6 rounded-lg mb-8">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Add New Material</h3>
                <form onSubmit={handleAddMaterialSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="materialTitle" className="block text-sm font-medium text-gray-700">Material Title</label>
                        <input
                            type="text"
                            id="materialTitle"
                            name="title"
                            value={materialFormData.title}
                            onChange={handleMaterialChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            placeholder="e.g., Lecture 1: Introduction"
                        />
                        {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
                    </div>
                    <div>
                        <label htmlFor="materialType" className="block text-sm font-medium text-gray-700">Material Type</label>
                        <select
                            id="materialType"
                            name="type"
                            value={materialFormData.type}
                            onChange={handleMaterialChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        >
                            <option value="video">Video</option>
                            <option value="document">Document (PDF/Text)</option>
                            <option value="quiz">Quiz</option>
                            <option value="other">Other</option>
                        </select>
                        {formErrors.type && <p className="text-red-500 text-xs mt-1">{formErrors.type}</p>}
                    </div>

                    {/* Conditional File/Content Input for Add Form */}
                    {(materialFormData.type === 'video' || materialFormData.type === 'document') && (
                        <div>
                            <label htmlFor="materialFile" className="block text-sm font-medium text-gray-700">
                                {materialFormData.type === 'video' ? 'Video File (MP4)' : 'Document File (PDF/Text/Word) (Optional)'}
                            </label>
                            <input
                                type="file"
                                id="materialFile"
                                name="file"
                                accept={materialFormData.type === 'video' ? 'video/mp4,video/quicktime' : '.pdf,text/plain,text/markdown,text/html,.doc,.docx'}
                                onChange={handleMaterialFileChange}
                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            {formErrors.file && <p className="text-red-500 text-xs mt-1">{formErrors.file}</p>}
                        </div>
                    )}
                    {materialFormData.type === 'document' && (
                        <div>
                            <label htmlFor="materialContent" className="block text-sm font-medium text-gray-700">Or Text Content (Optional)</label>
                            <textarea
                                id="materialContent"
                                name="content"
                                value={materialFormData.content}
                                onChange={handleMaterialChange}
                                rows="4"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                placeholder="Enter text content for the document here..."
                            ></textarea>
                            {formErrors.content && <p className="text-red-500 text-xs mt-1">{formErrors.content}</p>}
                        </div>
                    )}

                    {(materialFormData.type === 'video' || materialFormData.type === 'document') && (
                        <div>
                            <label htmlFor="duration_seconds" className="block text-sm font-medium text-gray-700">Duration (Seconds) (Optional)</label>
                            <input
                                type="number"
                                id="duration_seconds"
                                name="duration_seconds"
                                value={materialFormData.duration_seconds}
                                onChange={handleMaterialChange}
                                min="0"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                placeholder="e.g., 3600 for 1 hour"
                            />
                            {formErrors.duration_seconds && <p className="text-red-500 text-xs mt-1">{formErrors.duration_seconds}</p>}
                        </div>
                    )}

                    <div>
                        <label htmlFor="order_index" className="block text-sm font-medium text-gray-700">Order Index</label>
                        <input
                            type="number"
                            id="order_index"
                            name="order_index"
                            value={materialFormData.order_index}
                            onChange={handleMaterialChange}
                            min="0"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            placeholder="e.g., 1, 2, 3 (for ordering materials)"
                        />
                        {formErrors.order_index && <p className="text-red-500 text-xs mt-1">{formErrors.order_index}</p>}
                    </div>
                    <div className="flex items-center">
                        <input
                            id="is_preview"
                            name="is_preview"
                            type="checkbox"
                            checked={materialFormData.is_preview}
                            onChange={handleMaterialChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_preview" className="ml-2 block text-sm text-gray-900">
                            Allow Preview (Free access for non-enrolled students)
                        </label>
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Adding...' : 'Add Material'}
                    </button>
                </form>
            </div>

            {/* Edit Material Form */}
            {editingMaterial && (
                <div className="border border-gray-200 p-6 rounded-lg mb-8 bg-yellow-50">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-4">Edit Material: "{editingMaterial.title}"</h3>
                    <form onSubmit={handleUpdateMaterialSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="editMaterialTitle" className="block text-sm font-medium text-gray-700">Material Title</label>
                            <input
                                type="text"
                                id="editMaterialTitle"
                                name="title"
                                value={editMaterialFormData.title}
                                onChange={handleEditMaterialChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                placeholder="e.g., Lecture 1: Introduction"
                            />
                            {editFormErrors.title && <p className="text-red-500 text-xs mt-1">{editFormErrors.title}</p>}
                        </div>
                        <div>
                            <label htmlFor="editMaterialType" className="block text-sm font-medium text-gray-700">Material Type</label>
                            <select
                                id="editMaterialType"
                                name="type"
                                value={editMaterialFormData.type}
                                onChange={handleEditMaterialChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            >
                                <option value="video">Video</option>
                                <option value="document">Document (PDF/Text)</option>
                                <option value="quiz">Quiz</option>
                                <option value="other">Other</option>
                            </select>
                            {editFormErrors.type && <p className="text-red-500 text-xs mt-1">{editFormErrors.type}</p>}
                        </div>

                        {/* Conditional File/Content Input for Edit Form */}
                        {(editMaterialFormData.type === 'video' || editMaterialFormData.type === 'document') && (
                            <div>
                                <label htmlFor="editMaterialFile" className="block text-sm font-medium text-gray-700">
                                    {editMaterialFormData.type === 'video' ? 'New Video File (MP4) (Optional)' : 'New Document File (PDF/Text/Word) (Optional)'}
                                </label>
                                <input
                                    type="file"
                                    id="editMaterialFile"
                                    name="file"
                                    accept={editMaterialFormData.type === 'video' ? 'video/mp4,video/quicktime' : '.pdf,text/plain,text/markdown,text/html,.doc,.docx'}
                                    onChange={handleEditMaterialFileChange}
                                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                {editFormErrors.file && <p className="text-red-500 text-xs mt-1">{editFormErrors.file}</p>}
                                {editingMaterial.file_url && !editMaterialFile && (
                                    <p className="text-gray-500 text-sm mt-1">Current File: <a href={editingMaterial.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Existing File</a></p>
                                )}
                            </div>
                        )}
                        {editMaterialFormData.type === 'document' && (
                            <div>
                                <label htmlFor="editMaterialContent" className="block text-sm font-medium text-gray-700">Or Text Content (Optional)</label>
                                <textarea
                                    id="editMaterialContent"
                                    name="content"
                                    value={editMaterialFormData.content}
                                    onChange={handleEditMaterialChange}
                                    rows="4"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    placeholder="Enter text content for the document here..."
                                ></textarea>
                                {editFormErrors.content && <p className="text-red-500 text-xs mt-1">{editFormErrors.content}</p>}
                            </div>
                        )}

                        {(editMaterialFormData.type === 'video' || editMaterialFormData.type === 'document') && (
                            <div>
                                <label htmlFor="editDurationSeconds" className="block text-sm font-medium text-gray-700">Duration (Seconds) (Optional)</label>
                                <input
                                    type="number"
                                    id="editDurationSeconds"
                                    name="duration_seconds"
                                    value={editMaterialFormData.duration_seconds}
                                    onChange={handleEditMaterialChange}
                                    min="0"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    placeholder="e.g., 3600 for 1 hour"
                                />
                                {editFormErrors.duration_seconds && <p className="text-red-500 text-xs mt-1">{editFormErrors.duration_seconds}</p>}
                            </div>
                        )}

                        <div>
                            <label htmlFor="editOrderIndex" className="block text-sm font-medium text-gray-700">Order Index</label>
                            <input
                                type="number"
                                id="editOrderIndex"
                                name="order_index"
                                value={editMaterialFormData.order_index}
                                onChange={handleEditMaterialChange}
                                min="0"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                placeholder="e.g., 1, 2, 3 (for ordering materials)"
                            />
                            {editFormErrors.order_index && <p className="text-red-500 text-xs mt-1">{editFormErrors.order_index}</p>}
                        </div>
                        <div className="flex items-center">
                            <input
                                id="editIsPreview"
                                name="is_preview"
                                type="checkbox"
                                checked={editMaterialFormData.is_preview}
                                onChange={handleEditMaterialChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="editIsPreview" className="ml-2 block text-sm text-gray-900">
                                Allow Preview (Free access for non-enrolled students)
                            </label>
                        </div>
                        <div className="flex space-x-4">
                            <button
                                type="submit"
                                disabled={isUpdatingMaterial}
                                className="flex-1 bg-yellow-600 text-white py-2.5 rounded-lg font-semibold hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUpdatingMaterial ? 'Updating...' : 'Update Material'}
                            </button>
                            <button
                                type="button"
                                onClick={resetEditMaterialForm}
                                className="flex-1 bg-gray-300 text-gray-800 py-2.5 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                            >
                                Cancel Edit
                            </button>
                        </div>
                    </form>
                </div>
            )}


            {/* Existing Materials List */}
            <h3 className="text-2xl font-extrabold text-gray-900 mb-4">Existing Materials</h3>
            {loadingMaterials ? (
                <p className="text-gray-600">Loading materials...</p>
            ) : materialsError ? (
                <p className="text-red-600">{materialsError}</p>
            ) : courseMaterials.length === 0 ? (
                <p className="text-gray-600">No materials added to this course yet.</p>
            ) : (
                <ul className="space-y-4">
                    {courseMaterials.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)).map(material => (
                        <li key={material.id} className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between shadow-sm bg-gray-50">
                            <div className="flex items-center space-x-3 flex-grow mb-3 md:mb-0">
                                {material.type === 'video' && <Video className="h-6 w-6 text-blue-500" />}
                                {material.type === 'document' && <FileText className="h-6 w-6 text-green-500" />}
                                {(material.type === 'quiz' || material.type === 'other') && <List className="h-6 w-6 text-purple-500" />}
                                <div>
                                    <p className="font-semibold text-gray-800">{material.title}</p>
                                    <p className="text-sm text-gray-600">
                                        {material.type.charAt(0).toUpperCase() + material.type.slice(1)}
                                        {material.duration_seconds > 0 && ` - ${Math.floor(material.duration_seconds / 60)}m ${material.duration_seconds % 60}s`}
                                        {material.is_preview ? <span className="ml-2 text-green-500 flex items-center"><CheckCircle className="h-4 w-4 mr-1" /> Preview</span> : <span className="ml-2 text-red-500 flex items-center"><XCircle className="h-4 w-4 mr-1" /> No Preview</span>}
                                    </p>
                                    {material.file_url && (
                                        <a href={material.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm flex items-center mt-1">
                                            <Eye className="h-4 w-4 mr-1" /> View File
                                        </a>
                                    )}
                                    {material.content && material.type === 'document' && !material.file_url && (
                                        <p className="text-sm text-gray-700 mt-1 max-h-16 overflow-y-auto">{material.content.substring(0, 100)}...</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex space-x-2 flex-shrink-0">
                                {material.file_url && (
                                    <button
                                        onClick={() => handleCopyLink(material.file_url)}
                                        className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center text-sm"
                                        title="Copy Link"
                                    >
                                        <Share2 className="h-4 w-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => handleEditMaterialClick(material)}
                                    className="p-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors flex items-center justify-center text-sm"
                                    title="Edit Material"
                                >
                                    <Edit className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(material)}
                                    className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center justify-center text-sm"
                                    title="Delete Material"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* NEW: Course Chat Section */}
            <div className="mt-8 border border-gray-200 p-6 rounded-lg">
                <h4 className="text-2xl font-extrabold text-gray-900 mb-4 flex items-center">
                    <MessageSquare className="h-6 w-6 mr-2 text-blue-600" /> Course Chat
                </h4>
                <div className="h-80 bg-gray-100 p-4 rounded-md overflow-y-auto flex flex-col space-y-3 mb-4 border border-gray-200">
                    {chatMessages.length === 0 ? (
                        <p className="text-gray-500 text-center mt-auto mb-auto">No messages yet. Start the conversation!</p>
                    ) : (
                        chatMessages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${
                                    message.user_id === user.id ? 'justify-end' : 'justify-start'
                                }`}
                            >
                                <div
                                    className={`max-w-[70%] p-3 rounded-lg shadow-sm ${
                                        message.user_id === user.id
                                            ? 'bg-blue-500 text-white rounded-br-none'
                                            : 'bg-gray-300 text-gray-800 rounded-bl-none'
                                    }`}
                                >
                                    <p className="font-semibold text-sm mb-1">
                                        {message.user_id === user.id ? 'You' : message.user_name || 'Unknown User'}
                                        <span className={`ml-2 text-xs px-1 py-0.5 rounded ${
                                            message.user_role === 'instructor' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                                        }`}>
                                            {message.user_role}
                                        </span>
                                    </p>
                                    <p className="text-sm">{message.message_content}</p>
                                    <p className="text-right text-xs mt-1 opacity-75">
                                        {new Date(message.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={chatMessagesEndRef} /> {/* Scroll target */}
                </div>
                <form onSubmit={handleSendChatMessage} className="flex space-x-2">
                    <input
                        type="text"
                        value={newChatMessage}
                        onChange={handleNewChatMessageChange}
                        placeholder="Type your message..."
                        className="flex-grow border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                        type="submit"
                        className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </form>
            </div>


            <CustomModal
                isOpen={showDeleteConfirmModal}
                title="Confirm Deletion"
                message={`Are you sure you want to delete "${materialToDelete?.title}"? This action cannot be undone.`}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setShowDeleteConfirmModal(false)}
            />
        </div>
    );
};


const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [selectedTab, setSelectedTab] = useState('profile'); // 'profile', 'my-courses', 'create-course', 'manage-materials', 'enrolled-students-summary'
    const [instructorCourses, setInstructorCourses] = useState([]);
    const [enrolledCourses, setEnrolledCourses] = useState([]); // For student role
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [categoryError, setCategoryError] = useState('');

    const [courseToEdit, setCourseToEdit] = useState(null); // State to pass to CourseForm for editing
    const [selectedCourseForMaterials, setSelectedCourseForMaterials] = useState(null); // Course for material management

    const [loadingMaterials, setLoadingMaterials] = useState(false);
    const [materialsError, setMaterialsError] = useState('');
    const [courseMaterials, setCourseMaterials] = useState([]);

    // NEW: States for Enrolled Students List Modal
    const [showEnrolledStudentsModal, setShowEnrolledStudentsModal] = useState(false);
    const [enrolledStudentsList, setEnrolledStudentsList] = useState([]);
    const [loadingEnrolledStudents, setLoadingEnrolledStudents] = useState(false);
    const [enrolledStudentsError, setEnrolledStudentsError] = useState('');
    const [selectedCourseForStudents, setSelectedCourseForStudents] = useState(null); // To hold the course whose students are being viewed


    // Main effect for fetching user profile and initial course data
    useEffect(() => {
        const getUserProfileAndCourses = async () => {
            setLoading(true);
            try {
                const userData = await fetchUserProfile();
                setUser(userData);
                console.log('User profile fetched:', userData); // Debugging: Log user data

                if (userData.role === 'instructor') {
                    await getInstructorCourses();
                } else if (userData.role === 'student') {
                    await getEnrolledCourses(); // Explicitly call for students
                }
            } catch (err) {
                console.error('Error fetching user profile or courses:', err);
                // If user profile fails, it might mean the token is invalid or user is not logged in.
                // Redirect to login to ensure proper authentication flow.
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        const getCategories = async () => {
            try {
                setLoadingCategories(true);
                const data = await fetchCategories();
                setCategories(data);
            } catch (err) {
                console.error('Error fetching categories:', err);
                setCategoryError('Failed to load categories.');
            } finally {
                setLoadingCategories(false);
            }
        };

        getUserProfileAndCourses();
        getCategories();
    }, [navigate]); // Depend on navigate to re-run if route changes significantly

    // Function to fetch instructor courses
    const getInstructorCourses = async () => {
        try {
            const courses = await fetchInstructorCourses();
            setInstructorCourses(courses || []);
            console.log('Instructor courses fetched:', courses); // Debugging: Log instructor courses
        } catch (err) {
            console.error('Error fetching instructor courses:', err);
            setInstructorCourses([]);
        }
    };

    // Function to fetch enrolled courses for students
    const getEnrolledCourses = async () => {
        try {
            const courses = await fetchEnrolledCourses();
            setEnrolledCourses(courses || []);
            console.log('Enrolled courses fetched:', courses); // Debugging: Log enrolled courses
        } catch (err) {
            console.error('Error fetching enrolled courses:', err);
            setEnrolledCourses([]);
        }
    };

    const loadCourseMaterials = useCallback(async (courseId) => {
        setLoadingMaterials(true);
        setMaterialsError('');
        try {
            const materials = await fetchCourseMaterials(courseId);
            setCourseMaterials(materials || []); // Ensure materials is always an array
        } catch (err) {
            console.error('Error fetching course materials:', err);
            setMaterialsError(err.response?.data?.message || 'Failed to load materials.');
            setCourseMaterials([]);
        } finally {
            setLoadingMaterials(false);
        }
    }, []);


    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/');
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-red-100 text-red-800';
            case 'instructor': return 'bg-green-100 text-green-800';
            case 'parent': return 'bg-purple-100 text-purple-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    const handleCourseFormClose = () => {
        setCourseToEdit(null); // Exit edit mode
        setSelectedTab('my-courses'); // Go back to my courses list
    };

    const handleCourseSave = () => {
        getInstructorCourses(); // Refresh courses list
        setCourseToEdit(null); // Exit edit mode
        setSelectedTab('my-courses'); // Go back to my courses list
    };

    const handleEditCourse = (course) => {
        setCourseToEdit(course);
        setSelectedTab('create-course'); // Use the 'create-course' tab for editing
    };

    const handleManageMaterials = (course) => {
        setSelectedCourseForMaterials(course);
        setSelectedTab('manage-materials');
    };

    const handleMaterialAddedOrUpdated = () => {
        if (selectedCourseForMaterials) {
            loadCourseMaterials(selectedCourseForMaterials.id);
        }
    };

    // NEW: Handler to view enrolled students for a specific course
    const handleViewEnrolledStudents = async (course) => {
        setSelectedCourseForStudents(course); // Set the course for the modal title
        setShowEnrolledStudentsModal(true);
        setLoadingEnrolledStudents(true);
        setEnrolledStudentsError('');
        try {
            const students = await fetchEnrolledStudents(course.id);
            setEnrolledStudentsList(students || []);
        } catch (err) {
            console.error('Error fetching enrolled students list:', err);
            setEnrolledStudentsError(err.response?.data?.message || 'Failed to load enrolled students.');
            setEnrolledStudentsList([]);
        } finally {
            setLoadingEnrolledStudents(false);
        }
    };

    const handleCloseEnrolledStudentsModal = () => {
        setShowEnrolledStudentsModal(false);
        setEnrolledStudentsList([]);
        setSelectedCourseForStudents(null);
        setEnrolledStudentsError('');
    };


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-xl text-gray-700">Loading dashboard...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-red-800 p-8">
                <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
                <p className="text-lg mb-6">Please log in to view the dashboard.</p>
                <Link to="/login" className="text-blue-600 hover:underline">Go to Login</Link>
            </div>
        );
    }

    // Render based on user role
    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Link to="/" className="inline-flex items-center">
                                <BookOpen className="h-8 w-8 text-blue-600" />
                                <span className="ml-2 text-xl font-bold text-gray-900">EduPlatform</span>
                            </Link>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Link to="/dashboard" className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                                    <User className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-800">{user.name}</span>
                                    <span className={`text-xs ${getRoleColor(user.role)} px-2 py-1 rounded`}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
                                </Link>
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

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">
                        {user.role === 'instructor' ? 'Instructor Dashboard' : 'Student Dashboard'}
                    </h2>

                    {user.role === 'instructor' && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <button
                                onClick={() => setSelectedTab('profile')}
                                className={`flex items-center justify-center p-4 rounded-lg shadow-md text-lg font-semibold transition-all duration-200
                                            ${selectedTab === 'profile' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 hover:bg-blue-50'}`}
                            >
                                <User className="h-6 w-6 mr-2" /> Profile
                            </button>
                            <button
                                onClick={() => { setSelectedTab('my-courses'); setCourseToEdit(null); setSelectedCourseForMaterials(null); }}
                                className={`flex items-center justify-center p-4 rounded-lg shadow-md text-lg font-semibold transition-all duration-200
                                            ${selectedTab === 'my-courses' || selectedTab === 'manage-materials' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 hover:bg-blue-50'}`}
                            >
                                <Book className="h-6 w-6 mr-2" /> My Courses
                            </button>
                            <button
                                onClick={() => { setSelectedTab('create-course'); setCourseToEdit(null); setSelectedCourseForMaterials(null); }}
                                className={`flex items-center justify-center p-4 rounded-lg shadow-md text-lg font-semibold transition-all duration-200
                                            ${selectedTab === 'create-course' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 hover:bg-blue-50'}`}
                            >
                                <PlusCircle className="h-6 w-6 mr-2" /> Create Course
                            </button>
                            {/* Removed the 'Enrolled Students Summary' tab as it's now integrated per-course */}
                            {/* <button
                                onClick={() => setSelectedTab('enrolled-students-summary')}
                                className={`flex items-center justify-center p-4 rounded-lg shadow-md text-lg font-semibold transition-all duration-200
                                            ${selectedTab === 'enrolled-students-summary' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 hover:bg-blue-50'}`}
                            >
                                <Users className="h-6 w-6 mr-2" /> Enrolled Students
                            </button> */}
                        </div>
                    )}

                    {/* Content based on selected tab */}
                    {selectedTab === 'profile' && (
                        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">My Profile</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-gray-700 mb-2"><strong>Name:</strong> {user.name}</p>
                                    <p className="text-gray-700 mb-2"><strong>Email:</strong> {user.email}</p>
                                    <p className="text-gray-700 mb-2"><strong>Role:</strong> <span className={`text-sm font-semibold ${getRoleColor(user.role)} px-2 py-1 rounded`}>{user.role}</span></p>
                                    {user.phone && <p className="text-gray-700 mb-2"><strong>Phone:</strong> {user.phone}</p>}
                                    {user.country && <p className="text-gray-700 mb-2"><strong>Country:</strong> {user.country}</p>}
                                    {user.date_of_birth && <p className="text-gray-700 mb-2"><strong>Date of Birth:</strong> {new Date(user.date_of_birth).toLocaleDateString()}</p>}
                                    {user.gender && <p className="text-gray-700 mb-2"><strong>Gender:</strong> {user.gender}</p>}
                                    {user.bio && <p className="text-gray-700 mb-2"><strong>Bio:</strong> {user.bio}</p>}
                                    <p className="text-gray-700 mb-2"><strong>Member Since:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                                </div>
                                {user.profile_image_url && (
                                    <div className="flex justify-center items-center">
                                        <img src={user.profile_image_url} alt="Profile" className="w-48 h-48 rounded-full object-cover shadow-md" />
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => navigate('/profile-settings')}
                                className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                            >
                                Edit Profile
                            </button>
                        </div>
                    )}

                    {user.role === 'instructor' && selectedTab === 'my-courses' && (
                        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">My Courses</h3>
                            {instructorCourses.length === 0 ? (
                                <p className="text-gray-600">You haven't created any courses yet. Start by creating one!</p>
                            ) : (
                                <div className="space-y-6">
                                    {instructorCourses.map(course => (
                                        <div key={course.id} className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center shadow-sm">
                                            {course.thumbnail_url && (
                                                <img src={course.thumbnail_url} alt={course.title} className="w-full md:w-32 h-20 md:h-20 object-cover rounded-md mb-4 md:mb-0 md:mr-4" />
                                            )}
                                            <div className="flex-grow">
                                                <h4 className="text-xl font-semibold text-gray-800">{course.title}</h4>
                                                <p className="text-gray-600 text-sm">{course.short_description}</p>
                                                <div className="flex flex-wrap items-center text-gray-500 text-xs mt-2 space-x-3">
                                                    <span className="flex items-center"><DollarSign className="h-4 w-4 mr-1" /> ${course.price}</span>
                                                    {course.discount_price && <span className="flex items-center"><DollarSign className="h-4 w-4 mr-1" /> ${course.discount_price} (Discount)</span>}
                                                    <span className="flex items-center"><Clock className="h-4 w-4 mr-1" /> {course.duration_hours} hrs</span>
                                                    <span className="flex items-center"><BarChart className="h-4 w-4 mr-1" /> {course.difficulty}</span>
                                                    <span className="flex items-center"><Info className="h-4 w-4 mr-1" /> Status: {course.status}</span>
                                                    {/* Display Enrolled Students Count */}
                                                    <span className="flex items-center text-blue-600 font-medium">
                                                        <Users className="h-4 w-4 mr-1" /> Enrolled: {course.enrolled_students_count || 0}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mt-4 md:mt-0">
                                                <button
                                                    onClick={() => handleEditCourse(course)}
                                                    className="flex items-center justify-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                                                >
                                                    <Edit className="h-4 w-4 mr-1" /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleManageMaterials(course)}
                                                    className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                                                >
                                                    <Upload className="h-4 w-4 mr-1" /> Materials
                                                </button>
                                                {/* NEW: View Enrolled Students Button */}
                                                <button
                                                    onClick={() => handleViewEnrolledStudents(course)}
                                                    className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                                >
                                                    <EyeIcon className="h-4 w-4 mr-1" /> View Students
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {user.role === 'instructor' && selectedTab === 'create-course' && (
                        <CourseForm
                            courseToEdit={courseToEdit}
                            onClose={handleCourseFormClose}
                            onSave={handleCourseSave}
                            categories={categories}
                            loadingCategories={loadingCategories}
                            categoryError={categoryError}
                        />
                    )}

                    {user.role === 'instructor' && selectedTab === 'manage-materials' && selectedCourseForMaterials && (
                        <ManageCourseMaterials
                            course={selectedCourseForMaterials}
                            onClose={() => setSelectedTab('my-courses')}
                            onMaterialAdded={handleMaterialAddedOrUpdated}
                            courseMaterials={courseMaterials}
                            loadingMaterials={loadingMaterials}
                            materialsError={materialsError}
                            loadCourseMaterials={loadCourseMaterials}
                            user={user} // Pass user prop for chat functionality
                        />
                    )}

                    {/* The general "Enrolled Students Summary" tab is no longer needed as the view is per-course */}
                    {/* {user.role === 'instructor' && selectedTab === 'enrolled-students-summary' && (
                        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Enrolled Students Summary</h3>
                            {instructorCourses.length === 0 ? (
                                <p className="text-gray-600">You have no courses to display enrollment data for.</p>
                            ) : (
                                <div className="space-y-6">
                                    {instructorCourses.map(course => (
                                        <div key={course.id} className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center shadow-sm">
                                            {course.thumbnail_url && (
                                                <img src={course.thumbnail_url} alt={course.title} className="w-full md:w-24 h-16 md:h-16 object-cover rounded-md mb-4 md:mb-0 md:mr-4" />
                                            )}
                                            <div className="flex-grow">
                                                <h4 className="text-xl font-semibold text-gray-800">{course.title}</h4>
                                                <p className="text-gray-600 text-sm">{course.short_description}</p>
                                            </div>
                                            <div className="flex items-center text-blue-600 font-bold text-lg">
                                                <Users className="h-6 w-6 mr-2" />
                                                <span>{course.enrolled_students_count || 0} Students Enrolled</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )} */}


                    {user.role === 'student' && (
                        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">My Enrolled Courses</h3>
                            {enrolledCourses.length === 0 ? (
                                <p className="text-gray-600">You are not enrolled in any courses yet. Explore our <Link to="/" className="text-blue-600 hover:underline">homepage</Link> to find courses!</p>
                            ) : (
                                <div className="space-y-6">
                                    {enrolledCourses.map(course => (
                                        <div key={course.id} className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center shadow-sm">
                                            {course.thumbnail_url && (
                                                <img src={course.thumbnail_url} alt={course.title} className="w-full md:w-32 h-20 md:h-20 object-cover rounded-md mb-4 md:mb-0 md:mr-4" />
                                            )}
                                            <div className="flex-grow">
                                                <h4 className="text-xl font-semibold text-gray-800">{course.title}</h4>
                                                <p className="text-gray-600 text-sm">by {course.instructor_name}</p>
                                                <div className="flex flex-wrap items-center text-gray-500 text-xs mt-2 space-x-3">
                                                    <span className="flex items-center"><Video className="h-4 w-4 mr-1" /> {course.total_videos || 0} Videos</span>
                                                    <span className="flex items-center"><FileText className="h-4 w-4 mr-1" /> {course.total_materials || 0} Materials</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mt-4 md:mt-0">
                                                <Link
                                                    to={`/courses/${course.slug}`}
                                                    className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                                >
                                                    <PlayCircle className="h-4 w-4 mr-1" /> Continue Learning
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* NEW: Enrolled Students Modal */}
            <EnrolledStudentsModal
                isOpen={showEnrolledStudentsModal}
                onClose={handleCloseEnrolledStudentsModal}
                courseTitle={selectedCourseForStudents?.title || ''}
                students={enrolledStudentsList}
                loading={loadingEnrolledStudents}
                error={enrolledStudentsError}
            />
        </div>
    );
};

export default Dashboard;
