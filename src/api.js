import axios from 'axios';

// IMPORTANT: This URL MUST match the port your Express backend is running on.
// If your backend console says "Server running on http://localhost:5000", then this is correct.
// If it says a different port (e.g., 5001), you must change this value.
const API_BASE_URL = 'http://localhost:5000';

/**
 * Sets the authorization header for Axios requests.
 * @param {string} token - The JWT token to be set in the Authorization header.
 */
const setAuthToken = (token) => {
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete axios.defaults.headers.common['Authorization'];
    }
};

// Interceptor to attach token from localStorage to every request
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Logs in a user by sending credentials to the backend.
 * @param {object} credentials - An object containing user's email and password.
 * @param {string} credentials.email - The user's email address.
 * @param {string} credentials.password - The user's password.
 * @returns {Promise<object>} A promise that resolves with the token and user data on success.
 * @throws {Error} Throws an error if the login fails.
 */
export const loginUser = async (credentials) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
        // The backend sends back { message, token, user }
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user)); // Store user data
            setAuthToken(response.data.token);
        }
        return response.data;
    } catch (error) {
        // Axios wraps the error response in error.response
        if (error.response) {
            console.error('Login error response:', error.response.data);
            throw error;
        } else if (error.request) {
            console.error('Login error request:', error.request);
            throw new Error('No response from server. Please check your network connection or server status.');
        } else {
            console.error('Login error message:', error.message);
            throw new Error('An unexpected error occurred during login.');
        }
    }
};

/**
 * Registers a new user.
 * @param {FormData} userData - FormData object containing user registration details, including profileImage file.
 * @returns {Promise<object>} A promise that resolves with the registration success message.
 * @throws {Error} Throws an error if registration fails.
 */
export const registerUser = async (userData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, userData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error('Registration error response:', error.response.data);
            throw error;
        } else if (error.request) {
            console.error('Registration error request:', error.request);
            throw new Error('No response from server. Please check your network connection or server status.');
        } else {
            console.error('Registration error message:', error.message);
            throw new Error('An unexpected error occurred during registration.');
        }
    }
};

/**
 * Fetches the profile of the currently logged-in user.
 * @returns {Promise<object>} A promise that resolves with the user profile data.
 * @throws {Error} Throws an error if fetching profile fails (e.g., invalid token).
 */
export const fetchUserProfile = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/auth/profile`);
        return response.data.user;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
};

/**
 * Updates the profile of the currently logged-in user.
 * @param {FormData} updateData - FormData object containing updated user details, including profileImage file.
 * @returns {Promise<object>} A promise that resolves with the updated user data.
 * @throws {Error} Throws an error if updating profile fails.
 */
export const updateProfile = async (updateData) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.put(`${API_BASE_URL}/auth/profile`, updateData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
        });
        // Corrected line: Return the nested user object from the response data.
        return response.data.user;
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
};

/**
 * Fetches all categories from the backend.
 * @returns {Promise<Array>} A promise that resolves with an array of category objects.
 * @throws {Error} Throws an error if fetching categories fails.
 */
export const fetchCategories = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/categories`);
        return response.data.categories;
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
};

/**
 * Fetches courses created by the logged-in instructor.
 * @returns {Promise<Array>} A promise that resolves with an array of instructor's course objects.
 * @throws {Error} Throws an error if fetching courses fails.
 */
export const fetchInstructorCourses = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.get(`${API_BASE_URL}/api/instructor/courses`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data.courses;
    } catch (error) {
        console.error('Error fetching instructor courses:', error);
        throw error;
    }
};

/**
 * Creates a new course.
 * Requires a valid JWT token and instructor role.
 * @param {FormData} courseData - FormData object containing course details (including thumbnail file).
 * @returns {Promise<object>} A promise that resolves with the created course data.
 * @throws {Error} Throws an error if creation fails.
 */
