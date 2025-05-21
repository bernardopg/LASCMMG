const express = require('express');
const router = express.Router();
const Joi = require('joi'); // Import Joi
const { authMiddleware } = require('../lib/middleware/authMiddleware');
const { roleMiddleware } = require('../lib/middleware/roleMiddleware'); // Import roleMiddleware
const playerModel = require('../lib/models/playerModel');
const scoreModel = require('../lib/models/scoreModel');
const tournamentModel = require('../lib/models/tournamentModel');
const { logger } = require('../lib/logger/logger');
const {
  validateRequest,
  playerSchema,
  optionalPlayerIdSchema, // For routes like PUT/DELETE /players/:playerId
  scoreIdParamSchema, // For routes like PUT/DELETE /scores/:scoreId
  scoreUpdateSchema,
  trashItemSchema,
  adminGetPlayersQuerySchema,
  adminGetTrashQuerySchema, // Import the new schema for trash
  // Schemas for query params if needed for GET routes (e.g., pagination, filters)
  // For now, GET routes will not have Joi validation unless specified.
  adminUserCreateSchema, // Schema for creating admin users
  paginationQuerySchema, // Generic pagination schema
} = require('../lib/utils/validationUtils');
const adminModel = require('../lib/models/adminModel'); // Import adminModel

router.use(authMiddleware);
router.use(roleMiddleware('admin')); // Use the new roleMiddleware

// == PLAYER MANAGEMENT ==
router.get(
  '/players',
  validateRequest(adminGetPlayersQuerySchema),
  async (req, res) => {
    try {
      // Query parameters are now validated and coerced by adminGetPlayersQuerySchema
      // Default values for page and limit are handled by the schema if not provided
      const { page, limit, sortBy, order, filters } = req.query;

      const { players, total } = await playerModel.getAllPlayers({
        limit,
        offset: (page - 1) * limit,
        sortBy,
        order,
        filters, // filters will be an empty object by default if not provided
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
        { component: 'AdminPlayersRoute', err: error, requestId: req.id },
        'Erro ao buscar todos os jogadores (admin).'
      );
      res
        .status(500)
        .json({ success: false, message: 'Erro ao buscar jogadores.' });
    }
  }
);

router.post(
  '/players',
  validateRequest({ body: playerSchema.body }),
  async (req, res) => {
    // playerData is validated by playerSchema
    const playerData = req.body;
    try {
      // Assuming createGlobalPlayer is the intended function for admin creation
      // or playerModel.addPlayer if a tournament_id context is implicitly managed or not required for admin creation
      const newPlayer = await playerModel.createGlobalPlayer(playerData);
      logger.info(
        {
          component: 'AdminPlayersRoute',
          playerId: newPlayer.id,
          playerName: newPlayer.name,
          requestId: req.id,
        },
        `Novo jogador criado (admin): ${newPlayer.name}.`
      );
      res.status(201).json({
        success: true,
        player: newPlayer,
        message: 'Jogador criado com sucesso.',
      });
    } catch (error) {
      logger.error(
        {
          component: 'AdminPlayersRoute',
          err: error,
          body: req.body,
          requestId: req.id,
        },
        'Erro ao criar jogador (admin).'
      );
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({
          success: false,
          message: 'Um jogador com este nome ou apelido já existe.',
        });
      }
      res
        .status(500)
        .json({ success: false, message: 'Erro ao criar jogador.' });
    }
  }
);

router.put(
  '/players/:playerId',
  validateRequest({
    params: optionalPlayerIdSchema.params,
    body: playerSchema.body,
  }),
  async (req, res) => {
    const { playerId } = req.params; // Validated
    const playerData = req.body; // Validated
    try {
      const updatedPlayer = await playerModel.updatePlayer(
        playerId,
        playerData
      );
      if (!updatedPlayer) {
        return res
          .status(404)
          .json({ success: false, message: 'Jogador não encontrado.' });
      }
      logger.info(
        { component: 'AdminPlayersRoute', playerId, requestId: req.id },
        `Jogador atualizado (admin): ${playerId}.`
      );
      res.json({
        success: true,
        player: updatedPlayer,
        message: 'Jogador atualizado com sucesso.',
      });
    } catch (error) {
      logger.error(
        {
          component: 'AdminPlayersRoute',
          err: error,
          playerId,
          body: playerData,
          requestId: req.id,
        },
        `Erro ao atualizar jogador ${playerId} (admin).`
      );
      res
        .status(500)
        .json({ success: false, message: 'Erro ao atualizar jogador.' });
    }
  }
);

