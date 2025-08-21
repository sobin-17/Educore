const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (for profile images, course thumbnails, videos, documents)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directories if they don't exist
const uploadsDir = path.join(__dirname, 'uploads');
const profilesDir = path.join(uploadsDir, 'profiles');
const courseThumbnailsDir = path.join(uploadsDir, 'course_thumbnails');
const courseVideosDir = path.join(uploadsDir, 'course_videos');
const courseDocumentsDir = path.join(uploadsDir, 'course_documents');

[uploadsDir, profilesDir, courseThumbnailsDir, courseVideosDir, courseDocumentsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Multer configuration for profile images
const profileImageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, profilesDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, 'profile-' + uniqueSuffix + fileExtension);
    }
});
const uploadProfileImage = multer({
    storage: profileImageStorage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for profile images'), false);
        }
    },
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// Multer configuration for course thumbnails
const courseThumbnailStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, courseThumbnailsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, 'thumbnail-' + uniqueSuffix + fileExtension);
    }
});
const uploadCourseThumbnail = multer({
    storage: courseThumbnailStorage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for course thumbnails'), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Multer configuration for course materials (videos and documents)
const materialStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'video') {
            cb(null, courseVideosDir);
        } else if (file.fieldname === 'document') {
            cb(null, courseDocumentsDir);
        } else {
            cb(new Error('Invalid fieldname for material upload'), false);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        let prefix = '';
        if (file.fieldname === 'video') prefix = 'video-';
        else if (file.fieldname === 'document') prefix = 'document-';
        cb(null, prefix + uniqueSuffix + fileExtension);
    }
});

const uploadMaterialFiles = multer({
    storage: materialStorage,
    fileFilter: function (req, file, cb) {
        if (file.fieldname === 'video') {
            if (!file.mimetype.startsWith('video/')) {
                return cb(new Error('Only video files are allowed for video materials'), false);
            }
        } else if (file.fieldname === 'document') {
            if (!(file.mimetype === 'application/pdf' || file.mimetype.startsWith('text/'))) {
                return cb(new Error('Only PDF or text files are allowed for document materials'), false);
            }
        }
        cb(null, true);
    },
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB limit for videos, 20MB for documents (handled by client-side validation or separate multer for documents if needed)
    }
});


// Database connection with better error handling
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'elearning',
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

const db = mysql.createConnection(dbConfig);

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1);
    }
    console.log('MySQL connected successfully');

    // Create chat messages table if it doesn't exist
    const createChatTable = `
        CREATE TABLE IF NOT EXISTS course_chat_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            course_id INT NOT NULL,
            user_id INT NOT NULL,
            message_content TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `;
    db.query(createChatTable, (err) => {
        if (err) {
            console.error('Error creating course_chat_messages table:', err);
        } else {
            console.log('course_chat_messages table ensured.');
        }
    });
});

// Handle database disconnection
db.on('error', (err) => {
    console.error('Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Reconnecting to database...');
        db.connect();
    } else {
        throw err;
    }
});

// Root route - API welcome message
app.get('/', function(req, res) {
    res.json({
        message: 'Welcome to E-Learning Platform API',
        version: '1.0.0',
        status: 'active',
        endpoints: {
            health: 'GET /health',
            register: 'POST /auth/register',
            login: 'POST /auth/login',
            profile: 'GET /auth/profile',
            updateProfile: 'PUT /auth/profile',
            verifyEmail: 'GET /auth/verify-email/{token}',
            categories: 'GET /api/categories',
            courses: 'GET /api/courses',
            courseDetail: 'GET /api/courses/:slug',
            instructorCourses: 'GET /api/instructor/courses',
            createCourse: 'POST /api/instructor/courses',
            updateCourse: 'PUT /api/instructor/courses/:id',
            addCourseMaterial: 'POST /api/instructor/courses/:courseId/materials',
            getCourseMaterials: 'GET /api/courses/:courseId/materials',
            enrollCourse: 'POST /api/student/enroll/:courseId',
            enrolledCourses: 'GET /api/student/courses',
            fetchCourseChatMessages: 'GET /api/courses/:courseId/chat/messages',
            sendCourseChatMessage: 'POST /api/courses/:courseId/chat/messages',
            enrolledStudentsList: 'GET /api/instructor/courses/:courseId/enrolled-students'
        }
    });
});

// Health check endpoint
app.get('/health', function(req, res) {
    res.json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()) + ' seconds',
        memory: process.memoryUsage()
    });
});

// Validation middleware
const registerValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('role')
        .isIn(['student', 'instructor', 'parent'])
        .withMessage('Role must be student, instructor, or parent'),
    body('phone')
        .optional()
        .isMobilePhone()
        .withMessage('Please provide a valid phone number'),
    body('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid date of birth'),
    body('gender')
        .optional()
        .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
        .withMessage('Invalid gender selection'),
    body('country')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Country name must be between 2 and 100 characters'),
    body('bio')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Bio must not exceed 500 characters')
];

const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

// JWT verification middleware
const verifyToken = function(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        req.user = decoded; // Contains { id, role }
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// Middleware to check if user is an instructor
const isInstructor = (req, res, next) => {
    if (req.user && req.user.role === 'instructor') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Only instructors can perform this action.' });
    }
};

// Middleware to check if user is a student
const isStudent = (req, res, next) => {
    if (req.user && req.user.role === 'student') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Only students can perform this action.' });
    }
};

