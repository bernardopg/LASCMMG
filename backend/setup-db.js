#!/usr/bin/env node

const require = require('require');
const process = require('process');
const console = require('console');

const { program } = require('commander');
const {
  initializeDatabase,
  testDatabaseConnection,
  migrateDataFromJson,
} = require('./lib/db-init');

program
  .version('1.0.0')
  .description(
    'Utilitário para configuração e migração do banco de dados SQLite'
  )
  .option('-i, --init', 'Inicializar o banco de dados')
  .option('-t, --test', 'Testar a conexão com o banco de dados')
  .option(
    '-m, --migrate',
    'Migrar dados dos arquivos JSON para o banco de dados SQLite'
  )
  .option(
    '-T, --tournament <id>',
    'ID do torneio específico para migrar (usado com --migrate)'
  )
  .option(
    '-d, --data-dir <path>',
    'Diretório para armazenar o banco de dados',
    './data'
  )
  .parse(process.argv);

const options = program.opts();

async function main() {
  console.log('=== Utilitário de Configuração do Banco de Dados SQLite ===');

  try {
    if (!options.init && !options.test && !options.migrate) {
      program.help();
      return;
    }

    if (options.init) {
      console.log('\n--- Inicializando banco de dados ---');
      await initializeDatabase();
      console.log('Banco de dados inicializado com sucesso.');
    }

    if (options.test) {
      console.log('\n--- Testando conexão com o banco de dados ---');
      const testResult = await testDatabaseConnection();

      if (testResult) {
        console.log('Teste de conexão bem-sucedido!');
      } else {
        console.error('Teste de conexão falhou!');
        process.exit(1);
      }
    }

    if (options.migrate) {
      console.log('\n--- Migrando dados de JSON para SQLite ---');

      if (!options.init) {
        console.log('Garantindo que o banco de dados esteja inicializado...');
        await initializeDatabase();
      }

      const tournamentId = options.tournament || null;
      if (tournamentId) {
        console.log(`Migrando dados apenas para o torneio ${tournamentId}...`);
      } else {
        console.log('Migrando dados para todos os torneios...');
      }

      const migrationStats = await migrateDataFromJson(tournamentId);

      console.log('\n--- Estatísticas da migração ---');
      console.log(`Torneios importados: ${migrationStats.tournamentsImported}`);
      console.log(`Jogadores importados: ${migrationStats.playersImported}`);
      console.log(`Pontuações importadas: ${migrationStats.scoresImported}`);

      if (migrationStats.errors.length > 0) {
        console.log('\n--- Erros durante a migração ---');
        migrationStats.errors.forEach((error, index) => {
          console.log(`${index + 1}. ${error}`);
        });
      }
    }

    console.log('\n=== Operações concluídas com sucesso ===');
  } catch (err) {
    console.error('\nErro durante a execução do script:');
    console.error(err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Erro fatal:');
  console.error(err);
  process.exit(1);
});
