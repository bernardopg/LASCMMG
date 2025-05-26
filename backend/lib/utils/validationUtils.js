const Joi = require('joi');
const { logger } = require('../logger/logger');

// Middleware factory for Joi validation
const validateRequest = (schema) => {
  return (req, res, next) => {
    const options = {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    };

    if (schema.body) {
      const { error: bodyError, value: bodyValue } = schema.body.validate(req.body, options);
      if (bodyError) {
        return res.status(400).json({
          success: false,
          message: 'Erro de validação no corpo da requisição.',
          details: bodyError.details.map((d) => ({
            message: d.message,
            path: d.path,
          })),
        });
      }
      req.body = bodyValue;
    }

    if (schema.params) {
      // Enable conversion for params to handle string->number conversion from URL params
      const paramsOptions = {
        ...options,
        convert: true,
      };
      const { error: paramsError, value: paramsValue } = schema.params.validate(
        req.params,
        paramsOptions
      );
      if (paramsError) {
        return res.status(400).json({
          success: false,
          message: 'Erro de validação nos parâmetros da URL.',
          details: paramsError.details.map((d) => ({
            message: d.message,
            path: d.path,
          })),
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
          details: queryError.details.map((d) => ({
            message: d.message,
            path: d.path,
          })),
        });
      }
      req.query = queryValue;
    }

    next();
  };
};

function isValidTournamentId(id) {
  if (!id || typeof id !== 'string') return false;
  if (id.includes('..') || id.includes('/') || id.length > 255) {
    logger.warn(
      { component: 'ValidationUtils', tournamentId: id },
      'Tentativa de usar ID de torneio potencialmente malicioso ou inválido.'
    );
    return false;
  }
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

// More robust password validation using Joi for consistency
const passwordSchema = Joi.string()
  .min(8) // Minimum 8 characters
  .pattern(new RegExp('^(?=.*[a-z])')) // Must contain a lowercase letter
  .pattern(new RegExp('^(?=.*[A-Z])')) // Must contain an uppercase letter
  .pattern(new RegExp('^(?=.*[0-9])')) // Must contain a digit
  .pattern(new RegExp('^(?=.*[!@#$%^&*])')) // Must contain a special character
  .required()
  .messages({
    'string.min': 'A senha deve ter no mínimo {#limit} caracteres.',
    'string.pattern.base':
      'A senha deve conter pelo menos uma letra minúscula, uma maiúscula, um número e um caractere especial (!@#$%^&*).',
    'string.empty': 'A senha não pode estar vazia.',
    'any.required': 'A senha é um campo obrigatório.',
  });

function validatePassword(password) {
  // This function was already updated in a previous step, ensure it's here
  const { error } = passwordSchema.validate(password);
  return !error; // Returns true if valid, false otherwise
}

const adminLoginSchema = {
  body: Joi.object({
    username: Joi.string().email().required().messages({
      'string.base': `"username" deve ser do tipo texto`,
      'string.empty': `"username" não pode estar vazio`,
      'string.email': `"username" deve ser um email válido`,
      'any.required': `"username" é um campo obrigatório`,
    }),
    password: passwordSchema, // Use the new robust password schema
    rememberMe: Joi.boolean().optional().default(false),
  }),
};

const changePasswordSchema = {
  body: Joi.object({
    username: Joi.string().email().required().messages({
      // Changed to email validation
      'string.base': `"username" deve ser do tipo texto`,
      'string.empty': `"username" não pode estar vazio`,
      'string.email': `"username" deve ser um email válido`,
      'any.required': `"username" é um campo obrigatório`,
    }),
    currentPassword: passwordSchema, // Use the new robust password schema for current password as well for consistency
    newPassword: passwordSchema, // Use the new robust password schema
  }),
};

const specificTournamentIdStringSchema = Joi.string()
  .trim()
  .min(1)
  .max(255)
  .required()
  .pattern(new RegExp('^[a-zA-Z0-9-]+$'))
  .messages({
    'string.pattern.base': `"tournamentId" contém caracteres inválidos. Use apenas letras, números e hífens.`,
    'any.required': `"tournamentId" é obrigatório nos parâmetros da URL.`,
  });

const tournamentIdParamSchema = {
  params: Joi.object({
    tournamentId: specificTournamentIdStringSchema,
  }),
};

const playerIdParamSchema = {
  // Define the missing schema
  params: Joi.object({
    playerId: Joi.number().integer().positive().required().messages({
      'number.base': `"playerId" deve ser um número.`,
      'number.integer': `"playerId" deve ser um inteiro.`,
      'number.positive': `"playerId" deve ser um número positivo.`,
      'any.required': `"playerId" é obrigatório.`,
    }),
  }),
};

const optionalPlayerIdSchema = {
  params: Joi.object({
    playerId: Joi.number().integer().positive().optional().messages({
      'number.base': `"playerId" deve ser um número.`,
      'number.integer': `"playerId" deve ser um inteiro.`,
      'number.positive': `"playerId" deve ser um número positivo.`,
    }),
  }),
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
    email: Joi.string().email().trim().max(100).allow(null, '').messages({
      'string.email': 'Email deve ser um endereço válido.',
      'string.max': 'Email deve ter no máximo 100 caracteres.',
    }),
    gender: Joi.string().trim().valid('Masculino', 'Feminino', 'Outro').allow(null, '').messages({
      'any.only': 'Gênero inválido. Valores permitidos: Masculino, Feminino, Outro.',
    }),
    skill_level: Joi.string() // Changed from level to skill_level
      .trim()
      .valid('Iniciante', 'Intermediário', 'Avançado', 'Profissional')
      .allow(null, '')
      .messages({
        'any.only':
          'Nível inválido. Valores permitidos: Iniciante, Intermediário, Avançado, Profissional.',
      }),
    games_played: Joi.number().integer().min(0).optional(),
    wins: Joi.number().integer().min(0).optional(),
    losses: Joi.number().integer().min(0).optional(),
  }),
};

