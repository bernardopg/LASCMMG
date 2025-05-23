const express = require('express');
const router = express.Router();
const Joi = require('joi'); // Import Joi
const multer = require('multer'); // For file uploads
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

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos CSV são permitidos'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

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

// == SCORES MANAGEMENT ==
router.get(
  '/scores',
  validateRequest(paginationQuerySchema),
  async (req, res) => {
    try {
      const { page, limit, sortBy, order } = req.query;

      const { scores, total } = await scoreModel.getAllScores({
        limit,
        offset: (page - 1) * limit,
        sortBy,
        order,
        includeDeleted: false, // Admin can see all scores but not deleted ones by default
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
        'Erro ao buscar todas as pontuações (admin).'
      );
      res
        .status(500)
        .json({ success: false, message: 'Erro ao buscar pontuações.' });
    }
  }
);

router.post(
  '/scores',
  validateRequest({ body: scoreUpdateSchema.body }),
  async (req, res) => {
    const scoreData = req.body;
    try {
      const newScore = await scoreModel.createScore(scoreData);
      logger.info(
        {
          component: 'AdminScoresRoute',
          scoreId: newScore.id,
          requestId: req.id,
        },
        `Nova pontuação criada (admin): ${newScore.id}.`
      );
      res.status(201).json({
        success: true,
        score: newScore,
        message: 'Pontuação criada com sucesso.',
      });
    } catch (error) {
      logger.error(
        {
          component: 'AdminScoresRoute',
          err: error,
          body: req.body,
          requestId: req.id,
        },
        'Erro ao criar pontuação (admin).'
      );
      res
        .status(500)
        .json({ success: false, message: 'Erro ao criar pontuação.' });
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
    const { scoreId } = req.params;
    const scoreData = req.body;
    try {
      const updatedScore = await scoreModel.updateScore(scoreId, scoreData);
      if (!updatedScore) {
        return res
          .status(404)
          .json({ success: false, message: 'Pontuação não encontrada.' });
      }
      logger.info(
        { component: 'AdminScoresRoute', scoreId, requestId: req.id },
        `Pontuação atualizada (admin): ${scoreId}.`
      );
      res.json({
        success: true,
        score: updatedScore,
        message: 'Pontuação atualizada com sucesso.',
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
        `Erro ao atualizar pontuação ${scoreId} (admin).`
      );
      res
        .status(500)
        .json({ success: false, message: 'Erro ao atualizar pontuação.' });
    }
  }
);

router.delete(
  '/scores/:scoreId',
  validateRequest({ params: scoreIdParamSchema.params }),
  async (req, res) => {
    const { scoreId } = req.params;
    const permanent = req.query.permanent === 'true';
    try {
      const success = await scoreModel.deleteScore(scoreId, permanent);
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Pontuação não encontrada ou já excluída.',
        });
      }
      logger.info(
        {
          component: 'AdminScoresRoute',
          scoreId,
          permanent,
          requestId: req.id,
        },
        `Pontuação ${permanent ? 'permanentemente excluída' : 'movida para lixeira'} (admin): ${scoreId}.`
      );
      res.json({
        success: true,
        message: `Pontuação ${permanent ? 'permanentemente excluída' : 'movida para lixeira'} com sucesso.`,
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
        `Erro ao excluir pontuação ${scoreId} (admin).`
      );
      res
        .status(500)
        .json({ success: false, message: 'Erro ao excluir pontuação.' });
    }
  }
);

// == TRASH MANAGEMENT ==
router.get(
  '/trash',
  validateRequest(adminGetTrashQuerySchema),
  async (req, res) => {
    try {
      const { page, limit, itemType } = req.query;

      let trashItems = [];
      let total = 0;

      if (!itemType || itemType === 'players') {
        const { players, total: playersTotal } = await playerModel.getAllPlayers({
          limit: itemType === 'players' ? limit : undefined,
          offset: itemType === 'players' ? (page - 1) * limit : 0,
          includeDeleted: true,
          deletedOnly: true,
        });
        trashItems = trashItems.concat(
          players.map(player => ({ ...player, type: 'player' }))
        );
        total += playersTotal;
      }

      if (!itemType || itemType === 'tournaments') {
        const { tournaments, total: tournamentsTotal } = await tournamentModel.getAllTournaments({
          limit: itemType === 'tournaments' ? limit : undefined,
          offset: itemType === 'tournaments' ? (page - 1) * limit : 0,
          includeDeleted: true,
        });
        const deletedTournaments = tournaments.filter(t => t.is_deleted);
        trashItems = trashItems.concat(
          deletedTournaments.map(tournament => ({ ...tournament, type: 'tournament' }))
        );
        total += deletedTournaments.length;
      }

      if (!itemType || itemType === 'scores') {
        const { scores, total: scoresTotal } = await scoreModel.getAllScores({
          limit: itemType === 'scores' ? limit : undefined,
          offset: itemType === 'scores' ? (page - 1) * limit : 0,
          includeDeleted: true,
          deletedOnly: true,
        });
        trashItems = trashItems.concat(
          scores.map(score => ({ ...score, type: 'score' }))
        );
        total += scoresTotal;
      }

      // Sort by deleted_at desc
      trashItems.sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at));

      // Apply pagination if getting all types
      if (!itemType) {
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        trashItems = trashItems.slice(startIndex, endIndex);
      }

      res.json({
        success: true,
        trashItems,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalItems: total,
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
  '/trash/:itemType/:itemId/restore',
  validateRequest({ params: trashItemSchema.params }),
  async (req, res) => {
    const { itemType, itemId } = req.params;
    try {
      let success = false;
      let itemName = '';

      switch (itemType) {
        case 'player':
          success = await playerModel.restorePlayer(itemId);
          itemName = 'Jogador';
          break;
        case 'tournament':
          success = await tournamentModel.restoreTournament(itemId);
          itemName = 'Torneio';
          break;
        case 'score':
          success = await scoreModel.restoreScore(itemId);
          itemName = 'Pontuação';
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Tipo de item inválido.',
          });
      }

      if (!success) {
        return res.status(404).json({
          success: false,
          message: `${itemName} não encontrado na lixeira.`,
        });
      }

      logger.info(
        {
          component: 'AdminTrashRoute',
          itemType,
          itemId,
          requestId: req.id,
        },
        `${itemName} restaurado da lixeira (admin): ${itemId}.`
      );

      res.json({
        success: true,
        message: `${itemName} restaurado com sucesso.`,
      });
    } catch (error) {
      logger.error(
        {
          component: 'AdminTrashRoute',
          err: error,
          itemType,
          itemId,
          requestId: req.id,
        },
        `Erro ao restaurar item ${itemId} da lixeira (admin).`
      );
      res
        .status(500)
        .json({ success: false, message: 'Erro ao restaurar item.' });
    }
  }
);

router.delete(
  '/trash/:itemType/:itemId',
  validateRequest({ params: trashItemSchema.params }),
  async (req, res) => {
    const { itemType, itemId } = req.params;
    try {
      let success = false;
      let itemName = '';

      switch (itemType) {
        case 'player':
          success = await playerModel.deletePlayer(itemId, true); // permanent = true
          itemName = 'Jogador';
          break;
        case 'tournament':
          success = await tournamentModel.deleteTournament(itemId, true); // permanent = true
          itemName = 'Torneio';
          break;
        case 'score':
          success = await scoreModel.deleteScore(itemId, true); // permanent = true
          itemName = 'Pontuação';
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Tipo de item inválido.',
          });
      }

      if (!success) {
        return res.status(404).json({
          success: false,
          message: `${itemName} não encontrado.`,
        });
      }

      logger.info(
        {
          component: 'AdminTrashRoute',
          itemType,
          itemId,
          requestId: req.id,
        },
        `${itemName} excluído permanentemente (admin): ${itemId}.`
      );

      res.json({
        success: true,
        message: `${itemName} excluído permanentemente.`,
      });
    } catch (error) {
      logger.error(
        {
          component: 'AdminTrashRoute',
          err: error,
          itemType,
          itemId,
          requestId: req.id,
        },
        `Erro ao excluir permanentemente item ${itemId} (admin).`
      );
      res
        .status(500)
        .json({ success: false, message: 'Erro ao excluir item permanentemente.' });
    }
  }
);

