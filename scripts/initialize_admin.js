// scripts/initialize_admin.js
/* eslint-disable no-console */
/**
 * Script consolidado para gerenciamento de usuários administradores
 * Substitui os scripts anteriores:
 * - create_admin_user.js
 * - create_test_admin.js
 * - create_custom_admin.js
 *
 * Uso:
 * - Criar/atualizar administrador personalizado: node scripts/initialize_admin.js --username <email> --password <senha> [--role <papel>]
 * - Criar administrador padrão: node scripts/initialize_admin.js --default
 * - Criar administrador de teste: node scripts/initialize_admin.js --test
 */

const adminModel = require('../backend/lib/models/adminModel');
const { db, runAsync, closeSyncConnection } = require('../backend/lib/db/database');
const bcrypt = require('bcrypt');

// Configurações padrão
const DEFAULT_ADMIN = {
  username: 'admin@example.com',
  password: 'Admin123!',
  role: 'super_admin',
  permissions: ['all'],
};

const TEST_ADMIN = {
  username: 'testadmin@example.com',
  password: 'TestAdmin123!',
  role: 'admin',
  permissions: ['all'],
};

// Function to parse command line arguments
function getArgs() {
  const args = {};
  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      if (key && value) {
        args[key] = value;
      } else if (key) {
        // Handle boolean flags if needed in the future, or flags without explicit value
        const nextArg = process.argv[process.argv.indexOf(arg) + 1];
        if (nextArg && !nextArg.startsWith('--')) {
          args[key] = nextArg; // Assign next segment as value
        } else {
          args[key] = true; // Or treat as a boolean flag
        }
      }
    }
  });
  return args;
}

async function initializeAdmin() {
  const args = getArgs();
  let adminConfig = {};

  // Determinar qual configuração usar com base nos argumentos
  if (args.default) {
    adminConfig = { ...DEFAULT_ADMIN };
    console.log('Usando configuração de administrador padrão');
  } else if (args.test) {
    adminConfig = { ...TEST_ADMIN };
    console.log('Usando configuração de administrador de teste');
  } else {
    // Configuração personalizada
    if (!args.username || !args.password) {
      console.error('Erro: Argumentos --username ou --password ausentes.');
      console.log(
        'Uso: node scripts/initialize_admin.js --username <email> --password <senha> [--role <papel>]\n' +
          '  ou: node scripts/initialize_admin.js --default\n' +
          '  ou: node scripts/initialize_admin.js --test'
      );
      return;
    }

    adminConfig = {
      username: args.username,
      password: args.password,
      role: args.role || 'super_admin',
      permissions: ['all'],
    };
  }

  // Ensure DB is initialized before trying to use it.
  if (!db || !db.open) {
    console.error('Conexão com o banco de dados não está aberta. Verificando inicialização.');
  }

  try {
    console.log(`Tentando criar/atualizar usuário administrador: ${adminConfig.username}`);
    const existingAdmin = await adminModel.getAdminByUsername(adminConfig.username);

    if (existingAdmin) {
      console.log(
        `Usuário administrador "${adminConfig.username}" (ID: ${existingAdmin.id}) já existe. Atualizando senha.`
      );
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(adminConfig.password, saltRounds);
      const sql = 'UPDATE users SET hashedPassword = ? WHERE id = ?';
      await runAsync(sql, [hashedPassword, existingAdmin.id]);
      console.log(`Senha para usuário administrador "${adminConfig.username}" foi atualizada.`);
    } else {
      const createdAdmin = await adminModel.createAdmin({
        username: adminConfig.username,
        password: adminConfig.password,
        role: adminConfig.role,
        permissions: adminConfig.permissions,
      });

      console.log('Usuário administrador criado com sucesso:');
      console.log(`  ID: ${createdAdmin.id}`);
      console.log(`  Username: ${createdAdmin.username}`);
      console.log(`  Role: ${createdAdmin.role}`);
      console.log(`\nSenha definida como: ${adminConfig.password} (será criptografada)`);
      console.log(
        'Por favor, certifique-se de que esta senha seja segura e gerenciada adequadamente.'
      );
    }
  } catch (error) {
    console.error('Erro ao criar usuário administrador:');
    console.error(`  Mensagem: ${error.message}`);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      console.error(
        `  Detalhe: O nome de usuário "${adminConfig.username}" provavelmente já existe.`
      );
    } else {
      console.error(`  Stack: ${error.stack}`);
    }
  } finally {
    if (db && db.open) {
      console.log('Fechando conexão com o banco de dados.');
      closeSyncConnection();
    }
  }
}

initializeAdmin();