const scoreIdParamSchema = {
  params: Joi.object({
    scoreId: Joi.number().integer().positive().required().messages({
      'number.base': `"scoreId" deve ser um número.`,
      'number.integer': `"scoreId" deve ser um inteiro.`,
      'number.positive': `"scoreId" deve ser um número positivo.`,
      'any.required': `"scoreId" é obrigatório.`,
    }),
  }),
};

const scoreUpdateSchema = {
  body: Joi.object({
    score1: Joi.number().integer().min(0).required().messages({
      'number.base': 'Placar do Jogador 1 deve ser um número.',
      'number.min': 'Placar do Jogador 1 não pode ser negativo.',
      'any.required': 'Placar do Jogador 1 é obrigatório.',
    }),
    score2: Joi.number().integer().min(0).required().messages({
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
    winner_id: Joi.number().integer().positive().allow(null).optional(),
  }),
};

const trashItemSchema = {
  params: Joi.object({
    itemId: Joi.alternatives().try(Joi.string(), Joi.number()).required().messages({
      'any.required': 'ID do item é obrigatório.',
    }),
    itemType: Joi.string().valid('player', 'score', 'tournament').required().messages({
      'any.only': 'Tipo de item inválido. Permitidos: player, score, tournament.',
      'any.required': 'Tipo de item é obrigatório.',
    }),
  }),
};

const newScoreSchema = {
  body: Joi.object({
    tournamentId: Joi.string().trim().min(1).max(255).required().messages({
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
    stateMatchKey: Joi.alternatives().try(Joi.string(), Joi.number()).required().messages({
      'any.required': 'Chave da partida (stateMatchKey) é obrigatória.',
    }),
  }),
};

const bulkScoreItemSchema = Joi.object({
  match_id: Joi.number().integer().positive().required(),
  player1_id: Joi.number().integer().positive().allow(null).optional(),
  player2_id: Joi.number().integer().positive().allow(null).optional(),
  player1_score: Joi.number().integer().min(0).required(),
  player2_score: Joi.number().integer().min(0).required(),
  winner_id: Joi.number().integer().positive().allow(null).optional(),
  round: Joi.string().trim().min(1).max(50).optional().allow(null, ''),
});

const updateScoresSchema = {
  body: Joi.object({
    scores: Joi.array().items(bulkScoreItemSchema).min(1).required().messages({
      'array.base': 'O campo "scores" deve ser um array.',
      'array.min': 'O array "scores" deve conter pelo menos um item.',
      'any.required': 'O campo "scores" é obrigatório.',
    }),
  }),
};

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
    numPlayersExpected: Joi.number().integer().min(2).optional().allow(null).messages({
      'number.min': 'Número esperado de jogadores deve ser no mínimo 2.',
    }),
    bracket_type: Joi.string()
      .valid('single-elimination', 'double-elimination', 'round-robin')
      .default('single-elimination'),
    entry_fee: Joi.number().min(0).optional().allow(null),
    prize_pool: Joi.string().trim().max(255).allow(null, ''),
    rules: Joi.string().trim().max(2000).allow(null, ''),
  }),
};

const updateTournamentSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(3).max(100).optional(),
    date: Joi.date().iso().optional(),
    description: Joi.string().trim().max(1000).allow(null, '').optional(),
    num_players_expected: Joi.number().integer().min(2).optional().allow(null),
    bracket_type: Joi.string()
      .valid('single-elimination', 'double-elimination', 'round-robin')
      .optional(),
    status: Joi.string().valid('Pendente', 'Em Andamento', 'Concluído', 'Cancelado').optional(),
    entry_fee: Joi.number().min(0).optional().allow(null),
    prize_pool: Joi.string().trim().max(255).allow(null, '').optional(),
    rules: Joi.string().trim().max(2000).allow(null, '').optional(),
  })
    .min(1)
    .messages({
      'object.min': 'Pelo menos um campo deve ser fornecido para atualização.',
    }),
};

