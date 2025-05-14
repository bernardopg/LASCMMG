require('dotenv').config();
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const xss = require('xss-clean');
const csrfMiddleware = require('./lib/csrfMiddleware');
const honeypot = require('./lib/honeypot'); // Contém middleware e injectFields
const fs = require('fs').promises; // Para ler arquivos HTML async
const {
  PORT: envPort,
  NODE_ENV,
  CORS_ORIGIN,
  RATE_LIMIT,
} = require('./lib/config');
const { globalErrorHandler } = require('./lib/errorHandler');
const { applyDatabaseMigrations } = require('./lib/db-init');

const app = express();
const port = envPort || 3000;

if (NODE_ENV !== 'production') {
  console.log('Servidor rodando em modo de desenvolvimento');
} else {
  console.log('Servidor rodando em modo de produção');

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
              styleSrc: ["'self'"], // Removido 'unsafe-inline'
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
  console.error('⚠️ ALERTA DE SEGURANÇA: COOKIE_SECRET não configurado!');
  console.error(
    'Uma chave aleatória temporária foi gerada, mas será redefinida em cada reinicialização.'
  );
  console.error(
    'Isto é inseguro para produção e causará invalidação de sessões.'
  );

  if (NODE_ENV === 'production') {
    console.error(' CRÍTICO: COOKIE_SECRET ausente em ambiente de PRODUÇÃO! ');
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

app.use(morgan('dev'));
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

const staticOptions = {
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'public, max-age=86400');

    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    }

    res.setHeader('X-Content-Type-Options', 'nosniff');
  },
};

app.use('/css', express.static(path.join(__dirname, 'css'), staticOptions));
app.use('/js', express.static(path.join(__dirname, 'js'), staticOptions));
app.use(
  '/assets',
  express.static(path.join(__dirname, 'assets'), staticOptions)
);

const authRoutes = require('./routes/auth');
const tournamentSqliteRoutes = require('./routes/tournaments-sqlite');
const systemStatsRouter = require('./routes/system-stats');
const legacyStatsRoutes = require('./routes/stats');

app.use('/api', authRoutes);
app.use('/api/tournaments', tournamentSqliteRoutes);
app.use('/api/system', systemStatsRouter);
app.use('/api/stats', legacyStatsRoutes);
app.get('/ping', (req, res) => res.status(200).send('pong')); // Movido para cá

app.use((req, res, next) => {
  req.startTime = Date.now();
  req.requestId = require('crypto').randomBytes(16).toString('hex');
  next();
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
    console.error('Erro ao servir admin.html com honeypot:', error);
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
      console.error('Erro ao servir admin-security.html com honeypot:', error);
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
      // CSP global do Helmet será aplicado
      res.send(injectedHtml);
    } catch (error) {
      console.error('Erro ao servir index.html com honeypot:', error);
      next(error);
    }
  }
);

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    // Este caso já é tratado pelo app.use('/api/*', ...) acima.
    // Mas manter aqui como um fallback não prejudica.
    return res
      .status(404)
      .json({ success: false, message: 'API endpoint não encontrado' });
  }

  // A verificação de path traversal é melhor tratada pelo Express e middlewares de segurança.
  // Se ainda for necessária uma verificação explícita, ela deve ser mais robusta.
  // Por ora, confiaremos nas defesas existentes.

  // Se for um arquivo com extensão, provavelmente é um recurso estático não encontrado.
  // Deixar o Express lidar com isso (resultará em 404 se não for uma rota definida).
  if (path.extname(req.path).length > 0 && !req.path.endsWith('.html')) {
    // Se for um arquivo com extensão que não seja .html, provavelmente é um asset não encontrado.
    // Deixe o Express tratar (resultará em 404 se não for uma rota ou arquivo estático).
    return next();
  }

  // Para outras rotas não API e não arquivos estáticos conhecidos, servir index.html (SPA behavior)
  // CSP global do Helmet será aplicado
  res.sendFile(path.join(__dirname, 'index.html'));
});

async function startServer() {
  try {
    // lib/database.js já cria as tabelas ao conectar.
    // Aqui aplicamos quaisquer migrações de esquema pendentes.
    await applyDatabaseMigrations();
    const server = app.listen(port, () => {
      console.log(`Servidor rodando em http://localhost:${port}`);
    });

    process.on('SIGTERM', () => {
      console.log('SIGTERM recebido. Encerrando servidor graciosamente...');
      server.close(() => {
        console.log('Servidor encerrado.');
        process.exit(0);
      });

      setTimeout(() => {
        console.error('Tempo limite de encerramento excedido. Forçando saída.');
        process.exit(1);
      }, 10000);
    });
  } catch (error) {
    console.error('Erro fatal ao iniciar o servidor:', error);
    process.exit(1);
  }
}

startServer();

process.on('uncaughtException', (error) => {
  console.error('Erro não capturado:', error);
  if (NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, _promise) => {
  console.error('Rejeição de Promise não tratada:', reason);
});
// app.get('/ping', ...) foi movido para cima
