#!/usr/bin/env node

/**
 * Script para gerar chaves de segurança para o projeto LASCMMG
 *
 * Uso: node scripts/generate-keys.js [tipo]
 *
 * Tipos disponíveis:
 * - backup: Chave de criptografia para backups (256-bit)
 * - jwt: Chave JWT (256-bit)
 * - cookie: Chave para cookies (256-bit)
 * - csrf: Chave CSRF (256-bit)
 * - all: Gerar todas as chaves
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Cores para output no terminal
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function generateKey() {
  return crypto.randomBytes(32).toString('hex');
}

function logKey(type, key) {
  console.log(`${colors.blue}${colors.bold}${type.toUpperCase()}_KEY:${colors.reset}`);
  console.log(`${colors.green}${key}${colors.reset}\n`);
}

function generateAllKeys() {
  console.log(`${colors.bold}🔑 GERADOR DE CHAVES DE SEGURANÇA - LASCMMG${colors.reset}\n`);
  console.log(`${colors.yellow}⚠️  IMPORTANTE: Mantenha essas chaves seguras!${colors.reset}\n`);

  const keys = {
    backup: generateKey(),
    jwt: generateKey(),
    cookie: generateKey(),
    csrf: generateKey()
  };

  Object.entries(keys).forEach(([type, key]) => {
    logKey(type, key);
  });

  console.log(`${colors.bold}📝 Para usar no .env:${colors.reset}`);
  console.log(`BACKUP_ENCRYPTION_KEY=${keys.backup}`);
  console.log(`JWT_SECRET=${keys.jwt}`);
  console.log(`COOKIE_SECRET=${keys.cookie}`);
  console.log(`CSRF_SECRET=${keys.csrf}\n`);

  return keys;
}

function updateEnvExample(keys) {
  const envExamplePath = path.join(__dirname, '..', 'backend', '.env.example');

  if (!fs.existsSync(envExamplePath)) {
    console.log(`${colors.red}❌ Arquivo .env.example não encontrado${colors.reset}`);
    return;
  }

  let content = fs.readFileSync(envExamplePath, 'utf8');

  // Atualizar apenas os placeholders
  content = content.replace(
    /BACKUP_ENCRYPTION_KEY=your_256_bit_encryption_key_here/,
    `BACKUP_ENCRYPTION_KEY=${keys.backup}`
  );

  console.log(`${colors.green}✅ Chaves atualizadas no .env.example${colors.reset}`);
}

function main() {
  const arg = process.argv[2];

  switch (arg) {
    case 'backup':
      logKey('backup', generateKey());
      break;
    case 'jwt':
      logKey('jwt', generateKey());
      break;
    case 'cookie':
      logKey('cookie', generateKey());
      break;
    case 'csrf':
      logKey('csrf', generateKey());
      break;
    case 'all':
    default:
      const keys = generateAllKeys();
      if (arg === '--update-example') {
        updateEnvExample(keys);
      }
      break;
  }

  console.log(`${colors.yellow}💡 Dica: Use 'npm run generate-keys' para gerar novas chaves${colors.reset}`);
}

if (require.main === module) {
  main();
}

module.exports = { generateKey, generateAllKeys };
