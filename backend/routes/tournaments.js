const express = require('express');
const multer = require('multer');
const { authMiddleware } = require('../lib/middleware/authMiddleware');
const tournamentModel = require('../lib/models/tournamentModel');
const playerModel = require('../lib/models/playerModel');
const scoreModel = require('../lib/models/scoreModel');
const { logger } = require('../lib/logger/logger');
const {
  validateRequest,
  tournamentIdParamSchema,
  createTournamentSchema,
  updateTournamentSchema,
  tournamentStateSchema,
  addPlayerToTournamentSchema,
  updatePlayersInTournamentSchema,
  updateMatchScheduleSchema,
  updateMatchWinnerSchema,
  updateScoresSchema,
  playerImportItemSchema, // Import the new schema for player import validation
} = require('../lib/utils/validationUtils');

const router = express.Router();

const storage = multer.memoryStorage(); // Stores file in memory

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES, // 5 MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Formato de arquivo inválido. Apenas arquivos .json são permitidos.'), false);
    }
  },
});

// Middleware de tratamento de erro específico para Multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `Arquivo muito grande. O tamanho máximo permitido é ${MAX_FILE_SIZE_MB}MB.`,
      });
    }
    return res.status(400).json({ success: false, message: `Erro no upload do arquivo: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

// GET /api/tournaments - List all tournaments (public)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const { tournaments, total } = await tournamentModel.getAllTournaments({
      orderBy: 'date', order: 'DESC', limit, offset,
    });
    res.json({
      tournaments, totalPages: Math.ceil(total / limit), currentPage: page, totalTournaments: total,
    });
  } catch (error) {
    logger.error('TournamentsRoute', 'Erro ao carregar lista de torneios:', { error, requestId: req.id });
    res.status(500).json({ success: false, message: 'Erro ao carregar lista de torneios.' });
  }
});

// GET /api/tournaments/trash - List soft-deleted/cancelled tournaments (admin only)
router.get('/trash', authMiddleware, async (req, res) => {
  try {
    const trashedTournamentsData = await tournamentModel.getTournamentsByStatus(['Cancelado']);
    res.json(trashedTournamentsData.tournaments);
  } catch (error) {
    logger.error('TournamentsRoute', 'Erro ao listar torneios na lixeira:', { error, requestId: req.id });
    res.status(500).json({ success: false, message: 'Erro interno ao listar torneios na lixeira.' });
  }
});

// POST /api/tournaments/create - Create a new tournament (admin only)
router.post(
  '/create',
  authMiddleware,
  upload.single('playersFile'),
  handleMulterError,
  validateRequest(createTournamentSchema),
  async (req, res) => {
    const { name, date, description, numPlayersExpected, bracket_type, entry_fee, prize_pool, rules } = req.body;
    const sanitizedName = name; // Joi handles trimming
    const tournamentId = `${Date.now()}-${sanitizedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;
    try {
      const initialTournamentState = {
        tournamentName: sanitizedName,
        description: description || '',
        num_players_expected: parseInt(numPlayersExpected, 10) || 32,
        bracket_type: bracket_type || 'single-elimination',
        currentRound: null,
        matches: {},
      };
      const newTournamentData = {
        id: tournamentId, name: sanitizedName, date, description: initialTournamentState.description,
        num_players_expected: initialTournamentState.num_players_expected,
        bracket_type: initialTournamentState.bracket_type, status: 'Pendente',
        state_json: JSON.stringify(initialTournamentState),
        entry_fee: entry_fee, prize_pool: prize_pool || '', rules: rules || '',
      };
      const createdTournament = await tournamentModel.createTournament(newTournamentData);
      logger.info('TournamentsRoute', `Torneio ${createdTournament.id} criado.`, { tournamentId: createdTournament.id, name: sanitizedName, requestId: req.id });
      res.status(201).json({ success: true, message: 'Torneio criado com sucesso!', tournamentId: createdTournament.id, tournament: createdTournament });
    } catch (error) {
      logger.error('TournamentsRoute', 'Erro ao criar torneio:', { error, requestId: req.id, body: req.body });
      res.status(500).json({ success: false, message: 'Erro interno ao criar torneio.' });
    }
  }
);

// GET /api/tournaments/:tournamentId - Get specific tournament details (public)
router.get('/:tournamentId', validateRequest(tournamentIdParamSchema), async (req, res) => {
  const { tournamentId } = req.params;
  try {
    const tournament = await tournamentModel.getTournamentById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Torneio não encontrado.' });
    }
    const { state_json, ...tournamentDetails } = tournament; // Exclude state_json from general details
    res.json({ success: true, tournament: tournamentDetails });
  } catch (error) {
    logger.error('TournamentsRoute', `Erro ao carregar detalhes do torneio ${tournamentId}:`, { error, requestId: req.id });
    res.status(500).json({ success: false, message: 'Erro ao carregar detalhes do torneio.' });
  }
});

