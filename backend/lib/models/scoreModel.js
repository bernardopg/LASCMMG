const {
  queryAsync,
  runAsync,
  getOneAsync,
  transactionAsync,
} = require('../db/database');
const { logger } = require('../logger/logger');

async function getScoreById(scoreId) {
  if (!scoreId) {
    throw new Error('ID do score não fornecido');
  }
  const sql = 'SELECT * FROM scores WHERE id = ?';
  try {
    return await getOneAsync(sql, [scoreId]);
  } catch (err) {
    logger.error(
      'ScoreModel',
      `Erro ao buscar score com ID ${scoreId}: ${err.message}`,
      { scoreId, error: err }
    );
    throw err;
  }
}

async function getScoresByMatchId(matchId) {
  if (!matchId) {
    throw new Error('ID da partida não fornecido');
  }
  const sql =
    'SELECT * FROM scores WHERE match_id = ? ORDER BY completed_at DESC';
  try {
    return await queryAsync(sql, [matchId]);
  } catch (err) {
    logger.error(
      'ScoreModel',
      `Erro ao buscar scores para a partida ${matchId}: ${err.message}`,
      { matchId, error: err }
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
    INSERT INTO scores (match_id, player1_score, player2_score, winner_id, completed_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
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
    logger.error('ScoreModel', 'Erro ao adicionar score:', {
      error: err,
      scoreData,
    });
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
    return getScoreById(scoreId);
  }

  fieldsToUpdate.push('completed_at = CURRENT_TIMESTAMP');

  const sql = `
    UPDATE scores
    SET ${fieldsToUpdate.join(', ')}
    WHERE id = ?
  `;
  values.push(scoreId);

  try {
    const result = await runAsync(sql, values);
    if (result.changes === 0) {
      return null;
    }
    return await getScoreById(scoreId);
  } catch (err) {
    logger.error(
      'ScoreModel',
      `Erro ao atualizar score ${scoreId}: ${err.message}`,
      { scoreId, scoreData, error: err }
    );
    throw err;
  }
}

async function getScoresByTournamentId(tournamentId, options = {}) {
  if (!tournamentId) {
    throw new Error('ID do torneio não fornecido.');
  }

  const { limit, offset, orderBy = 'completed_at', order = 'DESC' } = options;

  const allowedOrderFields = [
    'id',
    'match_id',
    'round',
    'player1_score',
    'player2_score',
    'winner_id',
    'timestamp',
    'completed_at',
  ];
  const allowedOrderDirections = ['ASC', 'DESC'];

  let effectiveOrderBy = 'completed_at';
  if (allowedOrderFields.includes(orderBy)) {
    effectiveOrderBy = orderBy;
  }

  let effectiveOrder = 'DESC';
  if (allowedOrderDirections.includes(order.toUpperCase())) {
    effectiveOrder = order.toUpperCase();
  }

  let sql = `
    SELECT s.*, m.match_number, m.round as match_round, p1.name as player1_name, p2.name as player2_name, w.name as winner_name
    FROM scores s
    JOIN matches m ON s.match_id = m.id
    LEFT JOIN players p1 ON m.player1_id = p1.id
    LEFT JOIN players p2 ON m.player2_id = p2.id
    LEFT JOIN players w ON s.winner_id = w.id
    WHERE m.tournament_id = ?
    ORDER BY s.${effectiveOrderBy} ${effectiveOrder}
  `;

  const params = [tournamentId];
  const countSql = `
    SELECT COUNT(*) as total
    FROM scores s
    JOIN matches m ON s.match_id = m.id
    WHERE m.tournament_id = ?
  `;

  if (limit !== undefined) {
    sql += ' LIMIT ?';
    params.push(parseInt(limit, 10));
    if (offset !== undefined) {
      sql += ' OFFSET ?';
      params.push(parseInt(offset, 10));
    }
  }

  try {
    const scores = await queryAsync(sql, params);
    const totalResult = await getOneAsync(countSql, [tournamentId]);
    return { scores, total: totalResult ? totalResult.total : 0 };
  } catch (err) {
    logger.error(
      'ScoreModel',
      `Erro ao buscar scores para o torneio ${tournamentId}: ${err.message}`,
      { tournamentId, error: err }
    );
    throw err;
  }
}

async function deleteScoresByTournamentId(tournamentId) {
  if (!tournamentId) {
    throw new Error('ID do torneio não fornecido.');
  }
  const sql = `
    DELETE FROM scores
    WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = ?)
  `;
  try {
    const result = await runAsync(sql, [tournamentId]);
    return result.changes;
  } catch (err) {
    logger.error(
      'ScoreModel',
      `Erro ao deletar scores do torneio ${tournamentId}: ${err.message}`,
      { tournamentId, error: err }
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
        'SELECT id FROM scores WHERE match_id = ?'
      );
      const insertScoreStmt = db.prepare(`
        INSERT INTO scores (match_id, player1_score, player2_score, winner_id, completed_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
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
      'ScoreModel',
      `Erro na transação de importScores para torneio ${tournamentId}:`,
      { tournamentId, error: transactionError }
    );
    errors.push(`Erro geral na transação: ${transactionError.message}`);
  }

  if (errors.length > 0) {
    logger.warn(
      'ScoreModel',
      `Erros durante a importação de scores para o torneio ${tournamentId}.`,
      { tournamentId, errors }
    );
  }
  return { count: importedCount, errors };
}

async function countScores() {
  const sql = 'SELECT COUNT(*) as count FROM scores';
  try {
    const row = await getOneAsync(sql);
    return row ? row.count : 0;
  } catch (err) {
    logger.error('ScoreModel', 'Erro ao contar scores:', { error: err });
    throw err;
  }
}

module.exports = {
  getScoreById,
  getScoresByMatchId,
  addScore,
  updateScore,
  getScoresByTournamentId,
  deleteScoresByTournamentId,
  importScores,
  countScores,
};