export const createCourse = async (courseData) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.post(`${API_BASE_URL}/api/instructor/courses`, courseData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data', // Important for FormData
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error creating course:', error);
        throw error;
    }
};

/**
 * Updates an existing course.
 * Requires a valid JWT token and instructor role.
 * @param {string} courseId - The ID of the course to update.
 * @param {FormData} updateData - FormData object containing updated course details and optionally a new thumbnail.
 * @returns {Promise<object>} A promise that resolves with a success message.
 * @throws {Error} Throws an error if course update fails.
 */
export const updateCourse = async (courseId, updateData) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.put(`${API_BASE_URL}/api/instructor/courses/${courseId}`, updateData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data', // Important for FormData
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error updating course ${courseId}:`, error);
        throw error;
    }
};

/**
 * Adds a new material (video or document) to a course.
 * @param {string} courseId - The ID of the course to add material to.
 * @param {FormData} materialData - FormData object containing material details and the file.
 * @returns {Promise<object>} A promise that resolves with the new material's ID.
 * @throws {Error} Throws an error if adding material fails.
 */
export const addCourseMaterial = async (courseId, materialData) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.post(`${API_BASE_URL}/api/instructor/courses/${courseId}/materials`, materialData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data', // Essential for file uploads
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error adding material to course ${courseId}:`, error);
        throw error;
    }
};

/**
 * Updates an existing course material.
 * @param {string} courseId - The ID of the course the material belongs to.
 * @param {string} materialId - The ID of the material to update.
 * @param {FormData} updateData - FormData object containing updated material details and optionally a new file.
 * @returns {Promise<object>} A promise that resolves with a success message.
 * @throws {Error} Throws an error if material update fails.
 */
export const updateCourseMaterial = async (courseId, materialId, updateData) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.put(`${API_BASE_URL}/api/instructor/courses/${courseId}/materials/${materialId}`, updateData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error updating material ${materialId} for course ${courseId}:`, error);
        throw error;
    }
};

/**
 * Deletes a course material.
 * @param {string} courseId - The ID of the course the material belongs to.
 * @param {string} materialId - The ID of the material to delete.
 * @returns {Promise<object>} A promise that resolves with a success message.
 * @throws {Error} Throws an error if material deletion fails.
 */
export const deleteCourseMaterial = async (courseId, materialId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.delete(`${API_BASE_URL}/api/instructor/courses/${courseId}/materials/${materialId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error deleting material ${materialId} for course ${courseId}:`, error);
        throw error;
    }
};

/**
 * Fetches all materials for a specific course.
 * Requires a valid JWT token.
 * @param {string} courseId - The ID of the course to fetch materials for.
 * @returns {Promise<Array>} A promise that resolves with an array of material objects.
 * @throws {Error} Throws an error if fetching materials fails.
 */
export const fetchCourseMaterials = async (courseId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.get(`${API_BASE_URL}/api/courses/${courseId}/materials`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data.materials;
    } catch (error) {
        console.error(`Error fetching materials for course ${courseId}:`, error);
        throw error;
    }
};

/**
 * Fetches a list of courses from the backend.
 * @returns {Promise<Array>} A promise that resolves with an array of course objects.
 * @throws {Error} Throws an error if fetching courses fails.
 */
export const fetchCourses = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/courses`);
        return response.data.courses;
    } catch (error) {
        console.error('Error fetching courses:', error);
        throw error;
    }
};

/**
 * Fetches details for a specific course by its slug.
 * @param {string} slug - The slug (unique identifier) of the course.
 * @returns {Promise<object>} A promise that resolves with the course details.
 * @throws {Error} Throws an error if fetching course details fails.
 */
