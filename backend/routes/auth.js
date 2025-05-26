const express = require('express');
const adminModel = require('../lib/models/adminModel');
const userModel = require('../lib/models/userModel');
const router = express.Router();
const { logger } = require('../lib/logger/logger');
const {
  validateRequest,
  adminLoginSchema,
  changePasswordSchema,
  refreshTokenSchema,
  userRegistrationSchema,
} = require('../lib/utils/validationUtils');
const {
  authMiddleware,
  updateUserActivity,
  trackFailedAttempt,
  isUserLockedOut,
  clearFailedAttempts,
  AUTH_CONFIG, // Import AUTH_CONFIG for lockout message
} = require('../lib/middleware/authMiddleware');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRATION } = require('../lib/config/config');
const crypto = require('crypto');

const rateLimit = require('express-rate-limit');

// Rate limiters específicos
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 tentativas por IP
  message: {
    success: false,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // máximo 3 tentativas de recuperação por IP por hora
  message: {
    success: false,
    message: 'Muitas tentativas de recuperação de senha. Tente novamente em 1 hora.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas de registro por IP por 15 minutos
  message: {
    success: false,
    message: 'Muitas tentativas de registro. Tente novamente em 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/auth/login', loginLimiter, validateRequest(adminLoginSchema), async (req, res) => {
  const { username, password, rememberMe } = req.body; // username is validated as email by adminLoginSchema

  try {
    if (await isUserLockedOut(username)) {
      logger.warn(
        { component: 'AuthRoute', username, ip: req.ip, requestId: req.id },
        `Tentativa de login para admin ${username} bloqueado (lockout).`
      );
      return res.status(429).json({
        success: false,
        message: `Conta temporariamente bloqueada devido a múltiplas tentativas de login incorretas. Tente novamente em ${AUTH_CONFIG.lockoutDurationMinutes} minutos.`,
        errorCode: 'ACCOUNT_LOCKED',
        retryAfter: AUTH_CONFIG.lockoutDurationMinutes * 60, // em segundos
      });
    }

    const authResult = await adminModel.authenticateAdmin(username, password, req.ip, rememberMe);

    if (authResult.success) {
      if (authResult.admin && authResult.admin.id) {
        await clearFailedAttempts(username);
        await updateUserActivity(authResult.admin.id); // Register initial activity
        logger.info(
          { username, userId: authResult.admin.id, success: true, requestId: req.id, ip: req.ip },
          'Admin login bem-sucedido, tentativas falhas limpas e atividade registrada.'
        );
      } else {
        // Should not happen if authResult.success is true and adminModel.authenticateAdmin is consistent
        logger.warn(
          { username, success: true, requestId: req.id, ip: req.ip },
          'Admin login bem-sucedido, mas ID do usuário não encontrado no resultado para registrar atividade ou limpar tentativas.'
        );
      }
      res.json({
        success: true,
        message: 'Login realizado com sucesso.',
        token: authResult.token,
        refreshToken: authResult.refreshToken,
        admin: authResult.admin,
        expiresIn: authResult.expiresIn,
      });
    } else {
      await trackFailedAttempt(username);
      logger.warn(
        {
          username,
          success: false,
          message: authResult.message,
          requestId: req.id,
          ip: req.ip,
        },
        'Falha na autenticação do admin.'
      );
      res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.',
        errorCode: 'INVALID_CREDENTIALS',
      });
    }
  } catch (error) {
    // Log internal server errors, but avoid tracking them as failed login attempts for specific user
    logger.error(
      { err: error, username, requestId: req.id, ip: req.ip },
      'Erro interno durante autenticação.'
    );
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor. Tente novamente em alguns minutos.',
      errorCode: 'INTERNAL_ERROR',
    });
  }
});

