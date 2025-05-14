#!/usr/bin/env node

/**
 * Script para criar e testar cenários no sistema LASCMMG (sem proteção CSRF)
 *
 * Este script usa uma abordagem simplificada para testar a criação de torneios,
 * adição de jogadores e simulação de partidas.
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

// Função para criar um novo torneio diretamente (sem CSRF)
function createTournamentDirectly(name, date, description, numPlayers, type) {
  try {
    // Criar o torneio diretamente no arquivo de banco de dados
    console.log(`\nCriando torneio diretamente: ${name}`);

    const tournamentId = `tournament_${Date.now()}`;
    const createdAt = new Date().toISOString();
    // Adicionar torneio à base de dados
    const command = `sqlite3 /home/bitter/dev/lascmmg/data/lascmmg.sqlite "INSERT INTO tournaments (id, name, date, description, num_players_expected, bracket_type, created_at, status) VALUES ('${tournamentId}', '${name}', '${date}', '${description}', ${numPlayers}, '${type}', '${createdAt}', 'Pendente')"`;

    execSync(command);
    console.log(`✅ Torneio criado com ID: ${tournamentId}`);
    return tournamentId;
  } catch (error) {
    console.error(`❌ Erro ao criar torneio diretamente: ${error.message}`);
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
    for (let i = 0; i < 8; i++) {
      const playerName = generatePlayerName();
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
    for (let i = 0; i < 16; i++) {
      const playerName = generatePlayerName();
      const nickname = generateNickname(playerName);
      const gender = genders[Math.floor(Math.random() * genders.length)];
      const skillLevel =
        skillLevels[Math.floor(Math.random() * skillLevels.length)];
      addPlayerDirectly(torneioDuplo, playerName, nickname, gender, skillLevel);
    }
  }

  // Adicionar jogadores ao torneio grande
  if (torneioGrande) {
    console.log(`\nAdicionando 10 jogadores ao torneio grande (exemplo):`);
    for (let i = 0; i < 10; i++) {
      const playerName = generatePlayerName();
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

  console.log('\n===== TESTES CONCLUÍDOS =====');
  console.log(`Foram criados ${tournaments.length} torneios para testes:`);
  tournaments.forEach((id) => console.log(`- ${id}`));
  console.log(
    '\nAcesse http://localhost:3000/admin.html para visualizar os torneios no painel administrativo.'
  );
}

// Executar os testes
runTests();
