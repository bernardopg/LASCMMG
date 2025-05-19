const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../lib/middleware/authMiddleware');
const playerModel = require('../lib/models/playerModel');
const scoreModel = require('../lib/models/scoreModel');
const tournamentModel = require('../lib/models/tournamentModel');
const { logger } = require('../lib/logger/logger');
const {
  validateRequest,
  playerSchema,
  optionalPlayerIdSchema, // For routes like PUT/DELETE /players/:playerId
  scoreIdParamSchema,    // For routes like PUT/DELETE /scores/:scoreId
  scoreUpdateSchema,
  trashItemSchema,
  // Schemas for query params if needed for GET routes (e.g., pagination, filters)
  // For now, GET routes will not have Joi validation unless specified.
} = require('../lib/utils/validationUtils');

// Middleware to ensure only admins can access these routes
const ensureAdmin = (req, res, next) => {
  // Assuming authMiddleware populates req.user and req.user.role
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    logger.warn(
      'AdminRoutes',
      'Tentativa de acesso não autorizado a rotas de admin.',
      {
        userId: req.user ? req.user.id : 'undefined',
        role: req.user ? req.user.role : 'undefined',
        path: req.originalUrl,
        requestId: req.id,
        ip: req.ip,
      }
    );
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Requer privilégios de administrador.',
    });
  }
};

router.use(authMiddleware);
router.use(ensureAdmin);

// == PLAYER MANAGEMENT ==
// GET /players - Query params validation could be added if complex
router.get('/players', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    // sortBy, order, and filters are passed from query to playerModel.
    // playerModel.getAllPlayers should handle these.

    // For now, using a generic getAllPlayers. This might need adjustment
    // if playerModel.getAllPlayers doesn't support pagination/filtering directly
    // or if we need to filter by tournament for some admin views.
    // The frontend sends filters, sortBy, order.
    // Assuming playerModel.getAllPlayers can take these.
    const { players, total } = await playerModel.getAllPlayers({
      limit,
      offset: (page - 1) * limit,
      sortBy: req.query.sortBy,
      order: req.query.order,
      filters: req.query.filters || {}, // Pass filters if playerModel supports it
    });

    res.json({
      success: true,
      players,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalPlayers: total,
    });
  } catch (error) {
    logger.error(
      'AdminPlayersRoute',
      'Erro ao buscar todos os jogadores (admin):',
      {
        error,
        requestId: req.id,
      }
    );
    res
      .status(500)
      .json({ success: false, message: 'Erro ao buscar jogadores.' });
  }
});

router.post('/players', validateRequest({ body: playerSchema.body }), async (req, res) => {
  // playerData is validated by playerSchema
  const playerData = req.body;
  try {
    // Assuming createGlobalPlayer is the intended function for admin creation
    // or playerModel.addPlayer if a tournament_id context is implicitly managed or not required for admin creation
    const newPlayer = await playerModel.createGlobalPlayer(playerData);
    logger.info(
      'AdminPlayersRoute',
      `Novo jogador criado (admin): ${newPlayer.name}`,
      { playerId: newPlayer.id, requestId: req.id }
    );
    res.status(201).json({
      success: true,
      player: newPlayer,
      message: 'Jogador criado com sucesso.',
    });
  } catch (error) {
    logger.error('AdminPlayersRoute', 'Erro ao criar jogador (admin):', {
      error,
      body: req.body,
      requestId: req.id,
    });
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        success: false,
        message: 'Um jogador com este nome ou apelido já existe.',
      });
    }
    res.status(500).json({ success: false, message: 'Erro ao criar jogador.' });
  }
});

