const express = require('express');
const router = express.Router();
const tournamentModel = require('../lib/models/tournamentModel');
const playerModel = require('../lib/models/playerModel');
const scoreModel = require('../lib/models/scoreModel');
const matchModel = require('../lib/models/matchModel');
const { authMiddleware } = require('../lib/authMiddleware');
const logger = require('../lib/logger').logger; // Adicionado logger
const {
  calculateTopPlayersDb,
  calculateCommonScoresDb,
  calculatePlayerPerformanceDb,
  calculatePlayerStatsDb,
} = require('../lib/statsService'); // Importar funções de cálculo de estatísticas

router.get('/tournaments/:tournamentId', authMiddleware, async (req, res) => {
  const { tournamentId } = req.params;
  const reqId = req.id; // Captura req.id para uso em logs

  if (!tournamentId || typeof tournamentId !== 'string') {
    logger.warn(
      { reqId, tournamentId },
      'Tentativa de acesso com ID de torneio inválido'
    );
    return res.status(400).json({
      success: false,
      message: 'ID de torneio inválido',
    });
  }

  try {
    const tournament = await tournamentModel.getTournamentById(tournamentId);
    if (!tournament) {
      logger.warn({ reqId, tournamentId }, 'Torneio não encontrado');
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
    logger.info(
      { reqId, tournamentId, stats },
      `Estatísticas do torneio ${tournamentId} recuperadas com sucesso`
    );
    res.json(stats);
  } catch (error) {
    logger.error(
      { reqId, tournamentId, err: error },
      `Erro ao buscar estatísticas do torneio ${tournamentId} (DB)`
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao calcular estatísticas do torneio',
    });
  }
});

router.get(
  '/players/:tournamentId/:playerName',
  authMiddleware,
  async (req, res) => {
    const { tournamentId, playerName } = req.params;
    const reqId = req.id; // Captura req.id para uso em logs

    if (!tournamentId || !playerName) {
      logger.warn(
        { reqId, tournamentId, playerName },
        'Tentativa de acesso com ID de torneio ou nome de jogador ausente'
      );
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
        logger.warn(
          { reqId, tournamentId, playerName },
          'Jogador não encontrado no torneio'
        );
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

      logger.info(
        { reqId, tournamentId, playerName, playerStats },
        `Estatísticas do jogador ${playerName} no torneio ${tournamentId} recuperadas com sucesso`
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
      logger.error(
        { reqId, tournamentId, playerName, err: error },
        `Erro ao buscar estatísticas do jogador ${playerName} (DB)`
      );
      res.status(500).json({
        success: false,
        message: 'Erro ao calcular estatísticas do jogador',
      });
    }
  }
);

// Funções de cálculo de estatísticas movidas para lib/statsService.js

module.exports = router;
