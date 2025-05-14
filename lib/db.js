const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const BetterSqlite3 = require('better-sqlite3');
const fs = require('fs');
const { NODE_ENV } = require('./config');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'lascmmg.sqlite');
const TEST_DB_PATH = path.join(DB_DIR, 'lascmmg_test.sqlite');

let syncDbInstance = null;

function ensureDbDirExists() {
  if (!fs.existsSync(DB_DIR)) {
    console.log(`Criando diretório de dados em ${DB_DIR}`);
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

function getDbPath() {
  return NODE_ENV === 'test' ? TEST_DB_PATH : DB_PATH;
}

/**
 * Cria uma nova conexão SQLite3 (assíncrona) para operações complexas
 * @returns {sqlite3.Database} Objeto de conexão SQLite3
 */
function getAsyncConnection() {
  ensureDbDirExists();
  return new sqlite3.Database(getDbPath(), (err) => {
    if (err) {
      console.error('Erro ao conectar ao banco de dados SQLite3:', err.message);
      throw err;
    }
    if (NODE_ENV !== 'production') {
      console.log(`Conexão com SQLite3 estabelecida: ${getDbPath()}`);
    }
  });
}

/**
 * Cria uma nova conexão better-sqlite3 (síncrona) para operações simples e rápidas
 * @returns {BetterSqlite3.Database} Objeto de conexão better-sqlite3
 */
function getSyncConnection() {
  ensureDbDirExists();
  if (syncDbInstance && syncDbInstance.open) {
    return syncDbInstance;
  }

  try {
    syncDbInstance = new BetterSqlite3(getDbPath(), {
      verbose: NODE_ENV === 'development' ? console.log : null,
    });
    if (NODE_ENV !== 'production') {
      console.log(`Conexão síncrona com SQLite estabelecida: ${getDbPath()}`);
    }
    return syncDbInstance;
  } catch (err) {
    console.error(
      'Erro ao conectar ao banco de dados better-sqlite3:',
      err.message
    );
    syncDbInstance = null;
    throw err;
  }
}

/**
 * Fecha uma conexão SQLite3
 * @param {sqlite3.Database} db Conexão a ser fechada
 */
function closeAsyncConnection(db) {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Erro ao fechar conexão SQLite3:', err.message);
      }
      if (NODE_ENV !== 'production') {
        console.log('Conexão com SQLite3 fechada');
      }
    });
  }
}

/**
 * Fecha uma conexão better-sqlite3
 */
function closeSyncConnection() {
  if (syncDbInstance && syncDbInstance.open) {
    try {
      syncDbInstance.close();
      if (NODE_ENV !== 'production') {
        console.log('Conexão síncrona com SQLite fechada');
      }
    } catch (err) {
      console.error('Erro ao fechar conexão better-sqlite3:', err.message);
    } finally {
      syncDbInstance = null;
    }
  }
}

/**
 * Executa uma query SQL com parâmetros e retorna uma Promise
 * @param {string} sql Query SQL a ser executada
 * @param {Array} params Parâmetros para a query
 * @returns {Promise<Array>} Resultado da query
 */
function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = getAsyncConnection();
    db.all(sql, params, (err, rows) => {
      if (err) {
        closeAsyncConnection(db);
        reject(err);
        return;
      }
      closeAsyncConnection(db);
      resolve(rows);
    });
  });
}

/**
 * Executa uma query SQL de manipulação (INSERT, UPDATE, DELETE) e retorna uma Promise
 * @param {string} sql Query SQL a ser executada
 * @param {Array} params Parâmetros para a query
 * @returns {Promise<object>} Objeto com o número de linhas afetadas e o último id inserido
 */
function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = getAsyncConnection();
    db.run(sql, params, function (err) {
      if (err) {
        closeAsyncConnection(db);
        reject(err);
        return;
      }
      // Use function() to access this.lastID, this.changes
      closeAsyncConnection(db);
      resolve({
        lastID: this.lastID,
        changes: this.changes,
      });
    });
  });
}

/**
 * Executa uma query SQL e retorna um único registro (ou null)
 * @param {string} sql Query SQL a ser executada
 * @param {Array} params Parâmetros para a query
 * @returns {Promise<object|null>} Primeiro registro encontrado ou null
 */
function getOneAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = getAsyncConnection();
    db.get(sql, params, (err, row) => {
      if (err) {
        closeAsyncConnection(db);
        reject(err);
        return;
      }
      closeAsyncConnection(db);
      resolve(row || null);
    });
  });
}

/**
 * Executa múltiplas operações em uma transação
 * @param {Function} actions Função que recebe a conexão e executa operações
 * @returns {Promise<any>} Resultado da transação
 */
function transactionAsync(actions) {
  return new Promise((resolve, reject) => {
    const db = getAsyncConnection();

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      try {
        const result = actions(db);
        db.run('COMMIT', [], (err) => {
          if (err) {
            db.run('ROLLBACK');
            closeAsyncConnection(db);
            reject(err);
            return;
          }
          closeAsyncConnection(db);
          resolve(result);
        });
      } catch (err) {
        db.run('ROLLBACK');
        closeAsyncConnection(db);
        reject(err);
      }
    });
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
    console.error('Erro ao executar query síncrona:', err.message);
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
    console.error('Erro ao executar getOne síncrono:', err.message);
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
    console.error('Erro ao executar run síncrono:', err.message);
    throw err;
  }
}

/**
 * Executa múltiplas operações em uma transação síncrona
 * @param {Function} actions Função que define as operações
 * @returns {any} Resultado da transação
 */
function transactionSync(actions) {
  try {
    const db = getSyncConnection();
    const transaction = db.transaction(actions);
    const result = transaction();
    return result;
  } catch (err) {
    console.error('Erro na transação síncrona:', err.message);
    throw err;
  }
}

module.exports = {
  getAsyncConnection,
  getSyncConnection,
  closeAsyncConnection,
  closeSyncConnection,

  queryAsync,
  runAsync,
  getOneAsync,
  transactionAsync,

  querySync,
  getOneSync,
  runSync,
  transactionSync,

  getDbPath,
};
