/**
 * Sistema de Auditoria de Ações Administrativas
 *
 * Este módulo implementa uma trilha de auditoria completa para todas as ações
 * administrativas no sistema, permitindo rastrear quem fez o quê e quando.
 * Os registros são salvos de forma imutável e podem ser consultados posteriormente.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createWriteStream } = require('fs');
const { mkdir } = require('fs').promises;
const { logger } = require('./logger');

// Configurações
const AUDIT_DIR = process.env.AUDIT_DIR || path.join(__dirname, '../audit');
const AUDIT_FILE = path.join(AUDIT_DIR, 'audit_log.jsonl');
const AUDIT_INDEX_FILE = path.join(AUDIT_DIR, 'audit_index.json');
const AUDIT_HASH_CHAIN = path.join(AUDIT_DIR, 'hash_chain.json');
const NODE_ENV = process.env.NODE_ENV || 'development';

// Stream para escrita do log de auditoria
let auditStream;
// Índice para consultas rápidas
let auditIndex = { users: {}, actions: {}, entities: {} };
// Hash chain para verificação de integridade
let hashChain = { lastHash: '', entries: [] };

/**
 * Inicializa o sistema de auditoria
 */
async function initializeAudit() {
  try {
    // Criar diretório de auditoria se não existir
    await mkdir(AUDIT_DIR, { recursive: true });

    // Carregar índice se existir
    if (fs.existsSync(AUDIT_INDEX_FILE)) {
      try {
        auditIndex = JSON.parse(fs.readFileSync(AUDIT_INDEX_FILE, 'utf8'));
      } catch (error) {
        logger.error('AuditLogger', 'Erro ao carregar índice de auditoria', {
          error: error.message,
        });
        // Iniciar com índice novo se houver erro ao carregar
        auditIndex = { users: {}, actions: {}, entities: {} };
      }
    }

    // Carregar hash chain se existir
    if (fs.existsSync(AUDIT_HASH_CHAIN)) {
      try {
        hashChain = JSON.parse(fs.readFileSync(AUDIT_HASH_CHAIN, 'utf8'));
      } catch (error) {
        logger.error(
          'AuditLogger',
          'Erro ao carregar hash chain de auditoria',
          { error: error.message }
        );
        // Iniciar com hash chain novo se houver erro ao carregar
        hashChain = { lastHash: '', entries: [] };
      }
    }

    // Verificar integridade da hash chain se estiver em produção
    if (NODE_ENV === 'production' && hashChain.entries.length > 0) {
      const isIntegrityValid = await verifyAuditIntegrity();
      if (!isIntegrityValid) {
        logger.error(
          'AuditLogger',
          'Violação de integridade detectada no log de auditoria!'
        );
        // Em produção, pode-se querer notificar administradores ou tomar outras ações
      }
    }

    // Abrir stream para escrita em modo append
    auditStream = createWriteStream(AUDIT_FILE, { flags: 'a' });

    logger.info('AuditLogger', 'Sistema de auditoria inicializado com sucesso');
    return true;
  } catch (error) {
    logger.error('AuditLogger', 'Erro ao inicializar sistema de auditoria', {
      error: error.message,
      stack: error.stack,
    });
    return false;
  }
}

/**
 * Registra uma ação de auditoria
 * @param {string} userId - ID do usuário que realizou a ação
 * @param {string} action - Tipo de ação (create, update, delete, login, etc.)
 * @param {string} entity - Entidade afetada (torneio, jogador, etc.)
 * @param {string} entityId - ID da entidade afetada
 * @param {object} details - Detalhes adicionais da ação
 * @returns {string} ID único do registro de auditoria
 */
function logAction(userId, action, entity, entityId, details = {}) {
  // Se o sistema de auditoria não estiver inicializado, inicializar
  if (!auditStream) {
    // Tenta inicializar. Se falhar, a ação não será logada.
    // Idealmente, initializeAudit é chamado no bootstrap da aplicação.
    initializeAudit().catch((error) => {
      logger.error(
        'AuditLogger',
        'Falha ao inicializar sistema de auditoria preguiçosamente em logAction',
        { error: error.message, stack: error.stack }
      );
    });
    // Se auditStream ainda não estiver pronto após a tentativa (initializeAudit é async),
    // esta ação específica pode não ser logada.
    // Para garantir o log, a inicialização deve ser aguardada no bootstrap.
    if (!auditStream) {
      logger.warn(
        'AuditLogger',
        'Audit stream não disponível, ação não registrada.',
        { action, entity, entityId }
      );
      return null;
    }
  }

  const timestamp = new Date().toISOString();
  const auditId = crypto.randomUUID();

  // Criar registro de auditoria
  const auditEntry = {
    id: auditId,
    timestamp,
    userId,
    action,
    entity,
    entityId,
    details,
    ipAddress: details.ipAddress || 'unknown',
    userAgent: details.userAgent || 'unknown',
  };

  // Calcular hash do registro para a hash chain
  const entryString = JSON.stringify(auditEntry);
  const prevHash = hashChain.lastHash || '';
  const currentHash = calculateHash(entryString + prevHash);

  // Atualizar hash chain
  hashChain.lastHash = currentHash;
  hashChain.entries.push({
    id: auditId,
    hash: currentHash,
    timestamp,
  });

  // Escrever no arquivo de log
  auditStream.write(entryString + '\n');

  // Atualizar índice
  updateAuditIndex(auditEntry);

  // Periodicamente salvar índice e hash chain
  if (hashChain.entries.length % 100 === 0) {
    persistAuditMetadata();
  }

  logger.debug('AuditLogger', `Ação registrada: ${action} em ${entity}`, {
    auditId,
  });
  return auditId;
}

