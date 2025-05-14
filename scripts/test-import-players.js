const axios = require('axios');
const fs = require('fs');
const path = require('path');

// URL base da API
const BASE_URL = 'http://localhost:3000';

// Credenciais de administrador (ajuste conforme necessário)
const adminCredentials = require('../admin_credentials.json');

let authToken = null;

// Função para realizar login e obter token de autenticação
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: adminCredentials.username,
      password: adminCredentials.password,
    });

    authToken = response.data.token;
    console.log('✅ Login bem-sucedido. Token obtido.');
    return authToken;
  } catch (error) {
    console.error(
      '❌ Erro ao fazer login:',
      error.response?.data || error.message
    );
    throw error;
  }
}

// Função para criar um torneio para importação de jogadores
async function createImportTournament() {
  try {
    const response = await axios.post(
      `${BASE_URL}/tournaments/create`,
      {
        name: 'Torneio com Importação de Jogadores',
        date: '2025-09-15',
        description:
          'Torneio para testar a importação em massa de jogadores via JSON',
        numPlayersExpected: 64,
        bracket_type: 'single-elimination',
        entry_fee: 30.0,
        prize_pool: 'R$ 5000,00',
        rules: 'Regras oficiais de sinuca. Teste de importação em massa.',
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(
      `✅ Torneio para importação criado com sucesso. ID: ${response.data.tournamentId}`
    );
    return response.data.tournamentId;
  } catch (error) {
    console.error(
      `❌ Erro ao criar torneio para importação:`,
      error.response?.data || error.message
    );
    throw error;
  }
}

// Função para importar jogadores de um arquivo JSON
async function importPlayers(tournamentId, playersData) {
  try {
    const response = await axios.post(
      `${BASE_URL}/tournaments/${tournamentId}/players/import`,
      { players: playersData },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(
      `✅ ${response.data.importedCount} jogadores importados com sucesso para o torneio ${tournamentId}.`
    );
    if (response.data.errors && response.data.errors.length > 0) {
      console.log(
        `⚠️ ${response.data.errors.length} erros durante a importação.`
      );
    }
    return response.data;
  } catch (error) {
    console.error(
      `❌ Erro ao importar jogadores:`,
      error.response?.data || error.message
    );
    throw error;
  }
}

// Função para atualizar a lista completa de jogadores
async function updatePlayersList(tournamentId, playersData) {
  try {
    const response = await axios.post(
      `${BASE_URL}/tournaments/${tournamentId}/players/update`,
      { players: playersData },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(
      `✅ Lista de jogadores atualizada com sucesso. ${response.data.updatedCount} jogadores atualizados.`
    );
    return response.data;
  } catch (error) {
    console.error(
      `❌ Erro ao atualizar lista de jogadores:`,
      error.response?.data || error.message
    );
    throw error;
  }
}

// Função para gerar dados fictícios de jogadores para importação
function generatePlayersList(count) {
  const firstNames = [
    'João',
    'Maria',
    'Pedro',
    'Ana',
    'Lucas',
    'Carla',
    'José',
    'Juliana',
    'Carlos',
    'Mariana',
    'Paulo',
    'Fernanda',
    'Rafael',
    'Amanda',
    'Ricardo',
    'Patricia',
    'Leonardo',
    'Camila',
    'Marcos',
    'Daniela',
    'Roberto',
    'Sabrina',
    'Eduardo',
    'Natália',
    'Felipe',
    'Carolina',
    'Daniel',
    'Luisa',
    'Miguel',
    'Jéssica',
  ];

  const lastNames = [
    'Silva',
    'Santos',
    'Oliveira',
    'Souza',
    'Costa',
    'Pereira',
    'Lima',
    'Martins',
    'Rodrigues',
    'Almeida',
    'Nascimento',
    'Gomes',
    'Ferreira',
    'Carvalho',
    'Araujo',
    'Ribeiro',
    'Melo',
    'Barbosa',
    'Rocha',
    'Cardoso',
    'Moreira',
    'Alves',
    'Dias',
    'Fernandes',
    'Mendes',
    'Castro',
    'Correia',
    'Teixeira',
    'Azevedo',
    'Freitas',
  ];

  const genders = ['Masculino', 'Feminino', 'Não informado'];
  const skillLevels = [
    'Iniciante',
    'Intermediário',
    'Avançado',
    'Expert',
    'Mestre',
  ];

  const players = [];

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${firstName} ${lastName}`;

    // Gerar apelido a partir das iniciais
    const nickname = firstName.substring(0, 1) + lastName.substring(0, 3);

    players.push({
      name: fullName,
      nickname: nickname,
      gender: genders[Math.floor(Math.random() * genders.length)],
      skill_level: skillLevels[Math.floor(Math.random() * skillLevels.length)],
      GamesPlayed: Math.floor(Math.random() * 50),
      Wins: Math.floor(Math.random() * 30),
      Losses: Math.floor(Math.random() * 20),
    });
  }

  return players;
}

// Função para gerar um arquivo JSON com jogadores
function generateAndSavePlayersJson(count, filePath) {
  const players = generatePlayersList(count);
  fs.writeFileSync(filePath, JSON.stringify(players, null, 2));
  console.log(
    `✅ Arquivo JSON com ${count} jogadores gerado e salvo em ${filePath}`
  );
  return players;
}

// Função para verificar os jogadores de um torneio
async function checkTournamentPlayers(tournamentId) {
  try {
    const response = await axios.get(
      `${BASE_URL}/tournaments/${tournamentId}/players`
    );
    console.log(
      `✅ O torneio ${tournamentId} tem ${response.data.length} jogadores.`
    );
    return response.data;
  } catch (error) {
    console.error(
      `❌ Erro ao verificar jogadores do torneio ${tournamentId}:`,
      error.response?.data || error.message
    );
    throw error;
  }
}

// Função principal para testar a importação de jogadores
async function testPlayerImport() {
  try {
    // Login para obter token
    await login();

    // 1. Criar torneio para testes de importação
    console.log('\n--- CRIANDO TORNEIO PARA TESTES DE IMPORTAÇÃO ---');
    const importTournamentId = await createImportTournament();

    // 2. Gerar arquivo JSON com jogadores e salvar no disco
    console.log('\n--- GERANDO ARQUIVO JSON COM JOGADORES ---');
    const jsonFilePath = path.join(__dirname, 'jogadores_para_importar.json');
    const playersData = generateAndSavePlayersJson(64, jsonFilePath);

    // 3. Importar jogadores para o torneio
    console.log('\n--- IMPORTANDO JOGADORES VIA API ---');
    await importPlayers(importTournamentId, playersData);

    // 4. Verificar jogadores importados
    console.log('\n--- VERIFICANDO JOGADORES IMPORTADOS ---');

    // 5. Testar atualização da lista completa de jogadores
    console.log('\n--- TESTANDO ATUALIZAÇÃO DE LISTA DE JOGADORES ---');

    // Modificar alguns jogadores e adicionar alguns novos
    const updatedPlayersData = playersData.slice(0, 40); // Manter apenas os primeiros 40

    // Modificar alguns dados dos jogadores mantidos
    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * 40);
      updatedPlayersData[randomIndex].nickname =
        updatedPlayersData[randomIndex].nickname + '_MOD';
    }

    // Adicionar 5 novos jogadores
    const additionalPlayers = generatePlayersList(5);
    updatedPlayersData.push(...additionalPlayers);

    console.log(
      `Atualizando lista para ${updatedPlayersData.length} jogadores (40 modificados + 5 novos)...`
    );
    await updatePlayersList(importTournamentId, updatedPlayersData);

    // Verificar novamente os jogadores
    console.log('\n--- VERIFICANDO JOGADORES APÓS ATUALIZAÇÃO ---');

    // 6. Gerar chaveamento para o torneio
    console.log('\n--- GERANDO CHAVEAMENTO PARA O TORNEIO ---');
    try {
        `${BASE_URL}/tournaments/${importTournamentId}/generate-bracket`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(
        `✅ Chaveamento gerado para o torneio com jogadores importados.`
      );
    } catch (error) {
      console.error(
        `❌ Erro ao gerar chaveamento:`,
        error.response?.data || error.message
      );
    }

    console.log('\n--- TESTES DE IMPORTAÇÃO CONCLUÍDOS ---');
    console.log('Foram testadas as seguintes funcionalidades:');
    console.log('- Geração de arquivo JSON de jogadores');
    console.log('- Importação em massa de jogadores via API');
    console.log('- Atualização completa da lista de jogadores');
    console.log('- Geração de chaveamento com jogadores importados');

    console.log(`\nArquivo JSON de jogadores gerado: ${jsonFilePath}`);
    console.log(
      `ID do torneio com jogadores importados: ${importTournamentId}`
    );
    console.log(
      '\nAcesse http://localhost:3000/admin.html para visualizar o torneio no painel administrativo.'
    );
  } catch (error) {
    console.error('Erro durante os testes de importação:', error);
  }
}

// Executar os testes de importação
testPlayerImport();
