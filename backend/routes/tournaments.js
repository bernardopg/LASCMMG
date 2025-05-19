const express = require('express');
const multer = require('multer');
const { authMiddleware } = require('../lib/middleware/authMiddleware');
const tournamentModel = require('../lib/models/tournamentModel');
const playerModel = require('../lib/models/playerModel');
const scoreModel = require('../lib/models/scoreModel');
const { logger } = require('../lib/logger/logger');

function isValidTournamentId(id) {
  return (
    id &&
    typeof id === 'string' &&
    !id.includes('..') &&
    !id.startsWith('/') &&
    id.length < 256
  );
}

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const { tournaments, total } = await tournamentModel.getAllTournaments({
      orderBy: 'date',
      order: 'DESC',
      limit,
      offset,
    });

    res.json({
      tournaments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalTournaments: total,
    });
  } catch (error) {
    logger.error(
      'TournamentsRoute',
      'Erro ao carregar lista de torneios do banco de dados:',
      { error, requestId: req.id }
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar lista de torneios do banco de dados.',
    });
  }
});

router.get('/trash', authMiddleware, async (req, res) => {
  try {
    const trashedTournamentsData = await tournamentModel.getTournamentsByStatus(
      ['Cancelado']
    );
    res.json(trashedTournamentsData.tournaments);
  } catch (error) {
    logger.error(
      'TournamentsRoute',
      'Erro ao listar torneios na lixeira do banco de dados:',
      { error, requestId: req.id }
    );
    res.status(500).json({
      success: false,
      message: 'Erro interno ao listar torneios na lixeira.',
    });
  }
});

router.post(
  '/create',
  authMiddleware,
  upload.single('playersFile'),
  async (req, res) => {
    const tournamentName = req.body.name;
    const tournamentDate = req.body.date;
    const tournamentDescription = req.body.description || '';
    const tournamentNumPlayers =
      req.body.numPlayersExpected || req.body.numPlayers || 32;
    const tournamentType =
      req.body.bracket_type || req.body.type || 'single-elimination';
    let tournamentEntryFee = req.body.entry_fee;
    const tournamentPrizePool = req.body.prize_pool || '';
    const tournamentRules = req.body.rules || '';

    if (!tournamentName || !tournamentDate) {
      logger.warn(
        'TournamentsRoute',
        'Tentativa de criar torneio sem nome ou data.',
        { body: req.body, requestId: req.id }
      );
      return res
        .status(400)
        .json({ success: false, message: 'Nome e data são obrigatórios.' });
    }

    let parsedEntryFee = null;
    if (
      tournamentEntryFee !== undefined &&
      tournamentEntryFee !== null &&
      tournamentEntryFee !== ''
    ) {
      parsedEntryFee = parseFloat(tournamentEntryFee);
      if (isNaN(parsedEntryFee)) {
        logger.warn(
          'TournamentsRoute',
          'Taxa de entrada inválida na criação do torneio.',
          { entry_fee: tournamentEntryFee, requestId: req.id }
        );
        return res.status(400).json({
          success: false,
          message:
            'Taxa de entrada (entry_fee) fornecida não é um número válido.',
        });
      }
      if (parsedEntryFee < 0) {
        logger.warn(
          'TournamentsRoute',
          'Taxa de entrada negativa na criação do torneio.',
          { entry_fee: parsedEntryFee, requestId: req.id }
        );
        return res.status(400).json({
          success: false,
          message: 'Taxa de entrada (entry_fee) não pode ser negativa.',
        });
      }
    } else {
      parsedEntryFee = null;
    }

    const sanitizedName = tournamentName.trim();
    const tournamentId = `${Date.now()}-${sanitizedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')}`;

    try {
      const initialTournamentState = {
        tournamentName: sanitizedName,
        description: tournamentDescription.trim(),
        num_players_expected: parseInt(tournamentNumPlayers, 10),
        bracket_type: tournamentType,
        currentRound: null,
        matches: {},
      };

      const newTournamentData = {
        id: tournamentId,
        name: sanitizedName,
        date: tournamentDate,
        description: initialTournamentState.description,
        num_players_expected: initialTournamentState.num_players_expected,
        bracket_type: initialTournamentState.bracket_type,
        status: 'Pendente',
        state_json: JSON.stringify(initialTournamentState),
        entry_fee: parsedEntryFee,
        prize_pool: tournamentPrizePool.trim(),
        rules: tournamentRules.trim(),
      };

      const createdTournament =
        await tournamentModel.createTournament(newTournamentData);

      logger.info(
        'TournamentsRoute',
        `Torneio ${createdTournament.id} criado com sucesso.`,
        {
          tournamentId: createdTournament.id,
          name: sanitizedName,
          requestId: req.id,
        }
      );
      res.status(201).json({
        success: true,
        message: 'Torneio criado com sucesso no banco de dados!',
        tournamentId: createdTournament.id,
        tournament: createdTournament,
      });
    } catch (error) {
      logger.error(
        'TournamentsRoute',
        'Erro ao criar torneio no banco de dados:',
        {
          error_message: error.message,
          error_stack: error.stack,
          error_object: error,
          requestId: req.id,
          body: req.body,
        }
      );
      const errorMessage =
        process.env.NODE_ENV === 'development' && error.message
          ? `Erro ao criar torneio: ${error.message}`
          : 'Erro interno ao criar torneio no banco de dados.';
      res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }
  }
);

