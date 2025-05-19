const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRATION } = require('../config/config');
const { logger } = require('../logger/logger');
const { getClient } = require('../db/redisClient'); // Import Redis client

const AUTH_CONFIG = {
  failedLoginAttemptsWarning: 3,
  failedLoginAttemptsLockout: 5,
  lockoutDurationMinutes: 15,
  redisFailedAttemptsPrefix: 'failedlogin:',
  redisBlacklistedTokenPrefix: 'jwtblacklist:',
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
    logger.error('AuthMiddleware', `Erro ao rastrear tentativa de login falha para ${username} no Redis:`, { error: error.message });
  }
}

// Check if user is locked out
async function isUserLockedOut(username) {
  const redis = await getRedis();
  if (!redis) return false; // Or handle error, e.g., assume not locked out if Redis is down

  const key = `${AUTH_CONFIG.redisFailedAttemptsPrefix}${username.toLowerCase()}`;
  try {
    const attempts = await redis.get(key);
    return attempts && parseInt(attempts, 10) >= AUTH_CONFIG.failedLoginAttemptsLockout;
  } catch (error) {
    logger.error('AuthMiddleware', `Erro ao verificar bloqueio de usuário ${username} no Redis:`, { error: error.message });
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
    logger.error('AuthMiddleware', `Erro ao limpar tentativas de login falhas para ${username} no Redis:`, { error: error.message });
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
    logger.error('AuthMiddleware', 'Erro ao adicionar token à blacklist no Redis:', { error: error.message });
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
    logger.error('AuthMiddleware', 'Erro ao verificar token na blacklist do Redis:', { error: error.message });
    return false; // Fail safe
  }
}


const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token de autenticação não fornecido.' });
  }

  try {
    if (await isTokenBlacklisted(token)) {
      logger.warn('AuthMiddleware', 'Tentativa de uso de token na blacklist.', { token_prefix: token.substring(0, 10), requestId: req.id, ip: req.ip });
      return res.status(401).json({ success: false, message: 'Token inválido ou expirado (revogado).' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Adiciona informações do usuário ao objeto req

    // Pass a function to revoke the token for logout routes
    req.revokeToken = async () => {
      return await blacklistToken(token, decoded);
    };

    next();
  } catch (error) {
    logger.warn('AuthMiddleware', 'Falha na verificação do token JWT:', { error: error.message, requestId: req.id, ip: req.ip });
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expirado.' });
    }
    return res.status(401).json({ success: false, message: 'Token inválido ou malformado.' });
  }
};

module.exports = {
  authMiddleware,
  trackFailedAttempt,
  isUserLockedOut,
  clearFailedAttempts,
  blacklistToken, // For use in logout logic
  isTokenBlacklisted, // Potentially for other checks
  AUTH_CONFIG,
};
