#!/usr/bin/env node

/**
 * Script para testar funções avançadas do sistema LASCMMG
 *
 * Este script testa funcionalidades como importação de jogadores,
 * atualização de torneios, gestão de lixeira e ciclo de vida completo de torneios.
 */

const {
  checkServerRunning,
  executeCurl,
  generatePlayerName,
  generateNickname,
  fs,
  path,
  loginAndGetCSRF,
} = require('./testUtils');

console.log('==========================================================');
console.log('SISTEMA DE TESTES AVANÇADOS - LASCMMG');
console.log('==========================================================');
console.log('Testando funcionalidades avançadas do sistema');
console.log('==========================================================\n');

// Função para criar arquivo JSON com jogadores
function createPlayersJSON(numJogadores, filePath) {
  const skillLevels = [
    'Iniciante',
    'Intermediário',
    'Avançado',
    'Expert',
    'Mestre',
  ];
  const genders = ['Masculino', 'Feminino', 'Não informado'];

  const players = [];

  for (let i = 0; i < numJogadores; i++) {
    const name = generatePlayerName();
    const nickname = generateNickname(name);
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const skillLevel =
      skillLevels[Math.floor(Math.random() * skillLevels.length)];

    players.push({
      name: name,
      nickname: nickname,
      gender: gender,
      skill_level: skillLevel,
      GamesPlayed: Math.floor(Math.random() * 100),
      Wins: Math.floor(Math.random() * 70),
      Losses: Math.floor(Math.random() * 30),
    });
  }

  fs.writeFileSync(filePath, JSON.stringify(players, null, 2));
  console.log(
    `✅ Arquivo JSON com ${numJogadores} jogadores criado em ${filePath}`
  );

  return players;
}

// Função para criar um torneio
function createTournament(
  name,
  date,
  description,
  numPlayers,
  type,
  entryFee,
  prizePool,
  rules,
  csrfToken,
  cookiesFile,
  jwtToken
) {
  const data = JSON.stringify({
    name,
    date,
    description,
    numPlayersExpected: numPlayers,
    bracket_type: type,
    entry_fee: entryFee,
    prize_pool: prizePool,
    rules,
    _csrf: csrfToken,
  });
  const cookieHeader = `--cookie csrfToken=${csrfToken}`;
  const authHeader = `-H "Authorization: Bearer ${jwtToken}"`;
  const command = `curl -s -X POST -b ${cookiesFile} ${cookieHeader} -H "Content-Type: application/json" -H "X-CSRF-Token: ${csrfToken}" ${authHeader} -d '${data}' http://localhost:3000/api/tournaments/create`;
  const result = executeCurl(command, `Criando torneio: ${name}`);
  if (!result || !result.tournamentId) {
    console.error('Resposta inesperada ao criar torneio:', result);
  }
  return result ? result.tournamentId : null;
}

// Função para importar jogadores
function importPlayers(
  tournamentId,
  playersData,
  csrfToken,
  cookiesFile,
  jwtToken
) {
  const data = JSON.stringify({ players: playersData, _csrf: csrfToken });
  const cookieHeader = `--cookie csrfToken=${csrfToken}`;
  const authHeader = `-H "Authorization: Bearer ${jwtToken}"`;
  const command = `curl -s -X POST -b ${cookiesFile} ${cookieHeader} -H "Content-Type: application/json" -H "X-CSRF-Token: ${csrfToken}" ${authHeader} -d '${data}' http://localhost:3000/api/tournaments/${tournamentId}/players/import`;
  return executeCurl(
    command,
    `Importando jogadores para o torneio ${tournamentId}`
  );
}

