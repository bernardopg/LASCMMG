const { logger } = require('../logger/logger');

/**
 * Middleware to check if the authenticated user has one of the required roles.
 * This middleware should be used AFTER authMiddleware.
 *
 * @param {string|string[]} requiredRoles - A single role string or an array of allowed role strings.
 * @returns {function} Express middleware function.
 */
const roleMiddleware = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      logger.warn(
        'RoleMiddleware',
        'User or user role not found in request. Ensure authMiddleware runs first.',
        { requestId: req.id, ip: req.ip }
      );
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const userRole = req.user.role;
    const rolesToCheck = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    if (rolesToCheck.includes(userRole)) {
      next(); // User has one of the required roles
    } else {
      logger.warn(
        'RoleMiddleware',
        `Access denied for user ${req.user.username} (role: ${userRole}). Required roles: ${rolesToCheck.join(', ')}.`,
        { requestId: req.id, ip: req.ip, path: req.originalUrl }
      );
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have the necessary permissions to access this resource.',
      });
    }
  };
};

module.exports = {
  roleMiddleware,
};
