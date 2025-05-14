const path = require('path');
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
 * Retorna uma instância de conexão better-sqlite3 (síncrona).
 * A instância é singleton.
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
    if (NODE_ENV !== 'production' && NODE_ENV !== 'test') {
      console.log(`Conexão síncrona com SQLite estabelecida: ${getDbPath()}`);
    }
    return syncDbInstance;
  } catch (err) {
    console.error(
      'Erro ao conectar ao banco de dados better-sqlite3:',
      err.message
    );
    syncDbInstance = null;
    throw err; // Relança o erro para que a aplicação possa tratá-lo
  }
}

/**
 * Fecha a conexão síncrona com o banco de dados better-sqlite3.
 */
function closeSyncConnection() {
  if (syncDbInstance && syncDbInstance.open) {
    try {
      syncDbInstance.close();
      if (NODE_ENV !== 'production' && NODE_ENV !== 'test') {
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
 * @param {Function} actions Função que recebe a conexão (implícita) e executa operações
 * @returns {Promise<any>} Resultado da transação
 */
function transactionAsync(actions) {
  return new Promise((resolve, reject) => {
    try {
      // A função 'actions' deve usar os métodos síncronos (runSync, querySync, etc.)
      // ou interagir diretamente com a instância 'db' obtida via getSyncConnection()
      // A função 'actions' agora receberá a instância 'db' como argumento.
      const db = getSyncConnection();
      const transaction = db.transaction(() => actions(db)); // Passa db para actions
      const result = transaction(); // Executa a transação
      resolve(result);
    } catch (err) {
      console.error('Erro na transação assíncrona (wrapper):', err.message);
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
    // better-sqlite3 espera parâmetros espalhados se for array, ou um objeto único
    const result = Array.isArray(params)
      ? stmt.all(...params)
      : stmt.all(params);
    return result;
  } catch (err) {
    console.error(
      'Erro ao executar query síncrona:',
      err.message,
      'SQL:',
      sql,
      'Params:',
      params
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
    console.error(
      'Erro ao executar getOne síncrono:',
      err.message,
      'SQL:',
      sql,
      'Params:',
      params
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
    console.error(
      'Erro ao executar run síncrono:',
      err.message,
      'SQL:',
      sql,
      'Params:',
      params
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
    const transaction = db.transaction(() => actions(db)); // Passa db para actions
    const result = transaction(); // Executa a transação
    return result;
  } catch (err) {
    console.error('Erro na transação síncrona:', err.message);
    throw err;
  }
}

module.exports = {
  getSyncConnection, // Exporta para quem precisar da instância direta
  closeSyncConnection,

  // Funções "assíncronas" (wrappers de Promise sobre síncrono)
  queryAsync,
  runAsync,
  getOneAsync,
  transactionAsync,

  // Funções síncronas
  querySync,
  getOneSync,
  runSync,
  transactionSync,

  getDbPath,
};