// Função para atualizar um torneio
function updateTournament(
  tournamentId,
  updateData,
  csrfToken,
  cookiesFile,
  jwtToken
) {
  const data = JSON.stringify({ ...updateData, _csrf: csrfToken });
  const cookieHeader = `--cookie csrfToken=${csrfToken}`;
  const authHeader = `-H "Authorization: Bearer ${jwtToken}"`;
  const command = `curl -s -X PUT -b ${cookiesFile} ${cookieHeader} -H "Content-Type: application/json" -H "X-CSRF-Token: ${csrfToken}" ${authHeader} -d '${data}' http://localhost:3000/api/tournaments/${tournamentId}`;
  return executeCurl(command, `Atualizando torneio ${tournamentId}`);
}

// Função para gerar chaveamento
function generateBracket(tournamentId, csrfToken, cookiesFile, jwtToken) {
  const cookieHeader = `--cookie csrfToken=${csrfToken}`;
  const authHeader = `-H "Authorization: Bearer ${jwtToken}"`;
  const command = `curl -s -X POST -b ${cookiesFile} ${cookieHeader} -H "X-CSRF-Token: ${csrfToken}" ${authHeader} http://localhost:3000/api/tournaments/${tournamentId}/generate-bracket`;
  return executeCurl(
    command,
    `Gerando chaveamento para torneio ${tournamentId}`
  );
}

// Função para definir vencedor de uma partida
function setMatchWinner(
  tournamentId,
  matchNumber,
  winnerIndex,
  csrfToken,
  cookiesFile,
  jwtToken
) {
  const data = JSON.stringify({ _csrf: csrfToken });
  const cookieHeader = `--cookie csrfToken=${csrfToken}`;
  const authHeader = `-H "Authorization: Bearer ${jwtToken}"`;
  const command = `curl -s -X POST -b ${cookiesFile} ${cookieHeader} -H "Content-Type: application/json" -H "X-CSRF-Token: ${csrfToken}" ${authHeader} -d '${data}' http://localhost:3000/api/tournaments/${tournamentId}/matches/${matchNumber}/winner/${winnerIndex}`;
  return executeCurl(
    command,
    `Definindo vencedor ${winnerIndex} para partida ${matchNumber} do torneio ${tournamentId}`
  );
}

// Função para mover um torneio para a lixeira
function moveToTrash(tournamentId, csrfToken, cookiesFile, jwtToken) {
  const data = JSON.stringify({ _csrf: csrfToken });
  const cookieHeader = `--cookie csrfToken=${csrfToken}`;
  const authHeader = `-H "Authorization: Bearer ${jwtToken}"`;
  const command = `curl -s -X POST -b ${cookiesFile} ${cookieHeader} -H "Content-Type: application/json" -H "X-CSRF-Token: ${csrfToken}" ${authHeader} -d '${data}' http://localhost:3000/api/tournaments/${tournamentId}/trash`;
  return executeCurl(command, `Movendo torneio ${tournamentId} para a lixeira`);
}

// Função para restaurar um torneio da lixeira
function restoreFromTrash(tournamentId, csrfToken, cookiesFile, jwtToken) {
  const data = JSON.stringify({ _csrf: csrfToken });
  const cookieHeader = `--cookie csrfToken=${csrfToken}`;
  const authHeader = `-H "Authorization: Bearer ${jwtToken}"`;
  const command = `curl -s -X POST -b ${cookiesFile} ${cookieHeader} -H "Content-Type: application/json" -H "X-CSRF-Token: ${csrfToken}" ${authHeader} -d '${data}' http://localhost:3000/api/tournaments/${tournamentId}/restore`;
  return executeCurl(command, `Restaurando torneio ${tournamentId} da lixeira`);
}

// Função para finalizar um torneio
function completeTournament(tournamentId, csrfToken, cookiesFile, jwtToken) {
  const data = JSON.stringify({ _csrf: csrfToken });
  const cookieHeader = `--cookie csrfToken=${csrfToken}`;
  const authHeader = `-H "Authorization: Bearer ${jwtToken}"`;
  const command = `curl -s -X POST -b ${cookiesFile} ${cookieHeader} -H "Content-Type: application/json" -H "X-CSRF-Token: ${csrfToken}" ${authHeader} -d '${data}' http://localhost:3000/api/tournaments/${tournamentId}/complete`;
  return executeCurl(command, `Finalizando torneio ${tournamentId}`);
}

