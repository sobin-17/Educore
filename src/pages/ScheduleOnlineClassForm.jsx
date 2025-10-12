import React, { useState, useEffect } from 'react';
import { X, CalendarPlus, Users, Lock, Video, MessageSquare, Monitor, RefreshCw, AlertCircle, Clock, CheckCircle, LogOut } from 'lucide-react';

// API configuration
const API_BASE_URL = 'http://localhost:5000';

// In-memory auth state
let authState = {
  token: null,
  user: null,
  isAuthenticated: false
};

// Auth functions that use in-memory storage
const auth = {
  login: (token, user) => {
    authState.token = token;
    authState.user = user;
    authState.isAuthenticated = true;
  },
  
  logout: () => {
    authState.token = null;
    authState.user = null;
    authState.isAuthenticated = false;
  },
  
  getToken: () => authState.token,
  
  getUser: () => authState.user,
  
  isAuthenticated: () => authState.isAuthenticated
};

// API functions that connect to your backend
const api = {
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Login failed');
      }
      
      return result;
    } catch (error) {
      console.error('API Error during login:', error);
      throw error;
    }
  },

  scheduleOnlineClass: async (classData) => {
    try {
      const token = auth.getToken();
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const response = await fetch(`${API_BASE_URL}/api/online-classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(classData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to schedule class');
      }
      
      return result;
    } catch (error) {
      console.error('API Error scheduling class:', error);
      throw error;
    }
  },

  fetchInstructorCourses: async () => {
    try {
      const token = auth.getToken();
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const response = await fetch(`${API_BASE_URL}/api/instructor/courses-for-classes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to fetch courses');
      }
      
      return result.data || [];
    } catch (error) {
      console.error('API Error fetching courses:', error);
      throw error;
    }
  },

  fetchOnlineClasses: async (status = null) => {
    try {
      const token = auth.getToken();
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      let url = `${API_BASE_URL}/api/online-classes`;
      if (status) url += `?status=${status}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to fetch online classes');
      }
      
      return result.data || [];
    } catch (error) {
      console.error('API Error fetching classes:', error);
      throw error;
    }
  },

  updateClassStatus: async (classId, status) => {
    try {
      const token = auth.getToken();
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const response = await fetch(`${API_BASE_URL}/api/online-classes/${classId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to update class status');
      }
      
      return result;
    } catch (error) {
      console.error('API Error updating class status:', error);
      throw error;
    }
  }
};

const LoginForm = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await api.login(formData.email, formData.password);
      auth.login(result.token, result.user);
      onLogin();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to manage your online classes</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">Demo Credentials:</h3>
          <p className="text-sm text-blue-700">
            <strong>Instructor:</strong> instructor@example.com<br />
            <strong>Password:</strong> instructor123
          </p>
        </div>
      </div>
    </div>
  );
};

