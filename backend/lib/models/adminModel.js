const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto'); // Added crypto import
const { runAsync, getOneAsync, queryAsync } = require('../db/database');
const { JWT_SECRET, JWT_EXPIRATION } = require('../config/config');
const { logger } = require('../logger/logger');
const auditLogger = require('../logger/auditLogger'); // Import auditLogger
const { getClient } = require('../db/redisClient'); // Import Redis client

const CREDENTIALS_FILE_PATH = path.join(
  __dirname, // backend/lib/models
  '..', // backend/lib
  '..', // backend
  '..', // lascmmg (raiz do projeto)
  'admin_credentials.json'
);

async function adminExists(username) {
  if (!username) {
    throw new Error('Nome de usuário não fornecido');
  }

  const sql = "SELECT 1 FROM users WHERE username = ? AND role = 'admin'";

  try {
    const result = await getOneAsync(sql, [username]);
    return !!result;
  } catch (err) {
    logger.error(
      { component: 'AdminModel', err, username },
      `Erro ao verificar existência do admin ${username}.`
    );
    throw err;
  }
}

async function getAdminByUsername(username) {
  if (!username) {
    throw new Error('Nome de usuário não fornecido');
  }

  const sql =
    'SELECT id, username, hashedPassword, role FROM users WHERE username = ?';

  try {
    return await getOneAsync(sql, [username]);
  } catch (err) {
    logger.error(
      { component: 'AdminModel', err, username },
      `Erro ao buscar admin ${username}.`
    );
    throw err;
  }
}

async function getAdminById(id) {
  if (!id) {
    throw new Error('ID de usuário não fornecido');
  }

  const sql =
    'SELECT id, username, hashedPassword, role FROM users WHERE id = ?';

  try {
    return await getOneAsync(sql, [id]);
  } catch (err) {
    logger.error(
      { component: 'AdminModel', err, userId: id },
      `Erro ao buscar admin por ID ${id}.`
    );
    throw err;
  }
}

