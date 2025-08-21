import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    fetchCourseDetails,
    enrollCourse,
    fetchUserProfile,
    fetchCourseMaterials,
    fetchCourseChatMessages,
    sendCourseChatMessage,
    fetchEnrolledCourses,
    // Change this line:
    updateProfile  // Import the existing function from your api file
} from '../api';
import {
    BookOpen, Users, Star, Play, User, LogOut, Edit,
    DollarSign, Clock, BarChart, FileText, Video, MessageSquare, Send, CheckCircle, List,
    X, Download
} from 'lucide-react';

const CourseDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [enrollmentMessage, setEnrollmentMessage] = useState('');
    const [courseMaterials, setCourseMaterials] = useState([]);
    const [loadingMaterials, setLoadingMaterials] = useState(true);
    const [materialsError, setMaterialsError] = useState('');

    const [chatMessages, setChatMessages] = useState([]);
    const [newChatMessage, setNewChatMessage] = useState('');
    const chatMessagesEndRef = React.useRef(null);

    const [showingMaterialModal, setShowingMaterialModal] = useState(false);
    const [currentMaterialToView, setCurrentMaterialToView] = useState(null);
    const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);

    // State for editing user details
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [editedEmail, setEditedEmail] = useState('');
    const [editedPhone, setEditedPhone] = useState('');
    const [editError, setEditError] = useState('');

    const loadCourseMaterials = useCallback(async (courseId) => {
        setLoadingMaterials(true);
        setMaterialsError('');
        try {
            const materials = await fetchCourseMaterials(courseId);
            setCourseMaterials(materials || []);
        } catch (err) {
            console.error('Error fetching course materials:', err);
            setMaterialsError(err.response?.data?.message || 'Failed to load materials.');
            setCourseMaterials([]);
        } finally {
            setLoadingMaterials(false);
        }
    }, []);

    const fetchChatMessages = useCallback(async (courseId) => {
        if (!courseId) return;
        try {
            const messages = await fetchCourseChatMessages(courseId);
            setChatMessages(messages || []);
        } catch (err) {
            console.error('Error fetching chat messages:', err);
        }
    }, []);

    const handleViewMaterial = (material) => {
        setCurrentMaterialToView(material);
        setShowingMaterialModal(true);
    };

    const handleCloseMaterialModal = () => {
        setShowingMaterialModal(false);
        setCurrentMaterialToView(null);
    };

    const handleOpenEnrollmentModal = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role !== 'student') {
            setEnrollmentMessage('Only students can enroll in courses.');
            return;
        }
        if (isEnrolled) {
            setEnrollmentMessage('You are already enrolled in this course.');
            return;
        }

        // Initialize edited state with current user data
        if (user) {
            setEditedName(user.name);
            setEditedEmail(user.email);
            setEditedPhone(user.phone || '');
        }

        setEditError('');
        setIsEditing(false); // Start in read-only mode
        setShowEnrollmentModal(true);
    };

    const handleCloseEnrollmentModal = () => {
        setShowEnrollmentModal(false);
    };

    const handleEditToggle = () => {
        setIsEditing(prev => !prev);
        if (isEditing) {
            setEditError(''); // Clear error if canceling edit
        }
    };

    const handleSaveDetails = async () => {
        setEditError('');
        // Basic validation
        if (!editedName.trim() || !editedEmail.trim()) {
            setEditError('Name and email cannot be empty.');
            return;
        }
    
        try {
            // Create a FormData object for the update
            const formData = new FormData();
            formData.append('name', editedName);
            formData.append('email', editedEmail);
            formData.append('phone', editedPhone);
    
            // Call the API function to update the user's profile
            const response = await updateProfile(formData);
            
            console.log('API Response:', response); // Debug log to see actual response structure
            
            // Handle different possible response formats
            let updatedUser = null;
            
            if (response && response.user) {
                // Expected format: { user: {...} }
                updatedUser = response.user;
            } else if (response && response.data && response.data.user) {
                // Format: { data: { user: {...} } }
                updatedUser = response.data.user;
            } else if (response && response.id) {
                // Direct user object format: { id, name, email, ... }
                updatedUser = response;
            } else if (response && response.data && response.data.id) {
                // Format: { data: { id, name, email, ... } }
                updatedUser = response.data;
            } else {
                // If we can't identify the user data, create it from our form data
                console.warn('Unexpected response format, creating user object from form data');
                updatedUser = {
                    ...user, // Keep existing user data
                    name: editedName,
                    email: editedEmail,
                    phone: editedPhone
                };
            }
            
            // Update the user state with the new data
            setUser(updatedUser);
            
            // Also update localStorage to keep it in sync
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            // Exit editing mode
            setIsEditing(false);
            
            // Optional: Show success message
            console.log('Profile updated successfully');
            
        } catch (err) {
            console.error('Error updating user profile:', err);
            console.error('Error response:', err.response); // Additional debug info
            
            // More specific error handling
            if (err.response && err.response.data && err.response.data.message) {
                setEditError(err.response.data.message);
            } else if (err.response && err.response.data && err.response.data.error) {
                setEditError(err.response.data.error);
            } else if (err.message) {
                setEditError(err.message);
            } else {
                setEditError('Failed to update profile. Please try again.');
            }
        }
    };

    const confirmEnrollment = async () => {
        handleCloseEnrollmentModal();
        if (!course) {
            setEnrollmentMessage('Course data not loaded.');
            return;
        }

        setEnrollmentMessage('Enrolling...');
        try {
            await enrollCourse(course.id);
            setIsEnrolled(true);
            setEnrollmentMessage('Successfully enrolled in the course!');
            await loadCourseMaterials(course.id);
            await fetchChatMessages(course.id);
        } catch (err) {
            console.error('Enrollment error:', err);
            const errorMessage = err.response?.data?.message || 'Failed to enroll in course.';
            setEnrollmentMessage(errorMessage);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError('');
            setEnrollmentMessage('');

            try {
                const courseData = await fetchCourseDetails(slug);
                setCourse(courseData);

                const userData = await fetchUserProfile();
                setUser(userData);

                if (userData && userData.role === 'student') {
                    const enrolledCourses = await fetchEnrolledCourses();
                    const alreadyEnrolled = enrolledCourses.some(
                        (enrolledCourse) => enrolledCourse.course_id === courseData.id
                    );
                    setIsEnrolled(alreadyEnrolled);
                    if (alreadyEnrolled) {
                        setEnrollmentMessage('You are already enrolled in this course.');
                    }
                }

                const isInstructorOfCourse = userData && userData.role === 'instructor' && courseData.instructor_id === userData.id;

                if (isInstructorOfCourse || (userData && isEnrolled)) {
                    await loadCourseMaterials(courseData.id);
                    await fetchChatMessages(courseData.id);
                }

            } catch (err) {
                console.error('Error loading course details or user profile:', err);
                setError(err.response?.data?.message || 'Failed to load course details. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [slug, isEnrolled, loadCourseMaterials, fetchChatMessages]);

    useEffect(() => {
        let chatInterval;
        if (course?.id && ((user?.role === 'instructor' && course.instructor_id === user.id) || isEnrolled)) {
            chatInterval = setInterval(() => {
                fetchChatMessages(course.id);
            }, 5000);
        }

        return () => {
            if (chatInterval) clearInterval(chatInterval);
        };
    }, [course?.id, user, isEnrolled, fetchChatMessages, course?.instructor_id]);

    const handleNewChatMessageChange = (e) => {
        setNewChatMessage(e.target.value);
    };

    const handleSendChatMessage = async (e) => {
        e.preventDefault();
        if (!newChatMessage.trim() || !course?.id || !user) {
            return;
        }

        try {
            const tempMessage = {
                id: Date.now(),
                user_id: user.id,
                user_name: user.name,
                user_role: user.role,
                message_content: newChatMessage,
                timestamp: new Date().toISOString(),
                is_optimistic: true
            };
            setChatMessages(prev => [...prev, tempMessage]);
            setNewChatMessage('');

            await sendCourseChatMessage(course.id, newChatMessage);
            await fetchChatMessages(course.id);
        } catch (err) {
            console.error('Error sending chat message:', err);
            setChatMessages(prev => prev.filter(msg => !msg.is_optimistic));
            setNewChatMessage(newChatMessage);
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


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-xl text-gray-700">Loading course details...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-red-800 p-8">
                <h2 className="text-2xl font-bold mb-4">Error Loading Course</h2>
                <p className="text-lg mb-6">{error}</p>
                <Link to="/" className="text-blue-600 hover:underline">Go back to Home</Link>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-700 p-8">
                <h2 className="text-2xl font-bold mb-4">Course Not Found</h2>
                <p className="text-lg mb-6">The course you are looking for does not exist or is not published.</p>
                <Link to="/" className="text-blue-600 hover:underline">Go back to Home</Link>
            </div>
        );
    }

    const isInstructorOfThisCourse = user && user.role === 'instructor' && user.id === course.instructor_id;
    const canAccessFullMaterials = isInstructorOfThisCourse || isEnrolled;


    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200">
                                <BookOpen className="h-8 w-8" />
                                <span className="ml-2 text-xl font-bold text-gray-900">EduPlatform</span>
                            </Link>
                        </div>

                        <div className="flex items-center space-x-4">
                            {user ? (
                                <div className="flex items-center space-x-2">
                                    <Link to="/dashboard" className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                                        <User className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-800">{user.name}</span>
                                        <span className={`text-xs ${getRoleColor(user.role)} px-2 py-1 rounded`}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
                                    </Link>
                                    <button
                                        onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); navigate('/'); }}
                                        className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors duration-200"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span className="text-sm">Logout</span>
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Link to="/login" className="text-gray-700 hover:text-blue-600 font-medium">Login</Link>
                                    <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <section className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-16 px-4">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">{course.title}</h1>
                        <p className="text-lg mb-6 opacity-90">{course.short_description}</p>
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="flex items-center">
                                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                                <span className="ml-1 text-xl font-semibold">
                                    {course.average_rating ? course.average_rating.toFixed(1) : 'N/A'}
                                </span>
                                <span className="ml-2 text-sm opacity-80">({course.review_count || 0} reviews)</span>
                            </div>
                            <span className="text-sm opacity-80">
                                <Users className="h-4 w-4 inline-block mr-1" /> {course.enrolled_students || 0} students
                            </span>
                        </div>
                        <div className="flex items-center space-x-6 text-sm mb-6">
                            <span className="flex items-center"><Clock className="h-4 w-4 mr-1" /> {course.duration_hours} hours</span>
                            <span className="flex items-center"><BarChart className="h-4 w-4 mr-1" /> {course.difficulty}</span>
                            <span className="flex items-center"><FileText className="h-4 w-4 mr-1" /> {course.total_materials || 0} materials</span>
                            <span className="flex items-center"><Video className="h-4 w-4 mr-1" /> {course.total_videos || 0} videos</span>
                        </div>
                        <div className="flex items-center space-x-2 mb-6">
                            {course.instructor_profile_image_url && (
                                <img src={course.instructor_profile_image_url} alt={course.instructor_name} className="w-10 h-10 rounded-full object-cover" />
                            )}
                            <span className="text-sm opacity-90">Created by <span className="font-semibold">{course.instructor_name}</span></span>
                        </div>

                        {user?.role === 'student' && !isEnrolled && (
                            <button
                                onClick={handleOpenEnrollmentModal}
                                className="bg-white text-blue-700 px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-100 transition-colors shadow-lg flex items-center justify-center"
                            >
                                <DollarSign className="h-6 w-6 mr-2" />
                                Enroll Now for ${course.discount_price || course.price}
                            </button>
                        )}
                        {user?.role === 'student' && isEnrolled && (
                            <button
                                disabled
                                className="bg-green-500 text-white px-8 py-3 rounded-lg font-bold text-lg cursor-not-allowed flex items-center justify-center"
                            >
                                <CheckCircle className="h-6 w-6 mr-2" /> Already Enrolled
                            </button>
                        )}
                        {user?.role === 'instructor' && isInstructorOfThisCourse && (
                             <Link
                                 to="/dashboard"
                                 className="bg-yellow-500 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-yellow-600 transition-colors shadow-lg flex items-center justify-center"
                             >
                                 <Edit className="h-6 w-6 mr-2" /> Manage Course
                             </Link>
                        )}
                        {user?.role === 'student' && !user.id && (
                             <button
                                 onClick={() => navigate('/login')}
                                 className="bg-white text-blue-700 px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-100 transition-colors shadow-lg flex items-center justify-center"
                             >
                                 <DollarSign className="h-6 w-6 mr-2" />
                                 Login to Enroll
                             </button>
                        )}


                        {enrollmentMessage && (
                            <p className={`mt-4 text-center p-3 rounded-lg text-sm ${enrollmentMessage.includes('Successfully') || enrollmentMessage.includes('already enrolled') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {enrollmentMessage}
                            </p>
                        )}
                    </div>
                    <div>
                        {course.thumbnail_url && (
                            <img src={course.thumbnail_url} alt={course.title} className="w-full h-auto rounded-lg shadow-xl" />
                        )}
                    </div>
                </div>
            </section>

            <section className="max-w-7xl mx-auto py-16 px-4 grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-10">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Course Description</h2>
                        <p className="text-gray-700 leading-relaxed">{course.description}</p>
                    </div>

                    {course.what_you_learn && (
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">What You'll Learn</h2>
                            <ul className="list-disc list-inside text-gray-700 space-y-2">
                                {course.what_you_learn.split('\n').map((item, index) => (
                                    item.trim() && <li key={index}>{item.trim()}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {course.requirements && (
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Requirements</h2>
                            <ul className="list-disc list-inside text-gray-700 space-y-2">
                                {course.requirements.split('\n').map((item, index) => (
                                    item.trim() && <li key={index}>{item.trim()}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {course.target_audience && (
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Who is this course for?</h2>
                            <p className="text-gray-700 leading-relaxed">{course.target_audience}</p>
                        </div>
                    )}

                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Course Content</h2>
                        {loadingMaterials ? (
                            <p className="text-gray-600">Loading materials...</p>
                        ) : materialsError ? (
                            <p className="text-red-600">{materialsError}</p>
                        ) : courseMaterials.length === 0 ? (
                            <p className="text-gray-600">No materials available for this course yet.</p>
                        ) : (
                            <ul className="space-y-4">
                                {courseMaterials.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)).map(material => (
                                    <li key={material.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between shadow-sm bg-white">
                                        <div className="flex items-center space-x-3">
                                            {material.type === 'video' && <Video className="h-6 w-6 text-blue-500" />}
                                            {material.type === 'document' && <FileText className="h-6 w-6 text-green-500" />}
                                            {(material.type === 'quiz' || material.type === 'other') && <List className="h-6 w-6 text-purple-500" />}
                                            <div>
                                                <p className="font-semibold text-gray-800">{material.title}</p>
                                                <p className="text-sm text-gray-600">
                                                    {material.type.charAt(0).toUpperCase() + material.type.slice(1)}
                                                    {material.duration_seconds > 0 && ` - ${Math.floor(material.duration_seconds / 60)}m ${material.duration_seconds % 60}s`}
                                                </p>
                                            </div>
                                        </div>
                                        {canAccessFullMaterials || material.is_preview ? (
                                            (material.file_url || material.content) ? (
                                                <button
                                                    onClick={() => handleViewMaterial(material)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center"
                                                >
                                                    <Play className="h-4 w-4 mr-1" /> View Content
                                                </button>
                                            ) : (
                                                <span className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm">No Content</span>
                                            )
                                        ) : (
                                            <span className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm">
                                                {material.is_preview ? 'Preview Available' : 'Enroll to Access'}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {!canAccessFullMaterials && (
                            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                                <p className="font-semibold">Enroll to unlock all course materials and participate in discussions!</p>
                            </div>
                        )}
                    </div>

                    {canAccessFullMaterials && (
                        <div className="mt-8 border border-gray-200 p-6 rounded-lg bg-white">
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
                                <div ref={chatMessagesEndRef} />
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
                    )}
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-lg p-6 sticky top-20">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Instructor</h3>
                        <div className="flex items-center space-x-4 mb-4">
                            {course.instructor_profile_image_url && (
                                <img src={course.instructor_profile_image_url} alt={course.instructor_name} className="w-16 h-16 rounded-full object-cover shadow-md" />
                            )}
                            <div>
                                <p className="text-xl font-semibold text-gray-800">{course.instructor_name}</p>
                                <p className="text-sm text-gray-600">Expert Educator</p>
                            </div>
                        </div>
                        <p className="text-gray-700 mb-6">
                            {course.instructor_name} is a seasoned professional with years of experience in {course.category_name}. He is dedicated to sharing his knowledge.
                        </p>
                        <Link to={`/instructor/${course.instructor_id}`} className="text-blue-600 hover:underline text-sm font-medium">
                            View Instructor Profile
                        </Link>
                    </div>
                </div>
            </section>

            <footer className="bg-gray-900 text-white py-16 mt-12">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center mb-4">
                                <BookOpen className="h-8 w-8 text-blue-400" />
                                <span className="ml-2 text-xl font-bold">EduPlatform</span>
                            </div>
                            <p className="text-gray-400">
                                Empowering learners worldwide with quality education and innovative learning experiences.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
                            <ul className="space-y-2">
                                <li><Link to="/courses" className="text-gray-400 hover:text-white transition-colors duration-200">Courses</Link></li>
                                <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors duration-200">About Us</Link></li>
                                <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors duration-200">Contact</Link></li>
                                <li><Link to="/blog" className="text-gray-400 hover:text-white transition-colors duration-200">Blog</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Legal</h3>
                            <ul className="space-y-2">
                                <li><Link to="/terms" className="text-gray-400 hover:text-white transition-colors duration-200">Terms of Service</Link></li>
                                <li><Link to="/privacy" className="text-gray-400 hover:text-white transition-colors duration-200">Privacy Policy</Link></li>
                                <li><Link to="/cookies" className="text-gray-400 hover:text-white transition-colors duration-200">Cookie Policy</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Connect</h3>
                            <ul className="space-y-2">
                                <li><a href="https://facebook.com" className="text-gray-400 hover:text-white transition-colors duration-200">Facebook</a></li>
                                <li><a href="https://twitter.com" className="text-gray-400 hover:text-white transition-colors duration-200">Twitter</a></li>
                                <li><a href="https://linkedin.com" className="text-gray-400 hover:text-white transition-colors duration-200">LinkedIn</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-500">
                        <p>&copy; 2025 EduPlatform. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            {/* Material Viewer Modal */}
            {showingMaterialModal && currentMaterialToView && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900">{currentMaterialToView.title}</h3>
                            <div className="flex items-center space-x-2">
                                {currentMaterialToView.file_url && (
                                    <a
                                        href={currentMaterialToView.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                                        aria-label="Download material"
                                    >
                                        <Download className="h-5 w-5" />
                                    </a>
                                )}
                                <button
                                    onClick={handleCloseMaterialModal}
                                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                                    aria-label="Close modal"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto flex-grow">
                            {currentMaterialToView.type === 'video' && currentMaterialToView.file_url && (
                                <video controls className="w-full h-auto rounded-lg">
                                    <source src={currentMaterialToView.file_url} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                            )}
                            {currentMaterialToView.type === 'document' && currentMaterialToView.file_url && (
                                <iframe
                                    src={currentMaterialToView.file_url}
                                    className="w-full min-h-[60vh] border border-gray-300 rounded-lg"
                                    title={currentMaterialToView.title}
                                ></iframe>
                            )}
                            {currentMaterialToView.type === 'text' && currentMaterialToView.content && (
                                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: currentMaterialToView.content }}></div>
                            )}
                             {(currentMaterialToView.type === 'other' || currentMaterialToView.type === 'quiz') && (
                                <div className="bg-gray-100 p-6 rounded-lg">
                                    <h4 className="text-xl font-semibold mb-2">Content Unavailable for Preview</h4>
                                    <p className="text-gray-700">This material type cannot be displayed directly. You can try downloading it using the button above or contact the instructor for more details.</p>
                                </div>
                            )}
                            {!currentMaterialToView.file_url && !currentMaterialToView.content && (
                                <div className="text-center p-8 text-gray-500">
                                    No content available to display.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Enrollment Confirmation Modal */}
            {showEnrollmentModal && user && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h3 className="text-2xl font-bold text-gray-900">
                                {isEditing ? 'Edit Your Details' : 'Confirm Enrollment'}
                            </h3>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handleEditToggle}
                                    className="text-blue-600 hover:bg-blue-100 rounded-full p-2 transition-colors"
                                    aria-label={isEditing ? 'Cancel edit' : 'Edit details'}
                                >
                                    <Edit className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={handleCloseEnrollmentModal}
                                    className="text-gray-500 hover:bg-gray-100 rounded-full p-2 transition-colors"
                                    aria-label="Close modal"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        {isEditing ? (
                            <div>
                                <p className="text-lg text-gray-700 mb-4">
                                    Update your information and click "Save Changes".
                                </p>
                                <div className="space-y-4 mb-6">
                                    <label className="block">
                                        <span className="text-sm text-gray-500 font-medium">Full Name</span>
                                        <input
                                            type="text"
                                            value={editedName}
                                            onChange={(e) => setEditedName(e.target.value)}
                                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-sm text-gray-500 font-medium">Email Address</span>
                                        <input
                                            type="email"
                                            value={editedEmail}
                                            onChange={(e) => setEditedEmail(e.target.value)}
                                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-sm text-gray-500 font-medium">Phone Number</span>
                                        <input
                                            type="tel"
                                            value={editedPhone}
                                            onChange={(e) => setEditedPhone(e.target.value)}
                                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </label>
                                </div>
                                {editError && <p className="text-sm text-red-600 mb-4">{editError}</p>}
                                <button
                                    onClick={handleSaveDetails}
                                    className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        ) : (
                            <div>
                                <p className="text-lg text-gray-700 mb-4">
                                    Please verify your information before enrolling in **"{course?.title}"**.
                                </p>
                                <div className="space-y-3 mb-6">
                                    <div className="bg-gray-50 p-3 rounded-md">
                                        <p className="text-sm text-gray-500 font-medium">Full Name:</p>
                                        <p className="text-lg font-semibold text-gray-800">{user.name}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-md">
                                        <p className="text-sm text-gray-500 font-medium">Email Address:</p>
                                        <p className="text-lg font-semibold text-gray-800">{user.email}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-md">
                                        <p className="text-sm text-gray-500 font-medium">Phone Number:</p>
                                        <p className="text-lg font-semibold text-gray-800">
                                            {user.phone || 'Not provided'}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm mb-6">
                                    By clicking "Confirm and Enroll", you agree to the course terms and conditions.
                                </p>
                                <button
                                    onClick={confirmEnrollment}
                                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors"
                                >
                                    Confirm and Enroll
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseDetail;