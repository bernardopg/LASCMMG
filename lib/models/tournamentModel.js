/**
 * Modelo de Torneio
 * Implementa operações no banco de dados relacionadas a torneios
 */

const {
  queryAsync,
  runAsync,
  getOneAsync,
  transactionAsync,
  querySync,
  getOneSync,
} = require('../db');

/**
 * Busca todos os torneios no banco de dados
 * @param {object} options Opções de filtro e ordenação
 * @returns {Promise<Array>} Lista de torneios
 */
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

  let { orderBy = 'date', order = 'DESC', limit } = options;

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

  if (limit) {
    sql += ` LIMIT ${parseInt(limit, 10)}`;
  }

  try {
    return await queryAsync(sql);
  } catch (err) {
    console.error('Erro ao buscar torneios:', err.message);
    throw err;
  }
}

/**
 * Busca um torneio pelo ID
 * @param {string} id ID do torneio
 * @returns {Promise<object|null>} Dados do torneio ou null se não encontrado
 */
async function getTournamentById(id) {
  if (!id) {
    throw new Error('ID do torneio não fornecido');
  }

  const sql = 'SELECT * FROM tournaments WHERE id = ?';

  try {
    return await getOneAsync(sql, [id]);
  } catch (err) {
    console.error(`Erro ao buscar torneio com ID ${id}:`, err.message);
    throw err;
  }
}

/**
 * Cria um novo torneio
 * @param {object} tournament Dados do torneio a ser criado
 * @returns {Promise<object>} Torneio criado com ID
 */
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
    INSERT INTO tournaments (id, name, date, description, num_players_expected, bracket_type, status, state_json, entry_fee, prize_pool, rules)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `; // created_at e updated_at terão DEFAULT CURRENT_TIMESTAMP

  try {
    await runAsync(sql, [
      id,
      name,
      date,
      description,
      num_players_expected,
      bracket_type,
      status,
      state_json,
      entry_fee,
      prize_pool,
      rules,
    ]);
    return await getTournamentById(id);
  } catch (err) {
    console.error('Erro ao criar torneio:', err.message);
    throw err;
  }
}

/**
 * Atualiza um torneio existente
 * @param {string} id ID do torneio a ser atualizado
 * @param {object} data Dados a serem atualizados
 * @returns {Promise<object|null>} Torneio atualizado ou null se não encontrado
 */
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
  `;

  const params = [...updates.map((update) => update.value), id];

  try {
    const result = await runAsync(sql, params);

    if (result.changes === 0) {
      return null;
    }

    return await getTournamentById(id);
  } catch (err) {
    console.error(`Erro ao atualizar torneio com ID ${id}:`, err.message);
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
    console.error(`Erro ao excluir torneio com ID ${id}:`, err.message);
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
    console.error(
      `Erro ao verificar existência do torneio ${id}:`,
      err.message
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
    console.error('Erro ao contar torneios:', err.message);
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
    await transactionAsync((db) => {
      const stmt = db.prepare(`
        INSERT INTO tournaments (id, name, date, description, num_players_expected, bracket_type, status, state_json, entry_fee, prize_pool, rules)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          date = excluded.date,
          description = excluded.description,
          num_players_expected = excluded.num_players_expected,
          bracket_type = excluded.bracket_type,
          status = excluded.status,
          state_json = excluded.state_json,
          entry_fee = excluded.entry_fee,
          prize_pool = excluded.prize_pool,
          rules = excluded.rules,
          updated_at = CURRENT_TIMESTAMP
      `);

      for (const tournament of tournaments) {
        if (!tournament.id || !tournament.name) {
          console.warn('Ignorando torneio com dados incompletos:', tournament);
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
          entry_fee = 0.0, // Novo campo
          prize_pool = '', // Novo campo
          rules = '', // Novo campo
        } = tournament;

        const stateJsonString =
          typeof state_json === 'object' && state_json !== null
            ? JSON.stringify(state_json)
            : state_json || null;

        // Usar a statement preparada
        const info = stmt.run(
          id,
          name,
          date,
          description,
          num_players_expected,
          bracket_type,
          status,
          stateJsonString,
          entry_fee,
          prize_pool,
          rules
        );
        if (info.changes > 0) {
          imported++;
        }
      }
    }); // Esta é a chave de fechamento para a callback de transactionAsync

    return imported;
  } catch (err) {
    console.error('Erro ao importar torneios:', err.message);
    throw err;
  }
}

/**
 * Busca todos os torneios (versão síncrona)
 * @param {object} options Opções de filtro e ordenação
 * @returns {Array} Lista de torneios
 */
function getAllTournamentsSync(options = {}) {
  const allowedOrderFields = [
    'id',
    'name',
    'date',
    'status',
    'created_at',
    'updated_at',
  ];
  const allowedOrderDirections = ['ASC', 'DESC'];

  let { orderBy = 'date', order = 'DESC', limit } = options;

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

  if (limit) {
    sql += ` LIMIT ${parseInt(limit, 10)}`;
  }

  try {
    return querySync(sql);
  } catch (err) {
    console.error('Erro ao buscar torneios (modo síncrono):', err.message);
    throw err;
  }
}

/**
 * Busca um torneio pelo ID (versão síncrona)
 * @param {string} id ID do torneio
 * @returns {object|null} Dados do torneio ou null se não encontrado
 */
function getTournamentByIdSync(id) {
  if (!id) {
    throw new Error('ID do torneio não fornecido');
  }

  const sql = 'SELECT * FROM tournaments WHERE id = ?';

  try {
    return getOneSync(sql, [id]);
  } catch (err) {
    console.error(
      `Erro ao buscar torneio com ID ${id} (modo síncrono):`,
      err.message
    );
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
          console.warn(
            'Status de torneio não mapeado detectado:',
            row.status,
            'Contagem:',
            row.count
          );
          break;
      }
    });

    return stats;
  } catch (err) {
    console.error('Erro ao obter estatísticas de torneios:', err.message);
    throw err;
  }
}

/**
 * Atualiza o estado JSON de um torneio específico.
 * @param {string} id ID do torneio
 * @param {string} stateJson String JSON do estado do torneio
 * @returns {Promise<boolean>} True se atualizado, false caso contrário
 */
async function updateTournamentState(id, stateJson) {
  if (!id || typeof stateJson !== 'string') {
    throw new Error('ID do torneio e stateJson (string) são obrigatórios.');
  }
  const sql = `
    UPDATE tournaments
    SET state_json = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  try {
    const result = await runAsync(sql, [stateJson, id]);
    return result.changes > 0;
  } catch (err) {
    console.error(
      `Erro ao atualizar state_json para torneio ${id}:`,
      err.message
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
    console.error(`Erro ao atualizar status para torneio ${id}:`, err.message);
    throw err;
  }
}

/**
 * Busca torneios por uma lista de status.
 * @param {Array<string>} statuses Array de status para filtrar
 * @returns {Promise<Array>} Lista de torneios
 */
async function getTournamentsByStatus(statuses = []) {
  if (!Array.isArray(statuses) || statuses.length === 0) {
    return getAllTournaments();
  }
  const placeholders = statuses.map(() => '?').join(',');
  const sql = `
    SELECT * FROM tournaments
    WHERE status IN (${placeholders})
    ORDER BY date DESC
  `;
  try {
    return await queryAsync(sql, statuses);
  } catch (err) {
    console.error('Erro ao buscar torneios por status:', err.message);
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

  getAllTournamentsSync,
  getTournamentByIdSync,
};
