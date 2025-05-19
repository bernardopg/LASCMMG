const {
  queryAsync,
  runAsync,
  getOneAsync,
  transactionAsync,
} = require('../db/database');
const { logger } = require('../logger/logger');

// Helper to add is_deleted filter
const addIsDeletedFilter = (sql, params, includeDeleted = false) => {
  if (!includeDeleted) {
    if (sql.toUpperCase().includes('WHERE')) {
      sql += ' AND (is_deleted = 0 OR is_deleted IS NULL)';
    } else {
      sql += ' WHERE (is_deleted = 0 OR is_deleted IS NULL)';
    }
  }
  return { sql, params };
};

async function getPlayersByTournamentId(tournamentId, options = {}) {
  if (!tournamentId) {
    throw new Error('ID do torneio não fornecido');
  }

  const {
    limit,
    offset,
    orderBy = 'name',
    order = 'ASC',
    includeDeleted = false,
  } = options;

  // Whitelist and map orderBy fields to actual column names
  const columnMap = {
    id: 'id',
    name: 'name',
    nickname: 'nickname',
    games_played: 'games_played',
    wins: 'wins',
    losses: 'losses',
    // 'score': 'score', // 'score' is not a direct column, handle if it's a calculated field or alias
    gender: 'gender',
    skill_level: 'skill_level',
    // Add other valid sortable columns here
  };

  const effectiveOrderBy = columnMap[orderBy] || 'name'; // Default to 'name' if invalid
  const effectiveOrder = ['ASC', 'DESC'].includes(order.toUpperCase())
    ? order.toUpperCase()
    : 'ASC';

  let baseSql = `SELECT * FROM players WHERE tournament_id = ?`;
  let baseCountSql = `SELECT COUNT(*) as total FROM players WHERE tournament_id = ?`;
  const baseParams = [tournamentId];

  const filtered = addIsDeletedFilter(baseSql, [...baseParams], includeDeleted);
  let sql = filtered.sql;
  let params = filtered.params;

  const filteredCount = addIsDeletedFilter(
    baseCountSql,
    [...baseParams],
    includeDeleted
  );
  let countSql = filteredCount.sql;
  let countParams = filteredCount.params;

  // Use the sanitized column name in ORDER BY
  sql += ` ORDER BY "${effectiveOrderBy}" ${effectiveOrder}`; // Enclose column name in double quotes for safety

  if (limit !== undefined && limit !== -1 && limit !== null) {
    sql += ' LIMIT ?';
    params.push(parseInt(limit, 10));
    if (offset !== undefined && offset !== null) {
      sql += ' OFFSET ?';
      params.push(parseInt(offset, 10));
    }
  }

  try {
    const players = await queryAsync(sql, params);
    const totalResult = await getOneAsync(countSql, countParams);
    return { players, total: totalResult ? totalResult.total : 0 };
  } catch (err) {
    logger.error(
      'PlayerModel',
      `Erro ao buscar jogadores para o torneio ${tournamentId}: ${err.message}`,
      { tournamentId, error: err }
    );
    throw err;
  }
}

async function getPlayerById(playerId, includeDeleted = false) {
  if (!playerId) {
    throw new Error('ID do jogador não fornecido');
  }
  let { sql, params } = addIsDeletedFilter(
    'SELECT * FROM players WHERE id = ?',
    [playerId],
    includeDeleted
  );

  try {
    return await getOneAsync(sql, params);
  } catch (err) {
    logger.error(
      'PlayerModel',
      `Erro ao buscar jogador com ID ${playerId}: ${err.message}`,
      { playerId, error: err }
    );
    throw err;
  }
}

async function getPlayerByNameInTournament(
  tournamentId,
  playerName,
  includeDeleted = false
) {
  if (!tournamentId || !playerName) {
    throw new Error('ID do torneio e nome do jogador são obrigatórios.');
  }
  let { sql, params } = addIsDeletedFilter(
    'SELECT * FROM players WHERE tournament_id = ? AND name = ?',
    [tournamentId, playerName],
    includeDeleted
  );
  try {
    return await getOneAsync(sql, params);
  } catch (err) {
    logger.error(
      'PlayerModel',
      `Erro ao buscar jogador "${playerName}" no torneio ${tournamentId}: ${err.message}`,
      { tournamentId, playerName, error: err }
    );
    throw err;
  }
}

