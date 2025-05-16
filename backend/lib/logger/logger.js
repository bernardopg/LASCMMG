const pino = require('pino');
const pinoHttp = require('pino-http');
const { NODE_ENV, DB_CONFIG } = require('../config/config');

const isProduction = NODE_ENV === 'production';
const defaultLogLevel = isProduction ? 'info' : 'debug';

// Opções de transporte para desenvolvimento (console) e produção (arquivo)
const transport = pino.transport({
  targets: [
    {
      level: defaultLogLevel,
      target: 'pino-pretty', // Formato legível para o console em desenvolvimento
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
    // Em produção, também podemos adicionar um transporte para arquivo, se necessário.
    // Por exemplo, para um arquivo de log rotativo:
    // {
    //   level: 'info',
    //   target: 'pino/file',
    //   options: { destination: '/path/to/app.log', mkdir: true },
    // },
  ],
});

const logger = pino(
  {
    level: defaultLogLevel,
    // Redact para mascarar informações sensíveis
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers["x-csrf-token"]',
        'req.headers.cookie',
        'res.headers["set-cookie"]',
        '*.password',
        '*.hashedPassword',
        '*.token',
        '*.jwt',
        '*.secret',
        'body.password', // Para requisições de login/registro
        'body.currentPassword',
        'body.newPassword',
      ],
      censor: '[REDACTED]',
    },
    // Adicionar campos customizados ao log, se necessário
    // base: {
    //   environment: NODE_ENV,
    //   // Adicionar outros campos estáticos aqui
    // },
    timestamp: pino.stdTimeFunctions.isoTime, // Formato de timestamp ISO
  },
  // Usar o transporte configurado apenas se não estiver em ambiente de teste
  // e se não for para logar queries do DB (que já usa console.log)
  NODE_ENV !== 'test' && !DB_CONFIG.logQueries ? transport : undefined
);

const httpLogger = pinoHttp({
  logger,
  // Customizar o formato da mensagem de log para requisições HTTP
  customLogLevel: function (req, res, err) {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn';
    } else if (res.statusCode >= 500 || err) {
      return 'error';
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      return 'silent'; // Não logar redirecionamentos por padrão
    }
    return 'info';
  },
  customSuccessMessage: function (req, res) {
    if (res.statusCode === 404) {
      return `Resource not found: ${req.method} ${req.url}`;
    }
    // Evitar log de 'request completed' para /ping para não poluir os logs
    if (req.url && req.url.startsWith('/ping')) {
      return ''; // Retorna string vazia para não logar
    }
    return `${req.method} ${req.url} - ${res.statusCode}`;
  },
  customErrorMessage: function (req, res, err) {
    return `${req.method} ${req.url} - ${res.statusCode} - ${err.message}`;
  },
  // Adicionar um ID de requisição para rastreamento
  genReqId: function (req, res) {
    const existingID = req.id || req.headers['x-request-id'];
    if (existingID) return existingID;
    const id = require('crypto').randomBytes(16).toString('hex');
    res.setHeader('X-Request-Id', id);
    return id;
  },
  // Não logar automaticamente todas as requisições e respostas
  // Vamos logar manualmente nos handlers ou onde for necessário mais contexto
  autoLogging: {
    ignore: (req) => {
      // Ignorar logs automáticos para /ping e assets estáticos
      if (
        req.url &&
        (req.url.startsWith('/ping') ||
          req.url.startsWith('/css') ||
          req.url.startsWith('/js') ||
          req.url.startsWith('/assets'))
      ) {
        return true;
      }
      return false;
    },
  },
  // Serializers customizados para req e res, se necessário
  // serializers: {
  //   req: pino.stdSerializers.req,
  //   res: pino.stdSerializers.res,
  //   err: pino.stdSerializers.err,
  // },
});

module.exports = { logger, httpLogger };