router.post(
  '/change-password',
  authMiddleware,
  validateRequest(changePasswordSchema),
  async (req, res) => {
    const { username, currentPassword, newPassword } = req.body;

    if (req.user.username !== username) {
      logger.warn(
        'AuthRoutes',
        `Tentativa de alterar senha para usuário diferente do autenticado. Autenticado: ${req.user.username}, Alvo: ${username}`,
        { requestId: req.id, ip: req.ip }
      );
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a alterar a senha de outro usuário.',
        errorCode: 'UNAUTHORIZED',
      });
    }

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
        res.json({
          success: true,
          message: 'Senha alterada com sucesso.',
        });
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
        res.status(400).json({
          success: false,
          message: result.message,
          errorCode: 'PASSWORD_CHANGE_FAILED',
        });
      }
    } catch (error) {
      logger.error(
        { err: error, username, requestId: req.id, ip: req.ip },
        'Erro interno ao alterar senha.'
      );
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao alterar senha.',
        errorCode: 'INTERNAL_ERROR',
      });
    }
  }
);

// Rota para solicitar recuperação de senha
router.post('/auth/forgot-password', passwordResetLimiter, async (req, res) => {
  const { email } = req.body;

  // Validação básica do email
  if (!email || !email.includes('@')) {
    return res.status(400).json({
      success: false,
      message: 'Email inválido.',
      errorCode: 'INVALID_EMAIL',
    });
  }

  try {
    // Por segurança, sempre retorna sucesso mesmo se o email não existir
    // Isso previne enumeração de usuários
    logger.info(
      { email, ip: req.ip, requestId: req.id },
      'Solicitação de recuperação de senha recebida.'
    );

    // TODO: Implementar envio de email de recuperação
    // Por ora, apenas logamos a tentativa
    res.json({
      success: true,
      message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.',
    });
  } catch (error) {
    logger.error(
      { err: error, email, requestId: req.id, ip: req.ip },
      'Erro interno ao processar recuperação de senha.'
    );
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor. Tente novamente em alguns minutos.',
      errorCode: 'INTERNAL_ERROR',
    });
  }
});

// Rota para redefinir senha com token
router.post('/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Token e nova senha são obrigatórios.',
      errorCode: 'MISSING_FIELDS',
    });
  }

  try {
    // TODO: Implementar validação do token e redefinição da senha
    logger.info({ ip: req.ip, requestId: req.id }, 'Tentativa de redefinição de senha com token.');

    res.json({
      success: false,
      message: 'Funcionalidade de redefinição de senha ainda não implementada.',
      errorCode: 'NOT_IMPLEMENTED',
    });
  } catch (error) {
    logger.error({ err: error, requestId: req.id, ip: req.ip }, 'Erro interno ao redefinir senha.');
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor. Tente novamente em alguns minutos.',
      errorCode: 'INTERNAL_ERROR',
    });
  }
});

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
    res.json({
      success: true,
      user: { id, username, name, role },
    });
  } else {
    // Isso não deveria acontecer se authMiddleware estiver funcionando corretamente
    logger.error(
      { requestId: req.id, ip: req.ip },
      'Erro: /api/auth/me acessado mas req.user não definido após authMiddleware.'
    );
    res.status(401).json({
      success: false,
      message: 'Não autenticado ou token inválido.',
      errorCode: 'UNAUTHORIZED',
    });
  }
});

router.post('/auth/logout', authMiddleware, async (req, res) => {
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
    return res.json({
      success: true,
      message: 'Logout realizado com sucesso.',
    });
  } catch (error) {
    const username = req.user ? req.user.username : 'unknown_user_on_error';
    logger.error(
      { err: error, username, requestId: req.id, ip: req.ip },
      'Erro interno ao processar logout.'
    );
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao processar logout.',
      errorCode: 'INTERNAL_ERROR',
    });
  }
});

