const {
  queryAsync,
  runAsync,
  getOneAsync,
  transactionAsync,
} = require('../db/database');
const { logger } = require('../logger/logger');
const auditLogger = require('../logger/auditLogger'); // Ensure auditLogger is imported if used

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

  const columnMap = {
    id: 'id',
    name: 'name',
    nickname: 'nickname',
    games_played: 'games_played',
    wins: 'wins',
    losses: 'losses',
    gender: 'gender',
    skill_level: 'skill_level',
  };

  const effectiveOrderBy = columnMap[orderBy] || 'name';
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

  sql += ` ORDER BY "${effectiveOrderBy}" ${effectiveOrder}`;

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
      { component: 'PlayerModel', err, tournamentId },
      `Erro ao buscar jogadores para o torneio ${tournamentId}.`
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
      { component: 'PlayerModel', err, playerId },
      `Erro ao buscar jogador com ID ${playerId}.`
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
      { component: 'PlayerModel', err, tournamentId, playerName },
      `Erro ao buscar jogador "${playerName}" no torneio ${tournamentId}.`
    );
    throw err;
  }
}

async function addPlayer(playerData) {
  const { tournament_id, name, nickname, email, gender, skill_level } = playerData; // Added email
  if (!tournament_id || !name) {
    throw new Error(
      'ID do torneio e nome do jogador são obrigatórios para addPlayer.'
    );
  }

  const sql = `
    INSERT INTO players (tournament_id, name, nickname, email, games_played, wins, losses, gender, skill_level, is_deleted, deleted_at)
    VALUES (?, ?, ?, ?, 0, 0, 0, ?, ?, 0, NULL)
  `;
  try {
    const result = await runAsync(sql, [
      tournament_id,
      name,
      nickname || null,
      email || null, // Added email
      gender || null,
      skill_level || null,
    ]);
    return await getPlayerById(result.lastInsertRowid);
  } catch (err) {
    if (
      err.message.includes(
        'UNIQUE constraint failed: players.tournament_id, players.name'
      ) || err.message.includes('UNIQUE constraint failed: players.email')
    ) {
      logger.warn(
        { component: 'PlayerModel', name, tournament_id, email },
        `Tentativa de adicionar jogador duplicado (não excluído): ${name} (email: ${email}) no torneio ${tournament_id}.`
      );
      throw new Error(
        `Jogador "${name}" ou email "${email}" (não excluído) já existe neste torneio.`
      );
    }
    logger.error(
      { component: 'PlayerModel', err, playerData },
      'Erro ao adicionar jogador.'
    );
    throw err;
  }
}

async function createGlobalPlayer(playerData) {
  const { name, nickname, email, gender, skill_level, ipAddress } = playerData; // Added email and ipAddress
  if (!name) {
    throw new Error('Nome do jogador é obrigatório.');
  }

  const sql = `
    INSERT INTO players (name, nickname, email, gender, skill_level, tournament_id, deleted_at)
    VALUES (?, ?, ?, ?, ?, NULL, NULL)
  `;
  // games_played, wins, losses, score, is_deleted will use their database DEFAULT 0 values.
  try {
    const result = await runAsync(sql, [
      name,
      nickname || null,
      email || null,
      gender || null,
      skill_level || null,
    ]);
    const playerId = result.lastInsertRowid;
    // Audit logging for global player creation
    auditLogger.logAction(
        'SYSTEM', // Or an admin user ID if available
        'GLOBAL_PLAYER_CREATE',
        'player',
        playerId.toString(),
        { name, nickname, email, ipAddress: ipAddress || 'unknown' }
    );
    return await getPlayerById(playerId);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed: players.email') && email) {
         logger.warn(
            { component: 'PlayerModel', name, email },
            `Tentativa de adicionar jogador global duplicado (email existente): ${email}.`
          );
        throw new Error(`Um jogador com o email "${email}" já existe globalmente.`);
    } else if (err.message.includes('UNIQUE constraint failed')) { // General unique constraint
      logger.warn(
        { component: 'PlayerModel', name },
        `Tentativa de adicionar jogador global duplicado (não excluído): ${name}.`
      );
      throw new Error(
        `Jogador "${name}" (ou apelido) já existe globalmente e não está excluído.`
      );
    }
    logger.error(
      { component: 'PlayerModel', err, playerData },
      'Erro ao adicionar jogador global.'
    );
    throw err;
  }
}

