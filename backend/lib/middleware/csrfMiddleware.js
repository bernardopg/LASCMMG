const crypto = require('crypto');
const { JWT_SECRET } = require('../config/config');
const { getClient } = require('../db/redisClient'); // Import Redis client
const { logger } = require('../logger/logger'); // Assuming logger is in this path

// Configurações
const CSRF_CONFIG = {
  tokenValidity: 30 * 60, // Tempo de validade do token em segundos (30 minutos)
  headerName: 'X-CSRF-Token',
  cookieName: 'csrfToken',
  protectedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  redisKeyPrefix: 'csrf:',
};

async function generateToken(userId) {
  const redis = await getClient();
  if (!redis) {
    logger.error('CSRFMiddleware', 'Cliente Redis não disponível para gerar token CSRF.');
    throw new Error('Serviço indisponível no momento.');
  }

  const randomBytes = crypto.randomBytes(32).toString('hex');
  const timestamp = Date.now();
  const data = `${userId}-${randomBytes}-${timestamp}`;
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('hex');
  const token = `${randomBytes}.${timestamp}.${signature}`;

  const tokenData = JSON.stringify({ userId, timestamp });
  const redisKey = `${CSRF_CONFIG.redisKeyPrefix}${token}`;

  try {
    await redis.set(redisKey, tokenData, {
      EX: CSRF_CONFIG.tokenValidity, // Define o tempo de expiração em segundos
    });
  } catch (error) {
    logger.error('CSRFMiddleware', 'Erro ao salvar token CSRF no Redis:', { error: error.message, token });
    throw new Error('Erro ao gerar token de segurança.');
  }

  return token;
}

async function verifyToken(token, userId) {
  if (!token || !userId) return false;

  const redis = await getClient();
  if (!redis) {
    logger.error('CSRFMiddleware', 'Cliente Redis não disponível para verificar token CSRF.');
    // Fallback or throw error depending on desired behavior if Redis is down
    return false;
  }

  const redisKey = `${CSRF_CONFIG.redisKeyPrefix}${token}`;
  let tokenDataString;
  try {
    tokenDataString = await redis.get(redisKey);
  } catch (error) {
    logger.error('CSRFMiddleware', 'Erro ao buscar token CSRF do Redis:', { error: error.message, token });
    return false;
  }

  if (!tokenDataString) return false;

  let storedData;
  try {
    storedData = JSON.parse(tokenDataString);
  } catch (error) {
    logger.error('CSRFMiddleware', 'Erro ao parsear dados do token CSRF do Redis:', { error: error.message, tokenDataString });
    return false;
  }

  if (storedData.userId !== userId) return false;

  // Timestamp check is implicitly handled by Redis TTL, but signature check is still crucial
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [retrievedRandomBytes, retrievedTimestamp] = parts;
  // Ensure the timestamp from the token matches the one stored (though Redis TTL is primary for expiry)
  if (parseInt(retrievedTimestamp, 10) !== storedData.timestamp) {
      logger.warn('CSRFMiddleware', 'Timestamp do token CSRF não corresponde ao armazenado.', { token, storedData });
      return false;
  }

  const dataToVerify = `${userId}-${retrievedRandomBytes}-${retrievedTimestamp}`;
  const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(dataToVerify).digest('hex');

  return parts[2] === expectedSignature;
}

// No longer needed with Redis TTL: cleanExpiredTokens, tokenStore, tokenCleanupTimer

async function csrfProvider(req, res, next) {
  const userId = req.user?.username || 'anonymous';
  let token;
  try {
    token = await generateToken(userId);
  } catch (error) {
    // Error already logged in generateToken
    return res.status(503).json({ success: false, message: 'Erro ao gerar token de segurança. Tente novamente.' });
  }

  res.set(CSRF_CONFIG.headerName, token);
  res.cookie(CSRF_CONFIG.cookieName, token, {
    httpOnly: false,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: CSRF_CONFIG.tokenValidity * 1000,
  });
  res.locals.csrfToken = token;
  next();
}

async function csrfProtection(req, res, next) {
  if (!CSRF_CONFIG.protectedMethods.includes(req.method)) {
    return next();
  }

  const token = req.headers[CSRF_CONFIG.headerName.toLowerCase()] || req.cookies[CSRF_CONFIG.cookieName];
  const userId = req.user?.username || 'anonymous';
  let isValid;

  try {
    isValid = await verifyToken(token, userId);
  } catch (error) {
    // Error already logged in verifyToken if Redis related
    return res.status(503).json({ success: false, message: 'Erro ao verificar token de segurança. Tente novamente.' });
  }

  if (!isValid) {
    return res.status(403).json({
      success: false,
      message: 'Token CSRF inválido ou expirado. Recarregue a página e tente novamente.',
    });
  }
  next();
}

module.exports = {
  // generateToken and verifyToken are now async, primarily for internal use by the middleware
  csrfProvider,
  csrfProtection,
  CSRF_CONFIG,
};
