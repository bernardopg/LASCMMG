const express = require('express');
const router = express.Router();
const playerModel = require('../lib/models/playerModel');
const { logger } = require('../lib/logger/logger');
// Joi validation for query params could be added here if needed

// GET /api/players - List all global players (public, paginated)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    // Basic query param validation (could be enhanced with Joi)
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({ success: false, message: 'Parâmetros de paginação inválidos.' });
    }

    // Assuming playerModel.getAllPlayers can fetch all players if no specific filters are applied
    // or if a specific method for global players is available.
    // For now, using getAllPlayers and assuming it handles a "global" context or fetches all.
    const { players, total } = await playerModel.getAllPlayers({
      limit,
      offset: (page - 1) * limit,
      sortBy: req.query.sortBy || 'name', // Default sort
      order: req.query.order || 'asc',
      filters: { ...req.query.filters, is_global: true }, // Example: if global players have a flag or null tournament_id
                                                       // This filter part needs alignment with playerModel.
                                                       // If getAllPlayers fetches ALL players regardless of tournament,
                                                       // then is_global filter might not be needed or handled differently.
    });

    // Map to frontend expected format if necessary (e.g., PlayerName)
    const formattedPlayers = players.map(p => ({
      id: p.id,
      PlayerName: p.name, // Assuming frontend might expect PlayerName
      name: p.name,
      Nickname: p.nickname,
      gender: p.gender,
      skill_level: p.skill_level,
      // Add other fields as needed by the frontend for a global player list
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

module.exports = router;
