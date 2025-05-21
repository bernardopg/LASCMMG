const { formatErrorResponse } = require('../middleware/errorHandler');
const path = require('path');
const { readJsonFile, writeJsonFile } = require('../utils/fileUtils');
const { logger } = require('../logger/logger');
const { getClient } = require('../db/redisClient'); // Import Redis client

const HONEYPOT_LOG_PATH = path.join(
  __dirname,
  '..',
  'data',
  'honeypot_activity.log'
);
const HONEYPOT_SETTINGS_PATH = path.join(
  __dirname,
  '..',
  'data',
  'honeypot_settings.json'
);
const BLOCKED_IPS_PATH = path.join(__dirname, '..', 'data', 'blocked_ips.json');

const HONEYPOT_DETECTION_CONFIG = {
  fieldNames: ['website', 'url', 'email_confirm', 'phone2', 'address2'],
  minSubmitTime: 1500,
  timeField: '_t',
  redisSuspiciousActivityPrefix: 'honeypot:suspicious:',
};

let currentSettings = {
  detectionThreshold: 5,
  blockDurationHours: 24,
  ipWhitelist: ['127.0.0.1', '::1'],
  activityWindowMinutes: 60,
};

let blockedIPs = {};
// In-memory suspiciousActivityTracker is removed, will use Redis.

async function getRedis() {
  const client = await getClient();
  if (!client) {
    logger.error(
      { component: 'Honeypot' },
      'Cliente Redis não disponível para Honeypot.'
    );
  }
  return client;
}

async function loadSettings() {
  try {
    const savedSettings = await readJsonFile(HONEYPOT_SETTINGS_PATH, null);
    if (savedSettings) {
      currentSettings = { ...currentSettings, ...savedSettings };
      logger.info(
        { component: 'Honeypot', settings: currentSettings },
        'Configurações do Honeypot carregadas.'
      );
    } else {
      logger.info(
        { component: 'Honeypot', defaults: currentSettings },
        'Nenhum arquivo de configuração do Honeypot encontrado, usando padrões.'
      );
      await writeJsonFile(HONEYPOT_SETTINGS_PATH, currentSettings);
    }
  } catch (error) {
    logger.error(
      { component: 'Honeypot', err: error, path: HONEYPOT_SETTINGS_PATH },
      'Erro ao carregar configurações do Honeypot, usando padrões.'
    );
  }
}

async function loadBlockedIPs() {
  try {
    const savedBlockedIPs = await readJsonFile(BLOCKED_IPS_PATH, {});
    blockedIPs = savedBlockedIPs || {};
    const now = Date.now();
    let updated = false;
    for (const ip in blockedIPs) {
      if (blockedIPs[ip].expiresAt && blockedIPs[ip].expiresAt < now) {
        delete blockedIPs[ip];
        updated = true;
      }
    }
    if (updated) {
      await saveBlockedIPs();
    }
    logger.info(
      { component: 'Honeypot', count: Object.keys(blockedIPs).length },
      'Lista de IPs bloqueados carregada.'
    );
  } catch (error) {
    logger.error(
      { component: 'Honeypot', err: error, path: BLOCKED_IPS_PATH },
      'Erro ao carregar IPs bloqueados.'
    );
    blockedIPs = {};
  }
}

async function saveBlockedIPs() {
  try {
    await writeJsonFile(BLOCKED_IPS_PATH, blockedIPs);
    logger.debug({ component: 'Honeypot' }, 'Lista de IPs bloqueados salva.');
  } catch (error) {
    logger.error(
      { component: 'Honeypot', err: error, path: BLOCKED_IPS_PATH },
      'Erro ao salvar IPs bloqueados.'
    );
  }
}

Promise.all([loadSettings(), loadBlockedIPs()]).catch((err) => {
  logger.error(
    { component: 'Honeypot', err },
    'Erro na inicialização do Honeypot (settings/blocked IPs).'
  );
});

function getSettings() {
  return { ...currentSettings };
}