// Middleware to check if user is instructor of course OR enrolled student
const isCourseMember = (req, res, next) => {
    const courseId = req.params.courseId;
    const userId = req.user.id;
    const userRole = req.user.role;

    const query = `
        SELECT c.instructor_id, e.user_id AS enrolled_user_id
        FROM courses c
        LEFT JOIN enrollments e ON c.id = e.course_id AND e.user_id = ?
        WHERE c.id = ?;
    `;

    db.query(query, [userId, courseId], (err, results) => {
        if (err) {
            console.error('Database error checking course membership:', err);
            return res.status(500).json({ message: 'Failed to verify course membership.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        const course = results[0];
        const isInstructorOfCourse = (userRole === 'instructor' && course.instructor_id === userId);
        const isEnrolledStudent = (userRole === 'student' && course.enrolled_user_id === userId);

        if (isInstructorOfCourse || isEnrolledStudent) {
            next();
        } else {
            res.status(403).json({ message: 'Access denied. You are not a member of this course.' });
        }
    });
};


// Register endpoint
app.post('/auth/register', uploadProfileImage.single('profileImage'), registerValidation, async function(req, res) {
    try {
        const errors = validationResult(req); // Corrected
        if (!errors.isEmpty()) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
                message: 'Validation error',
                errors: errors.array()
            });
        }

        const {
            name,
            email,
            password,
            role,
            bio = null,
            phone = null,
            dateOfBirth = null,
            gender = null,
            country = null
         } = req.body;

        const hashedPassword = await bcrypt.hash(password, 12);

        let profileImagePath = null;
        if (req.file) {
            profileImagePath = req.file.filename;
        }

        const emailVerificationToken = jwt.sign(
            { email: email },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '1d' }
        );

        const query = `
            INSERT INTO users (
                name, email, password, role, status, profile_image, bio, phone,
                date_of_birth, gender, country, email_verified, email_verification_token,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;

        const values = [
            name,
            email,
            hashedPassword,
            role,
            'active',
            profileImagePath,
            bio,
            phone,
            dateOfBirth,
            gender,
            country,
            0,
            emailVerificationToken
        ];

        db.query(query, values, function(err, result) {
            if (err) {
                console.error('Database error:', err);

                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }

                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ message: 'Email already exists' });
                }
                return res.status(500).json({ message: 'Registration failed' });
            }

            res.status(201).json({
                message: 'User registered successfully',
                userId: result.insertId
            });
        });

    } catch (error) {
        console.error('Registration error:', error);

        if (req.file) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ message: 'Internal server error' });
    }
});

// Login endpoint
app.post('/auth/login', loginValidation, async function(req, res) {
    try {
        const errors = validationResult(req); // Corrected
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation error',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        const query = `
            SELECT id, name, email, password, role, status, profile_image, bio,
            phone, date_of_birth, gender, country, email_verified, last_login
            FROM users
            WHERE email = ? AND status = 'active'
        `;

        db.query(query, [email], async function(err, results) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Login failed' });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: 'User not found or inactive' });
            }

            const user = results[0];

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            db.query(
                'UPDATE users SET last_login = NOW() WHERE id = ?',
                [user.id],
                function(updateErr) {
                    if (updateErr) console.error('Failed to update last login:', updateErr);
                }
            );

            const token = jwt.sign(
                { id: user.id, role: user.role, name: user.name }, // Include user name in token payload
                process.env.JWT_SECRET || 'your_jwt_secret',
                { expiresIn: '7d' }
            );

            const { password: _, ...userResponse } = user;

            if (userResponse.profile_image) {
                userResponse.profile_image_url = `${req.protocol}://${req.get('host')}/uploads/profiles/${userResponse.profile_image}`;
            }

            res.json({
                message: 'Login successful',
                token,
                user: userResponse
            });
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get user profile
app.get('/auth/profile', verifyToken, function(req, res) {
    const query = `
        SELECT id, name, email, role, profile_image, bio, phone,
        date_of_birth, gender, country, email_verified, last_login, created_at
        FROM users
        WHERE id = ? AND status = 'active'
    `;

    db.query(query, [req.user.id], function(err, results) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch profile' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = results[0];

        if (user.profile_image) {
            user.profile_image_url = `${req.protocol}://${req.get('host')}/uploads/profiles/${user.profile_image}`;
        }

        res.json({ user });
    });
});

