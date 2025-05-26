const { getSyncConnection } = require('./database'); // Atualizado para database
const { logger } = require('../logger/logger'); // Importar logger

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
    logger.info(
      { component: 'SchemaMigration', tableName, columnName },
      `Coluna '${columnName}' já existe na tabela '${tableName}'.`
    );
    return false;
  }

  const alterSql = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef};`;
  try {
    db.exec(alterSql);
    logger.info(
      { component: 'SchemaMigration', tableName, columnName },
      `Coluna '${columnName}' adicionada à tabela '${tableName}'.`
    );
    return true;
  } catch (err) {
    logger.error(
      {
        component: 'SchemaMigration',
        tableName,
        columnName,
        err,
        sql: alterSql,
      },
      `Erro ao adicionar coluna '${columnName}' à tabela '${tableName}'.`
    );
    throw err; // Relança o erro para ser tratado pela runMigrations
  }
}

function runMigrations() {
  logger.info({ component: 'SchemaMigration' }, 'Executando migrações do banco de dados...');
  const db = getSyncConnection(); // Obter conexão síncrona

  try {
    // Adicionar colunas que foram definidas em lib/database.js mas podem não existir em DBs antigos
    addColumnIfNotExistsSync(db, 'users', 'role', "TEXT DEFAULT 'user'");
    addColumnIfNotExistsSync(db, 'users', 'last_login', 'TEXT');

    addColumnIfNotExistsSync(db, 'tournaments', 'entry_fee', 'REAL DEFAULT 0.0');
    addColumnIfNotExistsSync(db, 'tournaments', 'prize_pool', 'TEXT');
    addColumnIfNotExistsSync(db, 'tournaments', 'rules', 'TEXT');
    addColumnIfNotExistsSync(db, 'tournaments', 'created_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');
    addColumnIfNotExistsSync(db, 'tournaments', 'updated_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');
    addColumnIfNotExistsSync(db, 'tournaments', 'deleted_at', 'TEXT'); // Add deleted_at for tournaments

    addColumnIfNotExistsSync(db, 'players', 'gender', 'TEXT');
    addColumnIfNotExistsSync(db, 'players', 'skill_level', 'TEXT');

    // Add email column without UNIQUE constraint first
    const emailColumnAdded = addColumnIfNotExistsSync(db, 'players', 'email', 'TEXT');
    if (emailColumnAdded) {
      logger.info(
        { component: 'SchemaMigration', tableName: 'players', columnName: 'email' },
        "Coluna 'email' adicionada. Tentando criar índice UNIQUE se não existir."
      );
      try {
        // Create a UNIQUE index, allowing multiple NULLs but ensuring non-NULL emails are unique.
        // Note: SQLite versions < 3.9.0 might treat NULLs differently in unique indexes.
        // For broader compatibility, ensure application logic handles uniqueness for empty strings if those are allowed.
        db.exec(
          'CREATE UNIQUE INDEX IF NOT EXISTS idx_players_email_unique ON players (email) WHERE email IS NOT NULL;'
        );
        logger.info(
          {
            component: 'SchemaMigration',
            tableName: 'players',
            indexName: 'idx_players_email_unique',
          },
          "Índice UNIQUE para 'email' criado/verificado."
        );
      } catch (indexErr) {
        logger.error(
          {
            component: 'SchemaMigration',
            tableName: 'players',
            indexName: 'idx_players_email_unique',
            err: indexErr,
          },
          "Erro ao criar índice UNIQUE para 'email'. Pode haver emails duplicados ou NULLs conflitantes."
        );
        // Not re-throwing here, as the column exists. Uniqueness might need manual data cleanup.
      }
    } else {
      // If column already existed, still check/create index just in case it wasn't created before.
      try {
        db.exec(
          'CREATE UNIQUE INDEX IF NOT EXISTS idx_players_email_unique ON players (email) WHERE email IS NOT NULL;'
        );
      } catch (indexErr) {
        // Log quietly if index creation fails when column already existed
        logger.warn(
          {
            component: 'SchemaMigration',
            tableName: 'players',
            indexName: 'idx_players_email_unique',
            err: indexErr,
          },
          "Aviso: Falha ao tentar criar índice UNIQUE para 'email' (coluna já existia)."
        );
      }
    }

    addColumnIfNotExistsSync(db, 'players', 'deleted_at', 'TEXT');

    // Colunas para a tabela scores conforme o novo schema em database.js
    addColumnIfNotExistsSync(db, 'scores', 'round', 'TEXT');
    addColumnIfNotExistsSync(
      db,
      'scores',
      'winner_id',
      'INTEGER REFERENCES players(id) ON DELETE SET NULL'
    );
    // completed_at já está sendo adicionado, mas mantê-lo aqui não prejudica, pois a função verifica a existência.
    addColumnIfNotExistsSync(db, 'scores', 'completed_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');
    addColumnIfNotExistsSync(db, 'scores', 'is_deleted', 'INTEGER DEFAULT 0');
    addColumnIfNotExistsSync(db, 'scores', 'deleted_at', 'TEXT');
    // As colunas antigas 'winner', 'player1', 'player2' (nomes) e 'tournament_id' (redundante)
    // da tabela 'scores' são consideradas obsoletas.
    // Uma migração de dados para popular 'winner_id' a partir de 'winner' (se aplicável e se 'winner' continha IDs)
    // e para remover essas colunas de bancos de dados existentes seria uma tarefa separada.
    // Para novas instalações, o schema em db-init.js já não inclui essas colunas antigas.

    logger.info(
      { component: 'SchemaMigration' },
      'Migrações do banco de dados verificadas/executadas com sucesso.'
    );
  } catch (error) {
    logger.error(
      { component: 'SchemaMigration', err: error },
      'Erro durante as migrações do banco de dados.'
    );
    throw error;
  }
}

module.exports = {
  runMigrations,
};
