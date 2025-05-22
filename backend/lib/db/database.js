const BetterSqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { DB_CONFIG, NODE_ENV } = require('../config/config'); // Importar NODE_ENV também
const { logger } = require('../logger/logger'); // Importar logger

// Construir DB_PATH usando DB_CONFIG.dataDir e DB_CONFIG.dbFile
const DB_PATH = path.join(DB_CONFIG.dataDir, DB_CONFIG.dbFile);
let db;

try {
  // Garantir que o diretório de dados exista
  const dataDir = DB_CONFIG.dataDir;
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    logger.info(
      { component: 'Database' },
      `Diretório de dados criado em: ${dataDir}`
    );
  }

  // Configurar verbose logging apenas em desenvolvimento se logQueries for true
  const verboseLogger =
    DB_CONFIG.logQueries && NODE_ENV === 'development'
      ? (message) => logger.debug({ component: 'SQLITE_VERBOSE' }, message) // Usar logger.debug para verbose
      : undefined;

  db = new BetterSqlite3(DB_PATH, { verbose: verboseLogger });
  logger.info(
    { component: 'Database' },
    'Conectado ao banco de dados SQLite usando better-sqlite3.'
  );

  // Habilitar modo WAL
  try {
    db.pragma('journal_mode = WAL');
    logger.info({ component: 'Database' }, 'Modo WAL do SQLite habilitado.');
  } catch (walErr) {
    logger.error(
      { component: 'Database', err: walErr },
      'Falha ao habilitar modo WAL para SQLite.'
    );
  }

  // A inicialização do esquema (criação de tabelas, migrações)
  // é agora gerenciada por 'lib/db/db-init.js' e chamada explicitamente
  // no servidor (applyDatabaseMigrations) ou scripts de setup.
  // initializeDatabase(); // Removido daqui
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error opening database with better-sqlite3:', err.message);
  throw err;
}

