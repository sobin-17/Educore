import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, Eye, EyeOff, User, Mail, Lock, UserCheck, Phone, Calendar, MapPin, FileText, Image } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000';

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
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  // ----- Field-Level Validations -----
  const validators = {
    name: (val) => val.trim() ? '' : 'Name is required',
    email: (val) => /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(val) ? '' : 'Email must be a valid Gmail address',
    password: (val) => val.length >= 6 && /[!@#$%^&*(),.?":{}|<>]/.test(val) ? '' : 'Password must be 6+ chars and include a special character',
    confirmPassword: (val) => val === form.password ? '' : 'Passwords do not match',
    phone: (val) => {
      if (!val) return '';
      const digitsOnly = val.replace(/\D/g, '');
      return digitsOnly.length === 10 ? '' : 'Phone number must be 10 digits';
    },
    bio: (val) => val.length <= 500 ? '' : 'Bio cannot exceed 500 characters'
  };

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });

    if (validators[field]) {
      setErrors({ ...errors, [field]: validators[field](value) });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, profileImage: 'Please select an image file (PNG, JPG, GIF).' });
        setForm({ ...form, profileImage: null });
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setErrors({ ...errors, profileImage: 'Image size should be less than 2MB.' });
        setForm({ ...form, profileImage: null });
        return;
      }
      setForm({ ...form, profileImage: file });
      setErrors({ ...errors, profileImage: '' });
    } else {
      setForm({ ...form, profileImage: null });
      setErrors({ ...errors, profileImage: '' });
    }
  };

  const validateStep = (step) => {
    const stepFields = step === 1
      ? ['name', 'email', 'password', 'confirmPassword']
      : ['phone', 'bio'];
    let stepErrors = {};
    stepFields.forEach(f => {
      if (validators[f]) {
        const err = validators[f](form[f]);
        if (err) stepErrors[f] = err;
      }
    });
    setErrors({ ...errors, ...stepErrors });
    return Object.keys(stepErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(1)) setCurrentStep(2);
  };
  const prevStep = () => { setCurrentStep(1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(2)) return;

    setLoading(true);
    setSuccess('');
    try {
      const formData = new FormData();
      for (const key in form) {
        if (key === 'profileImage' && form[key]) formData.append(key, form[key]);
        else if (key !== 'confirmPassword') formData.append(key, form[key]);
      }

      const response = await axios.post(`${API_BASE_URL}/auth/register`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess(response.data.message || 'Account created successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error(err);
      setSuccess('');
      setErrors({ ...errors, submit: err.response?.data?.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'student', label: 'Student', icon: User },
   // { value: 'instructor', label: 'Instructor', icon: UserCheck },
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
        <div className="text-center animate-fadeIn">
          <Link to="/" className="inline-flex items-center transform hover:scale-105 transition-transform duration-300">
            <BookOpen className="h-12 w-12 text-blue-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">EduCore</span>
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 animate-fadeInUp">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">Sign in here</Link>
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-4 mt-6 animate-fadeInUp">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-500 ${currentStep >= 1 ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-600'}`}>1</div>
          <div className={`w-16 h-1 rounded transition-colors duration-500 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-500 ${currentStep >= 2 ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-600'}`}>2</div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white p-8 rounded-xl shadow-lg space-y-6 animate-fadeInUp">
            {errors.submit && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm animate-pulse">{errors.submit}</div>}
            {success && <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm animate-pulse">{success} Redirecting...</div>}

            {/* Step 1 */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                  <p className="text-sm text-gray-600">Let's start with the essentials</p>
                </div>

                {/* Name */}
                <div className="relative group">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-300 hover:shadow-md"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                {/* Email */}
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Email *"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-300 hover:shadow-md"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                {/* Password */}
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password *"
                    value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-300 hover:shadow-md"
                  />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password *"
                    value={form.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-300 hover:shadow-md"
                  />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">I am a: *</label>
                  <div className="grid grid-cols-1 gap-3">
                    {roleOptions.map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <label
                          key={option.value}
                          className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transform transition duration-300 hover:scale-105 ${form.role === option.value ? 'border-blue-500 bg-blue-50 shadow-lg' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          <input
                            type="radio"
                            name="role"
                            value={option.value}
                            checked={form.role === option.value}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                            className="sr-only"
                          />
                          <IconComponent className={`h-5 w-5 mr-3 ${form.role === option.value ? 'text-blue-600' : 'text-gray-400'}`} />
                          <span className={`font-medium ${form.role === option.value ? 'text-blue-900' : 'text-gray-700'}`}>{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button type="button" onClick={nextStep} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transform hover:scale-105 transition-transform duration-300">Next Step</button>
              </div>
            )}

            {/* Step 2 */}
{currentStep === 2 && (
  <div>
    <div className="text-center mb-6">
      <h3 className="text-lg font-medium text-gray-900 animate-fade-in">Optional Information</h3>
      <p className="text-sm text-gray-600 animate-fade-in delay-100">Tell us a bit more about yourself</p>
    </div>

    {/* Bio */}
    <div className="animate-slide-up">
      <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">Bio (Optional)</label>
      <div className="relative">
        <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <textarea
          id="bio"
          rows="3"
          className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:shadow-md transition-shadow duration-300"
          placeholder="Tell us about yourself"
          value={form.bio}
          onChange={(e) => handleChange('bio', e.target.value)}
          maxLength="500"
        />
        <span className="absolute bottom-2 right-3 text-xs text-gray-500">{form.bio.length}/500</span>
      </div>
      {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio}</p>}
    </div>

    {/* Phone */}
    <div className="mt-4 animate-slide-up delay-50">
      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone Number (Optional)</label>
      <div className="relative">
        <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          id="phone"
          type="tel"
          className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:shadow-md transition-shadow duration-300"
          placeholder="e.g., 9876543210"
          value={form.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
        />
      </div>
      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
    </div>

    {/* Date of Birth */}
    <div className="mt-4 animate-slide-up delay-100">
      <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">Date of Birth (Optional)</label>
      <div className="relative">
        <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          id="dateOfBirth"
          type="date"
          className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:shadow-md transition-shadow duration-300"
          value={form.dateOfBirth}
          onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
        />
      </div>
    </div>

    {/* Gender */}
    <div className="mt-4 animate-slide-up delay-150">
      <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">Gender (Optional)</label>
      <select
        id="gender"
        className="mt-1 block w-full pl-3 pr-10 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg hover:shadow-md transition-shadow duration-300"
        value={form.gender}
        onChange={(e) => setForm({ ...form, gender: e.target.value })}
      >
        <option value="">Select your gender</option>
        {genderOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </div>

    {/* Country */}
    <div className="mt-4 animate-slide-up delay-200">
      <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">Country (Optional)</label>
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <select
          id="country"
          className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:shadow-md transition-shadow duration-300"
          value={form.country}
          onChange={(e) => setForm({ ...form, country: e.target.value })}
        >
          <option value="">Select your country</option>
          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
    </div>

    {/* Profile Image */}
    <div className="mt-4 animate-slide-up delay-250">
      <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700 mb-2">Profile Image (Optional)</label>
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 cursor-pointer">
        <div className="space-y-1 text-center">
          {form.profileImage ? (
            <img src={URL.createObjectURL(form.profileImage)} alt="Profile Preview" className="mx-auto h-20 w-20 rounded-full object-cover" />
          ) : (
            <Image className="mx-auto h-12 w-12 text-gray-400" />
          )}
          <div className="flex text-sm text-gray-600 justify-center">
            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
              <span>Upload a file</span>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
            </label>
          </div>
          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
          {errors.profileImage && <p className="text-red-500 text-xs mt-1">{errors.profileImage}</p>}
        </div>
      </div>
    </div>

    {/* Navigation Buttons */}
    <div className="flex justify-between mt-6 animate-slide-up delay-300">
      <button type="button" onClick={prevStep} className="py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200">
        Previous
      </button>
      <button type="submit" disabled={loading} className="py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  </div>
)}


          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
