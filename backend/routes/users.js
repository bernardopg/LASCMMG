const express = require('express');
const router = express.Router();
const userModel = require('../lib/models/userModel');
const { logger } = require('../lib/logger/logger');
const {
  validateRequest,
  userRegistrationSchema,
  userPasswordChangeSchema,
  userLoginSchema,
} = require('../lib/utils/validationUtils');
const {
  authMiddleware,
  // Import functions for failed login attempts for regular users
  trackFailedAttempt,
  isUserLockedOut,
  clearFailedAttempts,
  AUTH_CONFIG, // For lockout message consistency
  updateUserActivity, // For updating activity on successful login
} = require('../lib/middleware/authMiddleware');

// User Registration
router.post('/register', validateRequest(userRegistrationSchema), async (req, res, next) => {
  // username and password are now validated by userRegistrationSchema
  const { username, password } = req.body;

  try {
    const newUser = await userModel.createUser({
      username, // Joi schema ensures this is a valid email
      password, // Joi schema ensures this meets complexity requirements
      ipAddress: req.ip,
    });
    logger.info('UserRoutes', `User ${username} registered successfully.`);
    res.status(201).json({
      success: true, // Added for consistency
      message: 'User registered successfully.',
      userId: newUser.id,
      username: newUser.username,
    });
  } catch (error) {
    logger.error(
      'UserRoutes',
      `Error during user registration for ${username}: ${error.message}`,
      { error, requestId: req.id } // Added requestId
    );
    if (error.message === 'Username already taken') {
      return res.status(409).json({ success: false, message: error.message });
    }
    // Password complexity errors are now handled by Joi, so specific check for "Password must be at least 8 characters long" is less likely here.
    // Joi will return a 400 with detailed messages.
    next(error);
  }
});

// User Login
router.post('/login', validateRequest(userLoginSchema), async (req, res, next) => {
  // username and password are now validated by userLoginSchema
  const { username, password } = req.body;

  // Manual check for username/password presence is no longer needed due to Joi validation.
  // if (!username || !password) { // No longer needed due to Joi
  //   return res
  //     .status(400)
  //     .json({ message: 'Username and password are required.' });
  // }

  try {
    if (await isUserLockedOut(username)) {
      logger.warn(
        { component: 'UserRoutes', username, ip: req.ip, requestId: req.id },
        `Tentativa de login para usuário ${username} bloqueado (lockout).`
      );
      return res.status(429).json({
        success: false,
        message: `Muitas tentativas de login falhas. Conta bloqueada por ${AUTH_CONFIG.lockoutDurationMinutes} minutos.`,
      });
    }

    const authResult = await userModel.authenticateUser(username, password, req.ip);

    if (authResult.success) {
      if (authResult.user && authResult.user.id) {
        await clearFailedAttempts(username);
        await updateUserActivity(authResult.user.id); // Update activity on successful login
        logger.info(
          {
            component: 'UserRoutes',
            username,
            userId: authResult.user.id,
            success: true,
            requestId: req.id,
            ip: req.ip,
          },
          'User login bem-sucedido, tentativas falhas limpas e atividade registrada.'
        );
      } else {
        logger.warn(
          { component: 'UserRoutes', username, success: true, requestId: req.id, ip: req.ip },
          'User login bem-sucedido, mas ID do usuário não encontrado no resultado.'
        );
      }
      res.json({
        success: true,
        message: authResult.message,
        token: authResult.token,
        user: authResult.user,
      });
    } else {
      await trackFailedAttempt(username);
      logger.warn(
        'UserRoutes',
        `Failed login attempt for user ${username}: ${authResult.message}`,
        { requestId: req.id, ip: req.ip }
      );
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
  } catch (error) {
    logger.error(
      'UserRoutes',
      `Error during user login for ${username}: ${error.message}`,
      { error, requestId: req.id } // Added requestId
    );
    next(error);
  }
});

// Rota para alteração de senha do usuário logado
router.put(
  '/password',
  authMiddleware,
  validateRequest(userPasswordChangeSchema),
  async (req, res, next) => {
    // currentPassword and newPassword are now validated by userPasswordChangeSchema
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // authMiddleware ensures req.user.id exists

    try {
      // userModel.updatePasswordById now returns an object { success: boolean, message: string }
      const result = await userModel.updatePasswordById(
        userId,
        currentPassword,
        newPassword,
        req.ip // Pass IP for audit log
      );

      if (result.success) {
        logger.info('UserRoutes', `Senha alterada com sucesso para o usuário ID ${userId}.`, {
          requestId: req.id,
        });
        res.json({ success: true, message: result.message });
      } else {
        // Determine appropriate status code based on the message from the model
        // e.g., 400 for "Nova senha não pode ser igual à senha atual." or "Senha atual incorreta."
        // e.g., 404 for "Usuário não encontrado."
        const statusCode = result.message.includes('não encontrado') ? 404 : 400;
        logger.warn(
          'UserRoutes',
          `Tentativa de alteração de senha falhou para o usuário ID ${userId}: ${result.message}`,
          { requestId: req.id }
        );
        res.status(statusCode).json({ success: false, message: result.message });
      }
    } catch (error) {
      // This catch block is for unexpected errors during the process
      logger.error(
        'UserRoutes',
        `Erro ao alterar senha para o usuário ID ${userId}: ${error.message}`,
        { error, requestId: req.id }
      );
      next(error);
    }
  }
);

module.exports = router;