// Update user profile
app.put('/auth/profile', verifyToken, uploadProfileImage.single('profileImage'), function(req, res) {
    const { name, bio, phone, dateOfBirth, gender, country, clear_profile_image } = req.body;

    let updateQuery = `
        UPDATE users SET
        name = COALESCE(?, name),
        bio = COALESCE(?, bio),
        phone = COALESCE(?, phone),
        date_of_birth = COALESCE(?, date_of_birth),
        gender = COALESCE(?, gender),
        country = COALESCE(?, country),
        updated_at = NOW()
    `;

    let values = [name, bio, phone, dateOfBirth, gender, country];

    // Fetch current user data to handle existing image deletion
    db.query('SELECT profile_image FROM users WHERE id = ?', [req.user.id], (err, userResults) => {
        if (err) {
            console.error('Database error fetching current profile image:', err);
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(500).json({ message: 'Failed to update profile' });
        }

        const currentUserImage = userResults[0]?.profile_image;

        if (req.file) {
            // New image uploaded, delete old one if exists
            if (currentUserImage) {
                const oldImagePath = path.join(profilesDir, currentUserImage);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            updateQuery += ', profile_image = ?';
            values.push(req.file.filename);
        } else if (clear_profile_image === 'true') {
            // Explicitly clear image, delete old one if exists
            if (currentUserImage) {
                const oldImagePath = path.join(profilesDir, currentUserImage);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            updateQuery += ', profile_image = NULL';
        }

        updateQuery += ' WHERE id = ?';
        values.push(req.user.id);

        db.query(updateQuery, values, function(err, result) {
            if (err) {
                console.error('Database error:', err);
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(500).json({ message: 'Failed to update profile' });
            }

            if (result.affectedRows === 0) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(404).json({ message: 'User not found' });
            }

            res.json({ message: 'Profile updated successfully' });
        });
    });
});

// Email verification endpoint
app.get('/auth/verify-email/:token', function(req, res) {
    const token = req.params.token;

    if (!token) {
        return res.status(400).json({ message: 'Verification token is required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

        const query = 'UPDATE users SET email_verified = 1, email_verification_token = NULL WHERE email = ?';

        db.query(query, [decoded.email], function(err, result) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Verification failed' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json({ message: 'Email verified successfully' });
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(400).json({ message: 'Invalid or expired verification token' });
    }
});

// --- CATEGORY ENDPOINT ---
// Get all categories for dropdowns, etc.
app.get('/api/categories', function(req, res) {
    const query = `SELECT id, name FROM categories ORDER BY name ASC`;

    db.query(query, function(err, results) {
        if (err) {
            console.error('Database error fetching categories:', err);
            return res.status(500).json({ message: 'Failed to fetch categories from database.' });
        }
        res.json({ categories: results }); // Ensure you return an object with a 'categories' key
    });
});


// Get all courses (or popular courses) for homepage display
app.get('/api/courses', function(req, res) {
    const query = `
        SELECT
            cs.id,
            cs.title,
            cs.slug,
            cs.short_description,
            cs.price,
            cs.discount_price,
            cs.thumbnail,
            cs.difficulty,
            cs.duration_hours,
            cs.is_featured,
            cs.instructor_name,
            cs.category_name,
            cs.category_color,
            cs.enrolled_students,
            cs.total_videos,
            cs.total_materials,
            cs.average_rating,
            cs.review_count
        FROM course_summary cs
        WHERE cs.status = 'published'
        ORDER BY cs.is_featured DESC, cs.enrolled_students DESC, cs.created_at DESC
        LIMIT 9;
    `;

    db.query(query, function(err, results) {
        if (err) {
            console.error('Database error fetching courses:', err);
            return res.status(500).json({ message: 'Failed to fetch courses' });
        }
        const coursesWithUrls = results.map(course => ({
            ...course,
            thumbnail_url: course.thumbnail ? `${req.protocol}://${req.get('host')}/uploads/course_thumbnails/${course.thumbnail}` : null
        }));
        res.json({ courses: coursesWithUrls });
    });
});

// Get single course details by slug
app.get('/api/courses/:slug', function(req, res) {
    const { slug } = req.params;
    // Main query for course details
    const courseQuery = `
        SELECT
            c.id,
            c.title,
            c.slug,
            c.description,
            c.short_description,
            c.price,
            c.discount_price,
            c.thumbnail,
            c.trailer_video,
            c.status,
            c.difficulty,
            c.duration_hours,
            c.language,
            c.requirements,
            c.what_you_learn,
            c.target_audience,
            c.is_featured,
            c.views_count,
            c.likes_count,
            c.instructor_id, -- Include instructor_id for frontend logic
            u.name AS instructor_name,
            u.profile_image AS instructor_profile_image,
            cat.name AS category_name,
            cat.color AS category_color,
            cs.enrolled_students,
            cs.total_videos,
            cs.total_materials,
            cs.average_rating,
            cs.review_count
        FROM courses c
        JOIN users u ON c.instructor_id = u.id
        JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN course_summary cs ON c.id = cs.id
        WHERE c.slug = ? AND c.status = 'published';
    `;

    // Query for course materials
    const materialsQuery = `
        SELECT
            id,
            title,
            type,
            content,
            file_path, -- Keep as file_path, construct URL on the fly
            duration_seconds,
            order_index,
            is_preview
        FROM course_materials
        WHERE course_id = ?
        ORDER BY order_index ASC, created_at ASC;
    `;

    db.query(courseQuery, [slug], async function(err, courseResults) {
        if (err) {
            console.error('Database error fetching course details:', err);
            return res.status(500).json({ message: 'Failed to fetch course details' });
        }

        if (courseResults.length === 0) {
            return res.status(404).json({ message: 'Course not found or not published' });
        }

        const course = courseResults[0];
        const courseId = course.id; // Get the course ID to fetch materials

        // Now fetch materials for this course
        db.query(materialsQuery, [courseId], function(matErr, materialResults) {
            if (matErr) {
                console.error('Database error fetching course materials:', matErr);
                // Even if materials fail, return the course details without materials
                const courseWithUrls = {
                    ...course,
                    thumbnail_url: course.thumbnail ? `${req.protocol}://${req.get('host')}/uploads/course_thumbnails/${course.thumbnail}` : null,
                    trailer_video_url: course.trailer_video ? `${req.protocol}://${req.get('host')}/uploads/course_videos/${course.trailer_video}` : null,
                    instructor_profile_image_url: course.instructor_profile_image ? `${req.protocol}://${req.get('host')}/uploads/profiles/${course.instructor_profile_image}` : null,
                    materials: [] // Ensure materials array is present, even if empty due to error
                };
                return res.status(200).json({ course: courseWithUrls });
            }

            const materialsWithUrls = materialResults.map(material => ({
                ...material,
                // Construct full URL for material files based on type
                file_url: material.file_path ? `${req.protocol}://${req.get('host')}/uploads/${material.type === 'video' ? 'course_videos' : 'course_documents'}/${material.file_path}` : null
            }));

            const courseWithUrls = {
                ...course,
                thumbnail_url: course.thumbnail ? `${req.protocol}://${req.get('host')}/uploads/course_thumbnails/${course.thumbnail}` : null,
                trailer_video_url: course.trailer_video ? `${req.protocol}://${req.get('host')}/uploads/course_videos/${course.trailer_video}` : null,
                instructor_profile_image_url: course.instructor_profile_image ? `${req.protocol}://${req.get('host')}/uploads/profiles/${course.instructor_profile_image}` : null,
                materials: materialsWithUrls // Attach the fetched materials
            };

            res.json({ course: courseWithUrls });
        });
    });
});

// INSTRUCTOR ENDPOINTS

// Get courses created by the logged-in instructor
app.get('/api/instructor/courses', verifyToken, isInstructor, function(req, res) {
    const instructorId = req.user.id;
    const query = `
        SELECT
            c.id,
            c.title,
            c.slug,
            c.short_description,
            c.price,
            c.discount_price,
            c.thumbnail,
            c.status,
            c.difficulty,
            c.duration_hours,
            c.is_featured,
            cat.name AS category_name,
            -- Count enrolled students for each course
            (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) AS enrolled_students_count,
            cs.total_videos,
            cs.total_materials,
            cs.average_rating,
            cs.review_count
        FROM courses c
        JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN course_summary cs ON c.id = cs.id
        WHERE c.instructor_id = ?
        ORDER BY c.created_at DESC;
    `;

    db.query(query, [instructorId], function(err, results) {
        if (err) {
            console.error('Database error fetching instructor courses:', err);
            return res.status(500).json({ message: 'Failed to fetch instructor courses' });
        }
        const coursesWithUrls = results.map(course => ({
            ...course,
            thumbnail_url: course.thumbnail ? `${req.protocol}://${req.get('host')}/uploads/course_thumbnails/${course.thumbnail}` : null
        }));
        res.json({ courses: coursesWithUrls });
    });
});

// NEW ENDPOINT: Get enrolled students for a specific course (for instructor)
app.get('/api/instructor/courses/:courseId/enrolled-students', verifyToken, isInstructor, (req, res) => {
    const { courseId } = req.params;
    const instructorId = req.user.id;

    // First, verify that the course belongs to this instructor
    const verifyCourseOwnershipQuery = `
        SELECT id FROM courses WHERE id = ? AND instructor_id = ?;
    `;
    db.query(verifyCourseOwnershipQuery, [courseId, instructorId], (err, courseResults) => {
        if (err) {
            console.error('Database error verifying course ownership:', err);
            return res.status(500).json({ message: 'Failed to verify course ownership.' });
        }
        if (courseResults.length === 0) {
            return res.status(404).json({ message: 'Course not found or you are not the instructor of this course.' });
        }

        // If ownership is confirmed, fetch enrolled students
        const getEnrolledStudentsQuery = `
            SELECT u.id AS student_id, u.name AS student_name, u.email AS student_email,
                   e.enrollment_date, e.progress_percentage, e.status AS enrollment_status
            FROM enrollments e
            JOIN users u ON e.user_id = u.id
            WHERE e.course_id = ?
            ORDER BY u.name ASC;
        `;
        db.query(getEnrolledStudentsQuery, [courseId], (err, studentResults) => {
            if (err) {
                console.error('Database error fetching enrolled students:', err);
                return res.status(500).json({ message: 'Failed to fetch enrolled students.' });
            }
            res.status(200).json({ students: studentResults });
        });
    });
});


// Create a new course
app.post('/api/instructor/courses', verifyToken, isInstructor, uploadCourseThumbnail.single('thumbnail'), [
    body('title').trim().isLength({ min: 5, max: 255 }).withMessage('Title must be between 5 and 255 characters'),
    body('short_description').trim().isLength({ min: 10, max: 500 }).withMessage('Short description must be between 10 and 500 characters'),
    body('description').trim().isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
    body('category_id').isInt({ min: 1 }).withMessage('Invalid category ID'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
    body('difficulty').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty level'),
    body('language').trim().notEmpty().withMessage('Language is required'),
], async function(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        if (req.file) fs.unlinkSync(req.file.path); // Clean up uploaded file on validation error
        return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }

    const {
        title, slug, short_description, description, category_id,
        price, discount_price, difficulty, duration_hours,
        language, requirements, what_you_learn, target_audience,
        is_featured = false,
    } = req.body;

    const status = 'published'; // Default to published

    const instructorId = req.user.id;
    const courseSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');

    let thumbnailUrl = null;
    if (req.file) {
        thumbnailUrl = req.file.filename;
    }

    const query = `
        INSERT INTO courses (
            title, slug, short_description, description, instructor_id, category_id,
            price, discount_price, thumbnail, status, difficulty, duration_hours,
            language, requirements, what_you_learn, target_audience, is_featured,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const values = [
        title, courseSlug, short_description, description, instructorId, category_id,
        price, discount_price || null, thumbnailUrl, status, difficulty, duration_hours || null,
        language, requirements || null, what_you_learn || null, target_audience || null,
        is_featured
    ];

    db.query(query, values, function(err, result) {
        if (err) {
            console.error('Database error creating course:', err);
            if (req.file) fs.unlinkSync(req.file.path);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Course with this slug already exists.' });
            }
            return res.status(500).json({ message: 'Failed to create course.' });
        }
        res.status(201).json({ message: 'Course created successfully', courseId: result.insertId, slug: courseSlug });
    });
});

// Update an existing course
app.put('/api/instructor/courses/:id', verifyToken, isInstructor, uploadCourseThumbnail.single('thumbnail'), [
    body('title').optional().trim().isLength({ min: 5, max: 255 }).withMessage('Title must be between 5 and 255 characters'),
    body('short_description').optional().trim().isLength({ min: 10, max: 500 }).withMessage('Short description must be between 10 and 500 characters'),
    body('description').optional().trim().isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
    body('category_id').optional().isInt({ min: 1 }).withMessage('Invalid category ID'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
    body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty level'),
    body('language').optional().trim().notEmpty().withMessage('Language is required'),
    body('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Invalid status'),
], async function(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }

    const courseId = req.params.id;
    const instructorId = req.user.id;
    const {
        title, slug, short_description, description, category_id,
        price, discount_price, difficulty, duration_hours,
        language, requirements, what_you_learn, target_audience,
        is_featured, status, clear_thumbnail
    } = req.body;

    let updateFields = [];
    let updateValues = [];

    if (title !== undefined) { updateFields.push('title = ?'); updateValues.push(title); }
    if (slug !== undefined) { updateFields.push('slug = ?'); updateValues.push(slug); }
    if (short_description !== undefined) { updateFields.push('short_description = ?'); updateValues.push(short_description); }
    if (description !== undefined) { updateFields.push('description = ?'); updateValues.push(description); }
    if (category_id !== undefined) { updateFields.push('category_id = ?'); updateValues.push(category_id); }
    if (price !== undefined) { updateFields.push('price = ?'); updateValues.push(parseFloat(price)); }
    if (discount_price !== undefined) { updateFields.push('discount_price = ?'); updateValues.push(discount_price ? parseFloat(discount_price) : null); }
    if (difficulty !== undefined) { updateFields.push('difficulty = ?'); updateValues.push(difficulty); }
    if (duration_hours !== undefined) { updateFields.push('duration_hours = ?'); updateValues.push(duration_hours ? parseFloat(duration_hours) : null); }
    if (language !== undefined) { updateFields.push('language = ?'); updateValues.push(language); }
    if (requirements !== undefined) { updateFields.push('requirements = ?'); updateValues.push(requirements || null); }
    if (what_you_learn !== undefined) { updateFields.push('what_you_learn = ?'); updateValues.push(what_you_learn || null); }
    if (target_audience !== undefined) { updateFields.push('target_audience = ?'); updateValues.push(target_audience || null); }
    if (is_featured !== undefined) { updateFields.push('is_featured = ?'); updateValues.push(is_featured === 'true' || is_featured === true); }
    if (status !== undefined) { updateFields.push('status = ?'); updateValues.push(status); }

    updateFields.push('updated_at = NOW()');

    // Handle thumbnail update
    db.query('SELECT thumbnail FROM courses WHERE id = ? AND instructor_id = ?', [courseId, instructorId], (err, courseResults) => {
        if (err) {
            console.error('Database error fetching current thumbnail:', err);
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(500).json({ message: 'Failed to update course' });
        }
        if (courseResults.length === 0) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: 'Course not found or you are not the instructor.' });
        }

        const currentThumbnail = courseResults[0].thumbnail;

        if (req.file) {
            // New thumbnail uploaded, delete old one if exists
            if (currentThumbnail) {
                const oldThumbnailPath = path.join(courseThumbnailsDir, currentThumbnail);
                if (fs.existsSync(oldThumbnailPath)) {
                    fs.unlinkSync(oldThumbnailPath);
                }
            }
            updateFields.push('thumbnail = ?');
            updateValues.push(req.file.filename);
        } else if (clear_thumbnail === 'true') {
            // Explicitly clear thumbnail, delete old one if exists
            if (currentThumbnail) {
                const oldThumbnailPath = path.join(courseThumbnailsDir, currentThumbnail);
                if (fs.existsSync(oldThumbnailPath)) {
                    fs.unlinkSync(oldThumbnailPath);
                }
            }
            updateFields.push('thumbnail = NULL');
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No fields provided for update.' });
        }

        const query = `UPDATE courses SET ${updateFields.join(', ')} WHERE id = ? AND instructor_id = ?`;
        updateValues.push(courseId, instructorId);

        db.query(query, updateValues, function(err, result) {
            if (err) {
                console.error('Database error updating course:', err);
                if (req.file) fs.unlinkSync(req.file.path);
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ message: 'Course with this slug already exists.' });
                }
                return res.status(500).json({ message: 'Failed to update course.' });
            }

            if (result.affectedRows === 0) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(404).json({ message: 'Course not found or you are not the instructor.' });
            }

            res.json({ message: 'Course updated successfully' });
        });
    });
});

// --- Course Material Management ---
app.get('/api/courses/:courseId/materials', verifyToken, (req, res) => { // Changed authenticateToken to verifyToken
    const { courseId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const courseQuery = `SELECT instructor_id FROM courses WHERE id = ?`;
    db.query(courseQuery, [courseId], (err, courseResults) => {
        if (err) {
            console.error('Database error fetching course for materials check:', err);
            return res.status(500).json({ message: 'Failed to fetch course data.' });
        }
        if (courseResults.length === 0) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        const course = courseResults[0];
        const isInstructor = userRole === 'instructor' && course.instructor_id === userId;

        // Check enrollment for students
        const enrollmentQuery = `SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?`;
        db.query(enrollmentQuery, [userId, courseId], (err, enrollmentResults) => {
            if (err) {
                console.error('Database error checking enrollment for materials:', err);
                return res.status(500).json({ message: 'Failed to check enrollment status.' });
            }

            const isEnrolled = enrollmentResults.length > 0;

            const materialsQuery = `
                SELECT
                    id,
                    title,
                    type,
                    content,
                    file_path,
                    duration_seconds,
                    order_index,
                    is_preview
                FROM course_materials
                WHERE course_id = ?
                ORDER BY order_index ASC, created_at ASC;
            `;

            db.query(materialsQuery, [courseId], (matErr, materialResults) => {
                if (matErr) {
                    console.error('Database error fetching course materials:', matErr);
                    return res.status(500).json({ message: 'Failed to fetch course materials.' });
                }

                const materialsWithUrls = materialResults.map(material => {
                    let fileUrl = null;
                    if (material.file_path) {
                        if (material.type === 'video') {
                            fileUrl = `${req.protocol}://${req.get('host')}/uploads/course_videos/${material.file_path}`;
                        } else if (material.type === 'document') {
                            fileUrl = `${req.protocol}://${req.get('host')}/uploads/course_documents/${material.file_path}`;
                        }
                    }
                    return {
                        ...material,
                        file_url: fileUrl
                    };
                });

                if (!isInstructor && !isEnrolled) {
                    // If not instructor or enrolled, only return preview materials
                    const previewMaterials = materialsWithUrls.filter(m => m.is_preview);
                    return res.status(200).json({ materials: previewMaterials });
                }

                res.status(200).json({ materials: materialsWithUrls });
            });
        });
    });
});