// Rota para obter detalhes de um torneio específico
router.get('/:tournamentId', async (req, res) => {
  const { tournamentId } = req.params;
  if (!isValidTournamentId(tournamentId)) {
    logger.warn(
      'TournamentsRoute',
      'ID de torneio inválido em GET /:tournamentId.',
      {
        tournamentId,
        requestId: req.id,
      }
    );
    return res
      .status(400)
      .json({ success: false, message: 'ID de torneio inválido.' });
  }
  try {
    const tournament = await tournamentModel.getTournamentById(tournamentId);
    if (!tournament) {
      logger.warn(
        'TournamentsRoute',
        `Torneio ${tournamentId} não encontrado em GET /:tournamentId.`,
        { tournamentId, requestId: req.id }
      );
      return res
        .status(404)
        .json({ success: false, message: 'Torneio não encontrado.' });
    }
    const { state_json, ...tournamentDetails } = tournament;
    res.json({ success: true, tournament: tournamentDetails });
  } catch (error) {
    logger.error(
      'TournamentsRoute',
      `Erro ao carregar detalhes do torneio ${tournamentId}:`,
      { error, tournamentId, requestId: req.id }
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar detalhes do torneio.',
    });
  }
});

router.get('/:tournamentId/state', async (req, res) => {
  const { tournamentId } = req.params;
  if (!isValidTournamentId(tournamentId)) {
    logger.warn('TournamentsRoute', 'ID de torneio inválido em GET /state.', {
      tournamentId,
      requestId: req.id,
    });
    return res
      .status(400)
      .json({ success: false, message: 'ID de torneio inválido.' });
  }
  try {
    const tournament = await tournamentModel.getTournamentById(tournamentId);
    if (!tournament) {
      logger.warn(
        'TournamentsRoute',
        `Torneio ${tournamentId} não encontrado em GET /state.`,
        { tournamentId, requestId: req.id }
      );
      return res
        .status(404)
        .json({ success: false, message: 'Torneio não encontrado.' });
    }
    const state = tournament.state_json
      ? JSON.parse(tournament.state_json)
      : {};
    res.json(state);
  } catch (error) {
    logger.error(
      'TournamentsRoute',
      `Erro ao carregar estado para o torneio ${tournamentId} do banco de dados:`,
      { error, tournamentId, requestId: req.id }
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar estado do banco de dados.',
    });
  }
});

router.post('/:tournamentId/state', authMiddleware, async (req, res) => {
  const { tournamentId } = req.params;
  const { state } = req.body;
  if (!isValidTournamentId(tournamentId)) {
    logger.warn('TournamentsRoute', 'ID de torneio inválido em POST /state.', {
      tournamentId,
      requestId: req.id,
    });
    return res
      .status(400)
      .json({ success: false, message: 'ID de torneio inválido.' });
  }
  if (!state || typeof state !== 'object' || !state.matches) {
    logger.warn(
      'TournamentsRoute',
      'Dados de estado inválidos em POST /state.',
      { tournamentId, body: req.body, requestId: req.id }
    );
    return res
      .status(400)
      .json({ success: false, message: 'Dados de estado inválidos.' });
  }
  try {
    const success = await tournamentModel.updateTournamentState(
      tournamentId,
      JSON.stringify(state)
    );
    if (success) {
      logger.info(
        'TournamentsRoute',
        `Estado do torneio ${tournamentId} salvo com sucesso.`,
        { tournamentId, requestId: req.id }
      );
      res.json({
        success: true,
        message: 'Estado do torneio salvo com sucesso no banco de dados!',
      });
    } else {
      logger.warn(
        'TournamentsRoute',
        `Torneio ${tournamentId} não encontrado para atualizar estado.`,
        { tournamentId, requestId: req.id }
      );
      res.status(404).json({
        success: false,
        message: 'Torneio não encontrado para atualizar o estado.',
      });
    }
  } catch (error) {
    logger.error(
      'TournamentsRoute',
      'Erro ao salvar estado do torneio no banco de dados:',
      { error, tournamentId, requestId: req.id }
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar estado do torneio no banco de dados.',
    });
  }
});

router.get('/:tournamentId/players', async (req, res) => {
  const { tournamentId } = req.params;
  if (!isValidTournamentId(tournamentId)) {
    logger.warn('TournamentsRoute', 'ID de torneio inválido em GET /players.', {
      tournamentId,
      requestId: req.id,
    });
    return res.status(400).json({ success: false, message: 'ID inválido.' });
  }
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const { players: playersFromDB, total } =
      await playerModel.getPlayersByTournamentId(tournamentId, {
        limit,
        offset,
      });

    const players = playersFromDB.map((p) => ({
      PlayerName: p.name,
      Nickname: p.nickname,
      GamesPlayed: p.games_played,
      Wins: p.wins,
      Losses: p.losses,
      id: p.id,
      gender: p.gender,
      skill_level: p.skill_level,
    }));
    res.json({
      players,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalPlayers: total,
    });
  } catch (error) {
    logger.error(
      'TournamentsRoute',
      `Erro ao carregar jogadores para o torneio ${tournamentId} do banco de dados:`,
      { error, tournamentId, requestId: req.id }
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar jogadores do banco de dados.',
    });
  }
});

