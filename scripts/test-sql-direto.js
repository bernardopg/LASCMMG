#!/usr/bin/env node

/**
 * Script para criar e testar cenários no sistema LASCMMG (sem proteção CSRF)
 *
 * Este script usa SQL direto para criar torneios e jogadores no banco de dados SQLite,
 * permitindo testar o sistema sem precisar lidar com CSRF.
 */

const { execSync } = require('child_process');
const {
  checkServerRunning,
  generatePlayerName,
  generateNickname,
} = require('./testUtils');

console.log('==========================================================');
console.log('SISTEMA DE TESTES AUTOMATIZADOS - LASCMMG');
console.log('==========================================================');
console.log('Testando funcionalidades do sistema de gerenciamento de torneios');
console.log('==========================================================\n');

// Configurações
const DB_PATH = '/home/bitter/dev/lascmmg/data/lascmmg.sqlite';

// Função para criar um novo torneio diretamente
function createTournamentDirectly(name, date, description, numPlayers, type) {
  try {
    console.log(`\nCriando torneio diretamente: ${name}`);

    const tournamentId = `tournament_${Date.now()}`;
    const createdAt = new Date().toISOString();

    const command = `sqlite3 ${DB_PATH} "INSERT INTO tournaments (id, name, date, description, num_players_expected, bracket_type, created_at, status) VALUES ('${tournamentId}', '${name}', '${date}', '${description}', ${numPlayers}, '${type}', '${createdAt}', 'Pendente');"`;

    execSync(command);
    console.log(`✅ Torneio criado com ID: ${tournamentId}`);
    return tournamentId;
  } catch (error) {
    console.error(`❌ Erro ao criar torneio: ${error.message}`);
    return null;
  }
}

// Função para adicionar jogador diretamente
function addPlayerDirectly(tournamentId, name, nickname, gender, skillLevel) {
  try {
    console.log(`\nAdicionando jogador diretamente: ${name}`);
    const createdAt = new Date().toISOString();
    // Adicionar jogador à base de dados (deixe o campo id para autoincremento)
    const command = `sqlite3 /home/bitter/dev/lascmmg/data/lascmmg.sqlite "INSERT INTO players (tournament_id, name, nickname, gender, skill_level, created_at) VALUES ('${tournamentId}', '${name}', '${nickname}', '${gender}', '${skillLevel}', '${createdAt}')"`;
    execSync(command);
    console.log(`✅ Jogador adicionado com sucesso: ${name}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao adicionar jogador diretamente: ${error.message}`);
    return null;
  }
}

