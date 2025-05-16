#!/usr/bin/env node

const { program } = require('commander');
const {
  initializeDatabase,
  testDatabaseConnection,
  migrateDataFromJson,
} = require('./lib/db/db-init'); // Caminho corrigido

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
  try {
    if (!options.init && !options.test && !options.migrate) {
      program.help();
      return;
    }

    if (options.init) {
      await initializeDatabase();
      console.log('Banco de dados inicializado com sucesso.');
    }

    if (options.test) {
      const testResult = await testDatabaseConnection();
      if (testResult) {
        console.log('Teste de conexão bem-sucedido!');
      } else {
        console.error('Teste de conexão falhou!');
        process.exit(1);
      }
    }

    if (options.migrate) {
      if (!options.init) {
        await initializeDatabase();
      }

      const tournamentId = options.tournament || null;
      if (tournamentId) {
        console.log(`Migrando dados apenas para o torneio ${tournamentId}...`);
      } else {
        console.log('Migrando dados para todos os torneios...');
      }

      const migrationStats = await migrateDataFromJson(tournamentId);

      console.log(`Torneios importados: ${migrationStats.tournamentsImported}`);
      console.log(`Jogadores importados: ${migrationStats.playersImported}`);
      console.log(`Pontuações importadas: ${migrationStats.scoresImported}`);

      if (migrationStats.errors.length > 0) {
        migrationStats.errors.forEach((error, index) => {
          console.log(`Erro ${index + 1}: ${error}`);
        });
      }
    }

    console.log('Operações concluídas com sucesso.');
  } catch (err) {
    console.error('Erro durante a execução do script:');
    console.error(err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Erro fatal:');
  console.error(err);
  process.exit(1);
});