// GET /api/tournaments/:tournamentId/state - Get tournament state (bracket, etc.) (public)
router.get('/:tournamentId/state', validateRequest(tournamentIdParamSchema), async (req, res) => {
  const { tournamentId } = req.params;
  try {
    const tournament = await tournamentModel.getTournamentById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Torneio não encontrado.' });
    }
    const state = tournament.state_json ? JSON.parse(tournament.state_json) : {};
    res.json(state);
  } catch (error) {
    logger.error('TournamentsRoute', `Erro ao carregar estado do torneio ${tournamentId}:`, { error, requestId: req.id });
    res.status(500).json({ success: false, message: 'Erro ao carregar estado do torneio.' });
  }
});

// POST /api/tournaments/:tournamentId/state - Update tournament state (admin only)
router.post('/:tournamentId/state', authMiddleware, validateRequest({ ...tournamentIdParamSchema, ...tournamentStateSchema }), async (req, res) => {
  const { tournamentId } = req.params;
  const { state } = req.body;
  try {
    const success = await tournamentModel.updateTournamentState(tournamentId, JSON.stringify(state));
    if (success) {
      logger.info('TournamentsRoute', `Estado do torneio ${tournamentId} salvo.`, { tournamentId, requestId: req.id });
      res.json({ success: true, message: 'Estado do torneio salvo com sucesso!' });
    } else {
      res.status(404).json({ success: false, message: 'Torneio não encontrado para atualizar estado.' });
    }
  } catch (error) {
    logger.error('TournamentsRoute', `Erro ao salvar estado do torneio ${tournamentId}:`, { error, requestId: req.id });
    res.status(500).json({ success: false, message: 'Erro ao salvar estado do torneio.' });
  }
});

// GET /api/tournaments/:tournamentId/players - List players for a tournament (public)
router.get('/:tournamentId/players', validateRequest(tournamentIdParamSchema), async (req, res) => {
  const { tournamentId } = req.params;
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20; // Default limit
    const offset = (page - 1) * limit;
    const { players: playersFromDB, total } = await playerModel.getPlayersByTournamentId(tournamentId, { limit, offset });
    const players = playersFromDB.map(p => ({ PlayerName: p.name, Nickname: p.nickname, GamesPlayed: p.games_played, Wins: p.wins, Losses: p.losses, id: p.id, gender: p.gender, skill_level: p.skill_level }));
    res.json({ players, totalPages: Math.ceil(total / limit), currentPage: page, totalPlayers: total });
  } catch (error) {
    logger.error('TournamentsRoute', `Erro ao carregar jogadores do torneio ${tournamentId}:`, { error, requestId: req.id });
    res.status(500).json({ success: false, message: 'Erro ao carregar jogadores.' });
  }
});

