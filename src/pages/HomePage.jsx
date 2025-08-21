import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation
import { BookOpen, Users, Award, Star, Play, ChevronRight, Menu, X, User, LogOut } from 'lucide-react';
import { fetchCourses } from '../api'; // Corrected path: Assuming api.js is in the src directory

const HomePage = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [popularCourses, setPopularCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [coursesError, setCoursesError] = useState('');

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
            setUser(JSON.parse(userData));
        }

        // Fetch popular courses
        const getPopularCourses = async () => {
            try {
                setLoadingCourses(true);
                const courses = await fetchCourses();
                setPopularCourses(courses);
            } catch (err) {
                console.error("Failed to fetch popular courses:", err);
                setCoursesError(err.response?.data?.message || 'Failed to load popular courses. Please try again later.');
            } finally {
                setLoadingCourses(false);
            }
        };

        getPopularCourses();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    // This function is used to apply role-specific background and text colors
    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-red-100 text-red-800';
            case 'instructor': return 'bg-green-100 text-green-800';
            case 'parent': return 'bg-purple-100 text-purple-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white font-sans">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200">
                                <BookOpen className="h-8 w-8" />
                                <span className="ml-2 text-xl font-bold text-gray-900">EduPlatform</span>
                            </Link>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center space-x-8">
                            <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">Home</Link>{/* Hero Section */}
                            <Link to="/course-card" className="text-gray-700 hover:text-blue-600 font-medium">Courses</Link> {/* Placeholder route */}
                            <Link to="/profile-settings" className="text-gray-700 hover:text-blue-600 font-medium">About</Link> {/* Placeholder route */}
                            <Link to="/contact" className="text-gray-700 hover:text-blue-600 font-medium">Contact</Link> {/* Placeholder route */}
                        </nav>

                        {/* User Menu */}
                        <div className="hidden md:flex items-center space-x-4">
                            {user ? (
                                <div className="flex items-center space-x-2">
                                    <Link to="/dashboard" className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                                        <User className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-800">{user.name}</span>
                                        {/* Using getRoleColor here */}
                                        <span className={`text-xs ${getRoleColor(user.role)} px-2 py-1 rounded`}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
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

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
                        >
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white border-t">
                        <div className="px-4 py-2 space-y-2">
                            <Link to="/" className="block py-2 text-gray-700 hover:bg-gray-50 rounded-md">Home</Link>
                            <Link to="#courses" className="block py-2 text-gray-700 hover:bg-gray-50 rounded-md">Courses</Link>
                            <Link to="/about" className="block py-2 text-gray-700 hover:bg-gray-50 rounded-md">About</Link>
                            <Link to="/contact" className="block py-2 text-gray-700 hover:bg-gray-50 rounded-md">Contact</Link>
                            {user ? (
                                <div className="pt-2 border-t">
                                    <Link to="/dashboard" className="flex items-center space-x-2 py-2 text-gray-700 hover:bg-gray-50 rounded-md">
                                        <User className="h-4 w-4 text-blue-600" />
                                        <span className="font-medium">{user.name} ({user.role})</span>
                                    </Link>
                                    <button onClick={handleLogout} className="w-full text-left py-2 text-red-600 hover:bg-red-50 rounded-md">
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <div className="pt-2 border-t space-y-2">
                                    <Link to="/login" className="block py-2 text-gray-700 hover:bg-gray-50 rounded-md">Login</Link>
                                    <Link to="/register" className="block py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-md">Sign Up</Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* Hero Section */}
            <section id="home" className="py-20 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                        Learn Without
                        <span className="text-blue-600 block">Limits</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                        Transform your future with our comprehensive online learning platform.
                        Access world-class courses, expert instructors, and interactive learning experiences.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center shadow-lg">
                            Get Started Free
                            <ChevronRight className="ml-2 h-5 w-5" />
                        </button>
                        <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center shadow-md">
                            <Play className="mr-2 h-5 w-5" />
                            Watch Demo
                        </button>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-white shadow-inner">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div className="p-8">
                            <div className="text-4xl font-bold text-blue-600 mb-2">10,000+</div>
                            <div className="text-gray-600">Active Students</div>
                        </div>
                        <div className="p-8">
                            <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
                            <div className="text-gray-600">Expert Instructors</div>
                        </div>
                        <div className="p-8">
                            <div className="text-4xl font-bold text-blue-600 mb-2">1,200+</div>
                            <div className="text-gray-600">Online Courses</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Our Platform?</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            We provide everything you need for a successful learning journey
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-gray-100">
                            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                                <BookOpen className="h-6 w-6 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-4 text-gray-900">Interactive Learning</h3>
                            <p className="text-gray-600">
                                Engage with dynamic content, quizzes, and hands-on projects that make learning enjoyable and effective.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-gray-100">
                            <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                                <Users className="h-6 w-6 text-green-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-4 text-gray-900">Expert Instructors</h3>
                            <p className="text-gray-600">
                                Learn from industry professionals and experienced educators who are passionate about teaching.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-gray-100">
                            <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                                <Award className="h-6 w-6 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-4 text-gray-900">Certifications</h3>
                            <p className="text-gray-600">
                                Earn recognized certificates upon course completion to showcase your new skills to employers.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Popular Courses */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Popular Courses</h2>
                        <p className="text-xl text-gray-600">Discover our most loved courses</p>
                    </div>

                    {loadingCourses ? (
                        <div className="text-center py-12 text-gray-600 text-lg">Loading courses...</div>
                    ) : coursesError ? (
                        <div className="text-center py-12 text-red-600 text-lg">{coursesError}</div>
                    ) : popularCourses.length === 0 ? (
                        <div className="text-center py-12 text-gray-600 text-lg">No popular courses available yet.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {popularCourses.map((course) => (
                                <div key={course.id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                                    <img
                                        src={course.thumbnail_url || `https://placehold.co/400x250/ADD8E6/000000?text=${course.title.substring(0, 10).replace(/\s/g, '')}`}
                                        alt={course.title}
                                        className="w-full h-48 object-cover"
                                        onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x250/ADD8E6/000000?text=${course.title.substring(0, 10).replace(/\s/g, '')}`; }}
                                    />
                                    <div className="p-6">
                                        <h3 className="text-xl font-semibold mb-2 text-gray-900">{course.title}</h3>
                                        <p className="text-gray-600 mb-4">by {course.instructor_name}</p>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center">
                                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                                <span className="ml-1 text-sm text-gray-600">
                                                    {course.average_rating ? course.average_rating.toFixed(1) : 'N/A'} ({course.review_count || 0} reviews)
                                                </span>
                                            </div>
                                            <span className="text-2xl font-bold text-blue-600">
                                                {course.discount_price ? `$${course.discount_price}` : `$${course.price}`}
                                            </span>
                                        </div>
                                        {/* Corrected Link path to match App.js route */}
                                        <Link to={`/courses/${course.slug}`} className="w-full block text-center bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                                            Enroll
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-blue-600 text-white">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-4">Ready to Start Learning?</h2>
                    <p className="text-xl mb-8 opacity-90">
                        Join thousands of students who are already transforming their careers
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg">
                            Start Free Trial
                        </button>
                        <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors shadow-lg">
                            View All Courses
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer id="contact" className="bg-gray-900 text-white py-16">
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
                            <h3 className="font-semibold mb-4">Quick Links</h3>
                            <div className="space-y-2">
                                <a href="/about" className="block text-gray-400 hover:text-white transition-colors">About Us</a>
                                <a href="/courses" className="block text-gray-400 hover:text-white transition-colors">Courses</a>
                                <a href="/instructors" className="block text-gray-400 hover:text-white transition-colors">Instructors</a>
                                <a href="/blog" className="block text-gray-400 hover:text-white transition-colors">Blog</a>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-4">Support</h3>
                            <div className="space-y-2">
                                <a href="/help" className="block text-gray-400 hover:text-white transition-colors">Help Center</a>
                                <a href="/contact" className="block text-gray-400 hover:text-white transition-colors">Contact Us</a>
                                <a href="/privacy" className="block text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
                                <a href="/terms" className="block text-gray-400 hover:text-white transition-colors">Terms of Service</a>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-4">Contact Info</h3>
                            <div className="space-y-2 text-gray-400">
                                <p>Email: info@eduplatform.com</p>
                                <p>Phone: +1 (555) 123-4567</p>
                                <p>Address: 123 Education St, Learning City</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 mt-8 pt-8 text-center">
                        <p className="text-gray-400">© 2025 EduPlatform. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;