const tournamentStateSchema = {
  body: Joi.object({
    state: Joi.object({
      matches: Joi.object().required(),
    })
      .required()
      .messages({
        'any.required': 'Objeto de estado é obrigatório.',
        'object.base': 'Estado deve ser um objeto.',
      }),
  }),
};

const addPlayerToTournamentSchema = {
  body: Joi.object({
    PlayerName: Joi.string().trim().min(2).max(100).required().messages({
      'string.empty': 'Nome do jogador é obrigatório.',
      'any.required': 'Nome do jogador é obrigatório.',
    }),
    Nickname: Joi.string().trim().max(50).allow(null, ''),
    gender: Joi.string().trim().valid('Masculino', 'Feminino', 'Outro').allow(null, ''),
    skill_level: Joi.string()
      .trim()
      .valid('Iniciante', 'Intermediário', 'Avançado', 'Profissional')
      .allow(null, ''),
  }),
};

const updatePlayersInTournamentSchema = {
  body: Joi.object({
    players: Joi.array()
      .items(
        Joi.object({
          PlayerName: Joi.string().trim().min(2).max(100).required(),
          Nickname: Joi.string().trim().max(50).allow(null, ''),
          gender: Joi.string().trim().valid('Masculino', 'Feminino', 'Outro').allow(null, ''),
          skill_level: Joi.string()
            .trim()
            .valid('Iniciante', 'Intermediário', 'Avançado', 'Profissional')
            .allow(null, ''),
        })
      )
      .min(0)
      .required()
      .messages({
        'array.base': 'Lista de jogadores deve ser um array.',
        'any.required': 'Lista de jogadores é obrigatória.',
      }),
  }),
};

const updateMatchScheduleSchema = {
  params: Joi.object({
    tournamentId: Joi.string().trim().required(),
    matchId: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  }),
  body: Joi.object({
    schedule: Joi.date().iso().required().messages({
      'date.base': 'Agendamento deve ser uma data/hora válida.',
      'any.required': 'Agendamento é obrigatório.',
    }),
  }),
};

const updateMatchWinnerSchema = {
  params: Joi.object({
    tournamentId: Joi.string().trim().required(),
    matchId: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  }),
  body: Joi.object({
    winnerId: Joi.number().integer().positive().allow(null).optional(),
    player1Score: Joi.number().integer().min(0).allow(null).optional(),
    player2Score: Joi.number().integer().min(0).allow(null).optional(),
  })
    .or('winnerId', 'player1Score', 'player2Score')
    .messages({
      'object.missing':
        'Pelo menos um campo (winnerId, player1Score, player2Score) deve ser fornecido.',
    }),
};