export const fetchCourseDetails = async (slug) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/courses/${slug}`); // Assuming your backend API for course details is at /api/courses/:slug
        return response.data.course; // Assuming your backend sends course data inside a 'course' property
    } catch (error) {
        console.error(`Error fetching course details for slug ${slug}:`, error);
        throw error;
    }
};

/**
 * Enrolls the logged-in student into a specific course.
 * Requires a valid JWT token and student role.
 * @param {string} courseId - The ID of the course to enroll in.
 * @returns {Promise<object>} A promise that resolves with a success message.
 * @throws {Error} Throws an error if enrollment fails.
 */
export const enrollCourse = async (courseId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.post(`${API_BASE_URL}/api/student/enroll/${courseId}`, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error enrolling in course ${courseId}:`, error);
        throw error;
    }
};

/**
 * Fetches courses the logged-in student is enrolled in.
 * Requires a valid JWT token and student role.
 * @returns {Promise<Array>} A promise that resolves with an array of enrolled course objects.
 * @throws {Error} Throws an error if fetching enrolled courses fails.
 */
export const fetchEnrolledCourses = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.get(`${API_BASE_URL}/api/student/courses`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data.enrolledCourses;
    } catch (error) {
        console.error('Error fetching enrolled courses:', error);
        throw error;
    }
};

/**
 * Fetches chat messages for a specific course.
 * Requires a valid JWT token and membership in the course (instructor or enrolled student).
 * @param {string} courseId - The ID of the course to fetch messages for.
 * @returns {Promise<Array>} A promise that resolves with an array of message objects.
 * @throws {Error} Throws an error if fetching messages fails.
 */
export const fetchCourseChatMessages = async (courseId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.get(`${API_BASE_URL}/api/courses/${courseId}/chat/messages`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data.messages;
    } catch (error) {
        console.error(`Error fetching chat messages for course ${courseId}:`, error);
        throw error;
    }
};

/**
 * Sends a chat message to a specific course.
 * Requires a valid JWT token and membership in the course (instructor or enrolled student).
 * @param {string} courseId - The ID of the course to send the message to.
 * @param {string} messageContent - The content of the message.
 * @returns {Promise<object>} A promise that resolves with a success message.
 * @throws {Error} Throws an error if sending message fails.
 */
export const sendCourseChatMessage = async (courseId, messageContent) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.post(`${API_BASE_URL}/api/courses/${courseId}/chat/messages`,
            { message_content: messageContent },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        console.error(`Error sending chat message to course ${courseId}:`, error);
        throw error;
    }
};

/**
 * Fetches a list of enrolled students for a specific course.
 * Requires a valid JWT token and instructor role, and the instructor must own the course.
 * @param {string} courseId - The ID of the course to fetch enrolled students for.
 * @returns {Promise<Array>} A promise that resolves with an array of student objects (id, name, email, enrollment details).
 * @throws {Error} Throws an error if fetching fails (e.g., unauthorized, course not found).
 */
export const fetchEnrolledStudents = async (courseId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.get(`${API_BASE_URL}/api/instructor/courses/${courseId}/enrolled-students`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data.students;
    } catch (error) {
        console.error(`Error fetching enrolled students for course ${courseId}:`, error);
        throw error;
    }
};

// ===============================================
// ONLINE CLASS MANAGEMENT FUNCTIONS - UPDATED
// ===============================================

/**
 * Fetches all online classes for a specific course.
 * Works for both instructors and enrolled students.
 * @param {string} courseId - The ID of the course to fetch classes for.
 * @returns {Promise<Array>} A promise that resolves with an array of class objects.
 * @throws {Error} Throws an error if fetching classes fails.
 */
export const fetchCourseClasses = async (courseId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.get(`${API_BASE_URL}/api/courses/${courseId}/classes`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data.classes;
    } catch (error) {
        console.error(`Error fetching classes for course ${courseId}:`, error);
        throw error;
    }
};

/**
 * Joins an online class and records attendance (for students).
 * @param {string} courseId - The ID of the course the class belongs to.
 * @param {string} classId - The ID of the class to join.
 * @returns {Promise<object>} A promise that resolves with join details (meeting URL, etc.).
 * @throws {Error} Throws an error if joining fails.
 */
