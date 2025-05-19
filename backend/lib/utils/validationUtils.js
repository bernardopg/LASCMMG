const Joi = require('joi'); // This will be added as a dependency
const { logger } = require('../logger/logger');

// Middleware factory for Joi validation
const validateRequest = (schema) => {
  return (req, res, next) => {
    const options = {
      abortEarly: false, // Report all errors, not just the first
      allowUnknown: true, // Allow properties not defined in the schema
      stripUnknown: true, // Remove unknown properties from the validated object
    };

    // Validate body, params, and query
    // Note: Joi schemas should be structured to expect { body: ..., params: ..., query: ... }
    // or we can validate them separately. For simplicity here, we'll assume
    // the schema passed is for req.body, req.params, or req.query directly
    // or a combined schema. A more robust approach might involve separate schemas.

    let validationTarget = {};
    if (schema.body) {
      const { error: bodyError, value: bodyValue } = schema.body.validate(req.body, options);
      if (bodyError) {
        return res.status(400).json({
          success: false,
          message: 'Erro de validação no corpo da requisição.',
          details: bodyError.details.map(d => ({ message: d.message, path: d.path })),
        });
      }
      req.body = bodyValue; // Use validated and potentially stripped/coerced value
    }

    if (schema.params) {
      const { error: paramsError, value: paramsValue } = schema.params.validate(req.params, options);
      if (paramsError) {
        return res.status(400).json({
          success: false,
          message: 'Erro de validação nos parâmetros da URL.',
          details: paramsError.details.map(d => ({ message: d.message, path: d.path })),
        });
      }
      req.params = paramsValue;
    }

    if (schema.query) {
      const { error: queryError, value: queryValue } = schema.query.validate(req.query, options);
      if (queryError) {
        return res.status(400).json({
          success: false,
          message: 'Erro de validação nos parâmetros da query string.',
          details: queryError.details.map(d => ({ message: d.message, path: d.path })),
        });
      }
      req.query = queryValue;
    }

    next();
  };
};


// --- Existing ID Validators (can be kept or replaced by Joi schemas) ---

function isValidTournamentId(id) {
  if (!id || typeof id !== 'string') return false;
  if (id.includes('..') || id.includes('/') || id.length > 255) {
    logger.warn(
      'ValidationUtils',
      'Tentativa de usar ID de torneio potencialmente malicioso ou inválido.',
      { id }
    );
    return false;
  }
  // Example: Tournament ID might be a slug or UUID
  // This basic check is okay, but Joi schema for params would be more robust.
  return true;
}

function isValidPlayerId(id) {
  const numId = parseInt(id, 10);
  return Number.isInteger(numId) && numId > 0;
}

function isValidScoreId(id) {
  const numId = parseInt(id, 10);
  return Number.isInteger(numId) && numId > 0;
}

// --- Joi Schemas (Examples - to be moved to a dedicated schemas file or per route/module) ---

// Example schema for Admin Login (used in routes/auth.js)
const adminLoginSchema = {
  body: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required().messages({
      'string.base': `"username" deve ser do tipo texto`,
      'string.empty': `"username" não pode estar vazio`,
      'string.min': `"username" deve ter no mínimo {#limit} caracteres`,
      'string.max': `"username" deve ter no máximo {#limit} caracteres`,
      'any.required': `"username" é um campo obrigatório`,
    }),
    // In a real scenario, password might have more complex rules (uppercase, number, special char)
    password: Joi.string().min(6).required().messages({
      'string.base': `"password" deve ser do tipo texto`,
      'string.empty': `"password" não pode estar vazio`,
      'string.min': `"password" deve ter no mínimo {#limit} caracteres`,
      'any.required': `"password" é um campo obrigatório`,
    }),
  })
};

