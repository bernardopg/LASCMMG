const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const {
  PORT,
  NODE_ENV,
  CORS_ORIGIN,
  RATE_LIMIT,
} = require('./lib/config/config'); // Ajustado para caminho completo
const { globalErrorHandler } = require('./lib/middleware/errorHandler'); // Ajustado para caminho completo
const {
  initializeDatabase,
  testDatabaseConnection,
} = require('./lib/db/db-init'); // Ajustado para caminho completo
const honeypot = require('./lib/middleware/honeypot'); // Ajustado para caminho completo
const logger = require('./lib/logger/logger'); // Ajustado para caminho completo
const authMiddleware = require('./lib/middleware/authMiddleware'); // Movido para o topo

const app = express();
const port = PORT || 3001;

async function setupDatabase() {
  try {
    await initializeDatabase();

    const testResult = await testDatabaseConnection();
    if (!testResult) {
      logger.error('Teste de conexão com banco de dados SQLite falhou!');
      logger.warn(
        'O servidor será iniciado, mas poderá haver problemas de persistência.'
      );
    } else {
      logger.info(
        'Conexão com banco de dados SQLite estabelecida com sucesso.'
      );
    }
  } catch (error) {
    logger.error('Erro ao inicializar banco de dados SQLite:', error);
    logger.warn(
      'O servidor será iniciado, mas pode não funcionar como esperado sem o banco de dados.'
    );
  }
}

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin: NODE_ENV === 'production' ? CORS_ORIGIN : '*',
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
app.use('/api/', apiLimiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message:
      'Muitas tentativas de login, conta temporariamente bloqueada. Tente novamente após 15 minutos',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body.username
      ? `${req.ip}-${req.body.username}`.toLowerCase()
      : req.ip;
  },
});
app.use('/api/login', loginLimiter);
app.use('/api/auth/login', loginLimiter);

const activeHoneypots = honeypot.setupHoneypots(app, 15);

const blockMaliciousIps = honeypot.createBlockMiddleware({
  threshold: 3,
  duration: 6 * 60 * 60000,
  whitelistIps: ['127.0.0.1'],
});
app.use(blockMaliciousIps);

logger.initialize().catch((err) => {
  logger.error('Erro ao inicializar sistema de logs:', err);
});

app.use(logger.middleware);
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/css', express.static(path.join(__dirname, '../frontend/css')));
app.use('/js', express.static(path.join(__dirname, '../frontend/js')));
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets')));
app.use(
  '/favicon.ico',
  express.static(path.join(__dirname, '../frontend/favicon.ico'))
);

const authRoutes = require('./routes/auth');
const tournamentRoutes = require('./routes/tournaments-sqlite');
const statsRoutes = require('./routes/stats');
const systemStatsRoutes = require('./routes/system-stats');

app.use('/api', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/system', systemStatsRoutes);

app.get(
  '/api/system/security/honeypot-stats',
  authMiddleware.requireAdmin,
  (req, res) => {
    try {
      const stats = honeypot.getThreatStats();
      stats.activeHoneypots = activeHoneypots;
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Erro ao obter estatísticas de honeypot:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter estatísticas de segurança',
      });
    }
  }
);

app.use(globalErrorHandler);

app.use('/api/*', (req, res) => {
  res
    .status(404)
    .json({ success: false, message: 'Endpoint API não encontrado.' });
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

app.get('/admin-security.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin-security.html'));
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  if (path.extname(req.path).length > 0 && !req.path.endsWith('.html')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

async function startServer() {
  await setupDatabase();
  app.listen(port, () => {
    logger.info(`Servidor rodando na porta ${port} em modo ${NODE_ENV}`);
    logger.info(
      `CORS habilitado para: ${NODE_ENV === 'production' ? CORS_ORIGIN : '*'}`
    );
    activeHoneypots.forEach((hp) =>
      logger.info(
        `Honeypot ativo em: ${hp.path} para o método ${hp.method.toUpperCase()}`
      )
    );
  });
}

startServer().catch((err) => {
  logger.fatal('Erro crítico ao iniciar o servidor:', err);
  process.exit(1); // Encerra o processo se houver erro crítico na inicialização
});
