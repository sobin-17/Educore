import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios'; // Ensure axios is imported
import { BookOpen, Eye, EyeOff, User, Mail, Lock, UserCheck, Phone, Calendar, MapPin, FileText, Image } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000'; // Define your API base URL

const Register = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    bio: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    country: '',
    profileImage: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Client-side validation for password match and length
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      for (const key in form) {
        if (key === 'profileImage' && form[key]) {
          formData.append(key, form[key]);
        } else if (key !== 'confirmPassword') { // Don't send confirmPassword to backend
          formData.append(key, form[key]);
        }
      }

      const response = await axios.post(`${API_BASE_URL}/auth/register`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(response.data.message || 'Account created successfully!');

      // Redirect to login page after successful registration
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      console.error('Registration error:', err);
      if (err.response) {
        // Server responded with a status other than 2xx
        if (err.response.data && err.response.data.errors) {
          // If backend returns validation errors from express-validator
          const validationErrors = err.response.data.errors.map(err => err.msg).join('; ');
          setError(`Validation failed: ${validationErrors}`);
        } else if (err.response.data && err.response.data.message) {
          // If backend returns a custom error message (e.g., "Email already exists")
          setError(err.response.data.message);
        } else {
          setError(`Server error: ${err.response.status} - ${err.response.statusText}`);
        }
      } else if (err.request) {
        // Request was made but no response was received
        setError('No response from server. Please ensure the backend is running and accessible.');
      } else {
        // Something else happened in setting up the request
        setError(`An unexpected error occurred: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (PNG, JPG, GIF).');
        setForm({ ...form, profileImage: null }); // Clear previously selected invalid file
        return;
      }
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size should be less than 2MB.');
        setForm({ ...form, profileImage: null }); // Clear previously selected invalid file
        return;
      }
      setForm({ ...form, profileImage: file });
      setError(''); // Clear previous file-related errors
    } else {
      setForm({ ...form, profileImage: null }); // Clear file if user cancels selection
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      // Validate required fields for step 1
      if (!form.name || !form.email || !form.password || !form.confirmPassword) {
        setError('Please fill in all required fields for basic information.');
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (form.password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
    }
    setError(''); // Clear any previous errors before moving to next step
    setCurrentStep(2);
  };

  const prevStep = () => {
    setCurrentStep(1);
    setError(''); // Clear errors when going back
  };

  const roleOptions = [
    { value: 'student', label: 'Student', icon: User },
    { value: 'instructor', label: 'Instructor', icon: UserCheck },
    { value: 'parent', label: 'Parent', icon: User },
  ];

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  ];

  const countries = [
    'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France',
    'India', 'Japan', 'China', 'Brazil', 'South Africa', 'Mexico', 'Other'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center">
            <BookOpen className="h-12 w-12 text-blue-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">EduPlatform</span>
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in here
            </Link>
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center space-x-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            1
          </div>
          <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            2
          </div>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                {success} Redirecting to login...
              </div>
            )}

            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div>
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                  <p className="text-sm text-gray-600">Let's start with the essentials</p>
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your full name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Create a password (min 6 characters)"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Confirm your password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    I am a: *
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {roleOptions.map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <label
                          key={option.value}
                          className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                            form.role === option.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="role"
                            value={option.value}
                            checked={form.role === option.value}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                            className="sr-only"
                          />
                          <IconComponent className={`h-5 w-5 mr-3 ${
                            form.role === option.value ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                          <span className={`font-medium ${
                            form.role === option.value ? 'text-blue-900' : 'text-gray-700'
                          }`}>
                            {option.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Next Step
                </button>
              </div>
            )}

            {/* Step 2: Optional Information */}
            {currentStep === 2 && (
              <div>
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Optional Information</h3>
                  <p className="text-sm text-gray-600">Tell us a bit more about yourself</p>
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                    Bio (Optional)
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <textarea
                      id="bio"
                      name="bio"
                      rows="3"
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tell us about yourself (e.g., your interests, teaching experience, etc.)"
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      maxLength="500"
                    ></textarea>
                    <span className="absolute bottom-2 right-3 text-xs text-gray-500">
                      {form.bio.length}/500
                    </span>
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., +1234567890"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth (Optional)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.dateOfBirth}
                      onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                    Gender (Optional)
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    className="mt-1 block w-full pl-3 pr-10 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  >
                    <option value="">Select your gender</option>
                    {genderOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                    Country (Optional)
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <select
                      id="country"
                      name="country"
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                    >
                      <option value="">Select your country</option>
                      {countries.map((country) => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Image (Optional)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      {form.profileImage ? (
                        <img
                          src={URL.createObjectURL(form.profileImage)}
                          alt="Profile Preview"
                          className="mx-auto h-20 w-20 rounded-full object-cover"
                        />
                      ) : (
                        <Image className="mx-auto h-12 w-12 text-gray-400" />
                      )}
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-upload"
                            name="profileImage"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 2MB
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between gap-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Previous
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Registering...' : 'Register'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="text-center">
          <Link to="/" className="text-blue-600 hover:text-blue-500 text-sm font-medium">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;