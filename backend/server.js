const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();


// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors());
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

// Database connection with corrected configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'elearning',
    port: process.env.DB_PORT || 3306
    // Removed invalid options: acquireTimeout, timeout, reconnect
};

const db = mysql.createConnection(dbConfig);

// Function to create tables
const createTables = () => {
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
    
    // Create online classes table if it doesn't exist
    const createOnlineClassesTable = `
        CREATE TABLE IF NOT EXISTS online_classes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            course_id INT NOT NULL,
            instructor_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            scheduled_date DATETIME NOT NULL,
            duration_minutes INT NOT NULL DEFAULT 60,
            meeting_room_name VARCHAR(255) NOT NULL,
            meeting_password VARCHAR(100),
            max_participants INT DEFAULT 50,
            recording_enabled BOOLEAN DEFAULT FALSE,
            chat_enabled BOOLEAN DEFAULT TRUE,
            screen_share_enabled BOOLEAN DEFAULT TRUE,
            jitsi_room_config JSON,
            status ENUM('scheduled', 'active', 'completed', 'cancelled') DEFAULT 'scheduled',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
            FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_instructor_scheduled (instructor_id, scheduled_date),
            INDEX idx_course_scheduled (course_id, scheduled_date)
        )
    `;
    
    db.query(createChatTable, (err) => {
        if (err) {
            console.error('Error creating course_chat_messages table:', err);
        } else {
            console.log('course_chat_messages table ensured.');
        }
    });
    
    db.query(createOnlineClassesTable, (err) => {
        if (err) {
            console.error('Error creating online_classes table:', err);
        } else {
            console.log('online_classes table ensured.');
        }
    });
};

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1);
    }
    console.log('MySQL connected successfully');
    
    // Create tables after connection is established
    createTables();
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
        message: 'Welcome to E-Learning Platform API with Online Classes',
        version: '1.0.1',
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
            enrolledStudentsList: 'GET /api/instructor/courses/:courseId/enrolled-students',
            scheduleOnlineClass: 'POST /api/online-classes',
            fetchOnlineClasses: 'GET /api/online-classes',
            updateClassStatus: 'PUT /api/online-classes/:id/status',
            instructorCoursesForClasses: 'GET /api/instructor/courses-for-classes'
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
        const errors = validationResult(req);
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
        const errors = validationResult(req);
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
                { id: user.id, role: user.role, name: user.name },
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
        res.json({ categories: results });
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
            c.instructor_id,
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
            file_path,
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
        const courseId = course.id;

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
                    materials: []
                };
                return res.status(200).json({ course: courseWithUrls });
            }

            const materialsWithUrls = materialResults.map(material => ({
                ...material,
                file_url: material.file_path ? `${req.protocol}://${req.get('host')}/uploads/${material.type === 'video' ? 'course_videos' : 'course_documents'}/${material.file_path}` : null
            }));

            const courseWithUrls = {
                ...course,
                thumbnail_url: course.thumbnail ? `${req.protocol}://${req.get('host')}/uploads/course_thumbnails/${course.thumbnail}` : null,
                trailer_video_url: course.trailer_video ? `${req.protocol}://${req.get('host')}/uploads/course_videos/${course.trailer_video}` : null,
                instructor_profile_image_url: course.instructor_profile_image ? `${req.protocol}://${req.get('host')}/uploads/profiles/${course.instructor_profile_image}` : null,
                materials: materialsWithUrls
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
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }

    const {
        title, slug, short_description, description, category_id,
        price, discount_price, difficulty, duration_hours,
        language, requirements, what_you_learn, target_audience,
        is_featured = false,
    } = req.body;

    const status = 'published';
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

// --- ONLINE CLASSES ENDPOINTS ---

