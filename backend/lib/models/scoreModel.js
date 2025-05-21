const {
  queryAsync,
  runAsync,
  getOneAsync,
  transactionAsync,
} = require('../db/database');
const { logger } = require('../logger/logger');

// Helper to add is_deleted filter for scores
const addScoreIsDeletedFilter = (
  sql,
  params,
  includeDeleted = false,
  alias = 's'
) => {
  if (!includeDeleted) {
    if (sql.toUpperCase().includes('WHERE')) {
      sql += ` AND (${alias}.is_deleted = 0 OR ${alias}.is_deleted IS NULL)`;
    } else {
      sql += ` WHERE (${alias}.is_deleted = 0 OR ${alias}.is_deleted IS NULL)`;
    }
  }
  return { sql, params };
};

async function getScoreById(scoreId, includeDeleted = false) {
  if (!scoreId) {
    throw new Error('ID do score não fornecido');
  }
  let { sql, params } = addScoreIsDeletedFilter(
    'SELECT * FROM scores s WHERE s.id = ?',
    [scoreId],
    includeDeleted
  );
  try {
    return await getOneAsync(sql, params);
  } catch (err) {
    logger.error(
      { component: 'ScoreModel', err, scoreId },
      `Erro ao buscar score com ID ${scoreId}.`
    );
    throw err;
  }
}

async function getScoresByMatchId(matchId, includeDeleted = false) {
  if (!matchId) {
    throw new Error('ID da partida não fornecido');
  }
  let { sql, params } = addScoreIsDeletedFilter(
    'SELECT * FROM scores s WHERE s.match_id = ?',
    [matchId],
    includeDeleted
  );
  sql += ' ORDER BY s.completed_at DESC';
  try {
    return await queryAsync(sql, params);
  } catch (err) {
    logger.error(
      { component: 'ScoreModel', err, matchId },
      `Erro ao buscar scores para a partida ${matchId}.`
    );
    throw err;
  }
}

async function addScore(scoreData) {
  const { match_id, player1_score, player2_score, winner_id } = scoreData;
  if (
    match_id === undefined ||
    player1_score === undefined ||
    player2_score === undefined
  ) {
    throw new Error(
      'match_id, player1_score e player2_score são obrigatórios.'
    );
  }

  const sql = `
    INSERT INTO scores (match_id, player1_score, player2_score, winner_id, completed_at, is_deleted, deleted_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 0, NULL)
  `;
  try {
    const result = await runAsync(sql, [
      match_id,
      player1_score,
      player2_score,
      winner_id || null,
    ]);
    return await getScoreById(result.lastInsertRowid);
  } catch (err) {
    logger.error(
      { component: 'ScoreModel', err, scoreData },
      'Erro ao adicionar score.'
    );
    throw err;
  }
}

async function updateScore(scoreId, scoreData) {
  if (!scoreId) {
    throw new Error('ID do score não fornecido');
  }
  const { player1_score, player2_score, winner_id } = scoreData;

  const fieldsToUpdate = [];
  const values = [];

  if (player1_score !== undefined) {
    fieldsToUpdate.push('player1_score = ?');
    values.push(player1_score);
  }
  if (player2_score !== undefined) {
    fieldsToUpdate.push('player2_score = ?');
    values.push(player2_score);
  }
  if (winner_id !== undefined) {
    fieldsToUpdate.push('winner_id = ?');
    values.push(winner_id);
  }

  if (fieldsToUpdate.length === 0) {
    return getScoreById(scoreId); // Will respect soft-delete status
  }

  fieldsToUpdate.push('completed_at = CURRENT_TIMESTAMP'); // Or updated_at if schema changes

  const sql = `
    UPDATE scores
    SET ${fieldsToUpdate.join(', ')}
    WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)
  `; // Only update non-deleted scores
  values.push(scoreId);

  try {
    const result = await runAsync(sql, values);
    if (result.changes === 0) {
      const existing = await getScoreById(scoreId, true);
      if (existing && existing.is_deleted) {
        logger.warn(
          { component: 'ScoreModel', scoreId },
          `Tentativa de atualizar score ${scoreId} que está na lixeira.`
        );
        return null;
      }
      return null;
    }
    return await getScoreById(scoreId);
  } catch (err) {
    logger.error(
      { component: 'ScoreModel', err, scoreId, scoreData },
      `Erro ao atualizar score ${scoreId}.`
    );
    throw err;
  }
}