const honeypotConfigSchema = {
  body: Joi.object({
    threshold: Joi.number().integer().min(1).max(100).optional(),
    block_duration_hours: Joi.number().integer().min(1).max(720).optional(),
    whitelist_ips: Joi.array()
      .items(Joi.string().ip({ version: ['ipv4'] }))
      .optional(),
  })
    .min(1)
    .messages({
      'object.min': 'Pelo menos um campo de configuração deve ser fornecido.',
    }),
};

const manualBlockIpSchema = {
  body: Joi.object({
    ipAddress: Joi.string()
      .ip({ version: ['ipv4', 'ipv6'] })
      .required()
      .messages({
        'string.ip': 'Endereço IP inválido.',
        'any.required': 'Endereço IP é obrigatório.',
      }),
    durationHours: Joi.number().integer().min(0).optional().allow(null),
    reason: Joi.string().trim().min(3).max(255).optional().allow(null, ''),
  }),
};

const ipAddressParamSchema = {
  params: Joi.object({
    ipAddress: Joi.string()
      .ip({ version: ['ipv4', 'ipv6'] })
      .required(),
  }),
};

const playerImportItemSchema = Joi.object({
  PlayerName: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Nome do jogador (PlayerName) é obrigatório para importação.',
    'any.required': 'Nome do jogador (PlayerName) é obrigatório para importação.',
  }),
  Nickname: Joi.string().trim().max(50).allow(null, ''),
  gender: Joi.string().trim().valid('Masculino', 'Feminino', 'Outro').allow(null, ''),
  skill_level: Joi.string()
    .trim()
    .valid('Iniciante', 'Intermediário', 'Avançado', 'Profissional')
    .allow(null, ''),
});

// --- Schema for Admin GET Players Query Parameters ---
const adminGetPlayersQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).optional().default(1).messages({
      'number.base': 'Página deve ser um número.',
      'number.integer': 'Página deve ser um inteiro.',
      'number.min': 'Página deve ser no mínimo 1.',
    }),
    limit: Joi.number().integer().min(1).max(100).optional().default(10).messages({
      'number.base': 'Limite deve ser um número.',
      'number.integer': 'Limite deve ser um inteiro.',
      'number.min': 'Limite deve ser no mínimo 1.',
      'number.max': 'Limite deve ser no máximo 100.',
    }),
    sortBy: Joi.string().trim().optional().messages({
      'string.base': 'Campo de ordenação (sortBy) deve ser uma string.',
    }),
    order: Joi.string().trim().valid('asc', 'desc').optional().default('asc').messages({
      'string.base': 'Direção de ordenação (order) deve ser uma string.',
      'any.only': 'Direção de ordenação (order) deve ser "asc" ou "desc".',
    }),
    filters: Joi.object().optional().default({}).unknown(true).messages({
      'object.base': 'Filtros (filters) devem ser um objeto.',
    }),
  }),
};

// --- Generic Pagination Query Schema ---
const paginationQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).optional().default(1).messages({
      'number.base': 'Página deve ser um número.',
      'number.integer': 'Página deve ser um inteiro.',
      'number.min': 'Página deve ser no mínimo 1.',
    }),
    limit: Joi.number().integer().min(1).max(100).optional().default(10).messages({
      'number.base': 'Limite deve ser um número.',
      'number.integer': 'Limite deve ser um inteiro.',
      'number.min': 'Limite deve ser no mínimo 1.',
      'number.max': 'Limite deve ser no máximo 100.',
    }),
  }).unknown(true),
};

// --- Schema for Admin GET Trash Query Parameters ---
const adminGetTrashQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).optional().default(1).messages({
      'number.base': 'Página deve ser um número.',
      'number.integer': 'Página deve ser um inteiro.',
      'number.min': 'Página deve ser no mínimo 1.',
    }),
    limit: Joi.number().integer().min(1).max(100).optional().default(10).messages({
      'number.base': 'Limite deve ser um número.',
      'number.integer': 'Limite deve ser um inteiro.',
      'number.min': 'Limite deve ser no mínimo 1.',
      'number.max': 'Limite deve ser no máximo 100.',
    }),
    itemType: Joi.string().trim().valid('player', 'score', 'tournament').optional().messages({
      'string.base': 'Tipo de item (itemType) deve ser uma string.',
      'any.only': 'Tipo de item (itemType) deve ser "player", "score", ou "tournament".',
    }),
  }),
};

