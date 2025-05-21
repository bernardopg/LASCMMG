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

  const columnMap = {
    id: 'id',
    name: 'name',
    date: 'date',
    status: 'status',
    created_at: 'created_at',
    updated_at: 'updated_at',
    is_deleted: 'is_deleted',
  };

  const effectiveOrderBy = columnMap[orderBy] || 'date';
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

  sql += ` ORDER BY t."${effectiveOrderBy}" ${effectiveOrder}`;

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
    logger.error(
      { component: 'TournamentModel', err },
      'Erro ao buscar torneios.'
    );
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
      { component: 'TournamentModel', err, id },
      `Erro ao buscar torneio com ID ${id}.`
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
  // Changed to INSERT OR REPLACE for robustness
  const sqlInsertOrReplaceState = `
    INSERT OR REPLACE INTO tournament_state (tournament_id, state_json)
    VALUES (?, ?)
  `;

  try {
    // console.log('DEBUG TournamentModel createTournament input tournament object:', JSON.stringify(tournament));
    const valuesToBind = [
      id,
      name,
      date instanceof Date ? date.toISOString() : date, // Joi validation should ensure date is in correct format
      description,
      num_players_expected,
      bracket_type,
      status,
      entry_fee,
      prize_pool,
      rules,
    ];
    // console.log('DEBUG TournamentModel createTournament valuesToBind:', JSON.stringify(valuesToBind));

    await transactionAsync((db) => {
      db.prepare(sql).run(...valuesToBind);
      if (state_json) {
        db.prepare(sqlInsertOrReplaceState).run(id, state_json);
      }
    });
    return await getTournamentById(id);
  } catch (err) {
    logger.error(
      { component: 'TournamentModel', err, tournamentData: tournament },
      'Erro ao criar torneio e estado inicial.'
    );
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
  ];

  const updates = Object.keys(data)
    .filter((key) => allowedFields.includes(key))
    .map((key) => ({ field: key, value: data[key] }));

  if (updates.length === 0) {
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
      const existing = await getTournamentById(id, true);
      if (existing && existing.is_deleted) {
        logger.warn(
          { component: 'TournamentModel', id },
          `Tentativa de atualizar torneio ${id} que está na lixeira.`
        );
        return null;
      }
      return null;
    }
    return await getTournamentById(id);
  } catch (err) {
    logger.error(
      { component: 'TournamentModel', err, id, data },
      `Erro ao atualizar torneio com ID ${id}.`
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
      await transactionAsync((transactionDb) => {
        transactionDb
          .prepare('DELETE FROM tournament_state WHERE tournament_id = ?')
          .run(id);
        transactionDb
          .prepare('DELETE FROM players WHERE tournament_id = ?')
          .run(id);
        transactionDb
          .prepare(
            'DELETE FROM scores WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = ?)'
          )
          .run(id);
        transactionDb
          .prepare('DELETE FROM matches WHERE tournament_id = ?')
          .run(id);
        transactionDb.prepare('DELETE FROM tournaments WHERE id = ?').run(id);
      });
      logger.info(
        { component: 'TournamentModel', id },
        `Torneio ${id} e dados associados excluídos permanentemente.`
      );
      return true;
    } catch (err) {
      logger.error(
        { component: 'TournamentModel', err, id },
        `Erro ao excluir permanentemente o torneio ${id}.`
      );
      throw err;
    }
  } else {
    const sql = `
      UPDATE tournaments
      SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, status = 'Cancelado', updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)
    `;
    try {
      const result = await runAsync(sql, [id]);
      if (result.changes > 0) {
        logger.info(
          { component: 'TournamentModel', id },
          `Torneio ${id} movido para a lixeira (soft delete) e status definido como Cancelado.`
        );
        return true;
      }
      const existing = await getTournamentById(id, true);
      if (
        existing &&
        (existing.is_deleted || existing.status === 'Cancelado')
      ) {
        logger.info(
          { component: 'TournamentModel', id },
          `Torneio ${id} já estava na lixeira/cancelado. Nenhuma alteração.`
        );
        return true;
      }
      logger.warn(
        { component: 'TournamentModel', id },
        `Torneio ${id} não encontrado para soft delete (ou já estava nesse estado).`
      );
      return false;
    } catch (err) {
      logger.error(
        { component: 'TournamentModel', err, id },
        `Erro ao mover torneio ${id} para a lixeira.`
      );
      throw err;
    }
  }
}