// POST /api/tournaments/:tournamentId/players - Add a player to a tournament (admin only)
router.post('/:tournamentId/players', authMiddleware, validateRequest({ ...tournamentIdParamSchema, ...addPlayerToTournamentSchema }), async (req, res) => {
  const { tournamentId } = req.params;
  const { PlayerName, Nickname, gender, skill_level } = req.body;
  try {
    const newPlayer = await playerModel.addPlayer({ tournament_id: tournamentId, name: PlayerName, nickname: Nickname, gender, skill_level });
    const playerForFrontend = { PlayerName: newPlayer.name, Nickname: newPlayer.nickname, GamesPlayed: newPlayer.games_played, Wins: newPlayer.wins, Losses: newPlayer.losses, id: newPlayer.id, gender: newPlayer.gender, skill_level: newPlayer.skill_level };
    logger.info('TournamentsRoute', `Jogador ${newPlayer.id} adicionado ao torneio ${tournamentId}.`, { playerId: newPlayer.id, requestId: req.id });
    res.status(201).json({ success: true, message: `Jogador "${PlayerName}" adicionado com sucesso!`, player: playerForFrontend });
  } catch (error) {
    logger.error('TournamentsRoute', `Erro ao adicionar jogador ao torneio ${tournamentId}:`, { error, requestId: req.id });
    if (error.message.includes('já existe neste torneio')) {
      return res.status(409).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Erro interno ao adicionar jogador.' });
  }
});

// POST /api/tournaments/:tournamentId/players/import - Import players from JSON (admin only)
router.post(
  '/:tournamentId/players/import',
  authMiddleware, // Auth check
  validateRequest(tournamentIdParamSchema), // Validate tournamentId in params first
  upload.single('jsonFile'), // Then Multer for file
  handleMulterError, // Then handle Multer errors
  async (req, res) => {
    const { tournamentId } = req.params;
    if (!req.file) { // Should be caught by Multer if no file, but good to double check
      return res.status(400).json({ success: false, message: 'Nenhum arquivo JSON fornecido.' });
    }
    try {
      const playersToImport = JSON.parse(req.file.buffer.toString('utf8'));
      if (!Array.isArray(playersToImport)) {
        return res.status(400).json({ success: false, message: 'Arquivo JSON mal formatado (não é um array).' });
      }

      const validPlayers = [];
      const validationErrors = [];
      for (let i = 0; i < playersToImport.length; i++) {
        const playerObject = playersToImport[i];
        const { error: playerError, value: validatedPlayer } = playerImportItemSchema.validate(playerObject, { abortEarly: false, allowUnknown: true, stripUnknown: true });
        if (playerError) {
          validationErrors.push({ playerIndex: i, originalData: playerObject, errors: playerError.details.map(d => d.message) });
        } else {
          validPlayers.push(validatedPlayer); // Use the validated (and potentially stripped) player object
        }
      }

      if (validationErrors.length > 0) {
        logger.warn('TournamentsRoute', `Erros de validação ao importar jogadores para ${tournamentId}.`, { validationErrors, requestId: req.id });
        // Optionally, decide if you want to proceed with validPlayers or reject the whole batch
        // For now, let's inform about errors but proceed with valid ones if any.
        // If you want to reject all on any error, return here:
        // return res.status(400).json({ success: false, message: 'Dados de jogadores inválidos no arquivo JSON.', details: validationErrors });
      }

      if (validPlayers.length === 0 && playersToImport.length > 0) {
        return res.status(400).json({ success: false, message: 'Nenhum jogador válido encontrado no arquivo JSON para importação.', details: validationErrors });
      }

      // Proceed with only valid players
      const importResult = await playerModel.importPlayers(tournamentId, validPlayers);

      let responseMessage = `${importResult.count} jogadores importados com sucesso.`;
      if (importResult.errors.length > 0) {
        responseMessage += ` ${importResult.errors.length} jogadores não puderam ser salvos no banco de dados.`;
      }
      if (validationErrors.length > 0) {
        responseMessage += ` ${validationErrors.length} jogadores no arquivo JSON continham dados inválidos e foram ignorados.`;
      }

      logger.info('TournamentsRoute', `Importação de jogadores para ${tournamentId} concluída.`, {
        importedCount: importResult.count,
        dbErrors: importResult.errors.length,
        validationErrors: validationErrors.length,
        requestId: req.id
      });
      res.json({
        success: true,
        message: responseMessage,
        importedCount: importResult.count,
        databaseErrors: importResult.errors,
        validationErrors: validationErrors
      });
    } catch (error) {
      logger.error('TournamentsRoute', `Erro ao importar jogadores para ${tournamentId}:`, { error: error.message, stack: error.stack, requestId: req.id });
      if (error instanceof SyntaxError) {
        return res.status(400).json({ success: false, message: 'Arquivo JSON inválido.' });
      }
      res.status(500).json({ success: false, message: 'Erro interno ao importar jogadores.' });
    }
  }
);

// POST /api/tournaments/:tournamentId/players/update - Replace player list (admin only)
router.post('/:tournamentId/players/update', authMiddleware, validateRequest({ ...tournamentIdParamSchema, ...updatePlayersInTournamentSchema }), async (req, res) => {
  const { tournamentId } = req.params;
  const { players: playersData } = req.body; // playersData is an array of player objects
  try {
    const result = await playerModel.replacePlayerListForTournament(tournamentId, playersData);
    logger.info('TournamentsRoute', `Lista de jogadores para ${tournamentId} atualizada.`, { result, requestId: req.id });
    res.json({ success: true, message: `${result.count} jogadores processados. Erros: ${result.errors.length}`, ...result });
  } catch (error) {
    logger.error('TournamentsRoute', `Erro ao atualizar lista de jogadores para ${tournamentId}:`, { error, requestId: req.id });
    res.status(500).json({ success: false, message: 'Erro interno ao atualizar lista de jogadores.' });
  }
});

// GET /api/tournaments/:tournamentId/scores - List scores for a tournament (public)
router.get('/:tournamentId/scores', validateRequest(tournamentIdParamSchema), async (req, res) => {
  const { tournamentId } = req.params;
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    const { scores, total } = await scoreModel.getScoresByTournamentId(tournamentId, { limit, offset });
    res.json({ scores, totalPages: Math.ceil(total / limit), currentPage: page, totalScores: total });
  } catch (error) {
    logger.error('TournamentsRoute', `Erro ao carregar placares do torneio ${tournamentId}:`, { error, requestId: req.id });
    res.status(500).json({ success: false, message: 'Erro ao carregar placares.' });
  }
});

