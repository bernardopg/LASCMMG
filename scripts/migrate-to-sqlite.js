#!/usr/bin/env node

/**
 * Script de Migração para SQLite
 *
 * Este script realiza a migração de dados de arquivos JSON para o banco de dados SQLite.
 * Também oferece opções para backup e verificação de consistência de dados.
 *
 * Uso:
 *   node scripts/migrate-to-sqlite.js --all            # Migra todos os torneios
 *   node scripts/migrate-to-sqlite.js --id <torneioId> # Migra um torneio específico
 *   node scripts/migrate-to-sqlite.js --verify         # Verifica consistência de dados
 *   node scripts/migrate-to-sqlite.js --backup         # Cria um backup dos dados
 */

/* eslint-env node */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { program } = require('commander');
const { initializeDatabase, migrateDataFromJson } = require('../lib/db-init');
const { DB_CONFIG } = require('../lib/config');

// Interface para leitura e escrita no console
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Configuração do programa CLI
program
  .name('migrate-to-sqlite')
  .description('Script para migrar dados de arquivos JSON para SQLite')
  .version('1.0.0');

program
  .option('-a, --all', 'Migrar todos os torneios')
  .option('-i, --id <id>', 'Migrar um torneio específico')
  .option('-v, --verify', 'Verificar consistência dos dados')
  .option('-b, --backup', 'Criar backup dos dados')
  .option('-f, --force', 'Executar sem confirmar (cuidado!)')
  .option('-d, --dry-run', 'Simular a migração sem modificar o banco de dados');

program.parse(process.argv);

const options = program.opts();

// Função para aguardar confirmação do usuário
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim().toLowerCase());
    });
  });
}

// Função de backup do banco de dados
async function backupDatabase() {
  console.log('=== Criando backup do banco de dados ===');

  // Verificar se o diretório de backups existe, caso contrário criar
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`Diretório de backups criado: ${backupDir}`);
  }

  // Caminho completo para o arquivo de banco de dados
  const dbFile = path.join(
    __dirname,
    '..',
    DB_CONFIG.dataDir,
    DB_CONFIG.dbFile
  );

  // Verificar se o banco de dados existe
  if (!fs.existsSync(dbFile)) {
    console.warn(
      'Arquivo de banco de dados não encontrado. Nada para fazer backup.'
    );
    return false;
  }

  // Criar nome de arquivo com timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup-${timestamp}.sqlite`);

  // Copiar o arquivo
  fs.copyFileSync(dbFile, backupFile);
  console.log(`Backup criado: ${backupFile}`);
  return backupFile;
}

// Função para verificar consistência dos dados
async function verifyDataConsistency() {
  console.log('=== Verificando consistência dos dados ===');

  try {
    // Importar modelos
    const tournamentModel = require('../lib/models/tournamentModel');
    const playerModel = require('../lib/models/playerModel');
    const matchModel = require('../lib/models/matchModel');
    const scoreModel = require('../lib/models/scoreModel');

    // Contagens
    const tournamentCount = await tournamentModel.countTournaments();
    console.log(`Total de torneios no banco: ${tournamentCount}`);

    // Se não houver torneios, não há o que verificar
    if (tournamentCount === 0) {
      console.warn(
        'Nenhum torneio encontrado no banco. Verifique se a migração foi realizada.'
      );
      return false;
    }

    // Obter lista de torneios
    const tournaments = await tournamentModel.getAllTournaments();

    // Verificar cada torneio
    for (const tournament of tournaments) {
      console.log(
        `\nVerificando torneio: ${tournament.name} (ID: ${tournament.id})`
      );

      // Contar jogadores
      const players = await playerModel.getPlayersByTournament(tournament.id);
      console.log(`  Jogadores: ${players.length}`);

      // Contar partidas
      const matches = await matchModel.getMatchesByTournament(tournament.id);
      console.log(`  Partidas: ${matches.length}`);

      // Contar pontuações
      const scores = await scoreModel.getScoresByTournament(tournament.id);
      console.log(`  Pontuações: ${scores.length}`);

      // Verificar referências
      let brokenReferences = 0;

      // Verificar se partidas têm jogadores válidos
      for (const match of matches) {
        if (
          match.player1_id &&
          !players.find((p) => p.id === match.player1_id)
        ) {
          console.error(
            `  ERRO: Partida ${match.id} referencia jogador1 inválido (ID: ${match.player1_id})`
          );
          brokenReferences++;
        }
        if (
          match.player2_id &&
          !players.find((p) => p.id === match.player2_id)
        ) {
          console.error(
            `  ERRO: Partida ${match.id} referencia jogador2 inválido (ID: ${match.player2_id})`
          );
          brokenReferences++;
        }
      }

      // Verificar se pontuações têm partidas válidas
      for (const score of scores) {
        if (!matches.find((m) => m.id === score.match_id)) {
          console.error(
            `  ERRO: Pontuação ${score.id} referencia partida inválida (ID: ${score.match_id})`
          );
          brokenReferences++;
        }
      }

      if (brokenReferences === 0) {
        console.log(`  ✅ Torneio ${tournament.id} está consistente.`);
      } else {
        console.error(
          `  ❌ Torneio ${tournament.id} tem ${brokenReferences} referências inválidas.`
        );
      }
    }

    return true;
  } catch (err) {
    console.error('Erro ao verificar consistência dos dados:', err);
    return false;
  }
}