router.post('/:tournamentId/players', authMiddleware, async (req, res) => {
  const { tournamentId } = req.params;
  const { PlayerName, Nickname = '', gender, skill_level } = req.body;
  if (!isValidTournamentId(tournamentId)) {
    logger.warn(
      'TournamentsRoute',
      'ID de torneio inválido em POST /players.',
      { tournamentId, requestId: req.id }
    );
    return res.status(400).json({ success: false, message: 'ID inválido.' });
  }
  if (
    !PlayerName ||
    typeof PlayerName !== 'string' ||
    PlayerName.trim().length === 0 ||
    PlayerName.trim().length > 100
  ) {
    logger.warn(
      'TournamentsRoute',
      'Nome de jogador inválido em POST /players.',
      { PlayerName, requestId: req.id }
    );
    return res.status(400).json({ success: false, message: 'Nome inválido.' });
  }

  try {
    const sanitizedName = PlayerName.trim().substring(0, 100);
    const sanitizedNickname = Nickname.trim().substring(0, 50);
    const sanitizedGender = gender ? gender.trim().substring(0, 50) : null;
    const sanitizedSkillLevel = skill_level
      ? skill_level.trim().substring(0, 50)
      : null;

    const newPlayer = await playerModel.addPlayer({
      tournament_id: tournamentId,
      name: sanitizedName,
      nickname: sanitizedNickname,
      gender: sanitizedGender,
      skill_level: sanitizedSkillLevel,
    });

    const playerForFrontend = {
      PlayerName: newPlayer.name,
      Nickname: newPlayer.nickname,
      GamesPlayed: newPlayer.games_played,
      Wins: newPlayer.wins,
      Losses: newPlayer.losses,
      id: newPlayer.id,
      gender: newPlayer.gender,
      skill_level: newPlayer.skill_level,
    };
    logger.info(
      'TournamentsRoute',
      `Jogador ${newPlayer.id} adicionado ao torneio ${tournamentId}.`,
      { playerId: newPlayer.id, tournamentId, requestId: req.id }
    );
    res.status(201).json({
      success: true,
      message: `Jogador "${sanitizedName}" adicionado com sucesso ao banco de dados!`,
      player: playerForFrontend,
    });
  } catch (error) {
    logger.error(
      'TournamentsRoute',
      `Erro ao salvar jogador para ${tournamentId} no banco de dados:`,
      { error, tournamentId, requestId: req.id, body: req.body }
    );
    if (error.message.includes('já existe neste torneio')) {
      return res.status(409).json({ success: false, message: error.message });
    }
    res.status(500).json({
      success: false,
      message: 'Erro interno ao salvar jogador no banco de dados.',
    });
  }
});

router.post(
  '/:tournamentId/players/import',
  authMiddleware,
  upload.single('jsonFile'),
  async (req, res) => {
    const { tournamentId } = req.params;
    let playersToImport = [];
    let message = '';

    if (!isValidTournamentId(tournamentId)) {
      logger.warn(
        'TournamentsRoute',
        'ID de torneio inválido em POST /players/import.',
        { tournamentId, requestId: req.id }
      );
      return res
        .status(400)
        .json({ success: false, message: 'ID de torneio inválido.' });
    }

    if (!req.file || !req.file.buffer) {
      logger.warn(
        'TournamentsRoute',
        'Nenhum arquivo JSON fornecido para importação de jogadores.',
        { tournamentId, requestId: req.id }
      );
      return res
        .status(400)
        .json({ success: false, message: 'Nenhum arquivo JSON fornecido.' });
    }

    try {
      const fileContent = req.file.buffer.toString('utf8');
      try {
        playersToImport = JSON.parse(fileContent);
        if (!Array.isArray(playersToImport)) {
          throw new Error('O conteúdo do JSON não é um array.');
        }
      } catch (parseError) {
        logger.error(
          'TournamentsRoute',
          `Erro ao fazer parse do arquivo JSON para importação de jogadores no torneio ${tournamentId}: ${parseError.message}`,
          { error: parseError, tournamentId, requestId: req.id }
        );
        return res
          .status(400)
          .json({ success: false, message: 'Arquivo JSON mal formatado.' });
      }

      const importResult = await playerModel.importPlayers(
        tournamentId,
        playersToImport
      );

      if (importResult.count > 0) {
        message = `${importResult.count} jogadores importados com sucesso.`;
        if (importResult.errors.length > 0) {
          message += ` ${importResult.errors.length} jogadores não puderam ser importados devido a erros no banco de dados.`;
        }
      } else {
        message = 'Nenhum jogador foi importado.';
        if (importResult.errors.length > 0) {
          message += ` ${importResult.errors.length} jogadores não puderam ser importados devido a erros no banco de dados.`;
        } else {
          message =
            'Nenhum jogador para importar ou todos já existiam sem alterações.';
        }
      }

      logger.info(
        'TournamentsRoute',
        `Importação de jogadores para ${tournamentId} concluída. Importados: ${importResult.count}. Erros DB: ${importResult.errors.length}.`,
        {
          tournamentId,
          result: importResult,
          requestId: req.id,
        }
      );
      res.json({
        success: true,
        message: message,
        importedCount: importResult.count,
        errors: importResult.errors,
      });
    } catch (error) {
      logger.error(
        'TournamentsRoute',
        `Erro ao importar jogadores para o torneio ${tournamentId} (DB):`,
        { error, tournamentId, requestId: req.id }
      );
      if (error instanceof SyntaxError) {
        res
          .status(400)
          .json({ success: false, message: 'Arquivo JSON inválido.' });
      } else {
        res.status(500).json({
          success: false,
          message: 'Erro interno ao importar jogadores.',
        });
      }
    }
  }
);