async function addPlayer(playerData) {
  // For adding player to a specific tournament
  const { tournament_id, name, nickname, gender, skill_level } = playerData;
  if (!tournament_id || !name) {
    throw new Error(
      'ID do torneio e nome do jogador são obrigatórios para addPlayer.'
    );
  }

  const sql = `
    INSERT INTO players (tournament_id, name, nickname, games_played, wins, losses, gender, skill_level, is_deleted, deleted_at)
    VALUES (?, ?, ?, 0, 0, 0, ?, ?, 0, NULL)
  `;
  try {
    const result = await runAsync(sql, [
      tournament_id,
      name,
      nickname || null,
      gender || null,
      skill_level || null,
    ]);
    return await getPlayerById(result.lastInsertRowid);
  } catch (err) {
    if (
      err.message.includes(
        'UNIQUE constraint failed: players.tournament_id, players.name'
      ) // Assuming is_deleted=0 is part of unique index or handled by app logic
    ) {
      logger.warn(
        'PlayerModel',
        `Tentativa de adicionar jogador duplicado (não excluído): ${name} no torneio ${tournament_id}`,
        { name, tournament_id }
      );
      throw new Error(
        `Jogador "${name}" (não excluído) já existe neste torneio.`
      );
    }
    logger.error('PlayerModel', 'Erro ao adicionar jogador:', {
      error: err,
      playerData,
    });
    throw err;
  }
}

async function createGlobalPlayer(playerData) {
  // For creating a player not initially tied to a tournament
  const { name, nickname, gender, skill_level } = playerData;
  if (!name) {
    throw new Error('Nome do jogador é obrigatório.');
  }

  const sql = `
    INSERT INTO players (name, nickname, games_played, wins, losses, gender, skill_level, tournament_id, is_deleted, deleted_at)
    VALUES (?, ?, 0, 0, 0, ?, ?, NULL, 0, NULL)
  `;
  try {
    const result = await runAsync(sql, [
      name,
      nickname || null,
      gender || null,
      skill_level || null,
    ]);
    return await getPlayerById(result.lastInsertRowid);
  } catch (err) {
    // Assuming a global UNIQUE constraint on name (or name+nickname) for non-deleted global players
    if (err.message.includes('UNIQUE constraint failed')) {
      logger.warn(
        'PlayerModel',
        `Tentativa de adicionar jogador global duplicado (não excluído): ${name}`,
        { name }
      );
      throw new Error(
        `Jogador "${name}" (ou apelido) já existe globalmente e não está excluído.`
      );
    }
    logger.error('PlayerModel', 'Erro ao adicionar jogador global:', {
      error: err,
      playerData,
    });
    throw err;
  }
}

/**
 * Atualiza os dados de um jogador
 * @param {number} playerId ID do jogador
 * @param {object} playerData Dados a serem atualizados (name, nickname, games_played, wins, losses, gender, skill_level)
 * @returns {Promise<object|null>} Jogador atualizado ou null se não encontrado
 */
async function updatePlayer(playerId, playerData) {
  if (!playerId) {
    throw new Error('ID do jogador não fornecido');
  }
  // Explicitly exclude is_deleted and deleted_at from direct update via this function
  const { name, nickname, games_played, wins, losses, gender, skill_level } =
    playerData;
  const fieldsToUpdate = [];
  const values = [];

  if (name !== undefined) {
    fieldsToUpdate.push('name = ?');
    values.push(name);
  }
  if (nickname !== undefined) {
    fieldsToUpdate.push('nickname = ?');
    values.push(nickname);
  }
  if (games_played !== undefined) {
    fieldsToUpdate.push('games_played = ?');
    values.push(games_played);
  }
  if (wins !== undefined) {
    fieldsToUpdate.push('wins = ?');
    values.push(wins);
  }
  if (losses !== undefined) {
    fieldsToUpdate.push('losses = ?');
    values.push(losses);
  }
  if (gender !== undefined) {
    fieldsToUpdate.push('gender = ?');
    values.push(gender);
  }
  if (skill_level !== undefined) {
    fieldsToUpdate.push('skill_level = ?');
    values.push(skill_level);
  }

  if (fieldsToUpdate.length === 0) {
    return await getPlayerById(playerId); // Will respect soft-delete status
  }

  fieldsToUpdate.push('updated_at = CURRENT_TIMESTAMP'); // Always update timestamp

  const sql = `
    UPDATE players
    SET ${fieldsToUpdate.join(', ')}
    WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)
  `; // Only update non-deleted players
  values.push(playerId);

  try {
    const result = await runAsync(sql, values);
    if (result.changes === 0) {
      // Check if player exists but is deleted
      const existing = await getPlayerById(playerId, true);
      if (existing && existing.is_deleted) {
        logger.warn(
          'PlayerModel',
          `Tentativa de atualizar jogador ${playerId} que está na lixeira.`,
          { playerId }
        );
        return null; // Or throw error
      }
      return null; // Not found or no changes made
    }
    return await getPlayerById(playerId);
  } catch (err) {
    logger.error(
      'PlayerModel',
      `Erro ao atualizar jogador ${playerId}: ${err.message}`,
      { playerId, playerData, error: err }
    );
    throw err;
  }
}

