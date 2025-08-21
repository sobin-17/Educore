import React, { useState, useEffect, useRef } from 'react';
import { Bell, FileText } from 'lucide-react';

// Mock data to simulate API responses for enrolled courses and course materials.
// In a real application, you would replace this with actual API calls to your backend.
const mockEnrolledCourses = [
    {
        id: 'c1',
        title: 'Introduction to React',
        last_viewed: '2025-07-30T10:00:00Z'
    },
    {
        id: 'c2',
        title: 'Advanced JavaScript',
        last_viewed: '2025-07-28T15:30:00Z'
    },
    {
        id: 'c3',
        title: 'CSS for Beginners',
        last_viewed: '2025-07-29T12:00:00Z'
    }
];

const mockCourseMaterials = {
    'c1': [
        { id: 'm1_1', title: 'Component Lifecycle', created_at: '2025-07-29T09:00:00Z' },
        { id: 'm1_2', title: 'React Hooks Deep Dive', created_at: '2025-07-31T08:00:00Z' }, // This one is "new"
    ],
    'c2': [
        { id: 'm2_1', title: 'Promises and Async/Await', created_at: '2025-07-27T10:00:00Z' },
        { id: 'm2_2', title: 'Event Loop Explained', created_at: '2025-07-30T14:00:00Z' }, // This one is "new"
    ],
    'c3': [
        { id: 'm3_1', title: 'Flexbox Fundamentals', created_at: '2025-07-28T11:00:00Z' },
        { id: 'm3_2', title: 'Grid Layouts', created_at: '2025-07-29T10:00:00Z' },
    ]
};

// Helper function to simulate fetching new materials.
const mockFetchNewMaterials = async (user) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newMaterials = [];

    // This is a simplified check. A real system would be more robust.
    for (const course of mockEnrolledCourses) {
        const lastViewedTimestamp = new Date(course.last_viewed || 0);
        const materials = mockCourseMaterials[course.id] || [];

        const newCourseMaterials = materials.filter(material => {
            const materialCreationTimestamp = new Date(material.created_at);
            return materialCreationTimestamp > lastViewedTimestamp;
        });

        if (newCourseMaterials.length > 0) {
            newMaterials.push({
                courseTitle: course.title,
                materials: newCourseMaterials
            });
        }
    }
    return newMaterials;
};

// NotificationBell component for the student dashboard
const NotificationBell = ({ user }) => {
    const [newMaterials, setNewMaterials] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Fetch new materials when the component mounts or user changes
    const fetchNotifications = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const materials = await mockFetchNewMaterials(user);
            setNewMaterials(materials);
        } catch (error) {
            console.error("Failed to fetch new materials:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [user]);

    // Handle clicks outside the dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Function to handle "Mark as Read"
    const handleMarkAsRead = () => {
        // In a real application, you would make an API call to mark all notifications as read
        // For this mock, we just clear the state.
        setNewMaterials([]);
        setIsDropdownOpen(false);
    };

    const hasNotifications = newMaterials.length > 0;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="relative p-2 rounded-full text-gray-600 hover:text-blue-500 hover:bg-gray-100 transition-colors duration-200"
            >
                <Bell className="h-6 w-6" />
                {hasNotifications && (
                    <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full animate-ping"></span>
                )}
                {hasNotifications && (
                    <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                )}
            </button>
            {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 z-10">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h4 className="font-bold text-lg text-gray-800">Notifications</h4>
                        <button
                            onClick={handleMarkAsRead}
                            className="text-blue-600 hover:underline text-sm font-medium"
                        >
                            Mark all as read
                        </button>
                    </div>
                    {isLoading ? (
                        <div className="p-4 text-center text-gray-500">Loading...</div>
                    ) : hasNotifications ? (
                        <div className="max-h-64 overflow-y-auto">
                            {newMaterials.map((courseNotif, index) => (
                                <div key={index} className="px-4 py-3 border-b border-gray-100 last:border-b-0">
                                    <p className="text-gray-900 font-semibold text-sm truncate">
                                        New materials added to: {courseNotif.courseTitle}
                                    </p>
                                    <ul className="mt-2 space-y-1">
                                        {courseNotif.materials.map((material) => (
                                            <li key={material.id} className="flex items-center text-gray-700 text-sm">
                                                <FileText className="h-4 w-4 mr-2 text-gray-400" />
                                                <span className="truncate">{material.title}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-gray-500">No new notifications.</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;