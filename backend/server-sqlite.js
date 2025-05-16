const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { PORT, NODE_ENV, CORS_ORIGIN, RATE_LIMIT } = require('./lib/config');
const { globalErrorHandler } = require('./lib/errorHandler');
const { initializeDatabase, testDatabaseConnection } = require('./lib/db-init');
const honeypot = require('./lib/honeypot');
const logger = require('./lib/logger');

const app = express();
const port = PORT || 3001;

async function setupDatabase() {
  try {
    await initializeDatabase();

    const testResult = await testDatabaseConnection();
    if (!testResult) {
      console.error('Teste de conexão com banco de dados SQLite falhou!');
      console.error(
        'O servidor será iniciado, mas poderá haver problemas de persistência.'
      );
    }
  } catch (error) {
    console.error('Erro ao inicializar banco de dados SQLite:', error);
    console.error(
      'O servidor será iniciado usando o modo de arquivo JSON como fallback.'
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
  console.error('Erro ao inicializar sistema de logs:', err);
});

app.use(logger.middleware);
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

const authRoutes = require('./routes/auth');
const tournamentRoutes = require('./routes/tournaments-sqlite');
const statsRoutes = require('./routes/stats');
const systemStatsRoutes = require('./routes/system-stats');

app.use('/api', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/system', systemStatsRoutes);

const authMiddleware = require('./lib/authMiddleware');
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
      console.error('Erro ao obter estatísticas de honeypot:', error);
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
  res.sendFile(path.join(__dirname, 'admin.html'));
});
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).send('Not Found');
  }
  if (path.extname(req.path).length > 0) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

setupDatabase()
  .then(() => {
    /* Inicialização do banco de dados concluída com sucesso */ void 0;
  })
  .catch((err) => {
    console.error('Erro crítico na inicialização do banco de dados:', err);

    app.listen(port, () => {});
  });