// == IMPORT/UPLOAD MANAGEMENT ==
router.post(
  '/import/players',
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Arquivo CSV é obrigatório.',
        });
      }

      const { tournamentId } = req.body;
      const filePath = req.file.path;

      // Process CSV file
      const fs = require('fs');
      const csv = require('csv-parser'); // You'll need to install csv-parser
      const players = [];

      const stream = fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          // Expected CSV format: name, nickname, email, gender, skill_level
          players.push({
            name: row.name?.trim(),
            nickname: row.nickname?.trim() || null,
            email: row.email?.trim() || null,
            gender: row.gender?.trim() || null,
            skill_level: row.skill_level?.trim() || null,
            tournament_id: tournamentId || null,
          });
        })
        .on('end', async () => {
          try {
            const imported = await playerModel.importPlayers(players);

            // Clean up uploaded file
            fs.unlinkSync(filePath);

            logger.info(
              {
                component: 'AdminImportRoute',
                imported,
                total: players.length,
                requestId: req.id,
              },
              `Importação de jogadores concluída (admin): ${imported}/${players.length}.`
            );

            res.json({
              success: true,
              imported,
              total: players.length,
              message: `${imported} jogadores importados com sucesso de ${players.length} registros.`,
            });
          } catch (importError) {
            // Clean up uploaded file on error
            fs.unlinkSync(filePath);
            throw importError;
          }
        });

    } catch (error) {
      logger.error(
        {
          component: 'AdminImportRoute',
          err: error,
          requestId: req.id,
        },
        'Erro ao importar jogadores (admin).'
      );
      res
        .status(500)
        .json({ success: false, message: 'Erro ao importar jogadores.' });
    }
  }
);