async function deletePlayer(playerId, permanent = false) {
  if (!playerId) {
    throw new Error('ID do jogador não fornecido');
  }

  if (permanent) {
    // Hard delete
    const sql = 'DELETE FROM players WHERE id = ?';
    try {
      const result = await runAsync(sql, [playerId]);
      logger.info(
        'PlayerModel',
        `Jogador ${playerId} excluído permanentemente.`,
        { playerId }
      );
      return result.changes > 0;
    } catch (err) {
      logger.error(
        'PlayerModel',
        `Erro ao remover permanentemente o jogador ${playerId}: ${err.message}`,
        { playerId, error: err }
      );
      throw err;
    }
  } else {
    // Soft delete
    const sql =
      'UPDATE players SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)';
    try {
      const result = await runAsync(sql, [playerId]);
      if (result.changes > 0) {
        logger.info(
          'PlayerModel',
          `Jogador ${playerId} movido para a lixeira (soft delete).`,
          { playerId }
        );
        return true;
      }
      const existing = await getPlayerById(playerId, true); // Check if it exists, even if deleted
      if (existing && existing.is_deleted) {
        logger.info(
          'PlayerModel',
          `Jogador ${playerId} já estava na lixeira. Nenhuma alteração.`,
          { playerId }
        );
        return true;
      }
      logger.warn(
        'PlayerModel',
        `Jogador ${playerId} não encontrado para soft delete ou já estava excluído.`,
        { playerId }
      );
      return false;
    } catch (err) {
      logger.error(
        'PlayerModel',
        `Erro ao mover jogador ${playerId} para a lixeira: ${err.message}`,
        { playerId, error: err }
      );
      throw err;
    }
  }
}

async function deletePlayersByTournamentId(tournamentId, permanent = false) {
  // Added permanent flag
  if (!tournamentId) {
    throw new Error('ID do torneio não fornecido');
  }
  let sql;
  if (permanent) {
    sql = 'DELETE FROM players WHERE tournament_id = ?';
  } else {
    sql =
      'UPDATE players SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE tournament_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)';
  }
  try {
    const result = await runAsync(sql, [tournamentId]);
    logger.info(
      'PlayerModel',
      `${result.changes} jogadores do torneio ${tournamentId} ${permanent ? 'excluídos permanentemente' : 'movidos para lixeira'}.`,
      { tournamentId, count: result.changes, permanent }
    );
    return result.changes;
  } catch (err) {
    logger.error(
      'PlayerModel',
      `Erro ao ${permanent ? 'remover permanentemente jogadores' : 'mover jogadores para lixeira'} do torneio ${tournamentId}: ${err.message}`,
      { tournamentId, error: err, permanent }
    );
    throw err;
  }
}