router.post(
  '/:tournamentId/players/update',
  authMiddleware,
  async (req, res) => {
    const { tournamentId } = req.params;
    const playersData = req.body.players;
    let validationErrors = [];
    let message = '';

    if (!isValidTournamentId(tournamentId)) {
      logger.warn(
        'TournamentsRoute',
        'ID de torneio inválido em POST /players/update.',
        { tournamentId, requestId: req.id }
      );
      return res
        .status(400)
        .json({ success: false, message: 'ID de torneio inválido.' });
    }

    if (!Array.isArray(playersData)) {
      logger.warn(
        'TournamentsRoute',
        'Dados de jogadores inválidos para atualização (não é um array).',
        { tournamentId, body: req.body, requestId: req.id }
      );
      return res.status(400).json({
        success: false,
        message: 'Formato de dados de jogadores inválido. Esperado um array.',
      });
    }

    const sanitizedPlayers = playersData
      .map((p) => ({
        name: p.PlayerName || p.name,
        nickname: p.Nickname || p.nickname || '',
        gender: p.gender,
        skill_level: p.skill_level,
      }))
      .filter((p) => p.name);

    if (sanitizedPlayers.length === 0 && playersData.length > 0) {
      validationErrors.push({
        general: 'Nenhum jogador válido fornecido após sanitização.',
      });
    }

    try {
      const result = await playerModel.replacePlayerListForTournament(
        tournamentId,
        sanitizedPlayers
      );

      if (result.count > 0) {
        message = `${result.count} jogadores atualizados/inseridos com sucesso.`;
        if (result.errors.length > 0) {
          message += ` ${result.errors.length} jogadores não puderam ser processados devido a erros no banco de dados.`;
        }
        if (validationErrors.length > 0) {
          message += ` ${validationErrors.length} jogadores apresentaram problemas de validação.`;
        }
      } else {
        message = 'Nenhum jogador foi atualizado/inserido.';
        if (result.errors.length > 0) {
          message += ` ${result.errors.length} jogadores não puderam ser processados devido a erros no banco de dados.`;
        }
        if (validationErrors.length > 0) {
          message += ` ${validationErrors.length} jogadores apresentaram problemas de validação.`;
        } else if (result.errors.length === 0) {
          message = 'Nenhum jogador para atualizar ou lista vazia fornecida.';
        }
      }

      logger.info(
        'TournamentsRoute',
        `Lista de jogadores para ${tournamentId} atualizada. Processados: ${result.count}. Erros DB: ${result.errors.length}. Erros Validação: ${validationErrors.length}`,
        { tournamentId, result: result, validationErrors, requestId: req.id }
      );
      res.json({
        success: true,
        message: message,
        updatedCount: result.count,
        errors: result.errors,
        validationIssues: validationErrors,
      });
    } catch (error) {
      logger.error(
        'TournamentsRoute',
        `Erro ao atualizar lista de jogadores para o torneio ${tournamentId} (DB):`,
        { error, tournamentId, requestId: req.id, body: req.body }
      );
      res.status(500).json({
        success: false,
        message: 'Erro interno ao atualizar lista de jogadores.',
      });
    }
  }
);

router.get('/:tournamentId/scores', async (req, res) => {
  const { tournamentId } = req.params;
  if (!isValidTournamentId(tournamentId)) {
    logger.warn(
      'TournamentsRoute',
      'ID de torneio inválido em GET /:tournamentId/scores.',
      { tournamentId, requestId: req.id }
    );
    return res
      .status(400)
      .json({ success: false, message: 'ID de torneio inválido.' });
  }

  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const { scores, total } = await scoreModel.getScoresByTournamentId(
      tournamentId,
      { limit, offset }
    );

    res.json({
      scores,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalScores: total,
    });
  } catch (error) {
    logger.error(
      'TournamentsRoute',
      `Erro ao carregar placares para o torneio ${tournamentId} do banco de dados:`,
      {
        error_message: error.message,
        error_stack: error.stack,
        error_object: error,
        tournamentId,
        requestId: req.id,
      }
    );
    const errorMessage =
      process.env.NODE_ENV === 'development' && error.message
        ? `Erro ao carregar placares: ${error.message}`
        : 'Erro ao carregar placares do banco de dados.';
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
});

router.post(
  '/:tournamentId/scores/update',
  authMiddleware,
  async (req, res) => {
    const { tournamentId } = req.params;
    const scoresData = req.body.scores;
    let addedScores = [];
    let validationErrors = [];

    if (!isValidTournamentId(tournamentId)) {
      logger.warn(
        'TournamentsRoute',
        'ID de torneio inválido em POST /scores/update.',
        { tournamentId, requestId: req.id }
      );
      return res
        .status(400)
        .json({ success: false, message: 'ID de torneio inválido.' });
    }

    if (!Array.isArray(scoresData)) {
      logger.warn(
        'TournamentsRoute',
        'Dados de placares inválidos para atualização (não é um array).',
        { tournamentId, body: req.body, requestId: req.id }
      );
      return res.status(400).json({
        success: false,
        message: 'Formato de dados de placares inválido. Esperado um array.',
      });
    }

    try {
      for (const score of scoresData) {
        if (
          score &&
          typeof score.player1_score !== 'undefined' &&
          typeof score.player2_score !== 'undefined'
        ) {
          const newScore = await scoreModel.addScore({
            tournament_id: tournamentId,
            match_id: score.match_id,
            player1_id: score.player1_id,
            player2_id: score.player2_id,
            player1_score: score.player1_score,
            player2_score: score.player2_score,
            winner_id: score.winner_id,
            round: score.round,
          });
          addedScores.push(newScore);
        } else {
          validationErrors.push({
            score,
            error: 'Dados do placar incompletos ou inválidos.',
          });
        }
      }

      logger.info(
        'TournamentsRoute',
        `Histórico de placares para ${tournamentId} atualizado. Processados: ${addedScores.length}. Erros de Validação: ${validationErrors.length}`,
        {
          tournamentId,
          addedCount: addedScores.length,
          errors: validationErrors,
          requestId: req.id,
        }
      );
      res.json({
        success: true,
        message: `Histórico de placares atualizado! ${addedScores.length} placares processados.`,
      });
    } catch (error) {
      logger.error(
        'TournamentsRoute',
        `Erro ao atualizar placares para ${tournamentId} (DB):`,
        { error, tournamentId, requestId: req.id, body: req.body }
      );
      res
        .status(500)
        .json({ success: false, message: 'Erro ao atualizar placares (DB).' });
    }
  }
);