async function deleteScore(scoreId, permanent = false) {
  if (!scoreId) {
    throw new Error('ID do score não fornecido');
  }
  if (permanent) {
    const sql = 'DELETE FROM scores WHERE id = ?';
    try {
      const result = await runAsync(sql, [scoreId]);
      logger.info(
        { component: 'ScoreModel', scoreId },
        `Score ${scoreId} excluído permanentemente.`
      );
      return result.changes > 0;
    } catch (err) {
      logger.error(
        { component: 'ScoreModel', err, scoreId },
        `Erro ao excluir permanentemente score ${scoreId}.`
      );
      throw err;
    }
  } else {
    const sql =
      'UPDATE scores SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)';
    try {
      const result = await runAsync(sql, [scoreId]);
      if (result.changes > 0) {
        logger.info(
          { component: 'ScoreModel', scoreId },
          `Score ${scoreId} movido para a lixeira (soft delete).`
        );
        return true;
      }
      const existing = await getScoreById(scoreId, true);
      if (existing && existing.is_deleted) {
        logger.info(
          { component: 'ScoreModel', scoreId },
          `Score ${scoreId} já estava na lixeira.`
        );
        return true;
      }
      logger.warn(
        { component: 'ScoreModel', scoreId },
        `Score ${scoreId} não encontrado para soft delete ou já estava excluído.`
      );
      return false;
    } catch (err) {
      logger.error(
        { component: 'ScoreModel', err, scoreId },
        `Erro ao mover score ${scoreId} para a lixeira.`
      );
      throw err;
    }
  }
}

async function getScoresByTournamentId(tournamentId, options = {}) {
  if (!tournamentId) {
    throw new Error('ID do torneio não fornecido.');
  }

  const {
    limit,
    offset,
    orderBy = 'completed_at',
    order = 'DESC',
    includeDeleted = false,
  } = options;

  // Whitelist and map orderBy fields to actual column expressions
  const columnMap = {
    id: 's.id',
    match_id: 's.match_id',
    round: 'm.round', // Assuming m is the alias for matches table
    player1_score: 's.player1_score',
    player2_score: 's.player2_score',
    winner_id: 's.winner_id',
    completed_at: 's.completed_at',
    player1_name: 'p1.name', // Assuming p1 is the alias for players table
    player2_name: 'p2.name', // Assuming p2 is the alias for players table
    winner_name: 'w.name', // Assuming w is the alias for winner player table
    is_deleted: 's.is_deleted',
  };

  const effectiveOrderBy = columnMap[orderBy] || 's.completed_at'; // Default to 's.completed_at'
  const effectiveOrder = ['ASC', 'DESC'].includes(order.toUpperCase())
    ? order.toUpperCase()
    : 'DESC';

  let baseSql = `
    SELECT s.*, m.match_number, m.round as match_round, p1.name as player1_name, p2.name as player2_name, w.name as winner_name
    FROM scores s
    JOIN matches m ON s.match_id = m.id
    LEFT JOIN players p1 ON m.player1_id = p1.id
    LEFT JOIN players p2 ON m.player2_id = p2.id
    LEFT JOIN players w ON s.winner_id = w.id
    WHERE m.tournament_id = ?
  `;
  const baseParams = [tournamentId];

  let countBaseSql = `
    SELECT COUNT(s.id) as total
    FROM scores s
    JOIN matches m ON s.match_id = m.id
    WHERE m.tournament_id = ?
  `;

  const filtered = addScoreIsDeletedFilter(
    baseSql,
    [...baseParams],
    includeDeleted
  );
  let sql = filtered.sql;
  let params = filtered.params;

  const filteredCount = addScoreIsDeletedFilter(
    countBaseSql,
    [...baseParams],
    includeDeleted
  );
  let countSql = filteredCount.sql;
  let countParams = filteredCount.params;

  // ORDER BY clause using mapped and quoted identifiers where appropriate
  // If effectiveOrderBy contains '.', it's likely an aliased column like 's.id'
  const orderByClause = effectiveOrderBy.includes('.')
    ? effectiveOrderBy
    : `"${effectiveOrderBy}"`;
  sql += ` ORDER BY ${orderByClause} ${effectiveOrder}`;

  if (limit !== undefined && limit !== -1 && limit !== null) {
    sql += ' LIMIT ?';
    params.push(parseInt(limit, 10));
    if (offset !== undefined && offset !== null) {
      sql += ' OFFSET ?';
      params.push(parseInt(offset, 10));
    }
  }

  try {
    const scores = await queryAsync(sql, params);
    const totalResult = await getOneAsync(countSql, countParams);
    return { scores, total: totalResult ? totalResult.total : 0 };
  } catch (err) {
    logger.error(
      { component: 'ScoreModel', err, tournamentId },
      `Erro ao buscar scores para o torneio ${tournamentId}.`
    );
    throw err;
  }
}

