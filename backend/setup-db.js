#!/usr/bin/env node

const { program } = require('commander');
const {
  initializeDatabase,
  testDatabaseConnection,
} = require('./lib/db/db-init'); // Caminho corrigido
// migrateDataFromJson was removed from db-init.js

program
  .version('1.0.0')
  .description(
    'Utilitário para configuração e migração do banco de dados SQLite'
  )
  .option('-i, --init', 'Inicializar o banco de dados')
  .option('-t, --test', 'Testar a conexão com o banco de dados')
  // Migrate option removed as migrateDataFromJson is discontinued
  .option(
    '-d, --data-dir <path>',
    'Diretório para armazenar o banco de dados',
    './data'
  )
  .parse(process.argv);

const options = program.opts();

async function main() {
  try {
    if (!options.init && !options.test) {
      // Removed options.migrate
      program.help();
      return;
    }

    if (options.init) {
      await initializeDatabase();
      // eslint-disable-next-line no-console
      console.log('Banco de dados inicializado com sucesso.');
    }

    if (options.test) {
      const testResult = await testDatabaseConnection();
      if (testResult) {
        // eslint-disable-next-line no-console
        console.log('Teste de conexão bem-sucedido!');
      } else {
        // eslint-disable-next-line no-console
        console.error('Teste de conexão falhou!');
        process.exit(1);
      }
    }

    // Migration logic removed as migrateDataFromJson is discontinued

    // eslint-disable-next-line no-console
    console.log('Operações concluídas com sucesso.');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Erro durante a execução do script:');
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Erro fatal:');
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