router.delete(
  '/players/:playerId',
  validateRequest({ params: optionalPlayerIdSchema.params }),
  async (req, res) => {
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
        {
          component: 'AdminPlayersRoute',
          playerId,
          permanent,
          requestId: req.id,
        },
        `Jogador ${permanent ? 'permanentemente excluído' : 'movido para lixeira'} (admin): ${playerId}.`
      );
      res.json({
        success: true,
        message: `Jogador ${permanent ? 'permanentemente excluído' : 'movido para lixeira'} com sucesso.`,
      });
    } catch (error) {
      logger.error(
        {
          component: 'AdminPlayersRoute',
          err: error,
          playerId,
          permanent,
          requestId: req.id,
        },
        `Erro ao excluir jogador ${playerId} (admin).`
      );
      res
        .status(500)
        .json({ success: false, message: 'Erro ao excluir jogador.' });
    }
  }
);

// == SCORE MANAGEMENT ==
router.get(
  '/scores',
  validateRequest(adminGetPlayersQuerySchema),
  async (req, res) => {
    // Using adminGetPlayersQuerySchema for now
    try {
      // Query parameters are now validated and coerced
      const { page, limit, sortBy, order, filters } = req.query;

      // Assuming scoreModel.getAllScores supports pagination and filtering
      const { scores, total } = await scoreModel.getAllScores({
        limit,
        offset: (page - 1) * limit,
        sortBy,
        order,
        filters,
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
        { component: 'AdminScoresRoute', err: error, requestId: req.id },
        'Erro ao buscar todos os placares (admin).'
      );
      res
        .status(500)
        .json({ success: false, message: 'Erro ao buscar placares.' });
    }
  }
);

router.put(
  '/scores/:scoreId',
  validateRequest({
    params: scoreIdParamSchema.params,
    body: scoreUpdateSchema.body,
  }),
  async (req, res) => {
    const { scoreId } = req.params; // Validated
    const scoreData = req.body; // Validated
    try {
      const updatedScore = await scoreModel.updateScore(scoreId, scoreData);
      if (!updatedScore) {
        return res
          .status(404)
          .json({ success: false, message: 'Placar não encontrado.' });
      }
      logger.info(
        { component: 'AdminScoresRoute', scoreId, requestId: req.id },
        `Placar atualizado (admin): ${scoreId}.`
      );
      res.json({
        success: true,
        score: updatedScore,
        message: 'Placar atualizado com sucesso.',
      });
    } catch (error) {
      logger.error(
        {
          component: 'AdminScoresRoute',
          err: error,
          scoreId,
          body: scoreData,
          requestId: req.id,
        },
        `Erro ao atualizar placar ${scoreId} (admin).`
      );
      res
        .status(500)
        .json({ success: false, message: 'Erro ao atualizar placar.' });
    }
  }
);

router.delete(
  '/scores/:scoreId',
  validateRequest({ params: scoreIdParamSchema.params }),
  async (req, res) => {
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
        {
          component: 'AdminScoresRoute',
          scoreId,
          permanent,
          requestId: req.id,
        },
        `Placar ${permanent ? 'permanentemente excluído' : 'movido para lixeira'} (admin): ${scoreId}.`
      );
      res.json({
        success: true,
        message: `Placar ${permanent ? 'permanentemente excluído' : 'movido para lixeira'} com sucesso.`,
      });
    } catch (error) {
      logger.error(
        {
          component: 'AdminScoresRoute',
          err: error,
          scoreId,
          permanent,
          requestId: req.id,
        },
        `Erro ao excluir placar ${scoreId} (admin).`
      );
      res
        .status(500)
        .json({ success: false, message: 'Erro ao excluir placar.' });
    }
  }
);

// == TRASH MANAGEMENT ==
router.get(
  '/trash',
  validateRequest(adminGetTrashQuerySchema),
  async (req, res) => {
    try {
      // Query parameters are now validated and coerced
      const { page, limit, type: itemTypeFilter } = req.query;

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

      logger.info(
        {
          component: 'AdminTrashRoute',
          page,
          limit,
          itemTypeFilter,
          retrievedCount: allItems.length,
          requestId: req.id,
        },
        'Listando itens da lixeira (admin).'
      );
      res.json({
        success: true,
        items: paginatedItems, // Send only the paginated slice
        totalPages: Math.ceil(totalItems / limit), // This is an approximation if limits were applied per type
        currentPage: page,
        totalItems: totalItems, // Sum of totals if fetched per type
      });
    } catch (error) {
      logger.error(
        { component: 'AdminTrashRoute', err: error, requestId: req.id },
        'Erro ao buscar itens da lixeira (admin).'
      );
      res
        .status(500)
        .json({ success: false, message: 'Erro ao buscar itens da lixeira.' });
    }
  }
);