export const joinOnlineClass = async (courseId, classId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.post(`${API_BASE_URL}/api/courses/${courseId}/classes/${classId}/join`, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error joining class ${classId} for course ${courseId}:`, error);
        throw error;
    }
};

/**
 * Fetches all online classes for a student's enrolled courses.
 * @param {string} status - Optional status filter ('scheduled', 'active', 'completed', 'cancelled').
 * @returns {Promise<Array>} A promise that resolves with an array of class objects.
 * @throws {Error} Throws an error if fetching classes fails.
 */
export const fetchStudentOnlineClasses = async (status = null) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        
        let url = `${API_BASE_URL}/api/student/online-classes`;
        if (status) {
            url += `?status=${status}`;
        }
        
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data.classes;
    } catch (error) {
        console.error('Error fetching student online classes:', error);
        throw error;
    }
};

// ===============================================
// INSTRUCTOR ONLINE CLASS MANAGEMENT FUNCTIONS
// ===============================================

/**
 * Schedules a new online class.
 * @param {object} classData - Object containing class details.
 * @returns {Promise<object>} A promise that resolves with the created class data.
 * @throws {Error} Throws an error if creation fails.
 */
export const scheduleOnlineClass = async (classData) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.post(`${API_BASE_URL}/api/online-classes`, classData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error scheduling online class:', error);
        throw error;
    }
};

/**
 * Fetches all online classes for the logged-in instructor.
 * @param {string} status - Optional status filter.
 * @returns {Promise<Array>} A promise that resolves with an array of class objects.
 * @throws {Error} Throws an error if fetching classes fails.
 */
export const fetchInstructorOnlineClasses = async (status = null) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        
        let url = `${API_BASE_URL}/api/online-classes`;
        if (status) {
            url += `?status=${status}`;
        }
        
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data.data;
    } catch (error) {
        console.error('Error fetching instructor online classes:', error);
        throw error;
    }
};

/**
 * Updates the status of an online class.
 * @param {string} classId - The ID of the class to update.
 * @param {string} status - The new status ('scheduled', 'active', 'completed', 'cancelled').
 * @returns {Promise<object>} A promise that resolves with a success message.
 * @throws {Error} Throws an error if update fails.
 */
export const updateClassStatus = async (classId, status) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.put(`${API_BASE_URL}/api/online-classes/${classId}/status`, 
            { status }, 
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error(`Error updating class ${classId} status:`, error);
        throw error;
    }
};

/**
 * Fetches courses for class scheduling (instructor only).
 * @returns {Promise<Array>} A promise that resolves with an array of course objects.
 * @throws {Error} Throws an error if fetching courses fails.
 */
export const fetchInstructorCoursesForClasses = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.get(`${API_BASE_URL}/api/instructor/courses-for-classes`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data.data;
    } catch (error) {
        console.error('Error fetching instructor courses for classes:', error);
        throw error;
    }
};

// ===============================================
// LEGACY FUNCTIONS (keeping for backward compatibility)
// ===============================================

/**
 * @deprecated Use scheduleOnlineClass instead
 */
export const createOnlineClass = async (courseId, classData) => {
    console.warn('createOnlineClass is deprecated. Use scheduleOnlineClass instead.');
    return await scheduleOnlineClass({ ...classData, course_id: courseId });
};

/**
 * @deprecated Use updateClassStatus instead
 */
export const updateOnlineClass = async (courseId, classId, updateData) => {
    console.warn('updateOnlineClass is deprecated. Use updateClassStatus instead.');
    if (updateData.status) {
        return await updateClassStatus(classId, updateData.status);
    }
    throw new Error('Only status updates are supported through this function');
};

/**
 * @deprecated Direct class deletion not supported in new system
 */
export const deleteOnlineClass = async (courseId, classId) => {
    console.warn('deleteOnlineClass is deprecated. Use updateClassStatus with "cancelled" status instead.');
    return await updateClassStatus(classId, 'cancelled');
};

// ===============================================
// ADMIN MANAGEMENT FUNCTIONS - ADD THESE TO YOUR api.js FILE
// ===============================================

/**
 * Fetches all users (admin only).
 * Requires a valid JWT token and admin role.
 * @returns {Promise<Array>} A promise that resolves with an array of all user objects.
 * @throws {Error} Throws an error if fetching users fails.
 */
export const fetchAllUsers = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.get(`${API_BASE_URL}/api/admin/users`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data.users;
    } catch (error) {
        console.error('Error fetching all users:', error);
        throw error;
    }
};

/**
 * Fetches all courses (admin only).
 * Requires a valid JWT token and admin role.
 * @returns {Promise<Array>} A promise that resolves with an array of all course objects.
 * @throws {Error} Throws an error if fetching courses fails.
 */
export const fetchAllCourses = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.get(`${API_BASE_URL}/api/admin/courses`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data.courses;
    } catch (error) {
        console.error('Error fetching all courses:', error);
        throw error;
    }
};

/**
 * Creates a new instructor account (admin only).
 * Requires a valid JWT token and admin role.
 * @param {object} instructorData - Object containing instructor details (name, email, password, etc.).
 * @returns {Promise<object>} A promise that resolves with the created instructor data.
 * @throws {Error} Throws an error if creation fails.
 */
export const createInstructor = async (instructorData) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.post(`${API_BASE_URL}/api/admin/create-instructor`, instructorData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error creating instructor:', error);
        throw error;
    }
};

/**
 * Updates a user's information (admin only).
 * Requires a valid JWT token and admin role.
 * @param {string} userId - The ID of the user to update.
 * @param {object} updateData - Object containing updated user details.
 * @returns {Promise<object>} A promise that resolves with the updated user data.
 * @throws {Error} Throws an error if update fails.
 */
export const updateUser = async (userId, updateData) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.put(`${API_BASE_URL}/api/admin/users/${userId}`, updateData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error updating user ${userId}:`, error);
        throw error;
    }
};