async function deleteScoresByTournamentId(tournamentId, permanent = false) {
  // Added permanent flag
  if (!tournamentId) {
    throw new Error('ID do torneio não fornecido.');
  }
  let sql;
  if (permanent) {
    sql = `
      DELETE FROM scores
      WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = ?)
    `;
  } else {
    // Soft delete scores associated with the tournament
    sql = `
      UPDATE scores
      SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP
      WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = ?)
      AND (is_deleted = 0 OR is_deleted IS NULL)
    `;
  }
  try {
    const result = await runAsync(sql, [tournamentId]);
    logger.info(
      {
        component: 'ScoreModel',
        tournamentId,
        count: result.changes,
        permanent,
      },
      `${result.changes} scores do torneio ${tournamentId} ${permanent ? 'excluídos permanentemente' : 'movidos para lixeira'}.`
    );
    return result.changes;
  } catch (err) {
    logger.error(
      { component: 'ScoreModel', err, tournamentId, permanent },
      `Erro ao ${permanent ? 'deletar permanentemente scores' : 'mover scores para lixeira'} do torneio ${tournamentId}.`
    );
    throw err;
  }
}

async function importScores(tournamentId, scoresData) {
  if (!tournamentId || !Array.isArray(scoresData)) {
    throw new Error('ID do torneio e array de scores são obrigatórios.');
  }

  let importedCount = 0;
  const errors = [];

  try {
    await transactionAsync((db) => {
      const matchCache = new Map();
      const getMatchIdByNumberStmt = db.prepare(
        'SELECT id FROM matches WHERE tournament_id = ? AND match_number = ?'
      );
      const getExistingScoreStmt = db.prepare(
        // Check for non-deleted scores
        'SELECT id FROM scores WHERE match_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)'
      );
      const insertScoreStmt = db.prepare(`
        INSERT INTO scores (match_id, player1_score, player2_score, winner_id, completed_at, is_deleted, deleted_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 0, NULL)
      `);

      for (const scoreJson of scoresData) {
        try {
          let matchDbId = matchCache.get(scoreJson.matchId);
          if (matchDbId === undefined) {
            const matchInDb = getMatchIdByNumberStmt.get(
              tournamentId,
              scoreJson.matchId
            );
            if (matchInDb) {
              matchDbId = matchInDb.id;
              matchCache.set(scoreJson.matchId, matchDbId);
            } else {
              errors.push(
                `Partida com match_number ${scoreJson.matchId} não encontrada para o torneio ${tournamentId}. Score ignorado: ${JSON.stringify(scoreJson)}`
              );
              continue;
            }
          }

          const existingScore = getExistingScoreStmt.get(matchDbId);
          if (existingScore) {
            logger.warn(
              {
                component: 'ScoreModel',
                matchDbId,
                matchNumber: scoreJson.matchId,
              },
              `Score para partida ${matchDbId} (match_number ${scoreJson.matchId}) já existe e não foi sobrescrito.`
            );
            continue;
          }

          const winner_id = scoreJson.winner_id || null;

          const scoreEntry = {
            match_id: matchDbId,
            player1_score: parseInt(scoreJson.score1, 10),
            player2_score: parseInt(scoreJson.score2, 10),
            winner_id: winner_id,
          };

          const info = insertScoreStmt.run(
            scoreEntry.match_id,
            scoreEntry.player1_score,
            scoreEntry.player2_score,
            scoreEntry.winner_id
          );

          if (info.changes > 0) {
            importedCount++;
          }
        } catch (error) {
          errors.push(
            `Erro ao processar score ${JSON.stringify(scoreJson)}: ${error.message}`
          );
        }
      }
    });
  } catch (transactionError) {
    logger.error(
      { component: 'ScoreModel', err: transactionError, tournamentId },
      `Erro na transação de importScores para torneio ${tournamentId}.`
    );
    errors.push(`Erro geral na transação: ${transactionError.message}`);
  }

  if (errors.length > 0) {
    logger.warn(
      { component: 'ScoreModel', tournamentId, errors },
      `Erros durante a importação de scores para o torneio ${tournamentId}.`
    );
  }
  return { count: importedCount, errors };
}