router.post(
  '/:tournamentId/generate-bracket',
  authMiddleware,
  async (req, res) => {
    const { tournamentId } = req.params;
    try {
      const tournament = await tournamentModel.getTournamentById(tournamentId);
      if (!tournament) {
        return res
          .status(404)
          .json({ success: false, message: 'Torneio não encontrado.' });
      }
      logger.info(
        'TournamentsRoute',
        `Chaveamento gerado e salvo para torneio ${tournamentId}.`,
        { tournamentId, requestId: req.id }
      );
      res.json({
        success: true,
        message: 'Chaveamento gerado e salvo no banco de dados!',
      });
    } catch (error) {
      logger.error(
        'TournamentsRoute',
        `Erro ao gerar chaveamento para ${tournamentId} (DB):`,
        { error, tournamentId, requestId: req.id }
      );
      if (error.message.includes('não implementada')) {
        res.status(501).json({ success: false, message: error.message });
      } else {
        res
          .status(500)
          .json({ success: false, message: 'Erro ao gerar chaveamento (DB).' });
      }
    }
  }
);

router.post('/:tournamentId/reset', authMiddleware, async (req, res) => {
  const { tournamentId } = req.params;
  try {
    const tournament = await tournamentModel.getTournamentById(tournamentId);
    if (!tournament) {
      return res
        .status(404)
        .json({ success: false, message: 'Torneio não encontrado.' });
    }
    const initialTournamentState = {
      tournamentName: tournament.name,
      description: tournament.description,
      num_players_expected: tournament.num_players_expected,
      bracket_type: tournament.bracket_type,
      currentRound: null,
      matches: {},
    };
    await tournamentModel.updateTournamentState(
      tournamentId,
      JSON.stringify(initialTournamentState)
    );
    await tournamentModel.updateTournamentStatus(tournamentId, 'Pendente');
    logger.info('TournamentsRoute', `Torneio ${tournamentId} resetado.`, {
      tournamentId,
      requestId: req.id,
    });
    res.json({
      success: true,
      message: 'Torneio resetado (estado e status atualizados no DB).',
      newState: initialTournamentState,
    });
  } catch (error) {
    logger.error(
      'TournamentsRoute',
      `Erro ao resetar torneio ${tournamentId} (DB):`,
      { error, tournamentId, requestId: req.id }
    );
    res
      .status(500)
      .json({ success: false, message: 'Erro ao resetar torneio (DB).' });
  }
});

router.patch('/:tournamentId/name', authMiddleware, async (req, res) => {
  const { tournamentId } = req.params;
  const { name } = req.body;

  if (!isValidTournamentId(tournamentId)) {
    return res
      .status(400)
      .json({ success: false, message: 'ID de torneio inválido.' });
  }
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res
      .status(400)
      .json({ success: false, message: 'Novo nome do torneio é obrigatório.' });
  }

  const sanitizedName = name.trim();

  try {
    let updatedTournament = await tournamentModel.updateTournament(
      tournamentId,
      { name: sanitizedName }
    );

    if (!updatedTournament) {
      return res
        .status(404)
        .json({ success: false, message: 'Torneio não encontrado.' });
    }

    if (updatedTournament.state_json) {
      try {
        const state = JSON.parse(updatedTournament.state_json);
        state.tournamentName = sanitizedName;
        await tournamentModel.updateTournamentState(
          tournamentId,
          JSON.stringify(state)
        );
        const reloadedTournament =
          await tournamentModel.getTournamentById(tournamentId);
        if (reloadedTournament) {
          updatedTournament.state_json = reloadedTournament.state_json;
        }
      } catch (parseError) {
        logger.warn(
          'TournamentsRoute',
          `Erro ao fazer parse ou atualizar state_json para nome do torneio ${tournamentId}: ${parseError.message}`,
          { tournamentId, error: parseError, requestId: req.id }
        );
      }
    }

    logger.info(
      'TournamentsRoute',
      `Nome do torneio ${tournamentId} atualizado para "${sanitizedName}".`,
      { tournamentId, newName: sanitizedName, requestId: req.id }
    );
    res.json({
      success: true,
      message: 'Nome do torneio atualizado com sucesso no banco de dados!',
      tournament: updatedTournament,
    });
  } catch (error) {
    logger.error(
      'TournamentsRoute',
      `Erro ao atualizar nome para o torneio ${tournamentId} no banco de dados:`,
      { error, tournamentId, newName: sanitizedName, requestId: req.id }
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar nome do torneio no banco de dados.',
    });
  }
});

