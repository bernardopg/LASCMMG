const { formatErrorResponse } = require('../middleware/errorHandler');
const path = require('path'); // fs é usado por fileUtils
const { readJsonFile, writeJsonFile } = require('../utils/fileUtils');
const { logger } = require('../logger/logger'); // Importar o logger da aplicação

const HONEYPOT_LOG_PATH = path.join(
  __dirname,
  '..',
  'data',
  'honeypot_activity.log'
);

const HONEYPOT_CONFIG = {
  fieldNames: ['website', 'url', 'email_confirm', 'phone2', 'address2'],
  minSubmitTime: 1500,
  timeField: '_t',
};

/**
 * Adiciona dados honeypot a uma página HTML
 * Para uso em templates ou antes de enviar HTML para cliente
 *
 * @param {string} html - HTML a ser modificado
 * @returns {string} - HTML com campos honeypot adicionados
 */
function injectHoneypotFields(html) {
  if (!html || typeof html !== 'string') {
    return html;
  }

  const formRegex = /<form[^>]*>/gi;
  const timestamp = Date.now();

  const timeFieldHtml = `<input type="hidden" name="${HONEYPOT_CONFIG.timeField}" value="${timestamp}">`;

  const randomField =
    HONEYPOT_CONFIG.fieldNames[
      Math.floor(Math.random() * HONEYPOT_CONFIG.fieldNames.length)
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

/**
 * Middleware para verificar se requisições são de bots com base em honeypot
 */
function honeypotMiddleware(req, res, next) {
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next();
  }

  const body = req.body || {};

  for (const field of HONEYPOT_CONFIG.fieldNames) {
    if (body[field] && body[field].length > 0) {
      logger.warn(
        'HoneypotMiddleware',
        `Detecção de bot: campo honeypot "${field}" preenchido`,
        {
          ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          path: req.path,
          userAgent: req.headers['user-agent'],
          fieldTriggered: field,
        }
      );

      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
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

  const submitTime = body[HONEYPOT_CONFIG.timeField];
  if (submitTime) {
    const elapsedTime = Date.now() - parseInt(submitTime, 10);

    if (elapsedTime < HONEYPOT_CONFIG.minSubmitTime) {
      logger.warn(
        'HoneypotMiddleware',
        `Detecção de bot: formulário preenchido muito rapidamente (${elapsedTime}ms)`,
        {
          ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          path: req.path,
          userAgent: req.headers['user-agent'],
          elapsedTimeMs: elapsedTime,
        }
      );

      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      logSuspiciousActivity(ip, 'too_fast_submission', {
        elapsedTime,
        path: req.path,
        userAgent: req.headers['user-agent'],
      });

      setTimeout(
        () => {
          return res
            .status(200)
            .json(formatErrorResponse('Requisição processada', 200));
        },
        Math.random() * 1000 + 500
      );
      return;
    }

    delete req.body[HONEYPOT_CONFIG.timeField];
  }

  next();
}

/**
 * Registra atividade suspeita para análise posterior
 * Pode ser expandido para integrar com sistemas de segurança ou alertas
 */
async function logSuspiciousActivity(ip, type, details) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ip: ip,
    type: type,
    details: details,
  };

  logger.warn('HoneypotMiddleware', 'ATIVIDADE SUSPEITA DETECTADA:', {
    logEntry,
  });

  try {
    let logs = await readJsonFile(HONEYPOT_LOG_PATH, []);
    if (!Array.isArray(logs)) {
      // Garantia extra caso readJsonFile retorne algo inesperado
      logger.error(
        'HoneypotMiddleware',
        'Log de honeypot não é um array, resetando.',
        { path: HONEYPOT_LOG_PATH }
      );
      logs = [];
    }

    logs.push(logEntry);

    // Limitar o tamanho do log para evitar que cresça indefinidamente
    if (logs.length > 5000) {
      // Mantém as últimas 5000 entradas
      logs = logs.slice(logs.length - 5000);
    }

    await writeJsonFile(HONEYPOT_LOG_PATH, logs);
  } catch (error) {
    logger.error('HoneypotMiddleware', 'Erro ao escrever no log de honeypot:', {
      error: error.message,
      path: HONEYPOT_LOG_PATH,
    });
  }
}

module.exports = {
  middleware: honeypotMiddleware,
  injectFields: injectHoneypotFields,
  config: HONEYPOT_CONFIG,
};