async function countScores(includeDeleted = false) {
  let { sql, params } = addScoreIsDeletedFilter(
    'SELECT COUNT(*) as count FROM scores s', // Added alias 's'
    [],
    includeDeleted,
    's' // Pass alias to helper
  );

  try {
    const row = await getOneAsync(sql, params);
    return row ? row.count : 0;
  } catch (err) {
    logger.error({ component: 'ScoreModel', err }, 'Erro ao contar scores.');
    throw err;
  }
}

async function getAllScores(options = {}) {
  const {
    limit,
    offset,
    sortBy = 'completed_at',
    order = 'DESC',
    filters = {},
    includeDeleted = false,
  } = options;

  // Whitelist and map sortBy fields to actual column expressions
  const columnMap = {
    id: 's.id',
    match_id: 's.match_id',
    round: 'm.round',
    player1_score: 's.player1_score',
    player2_score: 's.player2_score',
    winner_id: 's.winner_id',
    completed_at: 's.completed_at',
    player1_name: 'p1.name',
    player2_name: 'p2.name',
    winner_name: 'w.name',
    tournament_name: 't.name',
    is_deleted: 's.is_deleted',
  };

  const effectiveOrderBy = columnMap[sortBy] || 's.completed_at'; // Default to 's.completed_at'
  const effectiveOrder = ['ASC', 'DESC'].includes(order.toUpperCase())
    ? order.toUpperCase()
    : 'DESC';

  let baseSql = `
    SELECT s.*,
           m.match_number, m.round as match_round, m.tournament_id,
           p1.name as player1_name,
           p2.name as player2_name,
           w.name as winner_name,
           t.name as tournament_name
    FROM scores s
    JOIN matches m ON s.match_id = m.id
    JOIN tournaments t ON m.tournament_id = t.id
    LEFT JOIN players p1 ON m.player1_id = p1.id
    LEFT JOIN players p2 ON m.player2_id = p2.id
    LEFT JOIN players w ON s.winner_id = w.id
  `;
  let countBaseSql = `
    SELECT COUNT(s.id) as total
    FROM scores s
    JOIN matches m ON s.match_id = m.id
    JOIN tournaments t ON m.tournament_id = t.id
  `;

  const queryParams = []; // For the main query
  const countQueryParams = []; // For the count query
  let whereClauses = [];

  if (!includeDeleted) {
    whereClauses.push('(s.is_deleted = 0 OR s.is_deleted IS NULL)');
  }

  if (filters) {
    if (filters.tournament_id) {
      whereClauses.push('m.tournament_id = ?');
      queryParams.push(filters.tournament_id);
      countQueryParams.push(filters.tournament_id);
    }
    if (filters.playerName && typeof filters.playerName === 'string') {
      whereClauses.push('(p1.name LIKE ? OR p2.name LIKE ? OR w.name LIKE ?)');
      queryParams.push(
        `%${filters.playerName}%`,
        `%${filters.playerName}%`,
        `%${filters.playerName}%`
      );
      countQueryParams.push(
        `%${filters.playerName}%`,
        `%${filters.playerName}%`,
        `%${filters.playerName}%`
      );
    }
    if (filters.match_round && typeof filters.match_round === 'string') {
      whereClauses.push('m.round = ?');
      queryParams.push(filters.match_round);
      countQueryParams.push(filters.match_round);
    }
    if (filters.winner_id) {
      whereClauses.push('s.winner_id = ?');
      queryParams.push(filters.winner_id);
      countQueryParams.push(filters.winner_id);
    }
    if (filters.match_id) {
      whereClauses.push('s.match_id = ?');
      queryParams.push(filters.match_id);
      countQueryParams.push(filters.match_id);
    }
    if (filters.is_deleted !== undefined) {
      // Explicitly filter by is_deleted
      whereClauses = whereClauses.filter(
        (clause) => !clause.includes('s.is_deleted')
      ); // Remove default
      whereClauses.push('s.is_deleted = ?');
      queryParams.push(filters.is_deleted ? 1 : 0);
      countQueryParams.push(filters.is_deleted ? 1 : 0);
    }
  }

  if (whereClauses.length > 0) {
    const whereString = ` WHERE ${whereClauses.join(' AND ')}`;
    baseSql += whereString;
    countBaseSql += whereString;
  }

  // ORDER BY clause using mapped and quoted identifiers where appropriate
  const orderByClause = effectiveOrderBy.includes('.')
    ? effectiveOrderBy
    : `"${effectiveOrderBy}"`;
  let sql = baseSql + ` ORDER BY ${orderByClause} ${effectiveOrder}`;
  let countSql = countBaseSql; // countSql does not need ORDER BY

  // Create a new array for the final query with pagination params
  const finalQueryParams = [...queryParams]; // queryParams are already built for the WHERE clauses

  if (limit !== undefined && limit !== -1 && limit !== null) {
    sql += ' LIMIT ?';
    finalQueryParams.push(parseInt(limit, 10));
    if (offset !== undefined && offset !== null) {
      sql += ' OFFSET ?';
      finalQueryParams.push(parseInt(offset, 10));
    }
  }

  try {
    const scores = await queryAsync(sql, finalQueryParams);
    const totalResult = await getOneAsync(countSql, countQueryParams); // countQueryParams for count
    return { scores, total: totalResult ? totalResult.total : 0 };
  } catch (err) {
    logger.error(
      { component: 'ScoreModel', err, filters },
      `Erro ao buscar todos os scores.`
    );
    throw err;
  }
}

