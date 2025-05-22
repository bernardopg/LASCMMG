const jwt = require('jsonwebtoken');
const { JWT_SECRET, SESSION_INACTIVITY_TIMEOUT } = require('../config/config'); // Adicionado SESSION_INACTIVITY_TIMEOUT
const { logger } = require('../logger/logger');
const { getClient } = require('../db/redisClient'); // Import Redis client

const AUTH_CONFIG = {
  failedLoginAttemptsWarning: 3,
  failedLoginAttemptsLockout: 5,
  lockoutDurationMinutes: 15,
  redisFailedAttemptsPrefix: 'failedlogin:',
  redisBlacklistedTokenPrefix: 'jwtblacklist:',
  redisActiveSessionPrefix: 'activesession:', // Para rastrear atividade
};

// Helper function to get Redis client
async function getRedis() {
  const client = await getClient();
  if (!client) {
    logger.error('AuthMiddleware', 'Cliente Redis não disponível.');
    // Depending on how critical Redis is, you might throw an error
    // or allow a fallback (though for these features, fallback is complex).
  }
  return client;
}

// Track failed login attempts
async function trackFailedAttempt(username) {
  const redis = await getRedis();
  if (!redis) return; // Or handle error

  const key = `${AUTH_CONFIG.redisFailedAttemptsPrefix}${username.toLowerCase()}`;
  try {
    const attempts = await redis.incr(key);
    if (attempts === 1) {
      // Set expiration on the first failed attempt for this user
      await redis.expire(key, AUTH_CONFIG.lockoutDurationMinutes * 60);
    }
    return attempts;
  } catch (error) {
    logger.error(
      'AuthMiddleware',
      `Erro ao rastrear tentativa de login falha para ${username} no Redis:`,
      { error: error.message }
    );
  }
}

// Check if user is locked out
async function isUserLockedOut(username) {
  const redis = await getRedis();
  if (!redis) return false; // Or handle error, e.g., assume not locked out if Redis is down

  const key = `${AUTH_CONFIG.redisFailedAttemptsPrefix}${username.toLowerCase()}`;
  try {
    const attempts = await redis.get(key);
    return (
      attempts &&
      parseInt(attempts, 10) >= AUTH_CONFIG.failedLoginAttemptsLockout
    );
  } catch (error) {
    logger.error(
      'AuthMiddleware',
      `Erro ao verificar bloqueio de usuário ${username} no Redis:`,
      { error: error.message }
    );
    return false; // Fail safe: assume not locked out
  }
}

// Clear failed attempts (e.g., on successful login)
async function clearFailedAttempts(username) {
  const redis = await getRedis();
  if (!redis) return;

  const key = `${AUTH_CONFIG.redisFailedAttemptsPrefix}${username.toLowerCase()}`;
  try {
    await redis.del(key);
  } catch (error) {
    logger.error(
      'AuthMiddleware',
      `Erro ao limpar tentativas de login falhas para ${username} no Redis:`,
      { error: error.message }
    );
  }
}

// Blacklist a token (for logout)
async function blacklistToken(token, decodedToken) {
  const redis = await getRedis();
  if (!redis || !decodedToken || !decodedToken.exp) return false;

  const key = `${AUTH_CONFIG.redisBlacklistedTokenPrefix}${token}`;
  // Calculate remaining validity in seconds to set as TTL in Redis
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const expiresInSeconds = decodedToken.exp - nowInSeconds;

  if (expiresInSeconds <= 0) {
    // Token already expired, no need to blacklist
    return true;
  }

  try {
    await redis.set(key, 'blacklisted', { EX: expiresInSeconds });
    return true;
  } catch (error) {
    logger.error(
      'AuthMiddleware',
      'Erro ao adicionar token à blacklist no Redis:',
      { error: error.message }
    );
    return false;
  }
}

// Check if a token is blacklisted
async function isTokenBlacklisted(token) {
  const redis = await getRedis();
  if (!redis) return false; // Fail safe: assume not blacklisted if Redis is down

  const key = `${AUTH_CONFIG.redisBlacklistedTokenPrefix}${token}`;
  try {
    const result = await redis.get(key);
    return result === 'blacklisted';
  } catch (error) {
    logger.error(
      'AuthMiddleware',
      'Erro ao verificar token na blacklist do Redis:',
      { error: error.message }
    );
    return false; // Fail safe
  }
}