app.post('/api/instructor/courses/:courseId/materials', verifyToken, isInstructor, uploadMaterialFiles.fields([{ name: 'video', maxCount: 1 }, { name: 'document', maxCount: 1 }]), [
    body('title').trim().isLength({ min: 3, max: 255 }).withMessage('Title must be between 3 and 255 characters'),
    body('type').isIn(['video', 'document', 'quiz', 'other']).withMessage('Invalid material type'),
    body('content').optional().isLength({ max: 5000 }).withMessage('Content cannot exceed 5000 characters'),
    body('duration_seconds').optional().isInt({ min: 0 }).withMessage('Duration must be a non-negative integer'),
    body('order_index').optional().isInt({ min: 0 }).withMessage('Order index must be a non-negative integer'),
], async function(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Clean up uploaded files if validation fails
        if (req.files && req.files['video'] && req.files['video'][0]) fs.unlinkSync(req.files['video'][0].path);
        if (req.files && req.files['document'] && req.files['document'][0]) fs.unlinkSync(req.files['document'][0].path);
        return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }

    const { courseId } = req.params;
    const { title, type, content, duration_seconds, order_index, is_preview } = req.body;
    const videoFile = req.files['video'] ? req.files['video'][0] : null;
    const documentFile = req.files['document'] ? req.files['document'][0] : null;

    // Verify course ownership
    db.query('SELECT id FROM courses WHERE id = ? AND instructor_id = ?', [courseId, req.user.id], (err, courseResults) => {
        if (err) {
            console.error('Database error verifying course ownership:', err);
            if (videoFile) fs.unlinkSync(videoFile.path);
            if (documentFile) fs.unlinkSync(documentFile.path);
            return res.status(500).json({ message: 'Failed to add material.' });
        }
        if (courseResults.length === 0) {
            if (videoFile) fs.unlinkSync(videoFile.path);
            if (documentFile) fs.unlinkSync(documentFile.path);
            return res.status(404).json({ message: 'Course not found or you are not the instructor.' });
        }

        let filePath = null;
        if (type === 'video' && videoFile) {
            filePath = videoFile.filename;
        } else if (type === 'document' && documentFile) {
            filePath = documentFile.filename;
        } else if (type === 'document' && !content) {
            return res.status(400).json({ message: 'Document material requires either a file or text content.' });
        } else if ((type === 'video' && !videoFile) || (type === 'document' && !documentFile && !content)) {
            return res.status(400).json({ message: `Missing file or content for material type: ${type}.` });
        }

        const query = `
            INSERT INTO course_materials (
                course_id, title, type, content, file_path, duration_seconds, order_index, is_preview, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
        const values = [
            courseId, title, type, content || null, filePath,
            duration_seconds ? parseInt(duration_seconds) : 0,
            order_index ? parseInt(order_index) : 0,
            is_preview === 'true' || is_preview === true,
        ];

        db.query(query, values, function(err, result) {
            if (err) {
                console.error('Database error adding material:', err);
                if (videoFile) fs.unlinkSync(videoFile.path);
                if (documentFile) fs.unlinkSync(documentFile.path);
                return res.status(500).json({ message: 'Failed to add material.' });
            }
            res.status(201).json({ message: 'Material added successfully', materialId: result.insertId });
        });
    });
});

app.put('/api/instructor/courses/:courseId/materials/:materialId', verifyToken, isInstructor, uploadMaterialFiles.fields([{ name: 'video', maxCount: 1 }, { name: 'document', maxCount: 1 }]), [
    body('title').optional().trim().isLength({ min: 3, max: 255 }).withMessage('Title must be between 3 and 255 characters'),
    body('type').optional().isIn(['video', 'document', 'quiz', 'other']).withMessage('Invalid material type'),
    body('content').optional().isLength({ max: 5000 }).withMessage('Content cannot exceed 5000 characters'),
    body('duration_seconds').optional().isInt({ min: 0 }).withMessage('Duration must be a non-negative integer'),
    body('order_index').optional().isInt({ min: 0 }).withMessage('Order index must be a non-negative integer'),
], async function(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        if (req.files && req.files['video'] && req.files['video'][0]) fs.unlinkSync(req.files['video'][0].path);
        if (req.files && req.files['document'] && req.files['document'][0]) fs.unlinkSync(req.files['document'][0].path);
        return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }

    const { courseId, materialId } = req.params;
    const { title, type, content, duration_seconds, order_index, is_preview, clear_content_and_file } = req.body;
    const videoFile = req.files['video'] ? req.files['video'][0] : null;
    const documentFile = req.files['document'] ? req.files['document'][0] : null;

    // Verify course ownership and material existence
    const verifyQuery = `
        SELECT cm.file_path, cm.type AS current_type, c.instructor_id
        FROM course_materials cm
        JOIN courses c ON cm.course_id = c.id
        WHERE cm.id = ? AND cm.course_id = ? AND c.instructor_id = ?;
    `;
    db.query(verifyQuery, [materialId, courseId, req.user.id], (err, results) => {
        if (err) {
            console.error('Database error verifying material ownership:', err);
            if (videoFile) fs.unlinkSync(videoFile.path);
            if (documentFile) fs.unlinkSync(documentFile.path);
            return res.status(500).json({ message: 'Failed to update material.' });
        }
        if (results.length === 0) {
            if (videoFile) fs.unlinkSync(videoFile.path);
            if (documentFile) fs.unlinkSync(documentFile.path);
            return res.status(404).json({ message: 'Material not found or you are not the instructor of this course.' });
        }

        const currentMaterialData = results[0];
        const oldFilePath = currentMaterialData.file_path;
        const currentMaterialType = currentMaterialData.current_type;

        let updateFields = [];
        let updateValues = [];
        let newFilePath = oldFilePath; // Default to current file path

        if (title !== undefined) { updateFields.push('title = ?'); updateValues.push(title); }
        if (type !== undefined) { updateFields.push('type = ?'); updateValues.push(type); }
        if (content !== undefined) { updateFields.push('content = ?'); updateValues.push(content || null); }
        if (duration_seconds !== undefined) { updateFields.push('duration_seconds = ?'); updateValues.push(duration_seconds ? parseInt(duration_seconds) : 0); }
        if (order_index !== undefined) { updateFields.push('order_index = ?'); updateValues.push(order_index ? parseInt(order_index) : 0); }
        if (is_preview !== undefined) { updateFields.push('is_preview = ?'); updateValues.push(is_preview === 'true' || is_preview === true); }

        // Handle file updates
        if (videoFile || documentFile || clear_content_and_file === 'true' || (type && type !== currentMaterialType)) {
            // If a new file is uploaded OR explicit clear requested OR type changes (implying old file is invalid)
            if (oldFilePath) {
                let dir = '';
                if (currentMaterialType === 'video') dir = courseVideosDir;
                else if (currentMaterialType === 'document') dir = courseDocumentsDir;

                const fullOldPath = path.join(dir, oldFilePath);
                if (fs.existsSync(fullOldPath)) {
                    fs.unlinkSync(fullOldPath);
                }
            }
            updateFields.push('file_path = ?');
            if (videoFile) {
                newFilePath = videoFile.filename;
                updateValues.push(newFilePath);
            } else if (documentFile) {
                newFilePath = documentFile.filename;
                updateValues.push(newFilePath);
            } else {
                newFilePath = null; // Clear file path if no new file and old one removed
                updateValues.push(null);
            }
        }

        updateFields.push('updated_at = NOW()');

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No fields provided for update.' });
        }

        const updateMaterialQuery = `UPDATE course_materials SET ${updateFields.join(', ')} WHERE id = ? AND course_id = ?`;
        updateValues.push(materialId, courseId);

        db.query(updateMaterialQuery, updateValues, function(err, result) {
            if (err) {
                console.error('Database error updating material:', err);
                if (videoFile) fs.unlinkSync(videoFile.path);
                if (documentFile) fs.unlinkSync(documentFile.path);
                return res.status(500).json({ message: 'Failed to update material.' });
            }

            if (result.affectedRows === 0) {
                if (videoFile) fs.unlinkSync(videoFile.path);
                if (documentFile) fs.unlinkSync(documentFile.path);
                return res.status(404).json({ message: 'Material not found or not authorized.' });
            }
            res.json({ message: 'Material updated successfully' });
        });
    });
});

app.delete('/api/instructor/courses/:courseId/materials/:materialId', verifyToken, isInstructor, (req, res) => {
    const { courseId, materialId } = req.params;

    // Verify course ownership and get file_path for deletion
    const verifyQuery = `
        SELECT cm.file_path, cm.type AS material_type, c.instructor_id
        FROM course_materials cm
        JOIN courses c ON cm.course_id = c.id
        WHERE cm.id = ? AND cm.course_id = ? AND c.instructor_id = ?;
    `;
    db.query(verifyQuery, [materialId, courseId, req.user.id], (err, results) => {
        if (err) {
            console.error('Database error verifying material ownership for deletion:', err);
            return res.status(500).json({ message: 'Failed to delete material.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Material not found or you are not the instructor of this course.' });
        }

        const materialToDelete = results[0];
        const filePath = materialToDelete.file_path;
        const materialType = materialToDelete.material_type;

        const deleteQuery = `DELETE FROM course_materials WHERE id = ? AND course_id = ?`;
        db.query(deleteQuery, [materialId, courseId], (deleteErr, deleteResult) => {
            if (deleteErr) {
                console.error('Database error deleting material:', deleteErr);
                return res.status(500).json({ message: 'Failed to delete material.' });
            }

            if (deleteResult.affectedRows === 0) {
                return res.status(404).json({ message: 'Material not found or not authorized for deletion.' });
            }

            // Delete associated file from disk
            if (filePath) {
                let dir = '';
                if (materialType === 'video') dir = courseVideosDir;
                else if (materialType === 'document') dir = courseDocumentsDir;

                const fullPath = path.join(dir, filePath);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            }
            res.status(200).json({ message: 'Material deleted successfully' });
        });
    });
});

// --- Public Course Routes (already existing, ensuring instructor_id is passed) ---
// This route is duplicated from above, ensure it's removed or handled properly in a real app.
// For this context, I'm assuming it's meant to be the primary public route.
app.get('/api/courses/:slug', function(req, res) {
    const { slug } = req.params;
    // Main query for course details
    const courseQuery = `
        SELECT
            c.id,
            c.title,
            c.slug,
            c.description,
            c.short_description,
            c.price,
            c.discount_price,
            c.thumbnail,
            c.trailer_video,
            c.status,
            c.difficulty,
            c.duration_hours,
            c.language,
            c.requirements,
            c.what_you_learn,
            c.target_audience,
            c.is_featured,
            c.views_count,
            c.likes_count,
            c.instructor_id, -- Include instructor_id for frontend logic
            u.name AS instructor_name,
            u.profile_image AS instructor_profile_image,
            cat.name AS category_name,
            cat.color AS category_color,
            cs.enrolled_students,
            cs.total_videos,
            cs.total_materials,
            cs.average_rating,
            cs.review_count
        FROM courses c
        JOIN users u ON c.instructor_id = u.id
        JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN course_summary cs ON c.id = cs.id
        WHERE c.slug = ? AND c.status = 'published';
    `;

    // Query for course materials
    const materialsQuery = `
        SELECT
            id,
            title,
            type,
            content,
            file_path, -- Keep as file_path, construct URL on the fly
            duration_seconds,
            order_index,
            is_preview
        FROM course_materials
        WHERE course_id = ?
        ORDER BY order_index ASC, created_at ASC;
    `;

    db.query(courseQuery, [slug], async function(err, courseResults) {
        if (err) {
            console.error('Database error fetching course details:', err);
            return res.status(500).json({ message: 'Failed to fetch course details' });
        }

        if (courseResults.length === 0) {
            return res.status(404).json({ message: 'Course not found or not published' });
        }

        const course = courseResults[0];
        const courseId = course.id; // Get the course ID to fetch materials

        // Now fetch materials for this course
        db.query(materialsQuery, [courseId], function(matErr, materialResults) {
            if (matErr) {
                console.error('Database error fetching course materials:', matErr);
                // Even if materials fail, return the course details without materials
                const courseWithUrls = {
                    ...course,
                    thumbnail_url: course.thumbnail ? `${req.protocol}://${req.get('host')}/uploads/course_thumbnails/${course.thumbnail}` : null,
                    trailer_video_url: course.trailer_video ? `${req.protocol}://${req.get('host')}/uploads/course_videos/${course.trailer_video}` : null,
                    instructor_profile_image_url: course.instructor_profile_image ? `${req.protocol}://${req.get('host')}/uploads/profiles/${course.instructor_profile_image}` : null,
                    materials: [] // Ensure materials array is present, even if empty due to error
                };
                return res.status(200).json({ course: courseWithUrls });
            }

            const materialsWithUrls = materialResults.map(material => ({
                ...material,
                // Construct full URL for material files based on type
                file_url: material.file_path ? `${req.protocol}://${req.get('host')}/uploads/${material.type === 'video' ? 'course_videos' : 'course_documents'}/${material.file_path}` : null
            }));

            const courseWithUrls = {
                ...course,
                thumbnail_url: course.thumbnail ? `${req.protocol}://${req.get('host')}/uploads/course_thumbnails/${course.thumbnail}` : null,
                trailer_video_url: course.trailer_video ? `${req.protocol}://${req.get('host')}/uploads/course_videos/${course.trailer_video}` : null,
                instructor_profile_image_url: course.instructor_profile_image ? `${req.protocol}://${req.get('host')}/uploads/profiles/${course.instructor_profile_image}` : null,
                materials: materialsWithUrls // Attach the fetched materials
            };

            res.json({ course: courseWithUrls });
        });
    });
});


