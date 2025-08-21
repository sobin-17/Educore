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