// 1. Schedule a new online class
app.post('/api/online-classes', verifyToken, isInstructor, [
    body('course_id').isInt({ min: 1 }).withMessage('Valid course ID is required'),
    body('title').trim().isLength({ min: 3, max: 255 }).withMessage('Title must be between 3 and 255 characters'),
    body('scheduled_date').isISO8601().withMessage('Valid scheduled date is required'),
    body('duration_minutes').isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15 and 480 minutes'),
    body('max_participants').optional().isInt({ min: 1, max: 100 }).withMessage('Max participants must be between 1 and 100')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const {
        course_id,
        title,
        description,
        scheduled_date,
        duration_minutes,
        meeting_room_name,
        meeting_password,
        max_participants,
        recording_enabled,
        chat_enabled,
        screen_share_enabled,
        jitsi_room_config
    } = req.body;

    const instructor_id = req.user.id;

    // Insert the online class
    const insertQuery = `
        INSERT INTO online_classes (
            course_id, instructor_id, title, description, scheduled_date, duration_minutes,
            meeting_room_name, meeting_password, max_participants, recording_enabled,
            chat_enabled, screen_share_enabled, jitsi_room_config
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        course_id,
        instructor_id,
        title,
        description || null,
        scheduled_date,
        duration_minutes || 60,
        meeting_room_name,
        meeting_password || null,
        max_participants || 50,
        recording_enabled ? 1 : 0,
        chat_enabled !== false ? 1 : 0,
        screen_share_enabled !== false ? 1 : 0,
        JSON.stringify(jitsi_room_config || {})
    ];

    db.query(insertQuery, values, (insertErr, result) => {
        if (insertErr) {
            console.error('Database error inserting online class:', insertErr);
            return res.status(500).json({ error: 'Failed to schedule class' });
        }

        res.status(201).json({
            message: 'Class scheduled successfully',
            data: {
                id: result.insertId,
                course_id,
                instructor_id,
                title,
                description,
                scheduled_date,
                duration_minutes: duration_minutes || 60,
                meeting_room_name,
                meeting_password,
                max_participants: max_participants || 50,
                recording_enabled: recording_enabled || false,
                chat_enabled: chat_enabled !== false,
                screen_share_enabled: screen_share_enabled !== false,
                status: 'scheduled'
            }
        });
    });
});

// 2. Fetch all online classes for a given instructor
app.get('/api/online-classes', verifyToken, isInstructor, (req, res) => {
    const instructor_id = req.user.id;
    const { status } = req.query;

    let query = `
        SELECT
            oc.id,
            oc.course_id,
            oc.instructor_id,
            oc.title,
            oc.description,
            oc.scheduled_date,
            oc.duration_minutes,
            oc.meeting_room_name,
            oc.meeting_password,
            oc.max_participants,
            oc.recording_enabled,
            oc.chat_enabled,
            oc.screen_share_enabled,
            oc.jitsi_room_config,
            oc.status,
            oc.created_at
        FROM online_classes oc
        WHERE oc.instructor_id = ?
    `;

    const params = [instructor_id];

    if (status) {
        query += ' AND oc.status = ?';
        params.push(status);
    }

    query += ' ORDER BY oc.scheduled_date DESC';

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Database error fetching online classes:', err);
            return res.status(500).json({ error: 'Failed to retrieve classes' });
        }

        const processedResults = results.map(row => ({
            ...row,
            recording_enabled: Boolean(row.recording_enabled),
            chat_enabled: Boolean(row.chat_enabled),
            screen_share_enabled: Boolean(row.screen_share_enabled),
            jitsi_room_config: typeof row.jitsi_room_config === 'string'
                ? JSON.parse(row.jitsi_room_config)
                : row.jitsi_room_config
        }));

        res.status(200).json({ data: processedResults });
    });
});

// 3. Get courses for instructor (for class scheduling)
app.get('/api/instructor/courses-for-classes', verifyToken, isInstructor, (req, res) => {
    const instructor_id = req.user.id;
    const query = `
        SELECT id, title, slug, status
        FROM courses
        WHERE instructor_id = ? AND status = 'published'
        ORDER BY title ASC
    `;

    db.query(query, [instructor_id], (err, results) => {
        if (err) {
            console.error('Database error fetching courses for classes:', err);
            return res.status(500).json({ error: 'Failed to retrieve courses' });
        }
        res.status(200).json({ data: results });
    });
});

// 4. Update online class status
app.put('/api/online-classes/:id/status', verifyToken, isInstructor, [
    body('status').isIn(['scheduled', 'active', 'completed', 'cancelled']).withMessage('Invalid status')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;
    const instructor_id = req.user.id;

    const updateQuery = `
        UPDATE online_classes
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND instructor_id = ?
    `;

    db.query(updateQuery, [status, id, instructor_id], (err, result) => {
        if (err) {
            console.error('Database error updating class status:', err);
            return res.status(500).json({ error: 'Failed to update class status' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Class not found or you are not the instructor' });
        }

        res.json({ message: 'Class status updated successfully' });
    });
});

// --- Course Material Management ---
app.get('/api/courses/:courseId/materials', verifyToken, (req, res) => {
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

// Continue with remaining endpoints...
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
            e.enrollment_date,
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
        ORDER BY e.enrollment_date DESC;
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

// Update material endpoint
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

// Delete material endpoint
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


// --- STUDENT ONLINE CLASS ENDPOINTS ---

// Create attendance tracking table
const createAttendanceTable = () => {
    const createAttendanceTableQuery = `
        CREATE TABLE IF NOT EXISTS class_attendance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            class_id INT NOT NULL,
            student_id INT NOT NULL,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            left_at TIMESTAMP NULL,
            status ENUM('joined', 'left', 'completed') DEFAULT 'joined',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (class_id) REFERENCES online_classes(id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_student_class (class_id, student_id),
            INDEX idx_class_date (class_id, joined_at),
            INDEX idx_student_date (student_id, joined_at)
        )
    `;
    
    db.query(createAttendanceTableQuery, (err) => {
        if (err) {
            console.error('Error creating class_attendance table:', err);
        } else {
            console.log('class_attendance table ensured.');
        }
    });
};

// 1. Get online classes for a specific course (for enrolled students and instructors)
app.get('/api/courses/:courseId/classes', verifyToken, (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // First, verify user has access to this course
    const accessQuery = `
        SELECT c.id, c.instructor_id, 
               e.user_id AS enrolled_user_id,
               c.title AS course_title,
               u.name AS instructor_name
        FROM courses c
        LEFT JOIN enrollments e ON c.id = e.course_id AND e.user_id = ?
        LEFT JOIN users u ON c.instructor_id = u.id
        WHERE c.id = ?
    `;

    db.query(accessQuery, [userId, courseId], (err, courseResults) => {
        if (err) {
            console.error('Database error checking course access:', err);
            return res.status(500).json({ message: 'Failed to verify course access.' });
        }
        
        if (courseResults.length === 0) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        const course = courseResults[0];
        const isInstructorOfCourse = (userRole === 'instructor' && course.instructor_id === userId);
        const isEnrolledStudent = (userRole === 'student' && course.enrolled_user_id === userId);

        if (!isInstructorOfCourse && !isEnrolledStudent) {
            return res.status(403).json({ message: 'Access denied. You are not a member of this course.' });
        }

        // Fetch online classes for this course
        const classesQuery = `
            SELECT 
                oc.id,
                oc.course_id,
                oc.title,
                oc.description,
                oc.scheduled_date,
                oc.duration_minutes,
                oc.meeting_room_name,
                oc.meeting_password,
                oc.max_participants,
                oc.recording_enabled,
                oc.chat_enabled,
                oc.screen_share_enabled,
                oc.status,
                oc.created_at,
                oc.updated_at,
                c.title AS course_title,
                u.name AS instructor_name
            FROM online_classes oc
            JOIN courses c ON oc.course_id = c.id
            JOIN users u ON c.instructor_id = u.id
            WHERE oc.course_id = ?
            ORDER BY oc.scheduled_date DESC
        `;

        db.query(classesQuery, [courseId], (classErr, classResults) => {
            if (classErr) {
                console.error('Database error fetching course classes:', classErr);
                return res.status(500).json({ message: 'Failed to fetch course classes.' });
            }

            // Process results and add meeting URLs
            const processedClasses = classResults.map(cls => {
                // Generate meeting URL from room name
                const meetingUrl = cls.meeting_room_name 
                    ? `https://meet.jit.si/${cls.meeting_room_name}`
                    : null;

                // Calculate end time from scheduled_date + duration
                const startTime = cls.scheduled_date;
                const endTime = new Date(new Date(startTime).getTime() + (cls.duration_minutes * 60 * 1000));

                return {
                    ...cls,
                    start_time: startTime, // Map for student component
                    end_time: endTime.toISOString(),
                    meeting_url: meetingUrl,
                    recording_enabled: Boolean(cls.recording_enabled),
                    chat_enabled: Boolean(cls.chat_enabled),
                    screen_share_enabled: Boolean(cls.screen_share_enabled)
                };
            });

            res.status(200).json({ 
                classes: processedClasses,
                course_info: {
                    id: course.id,
                    title: course.course_title,
                    instructor_name: course.instructor_name
                }
            });
        });
    });
});

// 2. Join/Record attendance for an online class (for students)
app.post('/api/courses/:courseId/classes/:classId/join', verifyToken, (req, res) => {
    const { courseId, classId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verify student is enrolled in the course
    if (userRole !== 'student') {
        return res.status(403).json({ message: 'Only students can join classes through this endpoint.' });
    }

    const verifyEnrollmentQuery = `
        SELECT e.id, oc.title AS class_title, oc.meeting_room_name, oc.status
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        JOIN online_classes oc ON oc.course_id = c.id AND oc.id = ?
        WHERE e.user_id = ? AND e.course_id = ?
    `;

    db.query(verifyEnrollmentQuery, [classId, userId, courseId], (err, results) => {
        if (err) {
            console.error('Database error verifying enrollment for class join:', err);
            return res.status(500).json({ message: 'Failed to join class.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Class not found or you are not enrolled in this course.' });
        }

        const classInfo = results[0];

        // Optional: Create attendance record
        const attendanceQuery = `
            INSERT INTO class_attendance (class_id, student_id, joined_at, status)
            VALUES (?, ?, NOW(), 'joined')
            ON DUPLICATE KEY UPDATE joined_at = NOW(), status = 'joined'
        `;

        db.query(attendanceQuery, [classId, userId], (attendanceErr) => {
            if (attendanceErr) {
                console.error('Database error recording attendance:', attendanceErr);
                // Don't fail the join request if attendance recording fails
            }

            // Return success response with meeting info
            res.status(200).json({
                message: 'Successfully joined class',
                class_info: {
                    id: classId,
                    title: classInfo.class_title,
                    meeting_url: `https://meet.jit.si/${classInfo.meeting_room_name}`,
                    status: classInfo.status
                }
            });
        });
    });
});

// 3. Get all online classes for a student's enrolled courses
app.get('/api/student/online-classes', verifyToken, isStudent, (req, res) => {
    const studentId = req.user.id;
    const { status } = req.query; // Optional filter by status

    let query = `
        SELECT 
            oc.id,
            oc.course_id,
            oc.title,
            oc.description,
            oc.scheduled_date,
            oc.duration_minutes,
            oc.meeting_room_name,
            oc.meeting_password,
            oc.max_participants,
            oc.recording_enabled,
            oc.chat_enabled,
            oc.screen_share_enabled,
            oc.status,
            oc.created_at,
            oc.updated_at,
            c.title AS course_title,
            u.name AS instructor_name
        FROM online_classes oc
        JOIN courses c ON oc.course_id = c.id
        JOIN users u ON c.instructor_id = u.id
        JOIN enrollments e ON e.course_id = c.id
        WHERE e.user_id = ? AND e.status = 'in_progress'
    `;

    const params = [studentId];

    if (status) {
        query += ' AND oc.status = ?';
        params.push(status);
    }

    query += ' ORDER BY oc.scheduled_date DESC';

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Database error fetching student online classes:', err);
            return res.status(500).json({ message: 'Failed to fetch online classes.' });
        }

        // Process results similar to course classes endpoint
        const processedClasses = results.map(cls => {
            const meetingUrl = cls.meeting_room_name 
                ? `https://meet.jit.si/${cls.meeting_room_name}`
                : null;

            const startTime = cls.scheduled_date;
            const endTime = new Date(new Date(startTime).getTime() + (cls.duration_minutes * 60 * 1000));

            return {
                ...cls,
                start_time: startTime,
                end_time: endTime.toISOString(),
                meeting_url: meetingUrl,
                recording_enabled: Boolean(cls.recording_enabled),
                chat_enabled: Boolean(cls.chat_enabled),
                screen_share_enabled: Boolean(cls.screen_share_enabled)
            };
        });

        res.status(200).json({ classes: processedClasses });
    });
});


