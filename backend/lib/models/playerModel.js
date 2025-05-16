/**
 * Modelo de Jogador
 * Implementa operações no banco de dados relacionadas a jogadores
 */

const {
  queryAsync,
  runAsync,
  getOneAsync,
  transactionAsync,
} = require('../db/database'); // Atualizado para database

/**
 * Busca todos os jogadores de um torneio específico com suporte a paginação
 * @param {string} tournamentId ID do torneio
 * @param {object} options Opções de paginação e ordenação
 * @param {number} options.limit Número máximo de jogadores a serem retornados
 * @param {number} options.offset Posição inicial dos jogadores a serem retornados
 * @param {string} options.orderBy Campo para ordenar os jogadores
 * @param {string} options.order Direção da ordenação (ASC ou DESC)
 * @returns {Promise<{ players: Array, total: number }>} Lista de jogadores e contagem total
 */
async function getPlayersByTournamentId(tournamentId, options = {}) {
  if (!tournamentId) {
    throw new Error('ID do torneio não fornecido');
  }

  const { limit, offset, orderBy = 'name', order = 'ASC' } = options;

  // Validação para orderBy e order
  const allowedOrderFields = [
    'id',
    'name',
    'nickname',
    'games_played',
    'wins',
    'losses',
    'score',
    'gender',
    'skill_level',
  ];
  const allowedOrderDirections = ['ASC', 'DESC'];

  let effectiveOrderBy = 'name';
  if (allowedOrderFields.includes(orderBy)) {
    effectiveOrderBy = orderBy;
  }

  let effectiveOrder = 'ASC';
  if (allowedOrderDirections.includes(order.toUpperCase())) {
    effectiveOrder = order.toUpperCase();
  }

  let sql = `SELECT * FROM players WHERE tournament_id = ? ORDER BY ${effectiveOrderBy} ${effectiveOrder}`;
  const params = [tournamentId];
  const countSql =
    'SELECT COUNT(*) as total FROM players WHERE tournament_id = ?';

  if (limit !== undefined) {
    sql += ' LIMIT ?';
    params.push(parseInt(limit, 10));
    if (offset !== undefined) {
      sql += ' OFFSET ?';
      params.push(parseInt(offset, 10));
    }
  }

  try {
    const players = await queryAsync(sql, params);
    const totalResult = await getOneAsync(countSql, [tournamentId]);
    return { players, total: totalResult ? totalResult.total : 0 };
  } catch (err) {
    console.error(
      `Erro ao buscar jogadores para o torneio ${tournamentId}:`,
      err.message
    );
    throw err;
  }
}

/**
 * Busca um jogador pelo ID
 * @param {number} playerId ID do jogador
 * @returns {Promise<object|null>} Dados do jogador ou null se não encontrado
 */
async function getPlayerById(playerId) {
  if (!playerId) {
    throw new Error('ID do jogador não fornecido');
  }
  const sql = 'SELECT * FROM players WHERE id = ?';
  try {
    return await getOneAsync(sql, [playerId]);
  } catch (err) {
    console.error(`Erro ao buscar jogador com ID ${playerId}:`, err.message);
    throw err;
  }
}

/**
 * Busca um jogador pelo nome dentro de um torneio específico
 * @param {string} tournamentId ID do torneio
 * @param {string} playerName Nome do jogador
 * @returns {Promise<object|null>} Dados do jogador ou null se não encontrado
 */
async function getPlayerByNameInTournament(tournamentId, playerName) {
  if (!tournamentId || !playerName) {
    throw new Error('ID do torneio e nome do jogador são obrigatórios.');
  }
  const sql = 'SELECT * FROM players WHERE tournament_id = ? AND name = ?';
  try {
    return await getOneAsync(sql, [tournamentId, playerName]);
  } catch (err) {
    console.error(
      `Erro ao buscar jogador "${playerName}" no torneio ${tournamentId}:`,
      err.message
    );
    throw err;
  }
}

/**
 * Adiciona um novo jogador a um torneio
 * @param {object} playerData Dados do jogador (tournament_id, name, nickname, gender, skill_level)
 * @returns {Promise<object>} Jogador adicionado com ID
 */
