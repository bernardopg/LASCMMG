/**
 * Modelo de Match (Partida)
 * Implementa operações no banco de dados relacionadas a partidas de torneios
 */

const {
  queryAsync,
  runAsync,
  getOneAsync,
  transactionAsync,
} = require('../db');
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
 * @returns {Promise<Array>} Lista de partidas
 */
async function getMatchesByTournamentId(tournamentId) {
  if (!tournamentId) {
    throw new Error('ID do torneio não fornecido');
  }
  const sql =
    'SELECT * FROM matches WHERE tournament_id = ? ORDER BY round ASC, match_number ASC';
  try {
    return await queryAsync(sql, [tournamentId]);
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
 * Cria múltiplas partidas dentro de uma transação.
 * Usado para popular o chaveamento inicial.
 * @param {string} tournamentId ID do torneio
 * @param {Array<object>} matchesDataArray Array de objetos de partida
 * @returns {Promise<Array<object>>} Lista de partidas criadas
 */
async function bulkCreateMatches(tournamentId, matchesDataArray) {
  if (
    !tournamentId ||
    !Array.isArray(matchesDataArray) ||
    matchesDataArray.length === 0
  ) {
    throw new Error(
      'ID do torneio e um array de dados de partidas são obrigatórios.'
    );
  }

  const createdMatches = [];
  await transactionAsync(async (db) => {
    const stmt = await new Promise((resolve, reject) => {
      const s = db.prepare(
        `
                INSERT INTO matches (tournament_id, match_number, round, player1_id, player2_id, scheduled_at, next_match, next_loser_match, bracket)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
        (err) => (err ? reject(err) : resolve(s))
      );
    });

    for (const match of matchesDataArray) {
      const {
        match_number,
        round,
        player1_id,
        player2_id,
        scheduled_at,
        next_match,
        next_loser_match,
        bracket = 'WB',
      } = match;

      if (match_number === undefined || !round) {
        console.warn(
          'Partida ignorada por falta de match_number ou round:',
          match
        );
        continue;
      }

      const result = await new Promise((resolve, reject) => {
        stmt.run(
          tournamentId,
          match_number,
          round,
          player1_id || null,
          player2_id || null,
          scheduled_at || null,
          null,
          null,
          bracket,
          function (err) {
            if (err) reject(err);
            else
              resolve({
                lastID: this.lastID,
                insertedMatchNumber: match_number,
                originalNextMatch: next_match,
                originalNextLoserMatch: next_loser_match,
              });
          }
        );
      });
      createdMatches.push({
        id: result.lastID,
        tournament_id: tournamentId,
        match_number: result.insertedMatchNumber,
        originalNextMatch: result.originalNextMatch,
        originalNextLoserMatch: result.originalNextLoserMatch,
        ...match,
      });
    }
    await new Promise((resolve, reject) =>
      stmt.finalize((err) => (err ? reject(err) : resolve()))
    );
  });

  const matchNumberToIdMap = {};
  const matchesInDb = await getMatchesByTournamentId(tournamentId);
  matchesInDb.forEach((m) => {
    matchNumberToIdMap[m.match_number] = m.id;
  });

  for (const createdMatch of createdMatches) {
    let nextMatchIdToUpdate = null;
    let nextLoserMatchIdToUpdate = null;

    if (
      createdMatch.originalNextMatch &&
      matchNumberToIdMap[createdMatch.originalNextMatch]
    ) {
      nextMatchIdToUpdate = matchNumberToIdMap[createdMatch.originalNextMatch];
    }
    if (
      createdMatch.originalNextLoserMatch &&
      matchNumberToIdMap[createdMatch.originalNextLoserMatch]
    ) {
      nextLoserMatchIdToUpdate =
        matchNumberToIdMap[createdMatch.originalNextLoserMatch];
    }

    if (nextMatchIdToUpdate || nextLoserMatchIdToUpdate) {
      await updateMatch(createdMatch.id, {
        next_match: nextMatchIdToUpdate,
        next_loser_match: nextLoserMatchIdToUpdate,
      });
    }
  }
  return createdMatches;
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
      const created = await bulkCreateMatches(tournamentId, matchesFromState);
      stats.created = created.length;
    } catch (error) {
      stats.errors.push(
        `Erro em bulkCreateMatches para ${tournamentId}: ${error.message}`
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
  await transactionAsync(async (db) => {
    const insertSql = `
      INSERT INTO matches (tournament_id, match_number, round, player1_id, player2_id, scheduled_at, next_match, next_loser_match, bracket)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const stmt = await db.prepare(insertSql);

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
        const result = await stmt.run(
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
        if (result.lastID) {
          createdCount++;
        }
      } catch (err) {
        console.error('Erro ao criar partida em lote:', err.message, matchData);
        errors.push({ matchData, error: err.message });
      }
    }
    await stmt.finalize();
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
  bulkCreateMatches,
  importMatchesFromState,
  createMatchesBulk, // Adicionar a nova função
  countMatches, // Adicionar a nova função
};