// Example Express.js route
// Replace your current admin login endpoint with this:
// REPLACE the broken admin login endpoint with this working version:
app.post('/api/auth/admin-login', loginValidation, (req, res) => {
    console.log('Admin login endpoint hit');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation error',
            errors: errors.array()
        });
    }

    const { email, password } = req.body;
    console.log('Admin login attempt for:', email);

    const query = `
        SELECT id, name, email, password, role, status, profile_image, bio,
        phone, date_of_birth, gender, country, email_verified, last_login
        FROM users
        WHERE email = ? AND status = 'active' AND role = 'admin'
    `;

    db.query(query, [email], (err, results) => {
        if (err) {
            console.error('Database error during admin login:', err);
            return res.status(500).json({ message: 'Login failed' });
        }

        console.log('Admin query results:', results.length);

        if (results.length === 0) {
            console.log('No admin found with email:', email);
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }

        const admin = results[0];
        console.log('Found admin:', { id: admin.id, email: admin.email, role: admin.role });

        bcrypt.compare(password, admin.password, (bcryptErr, isMatch) => {
            if (bcryptErr) {
                console.error('Password comparison error:', bcryptErr);
                return res.status(500).json({ message: 'Login failed' });
            }

            if (!isMatch) {
                console.log('Invalid password for admin:', email);
                return res.status(401).json({ message: 'Invalid admin credentials' });
            }

            console.log('Password match successful for admin:', email);

            db.query(
                'UPDATE users SET last_login = NOW() WHERE id = ?',
                [admin.id],
                (updateErr) => {
                    if (updateErr) console.error('Failed to update admin last login:', updateErr);
                }
            );

            const token = jwt.sign(
                { id: admin.id, role: admin.role, name: admin.name },
                process.env.JWT_SECRET || 'your_jwt_secret',
                { expiresIn: '7d' }
            );

            const { password: _, ...adminResponse } = admin;

            if (adminResponse.profile_image) {
                adminResponse.profile_image_url = `${req.protocol}://${req.get('host')}/uploads/profiles/${adminResponse.profile_image}`;
            }

            console.log('Admin login successful, sending response');

            res.json({
                success: true,
                message: 'Admin login successful',
                token,
                user: adminResponse
            });
        });
    });
});

// Middleware to check if user is an admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Only admins can perform this action.' });
    }
};

// Fix 1: Get all users - REPLACE the async version
// Fix 1: Get all users - REPLACE the async version
// GET ALL USERS (Admin only)
app.get('/api/admin/users', verifyToken, isAdmin, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const countQuery = `
        SELECT COUNT(*) as total 
        FROM users 
        WHERE status != 'deleted' 
        AND (name LIKE ? OR email LIKE ?)
    `;
    const searchParam = `%${search}%`;

    db.query(countQuery, [searchParam, searchParam], (err, countResult) => {
        if (err) {
            console.error('Database error fetching users count:', err);
            return res.status(500).json({ 
                error: true, 
                message: 'Failed to fetch users count.', 
                details: err.message 
            });
        }

        const totalUsers = countResult[0].total || 0;
        const totalPages = Math.ceil(totalUsers / limit);

        const query = `
            SELECT 
                id,
                name,
                email,
                role,
                status,
                profile_image,
                phone,
                date_of_birth,
                gender,
                country,
                bio,
                email_verified,
                last_login,
                created_at,
                updated_at
            FROM users 
            WHERE status != 'deleted' 
            AND (name LIKE ? OR email LIKE ?)
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `;

        db.query(query, [searchParam, searchParam, limit, offset], (err, users) => {
            if (err) {
                console.error('Database error fetching users:', err);
                return res.status(500).json({ 
                    error: true, 
                    message: 'Failed to fetch users.', 
                    details: err.message 
                });
            }

            // Add profile image URLs
            const usersWithUrls = users.map(user => ({
                ...user,
                profile_image_url: user.profile_image ? `${req.protocol}://${req.get('host')}/uploads/profiles/${user.profile_image}` : null
            }));

            res.json({ 
                error: false,
                users: usersWithUrls, 
                pagination: { 
                    currentPage: page, 
                    totalPages, 
                    totalUsers, 
                    limit 
                } 
            });
        });
    });
});

// ... (Rest of the existing code, e.g., /api/admin/statistics, graceful shutdown, etc.)

// Additional Admin Backend API Endpoints - Add these to your existing server.js

// Additional Admin Backend API Endpoints - Add these to your existing server.js

// ADD this endpoint to your server.js file to fix the admin dashboard course loading error

// GET ALL COURSES FOR ADMIN (with full details including instructor info and enrollment counts)
app.get('/api/admin/courses', verifyToken, isAdmin, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const countQuery = 'SELECT COUNT(*) as total FROM courses';
    
    db.query(countQuery, (err, countResult) => {
        if (err) {
            console.error('Database error counting courses:', err);
            return res.status(500).json({ message: 'Failed to fetch courses count.' });
        }

        const totalCourses = countResult[0].total;
        const totalPages = Math.ceil(totalCourses / limit);

        const query = `
            SELECT 
                c.id,
                c.title,
                c.slug,
                c.short_description,
                c.description,
                c.price,
                c.discount_price,
                c.thumbnail,
                c.status,
                c.difficulty,
                c.duration_hours,
                c.language,
                c.is_featured,
                c.views_count,
                c.likes_count,
                c.created_at,
                c.updated_at,
                u.name AS instructor_name,
                u.email AS instructor_email,
                u.id AS instructor_id,
                cat.name AS category_name,
                -- Count enrolled students for each course
                (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) AS enrolled_students_count,
                -- Count course materials
                (SELECT COUNT(*) FROM course_materials WHERE course_id = c.id) AS materials_count
            FROM courses c
            JOIN users u ON c.instructor_id = u.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            ORDER BY c.created_at DESC
            LIMIT ? OFFSET ?
        `;

        db.query(query, [limit, offset], (err, courses) => {
            if (err) {
                console.error('Database error fetching admin courses:', err);
                return res.status(500).json({ message: 'Failed to fetch courses.' });
            }

            // Add thumbnail URLs
            const coursesWithUrls = courses.map(course => ({
                ...course,
                thumbnail_url: course.thumbnail ? `${req.protocol}://${req.get('host')}/uploads/course_thumbnails/${course.thumbnail}` : null
            }));

            res.json({ 
                courses: coursesWithUrls, 
                pagination: { 
                    currentPage: page, 
                    totalPages, 
                    totalCourses: totalCourses, 
                    limit 
                } 
            });
        });
    });
});

