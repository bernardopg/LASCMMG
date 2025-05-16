/**
 * Modelo de Match (Partida)
 * Implementa operações no banco de dados relacionadas a partidas de torneios
 */

const {
  queryAsync,
  runAsync,
  getOneAsync,
  transactionAsync,
} = require('../db/database'); // Atualizado para database
const playerModel = require('./playerModel');

/**
 * Busca uma partida pelo ID
 * @param {number} matchId ID da partida
 * @returns {Promise<object|null>} Dados da partida ou null se não encontrada
 */
async function getMatchById(matchId) {
  if (!matchId) {
    throw new Error('ID da partida não fornecido');
  }
  const sql = 'SELECT * FROM matches WHERE id = ?';
  try {
    return await getOneAsync(sql, [matchId]);
  } catch (err) {
    console.error(`Erro ao buscar partida com ID ${matchId}:`, err.message);
    throw err;
  }
}

/**
 * Busca todas as partidas de um torneio específico
 * @param {string} tournamentId ID do torneio
 * @param {object} options Opções de paginação e ordenação
 * @returns {Promise<{matches: Array, total: number}>} Lista de partidas e contagem total
 */
async function getMatchesByTournamentId(tournamentId, options = {}) {
  if (!tournamentId) {
    throw new Error('ID do torneio não fornecido');
  }

  const { limit, offset, orderBy = 'match_number', order = 'ASC' } = options;

  // Validação para orderBy e order
  const allowedOrderFields = [
    'id',
    'match_number',
    'round',
    'player1_id',
    'player2_id',
    'scheduled_at',
    'next_match',
    'next_loser_match',
    'bracket',
    'created_at',
    'updated_at',
  ];
  const allowedOrderDirections = ['ASC', 'DESC'];

  let effectiveOrderBy = 'match_number';
  if (allowedOrderFields.includes(orderBy)) {
    effectiveOrderBy = orderBy;
  }

  let effectiveOrder = 'ASC';
  if (allowedOrderDirections.includes(order.toUpperCase())) {
    effectiveOrder = order.toUpperCase();
  }

  let sql = `
    SELECT m.*,
           p1.name as player1_name, p1.nickname as player1_nickname,
           p2.name as player2_name, p2.nickname as player2_nickname
    FROM matches m
    LEFT JOIN players p1 ON m.player1_id = p1.id
    LEFT JOIN players p2 ON m.player2_id = p2.id
    WHERE m.tournament_id = ?
    ORDER BY m.${effectiveOrderBy} ${effectiveOrder}
  `;
  const params = [tournamentId];
  const countSql =
    'SELECT COUNT(*) as total FROM matches WHERE tournament_id = ?';

  if (limit !== undefined) {
    sql += ' LIMIT ?';
    params.push(parseInt(limit, 10));
    if (offset !== undefined) {
      sql += ' OFFSET ?';
      params.push(parseInt(offset, 10));
    }
  }

  try {
    const matches = await queryAsync(sql, params);
    const totalResult = await getOneAsync(countSql, [tournamentId]);
    return { matches, total: totalResult ? totalResult.total : 0 };
  } catch (err) {
    console.error(
      `Erro ao buscar partidas para o torneio ${tournamentId}:`,
      err.message
    );
    throw err;
  }
}

/**
 * Cria uma nova partida
 * @param {object} matchData Dados da partida (tournament_id, match_number, round, player1_id, player2_id, scheduled_at, next_match, next_loser_match, bracket)
 * @returns {Promise<object>} Partida criada com ID
 */
