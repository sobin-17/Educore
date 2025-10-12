import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    BookOpen, 
    Users, 
    Star, 
    Clock, 
    Search, 
    Grid, 
    List,
    User,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { fetchCourses } from '../api';

const CourseCard = () => {
    const [courses, setCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedLevel, setSelectedLevel] = useState('all');
    const [sortBy, setSortBy] = useState('popular');
    const [viewMode, setViewMode] = useState('grid');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [user, setUser] = useState(null);

    // Categories for filtering
    const categories = [
        { value: 'all', label: 'All Categories' },
        { value: 'programming', label: 'Programming' },
        { value: 'design', label: 'Design' },
        { value: 'business', label: 'Business' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'data-science', label: 'Data Science' },
        { value: 'photography', label: 'Photography' },
        { value: 'music', label: 'Music' },
        { value: 'language', label: 'Language' }
    ];

    const levels = [
        { value: 'all', label: 'All Levels' },
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' }
    ];

    const sortOptions = [
        { value: 'popular', label: 'Most Popular' },
        { value: 'newest', label: 'Newest' },
        { value: 'rating', label: 'Highest Rated' },
        { value: 'price-low', label: 'Price: Low to High' },
        { value: 'price-high', label: 'Price: High to Low' }
    ];

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
            setUser(JSON.parse(userData));
        }

        // Fetch courses
        const getCourses = async () => {
            try {
                setLoading(true);
                const coursesData = await fetchCourses();
                setCourses(coursesData);
                setFilteredCourses(coursesData);
            } catch (err) {
                console.error("Failed to fetch courses:", err);
                setError(err.response?.data?.message || 'Failed to load courses. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        getCourses();
    }, []);

    // Filter and sort courses
    useEffect(() => {
        let filtered = [...courses];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(course => 
                course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.instructor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Category filter
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(course => 
                course.category && course.category.toLowerCase() === selectedCategory
            );
        }

        // Level filter
        if (selectedLevel !== 'all') {
            filtered = filtered.filter(course => 
                course.level && course.level.toLowerCase() === selectedLevel
            );
        }

        // Sort courses
        switch (sortBy) {
            case 'newest':
                filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'rating':
                filtered.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
                break;
            case 'price-low':
                filtered.sort((a, b) => (a.discount_price || a.price || 0) - (b.discount_price || b.price || 0));
                break;
            case 'price-high':
                filtered.sort((a, b) => (b.discount_price || b.price || 0) - (a.discount_price || a.price || 0));
                break;
            default: // popular
                filtered.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
        }

        setFilteredCourses(filtered);
    }, [courses, searchTerm, selectedCategory, selectedLevel, sortBy]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Loading courses...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
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
                            <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">Home</Link>
                            <Link to="/course-card" className="text-blue-600 font-medium">Courses</Link>
                            <Link to="/about" className="text-gray-700 hover:text-blue-600 font-medium">About</Link>
                            <Link to="/contact" className="text-gray-700 hover:text-blue-600 font-medium">Contact</Link>
                        </nav>

                        {/* User Menu */}
                        <div className="hidden md:flex items-center space-x-4">
                            {user ? (
                                <div className="flex items-center space-x-2">
                                    <Link to="/dashboard" className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                                        <User className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-800">{user.name}</span>
                                        <span className={`text-xs ${getRoleColor(user.role)} px-2 py-1 rounded`}>
                                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                        </span>
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
                            <Link to="/course-card" className="block py-2 text-blue-600 font-medium bg-blue-50 rounded-md">Courses</Link>
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

            {/* Page Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">All Courses</h1>
                    <p className="text-gray-600">Discover your next learning adventure</p>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white border-b sticky top-16 z-40">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Search courses..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-4 items-center">
                            {/* Category Filter */}
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {categories.map(category => (
                                    <option key={category.value} value={category.value}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>

                            {/* Level Filter */}
                            <select
                                value={selectedLevel}
                                onChange={(e) => setSelectedLevel(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {levels.map(level => (
                                    <option key={level.value} value={level.value}>
                                        {level.label}
                                    </option>
                                ))}
                            </select>

                            {/* Sort */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {sortOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>

                            {/* View Mode Toggle */}
                            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <Grid className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <List className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Count */}
            <div className="max-w-7xl mx-auto px-4 py-4">
                <p className="text-gray-600">
                    Showing {filteredCourses.length} of {courses.length} courses
                </p>
            </div>

            {/* Course Grid/List */}
            <div className="max-w-7xl mx-auto px-4 pb-12">
                {error ? (
                    <div className="text-center py-12">
                        <div className="text-red-600 text-lg mb-4">{error}</div>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-600 text-lg mb-4">
                            {searchTerm || selectedCategory !== 'all' || selectedLevel !== 'all' 
                                ? 'No courses found matching your criteria.' 
                                : 'No courses available yet.'
                            }
                        </div>
                        {(searchTerm || selectedCategory !== 'all' || selectedLevel !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedCategory('all');
                                    setSelectedLevel('all');
                                }}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={viewMode === 'grid' 
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                        : "space-y-6"
                    }>
                        {filteredCourses.map((course) => (
                            <div 
                                key={course.id} 
                                className={viewMode === 'grid'
                                    ? "bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-100"
                                    : "bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-100 flex"
                                }
                            >
                                {viewMode === 'grid' ? (
                                    // Grid View
                                    <>
                                        <img
                                            src={course.thumbnail_url || `https://placehold.co/400x250/ADD8E6/000000?text=${course.title.substring(0, 10).replace(/\s/g, '')}`}
                                            alt={course.title}
                                            className="w-full h-48 object-cover"
                                            onError={(e) => { 
                                                e.target.onerror = null; 
                                                e.target.src = `https://placehold.co/400x250/ADD8E6/000000?text=${course.title.substring(0, 10).replace(/\s/g, '')}`; 
                                            }}
                                        />
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                    {course.category || 'General'}
                                                </span>
                                                <span className="text-xs text-gray-500 flex items-center">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    {course.duration || 'Self-paced'}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-semibold mb-2 text-gray-900 line-clamp-2">
                                                {course.title}
                                            </h3>
                                            <p className="text-gray-600 mb-3 flex items-center">
                                                <User className="h-4 w-4 mr-1" />
                                                by {course.instructor_name}
                                            </p>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center">
                                                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                                    <span className="ml-1 text-sm text-gray-600">
                                                    {course.average_rating && !isNaN(Number(course.average_rating)) 
                                                        ? Number(course.average_rating).toFixed(1) 
                                                        : 'N/A'} ({course.review_count || 0} reviews)
                                                    </span>
                                                    <span className="ml-1 text-sm text-gray-500">
                                                        ({course.review_count || 0})
                                                    </span>
                                                </div>
                                                <div className="flex items-center text-gray-500 text-sm">
                                                    <Users className="h-4 w-4 mr-1" />
                                                    {course.enrolled_count || 0}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center space-x-2">
                                                    {course.discount_price ? (
                                                        <>
                                                            <span className="text-2xl font-bold text-blue-600">
                                                                ${course.discount_price}
                                                            </span>
                                                            <span className="text-sm text-gray-500 line-through">
                                                                ${course.price}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-2xl font-bold text-blue-600">
                                                            ${course.price || 'Free'}
                                                        </span>
                                                    )}
                                                </div>
                                                {course.level && (
                                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                        {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                                                    </span>
                                                )}
                                            </div>
                                            <Link 
                                                to={`/courses/${course.slug}`} 
                                                className="w-full block text-center bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                                            >
                                                Enroll Now
                                            </Link>
                                        </div>
                                    </>
                                ) : (
                                    // List View
                                    <>
                                        <img
                                            src={course.thumbnail_url || `https://placehold.co/300x200/ADD8E6/000000?text=${course.title.substring(0, 10).replace(/\s/g, '')}`}
                                            alt={course.title}
                                            className="w-48 h-32 object-cover flex-shrink-0"
                                            onError={(e) => { 
                                                e.target.onerror = null; 
                                                e.target.src = `https://placehold.co/300x200/ADD8E6/000000?text=${course.title.substring(0, 10).replace(/\s/g, '')}`; 
                                            }}
                                        />
                                        <div className="flex-1 p-6 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                        {course.category || 'General'}
                                                    </span>
                                                    <span className="text-xs text-gray-500 flex items-center">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        {course.duration || 'Self-paced'}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                                                    {course.title}
                                                </h3>
                                                <p className="text-gray-600 mb-3 flex items-center">
                                                    <User className="h-4 w-4 mr-1" />
                                                    by {course.instructor_name}
                                                </p>
                                                <div className="flex items-center space-x-4 mb-3">
                                                    <div className="flex items-center">
                                                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                                        <span className="ml-1 text-sm text-gray-600">
                                                        {course.average_rating && !isNaN(Number(course.average_rating)) 
                                                        ? Number(course.average_rating).toFixed(1) 
                                                        : 'N/A'} ({course.review_count || 0} reviews)
                                                        </span>
                                                        <span className="ml-1 text-sm text-gray-500">
                                                            ({course.review_count || 0})
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center text-gray-500 text-sm">
                                                        <Users className="h-4 w-4 mr-1" />
                                                        {course.enrolled_count || 0} students
                                                    </div>
                                                    {course.level && (
                                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                            {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    {course.discount_price ? (
                                                        <>
                                                            <span className="text-2xl font-bold text-blue-600">
                                                                ${course.discount_price}
                                                            </span>
                                                            <span className="text-sm text-gray-500 line-through">
                                                                ${course.price}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-2xl font-bold text-blue-600">
                                                            ${course.price || 'Free'}
                                                        </span>
                                                    )}
                                                </div>
                                                <Link 
                                                    to={`/courses/${course.slug}`} 
                                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                                                >
                                                    Enroll Now
                                                </Link>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseCard;