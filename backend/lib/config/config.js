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
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP no período
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
const JWT_SECRET =
  process.env.JWT_SECRET ||
  (NODE_ENV === 'production'
    ? undefined
    : crypto.randomBytes(32).toString('hex'));

// Verificação de segurança para ambiente de produção
if (!process.env.JWT_SECRET) {
  // Em produção: erro grave
  if (NODE_ENV === 'production') {
    console.error(
      '\x1b[41m\x1b[37m%s\x1b[0m',
      ' ERRO CRÍTICO DE SEGURANÇA: JWT_SECRET não definido em produção! '
    );
    console.error(
      '\x1b[31m%s\x1b[0m',
      'Defina JWT_SECRET como uma string aleatória e segura nas variáveis de ambiente.'
    );
    console.error(
      'A aplicação continuará, mas TODAS as autenticações estarão comprometidas!'
    );
  }
  // Em desenvolvimento: alerta
  else {
    console.warn(
      '\x1b[33m%s\x1b[0m',
      '⚠️ AVISO: JWT_SECRET não configurado! Uma chave aleatória foi gerada.'
    );
    console.warn(
      'Esta chave será redefinida em cada reinicialização, causando invalidação de sessões.'
    );
  }
}

const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

// Exportar configurações
module.exports = {
  NODE_ENV,
  PORT,
  CORS_ORIGIN,
  RATE_LIMIT,
  DB_CONFIG,
  JWT_SECRET,
  JWT_EXPIRATION,
};
