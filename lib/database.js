const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    throw err;
  } else {
    console.log('Connected to the SQLite database.');
    initializeDatabase();
  }
});

function initializeDatabase() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      hashedPassword TEXT NOT NULL
    );
  `;

  const createTournamentsTable = `
    CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      date TEXT,
      status TEXT DEFAULT 'Pendente',
      description TEXT,
      num_players_expected INTEGER,
      bracket_type TEXT
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
      FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE
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

  db.serialize(() => {
    db.run(createUsersTable, (err) => {
      if (err) console.error('Error creating users table:', err.message);
    });
    db.run(createTournamentsTable, (err) => {
      if (err) console.error('Error creating tournaments table:', err.message);
    });
    db.run(createPlayersTable, (err) => {
      if (err) console.error('Error creating players table:', err.message);
    });
    db.run(createScoresTable, (err) => {
      if (err) console.error('Error creating scores table:', err.message);
    });
    db.run(createTournamentStateTable, (err) => {
      if (err)
        console.error('Error creating tournament_state table:', err.message);
    });
    db.run(createTrashTable, (err) => {
      if (err) console.error('Error creating trash table:', err.message);
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        console.error(
          'DB Run Error:',
          err.message,
          'SQL:',
          sql,
          'Params:',
          params
        );
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error(
          'DB Get Error:',
          err.message,
          'SQL:',
          sql,
          'Params:',
          params
        );
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error(
          'DB All Error:',
          err.message,
          'SQL:',
          sql,
          'Params:',
          params
        );
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

module.exports = {
  db,
  run,
  get,
  all,
};