async function updateSettings(newSettings) {
  if (newSettings.detectionThreshold !== undefined) {
    currentSettings.detectionThreshold =
      parseInt(newSettings.detectionThreshold, 10) ||
      currentSettings.detectionThreshold;
  }
  if (newSettings.blockDurationHours !== undefined) {
    currentSettings.blockDurationHours =
      parseInt(newSettings.blockDurationHours, 10) ||
      currentSettings.blockDurationHours;
  }
  if (
    newSettings.ipWhitelist !== undefined &&
    Array.isArray(newSettings.ipWhitelist)
  ) {
    currentSettings.ipWhitelist = newSettings.ipWhitelist
      .map((ip) => String(ip).trim())
      .filter((ip) => ip.length > 0);
  }
  if (newSettings.activityWindowMinutes !== undefined) {
    currentSettings.activityWindowMinutes =
      parseInt(newSettings.activityWindowMinutes, 10) ||
      currentSettings.activityWindowMinutes;
  }
  try {
    await writeJsonFile(HONEYPOT_SETTINGS_PATH, currentSettings);
    logger.info(
      { component: 'Honeypot', newSettings: currentSettings },
      'Configurações do Honeypot atualizadas e salvas.'
    );
    return true;
  } catch (error) {
    logger.error(
      { component: 'Honeypot', err: error, path: HONEYPOT_SETTINGS_PATH },
      'Erro ao salvar configurações do Honeypot.'
    );
    return false;
  }
}

function getBlockedIPsList(options = {}) {
  const { page = 1, limit = 10 } = options;
  const now = Date.now();
  const activeBlocks = [];
  for (const ip in blockedIPs) {
    if (blockedIPs[ip].expiresAt && blockedIPs[ip].expiresAt > now) {
      activeBlocks.push({ ip, ...blockedIPs[ip] });
    } else if (!blockedIPs[ip].expiresAt) {
      activeBlocks.push({ ip, ...blockedIPs[ip] });
    }
  }
  activeBlocks.sort(
    (a, b) => new Date(b.blockedAt).getTime() - new Date(a.blockedAt).getTime()
  );
  const total = activeBlocks.length;
  const paginated = activeBlocks.slice((page - 1) * limit, page * limit);
  return {
    ips: paginated,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
  };
}

async function manualBlockIP(ip, durationHours, reason = 'Bloqueio manual') {
  if (currentSettings.ipWhitelist.includes(ip)) {
    logger.info(
      { component: 'Honeypot', ip },
      `Tentativa de bloquear IP na whitelist: ${ip}. Ignorado.`
    );
    return false;
  }
  const now = Date.now();
  const expiresAt =
    durationHours > 0 ? now + durationHours * 60 * 60 * 1000 : null;
  blockedIPs[ip] = {
    expiresAt,
    reason,
    blockedAt: new Date(now).toISOString(),
    manual: true,
  };
  await saveBlockedIPs();
  logger.info(
    { component: 'Honeypot', ip, durationHours, reason },
    `IP ${ip} bloqueado manualmente. Duração: ${durationHours || 'Permanente'}h. Razão: ${reason}`
  );
  return true;
}

async function unblockIP(ip) {
  if (blockedIPs[ip]) {
    delete blockedIPs[ip];
    await saveBlockedIPs();
    logger.info({ component: 'Honeypot', ip }, `IP ${ip} desbloqueado.`);
    return true;
  }
  logger.warn(
    { component: 'Honeypot', ip },
    `IP ${ip} não encontrado na lista de bloqueio para desbloqueio.`
  );
  return false;
}

function injectHoneypotFields(html) {
  if (!html || typeof html !== 'string') return html;
  const formRegex = /<form[^>]*>/gi;
  const timestamp = Date.now();
  const timeFieldHtml = `<input type="hidden" name="${HONEYPOT_DETECTION_CONFIG.timeField}" value="${timestamp}">`;
  const randomField =
    HONEYPOT_DETECTION_CONFIG.fieldNames[
      Math.floor(Math.random() * HONEYPOT_DETECTION_CONFIG.fieldNames.length)
    ];
  const honeypotFieldHtml = `
    <div style="position: absolute; left: -9999px; top: -9999px; opacity: 0; height: 0; width: 0; z-index: -1;">
      <label for="${randomField}">Deixe este campo em branco</label>
      <input type="text" name="${randomField}" id="${randomField}" autocomplete="off">
    </div>`;
  return html.replace(
    formRegex,
    (match) => `${match}${timeFieldHtml}${honeypotFieldHtml}`
  );
}

