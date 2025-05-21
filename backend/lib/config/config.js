/**
 * Configurações do aplicativo
 *
 * Este arquivo contém as configurações gerais do aplicativo,
 * incluindo variáveis de ambiente e configurações padrão.
 */

// Configurações do ambiente
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 3000;

// Configurações CORS
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Configurações de segurança
const RATE_LIMIT = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || (NODE_ENV === 'development' ? 1000 : 100), // Increased for dev
};

// Configurações do banco de dados
const DB_CONFIG = {
  // Diretório base para armazenar dados
  dataDir: process.env.DATA_DIR || './data',

  // Nome do arquivo de banco de dados
  dbFile: NODE_ENV === 'test' ? 'test-database.sqlite' : 'database.sqlite',

  // Flag para log de queries (somente desenvolvimento)
  logQueries: NODE_ENV === 'development',
};

// Configurações de JWT (JSON Web Token)
const crypto = require('crypto');

// Gerar JWT_SECRET aleatório para ambiente de desenvolvimento
let JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (NODE_ENV === 'production') {
    // eslint-disable-next-line no-console
    console.error(
      '\x1b[41m\x1b[37m%s\x1b[0m',
      ' ERRO CRÍTICO DE SEGURANÇA: JWT_SECRET não definido em produção! '
    );
    // eslint-disable-next-line no-console
    console.error(
      '\x1b[31m%s\x1b[0m',
      'Defina JWT_SECRET como uma string aleatória e segura nas variáveis de ambiente. A aplicação será encerrada.'
    );
    process.exit(1); // Encerrar a aplicação
  } else {
    JWT_SECRET = crypto.randomBytes(32).toString('hex');
    // eslint-disable-next-line no-console
    console.warn(
      '\x1b[33m%s\x1b[0m',
      '⚠️ AVISO: JWT_SECRET não configurado! Uma chave aleatória temporária foi gerada para desenvolvimento.'
    );
    // eslint-disable-next-line no-console
    console.warn(
      'Esta chave será redefinida em cada reinicialização, causando invalidação de sessões.'
    );
  }
}

const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

// Configurações de Cookie Secret
let COOKIE_SECRET = process.env.COOKIE_SECRET;

if (!COOKIE_SECRET) {
  if (NODE_ENV === 'production') {
    // eslint-disable-next-line no-console
    console.error(
      '\x1b[41m\x1b[37m%s\x1b[0m',
      ' ERRO CRÍTICO DE SEGURANÇA: COOKIE_SECRET não definido em produção! '
    );
    // eslint-disable-next-line no-console
    console.error(
      '\x1b[31m%s\x1b[0m',
      'Defina COOKIE_SECRET como uma string aleatória e segura nas variáveis de ambiente. A aplicação será encerrada.'
    );
    process.exit(1); // Encerrar a aplicação
  } else {
    COOKIE_SECRET = crypto.randomBytes(32).toString('hex');
    // eslint-disable-next-line no-console
    console.warn(
      '\x1b[33m%s\x1b[0m',
      '⚠️ AVISO: COOKIE_SECRET não configurado! Uma chave aleatória temporária foi gerada para desenvolvimento.'
    );
    // eslint-disable-next-line no-console
    console.warn(
      'Esta chave será redefinida em cada reinicialização, invalidando sessões de cookie (ex: CSRF).'
    );
  }
}

// Configurações do Redis
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Configurações de CSRF Secret
let CSRF_SECRET = process.env.CSRF_SECRET;

if (!CSRF_SECRET) {
  if (NODE_ENV === 'production') {
    // eslint-disable-next-line no-console
    console.error(
      '\x1b[41m\x1b[37m%s\x1b[0m',
      ' ERRO CRÍTICO DE SEGURANÇA: CSRF_SECRET não definido em produção! '
    );
    // eslint-disable-next-line no-console
    console.error(
      '\x1b[31m%s\x1b[0m',
      'Defina CSRF_SECRET como uma string aleatória e segura nas variáveis de ambiente. A aplicação será encerrada.'
    );
    process.exit(1); // Encerrar a aplicação
  } else {
    CSRF_SECRET = crypto.randomBytes(32).toString('hex');
    // eslint-disable-next-line no-console
    console.warn(
      '\x1b[33m%s\x1b[0m',
      '⚠️ AVISO: CSRF_SECRET não configurado! Uma chave aleatória temporária foi gerada para desenvolvimento.'
    );
  }
}

// Exportar configurações
module.exports = {
  NODE_ENV,
  PORT,
  CORS_ORIGIN,
  RATE_LIMIT,
  DB_CONFIG,
  JWT_SECRET,
  JWT_EXPIRATION,
  COOKIE_SECRET, // Adicionado
  REDIS_URL,
  CSRF_SECRET, // Adicionado
};