router.post(
  '/import/tournaments',
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Arquivo CSV é obrigatório.',
        });
      }

      const filePath = req.file.path;

      // Process CSV file
      const fs = require('fs');
      const csv = require('csv-parser');
      const tournaments = [];

      const stream = fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          // Expected CSV format: id, name, date, description, num_players_expected, bracket_type, status
          tournaments.push({
            id: row.id?.trim(),
            name: row.name?.trim(),
            date: row.date?.trim(),
            description: row.description?.trim() || null,
            num_players_expected: parseInt(row.num_players_expected) || null,
            bracket_type: row.bracket_type?.trim() || 'single-elimination',
            status: row.status?.trim() || 'Pendente',
            entry_fee: parseFloat(row.entry_fee) || 0.0,
            prize_pool: row.prize_pool?.trim() || '',
            rules: row.rules?.trim() || '',
          });
        })
        .on('end', async () => {
          try {
            const imported = await tournamentModel.importTournaments(tournaments);

            // Clean up uploaded file
            fs.unlinkSync(filePath);

            logger.info(
              {
                component: 'AdminImportRoute',
                imported,
                total: tournaments.length,
                requestId: req.id,
              },
              `Importação de torneios concluída (admin): ${imported}/${tournaments.length}.`
            );

            res.json({
              success: true,
              imported,
              total: tournaments.length,
              message: `${imported} torneios importados com sucesso de ${tournaments.length} registros.`,
            });
          } catch (importError) {
            // Clean up uploaded file on error
            fs.unlinkSync(filePath);
            throw importError;
          }
        });

    } catch (error) {
      logger.error(
        {
          component: 'AdminImportRoute',
          err: error,
          requestId: req.id,
        },
        'Erro ao importar torneios (admin).'
      );
      res
        .status(500)
        .json({ success: false, message: 'Erro ao importar torneios.' });
    }
  }
);

// == ADMIN USER MANAGEMENT ==
router.post(
  '/users',
  validateRequest({ body: adminUserCreateSchema.body }),
  async (req, res) => {
    const userData = req.body;
    try {
      const newUser = await adminModel.createAdminUser(userData);
      logger.info(
        {
          component: 'AdminUsersRoute',
          userId: newUser.id,
          username: newUser.username,
          requestId: req.id,
        },
        `Novo usuário admin criado: ${newUser.username}.`
      );
      res.status(201).json({
        success: true,
        user: {
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
          created_at: newUser.created_at,
        },
        message: 'Usuário administrativo criado com sucesso.',
      });
    } catch (error) {
      logger.error(
        {
          component: 'AdminUsersRoute',
          err: error,
          body: req.body,
          requestId: req.id,
        },
        'Erro ao criar usuário admin.'
      );
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({
          success: false,
          message: 'Nome de usuário já existe.',
        });
      }
      res
        .status(500)
        .json({ success: false, message: 'Erro ao criar usuário.' });
    }
  }
);

// == STATISTICS ==
router.get('/stats', async (req, res) => {
  try {
    const [
      tournamentStats,
      playerStats,
      scoreStats,
    ] = await Promise.all([
      tournamentModel.getTournamentStats(),
      playerModel.getPlayerStats(),
      scoreModel.getScoreStats(),
    ]);

    const overallStats = {
      tournaments: tournamentStats,
      players: playerStats,
      scores: scoreStats,
      summary: {
        totalTournaments: tournamentStats.total,
        totalPlayers: playerStats.total,
        totalScores: scoreStats.total,
        activeTournaments: tournamentStats.active,
        deletedItems: {
          tournaments: tournamentStats.softDeleted || 0,
          players: playerStats.softDeleted || 0,
          scores: scoreStats.softDeleted || 0,
        },
      },
    };

    res.json({
      success: true,
      stats: overallStats,
    });
  } catch (error) {
    logger.error(
      { component: 'AdminStatsRoute', err: error, requestId: req.id },
      'Erro ao buscar estatísticas administrativas.'
    );
    res
      .status(500)
      .json({ success: false, message: 'Erro ao buscar estatísticas.' });
  }
});

module.exports = router;