/**
 * Atualiza o índice de auditoria
 * @param {object} entry - Registro de auditoria
 */
function updateAuditIndex(entry) {
  const { userId, action, entity, entityId, id, timestamp } = entry;

  // Índice por usuário
  if (!auditIndex.users[userId]) {
    auditIndex.users[userId] = [];
  }
  auditIndex.users[userId].push({
    id,
    timestamp,
    action,
    entity,
    entityId,
  });

  // Índice por ação
  if (!auditIndex.actions[action]) {
    auditIndex.actions[action] = [];
  }
  auditIndex.actions[action].push({
    id,
    timestamp,
    userId,
    entity,
    entityId,
  });

  // Índice por entidade
  const entityKey = `${entity}:${entityId}`;
  if (!auditIndex.entities[entityKey]) {
    auditIndex.entities[entityKey] = [];
  }
  auditIndex.entities[entityKey].push({
    id,
    timestamp,
    userId,
    action,
  });
}

/**
 * Persiste o índice e a hash chain em disco
 */
function persistAuditMetadata() {
  try {
    fs.writeFileSync(AUDIT_INDEX_FILE, JSON.stringify(auditIndex, null, 2));
    fs.writeFileSync(AUDIT_HASH_CHAIN, JSON.stringify(hashChain, null, 2));
    logger.debug('AuditLogger', 'Metadados de auditoria persistidos');
  } catch (error) {
    logger.error('AuditLogger', 'Erro ao persistir metadados de auditoria', {
      error: error.message,
    });
  }
}

/**
 * Calcula o hash SHA-256 de uma string
 * @param {string} data - Dados para calcular o hash
 * @returns {string} Hash SHA-256 em hexadecimal
 */
function calculateHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Verifica a integridade do log de auditoria usando a hash chain
 * @returns {boolean} Verdadeiro se a integridade estiver intacta
 */
async function verifyAuditIntegrity() {
  try {
    // Ler arquivo de log
    const fileContent = await fs.promises.readFile(AUDIT_FILE, 'utf8');
    const lines = fileContent.trim().split('\n');

    if (lines.length !== hashChain.entries.length) {
      logger.warn(
        'AuditLogger',
        'Número de entradas no log não corresponde à hash chain',
        { logEntries: lines.length, hashChainEntries: hashChain.entries.length }
      );
      return false;
    }

    // Verificar cada entrada
    let prevHash = '';
    for (let i = 0; i < lines.length; i++) {
      const entry = JSON.parse(lines[i]);
      const entryString = lines[i];
      const expectedHash = hashChain.entries[i].hash;
      const calculatedHash = calculateHash(entryString + prevHash);

      if (calculatedHash !== expectedHash) {
        logger.warn('AuditLogger', `Violação de integridade na entrada ${i}`, {
          entryId: entry.id,
          expected: expectedHash,
          calculated: calculatedHash,
        });
        return false;
      }

      prevHash = calculatedHash;
    }

    return true;
  } catch (error) {
    logger.error(
      'AuditLogger',
      'Erro ao verificar integridade do log de auditoria',
      { error: error.message }
    );
    return false;
  }
}

/**
 * Consulta registros de auditoria com filtragem e paginação
 * @param {object} filters - Filtros a aplicar (userId, action, entity, entityId, startDate, endDate)
 * @param {object} pagination - Opções de paginação (page, pageSize)
 * @returns {object} Registros correspondentes aos filtros com informações de paginação
 */
