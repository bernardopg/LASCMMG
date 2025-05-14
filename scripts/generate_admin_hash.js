#!/usr/bin/env node

/* eslint-env node */

/**
 * Script para gerar um hash bcrypt para senha de administrador
 * Também verifica se uma senha fornecida corresponde ao hash existente
 *
 * Uso:
 *   node scripts/generate_admin_hash.js --new <senha> # Gera um novo hash
 *   node scripts/generate_admin_hash.js --verify <senha> # Verifica se a senha corresponde ao hash atual
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { program } = require('commander');

// Configuração do programa CLI
program
  .name('generate-admin-hash')
  .description('Ferramenta para gerenciar credenciais de administrador')
  .version('1.0.0');

program
  .option('-n, --new <password>', 'Gerar novo hash para a senha')
  .option(
    '-v, --verify <password>',
    'Verificar se a senha corresponde ao hash existente'
  )
  .option(
    '-u, --update',
    'Atualizar arquivo admin_credentials.json com o novo hash'
  );

program.parse(process.argv);

const options = program.opts();

// Caminho para o arquivo de credenciais
const CREDENTIALS_FILE_PATH = path.join(
  __dirname,
  '..',
  'admin_credentials.json'
);

// Configurações bcrypt
const SALT_ROUNDS = 10;

/**
 * Gera um hash bcrypt para a senha fornecida
 * @param {string} password - Senha a ser codificada
 * @returns {Promise<string>} Hash bcrypt da senha
 */
async function generateHash(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifica se a senha corresponde ao hash
 * @param {string} password - Senha a verificar
 * @param {string} hash - Hash bcrypt para comparar
 * @returns {Promise<boolean>} True se a senha corresponder ao hash
 */
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Carrega as credenciais do arquivo JSON
 * @returns {Promise<object>} Objeto com username e hashedPassword
 */
async function loadCredentials() {
  try {
    if (!fs.existsSync(CREDENTIALS_FILE_PATH)) {
      return { username: 'admin', hashedPassword: null };
    }

    const data = fs.readFileSync(CREDENTIALS_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Erro ao ler arquivo de credenciais:', err.message);
    return { username: 'admin', hashedPassword: null };
  }
}

/**
 * Salva as credenciais no arquivo JSON
 * @param {object} credentials - Objeto com username e hashedPassword
 * @returns {Promise<void>}
 */
async function saveCredentials(credentials) {
  try {
    fs.writeFileSync(
      CREDENTIALS_FILE_PATH,
      JSON.stringify(credentials, null, 2),
      'utf8'
    );
    console.log('Arquivo de credenciais atualizado com sucesso!');
  } catch (err) {
    console.error('Erro ao salvar arquivo de credenciais:', err.message);
  }
}

/**
 * Função principal
 */
async function main() {
  // Verificar se alguma opção foi fornecida
  if (!options.new && !options.verify) {
    console.error('Erro: Você deve especificar --new ou --verify');
    program.help();
    process.exit(1);
  }

  const credentials = await loadCredentials();

  // Gerar novo hash
  if (options.new) {
    const hash = await generateHash(options.new);
    console.log('\nNovo hash bcrypt gerado:');
    console.log(hash);

    if (options.update) {
      credentials.hashedPassword = hash;
      await saveCredentials(credentials);
    } else {
      console.log(
        '\nPara atualizar o arquivo admin_credentials.json, use a opção --update'
      );
    }
  }

  // Verificar senha
  if (options.verify) {
    if (!credentials.hashedPassword) {
      console.error('Erro: Não há hash de senha armazenado para verificar');
      process.exit(1);
    }

    const isMatch = await verifyPassword(
      options.verify,
      credentials.hashedPassword
    );

    console.log(`\nHash atual: ${credentials.hashedPassword}`);
    console.log(`Senha fornecida: ${options.verify}`);
    console.log(
      `Resultado: ${isMatch ? 'SENHA CORRETA ✅' : 'SENHA INCORRETA ❌'}`
    );
  }
}

// Executar função principal
main().catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
