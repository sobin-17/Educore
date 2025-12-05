import React, { useState, useEffect, useCallback } from 'react';
import {
    Video, Clock, Info, PlayCircle, XCircle, User, CheckCircle, RefreshCw,
    Users, MessageSquare, Monitor, Lock
} from 'lucide-react';

// Import these API functions from your existing api.js
import {
    fetchCourseClasses,
    joinOnlineClass,
    fetchEnrolledCourses
} from '../api';

const StudentOnlineClass = ({ user }) => {
    const [liveClasses, setLiveClasses] = useState([]);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [joiningClass, setJoiningClass] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Memoized function to prevent unnecessary re-renders
    const fetchStudentLiveClasses = useCallback(async (showRefreshing = false) => {
        try {
            if (showRefreshing) setRefreshing(true);
            setError('');
            
            // First get enrolled courses
            const courses = await fetchEnrolledCourses();
            const validCourses = Array.isArray(courses) ? courses : [];
            setEnrolledCourses(validCourses);
            
            // Then get all classes for each enrolled course
            const allClasses = [];
            
            // Use Promise.allSettled for better error handling
            const classPromises = validCourses.map(async (course) => {
                // Use course_id if available, fallback to id
                const courseId = course.course_id || course.id;
                try {
                    const classes = await fetchCourseClasses(courseId);
                    const validClasses = Array.isArray(classes) ? classes : [];
                    
                    // Map instructor data structure to student expected structure
                    return validClasses.map(cls => {
                        // Generate meeting URL from meeting_room_name if available
                        const meetingUrl = cls.meeting_room_name 
                            ? `https://meet.jit.si/${cls.meeting_room_name}` 
                            : cls.meeting_url || null;
                        
                        // Calculate end time from start time and duration
                        const startTime = cls.scheduled_date || cls.start_time || new Date().toISOString();
                        const durationMs = (cls.duration_minutes || 60) * 60 * 1000;
                        const endTime = cls.end_time || new Date(new Date(startTime).getTime() + durationMs).toISOString();
                        
                        return {
                            ...cls,
                            // Map instructor fields to student expected fields
                            id: cls.id,
                            title: cls.title || 'Untitled Class',
                            description: cls.description || '',
                            start_time: startTime,
                            end_time: endTime,
                            duration_minutes: cls.duration_minutes || 60,
                            meeting_url: meetingUrl,
                            meeting_password: cls.meeting_password || null,
                            max_participants: cls.max_participants || 50,
                            
                            // Course information
                            course_id: courseId,
                            course_title: course.title || 'Unknown Course',
                            instructor_name: course.instructor_name || 'Unknown Instructor',
                            
                            // Additional features from instructor system
                            recording_enabled: cls.recording_enabled || false,
                            chat_enabled: cls.chat_enabled !== false, // Default to true
                            screen_share_enabled: cls.screen_share_enabled !== false, // Default to true
                            
                            // Status mapping
                            status: cls.status || 'scheduled',
                            
                            // Meeting room info
                            meeting_room_name: cls.meeting_room_name || null
                        };
                    });
                } catch (err) {
                    console.error(`Error fetching classes for course ${courseId}:`, err);
                    return []; // Return empty array for failed course
                }
            });

            const classResults = await Promise.allSettled(classPromises);
            
            // Flatten results and filter out failed promises
            classResults.forEach(result => {
                if (result.status === 'fulfilled') {
                    allClasses.push(...result.value);
                }
            });
            
            // Sort classes by start time
            allClasses.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
            
            setLiveClasses(allClasses);
        } catch (err) {
            console.error('Error fetching student live classes:', err);
            const errorMessage = err?.response?.data?.message || err?.message || 'Failed to load live classes.';
            setError(errorMessage);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []); // Empty dependency array since it doesn't depend on any props/state

    useEffect(() => {
        fetchStudentLiveClasses();
        // Poll for updates every 30 seconds
        const interval = setInterval(() => fetchStudentLiveClasses(), 30000);
        return () => clearInterval(interval);
    }, [fetchStudentLiveClasses]);

    const handleRefresh = useCallback(() => {
        fetchStudentLiveClasses(true);
    }, [fetchStudentLiveClasses]);

    const handleJoinClass = useCallback(async (liveClass) => {
        if (!liveClass?.meeting_url) {
            // Try to generate meeting URL if meeting_room_name exists
            if (liveClass?.meeting_room_name) {
                liveClass.meeting_url = `https://meet.jit.si/${liveClass.meeting_room_name}`;
            } else {
                setError('Meeting link is not available yet.');
                return;
            }
        }

        if (!liveClass.id) {
            setError('Invalid class information.');
            return;
        }

        setJoiningClass(liveClass.id);
        try {
            // Enhanced course finding with better error handling and logging
            console.log('Looking for course with ID:', liveClass.course_id);
            console.log('Available courses:', enrolledCourses);
            
            // Find the course this class belongs to with more flexible matching
            let course = enrolledCourses.find(c => {
                const courseId = c.course_id || c.id;
                const classTargetId = liveClass.course_id;
                
                console.log('Comparing:', { courseId, classTargetId, courseTitle: c.title, classTitle: liveClass.course_title });
                
                return courseId === classTargetId || 
                       c.id === classTargetId ||
                       (c.title && liveClass.course_title && c.title === liveClass.course_title);
            });
            
            // If still not found, try with string conversion (in case of type mismatch)
            if (!course) {
                course = enrolledCourses.find(c => {
                    const courseId = String(c.course_id || c.id);
                    const classTargetId = String(liveClass.course_id);
                    return courseId === classTargetId;
                });
            }
            
            console.log('Found course:', course);
            
            if (!course) {
                // More detailed error for debugging
                const availableCourseIds = enrolledCourses.map(c => ({ 
                    id: c.id, 
                    course_id: c.course_id, 
                    title: c.title 
                }));
                console.error('Course lookup failed. Available courses:', availableCourseIds);
                console.error('Looking for course_id:', liveClass.course_id);
                
                throw new Error(`Course not found. Looking for course ID: ${liveClass.course_id}. Available courses: ${availableCourseIds.map(c => `${c.title}(${c.id || c.course_id})`).join(', ')}`);
            }
            
            // Use the appropriate course ID for the API call
            const courseIdForApi = course.course_id || course.id;
            
            if (!courseIdForApi) {
                throw new Error('Course ID is missing from course data');
            }
            
            // Record the join attempt using the existing API
            await joinOnlineClass(courseIdForApi, liveClass.id);
            
            // Construct meeting URL with password if available
            let meetingUrl = liveClass.meeting_url;
            if (liveClass.meeting_password) {
                // For Jitsi, we can append the password as a URL parameter
                const url = new URL(meetingUrl);
                url.searchParams.set('jwt', liveClass.meeting_password);
                meetingUrl = url.toString();
            }
            
            // Open meeting in new tab with security attributes
            const newWindow = window.open(
                meetingUrl, 
                '_blank', 
                'noopener,noreferrer,width=1200,height=800'
            );
            
            // Check if popup was blocked
            if (!newWindow) {
                throw new Error('Popup was blocked. Please allow popups for this site and try again.');
            }
            
            setError(''); // Clear any previous errors
        } catch (err) {
            console.error('Error joining live class:', err);
            const errorMessage = err?.response?.data?.message || err?.message || 'Failed to join live class.';
            setError(errorMessage);
        } finally {
            setJoiningClass(null);
        }
    }, [enrolledCourses]);

    const getClassStatus = useCallback((startTime, endTime, dbStatus) => {
        if (!startTime || !endTime) {
            return { 
                status: 'unknown', 
                color: 'text-gray-600', 
                bg: 'bg-gray-100',
                label: 'Unknown'
            };
        }

        const now = new Date();
        const start = new Date(startTime);
        const end = new Date(endTime);
        
        // Validate dates
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return { 
                status: 'unknown', 
                color: 'text-gray-600', 
                bg: 'bg-gray-100',
                label: 'Invalid Time'
            };
        }
        
        // Check database status first
        if (dbStatus === 'cancelled') {
            return { 
                status: 'cancelled', 
                color: 'text-red-600', 
                bg: 'bg-red-100',
                label: 'Cancelled'
            };
        }
        
        if (dbStatus === 'completed') {
            return { 
                status: 'ended', 
                color: 'text-gray-600', 
                bg: 'bg-gray-100',
                label: 'Completed'
            };
        }
        
        // Use time-based status for active classes
        if (now < start) return { 
            status: 'upcoming', 
            color: 'text-blue-600', 
            bg: 'bg-blue-100',
            label: 'Upcoming'
        };
        
        if (now >= start && now <= end && (dbStatus === 'active' || dbStatus === 'scheduled')) {
            return { 
                status: 'live', 
                color: 'text-green-600', 
                bg: 'bg-green-100',
                label: 'LIVE'
            };
        }
        
        return { 
            status: 'ended', 
            color: 'text-gray-600', 
            bg: 'bg-gray-100',
            label: 'Ended'
        };
    }, []);

    const formatDateTime = useCallback((dateTime) => {
        if (!dateTime) return 'Invalid Date';
        
        try {
            const date = new Date(dateTime);
            if (isNaN(date.getTime())) return 'Invalid Date';
            
            return date.toLocaleString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (err) {
            console.error('Error formatting date:', err);
            return 'Invalid Date';
        }
    }, []);

    const getTimeUntilClass = useCallback((startTime) => {
        if (!startTime) return null;
        
        try {
            const now = new Date();
            const start = new Date(startTime);
            
            if (isNaN(start.getTime())) return null;
            
            const diffMs = start - now;
            
            if (diffMs <= 0) return null;
            
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);
            
            if (diffDays > 0) return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
            if (diffHours > 0) return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
            if (diffMins > 0) return `in ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
            return 'starting soon';
        } catch (err) {
            console.error('Error calculating time until class:', err);
            return null;
        }
    }, []);

    const getDurationText = useCallback((minutes) => {
        if (!minutes || minutes < 1) return 'Unknown duration';
        
        if (minutes < 60) return `${minutes}min`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
    }, []);

    // Separate classes by status for better organization
    const liveClasses_active = liveClasses.filter(cls => 
        getClassStatus(cls.start_time, cls.end_time, cls.status).status === 'live'
    );
    const upcomingClasses = liveClasses.filter(cls => 
        getClassStatus(cls.start_time, cls.end_time, cls.status).status === 'upcoming'
    );
    const endedClasses = liveClasses.filter(cls => {
        const status = getClassStatus(cls.start_time, cls.end_time, cls.status).status;
        return status === 'ended' || status === 'cancelled';
    });

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <Video className="h-7 w-7 mr-3 text-blue-600" />
                    Live Classes
                </h3>
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mr-3" />
                    <p className="text-gray-600">Loading live classes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Video className="h-7 w-7 mr-3 text-blue-600" />
                    Live Classes
                </h3>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Refresh live classes"
                >
                    <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-800 rounded-lg text-sm" role="alert">
                    <div className="flex items-center">
                        <XCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {liveClasses.length === 0 ? (
                <div className="text-center py-12">
                    <Video className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Live Classes Scheduled</h4>
                    <p className="text-gray-600 mb-1">No live classes scheduled for your enrolled courses.</p>
                    <p className="text-gray-500 text-sm">Check back later or contact your instructors for upcoming sessions.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Live Classes Section */}
                    {liveClasses_active.length > 0 && (
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse" aria-hidden="true"></div>
                                <span>Live Now ({liveClasses_active.length})</span>
                            </h4>
                            <div className="space-y-4">
                                {liveClasses_active.map(liveClass => {
                                    const classStatus = getClassStatus(liveClass.start_time, liveClass.end_time, liveClass.status);
                                    
                                    return (
                                        <div 
                                            key={`live-${liveClass.id}`} 
                                            className="border-2 border-green-200 bg-green-50 rounded-lg p-4 shadow-md"
                                        >
                                            <ClassCard 
                                                liveClass={liveClass} 
                                                classStatus={classStatus}
                                                onJoin={handleJoinClass}
                                                joiningClass={joiningClass}
                                                getDurationText={getDurationText}
                                                formatDateTime={formatDateTime}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Upcoming Classes Section */}
                    {upcomingClasses.length > 0 && (
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                                Upcoming Classes ({upcomingClasses.length})
                            </h4>
                            <div className="space-y-4">
                                {upcomingClasses.map(liveClass => {
                                    const classStatus = getClassStatus(liveClass.start_time, liveClass.end_time, liveClass.status);
                                    const timeUntil = getTimeUntilClass(liveClass.start_time);
                                    
                                    return (
                                        <div 
                                            key={`upcoming-${liveClass.id}`} 
                                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                                        >
                                            <ClassCard 
                                                liveClass={liveClass} 
                                                classStatus={classStatus}
                                                onJoin={handleJoinClass}
                                                joiningClass={joiningClass}
                                                getDurationText={getDurationText}
                                                formatDateTime={formatDateTime}
                                                timeUntil={timeUntil}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Ended Classes Section */}
                    {endedClasses.length > 0 && (
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <CheckCircle className="h-5 w-5 mr-2 text-gray-600" />
                                Recently Ended ({Math.min(endedClasses.length, 5)})
                            </h4>
                            <div className="space-y-4">
                                {endedClasses.slice(0, 5).map(liveClass => { // Show only recent 5
                                    const classStatus = getClassStatus(liveClass.start_time, liveClass.end_time, liveClass.status);
                                    
                                    return (
                                        <div 
                                            key={`ended-${liveClass.id}`} 
                                            className="border border-gray-100 rounded-lg p-4 bg-gray-50 opacity-75"
                                        >
                                            <ClassCard 
                                                liveClass={liveClass} 
                                                classStatus={classStatus}
                                                onJoin={handleJoinClass}
                                                joiningClass={joiningClass}
                                                getDurationText={getDurationText}
                                                formatDateTime={formatDateTime}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Separate ClassCard component for better organization
const ClassCard = React.memo(({ 
    liveClass, 
    classStatus, 
    onJoin, 
    joiningClass, 
    getDurationText, 
    formatDateTime, 
    timeUntil 
}) => {
    const handleJoinClick = useCallback(() => {
        onJoin(liveClass);
    }, [onJoin, liveClass]);

    return (
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-grow mb-4 lg:mb-0">
                <div className="flex items-center mb-3">
                    <h5 className="text-lg font-semibold text-gray-900 mr-3">
                        {liveClass.title}
                    </h5>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${classStatus.color} ${classStatus.bg}`}>
                        {classStatus.status === 'live' && '🔴 '}
                        {classStatus.label}
                    </span>
                </div>
                
                <div className="space-y-2 mb-3">
                    <p className="text-sm text-gray-700">
                        <strong>Course:</strong> {liveClass.course_title}
                    </p>
                    
                    <p className="text-sm text-gray-700 flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        <strong>Instructor:</strong> {liveClass.instructor_name}
                    </p>
                    
                    {liveClass.max_participants && (
                        <p className="text-sm text-gray-700 flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            <strong>Max Participants:</strong> {liveClass.max_participants}
                        </p>
                    )}
                </div>
                
                {liveClass.description && (
                    <p className="text-sm text-gray-600 mb-3 p-2 bg-gray-100 rounded-md">
                        {liveClass.description}
                    </p>
                )}

                {/* Meeting Features Display */}
                {(liveClass.recording_enabled || liveClass.chat_enabled || liveClass.screen_share_enabled) && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {liveClass.recording_enabled && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                <Video className="h-3 w-3 mr-1" />
                                Recording
                            </span>
                        )}
                        {liveClass.chat_enabled && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Chat
                            </span>
                        )}
                        {liveClass.screen_share_enabled && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                                <Monitor className="h-3 w-3 mr-1" />
                                Screen Share
                            </span>
                        )}
                    </div>
                )}
                
                <div className="flex flex-wrap items-center text-sm text-gray-500 space-x-4">
                    <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDateTime(liveClass.start_time)}
                    </span>
                    <span className="flex items-center">
                        <Info className="h-4 w-4 mr-1" />
                        {getDurationText(liveClass.duration_minutes)}
                    </span>
                    {timeUntil && (
                        <span className="flex items-center text-blue-600 font-medium">
                            <PlayCircle className="h-4 w-4 mr-1" />
                            Starts {timeUntil}
                        </span>
                    )}
                    {liveClass.meeting_password && (
                        <span className="flex items-center text-orange-600 font-medium">
                            <Lock className="h-4 w-4 mr-1" />
                            Password Required
                        </span>
                    )}
                </div>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 lg:ml-4">
                {classStatus.status === 'live' && (
                    <div className="flex flex-col space-y-2">
                        <button
                            onClick={handleJoinClick}
                            disabled={joiningClass === liveClass.id || (!liveClass.meeting_url && !liveClass.meeting_room_name)}
                            className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:bg-green-700 transition-colors font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            aria-label={`Join live class: ${liveClass.title}`}
                        >
                            {joiningClass === liveClass.id ? (
                                <>
                                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                                    Joining...
                                </>
                            ) : (
                                <>
                                    <Video className="h-5 w-5 mr-2" />
                                    Join Live Class
                                </>
                            )}
                        </button>
                        {liveClass.meeting_password && (
                            <div className="text-xs text-gray-600 text-center">
                                Password may be required
                            </div>
                        )}
                    </div>
                )}
                
                {classStatus.status === 'upcoming' && (liveClass.meeting_url || liveClass.meeting_room_name) && (
                    <div className="flex flex-col space-y-2">
                        <button
                            onClick={handleJoinClick}
                            disabled={joiningClass === liveClass.id}
                            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:bg-blue-700 transition-colors font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            aria-label={`Open meeting room for: ${liveClass.title}`}
                        >
                            {joiningClass === liveClass.id ? (
                                <>
                                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                                    Opening...
                                </>
                            ) : (
                                <>
                                    <Video className="h-5 w-5 mr-2" />
                                    Open Meeting Room
                                </>
                            )}
                        </button>
                        {liveClass.meeting_password && (
                            <div className="text-xs text-gray-600 text-center">
                                Password may be required
                            </div>
                        )}
                    </div>
                )}
                
                {classStatus.status === 'upcoming' && !liveClass.meeting_url && !liveClass.meeting_room_name && (
                    <div className="flex items-center px-6 py-3 bg-yellow-100 text-yellow-800 rounded-lg font-medium">
                        <Clock className="h-5 w-5 mr-2" />
                        Waiting for instructor
                    </div>
                )}
                
                {(classStatus.status === 'ended' || classStatus.status === 'cancelled') && (
                    <div className="flex items-center px-6 py-3 bg-gray-100 text-gray-600 rounded-lg font-medium">
                        <XCircle className="h-5 w-5 mr-2" />
                        {classStatus.status === 'cancelled' ? 'Class Cancelled' : 'Class Ended'}
                    </div>
                )}
            </div>
        </div>
    );
});

ClassCard.displayName = 'ClassCard';

export default StudentOnlineClass;