router.patch('/:tournamentId/description', authMiddleware, async (req, res) => {
  const { tournamentId } = req.params;
  const { description } = req.body;

  if (!isValidTournamentId(tournamentId)) {
    return res
      .status(400)
      .json({ success: false, message: 'ID de torneio inválido.' });
  }
  if (typeof description !== 'string') {
    return res
      .status(400)
      .json({ success: false, message: 'Descrição inválida.' });
  }

  const sanitizedDescription = description.trim();

  try {
    let updatedTournament = await tournamentModel.updateTournament(
      tournamentId,
      { description: sanitizedDescription }
    );

    if (!updatedTournament) {
      return res
        .status(404)
        .json({ success: false, message: 'Torneio não encontrado.' });
    }

    if (updatedTournament.state_json) {
      try {
        const state = JSON.parse(updatedTournament.state_json);
        state.description = sanitizedDescription;
        await tournamentModel.updateTournamentState(
          tournamentId,
          JSON.stringify(state)
        );
        const reloadedTournament =
          await tournamentModel.getTournamentById(tournamentId);
        if (reloadedTournament) {
          updatedTournament.state_json = reloadedTournament.state_json;
        }
      } catch (parseError) {
        logger.warn(
          'TournamentsRoute',
          `Erro ao fazer parse ou atualizar state_json para descrição do torneio ${tournamentId}: ${parseError.message}`,
          { tournamentId, error: parseError, requestId: req.id }
        );
      }
    }

    logger.info(
      'TournamentsRoute',
      `Descrição do torneio ${tournamentId} atualizada.`,
      { tournamentId, requestId: req.id }
    );
    res.json({
      success: true,
      message: 'Descrição do torneio atualizada com sucesso no banco de dados!',
      tournament: updatedTournament,
    });
  } catch (error) {
    logger.error(
      'TournamentsRoute',
      `Erro ao atualizar descrição para o torneio ${tournamentId} no banco de dados:`,
      { error, tournamentId, requestId: req.id }
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar descrição do torneio no banco de dados.',
    });
  }
});

router.patch('/:tournamentId/entry_fee', authMiddleware, async (req, res) => {
  const { tournamentId } = req.params;
  const { entry_fee } = req.body;

  if (!isValidTournamentId(tournamentId)) {
    return res
      .status(400)
      .json({ success: false, message: 'ID de torneio inválido.' });
  }

  let parsedFee = null;
  if (entry_fee !== undefined && entry_fee !== null && entry_fee !== '') {
    parsedFee = parseFloat(entry_fee);
    if (isNaN(parsedFee)) {
      return res.status(400).json({
        success: false,
        message:
          'Taxa de entrada (entry_fee) fornecida não é um número válido.',
      });
    }
    if (parsedFee < 0) {
      return res.status(400).json({
        success: false,
        message: 'Taxa de entrada (entry_fee) não pode ser negativa.',
      });
    }
  }

  try {
    const updatedTournament = await tournamentModel.updateTournament(
      tournamentId,
      { entry_fee: parsedFee }
    );

    if (!updatedTournament) {
      return res
        .status(404)
        .json({ success: false, message: 'Torneio não encontrado.' });
    }

    logger.info(
      'TournamentsRoute',
      `Taxa de entrada do torneio ${tournamentId} atualizada para ${parsedFee}.`,
      { tournamentId, newFee: parsedFee, requestId: req.id }
    );
    res.json({
      success: true,
      message: 'Taxa de entrada do torneio atualizada com sucesso!',
      tournament: updatedTournament,
    });
  } catch (error) {
    logger.error(
      'TournamentsRoute',
      `Erro ao atualizar taxa de entrada para o torneio ${tournamentId}:`,
      { error, tournamentId, newFee: parsedFee, requestId: req.id }
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar taxa de entrada do torneio.',
    });
  }
});

router.patch('/:tournamentId/prize_pool', authMiddleware, async (req, res) => {
  const { tournamentId } = req.params;
  const { prize_pool } = req.body;

  if (!isValidTournamentId(tournamentId)) {
    return res
      .status(400)
      .json({ success: false, message: 'ID de torneio inválido.' });
  }
  if (typeof prize_pool !== 'string') {
    return res
      .status(400)
      .json({ success: false, message: 'Dados de premiação inválidos.' });
  }

  const sanitizedPrizePool = prize_pool.trim();

  try {
    const updatedTournament = await tournamentModel.updateTournament(
      tournamentId,
      { prize_pool: sanitizedPrizePool }
    );

    if (!updatedTournament) {
      return res
        .status(404)
        .json({ success: false, message: 'Torneio não encontrado.' });
    }

    logger.info(
      'TournamentsRoute',
      `Premiação do torneio ${tournamentId} atualizada.`,
      { tournamentId, requestId: req.id }
    );
    res.json({
      success: true,
      message: 'Premiação do torneio atualizada com sucesso!',
      tournament: updatedTournament,
    });
  } catch (error) {
    logger.error(
      'TournamentsRoute',
      `Erro ao atualizar premiação para o torneio ${tournamentId}:`,
      { error, tournamentId, requestId: req.id }
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar premiação do torneio.',
    });
  }
});

