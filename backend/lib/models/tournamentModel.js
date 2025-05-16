const {
  queryAsync,
  runAsync,
  getOneAsync,
  transactionAsync,
} = require('../db/database'); // Atualizado para database
const { logger } = require('../logger/logger'); // Importar logger

async function getAllTournaments(options = {}) {
  const allowedOrderFields = [
    'id',
    'name',
    'date',
    'status',
    'created_at',
    'updated_at',
  ];
  const allowedOrderDirections = ['ASC', 'DESC'];

  let { orderBy = 'date', order = 'DESC', limit, offset } = options; // Adicionar offset

  if (!allowedOrderFields.includes(orderBy)) {
    orderBy = 'date';
  }

  if (!allowedOrderDirections.includes(order.toUpperCase())) {
    order = 'DESC';
  }

  let sql = `
    SELECT * FROM tournaments
    ORDER BY ${orderBy} ${order.toUpperCase()}
  `;

  const countSql = 'SELECT COUNT(*) as total FROM tournaments'; // Para contagem total

  if (limit) {
    sql += ` LIMIT ${parseInt(limit, 10)}`;
    if (offset) {
      // Adicionar offset se limit estiver presente
      sql += ` OFFSET ${parseInt(offset, 10)}`;
    }
  }

  try {
    const tournaments = await queryAsync(sql);
    const totalResult = await getOneAsync(countSql);
    return { tournaments, total: totalResult ? totalResult.total : 0 };
  } catch (err) {
    logger.error('TournamentModel', 'Erro ao buscar torneios:', { error: err });
    throw err;
  }
}