// --- Student Enrollment Routes ---
app.post('/api/student/enroll/:courseId', verifyToken, isStudent, (req, res) => {
    const { courseId } = req.params;
    const studentId = req.user.id;

    // Check if course exists and is published
    db.query('SELECT id, status FROM courses WHERE id = ?', [courseId], (err, courseResults) => {
        if (err) {
            console.error('Database error checking course existence for enrollment:', err);
            return res.status(500).json({ message: 'Failed to enroll in course.' });
        }
        if (courseResults.length === 0 || courseResults[0].status !== 'published') {
            return res.status(404).json({ message: 'Course not found or not available for enrollment.' });
        }

        // Check if already enrolled
        db.query('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?', [studentId, courseId], (err, enrollmentResults) => {
            if (err) {
                console.error('Database error checking existing enrollment:', err);
                return res.status(500).json({ message: 'Failed to enroll in course.' });
            }
            if (enrollmentResults.length > 0) {
                return res.status(409).json({ message: 'You are already enrolled in this course.' });
            }

            // Perform enrollment
            const insertQuery = `
                INSERT INTO enrollments (user_id, course_id, enrollment_date, status, progress_percentage)
                VALUES (?, ?, NOW(), 'in_progress', 0.00)
            `;
            db.query(insertQuery, [studentId, courseId], (insertErr, result) => {
                if (insertErr) {
                    console.error('Database error during enrollment:', insertErr);
                    return res.status(500).json({ message: 'Failed to enroll in course.' });
                }
                res.status(201).json({ message: 'Successfully enrolled in course.', enrollmentId: result.insertId });
            });
        });
    });
});

