const express = require('express');
const router = express.Router();
const tournamentModel = require('../lib/models/tournamentModel');
const playerModel = require('../lib/models/playerModel');
const scoreModel = require('../lib/models/scoreModel');
const matchModel = require('../lib/models/matchModel');

router.get('/system', async (req, res) => {
  try {
    const tournamentStats = await tournamentModel.getTournamentStats();
    const allTournaments = await tournamentModel.getAllTournaments();

    const stats = {
      totalTournaments: tournamentStats.total,
      activeTournaments: tournamentStats.active,
      completedTournaments: tournamentStats.completed,
      pendingTournaments: tournamentStats.scheduled,
      canceledTournaments: tournamentStats.canceled,
      tournamentsByMonth: calculateTournamentsByMonth(allTournaments),
    };

    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas do sistema (DB):', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao calcular estatísticas do sistema',
    });
  }
});

router.get('/tournaments/:tournamentId', async (req, res) => {
  const { tournamentId } = req.params;

  if (!tournamentId || typeof tournamentId !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'ID de torneio inválido',
    });
  }

  try {
    const tournament = await tournamentModel.getTournamentById(tournamentId);
    if (!tournament) {
      return res
        .status(404)
        .json({ success: false, message: 'Torneio não encontrado' });
    }

    const players = await playerModel.getPlayersByTournamentId(tournamentId);
    const scores = await scoreModel.getScoresByTournamentId(tournamentId);
    const matches = await matchModel.getMatchesByTournamentId(tournamentId);

    const completedMatchesCount = scores.length;

    const stats = {
      tournamentInfo: {
        name: tournament.name,
        bracketType: tournament.bracket_type,
        totalPlayers: players.length,
        totalMatches: matches.length,
        completedMatches: completedMatchesCount,
        status: tournament.status,
        date: tournament.date,
      },
      topPlayers: calculateTopPlayersDb(players, scores),
      commonScores: calculateCommonScoresDb(scores),
      playerPerformance: calculatePlayerPerformanceDb(players, scores),
    };

    res.json(stats);
  } catch (error) {
    console.error(
      `Erro ao buscar estatísticas do torneio ${tournamentId} (DB):`,
      error
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao calcular estatísticas do torneio',
    });
  }
});

router.get('/players/:tournamentId/:playerName', async (req, res) => {
  const { tournamentId, playerName } = req.params;

  if (!tournamentId || !playerName) {
    return res.status(400).json({
      success: false,
      message: 'ID de torneio e nome do jogador são obrigatórios',
    });
  }

  try {
    const player = await playerModel.getPlayerByNameInTournament(
      tournamentId,
      playerName
    );
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Jogador não encontrado',
      });
    }

    const allScoresInTournament =
      await scoreModel.getScoresByTournamentId(tournamentId);

    const playerScores = allScoresInTournament.filter(
      (s) => s.player1_name === playerName || s.player2_name === playerName
    );

    const playerStats = calculatePlayerStatsDb(
      playerName,
      player,
      playerScores
    );

    res.json({
      player: {
        id: player.id,
        name: player.name,
        nickname: player.nickname || '',
        gamesPlayed: player.games_played,
        wins: player.wins,
        losses: player.losses,
      },
      matchHistory: playerStats.matches,
      winRate: playerStats.winRate,
      averageScoreDifference: playerStats.averageScoreDifference,
      opponentStats: playerStats.opponentStats,
    });
  } catch (error) {
    console.error(
      `Erro ao buscar estatísticas do jogador ${playerName} (DB):`,
      error
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao calcular estatísticas do jogador',
    });
  }
});

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

function calculateTopPlayersDb(players, scores) {
  const playerWinsMap = {};
  scores.forEach((score) => {
    if (score.winner_id) {
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
    .slice(0, 5);
}

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

function calculatePlayerPerformanceDb(players, _scores) {
  const performanceData = players.map((player) => {
    const total = player.games_played || 0;
    const wins = player.wins || 0;
    const losses = player.losses !== undefined ? player.losses : total - wins;

    return {
      name: player.name,
      wins,
      losses,
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
    };
  });

  return performanceData.sort((a, b) => b.winRate - a.winRate).slice(0, 10);
}

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

    if (!opponentName) return;

    if (!opponentStats[opponentName]) {
      opponentStats[opponentName] = { played: 0, wins: 0, losses: 0 };
    }
    opponentStats[opponentName].played++;

    if (score.winner_name === playerName) {
      opponentStats[opponentName].wins++;
    } else {
      opponentStats[opponentName].losses++;
    }
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
          : 'Pendente',
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

module.exports = router;