router.patch('/:tournamentId/rules', authMiddleware, async (req, res) => {
  const { tournamentId } = req.params;
  const { rules } = req.body;

  if (!isValidTournamentId(tournamentId)) {
    return res
      .status(400)
      .json({ success: false, message: 'ID de torneio inválido.' });
  }
  if (typeof rules !== 'string') {
    return res
      .status(400)
      .json({ success: false, message: 'Dados de regras inválidos.' });
  }

  const sanitizedRules = rules.trim();

  try {
    const updatedTournament = await tournamentModel.updateTournament(
      tournamentId,
      { rules: sanitizedRules }
    );

    if (!updatedTournament) {
      return res
        .status(404)
        .json({ success: false, message: 'Torneio não encontrado.' });
    }

    logger.info(
      'TournamentsRoute',
      `Regras do torneio ${tournamentId} atualizadas.`,
      { tournamentId, requestId: req.id }
    );
    res.json({
      success: true,
      message: 'Regras do torneio atualizadas com sucesso!',
      tournament: updatedTournament,
    });
  } catch (error) {
    logger.error(
      'TournamentsRoute',
      `Erro ao atualizar regras para o torneio ${tournamentId}:`,
      { error, tournamentId, requestId: req.id }
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar regras do torneio.',
    });
  }
});

router.patch('/:tournamentId/status', authMiddleware, async (req, res) => {
  const { tournamentId } = req.params;
  const { status } = req.body;

  if (!isValidTournamentId(tournamentId)) {
    return res
      .status(400)
      .json({ success: false, message: 'ID de torneio inválido.' });
  }
  if (!status || typeof status !== 'string') {
    return res
      .status(400)
      .json({ success: false, message: 'Novo status é obrigatório.' });
  }

  try {
    const updatedTournament = await tournamentModel.updateTournamentStatus(
      tournamentId,
      status
    );

    if (!updatedTournament) {
      return res.status(404).json({
        success: false,
        message: 'Torneio não encontrado ou status não alterado.',
      });
    }

    logger.info(
      'TournamentsRoute',
      `Status do torneio ${tournamentId} atualizado para "${status}".`,
      { tournamentId, newStatus: status, requestId: req.id }
    );
    res.json({
      success: true,
      message: 'Status do torneio atualizado com sucesso no banco de dados!',
      tournament: updatedTournament,
    });
  } catch (error) {
    logger.error(
      'TournamentsRoute',
      `Erro ao atualizar status para o torneio ${tournamentId} no banco de dados:`,
      { error, tournamentId, newStatus: status, requestId: req.id }
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status do torneio no banco de dados.',
    });
  }
});

router.patch(
  '/:tournamentId/matches/:matchId/schedule',
  authMiddleware,
  async (req, res) => {
    const { tournamentId, matchId: routeMatchId } = req.params;
    const { schedule } = req.body;

    if (!isValidTournamentId(tournamentId)) {
      return res
        .status(400)
        .json({ success: false, message: 'ID de torneio inválido.' });
    }
    if (!routeMatchId) {
      return res.status(400).json({
        success: false,
        message: 'ID/Chave da partida não fornecido.',
      });
    }
    const validDateTime = schedule;

    try {
      const tournament = await tournamentModel.getTournamentById(tournamentId);
      if (!tournament) {
        return res
          .status(404)
          .json({ success: false, message: 'Torneio não encontrado.' });
      }

      let state = tournament.state_json
        ? JSON.parse(tournament.state_json)
        : { matches: {} };

      if (state.matches && state.matches[routeMatchId]) {
        state.matches[routeMatchId].schedule = validDateTime;
        await tournamentModel.updateTournamentState(
          tournamentId,
          JSON.stringify(state)
        );
        logger.info(
          'TournamentsRoute',
          `Agendamento da partida ${routeMatchId} do torneio ${tournamentId} atualizado para ${validDateTime}.`,
          {
            tournamentId,
            matchNumber: routeMatchId,
            newDateTime: validDateTime,
            requestId: req.id,
          }
        );
        res.json({
          success: true,
          message: 'Agendamento da partida atualizado (no state_json).',
          newState: state,
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'Partida não encontrada no estado do torneio.',
        });
      }
    } catch (error) {
      logger.error(
        'TournamentsRoute',
        `Erro ao atualizar agendamento para partida ${routeMatchId} do torneio ${tournamentId} (DB):`,
        { error, tournamentId, matchNumber: routeMatchId, requestId: req.id }
      );
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar agendamento da partida (DB).',
      });
    }
  }
);

router.patch(
  '/:tournamentId/matches/:matchId/winner',
  authMiddleware,
  async (req, res) => {
    const { tournamentId, matchId: routeMatchId } = req.params;
    const { winnerId, player1Score, player2Score } = req.body;

    if (!isValidTournamentId(tournamentId)) {
      return res
        .status(400)
        .json({ success: false, message: 'ID de torneio inválido.' });
    }
    if (!routeMatchId) {
      return res.status(400).json({
        success: false,
        message: 'ID/Chave da partida não fornecido.',
      });
    }

    const p1Score =
      player1Score !== undefined ? parseInt(player1Score, 10) : null;
    const p2Score =
      player2Score !== undefined ? parseInt(player2Score, 10) : null;

    if ((p1Score === null || p2Score === null) && winnerId === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Placar ou vencedor deve ser fornecido.',
      });
    }

    try {
      const tournament = await tournamentModel.getTournamentById(tournamentId);
      if (!tournament) {
        return res
          .status(404)
          .json({ success: false, message: 'Torneio não encontrado.' });
      }
      let state = tournament.state_json
        ? JSON.parse(tournament.state_json)
        : { matches: {} };

      if (state.matches && state.matches[routeMatchId]) {
        state.matches[routeMatchId].score = [p1Score, p2Score];
        let winnerPlayerIndex = null;
        if (winnerId !== null && winnerId !== undefined) {
          const matchPlayers = state.matches[routeMatchId].players;
          if (
            matchPlayers &&
            matchPlayers[0] &&
            matchPlayers[0].db_id === winnerId
          ) {
            winnerPlayerIndex = 0;
          } else if (
            matchPlayers &&
            matchPlayers[1] &&
            matchPlayers[1].db_id === winnerId
          ) {
            winnerPlayerIndex = 1;
          }
        }
        state.matches[routeMatchId].winner = winnerPlayerIndex;

        await tournamentModel.updateTournamentState(
          tournamentId,
          JSON.stringify(state)
        );

        logger.info(
          'TournamentsRoute',
          `Vencedor/placar da partida ${routeMatchId} do torneio ${tournamentId} atualizado. Chaveamento atualizado.`,
          {
            tournamentId,
            matchNumber: routeMatchId,
            winnerId,
            winnerPlayerIndex,
            requestId: req.id,
          }
        );
        res.json({
          success: true,
          message: 'Vencedor/placar da partida atualizado com sucesso.',
          newState: state,
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'Partida não encontrada no estado do torneio.',
        });
      }
    } catch (error) {
      logger.error(
        'TournamentsRoute',
        `Erro ao atualizar vencedor/placar para partida ${routeMatchId} do torneio ${tournamentId} (DB):`,
        { error, tournamentId, matchNumber: routeMatchId, requestId: req.id }
      );
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar vencedor/placar da partida (DB).',
      });
    }
  }
);