// Schema for Change Password (used in routes/auth.js)
const changePasswordSchema = {
  body: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required().messages({
      'string.base': `"username" deve ser do tipo texto`,
      'string.empty': `"username" não pode estar vazio`,
      'string.min': `"username" deve ter no mínimo {#limit} caracteres`,
      'string.max': `"username" deve ter no máximo {#limit} caracteres`,
      'any.required': `"username" é um campo obrigatório`,
    }),
    currentPassword: Joi.string().min(6).required().messages({
      'string.base': `"currentPassword" deve ser do tipo texto`,
      'string.empty': `"currentPassword" não pode estar vazio`,
      'string.min': `"currentPassword" deve ter no mínimo {#limit} caracteres`,
      'any.required': `"currentPassword" é um campo obrigatório`,
    }),
    newPassword: Joi.string().min(6).required()
      // Example of a more complex password rule:
      // .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])(?=.{8,})'))
      .messages({
        'string.base': `"newPassword" deve ser do tipo texto`,
        'string.empty': `"newPassword" não pode estar vazio`,
        'string.min': `"newPassword" deve ter no mínimo {#limit} caracteres`,
        // 'string.pattern.base': `"newPassword" deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial.`,
        'any.required': `"newPassword" é um campo obrigatório`,
    }),
  })
};

// Example schema for Tournament ID in params
const tournamentIdParamSchema = {
  params: Joi.object({
    tournamentId: Joi.string().trim().min(1).max(255).required().pattern(new RegExp('^[a-zA-Z0-9-]+$')).messages({ // Example: slug-like IDs
      'string.pattern.base': `"tournamentId" contém caracteres inválidos. Use apenas letras, números e hífens.`,
      'any.required': `"tournamentId" é obrigatório nos parâmetros da URL.`,
    })
  })
};

// --- Schemas for Admin Routes (routes/admin.js) ---
const optionalPlayerIdSchema = {
  params: Joi.object({
    playerId: Joi.number().integer().positive().optional().messages({ // Optional for POST, required for PUT/DELETE
      'number.base': `"playerId" deve ser um número.`,
      'number.integer': `"playerId" deve ser um inteiro.`,
      'number.positive': `"playerId" deve ser um número positivo.`,
    })
  })
};

const playerSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required().messages({
      'string.empty': 'Nome do jogador é obrigatório.',
      'string.min': 'Nome do jogador deve ter no mínimo 2 caracteres.',
      'string.max': 'Nome do jogador deve ter no máximo 100 caracteres.',
      'any.required': 'Nome do jogador é obrigatório.',
    }),
    nickname: Joi.string().trim().max(50).allow(null, '').messages({
      'string.max': 'Apelido deve ter no máximo 50 caracteres.',
    }),
    gender: Joi.string().trim().valid('Masculino', 'Feminino', 'Outro').allow(null, '').messages({
      'any.only': 'Gênero inválido. Valores permitidos: Masculino, Feminino, Outro.',
    }),
    level: Joi.string().trim().valid('Iniciante', 'Intermediário', 'Avançado', 'Profissional').allow(null, '').messages({ // Assuming 'level' is used instead of 'skill_level' based on AdminPlayersTable
      'any.only': 'Nível inválido. Valores permitidos: Iniciante, Intermediário, Avançado, Profissional.',
    }),
    // For updates, other fields like games_played, wins, losses might be included
    games_played: Joi.number().integer().min(0).optional(),
    wins: Joi.number().integer().min(0).optional(),
    losses: Joi.number().integer().min(0).optional(),
  })
};

const scoreIdParamSchema = {
  params: Joi.object({
    scoreId: Joi.number().integer().positive().required().messages({
      'number.base': `"scoreId" deve ser um número.`,
      'number.integer': `"scoreId" deve ser um inteiro.`,
      'number.positive': `"scoreId" deve ser um número positivo.`,
      'any.required': `"scoreId" é obrigatório.`,
    })
  })
};

