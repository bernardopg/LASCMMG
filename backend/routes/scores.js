const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../lib/middleware/authMiddleware');
const scoreModel = require('../lib/models/scoreModel');
const tournamentModel = require('../lib/models/tournamentModel');
const matchModel = require('../lib/models/matchModel'); // Import matchModel
const { logger } = require('../lib/logger/logger');
// isValidTournamentId will be handled by Joi schema if tournamentId is part of a schema
const {
  validateRequest,
  newScoreSchema,
} = require('../lib/utils/validationUtils');

// POST /api/scores - Create a new score
router.post(
  '/',
  authMiddleware,
  validateRequest(newScoreSchema),
  async (req, res) => {
    // Validation handled by newScoreSchema
    const {
      tournamentId,
      matchId,
      player1Score,
      player2Score,
      winnerId,
      stateMatchKey,
    } = req.body; // req.body is validated

    try {
      const tournament = await tournamentModel.getTournamentById(tournamentId);
      if (!tournament) {
        logger.warn(
          { component: 'ScoresRoute', tournamentId, requestId: req.id }, // Standardized logger
          `Torneio ${tournamentId} não encontrado em POST /api/scores.`
        );
        return res
          .status(404)
          .json({ success: false, message: 'Torneio não encontrado.' });
      }

      // Ensure match exists within the tournament
      const match = await matchModel.getMatchById(matchId);
      if (!match || match.tournament_id !== tournamentId) {
        logger.warn(
          {
            component: 'ScoresRoute',
            matchId,
            tournamentId,
            requestId: req.id,
          },
          `Partida ${matchId} não encontrada ou não pertence ao torneio ${tournamentId} em POST /api/scores.`
        );
        return res.status(404).json({
          success: false,
          message: 'Partida não encontrada ou não pertence ao torneio.',
        });
      }

      const scoreData = {
        tournament_id: tournamentId,
        match_id: matchId,
        player1_score: parseInt(player1Score, 10),
        player2_score: parseInt(player2Score, 10),
        winner_id: winnerId || null,
      };

      const savedScore = await scoreModel.addScore(scoreData);

      // Update tournament state (bracket)
      try {
        let state = tournament.state_json
          ? JSON.parse(tournament.state_json)
          : { matches: {} };

        if (
          state &&
          typeof state === 'object' &&
          state.matches &&
          state.matches[stateMatchKey]
        ) {
          // Prevent prototype pollution
          if (
            stateMatchKey === '__proto__' ||
            stateMatchKey === 'constructor' ||
            stateMatchKey === 'prototype'
          ) {
            logger.warn(
              {
                component: 'ScoresRoute',
                stateMatchKey,
                requestId: req.id,
              },
              `Chave stateMatchKey inválida: ${stateMatchKey} em POST /api/scores.`
            );
            return res.status(400).json({
              success: false,
              message: 'Chave stateMatchKey inválida.',
            });
          }

          state.matches[stateMatchKey].score = [
            savedScore.player1_score,
            savedScore.player2_score,
          ];

          let determinedWinnerId = savedScore.winner_id;
          if (determinedWinnerId === null && match) {
            if (savedScore.player1_score > savedScore.player2_score) {
              determinedWinnerId = match.player1_id;
            } else if (savedScore.player2_score > savedScore.player1_score) {
              determinedWinnerId = match.player2_id;
            }
          }
          state.matches[stateMatchKey].winner = determinedWinnerId;

          await tournamentModel.updateTournamentState(
            tournamentId,
            JSON.stringify(state)
          );

          logger.info(
            {
              component: 'ScoresRoute',
              scoreId: savedScore.id,
              tournamentId,
              matchId,
              stateMatchKey,
              requestId: req.id,
            }, // Standardized logger
            `Placar salvo e chaveamento atualizado para partida ${stateMatchKey} do torneio ${tournamentId} via /api/scores.`
          );
          res.status(201).json({
            success: true,
            message: 'Placar salvo e chaveamento atualizado!',
            score: savedScore,
            newState: state,
          });
        } else {
          logger.warn(
            {
              component: 'ScoresRoute',
              scoreId: savedScore.id,
              tournamentId,
              matchId,
              stateMatchKey,
              requestId: req.id,
            }, // Standardized logger
            `Partida ${stateMatchKey} (match_id DB: ${matchId}) não encontrada no state_json do torneio ${tournamentId} para atualização do chaveamento via /api/scores. Placar salvo.`
          );
          res.status(201).json({
            success: true,
            message:
              'Placar salvo, mas partida não encontrada no estado do chaveamento para atualização automática.',
            score: savedScore,
          });
        }
      } catch (stateError) {
        logger.error(
          {
            component: 'ScoresRoute',
            err: stateError,
            tournamentId,
            stateMatchKey,
            requestId: req.id,
          }, // Standardized logger
          `Erro ao atualizar o estado do torneio ${tournamentId} após salvar placar para partida ${stateMatchKey}. Placar salvo.`
        );
        res.status(201).json({
          success: true,
          message:
            'Placar salvo, mas ocorreu um erro ao atualizar o estado do chaveamento.',
          score: savedScore,
          stateUpdateError: stateError.message,
        });
      }
    } catch (error) {
      logger.error(
        {
          component: 'ScoresRoute',
          err: error,
          body: req.body,
          requestId: req.id,
        },
        'Erro ao salvar placar via /api/scores.'
      ); // Standardized logger
      res
        .status(500)
        .json({ success: false, message: 'Erro interno ao salvar placar.' });
    }
  }
);

module.exports = router;