async function updatePlayer(playerId, playerData) {
  if (!playerId) {
    throw new Error('ID do jogador não fornecido');
  }
  const { name, nickname, email, games_played, wins, losses, gender, skill_level, ipAddress } = playerData; // Added email and ipAddress
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
  if (email !== undefined) { // Add email to update
    fieldsToUpdate.push('email = ?');
    values.push(email);
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
    return await getPlayerById(playerId);
  }

  fieldsToUpdate.push('updated_at = CURRENT_TIMESTAMP');

  const sql = `
    UPDATE players
    SET ${fieldsToUpdate.join(', ')}
    WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)
  `;
  values.push(playerId);

  try {
    const result = await runAsync(sql, values);
    if (result.changes === 0) {
      const existing = await getPlayerById(playerId, true);
      if (existing && existing.is_deleted) {
        logger.warn(
          { component: 'PlayerModel', playerId },
          `Tentativa de atualizar jogador ${playerId} que está na lixeira.`
        );
        return null;
      }
      return null;
    }
     auditLogger.logAction(
        'SYSTEM', // Or an admin user ID
        'PLAYER_UPDATE',
        'player',
        playerId.toString(),
        { updatedFields: fieldsToUpdate.map(f => f.split(' =')[0]), ipAddress: ipAddress || 'unknown' }
    );
    return await getPlayerById(playerId);
  } catch (err) {
     if (err.message.includes('UNIQUE constraint failed: players.email') && email) {
        logger.warn(
            { component: 'PlayerModel', playerId, email },
            `Falha ao atualizar jogador ${playerId}: email "${email}" já existe.`
        );
        throw new Error(`O email "${email}" já está em uso por outro jogador.`);
    }
    logger.error(
      { component: 'PlayerModel', err, playerId, playerData },
      `Erro ao atualizar jogador ${playerId}.`
    );
    throw err;
  }
}

async function deletePlayer(playerId, permanent = false) {
  if (!playerId) {
    throw new Error('ID do jogador não fornecido');
  }

  if (permanent) {
    const sql = 'DELETE FROM players WHERE id = ?';
    try {
      const result = await runAsync(sql, [playerId]);
      logger.info(
        { component: 'PlayerModel', playerId },
        `Jogador ${playerId} excluído permanentemente.`
      );
      // Audit log for permanent deletion
      auditLogger.logAction('SYSTEM', 'PLAYER_HARD_DELETE', 'player', playerId.toString(), {});
      return result.changes > 0;
    } catch (err) {
      logger.error(
        { component: 'PlayerModel', err, playerId },
        `Erro ao remover permanentemente o jogador ${playerId}.`
      );
      throw err;
    }
  } else {
    const sql =
      'UPDATE players SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)';
    try {
      const result = await runAsync(sql, [playerId]);
      if (result.changes > 0) {
        logger.info(
          { component: 'PlayerModel', playerId },
          `Jogador ${playerId} movido para a lixeira (soft delete).`
        );
        auditLogger.logAction('SYSTEM', 'PLAYER_SOFT_DELETE', 'player', playerId.toString(), {});
        return true;
      }
      const existing = await getPlayerById(playerId, true);
      if (existing && existing.is_deleted) {
        logger.info(
          { component: 'PlayerModel', playerId },
          `Jogador ${playerId} já estava na lixeira. Nenhuma alteração.`
        );
        return true;
      }
      logger.warn(
        { component: 'PlayerModel', playerId },
        `Jogador ${playerId} não encontrado para soft delete ou já estava excluído.`
      );
      return false;
    } catch (err) {
      logger.error(
        { component: 'PlayerModel', err, playerId },
        `Erro ao mover jogador ${playerId} para a lixeira.`
      );
      throw err;
    }
  }
}