const scoreUpdateSchema = {
  body: Joi.object({
    score1: Joi.number().integer().min(0).required().messages({ // Renamed from player1_score to match AdminScoresTable modal
      'number.base': 'Placar do Jogador 1 deve ser um número.',
      'number.min': 'Placar do Jogador 1 não pode ser negativo.',
      'any.required': 'Placar do Jogador 1 é obrigatório.',
    }),
    score2: Joi.number().integer().min(0).required().messages({ // Renamed from player2_score
      'number.base': 'Placar do Jogador 2 deve ser um número.',
      'number.min': 'Placar do Jogador 2 não pode ser negativo.',
      'any.required': 'Placar do Jogador 2 é obrigatório.',
    }),
    round: Joi.string().trim().min(1).max(50).required().messages({
      'string.empty': 'Rodada é obrigatória.',
      'string.min': 'Rodada deve ter no mínimo 1 caractere.',
      'string.max': 'Rodada deve ter no máximo 50 caracteres.',
      'any.required': 'Rodada é obrigatória.',
    }),
    // winner_id might be part of score update, but it's often derived or handled separately
    winner_id: Joi.number().integer().positive().allow(null).optional(),
  })
};

const trashItemSchema = {
  body: Joi.object({
    itemId: Joi.alternatives().try(Joi.string(), Joi.number()).required().messages({
      'any.required': 'ID do item é obrigatório.',
    }),
    itemType: Joi.string().valid('player', 'score', 'tournament').required().messages({
      'any.only': 'Tipo de item inválido. Permitidos: player, score, tournament.',
      'any.required': 'Tipo de item é obrigatório.',
    }),
  })
};


// --- Schemas for Scores Routes (routes/scores.js) ---
const newScoreSchema = {
  body: Joi.object({
    tournamentId: Joi.string().trim().min(1).max(255).required().messages({ // Assuming tournamentId is passed in body for this route
        'string.empty': 'ID do torneio é obrigatório.',
        'any.required': 'ID do torneio é obrigatório.',
    }),
    matchId: Joi.number().integer().positive().required().messages({
        'any.required': 'ID da partida é obrigatório.',
    }),
    player1Score: Joi.number().integer().min(0).required().messages({
        'any.required': 'Placar do Jogador 1 é obrigatório.',
    }),
    player2Score: Joi.number().integer().min(0).required().messages({
        'any.required': 'Placar do Jogador 2 é obrigatório.',
    }),
    winnerId: Joi.number().integer().positive().allow(null).optional(),
    stateMatchKey: Joi.alternatives().try(Joi.string(), Joi.number()).required().messages({ // Key for bracket state update
        'any.required': 'Chave da partida (stateMatchKey) é obrigatória.',
    }),
  })
};

const bulkScoreItemSchema = Joi.object({
  match_id: Joi.number().integer().positive().required(),
  player1_id: Joi.number().integer().positive().allow(null).optional(), // Assuming IDs might not always be present if names are used
  player2_id: Joi.number().integer().positive().allow(null).optional(),
  player1_score: Joi.number().integer().min(0).required(),
  player2_score: Joi.number().integer().min(0).required(),
  winner_id: Joi.number().integer().positive().allow(null).optional(),
  round: Joi.string().trim().min(1).max(50).optional().allow(null, ''), // Round might be optional for bulk update
});

const updateScoresSchema = { // For POST /:tournamentId/scores/update
  body: Joi.object({
    scores: Joi.array().items(bulkScoreItemSchema).min(1).required().messages({
      'array.base': 'O campo "scores" deve ser um array.',
      'array.min': 'O array "scores" deve conter pelo menos um item.',
      'any.required': 'O campo "scores" é obrigatório.',
    })
  })
};

// --- Schemas for Tournaments Routes (routes/tournaments.js) ---
// Tournament ID param schema is already defined as tournamentIdParamSchema

const createTournamentSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(3).max(100).required().messages({
      'string.empty': 'Nome do torneio é obrigatório.',
      'string.min': 'Nome do torneio deve ter no mínimo 3 caracteres.',
      'string.max': 'Nome do torneio deve ter no máximo 100 caracteres.',
      'any.required': 'Nome do torneio é obrigatório.',
    }),
    date: Joi.date().iso().required().messages({
      'date.base': 'Data do torneio deve ser uma data válida.',
      'date.format': 'Data do torneio deve estar no formato ISO (YYYY-MM-DD).',
      'any.required': 'Data do torneio é obrigatória.',
    }),
    description: Joi.string().trim().max(1000).allow(null, '').messages({
      'string.max': 'Descrição deve ter no máximo 1000 caracteres.',
    }),
    numPlayersExpected: Joi.number().integer().min(2).optional().allow(null).messages({ // Renamed from num_players_expected to match frontend
      'number.min': 'Número esperado de jogadores deve ser no mínimo 2.',
    }),
    bracket_type: Joi.string().valid('single-elimination', 'double-elimination', 'round-robin').default('single-elimination'),
    entry_fee: Joi.number().min(0).optional().allow(null),
    prize_pool: Joi.string().trim().max(255).allow(null, ''),
    rules: Joi.string().trim().max(2000).allow(null, ''),
    // playersFile is handled by multer, not Joi for body validation here
  })
};