const {
  calculateTopPlayersDb,
  calculateCommonScoresDb,
  calculatePlayerPerformanceDb,
  calculatePlayerStatsDb,
} = require('../lib/services/statsService');
const matchModel = require('../lib/models/matchModel');

router.get('/:tournamentId/stats', authMiddleware, async (req, res) => {
  const { tournamentId } = req.params;
  const reqId = req.id;

  if (!isValidTournamentId(tournamentId)) {
    logger.warn(
      { reqId, tournamentId, path: req.originalUrl },
      'Tentativa de acesso com ID de torneio inválido para estatísticas.'
    );
    return res.status(400).json({
      success: false,
      message: 'ID de torneio inválido',
    });
  }

  try {
    const tournament = await tournamentModel.getTournamentById(tournamentId);
    if (!tournament) {
      logger.warn(
        { reqId, tournamentId, path: req.originalUrl },
        'Torneio não encontrado para estatísticas.'
      );
      return res
        .status(404)
        .json({ success: false, message: 'Torneio não encontrado' });
    }

    const playersResult = await playerModel.getPlayersByTournamentId(
      tournamentId,
      { limit: -1 }
    );
    const players = playersResult.players;

    const scoresResult = await scoreModel.getScoresByTournamentId(
      tournamentId,
      { limit: -1 }
    );
    const scores = scoresResult.scores;

    const matchesResult = await matchModel.getMatchesByTournamentId(
      tournamentId,
      { limit: -1 }
    );
    const matches = matchesResult.matches;

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
      { reqId, tournamentId, path: req.originalUrl },
      `Estatísticas do torneio ${tournamentId} recuperadas com sucesso`
    );
    res.json({ success: true, stats });
  } catch (error) {
    logger.error(
      { reqId, tournamentId, err: error, path: req.originalUrl },
      `Erro ao buscar estatísticas do torneio ${tournamentId} (DB)`
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao calcular estatísticas do torneio',
    });
  }
});

router.get(
  '/:tournamentId/players/:playerName/stats',
  authMiddleware,
  async (req, res) => {
    const { tournamentId, playerName: routePlayerName } = req.params;
    const playerName = decodeURIComponent(routePlayerName);
    const reqId = req.id;

    if (!isValidTournamentId(tournamentId) || !playerName) {
      logger.warn(
        { reqId, tournamentId, playerName, path: req.originalUrl },
        'Tentativa de acesso com ID de torneio ou nome de jogador ausente para estatísticas.'
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
          { reqId, tournamentId, playerName, path: req.originalUrl },
          'Jogador não encontrado no torneio para estatísticas.'
        );
        return res.status(404).json({
          success: false,
          message: 'Jogador não encontrado neste torneio',
        });
      }

      const scoresResult = await scoreModel.getScoresByTournamentId(
        tournamentId,
        { limit: -1, includeDeleted: false }
      );
      const allScoresInTournament = scoresResult.scores;

      const playerScores = allScoresInTournament.filter((score) => {
        return score.player1_id === player.id || score.player2_id === player.id;
      });

      const playerStats = calculatePlayerStatsDb(
        playerName,
        player,
        playerScores
      );

      logger.info(
        { reqId, tournamentId, playerName, path: req.originalUrl },
        `Estatísticas do jogador ${playerName} no torneio ${tournamentId} recuperadas com sucesso`
      );
      res.json({
        success: true,
        player: {
          id: player.id,
          name: player.name,
          nickname: player.nickname || '',
          gender: player.gender,
          skill_level: player.skill_level,
          gamesPlayed: playerStats.gamesPlayed,
          wins: playerStats.wins,
          losses: playerStats.losses,
        },
        stats: {
          matchHistory: playerStats.matches,
          winRate: playerStats.winRate,
          averageScoreDifference: playerStats.averageScoreDifference,
          opponentStats: playerStats.opponentStats,
        },
      });
    } catch (error) {
      logger.error(
        { reqId, tournamentId, playerName, err: error, path: req.originalUrl },
        `Erro ao buscar estatísticas do jogador ${playerName} (DB)`
      );
      res.status(500).json({
        success: false,
        message: 'Erro ao calcular estatísticas do jogador',
      });
    }
  }
);

module.exports = router;
