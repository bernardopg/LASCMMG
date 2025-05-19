const { formatErrorResponse } = require('../middleware/errorHandler');
const path = require('path');
const { readJsonFile, writeJsonFile } = require('../utils/fileUtils');
const { logger } = require('../logger/logger');

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

// Internal configuration for detection mechanisms
const HONEYPOT_DETECTION_CONFIG = {
  fieldNames: ['website', 'url', 'email_confirm', 'phone2', 'address2'],
  minSubmitTime: 1500, // milliseconds
  timeField: '_t',
};

// User-configurable settings
let currentSettings = {
  detectionThreshold: 5,
  blockDurationHours: 24,
  ipWhitelist: ['127.0.0.1', '::1'],
  // activityWindowMinutes: 60, // Window to count suspicious activities for threshold
};

// In-memory store for blocked IPs
// Structure: { "ip_address": { "expiresAt": timestamp, "reason": "string", "blockedAt": timestamp } }
let blockedIPs = {};
// In-memory store for suspicious activity counts per IP
// Structure: { "ip_address": { count: number, firstEvent: timestamp } }
let suspiciousActivityTracker = {};

async function loadSettings() {
  try {
    const savedSettings = await readJsonFile(HONEYPOT_SETTINGS_PATH, null);
    if (savedSettings) {
      currentSettings = { ...currentSettings, ...savedSettings };
      logger.info('Honeypot', 'Configurações do Honeypot carregadas.', {
        settings: currentSettings,
      });
    } else {
      logger.info(
        'Honeypot',
        'Nenhum arquivo de configuração do Honeypot encontrado, usando padrões.',
        { defaults: currentSettings }
      );
      await writeJsonFile(HONEYPOT_SETTINGS_PATH, currentSettings);
    }
  } catch (error) {
    logger.error(
      'Honeypot',
      'Erro ao carregar configurações do Honeypot, usando padrões.',
      { error, path: HONEYPOT_SETTINGS_PATH }
    );
  }
}

async function loadBlockedIPs() {
  try {
    const savedBlockedIPs = await readJsonFile(BLOCKED_IPS_PATH, {});
    blockedIPs = savedBlockedIPs || {};
    // Clean up expired blocks on load
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
    logger.info('Honeypot', 'Lista de IPs bloqueados carregada.', {
      count: Object.keys(blockedIPs).length,
    });
  } catch (error) {
    logger.error('Honeypot', 'Erro ao carregar IPs bloqueados.', {
      error,
      path: BLOCKED_IPS_PATH,
    });
    blockedIPs = {};
  }
}

async function saveBlockedIPs() {
  try {
    await writeJsonFile(BLOCKED_IPS_PATH, blockedIPs);
    logger.debug('Honeypot', 'Lista de IPs bloqueados salva.');
  } catch (error) {
    logger.error('Honeypot', 'Erro ao salvar IPs bloqueados.', {
      error,
      path: BLOCKED_IPS_PATH,
    });
  }
}

// Load settings and blocked IPs on module initialization
Promise.all([loadSettings(), loadBlockedIPs()]).catch((err) => {
  logger.error(
    'Honeypot',
    'Erro na inicialização do Honeypot (settings/blocked IPs).',
    { error: err }
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
  // if (newSettings.activityWindowMinutes !== undefined) {
  //   currentSettings.activityWindowMinutes = parseInt(newSettings.activityWindowMinutes, 10) || currentSettings.activityWindowMinutes;
  // }
  try {
    await writeJsonFile(HONEYPOT_SETTINGS_PATH, currentSettings);
    logger.info('Honeypot', 'Configurações do Honeypot atualizadas e salvas.', {
      newSettings: currentSettings,
    });
    return true;
  } catch (error) {
    logger.error('Honeypot', 'Erro ao salvar configurações do Honeypot.', {
      error,
      path: HONEYPOT_SETTINGS_PATH,
    });
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
      // Permanent block
      activeBlocks.push({ ip, ...blockedIPs[ip] });
    }
  }
  // Sort by blockedAt descending
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
      'Honeypot',
      `Tentativa de bloquear IP na whitelist: ${ip}. Ignorado.`
    );
    return false; // Cannot block whitelisted IP
  }
  const now = Date.now();
  const expiresAt =
    durationHours > 0 ? now + durationHours * 60 * 60 * 1000 : null; // null for permanent

  blockedIPs[ip] = {
    expiresAt,
    reason,
    blockedAt: new Date(now).toISOString(),
    manual: true,
  };
  await saveBlockedIPs();
  logger.info(
    'Honeypot',
    `IP ${ip} bloqueado manualmente. Duração: ${durationHours || 'Permanente'}h. Razão: ${reason}`
  );
  return true;
}