async function restoreTournament(id) {
  if (!id) {
    throw new Error('ID do torneio não fornecido para restauração.');
  }
  const sql = `
    UPDATE tournaments
    SET is_deleted = 0, deleted_at = NULL, status = 'Pendente', updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND (is_deleted = 1 OR status = 'Cancelado')
  `;
  try {
    const result = await runAsync(sql, [id]);
    if (result.changes > 0) {
      logger.info(
        { component: 'TournamentModel', id },
        `Torneio ${id} restaurado da lixeira. Status definido como Pendente.`
      );
      return true;
    }
    logger.warn(
      { component: 'TournamentModel', id },
      `Torneio ${id} não encontrado na lixeira/cancelado ou não precisou de restauração.`
    );
    const tournament = await getTournamentById(id);
    return (
      !!tournament &&
      tournament.status !== 'Cancelado' &&
      !tournament.is_deleted
    );
  } catch (err) {
    logger.error(
      { component: 'TournamentModel', err, id },
      `Erro ao restaurar torneio ${id} da lixeira.`
    );
    throw err;
  }
}

async function tournamentExists(id, includeDeleted = false) {
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
      { component: 'TournamentModel', err, id },
      `Erro ao verificar existência do torneio ${id}.`
    );
    throw err;
  }
}

async function countTournaments(includeDeleted = false) {
  let { sql, params } = addTournamentIsDeletedFilter(
    'SELECT COUNT(*) as count FROM tournaments t',
    [],
    includeDeleted
  );
  try {
    const result = await getOneAsync(sql, params);
    return result ? result.count : 0;
  } catch (err) {
    logger.error(
      { component: 'TournamentModel', err },
      'Erro ao contar torneios.'
    );
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
            { component: 'TournamentModel', tournamentData: tournament },
            'Ignorando torneio com dados incompletos durante importação.'
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
    logger.error(
      { component: 'TournamentModel', err },
      'Erro ao importar torneios.'
    );
    throw err;
  }
}

async function getTournamentStats() {
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
      WHERE (is_deleted = 0 OR is_deleted IS NULL)
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
          break;
        default:
          stats.other += row.count;
          logger.warn(
            {
              component: 'TournamentModel',
              status: row.status,
              count: row.count,
            },
            'Status de torneio não mapeado em getTournamentStats.'
          );
          break;
      }
    });
    const softDeletedCountResult = await getOneAsync(
      "SELECT COUNT(*) as count FROM tournaments WHERE is_deleted = 1 AND status != 'Cancelado'"
    );
    stats.softDeleted = softDeletedCountResult
      ? softDeletedCountResult.count
      : 0;

    return stats;
  } catch (err) {
    logger.error(
      { component: 'TournamentModel', err },
      'Erro ao obter estatísticas de torneios.'
    );
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
      { component: 'TournamentModel', err, id },
      `Erro ao atualizar/inserir state_json para torneio ${id}.`
    );
    throw err;
  }
}

async function updateTournamentStatus(id, newStatus) {
  if (!id || !newStatus) {
    throw new Error('ID do torneio e novo status são obrigatórios.');
  }
  let additionalUpdates = '';
  if (newStatus === 'Cancelado') {
    additionalUpdates = ', is_deleted = 1, deleted_at = CURRENT_TIMESTAMP';
  } else if (newStatus !== 'Cancelado') {
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
      { component: 'TournamentModel', err, id, newStatus },
      `Erro ao atualizar status para torneio ${id}.`
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
    is_deleted: 'is_deleted',
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

  sql += ` ORDER BY t."${effectiveOrderBy}" ${effectiveOrder}`;

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
    logger.error(
      { component: 'TournamentModel', err, statuses },
      'Erro ao buscar torneios por status.'
    );
    throw err;
  }
}

module.exports = {
  getAllTournaments,
  getTournamentById,
  createTournament,
  updateTournament,
  deleteTournament,
  restoreTournament,
  tournamentExists,
  countTournaments,
  importTournaments,
  getTournamentStats,
  updateTournamentState,
  updateTournamentStatus,
  getTournamentsByStatus,
};