// POST /api/tournaments/:tournamentId/scores/update - (Bulk) Add scores (admin only)
router.post('/:tournamentId/scores/update', authMiddleware, validateRequest({ ...tournamentIdParamSchema, ...updateScoresSchema }), async (req, res) => {
  const { tournamentId } = req.params; // Validated by tournamentIdParamSchema
  const { scores: scoresData } = req.body; // Validated by updateScoresSchema (ensures it's an array of valid score objects)

  // Manual validation if (!Array.isArray(scoresData)) is removed.
  // The TODO for Joi validation is now addressed by updateScoresSchema.
  try {
    let addedScoresCount = 0;
    // The inner 'if (score && ...)' check can also be removed as Joi's items(bulkScoreItemSchema) ensures each score object is valid.
    for (const score of scoresData) {
      // All required fields in 'score' are guaranteed by bulkScoreItemSchema
      await scoreModel.addScore({ tournament_id: tournamentId, ...score });
      addedScoresCount++;
    }
    logger.info('TournamentsRoute', `Placares para ${tournamentId} atualizados. Processados: ${addedScoresCount}.`, { requestId: req.id });
    res.json({ success: true, message: `Placares atualizados! ${addedScoresCount} processados.` });
  } catch (error) {
    logger.error('TournamentsRoute', `Erro ao atualizar placares para ${tournamentId}:`, { error, requestId: req.id, body: req.body }); // Log the body for debugging
    res.status(500).json({ success: false, message: 'Erro ao atualizar placares.' });
  }
});

