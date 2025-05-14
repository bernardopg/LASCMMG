const BetterSqlite3 = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data.db');
let db;

try {
  db = new BetterSqlite3(DB_PATH, { verbose: console.log }); // Adiciona log para verbose, similar ao sqlite3
  console.log('Connected to the SQLite database using better-sqlite3.');
  initializeDatabase();
} catch (err) {
  console.error('Error opening database with better-sqlite3:', err.message);
  throw err;
}

function initializeDatabase() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      hashedPassword TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      last_login TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `;
  // Adicionado created_at também, pois é usado em adminModel.createAdmin

  const createTournamentsTable = `
    CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      date TEXT,
      status TEXT DEFAULT 'Pendente',
      description TEXT,
      num_players_expected INTEGER,
      bracket_type TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createPlayersTable = `
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id TEXT NOT NULL,
      name TEXT NOT NULL,
      nickname TEXT,
      games_played INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      score INTEGER DEFAULT 0,
      gender TEXT,
      skill_level TEXT,
      FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE,
      UNIQUE (tournament_id, name)
    );
  `;

  const createScoresTable = `
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id TEXT NOT NULL,
      round TEXT,
      player1 TEXT,
      player2 TEXT,
      score1 INTEGER,
      score2 INTEGER,
      winner TEXT,
      timestamp TEXT,
      match_id INTEGER,
      completed_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createMatchesTable = `
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id TEXT NOT NULL,
      match_number INTEGER NOT NULL,
      round TEXT NOT NULL,
      player1_id INTEGER,
      player2_id INTEGER,
      scheduled_at TEXT,
      next_match INTEGER, -- Store match_number of the next match
      next_loser_match INTEGER, -- Store match_number of the next loser bracket match
      bracket TEXT, -- e.g., 'WB', 'LB', 'GF'
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE,
      FOREIGN KEY (player1_id) REFERENCES players (id) ON DELETE SET NULL,
      FOREIGN KEY (player2_id) REFERENCES players (id) ON DELETE SET NULL
      -- UNIQUE (tournament_id, match_number) -- Consider if match_number should be unique per tournament
    );
  `;

  const createTournamentStateTable = `
    CREATE TABLE IF NOT EXISTS tournament_state (
      tournament_id TEXT PRIMARY KEY,
      state_json TEXT,
      FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE
    );
  `;

  const createTrashTable = `
      CREATE TABLE IF NOT EXISTS trash (
          tournament_id TEXT PRIMARY KEY,
          trashed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE
      );
  `;

  try {
    db.exec(createUsersTable);
    db.exec(createTournamentsTable);
    db.exec(createPlayersTable);
    db.exec(createScoresTable);
    db.exec(createMatchesTable); // Adicionar execução
    db.exec(createTournamentStateTable);
    db.exec(createTrashTable);
    console.log('Database tables initialized/verified.');
  } catch (err) {
    console.error('Error initializing tables:', err.message);
    // Considerar se deve relançar o erro ou tratar de outra forma
  }
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql);
      const info = stmt.run(params);
      resolve({ lastID: info.lastInsertRowid, changes: info.changes });
    } catch (err) {
      console.error(
        'DB Run Error:',
        err.message,
        'SQL:',
        sql,
        'Params:',
        params
      );
      reject(err);
    }
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql);
      const row = stmt.get(params);
      resolve(row);
    } catch (err) {
      console.error(
        'DB Get Error:',
        err.message,
        'SQL:',
        sql,
        'Params:',
        params
      );
      reject(err);
    }
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql);
      const rows = stmt.all(params);
      resolve(rows);
    } catch (err) {
      console.error(
        'DB All Error:',
        err.message,
        'SQL:',
        sql,
        'Params:',
        params
      );
      reject(err);
    }
  });
}

// Exporta a instância do banco de dados para uso direto se necessário,
// embora o uso através das funções run/get/all seja recomendado.
module.exports = {
  db,
  run,
  get,
  all,
};
