const express = require('express');
const adminModel = require('../lib/models/adminModel');
const router = express.Router();
const { logger } = require('../lib/logger/logger');
const {
  validateRequest,
  adminLoginSchema,
  changePasswordSchema,
  refreshTokenSchema,
} = require('../lib/utils/validationUtils'); // Adicionado refreshTokenSchema
const { authMiddleware } = require('../lib/middleware/authMiddleware'); // Import authMiddleware
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRATION } = require('../lib/config/config');
const crypto = require('crypto');

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
    const { username, password, rememberMe } = req.body;

    try {
      const authResult = await adminModel.authenticateAdmin(
        username,
        password,
        req.ip,
        rememberMe
      ); // Pass req.ip and rememberMe

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

// Rota para refresh token
router.post('/auth/refresh-token', validateRequest(refreshTokenSchema), async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Verificar se o token existe
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token não fornecido.'
      });
    }

    // Recuperar usuário do refresh token (aqui você deverá implementar uma lógica específica de verificação)
    // Essa implementação depende de como você deseja armazenar e validar os refresh tokens
    try {
      // Verificar o refresh token no Redis ou banco de dados
      const isValid = await adminModel.validateRefreshToken(refreshToken);

      if (!isValid.success) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token inválido ou expirado.'
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

      logger.info(
        { username: isValid.username, success: true, requestId: req.id, ip: req.ip },
        'Token atualizado com sucesso via refresh token'
      );

      return res.json({
        success: true,
        token: newToken,
        refreshToken: newRefreshToken,
        expiresIn: parseInt(JWT_EXPIRATION) || 86400, // Converte para segundos
        message: 'Token atualizado com sucesso.'
      });

    } catch (tokenError) {
      logger.error(
        { err: tokenError, requestId: req.id, ip: req.ip },
        'Erro ao verificar refresh token.'
      );
      return res.status(401).json({
        success: false,
        message: 'Refresh token inválido ou expirado.'
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
    });
  }
});

module.exports = router;