// POST /api/tournaments/:tournamentId/generate-bracket - Generate bracket (admin only)
router.post('/:tournamentId/generate-bracket', authMiddleware, validateRequest(tournamentIdParamSchema), async (req, res) => {
  const { tournamentId } = req.params;
  try {
    const tournament = await tournamentModel.getTournamentById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Torneio não encontrado.' });
    }

    if (tournament.status !== 'Pendente') {
      logger.warn('TournamentsRoute', `Tentativa de gerar chaveamento para torneio ${tournamentId} que não está pendente. Status: ${tournament.status}`, { requestId: req.id });
      return res.status(400).json({ success: false, message: 'O chaveamento só pode ser gerado para torneios pendentes.' });
    }

    const { players } = await playerModel.getPlayersByTournamentId(tournamentId, { limit: -1 }); // Get all players
    if (!players || players.length < 2) {
      logger.warn('TournamentsRoute', `Tentativa de gerar chaveamento para torneio ${tournamentId} com menos de 2 jogadores.`, { numPlayers: players?.length || 0, requestId: req.id });
      return res.status(400).json({ success: false, message: 'São necessários pelo menos 2 jogadores para gerar um chaveamento.' });
    }

    const bracketUtils = require('../lib/utils/bracketUtils'); // Import locally to ensure it's available
    let newBracketState;
    const baseState = {
      tournamentName: tournament.name,
      description: tournament.description,
      num_players_expected: players.length, // Use actual number of players for generation
      bracket_type: tournament.bracket_type,
      currentRound: null, // Will be set by generation function
      matches: {},
    };

    if (tournament.bracket_type === 'single-elimination') {
      newBracketState = bracketUtils.generateSingleEliminationBracket(players, baseState);
    } else if (tournament.bracket_type === 'double-elimination') {
      newBracketState = bracketUtils.generateDoubleEliminationBracket(players, baseState);
    } else {
      logger.error('TournamentsRoute', `Tipo de chaveamento desconhecido ou não suportado: ${tournament.bracket_type} para torneio ${tournamentId}`, { requestId: req.id });
      return res.status(500).json({ success: false, message: `Tipo de chaveamento '${tournament.bracket_type}' não suportado.` });
    }

    await tournamentModel.updateTournamentState(tournamentId, JSON.stringify(newBracketState));
    await tournamentModel.updateTournamentStatus(tournamentId, 'Em Andamento'); // Update status

    logger.info('TournamentsRoute', `Chaveamento gerado e salvo para torneio ${tournamentId}. Status alterado para "Em Andamento".`, { tournamentId, requestId: req.id });
    res.json({ success: true, message: 'Chaveamento gerado e salvo com sucesso! O torneio está agora "Em Andamento".', bracket: newBracketState });
  } catch (error) {
    logger.error('TournamentsRoute', `Erro ao gerar chaveamento para ${tournamentId}:`, { error: error.message, stack: error.stack, requestId: req.id });
    res.status(500).json({ success: false, message: 'Erro interno ao gerar chaveamento.' });
  }
});

// POST /api/tournaments/:tournamentId/reset - Reset tournament state (admin only)
router.post('/:tournamentId/reset', authMiddleware, validateRequest(tournamentIdParamSchema), async (req, res) => {
  const { tournamentId } = req.params;
  try {
    const tournament = await tournamentModel.getTournamentById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Torneio não encontrado.' });
    }
    const initialTournamentState = {
      tournamentName: tournament.name, description: tournament.description,
      num_players_expected: tournament.num_players_expected, bracket_type: tournament.bracket_type,
      currentRound: null, matches: {},
    };
    await tournamentModel.updateTournamentState(tournamentId, JSON.stringify(initialTournamentState));
    await tournamentModel.updateTournamentStatus(tournamentId, 'Pendente');
    logger.info('TournamentsRoute', `Torneio ${tournamentId} resetado.`, { requestId: req.id });
    res.json({ success: true, message: 'Torneio resetado.', newState: initialTournamentState });
  } catch (error) {
    logger.error('TournamentsRoute', `Erro ao resetar torneio ${tournamentId}:`, { error, requestId: req.id });
    res.status(500).json({ success: false, message: 'Erro ao resetar torneio.' });
  }
});

// PATCH /api/tournaments/:tournamentId/[property] - Update specific tournament properties (admin only)
// Using a combined schema for updates for simplicity, specific schemas per property could be made.
router.patch('/:tournamentId/name', authMiddleware, validateRequest({ ...tournamentIdParamSchema, body: updateTournamentSchema.body.extract('name') }), async (req, res) => {
  const { tournamentId } = req.params;
  const { name } = req.body;
  try {
    let updatedTournament = await tournamentModel.updateTournament(tournamentId, { name });
    // ... (rest of the logic including state_json update)
    if (!updatedTournament) return res.status(404).json({ success: false, message: 'Torneio não encontrado.' });
    if (updatedTournament.state_json) {
      try {
        const state = JSON.parse(updatedTournament.state_json);
        state.tournamentName = name;
        await tournamentModel.updateTournamentState(tournamentId, JSON.stringify(state));
        const reloaded = await tournamentModel.getTournamentById(tournamentId);
        if (reloaded) updatedTournament.state_json = reloaded.state_json;
      } catch (e) { logger.warn('TournamentsRoute', `Erro ao atualizar state_json para nome do torneio ${tournamentId}`, { e }); }
    }
    logger.info('TournamentsRoute', `Nome do torneio ${tournamentId} atualizado para "${name}".`, { requestId: req.id });
    res.json({ success: true, message: 'Nome do torneio atualizado!', tournament: updatedTournament });
  } catch (error) {
    logger.error('TournamentsRoute', `Erro ao atualizar nome do torneio ${tournamentId}:`, { error, requestId: req.id });
    res.status(500).json({ success: false, message: 'Erro ao atualizar nome do torneio.' });
  }
});

