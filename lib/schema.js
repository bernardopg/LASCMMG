const { getAsyncConnection, closeAsyncConnection } = require('./db');

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  hashedPassword TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date TIMESTAMP,
  description TEXT,
  num_players_expected INTEGER,
  status TEXT DEFAULT 'Pendente',
  bracket_type TEXT DEFAULT 'single-elimination',
  entry_fee REAL DEFAULT 0.0,
  prize_pool TEXT,
  rules TEXT,
  state_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id TEXT NOT NULL,
  name TEXT NOT NULL,
  nickname TEXT,
  gender TEXT,
  skill_level TEXT,
  games_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  UNIQUE(tournament_id, name)
);

CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id TEXT NOT NULL,
  match_number INTEGER NOT NULL,
  round TEXT NOT NULL,
  player1_id INTEGER,
  player2_id INTEGER,
  scheduled_at TIMESTAMP,
  next_match INTEGER,
  next_loser_match INTEGER,
  bracket TEXT DEFAULT 'WB',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY(player1_id) REFERENCES players(id),
  FOREIGN KEY(player2_id) REFERENCES players(id),
  FOREIGN KEY(next_match) REFERENCES matches(id),
  FOREIGN KEY(next_loser_match) REFERENCES matches(id),
  UNIQUE(tournament_id, match_number)
);

CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id INTEGER NOT NULL,
  player1_score INTEGER NOT NULL,
  player2_score INTEGER NOT NULL,
  winner_id INTEGER,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY(winner_id) REFERENCES players(id)
);

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_players_tournament ON players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_scores_match ON scores(match_id);
`;

async function initializeDatabase() {
  console.log('Inicializando esquema do banco de dados...');
  const db = getAsyncConnection();

  return new Promise((resolve, reject) => {
    db.exec(SCHEMA_SQL, (err) => {
      if (err) {
        console.error(
          'Erro ao inicializar esquema do banco de dados:',
          err.message
        );
        closeAsyncConnection(db);
        reject(err);
        return;
      }

      console.log('Esquema do banco de dados inicializado com sucesso!');
      closeAsyncConnection(db);
      resolve();
    });
  });
}

async function tableExists(tableName) {
  if (!tableName) {
    throw new Error('Nome da tabela não especificado');
  }

  const db = getAsyncConnection();

  return new Promise((resolve, reject) => {
    const sql = `
      SELECT name FROM sqlite_master
      WHERE type='table' AND name = ?;
    `;

    db.get(sql, [tableName], (err, row) => {
      if (err) {
        console.error(
          `Erro ao verificar se a tabela '${tableName}' existe:`,
          err.message
        );
        closeAsyncConnection(db);
        reject(err);
        return;
      }

      closeAsyncConnection(db);
      resolve(!!row);
    });
  });
}

async function addColumnIfNotExists(db, tableName, columnName, columnDef) {
  if (!db || !tableName || !columnName || !columnDef) {
    throw new Error(
      'Parâmetros inválidos para adicionar coluna (db, tableName, columnName, columnDef)'
    );
  }

  return new Promise((resolve, reject) => {
    const checkSql = `PRAGMA table_info(${tableName});`;

    db.all(checkSql, [], (err, rows) => {
      if (err) {
        console.error(`Erro ao verificar coluna '${columnName}':`, err.message);
        reject(err);
        return;
      }

      const columnExists = rows.some((row) => row.name === columnName);

      if (columnExists) {
        console.log(
          `Coluna '${columnName}' já existe na tabela '${tableName}'`
        );
        resolve(false);
        return;
      }

      const alterSql = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef};`;

      db.run(alterSql, [], function (err) {
        if (err) {
          console.error(
            `Erro ao adicionar coluna '${columnName}' à tabela '${tableName}':`,
            err.message
          );
          reject(err);
          return;
        }

        console.log(
          `Coluna '${columnName}' adicionada à tabela '${tableName}'`
        );
        resolve(true);
      });
    });
  });
}

async function runMigrations() {
  console.log('Executando migrações do banco de dados...');
  let db;

  try {
    db = getAsyncConnection();

    await addColumnIfNotExists(
      db,
      'tournaments',
      'entry_fee',
      'REAL DEFAULT 0.0'
    );
    await addColumnIfNotExists(db, 'tournaments', 'prize_pool', 'TEXT');
    await addColumnIfNotExists(db, 'tournaments', 'rules', 'TEXT');

    await addColumnIfNotExists(db, 'players', 'gender', 'TEXT');
    await addColumnIfNotExists(db, 'players', 'skill_level', 'TEXT');

    console.log(
      'Migrações do banco de dados verificadas/executadas com sucesso.'
    );
  } catch (error) {
    console.error('Erro durante as migrações do banco de dados:', error);
    throw error;
  } finally {
    if (db) {
      closeAsyncConnection(db);
    }
  }
}

module.exports = {
  initializeDatabase,
  tableExists,
  addColumnIfNotExists,
  runMigrations,
  SCHEMA_SQL,
};
