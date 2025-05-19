const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../lib/middleware/authMiddleware');
const scoreModel = require('../lib/models/scoreModel');
const tournamentModel = require('../lib/models/tournamentModel');
const { logger } = require('../lib/logger/logger');
const { isValidTournamentId } = require('../lib/utils/validationUtils'); // Assuming a validation util file

// POST /api/scores - Create a new score
router.post('/', authMiddleware, async (req, res) => {
  const {
    tournamentId, // Expected in body for this general endpoint
    matchId, // Expected in body
    // player1Id, // Unused
    // player2Id, // Unused
    player1Score,
    player2Score,
    winnerId,
    stateMatchKey, // Key for updating bracket state in tournament's state_json
  } = req.body;

  if (!tournamentId || !isValidTournamentId(tournamentId)) {
    logger.warn(
      'ScoresRoute',
      'ID de torneio inválido ou ausente em POST /api/scores.',
      { body: req.body, requestId: req.id }
    );
    return res
      .status(400)
      .json({ success: false, message: 'ID de torneio inválido ou ausente.' });
  }
  if (
    matchId === undefined ||
    player1Score === undefined ||
    player2Score === undefined
  ) {
    logger.warn(
      'ScoresRoute',
      'Dados de score incompletos em POST /api/scores.',
      { body: req.body, requestId: req.id }
    );
    return res.status(400).json({
      success: false,
      message: 'matchId, player1Score e player2Score são obrigatórios.',
    });
  }
  if (!stateMatchKey) {
    logger.warn('ScoresRoute', 'stateMatchKey ausente em POST /api/scores.', {
      body: req.body,
      requestId: req.id,
    });
    return res.status(400).json({
      success: false,
      message:
        'Chave da partida (stateMatchKey) não fornecida para atualização do chaveamento.',
    });
  }

  try {
    const tournament = await tournamentModel.getTournamentById(tournamentId);
    if (!tournament) {
      logger.warn(
        'ScoresRoute',
        `Torneio ${tournamentId} não encontrado em POST /api/scores.`,
        { tournamentId, requestId: req.id }
      );
      return res
        .status(404)
        .json({ success: false, message: 'Torneio não encontrado.' });
    }

    // Ensure match exists within the tournament (optional, depends on how robust matchId is)
    // const match = await matchModel.getMatchById(matchId);
    // if (!match || match.tournament_id !== tournamentId) {
    //   return res.status(404).json({ success: false, message: 'Partida não encontrada ou não pertence ao torneio.' });
    // }

    const scoreData = {
      tournament_id: tournamentId, // For logging or if model needs it explicitly
      match_id: matchId,
      player1_score: parseInt(player1Score, 10),
      player2_score: parseInt(player2Score, 10),
      winner_id: winnerId || null, // winnerId can be null if not determined by scores alone
    };

    const savedScore = await scoreModel.addScore(scoreData);

    // Update tournament state (bracket)
    let state = tournament.state_json
      ? JSON.parse(tournament.state_json)
      : { matches: {} };
    if (state && state.matches && state.matches[stateMatchKey]) {
      state.matches[stateMatchKey].score = [
        savedScore.player1_score,
        savedScore.player2_score,
      ];
      state.matches[stateMatchKey].winner = savedScore.winner_id; // winner_id from savedScore might be more reliable

      await tournamentModel.updateTournamentState(
        tournamentId,
        JSON.stringify(state)
      );

      logger.info(
        'ScoresRoute',
        `Placar salvo e chaveamento atualizado para partida ${stateMatchKey} do torneio ${tournamentId} via /api/scores.`,
        {
          scoreId: savedScore.id,
          tournamentId,
          matchId,
          stateMatchKey,
          requestId: req.id,
        }
      );
      res.status(201).json({
        success: true,
        message: 'Placar salvo e chaveamento atualizado!',
        score: savedScore,
        newState: state,
      });
    } else {
      logger.warn(
        'ScoresRoute',
        `Partida ${stateMatchKey} (match_id DB: ${matchId}) não encontrada no state_json do torneio ${tournamentId} para atualização do chaveamento via /api/scores. Placar salvo.`,
        {
          scoreId: savedScore.id,
          tournamentId,
          matchId,
          stateMatchKey,
          requestId: req.id,
        }
      );
      res.status(201).json({
        success: true,
        message:
          'Placar salvo, mas partida não encontrada no estado do chaveamento para atualização automática.',
        score: savedScore,
      });
    }
  } catch (error) {
    logger.error('ScoresRoute', 'Erro ao salvar placar via /api/scores:', {
      error,
      body: req.body,
      requestId: req.id,
    });
    res
      .status(500)
      .json({ success: false, message: 'Erro interno ao salvar placar.' });
  }
});

module.exports = router;