/**
 * Deletes a user (admin only).
 * Requires a valid JWT token and admin role.
 * @param {string} userId - The ID of the user to delete.
 * @returns {Promise<object>} A promise that resolves with a success message.
 * @throws {Error} Throws an error if deletion fails.
 */
export const deleteUser = async (userId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.delete(`${API_BASE_URL}/api/admin/users/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error deleting user ${userId}:`, error);
        throw error;
    }
};

/**
 * Deletes a course (admin only).
 * Requires a valid JWT token and admin role.
 * @param {string} courseId - The ID of the course to delete.
 * @returns {Promise<object>} A promise that resolves with a success message.
 * @throws {Error} Throws an error if deletion fails.
 */
export const deleteCourse = async (courseId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.delete(`${API_BASE_URL}/api/admin/courses/${courseId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error deleting course ${courseId}:`, error);
        throw error;
    }
};

/**
 * Creates a new category (admin only).
 * Requires a valid JWT token and admin role.
 * @param {object} categoryData - Object containing category details (name, description, etc.).
 * @returns {Promise<object>} A promise that resolves with the created category data.
 * @throws {Error} Throws an error if creation fails.
 */
export const createCategory = async (categoryData) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.post(`${API_BASE_URL}/api/admin/categories`, categoryData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error creating category:', error);
        throw error;
    }
};

/**
 * Updates a category (admin only).
 * Requires a valid JWT token and admin role.
 * @param {string} categoryId - The ID of the category to update.
 * @param {object} updateData - Object containing updated category details.
 * @returns {Promise<object>} A promise that resolves with the updated category data.
 * @throws {Error} Throws an error if update fails.
 */
