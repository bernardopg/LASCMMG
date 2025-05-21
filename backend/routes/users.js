const express = require('express');
const router = express.Router();
const userModel = require('../lib/models/userModel');
const { logger } = require('../lib/logger/logger');
const {
  validateUsername,
  validatePassword,
} = require('../lib/utils/validationUtils'); // Assuming validation utils exist or will be created

// User Registration
router.post('/register', async (req, res, next) => {
  const { username, password } = req.body;

  try {
    // Validate input
    if (!validateUsername(username)) {
      return res.status(400).json({ message: 'Invalid username format.' });
    }
    if (!validatePassword(password)) {
      // Password validation should be more specific in validatePassword
      return res
        .status(400)
        .json({ message: 'Password does not meet complexity requirements.' });
    }

    const newUser = await userModel.createUser({
      username,
      password,
      ipAddress: req.ip,
    });
    logger.info('UserRoutes', `User ${username} registered successfully.`);
    // Do not send back the full user object, especially not password hashes
    res.status(201).json({
      message: 'User registered successfully.',
      userId: newUser.id, // Send back only necessary, non-sensitive info
      username: newUser.username,
    });
  } catch (error) {
    logger.error(
      'UserRoutes',
      `Error during user registration for ${username}: ${error.message}`,
      { error }
    );
    if (error.message === 'Username already taken') {
      return res.status(409).json({ message: error.message });
    }
    if (error.message === 'Password must be at least 8 characters long') {
      return res.status(400).json({ message: error.message });
    }
    // For other errors, send a generic message
    next(error); // Pass to global error handler
  }
});

// User Login
router.post('/login', async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: 'Username and password are required.' });
  }

  try {
    const authResult = await userModel.authenticateUser(
      username,
      password,
      req.ip
    ); // Pass req.ip

    if (authResult.success) {
      logger.info('UserRoutes', `User ${username} logged in successfully.`);
      res.json({
        message: authResult.message,
        token: authResult.token,
        user: authResult.user, // Contains id, username, role
      });
    } else {
      logger.warn(
        'UserRoutes',
        `Failed login attempt for ${username}: ${authResult.message}`
      );
      // Use a generic message for failed login attempts to avoid user enumeration
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
  } catch (error) {
    logger.error(
      'UserRoutes',
      `Error during user login for ${username}: ${error.message}`,
      { error }
    );
    next(error); // Pass to global error handler
  }
});

// TODO: Add route for password change (e.g., PUT /users/password)
// This would require authentication (e.g., JWT middleware)

module.exports = router;