module.exports = {
  getScoreById,
  getScoresByMatchId,
  addScore,
  updateScore,
  deleteScore, // Added new function
  getScoresByTournamentId,
  deleteScoresByTournamentId,
  importScores,
  countScores,
  getAllScores,
  restoreScore, // Added restoreScore
};

// This function is already defined below, ensure it's the one being used or remove redundancy if it's defined twice.
// async function restoreScore(scoreId) {
//   if (!scoreId) {
//     throw new Error('ID do score não fornecido para restauração.');
//   }
//   // Set is_deleted to 0 and clear deleted_at
//   // Also update completed_at or add an updated_at if schema changes
//   const sql =
//     'UPDATE scores SET is_deleted = 0, deleted_at = NULL, completed_at = CURRENT_TIMESTAMP WHERE id = ? AND is_deleted = 1';
//   try {
//     const result = await runAsync(sql, [scoreId]);
//     if (result.changes > 0) {
//       logger.info('ScoreModel', `Score ${scoreId} restaurado da lixeira.`, {
//         scoreId,
//       });
//       return true;
//     }
//     logger.warn(
//       'ScoreModel',
//       `Score ${scoreId} não encontrado na lixeira ou não precisou de restauração.`,
//       { scoreId }
//     );
//     const score = await getScoreById(scoreId); // Check if it exists and is not deleted
//     return !!score;
//   } catch (err) {
//     logger.error(
//       'ScoreModel',
//       `Erro ao restaurar score ${scoreId} da lixeira: ${err.message}`,
//       { scoreId, error: err }
//     );
//     throw err;
//   }
// }

// module.exports = {
//   getScoreById,
//   getScoresByMatchId,
//   addScore,
//   updateScore,
//   deleteScore,
//   getScoresByTournamentId,
//   deleteScoresByTournamentId,
//   importScores,
//   countScores,
//   getAllScores,
//   restoreScore, // Added restoreScore
// };

// The actual restoreScore function definition is below
async function restoreScore(scoreId) {
  if (!scoreId) {
    throw new Error('ID do score não fornecido para restauração.');
  }
  // Set is_deleted to 0 and clear deleted_at
  // Also update completed_at or add an updated_at if schema changes
  const sql =
    'UPDATE scores SET is_deleted = 0, deleted_at = NULL, completed_at = CURRENT_TIMESTAMP WHERE id = ? AND is_deleted = 1';
  try {
    const result = await runAsync(sql, [scoreId]);
    if (result.changes > 0) {
      logger.info('ScoreModel', `Score ${scoreId} restaurado da lixeira.`, {
        scoreId,
      });
      return true;
    }
    logger.warn(
      'ScoreModel',
      `Score ${scoreId} não encontrado na lixeira ou não precisou de restauração.`,
      { scoreId }
    );
    const score = await getScoreById(scoreId); // Check if it exists and is not deleted
    return !!score;
  } catch (err) {
    logger.error(
      { component: 'ScoreModel', err, scoreId },
      `Erro ao restaurar score ${scoreId} da lixeira.`
    );
    throw err;
  }
}

// module.exports is defined once at the top now.
