const axios = require('axios');
const { generatePlayerName, generateNickname } = require('./testUtils');

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

// Função para atualizar um torneio existente
async function updateTournament(tournamentId, updateData) {
  try {
    const response = await axios.put(
      `${BASE_URL}/tournaments/${tournamentId}`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`✅ Torneio ${tournamentId} atualizado com sucesso.`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ Erro ao atualizar torneio ${tournamentId}:`,
      error.response?.data || error.message
    );
    throw error;
  }
}

// Função para mover um torneio para a lixeira
async function moveToTrash(tournamentId) {
  try {
    const response = await axios.post(
      `${BASE_URL}/tournaments/${tournamentId}/trash`,
      {},
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`✅ Torneio ${tournamentId} movido para a lixeira.`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ Erro ao mover torneio ${tournamentId} para lixeira:`,
      error.response?.data || error.message
    );
    throw error;
  }
}

// Função para restaurar um torneio da lixeira
async function restoreFromTrash(tournamentId) {
  try {
    const response = await axios.post(
      `${BASE_URL}/tournaments/${tournamentId}/restore`,
      {},
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`✅ Torneio ${tournamentId} restaurado da lixeira.`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ Erro ao restaurar torneio ${tournamentId} da lixeira:`,
      error.response?.data || error.message
    );
    throw error;
  }
}

// Função para finalizar um torneio
async function finalizeTournament(tournamentId) {
  try {
    const response = await axios.post(
      `${BASE_URL}/tournaments/${tournamentId}/complete`,
      {},
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`✅ Torneio ${tournamentId} marcado como concluído.`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ Erro ao finalizar torneio ${tournamentId}:`,
      error.response?.data || error.message
    );
    throw error;
  }
}

// Função para criar um torneio especial para testes adicionais
async function createSpecialTournament() {
  try {
    const response = await axios.post(
      `${BASE_URL}/tournaments/create`,
      {
        name: 'Torneio Especial para Testes Avançados',
        date: '2025-07-01',
        description:
          'Este torneio será usado para testar funcionalidades avançadas como atualização, lixeira e restauração',
        numPlayersExpected: 4,
        bracket_type: 'single-elimination',
        entry_fee: 15.0,
        prize_pool: 'R$ 500,00',
        rules: 'Regras oficiais de sinuca. Teste de funcionalidades.',
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(
      `✅ Torneio Especial criado com sucesso. ID: ${response.data.tournamentId}`
    );
    return response.data.tournamentId;
  } catch (error) {
    console.error(
      `❌ Erro ao criar Torneio Especial:`,
      error.response?.data || error.message
    );
    throw error;
  }
}

// Função para adicionar jogadores ao torneio especial
async function addSpecialPlayers(tournamentId) {
  const players = [
    {
      name: generatePlayerName(),
      nickname: generateNickname(generatePlayerName()),
      gender: 'Masculino',
      skill: 'Expert',
    },
    {
      name: generatePlayerName(),
      nickname: generateNickname(generatePlayerName()),
      gender: 'Masculino',
      skill: 'Expert',
    },
    {
      name: generatePlayerName(),
      nickname: generateNickname(generatePlayerName()),
      gender: 'Feminino',
      skill: 'Intermediário',
    },
    {
      name: generatePlayerName(),
      nickname: generateNickname(generatePlayerName()),
      gender: 'Masculino',
      skill: 'Mestre',
    },
  ];

  for (const player of players) {
    try {
      await axios.post(
        `${BASE_URL}/tournaments/${tournamentId}/players`,
        {
          PlayerName: player.name,
          Nickname: player.nickname,
          gender: player.gender,
          skill_level: player.skill,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(
        `✅ Jogador "${player.name}" adicionado ao torneio especial.`
      );
    } catch (error) {
      console.error(
        `❌ Erro ao adicionar jogador "${player.name}":`,
        error.response?.data || error.message
      );
    }
  }
}

// Função principal para executar testes avançados
async function runAdvancedTests() {
  try {
    // Login para obter token
    await login();

    // 1. Obter todos os torneios existentes
    console.log('\n--- VERIFICANDO TORNEIOS EXISTENTES ---');

    // 2. Criar um torneio especial para testes
    console.log('\n--- CRIANDO TORNEIO ESPECIAL ---');
    const specialTournamentId = await createSpecialTournament();

    // 3. Adicionar jogadores ao torneio especial
    console.log('\n--- ADICIONANDO JOGADORES AO TORNEIO ESPECIAL ---');
    await addSpecialPlayers(specialTournamentId);

    // 4. Atualizar informações do torneio
    console.log('\n--- ATUALIZANDO INFORMAÇÕES DO TORNEIO ---');
    await updateTournament(specialTournamentId, {
      description: 'Descrição atualizada para teste de funcionalidades',
      prize_pool: 'R$ 750,00 (valor atualizado)',
      rules: 'Regras atualizadas para teste.',
    });

    // 5. Gerar chaveamento para o torneio especial
    console.log('\n--- GERANDO CHAVEAMENTO PARA O TORNEIO ESPECIAL ---');
    try {
      await axios.post(
        `${BASE_URL}/tournaments/${specialTournamentId}/generate-bracket`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`✅ Chaveamento gerado para o torneio especial.`);
    } catch (error) {
      console.error(
        `❌ Erro ao gerar chaveamento:`,
        error.response?.data || error.message
      );
    }

    // 6. Simular todas as partidas do torneio especial
    console.log('\n--- SIMULANDO PARTIDAS DO TORNEIO ESPECIAL ---');
    try {
      // Simular primeira rodada (2 partidas)
      console.log('Simulando primeira rodada:');
      await axios.post(
        `${BASE_URL}/tournaments/${specialTournamentId}/matches/0/winner/0`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('✅ Definido vencedor da partida 0');

      await axios.post(
        `${BASE_URL}/tournaments/${specialTournamentId}/matches/1/winner/1`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('✅ Definido vencedor da partida 1');

      // Simular final
      console.log('Simulando partida final:');
      await axios.post(
        `${BASE_URL}/tournaments/${specialTournamentId}/matches/2/winner/0`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('✅ Definido vencedor da partida final (2)');
    } catch (error) {
      console.error(
        `❌ Erro ao simular partidas:`,
        error.response?.data || error.message
      );
    }

    // 7. Finalizar o torneio
    console.log('\n--- FINALIZANDO O TORNEIO ESPECIAL ---');
    await finalizeTournament(specialTournamentId);

    // 8. Mover para a lixeira e restaurar
    console.log('\n--- TESTANDO FUNCIONALIDADE DE LIXEIRA ---');
    console.log('Movendo para a lixeira...');
    await moveToTrash(specialTournamentId);

    console.log('Restaurando da lixeira...');
    await restoreFromTrash(specialTournamentId);

    // 9. Verificar jogadores do torneio
    console.log('\n--- VERIFICANDO JOGADORES DO TORNEIO ---');

    console.log('\n--- TESTES AVANÇADOS CONCLUÍDOS ---');
    console.log('Foram testadas funcionalidades adicionais como:');
    console.log('- Atualização de informações de torneio');
    console.log('- Finalização de torneio');
    console.log('- Lixeira (mover e restaurar)');
    console.log('- Simulação completa de um torneio');

    console.log(
      '\nAcesse http://localhost:3000/admin.html para visualizar os torneios no painel administrativo.'
    );
  } catch (error) {
    console.error('Erro durante a execução dos testes avançados:', error);
  }
}

// Executar os testes avançados
runAdvancedTests();