// Rota para refresh token
router.post('/auth/refresh-token', validateRequest(refreshTokenSchema), async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Verificar se o token existe
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token não fornecido.',
        errorCode: 'MISSING_REFRESH_TOKEN',
      });
    }

    // Recuperar usuário do refresh token (aqui você deverá implementar uma lógica específica de verificação)
    // Essa implementação depende de como você deseja armazenar e validar os refresh tokens
    try {
      // Verificar o refresh token no Redis ou banco de dados
      const isValid = await adminModel.validateRefreshToken(refreshToken);

      if (!isValid.success || !isValid.userId) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token inválido ou expirado. Faça login novamente.',
          errorCode: 'INVALID_REFRESH_TOKEN',
        });
      }

      // Gerar novo access token
      const newToken = jwt.sign(
        { id: isValid.userId, username: isValid.username, role: isValid.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION, jwtid: crypto.randomUUID() }
      );

      // Gerar novo refresh token
      const newRefreshToken = await adminModel.generateRefreshToken(isValid.userId);

      // Atualizar atividade do usuário ao emitir novo token de acesso
      await updateUserActivity(isValid.userId);

      logger.info(
        {
          username: isValid.username,
          userId: isValid.userId,
          success: true,
          requestId: req.id,
          ip: req.ip,
        },
        'Token atualizado com sucesso via refresh token e atividade do usuário registrada.'
      );

      return res.json({
        success: true,
        token: newToken,
        refreshToken: newRefreshToken,
        expiresIn: parseInt(JWT_EXPIRATION) || 86400, // Converte para segundos
        message: 'Token atualizado com sucesso.',
      });
    } catch (tokenError) {
      logger.error(
        { err: tokenError, requestId: req.id, ip: req.ip },
        'Erro ao verificar refresh token.'
      );
      return res.status(401).json({
        success: false,
        message: 'Refresh token inválido ou expirado. Faça login novamente.',
        errorCode: 'INVALID_REFRESH_TOKEN',
      });
    }
  } catch (error) {
    logger.error(
      { err: error, requestId: req.id, ip: req.ip },
      'Erro interno durante refresh de token.'
    );
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor durante o refresh de token.',
      errorCode: 'INTERNAL_ERROR',
    });
  }
});

// Rota para registro de usuários regulares
router.post(
  '/auth/register',
  registrationLimiter,
  validateRequest(userRegistrationSchema),
  async (req, res) => {
    const { username, password } = req.body;

    try {
      // Verificar se usuário já existe
      const userExists = await userModel.userExists(username);
      if (userExists) {
        logger.warn(
          { username, ip: req.ip, requestId: req.id },
          'Tentativa de registro com email já existente.'
        );
        return res.status(409).json({
          success: false,
          message: 'Este email já está cadastrado. Tente fazer login ou use outro email.',
          errorCode: 'EMAIL_ALREADY_EXISTS',
        });
      }

      // Criar novo usuário
      const newUser = await userModel.createUser({
        username,
        password,
        ipAddress: req.ip,
      });

      logger.info(
        { username: newUser.username, userId: newUser.id, ip: req.ip, requestId: req.id },
        'Usuário regular registrado com sucesso.'
      );

      // Gerar token para o novo usuário
      const token = jwt.sign(
        { id: newUser.id, username: newUser.username, role: newUser.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION, jwtid: crypto.randomUUID() }
      );

      res.status(201).json({
        success: true,
        message: 'Usuário registrado com sucesso! Bem-vindo ao LASCMMG.',
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
        },
        expiresIn: parseInt(JWT_EXPIRATION) || 86400,
      });
    } catch (error) {
      if (error.message === 'Username already taken') {
        logger.warn(
          { username, ip: req.ip, requestId: req.id },
          'Tentativa de registro com email já existente (erro do model).'
        );
        return res.status(409).json({
          success: false,
          message: 'Este email já está cadastrado. Tente fazer login ou use outro email.',
          errorCode: 'EMAIL_ALREADY_EXISTS',
        });
      }

      logger.error(
        { err: error, username, ip: req.ip, requestId: req.id },
        'Erro interno durante registro de usuário.'
      );
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor durante o registro. Tente novamente em alguns minutos.',
        errorCode: 'INTERNAL_ERROR',
      });
    }
  }
);

module.exports = router;