router.patch('/:tournamentId/description', authMiddleware, validateRequest({ ...tournamentIdParamSchema, body: updateTournamentSchema.body.extract('description') }), async (req, res) => {
  const { tournamentId } = req.params;
  const { description } = req.body;
  try {
    let updatedTournament = await tournamentModel.updateTournament(tournamentId, { description });
    if (!updatedTournament) return res.status(404).json({ success: false, message: 'Torneio não encontrado.' });
    if (updatedTournament.state_json) {
      try {
        const state = JSON.parse(updatedTournament.state_json);
        state.description = description;
        await tournamentModel.updateTournamentState(tournamentId, JSON.stringify(state));
        const reloaded = await tournamentModel.getTournamentById(tournamentId);
        if (reloaded) updatedTournament.state_json = reloaded.state_json;
      } catch (e) { logger.warn('TournamentsRoute', `Erro ao atualizar state_json para descrição do torneio ${tournamentId}`, { e }); }
    }
    logger.info('TournamentsRoute', `Descrição do torneio ${tournamentId} atualizada.`, { requestId: req.id });
    res.json({ success: true, message: 'Descrição do torneio atualizada!', tournament: updatedTournament });
  } catch (error) {
    logger.error('TournamentsRoute', `Erro ao atualizar descrição do torneio ${tournamentId}:`, { error, requestId: req.id });
    res.status(500).json({ success: false, message: 'Erro ao atualizar descrição.' });
  }
});

router.patch('/:tournamentId/entry_fee', authMiddleware, validateRequest({ ...tournamentIdParamSchema, body: updateTournamentSchema.body.extract('entry_fee') }), async (req, res) => {
  const { tournamentId } = req.params;
  const { entry_fee } = req.body;
  try {
    const updatedTournament = await tournamentModel.updateTournament(tournamentId, { entry_fee });
    if (!updatedTournament) return res.status(404).json({ success: false, message: 'Torneio não encontrado.' });
    logger.info('TournamentsRoute', `Taxa de entrada do torneio ${tournamentId} atualizada.`, { requestId: req.id });
    res.json({ success: true, message: 'Taxa de entrada atualizada!', tournament: updatedTournament });
  } catch (error) {
    logger.error('TournamentsRoute', `Erro ao atualizar taxa de entrada ${tournamentId}:`, { error, requestId: req.id });
    res.status(500).json({ success: false, message: 'Erro ao atualizar taxa de entrada.' });
  }
});

router.patch('/:tournamentId/prize_pool', authMiddleware, validateRequest({ ...tournamentIdParamSchema, body: updateTournamentSchema.body.extract('prize_pool') }), async (req, res) => {
  const { tournamentId } = req.params;
  const { prize_pool } = req.body;
  try {
    const updatedTournament = await tournamentModel.updateTournament(tournamentId, { prize_pool });
    if (!updatedTournament) return res.status(404).json({ success: false, message: 'Torneio não encontrado.' });
    logger.info('TournamentsRoute', `Premiação do torneio ${tournamentId} atualizada.`, { requestId: req.id });
    res.json({ success: true, message: 'Premiação atualizada!', tournament: updatedTournament });
  } catch (error) {
    logger.error('TournamentsRoute', `Erro ao atualizar premiação ${tournamentId}:`, { error, requestId: req.id });
    res.status(500).json({ success: false, message: 'Erro ao atualizar premiação.' });
  }
});

router.patch('/:tournamentId/rules', authMiddleware, validateRequest({ ...tournamentIdParamSchema, body: updateTournamentSchema.body.extract('rules') }), async (req, res) => {
  const { tournamentId } = req.params;
  const { rules } = req.body;
  try {
    const updatedTournament = await tournamentModel.updateTournament(tournamentId, { rules });
    if (!updatedTournament) return res.status(404).json({ success: false, message: 'Torneio não encontrado.' });
    logger.info('TournamentsRoute', `Regras do torneio ${tournamentId} atualizadas.`, { requestId: req.id });
    res.json({ success: true, message: 'Regras atualizadas!', tournament: updatedTournament });
  } catch (error) {
    logger.error('TournamentsRoute', `Erro ao atualizar regras ${tournamentId}:`, { error, requestId: req.id });
    res.status(500).json({ success: false, message: 'Erro ao atualizar regras.' });
  }
});