router.put('/players/:playerId', validateRequest({ params: optionalPlayerIdSchema.params, body: playerSchema.body }), async (req, res) => {
  const { playerId } = req.params; // Validated
  const playerData = req.body; // Validated
  try {
    const updatedPlayer = await playerModel.updatePlayer(playerId, playerData);
    if (!updatedPlayer) {
      return res
        .status(404)
        .json({ success: false, message: 'Jogador não encontrado.' });
    }
    logger.info(
      'AdminPlayersRoute',
      `Jogador atualizado (admin): ${playerId}`,
      { playerId, requestId: req.id }
    );
    res.json({
      success: true,
      player: updatedPlayer,
      message: 'Jogador atualizado com sucesso.',
    });
  } catch (error) {
    logger.error(
      'AdminPlayersRoute',
      `Erro ao atualizar jogador ${playerId} (admin):`,
      { error, body: playerData, requestId: req.id }
    );
    res
      .status(500)
      .json({ success: false, message: 'Erro ao atualizar jogador.' });
  }
});

router.delete('/players/:playerId', validateRequest({ params: optionalPlayerIdSchema.params }), async (req, res) => {
  const { playerId } = req.params; // Validated
  const permanent = req.query.permanent === 'true'; // Query params can also be validated if needed
  try {
    const success = await playerModel.deletePlayer(playerId, permanent);
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Jogador não encontrado ou já excluído.',
      });
    }
    logger.info(
      'AdminPlayersRoute',
      `Jogador ${permanent ? 'permanentemente excluído' : 'movido para lixeira'} (admin): ${playerId}`,
      { playerId, permanent, requestId: req.id }
    );
    res.json({
      success: true,
      message: `Jogador ${permanent ? 'permanentemente excluído' : 'movido para lixeira'} com sucesso.`,
    });
  } catch (error) {
    logger.error(
      'AdminPlayersRoute',
      `Erro ao excluir jogador ${playerId} (admin):`,
      { error, permanent, requestId: req.id }
    );
    res
      .status(500)
      .json({ success: false, message: 'Erro ao excluir jogador.' });
  }
});

// == SCORE MANAGEMENT ==
// GET /scores - Query params validation could be added
router.get('/scores', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    // sortBy, order, and filters are passed from query to scoreModel.
    // scoreModel.getAllScores should handle these.

    // Assuming scoreModel.getAllScores supports pagination and filtering
    const { scores, total } = await scoreModel.getAllScores({
      limit,
      offset: (page - 1) * limit,
      sortBy: req.query.sortBy,
      order: req.query.order,
      filters: req.query.filters || {},
    });

    res.json({
      success: true,
      scores,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalScores: total,
    });
  } catch (error) {
    logger.error(
      'AdminScoresRoute',
      'Erro ao buscar todos os placares (admin):',
      {
        error,
        requestId: req.id,
      }
    );
    res
      .status(500)
      .json({ success: false, message: 'Erro ao buscar placares.' });
  }
});

router.put('/scores/:scoreId', validateRequest({ params: scoreIdParamSchema.params, body: scoreUpdateSchema.body }), async (req, res) => {
  const { scoreId } = req.params; // Validated
  const scoreData = req.body; // Validated
  try {
    const updatedScore = await scoreModel.updateScore(scoreId, scoreData);
    if (!updatedScore) {
      return res
        .status(404)
        .json({ success: false, message: 'Placar não encontrado.' });
    }
    logger.info('AdminScoresRoute', `Placar atualizado (admin): ${scoreId}`, {
      scoreId,
      requestId: req.id,
    });
    res.json({
      success: true,
      score: updatedScore,
      message: 'Placar atualizado com sucesso.',
    });
  } catch (error) {
    logger.error(
      'AdminScoresRoute',
      `Erro ao atualizar placar ${scoreId} (admin):`,
      { error, body: scoreData, requestId: req.id }
    );
    res
      .status(500)
      .json({ success: false, message: 'Erro ao atualizar placar.' });
  }
});

