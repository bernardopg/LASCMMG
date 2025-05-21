const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto'); // Added crypto import
const { runAsync, getOneAsync } = require('../db/database');
const { JWT_SECRET, JWT_EXPIRATION } = require('../config/config');
const { logger } = require('../logger/logger');
const auditLogger = require('../logger/auditLogger'); // Import auditLogger

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

async function authenticateAdmin(username, password, ipAddress, rememberMe = false) {
  // Added ipAddress and rememberMe
  if (!username || !password) {
    throw new Error('Nome de usuário e senha são obrigatórios');
  }

  try {
    const admin = await getAdminByUsername(username);

    if (!admin) {
      // Admin não encontrado no banco de dados, tentar fallback para arquivo
      if (!fs.existsSync(CREDENTIALS_FILE_PATH)) {
        logger.warn(
          {
            component: 'AdminModel',
            username,
            filePath: CREDENTIALS_FILE_PATH,
          },
          `Tentativa de login para ${username}: usuário não encontrado no DB e admin_credentials.json também não existe.`
        );
        throw new Error(
          'Credenciais de administrador não configuradas no sistema.'
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
          'Erro ao fazer parse do admin_credentials.json durante o login.'
        );
        throw new Error(
          'Erro ao processar arquivo de credenciais do administrador.'
        );
      }

      if (
        !fileCredentials ||
        !fileCredentials.username ||
        !fileCredentials.hashedPassword
      ) {
        logger.warn(
          { component: 'AdminModel', filePath: CREDENTIALS_FILE_PATH },
          'Arquivo admin_credentials.json encontrado, mas está incompleto ou malformado.'
        );
        throw new Error(
          'Arquivo de credenciais do administrador principal inválido.'
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
            reason: 'Admin not found in file credentials',
            ipAddress: ipAddress || 'unknown',
          } // Use ipAddress
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
          } // Use ipAddress
        );
        return { success: false, message: 'Credenciais inválidas.' };
      }

      const migrationResult = await migrateAdminCredentials();

      if (!migrationResult.success || !migrationResult.migrated) {
        const adminAfterAttemptedMigration = await getAdminByUsername(
          fileCredentials.username
        );
        if (!adminAfterAttemptedMigration) {
          logger.error(
            {
              component: 'AdminModel',
              migrationMessage: migrationResult.message,
            },
            'Falha crítica: Migração de credenciais do admin do arquivo para o DB falhou durante o login.'
          );
          throw new Error(
            `Erro ao configurar conta de administrador no banco de dados: ${migrationResult.message}. Verifique os logs do servidor.`
          );
        }
      }

      const finalAdminData = await getAdminByUsername(fileCredentials.username);
      if (!finalAdminData) {
        throw new Error(
          'Falha ao recuperar dados do administrador após a migração/verificação.'
        );
      }

      await updateLastLogin(finalAdminData.username);

      // Definir tempo de expiração do token baseado na opção "Lembrar-me"
      const expirationTime = rememberMe ? '30d' : JWT_EXPIRATION; // 30 dias se rememberMe for true

      const token = jwt.sign(
        { username: finalAdminData.username, role: finalAdminData.role },
        JWT_SECRET,
        { expiresIn: expirationTime, jwtid: crypto.randomUUID() } // Adicionado jti e expirationTime
      );

      auditLogger.logAction(
        finalAdminData.id.toString(),
        'ADMIN_LOGIN_SUCCESS',
        'admin',
        finalAdminData.id.toString(),
        {
          username: finalAdminData.username,
          ipAddress: ipAddress || 'unknown', // Use ipAddress
        }
      );

      return {
        success: true,
        message:
          'Login bem-sucedido! Conta de administrador configurada/verificada.',
        token,
        admin: {
          id: finalAdminData.id,
          username: finalAdminData.username,
          role: finalAdminData.role,
        },
      };
    } else {
      // Admin encontrado no banco de dados
      const isPasswordCorrect = await bcrypt.compare(
        password,
        admin.hashedPassword
      );

      if (!isPasswordCorrect) {
        auditLogger.logAction(
          admin.id.toString(),
          'ADMIN_LOGIN_FAILURE',
          'admin',
          admin.id.toString(),
          {
            username: admin.username,
            reason: 'Incorrect password (DB)',
            ipAddress: ipAddress || 'unknown',
          } // Use ipAddress
        );
        return { success: false, message: 'Credenciais inválidas.' };
      }

      await updateLastLogin(username);

      auditLogger.logAction(
        admin.id.toString(),
        'ADMIN_LOGIN_SUCCESS',
        'admin',
        admin.id.toString(),
        { username: admin.username, ipAddress: ipAddress || 'unknown' } // Use ipAddress
      );

      // Definir tempo de expiração do token baseado na opção "Lembrar-me"
      const expirationTime = rememberMe ? '30d' : JWT_EXPIRATION; // 30 dias se rememberMe for true

      const token = jwt.sign(
        { id: admin.id, username: admin.username, role: admin.role }, // Include ID
        JWT_SECRET,
        { expiresIn: expirationTime, jwtid: crypto.randomUUID() } // Atualizado para usar expirationTime
      );

      return {
        success: true,
        message: 'Login bem-sucedido!',
        token,
        admin: { id: admin.id, username: admin.username, role: admin.role },
      };
    }
  } catch (err) {
    logger.error(
      { component: 'AdminModel', err, username },
      'Erro durante o processo de autenticação.'
    );
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
  const sql = "SELECT id, username, name, role, last_login, created_at FROM users WHERE role = 'admin' OR role = 'super_admin' ORDER BY username ASC";
  try {
    // Assuming you have a getAllAsync function similar to getOneAsync and runAsync
    // If not, this needs to be implemented in database.js or use db.all directly.
    // For now, let's assume db.all can be used if getAllAsync is not present.
    const { db } = require('../db/database'); // Direct db import for db.all
    return new Promise((resolve, reject) => {
      db.all(sql, [], (err, rows) => {
        if (err) {
          logger.error(
            { component: 'AdminModel', err },
            'Erro ao buscar todos os administradores.'
          );
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  } catch (err) {
    logger.error(
      { component: 'AdminModel', err },
      'Erro ao buscar todos os administradores.'
    );
    throw err; // Re-throw to be caught by service/route layer
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
};
