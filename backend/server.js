/**
 * LASCMMG Tournament Management System
 * Main Server Application
 *
 * This is the main entry point for the LASCMMG backend server.
 * It configures Express, security middleware, static file serving,
 * and API routes.
 *
 * @version 1.2.0
 * @license MIT
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const xss = require('xss-clean');
const { randomUUID } = require('crypto');
const csrfMiddleware = require('./lib/middleware/csrfMiddleware');
const honeypot = require('./lib/middleware/honeypot');
const fs = require('fs').promises;
const { createServer } = require('http');
const { Server } = require('socket.io');
const {
  PORT: envPort,
  NODE_ENV,
  CORS_ORIGIN,
  RATE_LIMIT,
  COOKIE_SECRET, // Importar COOKIE_SECRET
} = require('./lib/config/config');
const { globalErrorHandler } = require('./lib/middleware/errorHandler');
const { applyDatabaseMigrations } = require('./lib/db/db-init');
const { connectToRedis } = require('./lib/db/redisClient'); // Import Redis connection
const performanceInitializer = require('./lib/performance/performanceInitializer');
const { logger, httpLogger } = require('./lib/logger/logger');

const app = express();
const port = envPort || 3000;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: NODE_ENV === 'production' ? CORS_ORIGIN : 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Request-ID',
      'X-Requested-With',
    ],
    exposedHeaders: ['Content-Disposition', 'X-Request-ID'],
    credentials: true,
  },
});

// Inicializa o serviço de notificações com o Socket.IO
const notificationService = require('./lib/services/notificationService');
notificationService.init(io);

app.use((req, res, next) => {
  let requestId = req.headers['x-request-id'];
  if (!requestId) {
    requestId = randomUUID();
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
              scriptSrc: ["'self'", (req) => `'nonce-${req.id}'`],
              styleSrc: ["'self'", (req) => `'nonce-${req.id}'`],
              imgSrc: ["'self'", 'data:'],
              connectSrc: ["'self'"],
              fontSrc: ["'self'"],
              objectSrc: ["'none'"],
              frameAncestors: ["'none'"],
              baseUri: ["'self'"],
              formAction: ["'self'"],
              upgradeInsecureRequests: NODE_ENV === 'production' ? [] : null,
            },
          }
        : false,
    crossOriginEmbedderPolicy: NODE_ENV === 'production',
    crossOriginOpenerPolicy: NODE_ENV === 'production',
    crossOriginResourcePolicy: { policy: 'same-site' },
    originAgentCluster: true,
  })
);

app.use(
  cors({
    origin: NODE_ENV === 'production' ? CORS_ORIGIN : 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Request-ID',
      'X-Requested-With',
    ],
    exposedHeaders: ['Content-Disposition', 'X-Request-ID'],
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
  standardHeaders: true,
  legacyHeaders: false,
});
app.use((req, res, next) => {
  if (
    req.path.startsWith('/api/login') ||
    req.path.startsWith('/api/auth/login') ||
    req.path.startsWith('/api/csrf-token') // Exclude CSRF token route from general API limiter
  ) {
    return next();
  }
  apiLimiter(req, res, next);
});

// Limiter específico para rotas de login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Muitas tentativas de login deste IP. Tente novamente após 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body && req.body.username ? `${req.ip}-${req.body.username}`.toLowerCase() : req.ip;
  },
  skip: (req) => req.method === 'OPTIONS',
});
app.use('/api/login', loginLimiter);
app.use('/api/auth/login', loginLimiter);

app.use(xss());

if (!COOKIE_SECRET) {
  if (NODE_ENV === 'production') {
    logger.fatal(
      'CRÍTICO: COOKIE_SECRET não está definido em produção. Isso é um risco de segurança severo.'
    );
  } else {
    logger.warn(
      'AVISO: COOKIE_SECRET não configurado! Uma chave aleatória temporária foi gerada para desenvolvimento.'
    );
  }
}

app.use(cookieParser(COOKIE_SECRET)); // Usar o COOKIE_SECRET importado

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

/**
 * Configure response headers based on file type
 * This improves security by setting correct MIME types and preventing MIME sniffing
 */
const setContentTypeHeaders = (res, filePath) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.css') {
    res.setHeader('Content-Type', 'text/css; charset=UTF-8');
  } else if (ext === '.js') {
    res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
  } else if (ext === '.png') {
    res.setHeader('Content-Type', 'image/png');
  } else if (ext === '.jpg' || ext === '.jpeg') {
    res.setHeader('Content-Type', 'image/jpeg');
  } else if (ext === '.svg') {
    res.setHeader('Content-Type', 'image/svg+xml');
  } else if (ext === '.ico') {
    res.setHeader('Content-Type', 'image/x-icon');
  }
};

// Static file serving with appropriate caching and security headers
app.use(
  '/css',
  express.static(path.join(__dirname, '../frontend-react/css'), {
    // Changed path
    maxAge: oneDay,
    setHeaders: setContentTypeHeaders,
  })
);

app.use(
  '/js',
  express.static(path.join(__dirname, '../frontend-react/js'), {
    // Changed path
    maxAge: oneDay,
    setHeaders: setContentTypeHeaders,
  })
);