async function addPlayer(playerData) {
  const {
    tournament_id,
    name,
    nickname,
    gender, // Novo campo
    skill_level, // Novo campo
  } = playerData;
  if (!tournament_id || !name) {
    throw new Error('ID do torneio e nome do jogador são obrigatórios.');
  }

  const sql = `
    INSERT INTO players (tournament_id, name, nickname, games_played, wins, losses, gender, skill_level)
    VALUES (?, ?, ?, 0, 0, 0, ?, ?)
  `;
  try {
    const result = await runAsync(sql, [
      tournament_id,
      name,
      nickname || null,
      gender || null, // Novo campo
      skill_level || null, // Novo campo
    ]);
    return await getPlayerById(result.lastID);
  } catch (err) {
    if (
      err.message.includes(
        'UNIQUE constraint failed: players.tournament_id, players.name'
      )
    ) {
      console.warn(
        `Tentativa de adicionar jogador duplicado: ${name} no torneio ${tournament_id}`
      );
      throw new Error(`Jogador "${name}" já existe neste torneio.`);
    }
    console.error('Erro ao adicionar jogador:', err.message);
    throw err;
  }
}

/**
 * Atualiza os dados de um jogador
 * @param {number} playerId ID do jogador
 * @param {object} playerData Dados a serem atualizados (name, nickname, games_played, wins, losses, gender, skill_level)
 * @returns {Promise<object|null>} Jogador atualizado ou null se não encontrado
 */
async function updatePlayer(playerId, playerData) {
  if (!playerId) {
    throw new Error('ID do jogador não fornecido');
  }
  const {
    name,
    nickname,
    games_played,
    wins,
    losses,
    gender, // Novo campo
    skill_level, // Novo campo
  } = playerData;
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
    // Novo campo
    fieldsToUpdate.push('gender = ?');
    values.push(gender);
  }
  if (skill_level !== undefined) {
    // Novo campo
    fieldsToUpdate.push('skill_level = ?');
    values.push(skill_level);
  }

  if (fieldsToUpdate.length === 0) {
    return await getPlayerById(playerId);
  }

  const sql = `
    UPDATE players
    SET ${fieldsToUpdate.join(', ')}
    WHERE id = ?
  `;
  values.push(playerId);

  try {
    const result = await runAsync(sql, values);
    if (result.changes === 0) {
      return null;
    }
    return await getPlayerById(playerId);
  } catch (err) {
    console.error(`Erro ao atualizar jogador ${playerId}:`, err.message);
    throw err;
  }
}

/**
 * Remove um jogador do banco de dados
 * @param {number} playerId ID do jogador
 * @returns {Promise<boolean>} True se removido, false caso contrário
 */
async function deletePlayer(playerId) {
  if (!playerId) {
    throw new Error('ID do jogador não fornecido');
  }
  const sql = 'DELETE FROM players WHERE id = ?';
  try {
    const result = await runAsync(sql, [playerId]);
    return result.changes > 0;
  } catch (err) {
    console.error(`Erro ao remover jogador ${playerId}:`, err.message);
    throw err;
  }
}

/**
 * Remove todos os jogadores de um torneio
 * @param {string} tournamentId ID do torneio
 * @returns {Promise<number>} Número de jogadores removidos
 */
async function deletePlayersByTournamentId(tournamentId) {
  if (!tournamentId) {
    throw new Error('ID do torneio não fornecido');
  }
  const sql = 'DELETE FROM players WHERE tournament_id = ?';
  try {
    const result = await runAsync(sql, [tournamentId]);
    return result.changes;
  } catch (err) {
    console.error(
      `Erro ao remover jogadores do torneio ${tournamentId}:`,
      err.message
    );
    throw err;
  }
}

/**
 * Importa uma lista de jogadores para um torneio.
 * Evita duplicatas baseadas no nome do jogador dentro do mesmo torneio.
 * @param {string} tournamentId ID do torneio
 * @param {Array<object>} playersArray Array de objetos de jogador (cada objeto deve ter 'name' e opcionalmente 'nickname', 'gender', 'skill_level')
 * @returns {Promise<{ count: number, errors: Array<string> }>} Contagem de jogadores importados e quaisquer erros.
 */
