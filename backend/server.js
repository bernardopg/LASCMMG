require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const xss = require('xss-clean');
const csrfMiddleware = require('./lib/middleware/csrfMiddleware');
const honeypot = require('./lib/middleware/honeypot');
const fs = require('fs').promises;
const serveStatic = require('serve-static');
const {
  PORT: envPort,
  NODE_ENV,
  CORS_ORIGIN,
  RATE_LIMIT,
} = require('./lib/config/config');
const { globalErrorHandler } = require('./lib/middleware/errorHandler');
const { applyDatabaseMigrations } = require('./lib/db/db-init');
const { logger, httpLogger } = require('./lib/logger/logger');

const app = express();
const port = envPort || 3000;

app.use((req, res, next) => {
  let requestId = req.headers['x-request-id'];
  if (!requestId) {
    requestId = require('crypto').randomBytes(16).toString('hex');
    res.setHeader('X-Request-Id', requestId);
  }
  req.id = requestId;
  next();
});

app.use(httpLogger);

if (NODE_ENV !== 'production') {
  logger.info('Servidor rodando em modo de desenvolvimento');
} else {
  logger.info('Servidor rodando em modo de produção');

  app.use((req, res, next) => {
    if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
      return res.redirect('https://' + req.get('host') + req.url);
    }
    next();
  });
}

app.use(
  helmet({
    contentSecurityPolicy:
      NODE_ENV === 'production'
        ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'"],
            imgSrc: ["'self'", 'data:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
          },
        }
        : false,
  })
);

app.use(
  cors({
    origin: NODE_ENV === 'production' ? CORS_ORIGIN : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['Content-Disposition'],
    credentials: true,
    maxAge: 86400,
  })
);

const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT.windowMs,
  max: RATE_LIMIT.max,
  message: {
    success: false,
    message: 'Muitas requisições deste IP, tente novamente após 15 minutos',
  },
});
app.use('/api/', apiLimiter);

app.use(xss());

const crypto = require('crypto');
const cookieSecret =
  process.env.COOKIE_SECRET || crypto.randomBytes(32).toString('hex');

if (!process.env.COOKIE_SECRET) {
  logger.error('⚠️ ALERTA DE SEGURANÇA: COOKIE_SECRET não configurado!');
  logger.error(
    'Uma chave aleatória temporária foi gerada, mas será redefinida em cada reinicialização.'
  );
  logger.error(
    'Isto é inseguro para produção e causará invalidação de sessões.'
  );

  if (NODE_ENV === 'production') {
    logger.error(' CRÍTICO: COOKIE_SECRET ausente em ambiente de PRODUÇÃO! ');
  }
}

app.use(cookieParser(cookieSecret));

if (NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  app.use((req, res, next) => {
    res.cookie('secureOnly', 'value', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 3600000,
    });
    next();
  });
}

app.use(csrfMiddleware.csrfProtection);

app.use(honeypot.middleware);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.headers['content-type'] || '';
    if (
      req.body &&
      Object.keys(req.body).length > 0 &&
      !contentType.includes('application/json') &&
      !contentType.includes('application/x-www-form-urlencoded')
    ) {
      return res.status(415).json({
        success: false,
        message:
          'Content-Type não suportado. Use application/json ou application/x-www-form-urlencoded',
      });
    }
  }
  next();
});

const oneDay = 86400000;

app.use(
  '/css',
  serveStatic(path.join(__dirname, 'css'), {
    maxAge: oneDay,
    setHeaders: (res, _filePath) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  })
);

app.use(
  '/js',
  serveStatic(path.join(__dirname, 'js'), {
    maxAge: oneDay,
    setHeaders: (res, filePath) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (
        serveStatic.mime &&
        serveStatic.mime.lookup(filePath) === 'application/javascript'
      ) {
        res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
      }
    },
  })
);

app.use(
  '/assets',
  serveStatic(path.join(__dirname, 'assets'), {
    maxAge: oneDay,
    setHeaders: (res, _filePath) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  })
);

const authRoutes = require('./routes/auth');
const tournamentSqliteRoutes = require('./routes/tournaments-sqlite');
const systemStatsRouter = require('./routes/system-stats');
const legacyStatsRoutes = require('./routes/stats');
const { checkDbConnection } = require('./lib/db/database');

app.use('/api', authRoutes);
app.use('/api/tournaments', tournamentSqliteRoutes);
app.use('/api/system', systemStatsRouter);
app.use('/api/stats', legacyStatsRoutes);

app.get('/ping', (req, res) => {
  const dbStatus = checkDbConnection();
  if (dbStatus.status === 'ok') {
    res.status(200).json({
      status: 'ok',
      message: 'pong',
      database: dbStatus,
    });
  } else {
    res.status(503).json({
      status: 'error',
      message: 'Service Unavailable',
      database: dbStatus,
      dependencies: {
        database: 'error',
      },
    });
  }
});

app.use(globalErrorHandler);

app.use('/api/*', (req, res) => {
  res
    .status(404)
    .json({ success: false, message: 'Endpoint API não encontrado.' });
});

app.get('/admin.html', csrfMiddleware.csrfProvider, async (req, res, next) => {
  try {
    const filePath = path.join(__dirname, 'admin.html');
    const htmlContent = await fs.readFile(filePath, 'utf-8');
    const injectedHtml = honeypot.injectFields(htmlContent);
    res.send(injectedHtml);
  } catch (error) {
    logger.error('Erro ao servir admin.html com honeypot:', error);
    next(error);
  }
});

app.get(
  '/admin-security.html',
  csrfMiddleware.csrfProvider,
  async (req, res, next) => {
    try {
      const filePath = path.join(__dirname, 'admin-security.html');
      const htmlContent = await fs.readFile(filePath, 'utf-8');
      const injectedHtml = honeypot.injectFields(htmlContent);
      res.send(injectedHtml);
    } catch (error) {
      logger.error('Erro ao servir admin-security.html com honeypot:', error);
      next(error);
    }
  }
);
app.get(
  ['/', '/index.html'],
  csrfMiddleware.csrfProvider,
  async (req, res, next) => {
    try {
      const filePath = path.join(__dirname, 'index.html');
      const htmlContent = await fs.readFile(filePath, 'utf-8');
      const injectedHtml = honeypot.injectFields(htmlContent);
      res.send(injectedHtml);
    } catch (error) {
      logger.error('Erro ao servir index.html com honeypot:', error);
      next(error);
    }
  }
);

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res
      .status(404)
      .json({ success: false, message: 'API endpoint não encontrado' });
  }

  if (path.extname(req.path).length > 0 && !req.path.endsWith('.html')) {
    return next();
  }

  res.sendFile(path.join(__dirname, 'index.html'));
});

async function startServer() {
  try {
    await applyDatabaseMigrations();
    const server = app.listen(port, () => {
      logger.info(`Servidor rodando em http://localhost:${port}`);
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM recebido. Encerrando servidor graciosamente...');
      server.close(() => {
        logger.info('Servidor encerrado.');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Tempo limite de encerramento excedido. Forçando saída.');
        process.exit(1);
      }, 10000);
    });
  } catch (error) {
    logger.fatal({ err: error }, 'Erro fatal ao iniciar o servidor:');
    process.exit(1);
  }
}

startServer();

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Erro não capturado (uncaughtException):');
  if (NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(
    { err_reason: reason, promise_rejection_at: promise },
    'Rejeição de Promise não tratada (unhandledRejection):'
  );
});
