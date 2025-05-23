const express = require('express');
const router = express.Router();
const playerModel = require('../lib/models/playerModel');
const { logger } = require('../lib/logger/logger');
const {
  validateRequest,
  playerIdParamSchema,
  adminGetPlayersQuerySchema,
} = require('../lib/utils/validationUtils'); // Added adminGetPlayersQuerySchema

// GET /api/players - List all global players (public, paginated)
router.get(
  '/',
  validateRequest(adminGetPlayersQuerySchema),
  async (req, res) => {
    try {
      const { page, limit, sortBy, order, filters } = req.query; // Validated by Joi

      const { players, total } = await playerModel.getAllPlayers({
        limit,
        offset: (page - 1) * limit,
        sortBy: sortBy || 'name', // Default sortBy if not provided by validated query
        order: order || 'asc', // Default order if not provided by validated query
        filters: filters || {}, // Default filters if not provided
      });

      const formattedPlayers = players.map((p) => ({
        id: p.id,
        PlayerName: p.name,
        name: p.name,
        Nickname: p.nickname,
        nickname: p.nickname,
        email: p.email,
        gender: p.gender,
        skill_level: p.skill_level,
        games_played: p.games_played || 0,
        wins: p.wins || 0,
        losses: p.losses || 0,
        tournament_id: p.tournament_id,
        is_deleted: p.is_deleted,
        created_at: p.created_at,
        updated_at: p.updated_at,
      }));

      res.json({
        success: true,
        players: formattedPlayers,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalPlayers: total,
      });
    } catch (error) {
      logger.error('PlayerRoute', 'Erro ao buscar lista global de jogadores:', {
        error: error.message,
        stack: error.stack,
        requestId: req.id,
      });
      res
        .status(500)
        .json({ success: false, message: 'Erro ao buscar jogadores.' });
    }
  }
);

// GET /api/players/:playerId - Get specific player details (public)
router.get(
  '/:playerId',
  validateRequest(playerIdParamSchema),
  async (req, res) => {
    const { playerId } = req.params;
    try {
      // TODO: Implement caching strategy (e.g., Redis)
      // const cachedPlayer = await redisClient.get(`player:${playerId}:details`);
      // if (cachedPlayer) {
      //   logger.info('PlayerRoute', `Detalhes do jogador ${playerId} servidos do cache.`, { requestId: req.id });
      //   return res.json({ success: true, player: JSON.parse(cachedPlayer), source: 'cache' });
      // }

      const player = await playerModel.getPlayerById(playerId); // Assuming getPlayerById fetches a global player
      if (!player || player.is_deleted) {
        // Check for soft delete as well
        return res
          .status(404)
          .json({ success: false, message: 'Jogador não encontrado.' });
      }

      // await redisClient.set(`player:${playerId}:details`, JSON.stringify(player), 'EX', 3600); // Cache por 1 hora

      // Format player data if needed, similar to the list route
      const formattedPlayer = {
        id: player.id,
        PlayerName: player.name,
        name: player.name,
        Nickname: player.nickname,
        email: player.email, // Added email
        gender: player.gender,
        skill_level: player.skill_level,
        games_played: player.games_played,
        wins: player.wins,
        losses: player.losses,
        tournament_id: player.tournament_id, // if applicable
      };

      res.json({ success: true, player: formattedPlayer /*, source: 'db'*/ });
    } catch (error) {
      logger.error(
        'PlayerRoute',
        `Erro ao carregar detalhes do jogador ${playerId}:`,
        { error, requestId: req.id }
      );
      res.status(500).json({
        success: false,
        message: 'Erro ao carregar detalhes do jogador.',
      });
    }
  }
);

module.exports = router;