// UPDATE COURSE STATUS (Admin only)
app.put('/api/admin/courses/:id/status', verifyToken, isAdmin, [
    body('status').isIn(['draft', 'published', 'archived']).withMessage('Invalid status')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }

    const courseId = req.params.id;
    const { status } = req.body;

    const updateQuery = `
        UPDATE courses 
        SET status = ?, updated_at = NOW() 
        WHERE id = ?
    `;

    db.query(updateQuery, [status, courseId], (err, result) => {
        if (err) {
            console.error('Database error updating course status:', err);
            return res.status(500).json({ message: 'Failed to update course status.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        res.json({ message: 'Course status updated successfully.' });
    });
});

// DELETE COURSE (Admin only)
app.delete('/api/admin/courses/:id', verifyToken, isAdmin, (req, res) => {
    const courseId = req.params.id;

    // First, get course details for cleanup
    const getCourseQuery = `
        SELECT id, thumbnail, title
        FROM courses 
        WHERE id = ?
    `;

    db.query(getCourseQuery, [courseId], (err, courseResults) => {
        if (err) {
            console.error('Database error fetching course for deletion:', err);
            return res.status(500).json({ message: 'Failed to delete course.' });
        }

        if (courseResults.length === 0) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        const course = courseResults[0];

        // Start transaction for cleanup
        db.beginTransaction((transErr) => {
            if (transErr) {
                console.error('Transaction error:', transErr);
                return res.status(500).json({ message: 'Failed to delete course.' });
            }

            // Delete in order: enrollments, materials, course
            const deleteEnrollments = `DELETE FROM enrollments WHERE course_id = ?`;
            const deleteMaterials = `DELETE FROM course_materials WHERE course_id = ?`;
            const deleteCourse = `DELETE FROM courses WHERE id = ?`;

            db.query(deleteEnrollments, [courseId], (enrollErr) => {
                if (enrollErr) {
                    return db.rollback(() => {
                        console.error('Error deleting enrollments:', enrollErr);
                        res.status(500).json({ message: 'Failed to delete course.' });
                    });
                }

                db.query(deleteMaterials, [courseId], (matErr) => {
                    if (matErr) {
                        return db.rollback(() => {
                            console.error('Error deleting materials:', matErr);
                            res.status(500).json({ message: 'Failed to delete course.' });
                        });
                    }

                    db.query(deleteCourse, [courseId], (courseErr, result) => {
                        if (courseErr) {
                            return db.rollback(() => {
                                console.error('Error deleting course:', courseErr);
                                res.status(500).json({ message: 'Failed to delete course.' });
                            });
                        }

                        db.commit((commitErr) => {
                            if (commitErr) {
                                return db.rollback(() => {
                                    console.error('Transaction commit error:', commitErr);
                                    res.status(500).json({ message: 'Failed to delete course.' });
                                });
                            }

                            // Clean up thumbnail file if exists
                            if (course.thumbnail) {
                                const thumbnailPath = path.join(courseThumbnailsDir, course.thumbnail);
                                if (fs.existsSync(thumbnailPath)) {
                                    fs.unlinkSync(thumbnailPath);
                                }
                            }

                            res.json({ message: 'Course deleted successfully.' });
                        });
                    });
                });
            });
        });
    });
});



// UPDATE USER (Admin only)
app.put('/api/admin/users/:id', verifyToken, isAdmin, [
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('role').optional().isIn(['student', 'instructor', 'parent', 'admin']).withMessage('Invalid role'),
    body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
    body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
    body('country').optional().isLength({ min: 2, max: 100 }).withMessage('Country name must be between 2 and 100 characters')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }

    const userId = req.params.id;
    const { name, email, role, status, phone, country, bio } = req.body;

    // Build dynamic update query
    let updateFields = [];
    let updateValues = [];

    if (name !== undefined) { updateFields.push('name = ?'); updateValues.push(name); }
    if (email !== undefined) { updateFields.push('email = ?'); updateValues.push(email); }
    if (role !== undefined) { updateFields.push('role = ?'); updateValues.push(role); }
    if (status !== undefined) { updateFields.push('status = ?'); updateValues.push(status); }
    if (phone !== undefined) { updateFields.push('phone = ?'); updateValues.push(phone || null); }
    if (country !== undefined) { updateFields.push('country = ?'); updateValues.push(country || null); }
    if (bio !== undefined) { updateFields.push('bio = ?'); updateValues.push(bio || null); }

    if (updateFields.length === 0) {
        return res.status(400).json({ message: 'No fields provided for update.' });
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(userId);

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

    db.query(query, updateValues, (err, result) => {
        if (err) {
            console.error('Database error updating user:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Email already exists' });
            }
            return res.status(500).json({ message: 'Failed to update user.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({ message: 'User updated successfully.' });
    });
});

// GET SYSTEM STATISTICS (Admin only)
app.get('/api/admin/statistics', verifyToken, isAdmin, (req, res) => {
    const queries = {
        totalUsers: `SELECT COUNT(*) as count FROM users WHERE status != 'deleted'`,
        adminUsers: `SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND status != 'deleted'`,
        instructorUsers: `SELECT COUNT(*) as count FROM users WHERE role = 'instructor' AND status != 'deleted'`,
        studentUsers: `SELECT COUNT(*) as count FROM users WHERE role = 'student' AND status != 'deleted'`,
        parentUsers: `SELECT COUNT(*) as count FROM users WHERE role = 'parent' AND status != 'deleted'`,
        totalCourses: `SELECT COUNT(*) as count FROM courses`,
        publishedCourses: `SELECT COUNT(*) as count FROM courses WHERE status = 'published'`,
        draftCourses: `SELECT COUNT(*) as count FROM courses WHERE status = 'draft'`,
        archivedCourses: `SELECT COUNT(*) as count FROM courses WHERE status = 'archived'`,
        totalEnrollments: `SELECT COUNT(*) as count FROM enrollments`,
        activeEnrollments: `SELECT COUNT(*) as count FROM enrollments WHERE status = 'in_progress'`,
        completedEnrollments: `SELECT COUNT(*) as count FROM enrollments WHERE status = 'completed'`,
        totalRevenue: `
            SELECT COALESCE(SUM(c.price), 0) as revenue 
            FROM enrollments e 
            JOIN courses c ON e.course_id = c.id 
            WHERE e.status IN ('in_progress', 'completed')
        `
    };

    const results = {};
    const queryKeys = Object.keys(queries);
    let completedQueries = 0;

    queryKeys.forEach(key => {
        db.query(queries[key], (err, result) => {
            if (err) {
                console.error(`Error executing ${key} query:`, err);
                results[key] = 0;
            } else {
                if (key === 'totalRevenue') {
                    results[key] = result[0].revenue || 0;
                } else {
                    results[key] = result[0].count || 0;
                }
            }
            
            completedQueries++;
            
            if (completedQueries === queryKeys.length) {
                // All queries completed, send response
                res.json({
                    users: {
                        total: results.totalUsers,
                        admin: results.adminUsers,
                        instructor: results.instructorUsers,
                        student: results.studentUsers,
                        parent: results.parentUsers
                    },
                    courses: {
                        total: results.totalCourses,
                        published: results.publishedCourses,
                        draft: results.draftCourses,
                        archived: results.archivedCourses
                    },
                    enrollments: {
                        total: results.totalEnrollments,
                        active: results.activeEnrollments,
                        completed: results.completedEnrollments
                    },
                    revenue: {
                        total: parseFloat(results.totalRevenue).toFixed(2)
                    }
                });
            }
        });
    });
});

// GET DASHBOARD ANALYTICS DATA (Admin only)
app.get('/api/admin/analytics', verifyToken, isAdmin, (req, res) => {
    const { period = '7d' } = req.query; // 7d, 30d, 90d, 1y
    
    let dateFilter = '';
    switch(period) {
        case '7d':
            dateFilter = 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
            break;
        case '30d':
            dateFilter = 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
            break;
        case '90d':
            dateFilter = 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)';
            break;
        case '1y':
            dateFilter = 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
            break;
        default:
            dateFilter = 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
    }

    const queries = {
        newUsers: `SELECT DATE(created_at) as date, COUNT(*) as count FROM users WHERE ${dateFilter} GROUP BY DATE(created_at) ORDER BY date`,
        newCourses: `SELECT DATE(created_at) as date, COUNT(*) as count FROM courses WHERE ${dateFilter} GROUP BY DATE(created_at) ORDER BY date`,
        newEnrollments: `SELECT DATE(enrollment_date) as date, COUNT(*) as count FROM enrollments WHERE ${dateFilter.replace('created_at', 'enrollment_date')} GROUP BY DATE(enrollment_date) ORDER BY date`,
        topCourses: `
            SELECT c.title, c.price, u.name as instructor_name, COUNT(e.id) as enrollment_count
            FROM courses c
            LEFT JOIN enrollments e ON c.id = e.course_id
            JOIN users u ON c.instructor_id = u.id
            WHERE c.status = 'published'
            GROUP BY c.id
            ORDER BY enrollment_count DESC
            LIMIT 10
        `,
        topInstructors: `
            SELECT u.name, u.email, COUNT(c.id) as course_count, COUNT(e.id) as total_enrollments
            FROM users u
            LEFT JOIN courses c ON u.id = c.instructor_id
            LEFT JOIN enrollments e ON c.id = e.course_id
            WHERE u.role = 'instructor'
            GROUP BY u.id
            ORDER BY total_enrollments DESC
            LIMIT 10
        `
    };

    const results = {};
    const queryKeys = Object.keys(queries);
    let completedQueries = 0;

    queryKeys.forEach(key => {
        db.query(queries[key], (err, result) => {
            if (err) {
                console.error(`Error executing ${key} analytics query:`, err);
                results[key] = [];
            } else {
                results[key] = result;
            }
            
            completedQueries++;
            
            if (completedQueries === queryKeys.length) {
                res.json(results);
            }
        });
    });
});

// BULK DELETE USERS (Admin only)
app.post('/api/admin/users/bulk-delete', verifyToken, isAdmin, [
    body('userIds').isArray({ min: 1 }).withMessage('At least one user ID is required'),
    body('userIds.*').isInt({ min: 1 }).withMessage('Invalid user ID')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }

    const { userIds } = req.body;
    
    // Check if trying to delete admin users
    const checkAdminQuery = `SELECT id FROM users WHERE id IN (${userIds.map(() => '?').join(',')}) AND role = 'admin'`;
    
    db.query(checkAdminQuery, userIds, (err, adminResults) => {
        if (err) {
            console.error('Database error checking admin users:', err);
            return res.status(500).json({ message: 'Failed to delete users.' });
        }

        if (adminResults.length > 0) {
            return res.status(403).json({ message: 'Cannot delete admin accounts.' });
        }

        const deleteQuery = `UPDATE users SET status = 'deleted', updated_at = NOW() WHERE id IN (${userIds.map(() => '?').join(',')})`;
        
        db.query(deleteQuery, userIds, (deleteErr, result) => {
            if (deleteErr) {
                console.error('Database error bulk deleting users:', deleteErr);
                return res.status(500).json({ message: 'Failed to delete users.' });
            }

            res.json({ 
                message: `${result.affectedRows} user(s) deleted successfully.`,
                deletedCount: result.affectedRows
            });
        });
    });
});

// EXPORT USERS DATA (Admin only)
app.get('/api/admin/users/export', verifyToken, isAdmin, (req, res) => {
    const { format = 'json' } = req.query; // json, csv

    const query = `
        SELECT 
            u.id,
            u.name,
            u.email,
            u.role,
            u.status,
            u.phone,
            u.country,
            u.created_at,
            u.last_login,
            u.email_verified,
            -- Additional stats
            COALESCE(course_count.count, 0) as created_courses,
            COALESCE(enrollment_count.count, 0) as enrolled_courses
        FROM users u
        LEFT JOIN (
            SELECT instructor_id, COUNT(*) as count 
            FROM courses 
            GROUP BY instructor_id
        ) course_count ON u.id = course_count.instructor_id
        LEFT JOIN (
            SELECT user_id, COUNT(*) as count 
            FROM enrollments 
            GROUP BY user_id
        ) enrollment_count ON u.id = enrollment_count.user_id
        WHERE u.status != 'deleted'
        ORDER BY u.created_at DESC
    `;

    db.query(query, (err, users) => {
        if (err) {
            console.error('Database error exporting users:', err);
            return res.status(500).json({ message: 'Failed to export users.' });
        }

        if (format === 'csv') {
            const csv = users.map(user => {
                return [
                    user.id,
                    `"${user.name}"`,
                    `"${user.email}"`,
                    user.role,
                    user.status,
                    user.phone || '',
                    user.country || '',
                    user.created_at,
                    user.last_login || '',
                    user.email_verified,
                    user.created_courses,
                    user.enrolled_courses
                ].join(',');
            });

            const csvHeader = 'ID,Name,Email,Role,Status,Phone,Country,Created At,Last Login,Email Verified,Created Courses,Enrolled Courses';
            const csvContent = [csvHeader, ...csv].join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=users_export.csv');
            res.send(csvContent);
        } else {
            res.json({ users });
        }
    });
});

// EXPORT COURSES DATA (Admin only)
app.get('/api/admin/courses/export', verifyToken, isAdmin, (req, res) => {
    const { format = 'json' } = req.query;

    const query = `
        SELECT 
            c.id,
            c.title,
            c.slug,
            c.price,
            c.discount_price,
            c.status,
            c.difficulty,
            c.duration_hours,
            c.language,
            c.is_featured,
            c.views_count,
            c.likes_count,
            c.created_at,
            c.updated_at,
            u.name as instructor_name,
            u.email as instructor_email,
            cat.name as category_name,
            COALESCE(enrollment_count.count, 0) as enrolled_students,
            COALESCE(material_count.count, 0) as materials_count
        FROM courses c
        JOIN users u ON c.instructor_id = u.id
        JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN (
            SELECT course_id, COUNT(*) as count 
            FROM enrollments 
            GROUP BY course_id
        ) enrollment_count ON c.id = enrollment_count.course_id
        LEFT JOIN (
            SELECT course_id, COUNT(*) as count 
            FROM course_materials 
            GROUP BY course_id
        ) material_count ON c.id = material_count.course_id
        ORDER BY c.created_at DESC
    `;

    db.query(query, (err, courses) => {
        if (err) {
            console.error('Database error exporting courses:', err);
            return res.status(500).json({ message: 'Failed to export courses.' });
        }

        if (format === 'csv') {
            const csv = courses.map(course => {
                return [
                    course.id,
                    `"${course.title}"`,
                    course.slug,
                    course.price,
                    course.discount_price || '',
                    course.status,
                    course.difficulty,
                    course.duration_hours || '',
                    course.language,
                    course.is_featured,
                    course.views_count || 0,
                    course.likes_count || 0,
                    course.created_at,
                    course.updated_at,
                    `"${course.instructor_name}"`,
                    course.instructor_email,
                    course.category_name,
                    course.enrolled_students,
                    course.materials_count
                ].join(',');
            });

            const csvHeader = 'ID,Title,Slug,Price,Discount Price,Status,Difficulty,Duration Hours,Language,Is Featured,Views,Likes,Created At,Updated At,Instructor Name,Instructor Email,Category,Enrolled Students,Materials Count';
            const csvContent = [csvHeader, ...csv].join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=courses_export.csv');
            res.send(csvContent);
        } else {
            res.json({ courses });
        }
    });
});

// SEND NOTIFICATION TO ALL USERS (Admin only)
app.post('/api/admin/notifications/broadcast', verifyToken, isAdmin, [
    body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required and must be less than 255 characters'),
    body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message is required and must be less than 1000 characters'),
    body('type').optional().isIn(['info', 'warning', 'success', 'error']).withMessage('Invalid notification type'),
    body('target_roles').optional().isArray().withMessage('Target roles must be an array')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }

    const { title, message, type = 'info', target_roles } = req.body;
    
    // Create notifications table if it doesn't exist
    const createNotificationsTable = `
        CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type ENUM('info', 'warning', 'success', 'error') DEFAULT 'info',
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user_created (user_id, created_at)
        )
    `;

    db.query(createNotificationsTable, (tableErr) => {
        if (tableErr) {
            console.error('Error creating notifications table:', tableErr);
            return res.status(500).json({ message: 'Failed to send notifications.' });
        }

        // Get target users
        let userQuery = `SELECT id FROM users WHERE status = 'active'`;
        let queryParams = [];

        if (target_roles && target_roles.length > 0) {
            userQuery += ` AND role IN (${target_roles.map(() => '?').join(',')})`;
            queryParams = target_roles;
        }

        db.query(userQuery, queryParams, (userErr, users) => {
            if (userErr) {
                console.error('Error fetching target users:', userErr);
                return res.status(500).json({ message: 'Failed to send notifications.' });
            }

            if (users.length === 0) {
                return res.status(400).json({ message: 'No target users found.' });
            }

            // Insert notifications for all target users
            const insertQuery = `
                INSERT INTO notifications (user_id, title, message, type)
                VALUES ?
            `;

            const notificationData = users.map(user => [user.id, title, message, type]);

            db.query(insertQuery, [notificationData], (insertErr, result) => {
                if (insertErr) {
                    console.error('Error inserting notifications:', insertErr);
                    return res.status(500).json({ message: 'Failed to send notifications.' });
                }

                res.json({ 
                    message: 'Notifications sent successfully.',
                    sent_count: result.affectedRows
                });
            });
        });
    });
});