const updateTournamentSchema = { // For PATCH routes, all fields are optional
  body: Joi.object({
    name: Joi.string().trim().min(3).max(100).optional(),
    date: Joi.date().iso().optional(),
    description: Joi.string().trim().max(1000).allow(null, '').optional(),
    num_players_expected: Joi.number().integer().min(2).optional().allow(null),
    bracket_type: Joi.string().valid('single-elimination', 'double-elimination', 'round-robin').optional(),
    status: Joi.string().valid('Pendente', 'Em Andamento', 'Concluído', 'Cancelado').optional(),
    entry_fee: Joi.number().min(0).optional().allow(null),
    prize_pool: Joi.string().trim().max(255).allow(null, '').optional(),
    rules: Joi.string().trim().max(2000).allow(null, '').optional(),
  }).min(1) // Require at least one field to be updated
  .messages({
    'object.min': 'Pelo menos um campo deve ser fornecido para atualização.'
  })
};

const tournamentStateSchema = {
  body: Joi.object({
    state: Joi.object({
      matches: Joi.object().required(), // Basic check, can be more detailed
      // other state properties...
    }).required().messages({
      'any.required': 'Objeto de estado é obrigatório.',
      'object.base': 'Estado deve ser um objeto.',
    })
  })
};

const addPlayerToTournamentSchema = { // For POST /:tournamentId/players
  body: Joi.object({
    PlayerName: Joi.string().trim().min(2).max(100).required().messages({ // Matches frontend key
      'string.empty': 'Nome do jogador é obrigatório.',
      'any.required': 'Nome do jogador é obrigatório.',
    }),
    Nickname: Joi.string().trim().max(50).allow(null, ''),
    gender: Joi.string().trim().valid('Masculino', 'Feminino', 'Outro').allow(null, ''),
    skill_level: Joi.string().trim().valid('Iniciante', 'Intermediário', 'Avançado', 'Profissional').allow(null, ''),
  })
};

const updatePlayersInTournamentSchema = { // For POST /:tournamentId/players/update
  body: Joi.object({
    players: Joi.array().items(Joi.object({
      PlayerName: Joi.string().trim().min(2).max(100).required(), // Matches frontend key
      Nickname: Joi.string().trim().max(50).allow(null, ''),
      gender: Joi.string().trim().valid('Masculino', 'Feminino', 'Outro').allow(null, ''),
      skill_level: Joi.string().trim().valid('Iniciante', 'Intermediário', 'Avançado', 'Profissional').allow(null, ''),
    })).min(0).required().messages({ // Allow empty array to clear players
      'array.base': 'Lista de jogadores deve ser um array.',
      'any.required': 'Lista de jogadores é obrigatória.',
    })
  })
};

const updateMatchScheduleSchema = { // For PATCH /:tournamentId/matches/:matchId/schedule
  params: Joi.object({
    tournamentId: Joi.string().trim().required(),
    matchId: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  }),
  body: Joi.object({
    schedule: Joi.date().iso().required().messages({ // Assuming schedule is a full ISO datetime string
      'date.base': 'Agendamento deve ser uma data/hora válida.',
      'any.required': 'Agendamento é obrigatório.',
    })
  })
};

