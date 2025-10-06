#!/usr/bin/env node

// Note: Console statements are acceptable in CLI scripts
// This is a command-line utility, not production server code

const { program } = require('commander');
const {
  initializeDatabase, // Alterado para corresponder à exportação de database.js
  checkDbConnection, // Alterado para corresponder à exportação de database.js
} = require('./lib/db/database'); // Caminho corrigido e direto para database.js

program
  .version('1.0.0')
  .description('Utilitário para configuração e migração do banco de dados SQLite')
  .option('-i, --init', 'Inicializar o banco de dados')
  .option('-t, --test', 'Testar a conexão com o banco de dados')
  .option('-d, --data-dir <path>', 'Diretório para armazenar o banco de dados', './data')
  .parse(process.argv);

const options = program.opts();

async function main() {
  try {
    if (!options.init && !options.test) {
      program.help();
      return;
    }

    if (options.init) {
      await initializeDatabase(); // Chamada direta
      // eslint-disable-next-line no-console
      console.log('Banco de dados inicializado com sucesso.');
    }

    if (options.test) {
      const testResult = await checkDbConnection(); // Chamada direta
      if (testResult.status === 'ok') {
        // eslint-disable-next-line no-console
        console.log(`Teste de conexão bem-sucedido: ${testResult.message}`);
      } else {
        // eslint-disable-next-line no-console
        console.error(`Teste de conexão falhou: ${testResult.message}`);
        process.exit(1);
      }
    }

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
