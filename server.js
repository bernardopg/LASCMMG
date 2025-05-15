require('dotenv').config();
const express = require('express');
const path = require('path');
// const morgan = require('morgan'); // Morgan será substituído pelo logger do Pino
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const xss = require('xss-clean');
const csrfMiddleware = require('./lib/csrfMiddleware');
const honeypot = require('./lib/honeypot'); // Contém middleware e injectFields
const fs = require('fs').promises; // Para ler arquivos HTML async
const serveStatic = require('serve-static'); // Adicionado para cache de assets
const {
  PORT: envPort,
  NODE_ENV,
  CORS_ORIGIN,
  RATE_LIMIT,
} = require('./lib/config');
const { globalErrorHandler } = require('./lib/errorHandler');
const { applyDatabaseMigrations } = require('./lib/db-init');
const { logger, httpLogger } = require('./lib/logger'); // Importar logger e httpLogger

const app = express();
const port = envPort || 3000;

// Adicionar o httpLogger do Pino logo no início dos middlewares
// para logar todas as requisições que passam por ele.
// No entanto, o ID da requisição é gerado pelo httpLogger, então o middleware que o adiciona ao req.id
// deve vir *depois* do httpLogger.
app.use((req, res, next) => {
  // Este middleware garante que req.id está disponível para o httpLogger e para o globalErrorHandler
  // O httpLogger já tem genReqId, mas o adiciona ao log, não necessariamente ao objeto req em si
  // para uso em outros middlewares ANTES do log final da requisição.
  // Para garantir que req.id esteja disponível em toda parte, incluindo no globalErrorHandler,
  // e para que o httpLogger possa usar um ID existente se já definido (ex: por um load balancer),
  // vamos gerar/usar o ID aqui.

  // Usar X-Request-Id se já existir (ex: de um proxy reverso/LB)
  let requestId = req.headers['x-request-id'];
  if (!requestId) {
    requestId = require('crypto').randomBytes(16).toString('hex');
    // Definir o header para a resposta também, para que o cliente possa vê-lo
    res.setHeader('X-Request-Id', requestId);
  }
  req.id = requestId; // Adicionar ao objeto req para uso interno
  next();
});

app.use(httpLogger); // Agora o httpLogger pode usar req.id se já estiver definido

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

// app.use(morgan('dev')); // Remover morgan
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

// Configuração para servir arquivos estáticos com cache
// const staticPath = path.join(__dirname, 'public'); // Removido pois não é usado
// Se seus assets já estão em 'css', 'js', 'assets', ajuste ou adicione múltiplos middlewares
// Por exemplo, para manter a estrutura atual:
const oneDay = 86400000; // Milissegundos em um dia

app.use(
  '/css',
  serveStatic(path.join(__dirname, 'css'), {
    maxAge: oneDay,
    setHeaders: (res, filePath) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (serveStatic.mime.lookup(filePath) === 'text/css') {
        res.setHeader('Content-Type', 'text/css; charset=UTF-8');
      }
    },
  })
);

app.use(
  '/js',
  serveStatic(path.join(__dirname, 'js'), {
    maxAge: oneDay,
    setHeaders: (res, filePath) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (serveStatic.mime.lookup(filePath) === 'application/javascript') {
        res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
      }
    },
  })
);

app.use(
  '/assets',
  serveStatic(path.join(__dirname, 'assets'), {
    maxAge: oneDay, // Cache por 1 dia
    setHeaders: (res, _filePath) => {
      // Alterado para _filePath para indicar que não é usado
      // Definir outros headers se necessário, ex: Content-Type para tipos específicos
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  })
);

const authRoutes = require('./routes/auth');
const tournamentSqliteRoutes = require('./routes/tournaments-sqlite');
const systemStatsRouter = require('./routes/system-stats');
const legacyStatsRoutes = require('./routes/stats');
const { checkDbConnection } = require('./lib/database'); // Importar checkDbConnection

app.use('/api', authRoutes);
app.use('/api/tournaments', tournamentSqliteRoutes);
app.use('/api/system', systemStatsRouter);
app.use('/api/stats', legacyStatsRoutes);

// Atualizar o endpoint /ping para incluir a verificação do banco de dados
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
      // CSP global do Helmet será aplicado
      res.send(injectedHtml);
    } catch (error) {
      logger.error('Erro ao servir index.html com honeypot:', error);
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
  // Em produção, idealmente o processo seria reiniciado por um gerenciador de processos (PM2, systemd)
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(
    { err_reason: reason, promise_rejection_at: promise },
    'Rejeição de Promise não tratada (unhandledRejection):'
  );
  // Considerar encerrar o processo em caso de unhandledRejection, dependendo da política
  // if (NODE_ENV !== 'production') {
  //   process.exit(1);
  // }
});
