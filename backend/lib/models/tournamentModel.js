const {
  queryAsync,
  runAsync,
  getOneAsync,
  transactionAsync,
} = require('../db/database'); // Atualizado para database
const { logger } = require('../logger/logger'); // Importar logger

// Helper to add is_deleted filter for tournaments
const addTournamentIsDeletedFilter = (
  sql,
  params,
  includeDeleted = false,
  alias = 't'
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

async function getAllTournaments(options = {}) {
  let {
    orderBy = 'date',
    order = 'DESC',
    limit,
    offset,
    includeDeleted = false,
  } = options;

  // Whitelist and map orderBy fields to actual column names
  const columnMap = {
    id: 'id',
    name: 'name',
    date: 'date',
    status: 'status',
    created_at: 'created_at',
    updated_at: 'updated_at',
    is_deleted: 'is_deleted',
  };

  const effectiveOrderBy = columnMap[orderBy] || 'date'; // Default to 'date'
  const effectiveOrder = ['ASC', 'DESC'].includes(order.toUpperCase())
    ? order.toUpperCase()
    : 'DESC';

  let baseSql = `SELECT * FROM tournaments t`;
  let countBaseSql = 'SELECT COUNT(*) as total FROM tournaments t';

  const filtered = addTournamentIsDeletedFilter(baseSql, [], includeDeleted);
  let sql = filtered.sql;
  let params = filtered.params;

  const filteredCount = addTournamentIsDeletedFilter(
    countBaseSql,
    [],
    includeDeleted
  );
  let countSql = filteredCount.sql;
  let countParams = filteredCount.params;

  sql += ` ORDER BY t."${effectiveOrderBy}" ${effectiveOrder}`; // Use mapped and quoted column name

  if (limit) {
    sql += ` LIMIT ?`;
    params.push(parseInt(limit, 10));
    if (offset) {
      sql += ` OFFSET ?`;
      params.push(parseInt(offset, 10));
    }
  }

  try {
    const tournaments = await queryAsync(sql, params);
    const totalResult = await getOneAsync(countSql, countParams);
    return { tournaments, total: totalResult ? totalResult.total : 0 };
  } catch (err) {
    logger.error('TournamentModel', 'Erro ao buscar torneios:', { error: err });
    throw err;
  }
}

async function getTournamentById(id, includeDeleted = false) {
  if (!id) {
    throw new Error('ID do torneio não fornecido');
  }

  let { sql, params } = addTournamentIsDeletedFilter(
    'SELECT * FROM tournaments t WHERE t.id = ?',
    [id],
    includeDeleted
  );

  try {
    return await getOneAsync(sql, params);
  } catch (err) {
    logger.error(
      'TournamentModel',
      `Erro ao buscar torneio com ID ${id}: ${err.message}`,
      { id, error: err }
    );
    throw err;
  }
}

async function createTournament(tournament) {
  if (!tournament || !tournament.id || !tournament.name) {
    throw new Error('Dados do torneio incompletos');
  }

  const {
    id,
    name,
    date,
    description,
    num_players_expected,
    bracket_type = 'single-elimination',
    status = 'Pendente',
    state_json,
    entry_fee = 0.0,
    prize_pool = '',
    rules = '',
  } = tournament;

  const sql = `
    INSERT INTO tournaments (id, name, date, description, num_players_expected, bracket_type, status, entry_fee, prize_pool, rules, is_deleted, deleted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL)
  `;
  const sqlInsertState = `
    INSERT INTO tournament_state (tournament_id, state_json)
    VALUES (?, ?)
  `;

  try {
    await transactionAsync((db) => {
      db.prepare(sql).run(
        id,
        name,
        date,
        description,
        num_players_expected,
        bracket_type,
        status,
        entry_fee,
        prize_pool,
        rules
      );
      if (state_json) {
        db.prepare(sqlInsertState).run(id, state_json);
      }
    });
    return await getTournamentById(id);
  } catch (err) {
    logger.error('TournamentModel', 'Erro ao criar torneio e estado inicial:', {
      error: err,
      tournamentData: tournament,
    });
    throw err;
  }
}

async function updateTournament(id, data) {
  if (!id) {
    throw new Error('ID do torneio não fornecido');
  }
  if (!data || Object.keys(data).length === 0) {
    throw new Error('Nenhum dado fornecido para atualização');
  }

  const allowedFields = [
    'name',
    'date',
    'description',
    'num_players_expected',
    'bracket_type',
    'status',
    'entry_fee',
    'prize_pool',
    'rules',
    // is_deleted and deleted_at are handled by deleteTournament/restoreTournament
  ];

  const updates = Object.keys(data)
    .filter((key) => allowedFields.includes(key))
    .map((key) => ({ field: key, value: data[key] }));

  if (updates.length === 0) {
    // If only state_json is being updated, this path might be taken.
    // However, updateTournamentState handles state_json separately.
    // If no valid fields, just return current non-deleted tournament.
    return await getTournamentById(id);
  }

  const setClause = updates.map((update) => `${update.field} = ?`).join(', ');
  const sql = `
    UPDATE tournaments
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)
  `;
  const params = [...updates.map((update) => update.value), id];

  try {
    const result = await runAsync(sql, params);
    if (result.changes === 0) {
      const existing = await getTournamentById(id, true); // Check even if deleted
      if (existing && existing.is_deleted) {
        logger.warn(
          'TournamentModel',
          `Tentativa de atualizar torneio ${id} que está na lixeira.`,
          { id }
        );
        return null;
      }
      return null;
    }
    return await getTournamentById(id);
  } catch (err) {
    logger.error(
      'TournamentModel',
      `Erro ao atualizar torneio com ID ${id}: ${err.message}`,
      { id, data, error: err }
    );
    throw err;
  }
}

async function deleteTournament(id, permanent = false) {
  if (!id) {
    throw new Error('ID do torneio não fornecido');
  }

  if (permanent) {
    try {
      // Ensure the transaction callback uses the passed 'db' object for its operations
      await transactionAsync(async (db) => {
        // Pass 'db' to runAsync for operations within this transaction
        await runAsync(
          'DELETE FROM tournament_state WHERE tournament_id = ?',
          [id],
          db
        );
        await runAsync('DELETE FROM players WHERE tournament_id = ?', [id], db);
        await runAsync(
          'DELETE FROM scores WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = ?)',
          [id],
          db
        );
        await runAsync('DELETE FROM matches WHERE tournament_id = ?', [id], db);
        await runAsync('DELETE FROM tournaments WHERE id = ?', [id], db);
        // The logger call can remain outside if it doesn't need to be part of the transaction,
        // or inside if it should only log on successful commit.
        // For simplicity and atomicity of logging the success, it's fine here.
      });
      // Log success after the transaction has committed.
      logger.info(
        'TournamentModel',
        `Torneio ${id} e dados associados excluídos permanentemente.`,
        { id }
      );
      return true; // Indicate success
    } catch (err) {
      logger.error(
        'TournamentModel',
        `Erro ao excluir permanentemente o torneio ${id}: ${err.message}`,
        { id, error: err }
      );
      throw err;
    }
  } else {
    // Soft delete: update is_deleted and deleted_at, and set status to 'Cancelado'
    const sql = `
      UPDATE tournaments
      SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, status = 'Cancelado', updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)
    `;
    try {
      const result = await runAsync(sql, [id]);
      if (result.changes > 0) {
        logger.info(
          'TournamentModel',
          `Torneio ${id} movido para a lixeira (soft delete) e status definido como Cancelado.`,
          { id }
        );
        return true;
      }
      const existing = await getTournamentById(id, true);
      if (
        existing &&
        (existing.is_deleted || existing.status === 'Cancelado')
      ) {
        logger.info(
          'TournamentModel',
          `Torneio ${id} já estava na lixeira/cancelado. Nenhuma alteração.`,
          { id }
        );
        return true;
      }
      logger.warn(
        'TournamentModel',
        `Torneio ${id} não encontrado para soft delete ou já estava excluído/cancelado.`,
        { id }
      );
      return false;
    } catch (err) {
      logger.error(
        'TournamentModel',
        `Erro ao mover torneio ${id} para a lixeira: ${err.message}`,
        { id, error: err }
      );
      throw err;
    }
  }
}

async function restoreTournament(id) {
  if (!id) {
    throw new Error('ID do torneio não fornecido para restauração.');
  }
  // Set is_deleted to 0, clear deleted_at, and set status to 'Pendente' (or original if stored)
  const sql = `
    UPDATE tournaments
    SET is_deleted = 0, deleted_at = NULL, status = 'Pendente', updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND (is_deleted = 1 OR status = 'Cancelado')
  `;
  try {
    const result = await runAsync(sql, [id]);
    if (result.changes > 0) {
      logger.info(
        'TournamentModel',
        `Torneio ${id} restaurado da lixeira. Status definido como Pendente.`,
        { id }
      );
      return true;
    }
    logger.warn(
      'TournamentModel',
      `Torneio ${id} não encontrado na lixeira/cancelado ou não precisou de restauração.`,
      { id }
    );
    const tournament = await getTournamentById(id); // Check if it exists and is not deleted/canceled
    return (
      !!tournament &&
      tournament.status !== 'Cancelado' &&
      !tournament.is_deleted
    );
  } catch (err) {
    logger.error(
      'TournamentModel',
      `Erro ao restaurar torneio ${id} da lixeira: ${err.message}`,
      { id, error: err }
    );
    throw err;
  }
}

async function tournamentExists(id, includeDeleted = false) {
  // Added includeDeleted
  if (!id) {
    return false;
  }
  let { sql, params } = addTournamentIsDeletedFilter(
    'SELECT 1 FROM tournaments t WHERE t.id = ? LIMIT 1',
    [id],
    includeDeleted
  );
  try {
    const tournament = await getOneAsync(sql, params);
    return !!tournament;
  } catch (err) {
    logger.error(
      'TournamentModel',
      `Erro ao verificar existência do torneio ${id}: ${err.message}`,
      { id, error: err }
    );
    throw err; // Re-throw to indicate failure
  }
}

async function countTournaments(includeDeleted = false) {
  // Added includeDeleted
  let { sql, params } = addTournamentIsDeletedFilter(
    'SELECT COUNT(*) as count FROM tournaments t',
    [],
    includeDeleted
  );
  try {
    const result = await getOneAsync(sql, params);
    return result ? result.count : 0;
  } catch (err) {
    logger.error('TournamentModel', 'Erro ao contar torneios:', { error: err });
    throw err;
  }
}

async function importTournaments(tournaments) {
  if (!Array.isArray(tournaments) || tournaments.length === 0) {
    return 0;
  }
  let imported = 0;
  try {
    await transactionAsync((db) => {
      const stmtTournament = db.prepare(`
        INSERT INTO tournaments (id, name, date, description, num_players_expected, bracket_type, status, entry_fee, prize_pool, rules, updated_at, is_deleted, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 0, NULL)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name, date = excluded.date, description = excluded.description,
          num_players_expected = excluded.num_players_expected, bracket_type = excluded.bracket_type,
          status = excluded.status, entry_fee = excluded.entry_fee, prize_pool = excluded.prize_pool,
          rules = excluded.rules, updated_at = CURRENT_TIMESTAMP,
          is_deleted = 0, deleted_at = NULL /* Ensure restored on conflict update */
      `);
      const stmtState = db.prepare(`
        INSERT INTO tournament_state (tournament_id, state_json) VALUES (?, ?)
        ON CONFLICT(tournament_id) DO UPDATE SET state_json = excluded.state_json
      `);

      for (const tournament of tournaments) {
        if (!tournament.id || !tournament.name) {
          logger.warn(
            'TournamentModel',
            'Ignorando torneio com dados incompletos durante importação.',
            { tournamentData: tournament }
          );
          continue;
        }
        const {
          id,
          name,
          date,
          description,
          num_players_expected,
          bracket_type = 'single-elimination',
          status = 'Pendente',
          state_json,
          entry_fee = 0.0,
          prize_pool = '',
          rules = '',
        } = tournament;
        stmtTournament.run(
          id,
          name,
          date,
          description,
          num_players_expected,
          bracket_type,
          status,
          entry_fee,
          prize_pool,
          rules
        );
        const stateJsonString =
          typeof state_json === 'object' && state_json !== null
            ? JSON.stringify(state_json)
            : typeof state_json === 'string'
              ? state_json
              : null;
        if (stateJsonString) stmtState.run(id, stateJsonString);
        imported++;
      }
    });
    return imported;
  } catch (err) {
    logger.error('TournamentModel', 'Erro ao importar torneios:', {
      error: err,
    });
    throw err;
  }
}

async function getTournamentStats() {
  // Should respect soft delete for counts
  try {
    const stats = {
      active: 0,
      completed: 0,
      scheduled: 0,
      canceled: 0,
      other: 0,
      total: 0,
    };
    const sql = `
      SELECT status, COUNT(*) as count
      FROM tournaments
      WHERE (is_deleted = 0 OR is_deleted IS NULL) /* Exclude soft-deleted from general stats */
      GROUP BY status
    `;
    const results = await queryAsync(sql);
    results.forEach((row) => {
      stats.total += row.count;
      switch (row.status) {
        case 'Em Andamento':
          stats.active = row.count;
          break;
        case 'Concluído':
          stats.completed = row.count;
          break;
        case 'Pendente':
          stats.scheduled = row.count;
          break;
        case 'Cancelado':
          stats.canceled = row.count;
          break; // 'Cancelado' might be a form of soft delete
        default:
          stats.other += row.count;
          logger.warn(
            'TournamentModel',
            'Status de torneio não mapeado em getTournamentStats.',
            { status: row.status, count: row.count }
          );
          break;
      }
    });
    // Count explicitly soft-deleted if not covered by 'Cancelado'
    const softDeletedCountResult = await getOneAsync(
      "SELECT COUNT(*) as count FROM tournaments WHERE is_deleted = 1 AND status != 'Cancelado'"
    );
    stats.softDeleted = softDeletedCountResult
      ? softDeletedCountResult.count
      : 0;

    return stats;
  } catch (err) {
    logger.error('TournamentModel', 'Erro ao obter estatísticas de torneios:', {
      error: err,
    });
    throw err;
  }
}

async function updateTournamentState(id, stateJson) {
  if (!id || typeof stateJson !== 'string') {
    throw new Error('ID do torneio e stateJson (string) são obrigatórios.');
  }
  const sql = `
    INSERT OR REPLACE INTO tournament_state (tournament_id, state_json)
    VALUES (?, ?)
  `;
  try {
    const result = await runAsync(sql, [id, stateJson]);
    return result.changes > 0;
  } catch (err) {
    logger.error(
      'TournamentModel',
      `Erro ao atualizar/inserir state_json para torneio ${id}: ${err.message}`,
      { id, error: err }
    );
    throw err;
  }
}

async function updateTournamentStatus(id, newStatus) {
  if (!id || !newStatus) {
    throw new Error('ID do torneio e novo status são obrigatórios.');
  }
  // If setting to 'Cancelado', also soft delete. If un-canceling, un-soft-delete.
  let additionalUpdates = '';
  if (newStatus === 'Cancelado') {
    additionalUpdates = ', is_deleted = 1, deleted_at = CURRENT_TIMESTAMP';
  } else if (newStatus !== 'Cancelado') {
    // Potentially un-deleting if status changes from Cancelado
    additionalUpdates = ', is_deleted = 0, deleted_at = NULL';
  }

  const sql = `
    UPDATE tournaments
    SET status = ?, updated_at = CURRENT_TIMESTAMP ${additionalUpdates}
    WHERE id = ?
  `;
  try {
    const result = await runAsync(sql, [newStatus, id]);
    return result.changes > 0;
  } catch (err) {
    logger.error(
      'TournamentModel',
      `Erro ao atualizar status para torneio ${id}: ${err.message}`,
      { id, newStatus, error: err }
    );
    throw err;
  }
}

async function getTournamentsByStatus(statuses = [], options = {}) {
  if (!Array.isArray(statuses) || statuses.length === 0) {
    return getAllTournaments(options);
  }
  const placeholders = statuses.map(() => '?').join(',');
  let {
    orderBy = 'date',
    order = 'DESC',
    limit,
    offset,
    includeDeleted = false,
  } = options;

  const columnMap = {
    id: 'id',
    name: 'name',
    date: 'date',
    status: 'status',
    created_at: 'created_at',
    updated_at: 'updated_at',
    is_deleted: 'is_deleted', // Though filtering by status might make is_deleted sort less relevant unless viewing all
  };

  const effectiveOrderBy = columnMap[orderBy] || 'date';
  const effectiveOrder = ['ASC', 'DESC'].includes(order.toUpperCase())
    ? order.toUpperCase()
    : 'DESC';

  let baseSql = `SELECT * FROM tournaments t WHERE status IN (${placeholders})`;
  let countBaseSql = `SELECT COUNT(*) as total FROM tournaments t WHERE status IN (${placeholders})`;

  const baseParams = [...statuses];

  const filtered = addTournamentIsDeletedFilter(
    baseSql,
    [...baseParams],
    includeDeleted
  );
  let sql = filtered.sql;
  let params = filtered.params;

  const filteredCount = addTournamentIsDeletedFilter(
    countBaseSql,
    [...baseParams],
    includeDeleted
  );
  let countSql = filteredCount.sql;
  let countParams = filteredCount.params;

  sql += ` ORDER BY t."${effectiveOrderBy}" ${effectiveOrder}`; // Use mapped and quoted column name

  if (limit) {
    sql += ` LIMIT ?`;
    params.push(parseInt(limit, 10));
    if (offset) {
      sql += ` OFFSET ?`;
      params.push(parseInt(offset, 10));
    }
  }

  try {
    const tournaments = await queryAsync(sql, params);
    const totalResult = await getOneAsync(countSql, countParams);
    return { tournaments, total: totalResult ? totalResult.total : 0 };
  } catch (err) {
    logger.error('TournamentModel', 'Erro ao buscar torneios por status:', {
      statuses,
      error: err,
    });
    throw err;
  }
}

module.exports = {
  getAllTournaments,
  getTournamentById,
  createTournament,
  updateTournament,
  deleteTournament,
  restoreTournament, // Added restoreTournament
  tournamentExists,
  countTournaments,
  importTournaments,
  getTournamentStats,
  updateTournamentState,
  updateTournamentStatus,
  getTournamentsByStatus,
};
