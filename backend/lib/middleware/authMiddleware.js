const jwt = require('jsonwebtoken');
const config = require('../config/config');

const { JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE } = config;
const { logAction } = require('./auditLogger'); // Importar diretamente a função

const failedAttempts = new Map();
const blacklistedTokens = new Map();
let blacklistCleanupTimer = null;

const AUTH_CONFIG = {
  maxFailedAttempts: 5,
  baseDelay: 1000,
  resetTime: 30 * 60 * 1000,
  blacklistTime: 24 * 60 * 60 * 1000,
};

function revokeToken(token, payload = null) {
  try {
    if (!payload) {
      payload = jwt.decode(token);
    }

    const tokenId = payload?.jti || token.slice(0, 20);

    const expiresAt = payload?.exp
      ? payload.exp * 1000
      : Date.now() + AUTH_CONFIG.blacklistTime;

    blacklistedTokens.set(tokenId, {
      expiresAt,
      username: payload?.username || 'unknown',
    });

    logAction(
      payload?.username || 'system_user',
      'token_revoked',
      'security_token',
      tokenId,
      {
        details: 'Token was revoked.',
        revokedTokenId: tokenId,
        revokedForUser: payload?.username || 'unknown',
      }
    );

    if (!blacklistCleanupTimer) {
      blacklistCleanupTimer = setInterval(cleanBlacklist, 3600000);
    }

    return true;
  } catch (err) {
    console.error('Erro ao revogar token:', err);
    return false;
  }
}

function cleanBlacklist() {
  const now = Date.now();
  let removed = 0;

  for (const [key, data] of blacklistedTokens.entries()) {
    if (data.expiresAt <= now) {
      blacklistedTokens.delete(key);
      removed++;
    }
  }

  if (removed > 0) {
    // Nenhuma ação específica necessária ao remover tokens
  }

  if (blacklistedTokens.size === 0 && blacklistCleanupTimer) {
    clearInterval(blacklistCleanupTimer);
    blacklistCleanupTimer = null;
  }
}

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const clientIP =
    req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Acesso negado. Token não fornecido ou formato inválido.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    if (!token || token.trim() === '') {
      return res.status(401).json({
        success: false,
        message: 'Acesso negado. Token vazio.',
      });
    }

    if (token.split('.').length !== 3) {
      incrementFailedAttempt(clientIP);

      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Formato de token inválido.',
      });
    }

    const tokenId = extractTokenId(token);
    if (blacklistedTokens.has(tokenId)) {
      logAction(
        'system_event',
        'revoked_token_use_attempt',
        'security_incident',
        tokenId,
        {
          ip: clientIP,
          tokenIdAttempted: tokenId,
          message: 'Attempt to use a revoked token.',
        }
      );

      return res.status(401).json({
        success: false,
        message: 'Acesso negado. Token revogado.',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      complete: true,
    });

    const payload = decoded.payload;

    if (!payload.username || !payload.role) {
      incrementFailedAttempt(clientIP);
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Token com payload inválido.',
      });
    }

    if (!payload.jti) {
      // Token sem JTI, continuar mesmo assim (o tokenId será um prefixo)
    }

    req.user = payload;

    req.revokeToken = () => revokeToken(token, payload);

    logAction(
      payload.username,
      'authenticated_api_request',
      'api_endpoint',
      req.originalUrl,
      {
        role: payload.role,
        method: req.method,
        ip: clientIP,
        userAgent: req.headers['user-agent'],
      }
    );

    resetFailedAttempts(clientIP);

    next();
  } catch (error) {
    incrementFailedAttempt(clientIP);

    if (error instanceof jwt.TokenExpiredError) {
      return res
        .status(401)
        .json({ success: false, message: 'Acesso negado. Token expirado.' });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res
        .status(403)
        .json({ success: false, message: 'Acesso negado. Token inválido.' });
    } else if (error.name === 'NotBeforeError') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Token ainda não é válido.',
      });
    } else {
      console.error('Erro na verificação do JWT:', error);
      logAction(
        'system_error',
        'jwt_verification_error',
        'system_process',
        'jwt_verification',
        {
          errorMessage: error.message,
          errorStack: error.stack,
          clientIp: clientIP,
          tokenUsed: token ? token.substring(0, 20) + '...' : 'N/A',
        }
      );

      return res.status(500).json({});
    }
  }
};

function extractTokenId(token) {
  try {
    const payload = jwt.decode(token);
    if (payload && payload.jti) {
      return payload.jti;
    }
    return token.slice(0, 20);
  } catch {
    return token.slice(0, 20);
  }
}

function incrementFailedAttempt(ip) {
  const now = Date.now();
  const attempt = failedAttempts.get(ip) || {
    count: 0,
    lastAttempt: now,
    delayUntil: 0,
  };

  attempt.count++;
  attempt.lastAttempt = now;

  // Exponential backoff, but cap the delay
  const delayFactor = Math.min(
    Math.pow(2, Math.max(0, attempt.count - AUTH_CONFIG.maxFailedAttempts)), // Garante que o expoente não seja negativo
    600 // Fator máximo de delay (ex: 600 * 100ms = 60s)
  );
  const currentDelay = AUTH_CONFIG.baseDelay * delayFactor;
  attempt.delayUntil = now + currentDelay;

  failedAttempts.set(ip, attempt);

  if (attempt.count >= AUTH_CONFIG.maxFailedAttempts) {
    logAction(
      'system_security',
      'excessive_failed_login_attempts',
      'security_event',
      ip,
      {
        ipAddress: ip,
        failedAttempts: attempt.count,
        delayImposed: currentDelay,
        delayUntil: new Date(attempt.delayUntil).toISOString(),
      }
    );
  }

  // Cleanup old entries to prevent memory leak
  if (failedAttempts.size > 10000) {
    for (const [keyIp, value] of failedAttempts.entries()) {
      if (now - value.lastAttempt > AUTH_CONFIG.resetTime * 2) {
        failedAttempts.delete(keyIp);
      }
    }
  }
}

function resetFailedAttempts(ip) {
  failedAttempts.delete(ip);
}

const bruteForceProtection = (req, res, next) => {
  const clientIP =
    req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const attempt = failedAttempts.get(clientIP);

  if (!attempt || Date.now() - attempt.lastAttempt > AUTH_CONFIG.resetTime) {
    if (attempt) {
      failedAttempts.delete(clientIP);
    }
    return next();
  }

  if (attempt.delayUntil > Date.now()) {
    const delay = attempt.delayUntil - Date.now();

    if (delay > 10000) {
      return res.status(429).json({
        success: false,
        message: 'Muitas tentativas inválidas. Tente novamente mais tarde.',
        retryAfter: Math.ceil(delay / 1000),
      });
    }

    setTimeout(
      () => {
        next();
      },
      Math.min(delay, 10000)
    );
  } else {
    next();
  }
};

module.exports = {
  authMiddleware,
  bruteForceProtection,
  revokeToken,
  AUTH_CONFIG,
};