async function createMatch(matchData) {
  const {
    tournament_id,
    match_number,
    round,
    player1_id,
    player2_id,
    scheduled_at,
    next_match,
    next_loser_match,
    bracket = 'WB',
  } = matchData;

  if (!tournament_id || match_number === undefined || !round) {
    throw new Error('tournament_id, match_number e round são obrigatórios.');
  }

  const sql = `
    INSERT INTO matches (tournament_id, match_number, round, player1_id, player2_id, scheduled_at, next_match, next_loser_match, bracket)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  try {
    const result = await runAsync(sql, [
      tournament_id,
      match_number,
      round,
      player1_id || null,
      player2_id || null,
      scheduled_at || null,
      next_match || null,
      next_loser_match || null,
      bracket,
    ]);
    return await getMatchById(result.lastID);
  } catch (err) {
    console.error('Erro ao criar partida:', err.message);
    throw err;
  }
}

/**
 * Atualiza os dados de uma partida
 * @param {number} matchId ID da partida
 * @param {object} matchData Dados a serem atualizados
 * @returns {Promise<object|null>} Partida atualizada ou null se não encontrada
 */
async function updateMatch(matchId, matchData) {
  if (!matchId) {
    throw new Error('ID da partida não fornecido');
  }

  const {
    round,
    player1_id,
    player2_id,
    scheduled_at,
    next_match,
    next_loser_match,
    bracket,
  } = matchData;

  const fieldsToUpdate = [];
  const values = [];

  if (round !== undefined) {
    fieldsToUpdate.push('round = ?');
    values.push(round);
  }
  if (player1_id !== undefined) {
    fieldsToUpdate.push('player1_id = ?');
    values.push(player1_id);
  }
  if (player2_id !== undefined) {
    fieldsToUpdate.push('player2_id = ?');
    values.push(player2_id);
  }
  if (scheduled_at !== undefined) {
    fieldsToUpdate.push('scheduled_at = ?');
    values.push(scheduled_at);
  }
  if (next_match !== undefined) {
    fieldsToUpdate.push('next_match = ?');
    values.push(next_match);
  }
  if (next_loser_match !== undefined) {
    fieldsToUpdate.push('next_loser_match = ?');
    values.push(next_loser_match);
  }
  if (bracket !== undefined) {
    fieldsToUpdate.push('bracket = ?');
    values.push(bracket);
  }

  if (fieldsToUpdate.length === 0) {
    return getMatchById(matchId);
  }

  const sql = `
    UPDATE matches
    SET ${fieldsToUpdate.join(', ')}
    WHERE id = ?
  `;
  values.push(matchId);

  try {
    const result = await runAsync(sql, values);
    if (result.changes === 0) {
      return null;
    }
    return await getMatchById(matchId);
  } catch (err) {
    console.error(`Erro ao atualizar partida ${matchId}:`, err.message);
    throw err;
  }
}

/**
 * Remove todas as partidas de um torneio
 * @param {string} tournamentId ID do torneio
 * @returns {Promise<number>} Número de partidas removidas
 */
async function deleteMatchesByTournamentId(tournamentId) {
  if (!tournamentId) {
    throw new Error('ID do torneio não fornecido');
  }
  const sql = 'DELETE FROM matches WHERE tournament_id = ?';
  try {
    const result = await runAsync(sql, [tournamentId]);
    return result.changes;
  } catch (err) {
    console.error(
      `Erro ao remover partidas do torneio ${tournamentId}:`,
      err.message
    );
    throw err;
  }
}

/**
 * Importa partidas de um objeto de estado (geralmente de tournament_state.json).
 * @param {string} tournamentId ID do torneio.
 * @param {object} state O objeto de estado do torneio.
 * @returns {Promise<{created: number, updated: number, errors: Array<string>}>} Estatísticas da importação.
 */
async function importMatchesFromState(tournamentId, state) {
  const stats = { created: 0, updated: 0, errors: [] };
  if (
    !tournamentId ||
    !state ||
    !state.matches ||
    typeof state.matches !== 'object'
  ) {
    stats.errors.push(
      'Dados de entrada inválidos para importMatchesFromState.'
    );
    return stats;
  }

  const matchesFromState = [];
  for (const matchNumberStr in state.matches) {
    if (Object.hasOwnProperty.call(state.matches, matchNumberStr)) {
      const matchDataFromState = state.matches[matchNumberStr];
      const matchNumber = parseInt(matchNumberStr, 10);

      let player1Id = null;
      let player2Id = null;

      if (
        matchDataFromState.players &&
        matchDataFromState.players[0] &&
        matchDataFromState.players[0].name &&
        matchDataFromState.players[0].name !== 'A definir' &&
        matchDataFromState.players[0].name !== 'BYE'
      ) {
        const p1 = await playerModel.getPlayerByNameInTournament(
          tournamentId,
          matchDataFromState.players[0].name
        );
        if (p1) player1Id = p1.id;
        else
          stats.errors.push(
            `Jogador ${matchDataFromState.players[0].name} não encontrado para partida ${matchNumber}`
          );
      }
      if (
        matchDataFromState.players &&
        matchDataFromState.players[1] &&
        matchDataFromState.players[1].name &&
        matchDataFromState.players[1].name !== 'A definir' &&
        matchDataFromState.players[1].name !== 'BYE'
      ) {
        const p2 = await playerModel.getPlayerByNameInTournament(
          tournamentId,
          matchDataFromState.players[1].name
        );
        if (p2) player2Id = p2.id;
        else
          stats.errors.push(
            `Jogador ${matchDataFromState.players[1].name} não encontrado para partida ${matchNumber}`
          );
      }

      matchesFromState.push({
        match_number: matchNumber,
        round: matchDataFromState.roundName || 'Desconhecido',
        player1_id: player1Id,
        player2_id: player2Id,
        scheduled_at: matchDataFromState.dateTime || null,
        next_match: matchDataFromState.nextMatch,
        next_loser_match: matchDataFromState.nextLoserMatch,
        bracket: matchDataFromState.bracket || 'WB',
      });
    }
  }

  if (matchesFromState.length > 0) {
    try {
      await deleteMatchesByTournamentId(tournamentId);
      // bulkCreateMatches was here
      // const created = await bulkCreateMatches(tournamentId, matchesFromState);
      // stats.created = created.length;
      // Using createMatchesBulk instead
      const result = await createMatchesBulk(tournamentId, matchesFromState);
      stats.created = result.createdCount;
      stats.errors.push(
        ...result.errors.map(
          (e) => `Erro ao criar partida ${e.matchData.match_number}: ${e.error}`
        )
      );
    } catch (error) {
      stats.errors.push(
        `Erro geral ao importar partidas para ${tournamentId}: ${error.message}`
      );
    }
  }
  return stats;
}

/**
 * Cria múltiplas partidas em lote.
 * @param {string} tournamentId ID do torneio
 * @param {Array<object>} matchesDataArray Array de objetos de partida
 * @returns {Promise<{createdCount: number, errors: Array<object>}>} Resultado da criação em lote
 */
async function createMatchesBulk(tournamentId, matchesDataArray) {
  if (!tournamentId || !Array.isArray(matchesDataArray)) {
    throw new Error('ID do torneio e array de partidas são obrigatórios.');
  }
  if (matchesDataArray.length === 0) {
    return { createdCount: 0, errors: [] };
  }

  const errors = [];
  let createdCount = 0;

  // Usar uma transação para garantir atomicidade
  await transactionAsync((db) => {
    // Tornar a callback síncrona
    const insertSql = `
      INSERT INTO matches (tournament_id, match_number, round, player1_id, player2_id, scheduled_at, next_match, next_loser_match, bracket)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const stmt = db.prepare(insertSql); // Preparar statement sincronamente

    for (const matchData of matchesDataArray) {
      const {
        match_number,
        round,
        player1_id,
        player2_id,
        scheduled_at,
        next_match,
        next_loser_match,
        bracket = 'WB',
      } = matchData;

      if (match_number === undefined || !round) {
        errors.push({
          matchData,
          error: 'match_number e round são obrigatórios.',
        });
        continue;
      }

      try {
        // Executar statement sincronamente
        const result = stmt.run(
          tournamentId,
          match_number,
          round,
          player1_id || null,
          player2_id || null,
          scheduled_at || null,
          next_match || null,
          next_loser_match || null,
          bracket
        );
        if (result.changes > 0) {
          // better-sqlite3 usa 'changes' para DML
          createdCount++;
        }
      } catch (err) {
        console.error('Erro ao criar partida em lote:', err.message, matchData);
        errors.push({ matchData, error: err.message });
      }
    }
    // Finalize não é necessário para statements preparadas desta forma em better-sqlite3
    // se a instância do DB for fechada ou a statement não for mais usada.
  });

  return { createdCount, errors };
}

/**
 * Conta o número total de partidas em todos os torneios.
 * @returns {Promise<number>} Número total de partidas.
 */
async function countMatches() {
  const sql = 'SELECT COUNT(*) as count FROM matches';
  try {
    const row = await getOneAsync(sql);
    return row ? row.count : 0;
  } catch (err) {
    console.error('Erro ao contar partidas:', err.message);
    throw err;
  }
}

module.exports = {
  getMatchById,
  getMatchesByTournamentId,
  createMatch,
  updateMatch,
  deleteMatchesByTournamentId,
  importMatchesFromState,
  countMatches,
};