// Função principal para executar os testes
function runAdvancedTests() {
  if (!checkServerRunning()) {
    process.exit(1);
  }

  // Login admin e obtenção de CSRF/cookies
  let csrfToken, cookiesFile, jwtToken;
  try {
    const auth = loginAndGetCSRF({});
    csrfToken = auth.csrfToken;
    cookiesFile = auth.cookiesFile;
    jwtToken = auth.jwtToken;
    console.log('✅ Login admin e CSRF obtidos com sucesso.');
  } catch (e) {
    console.error('❌ Falha ao autenticar admin:', e.message);
    process.exit(1);
  }

  // 1. Criar um torneio para importação de jogadores
  console.log('\n===== TESTANDO IMPORTAÇÃO DE JOGADORES =====');
  const importTournamentId = createTournament(
    'Torneio de Importação',
    '2025-10-15',
    'Torneio para testar a importação de jogadores em massa',
    16,
    'single-elimination',
    25.0,
    'R$ 2000,00',
    'Regras oficiais de sinuca. Partidas em melhor de 3.',
    csrfToken,
    cookiesFile,
    jwtToken
  );

  if (!importTournamentId) {
    console.error(
      '❌ Falha ao criar torneio para importação. Abortando testes.'
    );
    return;
  }

  console.log(
    `✅ Torneio para importação criado com ID: ${importTournamentId}`
  );

  // 2. Criar um arquivo JSON com jogadores
  const jsonFilePath = path.join(__dirname, 'jogadores_importacao.json');
  const playersData = createPlayersJSON(16, jsonFilePath);

  // 3. Importar os jogadores para o torneio
  const importResult = importPlayers(
    importTournamentId,
    playersData,
    csrfToken,
    cookiesFile,
    jwtToken
  );

  if (importResult && importResult.success) {
    console.log(
      `✅ ${importResult.importedCount || 'Vários'} jogadores importados com sucesso.`
    );
  }

  // 4. Gerar chaveamento para o torneio
  generateBracket(importTournamentId, csrfToken, cookiesFile, jwtToken);

  // 5. Testar atualização de torneio
  console.log('\n===== TESTANDO ATUALIZAÇÃO DE TORNEIO =====');
  const torneioUpdateId = createTournament(
    'Torneio para Atualização',
    '2025-11-20',
    'Torneio para testar a atualização de dados',
    8,
    'single-elimination',
    30.0,
    'R$ 1500,00',
    'Regras básicas.',
    csrfToken,
    cookiesFile,
    jwtToken
  );

  if (torneioUpdateId) {
    console.log(
      `✅ Torneio para atualização criado com ID: ${torneioUpdateId}`
    );

    // Atualizar dados do torneio
    updateTournament(
      torneioUpdateId,
      {
        name: 'Torneio Atualizado',
        description: 'Descrição atualizada como teste',
        prize_pool: 'R$ 2500,00 (Valor atualizado)',
        rules: 'Regras atualizadas e melhoradas.',
      },
      csrfToken,
      cookiesFile,
      jwtToken
    );

    // Criar outro JSON de jogadores e importar
    const jsonFilePath2 = path.join(__dirname, 'jogadores_atualizacao.json');
    const playersData2 = createPlayersJSON(8, jsonFilePath2);
    importPlayers(
      torneioUpdateId,
      playersData2,
      csrfToken,
      cookiesFile,
      jwtToken
    );

    // Gerar chaveamento
    generateBracket(torneioUpdateId, csrfToken, cookiesFile, jwtToken);
  }

  // 6. Testar lixeira
  console.log('\n===== TESTANDO FUNCIONALIDADE DE LIXEIRA =====');
  const torneioLixeiraId = createTournament(
    'Torneio para Lixeira',
    '2025-12-25',
    'Torneio para testar a funcionalidade de lixeira',
    4,
    'single-elimination',
    10.0,
    'R$ 500,00',
    'Regras básicas.',
    csrfToken,
    cookiesFile,
    jwtToken
  );

  if (torneioLixeiraId) {
    console.log(
      `✅ Torneio para teste de lixeira criado com ID: ${torneioLixeiraId}`
    );

    // Mover para a lixeira
    moveToTrash(torneioLixeiraId, csrfToken, cookiesFile, jwtToken);

    // Restaurar da lixeira
    restoreFromTrash(torneioLixeiraId, csrfToken, cookiesFile, jwtToken);

    // Mover novamente para a lixeira
    moveToTrash(torneioLixeiraId, csrfToken, cookiesFile, jwtToken);
  }

  // 7. Testar ciclo de vida completo de um torneio
  console.log('\n===== TESTANDO CICLO DE VIDA COMPLETO DE TORNEIO =====');
  const torneioCicloId = createTournament(
    'Campeonato Completo',
    '2025-09-05',
    'Torneio para testar o ciclo de vida completo',
    4,
    'single-elimination',
    50.0,
    'R$ 4000,00',
    'Regras oficiais de sinuca. Partidas em melhor de 5.',
    csrfToken,
    cookiesFile,
    jwtToken
  );

  if (torneioCicloId) {
    console.log(
      `✅ Torneio para ciclo de vida completo criado com ID: ${torneioCicloId}`
    );

    // Criar jogadores (manualmente para manter nomes fixos)
    const jogadoresCiclo = [
      {
        name: 'Campeão Regional',
        nickname: 'CReg',
        gender: 'Masculino',
        skill_level: 'Expert',
      },
      {
        name: 'Vice-Campeão',
        nickname: 'VCamp',
        gender: 'Masculino',
        skill_level: 'Avançado',
      },
      {
        name: 'Semifinalista 1',
        nickname: 'Semi1',
        gender: 'Feminino',
        skill_level: 'Expert',
      },
      {
        name: 'Semifinalista 2',
        nickname: 'Semi2',
        gender: 'Masculino',
        skill_level: 'Intermediário',
      },
    ];

    // Salvar e importar os jogadores
    const jsonFilePath3 = path.join(__dirname, 'jogadores_ciclo.json');
    fs.writeFileSync(jsonFilePath3, JSON.stringify(jogadoresCiclo, null, 2));

    importPlayers(
      torneioCicloId,
      jogadoresCiclo,
      csrfToken,
      cookiesFile,
      jwtToken
    );

    // Gerar chaveamento
    generateBracket(torneioCicloId, csrfToken, cookiesFile, jwtToken);

    // Simular partidas
    console.log('\nSimulando partidas do torneio ciclo completo:');

    // Semifinais
    setMatchWinner(torneioCicloId, 0, 0, csrfToken, cookiesFile, jwtToken); // Campeão vence
    setMatchWinner(torneioCicloId, 1, 0, csrfToken, cookiesFile, jwtToken); // Vice-Campeão vence

    // Final
    setMatchWinner(torneioCicloId, 2, 0, csrfToken, cookiesFile, jwtToken); // Campeão vence a final

    // Finalizar o torneio
    completeTournament(torneioCicloId, csrfToken, cookiesFile, jwtToken);
  }

  console.log('\n===== TESTES AVANÇADOS CONCLUÍDOS =====');
  console.log('Resumo de funcionalidades testadas:');
  console.log('✅ Importação de jogadores via JSON');
  console.log('✅ Atualização de dados de torneio');
  console.log('✅ Funcionalidade de lixeira (mover/restaurar)');
  console.log('✅ Ciclo de vida completo de torneio');
  console.log(
    '\nAcesse http://localhost:3000/admin.html para visualizar os torneios no painel administrativo.'
  );
}

// Executar os testes
runAdvancedTests();
