const fs = require('fs');
const path = require('path');
const { createWriteStream } = require('fs');
const { hostname } = require('os');
const { mkdir } = require('fs').promises;

const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '../logs');
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const MAX_LOG_SIZE = parseInt(process.env.MAX_LOG_SIZE || 10485760, 10);
const MAX_LOG_FILES = parseInt(process.env.MAX_LOG_FILES || 5, 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4,
};

const COLORS = {
  error: '\x1b[31m',
  warn: '\x1b[33m',
  info: '\x1b[36m',
  debug: '\x1b[32m',
  trace: '\x1b[37m',
  reset: '\x1b[0m',
};

const logStreams = {};
let consoleLoggingEnabled = true;

async function initializeLogger() {
  try {
    await mkdir(LOG_DIR, { recursive: true });

    for (const level of Object.keys(LOG_LEVELS)) {
      if (LOG_LEVELS[level] <= LOG_LEVELS[LOG_LEVEL]) {
        const logPath = path.join(LOG_DIR, `${level}.log`);
        logStreams[level] = createWriteStream(logPath, { flags: 'a' });
      }
    }

    writeLog('info', 'Logger', 'Logger inicializado com sucesso', {
      logLevel: LOG_LEVEL,
    });

    return true;
  } catch (error) {
    console.error('Erro ao inicializar logger:', error);
    return false;
  }
}

function writeLog(level, module, message, data = {}) {
  if (
    !Object.prototype.hasOwnProperty.call(LOG_LEVELS, level) ||
    LOG_LEVELS[level] > LOG_LEVELS[LOG_LEVEL]
  ) {
    return;
  }

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    module,
    message,
    host: hostname(),
    environment: NODE_ENV,
    ...data,
  };

  const logString = JSON.stringify(logEntry);

  if (logStreams[level]) {
    logStreams[level].write(logString + '\n');
  }

  if (consoleLoggingEnabled) {
    if (NODE_ENV !== 'production') {
      const color = COLORS[level] || COLORS.reset;
      console.log(
        `${color}[${timestamp}] [${level.toUpperCase()}] [${module}] ${message}${COLORS.reset}`
      );

      if (Object.keys(data).length > 0) {
        console.log(`${color}Additional data:`, data, COLORS.reset);
      }
    }
  }
}

async function checkLogRotation() {
  for (const level of Object.keys(LOG_LEVELS)) {
    if (LOG_LEVELS[level] <= LOG_LEVELS[LOG_LEVEL]) {
      const logPath = path.join(LOG_DIR, `${level}.log`);

      try {
        const stats = await fs.promises.stat(logPath);

        if (stats.size >= MAX_LOG_SIZE) {
          await rotateLog(level);
        }
      } catch (error) {
        console.error(`Erro ao verificar tamanho do log ${level}:`, error);
      }
    }
  }
}

async function rotateLog(level) {
  const logPath = path.join(LOG_DIR, `${level}.log`);

  try {
    if (logStreams[level]) {
      logStreams[level].end();
    }

    for (let i = MAX_LOG_FILES - 1; i > 0; i--) {
      const oldFile = path.join(LOG_DIR, `${level}.${i}.log`);
      const newFile = path.join(LOG_DIR, `${level}.${i + 1}.log`);

      if (fs.existsSync(oldFile)) {
        await fs.promises.rename(oldFile, newFile);
      }
    }

    const rotatedFile = path.join(LOG_DIR, `${level}.1.log`);
    await fs.promises.rename(logPath, rotatedFile);

    logStreams[level] = createWriteStream(logPath, { flags: 'a' });

    writeLog('info', 'Logger', `Rotação de log completada para nível ${level}`);
  } catch (error) {
    console.error(`Erro ao rotacionar log ${level}:`, error);
  }
}

function closeLogger() {
  for (const level in logStreams) {
    if (logStreams[level]) {
      logStreams[level].end();
    }
  }
}

function setConsoleLogging(enabled) {
  consoleLoggingEnabled = enabled;
}

function requestLoggerMiddleware(req, res, next) {
  const startTime = Date.now();

  const originalEnd = res.end;
  let responseBody = null;

  res.end = function (chunk, encoding) {
    if (chunk) {
      responseBody = chunk;
    }

    res.end = originalEnd;
    return res.end(chunk, encoding);
  };

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;

    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength:
        res.get('Content-Length') || (responseBody ? responseBody.length : 0),
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer') || req.get('Referrer'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user ? req.user.id : 'anonymous',
    };

    let level = 'info';
    if (res.statusCode >= 500) {
      level = 'error';
    } else if (res.statusCode >= 400) {
      level = 'warn';
    }

    writeLog(
      level,
      'HTTP',
      `${req.method} ${req.originalUrl || req.url} - ${res.statusCode}`,
      logData
    );
  });

  res.on('error', (error) => {
    writeLog(
      'error',
      'HTTP',
      `Error processing ${req.method} ${req.originalUrl || req.url}`,
      {
        error: error.message,
        stack: error.stack,
        method: req.method,
        url: req.originalUrl || req.url,
        ip: req.ip || req.connection.remoteAddress,
        userId: req.user ? req.user.id : 'anonymous',
      }
    );
  });

  next();
}

setInterval(checkLogRotation, 3600000);

const logger = {
  error: (module, message, data) => writeLog('error', module, message, data),
  warn: (module, message, data) => writeLog('warn', module, message, data),
  info: (module, message, data) => writeLog('info', module, message, data),
  debug: (module, message, data) => writeLog('debug', module, message, data),
  trace: (module, message, data) => writeLog('trace', module, message, data),

  initialize: initializeLogger,
  close: closeLogger,
  setConsoleLogging,
  middleware: requestLoggerMiddleware,

  getLogDirectory: () => LOG_DIR,
  getCurrentLogLevel: () => LOG_LEVEL,
  checkRotation: checkLogRotation,
};

module.exports = logger;