// Also add the missing createAttendanceTable() call to your initialization
// Add this after your existing createTables() function call:
createAttendanceTable();

// Updated server.js - Add these new endpoints after the existing course member middleware

// Middleware to check if user is enrolled or instructor (already exists as isCourseMember)

// Get video progress for a user in a course
app.get('/api/courses/:courseId/progress', verifyToken, isCourseMember, (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.id;

    const query = `
        SELECT vp.video_id, vp.progress_percentage, vp.completed
        FROM video_progress vp
        JOIN course_materials cm ON vp.video_id = cm.id
        WHERE vp.user_id = ? AND cm.course_id = ? AND cm.type = 'video'
    `;

    db.query(query, [userId, courseId], (err, results) => {
        if (err) {
            console.error('Database error fetching video progress:', err);
            return res.status(500).json({ message: 'Failed to fetch video progress' });
        }
        res.json({ progress: results });
    });
});

// Update video progress
app.post('/api/materials/:materialId/progress', verifyToken, (req, res) => {
    const { materialId } = req.params;
    const userId = req.user.id;
    const { watched_duration_seconds } = req.body;

    if (typeof watched_duration_seconds !== 'number' || watched_duration_seconds < 0) {
        return res.status(400).json({ message: 'Invalid watched duration' });
    }

    // Get material details and verify access
    const getMaterialQuery = `
        SELECT cm.course_id, cm.duration_seconds, cm.type,
               c.instructor_id, e.user_id AS enrolled_user_id
        FROM course_materials cm
        JOIN courses c ON cm.course_id = c.id
        LEFT JOIN enrollments e ON c.id = e.course_id AND e.user_id = ?
        WHERE cm.id = ? AND cm.type = 'video'
    `;

    db.query(getMaterialQuery, [userId, materialId], (err, matResults) => {
        if (err) {
            console.error('Database error fetching material for progress update:', err);
            return res.status(500).json({ message: 'Failed to update progress' });
        }

        if (matResults.length === 0) {
            return res.status(404).json({ message: 'Video not found' });
        }

        const material = matResults[0];
        const isInstructor = req.user.role === 'instructor' && material.instructor_id === userId;
        const isEnrolled = material.enrolled_user_id === userId;

        if (!isInstructor && !isEnrolled) {
            return res.status(403).json({ message: 'Access denied to update progress' });
        }

        const total_duration_seconds = material.duration_seconds;
        let progress_percentage = Math.min((watched_duration_seconds / total_duration_seconds) * 100, 100);
        const completed = progress_percentage >= 80 ? 1 : 0;

        const upsertQuery = `
            INSERT INTO video_progress (
                user_id, video_id, watched_duration_seconds, 
                total_duration_seconds, progress_percentage, 
                completed, last_watched_at, watch_count
            ) VALUES (?, ?, ?, ?, ?, ?, NOW(), 1)
            ON DUPLICATE KEY UPDATE
                watched_duration_seconds = GREATEST(watched_duration_seconds, VALUES(watched_duration_seconds)),
                progress_percentage = GREATEST(progress_percentage, VALUES(progress_percentage)),
                completed = VALUES(completed),
                last_watched_at = NOW(),
                watch_count = watch_count + 1
        `;

        db.query(upsertQuery, [
            userId, materialId, watched_duration_seconds,
            total_duration_seconds, progress_percentage, completed
        ], (upsertErr, upsertResult) => {
            if (upsertErr) {
                console.error('Database error updating video progress:', upsertErr);
                return res.status(500).json({ message: 'Failed to update progress' });
            }

            // Update course progress in enrollments if not instructor
            if (!isInstructor && isEnrolled) {
                const calcProgressQuery = `
                    SELECT 
                        (SUM(CASE WHEN vp.completed = 1 THEN 1 ELSE 0 END) / COUNT(cm.id)) * 100 AS course_progress
                    FROM course_materials cm
                    LEFT JOIN video_progress vp ON cm.id = vp.video_id AND vp.user_id = ?
                    WHERE cm.course_id = ? AND cm.type = 'video'
                    GROUP BY cm.course_id
                `;

                db.query(calcProgressQuery, [userId, material.course_id], (progErr, progResults) => {
                    if (progErr) {
                        console.error('Error calculating course progress:', progErr);
                    } else {
                        const course_progress = progResults[0]?.course_progress || 0;
                        const updateEnrollmentQuery = `
                            UPDATE enrollments 
                            SET progress_percentage = ? 
                            WHERE user_id = ? AND course_id = ?
                        `;
                        db.query(updateEnrollmentQuery, [course_progress, userId, material.course_id], (updateErr) => {
                            if (updateErr) {
                                console.error('Error updating enrollment progress:', updateErr);
                            }
                        });
                    }
                });
            }

            res.json({ 
                message: 'Progress updated', 
                progress_percentage, 
                completed: !!completed 
            });
        });
    });
});