async function importPlayers(tournamentId, playersArray) {
  if (!tournamentId) {
    throw new Error('ID do torneio é obrigatório para importar jogadores.');
  }
  if (!Array.isArray(playersArray)) {
    throw new Error('A lista de jogadores deve ser um array.');
  }

  let importedCount = 0;
  const errors = [];

  await transactionAsync((db) => {
    const selectPlayerSql =
      'SELECT id, name, nickname, gender, skill_level, is_deleted FROM players WHERE tournament_id = ? AND name = ?';
    const insertPlayerSql = `
      INSERT INTO players (tournament_id, name, nickname, games_played, wins, losses, gender, skill_level, is_deleted, deleted_at)
      VALUES (?, ?, ?, 0, 0, 0, ?, ?, 0, NULL)
    `;
    const updatePlayerSql = `
      UPDATE players
      SET nickname = ?, gender = ?, skill_level = ?, is_deleted = 0, deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const selectStmt = db.prepare(selectPlayerSql);
    const insertStmt = db.prepare(insertPlayerSql);
    const updateStmt = db.prepare(updatePlayerSql);

    for (const playerData of playersArray) {
      if (!playerData || !playerData.name) {
        errors.push(
          `Dados do jogador inválidos ou nome ausente: ${JSON.stringify(
            playerData
          )}`
        );
        continue;
      }

      try {
        const existingPlayer = selectStmt.get(tournamentId, playerData.name);

        if (existingPlayer) {
          if (
            existingPlayer.is_deleted === 0 ||
            existingPlayer.is_deleted === null
          ) {
            // Player exists and is not deleted, skip.
            logger.warn(
              'PlayerModel',
              `Jogador "${playerData.name}" (não excluído) já existe no torneio ${tournamentId} e foi ignorado na importação.`,
              { playerName: playerData.name, tournamentId }
            );
            continue;
          } else {
            // Player exists but is soft-deleted, restore and update.
            const info = updateStmt.run(
              playerData.nickname || existingPlayer.nickname || null,
              playerData.gender || existingPlayer.gender || null,
              playerData.skill_level || existingPlayer.skill_level || null,
              existingPlayer.id
            );
            if (info.changes > 0) {
              importedCount++;
              logger.info(
                'PlayerModel',
                `Jogador "${playerData.name}" restaurado e atualizado no torneio ${tournamentId} via importação.`,
                { playerName: playerData.name, tournamentId }
              );
            } else {
              // This case should ideally not happen if selectStmt found a soft-deleted player.
              errors.push(
                `Falha ao restaurar/atualizar jogador soft-deletado "${playerData.name}".`
              );
            }
          }
        } else {
          // Player does not exist, insert.
          const info = insertStmt.run(
            tournamentId,
            playerData.name,
            playerData.nickname || null,
            playerData.gender || null,
            playerData.skill_level || null
          );
          if (info.changes > 0) {
            importedCount++;
          }
        }
      } catch (error) {
        // Catch UNIQUE constraint for inserts, other errors for updates/inserts
        if (error.message.includes('UNIQUE constraint failed')) {
          errors.push(
            `Jogador "${playerData.name}" já existe neste torneio (erro de constraint ao tentar inserir).`
          );
        } else {
          errors.push(
            `Erro ao processar jogador "${playerData.name}" na importação: ${error.message}`
          );
        }
        logger.error(
          'PlayerModel',
          `Erro durante importação do jogador ${playerData.name} para torneio ${tournamentId}`,
          { error, playerData }
        );
      }
    }
  });
  return { count: importedCount, errors };
}

async function replacePlayerListForTournament(tournamentId, newPlayersArray) {
  if (!tournamentId) {
    throw new Error('ID do torneio é obrigatório.');
  }
  if (!Array.isArray(newPlayersArray)) {
    throw new Error('A nova lista de jogadores deve ser um array.');
  }

  let addedCount = 0;
  const errors = [];

  await transactionAsync((db) => {
    // Fetch current players (including soft-deleted ones to handle restoration)
    const getAllPlayersSql =
      'SELECT id, name, nickname, gender, skill_level, is_deleted FROM players WHERE tournament_id = ?';
    const currentPlayersStmt = db.prepare(getAllPlayersSql);
    const currentPlayersList = currentPlayersStmt.all(tournamentId);
    const currentPlayersMap = new Map(
      currentPlayersList.map((p) => [p.name, p])
    );

    const playersToKeepIds = new Set();
    let processedCount = 0;

    const insertPlayerSql = `
      INSERT INTO players (tournament_id, name, nickname, games_played, wins, losses, gender, skill_level, is_deleted, deleted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NULL)
    `;
    const updatePlayerSql = `
      UPDATE players
      SET nickname = ?, gender = ?, skill_level = ?, games_played = ?, wins = ?, losses = ?, is_deleted = 0, deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    const insertStmt = db.prepare(insertPlayerSql);
    const updateStmt = db.prepare(updatePlayerSql);

    for (const newPlayerData of newPlayersArray) {
      const name = newPlayerData.PlayerName || newPlayerData.name;
      if (!name) {
        errors.push(
          `Dados do jogador inválidos ou nome ausente na nova lista: ${JSON.stringify(newPlayerData)}`
        );
        continue;
      }

      const nickname = newPlayerData.Nickname || newPlayerData.nickname || null;
      const gender = newPlayerData.gender || null;
      const skill_level = newPlayerData.skill_level || null;
      const gamesPlayed = newPlayerData.GamesPlayed || 0;
      const wins = newPlayerData.Wins || 0;
      const losses = newPlayerData.Losses || 0;

      const existingPlayer = currentPlayersMap.get(name);

      try {
        if (existingPlayer) {
          // Player exists, update them (and restore if soft-deleted)
          updateStmt.run(
            nickname,
            gender,
            skill_level,
            gamesPlayed,
            wins,
            losses,
            existingPlayer.id
          );
          playersToKeepIds.add(existingPlayer.id);
          processedCount++;
          logger.info(
            'PlayerModel',
            `Jogador "${name}" atualizado/restaurado no torneio ${tournamentId}.`,
            { name, tournamentId }
          );
        } else {
          // Player does not exist, insert them
          const info = insertStmt.run(
            tournamentId,
            name,
            nickname,
            gamesPlayed,
            wins,
            losses,
            gender,
            skill_level
          );
          if (info.changes > 0) {
            // It's harder to get the ID here without another query,
            // but we know one was added.
            processedCount++;
          }
        }
      } catch (error) {
        errors.push(
          `Erro ao processar jogador "${name}" para o torneio ${tournamentId}: ${error.message}`
        );
        logger.error(
          'PlayerModel',
          `Erro ao processar jogador ${name} em replacePlayerListForTournament`,
          { error, name, tournamentId }
        );
      }
    }

    // Soft-delete players that were in the DB but not in newPlayersArray
    const softDeleteStmt = db.prepare(
      'UPDATE players SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)'
    );
    let softDeletedCount = 0;
    for (const currentPlayer of currentPlayersList) {
      if (
        !playersToKeepIds.has(currentPlayer.id) &&
        (currentPlayer.is_deleted === 0 || currentPlayer.is_deleted === null)
      ) {
        try {
          const info = softDeleteStmt.run(currentPlayer.id);
          if (info.changes > 0) {
            softDeletedCount++;
          }
        } catch (error) {
          errors.push(
            `Erro ao soft-deletar jogador "${currentPlayer.name}" (ID: ${currentPlayer.id}): ${error.message}`
          );
          logger.error(
            'PlayerModel',
            `Erro ao soft-deletar jogador ${currentPlayer.name} em replacePlayerListForTournament`,
            { error, player: currentPlayer }
          );
        }
      }
    }
    if (softDeletedCount > 0) {
      logger.info(
        'PlayerModel',
        `${softDeletedCount} jogadores antigos movidos para a lixeira no torneio ${tournamentId}.`,
        { softDeletedCount, tournamentId }
      );
    }
    addedCount = processedCount; // This now represents players added or updated/restored
  });

  if (errors.length > 0) {
    logger.error(
      'PlayerModel',
      'Erros durante replacePlayerListForTournament:',
      { tournamentId, errors }
    );
  }
  return { count: addedCount, errors };
}