// Função principal
async function main() {
  console.log('\n=== Migração para SQLite ===\n');

  // Verificar se alguma opção foi fornecida
  if (!options.all && !options.id && !options.verify && !options.backup) {
    console.error('Erro: Você deve especificar pelo menos uma opção.');
    program.help();
    process.exit(1);
  }

  // Criar backup se solicitado
  if (options.backup) {
    const backupFile = await backupDatabase();
    if (backupFile) {
      console.log(`Backup criado com sucesso: ${backupFile}`);
    }
  }

  // Criar diretório de dados se não existir
  const dataDir = path.join(__dirname, '..', DB_CONFIG.dataDir);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`Diretório de dados criado: ${dataDir}`);
  }

  // Inicializar banco de dados
  try {
    console.log('Inicializando banco de dados...');
    await initializeDatabase();
    console.log('Banco de dados inicializado com sucesso!\n');
  } catch (err) {
    console.error('Erro ao inicializar banco de dados:', err);
    process.exit(1);
  }

  // Verificar consistência dos dados se solicitado
  if (options.verify) {
    await verifyDataConsistency();
    // Se só pediu verificação, terminamos aqui
    if (!options.all && !options.id) {
      rl.close();
      return;
    }
    console.log(''); // Linha em branco para separar
  }

  // Migrar dados
  if (options.all || options.id) {
    const tournamentId = options.id || null;
    const confirmOperation =
      options.force ||
      (await prompt(
        `Você está prestes a migrar ${tournamentId ? `o torneio ${tournamentId}` : 'todos os torneios'} para SQLite.\n` +
          `${options.dryRun ? 'SIMULAÇÃO: Nenhuma alteração será realizada.' : 'Esta operação não pode ser desfeita!'}\n` +
          'Continuar? (s/n): '
      ));

    if (
      confirmOperation === 's' ||
      confirmOperation === 'sim' ||
      confirmOperation === 'yes' ||
      confirmOperation === 'y'
    ) {
      try {
        if (options.dryRun) {
          console.log(
            'SIMULAÇÃO DE MIGRAÇÃO: Nenhuma alteração será realizada'
          );
        }

        console.log(
          `Iniciando migração ${tournamentId ? `do torneio ${tournamentId}` : 'de todos os torneios'}...`
        );

        if (!options.dryRun) {
          // Realizar a migração real
          const stats = await migrateDataFromJson(tournamentId);

          console.log('\n=== Estatísticas da Migração ===');
          console.log(`Torneios importados: ${stats.tournamentsImported}`);
          console.log(`Jogadores importados: ${stats.playersImported}`);
          console.log(`Pontuações importadas: ${stats.scoresImported}`);

          if (stats.errors && stats.errors.length > 0) {
            console.error('\n=== Erros durante a migração ===');
            stats.errors.forEach((err, index) => {
              console.error(`${index + 1}. ${err}`);
            });
            console.error(`Total de erros: ${stats.errors.length}`);
          } else {
            console.log('\n✅ Migração concluída sem erros!');
          }
        } else {
          console.log('Simulação de migração concluída.');
        }
      } catch (err) {
        console.error('Erro durante a migração:', err);
      }
    } else {
      console.log('Operação cancelada pelo usuário.');
    }
  }

  rl.close();
}

// Executar a função principal
main().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