// Função para verificar a saúde do banco de dados
function checkDbConnection() {
  try {
    db.prepare('SELECT 1').get();
    return {
      status: 'ok',
      message: 'Conexão com banco de dados bem-sucedida.',
    };
  } catch (err) {
    logger.error(
      { component: 'Database', err },
      'Falha na verificação de saúde do banco de dados.'
    );
    return {
      status: 'error',
      message: 'Database connection failed.',
      error: err.message,
    };
  }
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

  const createTournamentsTable = `
    CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      date TEXT,
      status TEXT DEFAULT 'Pendente', -- Indexed
      description TEXT,
      num_players_expected INTEGER,
      bracket_type TEXT,
      entry_fee REAL, -- Adicionado
      prize_pool TEXT, -- Adicionado
      rules TEXT, -- Adicionado
      is_deleted INTEGER DEFAULT 0, -- Added for soft delete
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT -- Added for soft delete timestamp
    );
  `;

  const createPlayersTable = `
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id TEXT, -- Made nullable for global players
      name TEXT NOT NULL,
      nickname TEXT,
      email TEXT UNIQUE, -- Added email, make it unique for global players
      games_played INTEGER DEFAULT 0, -- These stats are per tournament, might be less relevant for global
      wins INTEGER DEFAULT 0,       -- Consider moving to a tournament_participants table later
      losses INTEGER DEFAULT 0,
      score INTEGER DEFAULT 0,
      gender TEXT,
      skill_level TEXT,
      is_deleted INTEGER DEFAULT 0,
      deleted_at TEXT, -- Added for soft delete timestamp
      FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE,
      UNIQUE (tournament_id, name) -- Ensures a player name is unique within a specific tournament
      -- The existing email TEXT UNIQUE handles global email uniqueness.
      -- Global players (tournament_id IS NULL) can have the same name if their emails differ.
    );
  `;

  const createScoresTable = `
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER NOT NULL, -- FK para matches.id
      round TEXT,
      player1_score INTEGER,
      player2_score INTEGER,
      winner_id INTEGER, -- ID do jogador vencedor, FK para players.id
      timestamp TEXT,
      completed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      is_deleted INTEGER DEFAULT 0,
      deleted_at TEXT,
      FOREIGN KEY (match_id) REFERENCES matches (id) ON DELETE CASCADE,
      FOREIGN KEY (winner_id) REFERENCES players (id) ON DELETE SET NULL
    );
  `;

  const createMatchesTable = `
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id TEXT NOT NULL, -- Indexed as part of composite index
      match_number INTEGER NOT NULL,
      round TEXT NOT NULL, -- Indexed as part of composite index
      player1_id INTEGER,
      player2_id INTEGER,
      scheduled_at TEXT, -- Indexed
      next_match INTEGER, -- Store match_number of the next match
      next_loser_match INTEGER, -- Store match_number of the next loser bracket match
      bracket TEXT, -- e.g., 'WB', 'LB', 'GF'
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE,
      FOREIGN KEY (player1_id) REFERENCES players (id) ON DELETE SET NULL,
      FOREIGN KEY (player2_id) REFERENCES players (id) ON DELETE SET NULL,
      UNIQUE (tournament_id, match_number)
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

  // Índices adicionais para otimização de consultas
  const createTournamentStatusDateIndex = `CREATE INDEX IF NOT EXISTS idx_tournaments_status_date ON tournaments(status, date);`;
  const createTournamentStatusDeletedIndex = `CREATE INDEX IF NOT EXISTS idx_tournaments_status_deleted ON tournaments(status, is_deleted);`; // Added new index
  const createScoresMatchIdIndex = `CREATE INDEX IF NOT EXISTS idx_scores_match_id ON scores(match_id);`; // Corrigido: removido tournament_id
  const createScoresTimestampIndex = `CREATE INDEX IF NOT EXISTS idx_scores_timestamp ON scores(timestamp);`;
  const createMatchesTournamentRoundScheduledAtIndex = `CREATE INDEX IF NOT EXISTS idx_matches_tournament_round_scheduled_at ON matches(tournament_id, round, scheduled_at);`;
  const createMatchesScheduledAtIndex = `CREATE INDEX IF NOT EXISTS idx_matches_scheduled_at ON matches(scheduled_at);`;
  const createPlayersTournamentIdDeletedIndex = `CREATE INDEX IF NOT EXISTS idx_players_tournament_id_deleted ON players (tournament_id, is_deleted);`; // New Index
  const createPlayersNameIndex = `CREATE INDEX IF NOT EXISTS idx_players_name ON players (name);`; // New Index

  try {
    db.exec(createUsersTable);
    db.exec(createTournamentsTable);
    // try { db.exec(alterTournamentsTable1); } catch (e) { /* ignorar se a coluna já existe */ }
    // try { db.exec(alterTournamentsTable2); } catch (e) { /* ignorar se a coluna já existe */ }
    // try { db.exec(alterTournamentsTable3); } catch (e) { /* ignorar se a coluna já existe */ }
    db.exec(createPlayersTable);
    db.exec(createScoresTable);
    db.exec(createMatchesTable);
    db.exec(createTournamentStateTable);
    db.exec(createTrashTable);

    // Executar criação de índices adicionais
    db.exec(createTournamentStatusDateIndex);
    db.exec(createTournamentStatusDeletedIndex); // Added new index execution
    db.exec(createScoresMatchIdIndex); // Corrigido
    db.exec(createScoresTimestampIndex);
    db.exec(createMatchesTournamentRoundScheduledAtIndex);
    db.exec(createMatchesScheduledAtIndex);
    db.exec(createPlayersTournamentIdDeletedIndex); // Execute new index
    db.exec(createPlayersNameIndex); // Execute new index

    logger.info({ component: 'Database' }, 'Banco de dados inicializado/verificado com sucesso.');
  } catch (err) {
    logger.error({ component: 'Database', err }, 'Erro ao inicializar o banco de dados.');
    throw err;
  }
}

// --- Funções de Acesso a Dados (Consolidadas de lib/db.js) ---

/**
 * Obtém a instância síncrona da conexão com o banco de dados.
 * @returns {BetterSqlite3.Database} Instância do banco de dados.
 */
function getSyncConnection() {
  if (!db || !db.open) {
    logger.error(
      { component: 'Database' },
      'Instância DB não está disponível ou aberta!'
    );
    throw new Error('Conexão com banco de dados não estabelecida.');
  }
  return db;
}

/**
 * Fecha a conexão síncrona com o banco de dados.
 */
function closeSyncConnection() {
  if (db && db.open) {
    try {
      db.close();
      if (NODE_ENV !== 'production' && NODE_ENV !== 'test') {
        logger.info({ component: 'Database' }, 'Conexão SQLite fechada.');
      }
    } catch (err) {
      logger.error(
        { component: 'Database', err },
        'Erro ao fechar conexão SQLite.'
      );
    }
  }
}

/**
 * Executa uma query SQL com parâmetros e retorna uma Promise com os resultados.
 * Internamente usa a API síncrona de better-sqlite3.
 * @param {string} sql Query SQL a ser executada
 * @param {Array|Object} params Parâmetros para a query
 * @returns {Promise<Array>} Resultado da query
 */
function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const result = querySync(sql, params);
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Executa uma query SQL de manipulação (INSERT, UPDATE, DELETE) e retorna uma Promise.
 * Internamente usa a API síncrona de better-sqlite3.
 * @param {string} sql Query SQL a ser executada
 * @param {Array|Object} params Parâmetros para a query
 * @returns {Promise<object>} Objeto com o número de linhas afetadas e o último id inserido
 */
function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const result = runSync(sql, params);
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Executa uma query SQL e retorna um único registro (ou null) em uma Promise.
 * Internamente usa a API síncrona de better-sqlite3.
 * @param {string} sql Query SQL a ser executada
 * @param {Array|Object} params Parâmetros para a query
 * @returns {Promise<object|null>} Primeiro registro encontrado ou null
 */
function getOneAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const result = getOneSync(sql, params);
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Executa múltiplas operações em uma transação, retornando uma Promise.
 * Internamente usa a API síncrona de transação de better-sqlite3.
 * @param {Function} actions Função que recebe a instância do banco de dados síncrona e executa operações.
 * @returns {Promise<any>} Resultado da transação
 */
function transactionAsync(actions) {
  return new Promise((resolve, reject) => {
    try {
      const db = getSyncConnection();
      const transaction = db.transaction(() => actions(db));
      const result = transaction();
      resolve(result);
    } catch (err) {
      logger.error(
        { component: 'Database', err },
        'Erro na transação assíncrona (wrapper).'
      );
      reject(err);
    }
  });
}

/**
 * Executa uma query SQL síncrona
 * @param {string} sql Query SQL a ser executada
 * @param {Array|Object} params Parâmetros para a query
 * @returns {Array} Resultado da query
 */
function querySync(sql, params = []) {
  const db = getSyncConnection();
  try {
    const stmt = db.prepare(sql);
    const result = Array.isArray(params)
      ? stmt.all(...params)
      : stmt.all(params);
    return result;
  } catch (err) {
    logger.error(
      { component: 'Database', sql, params, err },
      'Erro ao executar query síncrona.'
    );
    throw err;
  }
}

/**
 * Executa uma query SQL síncrona e retorna um único registro
 * @param {string} sql Query SQL a ser executada
 * @param {Array|Object} params Parâmetros para a query
 * @returns {object|null} Primeiro registro encontrado ou null
 */
function getOneSync(sql, params = []) {
  const db = getSyncConnection();
  try {
    const stmt = db.prepare(sql);
    const result = Array.isArray(params)
      ? stmt.get(...params)
      : stmt.get(params);
    return result || null;
  } catch (err) {
    logger.error(
      { component: 'Database', sql, params, err },
      'Erro ao executar getOne síncrono.'
    );
    throw err;
  }
}

/**
 * Executa uma query SQL síncrona de manipulação (INSERT, UPDATE, DELETE)
 * @param {string} sql Query SQL a ser executada
 * @param {Array|Object} params Parâmetros para a query
 * @returns {object} Objeto com informações sobre a operação
 */
function runSync(sql, params = []) {
  const db = getSyncConnection();
  try {
    const stmt = db.prepare(sql);
    const info = Array.isArray(params) ? stmt.run(...params) : stmt.run(params);
    return {
      lastInsertRowid: info.lastInsertRowid,
      changes: info.changes,
    };
  } catch (err) {
    logger.error(
      { component: 'Database', sql, params, err },
      'Erro ao executar run síncrono.'
    );
    throw err;
  }
}

/**
 * Executa múltiplas operações em uma transação síncrona.
 * A função 'actions' recebe a instância do banco de dados como argumento.
 * @param {Function} actions Função que define as operações. Ex: (db) => { db.prepare(...).run(...); }
 * @returns {any} Resultado da transação
 */
function transactionSync(actions) {
  const db = getSyncConnection();
  try {
    const transaction = db.transaction(() => actions(db));
    const result = transaction();
    return result;
  } catch (err) {
    logger.error({ component: 'Database', err }, 'Erro na transação síncrona.');
    throw err;
  }
}

// Exporta a instância do banco de dados e todas as funções de acesso
module.exports = {
  db, // Exporta a instância para uso direto (com cautela)
  checkDbConnection, // Função de saúde

  // Funções "assíncronas" (wrappers de Promise)
  queryAsync,
  runAsync,
  getOneAsync,
  transactionAsync,

  // Funções síncronas
  querySync,
  getOneSync,
  runSync,
  transactionSync,

  // Funções de conexão/fechamento síncronas (para uso avançado/encerramento)
  getSyncConnection,
  closeSyncConnection,
  initializeDatabase, // Exportar para ser chamada pelo db-init
};