async function getTournamentById(id) {
  if (!id) {
    throw new Error('ID do torneio não fornecido');
  }

  const sql = 'SELECT * FROM tournaments WHERE id = ?';

  try {
    return await getOneAsync(sql, [id]);
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
    entry_fee = 0.0, // Novo campo
    prize_pool = '', // Novo campo
    rules = '', // Novo campo
  } = tournament;

  const sql = `
    INSERT INTO tournaments (id, name, date, description, num_players_expected, bracket_type, status, entry_fee, prize_pool, rules)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `; // state_json é tratado separadamente

  const sqlInsertState = `
    INSERT INTO tournament_state (tournament_id, state_json)
    VALUES (?, ?)
  `;

  try {
    // Usar uma transação para garantir atomicidade
    // A callback para transactionAsync deve ser síncrona, pois db.transaction() do better-sqlite3 é síncrono.
    await transactionAsync((db) => {
      // Removido async da callback
      // Inserir na tabela tournaments
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

      // Inserir na tabela tournament_state
      if (state_json) {
        // Apenas insere se state_json for fornecido
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
    'description', // Adicionado para permitir atualização
    'num_players_expected', // Adicionado
    'bracket_type',
    'status',
    'entry_fee', // Novo campo
    'prize_pool', // Novo campo
    'rules', // Novo campo
  ];

  const updates = Object.keys(data)
    .filter((key) => allowedFields.includes(key))
    .map((key) => ({ field: key, value: data[key] }));

  if (updates.length === 0) {
    throw new Error('Nenhum campo válido para atualização');
  }

  const setClause = updates.map((update) => `${update.field} = ?`).join(', ');
  // O updated_at será atualizado automaticamente pelo SQLite se configurado com DEFAULT e um trigger,
  // ou podemos adicionar explicitamente "updated_at = CURRENT_TIMESTAMP" se não houver trigger.
  // Por simplicidade e consistência com create, vamos assumir que o DB lida com updated_at ou que
  // a camada de DB (runAsync) poderia ser estendida para tal.
  // Para manter o comportamento explícito da aplicação, vamos manter a atualização do updated_at aqui.
  const sql = `
    UPDATE tournaments
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `; // A atualização de state_json é feita por updateTournamentState

  const params = [...updates.map((update) => update.value), id];

  try {
    const result = await runAsync(sql, params);

    if (result.changes === 0) {
      return null; // Torneio não encontrado ou nenhum dado alterado
    }

    return await getTournamentById(id); // Retorna o torneio atualizado
  } catch (err) {
    logger.error(
      'TournamentModel',
      `Erro ao atualizar torneio com ID ${id}: ${err.message}`,
      { id, data, error: err }
    );
    throw err;
  }
}

/**
 * Exclui um torneio pelo ID
 * @param {string} id ID do torneio a ser excluído
 * @returns {Promise<boolean>} True se o torneio foi excluído, false se não foi encontrado
 */
async function deleteTournament(id) {
  if (!id) {
    throw new Error('ID do torneio não fornecido');
  }

  const sql = 'DELETE FROM tournaments WHERE id = ?';

  try {
    const result = await runAsync(sql, [id]);
    return result.changes > 0;
  } catch (err) {
    logger.error(
      'TournamentModel',
      `Erro ao excluir torneio com ID ${id}: ${err.message}`,
      { id, error: err }
    );
    throw err;
  }
}

/**
 * Verifica se um torneio existe
 * @param {string} id ID do torneio
 * @returns {Promise<boolean>} True se o torneio existe, false caso contrário
 */
async function tournamentExists(id) {
  if (!id) {
    return false;
  }

  const sql = 'SELECT 1 FROM tournaments WHERE id = ? LIMIT 1';

  try {
    const tournament = await getOneAsync(sql, [id]);
    return !!tournament;
  } catch (err) {
    logger.error(
      'TournamentModel',
      `Erro ao verificar existência do torneio ${id}: ${err.message}`,
      { id, error: err }
    );
    throw err;
  }
}

/**
 * Conta o número total de torneios
 * @returns {Promise<number>} Número total de torneios
 */
async function countTournaments() {
  const sql = 'SELECT COUNT(*) as count FROM tournaments';

  try {
    const result = await getOneAsync(sql);
    return result ? result.count : 0;
  } catch (err) {
    logger.error('TournamentModel', 'Erro ao contar torneios:', { error: err });
    throw err;
  }
}

/**
 * Importa um array de torneios para o banco de dados
 * @param {Array<object>} tournaments Lista de torneios a serem importados
 * @returns {Promise<number>} Número de torneios importados
 */
async function importTournaments(tournaments) {
  if (!Array.isArray(tournaments) || tournaments.length === 0) {
    return 0;
  }

  let imported = 0;

  try {
    // A callback para transactionAsync agora é síncrona e recebe 'db'
    // A callback para transactionAsync agora é síncrona e recebe 'db'
    await transactionAsync((db) => {
      const stmtTournament = db.prepare(`
        INSERT INTO tournaments (id, name, date, description, num_players_expected, bracket_type, status, entry_fee, prize_pool, rules, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          date = excluded.date,
          description = excluded.description,
          num_players_expected = excluded.num_players_expected,
          bracket_type = excluded.bracket_type,
          status = excluded.status,
          entry_fee = excluded.entry_fee,
          prize_pool = excluded.prize_pool,
          rules = excluded.rules,
          updated_at = CURRENT_TIMESTAMP
      `);
      // state_json é tratado separadamente
      const stmtState = db.prepare(`
        INSERT INTO tournament_state (tournament_id, state_json)
        VALUES (?, ?)
        ON CONFLICT(tournament_id) DO UPDATE SET
          state_json = excluded.state_json
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
          state_json, // Este é o objeto ou string JSON
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

        if (stateJsonString) {
          stmtState.run(id, stateJsonString);
        }

        // info.changes pode ser 0 em ON CONFLICT DO UPDATE se os valores forem os mesmos.
        // Consideramos importado se não houver erro.
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

/**
 * Obtém estatísticas agregadas de torneios
 * @returns {Promise<object>} Estatísticas dos torneios (ativos, concluídos, etc)
 */
async function getTournamentStats() {
  try {
    const stats = {
      active: 0,
      completed: 0,
      scheduled: 0,
      canceled: 0,
      other: 0, // Adicionado para status não mapeados
      total: 0,
    };

    const sql = `
      SELECT
        status,
        COUNT(*) as count
      FROM tournaments
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
            'TournamentModel',
            'Status de torneio não mapeado detectado em getTournamentStats.',
            { status: row.status, count: row.count }
          );
          break;
      }
    });

    return stats;
  } catch (err) {
    logger.error('TournamentModel', 'Erro ao obter estatísticas de torneios:', {
      error: err,
    });
    throw err;
  }
}

/**
 * Atualiza o estado JSON de um torneio específico na tabela tournament_state.
 * @param {string} id ID do torneio
 * @param {string} stateJson String JSON do estado do torneio
 * @returns {Promise<boolean>} True se atualizado/inserido, false caso contrário
 */
async function updateTournamentState(id, stateJson) {
  if (!id || typeof stateJson !== 'string') {
    throw new Error('ID do torneio e stateJson (string) são obrigatórios.');
  }
  // Usar INSERT OR REPLACE para lidar com casos onde o estado pode não existir ainda
  const sql = `
    INSERT OR REPLACE INTO tournament_state (tournament_id, state_json)
    VALUES (?, ?)
  `;
  try {
    const result = await runAsync(sql, [id, stateJson]);
    // Para INSERT OR REPLACE, changes pode ser 1 para insert ou replace.
    // Se o objetivo é saber se algo mudou, pode ser necessário verificar o estado anterior.
    // Para simplificar, consideramos sucesso se a operação não lançar erro.
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

/**
 * Atualiza o status de um torneio específico.
 * @param {string} id ID do torneio
 * @param {string} newStatus Novo status para o torneio
 * @returns {Promise<boolean>} True se atualizado, false caso contrário
 */
async function updateTournamentStatus(id, newStatus) {
  if (!id || !newStatus) {
    throw new Error('ID do torneio e novo status são obrigatórios.');
  }
  const sql = `
    UPDATE tournaments
    SET status = ?, updated_at = CURRENT_TIMESTAMP
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

/**
 * Busca torneios por uma lista de status.
 * @param {Array<string>} statuses Array de status para filtrar
 * @returns {Promise<Array>} Lista de torneios
 */
async function getTournamentsByStatus(statuses = [], options = {}) {
  // Adicionar options
  if (!Array.isArray(statuses) || statuses.length === 0) {
    return getAllTournaments(options); // Passar options para getAllTournaments
  }
  const placeholders = statuses.map(() => '?').join(',');

  let { orderBy = 'date', order = 'DESC', limit, offset } = options; // Adicionar offset e ordenação
  const allowedOrderFields = [
    'id',
    'name',
    'date',
    'status',
    'created_at',
    'updated_at',
  ];
  const allowedOrderDirections = ['ASC', 'DESC'];

  if (!allowedOrderFields.includes(orderBy)) {
    orderBy = 'date';
  }
  if (!allowedOrderDirections.includes(order.toUpperCase())) {
    order = 'DESC';
  }

  let sql = `
    SELECT * FROM tournaments
    WHERE status IN (${placeholders})
    ORDER BY ${orderBy} ${order.toUpperCase()}
  `;

  const countSql = `SELECT COUNT(*) as total FROM tournaments WHERE status IN (${placeholders})`;

  const params = [...statuses];
  const countParams = [...statuses];

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
  tournamentExists,
  countTournaments,
  importTournaments,
  getTournamentStats,
  updateTournamentState,
  updateTournamentStatus,
  getTournamentsByStatus,
};