app.use(
  '/favicon.ico',
  express.static(path.join(__dirname, '../frontend-react/public/assets/favicon.ico'), {
    // Changed path to public/assets
    maxAge: oneDay * 7,
    setHeaders: setContentTypeHeaders,
  })
);

app.use(
  '/assets',
  express.static(path.join(__dirname, '../frontend-react/public/assets'), {
    // Changed path to public/assets
    maxAge: oneDay,
    setHeaders: setContentTypeHeaders,
  })
);

const authRoutes = require('./routes/auth');
const tournamentRoutes = require('./routes/tournaments.js');
const securityRoutes = require('./routes/security.js');
const adminRoutes = require('./routes/admin'); // Novo router para admin
const backupRoutes = require('./routes/backup'); // Rotas de backup
const scoresRoutes = require('./routes/scores'); // Novo router para scores
const playerRoutes = require('./routes/player'); // Import player routes
const userRoutes = require('./routes/users'); // Added for user routes
const performanceRoutes = require('./routes/performance'); // Performance monitoring routes
// const statsRoutes = require('./routes/stats'); // Removido pois as rotas foram movidas
const { checkDbConnection } = require('./lib/db/database');

app.use('/api', authRoutes);
app.use('/api/tournaments', tournamentRoutes); // Agora inclui as rotas de estatísticas de torneio e jogador
app.use('/api/system', securityRoutes);
app.use('/api/admin', adminRoutes); // Montar as rotas de admin
app.use('/api/admin/backup', backupRoutes); // Montar as rotas de backup
app.use('/api/admin/performance', performanceRoutes); // Performance monitoring routes
app.use('/api/scores', scoresRoutes); // Montar as rotas de scores
app.use('/api/players', playerRoutes); // Mount player routes
app.use('/api/users', userRoutes); // Use the user routes
// app.use('/api/stats', statsRoutes); // Removido pois as rotas foram movidas

// Endpoint to provide CSRF token to SPA clients
app.get('/api/csrf-token', csrfMiddleware.csrfProvider, (req, res) => {
  // The csrfProvider middleware has set the cookie.
  // Optionally send the token in the response body if needed by the client,
  // though reading from the cookie is typical for subsequent requests.
  res.status(200).json({
    success: true,
    message: 'CSRF token provided.',
    csrfToken: res.locals.csrfToken, // res.locals.csrfToken is set by csrfProvider
  });
});

// Health check endpoint for monitoring and system status
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
  res.status(404).json({ success: false, message: 'Endpoint API não encontrado.' });
});

app.get('/admin.html', csrfMiddleware.csrfProvider, async (req, res, next) => {
  try {
    const filePath = path.join(__dirname, '../frontend-react/public/admin.html'); // Changed path, assuming it's in public
    const htmlContent = await fs.readFile(filePath, 'utf-8');
    const injectedHtml = honeypot.injectFields(htmlContent);
    res.send(injectedHtml);
  } catch (error) {
    logger.error('Erro ao servir admin.html com honeypot:', error);
    next(error);
  }
});

app.get('/admin-security.html', csrfMiddleware.csrfProvider, async (req, res, next) => {
  try {
    const filePath = path.join(__dirname, '../frontend-react/public/admin-security.html'); // Changed path, assuming it's in public
    const htmlContent = await fs.readFile(filePath, 'utf-8');
    const injectedHtml = honeypot.injectFields(htmlContent);
    res.send(injectedHtml);
  } catch (error) {
    logger.error('Erro ao servir admin-security.html com honeypot:', error);
    next(error);
  }
});
app.get(['/', '/index.html'], csrfMiddleware.csrfProvider, async (req, res, next) => {
  try {
    const filePath = path.join(__dirname, '../frontend-react/index.html'); // Changed path (Vite's index.html is usually at root of its project)
    const htmlContent = await fs.readFile(filePath, 'utf-8');
    const injectedHtml = honeypot.injectFields(htmlContent);
    res.send(injectedHtml);
  } catch (error) {
    logger.error('Erro ao servir index.html com honeypot:', error);
    next(error);
  }
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API endpoint não encontrado' });
  }

  if (path.extname(req.path).length > 0 && !req.path.endsWith('.html')) {
    return next();
  }

  res.sendFile(path.join(__dirname, '../frontend-react/index.html')); // Changed path
});

/**
 * Starts the server with proper initialization of dependencies
 * Sets up graceful shutdown and error handling
 */
async function startServer() {
  try {
    await applyDatabaseMigrations();
    await connectToRedis(); // Initialize Redis connection

    // Initialize performance optimizations
    try {
      await performanceInitializer.initialize();
      logger.info('Sistema de performance inicializado com sucesso');
    } catch (err) {
      logger.warn(
        { err },
        'Falha ao inicializar sistema de performance, continuando sem otimizações'
      );
    }

    // Initialize backup system
    try {
      const backupManager = require('./lib/backup/backupManager');
      await backupManager.initialize();
      logger.info('Sistema de backup inicializado com sucesso');
    } catch (err) {
      logger.warn(
        { err },
        'Falha ao inicializar sistema de backup, continuando sem backups automáticos'
      );
    }

    const server = httpServer.listen(port, () => {
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

const serverInstance = startServer(); // Capture the server instance

// Global error handling for uncaught exceptions and unhandled promise rejections
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

// Export for testing and programmatic usage

module.exports = { app, serverInstance }; // Export app and server for testing
