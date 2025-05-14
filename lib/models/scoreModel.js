/**
 * Modelo de Score (Placar)
 * Implementa operações no banco de dados relacionadas a scores de partidas
 */

const { queryAsync, runAsync, getOneAsync } = require('../db');
const playerModel = require('./playerModel');

/**
 * Busca um score pelo ID
 * @param {number} scoreId ID do score
 * @returns {Promise<object|null>} Dados do score ou null se não encontrado
 */
async function getScoreById(scoreId) {
  if (!scoreId) {
    throw new Error('ID do score não fornecido');
  }
  const sql = 'SELECT * FROM scores WHERE id = ?';
  try {
    return await getOneAsync(sql, [scoreId]);
  } catch (err) {
    console.error(`Erro ao buscar score com ID ${scoreId}:`, err.message);
    throw err;
  }
}

/**
 * Busca todos os scores de uma partida específica
 * @param {number} matchId ID da partida
 * @returns {Promise<Array>} Lista de scores para a partida (geralmente apenas um)
 */
async function getScoresByMatchId(matchId) {
  if (!matchId) {
    throw new Error('ID da partida não fornecido');
  }
  const sql =
    'SELECT * FROM scores WHERE match_id = ? ORDER BY completed_at DESC';
  try {
    return await queryAsync(sql, [matchId]);
  } catch (err) {
    console.error(
      `Erro ao buscar scores para a partida ${matchId}:`,
      err.message
    );
    throw err;
  }
}

/**
 * Adiciona um novo score para uma partida
 * @param {object} scoreData Dados do score (match_id, player1_score, player2_score, winner_id)
 * @returns {Promise<object>} Score adicionado com ID
 */
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
    return await getScoreById(result.lastID);
  } catch (err) {
    console.error('Erro ao adicionar score:', err.message);
    throw err;
  }
}

/**
 * Atualiza um score existente
 * @param {number} scoreId ID do score a ser atualizado
 * @param {object} scoreData Dados a serem atualizados (player1_score, player2_score, winner_id)
 * @returns {Promise<object|null>} Score atualizado ou null se não encontrado
 */
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
    console.error(`Erro ao atualizar score ${scoreId}:`, err.message);
    throw err;
  }
}

/**
 * Busca todos os scores de um torneio (indiretamente, através das partidas)
 * @param {string} tournamentId ID do torneio
 * @returns {Promise<Array>} Lista de todos os scores do torneio
 */
async function getScoresByTournamentId(tournamentId) {
  if (!tournamentId) {
    throw new Error('ID do torneio não fornecido.');
  }
  const sql = `
    SELECT s.*, m.match_number, m.round, p1.name as player1_name, p2.name as player2_name, w.name as winner_name
    FROM scores s
    JOIN matches m ON s.match_id = m.id
    LEFT JOIN players p1 ON m.player1_id = p1.id
    LEFT JOIN players p2 ON m.player2_id = p2.id
    LEFT JOIN players w ON s.winner_id = w.id
    WHERE m.tournament_id = ?
    ORDER BY s.completed_at DESC
  `;
  try {
    return await queryAsync(sql, [tournamentId]);
  } catch (err) {
    console.error(
      `Erro ao buscar scores para o torneio ${tournamentId}:`,
      err.message
    );
    throw err;
  }
}

/**
 * Remove todos os scores associados a um torneio (via partidas)
 * @param {string} tournamentId ID do torneio
 * @returns {Promise<number>} Número de scores deletados
 */
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
    console.error(
      `Erro ao deletar scores do torneio ${tournamentId}:`,
      err.message
    );
    throw err;
  }
}

/**
 * Importa um array de scores para um torneio.
 * Requer que as partidas e jogadores já existam no banco de dados.
 * @param {string} tournamentId ID do torneio.
 * @param {Array<object>} scoresData Array de objetos de score do JSON.
 * @returns {Promise<number>} Número de scores importados.
 */