export const updateCategory = async (categoryId, updateData) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.put(`${API_BASE_URL}/api/admin/categories/${categoryId}`, updateData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error updating category ${categoryId}:`, error);
        throw error;
    }
};

/**
 * Deletes a category (admin only).
 * Requires a valid JWT token and admin role.
 * @param {string} categoryId - The ID of the category to delete.
 * @returns {Promise<object>} A promise that resolves with a success message.
 * @throws {Error} Throws an error if deletion fails.
 */
export const deleteCategory = async (categoryId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.delete(`${API_BASE_URL}/api/admin/categories/${categoryId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error deleting category ${categoryId}:`, error);
        throw error;
    }
};

// ADD these additional functions to the end of your existing api.js file

/**
 * Updates course status (admin only).
 * Requires a valid JWT token and admin role.
 * @param {string} courseId - The ID of the course to update.
 * @param {string} status - The new status ('draft', 'published', 'archived').
 * @returns {Promise<object>} A promise that resolves with a success message.
 * @throws {Error} Throws an error if update fails.
 */
export const updateCourseStatus = async (courseId, status) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.put(`${API_BASE_URL}/api/admin/courses/${courseId}/status`, 
            { status }, 
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error(`Error updating course status for ${courseId}:`, error);
        throw error;
    }
};

/**
 * Resets a user's password (admin only).
 * Requires a valid JWT token and admin role.
 * @param {string} userId - The ID of the user whose password to reset.
 * @returns {Promise<object>} A promise that resolves with the temporary password.
 * @throws {Error} Throws an error if reset fails.
 */
export const resetUserPassword = async (userId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.post(`${API_BASE_URL}/api/admin/users/${userId}/reset-password`, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error resetting password for user ${userId}:`, error);
        throw error;
    }
};

/**
 * Fetches system statistics (admin only).
 * Requires a valid JWT token and admin role.
 * @returns {Promise<object>} A promise that resolves with system statistics.
 * @throws {Error} Throws an error if fetching statistics fails.
 */
export const fetchSystemStatistics = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.get(`${API_BASE_URL}/api/admin/statistics`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching system statistics:', error);
        throw error;
    }
};

/**
 * Admin login function (separate from regular login).
 * @param {string} email - Admin email.
 * @param {string} password - Admin password.
 * @returns {Promise<object>} A promise that resolves with admin token and user data.
 * @throws {Error} Throws an error if admin login fails.
 */
export const adminLogin = async (email, password) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/admin-login`, {
            email,
            password
        });
        
        // Store token and user data if login successful
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            setAuthToken(response.data.token);
        }
        
        return response.data;
    } catch (error) {
        console.error('Admin login error:', error);
        throw error;
    }
};

// Utility Functions for the admin dashboard

/**
 * Format currency for display.
 * @param {number} amount - The amount to format.
 * @param {string} currency - The currency code (default: 'USD').
 * @returns {string} Formatted currency string.
 */
export const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
};

/**
 * Format date for display.
 * @param {string|Date} date - The date to format.
 * @param {object} options - Intl.DateTimeFormat options.
 * @returns {string} Formatted date string.
 */
export const formatDate = (date, options = {}) => {
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

/**
 * Check if current user is admin.
 * @returns {boolean} True if user is admin, false otherwise.
 */
export const isUserAdmin = () => {
    try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return false;
        const user = JSON.parse(userStr);
        return user.role === 'admin';
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
};

/**
 * Get current user data from localStorage.
 * @returns {object|null} User object or null if not found.
 */
export const getCurrentUser = () => {
    try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        return JSON.parse(userStr);
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
};

/**
 * Clear all authentication data.
 */
export const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
};

/**
 * Debounce function for search inputs.
 * @param {Function} func - Function to debounce.
 * @param {number} wait - Wait time in milliseconds.
 * @returns {Function} Debounced function.
 */
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};




// Updated api.js - Add these new functions at the end of the file

/**
 * Fetches video progress for a specific course.
 * @param {string} courseId - The ID of the course to fetch progress for.
 * @returns {Promise<Array>} A promise that resolves with an array of progress objects.
 * @throws {Error} Throws an error if fetching progress fails.
 */
export const fetchVideoProgress = async (courseId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.get(`${API_BASE_URL}/api/courses/${courseId}/progress`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data.progress;
    } catch (error) {
        console.error(`Error fetching video progress for course ${courseId}:`, error);
        throw error;
    }
};

/**
 * Updates video progress for a specific material.
 * @param {string} materialId - The ID of the video material.
 * @param {number} watched_duration_seconds - The watched duration in seconds.
 * @returns {Promise<object>} A promise that resolves with updated progress data.
 * @throws {Error} Throws an error if update fails.
 */
export const updateVideoProgress = async (materialId, watched_duration_seconds) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.post(`${API_BASE_URL}/api/materials/${materialId}/progress`, 
            { watched_duration_seconds }, 
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error(`Error updating video progress for material ${materialId}:`, error);
        throw error;
    }
};

// ==================== QUIZ API FUNCTIONS ====================
// Replace the existing quiz functions in your api.js with these corrected versions

/**
 * Fetches all quizzes for a specific course.
 * @param {string} courseId - The ID of the course to fetch quizzes for.
 * @returns {Promise<Array>} A promise that resolves with an array of quiz objects.
 * @throws {Error} Throws an error if fetching quizzes fails.
 */
export const fetchCourseQuizzes = async (courseId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.get(`${API_BASE_URL}/api/courses/${courseId}/quizzes`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching quizzes for course ${courseId}:`, error);
        throw error;
    }
};