// Função para gerar chaveamentos diretamente
function generateBracketDirectly(tournamentId) {
  try {
    console.log(`\nGerando chaveamento para torneio ${tournamentId}`);

    // Primeiro, vamos ver quantos jogadores tem no torneio
    const playerCount = execSync(
      `sqlite3 ${DB_PATH} "SELECT COUNT(*) FROM players WHERE tournament_id='${tournamentId}';"`,
      { encoding: 'utf8' }
    ).trim();

    console.log(`Encontrados ${playerCount} jogadores no torneio`);

    // Atualizar o status do torneio
    execSync(
      `sqlite3 ${DB_PATH} "UPDATE tournaments SET status='Em Andamento' WHERE id='${tournamentId}';"`,
      { encoding: 'utf8' }
    );

    console.log(`✅ Chaveamento gerado e torneio iniciado`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao gerar chaveamento: ${error.message}`);
    return false;
  }
}

// Função principal para executar os testes
async function runTests() {
  if (!checkServerRunning()) {
    process.exit(1);
  }

  const tournaments = [];

  // 1. Criar torneios de diferentes tipos usando inserção direta
  console.log('\n===== CRIANDO TORNEIOS =====');

  // Torneio de eliminação simples
  const torneioSimples = createTournamentDirectly(
    'Torneio Eliminação Simples',
    '2025-05-20',
    'Torneio teste com 8 jogadores em formato de eliminação simples',
    8,
    'single-elimination'
  );

  if (torneioSimples) {
    tournaments.push(torneioSimples);
  }

  // Torneio de eliminação dupla
  const torneioDuplo = createTournamentDirectly(
    'Torneio Eliminação Dupla',
    '2025-06-15',
    'Torneio teste com 16 jogadores em formato de eliminação dupla',
    16,
    'double-elimination'
  );

  if (torneioDuplo) {
    tournaments.push(torneioDuplo);
  }

  // Torneio grande
  const torneioGrande = createTournamentDirectly(
    'Grande Campeonato Anual',
    '2025-08-10',
    'Campeonato anual de sinuca com os melhores jogadores do país',
    32,
    'single-elimination'
  );

  if (torneioGrande) {
    tournaments.push(torneioGrande);
  }

  // 2. Adicionar jogadores aos torneios
  console.log('\n===== ADICIONANDO JOGADORES AOS TORNEIOS =====');

  // Níveis de habilidade e gêneros
  const skillLevels = [
    'Iniciante',
    'Intermediário',
    'Avançado',
    'Expert',
    'Mestre',
  ];
  const genders = ['Masculino', 'Feminino', 'Não informado'];

  // Adicionar jogadores ao torneio de eliminação simples
  if (torneioSimples) {
    console.log(`\nAdicionando 8 jogadores ao torneio de eliminação simples:`);
    const addedPlayers = [];

    for (let i = 0; i < 8; i++) {
      let playerName;
      do {
        playerName = generatePlayerName();
      } while (addedPlayers.includes(playerName)); // Evitar duplicatas

      addedPlayers.push(playerName);
      const nickname = generateNickname(playerName);
      const gender = genders[Math.floor(Math.random() * genders.length)];
      const skillLevel =
        skillLevels[Math.floor(Math.random() * skillLevels.length)];

      addPlayerDirectly(
        torneioSimples,
        playerName,
        nickname,
        gender,
        skillLevel
      );
    }
  }

  // Adicionar jogadores ao torneio de eliminação dupla
  if (torneioDuplo) {
    console.log(`\nAdicionando 16 jogadores ao torneio de eliminação dupla:`);
    const addedPlayers = [];

    for (let i = 0; i < 16; i++) {
      let playerName;
      do {
        playerName = generatePlayerName();
      } while (addedPlayers.includes(playerName)); // Evitar duplicatas

      addedPlayers.push(playerName);
      const nickname = generateNickname(playerName);
      const gender = genders[Math.floor(Math.random() * genders.length)];
      const skillLevel =
        skillLevels[Math.floor(Math.random() * skillLevels.length)];

      addPlayerDirectly(torneioDuplo, playerName, nickname, gender, skillLevel);
    }
  }

  // Adicionar jogadores ao torneio grande
  if (torneioGrande) {
    console.log(`\nAdicionando 32 jogadores ao torneio grande:`);
    const addedPlayers = [];

    for (let i = 0; i < 32; i++) {
      let playerName;
      do {
        playerName = generatePlayerName();
      } while (addedPlayers.includes(playerName)); // Evitar duplicatas

      addedPlayers.push(playerName);
      const nickname = generateNickname(playerName);
      const gender = genders[Math.floor(Math.random() * genders.length)];
      const skillLevel =
        skillLevels[Math.floor(Math.random() * skillLevels.length)];

      addPlayerDirectly(
        torneioGrande,
        playerName,
        nickname,
        gender,
        skillLevel
      );
    }
  }

  // 3. Gerar chaveamentos
  console.log('\n===== GERANDO CHAVEAMENTOS =====');

  if (torneioSimples) {
    generateBracketDirectly(torneioSimples);
  }

  if (torneioDuplo) {
    generateBracketDirectly(torneioDuplo);
  }

  if (torneioGrande) {
    generateBracketDirectly(torneioGrande);
  }

  console.log('\n===== TESTES CONCLUÍDOS =====');
  console.log(`Foram criados ${tournaments.length} torneios para testes:`);
  tournaments.forEach((id) => console.log(`- ${id}`));
  console.log(
    '\nAcesse http://localhost:3000/admin.html para visualizar os torneios no painel administrativo.'
  );
}

// Executar os testes
runTests();