// Atualizar o timestamp da última atividade da sessão
async function updateUserActivity(userId) {
  const redis = await getRedis();
  if (!redis) return;

  const key = `${AUTH_CONFIG.redisActiveSessionPrefix}${userId}`;
  try {
    // Define o timestamp atual e define o TTL para corresponder ao timeout de inatividade
    await redis.set(key, Date.now().toString(), { EX: SESSION_INACTIVITY_TIMEOUT });
  } catch (error) {
    logger.error(
      'AuthMiddleware',
      `Erro ao atualizar a atividade do usuário ${userId} no Redis:`,
      { error: error.message }
    );
  }
}

// Verificar se a sessão está inativa (o token pode ainda não ter expirado)
async function isSessionInactive(userId) {
  const redis = await getRedis();
  if (!redis) return false; // Se o Redis estiver inativo, não podemos verificar, então assumimos que não está inativo

  const key = `${AUTH_CONFIG.redisActiveSessionPrefix}${userId}`;
  try {
    const lastActivity = await redis.get(key);
    if (!lastActivity) {
      // Se não houver registro de atividade, a sessão é considerada inativa (ou nunca existiu/foi limpa)
      return true;
    }
    // O Redis cuidará da expiração da chave. Se a chave existir, a sessão está ativa.
    return false;
  } catch (error) {
    logger.error(
      'AuthMiddleware',
      `Erro ao verificar inatividade da sessão para ${userId} no Redis:`,
      { error: error.message }
    );
    return false; // Em caso de erro, assuma que a sessão não está inativa para evitar logout acidental
  }
}

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token =
    authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de autenticação não fornecido.',
    });
  }

  try {
    if (await isTokenBlacklisted(token)) {
      logger.warn('AuthMiddleware', 'Tentativa de uso de token na blacklist.', {
        token_prefix: token.substring(0, 10),
        requestId: req.id,
        ip: req.ip,
      });
      return res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado (revogado).',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Adiciona informações do usuário ao objeto req

    // Verificar inatividade da sessão
    if (await isSessionInactive(req.user.id)) {
      logger.warn('AuthMiddleware', 'Sessão inativa para o usuário.', {
        userId: req.user.id,
        username: req.user.username,
        requestId: req.id,
        ip: req.ip,
      });
      // Opcional: invalidar o token JWT aqui também, adicionando-o à blacklist
      // await blacklistToken(token, decoded);
      return res.status(401).json({
        success: false,
        message: 'Sessão expirada devido à inatividade. Faça login novamente.',
        code: 'SESSION_INACTIVE',
      });
    }

    // Atualizar o timestamp da última atividade
    await updateUserActivity(req.user.id);

    // Pass a function to revoke the token for logout routes
    req.revokeToken = async () => {
      const blacklisted = await blacklistToken(token, decoded);
      // Limpar também o rastreamento de atividade da sessão no logout
      const redis = await getRedis();
      if (redis) {
        try {
          await redis.del(`${AUTH_CONFIG.redisActiveSessionPrefix}${req.user.id}`);
        } catch (delError) {
          logger.error('AuthMiddleware', 'Erro ao limpar chave de sessão ativa no logout', { error: delError.message });
        }
      }
      return blacklisted;
    };

    next();
  } catch (error) {
    logger.warn('AuthMiddleware', 'Falha na verificação do token JWT:', {
      error: error.message,
      requestId: req.id,
      ip: req.ip,
    });
    if (error.name === 'TokenExpiredError') {
      return res
        .status(401)
        .json({ success: false, message: 'Token expirado.' });
    }
    return res
      .status(401)
      .json({ success: false, message: 'Token inválido ou malformado.' });
  }
};

module.exports = {
  authMiddleware,
  trackFailedAttempt,
  isUserLockedOut,
  clearFailedAttempts,
  blacklistToken, // For use in logout logic
  isTokenBlacklisted, // Potentially for other checks
  updateUserActivity, // Exportar para uso potencial em outros lugares (ex: login bem-sucedido)
  AUTH_CONFIG,
};
