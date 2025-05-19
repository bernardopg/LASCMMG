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
// const serveStatic = require('serve-static'); // Unused import
const {
  PORT: envPort,
  NODE_ENV,
  CORS_ORIGIN,
  RATE_LIMIT,
  COOKIE_SECRET, // Importar COOKIE_SECRET
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
  standardHeaders: true,
  legacyHeaders: false,
});
app.use((req, res, next) => {
  if (
    req.path.startsWith('/api/login') ||
    req.path.startsWith('/api/auth/login')
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
    message:
      'Muitas tentativas de login deste IP. Tente novamente após 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body && req.body.username
      ? `${req.ip}-${req.body.username}`.toLowerCase()
      : req.ip;
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

// Função para definir os cabeçalhos adequados por tipo de arquivo
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

// Configuração de arquivos estáticos com headers adequados
app.use(
  '/css',
  express.static(path.join(__dirname, '../frontend/css'), {
    maxAge: oneDay,
    setHeaders: setContentTypeHeaders,
  })
);

app.use(
  '/js',
  express.static(path.join(__dirname, '../frontend/js'), {
    maxAge: oneDay,
    setHeaders: setContentTypeHeaders,
  })
);

app.use(
  '/favicon.ico',
  express.static(path.join(__dirname, '../frontend/assets/favicon.ico'), {
    maxAge: oneDay * 7,
    setHeaders: setContentTypeHeaders,
  })
);

app.use(
  '/assets',
  express.static(path.join(__dirname, '../frontend/assets'), {
    maxAge: oneDay,
    setHeaders: setContentTypeHeaders,
  })
);

const authRoutes = require('./routes/auth');
const tournamentRoutes = require('./routes/tournaments.js');
const securityRoutes = require('./routes/security.js');
const adminRoutes = require('./routes/admin'); // Novo router para admin
const scoresRoutes = require('./routes/scores'); // Novo router para scores
// const statsRoutes = require('./routes/stats'); // Removido pois as rotas foram movidas
const { checkDbConnection } = require('./lib/db/database');

app.use('/api', authRoutes);
app.use('/api/tournaments', tournamentRoutes); // Agora inclui as rotas de estatísticas de torneio e jogador
app.use('/api/system', securityRoutes);
app.use('/api/admin', adminRoutes); // Montar as rotas de admin
app.use('/api/scores', scoresRoutes); // Montar as rotas de scores
// app.use('/api/stats', statsRoutes); // Removido pois as rotas foram movidas

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
    const filePath = path.join(__dirname, '../frontend/admin.html');
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
      const filePath = path.join(__dirname, '../frontend/admin-security.html');
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
      const filePath = path.join(__dirname, '../frontend/index.html');
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

  res.sendFile(path.join(__dirname, '../frontend/index.html'));
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