async function deletePlayersByTournamentId(tournamentId, permanent = false) {
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
    // TODO: Audit log for batch deletion might be needed if it's a common admin action
    const result = await runAsync(sql, [tournamentId]);
    logger.info(
      {
        component: 'PlayerModel',
        tournamentId,
        count: result.changes,
        permanent,
      },
      `${result.changes} jogadores do torneio ${tournamentId} ${permanent ? 'excluídos permanentemente' : 'movidos para lixeira'}.`
    );
    return result.changes;
  } catch (err) {
    logger.error(
      { component: 'PlayerModel', err, tournamentId, permanent },
      `Erro ao ${permanent ? 'remover permanentemente jogadores' : 'mover jogadores para lixeira'} do torneio ${tournamentId}.`
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
      'SELECT id, name, nickname, email, gender, skill_level, is_deleted FROM players WHERE tournament_id = ? AND name = ?';
    const insertPlayerSql = `
      INSERT INTO players (tournament_id, name, nickname, email, games_played, wins, losses, gender, skill_level, is_deleted, deleted_at)
      VALUES (?, ?, ?, ?, 0, 0, 0, ?, ?, 0, NULL)
    `; // Added email
    const updatePlayerSql = `
      UPDATE players
      SET nickname = ?, email = ?, gender = ?, skill_level = ?, is_deleted = 0, deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `; // Added email

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
            logger.warn(
              {
                component: 'PlayerModel',
                playerName: playerData.name,
                tournamentId,
              },
              `Jogador "${playerData.name}" (não excluído) já existe no torneio ${tournamentId} e foi ignorado na importação.`
            );
            continue;
          } else {
            const info = updateStmt.run(
              playerData.nickname || existingPlayer.nickname || null,
              playerData.email || existingPlayer.email || null, // Added email
              playerData.gender || existingPlayer.gender || null,
              playerData.skill_level || existingPlayer.skill_level || null,
              existingPlayer.id
            );
            if (info.changes > 0) {
              importedCount++;
            }
          }
        } else {
          const info = insertStmt.run(
            tournamentId,
            playerData.name,
            playerData.nickname || null,
            playerData.email || null, // Added email
            playerData.gender || null,
            playerData.skill_level || null
          );
          if (info.changes > 0) {
            importedCount++;
          }
        }
      } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
          errors.push(
            `Jogador "${playerData.name}" ou email "${playerData.email}" já existe neste torneio.`
          );
        } else {
          errors.push(
            `Erro ao processar jogador "${playerData.name}" na importação: ${error.message}`
          );
        }
        logger.error(
          { component: 'PlayerModel', err: error, playerData, tournamentId },
          `Erro durante importação do jogador ${playerData.name} para torneio ${tournamentId}.`
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
    const getAllPlayersSql =
      'SELECT id, name, nickname, email, gender, skill_level, is_deleted FROM players WHERE tournament_id = ?'; // Added email
    const currentPlayersStmt = db.prepare(getAllPlayersSql);
    const currentPlayersList = currentPlayersStmt.all(tournamentId);
    const currentPlayersMap = new Map(
      currentPlayersList.map((p) => [p.name, p])
    );

    const playersToKeepIds = new Set();
    let processedCount = 0;

    const insertPlayerSql = `
      INSERT INTO players (tournament_id, name, nickname, email, games_played, wins, losses, gender, skill_level, is_deleted, deleted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL)
    `; // Added email
    const updatePlayerSql = `
      UPDATE players
      SET nickname = ?, email = ?, gender = ?, skill_level = ?, games_played = ?, wins = ?, losses = ?, is_deleted = 0, deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `; // Added email
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
      const email = newPlayerData.email || null; // Added email
      const gender = newPlayerData.gender || null;
      const skill_level = newPlayerData.skill_level || null;
      const gamesPlayed = newPlayerData.GamesPlayed || 0;
      const wins = newPlayerData.Wins || 0;
      const losses = newPlayerData.Losses || 0;

      const existingPlayer = currentPlayersMap.get(name);

      try {
        if (existingPlayer) {
          updateStmt.run(
            nickname,
            email, // Added email
            gender,
            skill_level,
            gamesPlayed,
            wins,
            losses,
            existingPlayer.id
          );
          playersToKeepIds.add(existingPlayer.id);
          processedCount++;
        } else {
          const info = insertStmt.run(
            tournamentId,
            name,
            nickname,
            email, // Added email
            gamesPlayed,
            wins,
            losses,
            gender,
            skill_level
          );
          if (info.changes > 0) {
            processedCount++;
          }
        }
      } catch (error) {
        errors.push(
          `Erro ao processar jogador "${name}" para o torneio ${tournamentId}: ${error.message}`
        );
      }
    }

    const softDeleteStmt = db.prepare(
      'UPDATE players SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)'
    );
    for (const currentPlayer of currentPlayersList) {
      if (
        !playersToKeepIds.has(currentPlayer.id) &&
        (currentPlayer.is_deleted === 0 || currentPlayer.is_deleted === null)
      ) {
        softDeleteStmt.run(currentPlayer.id);
      }
    }
    addedCount = processedCount;
  });

  if (errors.length > 0) {
    logger.error(
      { component: 'PlayerModel', tournamentId, errors },
      'Erros durante replacePlayerListForTournament.'
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

  const columnMap = {
    id: 'id',
    name: 'name',
    nickname: 'nickname',
    email: 'email', // Added email
    games_played: 'games_played',
    wins: 'wins',
    losses: 'losses',
    gender: 'gender',
    skill_level: 'skill_level',
    tournament_id: 'tournament_id',
    created_at: 'created_at',
    updated_at: 'updated_at',
    is_deleted: 'is_deleted',
  };

  const effectiveOrderBy = columnMap[sortBy] || 'name';
  const effectiveOrder = ['ASC', 'DESC'].includes(order.toUpperCase())
    ? order.toUpperCase()
    : 'ASC';

  let sql = `SELECT * FROM players`;
  let countSql = `SELECT COUNT(*) as total FROM players`;
  const queryParams = [];
  const countQueryParams = [];

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
     if (filters.email && typeof filters.email === 'string') { // Added email filter
      whereClauses.push('email LIKE ?');
      queryParams.push(`%${filters.email}%`);
      countQueryParams.push(`%${filters.email}%`);
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
      whereClauses = whereClauses.filter(
        (clause) => !clause.includes('is_deleted')
      );
      whereClauses.push('is_deleted = ?');
      queryParams.push(filters.is_deleted ? 1 : 0);
      countQueryParams.push(filters.is_deleted ? 1 : 0);
    }
  }

  if (whereClauses.length > 0) {
    sql += ` WHERE ${whereClauses.join(' AND ')}`;
    countSql += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  sql += ` ORDER BY "${effectiveOrderBy}" ${effectiveOrder}`;

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
    const players = await queryAsync(sql, finalQueryParams);
    const totalResult = await getOneAsync(countSql, countQueryParams);
    return { players, total: totalResult ? totalResult.total : 0 };
  } catch (err) {
    logger.error(
      { component: 'PlayerModel', err },
      `Erro ao buscar todos os jogadores.`
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
    logger.error(
      { component: 'PlayerModel', err },
      'Erro ao contar jogadores.'
    );
    throw err;
  }
}

async function restorePlayer(playerId) {
  if (!playerId) {
    throw new Error('ID do jogador não fornecido para restauração.');
  }
  const sql =
    'UPDATE players SET is_deleted = 0, deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND is_deleted = 1';
  try {
    const result = await runAsync(sql, [playerId]);
    if (result.changes > 0) {
      logger.info(
        { component: 'PlayerModel', playerId },
        `Jogador ${playerId} restaurado da lixeira.`
      );
      auditLogger.logAction('SYSTEM', 'PLAYER_RESTORE', 'player', playerId.toString(), {});
      return true;
    }
    logger.warn(
      { component: 'PlayerModel', playerId },
      `Jogador ${playerId} não encontrado na lixeira ou não precisou de restauração.`
    );
    const player = await getPlayerById(playerId);
    return !!player;
  } catch (err) {
    logger.error(
      { component: 'PlayerModel', err, playerId },
      `Erro ao restaurar jogador ${playerId} da lixeira.`
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
  restorePlayer,
};