async function getAllPlayers(options = {}) {
  const {
    limit,
    offset,
    sortBy = 'name',
    order = 'ASC',
    filters = {},
    includeDeleted = false,
  } = options;

  // Whitelist and map sortBy fields to actual column names
  const columnMap = {
    id: 'id',
    name: 'name',
    nickname: 'nickname',
    games_played: 'games_played',
    wins: 'wins',
    losses: 'losses',
    gender: 'gender',
    skill_level: 'skill_level',
    tournament_id: 'tournament_id',
    created_at: 'created_at',
    updated_at: 'updated_at',
    is_deleted: 'is_deleted',
    // Add other valid sortable columns here
  };

  const effectiveOrderBy = columnMap[sortBy] || 'name'; // Default to 'name' if invalid
  const effectiveOrder = ['ASC', 'DESC'].includes(order.toUpperCase())
    ? order.toUpperCase()
    : 'ASC';

  let sql = `SELECT * FROM players`;
  let countSql = `SELECT COUNT(*) as total FROM players`;
  const queryParams = []; // For the main query
  const countQueryParams = []; // For the count query

  let whereClauses = [];

  if (!includeDeleted) {
    whereClauses.push('(is_deleted = 0 OR is_deleted IS NULL)');
  }

  if (filters) {
    if (filters.name && typeof filters.name === 'string') {
      whereClauses.push('name LIKE ?');
      queryParams.push(`%${filters.name}%`);
      countQueryParams.push(`%${filters.name}%`);
    }
    if (filters.nickname && typeof filters.nickname === 'string') {
      whereClauses.push('nickname LIKE ?');
      queryParams.push(`%${filters.nickname}%`);
      countQueryParams.push(`%${filters.nickname}%`);
    }
    if (filters.tournament_id) {
      whereClauses.push('tournament_id = ?');
      queryParams.push(filters.tournament_id);
      countQueryParams.push(filters.tournament_id);
    }
    if (filters.gender && typeof filters.gender === 'string') {
      whereClauses.push('gender = ?');
      queryParams.push(filters.gender);
      countQueryParams.push(filters.gender);
    }
    if (filters.skill_level && typeof filters.skill_level === 'string') {
      whereClauses.push('skill_level = ?');
      queryParams.push(filters.skill_level);
      countQueryParams.push(filters.skill_level);
    }
    if (filters.is_deleted !== undefined) {
      // Explicitly filter by is_deleted if provided
      // This overrides the includeDeleted flag for this specific filter
      whereClauses = whereClauses.filter(
        (clause) => !clause.includes('is_deleted')
      ); // Remove default if any
      whereClauses.push('is_deleted = ?');
      queryParams.push(filters.is_deleted ? 1 : 0);
      countQueryParams.push(filters.is_deleted ? 1 : 0);
    }
  }

  if (whereClauses.length > 0) {
    sql += ` WHERE ${whereClauses.join(' AND ')}`;
    countSql += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  // Use the sanitized column name in ORDER BY
  sql += ` ORDER BY "${effectiveOrderBy}" ${effectiveOrder}`; // Enclose column name in double quotes

  // Create a new array for the final query with pagination params
  const finalQueryParams = [...queryParams];

  if (limit !== undefined && limit !== -1 && limit !== null) {
    sql += ' LIMIT ?';
    finalQueryParams.push(parseInt(limit, 10));
    if (offset !== undefined && offset !== null) {
      sql += ' OFFSET ?';
      finalQueryParams.push(parseInt(offset, 10));
    }
  }

  try {
    const players = await queryAsync(sql, finalQueryParams); // Use finalQueryParams
    const totalResult = await getOneAsync(countSql, countQueryParams);
    return { players, total: totalResult ? totalResult.total : 0 };
  } catch (err) {
    logger.error(
      'PlayerModel',
      `Erro ao buscar todos os jogadores: ${err.message}`,
      { error: err }
    );
    throw err;
  }
}

async function countPlayers(includeDeleted = false) {
  let { sql, params } = addIsDeletedFilter(
    'SELECT COUNT(*) as count FROM players',
    [],
    includeDeleted
  );
  try {
    const row = await getOneAsync(sql, params);
    return row ? row.count : 0;
  } catch (err) {
    logger.error('PlayerModel', 'Erro ao contar jogadores:', { error: err });
    throw err;
  }
}

module.exports = {
  getPlayersByTournamentId,
  getPlayerById,
  getPlayerByNameInTournament,
  addPlayer,
  createGlobalPlayer,
  updatePlayer,
  deletePlayer,
  deletePlayersByTournamentId,
  importPlayers,
  replacePlayerListForTournament,
  countPlayers,
  getAllPlayers,
  // restorePlayer will be exported in the final module.exports block
};

async function restorePlayer(playerId) {
  if (!playerId) {
    throw new Error('ID do jogador não fornecido para restauração.');
  }
  // Set is_deleted to 0 and clear deleted_at
  const sql =
    'UPDATE players SET is_deleted = 0, deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND is_deleted = 1';
  try {
    const result = await runAsync(sql, [playerId]);
    if (result.changes > 0) {
      logger.info('PlayerModel', `Jogador ${playerId} restaurado da lixeira.`, {
        playerId,
      });
      return true;
    }
    logger.warn(
      'PlayerModel',
      `Jogador ${playerId} não encontrado na lixeira ou não precisou de restauração.`,
      { playerId }
    );
    // Check if player exists and is not deleted already
    const player = await getPlayerById(playerId);
    return !!player; // Return true if player exists and is not deleted
  } catch (err) {
    logger.error(
      'PlayerModel',
      `Erro ao restaurar jogador ${playerId} da lixeira: ${err.message}`,
      { playerId, error: err }
    );
    throw err;
  }
}

module.exports = {
  getPlayersByTournamentId,
  getPlayerById,
  getPlayerByNameInTournament,
  addPlayer,
  createGlobalPlayer,
  updatePlayer,
  deletePlayer,
  deletePlayersByTournamentId,
  importPlayers,
  replacePlayerListForTournament,
  countPlayers,
  getAllPlayers,
  restorePlayer, // Added restorePlayer
};
