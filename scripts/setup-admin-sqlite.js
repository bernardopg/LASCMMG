#!/usr/bin/env node

/* eslint-env node */

/**
 * Script para configurar o administrador no banco de dados SQLite
 * Migra as credenciais do arquivo admin_credentials.json para a tabela SQLite
 */

const fs = require('fs');
const path = require('path');
const { admin: adminModel } = require('../lib/db-init').models;
const { DB_CONFIG } = require('../lib/config');
const { program } = require('commander');

// Configuração do programa CLI
program
  .name('setup-admin-sqlite')
  .description('Configurar administrador no banco SQLite')
  .version('1.0.0');

program
  .option('-v, --verbose', 'Mostrar informações detalhadas')
  .option('-f, --force', 'Forçar recriação do administrador');

program.parse(process.argv);

const options = program.opts();

// Caminho para o arquivo de credenciais
const CREDENTIALS_FILE_PATH = path.join(
  __dirname,
  '..',
  'admin_credentials.json'
);

/**
 * Configuração do administrador no SQLite
 */
async function setupAdmin() {
  console.log('⚙️ Configurando administrador no SQLite...');

  // Verificar se o arquivo de credenciais existe
  if (!fs.existsSync(CREDENTIALS_FILE_PATH)) {
    console.error('❌ Arquivo admin_credentials.json não encontrado!');
    console.log(
      '   Use o script generate_admin_hash.js para criar credenciais.'
    );
    process.exit(1);
  }

  // Carregar credenciais
  const credentials = JSON.parse(
    fs.readFileSync(CREDENTIALS_FILE_PATH, 'utf8')
  );

  if (!credentials || !credentials.username || !credentials.hashedPassword) {
    console.error('❌ Arquivo de credenciais inválido ou incompleto!');
    process.exit(1);
  }

  // Verificar se o admin já existe
  const adminExists = await adminModel.adminExists(credentials.username);

  if (adminExists && !options.force) {
    console.log(
      `✅ Administrador "${credentials.username}" já existe no banco.`
    );
    console.log('   Use a opção --force para recriar se necessário.');
    return;
  }

  // Criar o administrador no banco
  try {
    // Se estamos no modo force e o admin já existe, precisamos criar um novo admin
    // usando a lógica interna do adminModel
    if (options.force) {
      // Primeiro migrar as credenciais para ter certeza
      await adminModel.migrateAdminCredentials();
      console.log(
        `🔄 Administrador "${credentials.username}" recriado no banco.`
      );
    } else {
      // Se o admin não existe, migrar as credenciais
      const migrationResult = await adminModel.migrateAdminCredentials();

      if (migrationResult.success) {
        console.log(
          `✅ Administrador "${migrationResult.username}" configurado com sucesso.`
        );
      } else {
        console.error(
          `❌ Erro ao migrar administrador: ${migrationResult.message}`
        );
      }
    }
  } catch (err) {
    console.error('❌ Erro ao configurar administrador:', err.message);
    process.exit(1);
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('\n=== Configuração de Administrador SQLite ===\n');

  if (options.verbose) {
    console.log('📊 Informações:');
    console.log(
      ` - Banco de dados: ${path.join(DB_CONFIG.dataDir, DB_CONFIG.dbFile)}`
    );
    console.log(` - Credenciais: ${CREDENTIALS_FILE_PATH}`);
    console.log('');
  }

  await setupAdmin();

  console.log('\n✨ Configuração concluída!');

  if (options.verbose) {
    console.log('\nDicas:');
    console.log(
      ' - Para testar o login, acesse: http://localhost:3000/admin.html'
    );
    console.log(
      ' - Para gerar um novo hash, use: node scripts/generate_admin_hash.js --new <senha> --update'
    );
    console.log(
      ' - Para verificar uma senha, use: node scripts/generate_admin_hash.js --verify <senha>'
    );
  }
}

// Executar função principal
main()
  .catch((err) => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
  })
  .finally(() => {
    // Encerrar o processo manualmente para garantir que o script termine
    setTimeout(() => process.exit(0), 500);
  });
