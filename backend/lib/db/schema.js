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
    // eslint-disable-next-line no-console
    console.log(`Coluna '${columnName}' já existe na tabela '${tableName}'`);
    return false;
  }

  const alterSql = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef};`;
  try {
    db.exec(alterSql);
    // eslint-disable-next-line no-console
    console.log(`Coluna '${columnName}' adicionada à tabela '${tableName}'`);
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      `Erro ao adicionar coluna '${columnName}' à tabela '${tableName}':`,
      err.message
    );
    throw err; // Relança o erro para ser tratado pela runMigrations
  }
}

function runMigrations() {
  // eslint-disable-next-line no-console
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
    // As colunas antigas 'winner', 'player1', 'player2' (nomes) e 'tournament_id' (redundante)
    // da tabela 'scores' são consideradas obsoletas.
    // Uma migração de dados para popular 'winner_id' a partir de 'winner' (se aplicável e se 'winner' continha IDs)
    // e para remover essas colunas de bancos de dados existentes seria uma tarefa separada.
    // Para novas instalações, o schema em db-init.js já não inclui essas colunas antigas.

    // eslint-disable-next-line no-console
    console.log(
      'Migrações do banco de dados verificadas/executadas com sucesso.'
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Erro durante as migrações do banco de dados:', error);
    throw error;
  }
}

module.exports = {
  runMigrations,
};