// QUIZ MANAGEMENT ENDPOINTS
// Add these after your existing endpoints in server.js

// Get all quizzes for a course
app.get('/api/courses/:courseId/quizzes', verifyToken, async (req, res) => {
    try {
        const { courseId } = req.params;
        
        // Check if user has access to this course
        const accessQuery = `
            SELECT * FROM courses 
            WHERE id = ? AND (instructor_id = ? OR id IN (SELECT course_id FROM enrollments WHERE user_id = ?))
        `;
        
        db.query(accessQuery, [courseId, req.user.id, req.user.id], (err, courses) => {
            if (err) {
                console.error('Database error checking course access:', err);
                return res.status(500).json({ message: 'Server error' });
            }
            
            if (courses.length === 0) {
                return res.status(403).json({ message: 'Access denied' });
            }

            db.query(
                'SELECT * FROM quizzes WHERE course_id = ? ORDER BY order_index ASC',
                [courseId],
                (err, quizzes) => {
                    if (err) {
                        console.error('Error fetching quizzes:', err);
                        return res.status(500).json({ message: 'Server error' });
                    }
                    res.json(quizzes);
                }
            );
        });
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new quiz
app.post('/api/courses/:courseId/quizzes', verifyToken, isInstructor, (req, res) => {
    try {
        const { courseId } = req.params;
        const { 
            title, description, instructions, time_limit_minutes, 
            passing_score, max_attempts, is_active, show_results, 
            randomize_questions, randomize_options, order_index 
        } = req.body;

        // Verify course ownership
        db.query(
            'SELECT * FROM courses WHERE id = ? AND instructor_id = ?',
            [courseId, req.user.id],
            (err, courses) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ message: 'Server error' });
                }

                if (courses.length === 0) {
                    return res.status(403).json({ message: 'Access denied' });
                }

                const insertQuery = `
                    INSERT INTO quizzes (
                        course_id, title, description, instructions, time_limit_minutes, 
                        passing_score, max_attempts, is_active, show_results, 
                        randomize_questions, randomize_options, order_index
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                db.query(insertQuery, [
                    courseId, title, description, instructions, 
                    time_limit_minutes || 60, passing_score || 80, max_attempts || 3, 
                    is_active !== false, show_results !== false, 
                    randomize_questions || false, randomize_options || false, order_index || 0
                ], (err, result) => {
                    if (err) {
                        console.error('Error creating quiz:', err);
                        return res.status(500).json({ message: 'Server error' });
                    }

                    db.query('SELECT * FROM quizzes WHERE id = ?', [result.insertId], (err, newQuiz) => {
                        if (err) {
                            console.error('Error fetching new quiz:', err);
                            return res.status(500).json({ message: 'Server error' });
                        }
                        res.status(201).json(newQuiz[0]);
                    });
                });
            }
        );
    } catch (error) {
        console.error('Error creating quiz:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a quiz
app.put('/api/courses/:courseId/quizzes/:quizId', verifyToken, isInstructor, (req, res) => {
    try {
        const { courseId, quizId } = req.params;
        const { 
            title, description, instructions, time_limit_minutes, 
            passing_score, max_attempts, is_active, show_results, 
            randomize_questions, randomize_options, order_index 
        } = req.body;

        // Verify ownership
        const verifyQuery = `
            SELECT q.* FROM quizzes q 
            JOIN courses c ON q.course_id = c.id 
            WHERE q.id = ? AND q.course_id = ? AND c.instructor_id = ?
        `;

        db.query(verifyQuery, [quizId, courseId, req.user.id], (err, quizzes) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Server error' });
            }

            if (quizzes.length === 0) {
                return res.status(403).json({ message: 'Access denied' });
            }

            const updateQuery = `
                UPDATE quizzes SET 
                    title = ?, description = ?, instructions = ?, time_limit_minutes = ?, 
                    passing_score = ?, max_attempts = ?, is_active = ?, show_results = ?, 
                    randomize_questions = ?, randomize_options = ?, order_index = ? 
                WHERE id = ?
            `;

            db.query(updateQuery, [
                title, description, instructions, time_limit_minutes, 
                passing_score, max_attempts, is_active, show_results, 
                randomize_questions, randomize_options, order_index, quizId
            ], (err) => {
                if (err) {
                    console.error('Error updating quiz:', err);
                    return res.status(500).json({ message: 'Server error' });
                }

                db.query('SELECT * FROM quizzes WHERE id = ?', [quizId], (err, updatedQuiz) => {
                    if (err) {
                        console.error('Error fetching updated quiz:', err);
                        return res.status(500).json({ message: 'Server error' });
                    }
                    res.json(updatedQuiz[0]);
                });
            });
        });
    } catch (error) {
        console.error('Error updating quiz:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a quiz
app.delete('/api/courses/:courseId/quizzes/:quizId', verifyToken, isInstructor, (req, res) => {
    try {
        const { courseId, quizId } = req.params;

        // Verify ownership
        const verifyQuery = `
            SELECT q.* FROM quizzes q 
            JOIN courses c ON q.course_id = c.id 
            WHERE q.id = ? AND q.course_id = ? AND c.instructor_id = ?
        `;

        db.query(verifyQuery, [quizId, courseId, req.user.id], (err, quizzes) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Server error' });
            }

            if (quizzes.length === 0) {
                return res.status(403).json({ message: 'Access denied' });
            }

            // Delete related data first
            db.query('DELETE FROM quiz_attempts WHERE quiz_id = ?', [quizId], (err) => {
                if (err) console.error('Error deleting quiz attempts:', err);

                db.query('DELETE FROM quiz_options WHERE question_id IN (SELECT id FROM quiz_questions WHERE quiz_id = ?)', [quizId], (err) => {
                    if (err) console.error('Error deleting quiz options:', err);

                    db.query('DELETE FROM quiz_questions WHERE quiz_id = ?', [quizId], (err) => {
                        if (err) console.error('Error deleting quiz questions:', err);

                        db.query('DELETE FROM quizzes WHERE id = ?', [quizId], (err) => {
                            if (err) {
                                console.error('Error deleting quiz:', err);
                                return res.status(500).json({ message: 'Server error' });
                            }
                            res.json({ message: 'Quiz deleted successfully' });
                        });
                    });
                });
            });
        });
    } catch (error) {
        console.error('Error deleting quiz:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all questions for a quiz
app.get('/api/quizzes/:quizId/questions', verifyToken, (req, res) => {
    try {
        const { quizId } = req.params;

        // Verify access
        const verifyQuery = `
            SELECT q.* FROM quizzes q 
            JOIN courses c ON q.course_id = c.id 
            WHERE q.id = ? AND (c.instructor_id = ? OR c.id IN (SELECT course_id FROM enrollments WHERE user_id = ?))
        `;

        db.query(verifyQuery, [quizId, req.user.id, req.user.id], (err, quizzes) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Server error' });
            }

            if (quizzes.length === 0) {
                return res.status(403).json({ message: 'Access denied' });
            }

            db.query(
                'SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY order_index ASC',
                [quizId],
                (err, questions) => {
                    if (err) {
                        console.error('Error fetching questions:', err);
                        return res.status(500).json({ message: 'Server error' });
                    }

                    // Get options for each question
                    let processedCount = 0;
                    if (questions.length === 0) {
                        return res.json([]);
                    }

                    questions.forEach((question, index) => {
                        db.query(
                            'SELECT id, option_text, is_correct, order_index FROM quiz_options WHERE question_id = ? ORDER BY order_index ASC',
                            [question.id],
                            (err, options) => {
                                if (err) {
                                    console.error('Error fetching options:', err);
                                    questions[index].options = [];
                                } else {
                                    // For students, hide correct answers
                                    if (req.user.role !== 'instructor') {
                                        questions[index].options = options.map(opt => ({
                                            id: opt.id,
                                            option_text: opt.option_text,
                                            order_index: opt.order_index
                                        }));
                                    } else {
                                        questions[index].options = options;
                                    }
                                }

                                processedCount++;
                                if (processedCount === questions.length) {
                                    res.json(questions);
                                }
                            }
                        );
                    });
                }
            );
        });
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new question
app.post('/api/quizzes/:quizId/questions', verifyToken, isInstructor, (req, res) => {
    try {
        const { quizId } = req.params;
        const { question, question_type, correct_answer, explanation, points, order_index, options } = req.body;

        // Verify ownership
        const verifyQuery = `
            SELECT q.* FROM quizzes q 
            JOIN courses c ON q.course_id = c.id 
            WHERE q.id = ? AND c.instructor_id = ?
        `;

        db.query(verifyQuery, [quizId, req.user.id], (err, quizzes) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Server error' });
            }

            if (quizzes.length === 0) {
                return res.status(403).json({ message: 'Access denied' });
            }

            const insertQuery = `
                INSERT INTO quiz_questions (quiz_id, question, question_type, correct_answer, explanation, points, order_index) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            db.query(insertQuery, [
                quizId, question, question_type, correct_answer, explanation, points || 10, order_index || 0
            ], (err, result) => {
                if (err) {
                    console.error('Error creating question:', err);
                    return res.status(500).json({ message: 'Server error' });
                }

                const questionId = result.insertId;

                // Insert options if provided
                if (options && options.length > 0) {
                    let optionsInserted = 0;
                    options.forEach((option, i) => {
                        db.query(
                            'INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES (?, ?, ?, ?)',
                            [questionId, option.text || option, option.text === correct_answer || option === correct_answer, i],
                            (err) => {
                                if (err) console.error('Error inserting option:', err);
                                optionsInserted++;
                                
                                if (optionsInserted === options.length) {
                                    // Update questions count
                                    db.query(
                                        'UPDATE quizzes SET questions_count = (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = ?) WHERE id = ?',
                                        [quizId, quizId],
                                        () => {
                                            db.query('SELECT * FROM quiz_questions WHERE id = ?', [questionId], (err, newQuestion) => {
                                                if (err) {
                                                    console.error('Error fetching new question:', err);
                                                    return res.status(500).json({ message: 'Server error' });
                                                }
                                                res.status(201).json(newQuestion[0]);
                                            });
                                        }
                                    );
                                }
                            }
                        );
                    });
                } else {
                    // Update questions count
                    db.query(
                        'UPDATE quizzes SET questions_count = (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = ?) WHERE id = ?',
                        [quizId, quizId],
                        () => {
                            db.query('SELECT * FROM quiz_questions WHERE id = ?', [questionId], (err, newQuestion) => {
                                if (err) {
                                    console.error('Error fetching new question:', err);
                                    return res.status(500).json({ message: 'Server error' });
                                }
                                res.status(201).json(newQuestion[0]);
                            });
                        }
                    );
                }
            });
        });
    } catch (error) {
        console.error('Error creating question:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Submit quiz attempt (for students)
app.post('/api/quizzes/:quizId/submit', verifyToken, (req, res) => {
    try {
        const { quizId } = req.params;
        const { answers, started_at } = req.body;

        // Get quiz details
        db.query('SELECT * FROM quizzes WHERE id = ?', [quizId], (err, quizzes) => {
            if (err || quizzes.length === 0) {
                console.error('Error fetching quiz:', err);
                return res.status(404).json({ message: 'Quiz not found' });
            }
            const quiz = quizzes[0];

            // Get all questions with correct answers
            db.query(
                'SELECT * FROM quiz_questions WHERE quiz_id = ?',
                [quizId],
                (err, questions) => {
                    if (err) {
                        console.error('Error fetching questions:', err);
                        return res.status(500).json({ message: 'Server error' });
                    }

                    let correctAnswers = 0;
                    let wrongAnswers = 0;
                    let unanswered = 0;
                    let totalPoints = 0;
                    let earnedPoints = 0;

                    questions.forEach(question => {
                        totalPoints += question.points;
                        const userAnswer = answers[question.id];

                        if (!userAnswer || userAnswer.trim() === '') {
                            unanswered++;
                        } else {
                            if (userAnswer === question.correct_answer) {
                                correctAnswers++;
                                earnedPoints += question.points;
                            } else {
                                wrongAnswers++;
                            }
                        }
                    });

                    const totalQuestions = questions.length;
                    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
                    const isPassed = percentage >= quiz.passing_score;

                    // Calculate time taken
                    const startTime = new Date(started_at);
                    const endTime = new Date();
                    const timeTakenMinutes = Math.round((endTime - startTime) / 60000);

                    // Get attempt number
                    db.query(
                        'SELECT MAX(attempt_number) as max_attempt FROM quiz_attempts WHERE user_id = ? AND quiz_id = ?',
                        [req.user.id, quizId],
                        (err, attempts) => {
                            const attemptNumber = (attempts[0]?.max_attempt || 0) + 1;

                            // Insert attempt
                            const insertQuery = `
                                INSERT INTO quiz_attempts (
                                    user_id, quiz_id, attempt_number, score, percentage, total_questions, 
                                    correct_answers, wrong_answers, unanswered, is_passed, answers, 
                                    started_at, completed_at, time_taken_minutes, ip_address, user_agent
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)
                            `;

                            db.query(insertQuery, [
                                req.user.id, quizId, attemptNumber, earnedPoints, percentage, totalQuestions,
                                correctAnswers, wrongAnswers, unanswered, isPassed, JSON.stringify(answers),
                                started_at, timeTakenMinutes, req.ip, req.get('user-agent')
                            ], (err, result) => {
                                if (err) {
                                    console.error('Error submitting quiz:', err);
                                    return res.status(500).json({ message: 'Server error' });
                                }

                                res.json({
                                    id: result.insertId,
                                    quiz_id: quizId,
                                    attempt_number: attemptNumber,
                                    score: earnedPoints,
                                    percentage,
                                    total_questions: totalQuestions,
                                    correct_answers: correctAnswers,
                                    wrong_answers: wrongAnswers,
                                    unanswered,
                                    passed: isPassed,
                                    completed_at: new Date().toISOString()
                                });
                            });
                        }
                    );
                }
            );
        });
    } catch (error) {
        console.error('Error submitting quiz:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user quiz attempts
app.get('/api/courses/:courseId/quiz-attempts', verifyToken, (req, res) => {
    try {
        const { courseId } = req.params;

        const query = `
            SELECT qa.*, q.title as quiz_title 
            FROM quiz_attempts qa 
            JOIN quizzes q ON qa.quiz_id = q.id 
            WHERE qa.user_id = ? AND q.course_id = ? 
            ORDER BY qa.completed_at DESC
        `;

        db.query(query, [req.user.id, courseId], (err, attempts) => {
            if (err) {
                console.error('Error fetching quiz attempts:', err);
                return res.status(500).json({ message: 'Server error' });
            }
            res.json(attempts);
        });
    } catch (error) {
        console.error('Error fetching quiz attempts:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Example backend (Node.js/Express)
app.delete('/api/admin/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.role === 'instructor' && await Course.exists({ instructorId: user.id })) {
            return res.status(400).json({ message: 'Cannot delete instructor with active courses' });
        }
        await user.delete();
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});
// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Uploads directory: ${uploadsDir}`);
});