router.delete('/scores/:scoreId', validateRequest({ params: scoreIdParamSchema.params }), async (req, res) => {
  const { scoreId } = req.params; // Validated
  const permanent = req.query.permanent === 'true';
  try {
    const success = await scoreModel.deleteScore(scoreId, permanent);
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Placar não encontrado ou já excluído.',
      });
    }
    logger.info(
      'AdminScoresRoute',
      `Placar ${permanent ? 'permanentemente excluído' : 'movido para lixeira'} (admin): ${scoreId}`,
      { scoreId, permanent, requestId: req.id }
    );
    res.json({
      success: true,
      message: `Placar ${permanent ? 'permanentemente excluído' : 'movido para lixeira'} com sucesso.`,
    });
  } catch (error) {
    logger.error(
      'AdminScoresRoute',
      `Erro ao excluir placar ${scoreId} (admin):`,
      { error, permanent, requestId: req.id }
    );
    res
      .status(500)
      .json({ success: false, message: 'Erro ao excluir placar.' });
  }
});

// == TRASH MANAGEMENT ==
// GET /trash - Query params (page, limit, type) could be validated
router.get('/trash', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10; // Limit per item type for now
    const itemTypeFilter = req.query.type || null; // 'player', 'score', 'tournament'

    let allItems = [];
    let totalPlayers = 0,
      totalScores = 0,
      totalTournaments = 0;

    if (!itemTypeFilter || itemTypeFilter === 'player') {
      const { players, total } = await playerModel.getAllPlayers({
        includeDeleted: true,
        filters: { is_deleted: 1 },
        limit,
        offset: (page - 1) * limit,
      });
      players.forEach((p) =>
        allItems.push({
          ...p,
          itemType: 'player',
          deleted_at: p.deleted_at || 'N/A',
          name: p.name || p.id,
        })
      );
      totalPlayers = total;
    }
    if (!itemTypeFilter || itemTypeFilter === 'score') {
      // Assuming getAllScores can filter by is_deleted and join for names
      const { scores, total } = await scoreModel.getAllScores({
        includeDeleted: true,
        filters: { is_deleted: 1 },
        limit,
        offset: (page - 1) * limit,
      });
      scores.forEach((s) =>
        allItems.push({
          ...s,
          itemType: 'score',
          deleted_at: s.deleted_at || 'N/A',
          name: `Placar ID ${s.id} (Partida ${s.match_id})`,
        })
      );
      totalScores = total;
    }
    if (!itemTypeFilter || itemTypeFilter === 'tournament') {
      const { tournaments, total } = await tournamentModel.getAllTournaments({
        includeDeleted: true,
        filters: { is_deleted: 1 },
        limit,
        offset: (page - 1) * limit,
      });
      tournaments.forEach((t) =>
        allItems.push({
          ...t,
          itemType: 'tournament',
          deleted_at: t.deleted_at || 'N/A',
          name: t.name,
        })
      );
      totalTournaments = total;
    }

    // Simple combined pagination for now, might need more sophisticated approach if totals are very different
    const totalItems = totalPlayers + totalScores + totalTournaments;
    // Sorting can be complex across types, for now, by deleted_at if available, then by type/name
    allItems.sort((a, b) => {
      const dateA =
        a.deleted_at && a.deleted_at !== 'N/A' ? new Date(a.deleted_at) : 0;
      const dateB =
        b.deleted_at && b.deleted_at !== 'N/A' ? new Date(b.deleted_at) : 0;
      if (dateB - dateA !== 0) return dateB - dateA;
      if (a.itemType !== b.itemType)
        return a.itemType.localeCompare(b.itemType);
      return (a.name || '').localeCompare(b.name || '');
    });

    // Manual pagination if results were fetched without it per type or if combining types
    // This is a simplified pagination for the combined list.
    // For accurate pagination per type or globally, the model queries would need to be more complex or run separately.
    const paginatedItems = allItems.slice((page - 1) * limit, page * limit);

    logger.info('AdminTrashRoute', 'Listando itens da lixeira (admin).', {
      page,
      limit,
      itemTypeFilter,
      retrievedCount: allItems.length,
      requestId: req.id,
    });
    res.json({
      success: true,
      items: paginatedItems, // Send only the paginated slice
      totalPages: Math.ceil(totalItems / limit), // This is an approximation if limits were applied per type
      currentPage: page,
      totalItems: totalItems, // Sum of totals if fetched per type
    });
  } catch (error) {
    logger.error(
      'AdminTrashRoute',
      'Erro ao buscar itens da lixeira (admin):',
      { error, requestId: req.id }
    );
    res
      .status(500)
      .json({ success: false, message: 'Erro ao buscar itens da lixeira.' });
  }
});