async function importPlayers(tournamentId, playersArray) {
  if (!tournamentId) {
    throw new Error('ID do torneio é obrigatório para importar jogadores.');
  }
  if (!Array.isArray(playersArray)) {
    throw new Error('A lista de jogadores deve ser um array.');
  }

  let importedCount = 0;
  const errors = [];

  // Usar transactionAsync que passa 'db' para a callback
  await transactionAsync((db) => {
    const selectPlayerSql =
      'SELECT id FROM players WHERE tournament_id = ? AND name = ?';
    const insertPlayerSql = `
      INSERT INTO players (tournament_id, name, nickname, games_played, wins, losses, gender, skill_level)
      VALUES (?, ?, ?, 0, 0, 0, ?, ?)
    `;
    const selectStmt = db.prepare(selectPlayerSql);
    const insertStmt = db.prepare(insertPlayerSql);

    for (const playerData of playersArray) {
      if (!playerData || !playerData.name) {
        errors.push(
          `Dados do jogador inválidos ou nome ausente: ${JSON.stringify(playerData)}`
        );
        continue;
      }

      try {
        const existingPlayer = selectStmt.get(tournamentId, playerData.name);
        if (existingPlayer) {
          console.warn(
            `Jogador "${playerData.name}" já existe no torneio ${tournamentId} e foi ignorado na importação.`
          );
          continue;
        }

        const info = insertStmt.run(
          tournamentId,
          playerData.name,
          playerData.nickname || null,
          playerData.gender || null,
          playerData.skill_level || null
        );
        if (info.changes > 0) {
          importedCount++;
        }
      } catch (error) {
        // Tratar erro de constraint UNIQUE especificamente se necessário, embora a verificação acima deva prevenir
        if (error.message.includes('UNIQUE constraint failed')) {
          errors.push(
            `Jogador "${playerData.name}" já existe neste torneio (erro de constraint).`
          );
        } else {
          errors.push(
            `Erro ao importar jogador "${playerData.name}": ${error.message}`
          );
        }
      }
    }
  });
  return { count: importedCount, errors };
}

/**
 * Substitui todos os jogadores de um torneio pela nova lista fornecida.
 * Primeiro remove todos os jogadores existentes do torneio e depois adiciona os novos.
 * @param {string} tournamentId ID do torneio
 * @param {Array<object>} newPlayersArray Array de objetos de jogador para adicionar
 * @returns {Promise<{ count: number, errors: Array<string> }>} Contagem de novos jogadores adicionados e quaisquer erros.
 */
async function replacePlayerListForTournament(tournamentId, newPlayersArray) {
  if (!tournamentId) {
    throw new Error('ID do torneio é obrigatório.');
  }
  if (!Array.isArray(newPlayersArray)) {
    throw new Error('A nova lista de jogadores deve ser um array.');
  }

  let addedCount = 0;
  const errors = [];

  // Usar transactionAsync que passa 'db' para a callback
  await transactionAsync((db) => {
    // Remover jogadores existentes
    const deleteStmt = db.prepare(
      'DELETE FROM players WHERE tournament_id = ?'
    );
    const deleteInfo = deleteStmt.run(tournamentId);
    console.log(
      `Jogadores existentes do torneio ${tournamentId} removidos: ${deleteInfo.changes}`
    );

    // Adicionar novos jogadores
    const insertStmt = db.prepare(`
      INSERT INTO players (tournament_id, name, nickname, games_played, wins, losses, gender, skill_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const playerData of newPlayersArray) {
      if (!playerData || !playerData.name) {
        errors.push(
          `Dados do jogador inválidos ou nome ausente na nova lista: ${JSON.stringify(playerData)}`
        );
        continue;
      }
      const name = playerData.PlayerName || playerData.name;
      const nickname = playerData.Nickname || playerData.nickname;
      const gender = playerData.gender;
      const skill_level = playerData.skill_level;

      try {
        const info = insertStmt.run(
          tournamentId,
          name,
          nickname || null,
          playerData.GamesPlayed || 0,
          playerData.Wins || 0,
          playerData.Losses || 0,
          gender || null,
          skill_level || null
        );
        if (info.changes > 0) {
          addedCount++;
        }
      } catch (error) {
        // Tratar erro de constraint UNIQUE especificamente se necessário
        if (error.message.includes('UNIQUE constraint failed')) {
          errors.push(
            `Jogador "${name}" já existe neste torneio (erro de constraint ao adicionar).`
          );
        } else {
          errors.push(
            `Erro ao adicionar novo jogador "${name}" ao torneio ${tournamentId}: ${error.message}`
          );
        }
      }
    }
  });

  if (errors.length > 0) {
    console.error('Erros durante replacePlayerListForTournament:', errors);
  }
  return { count: addedCount, errors };
}

/**
 * Conta o número total de jogadores em todos os torneios.
 * @returns {Promise<number>} Número total de jogadores.
 */
async function countPlayers() {
  const sql = 'SELECT COUNT(*) as count FROM players';
  try {
    const row = await getOneAsync(sql);
    return row ? row.count : 0;
  } catch (err) {
    console.error('Erro ao contar jogadores:', err.message);
    throw err;
  }
}

module.exports = {
  getPlayersByTournamentId,
  getPlayerById,
  getPlayerByNameInTournament,
  addPlayer,
  updatePlayer,
  deletePlayer,
  deletePlayersByTournamentId,
  importPlayers,
  replacePlayerListForTournament,
  countPlayers,
};
