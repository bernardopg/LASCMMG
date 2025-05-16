const { getSyncConnection } = require('./database'); // Atualizado para database

function addColumnIfNotExistsSync(db, tableName, columnName, columnDef) {
  if (!db || !tableName || !columnName || !columnDef) {
    throw new Error(
      'Parâmetros inválidos para adicionar coluna (db, tableName, columnName, columnDef)'
    );
  }

  const checkSql = `PRAGMA table_info(${tableName});`;
  const rows = db.prepare(checkSql).all();
  const columnExists = rows.some((row) => row.name === columnName);

  if (columnExists) {
    console.log(`Coluna '${columnName}' já existe na tabela '${tableName}'`);
    return false;
  }

  const alterSql = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef};`;
  try {
    db.exec(alterSql);
    console.log(`Coluna '${columnName}' adicionada à tabela '${tableName}'`);
    return true;
  } catch (err) {
    console.error(
      `Erro ao adicionar coluna '${columnName}' à tabela '${tableName}':`,
      err.message
    );
    throw err; // Relança o erro para ser tratado pela runMigrations
  }
}

function runMigrations() {
  console.log('Executando migrações do banco de dados...');
  const db = getSyncConnection(); // Obter conexão síncrona

  try {
    // Adicionar colunas que foram definidas em lib/database.js mas podem não existir em DBs antigos
    addColumnIfNotExistsSync(db, 'users', 'role', "TEXT DEFAULT 'user'");
    addColumnIfNotExistsSync(db, 'users', 'last_login', 'TEXT');

    addColumnIfNotExistsSync(
      db,
      'tournaments',
      'entry_fee',
      'REAL DEFAULT 0.0'
    );
    addColumnIfNotExistsSync(db, 'tournaments', 'prize_pool', 'TEXT');
    addColumnIfNotExistsSync(db, 'tournaments', 'rules', 'TEXT');
    addColumnIfNotExistsSync(
      db,
      'tournaments',
      'created_at',
      'TEXT DEFAULT CURRENT_TIMESTAMP'
    );
    addColumnIfNotExistsSync(
      db,
      'tournaments',
      'updated_at',
      'TEXT DEFAULT CURRENT_TIMESTAMP'
    );

    addColumnIfNotExistsSync(db, 'players', 'gender', 'TEXT');
    addColumnIfNotExistsSync(db, 'players', 'skill_level', 'TEXT');

    // Colunas para a tabela scores conforme o novo schema em database.js
    addColumnIfNotExistsSync(db, 'scores', 'round', 'TEXT');
    addColumnIfNotExistsSync(
      db,
      'scores',
      'winner_id',
      'INTEGER REFERENCES players(id) ON DELETE SET NULL'
    );
    // completed_at já está sendo adicionado, mas mantê-lo aqui não prejudica, pois a função verifica a existência.
    addColumnIfNotExistsSync(
      db,
      'scores',
      'completed_at',
      'TEXT DEFAULT CURRENT_TIMESTAMP'
    );
    // TODO: Considerar uma migração para remover as colunas antigas de 'scores'
    // (winner, player1, player2, tournament_id) e popular winner_id a partir de winner se necessário.

    console.log(
      'Migrações do banco de dados verificadas/executadas com sucesso.'
    );
  } catch (error) {
    console.error('Erro durante as migrações do banco de dados:', error);
    throw error;
  }
}

module.exports = {
  runMigrations,
};
