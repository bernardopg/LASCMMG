/**
 * Serviço para cálculo de estatísticas de torneios e jogadores.
 * Contém funções de lógica de negócio para agregar dados.
 */

/**
 * Calcula o número de torneios por mês.
 * @param {Array<object>} tournaments Array de objetos de torneio.
 * @returns {Array<object>} Array de objetos com contagem de torneios por mês.
 */
function calculateTournamentsByMonth(tournaments) {
  const months = {};

  tournaments.forEach((tournament) => {
    if (tournament.date) {
      const date = new Date(tournament.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!months[monthKey]) {
        months[monthKey] = {
          count: 0,
          label: `${date.toLocaleString('pt-BR', { month: 'long' })} ${date.getFullYear()}`,
        };
      }

      months[monthKey].count++;
    }
  });

  return Object.entries(months)
    .map(([key, value]) => ({ month: key, ...value }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Calcula os jogadores com mais vitórias.
 * @param {Array<object>} players Array de objetos de jogador.
 * @param {Array<object>} scores Array de objetos de score.
 * @returns {Array<object>} Array de objetos com os top jogadores por vitórias.
 */
function calculateTopPlayersDb(players, scores) {
  const playerWinsMap = {};
  scores.forEach((score) => {
    if (score.winner_id) {
      // Tenta encontrar o nome do vencedor usando winner_name do score ou buscando no array de players
      const winnerName =
        score.winner_name ||
        players.find((p) => p.id === score.winner_id)?.name;
      if (winnerName) {
        playerWinsMap[winnerName] = (playerWinsMap[winnerName] || 0) + 1;
      }
    }
  });

  return Object.entries(playerWinsMap)
    .map(([name, wins]) => ({ name, wins }))
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 5); // Limita aos top 5
}

/**
 * Calcula a frequência de placares comuns.
 * @param {Array<object>} scores Array de objetos de score.
 * @returns {Array<object>} Array de objetos com a contagem de placares comuns.
 */
function calculateCommonScoresDb(scores) {
  const scorePatterns = {};

  scores.forEach((score) => {
    if (
      score.player1_score !== undefined &&
      score.player2_score !== undefined
    ) {
      const pattern = `${score.player1_score}-${score.player2_score}`;
      scorePatterns[pattern] = (scorePatterns[pattern] || 0) + 1;
    }
  });

  return Object.entries(scorePatterns)
    .map(([pattern, count]) => ({ pattern, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Calcula a performance dos jogadores (vitórias, derrotas, taxa de vitória).
 * Assume que os objetos de jogador já contêm games_played, wins e losses.
 * @param {Array<object>} players Array de objetos de jogador.
 * @param {Array<object>} _scores Array de objetos de score (não usado diretamente, mas mantido para consistência de assinatura se necessário).
 * @returns {Array<object>} Array de objetos com dados de performance dos jogadores.
 */
function calculatePlayerPerformanceDb(players, _scores) {
  const performanceData = players.map((player) => {
    const total = player.games_played || 0;
    const wins = player.wins || 0;
    // Calcula losses se não estiver explicitamente definido
    const losses = player.losses !== undefined ? player.losses : total - wins;

    return {
      name: player.name,
      wins,
      losses,
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
    };
  });

  return performanceData.sort((a, b) => b.winRate - a.winRate).slice(0, 10); // Limita aos top 10 por winRate
}

/**
 * Calcula estatísticas detalhadas para um jogador específico.
 * @param {string} playerName Nome do jogador.
 * @param {object} playerData Objeto de dados do jogador.
 * @param {Array<object>} playerScores Array de objetos de score onde o jogador participou.
 * @returns {object} Objeto com estatísticas detalhadas do jogador.
 */
function calculatePlayerStatsDb(playerName, playerData, playerScores) {
  const gamesPlayed = playerData.games_played || 0;
  const wins = playerData.wins || 0;
  const losses =
    playerData.losses !== undefined ? playerData.losses : gamesPlayed - wins;
  const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;

  let totalScoreDiff = 0;
  playerScores.forEach((score) => {
    if (score.player1_name === playerName) {
      totalScoreDiff += (score.player1_score || 0) - (score.player2_score || 0);
    } else if (score.player2_name === playerName) {
      totalScoreDiff += (score.player2_score || 0) - (score.player1_score || 0);
    }
  });

  const averageScoreDifference =
    gamesPlayed > 0 ? Math.round((totalScoreDiff / gamesPlayed) * 10) / 10 : 0;

  const opponentStats = {};
  playerScores.forEach((score) => {
    const opponentName =
      score.player1_name === playerName
        ? score.player2_name
        : score.player1_name;

    if (!opponentName) return; // Ignora se o nome do oponente não for encontrado

    if (!opponentStats[opponentName]) {
      opponentStats[opponentName] = { played: 0, wins: 0, losses: 0 };
    }
    opponentStats[opponentName].played++;

    // Determina o vencedor pelo nome no score, se disponível, ou pelos scores
    const winnerName =
      score.winner_name ||
      (score.player1_score > score.player2_score
        ? score.player1_name
        : score.player2_score > score.player1_score
          ? score.player2_name
          : null);

    if (winnerName === playerName) {
      opponentStats[opponentName].wins++;
    } else if (winnerName === opponentName) {
      opponentStats[opponentName].losses++;
    }
    // Empates não são contados como win/loss
  });

  const matchHistory = playerScores.map((score) => ({
    match_number: score.match_number,
    round: score.round,
    opponent:
      score.player1_name === playerName
        ? score.player2_name
        : score.player1_name,
    player_score:
      score.player1_name === playerName
        ? score.player1_score
        : score.player2_score,
    opponent_score:
      score.player1_name === playerName
        ? score.player2_score
        : score.player1_score,
    result:
      score.winner_name === playerName
        ? 'Vitória'
        : score.winner_name
          ? 'Derrota'
          : 'Pendente', // Considerar empates se aplicável
    completed_at: score.completed_at,
  }));

  return {
    gamesPlayed,
    wins,
    losses,
    winRate,
    averageScoreDifference,
    matches: matchHistory,
    opponentStats,
  };
}

module.exports = {
  calculateTournamentsByMonth,
  calculateTopPlayersDb,
  calculateCommonScoresDb,
  calculatePlayerPerformanceDb,
  calculatePlayerStatsDb,
};