async function importScores(tournamentId, scoresData) {
  if (!tournamentId || !Array.isArray(scoresData)) {
    throw new Error('ID do torneio e array de scores são obrigatórios.');
  }

  let importedCount = 0;
  const errors = [];

  const playerCache = new Map();
  const matchCache = new Map();

  for (const scoreJson of scoresData) {
    try {
      let matchDbId = matchCache.get(scoreJson.matchId);
      if (matchDbId === undefined) {
        const matchInDb = await queryAsync(
          'SELECT id FROM matches WHERE tournament_id = ? AND match_number = ?',
          [tournamentId, scoreJson.matchId]
        );
        if (matchInDb && matchInDb.length > 0) {
          matchDbId = matchInDb[0].id;
          matchCache.set(scoreJson.matchId, matchDbId);
        } else {
          errors.push(
            `Partida com match_number ${scoreJson.matchId} não encontrada para o torneio ${tournamentId}. Score ignorado: ${JSON.stringify(scoreJson)}`
          );
          continue;
        }
      }

      let p1Id = playerCache.get(scoreJson.player1);
      if (
        p1Id === undefined &&
        scoreJson.player1 &&
        scoreJson.player1.toLowerCase() !== 'a definir' &&
        scoreJson.player1.toLowerCase() !== 'bye'
      ) {
        const p1 = await playerModel.getPlayerByNameInTournament(
          tournamentId,
          scoreJson.player1
        );
        if (p1) {
          p1Id = p1.id;
          playerCache.set(scoreJson.player1, p1Id);
        } else {
          errors.push(
            `Jogador ${scoreJson.player1} não encontrado no torneio ${tournamentId}. Score ignorado.`
          );
          continue;
        }
      } else if (
        scoreJson.player1 &&
        (scoreJson.player1.toLowerCase() === 'a definir' ||
          scoreJson.player1.toLowerCase() === 'bye')
      ) {
        p1Id = null;
      }

      let p2Id = playerCache.get(scoreJson.player2);
      if (
        p2Id === undefined &&
        scoreJson.player2 &&
        scoreJson.player2.toLowerCase() !== 'a definir' &&
        scoreJson.player2.toLowerCase() !== 'bye'
      ) {
        const p2 = await playerModel.getPlayerByNameInTournament(
          tournamentId,
          scoreJson.player2
        );
        if (p2) {
          p2Id = p2.id;
          playerCache.set(scoreJson.player2, p2Id);
        } else {
          errors.push(
            `Jogador ${scoreJson.player2} não encontrado no torneio ${tournamentId}. Score ignorado.`
          );
          continue;
        }
      } else if (
        scoreJson.player2 &&
        (scoreJson.player2.toLowerCase() === 'a definir' ||
          scoreJson.player2.toLowerCase() === 'bye')
      ) {
        p2Id = null;
      }

      let winnerId = null;
      if (
        scoreJson.winner &&
        scoreJson.winner.toLowerCase() !== 'a definir' &&
        scoreJson.winner.toLowerCase() !== 'bye'
      ) {
        winnerId = playerCache.get(scoreJson.winner);
        if (winnerId === undefined) {
          const winner = await playerModel.getPlayerByNameInTournament(
            tournamentId,
            scoreJson.winner
          );
          if (winner) {
            winnerId = winner.id;
            playerCache.set(scoreJson.winner, winnerId);
          } else {
            errors.push(
              `Jogador vencedor ${scoreJson.winner} não encontrado. Score parcialmente importado.`
            );
          }
        }
      }

      const scoreEntry = {
        match_id: matchDbId,
        player1_score: parseInt(scoreJson.score1, 10),
        player2_score: parseInt(scoreJson.score2, 10),
        winner_id: winnerId,
      };

      const existingScores = await getScoresByMatchId(matchDbId);
      if (existingScores.length > 0) {
        continue;
      }

      await addScore(scoreEntry);
      importedCount++;
    } catch (error) {
      errors.push(
        `Erro ao processar score ${JSON.stringify(scoreJson)}: ${error.message}`
      );
    }
  }

  if (errors.length > 0) {
    console.warn(
      `Erros durante a importação de scores para o torneio ${tournamentId}:`,
      errors
    );
  }
  return importedCount;
}

/**
 * Conta o número total de scores registrados.
 * @returns {Promise<number>} Número total de scores.
 */
async function countScores() {
  const sql = 'SELECT COUNT(*) as count FROM scores';
  try {
    const row = await getOneAsync(sql);
    return row ? row.count : 0;
  } catch (err) {
    console.error('Erro ao contar scores:', err.message);
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
  countScores, // Adicionar a nova função
};