async function queryAuditLog(
  filters = {},
  pagination = { page: 1, pageSize: 20 }
) {
  try {
    const { userId, action, entity, entityId, startDate, endDate } = filters;
    const { page, pageSize } = pagination;

    // Determinar a estratégia de consulta com base nos filtros
    let candidates = [];
    let usedIndex = false;

    // Usar índice quando possível
    if (userId && auditIndex.users[userId]) {
      candidates = auditIndex.users[userId];
      usedIndex = true;
    } else if (action && auditIndex.actions[action]) {
      candidates = auditIndex.actions[action];
      usedIndex = true;
    } else if (
      entity &&
      entityId &&
      auditIndex.entities[`${entity}:${entityId}`]
    ) {
      candidates = auditIndex.entities[`${entity}:${entityId}`];
      usedIndex = true;
    }

    // Se não foi possível usar índice ou temos mais filtros, ler o arquivo
    if (!usedIndex || startDate || endDate) {
      const fileContent = await fs.promises.readFile(AUDIT_FILE, 'utf8');
      candidates = fileContent
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line));
    }

    // Aplicar filtros adicionais
    let filteredResults = candidates.filter((entry) => {
      let matches = true;

      if (userId && entry.userId !== userId) matches = false;
      if (action && entry.action !== action) matches = false;
      if (entity && entry.entity !== entity) matches = false;
      if (entityId && entry.entityId !== entityId) matches = false;

      if (startDate) {
        const entryDate = new Date(entry.timestamp);
        const filterDate = new Date(startDate);
        if (entryDate < filterDate) matches = false;
      }

      if (endDate) {
        const entryDate = new Date(entry.timestamp);
        const filterDate = new Date(endDate);
        if (entryDate > filterDate) matches = false;
      }

      return matches;
    });

    // Ordenar por timestamp (mais recente primeiro)
    filteredResults.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    // Aplicar paginação
    const startIndex = (page - 1) * pageSize;
    const paginatedResults = filteredResults.slice(
      startIndex,
      startIndex + pageSize
    );

    return {
      data: paginatedResults,
      pagination: {
        page,
        pageSize,
        totalItems: filteredResults.length,
        totalPages: Math.ceil(filteredResults.length / pageSize),
      },
    };
  } catch (error) {
    logger.error('AuditLogger', 'Erro ao consultar log de auditoria', {
      error: error.message,
    });
    throw new Error('Erro ao consultar log de auditoria: ' + error.message);
  }
}

/**
 * Middleware para registrar ações automaticamente
 * @param {string} action - Tipo de ação a ser registrada
 * @param {Function} entityResolver - Função que extrai a entidade e entityId da requisição
 * @returns {Function} Middleware Express
 */
function auditMiddleware(action, entityResolver) {
  return (req, res, next) => {
    // Executar o middleware e seguir o fluxo
    next();

    // Após a resposta, registrar a ação
    res.on('finish', () => {
      try {
        // Extrair informações sobre a entidade
        const { entity, entityId } = entityResolver(req);

        // Extrair informações do usuário da requisição
        const userId = req.user ? req.user.id : 'anonymous';

        // Coletar detalhes adicionais
        const details = {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          body:
            req.method !== 'GET' ? sanitizeRequestBody(req.body) : undefined,
        };

        // Registrar a ação no log de auditoria
        logAction(userId, action, entity, entityId, details);
      } catch (error) {
        logger.error('AuditMiddleware', 'Erro ao registrar ação de auditoria', {
          error: error.message,
          stack: error.stack,
          route: req.originalUrl,
        });
      }
    });
  };
}

/**
 * Sanitiza o corpo da requisição para evitar armazenar dados sensíveis
 * @param {object} body - Corpo da requisição
 * @returns {object} Corpo sanitizado
 */
function sanitizeRequestBody(body) {
  // Clone para não modificar o original
  const sanitized = JSON.parse(JSON.stringify(body || {}));

  // Lista de campos sensíveis para remover
  const sensitiveFields = [
    'password',
    'senha',
    'token',
    'secret',
    'credit_card',
    'creditCard',
  ];

  // Função recursiva para sanitizar objetos aninhados
  function sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;

    Object.keys(obj).forEach((key) => {
      if (sensitiveFields.includes(key.toLowerCase())) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        sanitizeObject(obj[key]);
      }
    });

    return obj;
  }

  return sanitizeObject(sanitized);
}

/**
 * Finaliza o sistema de auditoria
 */
function closeAudit() {
  if (auditStream) {
    auditStream.end();
  }

  // Persistir metadados antes de fechar
  persistAuditMetadata();

  logger.info('AuditLogger', 'Sistema de auditoria finalizado');
}

// API do módulo
module.exports = {
  initialize: initializeAudit,
  logAction,
  queryAuditLog,
  verifyIntegrity: verifyAuditIntegrity,
  middleware: auditMiddleware,
  close: closeAudit,
};