async function unblockIP(ip) {
  if (blockedIPs[ip]) {
    delete blockedIPs[ip];
    await saveBlockedIPs();
    logger.info('Honeypot', `IP ${ip} desbloqueado.`);
    return true;
  }
  logger.warn(
    'Honeypot',
    `IP ${ip} não encontrado na lista de bloqueio para desbloqueio.`
  );
  return false;
}

function injectHoneypotFields(html) {
  if (!html || typeof html !== 'string') {
    return html;
  }
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
    </div>
  `;
  return html.replace(
    formRegex,
    (match) => `${match}${timeFieldHtml}${honeypotFieldHtml}`
  );
}

async function logSuspiciousActivity(ip, type, details) {
  const logEntry = { timestamp: new Date().toISOString(), ip, type, details };
  logger.warn('HoneypotMiddleware', 'ATIVIDADE SUSPEITA DETECTADA:', {
    logEntry,
  });
  try {
    let logs = await readJsonFile(HONEYPOT_LOG_PATH, []);
    if (!Array.isArray(logs)) {
      logs = [];
    }
    logs.push(logEntry);
    if (logs.length > 5000) {
      // Limit log size
      logs = logs.slice(logs.length - 5000);
    }
    await writeJsonFile(HONEYPOT_LOG_PATH, logs);

    // Auto-blocking logic
    const now = Date.now();
    const activityWindowMs =
      (currentSettings.activityWindowMinutes || 60) * 60 * 1000;

    if (
      !suspiciousActivityTracker[ip] ||
      suspiciousActivityTracker[ip].firstEvent < now - activityWindowMs
    ) {
      suspiciousActivityTracker[ip] = { count: 0, firstEvent: now };
    }
    suspiciousActivityTracker[ip].count++;

    if (
      suspiciousActivityTracker[ip].count >= currentSettings.detectionThreshold
    ) {
      logger.info(
        'Honeypot',
        `Limite de detecção atingido para IP ${ip}. Bloqueando...`
      );
      await manualBlockIP(
        ip,
        currentSettings.blockDurationHours,
        `Bloqueio automático: ${currentSettings.detectionThreshold} eventos suspeitos em ${currentSettings.activityWindowMinutes || 60} min.`
      );
      delete suspiciousActivityTracker[ip]; // Reset counter after blocking
    }
  } catch (error) {
    logger.error(
      'HoneypotMiddleware',
      'Erro ao escrever no log de honeypot ou ao auto-bloquear:',
      { error: error.message, path: HONEYPOT_LOG_PATH }
    );
  }
}

function honeypotMiddleware(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // Check if IP is currently blocked (and not expired)
  if (blockedIPs[ip]) {
    const blockInfo = blockedIPs[ip];
    if (!blockInfo.expiresAt || blockInfo.expiresAt > Date.now()) {
      logger.warn('HoneypotMiddleware', `Acesso bloqueado para IP: ${ip}`, {
        path: req.path,
        reason: blockInfo.reason,
      });
      // Send a generic error or a specific "blocked" message
      // For now, let's send a 403 Forbidden, but a less informative error might be better for security.
      return res.status(403).json(formatErrorResponse('Acesso negado.', 403));
    } else {
      // Block expired, remove it
      delete blockedIPs[ip];
      saveBlockedIPs(); // Save updated list (async, but don't wait for it here)
    }
  }

  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next();
  }
  const body = req.body || {};

  if (currentSettings.ipWhitelist.includes(ip)) {
    return next();
  }

  for (const field of HONEYPOT_DETECTION_CONFIG.fieldNames) {
    if (body[field] && body[field].length > 0) {
      logger.warn(
        'HoneypotMiddleware',
        `Detecção de bot: campo honeypot "${field}" preenchido`,
        {
          ip,
          path: req.path,
          userAgent: req.headers['user-agent'],
          fieldTriggered: field,
        }
      );
      logSuspiciousActivity(ip, 'honeypot_triggered', {
        field,
        path: req.path,
        userAgent: req.headers['user-agent'],
      });
      return res
        .status(200)
        .json(formatErrorResponse('Requisição processada', 200)); // Mislead bot
    }
  }

  const submitTime = body[HONEYPOT_DETECTION_CONFIG.timeField];
  if (submitTime) {
    const elapsedTime = Date.now() - parseInt(submitTime, 10);
    if (elapsedTime < HONEYPOT_DETECTION_CONFIG.minSubmitTime) {
      logger.warn(
        'HoneypotMiddleware',
        `Detecção de bot: formulário preenchido muito rapidamente (${elapsedTime}ms)`,
        {
          ip,
          path: req.path,
          userAgent: req.headers['user-agent'],
          elapsedTimeMs: elapsedTime,
        }
      );
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
      ); // Mislead bot
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
  getBlockedIPs: getBlockedIPsList, // Renamed for clarity
  manualBlockIP, // Renamed for clarity
  unblockIP, // Renamed for clarity
};
