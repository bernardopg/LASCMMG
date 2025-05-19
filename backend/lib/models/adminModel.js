const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto'); // Added crypto import
const { runAsync, getOneAsync } = require('../db/database');
const { JWT_SECRET, JWT_EXPIRATION } = require('../config/config');
const { logger } = require('../logger/logger');

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
      'AdminModel',
      `Erro ao verificar existência do admin ${username}: ${err.message}`,
      { error: err }
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
      'AdminModel',
      `Erro ao buscar admin ${username}: ${err.message}`,
      { error: err }
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

    return {
      id: result.lastID,
      username: admin.username,
      role: 'admin',
    };
  } catch (err) {
    logger.error('AdminModel', `Erro ao criar administrador: ${err.message}`, {
      error: err,
    });
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
      'AdminModel',
      `Erro ao atualizar último login de ${username}: ${err.message}`,
      { error: err }
    );
    throw err;
  }
}

async function migrateAdminCredentials() {
  try {
    if (!fs.existsSync(CREDENTIALS_FILE_PATH)) {
      logger.info(
        'AdminModel',
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
        'AdminModel',
        'Erro ao fazer parse do arquivo admin_credentials.json:',
        { error: parseError }
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
        'AdminModel',
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
        'AdminModel',
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
      'AdminModel',
      `Administrador ${fileCredentials.username} migrado com sucesso para o banco de dados.`
    );
    return {
      success: true,
      migrated: true,
      message: 'Credenciais migradas com sucesso.',
      username: fileCredentials.username,
    };
  } catch (err) {
    logger.error(
      'AdminModel',
      'Erro ao migrar credenciais (operação de banco de dados):',
      { error: err }
    );
    return {
      success: false,
      migrated: false,
      message: `Erro no banco de dados durante a migração: ${err.message}`,
    };
  }
}

async function authenticateAdmin(username, password) {
  if (!username || !password) {
    throw new Error('Nome de usuário e senha são obrigatórios');
  }

  try {
    const admin = await getAdminByUsername(username);

    if (!admin) {
      // Admin não encontrado no banco de dados, tentar fallback para arquivo
      if (!fs.existsSync(CREDENTIALS_FILE_PATH)) {
        logger.warn(
          'AdminModel',
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
          'AdminModel',
          'Erro ao fazer parse do admin_credentials.json durante o login:',
          { error: parseError }
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
          'AdminModel',
          'Arquivo admin_credentials.json encontrado, mas está incompleto ou malformado.'
        );
        throw new Error(
          'Arquivo de credenciais do administrador principal inválido.'
        );
      }

      if (username !== fileCredentials.username) {
        return { success: false, message: 'Credenciais inválidas.' };
      }

      const isPasswordCorrect = await bcrypt.compare(
        password,
        fileCredentials.hashedPassword
      );

      if (!isPasswordCorrect) {
        return { success: false, message: 'Credenciais inválidas.' };
      }

      const migrationResult = await migrateAdminCredentials();

      if (!migrationResult.success || !migrationResult.migrated) {
        const adminAfterAttemptedMigration = await getAdminByUsername(
          fileCredentials.username
        );
        if (!adminAfterAttemptedMigration) {
          logger.error(
            'AdminModel',
            'Falha crítica: Migração de credenciais do admin do arquivo para o DB falhou durante o login.',
            { migrationMessage: migrationResult.message }
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

      const token = jwt.sign(
        { username: finalAdminData.username, role: finalAdminData.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION, jwtid: crypto.randomUUID() } // Adicionado jti
      );

      return {
        success: true,
        message:
          'Login bem-sucedido! Conta de administrador configurada/verificada.',
        token,
        admin: { username: finalAdminData.username, role: finalAdminData.role },
      };
    } else {
      // Admin encontrado no banco de dados
      const isPasswordCorrect = await bcrypt.compare(
        password,
        admin.hashedPassword
      );

      if (!isPasswordCorrect) {
        return { success: false, message: 'Credenciais inválidas.' };
      }

      await updateLastLogin(username);

      const token = jwt.sign(
        { username: admin.username, role: admin.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION, jwtid: crypto.randomUUID() } // Adicionado jti
      );

      return {
        success: true,
        message: 'Login bem-sucedido!',
        token,
        admin: { username: admin.username, role: admin.role },
      };
    }
  } catch (err) {
    logger.error('AdminModel', 'Erro durante o processo de autenticação:', {
      error: err,
      username,
    });
    throw err;
  }
}

async function changePassword(username, currentPassword, newPassword) {
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

    logger.info(
      'AdminModel',
      `Senha alterada com sucesso para o usuário ${username}.`
    );
    return { success: true, message: 'Senha alterada com sucesso' };
  } catch (err) {
    logger.error(
      'AdminModel',
      `Erro ao alterar senha para ${username}: ${err.message}`,
      { error: err }
    );
    throw err;
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
};
