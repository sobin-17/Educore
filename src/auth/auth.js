// auth.js - Authentication API functions
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'elearning',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// JWT secret key (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Helper function to generate JWT token
const generateToken = (userId, email, role) => {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Helper function to hash password
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Helper function to verify password
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Register user
export const registerUser = async (userData) => {
  const {
    name,
    email,
    password,
    role = 'student',
    bio = '',
    phone = '',
    dateOfBirth = null,
    gender = null,
    country = '',
    profileImage = null
  } = userData;

  try {
    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert new user
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password, role, bio, phone, date_of_birth, gender, country, profile_image) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, role, bio, phone, dateOfBirth, gender, country, profileImage]
    );

    const userId = result.insertId;

    // Generate token
    const token = generateToken(userId, email, role);

    // Store session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await pool.execute(
      'INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
      [userId, token, expiresAt]
    );

    return {
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        name,
        email,
        role,
        bio,
        phone,
        dateOfBirth,
        gender,
        country,
        profileImage
      }
    };

  } catch (error) {
    console.error('Registration error:', error);
    throw new Error(error.message || 'Registration failed');
  }
};

// Login user
export const loginUser = async (email, password) => {
  try {
    // Find user by email
    const [users] = await pool.execute(
      `SELECT id, name, email, password, role, bio, phone, date_of_birth, 
              gender, country, profile_image, is_active 
       FROM users WHERE email = ?`,
      [email]
    );

    if (users.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account has been deactivated');
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    // Clean up old sessions
    await pool.execute(
      'DELETE FROM user_sessions WHERE user_id = ? AND expires_at < NOW()',
      [user.id]
    );

    // Store new session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await pool.execute(
      'INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, token, expiresAt]
    );

    // Remove password from user object
    delete user.password;

    return {
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        phone: user.phone,
        dateOfBirth: user.date_of_birth,
        gender: user.gender,
        country: user.country,
        profileImage: user.profile_image
      }
    };

  } catch (error) {
    console.error('Login error:', error);
    throw new Error(error.message || 'Login failed');
  }
};

// Verify token and get user
export const verifyToken = async (token) => {
  try {
    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if session exists and is valid
    const [sessions] = await pool.execute(
      `SELECT s.id, s.user_id, u.name, u.email, u.role, u.is_active
       FROM user_sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = ? AND s.expires_at > NOW()`,
      [token]
    );

    if (sessions.length === 0) {
      throw new Error('Invalid or expired token');
    }

    const session = sessions[0];

    if (!session.is_active) {
      throw new Error('Account has been deactivated');
    }

    return {
      success: true,
      user: {
        id: session.user_id,
        name: session.name,
        email: session.email,
        role: session.role
      }
    };

  } catch (error) {
    console.error('Token verification error:', error);
    throw new Error('Invalid or expired token');
  }
};

// Logout user
export const logoutUser = async (token) => {
  try {
    await pool.execute(
      'DELETE FROM user_sessions WHERE token = ?',
      [token]
    );

    return {
      success: true,
      message: 'Logged out successfully'
    };

  } catch (error) {
    console.error('Logout error:', error);
    throw new Error('Logout failed');
  }
};

// Update user profile
export const updateUserProfile = async (userId, updateData) => {
  try {
    const allowedFields = ['name', 'bio', 'phone', 'date_of_birth', 'gender', 'country', 'profile_image'];
    const updates = [];
    const values = [];

    // Build dynamic update query
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(userId);

    await pool.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated user data
    const [users] = await pool.execute(
      `SELECT id, name, email, role, bio, phone, date_of_birth, 
              gender, country, profile_image 
       FROM users WHERE id = ?`,
      [userId]
    );

    return {
      success: true,
      message: 'Profile updated successfully',
      user: users[0]
    };

  } catch (error) {
    console.error('Profile update error:', error);
    throw new Error(error.message || 'Profile update failed');
  }
};

// Change password
export const changePassword = async (userId, oldPassword, newPassword) => {
  try {
    // Get current password
    const [users] = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw new Error('User not found');
    }

    // Verify old password
    const isOldPasswordValid = await verifyPassword(oldPassword, users[0].password);
    if (!isOldPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedNewPassword, userId]
    );

    // Invalidate all existing sessions except current one
    await pool.execute(
      'DELETE FROM user_sessions WHERE user_id = ?',
      [userId]
    );

    return {
      success: true,
      message: 'Password changed successfully'
    };

  } catch (error) {
    console.error('Password change error:', error);
    throw new Error(error.message || 'Password change failed');
  }
};