async function logSuspiciousActivity(ip, type, details) {
  const logEntry = { timestamp: new Date().toISOString(), ip, type, details };
  logger.warn(
    { component: 'HoneypotMiddleware', logEntry },
    'ATIVIDADE SUSPEITA DETECTADA'
  );

  // Log to file (existing logic)
  try {
    let logs = await readJsonFile(HONEYPOT_LOG_PATH, null); // Read as null if not found
    if (!Array.isArray(logs)) {
      // Initialize if null or not an array
      logs = [];
    }
    logs.push(logEntry);
    if (logs.length > 5000) logs = logs.slice(logs.length - 5000);
    await writeJsonFile(HONEYPOT_LOG_PATH, logs);
  } catch (error) {
    logger.error(
      { component: 'HoneypotMiddleware', err: error, path: HONEYPOT_LOG_PATH },
      'Erro ao escrever no log de honeypot.'
    );
  }

  // Auto-blocking logic using Redis
  const redis = await getRedis();
  if (!redis) return; // Cannot proceed with auto-blocking if Redis is down

  const redisKey = `${HONEYPOT_DETECTION_CONFIG.redisSuspiciousActivityPrefix}${ip}`;
  const activityWindowSeconds =
    (currentSettings.activityWindowMinutes || 60) * 60;

  try {
    const currentAttempts = await redis.incr(redisKey);
    if (currentAttempts === 1) {
      // Set expiration on the first suspicious event for this IP in the current window
      await redis.expire(redisKey, activityWindowSeconds);
    }

    if (currentAttempts >= currentSettings.detectionThreshold) {
      logger.info(
        {
          component: 'Honeypot',
          ip,
          threshold: currentSettings.detectionThreshold,
        },
        `Limite de detecção atingido para IP ${ip}. Bloqueando...`
      );
      const blockSuccess = await manualBlockIP(
        ip,
        currentSettings.blockDurationHours,
        `Bloqueio automático: ${currentSettings.detectionThreshold} eventos suspeitos em ${currentSettings.activityWindowMinutes || 60} min.`
      );
      if (blockSuccess) {
        await redis.del(redisKey); // Reset counter in Redis after blocking
      }
    }
  } catch (error) {
    logger.error(
      { component: 'HoneypotMiddleware', err: error, ip },
      'Erro ao processar auto-bloqueio com Redis.'
    );
  }
}

function honeypotMiddleware(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  if (blockedIPs[ip]) {
    const blockInfo = blockedIPs[ip];
    if (!blockInfo.expiresAt || blockInfo.expiresAt > Date.now()) {
      logger.warn(
        {
          component: 'HoneypotMiddleware',
          ip,
          path: req.path,
          reason: blockInfo.reason,
        },
        `Acesso bloqueado para IP: ${ip}`
      );
      return res.status(403).json(formatErrorResponse('Acesso negado.', 403));
    } else {
      delete blockedIPs[ip];
      saveBlockedIPs();
    }
  }

  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return next();

  const body = req.body || {};
  if (currentSettings.ipWhitelist.includes(ip)) return next();

  for (const field of HONEYPOT_DETECTION_CONFIG.fieldNames) {
    if (body[field] && body[field].length > 0) {
      logSuspiciousActivity(ip, 'honeypot_triggered', {
        field,
        path: req.path,
        userAgent: req.headers['user-agent'],
      });
      return res
        .status(200)
        .json(formatErrorResponse('Requisição processada', 200));
    }
  }

  const submitTime = body[HONEYPOT_DETECTION_CONFIG.timeField];
  if (submitTime) {
    const elapsedTime = Date.now() - parseInt(submitTime, 10);
    if (elapsedTime < HONEYPOT_DETECTION_CONFIG.minSubmitTime) {
      logSuspiciousActivity(ip, 'too_fast_submission', {
        elapsedTime,
        path: req.path,
        userAgent: req.headers['user-agent'],
      });
      setTimeout(
        () =>
          res
            .status(200)
            .json(formatErrorResponse('Requisição processada', 200)),
        Math.random() * 1000 + 500
      );
      return;
    }
    delete req.body[HONEYPOT_DETECTION_CONFIG.timeField];
  }
  next();
}

module.exports = {
  middleware: honeypotMiddleware,
  injectFields: injectHoneypotFields,
  getSettings,
  updateSettings,
  getBlockedIPs: getBlockedIPsList,
  manualBlockIP,
  unblockIP,
};
