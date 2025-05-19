const express = require('express');
const router = express.Router();
const playerModel = require('../lib/models/playerModel');
const { logger } = require('../lib/logger/logger');
const { validateRequest, playerIdParamSchema } = require('../lib/utils/validationUtils'); // Added playerIdParamSchema

// GET /api/players - List all global players (public, paginated)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    // Basic query param validation (could be enhanced with Joi)
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({ success: false, message: 'Parâmetros de paginação inválidos.' });
    }

    const { players, total } = await playerModel.getAllPlayers({
      limit,
      offset: (page - 1) * limit,
      sortBy: req.query.sortBy || 'name',
      order: req.query.order || 'asc',
      filters: { ...req.query.filters }, // Removed is_global, assuming getAllPlayers handles context or fetches all non-deleted
    });

    const formattedPlayers = players.map(p => ({
      id: p.id,
      PlayerName: p.name,
      name: p.name,
      Nickname: p.nickname,
      gender: p.gender,
      skill_level: p.skill_level,
      tournament_id: p.tournament_id, // Include tournament_id if relevant for global list
      is_deleted: p.is_deleted,
    }));

    res.json({
      success: true,
      players: formattedPlayers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalPlayers: total,
    });
  } catch (error) {
    logger.error(
      'PlayerRoute',
      'Erro ao buscar lista global de jogadores:',
      { error: error.message, stack: error.stack, requestId: req.id }
    );
    res.status(500).json({ success: false, message: 'Erro ao buscar jogadores.' });
  }
});

// GET /api/players/:playerId - Get specific player details (public)
router.get('/:playerId', validateRequest(playerIdParamSchema), async (req, res) => {
  const { playerId } = req.params;
  try {
    // TODO: Implement caching strategy (e.g., Redis)
    // const cachedPlayer = await redisClient.get(`player:${playerId}:details`);
    // if (cachedPlayer) {
    //   logger.info('PlayerRoute', `Detalhes do jogador ${playerId} servidos do cache.`, { requestId: req.id });
    //   return res.json({ success: true, player: JSON.parse(cachedPlayer), source: 'cache' });
    // }

    const player = await playerModel.getPlayerById(playerId); // Assuming getPlayerById fetches a global player
    if (!player || player.is_deleted) { // Check for soft delete as well
      return res.status(404).json({ success: false, message: 'Jogador não encontrado.' });
    }

    // await redisClient.set(`player:${playerId}:details`, JSON.stringify(player), 'EX', 3600); // Cache por 1 hora

    // Format player data if needed, similar to the list route
    const formattedPlayer = {
        id: player.id,
        PlayerName: player.name,
        name: player.name,
        Nickname: player.nickname,
        gender: player.gender,
        skill_level: player.skill_level,
        games_played: player.games_played,
        wins: player.wins,
        losses: player.losses,
        tournament_id: player.tournament_id, // if applicable
    };

    res.json({ success: true, player: formattedPlayer /*, source: 'db'*/ });
  } catch (error) {
    logger.error('PlayerRoute', `Erro ao carregar detalhes do jogador ${playerId}:`, { error, requestId: req.id });
    res.status(500).json({ success: false, message: 'Erro ao carregar detalhes do jogador.' });
  }
});


module.exports = router;