app.get('/api/student/courses', verifyToken, isStudent, (req, res) => {
    const studentId = req.user.id;
    const query = `
        SELECT
            e.id AS enrollment_id,
            e.enrollment_date, -- Corrected column name
            e.progress_percentage,
            e.status AS enrollment_status,
            c.id AS course_id,
            c.title,
            c.slug,
            c.short_description,
            c.thumbnail,
            c.instructor_id,
            u.name AS instructor_name,
            -- Aggregated data from course_summary view
            cs.total_videos,
            cs.total_materials,
            cs.average_rating,
            cs.review_count
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        JOIN users u ON c.instructor_id = u.id
        LEFT JOIN course_summary cs ON c.id = cs.id
        WHERE e.user_id = ?
        ORDER BY e.enrollment_date DESC; -- Corrected column name
    `;

    db.query(query, [studentId], (err, results) => {
        if (err) {
            console.error('Database error fetching enrolled courses:', err);
            return res.status(500).json({ message: 'Failed to fetch enrolled courses.' });
        }
        const enrolledCoursesWithUrls = results.map(course => ({
            ...course,
            thumbnail_url: course.thumbnail ? `${req.protocol}://${req.get('host')}/uploads/course_thumbnails/${course.thumbnail}` : null
        }));
        res.status(200).json({ enrolledCourses: enrolledCoursesWithUrls });
    });
});