router.post(
  '/trash/restore',
  validateRequest(trashItemSchema),
  async (req, res) => {
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
          { component: 'AdminTrashRoute', itemId, itemType, requestId: req.id },
          `Item ${itemType} ${itemId} restaurado da lixeira (admin).`
        );
        res.json({
          success: true,
          message: `Item (${itemType}) restaurado com sucesso.`,
        });
      } else {
        logger.warn(
          { component: 'AdminTrashRoute', itemId, itemType, requestId: req.id },
          `Falha ao restaurar item ${itemType} ${itemId} da lixeira (admin). Item não encontrado ou não restaurável.`
        );
        res.status(404).json({
          success: false,
          message: 'Item não encontrado ou não pôde ser restaurado.',
        });
      }
    } catch (error) {
      logger.error(
        {
          component: 'AdminTrashRoute',
          err: error,
          itemId,
          itemType,
          requestId: req.id,
        },
        `Erro ao restaurar item ${itemId} (${itemType}) da lixeira (admin).`
      );
      res
        .status(500)
        .json({ success: false, message: 'Erro ao restaurar item.' });
    }
  }
);

// Changed to use path parameters for itemId and itemType
const trashItemPathSchema = {
  params: Joi.object({
    itemType: Joi.string().valid('player', 'score', 'tournament').required(),
    itemId: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  }),
};

router.delete(
  '/trash/item/:itemType/:itemId', // Changed route to use path parameters
  validateRequest(trashItemPathSchema), // Use a new schema for path parameters
  async (req, res) => {
    const { itemId, itemType } = req.params; // Get from path parameters

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
          { component: 'AdminTrashRoute', itemId, itemType, requestId: req.id },
          `Item ${itemType} ${itemId} excluído permanentemente da lixeira (admin).`
        );
        res.json({
          success: true,
          message: `Item (${itemType}) excluído permanentemente.`,
        });
      } else {
        logger.warn(
          { component: 'AdminTrashRoute', itemId, itemType, requestId: req.id },
          `Falha ao excluir permanentemente item ${itemType} ${itemId} (admin). Item não encontrado.`
        );
        res.status(404).json({
          success: false,
          message: 'Item não encontrado para exclusão permanente.',
        });
      }
    } catch (error) {
      logger.error(
        {
          component: 'AdminTrashRoute',
          err: error,
          itemId,
          itemType,
          requestId: req.id,
        },
        `Erro ao excluir permanentemente item ${itemId} (${itemType}) (admin).`
      );
      res.status(500).json({
        success: false,
        message: 'Erro ao excluir item permanentemente.',
      });
    }
  }
);

// == ADMIN USER MANAGEMENT ==
// GET /api/admin/users - List admin users
// The global router.use(roleMiddleware('admin')) at the top of this file already protects this.
router.get(
  '/users',
  // roleMiddleware('admin'), // Redundant, removed.
  validateRequest(paginationQuerySchema), // Use generic pagination for now
  async (req, res) => {
    try {
      // const { page, limit } = req.query; // For pagination if implemented in model
      const admins = await adminModel.getAllAdmins();
      res.json({ success: true, users: admins });
    } catch (error) {
      logger.error(
        { component: 'AdminUsersRoute', err: error, requestId: req.id },
        'Erro ao buscar lista de administradores.'
      );
      res.status(500).json({ success: false, message: 'Erro ao buscar administradores.' });
    }
  }
);

// POST /api/admin/users - Create a new admin user
// The global router.use(roleMiddleware('admin')) at the top of this file already protects this.
router.post(
  '/users',
  // roleMiddleware('admin'), // Redundant, removed.
  validateRequest(adminUserCreateSchema),
  async (req, res) => {
    const { username, password, role, name } = req.body; // 'name' might be optional or part of a profile
    try {
      const existingAdmin = await adminModel.getAdminByUsername(username);
      if (existingAdmin) {
        return res.status(409).json({ success: false, message: 'Nome de usuário já existe.' });
      }
      // adminModel.createAdmin expects an object with username and password.
      // Role is set to 'admin' by default in createAdmin. If a different role is passed,
      // createAdmin might need adjustment or use a different function.
      // For now, assuming createAdmin sets role to 'admin'.
      // If 'name' is part of the users table, createAdmin should handle it or an update is needed.
      const newAdmin = await adminModel.createAdmin({
        username,
        password,
        // name: name, // If your createAdmin and users table support a 'name' field
        // role: role || 'admin' // If role can be specified and createAdmin supports it
        ipAddress: req.ip // Pass IP for audit logging
      });

      // Exclude hashedPassword from the response
      const { hashedPassword, ...adminDetails } = newAdmin;

      res.status(201).json({ success: true, message: 'Administrador criado com sucesso.', user: adminDetails });
    } catch (error) {
      logger.error(
        { component: 'AdminUsersRoute', err: error, body: req.body, requestId: req.id },
        'Erro ao criar administrador.'
      );
      res.status(500).json({ success: false, message: 'Erro ao criar administrador.' });
    }
  }
);


module.exports = router;