// Basic username validation (alphanumeric, 3-30 characters)
function validateUsername(username) {
  if (!username || typeof username !== 'string') return false;
  const usernameRegex = /^[a-zA-Z0-9]{3,30}$/;
  return usernameRegex.test(username);
}

// validatePassword function is now defined above adminLoginSchema

const assignPlayerSchema = {
  body: Joi.object({
    playerId: Joi.number().integer().positive().required().messages({
      'number.base': `"playerId" deve ser um número.`,
      'number.integer': `"playerId" deve ser um inteiro.`,
      'number.positive': `"playerId" deve ser um número positivo.`,
      'any.required': `"playerId" é obrigatório no corpo da requisição.`,
    }),
  }),
};

// Schema para validação de refresh token
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'string.base': 'O refresh token deve ser uma string',
    'string.empty': 'O refresh token não pode estar vazio',
    'any.required': 'O refresh token é obrigatório',
  }),
});

// Schema for User Registration
const userRegistrationSchema = {
  body: Joi.object({
    username: Joi.string().email().required().messages({
      'string.base': `"username" deve ser do tipo texto`,
      'string.empty': `"username" não pode estar vazio`,
      'string.email': `"username" deve ser um email válido`,
      'any.required': `"username" é um campo obrigatório`,
    }),
    password: passwordSchema,
  }),
};

// Schema for User Password Change
const userPasswordChangeSchema = {
  body: Joi.object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
  }),
};

// Schema for User Login
const userLoginSchema = {
  body: Joi.object({
    username: Joi.string().email().required().messages({
      'string.base': `"username" deve ser do tipo texto`,
      'string.empty': `"username" não pode estar vazio`,
      'string.email': `"username" deve ser um email válido`,
      'any.required': `"username" é um campo obrigatório`,
    }),
    password: passwordSchema, // Using the common strong password schema
  }),
};

// Schema for Admin User Creation
const adminUserCreateSchema = {
  body: Joi.object({
    username: Joi.string().email().required().messages({
      'string.base': `"username" deve ser do tipo texto`,
      'string.empty': `"username" não pode estar vazio`,
      'string.email': `"username" deve ser um email válido`,
      'any.required': `"username" é um campo obrigatório`,
    }),
    password: passwordSchema,
    role: Joi.string().valid('admin', 'super_admin').optional().default('admin').messages({
      'any.only': 'Papel deve ser "admin" ou "super_admin".',
    }),
  }),
};

module.exports = {
  validateRequest,
  validateUsername, // Export new function
  validatePassword, // Export new function (already defined above)
  passwordSchema, // Export the Joi schema for direct use if needed (already defined above)
  isValidTournamentId,
  isValidPlayerId,
  isValidScoreId,
  adminLoginSchema,
  changePasswordSchema,
  tournamentIdParamSchema,
  optionalPlayerIdSchema,
  playerSchema,
  scoreIdParamSchema,
  scoreUpdateSchema,
  trashItemSchema,
  newScoreSchema,
  createTournamentSchema,
  updateTournamentSchema,
  tournamentStateSchema,
  addPlayerToTournamentSchema,
  updatePlayersInTournamentSchema,
  updateMatchScheduleSchema,
  updateMatchWinnerSchema,
  honeypotConfigSchema,
  manualBlockIpSchema,
  ipAddressParamSchema,
  updateScoresSchema,
  playerImportItemSchema,
  specificTournamentIdStringSchema,
  adminGetPlayersQuerySchema,
  adminGetTrashQuerySchema,
  paginationQuerySchema,
  assignPlayerSchema, // Added new schema
  playerIdParamSchema, // Export the new schema
  refreshTokenSchema, // Export the new schema
  userRegistrationSchema, // Export new schema
  userPasswordChangeSchema, // Export new schema
  userLoginSchema, // Export new schema for user login
  adminUserCreateSchema, // Export new schema for admin user creation
};