router.post('/trash/restore', validateRequest(trashItemSchema), async (req, res) => {
  const { itemId, itemType } = req.body; // Validated
  // Manual check for itemId and itemType can be removed

  try {
    let success = false;
    if (itemType === 'player') {
      success = await playerModel.restorePlayer(itemId);
    } else if (itemType === 'score') {
      success = await scoreModel.restoreScore(itemId);
    } else if (itemType === 'tournament') {
      success = await tournamentModel.restoreTournament(itemId);
    }
    // Joi validation already ensures itemType is one of the valid ones,
    // so the 'else' case for invalid itemType is handled by the validator.

    if (success) {
      logger.info(
        'AdminTrashRoute',
        `Item ${itemType} ${itemId} restaurado da lixeira (admin).`,
        { itemId, itemType, requestId: req.id }
      );
      res.json({
        success: true,
        message: `Item (${itemType}) restaurado com sucesso.`,
      });
    } else {
      logger.warn(
        'AdminTrashRoute',
        `Falha ao restaurar item ${itemType} ${itemId} da lixeira (admin). Item não encontrado ou não restaurável.`,
        { itemId, itemType, requestId: req.id }
      );
      res.status(404).json({
        success: false,
        message: 'Item não encontrado ou não pôde ser restaurado.',
      });
    }
  } catch (error) {
    logger.error(
      'AdminTrashRoute',
      `Erro ao restaurar item ${itemId} (${itemType}) da lixeira (admin):`,
      { error, itemId, itemType, requestId: req.id }
    );
    res
      .status(500)
      .json({ success: false, message: 'Erro ao restaurar item.' });
  }
});

router.delete('/trash/item', validateRequest(trashItemSchema), async (req, res) => {
  const { itemId, itemType } = req.body; // Validated
  // Manual check for itemId and itemType can be removed

  try {
    let success = false;
    if (itemType === 'player') {
      success = await playerModel.deletePlayer(itemId, true); // true for permanent
    } else if (itemType === 'score') {
      success = await scoreModel.deleteScore(itemId, true); // true for permanent
    } else if (itemType === 'tournament') {
      success = await tournamentModel.deleteTournament(itemId, true); // true for permanent
    }
    // Joi validation handles invalid itemType

    if (success) {
      logger.info(
        'AdminTrashRoute',
        `Item ${itemType} ${itemId} excluído permanentemente da lixeira (admin).`,
        { itemId, itemType, requestId: req.id }
      );
      res.json({
        success: true,
        message: `Item (${itemType}) excluído permanentemente.`,
      });
    } else {
      logger.warn(
        'AdminTrashRoute',
        `Falha ao excluir permanentemente item ${itemType} ${itemId} (admin). Item não encontrado.`,
        { itemId, itemType, requestId: req.id }
      );
      res.status(404).json({
        success: false,
        message: 'Item não encontrado para exclusão permanente.',
      });
    }
  } catch (error) {
    logger.error(
      'AdminTrashRoute',
      `Erro ao excluir permanentemente item ${itemId} (${itemType}) (admin):`,
      { error, itemId, itemType, requestId: req.id }
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir item permanentemente.',
    });
  }
});

module.exports = router;
