const {
  queryAsync,
  runAsync,
  getOneAsync,
  transactionAsync,
} = require('../db/database');
const { logger } = require('../logger/logger');

async function getPlayersByTournamentId(tournamentId, options = {}) {
  if (!tournamentId) {
    throw new Error('ID do torneio não fornecido');
  }

  const { limit, offset, orderBy = 'name', order = 'ASC' } = options;

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
    logger.error(
      'PlayerModel',
      `Erro ao buscar jogadores para o torneio ${tournamentId}: ${err.message}`,
      { tournamentId, error: err }
    );
    throw err;
  }
}

async function getPlayerById(playerId) {
  if (!playerId) {
    throw new Error('ID do jogador não fornecido');
  }
  const sql = 'SELECT * FROM players WHERE id = ?';
  try {
    return await getOneAsync(sql, [playerId]);
  } catch (err) {
    logger.error(
      'PlayerModel',
      `Erro ao buscar jogador com ID ${playerId}: ${err.message}`,
      { playerId, error: err }
    );
    throw err;
  }
}

async function getPlayerByNameInTournament(tournamentId, playerName) {
  if (!tournamentId || !playerName) {
    throw new Error('ID do torneio e nome do jogador são obrigatórios.');
  }
  const sql = 'SELECT * FROM players WHERE tournament_id = ? AND name = ?';
  try {
    return await getOneAsync(sql, [tournamentId, playerName]);
  } catch (err) {
    logger.error(
      'PlayerModel',
      `Erro ao buscar jogador "${playerName}" no torneio ${tournamentId}: ${err.message}`,
      { tournamentId, playerName, error: err }
    );
    throw err;
  }
}

async function addPlayer(playerData) {
  const {
    tournament_id,
    name,
    nickname,
    gender,
    skill_level,
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
      gender || null,
      skill_level || null,
    ]);
    return await getPlayerById(result.lastInsertRowid);
  } catch (err) {
    if (
      err.message.includes(
        'UNIQUE constraint failed: players.tournament_id, players.name'
      )
    ) {
      logger.warn(
        'PlayerModel',
        `Tentativa de adicionar jogador duplicado: ${name} no torneio ${tournament_id}`,
        { name, tournament_id }
      );
      throw new Error(`Jogador "${name}" já existe neste torneio.`);
    }
    logger.error('PlayerModel', 'Erro ao adicionar jogador:', {
      error: err,
      playerData,
    });
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
    gender,
    skill_level,
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
    fieldsToUpdate.push('gender = ?');
    values.push(gender);
  }
  if (skill_level !== undefined) {
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
    logger.error(
      'PlayerModel',
      `Erro ao atualizar jogador ${playerId}: ${err.message}`,
      { playerId, playerData, error: err }
    );
    throw err;
  }
}

async function deletePlayer(playerId) {
  if (!playerId) {
    throw new Error('ID do jogador não fornecido');
  }
  const sql = 'DELETE FROM players WHERE id = ?';
  try {
    const result = await runAsync(sql, [playerId]);
    return result.changes > 0;
  } catch (err) {
    logger.error(
      'PlayerModel',
      `Erro ao remover jogador ${playerId}: ${err.message}`,
      { playerId, error: err }
    );
    throw err;
  }
}

async function deletePlayersByTournamentId(tournamentId) {
  if (!tournamentId) {
    throw new Error('ID do torneio não fornecido');
  }
  const sql = 'DELETE FROM players WHERE tournament_id = ?';
  try {
    const result = await runAsync(sql, [tournamentId]);
    return result.changes;
  } catch (err) {
    logger.error(
      'PlayerModel',
      `Erro ao remover jogadores do torneio ${tournamentId}: ${err.message}`,
      { tournamentId, error: err }
    );
    throw err;
  }
}

async function importPlayers(tournamentId, playersArray) {
  if (!tournamentId) {
    throw new Error('ID do torneio é obrigatório para importar jogadores.');
  }
  if (!Array.isArray(playersArray)) {
    throw new Error('A lista de jogadores deve ser um array.');
  }

  let importedCount = 0;
  const errors = [];

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
          logger.warn(
            'PlayerModel',
            `Jogador "${playerData.name}" já existe no torneio ${tournamentId} e foi ignorado na importação.`,
            { playerName: playerData.name, tournamentId }
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

async function replacePlayerListForTournament(tournamentId, newPlayersArray) {
  if (!tournamentId) {
    throw new Error('ID do torneio é obrigatório.');
  }
  if (!Array.isArray(newPlayersArray)) {
    throw new Error('A nova lista de jogadores deve ser um array.');
  }

  let addedCount = 0;
  const errors = [];

  await transactionAsync((db) => {
    const deleteStmt = db.prepare(
      'DELETE FROM players WHERE tournament_id = ?'
    );
    const deleteInfo = deleteStmt.run(tournamentId);
    logger.info(
      'PlayerModel',
      `Jogadores existentes do torneio ${tournamentId} removidos: ${deleteInfo.changes}`,
      { tournamentId, removedCount: deleteInfo.changes }
    );

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
    logger.error(
      'PlayerModel',
      'Erros durante replacePlayerListForTournament:',
      { tournamentId, errors }
    );
  }
  return { count: addedCount, errors };
}

async function countPlayers() {
  const sql = 'SELECT COUNT(*) as count FROM players';
  try {
    const row = await getOneAsync(sql);
    return row ? row.count : 0;
  } catch (err) {
    logger.error('PlayerModel', 'Erro ao contar jogadores:', { error: err });
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