async function createAdmin(admin) {
  if (!admin || !admin.username || !admin.password) {
    throw new Error('Dados do administrador incompletos');
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(admin.password, saltRounds);

  const sql = `
    INSERT INTO users (username, hashedPassword, role)
    VALUES (?, ?, 'admin')
  `;

  try {
    const result = await runAsync(sql, [admin.username, hashedPassword]);
    const newAdmin = {
      id: result.lastInsertRowid, // Corrected from lastID to lastInsertRowid
      username: admin.username,
      role: 'admin',
    };
    auditLogger.logAction(
      newAdmin.id.toString(),
      'ADMIN_CREATE',
      'admin',
      newAdmin.id.toString(),
      { username: newAdmin.username, ipAddress: admin.ipAddress || 'unknown' } // Assuming IP is passed
    );
    return newAdmin;
  } catch (err) {
    logger.error(
      { component: 'AdminModel', err, username: admin.username },
      'Erro ao criar administrador.'
    );
    throw err;
  }
}

async function updateLastLogin(username) {
  if (!username) {
    throw new Error('Nome de usuário não fornecido');
  }

  const sql =
    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE username = ?';

  try {
    const result = await runAsync(sql, [username]);
    return result.changes > 0;
  } catch (err) {
    logger.error(
      { component: 'AdminModel', err, username },
      `Erro ao atualizar último login de ${username}.`
    );
    throw err;
  }
}

async function migrateAdminCredentials() {
  try {
    if (!fs.existsSync(CREDENTIALS_FILE_PATH)) {
      logger.info(
        { component: 'AdminModel', filePath: CREDENTIALS_FILE_PATH },
        'Arquivo admin_credentials.json não encontrado. Nenhum administrador será migrado a partir dele.'
      );
      return {
        success: true,
        migrated: false,
        message: 'Arquivo de credenciais não encontrado, nada a migrar.',
      };
    }

    let fileCredentials;
    try {
      fileCredentials = JSON.parse(
        fs.readFileSync(CREDENTIALS_FILE_PATH, 'utf8')
      );
    } catch (parseError) {
      logger.error(
        {
          component: 'AdminModel',
          err: parseError,
          filePath: CREDENTIALS_FILE_PATH,
        },
        'Erro ao fazer parse do arquivo admin_credentials.json.'
      );
      return {
        success: false,
        migrated: false,
        message: 'Erro ao ler o arquivo de credenciais (JSON inválido).',
      };
    }

    if (
      !fileCredentials ||
      !fileCredentials.username ||
      !fileCredentials.hashedPassword
    ) {
      logger.warn(
        { component: 'AdminModel', filePath: CREDENTIALS_FILE_PATH },
        'Arquivo admin_credentials.json está incompleto ou malformado (username ou hashedPassword ausente).'
      );
      return {
        success: false,
        migrated: false,
        message: 'Arquivo de credenciais incompleto ou malformado.',
      };
    }

    const checkUserSql =
      'SELECT COUNT(*) as count FROM users WHERE username = ?';
    const result = await getOneAsync(checkUserSql, [fileCredentials.username]);

    if (result && result.count > 0) {
      logger.info(
        { component: 'AdminModel', username: fileCredentials.username },
        'Administrador já existe no banco de dados, pulando migração.'
      );
      return {
        success: true,
        migrated: false,
        message: 'Administrador já existe no banco.',
      };
    }

    const insertSql = `
      INSERT INTO users (username, hashedPassword, role)
      VALUES (?, ?, 'admin')
    `;

    await runAsync(insertSql, [
      fileCredentials.username,
      fileCredentials.hashedPassword,
    ]);

    logger.info(
      { component: 'AdminModel', username: fileCredentials.username },
      `Administrador ${fileCredentials.username} migrado com sucesso para o banco de dados.`
    );
    // Add recommendation to delete admin_credentials.json after successful migration
    logger.warn(
      { component: 'AdminModel', filePath: CREDENTIALS_FILE_PATH },
      'RECOMENDAÇÃO DE SEGURANÇA: O arquivo admin_credentials.json foi migrado para o banco de dados. Considere remover ou proteger este arquivo.'
    );
    return {
      success: true,
      migrated: true,
      message: 'Credenciais migradas com sucesso.',
      username: fileCredentials.username,
    };
  } catch (err) {
    logger.error(
      { component: 'AdminModel', err },
      'Erro ao migrar credenciais (operação de banco de dados).'
    );
    return {
      success: false,
      migrated: false,
      message: `Erro no banco de dados durante a migração: ${err.message}`,
    };
  }
}

// Helper function for file-based admin authentication and migration
async function _handleFileBasedAdminAuthAndMigration(username, password, ipAddress, rememberMe) {
  if (!fs.existsSync(CREDENTIALS_FILE_PATH)) {
    logger.warn(
      {
        component: 'AdminModel',
        username,
        filePath: CREDENTIALS_FILE_PATH,
      },
      `File-based auth: User ${username} not in DB and admin_credentials.json not found.`
    );
    // Consistent with DB not found, throw error to indicate no admin config.
    // Or, return a specific failure if this path is considered a "soft" failure.
    // For now, throwing to indicate system misconfiguration if file is expected.
    throw new Error(
      'Credenciais de administrador não configuradas no sistema (arquivo ausente).'
    );
  }

  let fileCredentials;
  try {
    fileCredentials = JSON.parse(
      fs.readFileSync(CREDENTIALS_FILE_PATH, 'utf8')
    );
  } catch (parseError) {
    logger.error(
      {
        component: 'AdminModel',
        err: parseError,
        filePath: CREDENTIALS_FILE_PATH,
      },
      'File-based auth: Error parsing admin_credentials.json.'
    );
    throw new Error(
      'Erro ao processar arquivo de credenciais do administrador (JSON inválido).'
    );
  }

  if (
    !fileCredentials ||
    !fileCredentials.username ||
    !fileCredentials.hashedPassword
  ) {
    logger.warn(
      { component: 'AdminModel', filePath: CREDENTIALS_FILE_PATH },
      'File-based auth: admin_credentials.json is incomplete or malformed.'
    );
    throw new Error(
      'Arquivo de credenciais do administrador principal inválido (incompleto/malformado).'
    );
  }

  if (username !== fileCredentials.username) {
    auditLogger.logAction(
      username,
      'ADMIN_LOGIN_FAILURE',
      'admin',
      username,
      {
        username,
        reason: 'Admin username mismatch (file credentials)',
        ipAddress: ipAddress || 'unknown',
      }
    );
    return { success: false, message: 'Credenciais inválidas.' };
  }

  const isPasswordCorrect = await bcrypt.compare(
    password,
    fileCredentials.hashedPassword
  );

  if (!isPasswordCorrect) {
    auditLogger.logAction(
      username,
      'ADMIN_LOGIN_FAILURE',
      'admin',
      username,
      {
        username,
        reason: 'Incorrect password (file credentials)',
        ipAddress: ipAddress || 'unknown',
      }
    );
    return { success: false, message: 'Credenciais inválidas.' };
  }

  // If password is correct, attempt migration.
  // migrateAdminCredentials already checks if user exists in DB before inserting.
  const migrationResult = await migrateAdminCredentials();

  // Even if migration had an issue (e.g. user already existed),
  // we need to fetch the admin from DB to get their ID for the token.
  const finalAdminData = await getAdminByUsername(fileCredentials.username);
  if (!finalAdminData) {
    // This is a critical failure: password matched file, migration attempted, but user still not in DB.
    logger.error(
      {
        component: 'AdminModel',
        username: fileCredentials.username,
        migrationMessage: migrationResult.message,
      },
      'File-based auth: CRITICAL - Admin data not found in DB after successful file auth and migration attempt.'
    );
    throw new Error(
      `Falha ao carregar dados do administrador ${fileCredentials.username} do banco após autenticação por arquivo. Verifique os logs.`
    );
  }

  await updateLastLogin(finalAdminData.username);

  const expirationTime = rememberMe ? '30d' : JWT_EXPIRATION;
  const token = jwt.sign(
    // Use finalAdminData.id which comes from the DB
    { id: finalAdminData.id, username: finalAdminData.username, role: finalAdminData.role },
    JWT_SECRET,
    { expiresIn: expirationTime, jwtid: crypto.randomUUID() }
  );

  auditLogger.logAction(
    finalAdminData.id.toString(),
    'ADMIN_LOGIN_SUCCESS',
    'admin',
    finalAdminData.id.toString(),
    {
      username: finalAdminData.username,
      authMethod: 'file_credentials_migrated',
      ipAddress: ipAddress || 'unknown',
    }
  );

  // Calculate expiresIn for client
  const expiresInSeconds = expirationTime.endsWith('d')
    ? parseInt(expirationTime) * 24 * 60 * 60
    : expirationTime.endsWith('h')
      ? parseInt(expirationTime) * 60 * 60
      : parseInt(expirationTime);


  return {
    success: true,
    message: migrationResult.migrated
      ? 'Login bem-sucedido! Conta de administrador migrada do arquivo para o banco.'
      : 'Login bem-sucedido! (Conta de administrador já existia no banco).',
    token,
    refreshToken: rememberMe ? await generateRefreshToken(finalAdminData.id) : null,
    expiresIn: expiresInSeconds,
    admin: {
      id: finalAdminData.id,
      username: finalAdminData.username,
      role: finalAdminData.role,
    },
  };
}

async function authenticateAdmin(username, password, ipAddress, rememberMe = false) {
  if (!username || !password) {
    throw new Error('Nome de usuário e senha são obrigatórios.');
  }

  try {
    const adminFromDb = await getAdminByUsername(username);

    if (adminFromDb) {
      // Admin found in the database, proceed with DB authentication
      const isPasswordCorrect = await bcrypt.compare(
        password,
        adminFromDb.hashedPassword
      );

      if (!isPasswordCorrect) {
        auditLogger.logAction(
          adminFromDb.id.toString(),
          'ADMIN_LOGIN_FAILURE',
          'admin',
          adminFromDb.id.toString(),
          {
            username: adminFromDb.username,
            reason: 'Incorrect password (DB)',
            ipAddress: ipAddress || 'unknown',
          }
        );
        return { success: false, message: 'Credenciais inválidas.' };
      }

      await updateLastLogin(username);

      auditLogger.logAction(
        adminFromDb.id.toString(),
        'ADMIN_LOGIN_SUCCESS',
        'admin',
        adminFromDb.id.toString(),
        { username: adminFromDb.username, authMethod: 'database', ipAddress: ipAddress || 'unknown' }
      );

      const expirationTime = rememberMe ? '30d' : JWT_EXPIRATION;
      const token = jwt.sign(
        { id: adminFromDb.id, username: adminFromDb.username, role: adminFromDb.role },
        JWT_SECRET,
        { expiresIn: expirationTime, jwtid: crypto.randomUUID() }
      );

      let refreshToken = null;
      if (rememberMe) {
        try {
          refreshToken = await generateRefreshToken(adminFromDb.id);
        } catch (refreshError) {
          logger.error(
            { component: 'AdminModel', err: refreshError, username },
            'Erro ao gerar refresh token para admin do DB, prosseguindo sem ele.'
          );
        }
      }

      const expiresInSeconds = expirationTime.endsWith('d')
        ? parseInt(expirationTime) * 24 * 60 * 60
        : expirationTime.endsWith('h')
          ? parseInt(expirationTime) * 60 * 60
          : parseInt(expirationTime);

      return {
        success: true,
        message: 'Login bem-sucedido!',
        token,
        refreshToken,
        expiresIn: expiresInSeconds,
        admin: { id: adminFromDb.id, username: adminFromDb.username, role: adminFromDb.role },
      };
    } else {
      // Admin not found in DB, try file-based authentication and migration
      return await _handleFileBasedAdminAuthAndMigration(username, password, ipAddress, rememberMe);
    }
  } catch (err) {
    // Catch errors from _handleFileBasedAdminAuthAndMigration or other unexpected errors
    logger.error(
      { component: 'AdminModel', err, username },
      `Erro durante o processo de autenticação do admin ${username}.`
    );
    // Re-throw or return a generic error response
    // To keep existing behavior of throwing, we re-throw.
    // If specific error messages from _handleFileBasedAdminAuthAndMigration should reach client,
    // then those functions should return objects like { success: false, message: ... }
    // and this catch block might return a more generic error.
    // For now, re-throwing to align with original behavior for unhandled cases.
    throw err;
  }
}

async function changePassword(
  username,
  currentPassword,
  newPassword,
  ipAddress
) {
  // Added ipAddress
  if (!username || !currentPassword || !newPassword) {
    throw new Error('Dados incompletos para alteração de senha');
  }

  try {
    // Não usar authenticateAdmin aqui para evitar recursão ou efeitos colaterais de migração
    const admin = await getAdminByUsername(username);
    if (!admin) {
      return {
        success: false,
        message: 'Usuário administrador não encontrado.',
      };
    }

    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      admin.hashedPassword
    );
    if (!isPasswordCorrect) {
      return { success: false, message: 'Senha atual incorreta' };
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    const sql = 'UPDATE users SET hashedPassword = ? WHERE username = ?';
    await runAsync(sql, [hashedPassword, username]);

    auditLogger.logAction(
      admin.id.toString(),
      'ADMIN_PASSWORD_CHANGE',
      'admin',
      admin.id.toString(),
      {
        username: admin.username,
        ipAddress: ipAddress || 'unknown', // Use ipAddress
      }
    );

    logger.info(
      { component: 'AdminModel', username },
      `Senha alterada com sucesso para o usuário ${username}.`
    );
    return { success: true, message: 'Senha alterada com sucesso' };
  } catch (err) {
    logger.error(
      { component: 'AdminModel', err, username },
      `Erro ao alterar senha para ${username}.`
    );
    throw err;
  }
}

async function getAllAdmins() {
  // This function will list users who have an admin-like role.
  // Adjust role names ('admin', 'super_admin') as per your system's roles.
  const sql = "SELECT id, username, role, last_login, created_at FROM users WHERE role = 'admin' OR role = 'super_admin' ORDER BY username ASC";
  try {
    // Usando queryAsync importado no topo do arquivo
    return await queryAsync(sql, []);
  } catch (err) {
    logger.error(
      { component: 'AdminModel', err },
      'Erro ao buscar todos os administradores.'
    );
    throw err; // Re-throw to be caught by service/route layer
  }
}

// Gerar um refresh token para um usuário
async function generateRefreshToken(userId) {
  const redis = await getClient();
  if (!redis) {
    logger.error('AdminModel', 'Cliente Redis não disponível para gerar refresh token.');
    throw new Error('Serviço de refresh token indisponível');
  }

  try {
    const refreshTokenString = crypto.randomBytes(40).toString('hex');
    const refreshTokenTTL = 30 * 24 * 60 * 60; // 30 dias em segundos
    const tokenRedisKey = `refresh:${refreshTokenString}`;
    const userTokensRedisKey = `user:${userId}:refreshTokens`;

    // Armazenar o token principal com seus detalhes e TTL
    await redis.set(tokenRedisKey, JSON.stringify({
      userId: userId,
      createdAt: Date.now()
    }), { EX: refreshTokenTTL });

    // Adicionar o token ao Set do usuário
    await redis.sAdd(userTokensRedisKey, refreshTokenString);
    // Opcionalmente, definir um TTL para o Set do usuário para limpeza automática
    // await redis.expire(userTokensRedisKey, refreshTokenTTL + (24 * 60 * 60)); // Ex: TTL do set um dia a mais que o token

    return refreshTokenString;
  } catch (err) {
    logger.error(
      { component: 'AdminModel', err, userId },
      'Erro ao gerar refresh token.'
    );
    throw err;
  }
}

// Validar um refresh token
async function validateRefreshToken(refreshTokenString) {
  const redis = await getClient();
  if (!redis) {
    logger.error('AdminModel', 'Cliente Redis não disponível para validar refresh token.');
    return { success: false, message: 'Serviço indisponível.' };
  }

  const tokenRedisKey = `refresh:${refreshTokenString}`;

  try {
    const tokenDataString = await redis.get(tokenRedisKey);

    if (!tokenDataString) {
      return { success: false, message: 'Refresh token não encontrado ou expirado.' };
    }

    const { userId, createdAt } = JSON.parse(tokenDataString);
    const userTokensRedisKey = `user:${userId}:refreshTokens`;

    // Verificar se o token ainda está no Set do usuário (proteção contra alguns cenários de race condition pós-revogação)
    // Embora a remoção do token principal seja a principal forma de invalidação.
    const isTokenInUserSet = await redis.sIsMember(userTokensRedisKey, refreshTokenString);
    if (!isTokenInUserSet) {
        // Token foi removido do set do usuário (provavelmente por revokeAll), mas o token principal ainda não expirou.
        // Considerar inválido e limpar o token principal.
        await redis.del(tokenRedisKey);
        return { success: false, message: 'Refresh token revogado.' };
    }

    // Opcional: Verificar idade do token além do TTL do Redis, se necessário para lógica de negócios específica.
    // const tokenAge = Date.now() - createdAt;
    // const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias em ms
    // if (tokenAge > maxAge) {
    //   await redis.del(tokenRedisKey);
    //   await redis.sRem(userTokensRedisKey, refreshTokenString);
    //   return { success: false, message: 'Refresh token muito antigo.' };
    // }

    const admin = await getAdminById(userId);
    if (!admin) {
      await redis.del(tokenRedisKey);
      await redis.sRem(userTokensRedisKey, refreshTokenString);
      return { success: false, message: 'Usuário associado ao token não encontrado.' };
    }

    // Implementação de uso único: remover o token após validação bem-sucedida.
    await redis.del(tokenRedisKey);
    await redis.sRem(userTokensRedisKey, refreshTokenString);

    return {
      success: true,
      userId: admin.id,
      username: admin.username,
      role: admin.role
    };

  } catch (err) {
    logger.error(
      { component: 'AdminModel', err, refreshTokenString },
      'Erro ao validar refresh token.'
    );
    return { success: false, message: 'Erro interno ao validar refresh token.' };
  }
}

// Revogar todos os refresh tokens de um usuário (útil para logout em todos os dispositivos)
async function revokeAllRefreshTokens(userId) {
  const redis = await getClient();
  if (!redis) {
    logger.error('AdminModel', 'Cliente Redis não disponível para revogar refresh tokens.');
    return false;
  }

  const userTokensRedisKey = `user:${userId}:refreshTokens`;

  try {
    const tokenStrings = await redis.sMembers(userTokensRedisKey);
    if (tokenStrings && tokenStrings.length > 0) {
      const multi = redis.multi();
      tokenStrings.forEach(tokenString => {
        multi.del(`refresh:${tokenString}`);
      });
      multi.del(userTokensRedisKey); // Remove o Set do usuário
      await multi.exec();
      logger.info({ component: 'AdminModel', userId, count: tokenStrings.length }, `Todos os ${tokenStrings.length} refresh tokens para o usuário ${userId} foram revogados.`);
    } else {
      logger.info({ component: 'AdminModel', userId }, `Nenhum refresh token ativo encontrado para o usuário ${userId} para revogar.`);
    }
    return true;
  } catch (err) {
    logger.error(
      { component: 'AdminModel', err, userId },
      'Erro ao revogar todos os refresh tokens.'
    );
    return false;
  }
}

module.exports = {
  adminExists,
  getAdminByUsername,
  createAdmin,
  updateLastLogin,
  migrateAdminCredentials,
  authenticateAdmin,
  changePassword,
  getAllAdmins,
  generateRefreshToken,
  validateRefreshToken,
  revokeAllRefreshTokens,
  getAdminById,
};