router.patch('/:tournamentId/status', authMiddleware, validateRequest({ ...tournamentIdParamSchema, body: updateTournamentSchema.body.extract('status') }), async (req, res) => {
  const { tournamentId } = req.params;
  const { status } = req.body;
  try {
    const updatedTournament = await tournamentModel.updateTournamentStatus(tournamentId, status);
    if (!updatedTournament) return res.status(404).json({ success: false, message: 'Torneio não encontrado ou status não alterado.' });
    logger.info('TournamentsRoute', `Status do torneio ${tournamentId} atualizado para "${status}".`, { requestId: req.id });
    res.json({ success: true, message: 'Status do torneio atualizado!', tournament: updatedTournament });
  } catch (error) {
    logger.error('TournamentsRoute', `Erro ao atualizar status do torneio ${tournamentId}:`, { error, requestId: req.id });
    res.status(500).json({ success: false, message: 'Erro ao atualizar status.' });
  }
});

// PATCH /api/tournaments/:tournamentId/matches/:matchId/schedule - Update match schedule (admin only)
router.patch('/:tournamentId/matches/:matchId/schedule', authMiddleware, validateRequest(updateMatchScheduleSchema), async (req, res) => {
  const { tournamentId, matchId: routeMatchId } = req.params;
  const { schedule } = req.body;
  try {
    const tournament = await tournamentModel.getTournamentById(tournamentId);
    if (!tournament) return res.status(404).json({ success: false, message: 'Torneio não encontrado.' });
    let state = tournament.state_json ? JSON.parse(tournament.state_json) : { matches: {} };
    if (state.matches && state.matches[routeMatchId]) {
      state.matches[routeMatchId].schedule = schedule;
      await tournamentModel.updateTournamentState(tournamentId, JSON.stringify(state));
      logger.info('TournamentsRoute', `Agendamento da partida ${routeMatchId} do torneio ${tournamentId} atualizado.`, { requestId: req.id });
      res.json({ success: true, message: 'Agendamento da partida atualizado.', newState: state });
    } else {
      res.status(404).json({ success: false, message: 'Partida não encontrada no estado do torneio.' });
    }
  } catch (error) {
    logger.error('TournamentsRoute', `Erro ao atualizar agendamento da partida ${routeMatchId} do torneio ${tournamentId}:`, { error, requestId: req.id });
    res.status(500).json({ success: false, message: 'Erro ao atualizar agendamento.' });
  }
});

// PATCH /api/tournaments/:tournamentId/matches/:matchId/winner - Update match winner/scores (admin only)
router.patch('/:tournamentId/matches/:matchId/winner', authMiddleware, validateRequest(updateMatchWinnerSchema), async (req, res) => {
  const { tournamentId, matchId: routeMatchId } = req.params;
  const { winnerId, player1Score, player2Score } = req.body;
  try {
    const tournament = await tournamentModel.getTournamentById(tournamentId);
    if (!tournament) return res.status(404).json({ success: false, message: 'Torneio não encontrado.' });
    let state = tournament.state_json ? JSON.parse(tournament.state_json) : { matches: {} };
    if (state.matches && state.matches[routeMatchId]) {
      state.matches[routeMatchId].score = [player1Score, player2Score];
      let winnerPlayerIndex = null;
      if (winnerId !== null && winnerId !== undefined) {
        const matchPlayers = state.matches[routeMatchId].players;
        if (matchPlayers && matchPlayers[0] && matchPlayers[0].db_id === winnerId) winnerPlayerIndex = 0;
        else if (matchPlayers && matchPlayers[1] && matchPlayers[1].db_id === winnerId) winnerPlayerIndex = 1;
      }
      state.matches[routeMatchId].winner = winnerPlayerIndex;
      await tournamentModel.updateTournamentState(tournamentId, JSON.stringify(state));
      logger.info('TournamentsRoute', `Vencedor/placar da partida ${routeMatchId} do torneio ${tournamentId} atualizado.`, { requestId: req.id });
      res.json({ success: true, message: 'Vencedor/placar da partida atualizado.', newState: state });
    } else {
      res.status(404).json({ success: false, message: 'Partida não encontrada no estado do torneio.' });
    }
  } catch (error) {
    logger.error('TournamentsRoute', `Erro ao atualizar vencedor/placar da partida ${routeMatchId} do torneio ${tournamentId}:`, { error, requestId: req.id });
    res.status(500).json({ success: false, message: 'Erro ao atualizar vencedor/placar.' });
  }
});