/**
 * Creates a new quiz for a course.
 * @param {string} courseId - The ID of the course to create quiz for.
 * @param {object} quizData - Object containing quiz details.
 * @returns {Promise<object>} A promise that resolves with the created quiz data.
 * @throws {Error} Throws an error if creation fails.
 */
export const createQuiz = async (courseId, quizData) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.post(`${API_BASE_URL}/api/courses/${courseId}/quizzes`, quizData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error creating quiz for course ${courseId}:`, error);
        throw error;
    }
};

/**
 * Updates an existing quiz.
 * @param {string} courseId - The ID of the course the quiz belongs to.
 * @param {string} quizId - The ID of the quiz to update.
 * @param {object} quizData - Object containing updated quiz details.
 * @returns {Promise<object>} A promise that resolves with the updated quiz data.
 * @throws {Error} Throws an error if update fails.
 */
export const updateQuiz = async (courseId, quizId, quizData) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.put(`${API_BASE_URL}/api/courses/${courseId}/quizzes/${quizId}`, quizData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error updating quiz ${quizId}:`, error);
        throw error;
    }
};

/**
 * Deletes a quiz.
 * @param {string} courseId - The ID of the course the quiz belongs to.
 * @param {string} quizId - The ID of the quiz to delete.
 * @returns {Promise<object>} A promise that resolves with a success message.
 * @throws {Error} Throws an error if deletion fails.
 */
export const deleteQuiz = async (courseId, quizId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.delete(`${API_BASE_URL}/api/courses/${courseId}/quizzes/${quizId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error deleting quiz ${quizId}:`, error);
        throw error;
    }
};

/**
 * Fetches all questions for a specific quiz.
 * @param {string} quizId - The ID of the quiz to fetch questions for.
 * @returns {Promise<Array>} A promise that resolves with an array of question objects.
 * @throws {Error} Throws an error if fetching questions fails.
 */
export const fetchQuizQuestions = async (quizId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.get(`${API_BASE_URL}/api/quizzes/${quizId}/questions`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching questions for quiz ${quizId}:`, error);
        throw error;
    }
};

/**
 * Creates a new question for a quiz.
 * @param {string} quizId - The ID of the quiz to create question for.
 * @param {object} questionData - Object containing question details and options.
 * @returns {Promise<object>} A promise that resolves with the created question data.
 * @throws {Error} Throws an error if creation fails.
 */
export const createQuizQuestion = async (quizId, questionData) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.post(`${API_BASE_URL}/api/quizzes/${quizId}/questions`, questionData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error creating question for quiz ${quizId}:`, error);
        throw error;
    }
};