// --- Chat Routes ---
app.get('/api/courses/:courseId/chat/messages', verifyToken, isCourseMember, (req, res) => {
    const { courseId } = req.params;
    const query = `
        SELECT
            ccm.id,
            ccm.course_id,
            ccm.user_id,
            u.name AS user_name,
            u.role AS user_role,
            ccm.message_content,
            ccm.timestamp
        FROM course_chat_messages ccm
        JOIN users u ON ccm.user_id = u.id
        WHERE ccm.course_id = ?
        ORDER BY ccm.timestamp ASC;
    `;
    db.query(query, [courseId], (err, results) => {
        if (err) {
            console.error('Database error fetching chat messages:', err);
            return res.status(500).json({ message: 'Failed to fetch chat messages.' });
        }
        res.status(200).json({ messages: results });
    });
});

app.post('/api/courses/:courseId/chat/messages', verifyToken, isCourseMember, [
    body('message_content').trim().notEmpty().withMessage('Message content cannot be empty.')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }

    const { courseId } = req.params;
    const { message_content } = req.body;
    const userId = req.user.id;

    const query = `
        INSERT INTO course_chat_messages (course_id, user_id, message_content, timestamp)
        VALUES (?, ?, ?, NOW())
    `;
    db.query(query, [courseId, userId, message_content], (err, result) => {
        if (err) {
            console.error('Database error sending chat message:', err);
            return res.status(500).json({ message: 'Failed to send message.' });
        }
        res.status(201).json({ message: 'Message sent successfully', messageId: result.insertId });
    });
});


// Start the server
app.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on http://localhost:${process.env.PORT || 5000}`);
    console.log(`Uploads directory: ${uploadsDir}`);
});