const updateMatchWinnerSchema = { // For PATCH /:tournamentId/matches/:matchId/winner
  params: Joi.object({
    tournamentId: Joi.string().trim().required(),
    matchId: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  }),
  body: Joi.object({
    winnerId: Joi.number().integer().positive().allow(null).optional(),
    player1Score: Joi.number().integer().min(0).allow(null).optional(),
    player2Score: Joi.number().integer().min(0).allow(null).optional(),
  }).or('winnerId', 'player1Score', 'player2Score') // At least one must be provided
  .messages({
    'object.missing': 'Pelo menos um campo (winnerId, player1Score, player2Score) deve ser fornecido.'
  })
};


// --- Schemas for Security Routes (routes/security.js) ---
const honeypotConfigSchema = {
  body: Joi.object({
    // Based on frontend SecurityHoneypots.jsx
    threshold: Joi.number().integer().min(1).max(100).optional(), // Renamed from detectionThreshold
    block_duration_hours: Joi.number().integer().min(1).max(720).optional(), // Renamed from blockDurationHours
    whitelist_ips: Joi.array().items(Joi.string().ip({ version: ['ipv4'] })).optional(), // Renamed from ipWhitelist
  }).min(1)
  .messages({
    'object.min': 'Pelo menos um campo de configuração deve ser fornecido.'
  })
};

const manualBlockIpSchema = {
  body: Joi.object({
    ipAddress: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).required().messages({ // Matches frontend key
      'string.ip': 'Endereço IP inválido.',
      'any.required': 'Endereço IP é obrigatório.',
    }),
    durationHours: Joi.number().integer().min(0).optional().allow(null), // 0 or null for permanent
    reason: Joi.string().trim().min(3).max(255).optional().allow(null, ''),
  })
};

const ipAddressParamSchema = {
  params: Joi.object({
    ipAddress: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).required()
  })
};


module.exports = {
  validateRequest,
  isValidTournamentId,
  isValidPlayerId,
  isValidScoreId,
  adminLoginSchema,
  changePasswordSchema,
  tournamentIdParamSchema,
  // Admin Schemas
  optionalPlayerIdSchema,
  playerSchema,
  scoreIdParamSchema,
  scoreUpdateSchema,
  trashItemSchema,
  // Scores Schemas
  newScoreSchema,
  // Tournaments Schemas
  createTournamentSchema,
  updateTournamentSchema,
  tournamentStateSchema,
  addPlayerToTournamentSchema,
  updatePlayersInTournamentSchema,
  updateMatchScheduleSchema,
  updateMatchWinnerSchema,
  // Security Schemas
  honeypotConfigSchema,
  manualBlockIpSchema,
  ipAddressParamSchema,
  updateScoresSchema, // Export new schema
};

// Schema for individual player item during bulk import (routes/tournaments.js)
const playerImportItemSchema = Joi.object({
  PlayerName: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Nome do jogador (PlayerName) é obrigatório para importação.',
    'any.required': 'Nome do jogador (PlayerName) é obrigatório para importação.',
  }),
  Nickname: Joi.string().trim().max(50).allow(null, ''),
  gender: Joi.string().trim().valid('Masculino', 'Feminino', 'Outro').allow(null, ''),
  skill_level: Joi.string().trim().valid('Iniciante', 'Intermediário', 'Avançado', 'Profissional').allow(null, ''),
  // Outros campos podem ser opcionais ou não presentes no import
});

module.exports = {
  validateRequest,
  isValidTournamentId,
  isValidPlayerId,
  isValidScoreId,
  adminLoginSchema,
  changePasswordSchema,
  tournamentIdParamSchema,
  // Admin Schemas
  optionalPlayerIdSchema,
  playerSchema,
  scoreIdParamSchema,
  scoreUpdateSchema,
  trashItemSchema,
  // Scores Schemas
  newScoreSchema,
  // Tournaments Schemas
  createTournamentSchema,
  updateTournamentSchema,
  tournamentStateSchema,
  addPlayerToTournamentSchema,
  updatePlayersInTournamentSchema,
  updateMatchScheduleSchema,
  updateMatchWinnerSchema,
  // Security Schemas
  honeypotConfigSchema,
  manualBlockIpSchema,
  ipAddressParamSchema,
  updateScoresSchema,
  playerImportItemSchema, // Export new schema
};
