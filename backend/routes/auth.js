const express = require('express');
const adminModel = require('../lib/models/adminModel');
const router = express.Router();
const { logger } = require('../lib/logger/logger');
const {
  validateRequest,
  adminLoginSchema,
  changePasswordSchema,
} = require('../lib/utils/validationUtils'); // Import validation utilities
const { authMiddleware } = require('../lib/middleware/authMiddleware'); // Import authMiddleware

const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/auth/login',
  loginLimiter,
  validateRequest(adminLoginSchema),
  async (req, res) => {
    // Changed path to /auth/login
    // Validation is now handled by validateRequest middleware using adminLoginSchema
    // req.body will contain validated and potentially sanitized data.
    const { username, password } = req.body;

    // Basic presence check can be removed as Joi handles 'required'
    // if (
    //   !username ||
    //   !password ||
    //   typeof username !== 'string' ||
    //   typeof password !== 'string'
    // ) {
    //   logger.warn(
    //     {
    //       message: 'Tentativa de login com dados inválidos.',
    //       username,
    //       requestId: req.id,
    //       ip: req.ip,
    //     },
    //     'Tentativa de login com dados inválidos.'
    //   );
    //   return res
    //     .status(400)
    //     .json({ success: false, message: 'Usuário e senha são obrigatórios.' });
    // }

    try {
      const authResult = await adminModel.authenticateAdmin(
        username,
        password,
        req.ip
      ); // Pass req.ip

      if (authResult.success) {
        logger.info(
          { username, success: true, requestId: req.id, ip: req.ip },
          'Login bem-sucedido'
        );
        res.json(authResult);
      } else {
        logger.warn(
          {
            username,
            success: false,
            message: authResult.message,
            requestId: req.id,
            ip: req.ip,
          },
          'Falha na autenticação'
        );
        res.status(401).json(authResult);
      }
    } catch (error) {
      logger.error(
        { err: error, username, requestId: req.id, ip: req.ip },
        'Erro interno durante autenticação.'
      );
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor durante o login.',
      });
    }
  }
);

router.post(
  '/change-password',
  authMiddleware,
  validateRequest(changePasswordSchema),
  async (req, res) => {
    // authMiddleware ensures user is authenticated.
    // validateRequest ensures body has username, currentPassword, newPassword with correct formats.
    const { username, currentPassword, newPassword } = req.body;

    // It's generally good practice for a user to only be able to change their own password.
    // The `username` in the body should match `req.user.username` from the token.
    if (req.user.username !== username) {
      logger.warn(
        'AuthRoutes',
        `Tentativa de alterar senha para usuário diferente do autenticado. Autenticado: ${req.user.username}, Alvo: ${username}`,
        { requestId: req.id, ip: req.ip }
      );
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a alterar a senha de outro usuário.',
      });
    }

    // Manual validation can be removed
    // if (
    //   !username ||
    //   !currentPassword ||
    //   !newPassword ||
    //   typeof username !== 'string' ||
    //   typeof currentPassword !== 'string' ||
    //   typeof newPassword !== 'string'
    // ) {
    //   logger.warn(
    //     {
    //       message: 'Tentativa de alterar senha com dados inválidos.',
    //       username,
    //       requestId: req.id,
    //       ip: req.ip,
    //     },
    //     'Tentativa de alterar senha com dados inválidos.'
    //   );
    //   return res.status(400).json({
    //     success: false,
    //     message:
    //       'Usuário, senha atual e nova senha (como strings) são obrigatórios.',
    //   });
    // }

    try {
      const result = await adminModel.changePassword(
        username,
        currentPassword,
        newPassword,
        req.ip // Pass req.ip
      );

      if (result.success) {
        logger.info(
          { username, success: true, requestId: req.id, ip: req.ip },
          'Senha alterada com sucesso'
        );
        res.json(result);
      } else {
        logger.warn(
          {
            username,
            success: false,
            message: result.message,
            requestId: req.id,
            ip: req.ip,
          },
          'Falha ao alterar senha'
        );
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error(
        { err: error, username, requestId: req.id, ip: req.ip },
        'Erro interno ao alterar senha.'
      );
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao alterar senha.',
      });
    }
  }
);

// authMiddleware is already imported at the top

// Rota para obter informações do usuário logado (baseado no token)
router.get('/me', authMiddleware, async (req, res) => {
  // Se o authMiddleware passar, req.user estará populado
  // Retornar apenas os dados relevantes e não sensíveis do usuário
  if (req.user) {
    const { id, username, name, role } = req.user; // Ajuste conforme a estrutura do seu objeto user
    logger.info(
      {
        username: req.user.username,
        success: true,
        requestId: req.id,
        ip: req.ip,
      },
      'Dados do usuário atual recuperados com sucesso.'
    );
    res.json({ success: true, user: { id, username, name, role } });
  } else {
    // Isso não deveria acontecer se authMiddleware estiver funcionando corretamente
    logger.error(
      { requestId: req.id, ip: req.ip },
      'Erro: /api/auth/me acessado mas req.user não definido após authMiddleware.'
    );
    res
      .status(401)
      .json({ success: false, message: 'Não autenticado ou token inválido.' });
  }
});

router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // req.user é garantido pelo authMiddleware
    const username = req.user.username;

    if (req.revokeToken) {
      const result = await req.revokeToken(); // Await the async function
      if (result) {
        logger.info(
          { username, success: true, requestId: req.id, ip: req.ip },
          'Logout (token revogado) realizado com sucesso.'
        );
        return res.json({
          success: true,
          message: 'Logout realizado com sucesso.',
        });
      }
    }
    logger.info(
      { username, success: true, requestId: req.id, ip: req.ip },
      'Logout processado (sem revogação de token ou falha na revogação).'
    );
    return res.json({ success: true, message: 'Logout processado.' });
  } catch (error) {
    const username = req.user ? req.user.username : 'unknown_user_on_error';
    logger.error(
      { err: error, username, requestId: req.id, ip: req.ip },
      'Erro interno ao processar logout.'
    );
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao processar logout.',
    });
  }
});

module.exports = router;