const ScheduleOnlineClassForm = ({ courses, onClose, onSave }) => {
      const [formData, setFormData] = useState({
        course_id: '',
        title: '',
        description: '',
        scheduled_date: '',
        duration_minutes: 60,
        meeting_password: '',
        max_participants: 50,
        recording_enabled: false,
        chat_enabled: true,
        screen_share_enabled: true
      });

      const [formErrors, setFormErrors] = useState({});
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [submitMessage, setSubmitMessage] = useState('');
      const [generatedRoomName, setGeneratedRoomName] = useState('');

      // Generate unique meeting room name
      const generateMeetingRoomName = (courseId, title) => {
        const timestamp = Date.now();
        const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
        return `Course-${courseId}-${sanitizedTitle}-${timestamp}`;
      };

      // Handler for form input changes
      const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
          ...prev,
          [name]: type === 'checkbox' ? checked : value,
        }));
        
        setFormErrors(prev => ({ ...prev, [name]: '' }));
        
        if (name === 'course_id' || name === 'title') {
          const courseId = name === 'course_id' ? value : formData.course_id;
          const title = name === 'title' ? value : formData.title;
          if (courseId && title) {
            setGeneratedRoomName(generateMeetingRoomName(courseId, title));
          }
        }
      };

      // Form validation
      const validateForm = () => {
        const errors = {};
        
        if (!formData.course_id) errors.course_id = 'Please select a course.';
        if (!formData.title.trim()) errors.title = 'Title is required.';
        if (!formData.scheduled_date) errors.scheduled_date = 'Scheduled date and time is required.';
        
        if (formData.scheduled_date) {
          const scheduledTime = new Date(formData.scheduled_date);
          if (scheduledTime <= new Date()) {
            errors.scheduled_date = 'Scheduled time must be in the future.';
          }
        }
        
        if (formData.duration_minutes < 15) errors.duration_minutes = 'Duration must be at least 15 minutes.';
        if (formData.max_participants < 1) errors.max_participants = 'Maximum participants must be at least 1.';
        if (formData.max_participants > 100) errors.max_participants = 'Maximum participants cannot exceed 100.';
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
      };

      // Form submission handler
      const handleSubmit = async () => {
        if (!validateForm()) {
          setSubmitMessage('Please correct the errors in the form.');
          return;
        }

        setIsSubmitting(true);
        setSubmitMessage('');

        try {
          const classDataForDB = {
            course_id: parseInt(formData.course_id),
            title: formData.title,
            description: formData.description || null,
            scheduled_date: formData.scheduled_date,
            duration_minutes: parseInt(formData.duration_minutes),
            meeting_room_name: generatedRoomName,
            meeting_password: formData.meeting_password || null,
            max_participants: parseInt(formData.max_participants),
            recording_enabled: formData.recording_enabled,
            chat_enabled: formData.chat_enabled,
            screen_share_enabled: formData.screen_share_enabled,
            jitsi_room_config: {
              enableWelcomePage: false,
              enableClosePage: false,
              maxOccupants: parseInt(formData.max_participants), // Explicitly set max participants for Jitsi
              disable: {
                deepLinking: true
              }
            }
          };

          const response = await api.scheduleOnlineClass(classDataForDB);
          
          if (onSave) {
            onSave(response.data);
          }
          
          setSubmitMessage('Online class scheduled successfully!');
          
          setTimeout(() => {
            onClose();
          }, 2000);
          
        } catch (error) {
          console.error("Scheduling error:", error);
          setSubmitMessage(error.message || 'Failed to schedule class.');
        } finally {
          setIsSubmitting(false);
        }
      };

      const getJitsiMeetingUrl = () => {
        return generatedRoomName ? `https://meet.jit.si/${generatedRoomName}` : '';
      };

      return (
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-6">
            <h2 className="text-3xl font-extrabold text-gray-900">Schedule Online Class</h2>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="course_id" className="block text-sm font-medium text-gray-700 mb-1">
                Select Course *
              </label>
              <select
                id="course_id"
                name="course_id"
                value={formData.course_id}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              >
                <option value="">-- Select a course --</option>
                {(courses || []).map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
              {formErrors.course_id && <p className="text-red-500 text-sm mt-1">{formErrors.course_id}</p>}
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Class Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="e.g., Week 1 Q&A Session"
              />
              {formErrors.title && <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Brief description of the class content..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="scheduled_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date & Time *
                </label>
                <input
                  type="datetime-local"
                  id="scheduled_date"
                  name="scheduled_date"
                  value={formData.scheduled_date}
                  onChange={handleChange}
                  min={new Date().toISOString().slice(0, 16)}
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
                {formErrors.scheduled_date && <p className="text-red-500 text-sm mt-1">{formErrors.scheduled_date}</p>}
              </div>
              
              <div>
                <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  id="duration_minutes"
                  name="duration_minutes"
                  value={formData.duration_minutes}
                  onChange={handleChange}
                  min="15"
                  max="480"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
                {formErrors.duration_minutes && <p className="text-red-500 text-sm mt-1">{formErrors.duration_minutes}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="max_participants" className="block text-sm font-medium text-gray-700 mb-1">
                  <Users className="inline h-4 w-4 mr-1" />
                  Max Participants *
                </label>
                <input
                  type="number"
                  id="max_participants"
                  name="max_participants"
                  value={formData.max_participants}
                  onChange={handleChange}
                  min="1"
                  max="100"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
                {formErrors.max_participants && <p className="text-red-500 text-sm mt-1">{formErrors.max_participants}</p>}
              </div>
              
              <div>
                <label htmlFor="meeting_password" className="block text-sm font-medium text-gray-700 mb-1">
                  <Lock className="inline h-4 w-4 mr-1" />
                  Meeting Password (Optional)
                </label>
                <input
                  type="password"
                  id="meeting_password"
                  name="meeting_password"
                  value={formData.meeting_password}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Leave empty for no password"
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-lg font-medium text-gray-900">Meeting Features</h4>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="recording_enabled"
                    checked={formData.recording_enabled}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Video className="h-4 w-4 ml-2 mr-1 text-gray-500" />
                  <span className="text-sm text-gray-700">Enable Recording</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="chat_enabled"
                    checked={formData.chat_enabled}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <MessageSquare className="h-4 w-4 ml-2 mr-1 text-gray-500" />
                  <span className="text-sm text-gray-700">Enable Chat</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="screen_share_enabled"
                    checked={formData.screen_share_enabled}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Monitor className="h-4 w-4 ml-2 mr-1 text-gray-500" />
                  <span className="text-sm text-gray-700">Enable Screen Share</span>
                </label>
              </div>
            </div>

            {generatedRoomName && (
              <div className="mt-4 p-4 border border-blue-200 bg-blue-50 rounded-lg">
                <p className="font-semibold text-blue-800">Meeting Room Preview:</p>
                <p className="text-sm text-gray-700 mt-1">Room Name: {generatedRoomName}</p>
                <p className="text-sm text-gray-700">Meeting URL: {getJitsiMeetingUrl()}</p>
                <p className="text-sm text-gray-700">Max Participants: {formData.max_participants}</p>
              </div>
            )}

            {submitMessage && (
              <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                submitMessage.includes('successfully') 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              } shadow-md`}>
                {submitMessage.includes('successfully') ? (
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                )}
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
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-3 border border-transparent rounded-lg shadow-md text-base font-medium text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <CalendarPlus className="h-5 w-5 mr-2" />
                    Schedule Class
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    };

    const StatusBadge = ({ status }) => {
      const getStatusConfig = (status) => {
        switch (status) {
          case 'scheduled':
            return { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock };
          case 'active':
            return { bg: 'bg-green-100', text: 'text-green-800', icon: Video };
          case 'completed':
            return { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircle };
          case 'cancelled':
            return { bg: 'bg-red-100', text: 'text-red-800', icon: X };
          default:
            return { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock };
        }
      };

      const config = getStatusConfig(status);
      const Icon = config.icon;

      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
          <Icon className="h-3 w-3 mr-1" />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      );
    };

    const ClassCard = ({ cls, onStatusUpdate }) => {
      const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
      
      const handleStatusChange = async (newStatus) => {
        if (newStatus === cls.status) return;
        
        setIsUpdatingStatus(true);
        try {
          await api.updateClassStatus(cls.id, newStatus);
          if (onStatusUpdate) {
            onStatusUpdate(cls.id, newStatus);
          }
        } catch (error) {
          console.error('Failed to update status:', error);
          alert('Failed to update class status: ' + error.message);
        } finally {
          setIsUpdatingStatus(false);
        }
      };

      const getMeetingUrl = () => {
        return `https://meet.jit.si/${cls.meeting_room_name}`;
      };

      const isUpcoming = () => {
        const now = new Date();
        const classTime = new Date(cls.scheduled_date);
        const timeDiff = classTime.getTime() - now.getTime();
        return timeDiff > 0 && timeDiff <= 30 * 60 * 1000; // Within 30 minutes
      };

      return (
        <div className="border border-gray-200 p-6 rounded-lg hover:shadow-md transition-shadow bg-white">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-xl text-gray-900 mb-2">{cls.title}</h3>
              {cls.description && (
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">{cls.description}</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                <span className="flex items-center">
                  <CalendarPlus className="h-4 w-4 mr-2 text-blue-500" />
                  {new Date(cls.scheduled_date).toLocaleString()}
                </span>
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-green-500" />
                  {cls.duration_minutes} minutes
                </span>
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-purple-500" />
                  Max {cls.max_participants} participants
                </span>
                {cls.meeting_password && (
                  <span className="flex items-center">
                    <Lock className="h-4 w-4 mr-2 text-orange-500" />
                    Password protected
                  </span>
                )}
              </div>
              {cls.course_title && (
                <p className="text-xs text-gray-500 mb-3 font-medium">
                  Course: {cls.course_title}
                </p>
              )}
            </div>
            
            <div className="ml-6 flex flex-col space-y-3 items-end">
              <StatusBadge status={cls.status} />
              
              <div className="relative">
                <select
                  value={cls.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={isUpdatingStatus}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                {isUpdatingStatus && <RefreshCw className="h-3 w-3 animate-spin ml-2 inline" />}
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 text-xs mb-4">
            {cls.recording_enabled && (
              <span className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded">
                <Video className="h-3 w-3 mr-1" />
                Recording Enabled
              </span>
            )}
            {cls.chat_enabled && (
              <span className="flex items-center text-blue-600 bg-blue-50 px-2 py-1 rounded">
                <MessageSquare className="h-3 w-3 mr-1" />
                Chat Enabled
              </span>
            )}
            {cls.screen_share_enabled && (
              <span className="flex items-center text-purple-600 bg-purple-50 px-2 py-1 rounded">
                <Monitor className="h-3 w-3 mr-1" />
                Screen Share Enabled
              </span>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <a 
              href={getMeetingUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-1 text-center px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                isUpcoming() 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <Video className="h-4 w-4 inline mr-2" />
              {isUpcoming() ? 'Join Now' : 'Join Meeting'}
            </a>
            
            {cls.meeting_password && (
              <div className="flex-1 bg-gray-100 px-4 py-2 rounded-lg text-center">
                <p className="text-xs text-gray-600 mb-1">Password:</p>
                <p className="text-sm font-mono font-bold text-gray-800">{cls.meeting_password}</p>
              </div>
            )}
          </div>
        </div>
      );
    };

    const App = () => {
      const [isLoggedIn, setIsLoggedIn] = useState(false);
      const [isModalOpen, setIsModalOpen] = useState(false);
      const [courses, setCourses] = useState([]);
      const [scheduledClasses, setScheduledClasses] = useState([]);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState('');
      const [filter, setFilter] = useState('all');

      useEffect(() => {
        if (isLoggedIn) {
          loadData();
        }
      }, [isLoggedIn]);

      const handleLogin = () => {
        setIsLoggedIn(true);
      };

      const handleLogout = () => {
        auth.logout();
        setIsLoggedIn(false);
        setCourses([]);
        setScheduledClasses([]);
        setError('');
      };

      const loadData = async () => {
        setLoading(true);
        setError('');
        
        const currentUser = auth.getUser();
        
        if (!auth.isAuthenticated()) {
          setError('No authentication found. Please login again.');
          setLoading(false);
          return;
        }
        
        if (!currentUser) {
          setError('User information not found. Please login again.');
          setLoading(false);
          return;
        }
        
        if (currentUser.role !== 'instructor') {
          setError('Access denied. This page is only accessible to instructors.');
          setLoading(false);
          return;
        }
        
        console.log('User authenticated as instructor:', currentUser.name);
        
        try {
          const [coursesData, classesData] = await Promise.all([
            api.fetchInstructorCourses(),
            api.fetchOnlineClasses()
          ]);
          
          setCourses(coursesData);
          setScheduledClasses(classesData);
          console.log('Data loaded successfully:', { courses: coursesData.length, classes: classesData.length });
        } catch (err) {
          console.error('Error loading data:', err);
          
          if (err.message.includes('401') || err.message.includes('Authentication') || err.message.includes('token')) {
            auth.logout();
            setError('Session expired. Please login again.');
            setIsLoggedIn(false);
          } else {
            setError(`Failed to load data: ${err.message}`);
          }
        } finally {
          setLoading(false);
        }
      };

      const handleSaveClass = (classData) => {
        setScheduledClasses(prev => [...prev, classData]);
      };

      const handleStatusUpdate = (classId, newStatus) => {
        setScheduledClasses(prev => 
          prev.map(cls => 
            cls.id === classId ? { ...cls, status: newStatus } : cls
          )
        );
      };

      const filteredClasses = scheduledClasses.filter(cls => {
        if (filter === 'all') return true;
        return cls.status === filter;
      });

      if (!isLoggedIn) {
        return <LoginForm onLogin={handleLogin} />;
      }

      if (loading && scheduledClasses.length === 0) {
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading online classes...</p>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-6xl mx-auto py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Online Class Management</h1>
                <p className="text-gray-600">Schedule and manage your live online classes</p>
                {auth.getUser() && (
                  <p className="text-sm text-gray-500 mt-1">
                    Welcome back, {auth.getUser().name}
                  </p>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleLogout}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-lg"
                >
                  <CalendarPlus className="h-5 w-5 mr-2" />
                  Schedule New Class
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1">
                  <span>{error}</span>
                  {(error.includes('Authentication') || error.includes('Session expired') || error.includes('login')) && (
                    <div className="mt-2">
                      <p className="text-sm">Please check your login status and try again.</p>
                      <button
                        onClick={handleLogout}
                        className="mt-2 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                      >
                        Go to Login
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { key: 'all', label: 'All Classes', count: scheduledClasses.length },
                { key: 'scheduled', label: 'Scheduled', count: scheduledClasses.filter(c => c.status === 'scheduled').length },
                { key: 'active', label: 'Active', count: scheduledClasses.filter(c => c.status === 'active').length },
                { key: 'completed', label: 'Completed', count: scheduledClasses.filter(c => c.status === 'completed').length },
                { key: 'cancelled', label: 'Cancelled', count: scheduledClasses.filter(c => c.status === 'cancelled').length }
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    filter === key
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {filter === 'all' ? 'All Classes' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Classes`}
                  <span className="text-lg text-gray-500 ml-2">({filteredClasses.length})</span>
                </h2>
              </div>
              
              {filteredClasses.length === 0 ? (
                <div className="text-center py-16">
                  <CalendarPlus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-xl mb-2">
                    {filter === 'all' ? 'No classes scheduled yet' : `No ${filter} classes found`}
                  </p>
                  <p className="text-gray-400 text-sm mb-6">
                    {filter === 'all' 
                      ? 'Create your first online class to get started' 
                      : 'Try changing the filter or schedule a new class'
                    }
                  </p>
                  {filter === 'all' && (
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Schedule First Class
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredClasses
                    .sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date))
                    .map((cls) => (
                      <ClassCard 
                        key={cls.id} 
                        cls={cls} 
                        onStatusUpdate={handleStatusUpdate} 
                      />
                    ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Total Classes</p>
                    <p className="text-2xl font-bold text-blue-900">{scheduledClasses.length}</p>
                  </div>
                  <CalendarPlus className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Active Classes</p>
                    <p className="text-2xl font-bold text-green-900">
                      {scheduledClasses.filter(c => c.status === 'active').length}
                    </p>
                  </div>
                  <Video className="h-8 w-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-600 text-sm font-medium">Scheduled</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {scheduledClasses.filter(c => c.status === 'scheduled').length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {scheduledClasses.filter(c => c.status === 'completed').length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-gray-500" />
                </div>
              </div>
            </div>
          </div>

          {isModalOpen && (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
              <ScheduleOnlineClassForm
                courses={courses}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveClass}
              />
            </div>
          )}
        </div>
      );
    };
export default App;