/**
 * Updates an existing quiz question.
 * @param {string} quizId - The ID of the quiz the question belongs to.
 * @param {string} questionId - The ID of the question to update.
 * @param {object} questionData - Object containing updated question details.
 * @returns {Promise<object>} A promise that resolves with the updated question data.
 * @throws {Error} Throws an error if update fails.
 */
export const updateQuizQuestion = async (quizId, questionId, questionData) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.put(`${API_BASE_URL}/api/quizzes/${quizId}/questions/${questionId}`, questionData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error updating question ${questionId}:`, error);
        throw error;
    }
};

/**
 * Deletes a quiz question.
 * @param {string} quizId - The ID of the quiz the question belongs to.
 * @param {string} questionId - The ID of the question to delete.
 * @returns {Promise<object>} A promise that resolves with a success message.
 * @throws {Error} Throws an error if deletion fails.
 */
export const deleteQuizQuestion = async (quizId, questionId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.delete(`${API_BASE_URL}/api/quizzes/${quizId}/questions/${questionId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error deleting question ${questionId}:`, error);
        throw error;
    }
};

/**
 * Submits a quiz attempt with user answers.
 * @param {string} quizId - The ID of the quiz being submitted.
 * @param {object} answers - Object containing question IDs as keys and user answers as values.
 * @param {string} startedAt - ISO string of when the quiz was started.
 * @returns {Promise<object>} A promise that resolves with the attempt results.
 * @throws {Error} Throws an error if submission fails.
 */
export const submitQuizAttempt = async (quizId, answers, startedAt) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.post(`${API_BASE_URL}/api/quizzes/${quizId}/submit`, {
            answers,
            started_at: startedAt
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error submitting quiz ${quizId}:`, error);
        throw error;
    }
};

/**
 * Fetches quiz attempts for a user in a specific course.
 * @param {string} courseId - The ID of the course to fetch attempts for.
 * @returns {Promise<Array>} A promise that resolves with an array of attempt objects.
 * @throws {Error} Throws an error if fetching attempts fails.
 */
export const fetchUserQuizAttempts = async (courseId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.get(`${API_BASE_URL}/api/courses/${courseId}/quiz-attempts`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching quiz attempts for course ${courseId}:`, error);
        throw error;
    }
};

/**
 * Generates a certificate for a user who has completed all quizzes in a course.
 * @param {string} courseId - The ID of the course to generate certificate for.
 * @returns {Promise<object>} A promise that resolves with certificate data.
 * @throws {Error} Throws an error if generation fails.
 */
export const generateCertificate = async (courseId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.post(`${API_BASE_URL}/api/courses/${courseId}/certificate`, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error generating certificate for course ${courseId}:`, error);
        throw error;
    }
};

/**
 * Downloads a certificate for a user.
 * @param {string} courseId - The ID of the course.
 * @param {string} userId - The ID of the user.
 */
export const downloadCertificate = (courseId, userId) => {
    const token = localStorage.getItem('token');
    window.open(`${API_BASE_URL}/api/courses/${courseId}/certificate/${userId}/download?token=${token}`, '_blank');
};

/**
 * Fetches all certificates for a user.
 * @param {string} userId - The ID of the user to fetch certificates for.
 * @returns {Promise<Array>} A promise that resolves with an array of certificate objects.
 * @throws {Error} Throws an error if fetching certificates fails.
 */
export const fetchUserCertificates = async (userId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }
        const response = await axios.get(`${API_BASE_URL}/api/users/${userId}/certificates`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching certificates for user ${userId}:`, error);
        throw error;
    }
};

