import axios from 'axios';

// IMPORTANT: This URL MUST match the port your Express backend is running on.
// If your backend console says "Server running on http://localhost:5000", then this is correct.
// If it says a different port (e.g., 5001), you must change this value.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

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
    (error) => Promise.reject(error)
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
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            setAuthToken(response.data.token);
        }
        return response.data;
    } catch (error) {
        console.error('Login error response:', error.response?.data);
        throw new Error(
            error.response?.data?.message ||
            error.request ? 'No response from server. Please check your network connection or server status.' :
            'An unexpected error occurred during login.'
        );
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
        const response = await axios.post(`${API_BASE_URL}/api/auth/admin-login`, { email, password });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            setAuthToken(response.data.token);
        }
        return response.data;
    } catch (error) {
        console.error('Admin login error:', error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to log in as admin');
    }
};

/**
 * Logs out the current user by clearing authentication data.
 * @returns {void}
 */
export const logoutUser = async () => {
    try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthToken(null);
    } catch (error) {
        console.error('Error during logout:', error);
        throw new Error('Failed to log out');
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
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    } catch (error) {
        console.error('Registration error response:', error.response?.data);
        throw new Error(
            error.response?.data?.message ||
            error.request ? 'No response from server. Please check your network connection or server status.' :
            'An unexpected error occurred during registration.'
        );
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
        console.error('Error fetching user profile:', error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to fetch user profile');
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
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.put(`${API_BASE_URL}/auth/profile`, updateData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.user;
    } catch (error) {
        console.error('Error updating profile:', error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to update profile');
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
        console.error('Error fetching categories:', error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to fetch categories');
    }
};

/**
 * Creates a new category (admin only).
 * @param {object} categoryData - Object containing category details (name, description, etc.).
 * @returns {Promise<object>} A promise that resolves with the created category data.
 * @throws {Error} Throws an error if creation fails.
 */
export const createCategory = async (categoryData) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.post(`${API_BASE_URL}/api/admin/categories`, categoryData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error creating category:', error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to create category');
    }
};

/**
 * Updates a category (admin only).
 * @param {string} categoryId - The ID of the category to update.
 * @param {object} updateData - Object containing updated category details.
 * @returns {Promise<object>} A promise that resolves with the updated category data.
 * @throws {Error} Throws an error if update fails.
 */
export const updateCategory = async (categoryId, updateData) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.put(`${API_BASE_URL}/api/admin/categories/${categoryId}`, updateData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error updating category ${categoryId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to update category');
    }
};

/**
 * Deletes a category (admin only).
 * @param {string} categoryId - The ID of the category to delete.
 * @returns {Promise<object>} A promise that resolves with a success message.
 * @throws {Error} Throws an error if deletion fails.
 */
export const deleteCategory = async (categoryId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.delete(`${API_BASE_URL}/api/admin/categories/${categoryId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error(`Error deleting category ${categoryId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to delete category');
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
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.get(`${API_BASE_URL}/api/instructor/courses`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.courses;
    } catch (error) {
        console.error('Error fetching instructor courses:', error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to fetch instructor courses');
    }
};

/**
 * Creates a new course.
 * @param {FormData} courseData - FormData object containing course details (including thumbnail file).
 * @returns {Promise<object>} A promise that resolves with the created course data.
 * @throws {Error} Throws an error if creation fails.
 */
export const createCourse = async (courseData) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.post(`${API_BASE_URL}/api/instructor/courses`, courseData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error creating course:', error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to create course');
    }
};

/**
 * Updates an existing course.
 * @param {string} courseId - The ID of the course to update.
 * @param {FormData} updateData - FormData object containing updated course details and optionally a new thumbnail.
 * @returns {Promise<object>} A promise that resolves with the updated course data.
 * @throws {Error} Throws an error if course update fails.
 */
export const updateCourse = async (courseId, updateData) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.put(`${API_BASE_URL}/api/instructor/courses/${courseId}`, updateData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error updating course ${courseId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to update course');
    }
};

/**
 * Deletes a course (admin only).
 * @param {string} courseId - The ID of the course to delete.
 * @returns {Promise<object>} A promise that resolves with a success message.
 * @throws {Error} Throws an error if deletion fails.
 */
export const deleteCourse = async (courseId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.delete(`${API_BASE_URL}/api/admin/courses/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error(`Error deleting course ${courseId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to delete course');
    }
};

/**
 * Updates course status (admin only).
 * @param {string} courseId - The ID of the course to update.
 * @param {string} status - The new status ('draft', 'published', 'archived').
 * @returns {Promise<object>} A promise that resolves with the updated course data.
 * @throws {Error} Throws an error if update fails.
 */
export const updateCourseStatus = async (courseId, status) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.put(
            `${API_BASE_URL}/api/admin/courses/${courseId}/status`,
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
        console.error(`Error updating course status for ${courseId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to update course status');
    }
};

/**
 * Adds a new material (video or document) to a course.
 * @param {string} courseId - The ID of the course to add material to.
 * @param {FormData} materialData - FormData object containing material details and the file.
 * @returns {Promise<object>} A promise that resolves with the new material's data.
 * @throws {Error} Throws an error if adding material fails.
 */
export const addCourseMaterial = async (courseId, materialData) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.post(`${API_BASE_URL}/api/instructor/courses/${courseId}/materials`, materialData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error adding material to course ${courseId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to add course material');
    }
};

/**
 * Updates an existing course material.
 * @param {string} courseId - The ID of the course the material belongs to.
 * @param {string} materialId - The ID of the material to update.
 * @param {FormData} updateData - FormData object containing updated material details and optionally a new file.
 * @returns {Promise<object>} A promise that resolves with the updated material data.
 * @throws {Error} Throws an error if material update fails.
 */
export const updateCourseMaterial = async (courseId, materialId, updateData) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.put(`${API_BASE_URL}/api/instructor/courses/${courseId}/materials/${materialId}`, updateData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error updating material ${materialId} for course ${courseId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to update course material');
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
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.delete(`${API_BASE_URL}/api/instructor/courses/${courseId}/materials/${materialId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error(`Error deleting material ${materialId} for course ${courseId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to delete course material');
    }
};

/**
 * Fetches all materials for a specific course.
 * @param {string} courseId - The ID of the course to fetch materials for.
 * @returns {Promise<Array>} A promise that resolves with an array of material objects.
 * @throws {Error} Throws an error if fetching materials fails.
 */
export const fetchCourseMaterials = async (courseId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.get(`${API_BASE_URL}/api/courses/${courseId}/materials`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.materials;
    } catch (error) {
        console.error(`Error fetching materials for course ${courseId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to fetch course materials');
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
        console.error('Error fetching courses:', error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to fetch courses');
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
        const response = await axios.get(`${API_BASE_URL}/api/courses/${slug}`);
        return response.data.course;
    } catch (error) {
        console.error(`Error fetching course details for slug ${slug}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to fetch course details');
    }
};

/**
 * Enrolls the logged-in student into a specific course.
 * @param {string} courseId - The ID of the course to enroll in.
 * @returns {Promise<object>} A promise that resolves with a success message.
 * @throws {Error} Throws an error if enrollment fails.
 */
export const enrollCourse = async (courseId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.post(`${API_BASE_URL}/api/student/enroll/${courseId}`, {}, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error(`Error enrolling in course ${courseId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to enroll in course');
    }
};

/**
 * Fetches courses the logged-in student is enrolled in.
 * @returns {Promise<Array>} A promise that resolves with an array of enrolled course objects.
 * @throws {Error} Throws an error if fetching enrolled courses fails.
 */
export const fetchEnrolledCourses = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.get(`${API_BASE_URL}/api/student/courses`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.enrolledCourses;
    } catch (error) {
        console.error('Error fetching enrolled courses:', error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to fetch enrolled courses');
    }
};

/**
 * Fetches chat messages for a specific course.
 * @param {string} courseId - The ID of the course to fetch messages for.
 * @returns {Promise<Array>} A promise that resolves with an array of message objects.
 * @throws {Error} Throws an error if fetching messages fails.
 */
export const fetchCourseChatMessages = async (courseId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.get(`${API_BASE_URL}/api/courses/${courseId}/chat/messages`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.messages;
    } catch (error) {
        console.error(`Error fetching chat messages for course ${courseId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to fetch chat messages');
    }
};

/**
 * Sends a chat message to a specific course.
 * @param {string} courseId - The ID of the course to send the message to.
 * @param {string} messageContent - The content of the message.
 * @returns {Promise<object>} A promise that resolves with a success message.
 * @throws {Error} Throws an error if sending message fails.
 */
export const sendCourseChatMessage = async (courseId, messageContent) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.post(
            `${API_BASE_URL}/api/courses/${courseId}/chat/messages`,
            { message_content: messageContent },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        console.error(`Error sending chat message to course ${courseId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to send chat message');
    }
};

/**
 * Fetches a list of enrolled students for a specific course.
 * @param {string} courseId - The ID of the course to fetch enrolled students for.
 * @returns {Promise<Array>} A promise that resolves with an array of student objects.
 * @throws {Error} Throws an error if fetching fails.
 */
export const fetchEnrolledStudents = async (courseId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.get(`${API_BASE_URL}/api/instructor/courses/${courseId}/enrolled-students`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.students;
    } catch (error) {
        console.error(`Error fetching enrolled students for course ${courseId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to fetch enrolled students');
    }
};

/**
 * Fetches all online classes for a specific course.
 * @param {string} courseId - The ID of the course to fetch classes for.
 * @returns {Promise<Array>} A promise that resolves with an array of class objects.
 * @throws {Error} Throws an error if fetching classes fails.
 */
export const fetchCourseClasses = async (courseId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.get(`${API_BASE_URL}/api/courses/${courseId}/classes`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.classes;
    } catch (error) {
        console.error(`Error fetching classes for course ${courseId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to fetch course classes');
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
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.post(`${API_BASE_URL}/api/courses/${courseId}/classes/${classId}/join`, {}, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error(`Error joining class ${classId} for course ${courseId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to join online class');
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
        if (!token) throw new Error('Authentication token not found. Please log in.');
        let url = `${API_BASE_URL}/api/student/online-classes`;
        if (status) url += `?status=${status}`;
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.classes;
    } catch (error) {
        console.error('Error fetching student online classes:', error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to fetch student online classes');
    }
};

/**
 * Schedules a new online class.
 * @param {object} classData - Object containing class details.
 * @returns {Promise<object>} A promise that resolves with the created class data.
 * @throws {Error} Throws an error if creation fails.
 */
export const scheduleOnlineClass = async (classData) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.post(`${API_BASE_URL}/api/online-classes`, classData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error scheduling online class:', error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to schedule online class');
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
        if (!token) throw new Error('Authentication token not found. Please log in.');
        let url = `${API_BASE_URL}/api/online-classes`;
        if (status) url += `?status=${status}`;
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.data;
    } catch (error) {
        console.error('Error fetching instructor online classes:', error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to fetch instructor online classes');
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
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.put(
            `${API_BASE_URL}/api/online-classes/${classId}/status`,
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
        console.error(`Error updating class ${classId} status:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to update class status');
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
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.get(`${API_BASE_URL}/api/instructor/courses-for-classes`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.data;
    } catch (error) {
        console.error('Error fetching instructor courses for classes:', error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to fetch instructor courses for classes');
    }
};

/**
 * Fetches all users (admin only).
 * @returns {Promise<Array>} A promise that resolves with an array of all user objects.
 * @throws {Error} Throws an error if fetching users fails.
 */
export const fetchAllUsers = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.get(`${API_BASE_URL}/api/admin/users`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.users;
    } catch (error) {
        console.error('Error fetching all users:', error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to fetch all users');
    }
};

/**
 * Fetches recent users for the admin dashboard overview tab (e.g., last 5 users).
 * @returns {Promise<Array>} A promise that resolves with an array of recent user objects.
 * @throws {Error} Throws an error if fetching recent users fails.
 */
export const fetchRecentUsers = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.get(`${API_BASE_URL}/api/admin/users/recent?limit=5`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.users;
    } catch (error) {
        console.error('Error fetching recent users:', error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to fetch recent users');
    }
};

/**
 * Fetches all courses (admin only).
 * @returns {Promise<Array>} A promise that resolves with an array of all course objects.
 * @throws {Error} Throws an error if fetching courses fails.
 */
export const fetchAllCourses = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.get(`${API_BASE_URL}/api/admin/courses`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.courses;
    } catch (error) {
        console.error('Error fetching all courses:', error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to fetch all courses');
    }
};

/**
 * Fetches recent courses for the admin dashboard overview tab (e.g., last 5 courses).
 * @returns {Promise<Array>} A promise that resolves with an array of recent course objects.
 * @throws {Error} Throws an error if fetching recent courses fails.
 */
export const fetchRecentCourses = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.get(`${API_BASE_URL}/api/admin/courses/recent?limit=5`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.courses;
    } catch (error) {
        console.error('Error fetching recent courses:', error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to fetch recent courses');
    }
};

/**
 * Creates a new instructor account (admin only).
 * @param {object} instructorData - Object containing instructor details (name, email, password, etc.).
 * @returns {Promise<object>} A promise that resolves with the created instructor data.
 * @throws {Error} Throws an error if creation fails.
 */
// ✅ 1. FIXED createInstructor
export const createInstructor = async (formData) => {
    const token = localStorage.getItem('token');
    console.log('🚀 Creating instructor → http://localhost:5000/api/admin/create-instructor');
    
    // 🔥 DEBUG: Show FormData contents
    console.log('📦 FormData contents:');
    for (let [key, value] of formData.entries()) {
        console.log(`   ${key}: ${value}`);
    }
    
    const response = await fetch('http://localhost:5000/api/admin/create-instructor', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData
    });
    
    console.log('📡 Status:', response.status);
    console.log('📡 URL:', response.url);
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ FULL ERROR:', errorData);
        
        // 🔥 BETTER ERROR MESSAGES
        if (errorData.message === 'Validation error') {
            const validationErrors = errorData.errors.map(err => `${err.path}: ${err.msg}`).join(', ');
            throw new Error(`Validation failed: ${validationErrors}`);
        }
        if (errorData.message === 'Email already exists') {
            throw new Error('Email already exists');
        }
        throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ SUCCESS:', data);
    return data;
};


/**
 * Updates a user's information (admin only).
 * @param {string} userId - The ID of the user to update.
 * @param {object} updateData - Object containing updated user details.
 * @returns {Promise<object>} A promise that resolves with the updated user data.
 * @throws {Error} Throws an error if update fails.
 */
export const updateUser = async (userId, updateData) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.put(`${API_BASE_URL}/api/admin/users/${userId}`, updateData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error updating user ${userId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to update user');
    }
};

/**
 * Deletes a user (admin only).
 * @param {string} userId - The ID of the user to delete.
 * @returns {Promise<object>} A promise that resolves with a success message.
 * @throws {Error} Throws an error if deletion fails.
 */
export const deleteUser = async (userId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.delete(`${API_BASE_URL}/api/admin/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error(`Error deleting user ${userId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
};

/**
 * Resets a user's password (admin only).
 * @param {string} userId - The ID of the user whose password to reset.
 * @returns {Promise<object>} A promise that resolves with the temporary password.
 * @throws {Error} Throws an error if reset fails.
 */
export const resetUserPassword = async (userId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.post(`${API_BASE_URL}/api/admin/users/${userId}/reset-password`, {}, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error(`Error resetting password for user ${userId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to reset user password');
    }
};

/**
 * Fetches system statistics (admin only).
 * @returns {Promise<object>} A promise that resolves with system statistics.
 * @throws {Error} Throws an error if fetching statistics fails.
 */
export const fetchSystemStatistics = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.get(`${API_BASE_URL}/api/admin/statistics`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching system statistics:', error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to fetch system statistics');
    }
};

/**
 * Fetches video progress for a specific course.
 * @param {string} courseId - The ID of the course to fetch progress for.
 * @returns {Promise<Array>} A promise that resolves with an array of progress objects.
 * @throws {Error} Throws an error if fetching progress fails.
 */
export const fetchVideoProgress = async (courseId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.get(`${API_BASE_URL}/api/courses/${courseId}/progress`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.progress;
    } catch (error) {
        console.error(`Error fetching video progress for course ${courseId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to fetch video progress');
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
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.post(
            `${API_BASE_URL}/api/materials/${materialId}/progress`,
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
        console.error(`Error updating video progress for material ${materialId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to update video progress');
    }
};

/**
 * Fetches all quizzes for a specific course.
 * @param {string} courseId - The ID of the course to fetch quizzes for.
 * @returns {Promise<Array>} A promise that resolves with an array of quiz objects.
 * @throws {Error} Throws an error if fetching quizzes fails.
 */
export const fetchCourseQuizzes = async (courseId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.get(`${API_BASE_URL}/api/courses/${courseId}/quizzes`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching quizzes for course ${courseId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to fetch course quizzes');
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
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.post(`${API_BASE_URL}/api/courses/${courseId}/quizzes`, quizData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error creating quiz for course ${courseId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to create quiz');
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
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.put(`${API_BASE_URL}/api/courses/${courseId}/quizzes/${quizId}`, quizData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error updating quiz ${quizId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to update quiz');
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
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.delete(`${API_BASE_URL}/api/courses/${courseId}/quizzes/${quizId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error(`Error deleting quiz ${quizId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to delete quiz');
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
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.get(`${API_BASE_URL}/api/quizzes/${quizId}/questions`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching questions for quiz ${quizId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to fetch quiz questions');
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
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.post(`${API_BASE_URL}/api/quizzes/${quizId}/questions`, questionData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error creating question for quiz ${quizId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to create quiz question');
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
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.put(`${API_BASE_URL}/api/quizzes/${quizId}/questions/${questionId}`, questionData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error updating question ${questionId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to update quiz question');
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
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.delete(`${API_BASE_URL}/api/quizzes/${quizId}/questions/${questionId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error(`Error deleting question ${questionId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to delete quiz question');
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
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.post(
            `${API_BASE_URL}/api/quizzes/${quizId}/submit`,
            { answers, started_at: startedAt },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error(`Error submitting quiz ${quizId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to submit quiz attempt');
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
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.get(`${API_BASE_URL}/api/courses/${courseId}/quiz-attempts`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching quiz attempts for course ${courseId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to fetch quiz attempts');
    }
};

/**
 * Checks if a user has completed all quizzes for a course with passing scores.
 * @param {string} courseId - The ID of the course to check quiz completion for.
 * @param {string} [userId] - The ID of the user (optional, defaults to current user).
 * @returns {Promise<boolean>} A promise that resolves to true if all quizzes are completed with passing scores, false otherwise.
 * @throws {Error} Throws an error if checking quiz completion fails (except 404, which returns false).
 */
export const checkQuizCompletion = async (courseId, userId = getCurrentUser()?.id) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        if (!userId) throw new Error('User ID not found. Please ensure you are logged in or provide a valid userId.');
        if (!courseId) throw new Error('Course ID is required.');
        
        const response = await axios.get(`${API_BASE_URL}/api/courses/${courseId}/quiz-attempts`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { user_id: userId },
        });
        
        const attempts = response.data || [];
        
        // If no attempts, quizzes are not completed
        if (attempts.length === 0) {
            return false;
        }
        
        // Check if all attempts have passing scores
        // The backend returns score and passing_score for each attempt
        const allPassed = attempts.every(attempt => {
            const score = parseFloat(attempt.score) || 0;
            const passingScore = parseFloat(attempt.passing_score) || 0;
            return score >= passingScore;
        });
        
        return allPassed;
        
    } catch (error) {
        console.error(`Error checking quiz completion for course ${courseId}, user ${userId}:`, error.response?.data);
        
        // If it's a 404 or 400, return false (no attempts found)
        if (error.response?.status === 404 || error.response?.status === 400) {
            return false;
        }
        
        throw new Error(error.response?.data?.message || 'Failed to check quiz completion');
    }
};

export const checkCertificateStatus = async (courseId, userId = getCurrentUser()?.id) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        if (!userId) throw new Error('User ID not found.');
        if (!courseId) throw new Error('Course ID is required.');
        
        const response = await axios.get(
            `${API_BASE_URL}/api/courses/${courseId}/certificate/status`, 
            {
                headers: { Authorization: `Bearer ${token}` },
                params: { user_id: userId }
            }
        );
        
        return response.data;
    } catch (error) {
        console.error(`Error checking certificate status:`, error);
        if (error.response?.status === 404) {
            return { exists: false, certificate: null };
        }
        throw new Error(error.response?.data?.message || 'Failed to check certificate status');
    }
};

export const checkCertificateEligibility = async (courseId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        
        const response = await axios.get(
            `${API_BASE_URL}/api/courses/${courseId}/certificate/eligibility`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        return response.data;
    } catch (error) {
        console.error('Error checking eligibility:', error);
        throw new Error(error.response?.data?.message || 'Failed to check eligibility');
    }
};

export const generateCertificate = async (courseId, userId = getCurrentUser()?.id) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        if (!userId) throw new Error('User ID not found.');
        if (!courseId) throw new Error('Course ID is required.');
        
        console.log('📜 Generating certificate for:', { courseId, userId });
        
        // Check if certificate already exists
        const status = await checkCertificateStatus(courseId, userId);
        if (status.exists) {
            console.log('✅ Certificate already exists');
            return status.certificate;
        }
        
        // Generate new certificate
        const response = await axios.post(
            `${API_BASE_URL}/api/courses/${courseId}/certificate`,
            { user_id: userId },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            }
        );
        
        console.log('✅ Certificate generated:', response.data);
        return response.data.certificate;
        
    } catch (error) {
        console.error('❌ Error generating certificate:', error);
        
        let errorMessage = 'Certificate generation failed';
        
        if (error.response) {
            const status = error.response.status;
            if (status === 400) {
                errorMessage = error.response.data?.message || 'Invalid request. Check if course is completed.';
            } else if (status === 403) {
                errorMessage = 'Access denied. You may not be enrolled in this course.';
            } else if (status === 500) {
                errorMessage = 'Server error. Please try again later.';
            } else {
                errorMessage = error.response.data?.message || errorMessage;
            }
        }
        
        throw new Error(errorMessage);
    }
};

export const downloadCertificate = async (courseId, userId = getCurrentUser()?.id) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        if (!userId) throw new Error('User ID not found.');
        if (!courseId) throw new Error('Course ID is required.');
        
        console.log(`📥 Starting certificate download for course ${courseId}, user ${userId}`);
        
        // Step 1: Check if certificate exists
        const status = await checkCertificateStatus(courseId, userId);
        
        if (!status.exists) {
            console.log('📜 Certificate does not exist, generating...');
            
            // Try to generate certificate
            try {
                await generateCertificate(courseId, userId);
                console.log('✅ Certificate generated successfully');
            } catch (genError) {
                console.error('❌ Failed to generate certificate:', genError);
                throw new Error('Failed to generate certificate: ' + genError.message);
            }
        } else {
            console.log('✅ Certificate already exists');
        }
        
        // Step 2: Download the certificate
        console.log('⬇️ Downloading certificate...');
        
        const response = await axios.get(
            `${API_BASE_URL}/api/courses/${courseId}/certificate/${userId}/download`, 
            {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            }
        );
        
        console.log('✅ Certificate download response received');
        
        // Create blob and trigger download
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `certificate-course-${courseId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Certificate download triggered successfully');
        
    } catch (error) {
        console.error(`❌ Error downloading certificate:`, error);
        
        let errorMessage = 'Certificate download failed';
        
        if (error.response) {
            const status = error.response.status;
            
            // Handle blob error responses
            if (error.response.data instanceof Blob) {
                try {
                    const text = await error.response.data.text();
                    const jsonError = JSON.parse(text);
                    errorMessage = jsonError.message || errorMessage;
                } catch (parseError) {
                    // Use status-based messages if parsing fails
                    if (status === 401) errorMessage = 'Unauthorized. Please log in again.';
                    else if (status === 403) errorMessage = 'Access denied.';
                    else if (status === 404) errorMessage = 'Certificate not found. Please complete the course first.';
                    else if (status === 500) errorMessage = 'Server error. Please try again later.';
                }
            } else {
                errorMessage = error.response.data?.message || errorMessage;
            }
        } else if (error.request) {
            errorMessage = 'No response from server. Check your connection.';
        } else {
            errorMessage = error.message;
        }
        
        throw new Error(errorMessage);
    }
};

export const fetchUserCertificates = async (userId = getCurrentUser()?.id) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        
        const response = await axios.get(`${API_BASE_URL}/api/certificates`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        
        return response.data.certificates || [];
    } catch (error) {
        console.error('Error fetching certificates:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch certificates');
    }
};

export const verifyCertificate = async ({ certificateNumber, certificateHash }) => {
    try {
        if (!certificateNumber && !certificateHash) {
            throw new Error('Certificate number or hash is required for verification.');
        }
        
        const response = await axios.get(`${API_BASE_URL}/api/certificates/verify`, {
            params: { 
                certificate_number: certificateNumber, 
                certificate_hash: certificateHash 
            },
        });
        
        return response.data;
    } catch (error) {
        console.error('Error verifying certificate:', error);
        throw new Error(error.response?.data?.message || 'Certificate verification failed');
    }
};

// Force generate certificate (bypasses progress check)
await fetch('http://localhost:5000/api/debug/generate-certificate/3/3', {
    method: 'POST',
    headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
    }
})
.then(r => r.json())
.then(data => {
    console.log('Certificate generated:', data);
    if (data.certificate?.download_url) {
        window.location.href = data.certificate.download_url;
    }
});

/**
 * Fetches analytics for a specific course (admin or instructor only).
 * @param {string} courseId - The ID of the course to fetch analytics for.
 * @returns {Promise<object>} A promise that resolves with course analytics data (e.g., enrollments, completion rates).
 * @throws {Error} Throws an error if fetching analytics fails.
 */
export const fetchCourseAnalytics = async (courseId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');
        const response = await axios.get(`${API_BASE_URL}/api/courses/${courseId}/analytics`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching analytics for course ${courseId}:`, error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to fetch course analytics');
    }
};

/**
 * Format currency for display.
 * @param {number} amount - The amount to format.
 * @param {string} currency - The currency code (default: 'USD').
 * @returns {string} Formatted currency string.
 */
export const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
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
        day: 'numeric',
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
    setAuthToken(null);
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
    if (updateData.status) return await updateClassStatus(classId, updateData.status);
    throw new Error('Only status updates are supported through this function');
};

/**
 * @deprecated Direct class deletion not supported in new system
 */
export const deleteOnlineClass = async (courseId, classId) => {
    console.warn('deleteOnlineClass is deprecated. Use updateClassStatus with "cancelled" status instead.');
    return await updateClassStatus(classId, 'cancelled');
};

// Reviews
export const fetchCourseReviews = async (courseId) => {
    try {
      const response = await api.get(`/courses/${courseId}/reviews`);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  };
  
  export const submitCourseReview = async (courseId, reviewData) => {
    try {
      const response = await api.post(`/courses/${courseId}/reviews`, reviewData);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  };
  
  export const fetchFeaturedReviews = async () => {
    try {
      const response = await api.get('/reviews/featured');
      return response.data;
    } catch (error) {
      handleError(error);
    }
  };
  
  export const replyToCourseReview = async (reviewId, replyText) => {
    try {
      const response = await api.post(`/reviews/${reviewId}/reply`, { reply: replyText });
      return response.data;
    } catch (error) {
      handleError(error);
    }
  };
  