// GET /api/tournaments/:tournamentId/stats - Get tournament stats (admin only)
router.get('/:tournamentId/stats', authMiddleware, validateRequest(tournamentIdParamSchema), async (req, res) => {
  const { tournamentId } = req.params;
  try {
    const tournament = await tournamentModel.getTournamentById(tournamentId);
    if (!tournament) return res.status(404).json({ success: false, message: 'Torneio não encontrado.' });
    const playersResult = await playerModel.getPlayersByTournamentId(tournamentId, { limit: -1 });
    const scoresResult = await scoreModel.getScoresByTournamentId(tournamentId, { limit: -1 });
    const matchesResult = await matchModel.getMatchesByTournamentId(tournamentId, { limit: -1 });
    const stats = {
      tournamentInfo: { name: tournament.name, bracketType: tournament.bracket_type, totalPlayers: playersResult.players.length, totalMatches: matchesResult.matches.length, completedMatches: scoresResult.scores.length, status: tournament.status, date: tournament.date },
      topPlayers: calculateTopPlayersDb(playersResult.players, scoresResult.scores),
      commonScores: calculateCommonScoresDb(scoresResult.scores),
      playerPerformance: calculatePlayerPerformanceDb(playersResult.players, scoresResult.scores),
    };
    logger.info('TournamentsRoute', `Estatísticas do torneio ${tournamentId} recuperadas.`, { requestId: req.id });
    res.json({ success: true, stats });
  } catch (error) {
    logger.error('TournamentsRoute', `Erro ao buscar estatísticas do torneio ${tournamentId}:`, { error, requestId: req.id });
    res.status(500).json({ success: false, message: 'Erro ao calcular estatísticas do torneio.' });
  }
});

// GET /api/tournaments/:tournamentId/players/:playerName/stats - Get specific player stats in a tournament (admin only)
// Define a schema for playerName if it has specific constraints (e.g., length, characters)
const playerNameParamSchema = { params: Joi.object({ tournamentId: tournamentIdParamSchema.params.tournamentId, playerName: Joi.string().trim().min(1).required() }) };
router.get('/:tournamentId/players/:playerName/stats', authMiddleware, validateRequest(playerNameParamSchema), async (req, res) => {
  const { tournamentId, playerName: routePlayerName } = req.params;
  const playerName = decodeURIComponent(routePlayerName); // Already validated as string
  try {
    const player = await playerModel.getPlayerByNameInTournament(tournamentId, playerName);
    if (!player) return res.status(404).json({ success: false, message: 'Jogador não encontrado neste torneio.' });
    const scoresResult = await scoreModel.getScoresByTournamentId(tournamentId, { limit: -1, includeDeleted: false });
    const playerScores = scoresResult.scores.filter(score => score.player1_id === player.id || score.player2_id === player.id);
    const playerStats = calculatePlayerStatsDb(playerName, player, playerScores);
    logger.info('TournamentsRoute', `Estatísticas do jogador ${playerName} no torneio ${tournamentId} recuperadas.`, { requestId: req.id });
    res.json({ success: true, player: { id: player.id, name: player.name, nickname: player.nickname || '', gender: player.gender, skill_level: player.skill_level, gamesPlayed: playerStats.gamesPlayed, wins: playerStats.wins, losses: playerStats.losses }, stats: { matchHistory: playerStats.matches, winRate: playerStats.winRate, averageScoreDifference: playerStats.averageScoreDifference, opponentStats: playerStats.opponentStats } });
  } catch (error) {
    logger.error('TournamentsRoute', `Erro ao buscar estatísticas do jogador ${playerName} no torneio ${tournamentId}:`, { error, requestId: req.id });
    res.status(500).json({ success: false, message: 'Erro ao calcular estatísticas do jogador.' });
  }
});

module.exports = router;